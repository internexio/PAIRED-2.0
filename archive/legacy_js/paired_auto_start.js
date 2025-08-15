#!/usr/bin/env node

/**
 * PAIRED Auto Start
 * Part of PAIRED Platform (Platform for AI-Enabled Remote Development) Orchestrator
 * Automatically initializes PAIRED agents when Windsurf opens
 * Provides dummy-proof, zero-configuration startup
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const chalk = require('chalk');

class PAIREDAutoStart {
    constructor() {
        this.projectRoot = process.cwd();
        this.logFile = path.join(config.globalPath || path.join(require('os').homedir(), '.paired'), 'paired-startup.log');
        this.statusFile = path.join(this.projectRoot, '.paired', 'paired-status.json');
        this.agents = [
            { name: 'Alex', role: 'PM', priority: 1 },
            { name: 'Leonardo', role: 'Architecture', priority: 2 },
            { name: 'Sherlock', role: 'QA', priority: 3 },
            { name: 'Maya', role: 'UX', priority: 4 },
            { name: 'Edison', role: 'Dev', priority: 5 },
            { name: 'Vince', role: 'Scrum', priority: 6 },
            { name: 'Marie', role: 'Analyst', priority: 7 }
        ];
    }

    async initialize() {
        try {
            this.log('🚀 PAIRED Auto-Start: Initializing agents...');
            
            // Check if PAIRED is already running
            if (await this.isPAIREDRunning()) {
                this.log('✅ PAIRED agents already running');
                return { success: true, message: 'Already running' };
            }

            // Perform silent health check
            const healthCheck = await this.silentHealthCheck();
            if (!healthCheck.healthy) {
                this.log('⚠️ Health issues detected, attempting auto-repair...');
                await this.autoRepair();
            }

            // Start agent orchestrator in background
            await this.startAgentOrchestrator();
            
            // Update status
            await this.updateStatus({
                running: true,
                startTime: new Date().toISOString(),
                agents: this.agents.map(a => ({ ...a, status: 'ready' }))
            });

            this.log('✅ PAIRED agents initialized successfully');
            return { success: true, message: 'Agents started' };

        } catch (error) {
            this.log(`❌ Auto-start failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async silentHealthCheck() {
        try {
            // Quick health check without verbose output
            const healthScript = path.join(this.projectRoot, 'core', 'health_checker.js');
            if (!fs.existsSync(healthScript)) {
                return { healthy: false, reason: 'Health checker not found' };
            }

            return new Promise((resolve) => {
                const health = spawn('node', [healthScript, '--silent'], {
                    cwd: this.projectRoot,
                    stdio: 'pipe'
                });

                health.on('close', (code) => {
                    resolve({ healthy: code === 0, code });
                });

                health.on('error', () => {
                    resolve({ healthy: false, reason: 'Health check failed' });
                });
            });
        } catch (error) {
            return { healthy: false, reason: error.message };
        }
    }

    async autoRepair() {
        try {
            const repairScript = path.join(this.projectRoot, 'bin', 'paired-repair');
            if (!fs.existsSync(repairScript)) {
                this.log('⚠️ Auto-repair script not found, skipping...');
                return;
            }

            return new Promise((resolve) => {
                const repair = spawn(repairScript, ['--silent'], {
                    cwd: this.projectRoot,
                    stdio: 'pipe'
                });

                repair.on('close', (code) => {
                    this.log(`🔧 Auto-repair completed with code: ${code}`);
                    resolve(code === 0);
                });

                repair.on('error', (error) => {
                    this.log(`⚠️ Auto-repair error: ${error.message}`);
                    resolve(false);
                });
            });
        } catch (error) {
            this.log(`⚠️ Auto-repair failed: ${error.message}`);
            return false;
        }
    }

    async startAgentOrchestrator() {
        try {
            // Start the main orchestrator in background
            const orchestratorScript = path.join(this.projectRoot, 'src', 'orchestrator', 'claude_orchestrator.js');
            
            if (!fs.existsSync(orchestratorScript)) {
                this.log('⚠️ Orchestrator not found, agents will run independently');
                return;
            }

            const orchestrator = spawn('node', [orchestratorScript, '--background'], {
                cwd: this.projectRoot,
                detached: true,
                stdio: 'ignore'
            });

            orchestrator.unref(); // Allow parent to exit
            this.log('🎭 Agent orchestrator started in background');
            
        } catch (error) {
            this.log(`⚠️ Failed to start orchestrator: ${error.message}`);
        }
    }

    async isPAIREDRunning() {
        try {
            if (!fs.existsSync(this.statusFile)) {
                return false;
            }

            const status = JSON.parse(fs.readFileSync(this.statusFile, 'utf8'));
            const startTime = new Date(status.startTime);
            const now = new Date();
            const hoursSinceStart = (now - startTime) / (1000 * 60 * 60);

            // Consider PAIRED not running if it's been more than 24 hours
            return status.running && hoursSinceStart < 24;
        } catch (error) {
            return false;
        }
    }

    async updateStatus(status) {
        try {
            const statusDir = path.dirname(this.statusFile);
            if (!fs.existsSync(statusDir)) {
                fs.mkdirSync(statusDir, { recursive: true });
            }
            fs.writeFileSync(this.statusFile, JSON.stringify(status, null, 2));
        } catch (error) {
            this.log(`⚠️ Failed to update status: ${error.message}`);
        }
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;
        
        try {
            const logDir = path.dirname(this.logFile);
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
            fs.appendFileSync(this.logFile, logMessage);
        } catch (error) {
            // Silent fail for logging
        }

        // Also output to console if not in silent mode
        if (!process.argv.includes('--silent')) {
            console.log(message);
        }
    }

    async getStatus() {
        try {
            if (!fs.existsSync(this.statusFile)) {
                return { running: false, message: 'Not initialized' };
            }
            return JSON.parse(fs.readFileSync(this.statusFile, 'utf8'));
        } catch (error) {
            return { running: false, error: error.message };
        }
    }

    async stop() {
        try {
            await this.updateStatus({ running: false, stopTime: new Date().toISOString() });
            this.log('🛑 PAIRED agents stopped');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// CLI Interface
async function main() {
    const autoStart = new PAIREDAutoStart();
    const command = process.argv[2] || 'start';

    switch (command) {
        case 'start':
        case 'init':
            const result = await autoStart.initialize();
            process.exit(result.success ? 0 : 1);
            break;

        case 'status':
            const status = await autoStart.getStatus();
            console.log(JSON.stringify(status, null, 2));
            break;

        case 'stop':
            const stopResult = await autoStart.stop();
            process.exit(stopResult.success ? 0 : 1);
            break;

        case 'restart':
            await autoStart.stop();
            setTimeout(async () => {
                const restartResult = await autoStart.initialize();
                process.exit(restartResult.success ? 0 : 1);
            }, 1000);
            break;

        default:
            console.log('Usage: node paired_auto_start.js [start|status|stop|restart]');
            process.exit(1);
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('Auto-start error:', error);
        process.exit(1);
    });
}

module.exports = PAIREDAutoStart;
