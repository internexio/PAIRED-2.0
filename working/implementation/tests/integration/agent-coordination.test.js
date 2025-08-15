// Integration Test for WEE Agent Coordination
// Tests how agents work together through the bridge

const AgentBridge = require('../../src/tools/agent-bridge');

describe('Agent Coordination Integration', () => {
  let bridge;
  const weeAgents = [
    { name: 'Alex', role: 'PM', capabilities: ['coordination', 'delegation'] },
    { name: 'Sherlock', role: 'QA', capabilities: ['testing', 'validation'] },
    { name: 'Leonardo', role: 'Architecture', capabilities: ['design', 'patterns'] },
    { name: 'Edison', role: 'Dev', capabilities: ['implementation', 'debugging'] },
    { name: 'Maya', role: 'UX', capabilities: ['design', 'user_experience'] },
    { name: 'Vince', role: 'Scrum Master', capabilities: ['process', 'coordination'] },
    { name: 'Marie', role: 'Analyst', capabilities: ['data_analysis', 'insights'] }
  ];

  beforeEach(async () => {
    bridge = new AgentBridge();
    await bridge.connect();
    
    // Register all WEE agents
    for (const agent of weeAgents) {
      await bridge.registerAgent(agent);
    }
  });

  afterEach(async () => {
    if (bridge) {
      await bridge.disconnect();
    }
  });

  describe('Workflow Orchestration', () => {
    test('should handle complete TDD workflow', async () => {
      // Alex delegates to Sherlock for test creation
      const testRequest = {
        to: 'Sherlock',
        from: 'Alex',
        content: 'Create tests for user authentication feature',
        type: 'task_assignment',
        metadata: { priority: 'high', feature: 'auth' }
      };

      const testResult = await bridge.sendMessage(testRequest);
      expect(testResult.success).toBe(true);

      // Sherlock responds with test specifications
      const testSpecs = {
        to: 'Alex',
        from: 'Sherlock',
        content: 'Test specifications ready',
        type: 'task_completion',
        metadata: { 
          tests: ['login validation', 'password security', 'session management'],
          coverage: 95
        }
      };

      const specsResult = await bridge.sendMessage(testSpecs);
      expect(specsResult.success).toBe(true);

      // Alex delegates implementation to Edison
      const implementRequest = {
        to: 'Edison',
        from: 'Alex',
        content: 'Implement auth feature based on Sherlock\'s tests',
        type: 'task_assignment',
        metadata: { 
          reference_message: testResult.messageId,
          tests_required: true
        }
      };

      const implResult = await bridge.sendMessage(implementRequest);
      expect(implResult.success).toBe(true);

      // Verify message chain tracking
      const messageHistory = await bridge.getMessageHistory();
      expect(messageHistory).toHaveLength(3);
      expect(messageHistory[2].metadata.reference_message).toBe(testResult.messageId);
    });

    test('should coordinate design review workflow', async () => {
      // Leonardo proposes architecture
      const architectureProposal = {
        to: 'Alex',
        from: 'Leonardo',
        content: 'Proposed microservices architecture for WEE 2.0',
        type: 'proposal',
        metadata: { 
          components: ['agent-bridge', 'mcp-client', 'token-optimizer'],
          patterns: ['event-driven', 'modular']
        }
      };

      await bridge.sendMessage(architectureProposal);

      // Alex requests Maya's UX review
      const uxReview = {
        to: 'Maya',
        from: 'Alex',
        content: 'Review architecture proposal for user experience impact',
        type: 'review_request',
        metadata: { reference_proposal: 'microservices_arch' }
      };

      const uxResult = await bridge.sendMessage(uxReview);
      expect(uxResult.success).toBe(true);

      // Maya provides feedback
      const uxFeedback = {
        to: 'Alex',
        from: 'Maya',
        content: 'Architecture looks good, suggest adding user feedback loops',
        type: 'review_response',
        metadata: { 
          approval: true,
          suggestions: ['user feedback', 'error handling UX']
        }
      };

      const feedbackResult = await bridge.sendMessage(uxFeedback);
      expect(feedbackResult.success).toBe(true);
    });
  });

  describe('Agent Specialization', () => {
    test('should route messages based on agent capabilities', async () => {
      const testingTask = {
        to: 'auto', // Auto-route based on capabilities
        from: 'Alex',
        content: 'Need comprehensive testing strategy',
        type: 'capability_request',
        required_capabilities: ['testing', 'validation']
      };

      const result = await bridge.routeByCapability(testingTask);
      
      expect(result.success).toBe(true);
      expect(result.assignedAgent).toBe('Sherlock');
    });

    test('should handle multi-agent collaboration', async () => {
      const complexTask = {
        to: 'team',
        from: 'Alex',
        content: 'Implement new feature with full TDD cycle',
        type: 'complex_task',
        required_agents: ['Sherlock', 'Leonardo', 'Edison', 'Maya']
      };

      const result = await bridge.createTaskGroup(complexTask);
      
      expect(result.success).toBe(true);
      expect(result.taskGroup.agents).toHaveLength(4);
      expect(result.taskGroup.coordinator).toBe('Alex');
    });
  });

  describe('Error Recovery', () => {
    test('should handle agent unavailability', async () => {
      // Simulate Edison being unavailable
      await bridge.setAgentStatus('Edison', 'unavailable');

      const devTask = {
        to: 'Edison',
        from: 'Alex',
        content: 'Implement feature X',
        type: 'task_assignment'
      };

      const result = await bridge.sendMessage(devTask);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Agent unavailable');
      expect(result.suggested_alternatives).toContain('Leonardo'); // Fallback
    });

    test('should maintain workflow continuity during failures', async () => {
      const workflow = await bridge.createWorkflow([
        { agent: 'Sherlock', task: 'create_tests' },
        { agent: 'Edison', task: 'implement' },
        { agent: 'Sherlock', task: 'validate' }
      ]);

      // Simulate failure in step 2
      await bridge.simulateAgentFailure('Edison');
      
      const result = await bridge.executeWorkflow(workflow.id);
      
      expect(result.completed_steps).toBe(1);
      expect(result.failed_step).toBe(2);
      expect(result.recovery_plan).toBeDefined();
    });
  });
});
