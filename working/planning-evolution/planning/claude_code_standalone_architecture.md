# Claude Code Standalone Architecture
## Full Agent Operation Independent of Windsurf

---

## Executive Summary

This document defines the architecture for Claude Code to operate as a fully independent WEE platform with complete agent coordination capabilities. Users can choose Claude Code as their primary IDE while maintaining all WEE functionality without requiring Windsurf.

**Strategic Goal:** Enable true dual-mode operation - Claude Code standalone OR bridge mode with Windsurf.

---

## Architecture Overview

### **Dual-Mode Operation Model**

```
┌─────────────────────────────────────────────────────────────┐
│                    DUAL-MODE ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────┤
│  STANDALONE MODE          │         BRIDGE MODE             │
│                           │                                 │
│  ┌─────────────────────┐  │  ┌─────────────────────────────┐ │
│  │   Claude Code IDE   │  │  │ Windsurf ◄──MCP──► Claude  │ │
│  │                     │  │  │                             │ │
│  │ • Native WEE Core   │  │  │ • Orchestrator  • Executor  │ │
│  │ • 7 AI Agents       │  │  │ • Router        • Runtime   │ │
│  │ • Agent Panel       │  │  │ • Monitor       • Cache     │ │
│  │ • Direct Comms      │  │  │                             │ │
│  └─────────────────────┘  │  └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### **Core Principles:**
- **Complete Independence:** Full WEE functionality without external dependencies
- **Seamless Bridge Integration:** Transparent operation when used with Windsurf
- **Shared Foundation:** Same WEE-Core across both modes
- **User Choice:** Users select their preferred operation mode

---

## Standalone Architecture Components

### 1. **WEE-Core for Claude Code**

#### **A. Native Agent Runtime**
```javascript
// claude-wee-core.js - Standalone WEE implementation
class ClaudeWEECore {
  constructor() {
    this.agents = new Map();
    this.communicationHub = new ClaudeCommunicationHub();
    this.sessionManager = new ClaudeSessionManager();
    this.contextManager = new ClaudeContextManager();
    
    this.initializeAgents();
    this.startCommunicationHub();
  }
  
  initializeAgents() {
    // Initialize all 7 WEE agents for Claude Code
    const agentConfigs = [
      { name: 'Alex', role: 'PM', specialization: 'coordination' },
      { name: 'Edison', role: 'Dev', specialization: 'implementation' },
      { name: 'Sherlock', role: 'QA', specialization: 'analysis' },
      { name: 'Leonardo', role: 'Architecture', specialization: 'design' },
      { name: 'Maya', role: 'UX', specialization: 'experience' },
      { name: 'Vince', role: 'Scrum', specialization: 'process' },
      { name: 'Marie', role: 'Analyst', specialization: 'insights' }
    ];
    
    for (const config of agentConfigs) {
      const agent = new ClaudeWEEAgent(config);
      this.agents.set(config.name, agent);
    }
    
    console.log('✅ All 7 WEE agents initialized in Claude Code');
  }
  
  async handleUserMessage(message, context = {}) {
    // Direct agent coordination without external bridge
    const routingDecision = await this.determineAgentRouting(message);
    const targetAgent = this.agents.get(routingDecision.agent);
    
    // Execute with full context
    const response = await targetAgent.process(message, {
      ...context,
      sessionId: this.sessionManager.getCurrentSession(),
      availableAgents: Array.from(this.agents.keys()),
      mode: 'standalone'
    });
    
    // Handle multi-agent coordination if needed
    if (response.requiresCoordination) {
      return await this.coordinateMultiAgentResponse(response, message);
    }
    
    return response;
  }
}
```

#### **B. Claude-Native Communication Hub**
```javascript
// claude-communication-hub.js
class ClaudeCommunicationHub {
  constructor() {
    this.messageQueue = new Map();
    this.agentConnections = new Map();
    this.eventEmitter = new EventEmitter();
    
    this.setupNativeCommunication();
  }
  
  setupNativeCommunication() {
    // Direct in-process communication (no WebSocket needed)
    this.communicationType = 'native';
    
    // Set up Claude Code specific event handling
    this.eventEmitter.on('user-message', this.handleUserMessage.bind(this));
    this.eventEmitter.on('agent-response', this.handleAgentResponse.bind(this));
    this.eventEmitter.on('coordination-request', this.handleCoordination.bind(this));
  }
  
