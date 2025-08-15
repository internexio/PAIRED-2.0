# WEE-Core Interface & Modular Repository Architecture
## Individual Tools Working Together - Microservices Ecosystem Design

---

## Executive Summary

This document defines the WEE-Core interface contracts and modular repository structure that enables the "individual tools working together" philosophy. Each component operates as an independent tool with well-defined interfaces, enabling a microservices-like ecosystem for AI agent coordination.

**Strategic Goal:** Create a modular, scalable ecosystem where individual tools can be composed for different IDE integrations and use cases.

---

## Repository Structure Overview

### **Ecosystem Architecture**
```
WEE-Ecosystem/
├── wee-core/                    # Core agent coordination engine
├── wee-windsurf/               # Windsurf IDE integration
├── wee-claude-code/            # Claude Code IDE integration  
├── wee-vscode/                 # VS Code integration (future)
├── wee-bridge/                 # MCP bridge service
├── wee-router/                 # Intelligent routing engine
├── wee-monitor/                # Monitoring and analytics
├── wee-installer/              # Universal installer
├── wee-cli/                    # Command-line interface
└── wee-marketplace/            # Third-party agent marketplace
```

### **Individual Tool Philosophy**
Each repository represents a **single-purpose tool** that:
- ✅ Has one primary responsibility
- ✅ Exposes well-defined interfaces
- ✅ Can operate independently
- ✅ Composes with other tools seamlessly
- ✅ Follows microservices principles

---

## WEE-Core Interface Contracts

### **1. Agent Interface Contract**
```typescript
// wee-core/interfaces/agent.interface.ts
interface WEEAgent {
  // Agent identity
  readonly name: string;
  readonly role: AgentRole;
  readonly specialization: string[];
  readonly capabilities: AgentCapability[];
  
  // Core methods
  process(message: AgentMessage, context: AgentContext): Promise<AgentResponse>;
  coordinate(agents: WEEAgent[], task: CoordinationTask): Promise<CoordinationResult>;
  
  // Lifecycle methods
  initialize(config: AgentConfig): Promise<void>;
  shutdown(): Promise<void>;
  
  // State management
  getState(): AgentState;
  setState(state: Partial<AgentState>): void;
  
  // Health and monitoring
  healthCheck(): Promise<HealthStatus>;
  getMetrics(): AgentMetrics;
}

interface AgentMessage {
  id: string;
  content: string;
  type: MessageType;
  priority: Priority;
  metadata: Record<string, any>;
  timestamp: number;
}

interface AgentContext {
  sessionId: string;
  userId: string;
  projectContext: ProjectContext;
  conversationHistory: ConversationEntry[];
  availableAgents: string[];
  platform: PlatformInfo;
}

interface AgentResponse {
  content: string;
  actions: AgentAction[];
  metadata: ResponseMetadata;
  followUpSuggestions: FollowUpSuggestion[];
  coordinationRequests: CoordinationRequest[];
}
```

### **2. Communication Hub Interface**
```typescript
// wee-core/interfaces/communication.interface.ts
interface CommunicationHub {
  // Message routing
  sendMessage(targetAgent: string, message: AgentMessage): Promise<AgentResponse>;
  broadcastMessage(message: AgentMessage, targets?: string[]): Promise<AgentResponse[]>;
  
  // Event handling
  on(event: CommunicationEvent, handler: EventHandler): void;
  emit(event: CommunicationEvent, data: any): void;
  
  // Connection management
  registerAgent(agent: WEEAgent): Promise<void>;
  unregisterAgent(agentName: string): Promise<void>;
  
  // Health and monitoring
  getConnectionStatus(): ConnectionStatus;
  getMessageStats(): MessageStats;
}

interface CommunicationEvent {
  type: 'message' | 'agent-registered' | 'agent-disconnected' | 'error';
  source: string;
  target?: string;
  timestamp: number;
  data: any;
}
```

