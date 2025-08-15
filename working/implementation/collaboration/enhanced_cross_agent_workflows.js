#!/usr/bin/env node

/**
 * Enhanced Cross-Agent Workflows for PAIRED
 * 
 * Advanced multi-agent collaboration system that leverages verified PAIRED agents
 * through the CASCADE integration layer with continuous authenticity verification.
 * 
 * Key Features:
 * - Real agent execution through Agent CLI Registry
 * - Continuous authenticity verification during workflows
 * - CASCADE integration for seamless communication
 * - Advanced workflow orchestration patterns
 * - Cross-agent knowledge sharing and context preservation
 */

const AgentCLIRegistry = require('../core/agent_cli_registry');
const AgentAuthenticityMonitor = require('../security/agent_authenticity_monitor');
const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

class EnhancedCrossAgentWorkflows extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            enableAuthenticity: config.enableAuthenticity !== false,
            workflowTimeout: config.workflowTimeout || 300000, // 5 minutes
            maxConcurrentWorkflows: config.maxConcurrentWorkflows || 2,
            logLevel: config.logLevel || 'info',
            workflowDir: config.workflowDir || path.join(process.cwd(), '.paired', 'workflows'),
            ...config
        };

        // Core components
        this.agentRegistry = null;
        this.authenticityMonitor = null;
        
        // Workflow state
        this.activeWorkflows = new Map();
        this.workflowHistory = [];
        this.agentCapabilities = new Map();
        
        // PAIRED agent definitions with specialized roles
        this.pairedAgents = {
            alex: { 
                id: 'alex', 
                name: 'Alex (PM)', 
                emoji: '👑', 
                role: 'project_manager',
                specialties: ['planning', 'coordination', 'stakeholder_management', 'risk_assessment']
            },
            sherlock: { 
                id: 'sherlock', 
                name: 'Sherlock (QA)', 
                emoji: '🕵️', 
                role: 'quality_assurance',
                specialties: ['testing', 'bug_detection', 'quality_validation', 'security_audit']
            },
            leonardo: { 
                id: 'leonardo', 
                name: 'Leonardo (Architecture)', 
                emoji: '🏛️', 
                role: 'architecture',
                specialties: ['system_design', 'scalability', 'integration_patterns', 'technical_strategy']
            },
            edison: { 
                id: 'edison', 
                name: 'Edison (Dev)', 
                emoji: '⚡', 
                role: 'development',
                specialties: ['implementation', 'problem_solving', 'code_optimization', 'debugging']
            },
            maya: { 
                id: 'maya', 
                name: 'Maya (UX)', 
                emoji: '🎨', 
                role: 'user_experience',
                specialties: ['user_research', 'interface_design', 'usability_testing', 'accessibility']
            },
            vince: { 
                id: 'vince', 
                name: 'Vince (Scrum Master)', 
                emoji: '🏈', 
                role: 'scrum_master',
                specialties: ['process_optimization', 'team_coordination', 'sprint_planning', 'retrospectives']
            },
            marie: { 
                id: 'marie', 
                name: 'Marie (Analyst)', 
                emoji: '🔬', 
                role: 'data_analysis',
                specialties: ['data_analysis', 'metrics', 'reporting', 'insights_generation']
            }
        };

        // Enhanced workflow templates
        this.workflowTemplates = {
            'feature_development': {
                name: 'Feature Development Workflow',
                description: 'End-to-end feature development with cross-functional collaboration',
                agents: ['alex', 'leonardo', 'edison', 'maya', 'sherlock'],
                phases: [
                    { name: 'requirements_analysis', lead: 'alex', participants: ['maya', 'leonardo'] },
                    { name: 'architecture_design', lead: 'leonardo', participants: ['alex', 'edison'] },
                    { name: 'implementation_planning', lead: 'edison', participants: ['alex', 'leonardo'] },
                    { name: 'development', lead: 'edison', participants: ['leonardo', 'sherlock'] },
                    { name: 'quality_validation', lead: 'sherlock', participants: ['edison', 'maya'] },
                    { name: 'deployment_preparation', lead: 'alex', participants: ['edison', 'sherlock'] }
                ],
                estimatedDuration: 'days_to_weeks'
            },
            
            'code_review': {
                name: 'Comprehensive Code Review',
                description: 'Multi-perspective code review with quality, architecture, and project alignment',
                agents: ['edison', 'sherlock', 'leonardo', 'alex'],
                phases: [
                    { name: 'initial_review', lead: 'edison', participants: [] },
                    { name: 'quality_assessment', lead: 'sherlock', participants: ['edison'] },
                    { name: 'architecture_validation', lead: 'leonardo', participants: ['edison', 'sherlock'] },
                    { name: 'project_alignment', lead: 'alex', participants: ['leonardo', 'sherlock'] }
                ],
                estimatedDuration: '2_to_4_hours'
            },
            
            'bug_investigation': {
                name: 'Bug Investigation & Resolution',
                description: 'Systematic bug investigation with root cause analysis and resolution',
                agents: ['sherlock', 'edison', 'leonardo', 'alex'],
                phases: [
                    { name: 'bug_reproduction', lead: 'sherlock', participants: [] },
                    { name: 'root_cause_analysis', lead: 'edison', participants: ['sherlock'] },
                    { name: 'impact_assessment', lead: 'leonardo', participants: ['sherlock', 'edison'] },
                    { name: 'resolution_planning', lead: 'alex', participants: ['edison', 'leonardo'] },
                    { name: 'implementation', lead: 'edison', participants: ['sherlock'] },
                    { name: 'validation', lead: 'sherlock', participants: ['edison'] }
                ],
                estimatedDuration: 'hours_to_days'
            },
            
            'security_audit': {
                name: 'Security Audit Workflow',
                description: 'Comprehensive security assessment with multiple agent perspectives',
                agents: ['sherlock', 'leonardo', 'edison', 'alex'],
                phases: [
                    { name: 'security_scan', lead: 'sherlock', participants: [] },
                    { name: 'architecture_review', lead: 'leonardo', participants: ['sherlock'] },
                    { name: 'code_analysis', lead: 'edison', participants: ['sherlock', 'leonardo'] },
                    { name: 'risk_assessment', lead: 'alex', participants: ['sherlock', 'leonardo'] },
                    { name: 'remediation_planning', lead: 'alex', participants: ['edison', 'sherlock'] }
                ],
                estimatedDuration: 'days'
            },
            
            'performance_optimization': {
                name: 'Performance Optimization Workflow',
                description: 'System performance analysis and optimization with data-driven insights',
                agents: ['marie', 'edison', 'leonardo', 'sherlock'],
                phases: [
                    { name: 'performance_analysis', lead: 'marie', participants: [] },
                    { name: 'bottleneck_identification', lead: 'edison', participants: ['marie'] },
                    { name: 'architecture_optimization', lead: 'leonardo', participants: ['marie', 'edison'] },
                    { name: 'implementation', lead: 'edison', participants: ['leonardo'] },
                    { name: 'validation_testing', lead: 'sherlock', participants: ['marie', 'edison'] }
                ],
                estimatedDuration: 'days_to_weeks'
            },
            
            'user_experience_research': {
                name: 'User Experience Research & Design',
                description: 'Comprehensive UX research with data analysis and implementation planning',
                agents: ['maya', 'marie', 'alex', 'edison'],
                phases: [
                    { name: 'user_research', lead: 'maya', participants: [] },
                    { name: 'data_analysis', lead: 'marie', participants: ['maya'] },
                    { name: 'design_strategy', lead: 'maya', participants: ['marie', 'alex'] },
                    { name: 'implementation_planning', lead: 'alex', participants: ['maya', 'edison'] },
                    { name: 'prototype_development', lead: 'edison', participants: ['maya'] }
                ],
                estimatedDuration: 'weeks'
            }
        };

        this.initialize();
    }

    /**
     * Initialize the enhanced workflow system
     */
    async initialize() {
        try {
            this.log('🚀 Initializing Enhanced Cross-Agent Workflows...');

            // Ensure workflow directory exists
            await fs.mkdir(this.config.workflowDir, { recursive: true });

            // Initialize Agent CLI Registry
            this.agentRegistry = new AgentCLIRegistry({
                enabledAgents: Object.values(this.pairedAgents).map(a => a.name),
                safeMode: true
            });

            // Initialize Authenticity Monitor if enabled
            if (this.config.enableAuthenticity) {
                this.authenticityMonitor = new AgentAuthenticityMonitor({
                    enableRealTimeAlerts: true,
                    monitorInterval: 10000 // Frequent monitoring during workflows
                });
            }

            // Load agent capabilities
            await this.loadAgentCapabilities();

            this.log('✅ Enhanced Cross-Agent Workflows initialized successfully');
            this.emit('initialized');

        } catch (error) {
            this.log(`❌ Failed to initialize workflows: ${error.message}`, 'error');
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Load capabilities for all PAIRED agents
     */
    async loadAgentCapabilities() {
        for (const [agentId, agentInfo] of Object.entries(this.pairedAgents)) {
            try {
                // Verify agent authenticity before loading capabilities
                if (this.config.enableAuthenticity) {
                    const authentic = await this.verifyAgentAuthenticity(agentId);
                    if (!authentic) {
                        this.log(`⚠️ Skipping ${agentInfo.name} - authenticity check failed`, 'warn');
                        continue;
                    }
                }

                // Get agent capabilities from CLI Registry
                const capabilities = await this.agentRegistry.getAgentCapabilities(agentId);
                this.agentCapabilities.set(agentId, {
                    ...agentInfo,
                    cliCapabilities: capabilities,
                    authentic: true,
                    lastVerified: Date.now()
                });

                this.log(`✅ Loaded capabilities for ${agentInfo.emoji} ${agentInfo.name}`);

            } catch (error) {
                this.log(`❌ Failed to load capabilities for ${agentInfo.name}: ${error.message}`, 'error');
            }
        }

        this.log(`🎯 Loaded capabilities for ${this.agentCapabilities.size}/${Object.keys(this.pairedAgents).length} agents`);
    }

    /**
     * Start a cross-agent workflow
     */
    async startWorkflow(workflowType, context = {}) {
        try {
            const workflowId = this.generateWorkflowId();
            const template = this.workflowTemplates[workflowType];
            
            if (!template) {
                throw new Error(`Unknown workflow type: ${workflowType}`);
            }

            this.log(`🚀 Starting workflow: ${template.name} (ID: ${workflowId})`);

            // Verify all required agents are available and authentic
            const availableAgents = await this.verifyWorkflowAgents(template.agents);
            if (availableAgents.length < template.agents.length) {
                throw new Error(`Not all required agents are available for ${workflowType}`);
            }

            // Create workflow instance
            const workflow = {
                id: workflowId,
                type: workflowType,
                template,
                context,
                status: 'running',
                startTime: Date.now(),
                currentPhase: 0,
                phases: template.phases.map(phase => ({
                    ...phase,
                    status: 'pending',
                    startTime: null,
                    endTime: null,
                    results: null,
                    errors: []
                })),
                participants: availableAgents,
                results: {},
                errors: []
            };

            this.activeWorkflows.set(workflowId, workflow);

            // Start first phase
            await this.executeWorkflowPhase(workflowId, 0);

            this.emit('workflow_started', { workflowId, workflow });
            return workflowId;

        } catch (error) {
            this.log(`❌ Failed to start workflow ${workflowType}: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Execute a specific workflow phase
     */
    async executeWorkflowPhase(workflowId, phaseIndex) {
        const workflow = this.activeWorkflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow ${workflowId} not found`);
        }

        const phase = workflow.phases[phaseIndex];
        if (!phase) {
            throw new Error(`Phase ${phaseIndex} not found in workflow ${workflowId}`);
        }

        try {
            this.log(`⚡ Executing phase: ${phase.name} (Lead: ${this.pairedAgents[phase.lead].emoji} ${this.pairedAgents[phase.lead].name})`);

            phase.status = 'running';
            phase.startTime = Date.now();
            workflow.currentPhase = phaseIndex;

            // Verify lead agent authenticity
            if (this.config.enableAuthenticity) {
                const authentic = await this.verifyAgentAuthenticity(phase.lead);
                if (!authentic) {
                    throw new Error(`Lead agent ${phase.lead} failed authenticity check`);
                }
            }

            // Execute phase with lead agent
            const phaseContext = {
                workflowId,
                workflowType: workflow.type,
                phaseName: phase.name,
                phaseIndex,
                participants: phase.participants,
                previousResults: workflow.results,
                context: workflow.context
            };

            const phaseResult = await this.executeAgentPhase(phase.lead, phase, phaseContext);

            // Update phase status
            phase.status = 'completed';
            phase.endTime = Date.now();
            phase.results = phaseResult;
            workflow.results[phase.name] = phaseResult;

            this.log(`✅ Phase ${phase.name} completed in ${phase.endTime - phase.startTime}ms`);

            // Execute next phase or complete workflow
            if (phaseIndex + 1 < workflow.phases.length) {
                await this.executeWorkflowPhase(workflowId, phaseIndex + 1);
            } else {
                await this.completeWorkflow(workflowId);
            }

        } catch (error) {
            phase.status = 'failed';
            phase.endTime = Date.now();
            phase.errors.push(error.message);
            workflow.errors.push(`Phase ${phase.name}: ${error.message}`);

            this.log(`❌ Phase ${phase.name} failed: ${error.message}`, 'error');
            await this.failWorkflow(workflowId, error);
        }
    }

    /**
     * Execute agent phase with real agent implementation
     */
    async executeAgentPhase(agentId, phase, context) {
        try {
            // Get agent capabilities
            const agentCapabilities = this.agentCapabilities.get(agentId);
            if (!agentCapabilities) {
                throw new Error(`Agent ${agentId} capabilities not loaded`);
            }

            // Select appropriate command based on phase and agent specialties
            const command = this.selectPhaseCommand(phase, agentCapabilities);
            
            this.log(`🔧 Executing real agent command: ${agentId} -> ${command}`);

            // Execute through Agent CLI Registry (real implementation)
            const result = await this.agentRegistry.executeCommand(agentId, command, {
                timeout: this.config.workflowTimeout / workflow.phases.length,
                context: context
            });

            // Collaborate with participant agents if specified
            if (phase.participants && phase.participants.length > 0) {
                const collaborationResults = await this.executeCollaboration(
                    agentId, 
                    phase.participants, 
                    context, 
                    result
                );
                result.collaboration = collaborationResults;
            }

            return {
                leadAgent: agentId,
                command,
                result,
                executionTime: Date.now() - phase.startTime,
                authentic: true,
                timestamp: Date.now()
            };

        } catch (error) {
            this.log(`❌ Agent phase execution failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Execute collaboration between multiple agents
     */
    async executeCollaboration(leadAgent, participants, context, leadResult) {
        const collaborationResults = {};

        for (const participantId of participants) {
            try {
                // Verify participant authenticity
                if (this.config.enableAuthenticity) {
                    const authentic = await this.verifyAgentAuthenticity(participantId);
                    if (!authentic) {
                        this.log(`⚠️ Skipping participant ${participantId} - authenticity check failed`, 'warn');
                        continue;
                    }
                }

                // Get participant capabilities
                const participantCapabilities = this.agentCapabilities.get(participantId);
                if (!participantCapabilities) {
                    continue;
                }

                // Execute participant contribution
                const participantCommand = this.selectCollaborationCommand(
                    participantCapabilities, 
                    context, 
                    leadResult
                );

                this.log(`🤝 Collaboration: ${participantId} -> ${participantCommand}`);

                const participantResult = await this.agentRegistry.executeCommand(
                    participantId, 
                    participantCommand, 
                    {
                        timeout: 30000, // Shorter timeout for collaboration
                        context: { ...context, leadResult }
                    }
                );

                collaborationResults[participantId] = {
                    agent: participantId,
                    command: participantCommand,
                    result: participantResult,
                    authentic: true,
                    timestamp: Date.now()
                };

            } catch (error) {
                this.log(`⚠️ Collaboration with ${participantId} failed: ${error.message}`, 'warn');
                collaborationResults[participantId] = {
                    agent: participantId,
                    error: error.message,
                    timestamp: Date.now()
                };
            }
        }

        return collaborationResults;
    }

    /**
     * Complete workflow successfully
     */
    async completeWorkflow(workflowId) {
        const workflow = this.activeWorkflows.get(workflowId);
        if (!workflow) return;

        workflow.status = 'completed';
        workflow.endTime = Date.now();
        workflow.duration = workflow.endTime - workflow.startTime;

        // Generate workflow report
        const report = await this.generateWorkflowReport(workflow);
        workflow.report = report;

        // Save workflow to history
        this.workflowHistory.push(workflow);
        this.activeWorkflows.delete(workflowId);

        // Save workflow data
        await this.saveWorkflowData(workflow);

        this.log(`🎉 Workflow ${workflow.template.name} completed successfully in ${workflow.duration}ms`);
        this.emit('workflow_completed', { workflowId, workflow });
    }

    /**
     * Fail workflow with error handling
     */
    async failWorkflow(workflowId, error) {
        const workflow = this.activeWorkflows.get(workflowId);
        if (!workflow) return;

        workflow.status = 'failed';
        workflow.endTime = Date.now();
        workflow.duration = workflow.endTime - workflow.startTime;
        workflow.failureReason = error.message;

        // Save failed workflow to history
        this.workflowHistory.push(workflow);
        this.activeWorkflows.delete(workflowId);

        // Save workflow data
        await this.saveWorkflowData(workflow);

        this.log(`💥 Workflow ${workflow.template.name} failed: ${error.message}`, 'error');
        this.emit('workflow_failed', { workflowId, workflow, error });
    }

    /**
     * Verify workflow agents are available and authentic
     */
    async verifyWorkflowAgents(requiredAgents) {
        const availableAgents = [];

        for (const agentId of requiredAgents) {
            try {
                if (this.config.enableAuthenticity) {
                    const authentic = await this.verifyAgentAuthenticity(agentId);
                    if (!authentic) {
                        this.log(`⚠️ Agent ${agentId} failed authenticity check`, 'warn');
                        continue;
                    }
                }

                if (this.agentCapabilities.has(agentId)) {
                    availableAgents.push(agentId);
                }
            } catch (error) {
                this.log(`⚠️ Error verifying agent ${agentId}: ${error.message}`, 'warn');
            }
        }

        return availableAgents;
    }

    /**
     * Verify agent authenticity
     */
    async verifyAgentAuthenticity(agentId) {
        if (!this.authenticityMonitor) {
            return true; // Skip if monitoring disabled
        }

        try {
            const signature = this.authenticityMonitor.agentSignatures.get(agentId);
            if (!signature) {
                return false;
            }

            const result = await this.authenticityMonitor.verifyAgentAuthenticity(agentId, signature);
            return result.authentic;
        } catch (error) {
            this.log(`⚠️ Authenticity verification failed for ${agentId}: ${error.message}`, 'warn');
            return false;
        }
    }

    /**
     * Select appropriate command for phase execution
     */
    selectPhaseCommand(phase, agentCapabilities) {
        // Simple command selection logic based on phase name and agent specialties
        const phaseName = phase.name.toLowerCase();
        const specialties = agentCapabilities.specialties || [];
        
        if (phaseName.includes('analysis') || phaseName.includes('research')) {
            return 'analyze';
        } else if (phaseName.includes('design') || phaseName.includes('architecture')) {
            return 'design';
        } else if (phaseName.includes('implementation') || phaseName.includes('development')) {
            return 'implement';
        } else if (phaseName.includes('review') || phaseName.includes('validation')) {
            return 'review';
        } else if (phaseName.includes('planning')) {
            return 'plan';
        } else {
            return 'status'; // Default command
        }
    }

    /**
     * Select appropriate command for collaboration
     */
    selectCollaborationCommand(agentCapabilities, context, leadResult) {
        const specialties = agentCapabilities.specialties || [];
        
        if (specialties.includes('testing') || specialties.includes('quality_validation')) {
            return 'validate';
        } else if (specialties.includes('analysis') || specialties.includes('metrics')) {
            return 'analyze';
        } else if (specialties.includes('design') || specialties.includes('architecture')) {
            return 'review_design';
        } else {
            return 'collaborate';
        }
    }

    /**
     * Generate comprehensive workflow report
     */
    async generateWorkflowReport(workflow) {
        return {
            workflowId: workflow.id,
            workflowType: workflow.type,
            workflowName: workflow.template.name,
            status: workflow.status,
            duration: workflow.duration,
            phases: workflow.phases.length,
            completedPhases: workflow.phases.filter(p => p.status === 'completed').length,
            participants: workflow.participants,
            results: workflow.results,
            errors: workflow.errors,
            authenticityVerified: this.config.enableAuthenticity,
            generatedAt: Date.now()
        };
    }

    /**
     * Save workflow data to filesystem
     */
    async saveWorkflowData(workflow) {
        try {
            const filename = `workflow_${workflow.id}_${workflow.type}_${Date.now()}.json`;
            const filepath = path.join(this.config.workflowDir, filename);
            
            await fs.writeFile(filepath, JSON.stringify(workflow, null, 2));
            this.log(`💾 Workflow data saved: ${filename}`);
        } catch (error) {
            this.log(`⚠️ Failed to save workflow data: ${error.message}`, 'warn');
        }
    }

    /**
     * Generate unique workflow ID
     */
    generateWorkflowId() {
        return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get available workflow templates
     */
    getAvailableWorkflows() {
        return Object.keys(this.workflowTemplates).map(key => ({
            type: key,
            ...this.workflowTemplates[key]
        }));
    }

    /**
     * Get workflow status
     */
    getWorkflowStatus(workflowId) {
        const workflow = this.activeWorkflows.get(workflowId);
        if (!workflow) {
            // Check history
            const historicalWorkflow = this.workflowHistory.find(w => w.id === workflowId);
            return historicalWorkflow || null;
        }
        return workflow;
    }

    /**
     * Get system status
     */
    getSystemStatus() {
        return {
            initialized: this.agentRegistry !== null,
            activeWorkflows: this.activeWorkflows.size,
            availableAgents: this.agentCapabilities.size,
            authenticityMonitoring: this.config.enableAuthenticity,
            workflowHistory: this.workflowHistory.length,
            availableTemplates: Object.keys(this.workflowTemplates).length
        };
    }

    /**
     * Log message with level
     */
    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const logMessage = `${timestamp} - [${level.toUpperCase()}] ${message}`;
        
        if (level === 'error') {
            console.error(logMessage);
        } else if (level === 'warn') {
            console.warn(logMessage);
        } else {
            console.log(logMessage);
        }
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        this.log('🛑 Shutting down Enhanced Cross-Agent Workflows...');
        
        // Complete any active workflows
        for (const [workflowId, workflow] of this.activeWorkflows) {
            workflow.status = 'interrupted';
            workflow.endTime = Date.now();
            await this.saveWorkflowData(workflow);
        }
        
        if (this.authenticityMonitor) {
            await this.authenticityMonitor.shutdown();
        }
        
        this.log('✅ Workflow system shutdown complete');
    }
}

// CLI interface
if (require.main === module) {
    const workflows = new EnhancedCrossAgentWorkflows();
    
    const args = process.argv.slice(2);
    const command = args[0] || 'status';
    
    workflows.on('initialized', async () => {
        switch (command) {
            case 'list':
                console.log('📋 Available Workflows:');
                const available = workflows.getAvailableWorkflows();
                available.forEach(w => {
                    console.log(`  ${w.type}: ${w.name} (${w.agents.length} agents, ${w.estimatedDuration})`);
                });
                process.exit(0);
                break;
                
            case 'start':
                const workflowType = args[1];
                if (!workflowType) {
                    console.error('Usage: node enhanced_cross_agent_workflows.js start <workflow_type>');
                    process.exit(1);
                }
                
                try {
                    const workflowId = await workflows.startWorkflow(workflowType);
                    console.log(`🚀 Started workflow: ${workflowId}`);
                } catch (error) {
                    console.error(`❌ Failed to start workflow: ${error.message}`);
                    process.exit(1);
                }
                break;
                
            case 'status':
            default:
                console.log('📊 System Status:', JSON.stringify(workflows.getSystemStatus(), null, 2));
                process.exit(0);
                break;
        }
    });
    
    workflows.on('error', (error) => {
        console.error('💥 Workflow system error:', error.message);
        process.exit(1);
    });
    
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down workflows...');
        await workflows.shutdown();
        process.exit(0);
    });
}

module.exports = EnhancedCrossAgentWorkflows;
