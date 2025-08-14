// Global test setup for WEE project
// This file runs before all tests

// Mock console methods to avoid noise during tests
global.console = {
  ...console,
  // Keep error and warn for debugging
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
};

// Global test utilities
global.testUtils = {
  // Helper to create mock agent responses
  createMockAgentResponse: (agentName, message, success = true) => ({
    agent: agentName,
    message,
    timestamp: new Date().toISOString(),
    success,
    id: Math.random().toString(36).substr(2, 9)
  }),

  // Helper to create mock bridge events
  createMockBridgeEvent: (type, data) => ({
    type,
    data,
    timestamp: new Date().toISOString(),
    source: 'test'
  }),

  // Wait helper for async tests
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.WEE_LOG_LEVEL = 'error'; // Minimize logs during testing