### **3. Platform Integration Interface**
```typescript
// wee-core/interfaces/platform.interface.ts
interface PlatformIntegration {
  // Platform identity
  readonly platformId: string;
  readonly platformName: string;
  readonly version: string;
  readonly capabilities: PlatformCapability[];
  
  // Core integration methods
  initialize(config: PlatformConfig): Promise<void>;
  connectToWEECore(coreInstance: WEECore): Promise<void>;
  
  // Context extraction
  getCurrentContext(): Promise<PlatformContext>;
  getProjectInfo(): Promise<ProjectInfo>;
  getSelectedText(): Promise<string>;
  getCurrentFile(): Promise<FileInfo>;
  
  // UI integration
  showAgentPanel(): Promise<void>;
  displayAgentResponse(agent: string, response: AgentResponse): Promise<void>;
  promptUser(message: string, options?: PromptOptions): Promise<string>;
  
  // Command registration
  registerCommands(commands: PlatformCommand[]): Promise<void>;
  
  // Lifecycle
  shutdown(): Promise<void>;
}

interface PlatformContext {
  currentFile: FileInfo;
  selectedText: string;
  openFiles: FileInfo[];
  projectRoot: string;
  gitStatus: GitInfo;
  platformSpecific: Record<string, any>;
}
```

### **4. Bridge Service Interface**
```typescript
// wee-bridge/interfaces/bridge.interface.ts
interface BridgeService {
  // Bridge identity
  readonly bridgeId: string;
  readonly supportedPlatforms: string[];
  readonly protocolVersion: string;
  
  // Connection management
  createConnection(config: BridgeConnectionConfig): Promise<BridgeConnection>;
  closeConnection(connectionId: string): Promise<void>;
  
  // Message routing
  routeMessage(message: BridgeMessage): Promise<BridgeResponse>;
  
  // Health monitoring
  getConnectionHealth(): Promise<ConnectionHealth>;
  
  // Configuration
  updateConfiguration(config: Partial<BridgeConfig>): Promise<void>;
}

interface BridgeMessage {
  id: string;
  source: PlatformIdentifier;
  target: PlatformIdentifier;
  payload: AgentMessage;
  routingHints: RoutingHint[];
  timestamp: number;
}

interface BridgeResponse {
  id: string;
  success: boolean;
  payload?: AgentResponse;
  error?: BridgeError;
  routingDecision: RoutingDecision;
  metadata: BridgeMetadata;
}
```

---

## Repository Structure Details

### **1. wee-core Repository**
```
wee-core/
├── src/
│   ├── agents/                 # Core agent implementations
│   │   ├── alex.agent.ts      # PM agent
│   │   ├── edison.agent.ts    # Dev agent
│   │   ├── sherlock.agent.ts  # QA agent
│   │   └── ...
│   ├── communication/         # Communication hub
│   │   ├── hub.ts
│   │   ├── message-router.ts
│   │   └── event-emitter.ts
│   ├── coordination/          # Agent coordination
│   │   ├── coordinator.ts
│   │   ├── task-splitter.ts
│   │   └── result-merger.ts
│   ├── interfaces/            # Interface contracts
│   │   ├── agent.interface.ts
│   │   ├── communication.interface.ts
│   │   └── platform.interface.ts
│   └── core.ts               # Main WEE-Core class
├── tests/
├── docs/
├── package.json
└── README.md
```

**Key Features:**
- **Pure TypeScript/JavaScript** - No IDE dependencies
- **Interface-driven design** - Clean contracts for all integrations
- **Agent lifecycle management** - Initialize, coordinate, shutdown
- **Event-driven architecture** - Reactive communication patterns

### **2. wee-windsurf Repository**
```
wee-windsurf/
├── src/
│   ├── extension/             # Windsurf extension code
│   │   ├── extension.ts      # Main extension entry
│   │   ├── commands.ts       # Command handlers
│   │   └── ui/               # UI components
│   ├── integration/          # WEE-Core integration
│   │   ├── windsurf-platform.ts
│   │   ├── context-extractor.ts
│   │   └── response-renderer.ts
│   └── bridge/               # CASCADE bridge compatibility
│       ├── cascade-adapter.ts
│       └── legacy-support.ts
├── resources/                # Extension resources
├── package.json             # Extension manifest
└── README.md
```

**Key Features:**
- **Native Windsurf integration** - Extension-based approach
- **WEE-Core adapter** - Implements PlatformIntegration interface
- **CASCADE compatibility** - Maintains existing bridge support
- **UI components** - Agent panel, status indicators, conversation history