  async sendToAgent(agentName, message, context) {
    // Direct method call - no network overhead
    const agent = this.agentConnections.get(agentName);
    
    if (!agent) {
      throw new Error(`Agent ${agentName} not available`);
    }
    
    // Process immediately with full Claude Code context
    return await agent.processMessage(message, {
      ...context,
      timestamp: Date.now(),
      source: 'claude-code-native',
      communicationType: 'direct'
    });
  }
  
  // Bridge mode compatibility
  async handleBridgeMessage(mcpMessage) {
    // When operating in bridge mode with Windsurf
    const response = await this.sendToAgent(
      mcpMessage.payload.agent,
      mcpMessage.payload.content,
      mcpMessage.payload.context
    );
    
    // Return in MCP format for bridge
    return {
      id: mcpMessage.id,
      type: 'agent-response',
      status: 'success',
      payload: {
        content: response.content,
        agent: response.agent,
        tokenUsage: response.tokenUsage,
        metadata: response.metadata
      }
    };
  }
}
```

### 2. **Claude Code Extension/Plugin**

#### **A. Native IDE Integration**
```javascript
// claude-code-wee-extension.js
class ClaudeCodeWEEExtension {
  constructor() {
    this.weeCore = new ClaudeWEECore();
    this.ui = new ClaudeWEEUI();
    this.commandHandler = new ClaudeCommandHandler();
    
    this.initializeExtension();
  }
  
  initializeExtension() {
    // Register Claude Code commands
    this.registerCommands();
    
    // Set up UI panels
    this.ui.createAgentPanel();
    this.ui.createStatusPanel();
    
    // Initialize context integration
    this.setupContextIntegration();
    
    console.log('🚀 WEE Extension loaded in Claude Code');
  }
  
  registerCommands() {
    // Native Claude Code commands
    const commands = [
      { id: 'wee.askAlex', handler: () => this.askAgent('Alex') },
      { id: 'wee.askEdison', handler: () => this.askAgent('Edison') },
      { id: 'wee.askSherlock', handler: () => this.askAgent('Sherlock') },
      { id: 'wee.teamCoordination', handler: () => this.startTeamCoordination() },
      { id: 'wee.toggleMode', handler: () => this.toggleOperationMode() }
    ];
    
    for (const command of commands) {
      this.commandHandler.register(command.id, command.handler);
    }
  }
  
  async askAgent(agentName, message = null) {
    // Get current editor context
    const context = await this.getEditorContext();
    
    // Use provided message or prompt user
    const userMessage = message || await this.ui.promptForMessage(agentName);
    
    // Send to WEE Core
    const response = await this.weeCore.handleUserMessage(userMessage, context);
    
    // Display response in Claude Code
    await this.ui.displayAgentResponse(agentName, response);
    
    return response;
  }
  
  async getEditorContext() {
    // Extract Claude Code specific context
    return {
      currentFile: await this.getCurrentFile(),
      selectedText: await this.getSelectedText(),
      openFiles: await this.getOpenFiles(),
      projectRoot: await this.getProjectRoot(),
      gitStatus: await this.getGitStatus(),
      claudeCodeVersion: this.getClaudeCodeVersion()
    };
  }
}
```

#### **B. Agent Panel UI**
```javascript
// claude-wee-ui.js
class ClaudeWEEUI {
  constructor() {
    this.agentPanel = null;
    this.statusPanel = null;
    this.conversationHistory = new Map();
  }
  
  createAgentPanel() {
    // Create native Claude Code panel
    this.agentPanel = this.createPanel({
      id: 'wee-agents',
      title: 'WEE Team',
      position: 'sidebar',
      content: this.renderAgentInterface()
    });
  }
  
