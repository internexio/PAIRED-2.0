/**
 * Agent Collaboration Orchestrator
 * 
 * Manages and executes multi-agent collaboration workflows using standardized templates.
 * Coordinates agent interactions, tracks progress, and ensures successful completion
 * of complex collaborative tasks.
 */

const AgentCollaborationTemplates = require('./agent_collaboration_templates');
const fs = require('fs').promises;
const path = require('path');

class AgentCollaborationOrchestrator {
  constructor(agentRegistry) {
    this.agentRegistry = agentRegistry;
    this.templates = new AgentCollaborationTemplates();
    this.activeWorkflows = new Map();
    this.workflowHistory = [];
    this.collaborationDataPath = path.join(process.cwd(), 'data', 'collaborations');
    
    // Workflow execution states
    this.workflowStates = {
      PENDING: 'pending',
      IN_PROGRESS: 'in_progress',
      COMPLETED: 'completed',
      FAILED: 'failed',
      ESCALATED: 'escalated'
    };
    
    // Agent availability tracking
    this.agentAvailability = new Map();
    
    this.initializeOrchestrator();
  }

  /**
   * Initialize the collaboration orchestrator
   */
  async initializeOrchestrator() {
    try {
      // Ensure collaboration data directory exists
      await fs.mkdir(this.collaborationDataPath, { recursive: true });
      
      // Load existing workflow history
      await this.loadWorkflowHistory();
      
      // Initialize agent availability tracking
      this.initializeAgentAvailability();
      
      console.log('🎭 Agent Collaboration Orchestrator initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Collaboration Orchestrator:', error.message);
      throw error;
    }
  }

  /**
   * Start a new collaborative workflow
   */
  async startWorkflow(templateName, context = {}) {
    try {
      const template = this.templates.getTemplate(templateName);
      if (!template) {
        throw new Error(`Template '${templateName}' not found`);
      }

      const workflowId = this.generateWorkflowId(templateName);
      const workflow = {
        id: workflowId,
        template: templateName,
        context: context,
        state: this.workflowStates.PENDING,
        currentPhase: 0,
        startTime: new Date().toISOString(),
        phases: template.phases.map(phase => ({
          ...phase,
          state: this.workflowStates.PENDING,
          startTime: null,
          endTime: null,
          results: {},
          issues: []
        })),
        participants: this.extractParticipants(template),
        deliverables: [],
        issues: [],
        escalations: []
      };

      // Validate agent availability
      const availabilityCheck = await this.checkAgentAvailability(workflow.participants);
      if (!availabilityCheck.available) {
        throw new Error(`Required agents not available: ${availabilityCheck.unavailable.join(', ')}`);
      }

      // Reserve agents for this workflow
      await this.reserveAgents(workflow.participants, workflowId);

      // Store workflow
      this.activeWorkflows.set(workflowId, workflow);
      await this.saveWorkflowState(workflow);

      console.log(`🚀 Started workflow '${templateName}' with ID: ${workflowId}`);
      
      // Begin execution
      await this.executeNextPhase(workflowId);
      
      return workflowId;
      
    } catch (error) {
      console.error(`❌ Failed to start workflow '${templateName}':`, error.message);
      throw error;
    }
  }

  /**
   * Execute the next phase of a workflow
   */
  async executeNextPhase(workflowId) {
    try {
      const workflow = this.activeWorkflows.get(workflowId);
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      const currentPhase = workflow.phases[workflow.currentPhase];
      if (!currentPhase) {
        // Workflow complete
        await this.completeWorkflow(workflowId);
        return;
      }

      console.log(`🔄 Executing phase '${currentPhase.phase}' for workflow ${workflowId}`);
      
      // Update phase state
      currentPhase.state = this.workflowStates.IN_PROGRESS;
      currentPhase.startTime = new Date().toISOString();
      workflow.state = this.workflowStates.IN_PROGRESS;

      // Execute phase tasks
      const phaseResults = await this.executePhase(workflow, currentPhase);
      
      // Update phase completion
      currentPhase.state = this.workflowStates.COMPLETED;
      currentPhase.endTime = new Date().toISOString();
      currentPhase.results = phaseResults;
      
      // Add deliverables to workflow
      if (currentPhase.deliverables) {
        workflow.deliverables.push(...currentPhase.deliverables.map(d => ({
          name: d,
          phase: currentPhase.phase,
          created: new Date().toISOString(),
          path: path.join(this.collaborationDataPath, workflowId, d)
        })));
      }

      // Move to next phase
      workflow.currentPhase++;
      
      // Save state
      await this.saveWorkflowState(workflow);
      
      // Continue with next phase immediately (async for better performance)
      setImmediate(() => this.executeNextPhase(workflowId));
      
    } catch (error) {
      console.error(`❌ Failed to execute phase for workflow ${workflowId}:`, error.message);
      await this.handleWorkflowError(workflowId, error);
    }
  }

