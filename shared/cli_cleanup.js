/**
 * CLI Cleanup Utility
 * 
 * Provides comprehensive cleanup functions to prevent CLI hanging issues
 * by properly managing timeouts, intervals, and async operations.
 */

class CLICleanup {
  constructor() {
    this.activeTimeouts = new Set();
    this.activeIntervals = new Set();
    this.activePromises = new Set();
    this.cleanupHandlers = [];
    this.isExiting = false;
    this.isCleaningUp = false;
    
    // Track all timeouts and intervals
    this.originalSetTimeout = global.setTimeout;
    this.originalSetInterval = global.setInterval;
    this.originalClearTimeout = global.clearTimeout;
    this.originalClearInterval = global.clearInterval;
    
    this.setupTracking();
    this.setupExitHandlers();
  }
  
  setupTracking() {
    const self = this;
    
    // Override setTimeout to track timeouts
    global.setTimeout = function(callback, delay, ...args) {
      const timeoutId = self.originalSetTimeout.call(this, (...callbackArgs) => {
        self.activeTimeouts.delete(timeoutId);
        return callback.apply(this, callbackArgs);
      }, delay, ...args);
      
      self.activeTimeouts.add(timeoutId);
      return timeoutId;
    };
    
    // Override setInterval to track intervals
    global.setInterval = function(callback, delay, ...args) {
      const intervalId = self.originalSetInterval.call(this, callback, delay, ...args);
      self.activeIntervals.add(intervalId);
      return intervalId;
    };
    
    // Override clearTimeout
    global.clearTimeout = function(timeoutId) {
      self.activeTimeouts.delete(timeoutId);
      return self.originalClearTimeout.call(this, timeoutId);
    };
    
    // Override clearInterval
    global.clearInterval = function(intervalId) {
      self.activeIntervals.delete(intervalId);
      return self.originalClearInterval.call(this, intervalId);
    };
  }
  
  setupExitHandlers() {
    // Handle various exit scenarios
    process.on('exit', () => this.cleanup());
    process.on('SIGINT', () => this.gracefulExit());
    process.on('SIGTERM', () => this.gracefulExit());
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error.message);
      this.cleanup();
      process.exit(1);
    });
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection:', reason);
      this.cleanup();
      process.exit(1);
    });
  }
  
  /**
   * Create a timeout with automatic cleanup tracking
   */
  createTimeout(callback, delay) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.activeTimeouts.delete(timeoutId);
        resolve(callback());
      }, delay);
      
      this.activeTimeouts.add(timeoutId);
    });
  }
  
  /**
   * Create a timeout that rejects (for race conditions)
   */
  createTimeoutReject(errorMessage, delay) {
    return new Promise((_, reject) => {
      const timeoutId = setTimeout(() => {
        this.activeTimeouts.delete(timeoutId);
        reject(new Error(errorMessage));
      }, delay);
      
      this.activeTimeouts.add(timeoutId);
    });
  }
  
  /**
   * Wrap a promise with timeout and cleanup
   */
  wrapPromiseWithTimeout(promise, timeoutMs, timeoutMessage = 'Operation timeout') {
    const timeoutPromise = this.createTimeoutReject(timeoutMessage, timeoutMs);
    
    const wrappedPromise = Promise.race([promise, timeoutPromise])
      .finally(() => {
        // Clean up the timeout when promise resolves/rejects
        this.activePromises.delete(wrappedPromise);
      });
    
    this.activePromises.add(wrappedPromise);
    return wrappedPromise;
  }
  
  /**
   * Add a custom cleanup handler
   */
  addCleanupHandler(handler) {
    this.cleanupHandlers.push(handler);
  }
  
  /**
   * Clean up all active async operations
   */
  cleanup() {
    // Prevent duplicate cleanup calls
    if (this.isCleaningUp) {
      return;
    }
    this.isCleaningUp = true;
    
    console.log('🧹 Cleaning up CLI operations...');
    
    // Clear all active timeouts
    for (const timeoutId of this.activeTimeouts) {
      this.originalClearTimeout(timeoutId);
    }
    this.activeTimeouts.clear();
    
    // Clear all active intervals
    for (const intervalId of this.activeIntervals) {
      this.originalClearInterval(intervalId);
    }
    this.activeIntervals.clear();
    
    // Run custom cleanup handlers
    for (const handler of this.cleanupHandlers) {
      try {
        handler();
      } catch (error) {
        console.error('❌ Cleanup handler error:', error.message);
      }
    }
    
    // Restore original functions
    global.setTimeout = this.originalSetTimeout;
    global.setInterval = this.originalSetInterval;
    global.clearTimeout = this.originalClearTimeout;
    global.clearInterval = this.originalClearInterval;
    
    console.log('✅ CLI cleanup completed');
  }
  
  /**
   * Graceful exit with cleanup
   */
  gracefulExit(exitCode = 0) {
    // Prevent duplicate cleanup calls
    if (this.isExiting) {
      return;
    }
    this.isExiting = true;
    
    this.cleanup();
    
    // Force exit after short delay to ensure cleanup completes
    setTimeout(() => {
      process.exit(exitCode);
    }, 100);
  }
  
  /**
   * Get status of active operations (for debugging)
   */
  getStatus() {
    return {
      activeTimeouts: this.activeTimeouts.size,
      activeIntervals: this.activeIntervals.size,
      activePromises: this.activePromises.size,
      cleanupHandlers: this.cleanupHandlers.length
    };
  }
}

// Singleton pattern to prevent multiple instances
let globalCleanupInstance = null;

function getGlobalCleanup() {
  if (!globalCleanupInstance) {
    globalCleanupInstance = new CLICleanup();
  }
  return globalCleanupInstance;
}

// Export both the class and singleton instance methods
module.exports = {
  CLICleanup,
  
  // Singleton instance methods
  cleanup: () => getGlobalCleanup().cleanup(),
  gracefulExit: (code = 0) => getGlobalCleanup().gracefulExit(code),
  addCleanupHandler: (handler) => getGlobalCleanup().addCleanupHandler(handler),
  getStatus: () => getGlobalCleanup().getStatus(),
  
  // Convenience function for CLI tools
  safeExit: (code = 0, message = null) => {
    if (message) {
      if (code === 0) {
        console.log(message);
      } else {
        console.error(message);
      }
    }
    getGlobalCleanup().gracefulExit(code);
  }
};
