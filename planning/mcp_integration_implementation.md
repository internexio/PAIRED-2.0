# MCP Integration Implementation Guide
## Bridge Implementation, Routing, and Monitoring Specifications

---

## Executive Summary

This document provides detailed implementation specifications for the Multi-Channel Protocol (MCP) integration in WEE V2.0, covering bridge implementation, intelligent routing, and comprehensive monitoring systems.

**Strategic Goal:** Robust, production-ready MCP bridge with intelligent routing and comprehensive monitoring.

---

## MCP Protocol Analysis

### **Core MCP Specifications**

#### **A. Message Format Standard**
```json
{
  "jsonrpc": "2.0",
  "id": "unique-message-id",
  "method": "wee/agent-request",
  "params": {
    "agent": "Alex",
    "message": "Review this code for potential issues",
    "context": {
      "file": "/path/to/file.js",
      "selection": { "start": 10, "end": 25 },
      "project": "my-project"
    },
    "session": {
      "id": "session-123",
      "timestamp": 1704067200000,
      "user": "developer@example.com"
    },
    "metadata": {
      "priority": "normal",
      "timeout": 30000,
      "routing_hint": "claude-code-preferred"
    }
  }
}
```

#### **B. Response Format Standard**
```json
{
  "jsonrpc": "2.0",
  "id": "unique-message-id",
  "result": {
    "agent": "Alex",
    "content": "I've reviewed your code and found 3 potential issues...",
    "actions": [
      {
        "type": "highlight",
        "range": { "start": 15, "end": 18 },
        "severity": "warning",
        "message": "Potential null pointer exception"
      }
    ],
    "metadata": {
      "tokens_used": 150,
      "processing_time": 2500,
      "confidence": 0.95,
      "follow_up_suggestions": ["Ask Sherlock for detailed testing", "Consult Edison for optimization"]
    }
  }
}
```

### **MCP Connection Management**

#### **A. Connection Lifecycle**
```javascript
// mcp-connection-manager.js
class MCPConnectionManager {
  constructor(config) {
    this.config = config;
    this.connections = new Map();
    this.connectionPool = new ConnectionPool();
    this.healthMonitor = new HealthMonitor();
    this.reconnectStrategy = new ReconnectStrategy();
    
    this.initializeConnectionManager();
  }
  
  async createConnection(targetId, connectionConfig) {
    const connection = new MCPConnection({
      target: targetId,
      protocol: 'jsonrpc-2.0',
      transport: connectionConfig.transport || 'websocket',
      authentication: await this.getAuthenticationToken(targetId),
      capabilities: this.negotiateCapabilities(connectionConfig.capabilities),
      heartbeat: {
        interval: 30000,
        timeout: 5000,
        maxMissed: 3
      }
    });
    
    // Set up connection event handlers
    this.setupConnectionHandlers(connection);
    
    // Establish connection
    await connection.connect();
    
    // Register connection
    this.connections.set(targetId, connection);
    this.connectionPool.add(connection);
    
    console.log(`✅ MCP connection established to ${targetId}`);
    return connection;
  }
  
  setupConnectionHandlers(connection) {
    connection.on('connected', () => {
      this.healthMonitor.markHealthy(connection.targetId);
    });
    
    connection.on('disconnected', (reason) => {
      console.log(`🔌 Connection lost to ${connection.targetId}: ${reason}`);
      this.handleDisconnection(connection, reason);
    });
    
    connection.on('error', (error) => {
      console.error(`❌ Connection error to ${connection.targetId}:`, error);
      this.healthMonitor.markUnhealthy(connection.targetId, error);
    });
    
    connection.on('message', (message) => {
      this.routeIncomingMessage(connection.targetId, message);
    });
  }
  
  async handleDisconnection(connection, reason) {
    // Remove from active connections
    this.connections.delete(connection.targetId);
    this.connectionPool.remove(connection);
    
    // Attempt reconnection based on strategy
    if (this.reconnectStrategy.shouldReconnect(reason)) {
      setTimeout(async () => {
        try {
          await this.reconnectToTarget(connection.targetId);
        } catch (error) {
          console.error(`Failed to reconnect to ${connection.targetId}:`, error);
        }
      }, this.reconnectStrategy.getDelay(connection.targetId));
    }
  }
}
```

