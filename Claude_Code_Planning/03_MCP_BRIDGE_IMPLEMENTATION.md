# 🌉 MCP Bridge Implementation
*Detailed Implementation Guide for Windsurf ↔ Claude Code Communication*

## 🎯 **MCP Bridge Overview**

The MCP (Model Context Protocol) Bridge enables seamless communication between Windsurf and Claude Code, implementing intelligent token optimization and agent coordination across platforms.

### **Core Architecture**
```typescript
interface MCPBridgeArchitecture {
  // Bridge components
  bridgeCore: {
    'mcp-client': 'Standards-compliant MCP protocol client';
    'intelligent-router': 'AI-powered routing decision engine';
    'token-optimizer': 'Real-time token usage optimization';
    'session-synchronizer': 'Cross-platform state management';
  };
  
  // Communication patterns
  communicationPatterns: {
    'request-response': 'Synchronous agent requests';
    'event-streaming': 'Real-time event notifications';
    'batch-processing': 'Efficient bulk operations';
    'heartbeat-monitoring': 'Connection health monitoring';
  };
}
```

## 🔧 **Core Implementation**

### **1. MCP Bridge Service (Main Entry Point)**
```javascript
// src/mcp-bridge/bridge-service.js
const EventEmitter = require('events');
const { MCPClient } = require('@modelcontextprotocol/client');
const IntelligentRouter = require('./intelligent-router');
const TokenOptimizer = require('./token-optimizer');
const SessionSynchronizer = require('./session-synchronizer');
const AgentBridge = require('../core/agent-bridge'); // From PAIRED 1.0

class MCPBridgeService extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      claudeCodeEndpoint: 'ws://localhost:8081',
      windsurfEndpoint: 'ws://localhost:8080',
      heartbeatInterval: 5000,
      reconnectAttempts: 5,
      tokenOptimizationEnabled: true,
      ...config
    };
    
    // Core components
    this.mcpClient = new MCPClient(this.config.claudeCodeEndpoint);
    this.router = new IntelligentRouter(this.config);
    this.tokenOptimizer = new TokenOptimizer(this.config);
    this.sessionSync = new SessionSynchronizer(this.config);
    
    // PAIRED 1.0 integration
    this.agentBridge = new AgentBridge(this.config);
    
    // State management
    this.isConnected = false;
    this.connectionStatus = {
      claudeCode: 'disconnected',
      windsurf: 'disconnected'
    };
    
    this.initialize();
  }
  
  async initialize() {
    try {
      // Initialize components
      await this.initializeConnections();
      await this.setupEventHandlers();
      await this.startHealthMonitoring();
      
      console.log('🌉 MCP Bridge Service initialized successfully');
      this.emit('ready');
      
    } catch (error) {
      console.error('❌ MCP Bridge initialization failed:', error);
      this.emit('error', error);
    }
  }
  
  async initializeConnections() {
    // Connect to Claude Code
    try {
      await this.mcpClient.connect();
      this.connectionStatus.claudeCode = 'connected';
      console.log('✅ Claude Code connection established');
    } catch (error) {
      console.warn('⚠️ Claude Code connection failed, will retry:', error.message);
    }
    
    // Connect to Windsurf (via existing PAIRED 1.0 bridge)
    try {
      await this.agentBridge.connect();
      this.connectionStatus.windsurf = 'connected';
      console.log('✅ Windsurf connection established');
    } catch (error) {
      console.warn('⚠️ Windsurf connection failed, will retry:', error.message);
    }
    
    this.isConnected = this.connectionStatus.claudeCode === 'connected' || 
                      this.connectionStatus.windsurf === 'connected';
  }
  
  async routeAgentRequest(agentName, request, context = {}) {
    try {
      // Get routing decision
      const routingDecision = await this.router.determineRoute({
        agent: agentName,
        request: request,
        context: context,
        quotaStatus: await this.tokenOptimizer.getQuotaStatus(),
        connectionStatus: this.connectionStatus
      });
      
      console.log(`🎯 Routing ${agentName} request to: ${routingDecision.target}`);
      
      // Execute based on routing decision
      let response;
      switch (routingDecision.target) {
        case 'claude-code':
          response = await this.executeOnClaudeCode(agentName, request, context);
          break;
        case 'windsurf':
          response = await this.executeOnWindsurf(agentName, request, context);
          break;
        case 'hybrid':
          response = await this.executeHybrid(agentName, request, context);
          break;
        default:
          response = await this.executeFallback(agentName, request, context);
      }
      
      // Track token usage
      if (response.tokenUsage) {
        await this.tokenOptimizer.recordUsage(routingDecision.target, response.tokenUsage);
      }
      
      // Synchronize session state
      await this.sessionSync.updateState(agentName, response);
      
      return response;
      
    } catch (error) {
      console.error(`❌ Agent request routing failed for ${agentName}:`, error);
      return await this.executeFallback(agentName, request, context);
    }
  }
  
  async executeOnClaudeCode(agentName, request, context) {
    if (this.connectionStatus.claudeCode !== 'connected') {
      throw new Error('Claude Code not available');
    }
    
    // Prepare MCP message
    const mcpMessage = {
      id: require('uuid').v4(),
      method: 'agent.execute',
      params: {
        agent: agentName,
        request: request,
        context: this.prepareClaudeContext(context)
      }
    };
    
    // Send via MCP client
    const response = await this.mcpClient.request(mcpMessage);
    
    return {
      success: true,
      result: response.result,
      tokenUsage: response.tokenUsage,
      platform: 'claude-code',
      timestamp: Date.now()
    };
  }
  
  async executeOnWindsurf(agentName, request, context) {
    if (this.connectionStatus.windsurf !== 'connected') {
      throw new Error('Windsurf not available');
    }
    
    // Use existing PAIRED 1.0 agent bridge
    const response = await this.agentBridge.sendMessage({
      agent: agentName,
      action: 'execute',
      payload: {
        request: request,
        context: context
      }
    });
    
    return {
      success: true,
      result: response.result,
      tokenUsage: response.tokenUsage || { tokens: 0, cost: 0 },
      platform: 'windsurf',
      timestamp: Date.now()
    };
  }
  
  async executeHybrid(agentName, request, context) {
    // Execute on both platforms and combine results
    const [claudeResponse, windsurfResponse] = await Promise.allSettled([
      this.executeOnClaudeCode(agentName, request, context),
      this.executeOnWindsurf(agentName, request, context)
    ]);
    
    // Combine successful responses
    const combinedResult = this.combineResponses(claudeResponse, windsurfResponse);
    
    return {
      success: true,
      result: combinedResult,
      tokenUsage: this.calculateCombinedTokenUsage(claudeResponse, windsurfResponse),
      platform: 'hybrid',
      timestamp: Date.now()
    };
  }
  
  async executeFallback(agentName, request, context) {
    // Try available platforms in order of preference
    const platforms = ['windsurf', 'claude-code'];
    
    for (const platform of platforms) {
      try {
        if (platform === 'windsurf' && this.connectionStatus.windsurf === 'connected') {
          return await this.executeOnWindsurf(agentName, request, context);
        } else if (platform === 'claude-code' && this.connectionStatus.claudeCode === 'connected') {
          return await this.executeOnClaudeCode(agentName, request, context);
        }
      } catch (error) {
        console.warn(`⚠️ Fallback attempt on ${platform} failed:`, error.message);
        continue;
      }
    }
    
    // All platforms failed
    return {
      success: false,
      error: 'All platforms unavailable',
      platform: 'none',
      timestamp: Date.now()
    };
  }
  
  prepareClaudeContext(context) {
    // Optimize context for Claude Code
    return {
      ...context,
      // Add Claude-specific optimizations
      maxTokens: context.maxTokens || 4000,
      temperature: context.temperature || 0.7,
      // Compress large context if needed
      compressedHistory: this.compressConversationHistory(context.history)
    };
  }
  
  compressConversationHistory(history) {
    if (!history || history.length <= 10) return history;
    
    // Keep first 3 and last 7 messages, summarize middle
    const start = history.slice(0, 3);
    const end = history.slice(-7);
    const middle = history.slice(3, -7);
    
    if (middle.length === 0) return [...start, ...end];
    
    const summary = {
      role: 'system',
      content: `[Summarized ${middle.length} messages: ${this.summarizeMessages(middle)}]`
    };
    
    return [...start, summary, ...end];
  }
  
  summarizeMessages(messages) {
    // Simple summarization - could be enhanced with AI
    const topics = messages.map(msg => msg.content.substring(0, 50)).join(', ');
    return `Discussion topics: ${topics}`;
  }
  
  combineResponses(claudeResponse, windsurfResponse) {
    const results = [];
    
    if (claudeResponse.status === 'fulfilled') {
      results.push({
        platform: 'claude-code',
        result: claudeResponse.value.result
      });
    }
    
    if (windsurfResponse.status === 'fulfilled') {
      results.push({
        platform: 'windsurf',
        result: windsurfResponse.value.result
      });
    }
    
    return {
      combined: true,
      results: results,
      summary: this.generateCombinedSummary(results)
    };
  }
  
  generateCombinedSummary(results) {
    if (results.length === 0) return 'No results available';
    if (results.length === 1) return results[0].result;
    
    return `Combined insights from ${results.length} platforms:\n` +
           results.map((r, i) => `${i + 1}. ${r.platform}: ${r.result}`).join('\n');
  }
  
  calculateCombinedTokenUsage(claudeResponse, windsurfResponse) {
    let totalTokens = 0;
    let totalCost = 0;
    
    if (claudeResponse.status === 'fulfilled' && claudeResponse.value.tokenUsage) {
      totalTokens += claudeResponse.value.tokenUsage.tokens || 0;
      totalCost += claudeResponse.value.tokenUsage.cost || 0;
    }
    
    if (windsurfResponse.status === 'fulfilled' && windsurfResponse.value.tokenUsage) {
      totalTokens += windsurfResponse.value.tokenUsage.tokens || 0;
      totalCost += windsurfResponse.value.tokenUsage.cost || 0;
    }
    
    return { tokens: totalTokens, cost: totalCost };
  }
  
  setupEventHandlers() {
    // MCP Client events
    this.mcpClient.on('connect', () => {
      this.connectionStatus.claudeCode = 'connected';
      console.log('🔗 Claude Code MCP connection established');
      this.emit('claude-connected');
    });
    
    this.mcpClient.on('disconnect', () => {
      this.connectionStatus.claudeCode = 'disconnected';
      console.log('🔌 Claude Code MCP connection lost');
      this.emit('claude-disconnected');
    });
    
    this.mcpClient.on('error', (error) => {
      console.error('❌ Claude Code MCP error:', error);
      this.emit('claude-error', error);
    });
    
    // Agent Bridge events (PAIRED 1.0)
    this.agentBridge.on('connected', () => {
      this.connectionStatus.windsurf = 'connected';
      console.log('🔗 Windsurf connection established');
      this.emit('windsurf-connected');
    });
    
    this.agentBridge.on('disconnected', () => {
      this.connectionStatus.windsurf = 'disconnected';
      console.log('🔌 Windsurf connection lost');
      this.emit('windsurf-disconnected');
    });
    
    // Token optimization events
    this.tokenOptimizer.on('quota-warning', (data) => {
      console.warn('⚠️ Token quota warning:', data);
      this.emit('quota-warning', data);
    });
    
    this.tokenOptimizer.on('quota-exceeded', (data) => {
      console.error('🚨 Token quota exceeded:', data);
      this.emit('quota-exceeded', data);
    });
  }
  
  async startHealthMonitoring() {
    setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('❌ Health check failed:', error);
      }
    }, this.config.heartbeatInterval);
  }
  
  async performHealthCheck() {
    // Check Claude Code connection
    if (this.connectionStatus.claudeCode === 'connected') {
      try {
        await this.mcpClient.ping();
      } catch (error) {
        this.connectionStatus.claudeCode = 'disconnected';
        console.warn('⚠️ Claude Code health check failed, attempting reconnect');
        this.attemptReconnect('claude-code');
      }
    }
    
    // Check Windsurf connection
    if (this.connectionStatus.windsurf === 'connected') {
      try {
        await this.agentBridge.ping();
      } catch (error) {
        this.connectionStatus.windsurf = 'disconnected';
        console.warn('⚠️ Windsurf health check failed, attempting reconnect');
        this.attemptReconnect('windsurf');
      }
    }
    
    // Update overall connection status
    this.isConnected = this.connectionStatus.claudeCode === 'connected' || 
                      this.connectionStatus.windsurf === 'connected';
  }
  
  async attemptReconnect(platform) {
    try {
      if (platform === 'claude-code') {
        await this.mcpClient.connect();
        this.connectionStatus.claudeCode = 'connected';
        console.log('✅ Claude Code reconnected successfully');
      } else if (platform === 'windsurf') {
        await this.agentBridge.connect();
        this.connectionStatus.windsurf = 'connected';
        console.log('✅ Windsurf reconnected successfully');
      }
    } catch (error) {
      console.error(`❌ Reconnection failed for ${platform}:`, error.message);
    }
  }
  
  // Public API methods
  async getStatus() {
    return {
      isConnected: this.isConnected,
      connections: this.connectionStatus,
      tokenUsage: await this.tokenOptimizer.getUsageStats(),
      uptime: process.uptime(),
      timestamp: Date.now()
    };
  }
  
  async shutdown() {
    console.log('🔄 Shutting down MCP Bridge Service...');
    
    try {
      await this.mcpClient.disconnect();
      await this.agentBridge.disconnect();
      console.log('✅ MCP Bridge Service shutdown complete');
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }
}

module.exports = MCPBridgeService;
```

