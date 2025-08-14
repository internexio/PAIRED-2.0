#!/usr/bin/env node

/**
 * PAIRED (Platform for AI-Enabled Remote Development) Claude Code Orchestrator
 * 
 * Core orchestration system that routes operations between Windsurf and Claude Code
 * to optimize token usage and improve response times.
 * 
 * Philosophy: "Surgical Precision Over Brute Force"
 * - Route simple operations to Claude Code for token savings
 * - Keep complex reasoning in Windsurf for quality
 * - Learn and adapt routing decisions over time
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const EventEmitter = require('events');

const execAsync = promisify(exec);

class ClaudeCodeOrchestrator extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      tokenThreshold: config.tokenThreshold || 100,
      complexityThreshold: config.complexityThreshold || 3,
      cacheTimeout: config.cacheTimeout || 5 * 60 * 1000, // 5 minutes default
      maxRetries: config.maxRetries || 3,
      // Intelligent cache timeouts by operation type
      cacheTimeouts: {
        'file-read': 2 * 60 * 1000,      // 2 minutes - files change frequently
        'directory-list': 30 * 1000,     // 30 seconds - directories change often
        'git-status': 10 * 1000,         // 10 seconds - git state changes rapidly
        'search-files': 5 * 60 * 1000,   // 5 minutes - search results more stable
        'template-generate': 10 * 60 * 1000, // 10 minutes - templates rarely change
        'default': 5 * 60 * 1000         // 5 minutes fallback
      },
      ...config
    };
    
    this.operationCache = new Map();
    this.tokenTracker = new TokenTracker();
    this.performanceMetrics = new PerformanceMetrics();
    this.routingRules = new Map();
    
    this.initializeRoutingRules();
  }
  
  /**
   * Initialize default routing rules for different operation types
   */
  initializeRoutingRules() {
    // Claude Code operations - simple, deterministic
    this.routingRules.set('claude-code', new Set([
      'file-read',
      'file-write', 
      'file-exists',
      'directory-list',
      'git-status',
      'git-add',
      'git-commit',
      'search-files',
      'replace-text',
      'template-generate',
      'json-parse',
      'csv-process',
      'log-analyze'
    ]));
    
    // Windsurf operations - complex reasoning required
    this.routingRules.set('windsurf', new Set([
      'code-review',
      'architecture-design',
      'bug-analysis',
      'refactor-complex',
      'algorithm-optimize',
      'security-audit',
      'performance-analyze',
      'design-pattern',
      'test-strategy',
      'documentation-write'
    ]));
    
    // Hybrid operations - may use both systems
    this.routingRules.set('hybrid', new Set([
      'code-generate',
      'test-generate',
      'config-update',
      'migration-script',
      'deployment-script'
    ]));
  }
  
  /**
   * Main orchestration method - routes operations intelligently
   */
  async orchestrate(operation, context = {}) {
    const startTime = Date.now();
    const operationId = this.generateOperationId();
    
    try {
      console.log(`🎭 Orchestrating operation: ${operation.type} (${operationId})`);
      
      // Analyze operation and determine routing
      const analysis = await this.analyzeOperation(operation, context);
      const routing = this.determineRouting(analysis);
      
      console.log(`📍 Routing decision: ${routing.strategy} (confidence: ${routing.confidence})`);
      
      // Execute based on routing strategy
      let result;
      switch (routing.strategy) {
        case 'claude-code':
          result = await this.executeViaClaude(operation, context, routing);
          break;
        case 'windsurf':
          result = await this.executeViaWindsurf(operation, context, routing);
          break;
        case 'hybrid':
          result = await this.executeHybrid(operation, context, routing);
          break;
        default:
          throw new Error(`Unknown routing strategy: ${routing.strategy}`);
      }
      
      // Record performance metrics
      const duration = Date.now() - startTime;
      await this.recordMetrics(operationId, operation, routing, result, duration);
      
      return {
        success: true,
        result,
        routing: routing.strategy,
        duration,
        tokensSaved: routing.estimatedTokenSavings || 0,
        operationId
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Orchestration failed for ${operationId}:`, error.message);
      
      await this.recordError(operationId, operation, error, duration);
      
      return {
        success: false,
        error: error.message,
        operationId,
        duration,
        fallbackSuggestion: this.suggestFallback(operation, error)
      };
    }
  }
  
  /**
   * Analyze operation to determine complexity and requirements
   */
  async analyzeOperation(operation, context) {
    const analysis = {
      type: operation.type,
      complexity: this.calculateComplexity(operation, context),
      tokenEstimate: this.estimateTokenUsage(operation, context),
      dependencies: this.identifyDependencies(operation, context),
      riskLevel: this.assessRisk(operation, context),
      cacheability: this.assessCacheability(operation, context)
    };
    
    // Add context-specific factors
    if (context.files) {
      analysis.fileCount = context.files.length;
      analysis.totalSize = context.files.reduce((sum, f) => sum + (f.size || 0), 0);
    }
    
    if (context.urgency) {
      analysis.urgency = context.urgency;
    }
    
    return analysis;
  }
  
  /**
   * Determine optimal routing strategy based on analysis
   */
  determineRouting(analysis) {
    let strategy = 'windsurf'; // Default to Windsurf for safety
    let confidence = 0.5;
    let reasoning = 'Default routing to Windsurf';
    let estimatedTokenSavings = 0;
    
    // Check if operation is explicitly categorized
    if (this.routingRules.get('claude-code').has(analysis.type)) {
      if (analysis.complexity <= this.config.complexityThreshold) {
        strategy = 'claude-code';
        confidence = 0.9;
        reasoning = 'Simple operation suitable for Claude Code';
        estimatedTokenSavings = analysis.tokenEstimate * 0.8; // 80% savings
      }
    } else if (this.routingRules.get('windsurf').has(analysis.type)) {
      strategy = 'windsurf';
      confidence = 0.9;
      reasoning = 'Complex operation requires Windsurf reasoning';
    } else if (this.routingRules.get('hybrid').has(analysis.type)) {
      strategy = 'hybrid';
      confidence = 0.7;
      reasoning = 'Operation benefits from hybrid approach';
      estimatedTokenSavings = analysis.tokenEstimate * 0.4; // 40% savings
    }
    
    // Apply additional heuristics
    if (analysis.tokenEstimate < this.config.tokenThreshold) {
      // Very small operations - prefer Claude Code
      if (strategy !== 'windsurf' || analysis.complexity <= 2) {
        strategy = 'claude-code';
        confidence = Math.max(confidence, 0.8);
        reasoning += ' (small token footprint)';
        estimatedTokenSavings = analysis.tokenEstimate * 0.9;
      }
    }
    
    if (analysis.riskLevel > 7) {
      // High-risk operations - prefer Windsurf
      strategy = 'windsurf';
      confidence = 0.9;
      reasoning = 'High-risk operation requires careful handling';
      estimatedTokenSavings = 0;
    }
    
    return {
      strategy,
      confidence,
      reasoning,
      estimatedTokenSavings,
      analysis
    };
  }
  
  /**
   * Execute operation via Claude Code CLI
   */
  async executeViaClaude(operation, context, routing) {
    console.log(`🤖 Executing via Claude Code: ${operation.type}`);
    
    // Check cache first with intelligent timeout
    const cacheKey = this.generateCacheKey(operation, context);
    if (this.operationCache.has(cacheKey)) {
      const cached = this.operationCache.get(cacheKey);
      const timeout = this.config.cacheTimeouts[operation.type] || this.config.cacheTimeouts.default;
      if (Date.now() - cached.timestamp < timeout) {
        console.log(`💾 Using cached result for ${operation.type}`);
        return cached.result;
      }
    }
    
    // Prepare Claude Code command
    const command = await this.prepareClaudeCommand(operation, context);
    
    // Execute with retries
    let lastError;
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await this.executeClaudeCommand(command);
        
        // Cache successful result
        this.operationCache.set(cacheKey, {
          result,
          timestamp: Date.now()
        });
        
        return result;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Claude Code attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.config.maxRetries) {
          await this.delay(1000 * attempt); // Exponential backoff
        }
      }
    }
    
    throw new Error(`Claude Code execution failed after ${this.config.maxRetries} attempts: ${lastError.message}`);
  }
  
  /**
   * Execute operation via Windsurf (fallback to current system)
   */
  async executeViaWindsurf(operation, context, routing) {
    console.log(`🌊 Executing via Windsurf: ${operation.type}`);
    
    // This would integrate with existing Windsurf functionality
    // For now, we'll simulate the execution
    return {
      method: 'windsurf',
      operation: operation.type,
      context: context,
      timestamp: Date.now(),
      note: 'Executed via Windsurf system (full AI reasoning)'
    };
  }
  
  /**
   * Execute operation using hybrid approach
   */
  async executeHybrid(operation, context, routing) {
    console.log(`🔄 Executing hybrid approach: ${operation.type}`);
    
    // Use Claude Code for simple parts, Windsurf for complex reasoning
    const claudeResult = await this.executeViaClaude(
      { ...operation, type: this.mapToClaudeOperation(operation.type) },
      context,
      routing
    );
    
    const windsurfResult = await this.executeViaWindsurf(
      { ...operation, type: this.mapToWindsurfOperation(operation.type) },
      { ...context, claudeResult },
      routing
    );
    
    return {
      method: 'hybrid',
      claudeResult,
      windsurfResult,
      combined: this.combineResults(claudeResult, windsurfResult)
    };
  }
  
  /**
   * Prepare Claude Code command based on operation
   */
  async prepareClaudeCommand(operation, context) {
    const baseCommand = 'claude';
    const args = [];
    
    switch (operation.type) {
      case 'file-read':
        args.push('read', operation.path);
        break;
      case 'file-write':
        args.push('write', operation.path, operation.content);
        break;
      case 'directory-list':
        args.push('ls', operation.path || '.');
        break;
      case 'git-status':
        args.push('git', 'status');
        break;
      case 'search-files':
        args.push('grep', '-r', operation.pattern, operation.path || '.');
        break;
      default:
        // For general tasks, use Claude with the operation description
        args.push('-p', operation.description || operation.type);
        break;
    }
    
    return { command: baseCommand, args };
  }
  
  /**
   * Missing method: identifyDependencies
   */
  identifyDependencies(operation, context) {
    const dependencies = [];
    
    // Analyze operation for dependencies
    if (operation.type === 'file-write' && operation.path) {
      dependencies.push({ type: 'file', path: operation.path });
    }
    
    if (context && context.requiredFiles) {
      dependencies.push(...context.requiredFiles.map(file => ({ type: 'file', path: file })));
    }
    
    return dependencies;
  }
  
  /**
   * Execute Claude Code command
   */
  async executeClaudeCommand({ command, args }) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            output: stdout.trim(),
            command: `${command} ${args.join(' ')}`
          });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });
      
      child.on('error', (error) => {
        reject(new Error(`Failed to spawn command: ${error.message}`));
      });
    });
  }
  
  /**
   * Calculate operation complexity (1-10 scale)
   */
  calculateComplexity(operation, context) {
    let complexity = 1;
    
    // Base complexity by operation type
    const complexityMap = {
      'file-read': 1,
      'file-write': 1,
      'directory-list': 1,
      'git-status': 1,
      'search-files': 2,
      'code-review': 8,
      'architecture-design': 9,
      'refactor-complex': 7,
      'test-generate': 5
    };
    
    complexity = complexityMap[operation.type] || 5;
    
    // Adjust based on context
    if (context.files && context.files.length > 10) complexity += 1;
    if (context.urgency === 'high') complexity += 1;
    if (operation.dependencies && operation.dependencies.length > 3) complexity += 2;
    
    return Math.min(complexity, 10);
  }
  
  /**
   * Estimate token usage for operation
   */
  estimateTokenUsage(operation, context) {
    const baseTokens = {
      'file-read': 50,
      'file-write': 30,
      'directory-list': 40,
      'git-status': 60,
      'search-files': 80,
      'code-review': 300,
      'architecture-design': 500,
      'refactor-complex': 400
    };
    
    let estimate = baseTokens[operation.type] || 100;
    
    // Adjust based on context
    if (context.files) {
      estimate += context.files.length * 20;
    }
    
    if (operation.content) {
      estimate += Math.ceil(operation.content.length / 4); // Rough token estimate
    }
    
    return estimate;
  }
  
  /**
   * Assess risk level (1-10 scale)
   */
  assessRisk(operation, context) {
    let risk = 1;
    
    const riskMap = {
      'file-write': 3,
      'git-commit': 4,
      'refactor-complex': 7,
      'architecture-design': 8,
      'security-audit': 9
    };
    
    risk = riskMap[operation.type] || 2;
    
    // Increase risk for production contexts
    if (context.environment === 'production') risk += 3;
    if (context.hasBackup === false) risk += 2;
    
    return Math.min(risk, 10);
  }
  
  /**
   * Record performance metrics
   */
  async recordMetrics(operationId, operation, routing, result, duration) {
    const metrics = {
      operationId,
      type: operation.type,
      strategy: routing.strategy,
      duration,
      success: result.success !== false,
      tokensSaved: routing.estimatedTokenSavings || 0,
      timestamp: Date.now()
    };
    
    this.performanceMetrics.record(metrics);
    this.tokenTracker.recordSavings(metrics.tokensSaved);
    
    // Log significant savings
    if (metrics.tokensSaved > 100) {
      console.log(`💰 Significant token savings: ${metrics.tokensSaved} tokens`);
    }
  }
  
  /**
   * Generate unique operation ID
   */
  generateOperationId() {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Generate cache key for operation
   */
  generateCacheKey(operation, context) {
    const key = JSON.stringify({
      type: operation.type,
      path: operation.path,
      pattern: operation.pattern,
      contextHash: this.hashContext(context)
    });
    
    return Buffer.from(key).toString('base64');
  }
  
  /**
   * Hash context for caching
   */
  hashContext(context) {
    // Simple hash of relevant context properties
    const relevant = {
      cwd: context.cwd,
      environment: context.environment,
      fileCount: context.files?.length
    };
    
    return JSON.stringify(relevant);
  }
  
  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Assess if operation results can be cached
   */
  assessCacheability(operation, context) {
    // Operations that are cacheable
    const cacheableTypes = new Set([
      'file-read',
      'directory-list',
      'pattern-search',
      'static-analysis'
    ]);
    
    // Check if operation type is cacheable
    if (!cacheableTypes.has(operation.type)) {
      return { cacheable: false, reason: 'Operation type not cacheable' };
    }
    
    // Check if context allows caching
    if (context.noCache || context.realtime) {
      return { cacheable: false, reason: 'Context prohibits caching' };
    }
    
    // Check file modification times for file operations
    if (operation.path && operation.type === 'file-read') {
      return {
        cacheable: true,
        ttl: this.config.cacheTimeout,
        key: this.generateCacheKey(operation, context)
      };
    }
    
    return {
      cacheable: true,
      ttl: this.config.cacheTimeout,
      key: this.generateCacheKey(operation, context)
    };
  }
  
  /**
   * Record error metrics and attempt recovery
   */
  async recordError(operationId, operation, error, duration) {
    const errorRecord = {
      operationId,
      operation: {
        type: operation.type,
        path: operation.path || 'unknown'
      },
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      duration,
      timestamp: Date.now(),
      recovery: null
    };
    
    // Attempt to suggest recovery strategies
    if (error.code === 'ENOENT') {
      errorRecord.recovery = {
        strategy: 'file-not-found',
        suggestion: 'Verify file path exists or create missing file'
      };
    } else if (error.code === 'EACCES') {
      errorRecord.recovery = {
        strategy: 'permission-denied',
        suggestion: 'Check file permissions or run with appropriate privileges'
      };
    } else if (error.message.includes('timeout')) {
      errorRecord.recovery = {
        strategy: 'timeout',
        suggestion: 'Retry with increased timeout or break into smaller operations'
      };
    }
    
    // Log error with context
    console.error(`🚨 Operation ${operationId} failed:`, {
      type: operation.type,
      error: error.message,
      duration: `${duration}ms`,
      recovery: errorRecord.recovery?.suggestion
    });
    
    // Record in performance metrics
    this.performanceMetrics.record({
      operationId,
      type: operation.type,
      strategy: 'error',
      duration,
      success: false,
      error: error.message,
      tokensSaved: 0,
      timestamp: Date.now()
    });
    
    // Emit error event for external handling
    this.emit('error', errorRecord);
    
    return errorRecord;
  }
  
  /**
   * Get orchestrator status and metrics
   */
  getStatus() {
    return {
      cacheSize: this.operationCache.size,
      tokensSaved: this.tokenTracker.getTotalSavings(),
      operationsProcessed: this.performanceMetrics.getTotalOperations(),
      averageResponseTime: this.performanceMetrics.getAverageResponseTime(),
      routingStats: this.performanceMetrics.getRoutingStats(),
      uptime: process.uptime()
    };
  }
}

/**
 * Token usage tracking
 */
class TokenTracker {
  constructor() {
    this.totalSavings = 0;
    this.savingsHistory = [];
  }
  
  recordSavings(amount) {
    this.totalSavings += amount;
    this.savingsHistory.push({
      amount,
      timestamp: Date.now()
    });
    
    // Keep only last 1000 entries
    if (this.savingsHistory.length > 1000) {
      this.savingsHistory = this.savingsHistory.slice(-1000);
    }
  }
  
  getTotalSavings() {
    return this.totalSavings;
  }
  
  getDailySavings() {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    return this.savingsHistory
      .filter(entry => entry.timestamp > oneDayAgo)
      .reduce((sum, entry) => sum + entry.amount, 0);
  }
}

/**
 * Performance metrics tracking
 */
class PerformanceMetrics {
  constructor() {
    this.operations = [];
    this.routingStats = new Map();
    this.maxOperations = 1000; // Reduced from 10000
    this.cleanupThreshold = 1200; // Cleanup when we hit this
  }
  
  record(metrics) {
    this.operations.push(metrics);
    
    // Update routing stats
    const strategy = metrics.strategy;
    if (!this.routingStats.has(strategy)) {
      this.routingStats.set(strategy, { count: 0, totalDuration: 0, errors: 0 });
    }
    
    const stats = this.routingStats.get(strategy);
    stats.count++;
    stats.totalDuration += metrics.duration;
    if (!metrics.success) stats.errors++;
    
    // Efficient memory management - keep only recent operations
    if (this.operations.length > this.cleanupThreshold) {
      this.operations = this.operations.slice(-this.maxOperations);
    }
  }
  
  getTotalOperations() {
    return this.operations.length;
  }
  
  getAverageResponseTime() {
    if (this.operations.length === 0) return 0;
    
    const total = this.operations.reduce((sum, op) => sum + op.duration, 0);
    return Math.round(total / this.operations.length);
  }
  
  getRoutingStats() {
    const stats = {};
    for (const [strategy, data] of this.routingStats.entries()) {
      stats[strategy] = {
        count: data.count,
        averageDuration: data.count > 0 ? Math.round(data.totalDuration / data.count) : 0,
        errorRate: data.count > 0 ? (data.errors / data.count) : 0
      };
    }
    return stats;
  }
}

module.exports = ClaudeCodeOrchestrator;

// CLI interface
if (require.main === module) {
  const orchestrator = new ClaudeCodeOrchestrator();
  
  // Example usage
  const operation = {
    type: process.argv[2] || 'file-read',
    path: process.argv[3] || '.',
    pattern: process.argv[4]
  };
  
  orchestrator.orchestrate(operation)
    .then(result => {
      console.log('🎯 Result:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Error:', error.message);
      process.exit(1);
    });
}
