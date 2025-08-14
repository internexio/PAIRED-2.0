#!/usr/bin/env node

/**
 * PAIRED Agent CLI Interface
 * 
 * Provides agents with access to CLI tools and mass refactoring capabilities.
 * This is the primary interface agents use to discover and execute CLI commands.
 */

const { Command } = require('commander');
const chalk = require('chalk');
const AgentCLIRegistry = require('../core/agent_cli_registry');

const program = new Command();

program
    .name('agent-cli')
    .description('PAIRED Agent CLI Interface')
    .version('1.0.0');

/**
 * Discover available commands for an agent
 */
program
    .command('discover')
    .description('Discover available CLI commands for an agent')
    .requiredOption('-a, --agent <agent>', 'Agent name (Alex, Sherlock, Leonardo, Edison, Maya, Vince, Marie)')
    .option('--category <category>', 'Filter by command category')
    .option('--format <format>', 'Output format (json|table)', 'table')
    .action(async (options) => {
        try {
            const registry = new AgentCLIRegistry();
            await registry.initializeRegistry();

            const agentCommands = registry.getAgentCommands(options.agent);
            
            if (agentCommands.error) {
                console.error(chalk.red(`❌ ${agentCommands.error}`));
                process.exit(1);
            }

            // Filter by category if specified
            let commands = agentCommands.availableCommands;
            if (options.category) {
                commands = commands.filter(cmd => cmd.category === options.category);
            }

            if (options.format === 'json') {
                console.log(JSON.stringify({
                    agent: agentCommands.agent,
                    description: agentCommands.description,
                    massRefactoringAllowed: agentCommands.massRefactoringAllowed,
                    specialCapabilities: agentCommands.specialCapabilities,
                    commands: commands
                }, null, 2));
            } else {
                displayAgentCommands(agentCommands, commands);
            }
        } catch (error) {
            console.error(chalk.red('❌ Discovery failed:'), error.message);
            process.exit(1);
        }
    });

/**
 * Execute a command as an agent
 */
program
    .command('execute')
    .description('Execute a CLI command as an agent')
    .requiredOption('-a, --agent <agent>', 'Agent name')
    .requiredOption('-c, --command <command>', 'Command to execute')
    .option('--args <args...>', 'Command arguments')
    .option('--raw-args <rawArgs>', 'Raw command arguments as single string')
    .option('--cwd <directory>', 'Working directory')
    .option('--dry-run', 'Show what would be executed without running')
    .option('--format <format>', 'Output format (json|text)', 'text')
    .action(async (options) => {
        try {
            const registry = new AgentCLIRegistry();
            await registry.initializeRegistry();

            if (options.dryRun) {
                console.log(chalk.blue('🔍 Dry Run Mode'));
                console.log(`Agent: ${options.agent}`);
                console.log(`Command: ${options.command}`);
                console.log(`Args: ${(options.args || []).join(' ')}`);
                console.log(`Working Directory: ${options.cwd || process.cwd()}`);
                return;
            }

            console.log(chalk.blue(`🤖 Executing as ${options.agent}: ${options.command}`));
            
            const result = await registry.executeCommand(
                options.agent,
                options.command,
                options.args || [],
                { cwd: options.cwd }
            );

            if (options.format === 'json') {
                console.log(JSON.stringify(result, null, 2));
            } else {
                if (result.stdout) {
                    console.log(chalk.green('📤 Output:'));
                    console.log(result.stdout);
                }
                if (result.stderr) {
                    console.log(chalk.yellow('⚠️ Warnings:'));
                    console.log(result.stderr);
                }
                console.log(chalk.gray(`Exit Code: ${result.exitCode}`));
            }
        } catch (error) {
            console.error(chalk.red('❌ Execution failed:'), error.message);
            process.exit(1);
        }
    });

/**
 * Mass refactoring operations
 */
