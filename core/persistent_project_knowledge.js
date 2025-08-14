/**
 * PAIRED Persistent Project Knowledge System
 * 
 * Enables PAIRED to learn and remember project-specific patterns, decisions,
 * and insights across development sessions. Builds upon SharedMemorySystem
 * and KnowledgeForge infrastructure for intelligent project learning.
 * 
 * Key Features:
 * - Project-specific learning and pattern recognition
 * - Decision tracking and context preservation
 * - Code pattern analysis and recommendations
 * - Cross-session knowledge continuity
 * - Agent-specific project insights
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const SharedMemorySystem = require('./shared_memory');

class PersistentProjectKnowledge {
    constructor(projectPath, config = {}) {
        this.projectPath = projectPath;
        this.projectId = this.generateProjectId(projectPath);
        this.config = {
            knowledgeDir: path.join(projectPath, '.paired', 'knowledge'),
            patternsDir: path.join(projectPath, '.paired', 'patterns'),
            decisionsDir: path.join(projectPath, '.paired', 'decisions'),
            insightsDir: path.join(projectPath, '.paired', 'insights'),
            maxKnowledgeEntries: config.maxKnowledgeEntries || 1000,
            learningEnabled: config.learningEnabled !== false,
            patternDetectionEnabled: config.patternDetectionEnabled !== false,
            ...config
        };

        this.sharedMemory = new SharedMemorySystem({
            storageDir: path.join(this.config.knowledgeDir, 'memory'),
            maxSizeMB: 100
        });

        this.knowledgeStore = new Map();
        this.patterns = new Map();
        this.decisions = new Map();
        this.insights = new Map();
        this.sessionContext = new Map();
        
        this.initialized = false;
    }

    /**
     * Initialize the persistent knowledge system
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // Create knowledge directories
            await Promise.all([
                fs.mkdir(this.config.knowledgeDir, { recursive: true }),
                fs.mkdir(this.config.patternsDir, { recursive: true }),
                fs.mkdir(this.config.decisionsDir, { recursive: true }),
                fs.mkdir(this.config.insightsDir, { recursive: true })
            ]);

            // Load existing knowledge
            await this.loadExistingKnowledge();
            
            // Initialize shared memory
            await this.sharedMemory.initializeMemorySystem();

            this.initialized = true;
            console.log(`✅ Persistent Project Knowledge initialized for: ${this.projectId}`);
        } catch (error) {
            console.error('❌ Failed to initialize Persistent Project Knowledge:', error);
            throw error;
        }
    }

    /**
     * Generate unique project ID from path
     */
    generateProjectId(projectPath) {
        const normalizedPath = path.resolve(projectPath);
        const hash = crypto.createHash('md5').update(normalizedPath).digest('hex');
        const projectName = path.basename(normalizedPath);
        return `${projectName}_${hash.substring(0, 8)}`;
    }

    /**
     * Learn from development session
     */
    async learnFromSession(sessionData) {
        if (!this.config.learningEnabled) return;

        const sessionId = this.generateSessionId();
        const timestamp = new Date().toISOString();

        const learningEntry = {
            sessionId,
            timestamp,
            projectId: this.projectId,
            type: 'session_learning',
            data: sessionData,
            patterns: await this.extractPatterns(sessionData),
            decisions: await this.extractDecisions(sessionData),
            insights: await this.generateInsights(sessionData)
        };

        // Store in knowledge store
        this.knowledgeStore.set(sessionId, learningEntry);

        // Store in shared memory for cross-session access
        await this.sharedMemory.storeMemory('project_learning', learningEntry, {
            projectId: this.projectId,
            sessionId,
            persistent: true
        });

        // Save to disk
        await this.saveKnowledgeEntry(learningEntry);

        console.log(`📚 Learned from session: ${sessionId}`);
        return learningEntry;
    }

    /**
     * Extract code patterns from session data
     */
    async extractPatterns(sessionData) {
        if (!this.config.patternDetectionEnabled) return [];

        const patterns = [];
        
        // Analyze code changes
        if (sessionData.codeChanges) {
            for (const change of sessionData.codeChanges) {
                const pattern = await this.analyzeCodePattern(change);
                if (pattern) patterns.push(pattern);
            }
        }

        // Analyze problem-solving approaches
        if (sessionData.problemSolving) {
            const approach = this.analyzeProblemSolvingPattern(sessionData.problemSolving);
            if (approach) patterns.push(approach);
        }

        // Analyze tool usage patterns
        if (sessionData.toolUsage) {
            const toolPattern = this.analyzeToolUsagePattern(sessionData.toolUsage);
            if (toolPattern) patterns.push(toolPattern);
        }

        return patterns;
    }

    /**
     * Extract decisions from session data
     */
    async extractDecisions(sessionData) {
        const decisions = [];

        if (sessionData.architecturalDecisions) {
            decisions.push(...sessionData.architecturalDecisions.map(decision => ({
                type: 'architectural',
                decision: decision.decision,
                rationale: decision.rationale,
                alternatives: decision.alternatives || [],
                timestamp: new Date().toISOString()
            })));
        }

        if (sessionData.technicalDecisions) {
            decisions.push(...sessionData.technicalDecisions.map(decision => ({
                type: 'technical',
                decision: decision.decision,
                rationale: decision.rationale,
                impact: decision.impact || 'unknown',
                timestamp: new Date().toISOString()
            })));
        }

        return decisions;
    }

    /**
     * Generate insights from session data
     */
    async generateInsights(sessionData) {
        const insights = [];

        // Performance insights
        if (sessionData.performance) {
            insights.push({
                type: 'performance',
                insight: `Performance optimization: ${sessionData.performance.optimization}`,
                impact: sessionData.performance.impact,
                recommendation: sessionData.performance.recommendation
            });
        }

        // Code quality insights
        if (sessionData.codeQuality) {
            insights.push({
                type: 'code_quality',
                insight: `Code quality improvement: ${sessionData.codeQuality.improvement}`,
                metrics: sessionData.codeQuality.metrics,
                recommendation: sessionData.codeQuality.recommendation
            });
        }

        // Learning insights
        if (sessionData.learnings) {
            insights.push(...sessionData.learnings.map(learning => ({
                type: 'learning',
                insight: learning.insight,
                context: learning.context,
                application: learning.application
            })));
        }

        return insights;
    }

    /**
     * Retrieve project knowledge for context
     */
    async getProjectContext(query = {}) {
        const context = {
            patterns: [],
            decisions: [],
            insights: [],
            recommendations: []
        };

        // Get relevant patterns
        if (query.includePatterns !== false) {
            context.patterns = await this.searchPatterns(query.pattern || '');
        }

        // Get relevant decisions
        if (query.includeDecisions !== false) {
            context.decisions = await this.searchDecisions(query.decision || '');
        }

        // Get relevant insights
        if (query.includeInsights !== false) {
            context.insights = await this.searchInsights(query.insight || '');
        }

        // Generate recommendations
        if (query.includeRecommendations !== false) {
            context.recommendations = await this.generateRecommendations(query);
        }

        return context;
    }

    /**
     * Search patterns by query
     */
    async searchPatterns(query) {
        const patterns = [];
        for (const [id, pattern] of this.patterns) {
            if (this.matchesQuery(pattern, query)) {
                patterns.push(pattern);
            }
        }
        return patterns.slice(0, 10); // Limit results
    }

    /**
     * Search decisions by query
     */
    async searchDecisions(query) {
        const decisions = [];
        for (const [id, decision] of this.decisions) {
            if (this.matchesQuery(decision, query)) {
                decisions.push(decision);
            }
        }
        return decisions.slice(0, 10); // Limit results
    }

    /**
     * Search insights by query
     */
    async searchInsights(query) {
        const insights = [];
        for (const [id, insight] of this.insights) {
            if (this.matchesQuery(insight, query)) {
                insights.push(insight);
            }
        }
        return insights.slice(0, 10); // Limit results
    }

    /**
     * Generate recommendations based on project knowledge
     */
    async generateRecommendations(query) {
        const recommendations = [];

        // Pattern-based recommendations
        const similarPatterns = await this.searchPatterns(query.pattern || '');
        for (const pattern of similarPatterns) {
            if (pattern.recommendation) {
                recommendations.push({
                    type: 'pattern',
                    recommendation: pattern.recommendation,
                    confidence: pattern.confidence || 0.7,
                    source: pattern.id
                });
            }
        }

        // Decision-based recommendations
        const relatedDecisions = await this.searchDecisions(query.decision || '');
        for (const decision of relatedDecisions) {
            if (decision.alternatives && decision.alternatives.length > 0) {
                recommendations.push({
                    type: 'decision',
                    recommendation: `Consider alternatives: ${decision.alternatives.join(', ')}`,
                    confidence: 0.6,
                    source: decision.id
                });
            }
        }

        return recommendations.slice(0, 5); // Limit recommendations
    }

    /**
     * Analyze code pattern
     */
    async analyzeCodePattern(codeChange) {
        // Simple pattern detection - can be enhanced with AST analysis
        const pattern = {
            id: this.generateId(),
            type: 'code_pattern',
            pattern: codeChange.pattern || 'unknown',
            frequency: 1,
            files: [codeChange.file],
            timestamp: new Date().toISOString()
        };

        // Check if pattern already exists
        const existingPattern = Array.from(this.patterns.values())
            .find(p => p.pattern === pattern.pattern);

        if (existingPattern) {
            existingPattern.frequency++;
            existingPattern.files.push(codeChange.file);
            return existingPattern;
        }

        this.patterns.set(pattern.id, pattern);
        return pattern;
    }

    /**
     * Analyze problem-solving pattern
     */
    analyzeProblemSolvingPattern(problemSolving) {
        return {
            id: this.generateId(),
            type: 'problem_solving',
            problem: problemSolving.problem,
            approach: problemSolving.approach,
            solution: problemSolving.solution,
            effectiveness: problemSolving.effectiveness || 'unknown',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Analyze tool usage pattern
     */
    analyzeToolUsagePattern(toolUsage) {
        return {
            id: this.generateId(),
            type: 'tool_usage',
            tools: toolUsage.tools,
            context: toolUsage.context,
            effectiveness: toolUsage.effectiveness || 'unknown',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Load existing knowledge from disk
     */
    async loadExistingKnowledge() {
        try {
            // Load knowledge entries
            const knowledgeFiles = await fs.readdir(this.config.knowledgeDir).catch(() => []);
            for (const file of knowledgeFiles) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(this.config.knowledgeDir, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    const entry = JSON.parse(content);
                    this.knowledgeStore.set(entry.sessionId, entry);
                }
            }

            // Load patterns
            const patternsFile = path.join(this.config.patternsDir, 'patterns.json');
            try {
                const content = await fs.readFile(patternsFile, 'utf8');
                const patterns = JSON.parse(content);
                for (const pattern of patterns) {
                    this.patterns.set(pattern.id, pattern);
                }
            } catch (error) {
                // File doesn't exist yet, that's okay
            }

            console.log(`📚 Loaded ${this.knowledgeStore.size} knowledge entries and ${this.patterns.size} patterns`);
        } catch (error) {
            console.error('❌ Failed to load existing knowledge:', error);
        }
    }

    /**
     * Save knowledge entry to disk
     */
    async saveKnowledgeEntry(entry) {
        const filePath = path.join(this.config.knowledgeDir, `${entry.sessionId}.json`);
        await fs.writeFile(filePath, JSON.stringify(entry, null, 2), 'utf8');
    }

    /**
     * Save patterns to disk
     */
    async savePatterns() {
        const patternsFile = path.join(this.config.patternsDir, 'patterns.json');
        const patterns = Array.from(this.patterns.values());
        await fs.writeFile(patternsFile, JSON.stringify(patterns, null, 2), 'utf8');
    }

    /**
     * Utility methods
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    matchesQuery(item, query) {
        if (!query) return true;
        const searchText = JSON.stringify(item).toLowerCase();
        return searchText.includes(query.toLowerCase());
    }

    /**
     * Cleanup and shutdown
     */
    async shutdown() {
        await this.savePatterns();
        console.log(`🔄 Persistent Project Knowledge saved for: ${this.projectId}`);
    }
}

module.exports = PersistentProjectKnowledge;