#### **B. Authentication & Security**
```javascript
// mcp-authentication.js
class MCPAuthentication {
  constructor() {
    this.tokenCache = new Map();
    this.keyRotationSchedule = new Map();
    this.securityPolicy = new SecurityPolicy();
  }
  
  async getAuthenticationToken(targetId) {
    // Check cache first
    const cachedToken = this.tokenCache.get(targetId);
    if (cachedToken && !this.isTokenExpired(cachedToken)) {
      return cachedToken.token;
    }
    
    // Generate new token
    const token = await this.generateSecureToken(targetId);
    
    // Cache with expiration
    this.tokenCache.set(targetId, {
      token,
      expires: Date.now() + (55 * 60 * 1000), // 55 minutes
      targetId
    });
    
    // Schedule rotation
    this.scheduleTokenRotation(targetId);
    
    return token;
  }
  
  async generateSecureToken(targetId) {
    const payload = {
      iss: 'wee-bridge',
      aud: targetId,
      sub: 'agent-coordination',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
      capabilities: [
        'agent-messaging',
        'context-sharing',
        'session-sync',
        'token-tracking'
      ]
    };
    
    // Sign with rotating key
    const signingKey = await this.getCurrentSigningKey();
    return jwt.sign(payload, signingKey, { algorithm: 'RS256' });
  }
  
  async validateIncomingToken(token, expectedIssuer) {
    try {
      const publicKey = await this.getPublicKey(expectedIssuer);
      const decoded = jwt.verify(token, publicKey, { algorithm: 'RS256' });
      
      // Additional security checks
      if (!this.securityPolicy.isValidToken(decoded)) {
        throw new Error('Token fails security policy validation');
      }
      
      return decoded;
    } catch (error) {
      console.error('Token validation failed:', error);
      throw new Error('Invalid authentication token');
    }
  }
}
```

---

## Intelligent Routing Implementation