### **2. Intelligent Router Implementation**
```javascript
// src/mcp-bridge/intelligent-router.js
class IntelligentRouter {
  constructor(config = {}) {
    this.config = {
      tokenCostThreshold: 1000, // Route to Claude Code if > 1000 tokens
      complexityThreshold: 0.7,  // Route to Claude Code if complexity > 0.7
      claudeCodePreference: 0.6, // Slight preference for Claude Code
      ...config
    };
    
    this.routingHistory = [];
    this.performanceMetrics = new Map();
  }
  
  async determineRoute(request) {
    const {
      agent,
      request: requestContent,
      context,
      quotaStatus,
      connectionStatus
    } = request;
    
    // Check connection availability
    const availablePlatforms = this.getAvailablePlatforms(connectionStatus);
    if (availablePlatforms.length === 0) {
      return { target: 'fallback', reason: 'No platforms available' };
    }
    
    // Analyze request characteristics
    const analysis = this.analyzeRequest(agent, requestContent, context);
    
    // Make routing decision
    const decision = this.makeRoutingDecision(analysis, quotaStatus, availablePlatforms);
    
    // Record decision for learning
    this.recordRoutingDecision(request, analysis, decision);
    
    return decision;
  }
  
  getAvailablePlatforms(connectionStatus) {
    const platforms = [];
    if (connectionStatus.claudeCode === 'connected') platforms.push('claude-code');
    if (connectionStatus.windsurf === 'connected') platforms.push('windsurf');
    return platforms;
  }
  
  analyzeRequest(agent, requestContent, context) {
    return {
      agent: agent,
      tokenEstimate: this.estimateTokenUsage(requestContent, context),
      complexity: this.calculateComplexity(requestContent, context),
      agentPreference: this.getAgentPreference(agent),
      contextSize: this.calculateContextSize(context),
      requestType: this.classifyRequestType(requestContent)
    };
  }
  
  estimateTokenUsage(requestContent, context) {
    // Simple token estimation - could be enhanced with tiktoken
    const contentLength = JSON.stringify({ requestContent, context }).length;
    return Math.ceil(contentLength / 4); // Rough estimate: 4 chars per token
  }
  
  calculateComplexity(requestContent, context) {
    let complexity = 0;
    
    // Length-based complexity
    complexity += Math.min(requestContent.length / 1000, 0.3);
    
    // Keyword-based complexity
    const complexKeywords = [
      'analyze', 'refactor', 'optimize', 'architecture', 'design',
      'strategy', 'plan', 'research', 'investigate', 'debug'
    ];
    
    const keywordMatches = complexKeywords.filter(keyword => 
      requestContent.toLowerCase().includes(keyword)
    ).length;
    
    complexity += Math.min(keywordMatches * 0.1, 0.4);
    
    // Context complexity
    if (context && context.codeFiles) {
      complexity += Math.min(context.codeFiles.length * 0.05, 0.3);
    }
    
    return Math.min(complexity, 1.0);
  }
  
  getAgentPreference(agent) {
    // Agent-specific platform preferences
    const preferences = {
      'alex-pm': { 'claude-code': 0.8, 'windsurf': 0.2 },      // Strategic thinking
      'sherlock-qa': { 'claude-code': 0.7, 'windsurf': 0.3 },  // Deep analysis
      'leonardo-arch': { 'claude-code': 0.9, 'windsurf': 0.1 }, // Architecture
      'edison-dev': { 'claude-code': 0.6, 'windsurf': 0.4 },   // Development
      'maya-ux': { 'claude-code': 0.8, 'windsurf': 0.2 },      // UX analysis
      'vince-scrum': { 'claude-code': 0.5, 'windsurf': 0.5 },  // Process
      'marie-analyst': { 'claude-code': 0.9, 'windsurf': 0.1 } // Research
    };
    
    return preferences[agent] || { 'claude-code': 0.6, 'windsurf': 0.4 };
  }
  
  calculateContextSize(context) {
    if (!context) return 0;
    return JSON.stringify(context).length;
  }
  
  classifyRequestType(requestContent) {
    const content = requestContent.toLowerCase();
    
    if (content.includes('generate') || content.includes('create') || content.includes('write')) {
      return 'generation';
    } else if (content.includes('analyze') || content.includes('review') || content.includes('investigate')) {
      return 'analysis';
    } else if (content.includes('refactor') || content.includes('optimize') || content.includes('improve')) {
      return 'optimization';
    } else if (content.includes('plan') || content.includes('strategy') || content.includes('roadmap')) {
      return 'planning';
    } else {
      return 'general';
    }
  }
  
  makeRoutingDecision(analysis, quotaStatus, availablePlatforms) {
    let scores = {};
    
    // Initialize scores for available platforms
    availablePlatforms.forEach(platform => {
      scores[platform] = 0;
    });
    
    // Token usage consideration
    if (analysis.tokenEstimate > this.config.tokenCostThreshold) {
      if (scores['claude-code'] !== undefined) scores['claude-code'] += 0.3;
    } else {
      if (scores['windsurf'] !== undefined) scores['windsurf'] += 0.2;
    }
    
    // Complexity consideration
    if (analysis.complexity > this.config.complexityThreshold) {
      if (scores['claude-code'] !== undefined) scores['claude-code'] += 0.4;
    } else {
      if (scores['windsurf'] !== undefined) scores['windsurf'] += 0.3;
    }
    
    // Agent preference
    const agentPref = analysis.agentPreference;
    Object.keys(agentPref).forEach(platform => {
      if (scores[platform] !== undefined) {
        scores[platform] += agentPref[platform] * 0.3;
      }
    });
    
    // Quota status consideration
    if (quotaStatus && quotaStatus.claudeCode && quotaStatus.claudeCode.remaining < 0.1) {
      // Claude Code quota low, prefer Windsurf
      if (scores['windsurf'] !== undefined) scores['windsurf'] += 0.5;
      if (scores['claude-code'] !== undefined) scores['claude-code'] -= 0.3;
    }
    
    // Request type consideration
    const typePreferences = {
      'generation': { 'claude-code': 0.3, 'windsurf': 0.1 },
      'analysis': { 'claude-code': 0.4, 'windsurf': 0.2 },
      'optimization': { 'claude-code': 0.3, 'windsurf': 0.2 },
      'planning': { 'claude-code': 0.4, 'windsurf': 0.1 },
      'general': { 'claude-code': 0.2, 'windsurf': 0.2 }
    };
    
    const typePref = typePreferences[analysis.requestType] || typePreferences['general'];
    Object.keys(typePref).forEach(platform => {
      if (scores[platform] !== undefined) {
        scores[platform] += typePref[platform];
      }
    });
    
    // Determine best platform
    const bestPlatform = Object.keys(scores).reduce((a, b) => 
      scores[a] > scores[b] ? a : b
    );
    
    // Check for hybrid execution
    const scoreDifference = Math.abs(scores['claude-code'] - scores['windsurf']);
    const shouldUseHybrid = scoreDifference < 0.2 && 
                           availablePlatforms.length === 2 && 
                           analysis.complexity > 0.8;
    
    return {
      target: shouldUseHybrid ? 'hybrid' : bestPlatform,
      confidence: Math.max(...Object.values(scores)),
      scores: scores,
      reason: this.generateRoutingReason(analysis, scores, shouldUseHybrid)
    };
  }
  
  generateRoutingReason(analysis, scores, isHybrid) {
    if (isHybrid) {
      return 'High complexity request benefits from hybrid execution';
    }
    
    const winner = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    const factors = [];
    
    if (analysis.tokenEstimate > this.config.tokenCostThreshold) {
      factors.push('high token usage');
    }
    if (analysis.complexity > this.config.complexityThreshold) {
      factors.push('high complexity');
    }
    
    return `Routed to ${winner} based on: ${factors.join(', ') || 'general optimization'}`;
  }
  
  recordRoutingDecision(request, analysis, decision) {
    const record = {
      timestamp: Date.now(),
      agent: request.agent,
      analysis: analysis,
      decision: decision,
      requestHash: this.hashRequest(request.request)
    };
    
    this.routingHistory.push(record);
    
    // Keep only last 1000 decisions
    if (this.routingHistory.length > 1000) {
      this.routingHistory = this.routingHistory.slice(-1000);
    }
  }
  
  hashRequest(request) {
    // Simple hash for request deduplication
    return require('crypto')
      .createHash('md5')
      .update(JSON.stringify(request))
      .digest('hex')
      .substring(0, 8);
  }
  
  // Analytics and optimization methods
  getRoutingStats() {
    const stats = {
      totalDecisions: this.routingHistory.length,
      platformDistribution: {},
      agentDistribution: {},
      averageComplexity: 0,
      averageTokenEstimate: 0
    };
    
    if (this.routingHistory.length === 0) return stats;
    
    // Calculate distributions
    this.routingHistory.forEach(record => {
      // Platform distribution
      const platform = record.decision.target;
      stats.platformDistribution[platform] = (stats.platformDistribution[platform] || 0) + 1;
      
      // Agent distribution
      const agent = record.agent;
      stats.agentDistribution[agent] = (stats.agentDistribution[agent] || 0) + 1;
      
      // Averages
      stats.averageComplexity += record.analysis.complexity;
      stats.averageTokenEstimate += record.analysis.tokenEstimate;
    });
    
    stats.averageComplexity /= this.routingHistory.length;
    stats.averageTokenEstimate /= this.routingHistory.length;
    
    return stats;
  }
}

module.exports = IntelligentRouter;
```

