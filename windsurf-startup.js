#!/usr/bin/env node

/**
 * Windsurf Startup Hook
 * 
 * Auto-deployed to WEE projects to handle Windsurf IDE startup:
 * - Checks if CASCADE bridge is live
 * - Checks that agents are connected to the bridge
 * - Connects this Windsurf instance to the bridge
 * - Surfaces agents in CASCADE chat with project context
 */

const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class WindsurfStartupHook {
  constructor() {
    this.projectPath = process.cwd();
    this.instanceId = this.generateInstanceId();
    this.config = null;
    this.ws = null;
    this.logPath = path.join(process.env.HOME, '.wee', 'logs', 'windsurf-startup.log');
  }

  async initialize() {
    try {
      await this.loadConfig();
      await this.log('info', `Windsurf startup hook initializing for project: ${this.projectPath}`);
      
      // a) Check if bridge is live
      const bridgeStatus = await this.checkBridgeStatus();
      this.log('info', `Bridge status: ${bridgeStatus ? 'live' : 'down'}`);
      
      // b) Start bridge if needed
      if (!bridgeStatus) {
        await this.startBridge();
        // Wait a moment for bridge to start
        await this.sleep(3000);
      }
      
      // c) Connect this instance to bridge
      await this.connectToBridge();
      
      // d) Initialize agents for this project
      await this.initializeAgentsForProject();
      
      this.log('info', 'Windsurf startup hook completed successfully');
      
    } catch (error) {
      this.log('error', `Startup hook failed: ${error.message}`);
      throw error;
    }
  }

  async loadConfig() {
    // Load global config
    const globalConfigPath = path.join(process.env.HOME, '.wee', 'config', 'cascade-global.json');
    
    try {
      const globalConfigData = await fs.readFile(globalConfigPath, 'utf8');
      this.config = JSON.parse(globalConfigData);
    } catch (error) {
      // Use defaults
      this.config = {
        bridge: {
          port: 7890,
          maxInstances: 3,
          heartbeatInterval: 30000
        }
      };
    }
    
    // Load project-specific overrides
    const projectConfigPath = path.join(this.projectPath, '.wee', 'cascade.json');
    
    try {
      const projectConfigData = await fs.readFile(projectConfigPath, 'utf8');
      const projectConfig = JSON.parse(projectConfigData);
      
      // Merge project config over global config
      this.config = this.mergeConfig(this.config, projectConfig);
      this.log('info', 'Loaded project-specific CASCADE configuration');
    } catch (error) {
      this.log('debug', 'No project-specific CASCADE configuration found, using global defaults');
    }
  }

  mergeConfig(global, project) {
    const merged = JSON.parse(JSON.stringify(global));
    
    for (const [key, value] of Object.entries(project)) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        merged[key] = { ...merged[key], ...value };
      } else {
        merged[key] = value;
      }
    }
    
    return merged;
  }

  async checkBridgeStatus() {
    try {
      const response = await fetch(`http://localhost:${this.config.bridge.port}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async startBridge() {
    this.log('info', 'Starting CASCADE bridge via lifecycle manager...');
    
    const lifecycleManager = path.join(process.env.HOME, '.wee', 'services', 'cascade-lifecycle-manager.js');
    
    return new Promise((resolve, reject) => {
      const process = spawn('node', [lifecycleManager, 'register', this.instanceId, this.projectPath], {
        stdio: 'pipe'
      });
      
      process.on('exit', (code) => {
        if (code === 0) {
          this.log('info', 'Bridge startup initiated successfully');
          resolve();
        } else {
          reject(new Error(`Bridge startup failed with code ${code}`));
        }
      });
      
      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  async connectToBridge() {
    this.log('info', 'Connecting to CASCADE bridge...');
    
    return new Promise((resolve, reject) => {
      const wsUrl = `ws://localhost:${this.config.bridge.port}`;
      this.ws = new WebSocket(wsUrl);
      
      this.ws.on('open', async () => {
        this.log('info', 'Connected to CASCADE bridge');
        
        // Register this instance
        await this.registerInstance();
        resolve();
      });
      
      this.ws.on('message', (data) => {
        this.handleBridgeMessage(JSON.parse(data.toString()));
      });
      
      this.ws.on('error', (error) => {
        this.log('error', `WebSocket error: ${error.message}`);
        reject(error);
      });
      
      this.ws.on('close', () => {
        this.log('info', 'Disconnected from CASCADE bridge');
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.ws.readyState !== WebSocket.OPEN) {
          reject(new Error('Bridge connection timeout'));
        }
      }, 10000);
    });
  }

  async registerInstance() {
    const projectContext = await this.gatherProjectContext();
    
    const registrationMessage = {
      type: 'register',
      instanceId: this.instanceId,
      projectPath: this.projectPath,
      context: projectContext,
      timestamp: Date.now()
    };
    
    this.ws.send(JSON.stringify(registrationMessage));
    this.log('info', `Registered instance ${this.instanceId} with bridge`);
  }

  async gatherProjectContext() {
    const context = {
      projectName: path.basename(this.projectPath),
      projectPath: this.projectPath,
      hasPackageJson: false,
      hasWeeConfig: false,
      gitBranch: null,
      recentFiles: []
    };
    
    try {
      // Check for package.json
      await fs.access(path.join(this.projectPath, 'package.json'));
      context.hasPackageJson = true;
    } catch (error) {
      // No package.json
    }
    
    try {
      // Check for WEE config
      await fs.access(path.join(this.projectPath, '.wee'));
      context.hasWeeConfig = true;
    } catch (error) {
      // No WEE config
    }
    
    try {
      // Get git branch
      const { exec } = require('child_process');
      const gitBranch = await new Promise((resolve) => {
        exec('git branch --show-current', { cwd: this.projectPath }, (error, stdout) => {
          resolve(error ? null : stdout.trim());
        });
      });
      context.gitBranch = gitBranch;
    } catch (error) {
      // No git or error
    }
    
    return context;
  }

  handleBridgeMessage(message) {
    switch (message.type) {
      case 'welcome':
        this.log('info', `Received welcome from bridge, available agents: ${message.availableAgents?.join(', ')}`);
        break;
        
      case 'agents-available':
        this.log('info', `Agents available: ${message.agents?.map(a => `${a.emoji} ${a.name}`).join(', ')}`);
        this.surfaceAgentsInCascade(message.agents);
        break;
        
      case 'agent-message':
        this.handleAgentMessage(message);
        break;
        
      case 'heartbeat':
        this.ws.send(JSON.stringify({ type: 'heartbeat-ack' }));
        break;
        
      default:
        this.log('debug', `Unknown message type: ${message.type}`);
    }
  }

  async initializeAgentsForProject() {
    this.log('info', 'Initializing agents for project context...');
    
    // Load WEE agents if available
    const weeAgentsPath = path.join(this.projectPath, 'src', 'agents');
    
    try {
      const agentFiles = await fs.readdir(weeAgentsPath);
      const agents = agentFiles
        .filter(file => file.endsWith('_agent.js'))
        .map(file => file.replace('_agent.js', ''));
      
      this.log('info', `Found WEE agents in project: ${agents.join(', ')}`);
      
      // Register each agent with the bridge
      for (const agentName of agents) {
        await this.registerProjectAgent(agentName);
      }
      
    } catch (error) {
      this.log('debug', 'No WEE agents found in project, using global agents');
    }
  }

  async registerProjectAgent(agentName) {
    try {
      const agentPath = path.join(this.projectPath, 'src', 'agents', `${agentName}_agent.js`);
      const AgentClass = require(agentPath);
      
      // Create agent instance
      const agent = new AgentClass();
      const agentInfo = {
        id: `${agentName}-${this.instanceId}`,
        name: agent.name || agentName,
        emoji: agent.emoji || '🤖',
        capabilities: agent.capabilities || []
      };
      
      // Register with bridge
      const response = await fetch(`http://localhost:${this.config.bridge.port}/register-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentInfo)
      });
      
      if (response.ok) {
        this.log('info', `Registered project agent: ${agentInfo.emoji} ${agentInfo.name}`);
      }
      
    } catch (error) {
      this.log('warn', `Failed to register agent ${agentName}: ${error.message}`);
    }
  }

  surfaceAgentsInCascade(agents) {
    // This is where we would integrate with Windsurf's CASCADE API
    // For now, we'll log that agents are available
    this.log('info', 'Surfacing agents in CASCADE chat interface...');
    
    if (typeof global !== 'undefined' && global.CASCADE_API) {
      // Use Windsurf's native CASCADE API
      for (const agent of agents) {
        global.CASCADE_API.registerAgent({
          id: agent.id,
          name: agent.name,
          emoji: agent.emoji,
          capabilities: agent.capabilities
        });
      }
      this.log('info', 'Agents registered with CASCADE API');
    } else {
      this.log('warn', 'CASCADE API not available, agents will communicate via bridge only');
    }
  }

  handleAgentMessage(message) {
    this.log('info', `Agent message: ${message.agentEmoji} ${message.agentName}: ${message.message}`);
    
    // Forward to CASCADE if available
    if (typeof global !== 'undefined' && global.CASCADE_API && global.CASCADE_API.receiveAgentMessage) {
      global.CASCADE_API.receiveAgentMessage({
        agentId: message.agentId,
        name: message.agentName,
        emoji: message.agentEmoji,
        message: message.message,
        timestamp: message.timestamp
      });
    } else {
      // Fallback to console output
      console.log(`${message.agentEmoji} ${message.agentName}: ${message.message}`);
    }
  }

  generateInstanceId() {
    return `windsurf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      instanceId: this.instanceId,
      projectPath: this.projectPath
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    
    try {
      await fs.appendFile(this.logPath, logLine);
    } catch (error) {
      // Ignore logging errors
    }
    
    console.log(`[${timestamp}] STARTUP ${level.toUpperCase()}: ${message}`, data || '');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run startup hook if called directly
if (require.main === module) {
  const hook = new WindsurfStartupHook();
  hook.initialize().catch((error) => {
    console.error('Windsurf startup hook failed:', error.message);
    process.exit(1);
  });
}

module.exports = WindsurfStartupHook;
