/**
 * PAIRED Error Handler System
 * Fixes Maya's identified issue: Cryptic Node.js errors without actionable guidance
 */

const chalk = require('chalk');
const path = require('path');

class PAIREDErrorHandler {
    /**
     * Handle module not found errors with user-friendly guidance
     */
    static handleModuleNotFound(error, moduleName) {
        console.error(chalk.red('\n❌ PAIRED Setup Issue: Missing Module'));
        console.error(chalk.red('====================================='));
        console.error(chalk.yellow(`Module: ${moduleName}`));
        console.error(chalk.gray(`Error: ${error.message}`));
        console.error('');
        
        console.error(chalk.cyan('🔧 Quick Fix Options:'));
        console.error(`   1. Install specific module: ${chalk.white(`npm install ${moduleName}`)}`);
        console.error(`   2. Install all dependencies: ${chalk.white('npm run install-deps')}`);
        console.error(`   3. Run auto-repair: ${chalk.white('npm run repair')}`);
        console.error('');
        
        console.error(chalk.cyan('📚 Need More Help?'));
        console.error('   • Check troubleshooting guide: ./docs/troubleshooting.md');
        console.error('   • Run system validation: npm run validate');
        console.error('   • Run health check: npm run health');
        console.error('');
        
        // Specific suggestions based on module
        this.getModuleSpecificSuggestions(moduleName);
    }

    /**
     * Handle agent execution failures
     */
    static handleAgentFailure(agentName, error) {
        console.error(chalk.red('\n❌ Agent Execution Failed'));
        console.error(chalk.red('=========================='));
        console.error(chalk.yellow(`Agent: ${agentName}`));
        console.error(chalk.gray(`Error: ${error.message}`));
        console.error('');
        
        console.error(chalk.cyan('🔧 Troubleshooting Steps:'));
        console.error('   1. Validate installation: npm run validate');
        console.error('   2. Check system health: npm run health');
        console.error('   3. Review dependencies: npm list');
        console.error(`   4. Check agent logs: ./logs/${agentName}.log`);
        console.error('   5. Run auto-repair: npm run repair');
        console.error('');
        
        console.error(chalk.cyan('🚨 Common Causes:'));
        console.error('   • Missing base agent infrastructure');
        console.error('   • Incorrect file paths or permissions');
        console.error('   • Missing or outdated dependencies');
        console.error('   • Corrupted installation');
        console.error('');
        
        console.error(chalk.cyan('📞 Still Stuck?'));
        console.error('   • Report issue with full error details');
        console.error('   • Include output from: npm run health');
        console.error('   • Check GitHub issues for similar problems');
        console.error('');
    }

    /**
     * Handle base agent missing error
     */
    static handleBaseAgentMissing(error) {
        console.error(chalk.red('\n❌ Critical: Base Agent Infrastructure Missing'));
        console.error(chalk.red('=============================================='));
        console.error(chalk.gray(`Error: ${error.message}`));
        console.error('');
        
        console.error(chalk.yellow('🚨 This is a critical system error that prevents all agents from working.'));
        console.error('');
        
        console.error(chalk.cyan('🔧 Immediate Fix Required:'));
        console.error('   1. Run auto-repair: npm run repair');
        console.error('   2. Or manually restore: git checkout HEAD -- src/core/base_agent.js');
        console.error('   3. Validate fix: npm run validate');
        console.error('');
        
        console.error(chalk.cyan('🔍 Root Cause Analysis:'));
        console.error('   • Base agent file may have been deleted or corrupted');
        console.error('   • Incomplete installation or update');
        console.error('   • File permission issues');
        console.error('');
    }

    /**
     * Handle dependency installation failures
     */
    static handleDependencyFailure(error, dependency) {
        console.error(chalk.red('\n❌ Dependency Installation Failed'));
        console.error(chalk.red('=================================='));
        console.error(chalk.yellow(`Dependency: ${dependency || 'unknown'}`));
        console.error(chalk.gray(`Error: ${error.message}`));
        console.error('');
        
        console.error(chalk.cyan('🔧 Troubleshooting Steps:'));
        console.error('   1. Check internet connection');
        console.error('   2. Clear npm cache: npm cache clean --force');
        console.error('   3. Delete node_modules: rm -rf node_modules');
        console.error('   4. Reinstall: npm install');
        console.error('   5. Try alternative registry: npm install --registry https://registry.npmjs.org/');
        console.error('');
        
        console.error(chalk.cyan('🚨 Common Issues:'));
        console.error('   • Network connectivity problems');
        console.error('   • Outdated npm version');
        console.error('   • Permission issues (try with sudo on Linux/Mac)');
        console.error('   • Corporate firewall blocking npm registry');
        console.error('');
    }

