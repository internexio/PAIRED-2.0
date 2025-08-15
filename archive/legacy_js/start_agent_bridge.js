#!/usr/bin/env node

/**
 * PAIRED Agent Bridge Startup Script
 * 
 * This script starts the workflow agent bridge that makes your agents
 * "speak up" during normal Windsurf development work.
 * 
 * Usage:
 *   node .paired/start_agent_bridge.js
 *   
 * Or add to your shell startup to run automatically:
 *   echo "node .paired/start_agent_bridge.js &" >> ~/.zshrc
 */

const path = require('path');
const WorkflowAgentBridge = require('./core/workflow_agent_bridge');

console.log('🌊 Starting PAIRED Agent Communication Bridge...');

const projectPath = process.cwd();
const bridge = new WorkflowAgentBridge(projectPath);

// Start the bridge
bridge.startMonitoring().then(() => {
  console.log('✅ PAIRED Agent Bridge is now ACTIVE!');
  console.log('🎯 Your agents will now participate in your workflow');
  console.log('💡 Keep this running in the background while you work');
  console.log('🛑 Press Ctrl+C to stop agent monitoring');
  
  // Listen for agent triggers
  bridge.on('agentTriggered', (event) => {
    // Could integrate with Windsurf notifications here
    console.log(`🔔 Agent ${event.agent} triggered by ${event.file.path}`);
  });
  
}).catch(error => {
  console.error('❌ Failed to start agent bridge:', error.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down PAIRED Agent Bridge...');
  bridge.stopMonitoring();
  console.log('✅ Agent bridge stopped gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down PAIRED Agent Bridge...');
  bridge.stopMonitoring();
  process.exit(0);
});
