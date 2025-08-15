#!/usr/bin/env node

/**
 * PAIRED Agent Authenticity Monitor
 * 
 * Lightweight, continuous audit system that verifies real PAIRED agents
 * are being used and not impersonated by CASCADE or other systems.
 * 
 * Key Features:
 * - Real-time agent execution verification
 * - Process ID tracking and validation
 * - File system signature monitoring
 * - CLI command execution auditing
 * - Impersonation detection and alerts
 * - Lightweight background operation
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync, spawn } = require('child_process');
const crypto = require('crypto');
const os = require('os');

class AgentAuthenticityMonitor {
    constructor(config = {}) {
        this.config = {
            monitorInterval: config.monitorInterval || 30000, // 30 seconds
            auditLogPath: config.auditLogPath || path.join(os.homedir(), '.paired', 'security', 'agent_audit.log'),
            alertThreshold: config.alertThreshold || 3, // Failed authenticity checks before alert
            enableRealTimeAlerts: config.enableRealTimeAlerts !== false,
            pairedDir: config.pairedDir || path.join(os.homedir(), '.paired'),
            projectDir: config.projectDir || process.cwd(),
            ...config
        };

        this.agentSignatures = new Map();
        this.processRegistry = new Map();
        this.authenticationFailures = new Map();
        this.isMonitoring = false;
        this.monitoringInterval = null;

        // Expected PAIRED agents
        this.expectedAgents = [
            { id: 'alex', name: 'Alex (PM)', file: 'pm_agent.js', emoji: '👑' },
            { id: 'sherlock', name: 'Sherlock (QA)', file: 'qa_agent.js', emoji: '🕵️' },
            { id: 'leonardo', name: 'Leonardo (Architecture)', file: 'architecture_agent.js', emoji: '🏛️' },
            { id: 'edison', name: 'Edison (Dev)', file: 'dev_agent.js', emoji: '⚡' },
            { id: 'maya', name: 'Maya (UX)', file: 'ux_expert_agent.js', emoji: '🎨' },
            { id: 'vince', name: 'Vince (Scrum Master)', file: 'scrum_master_agent.js', emoji: '🏈' },
            { id: 'marie', name: 'Marie (Analyst)', file: 'analyst_agent.js', emoji: '🔬' }
        ];

        this.initializeMonitor();
    }

    /**
     * Initialize the authenticity monitor
     */
    async initializeMonitor() {
        try {
            // Ensure audit directory exists
            await fs.mkdir(path.dirname(this.config.auditLogPath), { recursive: true });

            // Generate initial agent signatures
            await this.generateAgentSignatures();

            // Start monitoring
            await this.startMonitoring();

            this.log('🛡️ Agent Authenticity Monitor initialized and active');
        } catch (error) {
            this.log(`❌ Failed to initialize Agent Authenticity Monitor: ${error.message}`);
            throw error;
        }
    }

    /**
     * Generate cryptographic signatures for each real PAIRED agent
     */
    async generateAgentSignatures() {
        for (const agent of this.expectedAgents) {
            try {
                const agentPath = path.join(this.config.projectDir, 'src', 'agents', agent.file);
                const agentContent = await fs.readFile(agentPath, 'utf8');
                
                // Create signature from agent file content and metadata
                const signature = crypto
                    .createHash('sha256')
                    .update(agentContent + agent.id + agent.name)
                    .digest('hex');

                this.agentSignatures.set(agent.id, {
                    signature,
                    filePath: agentPath,
                    lastVerified: Date.now(),
                    ...agent
                });

                this.log(`🔐 Generated signature for ${agent.name}: ${signature.substring(0, 16)}...`);
            } catch (error) {
                this.log(`⚠️ Failed to generate signature for ${agent.name}: ${error.message}`);
            }
        }
    }

    /**
     * Start continuous monitoring
     */
    async startMonitoring() {
        if (this.isMonitoring) {
            this.log('⚠️ Monitor already running');
            return;
        }

        this.isMonitoring = true;
        this.monitoringInterval = setInterval(async () => {
            await this.performAuthenticityCheck();
        }, this.config.monitorInterval);

        this.log(`🔍 Continuous monitoring started (interval: ${this.config.monitorInterval}ms)`);
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.isMonitoring = false;
        this.log('🛑 Monitoring stopped');
    }

    /**
     * Perform comprehensive authenticity check
     */
    async performAuthenticityCheck() {
        const checkResults = {
            timestamp: Date.now(),
            agentsVerified: 0,
            agentsFailed: 0,
            impersonationDetected: false,
            details: []
        };

        for (const [agentId, signature] of this.agentSignatures) {
            try {
                const result = await this.verifyAgentAuthenticity(agentId, signature);
                checkResults.details.push(result);
                
                if (result.authentic) {
                    checkResults.agentsVerified++;
                } else {
                    checkResults.agentsFailed++;
                    await this.handleAuthenticityFailure(agentId, result);
                }
            } catch (error) {
                checkResults.agentsFailed++;
                checkResults.details.push({
                    agentId,
                    authentic: false,
                    error: error.message
                });
            }
        }

        // Check for CASCADE impersonation patterns
        const impersonationCheck = await this.detectCascadeImpersonation();
        if (impersonationCheck.detected) {
            checkResults.impersonationDetected = true;
            checkResults.details.push(impersonationCheck);
        }

        await this.logAuditResult(checkResults);
        
        if (checkResults.agentsFailed > 0 || checkResults.impersonationDetected) {
            await this.triggerSecurityAlert(checkResults);
        }
    }

    /**
     * Verify individual agent authenticity
     */
    async verifyAgentAuthenticity(agentId, expectedSignature) {
        const checks = {
            fileIntegrity: false,
            processActive: false,
            cliResponsive: false,
            signatureMatch: false
        };

        try {
            // 1. File integrity check
            const agentContent = await fs.readFile(expectedSignature.filePath, 'utf8');
            const currentSignature = crypto
                .createHash('sha256')
                .update(agentContent + agentId + expectedSignature.name)
                .digest('hex');
            
            checks.signatureMatch = currentSignature === expectedSignature.signature;
            checks.fileIntegrity = true;

            // 2. CLI responsiveness check
            try {
                const cliResult = execSync(
                    `node src/cli/agent-cli.js discover --agent ${agentId}`,
                    { 
                        cwd: this.config.projectDir,
                        timeout: 5000,
                        encoding: 'utf8'
                    }
                );
                checks.cliResponsive = cliResult.includes(expectedSignature.name);
            } catch (cliError) {
                // CLI check failed
            }

            // 3. Process activity check (if agent is supposed to be running)
            checks.processActive = await this.checkAgentProcess(agentId);

        } catch (error) {
            return {
                agentId,
                authentic: false,
                error: error.message,
                checks
            };
        }

        const authentic = checks.fileIntegrity && checks.signatureMatch && checks.cliResponsive;
        
        return {
            agentId,
            agentName: expectedSignature.name,
            authentic,
            checks,
            timestamp: Date.now()
        };
    }

    /**
     * Check if agent process is active
     */
    async checkAgentProcess(agentId) {
        try {
            // Check for Node.js processes running agent files
            const processes = execSync('ps aux | grep node | grep -v grep', { encoding: 'utf8' });
            return processes.includes(`${agentId}_agent`) || processes.includes('agent-cli');
        } catch (error) {
            return false;
        }
    }

    /**
     * Detect CASCADE impersonation patterns
     */
    async detectCascadeImpersonation() {
        const suspiciousPatterns = [
            'CASCADE_API',
            'receiveAgentMessage',
            'registerAgent',
            'global.CASCADE_API',
            'simulate.*agent',
            'impersonate.*agent'
        ];

        try {
            // Check for suspicious processes
            const processes = execSync('ps aux | grep -E "(cascade|windsurf)" | grep -v grep', { encoding: 'utf8' });
            
            for (const pattern of suspiciousPatterns) {
                if (processes.toLowerCase().includes(pattern.toLowerCase())) {
                    return {
                        detected: true,
                        pattern,
                        evidence: 'Suspicious process detected',
                        timestamp: Date.now()
                    };
                }
            }

            // Check for suspicious files in temp directories
            const tempDirs = ['/tmp', os.tmpdir()];
            for (const tempDir of tempDirs) {
                try {
                    const files = await fs.readdir(tempDir);
                    const suspiciousFiles = files.filter(file => 
                        file.includes('cascade') || file.includes('agent_sim')
                    );
                    
                    if (suspiciousFiles.length > 0) {
                        return {
                            detected: true,
                            evidence: `Suspicious files: ${suspiciousFiles.join(', ')}`,
                            timestamp: Date.now()
                        };
                    }
                } catch (error) {
                    // Ignore permission errors
                }
            }

            return { detected: false, timestamp: Date.now() };
        } catch (error) {
            return { 
                detected: false, 
                error: error.message,
                timestamp: Date.now()
            };
        }
    }

    /**
     * Handle authenticity failure
     */
    async handleAuthenticityFailure(agentId, result) {
        const failures = this.authenticationFailures.get(agentId) || 0;
        this.authenticationFailures.set(agentId, failures + 1);

        this.log(`🚨 Authenticity failure for ${agentId}: ${JSON.stringify(result.checks)}`);

        if (failures >= this.config.alertThreshold) {
            await this.triggerCriticalAlert(agentId, result);
        }
    }

    /**
     * Trigger security alert
     */
    async triggerSecurityAlert(checkResults) {
        const alert = {
            type: 'AGENT_AUTHENTICITY_ALERT',
            timestamp: Date.now(),
            severity: checkResults.impersonationDetected ? 'CRITICAL' : 'WARNING',
            summary: `${checkResults.agentsFailed} agent(s) failed authenticity check`,
            details: checkResults
        };

        this.log(`🚨 SECURITY ALERT: ${alert.summary}`);
        
        if (this.config.enableRealTimeAlerts) {
            console.error(`\n🚨 PAIRED SECURITY ALERT 🚨`);
            console.error(`Severity: ${alert.severity}`);
            console.error(`Summary: ${alert.summary}`);
            console.error(`Time: ${new Date(alert.timestamp).toISOString()}`);
            
            if (checkResults.impersonationDetected) {
                console.error(`⚠️ POSSIBLE CASCADE IMPERSONATION DETECTED!`);
            }
        }

        // Save alert to security log
        await this.saveSecurityAlert(alert);
    }

    /**
     * Trigger critical alert for repeated failures
     */
    async triggerCriticalAlert(agentId, result) {
        const alert = {
            type: 'CRITICAL_AGENT_COMPROMISE',
            agentId,
            timestamp: Date.now(),
            failureCount: this.authenticationFailures.get(agentId),
            lastResult: result
        };

        this.log(`🔥 CRITICAL ALERT: Agent ${agentId} may be compromised!`);
        
        console.error(`\n🔥 CRITICAL PAIRED SECURITY ALERT 🔥`);
        console.error(`Agent ${agentId} has failed authenticity checks ${alert.failureCount} times!`);
        console.error(`This may indicate CASCADE impersonation or agent compromise.`);
        console.error(`Immediate investigation required!`);

        await this.saveSecurityAlert(alert);
    }

    /**
     * Save security alert to persistent storage
     */
    async saveSecurityAlert(alert) {
        const alertsFile = path.join(path.dirname(this.config.auditLogPath), 'security_alerts.json');
        
        try {
            let alerts = [];
            try {
                const existingAlerts = await fs.readFile(alertsFile, 'utf8');
                alerts = JSON.parse(existingAlerts);
            } catch (error) {
                // File doesn't exist yet
            }

            alerts.push(alert);
            
            // Keep only last 100 alerts
            if (alerts.length > 100) {
                alerts = alerts.slice(-100);
            }

            await fs.writeFile(alertsFile, JSON.stringify(alerts, null, 2));
        } catch (error) {
            this.log(`❌ Failed to save security alert: ${error.message}`);
        }
    }

    /**
     * Log audit result
     */
    async logAuditResult(result) {
        const logEntry = `${new Date().toISOString()} - AUDIT: ${result.agentsVerified}/${result.agentsVerified + result.agentsFailed} agents verified, impersonation: ${result.impersonationDetected}\n`;
        
        try {
            await fs.appendFile(this.config.auditLogPath, logEntry);
        } catch (error) {
            console.error(`Failed to write audit log: ${error.message}`);
        }
    }

    /**
     * Get monitoring status
     */
    getStatus() {
        return {
            isMonitoring: this.isMonitoring,
            agentsTracked: this.agentSignatures.size,
            authenticationFailures: Object.fromEntries(this.authenticationFailures),
            lastCheck: this.lastCheck,
            config: this.config
        };
    }

    /**
     * Log message with timestamp
     */
    log(message) {
        const timestamp = new Date().toISOString();
        console.log(`${timestamp} - ${message}`);
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        this.stopMonitoring();
        this.log('🛡️ Agent Authenticity Monitor shutdown complete');
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0] || 'start';

    const monitor = new AgentAuthenticityMonitor();

    switch (command) {
        case 'start':
            console.log('🛡️ Starting Agent Authenticity Monitor...');
            process.on('SIGINT', async () => {
                console.log('\n🛑 Shutting down monitor...');
                await monitor.shutdown();
                process.exit(0);
            });
            break;

        case 'status':
            console.log('📊 Monitor Status:', JSON.stringify(monitor.getStatus(), null, 2));
            process.exit(0);
            break;

        case 'check':
            console.log('🔍 Performing one-time authenticity check...');
            monitor.performAuthenticityCheck().then(() => {
                console.log('✅ Check complete');
                process.exit(0);
            });
            break;

        default:
            console.log('Usage: node agent_authenticity_monitor.js [start|status|check]');
            process.exit(1);
    }
}

module.exports = AgentAuthenticityMonitor;