### **A. Advanced Routing Engine**
```javascript
// advanced-routing-engine.js
class AdvancedRoutingEngine {
  constructor() {
    this.routingRules = new RoutingRuleEngine();
    this.performanceAnalyzer = new PerformanceAnalyzer();
    this.loadBalancer = new IntelligentLoadBalancer();
    this.costOptimizer = new CostOptimizer();
    this.contextAnalyzer = new ContextAnalyzer();
    
    this.initializeRoutingEngine();
  }
  
  async determineOptimalRoute(request) {
    // Multi-factor routing analysis
    const analysis = await this.analyzeRequest(request);
    
    const routingFactors = {
      // Performance factors
      tokenCost: await this.costOptimizer.estimateCost(analysis),
      complexity: this.contextAnalyzer.assessComplexity(analysis),
      latencyRequirement: this.assessLatencyNeeds(analysis),
      
      // Availability factors
      targetAvailability: await this.checkTargetAvailability(),
      currentLoad: this.loadBalancer.getCurrentLoad(),
      
      // Context factors
      agentSpecialization: this.matchAgentSpecialization(analysis),
      sessionAffinity: this.checkSessionAffinity(analysis),
      
      // Historical factors
      historicalPerformance: await this.performanceAnalyzer.getHistoricalData(analysis),
      userPreferences: await this.getUserPreferences(analysis.userId)
    };
    
    // Apply routing decision matrix
    const routingDecision = await this.applyRoutingMatrix(routingFactors);
    
    // Log routing decision for analysis
    this.logRoutingDecision(analysis, routingFactors, routingDecision);
    
    return routingDecision;
  }
  
  async applyRoutingMatrix(factors) {
    // Priority 1: Cost optimization (if significant savings available)
    if (factors.tokenCost.potential_savings > 0.05) { // $0.05 threshold
      if (factors.targetAvailability.claudeCode > 0.95) {
        return {
          target: 'claude-code',
          reason: 'cost-optimization',
          confidence: 0.9,
          expectedSavings: factors.tokenCost.potential_savings
        };
      }
    }
    
    // Priority 2: Latency requirements
    if (factors.latencyRequirement === 'critical' && factors.latencyRequirement.threshold < 500) {
      return {
        target: 'windsurf-local',
        reason: 'latency-critical',
        confidence: 0.95,
        expectedLatency: factors.currentLoad.windsurf.avgResponseTime
      };
    }
    
    // Priority 3: Agent specialization matching
    if (factors.agentSpecialization.match_score > 0.8) {
      const optimalTarget = factors.agentSpecialization.optimal_platform;
      if (factors.targetAvailability[optimalTarget] > 0.9) {
        return {
          target: optimalTarget,
          reason: 'specialization-match',
          confidence: factors.agentSpecialization.match_score,
          agent: factors.agentSpecialization.recommended_agent
        };
      }
    }
    
    // Priority 4: Load balancing
    const leastLoadedTarget = this.loadBalancer.getLeastLoadedTarget();
    if (factors.currentLoad[leastLoadedTarget].utilization < 0.7) {
      return {
        target: leastLoadedTarget,
        reason: 'load-balancing',
        confidence: 0.7,
        currentLoad: factors.currentLoad[leastLoadedTarget].utilization
      };
    }
    
    // Priority 5: Session affinity
    if (factors.sessionAffinity.has_affinity) {
      return {
        target: factors.sessionAffinity.preferred_target,
        reason: 'session-affinity',
        confidence: 0.6,
        sessionId: factors.sessionAffinity.session_id
      };
    }
    
    // Default: Historical performance
    const bestPerformingTarget = factors.historicalPerformance.best_target;
    return {
      target: bestPerformingTarget,
      reason: 'historical-performance',
      confidence: 0.5,
      avgPerformance: factors.historicalPerformance.avg_score
    };
  }
}
```

