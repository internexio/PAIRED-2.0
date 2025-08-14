# WEE 2.0 Dual-Mode Architecture Design

## Architecture Overview

WEE 2.0 will support two operational modes:

### Mode 1: Standalone Claude Code
- **Full Independence**: Complete WEE ecosystem running natively in Claude Code
- **All Agent Capabilities**: 7 agents (Alex, Sherlock, Leonardo, Edison, Maya, Vince, Marie) fully operational
- **Self-Contained**: No external dependencies on Windsurf or other IDEs
- **Native Integration**: Deep Claude Code integration with MCP protocol

### Mode 2: Concert Mode (Windsurf + Claude Code)
- **Orchestrated Collaboration**: Windsurf acts as orchestrator, Claude Code as execution partner
- **Token Optimization**: Strategic delegation to minimize paid token usage
- **MCP Bridge**: Real-time communication between IDEs via MCP protocol
- **Seamless UX**: User can work in either IDE while agents coordinate behind scenes

## Technical Architecture

### Core Components

#### 1. Universal Agent Runtime
```typescript
class UniversalWEERuntime {
  mode: 'standalone' | 'concert';
  platform: 'claude-code' | 'windsurf' | 'vscode';
  agents: WEEAgent[];
  communicationBridge?: MCPBridge;
  
  async initialize(config: WEEConfig): Promise<void> {
    if (config.mode === 'concert') {
      this.communicationBridge = new MCPBridge(config.bridgeConfig);
      await this.communicationBridge.connect();
    }
    
    await this.initializeAgents();
    await this.startCollectiveIntelligence();
  }
}
```

#### 2. MCP Bridge Protocol
```typescript
interface MCPBridge {
  // Agent communication
  sendAgentMessage(from: string, to: string, message: AgentMessage): Promise<void>;
  receiveAgentMessage(): Promise<AgentMessage>;
  
  // Task delegation
  delegateTask(task: Task, targetIDE: string): Promise<TaskResult>;
  
  // State synchronization
  syncAgentState(agentId: string, state: AgentState): Promise<void>;
  
  // Context sharing
  shareContext(context: IDEContext): Promise<void>;
}
```

#### 3. Platform Adapters
```typescript
abstract class PlatformAdapter {
  abstract initialize(): Promise<void>;
  abstract getContext(): Promise<IDEContext>;
  abstract executeCommand(command: Command): Promise<Result>;
  abstract displayMessage(message: string): Promise<void>;
}

class ClaudeCodeAdapter extends PlatformAdapter {
  // Claude Code specific implementation
  async initialize(): Promise<void> {
    // Initialize Claude Code MCP server
    // Set up agent communication channels
    // Configure context monitoring
  }
}

class WindsurfAdapter extends PlatformAdapter {
  // Windsurf specific implementation
  async initialize(): Promise<void> {
    // Initialize CASCADE bridge
    // Set up agent runtime
    // Configure MCP client for concert mode
  }
}
```

## Implementation Strategy

### Phase 1: Core Agent Extraction
- Extract agent logic from Windsurf-specific code
- Create universal agent runtime
- Design platform-agnostic interfaces

### Phase 2: Claude Code Standalone
- Implement Claude Code adapter
- Deploy full agent capabilities in Claude Code
- Test standalone operation

### Phase 3: MCP Bridge Development
- Design and implement MCP protocol for IDE communication
- Create Windsurf-to-Claude Code bridge
- Implement task delegation and state synchronization

### Phase 4: Concert Mode Integration
- Enable seamless switching between modes
- Implement token optimization strategies
- Test cross-IDE agent coordination

### Phase 5: Extension and Optimization
- Add support for additional IDEs (VS Code, JetBrains)
- Optimize performance and reliability
- Implement advanced features (context sharing, collaborative editing)

## Benefits

### For Users
- **Flexibility**: Choose standalone or concert mode based on needs
- **Cost Optimization**: Reduce token usage through strategic delegation
- **Familiar Environment**: Work in preferred IDE while maintaining agent capabilities
- **Seamless Transition**: Switch between modes without losing context

### For Agents
- **Platform Independence**: Agents work consistently across environments
- **Enhanced Collaboration**: Cross-IDE coordination enables new capabilities
- **Persistent Memory**: Agent state maintained across platform switches
- **Optimized Performance**: Tasks routed to most efficient execution environment

## Success Metrics
- **Standalone Parity**: Claude Code standalone matches Windsurf capabilities
- **Concert Efficiency**: Token usage reduced by 30-50% in concert mode
- **Seamless UX**: Mode switching takes <5 seconds
- **Reliability**: 99%+ uptime for MCP bridge communication