### **3. wee-claude-code Repository**
```
wee-claude-code/
├── src/
│   ├── extension/            # Claude Code extension
│   │   ├── extension.ts
│   │   ├── commands.ts
│   │   └── ui/
│   ├── integration/          # WEE-Core integration
│   │   ├── claude-platform.ts
│   │   ├── context-extractor.ts
│   │   └── response-renderer.ts
│   ├── standalone/           # Standalone mode
│   │   ├── standalone-core.ts
│   │   └── local-agents.ts
│   └── bridge/              # MCP bridge client
│       ├── mcp-client.ts
│       └── bridge-adapter.ts
├── resources/
├── package.json
└── README.md
```

**Key Features:**
- **Dual-mode operation** - Standalone and bridge modes
- **MCP client** - Bridge communication with Windsurf
- **Native Claude Code UI** - Platform-specific interface
- **Mode switching** - Seamless transition between modes

### **4. wee-bridge Repository**
```
wee-bridge/
├── src/
│   ├── server/               # Bridge server
│   │   ├── bridge-server.ts
│   │   ├── connection-manager.ts
│   │   └── message-router.ts
│   ├── routing/              # Intelligent routing
│   │   ├── routing-engine.ts
│   │   ├── cost-optimizer.ts
│   │   └── load-balancer.ts
│   ├── monitoring/           # Health monitoring
│   │   ├── health-monitor.ts
│   │   ├── metrics-collector.ts
│   │   └── alerting.ts
│   └── protocols/            # Protocol implementations
│       ├── mcp/
│       ├── websocket/
│       └── http/
├── config/                   # Configuration templates
├── docker/                   # Container deployment
├── package.json
└── README.md
```

**Key Features:**
- **Protocol agnostic** - MCP, WebSocket, HTTP support
- **Intelligent routing** - Cost and performance optimization
- **Health monitoring** - Real-time status and alerting
- **Containerized deployment** - Docker support for easy deployment

### **5. wee-installer Repository**
```
wee-installer/
├── src/
│   ├── installer/            # Universal installer
│   │   ├── installer.ts
│   │   ├── platform-detector.ts
│   │   └── dependency-manager.ts
│   ├── configurator/         # Configuration generator
│   │   ├── config-generator.ts
│   │   ├── template-engine.ts
│   │   └── validation.ts
│   └── updater/             # Auto-updater
│       ├── update-checker.ts
│       └── version-manager.ts
├── scripts/                  # Installation scripts
│   ├── install.sh           # Unix installer
│   ├── install.ps1          # Windows installer
│   └── install.py           # Python installer
├── templates/               # Configuration templates
└── README.md
```

**Key Features:**
- **One-command installation** - Universal installer script
- **Platform detection** - Automatic environment detection
- **Configuration generation** - Smart defaults with customization
- **Auto-updates** - Seamless version management

---

## Interface Implementation Examples

### **WEE-Core Integration Example**
```typescript
// wee-windsurf/src/integration/windsurf-platform.ts
export class WindsurfPlatform implements PlatformIntegration {
  readonly platformId = 'windsurf';
  readonly platformName = 'Windsurf IDE';
  readonly version = '1.0.0';
  readonly capabilities = ['file-access', 'git-integration', 'terminal-access'];
  
  private weeCore: WEECore;
  private extensionContext: vscode.ExtensionContext;
  
  async initialize(config: PlatformConfig): Promise<void> {
    // Initialize Windsurf-specific components
    this.setupCommands();
    this.setupUI();
    this.setupEventHandlers();
  }
  
  async connectToWEECore(coreInstance: WEECore): Promise<void> {
    this.weeCore = coreInstance;
    
    // Register platform with core
    await this.weeCore.registerPlatform(this);
    
    // Set up bidirectional communication
    this.weeCore.on('agent-response', this.handleAgentResponse.bind(this));
    this.on('user-message', this.weeCore.handleUserMessage.bind(this.weeCore));
  }
  
  async getCurrentContext(): Promise<PlatformContext> {
    const activeEditor = vscode.window.activeTextEditor;
    
    return {
      currentFile: activeEditor ? {
        path: activeEditor.document.fileName,
        content: activeEditor.document.getText(),
        language: activeEditor.document.languageId
      } : null,
      selectedText: activeEditor?.document.getText(activeEditor.selection) || '',
      openFiles: vscode.workspace.textDocuments.map(doc => ({
        path: doc.fileName,
        language: doc.languageId,
        isDirty: doc.isDirty
      })),
      projectRoot: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '',
      gitStatus: await this.getGitStatus(),
      platformSpecific: {
        windsurfVersion: vscode.version,
        extensions: vscode.extensions.all.map(ext => ext.id)
      }
    };
  }
}
```