### **B. Context-Aware Routing**
```javascript
// context-aware-router.js
class ContextAwareRouter {
  constructor() {
    this.contextPatterns = new Map();
    this.agentCapabilities = new Map();
    this.platformStrengths = new Map();
    
    this.initializeContextPatterns();
  }
  
  initializeContextPatterns() {
    // Code-related contexts
    this.contextPatterns.set('code-review', {
      optimal_agents: ['Sherlock', 'Edison'],
      preferred_platform: 'claude-code', // Better for code analysis
      token_intensity: 'high',
      complexity_factors: ['file_size', 'language_complexity', 'review_depth']
    });
    
    this.contextPatterns.set('code-generation', {
      optimal_agents: ['Edison', 'Leonardo'],
      preferred_platform: 'claude-code', // Better for generation
      token_intensity: 'very-high',
      complexity_factors: ['generation_length', 'framework_complexity', 'requirements_detail']
    });
    
    // Project management contexts
    this.contextPatterns.set('project-coordination', {
      optimal_agents: ['Alex', 'Vince'],
      preferred_platform: 'windsurf-local', // Faster for coordination
      token_intensity: 'medium',
      complexity_factors: ['team_size', 'project_scope', 'coordination_complexity']
    });
    
    // Analysis contexts
    this.contextPatterns.set('data-analysis', {
      optimal_agents: ['Marie', 'Sherlock'],
      preferred_platform: 'claude-code', // Better for complex analysis
      token_intensity: 'high',
      complexity_factors: ['data_size', 'analysis_depth', 'visualization_needs']
    });
    
    // UX/Design contexts
    this.contextPatterns.set('ux-design', {
      optimal_agents: ['Maya', 'Leonardo'],
      preferred_platform: 'windsurf-local', // Faster iteration for design
      token_intensity: 'medium',
      complexity_factors: ['design_complexity', 'user_research_depth', 'prototype_detail']
    });
  }
  
  async analyzeContext(request) {
    const context = request.params.context;
    const message = request.params.message;
    
    // Extract context signals
    const contextSignals = {
      // File-based signals
      fileType: this.extractFileType(context.file),
      fileSize: await this.getFileSize(context.file),
      projectType: await this.detectProjectType(context.project),
      
      // Content-based signals
      messageIntent: await this.classifyMessageIntent(message),
      complexityIndicators: this.extractComplexityIndicators(message),
      urgencyIndicators: this.extractUrgencyIndicators(message),
      
      // Session-based signals
      conversationHistory: await this.getConversationHistory(request.params.session.id),
      userPatterns: await this.getUserPatterns(request.params.session.user),
      
      // Agent-based signals
      mentionedAgents: this.extractMentionedAgents(message),
      requiredCapabilities: this.inferRequiredCapabilities(message, context)
    };
    
    return contextSignals;
  }
  
  async classifyMessageIntent(message) {
    // Use lightweight NLP for intent classification
    const intentPatterns = {
      'code-review': /review|check|analyze|examine|audit/i,
      'code-generation': /create|generate|build|implement|write/i,
      'debugging': /debug|fix|error|issue|problem/i,
      'explanation': /explain|how|why|what|understand/i,
      'optimization': /optimize|improve|performance|faster/i,
      'testing': /test|spec|unit|integration|coverage/i,
      'documentation': /document|comment|readme|guide/i,
      'coordination': /coordinate|plan|organize|schedule/i
    };
    
    const scores = {};
    for (const [intent, pattern] of Object.entries(intentPatterns)) {
      const matches = message.match(pattern);
      scores[intent] = matches ? matches.length : 0;
    }
    
    // Return highest scoring intent
    const topIntent = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)[0];
    
    return {
      primary_intent: topIntent[0],
      confidence: Math.min(topIntent[1] / 3, 1), // Normalize to 0-1
      all_scores: scores
    };
  }
}
```

---

## Comprehensive Monitoring System

### **A. Performance Monitoring**
```javascript
// performance-monitor.js
class PerformanceMonitor {
  constructor() {
    this.metrics = new MetricsCollector();
    this.alerting = new AlertingSystem();
    this.dashboard = new MonitoringDashboard();
    this.historicalData = new HistoricalDataStore();
    
    this.initializeMonitoring();
  }
  
  async trackRequest(requestId, routingDecision, startTime) {
    const tracker = {
      requestId,
      routingDecision,
      startTime,
      endTime: null,
      duration: null,
      success: null,
      errorDetails: null,
      tokenUsage: null,
      costSavings: null,
      userSatisfaction: null
    };
    
    // Store active tracking
    this.activeRequests.set(requestId, tracker);
    
    // Set up completion handler
    return {
      complete: (result) => this.completeTracking(requestId, result),
      error: (error) => this.errorTracking(requestId, error)
    };
  }
  
  completeTracking(requestId, result) {
    const tracker = this.activeRequests.get(requestId);
    if (!tracker) return;
    
    tracker.endTime = Date.now();
    tracker.duration = tracker.endTime - tracker.startTime;
    tracker.success = true;
    tracker.tokenUsage = result.metadata?.tokens_used || 0;
    tracker.costSavings = this.calculateActualSavings(tracker);
    
    // Update metrics
    this.metrics.recordSuccess(tracker);
    
    // Check for alerts
    this.checkPerformanceAlerts(tracker);
    
    // Store historical data
    this.historicalData.store(tracker);
    
    // Cleanup
    this.activeRequests.delete(requestId);
  }
  
  checkPerformanceAlerts(tracker) {
    // Response time alerts
    if (tracker.duration > 10000) { // 10 seconds
      this.alerting.sendAlert({
        type: 'performance',
        severity: 'warning',
        message: `Slow response detected: ${tracker.duration}ms for ${tracker.routingDecision.target}`,
        details: tracker
      });
    }
    
    // Cost efficiency alerts
    if (tracker.costSavings < 0) {
      this.alerting.sendAlert({
        type: 'cost',
        severity: 'info',
        message: `Routing decision resulted in higher cost: ${Math.abs(tracker.costSavings)}`,
        details: tracker
      });
    }
    
    // Success rate alerts
    const recentSuccessRate = this.metrics.getRecentSuccessRate(tracker.routingDecision.target);
    if (recentSuccessRate < 0.95) {
      this.alerting.sendAlert({
        type: 'reliability',
        severity: 'critical',
        message: `Success rate dropped to ${(recentSuccessRate * 100).toFixed(1)}% for ${tracker.routingDecision.target}`,
        details: { target: tracker.routingDecision.target, successRate: recentSuccessRate }
      });
    }
  }
}
```

