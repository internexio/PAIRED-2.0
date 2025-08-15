// TDD Test for WEE Agent Bridge
// Following Red-Green-Refactor cycle

const AgentBridge = require('../../src/tools/agent-bridge');

describe('AgentBridge', () => {
  let bridge;

  beforeEach(() => {
    // Fresh instance for each test
    bridge = new AgentBridge();
  });

  afterEach(() => {
    // Cleanup after each test
    if (bridge && typeof bridge.disconnect === 'function') {
      bridge.disconnect();
    }
  });

  describe('Initialization', () => {
    test('should create a new AgentBridge instance', () => {
      expect(bridge).toBeInstanceOf(AgentBridge);
    });

    test('should initialize with default configuration', () => {
      expect(bridge.config).toBeDefined();
      expect(bridge.config.maxConnections).toBe(7); // 7 WEE agents
      expect(bridge.config.timeout).toBe(5000);
      expect(bridge.isConnected).toBe(false);
    });

    test('should accept custom configuration', () => {
      const customConfig = { maxConnections: 10, timeout: 3000 };
      const customBridge = new AgentBridge(customConfig);
      
      expect(customBridge.config.maxConnections).toBe(10);
      expect(customBridge.config.timeout).toBe(3000);
    });
  });

  describe('Agent Registration', () => {
    test('should register a new agent', async () => {
      const agentInfo = {
        name: 'Alex',
        role: 'PM',
        capabilities: ['coordination', 'delegation']
      };

      const result = await bridge.registerAgent(agentInfo);
      
      expect(result.success).toBe(true);
      expect(bridge.getRegisteredAgents()).toHaveLength(1);
      expect(bridge.getAgent('Alex')).toEqual(expect.objectContaining(agentInfo));
    });

    test('should reject duplicate agent registration', async () => {
      const agentInfo = { name: 'Alex', role: 'PM' };
      
      await bridge.registerAgent(agentInfo);
      const result = await bridge.registerAgent(agentInfo);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('already registered');
    });

    test('should validate required agent fields', async () => {
      const invalidAgent = { role: 'PM' }; // missing name
      
      const result = await bridge.registerAgent(invalidAgent);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('name is required');
    });
  });

  describe('Message Routing', () => {
    beforeEach(async () => {
      // Register test agents
      await bridge.registerAgent({ name: 'Alex', role: 'PM' });
      await bridge.registerAgent({ name: 'Edison', role: 'Dev' });
    });

    test('should route message to specific agent', async () => {
      const message = {
        to: 'Edison',
        from: 'Alex',
        content: 'Please implement the login feature',
        type: 'task_assignment'
      };

      const result = await bridge.sendMessage(message);
      
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    test('should handle broadcast messages', async () => {
      const broadcastMessage = {
        to: 'all',
        from: 'Alex',
        content: 'Team standup in 5 minutes',
        type: 'announcement'
      };

      const result = await bridge.broadcast(broadcastMessage);
      
      expect(result.success).toBe(true);
      expect(result.recipients).toHaveLength(2); // Alex and Edison
    });

    test('should reject messages to unregistered agents', async () => {
      const message = {
        to: 'UnknownAgent',
        from: 'Alex',
        content: 'Hello',
        type: 'greeting'
      };

      const result = await bridge.sendMessage(message);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Agent not found');
    });
  });

  describe('Connection Management', () => {
    test('should establish connection to CASCADE', async () => {
      const result = await bridge.connect();
      
      expect(result.success).toBe(true);
      expect(bridge.isConnected).toBe(true);
    });

    test('should handle connection failures gracefully', async () => {
      // Mock a connection failure
      bridge.connectionUrl = 'invalid://url';
      
      const result = await bridge.connect();
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(bridge.isConnected).toBe(false);
    });

    test('should maintain heartbeat when connected', async () => {
      // Use a fresh bridge instance with valid URL
      const testBridge = new AgentBridge();
      await testBridge.connect();
      
      // Wait for heartbeat
      await testUtils.wait(1100);
      
      expect(testBridge.lastHeartbeat).toBeDefined();
      expect(Date.now() - testBridge.lastHeartbeat).toBeLessThan(2000);
      
      // Clean up
      await testBridge.disconnect();
    });
  });

  describe('Error Handling', () => {
    test('should emit error events for connection issues', (done) => {
      const errorBridge = new AgentBridge();
      errorBridge.on('error', (error) => {
        expect(error.type).toBe('connection_error');
        done();
      });

      // Trigger a connection error
      errorBridge.connectionUrl = 'invalid://url';
      errorBridge.connect();
    });

    test('should retry failed message delivery', async () => {
      await bridge.registerAgent({ name: 'TestAgent', role: 'Test' });
      
      // Mock a temporary failure
      const originalSend = bridge._sendToAgent;
      let attempts = 0;
      bridge._sendToAgent = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return originalSend.call(bridge, ...arguments);
      });

      const message = {
        to: 'TestAgent',
        from: 'System',
        content: 'Test message',
        type: 'test'
      };

      const result = await bridge.sendMessage(message);
      
      expect(result.success).toBe(true);
      expect(attempts).toBe(3); // Should retry twice before succeeding
    });
  });
});