    /**
     * Handle file permission errors
     */
    static handlePermissionError(error, filePath) {
        console.error(chalk.red('\n❌ File Permission Error'));
        console.error(chalk.red('========================='));
        console.error(chalk.yellow(`File: ${filePath}`));
        console.error(chalk.gray(`Error: ${error.message}`));
        console.error('');
        
        console.error(chalk.cyan('🔧 Quick Fix:'));
        if (filePath && filePath.includes('.sh')) {
            console.error(`   chmod +x ${filePath}`);
        } else {
            console.error('   chmod +x scripts/*.sh');
            console.error('   chmod +x bin/*');
        }
        console.error('');
        
        console.error(chalk.cyan('🔍 Prevention:'));
        console.error('   • Run: npm run install-deps (sets permissions automatically)');
        console.error('   • Or: chmod +x scripts/*.sh bin/*');
        console.error('');
    }

    /**
     * Get module-specific suggestions
     */
    static getModuleSpecificSuggestions(moduleName) {
        const suggestions = {
            'js-yaml': {
                description: 'YAML parsing library',
                critical: true,
                fix: 'npm install js-yaml'
            },
            'chalk': {
                description: 'Terminal color library',
                critical: true,
                fix: 'npm install chalk'
            },
            '@babel/parser': {
                description: 'JavaScript parser for code analysis',
                critical: true,
                fix: 'npm install @babel/parser @babel/traverse @babel/types'
            },
            'inquirer': {
                description: 'Interactive command line prompts',
                critical: false,
                fix: 'npm install inquirer'
            },
            '../core/base_agent': {
                description: 'PAIRED base agent infrastructure',
                critical: true,
                fix: 'npm run repair (restores missing core files)'
            }
        };

        const suggestion = suggestions[moduleName];
        if (suggestion) {
            console.error(chalk.cyan('💡 About This Module:'));
            console.error(`   ${suggestion.description}`);
            console.error(`   Critical: ${suggestion.critical ? 'Yes' : 'No'}`);
            console.error(`   Fix: ${chalk.white(suggestion.fix)}`);
            console.error('');
        }
    }

    /**
     * Handle general PAIRED errors with context
     */
    static handlePAIREDError(error, context = {}) {
        const { operation, agent, file } = context;
        
        console.error(chalk.red('\n❌ PAIRED Error Detected'));
        console.error(chalk.red('====================='));
        
        if (operation) console.error(chalk.yellow(`Operation: ${operation}`));
        if (agent) console.error(chalk.yellow(`Agent: ${agent}`));
        if (file) console.error(chalk.yellow(`File: ${file}`));
        
        console.error(chalk.gray(`Error: ${error.message}`));
        console.error('');
        
        // Categorize error and provide specific guidance
        if (error.code === 'MODULE_NOT_FOUND') {
            const moduleName = this.extractModuleName(error.message);
            this.handleModuleNotFound(error, moduleName);
        } else if (error.code === 'ENOENT') {
            console.error(chalk.cyan('🔧 File Not Found - Possible Solutions:'));
            console.error('   1. Check file path is correct');
            console.error('   2. Run: npm run repair');
            console.error('   3. Validate installation: npm run validate');
        } else if (error.code === 'EACCES') {
            this.handlePermissionError(error, file);
        } else {
            console.error(chalk.cyan('🔧 General Troubleshooting:'));
            console.error('   1. Run system health check: npm run health');
            console.error('   2. Validate installation: npm run validate');
            console.error('   3. Check logs for more details');
            console.error('   4. Try auto-repair: npm run repair');
        }
        
        console.error('');
    }

    /**
     * Extract module name from error message
     */
    static extractModuleName(errorMessage) {
        const matches = errorMessage.match(/Cannot find module '([^']+)'/);
        return matches ? matches[1] : 'unknown';
    }

    /**
     * Create error context for better debugging
     */
    static createContext(operation, agent = null, file = null) {
        return { operation, agent, file };
    }

    /**
     * Wrap function with error handling
     */
    static wrapWithErrorHandling(fn, context = {}) {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                this.handlePAIREDError(error, context);
                throw error; // Re-throw for upstream handling
            }
        };
    }

    /**
     * Log error to file for debugging
     */
    static async logError(error, context = {}) {
        const fs = require('fs').promises;
        const logDir = path.join(process.cwd(), 'logs');
        
        try {
            await fs.mkdir(logDir, { recursive: true });
            
            const logEntry = {
                timestamp: new Date().toISOString(),
                error: {
                    message: error.message,
                    stack: error.stack,
                    code: error.code
                },
                context,
                nodeVersion: process.version,
                platform: process.platform
            };
            
            const logFile = path.join(logDir, 'paired-errors.log');
            await fs.appendFile(logFile, JSON.stringify(logEntry, null, 2) + '\n');
        } catch (logError) {
            // Silently fail if we can't log - don't want to create recursive errors
        }
    }
}

module.exports = { PAIREDErrorHandler };