### **B. Health Monitoring**
```javascript
// health-monitor.js
class HealthMonitor {
  constructor() {
    this.healthChecks = new Map();
    this.healthStatus = new Map();
    this.healthHistory = new Map();
    this.alertThresholds = new Map();
    
    this.initializeHealthChecks();
  }
  
  initializeHealthChecks() {
    // MCP connection health
    this.healthChecks.set('mcp-connection', {
      check: this.checkMCPConnection.bind(this),
      interval: 30000, // 30 seconds
      timeout: 5000,
      retries: 3
    });
    
    // Agent responsiveness
    this.healthChecks.set('agent-responsiveness', {
      check: this.checkAgentResponsiveness.bind(this),
      interval: 60000, // 1 minute
      timeout: 10000,
      retries: 2
    });
    
    // Token optimization effectiveness
    this.healthChecks.set('token-optimization', {
      check: this.checkTokenOptimization.bind(this),
      interval: 300000, // 5 minutes
      timeout: 15000,
      retries: 1
    });
    
    // System resource usage
    this.healthChecks.set('system-resources', {
      check: this.checkSystemResources.bind(this),
      interval: 60000, // 1 minute
      timeout: 5000,
      retries: 1
    });
    
    // Start all health checks
    this.startHealthChecks();
  }
  
  async checkMCPConnection() {
    const results = new Map();
    
    for (const [targetId, connection] of this.connections) {
      try {
        // Send ping message
        const pingStart = Date.now();
        await connection.ping();
        const pingTime = Date.now() - pingStart;
        
        results.set(targetId, {
          status: 'healthy',
          pingTime,
          lastSeen: Date.now()
        });
      } catch (error) {
        results.set(targetId, {
          status: 'unhealthy',
          error: error.message,
          lastSeen: this.healthStatus.get(targetId)?.lastSeen || 0
        });
      }
    }
    
    return results;
  }
  
  async checkAgentResponsiveness() {
    const testMessage = {
      agent: 'Alex',
      message: 'Health check - please respond with OK',
      context: { type: 'health-check' }
    };
    
    const results = new Map();
    
    for (const target of ['windsurf-local', 'claude-code']) {
      try {
        const startTime = Date.now();
        const response = await this.sendTestMessage(target, testMessage);
        const responseTime = Date.now() - startTime;
        
        results.set(target, {
          status: response.includes('OK') ? 'healthy' : 'degraded',
          responseTime,
          response: response.substring(0, 100) // Truncate for logging
        });
      } catch (error) {
        results.set(target, {
          status: 'unhealthy',
          error: error.message,
          responseTime: null
        });
      }
    }
    
    return results;
  }
  
  async checkTokenOptimization() {
    const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
    const optimizationStats = await this.getOptimizationStats(last24Hours);
    
    return {
      status: optimizationStats.savingsPercentage > 0.2 ? 'healthy' : 'degraded',
      savingsPercentage: optimizationStats.savingsPercentage,
      totalSavings: optimizationStats.totalSavings,
      requestsOptimized: optimizationStats.requestsOptimized,
      averageRoutingAccuracy: optimizationStats.averageRoutingAccuracy
    };
  }
}
```