  renderAgentInterface() {
    return `
      <div class="wee-agent-panel">
        <div class="wee-header">
          <h3>🌉 WEE Team</h3>
          <div class="mode-indicator">
            <span class="mode-badge standalone">Standalone Mode</span>
          </div>
        </div>
        
        <div class="agent-grid">
          ${this.renderAgentButtons()}
        </div>
        
        <div class="quick-actions">
          <button onclick="wee.startTeamCoordination()">
            👥 Team Coordination
          </button>
          <button onclick="wee.toggleMode()">
            🔄 Toggle Bridge Mode
          </button>
        </div>
        
        <div class="conversation-area">
          <div id="conversation-history"></div>
          <div class="input-area">
            <input type="text" placeholder="Ask the team..." />
            <button onclick="wee.sendMessage()">Send</button>
          </div>
        </div>
      </div>
    `;
  }
  
  renderAgentButtons() {
    const agents = [
      { name: 'Alex', icon: '👑', role: 'PM' },
      { name: 'Edison', icon: '⚡', role: 'Dev' },
      { name: 'Sherlock', icon: '🕵️', role: 'QA' },
      { name: 'Leonardo', icon: '🏛️', role: 'Architect' },
      { name: 'Maya', icon: '🎨', role: 'UX' },
      { name: 'Vince', icon: '🏈', role: 'Scrum' },
      { name: 'Marie', icon: '🔬', role: 'Analyst' }
    ];
    
    return agents.map(agent => `
      <button class="agent-button" onclick="wee.askAgent('${agent.name}')">
        <span class="agent-icon">${agent.icon}</span>
        <span class="agent-name">${agent.name}</span>
        <span class="agent-role">${agent.role}</span>
      </button>
    `).join('');
  }
}
```

### 3. **Mode Detection & Switching**

#### **A. Operation Mode Manager**
```javascript
// operation-mode-manager.js
class OperationModeManager {
  constructor() {
    this.currentMode = 'standalone'; // Default to standalone
    this.bridgeConnection = null;
    this.modeListeners = new Set();
    
    this.detectInitialMode();
  }
  
  async detectInitialMode() {
    // Check if Windsurf bridge is available
    const bridgeAvailable = await this.checkForWindsurfBridge();
    
    if (bridgeAvailable) {
      // Offer bridge mode to user
      const userChoice = await this.promptModeSelection();
      this.currentMode = userChoice;
    } else {
      // Default to standalone
      this.currentMode = 'standalone';
    }
    
    await this.initializeMode();
    this.notifyModeChange();
  }
  
  async toggleMode() {
    const newMode = this.currentMode === 'standalone' ? 'bridge' : 'standalone';
    
    if (newMode === 'bridge') {
      // Check if bridge is available
      const bridgeAvailable = await this.checkForWindsurfBridge();
      if (!bridgeAvailable) {
        throw new Error('Windsurf bridge not available');
      }
    }
    
    await this.switchToMode(newMode);
  }
  
  async switchToMode(mode) {
    console.log(`🔄 Switching WEE to ${mode} mode`);
    
    // Cleanup current mode
    await this.cleanupCurrentMode();
    
    // Initialize new mode
    this.currentMode = mode;
    await this.initializeMode();
    
    // Notify listeners
    this.notifyModeChange();
    
    console.log(`✅ WEE now running in ${mode} mode`);
  }
  
  async initializeMode() {
    switch (this.currentMode) {
      case 'standalone':
        await this.initializeStandaloneMode();
        break;
      case 'bridge':
        await this.initializeBridgeMode();
        break;
      default:
        throw new Error(`Unknown mode: ${this.currentMode}`);
    }
  }
  
  async initializeStandaloneMode() {
    // Full WEE functionality in Claude Code
    this.weeCore = new ClaudeWEECore();
    this.communicationHub = new ClaudeCommunicationHub();
    
    // No external dependencies
    console.log('🏠 Standalone mode: Full WEE functionality in Claude Code');
  }
  
  async initializeBridgeMode() {
    // Connect to Windsurf bridge
    this.bridgeConnection = new WindsurfBridgeClient();
    await this.bridgeConnection.connect();
    
    // Set up bridge communication
    this.communicationHub = new BridgeCommunicationHub(this.bridgeConnection);
    
    console.log('🌉 Bridge mode: Connected to Windsurf orchestrator');
  }
}
```

### 4. **Installation & Setup**

#### **A. One-Command Installation**
```bash
#!/bin/bash
# install-claude-wee.sh - Standalone Claude Code installation

echo "🌉 Installing WEE for Claude Code..."