## 🔧 **Usage Examples**

### **Basic Bridge Setup**
```javascript
// Example: Setting up the MCP Bridge
const MCPBridgeService = require('./src/mcp-bridge/bridge-service');

const bridge = new MCPBridgeService({
  claudeCodeEndpoint: 'ws://localhost:8081',
  windsurfEndpoint: 'ws://localhost:8080',
  tokenOptimizationEnabled: true
});

// Handle events
bridge.on('ready', () => {
  console.log('🌉 MCP Bridge is ready for agent requests');
});

bridge.on('quota-warning', (data) => {
  console.warn('⚠️ Token quota warning:', data);
});

// Route an agent request
async function routeAgentRequest() {
  const response = await bridge.routeAgentRequest('edison-dev', 
    'Analyze this code for performance issues', 
    {
      codeFiles: ['src/app.js', 'src/utils.js'],
      maxTokens: 2000
    }
  );
  
  console.log('Agent response:', response);
}
```

### **Agent-Specific Routing**
```javascript
// Example: Agent-specific routing patterns
const agentRequests = [
  {
    agent: 'leonardo-arch',
    request: 'Design a scalable microservices architecture',
    expectedRoute: 'claude-code' // High complexity, strategic thinking
  },
  {
    agent: 'edison-dev',
    request: 'Run unit tests',
    expectedRoute: 'windsurf' // Simple execution task
  },
  {
    agent: 'sherlock-qa',
    request: 'Perform comprehensive security audit',
    expectedRoute: 'hybrid' // Benefits from both platforms
  }
];

// Process requests
for (const req of agentRequests) {
  const response = await bridge.routeAgentRequest(req.agent, req.request);
  console.log(`${req.agent} routed to: ${response.platform}`);
}
```

---

**The MCP Bridge Implementation provides intelligent, token-optimized routing between Windsurf and Claude Code while maintaining seamless agent coordination and robust error handling.**

*Intelligent routing + token optimization + seamless experience = optimal cross-platform agent coordination.*
