# WEE-Core Platform Interface Specification

## Overview
This document defines the interface contract between **WEE-Core** and platform-specific tools (Claude Code, VS Code, JetBrains, etc.).

## Core Interface Components

### 1. Agent Runtime Interface
```typescript
interface WEEPlatformAdapter {
  // Platform identification
  getPlatformInfo(): PlatformInfo;
  
  // Agent lifecycle
  initializeAgents(config: AgentConfig): Promise<void>;
  shutdownAgents(): Promise<void>;
  
  // Agent communication
  sendAgentMessage(message: AgentMessage): Promise<AgentResponse>;
  receiveAgentMessage(): Promise<AgentMessage>;
  
  // Context management
  getContext(): Promise<PlatformContext>;
  updateContext(context: PlatformContext): Promise<void>;
  
  // Tool execution
  executeTool(tool: ToolDefinition, params: any): Promise<ToolResult>;
}
```

### 2. Configuration Interface
```typescript
interface WEEConfig {
  // Core settings
  core: {
    agentRuntime: 'local' | 'distributed';
    tokenOptimization: boolean;
    performanceTracking: boolean;
  };
  
  // Platform-specific settings
  platform: {
    type: 'claude-code' | 'vscode' | 'jetbrains' | 'windsurf';
    mode: 'standalone' | 'bridge' | 'dual';
    connectionSettings: PlatformConnectionConfig;
  };
  
  // Agent configuration
  agents: {
    enabled: string[];
    coordination: AgentCoordinationConfig;
    memory: MemoryConfig;
  };
}
```

### 3. Communication Protocol
```typescript
interface WEEMessage {
  id: string;
  timestamp: number;
  source: 'core' | 'platform' | 'agent';
  target: string;
  type: 'command' | 'query' | 'response' | 'event';
  payload: any;
  metadata?: MessageMetadata;
}

interface AgentMessage extends WEEMessage {
  agentId: string;
  agentType: 'pm' | 'qa' | 'dev' | 'architecture' | 'ux' | 'analyst' | 'scrum';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  requiresResponse: boolean;
}
```

### 4. Token Optimization Interface
```typescript
interface TokenOptimizer {
  // Token tracking
  trackTokenUsage(operation: string, tokens: number): void;
  getTokenUsage(timeframe?: string): TokenUsageStats;
  
  // Routing decisions
  shouldRouteToAlternative(request: any): RoutingDecision;
  recordRoutingDecision(decision: RoutingDecision, outcome: RoutingOutcome): void;
  
  // Cost optimization
  estimateCost(request: any): CostEstimate;
  optimizeRequest(request: any): OptimizedRequest;
}
```

## Platform-Specific Implementation Requirements

### For Claude Code Tool
```typescript
class ClaudeCodeAdapter implements WEEPlatformAdapter {
  // MCP-specific implementation
  private mcpClient: MCPClient;
  private mcpServer: MCPServer;
  
  // Dual-mode support
  private mode: 'standalone' | 'bridge';
  private windsurfBridge?: WindsurfBridge;
  
  // Claude Code specific methods
  async initializeMCPServer(): Promise<void>;
  async connectToWindsurf(): Promise<void>;
  async handleLimitReached(): Promise<void>;
}
```

### For VS Code Tool
```typescript
class VSCodeAdapter implements WEEPlatformAdapter {
  // Extension-specific implementation
  private extensionContext: vscode.ExtensionContext;
  private languageClient: LanguageClient;
  
  // VS Code specific methods
  async registerCommands(): Promise<void>;
  async setupLanguageServer(): Promise<void>;
  async integrateWithWorkspace(): Promise<void>;
}
```

## Shared Services from WEE-Core

### 1. Agent Registry
```typescript
interface AgentRegistry {
  registerAgent(agent: WEEAgent): void;
  getAgent(id: string): WEEAgent | null;
  getAllAgents(): WEEAgent[];
  getAgentsByType(type: string): WEEAgent[];
}
```

### 2. Memory System
```typescript
interface SharedMemory {
  store(key: string, value: any, scope: 'global' | 'project' | 'session'): Promise<void>;
  retrieve(key: string, scope?: string): Promise<any>;
  search(query: string, scope?: string): Promise<SearchResult[]>;
  sync(): Promise<void>;
}
```

### 3. Performance Monitor
```typescript
interface PerformanceMonitor {
  startOperation(name: string): OperationTracker;
  endOperation(tracker: OperationTracker): void;
  getMetrics(timeframe?: string): PerformanceMetrics;
  exportMetrics(format: 'json' | 'csv'): string;
}
```

## Tool Lifecycle

### 1. Initialization Sequence
```
1. Platform tool loads WEE-Core
2. Tool registers with WEE-Core using adapter
3. WEE-Core validates platform compatibility
4. Agents are initialized based on configuration
5. Communication channels established
6. Ready state achieved
```

### 2. Runtime Operations
```
1. Platform receives user input
2. Tool translates to WEE message format
3. WEE-Core routes to appropriate agent(s)
4. Agent processes and responds
5. Response translated back to platform format
6. Result presented to user
```

### 3. Shutdown Sequence
```
1. Platform initiates shutdown
2. WEE-Core saves agent states
3. Communication channels closed
4. Resources cleaned up
5. Graceful exit
```

## Inter-Tool Communication

### Bridge Mode Protocol
```typescript
interface BridgeProtocol {
  // Cross-platform messaging
  sendCrossPlatform(target: string, message: WEEMessage): Promise<void>;
  receiveCrossPlatform(): Promise<WEEMessage>;
  
  // State synchronization
  syncAgentState(agentId: string): Promise<void>;
  syncContext(): Promise<void>;
  
  // Load balancing
  delegateTask(task: Task, targetPlatform: string): Promise<TaskResult>;
  handleTaskDelegation(task: Task): Promise<TaskResult>;
}
```

## Configuration Examples

### Standalone Claude Code
```yaml
core:
  agentRuntime: local
  tokenOptimization: true
  performanceTracking: true

platform:
  type: claude-code
  mode: standalone
  connectionSettings:
    mcpPort: 8765
    autoStart: true

agents:
  enabled: [pm, qa, dev, architecture, ux, analyst, scrum]
  coordination:
    mode: local
    handoffEnabled: true
```

### Bridge Mode Claude Code
```yaml
core:
  agentRuntime: distributed
  tokenOptimization: true
  performanceTracking: true

platform:
  type: claude-code
  mode: bridge
  connectionSettings:
    mcpPort: 8765
    windsurfEndpoint: "http://localhost:3000"
    fallbackEnabled: true

agents:
  enabled: [pm, qa, dev, architecture, ux, analyst, scrum]
  coordination:
    mode: distributed
    primaryPlatform: windsurf
    fallbackPlatform: claude-code
```

## Testing Interface

### Platform Tool Tests
```typescript
interface PlatformTestSuite {
  testAgentInitialization(): Promise<TestResult>;
  testMessageRouting(): Promise<TestResult>;
  testTokenOptimization(): Promise<TestResult>;
  testBridgeMode(): Promise<TestResult>;
  testFailover(): Promise<TestResult>;
}
```

This interface specification provides the foundation for building modular, interoperable tools while maintaining the flexibility for platform-specific optimizations.
