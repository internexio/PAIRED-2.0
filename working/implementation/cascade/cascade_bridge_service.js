#!/usr/bin/env node

/**
 * PAIRED Cascade Agent Bridge Service
 * 
 * Multi-instance WebSocket bridge for Windsurf IDE agent communication.
 * This service allows multiple Windsurf IDE instances to communicate with
 * PAIRED agents and share context across instances.
 * 
 * Features:
 * - WebSocket server for real-time communication
 * - Session management for multiple Windsurf instances
 * - Message routing to specific instances or broadcast
 * - Cross-instance context sharing
 * - Graceful reconnection handling
 * 
 * Usage:
 *   node src/cascade_bridge_service.js [--port 7890]
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Configuration
const DEFAULT_PORT = 7890;
const DATA_DIR = path.join(os.homedir(), '.paired', 'cascade_bridge');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const AGENT_CLI_REGISTRY = require('../core/agent_cli_registry');
const LOG_FILE = path.join(DATA_DIR, 'bridge.log');

// Parse command line arguments
const args = process.argv.slice(2);
const port = args.includes('--port') ? parseInt(args[args.indexOf('--port') + 1], 10) : DEFAULT_PORT;

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize Agent CLI Registry for real agent integration
let agentRegistry = null;

// Setup logger
const logger = {
  log: (message) => {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - INFO: ${message}\n`;
    console.log(message);
    fs.appendFile(LOG_FILE, logEntry, (err) => {
      if (err) console.error('Error writing to log file:', err);
    });
  },
  error: (message, error) => {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - ERROR: ${message} - ${error?.message || error}\n`;
    console.error(message, error);
    fs.appendFile(LOG_FILE, logEntry, (err) => {
      if (err) console.error('Error writing to log file:', err);
    });
  }
};

// Connection tracking
const connections = new Map(); // instanceId -> WebSocket connection
const sessions = new Map();    // instanceId -> session data
const sharedContext = new Map(); // contextId -> shared data

// Setup Express and WebSocket server
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Load existing sessions
function loadSessions() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = fs.readFileSync(SESSIONS_FILE, 'utf8');
      const loadedSessions = JSON.parse(data);
      
      // Convert to Map structure
      Object.entries(loadedSessions).forEach(([id, session]) => {
        // Only add if not already in sessions
        if (!sessions.has(id)) {
          session.agentActivity = new Map(Object.entries(session.agentActivity || {}));
          sessions.set(id, session);
        }
      });
      
      logger.log(`Loaded ${Object.keys(loadedSessions).length} saved sessions`);
    }
  } catch (error) {
    logger.error('Error loading sessions:', error);
  }
}

// Save sessions to disk
function saveSessions() {
  try {
    // Convert sessions Map to a serializable object
    const sessionsObj = {};
    sessions.forEach((session, id) => {
      // Convert agentActivity Map to object
      const agentActivityObj = {};
      session.agentActivity.forEach((value, key) => {
        agentActivityObj[key] = value;
      });
      
      sessionsObj[id] = {
        ...session,
        agentActivity: agentActivityObj
      };
    });
    
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessionsObj, null, 2));
  } catch (error) {
    logger.error('Error saving sessions:', error);
  }
}

// WebSocket message handler
function handleMessage(instanceId, rawMessage) {
  try {
    const message = JSON.parse(rawMessage);
    
    // Update activity timestamp
    if (sessions.has(instanceId)) {
      const session = sessions.get(instanceId);
      session.lastActivity = Date.now();
      
      // Track agent activity if this is from an agent
      if (message.agent && message.agent.name) {
        session.agentActivity.set(message.agent.name, Date.now());
      }
    }
    
    logger.log(`Received ${message.type} from ${instanceId}`);
    
    // Handle based on message type
    switch(message.type) {
      case 'AGENT_MESSAGE':
        routeAgentMessage(instanceId, message);
        break;
        
      case 'CONTEXT_SHARE':
        handleContextShare(instanceId, message);
        break;
        
      case 'HEARTBEAT':
        // Just update connection status
        break;
        
      case 'GET_INSTANCES':
        sendInstancesList(instanceId);
        break;
        
      case 'agent_register':
        handleAgentRegistration(instanceId, message);
        break;
        
      case 'agent_response':
        routeAgentResponse(instanceId, message);
        break;
        
      case 'collaboration_request':
        routeCollaborationRequest(instanceId, message);
        break;
        
      case 'collaboration_response':
        routeCollaborationResponse(instanceId, message);
        break;
        
      case 'agent_status':
        handleAgentStatus(instanceId, message);
        break;
        
      case 'pong':
        handleAgentPong(instanceId, message);
        break;
        
      case 'SET_PROJECT_INFO':
        handleProjectInfo(instanceId, message);
        break;
        
      default:
        logger.log(`Unknown message type: ${message.type}`);
    }
    
  } catch (error) {
    logger.error('Error handling message:', error);
  }
}

// Route agent message to appropriate instance(s)
function routeAgentMessage(sourceInstanceId, message) {
  // Determine target(s)
  const targets = message.targetInstanceId === 'all' 
    ? Array.from(connections.keys())
    : [message.targetInstanceId];
  
  // Add source information if not already present
  const outgoingMessage = {
    ...message,
    sourceInstanceId: message.sourceInstanceId || sourceInstanceId,
    timestamp: message.timestamp || Date.now()
  };
  
  logger.log(`Routing message from ${sourceInstanceId} to ${targets.length} instances`);
  
  // Send to all targets
  let delivered = 0;
  targets.forEach(targetId => {
    if (connections.has(targetId)) {
      const connection = connections.get(targetId);
      connection.send(JSON.stringify(outgoingMessage));
      delivered++;
    }
  });
  
  logger.log(`Delivered message to ${delivered}/${targets.length} instances`);
}

// Handle cross-instance context sharing
function handleContextShare(sourceInstanceId, message) {
  if (!message.contextId || !message.contextData) return;
  
  logger.log(`Sharing context ${message.contextId} from ${sourceInstanceId}`);
  
  // Store shared context
  sharedContext.set(message.contextId, {
    data: message.contextData,
    source: sourceInstanceId,
    timestamp: Date.now()
  });
  
  // Notify other instances of new shared context
  const notification = {
    type: 'CONTEXT_UPDATED',
    contextId: message.contextId,
    source: sourceInstanceId,
    summary: message.summary || 'Context updated',
    timestamp: Date.now()
  };
  
  // Broadcast to all except source
  connections.forEach((connection, instanceId) => {
    if (instanceId !== sourceInstanceId) {
      connection.send(JSON.stringify(notification));
    }
  });
}

// Send list of active instances to requesting instance
function sendInstancesList(instanceId) {
  const instancesList = Array.from(sessions.entries()).map(([id, session]) => ({
    instanceId: id,
    projectName: session.projectName,
    lastActivity: session.lastActivity,
    agentActivity: Object.fromEntries(session.agentActivity),
    connected: connections.has(id)
  }));
  
  const response = {
    type: 'INSTANCES_LIST',
    instances: instancesList,
    timestamp: Date.now()
  };
  
  const connection = connections.get(instanceId);
  if (connection && connection.readyState === WebSocket.OPEN) {
    connection.send(JSON.stringify(response));
  }
}

// Handle agent registration
function handleAgentRegistration(instanceId, message) {
  logger.log(`Agent registered: ${message.agentName} (${message.agentId}) from instance ${instanceId}`);
  
  // Update session with agent info
  if (sessions.has(instanceId)) {
    const session = sessions.get(instanceId);
    if (!session.registeredAgents) {
      session.registeredAgents = new Map();
    }
    session.registeredAgents.set(message.agentId, {
      name: message.agentName,
      emoji: message.emoji,
      role: message.role,
      capabilities: message.capabilities,
      personality: message.personality,
      registeredAt: Date.now()
    });
    
    // Track agent activity
    session.agentActivity.set(message.agentName, Date.now());
  }
  
  // Send registration confirmation
  const response = {
    type: 'agent_registration_confirmed',
    agentId: message.agentId,
    instanceId: instanceId,
    timestamp: Date.now()
  };
  
  const connection = connections.get(instanceId);
  if (connection && connection.readyState === WebSocket.OPEN) {
    connection.send(JSON.stringify(response));
  }
  
  // Broadcast agent availability to other instances
  broadcastAgentAvailability(instanceId, message);
}

// Route agent response to appropriate instances
function routeAgentResponse(instanceId, message) {
  logger.log(`Agent response from ${message.agentName}: ${message.content.substring(0, 100)}...`);
  
  // Broadcast to all connected instances
  const response = {
    type: 'AGENT_RESPONSE',
    agent: {
      id: message.agentId,
      name: message.agentName,
      emoji: message.emoji
    },
    content: message.content,
    responseId: message.responseId,
    timestamp: message.timestamp,
    sourceInstance: instanceId
  };
  
  broadcastToAllInstances(response, instanceId);
}

// Route collaboration request
function routeCollaborationRequest(instanceId, message) {
  logger.log(`Collaboration request from ${message.fromAgent} to ${message.toAgent}`);
  
  // Find instance with target agent and route message
  const targetInstance = findInstanceWithAgent(message.toAgent);
  if (targetInstance) {
    const connection = connections.get(targetInstance);
    if (connection && connection.readyState === WebSocket.OPEN) {
      connection.send(JSON.stringify(message));
    }
  } else {
    // Broadcast to all instances if target not found
    broadcastToAllInstances(message, instanceId);
  }
}

// Route collaboration response
function routeCollaborationResponse(instanceId, message) {
  logger.log(`Collaboration response from ${message.agentName} to ${message.toAgent}`);
  
  // Find instance with target agent and route message
  const targetInstance = findInstanceWithAgent(message.toAgent);
  if (targetInstance) {
    const connection = connections.get(targetInstance);
    if (connection && connection.readyState === WebSocket.OPEN) {
      connection.send(JSON.stringify(message));
    }
  } else {
    // Broadcast to all instances if target not found
    broadcastToAllInstances(message, instanceId);
  }
}

// Handle agent status update
function handleAgentStatus(instanceId, message) {
  logger.log(`Agent status update: ${message.agentName} - ${message.status}`);
  
  // Update session with agent status
  if (sessions.has(instanceId)) {
    const session = sessions.get(instanceId);
    if (session.registeredAgents && session.registeredAgents.has(message.agentId)) {
      const agent = session.registeredAgents.get(message.agentId);
      agent.status = message.status;
      agent.lastStatusUpdate = Date.now();
    }
  }
  
  // Broadcast status to other instances
  broadcastToAllInstances(message, instanceId);
}

// Handle agent pong response
function handleAgentPong(instanceId, message) {
  logger.log(`Agent pong from ${message.agentName}`);
  
  // Update agent activity
  if (sessions.has(instanceId)) {
    const session = sessions.get(instanceId);
    session.agentActivity.set(message.agentName, Date.now());
  }
}

// Handle project info update
function handleProjectInfo(instanceId, message) {
  logger.log(`Project info update from instance ${instanceId}`);
  
  // Update session with project info
  if (sessions.has(instanceId)) {
    const session = sessions.get(instanceId);
    session.projectInfo = message.projectInfo;
    session.lastActivity = Date.now();
  }
}

// Broadcast agent availability to other instances
function broadcastAgentAvailability(sourceInstanceId, agentMessage) {
  const availability = {
    type: 'AGENT_AVAILABLE',
    agent: {
      id: agentMessage.agentId,
      name: agentMessage.agentName,
      emoji: agentMessage.emoji,
      role: agentMessage.role,
      capabilities: agentMessage.capabilities
    },
    sourceInstance: sourceInstanceId,
    timestamp: Date.now()
  };
  
  broadcastToAllInstances(availability, sourceInstanceId);
}

// Find instance that has a specific agent
function findInstanceWithAgent(agentId) {
  for (const [instanceId, session] of sessions.entries()) {
    if (session.registeredAgents && session.registeredAgents.has(agentId)) {
      return instanceId;
    }
  }
  return null;
}

// Broadcast message to all connected instances except source
function broadcastToAllInstances(message, excludeInstanceId = null) {
  connections.forEach((connection, instanceId) => {
    if (instanceId !== excludeInstanceId && connection.readyState === WebSocket.OPEN) {
      connection.send(JSON.stringify(message));
    }
  });
}

// Handle client disconnection
function handleDisconnect(instanceId) {
  logger.log(`Instance disconnected: ${instanceId}`);
  
  // Remove from active connections
  connections.delete(instanceId);
  
  // Update session but keep it for reconnection
  if (sessions.has(instanceId)) {
    const session = sessions.get(instanceId);
    session.disconnected = Date.now();
    session.connected = false;
  }
  
  // Save session state
  saveSessions();
}

// Setup periodic session cleanup
const CLEANUP_INTERVAL = 3600000; // 1 hour
setInterval(() => {
  const now = Date.now();
  const expireTime = now - (24 * 3600000); // 24 hours
  
  let expiredCount = 0;
  sessions.forEach((session, instanceId) => {
    // Remove sessions disconnected for more than 24 hours
    if (session.disconnected && session.disconnected < expireTime) {
      sessions.delete(instanceId);
      expiredCount++;
    }
  });
  
  if (expiredCount > 0) {
    logger.log(`Cleaned up ${expiredCount} expired sessions`);
    saveSessions();
  }
}, CLEANUP_INTERVAL);

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  // Generate unique instance ID
  const instanceId = uuidv4();
  
  logger.log(`New connection established: ${instanceId}`);
  
  // Add to connection pool
  connections.set(instanceId, ws);
  
  // Create or update session
  const session = {
    id: instanceId,
    connected: Date.now(),
    lastActivity: Date.now(),
    ip: req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    projectName: null, // Will be set by client
    agentActivity: new Map()
  };
  
  sessions.set(instanceId, session);
  
  // Send welcome message with instanceId
  ws.send(JSON.stringify({
    type: 'BRIDGE_CONNECTED',
    instanceId,
    message: 'Connected to PAIRED Agent Bridge',
    timestamp: Date.now()
  }));
  
  // Message handling
  ws.on('message', (message) => {
    handleMessage(instanceId, message);
  });
  
  // Disconnection handling
  ws.on('close', () => {
    handleDisconnect(instanceId);
  });
  
  // Error handling
  ws.on('error', (error) => {
    logger.error(`WebSocket error for ${instanceId}:`, error);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    connections: connections.size,
    sessions: sessions.size,
    uptime: process.uptime()
  });
});

// Status endpoint
app.get('/status', (req, res) => {
  const activeInstances = Array.from(sessions.entries())
    .filter(([_, session]) => !session.disconnected)
    .map(([id, session]) => ({
      id: id.substr(0, 8) + '...',
      connected: new Date(session.connected).toLocaleString(),
      lastActivity: new Date(session.lastActivity).toLocaleString(),
      projectName: session.projectName || 'Unknown',
      agents: Array.from(session.agentActivity.keys())
    }));
  
  res.send(`
    <html>
      <head>
        <title>PAIRED Cascade Bridge Status</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #0066cc; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background-color: #f2f2f2; }
          tr:nth-child(even) { background-color: #f9f9f9; }
        </style>
      </head>
      <body>
        <h1>PAIRED Cascade Bridge Status</h1>
        <p>Uptime: ${Math.floor(process.uptime() / 3600)} hours, ${Math.floor((process.uptime() % 3600) / 60)} minutes</p>
        <p>Active connections: ${connections.size}</p>
        <p>Total sessions: ${sessions.size}</p>
        
        <h2>Active Instances</h2>
        <table>
          <tr>
            <th>Instance ID</th>
            <th>Project</th>
            <th>Connected Since</th>
            <th>Last Activity</th>
            <th>Active Agents</th>
          </tr>
          ${activeInstances.map(instance => `
            <tr>
              <td>${instance.id}</td>
              <td>${instance.projectName}</td>
              <td>${instance.connected}</td>
              <td>${instance.lastActivity}</td>
              <td>${instance.agents.join(', ') || 'None'}</td>
            </tr>
          `).join('')}
        </table>
      </body>
    </html>
  `);
});

// Start the server
server.listen(port, () => {
  logger.log(`🌊 PAIRED Cascade Agent Bridge Service running on port ${port}`);
  logger.log(`🌐 Health check: http://localhost:${port}/health`);
  logger.log(`📊 Status page: http://localhost:${port}/status`);
  loadSessions();
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.log('Shutting down PAIRED Cascade Agent Bridge Service...');
  saveSessions();
  server.close(() => {
    logger.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  logger.log('Shutting down PAIRED Cascade Agent Bridge Service...');
  saveSessions();
  server.close(() => {
    logger.log('Server closed');
    process.exit(0);
  });
});