### **Agent Implementation Example**
```typescript
// wee-core/src/agents/alex.agent.ts
export class AlexAgent implements WEEAgent {
  readonly name = 'Alex';
  readonly role = AgentRole.PROJECT_MANAGER;
  readonly specialization = ['coordination', 'planning', 'delegation'];
  readonly capabilities = [
    AgentCapability.TASK_COORDINATION,
    AgentCapability.AGENT_DELEGATION,
    AgentCapability.PROJECT_PLANNING
  ];
  
  private communicationHub: CommunicationHub;
  private coordinationEngine: CoordinationEngine;
  
  async process(message: AgentMessage, context: AgentContext): Promise<AgentResponse> {
    // Analyze message for coordination needs
    const analysis = await this.analyzeMessage(message, context);
    
    if (analysis.requiresCoordination) {
      return await this.coordinateTask(message, context, analysis);
    }
    
    if (analysis.requiresDelegation) {
      return await this.delegateTask(message, context, analysis);
    }
    
    // Handle direct PM queries
    return await this.handleDirectQuery(message, context);
  }
  
  async coordinate(agents: WEEAgent[], task: CoordinationTask): Promise<CoordinationResult> {
    // Alex's coordination logic
    const plan = await this.createCoordinationPlan(task, agents);
    const results = await this.executeCoordinationPlan(plan);
    
    return {
      success: true,
      results,
      coordination: {
        plan,
        participatingAgents: agents.map(a => a.name),
        duration: Date.now() - task.startTime
      }
    };
  }
}
```

---

## Deployment & Composition Patterns

### **Standalone Deployment**
```yaml
# docker-compose.standalone.yml
version: '3.8'
services:
  wee-core:
    image: wee/core:latest
    ports:
      - "7890:7890"
    environment:
      - WEE_MODE=standalone
      - WEE_PLATFORM=windsurf
    volumes:
      - ./config:/app/config
      - ./logs:/app/logs
```

### **Bridge Deployment**
```yaml
# docker-compose.bridge.yml
version: '3.8'
services:
  wee-bridge:
    image: wee/bridge:latest
    ports:
      - "8080:8080"
    environment:
      - BRIDGE_MODE=multi-platform
      - SUPPORTED_PLATFORMS=windsurf,claude-code
    depends_on:
      - wee-core
      - wee-monitor
  
  wee-core:
    image: wee/core:latest
    environment:
      - WEE_MODE=bridge
    
  wee-monitor:
    image: wee/monitor:latest
    ports:
      - "3000:3000"
```

### **Development Composition**
```bash
# Development setup script
#!/bin/bash
# setup-dev-environment.sh

echo "🚀 Setting up WEE development environment..."

# Clone all repositories
git clone https://github.com/wee-ecosystem/wee-core.git
git clone https://github.com/wee-ecosystem/wee-windsurf.git
git clone https://github.com/wee-ecosystem/wee-claude-code.git
git clone https://github.com/wee-ecosystem/wee-bridge.git

# Install dependencies
cd wee-core && npm install && npm run build
cd ../wee-windsurf && npm install && npm run build
cd ../wee-claude-code && npm install && npm run build
cd ../wee-bridge && npm install && npm run build

# Link for development
cd wee-core && npm link
cd ../wee-windsurf && npm link wee-core
cd ../wee-claude-code && npm link wee-core
cd ../wee-bridge && npm link wee-core

echo "✅ Development environment ready!"
```

---

## Success Metrics

### **Modularity Metrics:**
- **Interface compliance:** 100% adherence to interface contracts
- **Independent deployment:** Each tool can be deployed separately
- **Composition flexibility:** Any combination of tools should work together
- **Development velocity:** New integrations can be built in <2 weeks

### **Integration Metrics:**
- **Platform onboarding:** New IDE integration in <1 week
- **Agent development:** New agents can be added without core changes
- **Third-party extensions:** Marketplace-ready agent ecosystem
- **Backward compatibility:** Existing integrations remain functional

This modular architecture enables the "individual tools working together" philosophy while providing clean interfaces for the entire WEE ecosystem. Each tool has a single responsibility but composes seamlessly with others to create a powerful AI agent coordination platform.