program
    .command('refactor')
    .description('Perform mass refactoring operations')
    .requiredOption('-a, --agent <agent>', 'Agent name')
    .requiredOption('-o, --operation <operation>', 'Refactoring operation (find-replace, rename-files, etc.)')
    .option('--pattern <pattern>', 'Search pattern')
    .option('--replacement <replacement>', 'Replacement text')
    .option('--files <files...>', 'Target files or patterns')
    .option('--dry-run', 'Show what would be changed without making changes')
    .option('--backup', 'Create backup files')
    .action(async (options) => {
        try {
            const registry = new AgentCLIRegistry();
            await registry.initializeRegistry();

            // Check if agent has mass refactoring permissions
            const agentCommands = registry.getAgentCommands(options.agent);
            if (!agentCommands.massRefactoringAllowed) {
                console.error(chalk.red(`❌ Agent ${options.agent} not permitted for mass refactoring operations`));
                process.exit(1);
            }

            console.log(chalk.blue(`🔧 Mass Refactoring: ${options.operation}`));
            
            switch (options.operation) {
                case 'find-replace':
                    await performFindReplace(registry, options);
                    break;
                case 'rename-files':
                    await performRenameFiles(registry, options);
                    break;
                case 'update-imports':
                    await performUpdateImports(registry, options);
                    break;
                default:
                    console.error(chalk.red(`❌ Unknown refactoring operation: ${options.operation}`));
                    process.exit(1);
            }
        } catch (error) {
            console.error(chalk.red('❌ Refactoring failed:'), error.message);
            process.exit(1);
        }
    });

/**
 * Show command history
 */
program
    .command('history')
    .description('Show command execution history')
    .option('-a, --agent <agent>', 'Filter by agent')
    .option('-l, --limit <limit>', 'Limit number of entries', '10')
    .action(async (options) => {
        try {
            const registry = new AgentCLIRegistry();
            await registry.initializeRegistry();

            const history = registry.getCommandHistory(options.agent, parseInt(options.limit));
            
            console.log(chalk.blue('📜 Command History'));
            console.log('==================');
            
            if (history.length === 0) {
                console.log(chalk.gray('No command history found'));
                return;
            }

            history.forEach((entry, index) => {
                const status = entry.success ? chalk.green('✅') : chalk.red('❌');
                const timestamp = new Date(entry.timestamp).toLocaleString();
                
                console.log(`${index + 1}. ${status} ${chalk.cyan(entry.agent)} - ${entry.command} ${entry.args?.join(' ') || ''}`);
                console.log(`   ${chalk.gray(timestamp)}`);
                if (!entry.success && entry.error) {
                    console.log(`   ${chalk.red('Error:')} ${entry.error}`);
                }
                console.log();
            });
        } catch (error) {
            console.error(chalk.red('❌ Failed to get history:'), error.message);
            process.exit(1);
        }
    });

/**
 * Show registry statistics
 */
program
    .command('stats')
    .description('Show CLI registry statistics')
    .action(async () => {
        try {
            const registry = new AgentCLIRegistry();
            await registry.initializeRegistry();

            const stats = registry.getRegistryStats();
            
            console.log(chalk.blue('📊 Agent CLI Registry Statistics'));
            console.log('=================================');
            console.log(`${chalk.green('Total Commands:')} ${stats.totalCommands}`);
            console.log(`${chalk.green('Available Commands:')} ${stats.availableCommands}`);
            console.log(`${chalk.green('Registered Agents:')} ${stats.registeredAgents}`);
            console.log(`${chalk.green('Command History:')} ${stats.commandHistory}`);
            console.log(`${chalk.green('Running Commands:')} ${stats.runningCommands}`);
        } catch (error) {
            console.error(chalk.red('❌ Failed to get statistics:'), error.message);
            process.exit(1);
        }
    });

/**
 * Helper Functions
 */

