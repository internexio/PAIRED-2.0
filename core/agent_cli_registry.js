/**
 * PAIRED Agent CLI Registry
 * 
 * Enables agents to discover, understand, and use available CLI tools
 * for automation, mass refactoring, and complex system tasks.
 * 
 * Key Features:
 * - Auto-discovery of available CLI commands
 * - Agent-specific tool mapping and permissions
 * - Context-aware tool recommendations
 * - Mass refactoring and automation capabilities
 * - Safe command execution with validation
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync, spawn } = require('child_process');

class AgentCLIRegistry {
    constructor(config = {}) {
        this.config = {
            pairedGlobalDir: config.pairedGlobalDir || process.env.PAIRED_GLOBAL_DIR || path.join(process.env.HOME, '.paired'),
            projectDir: config.projectDir || process.cwd(),
            enabledAgents: config.enabledAgents || ['Alex', 'Sherlock', 'Leonardo', 'Edison', 'Maya', 'Vince', 'Marie'],
            safeMode: config.safeMode !== false, // Default to safe mode
            maxConcurrentCommands: config.maxConcurrentCommands || 3,
            commandTimeout: config.commandTimeout || 30000, // 30 seconds
            ...config
        };

        this.availableCommands = new Map();
        this.agentPermissions = new Map();
        this.commandHistory = [];
        this.runningCommands = new Set();
        
        this.initializeRegistry();
    }

    /**
     * Initialize the CLI registry
     */
    async initializeRegistry() {
        await this.discoverAvailableCommands();
        await this.setupAgentPermissions();
        await this.loadCommandMetadata();
        
        console.log(`🤖 Agent CLI Registry initialized with ${this.availableCommands.size} commands`);
    }

    /**
     * Discover all available CLI commands
     */
    async discoverAvailableCommands() {
        const commands = new Map();

        // Core PAIRED commands
        const coreCommands = [
            { name: 'paired', description: 'Main PAIRED CLI', category: 'core', riskLevel: 'low' },
            { name: 'paired-init', description: 'Initialize PAIRED project', category: 'setup', riskLevel: 'low' },
            { name: 'paired-doctor', description: 'Health checks and diagnostics', category: 'diagnostic', riskLevel: 'low' }
        ];

        // Knowledge management commands
        const knowledgeCommands = [
            { name: 'paired knowledge init', description: 'Initialize project knowledge', category: 'knowledge', riskLevel: 'low' },
            { name: 'paired knowledge learn', description: 'Learn from development session', category: 'knowledge', riskLevel: 'low' },
            { name: 'paired knowledge context', description: 'Get project context', category: 'knowledge', riskLevel: 'low' },
            { name: 'paired knowledge search', description: 'Search project knowledge', category: 'knowledge', riskLevel: 'low' },
            { name: 'paired knowledge stats', description: 'Knowledge statistics', category: 'knowledge', riskLevel: 'low' },
            { name: 'paired knowledge export', description: 'Export project knowledge', category: 'knowledge', riskLevel: 'low' }
        ];

        // Collaboration commands
        const collaborationCommands = [
            { name: 'paired collaborate list', description: 'List collaboration templates', category: 'collaboration', riskLevel: 'low' },
            { name: 'paired collaborate show', description: 'Show collaboration template', category: 'collaboration', riskLevel: 'low' },
            { name: 'paired collaborate start', description: 'Start collaboration workflow', category: 'collaboration', riskLevel: 'medium' }
        ];

        // Mass refactoring commands
        const refactoringCommands = [
            { name: 'find', description: 'Find files and directories', category: 'refactoring', riskLevel: 'low' },
            { name: 'grep', description: 'Search text patterns', category: 'refactoring', riskLevel: 'low' },
            { name: 'sed', description: 'Stream editor for filtering and transforming text', category: 'refactoring', riskLevel: 'high' },
            { name: 'awk', description: 'Pattern scanning and processing', category: 'refactoring', riskLevel: 'medium' }
        ];

        // Git commands for version control
        const gitCommands = [
            { name: 'git status', description: 'Show repository status', category: 'git', riskLevel: 'low' },
            { name: 'git diff', description: 'Show changes', category: 'git', riskLevel: 'low' },
            { name: 'git log', description: 'Show commit history', category: 'git', riskLevel: 'low' },
            { name: 'git branch', description: 'List branches', category: 'git', riskLevel: 'low' }
        ];

        // Combine all commands
        const allCommands = [
            ...coreCommands,
            ...knowledgeCommands,
            ...collaborationCommands,
            ...refactoringCommands,
            ...gitCommands
        ];

        // Add commands to registry
        for (const cmd of allCommands) {
            commands.set(cmd.name, {
                ...cmd,
                available: await this.checkCommandAvailability(cmd.name),
                usage: await this.getCommandUsage(cmd.name),
                examples: await this.getCommandExamples(cmd.name)
            });
        }

        this.availableCommands = commands;
    }

    /**
     * Setup agent-specific permissions and capabilities
     */
    async setupAgentPermissions() {
        const permissions = new Map();

        // Alex (PM) - Project management and coordination
        permissions.set('Alex', {
            allowedCategories: ['core', 'knowledge', 'collaboration', 'git'],
            allowedRiskLevels: ['low', 'medium'],
            specialCapabilities: [
                'paired knowledge context',
                'paired collaborate list',
                'paired collaborate start',
                'git status',
                'git log'
            ],
            massRefactoringAllowed: false,
            description: 'Project management and strategic coordination'
        });

        // Sherlock (QA) - Quality analysis and testing
        permissions.set('Sherlock', {
            allowedCategories: ['core', 'knowledge', 'refactoring', 'git'],
            allowedRiskLevels: ['low', 'medium'],
            specialCapabilities: [
                'paired knowledge search',
                'find',
                'grep',
                'git diff',
                'paired-doctor'
            ],
            massRefactoringAllowed: true,
            description: 'Quality analysis and code investigation'
        });

        // Leonardo (Architecture) - System design and analysis
        permissions.set('Leonardo', {
            allowedCategories: ['core', 'knowledge', 'refactoring', 'git'],
            allowedRiskLevels: ['low', 'medium', 'high'],
            specialCapabilities: [
                'paired knowledge context',
                'find',
                'grep',
                'awk',
                'git log'
            ],
            massRefactoringAllowed: true,
            description: 'Architectural analysis and system design'
        });

        // Edison (Dev) - Development and implementation
        permissions.set('Edison', {
            allowedCategories: ['core', 'knowledge', 'refactoring', 'git'],
            allowedRiskLevels: ['low', 'medium', 'high'],
            specialCapabilities: [
                'paired knowledge learn',
                'find',
                'grep',
                'sed',
                'awk',
                'git status',
                'git diff'
            ],
            massRefactoringAllowed: true,
            description: 'Development implementation and debugging'
        });

        // Maya (UX) - User experience and design
        permissions.set('Maya', {
            allowedCategories: ['core', 'knowledge', 'refactoring'],
            allowedRiskLevels: ['low', 'medium'],
            specialCapabilities: [
                'paired knowledge search',
                'find',
                'grep'
            ],
            massRefactoringAllowed: false,
            description: 'User experience design and accessibility'
        });

        // Vince (Scrum Master) - Process and coordination
        permissions.set('Vince', {
            allowedCategories: ['core', 'knowledge', 'collaboration', 'git'],
            allowedRiskLevels: ['low', 'medium'],
            specialCapabilities: [
                'paired collaborate list',
                'paired collaborate start',
                'paired knowledge stats',
                'git status'
            ],
            massRefactoringAllowed: false,
            description: 'Process management and team coordination'
        });

        // Marie (Analyst) - Data analysis and insights
        permissions.set('Marie', {
            allowedCategories: ['core', 'knowledge', 'refactoring'],
            allowedRiskLevels: ['low', 'medium'],
            specialCapabilities: [
                'paired knowledge search',
                'paired knowledge export',
                'find',
                'grep',
                'awk'
            ],
            massRefactoringAllowed: true,
            description: 'Data analysis and pattern recognition'
        });

        this.agentPermissions = permissions;
    }

    /**
     * Map agent name or role to canonical agent name
     */
    resolveAgentName(input) {
        const nameRoleMap = {
            // Names (canonical)
            'Alex': 'Alex',
            'Sherlock': 'Sherlock', 
            'Leonardo': 'Leonardo',
            'Edison': 'Edison',
            'Maya': 'Maya',
            'Vince': 'Vince',
            'Marie': 'Marie',
            
            // Roles (mapped to names)
            'PM': 'Alex',
            'QA': 'Sherlock',
            'Architecture': 'Leonardo',
            'Arch': 'Leonardo',
            'Dev': 'Edison', 
            'UX': 'Maya',
            'Scrum': 'Vince',
            'Analyst': 'Marie',
            
            // Lowercase variants
            'alex': 'Alex',
            'sherlock': 'Sherlock',
            'leonardo': 'Leonardo', 
            'edison': 'Edison',
            'maya': 'Maya',
            'vince': 'Vince',
            'marie': 'Marie',
            'pm': 'Alex',
            'qa': 'Sherlock',
            'architecture': 'Leonardo',
            'arch': 'Leonardo',
            'dev': 'Edison',
            'ux': 'Maya', 
            'scrum': 'Vince',
            'analyst': 'Marie'
        };
        
        return nameRoleMap[input] || null;
    }

    /**
     * Get available commands for a specific agent
     */
    getAgentCommands(agentName) {
        // Resolve agent name/role to canonical name
        const resolvedName = this.resolveAgentName(agentName);
        if (!resolvedName) {
            return { error: `Unknown agent: ${agentName}. Try: Alex/PM, Sherlock/QA, Leonardo/Architecture, Edison/Dev, Maya/UX, Vince/Scrum, Marie/Analyst` };
        }
        
        const permissions = this.agentPermissions.get(resolvedName);
        if (!permissions) {
            return { error: `Unknown agent: ${agentName}` };
        }

        const availableCommands = [];
        
        for (const [cmdName, cmdInfo] of this.availableCommands) {
            if (cmdInfo.available &&
                permissions.allowedCategories.includes(cmdInfo.category) &&
                permissions.allowedRiskLevels.includes(cmdInfo.riskLevel)) {
                availableCommands.push({
                    name: cmdName,
                    description: cmdInfo.description,
                    category: cmdInfo.category,
                    riskLevel: cmdInfo.riskLevel,
                    usage: cmdInfo.usage,
                    examples: cmdInfo.examples
                });
            }
        }

        return {
            agent: agentName,
            description: permissions.description,
            massRefactoringAllowed: permissions.massRefactoringAllowed,
            specialCapabilities: permissions.specialCapabilities,
            availableCommands
        };
    }

    /**
     * Execute a command for an agent with safety checks
     */
    async executeCommand(agentName, command, args = [], options = {}) {
        // Resolve agent name/role to canonical name
        const resolvedName = this.resolveAgentName(agentName);
        if (!resolvedName) {
            throw new Error(`Unknown agent: ${agentName}. Try: Alex/PM, Sherlock/QA, Leonardo/Architecture, Edison/Dev, Maya/UX, Vince/Scrum, Marie/Analyst`);
        }
        
        // Validate agent permissions
        const permissions = this.agentPermissions.get(resolvedName);
        if (!permissions) {
            throw new Error(`Unknown agent: ${agentName}`);
        }

        // Validate command availability
        const cmdInfo = this.availableCommands.get(command);
        if (!cmdInfo || !cmdInfo.available) {
            throw new Error(`Command not available: ${command}`);
        }

        // Check permissions
        if (!permissions.allowedCategories.includes(cmdInfo.category)) {
            throw new Error(`Agent ${agentName} not permitted to use ${cmdInfo.category} commands`);
        }

        if (!permissions.allowedRiskLevels.includes(cmdInfo.riskLevel)) {
            throw new Error(`Agent ${agentName} not permitted to use ${cmdInfo.riskLevel} risk commands`);
        }

        // Check concurrent command limit
        if (this.runningCommands.size >= this.config.maxConcurrentCommands) {
            throw new Error('Maximum concurrent commands reached');
        }

        // Execute command safely
        const executionId = `${agentName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.runningCommands.add(executionId);

        try {
            const result = await this.safeExecuteCommand(command, args, options);
            
            // Log command execution
            this.commandHistory.push({
                executionId,
                agent: agentName,
                command,
                args,
                timestamp: new Date().toISOString(),
                success: true,
                result: result.stdout ? result.stdout.substring(0, 1000) : 'No output' // Limit log size
            });

            return result;
        } catch (error) {
            // Log failed execution
            this.commandHistory.push({
                executionId,
                agent: agentName,
                command,
                args,
                timestamp: new Date().toISOString(),
                success: false,
                error: error.message
            });

            throw error;
        } finally {
            this.runningCommands.delete(executionId);
        }
    }

    /**
     * Safely execute a command with timeout and validation
     */
    async safeExecuteCommand(command, args = [], options = {}) {
        return new Promise((resolve, reject) => {
            const fullCommand = `${command} ${args.join(' ')}`;
            
            // Set up timeout
            const timeout = setTimeout(() => {
                reject(new Error(`Command timeout: ${fullCommand}`));
            }, this.config.commandTimeout);

            try {
                // For safe, read-only commands, use execSync
                if (this.isReadOnlyCommand(command)) {
                    const result = execSync(fullCommand, {
                        cwd: options.cwd || this.config.projectDir,
                        encoding: 'utf8',
                        maxBuffer: 1024 * 1024, // 1MB limit
                        timeout: this.config.commandTimeout
                    });

                    clearTimeout(timeout);
                    resolve({ stdout: result, stderr: '', exitCode: 0 });
                } else {
                    // For potentially dangerous commands, use spawn with more control
                    const child = spawn(command, args, {
                        cwd: options.cwd || this.config.projectDir,
                        stdio: ['pipe', 'pipe', 'pipe']
                    });

                    let stdout = '';
                    let stderr = '';

                    child.stdout.on('data', (data) => {
                        stdout += data.toString();
                        if (stdout.length > 1024 * 1024) { // 1MB limit
                            child.kill();
                            reject(new Error('Command output too large'));
                        }
                    });

                    child.stderr.on('data', (data) => {
                        stderr += data.toString();
                    });

                    child.on('close', (code) => {
                        clearTimeout(timeout);
                        resolve({ stdout, stderr, exitCode: code });
                    });

                    child.on('error', (error) => {
                        clearTimeout(timeout);
                        reject(error);
                    });
                }
            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        });
    }

    /**
     * Check if a command is read-only (safe)
     */
    isReadOnlyCommand(command) {
        const readOnlyCommands = [
            'find', 'grep', 'ls', 'cat', 'head', 'tail', 'wc',
            'git status', 'git log', 'git diff', 'git branch',
            'paired knowledge context', 'paired knowledge search', 'paired knowledge stats',
            'paired collaborate list', 'paired collaborate show',
            'paired-doctor'
        ];

        return readOnlyCommands.some(safe => command.startsWith(safe));
    }

    /**
     * Get command usage information
     */
    async getCommandUsage(command) {
        const usageMap = {
            'paired knowledge context': 'paired knowledge context [--query <query>] [--patterns] [--decisions] [--insights]',
            'paired knowledge search': 'paired knowledge search <query> [--type <type>] [--limit <limit>]',
            'paired knowledge learn': 'paired knowledge learn [--interactive] [--file <file>] [--data <json>]',
            'paired collaborate list': 'paired collaborate list',
            'paired collaborate start': 'paired collaborate start <template_name>',
            'find': 'find <path> [options] [expression]',
            'grep': 'grep [options] <pattern> [file...]',
            'git status': 'git status [options]',
            'git diff': 'git diff [options] [<commit>] [--] [<path>...]'
        };

        return usageMap[command] || `${command} [options]`;
    }

    /**
     * Get command examples
     */
    async getCommandExamples(command) {
        const examplesMap = {
            'paired knowledge search': [
                'paired knowledge search "authentication"',
                'paired knowledge search "database" --type decisions',
                'paired knowledge search "performance" --limit 5'
            ],
            'find': [
                'find . -name "*.js" -type f',
                'find src/ -name "*.test.js"',
                'find . -type d -name node_modules'
            ],
            'grep': [
                'grep -r "TODO" src/',
                'grep -n "function" *.js',
                'grep -i "error" logs/*.log'
            ],
            'git diff': [
                'git diff HEAD~1',
                'git diff --name-only',
                'git diff src/components/'
            ]
        };

        return examplesMap[command] || [];
    }

    /**
     * Check if a command is available on the system
     */
    async checkCommandAvailability(command) {
        try {
            // For PAIRED commands, check if the script exists
            if (command.startsWith('paired')) {
                const pairedBin = path.join(this.config.pairedGlobalDir, 'bin', 'paired');
                await fs.access(pairedBin);
                return true;
            }

            // For system commands, try to execute with --version or --help
            const baseCommand = command.split(' ')[0];
            execSync(`which ${baseCommand}`, { stdio: 'ignore' });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Load additional command metadata
     */
    async loadCommandMetadata() {
        // This could load from configuration files or discover from man pages
        // For now, we'll use the built-in metadata
    }

    /**
     * Get command execution history
     */
    getCommandHistory(agentName = null, limit = 10) {
        let history = this.commandHistory;
        
        if (agentName) {
            history = history.filter(entry => entry.agent === agentName);
        }

        return history.slice(-limit);
    }

    /**
     * Get registry statistics
     */
    getRegistryStats() {
        return {
            totalCommands: this.availableCommands.size,
            availableCommands: Array.from(this.availableCommands.values()).filter(cmd => cmd.available).length,
            registeredAgents: this.agentPermissions.size,
            commandHistory: this.commandHistory.length,
            runningCommands: this.runningCommands.size
        };
    }
}

module.exports = AgentCLIRegistry;
