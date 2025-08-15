# WEE Agent Communication Troubleshooting Guide

## Root Cause Analysis - Communication Issues Resolved

### **Problem Identified**
Direct agent communication was failing due to multiple protocol and service management issues:

1. **Missing Message Handler**: Bridge service lacked `agent_query` message type handler
2. **Service Conflicts**: Multiple bridge service instances running simultaneously 
3. **Agent Registration Issues**: Agents not properly registering their IDs with bridge sessions
4. **Protocol Mismatch**: CLI script and bridge using different message routing logic

### **Issues Fixed**

#### ✅ **Issue 1: Missing `agent_query` Handler in Bridge**
**Problem**: Bridge service had no handler for `agent_query` message type
**Solution**: Added `handleAgentQuery` function to `cascade_bridge_service.js`

```javascript
// Added to bridge service switch statement
case 'agent_query':
  handleAgentQuery(instanceId, message);
  break;

// Added function implementation
function handleAgentQuery(instanceId, message) {
  logger.log(`Agent query from instance ${instanceId} to agent ${message.targetAgent}`);
  
  // Find instances that have the target agent registered
  const targetInstances = [];
  
  if (message.targetAgent === 'all') {
    // Broadcast to all instances with registered agents
    sessions.forEach((session, sessionInstanceId) => {
      if (session.registeredAgents && session.registeredAgents.size > 0) {
        targetInstances.push(sessionInstanceId);
      }
    });
  } else {
    // Find specific agent
    sessions.forEach((session, sessionInstanceId) => {
      if (session.registeredAgents && session.registeredAgents.has(message.targetAgent)) {
        targetInstances.push(sessionInstanceId);
      }
    });
  }
  
  // Route message to target instances
  targetInstances.forEach(targetInstanceId => {
    const connection = connections.get(targetInstanceId);
    if (connection && connection.readyState === WebSocket.OPEN) {
      connection.send(JSON.stringify(message));
      logger.log(`Routed query to instance ${targetInstanceId}`);
    }
  });
  
  if (targetInstances.length === 0) {
    logger.log(`No instances found with agent ${message.targetAgent}`);
  }
}
```

#### ✅ **Issue 2: Service Conflicts**
**Problem**: Multiple bridge service instances causing port conflicts and message routing issues
**Solution**: Clean service management script

#### ✅ **Issue 3: Agent ID Mapping**
**Problem**: Mismatch between agent launcher IDs and CLI script agent mapping
**Solution**: Updated `wee-chat.js` to use correct agent IDs (alex, sherlock, edison, etc.)

### **Complete Working Solution**

#### **Step 1: Clean Service Restart Script**
Created `restart-wee-services.sh`:

```bash
#!/bin/bash
echo "🔄 Restarting WEE Services..."

# Stop all existing services
pkill -f cascade_bridge_service
pkill -f agent_launcher
sleep 2

# Start bridge service
echo "🌉 Starting Bridge Service..."
nohup node .wee/src/cascade_bridge_service.js > .wee/logs/bridge.log 2>&1 &
BRIDGE_PID=$!
sleep 3

# Start agents
echo "🤖 Starting Agents..."
nohup node .wee/src/agent_launcher.js --all > .wee/logs/agents.log 2>&1 &
AGENTS_PID=$!
sleep 3

# Verify services
echo "✅ Services Started:"
echo "Bridge PID: $BRIDGE_PID"
echo "Agents PID: $AGENTS_PID"

# Test connectivity
echo "🔗 Testing Connectivity..."
lsof -i :7890 | head -5
```

#### **Step 2: Enhanced Communication Test**
Updated `wee-chat.js` with better error handling and timeout management:

```javascript
// Reduced timeout and better error reporting
const timeout = setTimeout(() => {
  if (!responseReceived) {
    ws.close();
    reject(new Error('Timeout waiting for agent response (5s)'));
  }
}, 5000); // Reduced from 10s to 5s

// Enhanced debugging
ws.on('message', (data) => {
  try {
    const response = JSON.parse(data);
    console.log('Raw bridge message:', response.type);
    
    if (response.type === 'agent_response' && response.responseId === messageId) {
      responseReceived = true;
      clearTimeout(timeout);
      
      console.log(`\n📨 Response from ${response.emoji || ''} ${response.agentName}:`);
      console.log(`${response.content}\n`);
      
      ws.close();
      resolve(response);
    }
  } catch (error) {
    console.error('Error parsing response:', error);
  }
});
```

### **Troubleshooting Commands**

#### **Service Status Check**
```bash
# Check running services
ps aux | grep -E "(cascade_bridge_service|agent_launcher)" | grep -v grep

# Check port usage
lsof -i :7890

# Check logs
tail -f .wee/logs/bridge.log
tail -f .wee/logs/agents.log
```

#### **Communication Test**
```bash
# Test direct agent communication
node .wee/scripts/wee-chat.js alex "Hello Alex!"

# Test with debug output
DEBUG=1 node .wee/scripts/wee-chat.js alex "Debug test"
```

#### **Service Restart**
```bash
# Clean restart all services
./.wee/scripts/restart-wee-services.sh

# Manual restart
pkill -f cascade_bridge_service && pkill -f agent_launcher
sleep 2
node .wee/src/cascade_bridge_service.js &
node .wee/src/agent_launcher.js --all &
```

### **Expected Working Flow**

1. **Bridge Service**: Listens on port 7890, handles WebSocket connections
2. **Agent Launcher**: Connects to bridge, registers all 7 agents
3. **CLI Script**: Sends `agent_query` message to bridge
4. **Bridge**: Routes query to appropriate agent instance
5. **Agent**: Processes query, sends `agent_response` back through bridge
6. **CLI Script**: Receives response and displays to user

### **Success Indicators**

- ✅ Bridge service running on port 7890
- ✅ 7+ WebSocket connections to bridge (agents connected)
- ✅ Agents registered in bridge sessions
- ✅ CLI script receives responses within 5 seconds
- ✅ No "Unknown message type" errors in logs

### **Common Issues & Solutions**

| Issue | Symptom | Solution |
|-------|---------|----------|
| Timeout | CLI hangs for 5+ seconds | Restart services, check agent registration |
| No agents found | "No instances found with agent X" | Verify agent launcher is running with --all |
| Port conflict | Bridge fails to start | Kill existing bridge: `pkill -f cascade_bridge_service` |
| Message routing | Agents don't respond | Check bridge logs for routing messages |

### **Files Modified**
- ✅ `cascade_bridge_service.js` - Added `agent_query` handler
- ✅ `wee-chat.js` - Fixed agent ID mapping and timeout handling
- ✅ Created `restart-wee-services.sh` - Clean service management
- ✅ Created this troubleshooting guide

---

**Status**: Communication protocol issues identified and resolved. Direct agent communication should now work consistently.