function displayAgentCommands(agentInfo, commands) {
    console.log(chalk.blue(`🤖 ${agentInfo.agent} - CLI Commands`));
    console.log('='.repeat(40));
    console.log(`${chalk.green('Description:')} ${agentInfo.description}`);
    console.log(`${chalk.green('Mass Refactoring:')} ${agentInfo.massRefactoringAllowed ? 'Allowed' : 'Not Allowed'}`);
    console.log();

    if (agentInfo.specialCapabilities.length > 0) {
        console.log(chalk.green('🌟 Special Capabilities:'));
        agentInfo.specialCapabilities.forEach(cap => {
            console.log(`  • ${cap}`);
        });
        console.log();
    }

    if (commands.length === 0) {
        console.log(chalk.gray('No commands available for this agent'));
        return;
    }

    console.log(chalk.green(`📋 Available Commands (${commands.length}):`));
    console.log();

    // Group by category
    const categories = {};
    commands.forEach(cmd => {
        if (!categories[cmd.category]) {
            categories[cmd.category] = [];
        }
        categories[cmd.category].push(cmd);
    });

    Object.entries(categories).forEach(([category, categoryCommands]) => {
        console.log(chalk.cyan(`${category.toUpperCase()}:`));
        categoryCommands.forEach(cmd => {
            const riskColor = cmd.riskLevel === 'high' ? chalk.red : 
                             cmd.riskLevel === 'medium' ? chalk.yellow : chalk.green;
            console.log(`  • ${chalk.white(cmd.name)} ${riskColor(`[${cmd.riskLevel}]`)}`);
            console.log(`    ${chalk.gray(cmd.description)}`);
            if (cmd.usage) {
                console.log(`    ${chalk.gray('Usage:')} ${cmd.usage}`);
            }
            if (cmd.examples && cmd.examples.length > 0) {
                console.log(`    ${chalk.gray('Examples:')} ${cmd.examples[0]}`);
            }
            console.log();
        });
    });
}

async function performFindReplace(registry, options) {
    if (!options.pattern || !options.replacement) {
        throw new Error('Pattern and replacement are required for find-replace operation');
    }

    const files = options.files || ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'];
    
    console.log(chalk.blue('🔍 Find and Replace Operation'));
    console.log(`Pattern: ${options.pattern}`);
    console.log(`Replacement: ${options.replacement}`);
    console.log(`Files: ${files.join(', ')}`);
    
    if (options.dryRun) {
        console.log(chalk.yellow('🔍 Dry run mode - no changes will be made'));
        
        // Use grep to find matches
        for (const filePattern of files) {
            try {
                const result = await registry.executeCommand(
                    options.agent,
                    'find',
                    ['.', '-name', filePattern, '-type', 'f', '-exec', 'grep', '-l', options.pattern, '{}', ';']
                );
                
                if (result.stdout.trim()) {
                    console.log(chalk.green('Files that would be modified:'));
                    console.log(result.stdout);
                }
            } catch (error) {
                // Ignore errors for dry run
            }
        }
    } else {
        console.log(chalk.red('⚠️ Actual find-replace execution not implemented yet for safety'));
        console.log(chalk.gray('Use --dry-run to see what would be changed'));
    }
}

async function performRenameFiles(registry, options) {
    console.log(chalk.blue('📝 File Rename Operation'));
    
    if (options.dryRun) {
        console.log(chalk.yellow('🔍 Dry run mode - no files will be renamed'));
        
        // Find files matching pattern
        const result = await registry.executeCommand(
            options.agent,
            'find',
            ['.', '-name', options.pattern || '*', '-type', 'f']
        );
        
        if (result.stdout.trim()) {
            console.log(chalk.green('Files that would be renamed:'));
            console.log(result.stdout);
        }
    } else {
        console.log(chalk.red('⚠️ Actual file renaming not implemented yet for safety'));
        console.log(chalk.gray('Use --dry-run to see what would be renamed'));
    }
}

async function performUpdateImports(registry, options) {
    console.log(chalk.blue('📦 Import Update Operation'));
    
    if (options.dryRun) {
        console.log(chalk.yellow('🔍 Dry run mode - no imports will be updated'));
        
        // Find import statements
        const result = await registry.executeCommand(
            options.agent,
            'grep',
            ['-r', '--include=*.js', '--include=*.ts', 'import.*from', '.']
        );
        
        if (result.stdout.trim()) {
            console.log(chalk.green('Import statements found:'));
            console.log(result.stdout.split('\n').slice(0, 10).join('\n')); // Show first 10
            if (result.stdout.split('\n').length > 10) {
                console.log(chalk.gray(`... and ${result.stdout.split('\n').length - 10} more`));
            }
        }
    } else {
        console.log(chalk.red('⚠️ Actual import updating not implemented yet for safety'));
        console.log(chalk.gray('Use --dry-run to see what would be updated'));
    }
}

// Handle CLI execution
if (require.main === module) {
    program.parse();
}

module.exports = program;
