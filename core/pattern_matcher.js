/**
 * PAIRED Pattern Matcher - Advanced Pattern Recognition for Agent Learning
 * 
 * This module provides sophisticated pattern matching capabilities for PAIRED agents,
 * enabling them to recognize code patterns, architectural decisions, and workflow
 * optimizations across projects.
 * 
 * Philosophy: "Context as Shared Understanding"
 * - Recognizes patterns beyond simple text matching
 * - Understands semantic relationships and context
 * - Learns from agent interactions and outcomes
 * - Builds pattern libraries for continuous improvement
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class PatternMatcher {
  constructor(config = {}) {
    this.config = {
      memoryPath: config.memoryPath || './data/memory',
      patternsPath: config.patternsPath || './data/patterns',
      confidenceThreshold: config.confidenceThreshold || 0.7,
      maxPatternAge: config.maxPatternAge || 30 * 24 * 60 * 60 * 1000, // 30 days
      learningRate: config.learningRate || 0.1,
      ...config
    };
    
    this.patterns = new Map();
    this.patternStats = new Map();
    this.agentSpecializations = {
      'sherlock': ['bug_patterns', 'test_patterns', 'quality_issues'],
      'leonardo': ['architecture_patterns', 'design_patterns', 'structure_patterns'],
      'edison': ['implementation_patterns', 'optimization_patterns', 'solution_patterns'],
      'alex': ['workflow_patterns', 'coordination_patterns', 'planning_patterns'],
      'maya': ['ux_patterns', 'interaction_patterns', 'user_flow_patterns'],
      'vince': ['process_patterns', 'team_patterns', 'ceremony_patterns'],
      'marie': ['data_patterns', 'analysis_patterns', 'research_patterns']
    };
    
    this.initialize();
  }
  
  async initialize() {
    try {
      await fs.mkdir(this.config.patternsPath, { recursive: true });
      await this.loadExistingPatterns();
    } catch (error) {
      console.warn('Pattern matcher initialization warning:', error.message);
    }
  }
  
  /**
   * Register a new pattern from agent learning
   */
  async registerPattern(agent, patternType, context, outcome, confidence = 0.8) {
    const patternId = this.generatePatternId(agent, patternType, context);
    const timestamp = new Date().toISOString();
    
    const pattern = {
      id: patternId,
      agent,
      type: patternType,
      context: this.normalizeContext(context),
      outcome,
      confidence,
      timestamp,
      usage_count: 1,
      success_rate: confidence,
      last_used: timestamp
    };
    
    // Check if pattern already exists
    if (this.patterns.has(patternId)) {
      await this.updateExistingPattern(patternId, outcome, confidence);
    } else {
      this.patterns.set(patternId, pattern);
      await this.savePattern(pattern);
    }
    
    return patternId;
  }
  
  /**
   * Find matching patterns for a given context
   */
  async findMatchingPatterns(agent, context, patternType = null) {
    const normalizedContext = this.normalizeContext(context);
    const matches = [];
    
    // Get agent-specific patterns first
    const agentPatterns = this.getAgentPatterns(agent, patternType);
    
    for (const pattern of agentPatterns) {
      const similarity = this.calculateContextSimilarity(normalizedContext, pattern.context);
      
      if (similarity >= this.config.confidenceThreshold) {
        matches.push({
          pattern,
          similarity,
          relevance: this.calculateRelevance(pattern, agent, context)
        });
      }
    }
    
    // Sort by relevance and similarity
    matches.sort((a, b) => (b.relevance * b.similarity) - (a.relevance * a.similarity));
    
    return matches.slice(0, 10); // Return top 10 matches
  }
  
  /**
   * Get recommendations based on pattern matching
   */
  async getPatternRecommendations(agent, context, limit = 5) {
    const matches = await this.findMatchingPatterns(agent, context);
    const recommendations = [];
    
    for (const match of matches.slice(0, limit)) {
      const recommendation = this.generateRecommendation(match.pattern, context);
      if (recommendation) {
        recommendations.push({
          recommendation,
          confidence: match.similarity * match.relevance,
          pattern_id: match.pattern.id,
          based_on: match.pattern.outcome
        });
      }
    }
    
    return recommendations;
  }
  
  /**
   * Learn from pattern usage and outcomes
   */
  async recordPatternUsage(patternId, outcome, success = true) {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return false;
    
    // Update pattern statistics
    pattern.usage_count += 1;
    pattern.last_used = new Date().toISOString();
    
    // Update success rate using exponential moving average
    const newSuccessValue = success ? 1 : 0;
    pattern.success_rate = pattern.success_rate * (1 - this.config.learningRate) + 
                          newSuccessValue * this.config.learningRate;
    
    // Store usage statistics
    if (!this.patternStats.has(patternId)) {
      this.patternStats.set(patternId, {
        total_uses: 0,
        successful_uses: 0,
        recent_outcomes: []
      });
    }
    
    const stats = this.patternStats.get(patternId);
    stats.total_uses += 1;
    if (success) stats.successful_uses += 1;
    
    stats.recent_outcomes.push({
      timestamp: new Date().toISOString(),
      outcome,
      success
    });
    
    // Keep only recent outcomes (last 20)
    if (stats.recent_outcomes.length > 20) {
      stats.recent_outcomes = stats.recent_outcomes.slice(-20);
    }
    
    await this.savePattern(pattern);
    await this.savePatternStats(patternId, stats);
    
    return true;
  }
  
  /**
   * Analyze pattern effectiveness across agents
   */
  async analyzePatternEffectiveness(agent = null, days = 30) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const analysis = {
      total_patterns: 0,
      effective_patterns: 0,
      agent_breakdown: {},
      top_patterns: [],
      recommendations: []
    };
    
    for (const [patternId, pattern] of this.patterns) {
      if (agent && pattern.agent !== agent) continue;
      if (new Date(pattern.timestamp) < cutoffDate) continue;
      
      analysis.total_patterns += 1;
      
      if (pattern.success_rate >= this.config.confidenceThreshold) {
        analysis.effective_patterns += 1;
      }
      
      // Agent breakdown
      if (!analysis.agent_breakdown[pattern.agent]) {
        analysis.agent_breakdown[pattern.agent] = {
          total: 0,
          effective: 0,
          avg_success_rate: 0
        };
      }
      
      const agentData = analysis.agent_breakdown[pattern.agent];
      agentData.total += 1;
      if (pattern.success_rate >= this.config.confidenceThreshold) {
        agentData.effective += 1;
      }
      agentData.avg_success_rate += pattern.success_rate;
    }
    
    // Calculate averages
    for (const agentData of Object.values(analysis.agent_breakdown)) {
      agentData.avg_success_rate /= agentData.total;
    }
    
    // Get top patterns
    const sortedPatterns = Array.from(this.patterns.values())
      .filter(p => !agent || p.agent === agent)
      .filter(p => new Date(p.timestamp) >= cutoffDate)
      .sort((a, b) => (b.success_rate * b.usage_count) - (a.success_rate * a.usage_count))
      .slice(0, 10);
    
    analysis.top_patterns = sortedPatterns.map(p => ({
      id: p.id,
      type: p.type,
      agent: p.agent,
      success_rate: p.success_rate,
      usage_count: p.usage_count,
      outcome: p.outcome
    }));
    
    // Generate recommendations
    analysis.recommendations = this.generateEffectivenessRecommendations(analysis);
    
    return analysis;
  }
  
  /**
   * Export patterns for cross-project sharing
   */
  async exportPatterns(agent = null, minSuccessRate = 0.8) {
    const exportData = {
      timestamp: new Date().toISOString(),
      agent_filter: agent,
      min_success_rate: minSuccessRate,
      patterns: []
    };
    
    for (const pattern of this.patterns.values()) {
      if (agent && pattern.agent !== agent) continue;
      if (pattern.success_rate < minSuccessRate) continue;
      
      // Remove sensitive project-specific information
      const exportPattern = {
        type: pattern.type,
        agent: pattern.agent,
        context: this.anonymizeContext(pattern.context),
        outcome: pattern.outcome,
        success_rate: pattern.success_rate,
        usage_count: pattern.usage_count
      };
      
      exportData.patterns.push(exportPattern);
    }
    
    return exportData;
  }
  
  /**
   * Import patterns from other projects
   */
  async importPatterns(importData, mergeStrategy = 'enhance') {
    const imported = {
      total: 0,
      merged: 0,
      new: 0,
      skipped: 0
    };
    
    for (const importPattern of importData.patterns) {
      imported.total += 1;
      
      // Generate ID for imported pattern
      const patternId = this.generatePatternId(
        importPattern.agent,
        importPattern.type,
        importPattern.context
      );
      
      if (this.patterns.has(patternId)) {
        // Merge with existing pattern
        if (mergeStrategy === 'enhance') {
          await this.mergePatterns(patternId, importPattern);
          imported.merged += 1;
        } else {
          imported.skipped += 1;
        }
      } else {
        // Add as new pattern
        const newPattern = {
          id: patternId,
          agent: importPattern.agent,
          type: importPattern.type,
          context: importPattern.context,
          outcome: importPattern.outcome,
          confidence: importPattern.success_rate,
          timestamp: new Date().toISOString(),
          usage_count: Math.max(1, Math.floor(importPattern.usage_count * 0.5)), // Reduce imported usage
          success_rate: importPattern.success_rate,
          last_used: new Date().toISOString(),
          imported: true
        };
        
        this.patterns.set(patternId, newPattern);
        await this.savePattern(newPattern);
        imported.new += 1;
      }
    }
    
    return imported;
  }
  
  // Private helper methods
  
  generatePatternId(agent, patternType, context) {
    const contextStr = JSON.stringify(this.normalizeContext(context));
    const content = `${agent}_${patternType}_${contextStr}`;
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }
  
  normalizeContext(context) {
    // Normalize context for consistent pattern matching
    const normalized = {};
    
    for (const [key, value] of Object.entries(context)) {
      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const normalizedValue = typeof value === 'string' ? 
        value.toLowerCase().trim() : value;
      normalized[normalizedKey] = normalizedValue;
    }
    
    return normalized;
  }
  
  calculateContextSimilarity(context1, context2) {
    const keys1 = new Set(Object.keys(context1));
    const keys2 = new Set(Object.keys(context2));
    const allKeys = new Set([...keys1, ...keys2]);
    
    let matches = 0;
    let total = allKeys.size;
    
    for (const key of allKeys) {
      if (keys1.has(key) && keys2.has(key)) {
        if (context1[key] === context2[key]) {
          matches += 1;
        } else if (this.isValueSimilar(context1[key], context2[key])) {
          matches += 0.5;
        }
      }
    }
    
    return total > 0 ? matches / total : 0;
  }
  
  isValueSimilar(value1, value2) {
    if (typeof value1 !== typeof value2) return false;
    
    if (typeof value1 === 'string') {
      // Simple string similarity
      const longer = value1.length > value2.length ? value1 : value2;
      const shorter = value1.length > value2.length ? value2 : value1;
      
      if (longer.length === 0) return true;
      
      const editDistance = this.calculateEditDistance(longer, shorter);
      return (longer.length - editDistance) / longer.length > 0.6;
    }
    
    return false;
  }
  
  calculateEditDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  getAgentPatterns(agent, patternType = null) {
    const patterns = [];
    
    for (const pattern of this.patterns.values()) {
      if (pattern.agent === agent || this.isPatternRelevantToAgent(pattern, agent)) {
        if (!patternType || pattern.type === patternType) {
          patterns.push(pattern);
        }
      }
    }
    
    return patterns;
  }
  
  isPatternRelevantToAgent(pattern, agent) {
    const agentSpecializations = this.agentSpecializations[agent] || [];
    return agentSpecializations.some(spec => pattern.type.includes(spec.replace('_patterns', '')));
  }
  
  calculateRelevance(pattern, agent, context) {
    let relevance = 0.5; // Base relevance
    
    // Agent match bonus
    if (pattern.agent === agent) relevance += 0.3;
    
    // Specialization match bonus
    if (this.isPatternRelevantToAgent(pattern, agent)) relevance += 0.2;
    
    // Recency bonus
    const daysSinceLastUse = (Date.now() - new Date(pattern.last_used)) / (24 * 60 * 60 * 1000);
    if (daysSinceLastUse < 7) relevance += 0.1;
    
    // Success rate bonus
    relevance += pattern.success_rate * 0.2;
    
    // Usage frequency bonus
    if (pattern.usage_count > 5) relevance += 0.1;
    
    return Math.min(1.0, relevance);
  }
  
  generateRecommendation(pattern, context) {
    const recommendations = {
      'bug_fix': `Based on similar issues, consider: ${pattern.outcome}`,
      'refactor': `Refactoring suggestion: ${pattern.outcome}`,
      'optimization': `Performance optimization: ${pattern.outcome}`,
      'design_pattern': `Architectural recommendation: ${pattern.outcome}`,
      'workflow': `Process improvement: ${pattern.outcome}`,
      'test': `Testing strategy: ${pattern.outcome}`
    };
    
    for (const [type, template] of Object.entries(recommendations)) {
      if (pattern.type.includes(type)) {
        return template;
      }
    }
    
    return `Based on pattern analysis: ${pattern.outcome}`;
  }
  
  async updateExistingPattern(patternId, outcome, confidence) {
    const pattern = this.patterns.get(patternId);
    
    // Update with exponential moving average
    pattern.success_rate = pattern.success_rate * (1 - this.config.learningRate) + 
                          confidence * this.config.learningRate;
    pattern.usage_count += 1;
    pattern.last_used = new Date().toISOString();
    
    // Update outcome if confidence is higher
    if (confidence > pattern.confidence) {
      pattern.outcome = outcome;
      pattern.confidence = confidence;
    }
    
    await this.savePattern(pattern);
  }
  
  async loadExistingPatterns() {
    try {
      const patternsFile = path.join(this.config.patternsPath, 'patterns.json');
      const data = await fs.readFile(patternsFile, 'utf8');
      const patterns = JSON.parse(data);
      
      for (const pattern of patterns) {
        this.patterns.set(pattern.id, pattern);
      }
    } catch (error) {
      // File doesn't exist or is invalid - start fresh
    }
  }
  
  async savePattern(pattern) {
    try {
      const patternsFile = path.join(this.config.patternsPath, 'patterns.json');
      const allPatterns = Array.from(this.patterns.values());
      await fs.writeFile(patternsFile, JSON.stringify(allPatterns, null, 2));
    } catch (error) {
      console.warn('Could not save pattern:', error.message);
    }
  }
  
  async savePatternStats(patternId, stats) {
    try {
      const statsFile = path.join(this.config.patternsPath, 'pattern_stats.json');
      const allStats = Object.fromEntries(this.patternStats);
      await fs.writeFile(statsFile, JSON.stringify(allStats, null, 2));
    } catch (error) {
      console.warn('Could not save pattern stats:', error.message);
    }
  }
  
  anonymizeContext(context) {
    const anonymized = {};
    
    for (const [key, value] of Object.entries(context)) {
      if (typeof value === 'string') {
        // Remove specific file paths, user names, etc.
        anonymized[key] = value
          .replace(/\/Users\/[^\/]+/g, '/Users/USER')
          .replace(/\/home\/[^\/]+/g, '/home/USER')
          .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, 'EMAIL');
      } else {
        anonymized[key] = value;
      }
    }
    
    return anonymized;
  }
  
  async mergePatterns(existingId, importPattern) {
    const existing = this.patterns.get(existingId);
    
    // Merge success rates using weighted average
    const totalUsage = existing.usage_count + importPattern.usage_count;
    existing.success_rate = (existing.success_rate * existing.usage_count + 
                           importPattern.success_rate * importPattern.usage_count) / totalUsage;
    
    existing.usage_count = totalUsage;
    
    // Update outcome if imported pattern has higher success rate
    if (importPattern.success_rate > existing.confidence) {
      existing.outcome = importPattern.outcome;
      existing.confidence = importPattern.success_rate;
    }
    
    await this.savePattern(existing);
  }
  
  generateEffectivenessRecommendations(analysis) {
    const recommendations = [];
    
    // Overall effectiveness
    const overallEffectiveness = analysis.effective_patterns / analysis.total_patterns;
    if (overallEffectiveness < 0.7) {
      recommendations.push("Consider reviewing pattern quality - effectiveness below 70%");
    }
    
    // Agent-specific recommendations
    for (const [agent, data] of Object.entries(analysis.agent_breakdown)) {
      const agentEffectiveness = data.effective / data.total;
      if (agentEffectiveness < 0.6) {
        recommendations.push(`${agent} agent patterns need improvement - ${(agentEffectiveness * 100).toFixed(1)}% effectiveness`);
      }
    }
    
    // Pattern diversity
    if (analysis.total_patterns < 10) {
      recommendations.push("Consider recording more patterns to improve learning");
    }
    
    return recommendations;
  }
}

module.exports = PatternMatcher;
