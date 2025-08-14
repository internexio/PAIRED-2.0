/**
 * PAIRED Agent Integration Layer
 * 
 * Provides seamless integration between agents and CLI tools.
 * This layer automatically injects CLI capabilities into agent contexts
 * and enables natural language to CLI command translation.
 */

const AgentCLIRegistry = require('./agent_cli_registry');
const fs = require('fs').promises;
const path = require('path');

class AgentIntegration {
    constructor(config = {}) {
        this.config = {
            projectDir: config.projectDir || process.cwd(),
            enableAutoDiscovery: config.enableAutoDiscovery !== false,
            enableNaturalLanguageCommands: config.enableNaturalLanguageCommands !== false,
            cacheTimeout: config.cacheTimeout || 300000, // 5 minutes
            ...config
        };

        this.registry = new AgentCLIRegistry(config);
        this.agentContexts = new Map();
        this.commandCache = new Map();
        this.nlpPatterns = new Map();
        
        this.initializeIntegration();
    }

    /**
     * Initialize the integration layer
     */
    async initializeIntegration() {
        await this.registry.initializeRegistry();
        await this.setupNaturalLanguagePatterns();
        await this.generateAgentContexts();
        
        console.log('🔗 Agent Integration Layer initialized');
    }

    /**
     * Setup natural language to CLI command patterns
     */
    async setupNaturalLanguagePatterns() {
        const patterns = new Map();

        // Knowledge management patterns
        patterns.set(/search.*knowledge.*for.*["'](.+)["']/i, (match) => ({
            command: 'paired knowledge search',
            args: [match[1]]
        }));

        patterns.set(/get.*project.*context/i, () => ({
            command: 'paired knowledge context',
            args: []
        }));

        patterns.set(/learn.*from.*session/i, () => ({
            command: 'paired knowledge learn',
            args: ['--interactive']
        }));