  /**
   * Execute a specific phase with agent coordination
   */
  async executePhase(workflow, phase) {
    const results = {
      tasks_completed: [],
      agent_outputs: {},
      duration: null,
      success: true
    };

    const startTime = Date.now();

    try {
      // Get lead agent
      const leadAgent = await this.getAgent(phase.lead_agent);
      if (!leadAgent) {
        throw new Error(`Lead agent '${phase.lead_agent}' not available`);
      }

      // Coordinate with participating agents
      const agentInputs = {};
      for (const agentType of phase.participating_agents) {
        if (agentType !== phase.lead_agent) {
          const agent = await this.getAgent(agentType);
          if (agent) {
            agentInputs[agentType] = await this.getAgentInput(agent, workflow, phase);
          }
        }
      }

      // Execute phase tasks with lead agent
      const phaseContext = {
        workflow: workflow,
        phase: phase,
        agent_inputs: agentInputs,
        tasks: phase.tasks
      };

      const leadAgentOutput = await this.executeAgentTasks(leadAgent, phaseContext);
      results.agent_outputs[phase.lead_agent] = leadAgentOutput;

      // Mark tasks as completed
      results.tasks_completed = phase.tasks;
      
      // Create deliverables
      await this.createPhaseDeliverables(workflow, phase, results);

      results.duration = Date.now() - startTime;
      
      console.log(`✅ Phase '${phase.phase}' completed successfully`);
      
    } catch (error) {
      results.success = false;
      results.error = error.message;
      console.error(`❌ Phase '${phase.phase}' failed:`, error.message);
      throw error;
    }

    return results;
  }

  /**
   * Get agent input for a phase
   */
  async getAgentInput(agent, workflow, phase) {
    try {
      // This would integrate with the actual agent system
      // For now, return a structured input based on agent type
      const input = {
        agent_type: agent.agentType,
        workflow_context: {
          id: workflow.id,
          template: workflow.template,
          current_phase: phase.phase
        },
        tasks: phase.tasks.filter(task => this.isTaskRelevantForAgent(task, agent.agentType)),
        timestamp: new Date().toISOString()
      };

      return input;
      
    } catch (error) {
      console.error(`❌ Failed to get input from ${agent.agentType}:`, error.message);
      return null;
    }
  }

  /**
   * Execute tasks with a specific agent
   */
  async executeAgentTasks(agent, context) {
    try {
      // This would integrate with the actual agent execution system
      // For now, simulate agent task execution
      const output = {
        agent_type: agent.agentType,
        tasks_executed: context.tasks,
        results: context.tasks.map(task => ({
          task: task,
          status: 'completed',
          output: `${agent.agentType} completed: ${task}`,
          timestamp: new Date().toISOString()
        })),
        recommendations: this.generateAgentRecommendations(agent.agentType, context),
        next_steps: this.generateNextSteps(agent.agentType, context)
      };

      return output;
      
    } catch (error) {
      console.error(`❌ Failed to execute tasks with ${agent.agentType}:`, error.message);
      throw error;
    }
  }