# Detect Claude Code installation
CLAUDE_CODE_PATH=$(which claude-code || echo "")
if [ -z "$CLAUDE_CODE_PATH" ]; then
    echo "❌ Claude Code not found. Please install Claude Code first."
    exit 1
fi

# Create WEE directory structure
mkdir -p ~/.wee/claude-code/{agents,config,logs,cache}

# Install WEE Core for Claude Code
echo "📦 Installing WEE Core..."
curl -sSL https://get.wee.dev/claude-core.tar.gz | tar -xz -C ~/.wee/claude-code/

# Install Claude Code extension
echo "🔌 Installing Claude Code extension..."
claude-code --install-extension wee-team-coordination

# Initialize configuration
echo "⚙️ Initializing configuration..."
cat > ~/.wee/claude-code/config/wee-config.yml << EOF
wee:
  mode: standalone
  agents:
    enabled: [Alex, Edison, Sherlock, Leonardo, Maya, Vince, Marie]
  ui:
    panel_position: sidebar
    theme: auto
  performance:
    cache_enabled: true
    response_timeout: 30000
EOF

# Start WEE service
echo "🚀 Starting WEE service..."
~/.wee/claude-code/bin/wee-service start

# Verify installation
if ~/.wee/claude-code/bin/wee-service status > /dev/null 2>&1; then
    echo "✅ WEE for Claude Code installed successfully!"
    echo ""
    echo "🎉 Ready to use! Open Claude Code and look for the WEE panel."
    echo "💡 Try: Ctrl+Shift+P → 'WEE: Ask Alex'"
else
    echo "❌ Installation failed. Check logs: ~/.wee/claude-code/logs/"
    exit 1
fi
```

#### **B. Configuration Management**
```yaml
# claude-wee-config.yml
wee:
  # Operation mode: standalone or bridge
  mode: standalone
  
  # Bridge configuration (when mode = bridge)
  bridge:
    windsurf_host: localhost
    windsurf_port: 7890
    connection_timeout: 30000
    fallback_to_standalone: true
  
  # Agent configuration
  agents:
    enabled: [Alex, Edison, Sherlock, Leonardo, Maya, Vince, Marie]
    response_timeout: 30000
    coordination_enabled: true
  
  # UI configuration
  ui:
    panel_position: sidebar
    show_agent_status: true
    conversation_history_limit: 100
    theme: auto
  
  # Performance settings
  performance:
    cache_enabled: true
    cache_size: 1000
    background_processing: true
    token_optimization: true
```

---

## Dual-Mode Operation Flow

### **Standalone Mode Flow:**
```
User Input → Claude Code Extension → WEE Core → Agent Processing → Direct Response
```

### **Bridge Mode Flow:**
```
User Input → Claude Code Extension → MCP Bridge → Windsurf Orchestrator → Agent Processing → Response via Bridge
```

### **Seamless Mode Switching:**
```javascript
// Example: User switches from standalone to bridge mode
async function switchToBridgeMode() {
  // 1. Preserve current session state
  const sessionState = await weeCore.exportSessionState();
  
  // 2. Connect to Windsurf bridge
  const bridgeConnection = await connectToWindsurfBridge();
  
  // 3. Transfer session state to bridge
  await bridgeConnection.importSessionState(sessionState);
  
  // 4. Switch communication mode
  communicationHub.switchToBridgeMode(bridgeConnection);
  
  // 5. Update UI indicators
  ui.updateModeIndicator('bridge');
  
  console.log('✅ Switched to bridge mode - now coordinating with Windsurf');
}
```

---

## Success Metrics

### **Standalone Operation:**
- **Full functionality:** 100% WEE features available without Windsurf
- **Performance:** <200ms response time for direct agent communication
- **Reliability:** >99.9% uptime for standalone operation
- **User experience:** Seamless operation indistinguishable from bridge mode

### **Mode Switching:**
- **Switch time:** <3 seconds between standalone and bridge modes
- **State preservation:** 100% session continuity during mode switches
- **Fallback reliability:** Automatic fallback to standalone if bridge fails
- **User transparency:** Mode switching invisible to ongoing conversations

This architecture ensures Claude Code can operate as a complete WEE platform while maintaining seamless integration with Windsurf when desired. Users get true choice in their IDE preference without sacrificing functionality.