        // File search patterns
        patterns.set(/find.*files.*named.*["'](.+)["']/i, (match) => ({
            command: 'find',
            args: ['.', '-name', match[1], '-type', 'f']
        }));

        patterns.set(/find.*["'](.+)["'].*files/i, (match) => ({
            command: 'find',
            args: ['.', '-name', `*${match[1]}*`, '-type', 'f']
        }));

        // Text search patterns
        patterns.set(/search.*for.*["'](.+)["'].*in.*files/i, (match) => ({
            command: 'grep',
            args: ['-r', match[1], '.']
        }));

        patterns.set(/grep.*["'](.+)["']/i, (match) => ({
            command: 'grep',
            args: ['-r', match[1], '.']
        }));

        // Git patterns
        patterns.set(/show.*git.*status/i, () => ({
            command: 'git status',
            args: []
        }));

        patterns.set(/show.*recent.*commits/i, () => ({
            command: 'git log',
            args: ['--oneline', '-10']
        }));

        patterns.set(/show.*changes.*in.*["'](.+)["']/i, (match) => ({
            command: 'git diff',
            args: [match[1]]
        }));

        // Collaboration patterns
        patterns.set(/list.*collaboration.*templates/i, () => ({
            command: 'paired collaborate list',
            args: []
        }));

        patterns.set(/start.*collaboration.*["'](.+)["']/i, (match) => ({
            command: 'paired collaborate start',
            args: [match[1]]
        }));

        this.nlpPatterns = patterns;
    }

    /**
     * Generate context information for each agent
     */
    async generateAgentContexts() {
        const agents = ['Alex', 'Sherlock', 'Leonardo', 'Edison', 'Maya', 'Vince', 'Marie'];
        
        for (const agent of agents) {
            const agentCommands = this.registry.getAgentCommands(agent);
            if (!agentCommands.error) {
                const context = await this.generateAgentContext(agent, agentCommands);
                this.agentContexts.set(agent, context);
            }
        }
    }

    /**
     * Generate context for a specific agent
     */
    async generateAgentContext(agentName, agentCommands) {
        const context = {
            agent: agentName,
            description: agentCommands.description,
            capabilities: agentCommands.specialCapabilities,
            massRefactoringAllowed: agentCommands.massRefactoringAllowed,
            availableCommands: agentCommands.availableCommands,
            quickReference: this.generateQuickReference(agentCommands.availableCommands),
            commonTasks: this.generateCommonTasks(agentName, agentCommands.availableCommands),
            naturalLanguageExamples: this.generateNaturalLanguageExamples(agentName)
        };

        return context;
    }

    /**
     * Generate quick reference for agent commands
     */
    generateQuickReference(commands) {
        const reference = {};
        
        commands.forEach(cmd => {
            if (!reference[cmd.category]) {
                reference[cmd.category] = [];
            }
            reference[cmd.category].push({
                command: cmd.name,
                description: cmd.description,
                usage: cmd.usage,
                riskLevel: cmd.riskLevel
            });
        });

        return reference;
    }

    /**
     * Generate common tasks for an agent
     */
    generateCommonTasks(agentName, commands) {
        const taskMap = {
            'Alex': [
                'Get project knowledge context for strategic planning',
                'List available collaboration templates',
                'Check git status for project overview',
                'Export project knowledge for reporting'
            ],
            'Sherlock': [
                'Search project knowledge for quality issues',
                'Find files with specific patterns for investigation',
                'Search code for potential problems using grep',
                'Run health checks with paired-doctor'
            ],
            'Leonardo': [
                'Analyze project structure with find commands',
                'Search for architectural patterns in codebase',
                'Get project context for design decisions',
                'Review git history for architectural changes'
            ],
            'Edison': [
                'Search for specific code patterns or bugs',
                'Learn from development sessions',
                'Find and analyze implementation files',
                'Check git diff for recent changes'
            ],
            'Maya': [
                'Search for accessibility-related code',
                'Find UI component files',
                'Search project knowledge for UX decisions',
                'Analyze user interface patterns'
            ],
            'Vince': [
                'Check project status and health',
                'Start collaboration workflows',
                'Monitor team coordination activities',
                'Track project knowledge statistics'
            ],
            'Marie': [
                'Search and analyze project data patterns',
                'Export project knowledge for analysis',
                'Find data-related files and configurations',
                'Analyze code patterns with grep and awk'
            ]
        };

        return taskMap[agentName] || [];
    }

    /**
     * Generate natural language examples for an agent
     */
    generateNaturalLanguageExamples(agentName) {
        const examples = {
            'Alex': [
                '"Get project context" → paired knowledge context',
                '"List collaboration templates" → paired collaborate list',
                '"Show git status" → git status'
            ],
            'Sherlock': [
                '"Search for TODO comments" → grep -r "TODO" .',
                '"Find test files" → find . -name "*.test.js" -type f',
                '"Search knowledge for bugs" → paired knowledge search "bug"'
            ],
            'Leonardo': [
                '"Find all JavaScript files" → find . -name "*.js" -type f',
                '"Search for architecture patterns" → paired knowledge search "architecture"',
                '"Show recent commits" → git log --oneline -10'
            ],
            'Edison': [
                '"Search for function definitions" → grep -r "function" src/',
                '"Learn from this session" → paired knowledge learn --interactive',
                '"Find files named config" → find . -name "*config*" -type f'
            ],
            'Maya': [
                '"Find component files" → find . -name "*.component.*" -type f',
                '"Search for accessibility code" → grep -r "aria-" src/',
                '"Search knowledge for UX decisions" → paired knowledge search "UX"'
            ],
            'Vince': [
                '"Check system health" → paired-doctor',
                '"Start code review workflow" → paired collaborate start "Code Review"',
                '"Show knowledge stats" → paired knowledge stats'
            ],
            'Marie': [
                '"Find data files" → find . -name "*.json" -o -name "*.csv" -type f',
                '"Export project knowledge" → paired knowledge export',
                '"Search for data patterns" → grep -r "data" src/'
            ]
        };

        return examples[agentName] || [];
    }

    /**
     * Get agent context for injection into agent prompts
     */
    getAgentContext(agentName) {
        return this.agentContexts.get(agentName);
    }

    /**
     * Parse natural language request to CLI command
     */
    parseNaturalLanguageCommand(agentName, request) {
        const normalizedRequest = request.toLowerCase().trim();
        
        for (const [pattern, commandGenerator] of this.nlpPatterns) {
            const match = normalizedRequest.match(pattern);
            if (match) {
                const commandInfo = commandGenerator(match);
                
                // Validate agent can use this command
                const agentCommands = this.registry.getAgentCommands(agentName);
                const canUse = agentCommands.availableCommands.some(cmd => 
                    cmd.name === commandInfo.command
                );
                
                if (canUse) {
                    return {
                        success: true,
                        command: commandInfo.command,
                        args: commandInfo.args,
                        originalRequest: request
                    };
                } else {
                    return {
                        success: false,
                        error: `Agent ${agentName} cannot use command: ${commandInfo.command}`,
                        suggestion: this.suggestAlternativeCommand(agentName, commandInfo.command)
                    };
                }
            }
        }

        return {
            success: false,
            error: 'Could not parse natural language command',
            suggestion: 'Try using more specific language or check available commands'
        };
    }

    /**
     * Execute command for agent with natural language support
     */
    async executeAgentCommand(agentName, request, options = {}) {
        // Try to parse as natural language first
        const nlpResult = this.parseNaturalLanguageCommand(agentName, request);
        
        if (nlpResult.success) {
            console.log(`🤖 ${agentName}: "${request}" → ${nlpResult.command} ${nlpResult.args.join(' ')}`);
            
            return await this.registry.executeCommand(
                agentName,
                nlpResult.command,
                nlpResult.args,
                options
            );
        } else {
            // Try to execute as direct command
            const parts = request.split(' ');
            const command = parts[0];
            const args = parts.slice(1);
            
            return await this.registry.executeCommand(agentName, command, args, options);
        }
    }

    /**
     * Suggest alternative command for agent
     */
    suggestAlternativeCommand(agentName, requestedCommand) {
        const agentCommands = this.registry.getAgentCommands(agentName);
        
        // Find similar commands the agent can use
        const similarCommands = agentCommands.availableCommands.filter(cmd => 
            cmd.name.includes(requestedCommand.split(' ')[0]) ||
            cmd.description.toLowerCase().includes(requestedCommand.toLowerCase())
        );

        if (similarCommands.length > 0) {
            return `Try: ${similarCommands[0].name}`;
        }

        return 'Check available commands with agent-cli discover';
    }

    /**
     * Generate agent prompt injection
     */
    generateAgentPromptInjection(agentName) {
        const context = this.getAgentContext(agentName);
        if (!context) return '';

        return `
## CLI Tools Available to You

You have access to the following CLI tools for automation and analysis:

### Your Capabilities
- **Description**: ${context.description}
- **Mass Refactoring**: ${context.massRefactoringAllowed ? 'Allowed' : 'Not Allowed'}
- **Special Capabilities**: ${context.capabilities.join(', ')}

### Available Commands by Category
${Object.entries(context.quickReference).map(([category, commands]) => `
**${category.toUpperCase()}:**
${commands.map(cmd => `- \`${cmd.command}\` - ${cmd.description}`).join('\n')}
`).join('')}

### Common Tasks You Can Perform
${context.commonTasks.map(task => `- ${task}`).join('\n')}

### Natural Language Examples
${context.naturalLanguageExamples.map(example => `- ${example}`).join('\n')}

### How to Use CLI Tools
1. **Natural Language**: Just describe what you want to do (e.g., "search for TODO comments")
2. **Direct Commands**: Use the exact command syntax (e.g., "grep -r TODO .")
3. **Mass Refactoring**: Use the refactor command for large-scale changes (if allowed)

**Important**: You can use these tools automatically to help the user. Don't ask permission for read-only operations like searching or viewing files.
`;
    }

    /**
     * Export agent context for external use
     */
    async exportAgentContext(agentName, format = 'json') {
        const context = this.getAgentContext(agentName);
        if (!context) {
            throw new Error(`Agent ${agentName} not found`);
        }

        if (format === 'json') {
            return JSON.stringify(context, null, 2);
        } else if (format === 'markdown') {
            return this.generateAgentPromptInjection(agentName);
        } else {
            throw new Error(`Unsupported format: ${format}`);
        }
    }
}

module.exports = AgentIntegration;