  /**
   * Create deliverables for a completed phase
   */
  async createPhaseDeliverables(workflow, phase, results) {
    try {
      const workflowDir = path.join(this.collaborationDataPath, workflow.id);
      await fs.mkdir(workflowDir, { recursive: true });

      for (const deliverable of phase.deliverables || []) {
        const deliverablePath = path.join(workflowDir, deliverable);
        const content = this.generateDeliverableContent(workflow, phase, deliverable, results);
        
        await fs.writeFile(deliverablePath, content, 'utf8');
        console.log(`📄 Created deliverable: ${deliverable}`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to create deliverables for phase '${phase.phase}':`, error.message);
    }
  }

  /**
   * Generate content for a deliverable
   */
  generateDeliverableContent(workflow, phase, deliverable, results) {
    const timestamp = new Date().toISOString();
    
    let content = `# ${deliverable}\n\n`;
    content += `**Workflow:** ${workflow.template}\n`;
    content += `**Phase:** ${phase.phase}\n`;
    content += `**Generated:** ${timestamp}\n\n`;
    
    content += `## Phase Summary\n`;
    content += `- **Lead Agent:** ${phase.lead_agent}\n`;
    content += `- **Participating Agents:** ${phase.participating_agents.join(', ')}\n`;
    content += `- **Duration:** ${results.duration}ms\n`;
    content += `- **Status:** ${results.success ? 'Success' : 'Failed'}\n\n`;
    
    content += `## Tasks Completed\n`;
    results.tasks_completed.forEach(task => {
      content += `- ${task}\n`;
    });
    
    content += `\n## Agent Outputs\n`;
    Object.entries(results.agent_outputs).forEach(([agentType, output]) => {
      content += `\n### ${agentType}\n`;
      if (output.recommendations) {
        content += `**Recommendations:**\n`;
        output.recommendations.forEach(rec => content += `- ${rec}\n`);
      }
      if (output.next_steps) {
        content += `**Next Steps:**\n`;
        output.next_steps.forEach(step => content += `- ${step}\n`);
      }
    });
    
    return content;
  }

  /**
   * Complete a workflow
   */
  async completeWorkflow(workflowId) {
    try {
      const workflow = this.activeWorkflows.get(workflowId);
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      workflow.state = this.workflowStates.COMPLETED;
      workflow.endTime = new Date().toISOString();
      
      // Release reserved agents
      await this.releaseAgents(workflow.participants, workflowId);
      
      // Move to history
      this.workflowHistory.push(workflow);
      this.activeWorkflows.delete(workflowId);
      
      // Save final state
      await this.saveWorkflowState(workflow);
      await this.saveWorkflowHistory();
      
      console.log(`🎉 Workflow ${workflowId} completed successfully`);
      
      // Generate completion report
      await this.generateCompletionReport(workflow);
      
    } catch (error) {
      console.error(`❌ Failed to complete workflow ${workflowId}:`, error.message);
    }
  }

  /**
   * Handle workflow errors and escalations
   */
  async handleWorkflowError(workflowId, error) {
    try {
      const workflow = this.activeWorkflows.get(workflowId);
      if (!workflow) return;

      workflow.state = this.workflowStates.FAILED;
      workflow.issues.push({
        type: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
        phase: workflow.phases[workflow.currentPhase]?.phase
      });

      // Check if escalation is needed
      const template = this.templates.getTemplate(workflow.template);
      const shouldEscalate = this.shouldEscalate(error, template);
      
      if (shouldEscalate) {
        await this.escalateWorkflow(workflowId, error);
      }
      
      await this.saveWorkflowState(workflow);
      
    } catch (escalationError) {
      console.error(`❌ Failed to handle workflow error:`, escalationError.message);
    }
  }

  /**
   * Utility methods
   */
  generateWorkflowId(templateName) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `${templateName}_${timestamp}_${random}`;
  }

  extractParticipants(template) {
    const participants = new Set();
    template.phases.forEach(phase => {
      participants.add(phase.lead_agent);
      phase.participating_agents.forEach(agent => participants.add(agent));
    });
    return Array.from(participants);
  }

  async checkAgentAvailability(participants) {
    // Simulate availability check
    return {
      available: true,
      unavailable: []
    };
  }

  async reserveAgents(participants, workflowId) {
    participants.forEach(agent => {
      this.agentAvailability.set(agent, workflowId);
    });
  }

  async releaseAgents(participants, workflowId) {
    participants.forEach(agent => {
      if (this.agentAvailability.get(agent) === workflowId) {
        this.agentAvailability.delete(agent);
      }
    });
  }

  async getAgent(agentType) {
    // This would integrate with the actual agent registry
    return {
      agentType: agentType,
      available: true
    };
  }

  isTaskRelevantForAgent(task, agentType) {
    // Simple relevance check based on keywords
    const agentKeywords = {
      'dev_agent': ['code', 'implementation', 'development', 'programming'],
      'qa_agent': ['test', 'quality', 'validation', 'verification'],
      'architecture_agent': ['design', 'architecture', 'pattern', 'structure'],
      'pm_agent': ['project', 'planning', 'coordination', 'management'],
      'ux_expert_agent': ['user', 'experience', 'design', 'interface'],
      'analyst_agent': ['analysis', 'research', 'data', 'market'],
      'scrum_master_agent': ['sprint', 'agile', 'ceremony', 'process']
    };

    const keywords = agentKeywords[agentType] || [];
    return keywords.some(keyword => task.toLowerCase().includes(keyword));
  }

  generateAgentRecommendations(agentType, context) {
    // Generate contextual recommendations based on agent type
    const recommendations = {
      'dev_agent': ['Follow coding standards', 'Implement unit tests', 'Document code changes'],
      'qa_agent': ['Increase test coverage', 'Validate edge cases', 'Perform regression testing'],
      'architecture_agent': ['Maintain design patterns', 'Consider scalability', 'Review integration points'],
      'pm_agent': ['Update project timeline', 'Communicate with stakeholders', 'Monitor risks'],
      'ux_expert_agent': ['Validate user experience', 'Test accessibility', 'Gather user feedback'],
      'analyst_agent': ['Analyze market trends', 'Validate assumptions', 'Provide data insights'],
      'scrum_master_agent': ['Facilitate team communication', 'Remove impediments', 'Track velocity']
    };

    return recommendations[agentType] || ['Continue monitoring progress'];
  }

  generateNextSteps(agentType, context) {
    return [`Continue ${agentType} activities`, 'Prepare for next phase', 'Document outcomes'];
  }

  shouldEscalate(error, template) {
    // Check against template escalation triggers
    return template.escalation_triggers?.some(trigger => 
      error.message.toLowerCase().includes(trigger.toLowerCase())
    ) || false;
  }

  async escalateWorkflow(workflowId, error) {
    const workflow = this.activeWorkflows.get(workflowId);
    workflow.state = this.workflowStates.ESCALATED;
    workflow.escalations.push({
      reason: error.message,
      timestamp: new Date().toISOString(),
      phase: workflow.phases[workflow.currentPhase]?.phase
    });
    
    console.log(`🚨 Workflow ${workflowId} escalated: ${error.message}`);
  }

  async generateCompletionReport(workflow) {
    const reportPath = path.join(this.collaborationDataPath, workflow.id, 'completion_report.md');
    const duration = new Date(workflow.endTime) - new Date(workflow.startTime);
    
    let report = `# Workflow Completion Report\n\n`;
    report += `**Workflow ID:** ${workflow.id}\n`;
    report += `**Template:** ${workflow.template}\n`;
    report += `**Duration:** ${Math.round(duration / 1000 / 60)} minutes\n`;
    report += `**Status:** ${workflow.state}\n\n`;
    
    report += `## Phases Completed\n`;
    workflow.phases.forEach((phase, index) => {
      report += `${index + 1}. **${phase.phase}** (${phase.state})\n`;
      report += `   - Lead: ${phase.lead_agent}\n`;
      report += `   - Participants: ${phase.participating_agents.join(', ')}\n\n`;
    });
    
    report += `## Deliverables Created\n`;
    workflow.deliverables.forEach(deliverable => {
      report += `- ${deliverable.name} (${deliverable.phase})\n`;
    });
    
    await fs.writeFile(reportPath, report, 'utf8');
    console.log(`📊 Completion report generated: ${reportPath}`);
  }

  async saveWorkflowState(workflow) {
    const statePath = path.join(this.collaborationDataPath, `${workflow.id}_state.json`);
    await fs.writeFile(statePath, JSON.stringify(workflow, null, 2), 'utf8');
  }

  async loadWorkflowHistory() {
    try {
      const historyPath = path.join(this.collaborationDataPath, 'workflow_history.json');
      const data = await fs.readFile(historyPath, 'utf8');
      this.workflowHistory = JSON.parse(data);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('❌ Error loading workflow history:', error.message);
      }
    }
  }

  async saveWorkflowHistory() {
    const historyPath = path.join(this.collaborationDataPath, 'workflow_history.json');
    await fs.writeFile(historyPath, JSON.stringify(this.workflowHistory, null, 2), 'utf8');
  }

  initializeAgentAvailability() {
    // Initialize all agents as available
    const agentTypes = ['pm_agent', 'dev_agent', 'qa_agent', 'architecture_agent', 
                      'ux_expert_agent', 'analyst_agent', 'scrum_master_agent'];
    agentTypes.forEach(agent => {
      this.agentAvailability.set(agent, null);
    });
  }

  /**
   * Public API methods
   */
  getAvailableTemplates() {
    return this.templates.getAllTemplates();
  }

  getActiveWorkflows() {
    return Array.from(this.activeWorkflows.values());
  }

  getWorkflowHistory() {
    return this.workflowHistory;
  }

  async getWorkflowStatus(workflowId) {
    return this.activeWorkflows.get(workflowId) || 
           this.workflowHistory.find(w => w.id === workflowId);
  }
}

module.exports = AgentCollaborationOrchestrator;
