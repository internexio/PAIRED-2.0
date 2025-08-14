/**
 * PAIRED Memory Sync - Cross-Project Learning and Knowledge Sharing
 * 
 * This module handles synchronization of learning data and patterns between
 * projects and the global PAIRED knowledge base, enabling collective intelligence
 * and continuous improvement across all PAIRED installations.
 * 
 * Philosophy: "Adaptive Learning Partnership"
 * - Projects learn from each other while maintaining privacy
 * - Global knowledge base grows from collective experience
 * - Intelligent filtering prevents noise and maintains quality
 * - Bidirectional sync ensures all projects benefit from improvements
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

class MemorySync {
  constructor(config = {}) {
    this.config = {
      projectPath: config.projectPath || process.cwd(),
      globalPath: config.globalPath || path.join(require('os').homedir(), '.paired'),
      syncInterval: config.syncInterval || 24 * 60 * 60 * 1000, // 24 hours
      maxSyncSize: config.maxSyncSize || 10 * 1024 * 1024, // 10MB
      qualityThreshold: config.qualityThreshold || 0.8,
      privacyLevel: config.privacyLevel || 'anonymous', // 'anonymous', 'project', 'full'
      autoSync: config.autoSync !== false,
      ...config
    };
    
    this.syncHistory = new Map();
    this.conflictResolution = new Map();
    this.syncStats = {
      lastSync: null,
      totalUploads: 0,
      totalDownloads: 0,
      conflicts: 0,
      errors: 0
    };
    
    this.initialize();
  }
  
  async initialize() {
    try {
      // Ensure directories exist
      await fs.mkdir(path.join(this.config.globalPath, 'memory'), { recursive: true });
      await fs.mkdir(path.join(this.config.projectPath, '.paired', 'memory'), { recursive: true });
      
      // Load sync history
      await this.loadSyncHistory();
      
      // Start auto-sync if enabled
      if (this.config.autoSync && process.env.NODE_ENV !== 'test') {
        this.startAutoSync();
      }
    } catch (error) {
      console.warn('Memory sync initialization warning:', error.message);
    }
  }
  
  /**
   * Perform full bidirectional sync between project and global memory
   */
  async performFullSync() {
    const syncId = this.generateSyncId();
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Starting memory sync ${syncId}...`);
      
      // Phase 1: Upload project learnings to global
      const uploadResults = await this.uploadProjectLearnings();
      
      // Phase 2: Download global insights to project
      const downloadResults = await this.downloadGlobalInsights();
      
      // Phase 3: Resolve any conflicts
      const conflictResults = await this.resolveConflicts();
      
      // Phase 4: Update sync statistics
      const syncResults = {
        syncId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        uploaded: uploadResults,
        downloaded: downloadResults,
        conflicts: conflictResults,
        success: true
      };
      
      await this.recordSyncHistory(syncResults);
      this.updateSyncStats(syncResults);
      
      console.log(`✅ Memory sync ${syncId} completed successfully`);
      console.log(`   Uploaded: ${uploadResults.count} items (${uploadResults.size} bytes)`);
      console.log(`   Downloaded: ${downloadResults.count} items (${downloadResults.size} bytes)`);
      
      return syncResults;
      
    } catch (error) {
      console.error(`❌ Memory sync ${syncId} failed:`, error.message);
      
      const errorResults = {
        syncId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        error: error.message,
        success: false
      };
      
      await this.recordSyncHistory(errorResults);
      this.syncStats.errors += 1;
      
      throw error;
    }
  }
  
  /**
   * Upload project learning data to global knowledge base
   */
  async uploadProjectLearnings() {
    const projectMemoryPath = path.join(this.config.projectPath, '.paired', 'memory');
    const globalMemoryPath = path.join(this.config.globalPath, 'memory');
    
    const uploadData = {
      learnings: [],
      patterns: [],
      insights: []
    };
    
    // Collect learning data
    const learningFiles = [
      'learning_patterns.json',
      'pattern_insights.json',
      'ai_memory.md',
      'reasoning_log.md'
    ];
    
    for (const filename of learningFiles) {
      const filePath = path.join(projectMemoryPath, filename);
      
      try {
        if (await this.fileExists(filePath)) {
          const content = await this.loadAndAnonymize(filePath);
          if (content && this.isHighQuality(content)) {
            uploadData[this.categorizeContent(filename)].push({
              filename,
              content,
              hash: this.generateContentHash(content),
              timestamp: (await fs.stat(filePath)).mtime.toISOString(),
              project: this.anonymizeProjectName(path.basename(this.config.projectPath))
            });
          }
        }
      } catch (error) {
        console.warn(`Could not process ${filename}:`, error.message);
      }
    }
    
    // Upload to global knowledge base
    const globalLearningsPath = path.join(globalMemoryPath, 'global_learnings.json');
    const existingGlobalData = await this.loadJsonFile(globalLearningsPath, { learnings: [], patterns: [], insights: [] });
    
    // Merge new data with existing, avoiding duplicates
    const mergedData = await this.mergeUploadData(existingGlobalData, uploadData);
    
    // Save merged data
    await this.saveJsonFile(globalLearningsPath, mergedData);
    
    // Calculate upload statistics
    const uploadCount = uploadData.learnings.length + uploadData.patterns.length + uploadData.insights.length;
    const uploadSize = JSON.stringify(uploadData).length;
    
    return { count: uploadCount, size: uploadSize, categories: Object.keys(uploadData) };
  }
  
  /**
   * Download global insights relevant to current project
   */
  async downloadGlobalInsights() {
    const globalMemoryPath = path.join(this.config.globalPath, 'memory');
    const projectMemoryPath = path.join(this.config.projectPath, '.paired', 'memory');
    
    // Load global knowledge base
    const globalLearningsPath = path.join(globalMemoryPath, 'global_learnings.json');
    const globalData = await this.loadJsonFile(globalLearningsPath, { learnings: [], patterns: [], insights: [] });
    
    // Filter relevant insights for this project
    const relevantInsights = await this.filterRelevantInsights(globalData);
    
    // Download and integrate relevant insights
    const downloadResults = {
      learnings: 0,
      patterns: 0,
      insights: 0,
      size: 0
    };
    
    // Integrate learning patterns
    if (relevantInsights.learnings.length > 0) {
      const projectLearningsPath = path.join(projectMemoryPath, 'global_learning_cache.json');
      await this.saveJsonFile(projectLearningsPath, relevantInsights.learnings);
      downloadResults.learnings = relevantInsights.learnings.length;
    }
    
    // Integrate pattern insights
    if (relevantInsights.patterns.length > 0) {
      const projectPatternsPath = path.join(projectMemoryPath, 'global_pattern_cache.json');
      await this.saveJsonFile(projectPatternsPath, relevantInsights.patterns);
      downloadResults.patterns = relevantInsights.patterns.length;
    }
    
    // Integrate general insights
    if (relevantInsights.insights.length > 0) {
      const projectInsightsPath = path.join(projectMemoryPath, 'global_insights_cache.json');
      await this.saveJsonFile(projectInsightsPath, relevantInsights.insights);
      downloadResults.insights = relevantInsights.insights.length;
    }
    
    downloadResults.size = JSON.stringify(relevantInsights).length;
    
    return { count: downloadResults.learnings + downloadResults.patterns + downloadResults.insights, 
             size: downloadResults.size, breakdown: downloadResults };
  }
  
  /**
   * Get recommendations based on global knowledge
   */
  async getGlobalRecommendations(context, agent = null, limit = 5) {
    const projectMemoryPath = path.join(this.config.projectPath, '.paired', 'memory');
    const cacheFiles = [
      'global_learning_cache.json',
      'global_pattern_cache.json',
      'global_insights_cache.json'
    ];
    
    const recommendations = [];
    
    for (const cacheFile of cacheFiles) {
      const cachePath = path.join(projectMemoryPath, cacheFile);
      
      if (await this.fileExists(cachePath)) {
        const cacheData = await this.loadJsonFile(cachePath, []);
        const contextRecommendations = this.extractContextualRecommendations(cacheData, context, agent);
        recommendations.push(...contextRecommendations);
      }
    }
    
    // Sort by relevance and return top recommendations
    recommendations.sort((a, b) => b.relevance - a.relevance);
    
    return recommendations.slice(0, limit).map(rec => ({
      recommendation: rec.text,
      confidence: rec.relevance,
      source: 'global_knowledge',
      agent: rec.agent || 'collective'
    }));
  }
  
  /**
   * Export project memory for sharing
   */
  async exportProjectMemory(outputPath = null, includePrivate = false) {
    if (!outputPath) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      outputPath = path.join(this.config.projectPath, `paired-memory-export-${timestamp}.json`);
    }
    
    const projectMemoryPath = path.join(this.config.projectPath, '.paired', 'memory');
    const exportData = {
      metadata: {
        project: includePrivate ? path.basename(this.config.projectPath) : 'anonymous',
        exported: new Date().toISOString(),
        version: '1.0',
        privacy_level: includePrivate ? 'full' : 'anonymous'
      },
      memory: {}
    };
    
    // Collect all memory files
    const memoryFiles = await fs.readdir(projectMemoryPath);
    
    for (const filename of memoryFiles) {
      if (filename.endsWith('.json') || filename.endsWith('.md')) {
        const filePath = path.join(projectMemoryPath, filename);
        
        try {
          let content = await this.loadFile(filePath);
          
          if (!includePrivate) {
            content = this.anonymizeContent(content);
          }
          
          exportData.memory[filename] = content;
        } catch (error) {
          console.warn(`Could not export ${filename}:`, error.message);
        }
      }
    }
    
    await this.saveJsonFile(outputPath, exportData);
    
    return {
      path: outputPath,
      size: JSON.stringify(exportData).length,
      files: Object.keys(exportData.memory).length,
      privacy_level: exportData.metadata.privacy_level
    };
  }
  
  /**
   * Import memory from another project
   */
  async importProjectMemory(importPath, mergeStrategy = 'enhance') {
    const importData = await this.loadJsonFile(importPath);
    const projectMemoryPath = path.join(this.config.projectPath, '.paired', 'memory');
    
    const importResults = {
      imported: 0,
      merged: 0,
      skipped: 0,
      errors: 0
    };
    
    for (const [filename, content] of Object.entries(importData.memory)) {
      const targetPath = path.join(projectMemoryPath, filename);
      
      try {
        if (await this.fileExists(targetPath)) {
          // File exists - merge based on strategy
          if (mergeStrategy === 'enhance') {
            await this.mergeMemoryFile(targetPath, content);
            importResults.merged += 1;
          } else if (mergeStrategy === 'replace') {
            await this.saveFile(targetPath, content);
            importResults.imported += 1;
          } else {
            importResults.skipped += 1;
          }
        } else {
          // New file - import directly
          await this.saveFile(targetPath, content);
          importResults.imported += 1;
        }
      } catch (error) {
        console.warn(`Could not import ${filename}:`, error.message);
        importResults.errors += 1;
      }
    }
    
    return importResults;
  }
  
  /**
   * Get sync status and statistics
   */
  getSyncStatus() {
    return {
      lastSync: this.syncStats.lastSync,
      totalUploads: this.syncStats.totalUploads,
      totalDownloads: this.syncStats.totalDownloads,
      conflicts: this.syncStats.conflicts,
      errors: this.syncStats.errors,
      autoSyncEnabled: this.config.autoSync,
      nextSync: this.config.autoSync ? 
        new Date(Date.now() + this.config.syncInterval).toISOString() : null
    };
  }
  
  // Private helper methods
  
  generateSyncId() {
    return crypto.randomBytes(8).toString('hex');
  }
  
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
  
  async loadJsonFile(filePath, defaultValue = null) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch {
      return defaultValue;
    }
  }
  
  async saveJsonFile(filePath, data) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }
  
  async loadFile(filePath) {
    return await fs.readFile(filePath, 'utf8');
  }
  
  async saveFile(filePath, content) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
  }
  
  async loadAndAnonymize(filePath) {
    const content = await this.loadFile(filePath);
    return this.anonymizeContent(content);
  }
  
  anonymizeContent(content) {
    if (this.config.privacyLevel === 'full') return content;
    
    let anonymized = content;
    
    // Remove user-specific paths
    anonymized = anonymized.replace(/\/Users\/[^\/\s]+/g, '/Users/USER');
    anonymized = anonymized.replace(/\/home\/[^\/\s]+/g, '/home/USER');
    
    // Remove email addresses
    anonymized = anonymized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, 'EMAIL');
    
    // Remove IP addresses
    anonymized = anonymized.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, 'IP_ADDRESS');
    
    // Remove specific project names if privacy level is anonymous
    if (this.config.privacyLevel === 'anonymous') {
      const projectName = path.basename(this.config.projectPath);
      const regex = new RegExp(projectName, 'gi');
      anonymized = anonymized.replace(regex, 'PROJECT');
    }
    
    return anonymized;
  }
  
  anonymizeProjectName(projectName) {
    if (this.config.privacyLevel === 'full') return projectName;
    if (this.config.privacyLevel === 'project') return projectName;
    
    // Generate consistent anonymous name based on hash
    const hash = crypto.createHash('sha256').update(projectName).digest('hex');
    return `project_${hash.substring(0, 8)}`;
  }
  
  generateContentHash(content) {
    return crypto.createHash('sha256').update(JSON.stringify(content)).digest('hex');
  }
  
  isHighQuality(content) {
    // Simple quality checks
    if (!content) return false;
    
    if (typeof content === 'string') {
      return content.length > 50 && content.trim().length > 0;
    }
    
    if (typeof content === 'object') {
      return Object.keys(content).length > 0;
    }
    
    return false;
  }
  
  categorizeContent(filename) {
    if (filename.includes('learning')) return 'learnings';
    if (filename.includes('pattern')) return 'patterns';
    return 'insights';
  }
  
  async mergeUploadData(existingData, newData) {
    const merged = { ...existingData };
    
    for (const [category, items] of Object.entries(newData)) {
      if (!merged[category]) merged[category] = [];
      
      // Add new items, avoiding duplicates based on hash
      const existingHashes = new Set(merged[category].map(item => item.hash));
      
      for (const item of items) {
        if (!existingHashes.has(item.hash)) {
          merged[category].push(item);
        }
      }
    }
    
    return merged;
  }
  
  async filterRelevantInsights(globalData) {
    const projectContext = await this.getProjectContext();
    const relevantInsights = {
      learnings: [],
      patterns: [],
      insights: []
    };
    
    // Filter based on project context and quality
    for (const [category, items] of Object.entries(globalData)) {
      for (const item of items) {
        if (this.isRelevantToProject(item, projectContext)) {
          relevantInsights[category].push(item);
        }
      }
    }
    
    return relevantInsights;
  }
  
  async getProjectContext() {
    // Analyze project to determine context
    const context = {
      language: 'javascript', // Default, could be detected
      framework: 'node',      // Default, could be detected
      domain: 'general',      // Could be inferred from project structure
      size: 'medium'          // Could be calculated from file count
    };
    
    // Try to detect actual context from package.json, file structure, etc.
    try {
      const packagePath = path.join(this.config.projectPath, 'package.json');
      if (await this.fileExists(packagePath)) {
        const packageData = await this.loadJsonFile(packagePath);
        if (packageData.dependencies) {
          // Detect framework from dependencies
          if (packageData.dependencies.react) context.framework = 'react';
          if (packageData.dependencies.vue) context.framework = 'vue';
          if (packageData.dependencies.express) context.framework = 'express';
        }
      }
    } catch {
      // Use defaults
    }
    
    return context;
  }
  
  isRelevantToProject(item, projectContext) {
    // Simple relevance scoring
    let relevanceScore = 0;
    
    // Check content for relevant keywords
    const content = JSON.stringify(item.content).toLowerCase();
    
    if (content.includes(projectContext.language)) relevanceScore += 0.3;
    if (content.includes(projectContext.framework)) relevanceScore += 0.3;
    if (content.includes(projectContext.domain)) relevanceScore += 0.2;
    
    // Quality threshold
    if (item.hash && item.timestamp) relevanceScore += 0.2;
    
    return relevanceScore >= this.config.qualityThreshold;
  }
  
  extractContextualRecommendations(cacheData, context, agent) {
    const recommendations = [];
    
    for (const item of cacheData) {
      if (agent && item.agent && item.agent !== agent) continue;
      
      // Simple context matching
      const itemContent = JSON.stringify(item.content).toLowerCase();
      const contextContent = JSON.stringify(context).toLowerCase();
      
      let relevance = 0;
      const contextWords = contextContent.split(/\s+/);
      
      for (const word of contextWords) {
        if (word.length > 3 && itemContent.includes(word)) {
          relevance += 0.1;
        }
      }
      
      if (relevance > 0.3) {
        recommendations.push({
          text: this.extractRecommendationText(item),
          relevance,
          agent: item.agent
        });
      }
    }
    
    return recommendations;
  }
  
  extractRecommendationText(item) {
    // Extract meaningful recommendation from item
    if (item.content && item.content.outcome) {
      return item.content.outcome;
    }
    
    if (typeof item.content === 'string') {
      // Extract first meaningful sentence
      const sentences = item.content.split(/[.!?]+/);
      for (const sentence of sentences) {
        if (sentence.trim().length > 20) {
          return sentence.trim();
        }
      }
    }
    
    return 'Consider applying similar patterns from global knowledge';
  }
  
  async resolveConflicts() {
    // Placeholder for conflict resolution
    // In a full implementation, this would handle cases where
    // local and global data conflict
    return { resolved: 0, unresolved: 0 };
  }
  
  async recordSyncHistory(syncResults) {
    const historyPath = path.join(this.config.projectPath, '.paired', 'memory', 'sync_history.json');
    const history = await this.loadJsonFile(historyPath, []);
    
    history.push(syncResults);
    
    // Keep only last 50 sync records
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
    
    await this.saveJsonFile(historyPath, history);
  }
  
  async loadSyncHistory() {
    const historyPath = path.join(this.config.projectPath, '.paired', 'memory', 'sync_history.json');
    const history = await this.loadJsonFile(historyPath, []);
    
    // Load into memory for quick access
    for (const record of history) {
      this.syncHistory.set(record.syncId, record);
    }
  }
  
  updateSyncStats(syncResults) {
    this.syncStats.lastSync = syncResults.timestamp;
    
    if (syncResults.success) {
      this.syncStats.totalUploads += syncResults.uploaded?.count || 0;
      this.syncStats.totalDownloads += syncResults.downloaded?.count || 0;
      this.syncStats.conflicts += syncResults.conflicts?.resolved || 0;
    }
  }
  
  startAutoSync() {
    setInterval(async () => {
      try {
        await this.performFullSync();
      } catch (error) {
        console.warn('Auto-sync failed:', error.message);
      }
    }, this.config.syncInterval);
  }
  
  async mergeMemoryFile(targetPath, newContent) {
    const existingContent = await this.loadFile(targetPath);
    
    // Simple merge strategy - could be enhanced
    if (targetPath.endsWith('.json')) {
      try {
        const existing = JSON.parse(existingContent);
        const newData = typeof newContent === 'string' ? JSON.parse(newContent) : newContent;
        
        // Merge arrays or objects
        if (Array.isArray(existing) && Array.isArray(newData)) {
          const merged = [...existing, ...newData];
          await this.saveJsonFile(targetPath, merged);
        } else if (typeof existing === 'object' && typeof newData === 'object') {
          const merged = { ...existing, ...newData };
          await this.saveJsonFile(targetPath, merged);
        }
      } catch {
        // If parsing fails, append as new content
        await this.saveFile(targetPath, newContent);
      }
    } else {
      // For markdown files, append new content
      const merged = existingContent + '\n\n---\n\n' + newContent;
      await this.saveFile(targetPath, merged);
    }
  }
}

module.exports = MemorySync;