### **C. Real-time Dashboard**
```javascript
// monitoring-dashboard.js
class MonitoringDashboard {
  constructor() {
    this.wsServer = new WebSocketServer({ port: 8080 });
    this.connectedClients = new Set();
    this.metricsBuffer = new CircularBuffer(1000);
    
    this.initializeDashboard();
  }
  
  initializeDashboard() {
    this.wsServer.on('connection', (ws) => {
      this.connectedClients.add(ws);
      
      // Send initial state
      ws.send(JSON.stringify({
        type: 'initial-state',
        data: this.getCurrentState()
      }));
      
      ws.on('close', () => {
        this.connectedClients.delete(ws);
      });
    });
    
    // Broadcast updates every 5 seconds
    setInterval(() => {
      this.broadcastUpdate();
    }, 5000);
  }
  
  getCurrentState() {
    return {
      timestamp: Date.now(),
      connections: this.getConnectionStatus(),
      performance: this.getPerformanceMetrics(),
      routing: this.getRoutingStats(),
      health: this.getHealthStatus(),
      costs: this.getCostMetrics()
    };
  }
  
  getPerformanceMetrics() {
    const last5Minutes = Date.now() - (5 * 60 * 1000);
    const recentMetrics = this.metricsBuffer.getItemsSince(last5Minutes);
    
    return {
      totalRequests: recentMetrics.length,
      averageResponseTime: this.calculateAverage(recentMetrics, 'duration'),
      successRate: this.calculateSuccessRate(recentMetrics),
      throughput: recentMetrics.length / 5, // requests per minute
      byTarget: this.groupMetricsByTarget(recentMetrics)
    };
  }
  
  getRoutingStats() {
    const last1Hour = Date.now() - (60 * 60 * 1000);
    const recentRouting = this.metricsBuffer.getItemsSince(last1Hour);
    
    const routingReasons = {};
    const targetDistribution = {};
    
    for (const metric of recentRouting) {
      const reason = metric.routingDecision.reason;
      const target = metric.routingDecision.target;
      
      routingReasons[reason] = (routingReasons[reason] || 0) + 1;
      targetDistribution[target] = (targetDistribution[target] || 0) + 1;
    }
    
    return {
      routingReasons,
      targetDistribution,
      routingAccuracy: this.calculateRoutingAccuracy(recentRouting)
    };
  }
}
```

---

## Implementation Checklist

### **Phase 1: Core MCP Implementation (Week 9)**
- [ ] **MCP Connection Manager** - Connection lifecycle, authentication, security
- [ ] **Message Format Handlers** - JSON-RPC 2.0 compliance, validation
- [ ] **Basic Routing Engine** - Simple routing decisions based on cost/availability
- [ ] **Error Handling** - Connection failures, message timeouts, fallback mechanisms

### **Phase 2: Advanced Routing (Week 10)**
- [ ] **Context-Aware Router** - Intent classification, complexity analysis
- [ ] **Performance Analyzer** - Historical data, optimization recommendations
- [ ] **Load Balancer** - Intelligent distribution across targets
- [ ] **Cost Optimizer** - Real-time cost calculation and savings tracking

### **Phase 3: Monitoring System (Week 11)**
- [ ] **Performance Monitor** - Request tracking, metrics collection
- [ ] **Health Monitor** - Connection health, agent responsiveness
- [ ] **Alerting System** - Performance alerts, health notifications
- [ ] **Real-time Dashboard** - WebSocket-based monitoring interface

### **Phase 4: Production Readiness (Week 12)**
- [ ] **Security Hardening** - Token rotation, encryption, audit logging
- [ ] **Scalability Testing** - Load testing, connection pooling optimization
- [ ] **Documentation** - API documentation, troubleshooting guides
- [ ] **Deployment Automation** - Configuration management, service orchestration

This implementation guide provides the technical foundation for a robust, production-ready MCP bridge with intelligent routing and comprehensive monitoring capabilities.
