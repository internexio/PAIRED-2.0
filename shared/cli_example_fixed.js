#!/usr/bin/env node
/**
 * Example CLI Tool with Proper Cleanup
 * 
 * Demonstrates how to use the CLI cleanup utility to prevent hanging issues
 */

const { safeExit, wrapPromiseWithTimeout, addCleanupHandler } = require('./cli_cleanup');

class ExampleCLI {
  constructor() {
    this.agent = null;
    this.activeOperations = [];
    
    // Add custom cleanup for this CLI
    addCleanupHandler(() => {
      console.log('🧹 Cleaning up Example CLI...');
      this.cleanup();
    });
  }
  
  async initialize() {
    try {
      console.log('🚀 Initializing Example CLI...');
      
      // OLD WAY (causes hanging):
      // const timeoutPromise = new Promise((_, reject) => 
      //   setTimeout(() => reject(new Error('Initialization timeout')), 3000)
      // );
      // await Promise.race([this.initializeAgent(), timeoutPromise]);
      
      // NEW WAY (prevents hanging):
      const initPromise = this.initializeAgent();
      await wrapPromiseWithTimeout(initPromise, 3000, 'Agent initialization timeout');
      
      console.log('✅ Example CLI initialized successfully');
      
    } catch (error) {
      if (error.message.includes('timeout')) {
        console.warn('⚠️ Initialization timed out - using fallback mode');
        this.setupFallbackMode();
      } else {
        console.error('❌ Initialization failed:', error.message);
        safeExit(1, '❌ Failed to initialize CLI');
      }
    }
  }
  
  async initializeAgent() {
    // Simulate agent initialization
    return new Promise((resolve) => {
      setTimeout(() => {
        this.agent = { status: 'ready', name: 'Example Agent' };
        resolve();
      }, 1000);
    });
  }
  
  setupFallbackMode() {
    this.agent = { status: 'fallback', name: 'Example Agent (Fallback)' };
    console.log('🔄 Fallback mode activated');
  }
  
  async runCommand(command, ...args) {
    try {
      console.log(`🎯 Running command: ${command}`);
      
      switch (command) {
        case 'status':
          await this.showStatus();
          break;
        case 'test':
          await this.runTest();
          break;
        case 'help':
          this.showHelp();
          break;
        default:
          console.error(`❌ Unknown command: ${command}`);
          this.showHelp();
          safeExit(1);
      }
      
      // OLD WAY (abrupt exit that can hang):
      // process.exit(0);
      
      // NEW WAY (clean exit):
      safeExit(0, '✅ Command completed successfully');
      
    } catch (error) {
      console.error('❌ Command failed:', error.message);
      
      // OLD WAY (abrupt exit):
      // process.exit(1);
      
      // NEW WAY (clean exit with cleanup):
      safeExit(1, `❌ Command failed: ${error.message}`);
    }
  }
  
  async showStatus() {
    console.log('📊 Agent Status:');
    console.log(`   Name: ${this.agent?.name || 'Not initialized'}`);
    console.log(`   Status: ${this.agent?.status || 'Unknown'}`);
  }
  
  async runTest() {
    console.log('🧪 Running test...');
    
    // Simulate async operation with proper timeout handling
    const testPromise = new Promise((resolve) => {
      setTimeout(() => {
        console.log('✅ Test completed');
        resolve();
      }, 2000);
    });
    
    // Use cleanup-aware timeout wrapper
    await wrapPromiseWithTimeout(testPromise, 5000, 'Test operation timeout');
  }
  
  showHelp() {
    console.log(`
🚀 Example CLI Tool

Usage: node cli_example_fixed.js <command>

Commands:
  status    - Show agent status
  test      - Run test operation
  help      - Show this help

Examples:
  node cli_example_fixed.js status
  node cli_example_fixed.js test
`);
  }
  
  cleanup() {
    // Clean up any CLI-specific resources
    if (this.activeOperations.length > 0) {
      console.log(`🧹 Cleaning up ${this.activeOperations.length} active operations`);
      this.activeOperations.forEach(op => {
        if (op.cancel) op.cancel();
      });
      this.activeOperations = [];
    }
  }
}

// Main execution
async function main() {
  const cli = new ExampleCLI();
  
  const command = process.argv[2] || 'help';
  const args = process.argv.slice(3);
  
  await cli.initialize();
  await cli.runCommand(command, ...args);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ CLI Error:', error.message);
    safeExit(1);
  });
}

module.exports = ExampleCLI;
