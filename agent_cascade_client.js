/**
 * Agent CASCADE Client
 * 
 * Integration layer for PAIRED agents to communicate with Windsurf CASCADE interface
 * via the CASCADE Bridge Service.
 */

const axios = require('axios');
const { EventEmitter } = require('events');

class CascadeClient extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      bridgeUrl: config.bridgeUrl || 'http://localhost:9876',
      agentId: config.agentId || 'agent-' + Date.now(),
      agentName: config.agentName || 'Node.js Agent',
      capabilities: config.capabilities || ['analysis', 'suggestions'],
      autoRegister: config.autoRegister !== false,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      ...config
    };
    
    this.registered = false;
    this.sessionId = null;
    
    if (this.config.autoRegister) {
      this.register().catch(err => this.emit('error', err));
    }
  }
  
  async register() {
    try {
      const response = await axios.post(`${this.config.bridgeUrl}/register-agent`, {
        agentId: this.config.agentId,
        name: this.config.agentName,
        capabilities: this.config.capabilities
      });
      
      this.registered = true;
      this.emit('registered', response.data);
      return response.data;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  async comment(content, options = {}) {
    if (!this.registered) {
      await this.register();
    }
    
    const commentData = {
      agentId: this.config.agentId,
      type: options.type || 'info',
      content: content,
      file: options.file,
      line: options.line,
      column: options.column,
      context: {
        sessionId: this.sessionId || options.sessionId,
        correlationId: options.correlationId,
        ...options.context
      },
      metadata: {
        priority: options.priority || 'normal',
        persistent: options.persistent !== false,
        style: options.style,
        ...options.metadata
      }
    };
    
    let attempts = 0;
    while (attempts < this.config.retryAttempts) {
      try {
        const response = await axios.post(
          `${this.config.bridgeUrl}/cascade/comment`,
          commentData
        );
        
        this.emit('comment-sent', response.data);
        return response.data;
      } catch (error) {
        attempts++;
        if (attempts >= this.config.retryAttempts) {
          this.emit('error', error);
          throw error;
        }
        
        await new Promise(resolve => 
          setTimeout(resolve, this.config.retryDelay * attempts)
        );
      }
    }
  }
  
  // Convenience methods for different comment types
  async info(content, options = {}) {
    return this.comment(content, { ...options, type: 'info' });
  }
  
  async warning(content, options = {}) {
    return this.comment(content, { ...options, type: 'warning' });
  }
  
  async error(content, options = {}) {
    return this.comment(content, { ...options, type: 'error' });
  }
  
  async success(content, options = {}) {
    return this.comment(content, { ...options, type: 'success' });
  }
  
  async debug(content, options = {}) {
    return this.comment(content, { ...options, type: 'debug' });
  }
  
  async suggestion(content, options = {}) {
    return this.comment(content, { ...options, type: 'suggestion' });
  }
  
  async analysis(content, options = {}) {
    return this.comment(content, { ...options, type: 'analysis' });
  }
  
  async performance(content, options = {}) {
    return this.comment(content, { ...options, type: 'performance' });
  }
}

module.exports = { CascadeClient };
