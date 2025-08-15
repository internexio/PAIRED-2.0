# WEE Agent Integration Startup Guide
## Ensuring Direct Agent Communication from First Prompt

### Current System Architecture

The WEE (Windsurf Evolutionary Ecosystem) has the following components working together:

1. **WEE Agent Bridge Service** (`cascade_bridge_service.js`) - WebSocket server on port 7890
2. **Agent Launcher Processes** (`agent_launcher.js`) - Individual agent processes that connect to bridge
3. **Windsurf Rules Configuration** (`.windsurfrules`) - Defines agent integration protocol
4. **Agent Definitions** (`windsurf_agent_types.yml`) - Official agent specifications

### Problem Identified

**Issue**: Users get responses from Cascade (intermediary) instead of direct agent responses
**Root Cause**: Missing direct communication interface between Windsurf IDE and WEE agents

### Current Working Components ✅

- **Bridge Service**: Running successfully (PID: 81857, Port: 7890)
- **Agent Processes**: All 7 agents active and connected
  - 👑 Alex (PM) - PID: 96283
  - 🕵️ Sherlock (QA) - PID: 96289  
  - ⚡ Edison (Dev) - PID: 96295
  - 🏛️ Leonardo (Architecture) - PID: 96299
  - 🎨 Maya (UX) - PID: 96386
  - 🏈 Vince (Scrum Master) - PID: 96390
  - 🔬 Marie (Analyst) - PID: 96394
- **WebSocket Connections**: 15+ active connections between agents and bridge
- **Agent Definitions**: Properly configured in `windsurf_agent_types.yml`
- **Windsurf Rules**: Auto-load configuration in place

### Missing Component ❌

**Direct Windsurf-to-Agent Communication Interface**

The system needs a mechanism for Windsurf IDE to:
1. Detect when user wants to communicate with specific agents
2. Route messages directly to agents via the bridge
3. Display agent responses directly in the IDE interface
4. Bypass Cascade as intermediary

### Solution Architecture

#### Option 1: Windsurf Extension/Plugin
Create a Windsurf extension that:
- Connects to the WEE Agent Bridge (ws://localhost:7890)
- Provides agent selection UI in IDE
- Routes user messages directly to selected agents
- Displays agent responses in dedicated panel

#### Option 2: Enhanced .windsurfrules Integration
Extend the current `.windsurfrules` configuration to:
- Define agent communication triggers (e.g., @alex, @sherlock)
- Automatically route @mentions to appropriate agents
- Configure response display format

#### Option 3: Command Palette Integration
Add Windsurf command palette entries:
- "WEE: Talk to Alex (PM)"
- "WEE: Talk to Sherlock (QA)"
- etc.

### Recommended Implementation Steps

#### Phase 1: Immediate Fix (Command-Line Interface)
1. Create `wee-chat.js` script for direct agent communication
2. Add shell aliases for quick agent access
3. Test direct communication flow

#### Phase 2: Windsurf IDE Integration
1. Create Windsurf extension for WEE agents
2. Implement @mention routing system
3. Add agent response panel to IDE

#### Phase 3: Enhanced User Experience
1. Add agent status indicators in IDE
2. Implement conversation history
3. Add collaborative agent sessions

### Testing Protocol

To verify direct agent communication:

1. **Bridge Status Check**:
   ```bash
   ps aux | grep cascade_bridge_service
   lsof -i :7890
   ```

2. **Agent Process Verification**:
   ```bash
   ps aux | grep agent_launcher
   ```

3. **Direct Communication Test**:
   ```bash
   # Create test script to send message to Alex
   node -e "
   const WebSocket = require('ws');
   const ws = new WebSocket('ws://localhost:7890');
   ws.on('open', () => {
     ws.send(JSON.stringify({
       type: 'agent_query',
       targetAgent: 'alex',
       content: 'Hello Alex, are you there?',
       messageId: Date.now()
     }));
   });
   ws.on('message', (data) => {
     console.log('Agent Response:', JSON.parse(data));
     ws.close();
   });
   "
   ```

### Startup Checklist for Consistent Agent Communication

#### Before Each Windsurf Session:
- [ ] Verify bridge service is running (`ps aux | grep cascade_bridge_service`)
- [ ] Confirm all agents are connected (`lsof -i :7890` shows 15+ connections)
- [ ] Test direct communication interface
- [ ] Verify `.windsurfrules` is properly loaded

#### Troubleshooting Steps:
1. **No Agent Responses**: Check if bridge service is running
2. **Partial Agent Team**: Restart agent launcher with `--all` flag
3. **Connection Issues**: Verify port 7890 is available
4. **Configuration Problems**: Validate `windsurf_agent_types.yml` syntax

### Next Actions Required

1. **Create Direct Communication Script** - Immediate solution for testing
2. **Develop Windsurf Extension** - Long-term IDE integration
3. **Update Startup Scripts** - Ensure consistent initialization
4. **Document User Workflows** - Clear instructions for agent interaction

### Files to Monitor/Update

- `.windsurfrules` - Agent integration configuration
- `.wee/windsurf_agent_types.yml` - Agent definitions
- `.wee/src/cascade_bridge_service.js` - Bridge service
- `.wee/src/agent_launcher.js` - Agent processes
- `.wee/scripts/start-agents.sh` - Agent startup script

---

**Status**: Bridge and agents are operational, but direct communication interface needs implementation.
**Priority**: High - This is blocking optimal user experience with WEE agents.
**Estimated Effort**: 2-4 hours for immediate CLI solution, 1-2 days for full IDE integration.
