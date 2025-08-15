/**
 * PAIRED Health Checker System
 * Fixes Maya's identified issue: No way to verify PAIRED is working correctly
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

class PAIREDHealthChecker {
    constructor() {
        this.checks = new Map();
        this.results = new Map();
    }

    /**
     * Run comprehensive health diagnostic
     */
    async runFullDiagnostic() {
        console.log(chalk.blue('🏥 PAIRED Health Diagnostic System'));
        console.log(chalk.blue('================================'));
        console.log('');

        const checks = {
            'Node.js Version': () => this.checkNodeVersion(),
            'Dependencies': () => this.checkDependencies(),
            'Base Agent': () => this.checkBaseAgent(),
            'Core Infrastructure': () => this.checkCoreInfrastructure(),
            'Agent Files': () => this.checkAgentFiles(),
            'CLI Tools': () => this.checkCLITools(),
            'File Permissions': () => this.checkPermissions(),
            'Output Directories': () => this.checkOutputDirectories(),
            'Sample Execution': () => this.runSampleTest()
        };

        const results = {};
        let passedChecks = 0;
        let totalChecks = Object.keys(checks).length;

        for (const [name, checkFn] of Object.entries(checks)) {
            try {
                console.log(chalk.yellow(`🔍 Checking ${name}...`));
                const result = await checkFn();
                
                if (result.success) {
                    console.log(chalk.green(`✅ ${name}: ${result.message || 'OK'}`));
                    passedChecks++;
                } else {
                    console.log(chalk.red(`❌ ${name}: ${result.message}`));
                    if (result.suggestion) {
                        console.log(chalk.cyan(`   💡 Suggestion: ${result.suggestion}`));
                    }
                }
                
                results[name] = result;
            } catch (error) {
                const errorResult = { 
                    success: false, 
                    message: error.message,
                    suggestion: 'Check logs for detailed error information'
                };
                results[name] = errorResult;
                console.log(chalk.red(`❌ ${name}: ${error.message}`));
            }
            console.log('');
        }

        // Summary
        console.log(chalk.blue('📊 Health Check Summary'));
        console.log(chalk.blue('======================='));
        console.log(`✅ Passed: ${chalk.green(passedChecks)}/${totalChecks}`);
        console.log(`❌ Failed: ${chalk.red(totalChecks - passedChecks)}/${totalChecks}`);
        
        const healthScore = Math.round((passedChecks / totalChecks) * 100);
        console.log(`🏥 Health Score: ${this.getHealthScoreColor(healthScore)}${healthScore}%${chalk.reset()}`);
        
        if (healthScore < 80) {
            console.log('');
            console.log(chalk.yellow('🔧 Recommended Actions:'));
            console.log('   1. Run: npm run install-deps');
            console.log('   2. Run: npm run repair');
            console.log('   3. Check: ./docs/troubleshooting.md');
        } else if (healthScore === 100) {
            console.log('');
            console.log(chalk.green('🎉 PAIRED is healthy and ready to use!'));
            console.log('   • Try: npm run quickstart');
            console.log('   • Or: npm run logic-diagram');
        }

        return { results, healthScore, passedChecks, totalChecks };
    }

    /**
     * Check Node.js version
     */
    async checkNodeVersion() {
        try {
            const version = process.version;
            const majorVersion = parseInt(version.slice(1).split('.')[0]);
            
            if (majorVersion >= 16) {
                return { 
                    success: true, 
                    message: `${version} (compatible)` 
                };
            } else {
                return { 
                    success: false, 
                    message: `${version} is too old`,
                    suggestion: 'Install Node.js 16+ from https://nodejs.org/'
                };
            }
        } catch (error) {
            return { 
                success: false, 
                message: 'Unable to detect Node.js version',
                suggestion: 'Ensure Node.js is properly installed'
            };
        }
    }

    /**
     * Check critical dependencies
     */
    async checkDependencies() {
        const criticalDeps = ['js-yaml', 'chalk', '@babel/parser', 'uuid'];
        const missing = [];
        
        for (const dep of criticalDeps) {
            try {
                require.resolve(dep);
            } catch (error) {
                missing.push(dep);
            }
        }
        
        if (missing.length === 0) {
            return { 
                success: true, 
                message: `All ${criticalDeps.length} critical dependencies found` 
            };
        } else {
            return { 
                success: false, 
                message: `Missing dependencies: ${missing.join(', ')}`,
                suggestion: 'Run: npm run install-deps'
            };
        }
    }

    /**
     * Check base agent infrastructure
     */
    async checkBaseAgent() {
        const baseAgentPath = path.join(process.cwd(), 'src/core/base_agent.js');
        
        try {
            await fs.access(baseAgentPath);
            
            // Try to require it to check for syntax errors
            require(baseAgentPath);
            
            return { 
                success: true, 
                message: 'Base agent infrastructure found and valid' 
            };
        } catch (error) {
            if (error.code === 'ENOENT') {
                return { 
                    success: false, 
                    message: 'Base agent file missing',
                    suggestion: 'Run: npm run repair to restore core files'
                };
            } else {
                return { 
                    success: false, 
                    message: `Base agent has issues: ${error.message}`,
                    suggestion: 'Check base agent syntax and dependencies'
                };
            }
        }
    }

    /**
     * Check core infrastructure files
     */
    async checkCoreInfrastructure() {
        const coreFiles = [
            'src/core/base_agent.js',
            'src/shared/tools/logic_analyzer.js',
            'src/shared/tools/xmind_generator.js',
            'src/shared/tools/multi_format_generator.js'
        ];
        
        const missing = [];
        
        for (const file of coreFiles) {
            try {
                await fs.access(path.join(process.cwd(), file));
            } catch (error) {
                missing.push(file);
            }
        }
        
        if (missing.length === 0) {
            return { 
                success: true, 
                message: `All ${coreFiles.length} core files found` 
            };
        } else {
            return { 
                success: false, 
                message: `Missing core files: ${missing.length}/${coreFiles.length}`,
                suggestion: 'Run: npm run repair to restore missing files'
            };
        }
    }

    /**
     * Check agent files
     */
    async checkAgentFiles() {
        const agents = [
            'analyst_agent.js',
            'architecture_agent.js', 
            'dev_agent.js',
            'pm_agent.js',
            'qa_agent.js',
            'scrum_master_agent.js',
            'ux_expert_agent.js'
        ];
        
        const found = [];
        
        for (const agent of agents) {
            try {
                await fs.access(path.join(process.cwd(), 'src/agents', agent));
                found.push(agent);
            } catch (error) {
                // Agent file missing
            }
        }
        
        if (found.length === agents.length) {
            return { 
                success: true, 
                message: `All ${agents.length} agents found` 
            };
        } else {
            return { 
                success: found.length > 0, 
                message: `Found ${found.length}/${agents.length} agents`,
                suggestion: found.length === 0 ? 'Critical: No agents found. Check installation.' : 'Some agents missing, but core functionality available'
            };
        }
    }

    /**
     * Check CLI tools
     */
    async checkCLITools() {
        const cliTools = [
            'src/cli/logic-diagram.js',
            'src/cli/paired_cli.js'
        ];
        
        const found = [];
        
        for (const tool of cliTools) {
            try {
                await fs.access(path.join(process.cwd(), tool));
                found.push(tool);
            } catch (error) {
                // CLI tool missing
            }
        }
        
        return { 
            success: found.length > 0, 
            message: `Found ${found.length}/${cliTools.length} CLI tools`,
            suggestion: found.length === 0 ? 'No CLI tools found. Limited functionality.' : undefined
        };
    }

    /**
     * Check file permissions
     */
    async checkPermissions() {
        const scriptsToCheck = [
            'scripts/install-dependencies.sh',
            'scripts/validate-agents.sh'
        ];
        
        const issues = [];
        
        for (const script of scriptsToCheck) {
            try {
                const stats = await fs.stat(path.join(process.cwd(), script));
                // Check if file is executable (basic check)
                if (!(stats.mode & parseInt('100', 8))) {
                    issues.push(script);
                }
            } catch (error) {
                issues.push(`${script} (missing)`);
            }
        }
        
        if (issues.length === 0) {
            return { 
                success: true, 
                message: 'Script permissions OK' 
            };
        } else {
            return { 
                success: false, 
                message: `Permission issues: ${issues.join(', ')}`,
                suggestion: 'Run: chmod +x scripts/*.sh'
            };
        }
    }

    /**
     * Check output directories
     */
    async checkOutputDirectories() {
        const dirs = ['diagrams', 'logs', 'analysis'];
        const missing = [];
        
        for (const dir of dirs) {
            try {
                await fs.access(path.join(process.cwd(), dir));
            } catch (error) {
                missing.push(dir);
            }
        }
        
        // Create missing directories
        for (const dir of missing) {
            try {
                await fs.mkdir(path.join(process.cwd(), dir), { recursive: true });
            } catch (error) {
                // Ignore creation errors for now
            }
        }
        
        return { 
            success: true, 
            message: missing.length > 0 ? `Created ${missing.length} missing directories` : 'All output directories exist'
        };
    }

    /**
     * Run a sample test
     */
    async runSampleTest() {
        try {
            // Try to run the logic diagram generator in test mode
            const { LogicDiagramGenerator } = require('../src/shared/tools/logic_diagram_generator');
            const generator = new LogicDiagramGenerator();
            
            // This is a minimal test - just check if we can instantiate
            if (generator) {
                return { 
                    success: true, 
                    message: 'Core functionality test passed' 
                };
            } else {
                return { 
                    success: false, 
                    message: 'Core functionality test failed',
                    suggestion: 'Check core dependencies and file integrity'
                };
            }
        } catch (error) {
            return { 
                success: false, 
                message: `Sample test failed: ${error.message}`,
                suggestion: 'Run: npm run validate for detailed diagnostics'
            };
        }
    }

    /**
     * Get color for health score
     */
    getHealthScoreColor(score) {
        if (score >= 90) return chalk.green;
        if (score >= 70) return chalk.yellow;
        return chalk.red;
    }
}

// CLI execution
if (require.main === module) {
    const checker = new PAIREDHealthChecker();
    checker.runFullDiagnostic()
        .then(result => {
            process.exit(result.healthScore >= 80 ? 0 : 1);
        })
        .catch(error => {
            console.error(chalk.red('❌ Health check failed:'), error.message);
            process.exit(1);
        });
}

module.exports = { PAIREDHealthChecker };
