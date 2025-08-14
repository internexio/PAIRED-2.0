#!/usr/bin/env node

/**
 * Windsurf Shutdown Hook
 * 
 * Auto-deployed to WEE projects to handle Windsurf IDE shutdown:
 * - Disconnects this instance from the bridge
 * - If last instance, shuts down agents and bridge gracefully
 * - Cleans up project-specific resources
 */

const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class WindsurfShutdownHook {
  constructor() {
    this.projectPath = process.cwd();
    this.instanceId = process.env.WINDSURF_INSTANCE_ID || this.generateInstanceId();
    this.config = null;
    this.logPath = path.join(process.env.HOME, '.wee', 'logs', 'windsurf-shutdown.log');
  }

  async initialize() {
    try {
      await this.loadConfig();
      await this.log('info', `Windsurf shutdown hook initializing for project: ${this.projectPath}`);
      
      // Disconnect this instance from bridge
      await this.disconnectFromBridge();
      
      // Unregister instance via lifecycle manager
      await this.unregisterInstance();
      
      // Clean up project-specific resources
      await this.cleanupProjectResources();
      
      this.log('info', 'Windsurf shutdown hook completed successfully');
      
    } catch (error) {
      this.log('error', `Shutdown hook failed: ${error.message}`);
      // Don't throw - we want shutdown to continue even if cleanup fails
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
          port: 7890
        },
        lifecycle: {
          shutdownDelay: 10000,
          gracefulShutdownTimeout: 30000
        }
      };
    }
  }

  async disconnectFromBridge() {
    this.log('info', 'Disconnecting from CASCADE bridge...');
    
    try {
      // Send disconnect message to bridge
      const wsUrl = `ws://localhost:${this.config.bridge.port}`;
      const ws = new WebSocket(wsUrl);
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          resolve(); // Don't fail shutdown if bridge is unreachable
        }, 5000);
        
        ws.on('open', () => {
          const disconnectMessage = {
            type: 'disconnect',
            instanceId: this.instanceId,
            projectPath: this.projectPath,
            timestamp: Date.now()
          };
          
          ws.send(JSON.stringify(disconnectMessage));
          
          setTimeout(() => {
            ws.close();
            clearTimeout(timeout);
            resolve();
          }, 1000);
        });
        
        ws.on('error', () => {
          clearTimeout(timeout);
          resolve(); // Don't fail shutdown if bridge is unreachable
        });
      });
      
      this.log('info', 'Disconnected from CASCADE bridge');
      
    } catch (error) {
      this.log('warn', `Failed to disconnect from bridge: ${error.message}`);
      // Continue with shutdown even if bridge disconnect fails
    }
  }

  async unregisterInstance() {
    this.log('info', 'Unregistering instance via lifecycle manager...');
    
    const lifecycleManager = path.join(process.env.HOME, '.wee', 'services', 'cascade-lifecycle-manager.js');
    
    return new Promise((resolve) => {
      const process = spawn('node', [lifecycleManager, 'unregister', this.instanceId], {
        stdio: 'pipe'
      });
      
      process.on('exit', (code) => {
        if (code === 0) {
          this.log('info', 'Instance unregistered successfully');
        } else {
          this.log('warn', `Instance unregistration failed with code ${code}`);
        }
        resolve(); // Always resolve - don't block shutdown
      });
      
      process.on('error', (error) => {
        this.log('warn', `Failed to unregister instance: ${error.message}`);
        resolve(); // Always resolve - don't block shutdown
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        process.kill('SIGTERM');
        resolve();
      }, 5000);
    });
  }

  async cleanupProjectResources() {
    this.log('info', 'Cleaning up project-specific resources...');
    
    try {
      // Clean up any project-specific agent instances
      await this.cleanupProjectAgents();
      
      // Clean up temporary files
      await this.cleanupTempFiles();
      
      // Save project state for next startup
      await this.saveProjectState();
      
      this.log('info', 'Project resources cleaned up successfully');
      
    } catch (error) {
      this.log('warn', `Failed to clean up project resources: ${error.message}`);
    }
  }

  async cleanupProjectAgents() {
    try {
      // Notify bridge about project agent cleanup
      const response = await fetch(`http://localhost:${this.config.bridge.port}/cleanup-project-agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId: this.instanceId,
          projectPath: this.projectPath
        })
      });
      
      if (response.ok) {
        this.log('info', 'Project agents cleaned up');
      }
      
    } catch (error) {
      this.log('debug', `Could not notify bridge about agent cleanup: ${error.message}`);
    }
  }

  async cleanupTempFiles() {
    try {
      const tempDir = path.join(this.projectPath, '.wee', 'temp');
      
      try {
        const files = await fs.readdir(tempDir);
        for (const file of files) {
          if (file.startsWith('windsurf-') || file.startsWith('cascade-')) {
            await fs.unlink(path.join(tempDir, file));
          }
        }
        this.log('debug', 'Cleaned up temporary files');
      } catch (error) {
        // Temp directory might not exist
      }
      
    } catch (error) {
      this.log('debug', `Failed to clean temp files: ${error.message}`);
    }
  }

  async saveProjectState() {
    try {
      const stateFile = path.join(this.projectPath, '.wee', 'last-session.json');
      const state = {
        instanceId: this.instanceId,
        shutdownTime: Date.now(),
        projectPath: this.projectPath,
        gracefulShutdown: true
      };
      
      await fs.mkdir(path.dirname(stateFile), { recursive: true });
      await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
      
      this.log('debug', 'Saved project state for next session');
      
    } catch (error) {
      this.log('debug', `Failed to save project state: ${error.message}`);
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
      // Ignore logging errors during shutdown
    }
    
    console.log(`[${timestamp}] SHUTDOWN ${level.toUpperCase()}: ${message}`, data || '');
  }
}

// Run shutdown hook if called directly
if (require.main === module) {
  const hook = new WindsurfShutdownHook();
  hook.initialize().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Windsurf shutdown hook failed:', error.message);
    process.exit(1);
  });
}

module.exports = WindsurfShutdownHook;
