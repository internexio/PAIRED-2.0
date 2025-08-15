/**
 * Cascade Bridge Client
 * 
 * EventEmitter-compatible client for PAIRED agents to connect to the Cascade Bridge.
 * This is the client interface that agents use to communicate with Cascade.
 * 
 * Provides the EventEmitter interface expected by the agent launcher:
 * - client.on('connected', callback)
 * - client.on('disconnected', callback) 
 * - client.on('message', callback)
 * - client.on('error', callback)
 */

const CascadeBridgeAPI = require('./cascade_bridge_api');

/**
 * Cascade Bridge Client - EventEmitter-compatible wrapper
 * 
 * This class provides the interface that PAIRED agents expect for connecting
 * to the Cascade bridge system.
 */
class CascadeBridgeClient extends CascadeBridgeAPI {
  constructor(options = {}) {
    super(options);
    
    // Additional client-specific properties
    this.url = options.url || 'ws://localhost:7890';
    this.projectName = options.projectName || 'PAIRED-Project';
    this.debug = options.debug || false;
    
    if (this.debug) {
      console.log(`🔧 CascadeBridgeClient initialized for project: ${this.projectName}`);
    }
  }

  /**
   * Connect to the bridge with enhanced logging
   * @returns {Promise<void>}
   */
  async connect() {
    if (this.debug) {
      console.log(`🔗 Connecting to Cascade bridge at ${this.url}...`);
    }
    
    try {
      await super.connect();
      if (this.debug) {
        console.log('✅ Successfully connected to Cascade bridge');
      }
    } catch (error) {
      if (this.debug) {
        console.error('❌ Failed to connect to Cascade bridge:', error.message);
      }
      throw error;
    }
  }

  /**
   * Disconnect from the bridge with enhanced logging
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (this.debug) {
      console.log('🔌 Disconnecting from Cascade bridge...');
    }
    
    await super.disconnect();
    
    if (this.debug) {
      console.log('✅ Disconnected from Cascade bridge');
    }
  }

  /**
   * Send message with client-specific formatting
   * @param {string} agentId Agent identifier
   * @param {string} message Message content
   * @returns {boolean} Success status
   */
  sendMessage(agentId, message) {
    if (this.debug) {
      console.log(`📤 Sending message from ${agentId}: ${message.substring(0, 100)}...`);
    }
    
    return this.sendAgentMessage(agentId, message);
  }

  /**
   * Get connection status
   * @returns {boolean} True if connected
   */
  getConnectionStatus() {
    return this.isConnected();
  }
}

module.exports = CascadeBridgeClient;
