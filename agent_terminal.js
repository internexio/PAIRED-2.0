#!/usr/bin/env node

/**
 * PAIRED Agent Terminal Interface
 * This script provides a direct terminal interface to view agent conversations in real-time
 */

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const WorkflowAgentBridge = require('../src/core/workflow_agent_bridge');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
  }
};

// Agent colors
const agentColors = {
  'Sherlock (QA)': colors.magenta,
  'Leonardo (Architecture)': colors.blue,
  'Edison (Dev)': colors.yellow,
  'Alex (PM)': colors.green,
  'Maya (UX)': colors.cyan,
  'Vince (Scrum Master)': colors.red,
  'Marie (Analyst)': colors.white
};

// Create a test directory to trigger agents
const testDir = path.join(process.cwd(), 'test_agent_triggers');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// Initialize the bridge
console.log(`${colors.bright}${colors.blue}🚀 Initializing PAIRED Agent Bridge...${colors.reset}`);
const bridge = new WorkflowAgentBridge(process.cwd());

// Set up enhanced event handler for agent triggers
bridge.on('agentTriggered', (event) => {
  const agentColor = agentColors[event.agent] || colors.white;
  const timestamp = new Date().toLocaleTimeString();
  
  console.log(`\n${colors.dim}[${timestamp}]${colors.reset} ${agentColor}${colors.bright}${event.agent}${colors.reset} was triggered:`);
  console.log(`${colors.dim}└─ File:${colors.reset} ${event.file.path}`);
  
  if (event.keywords && event.keywords.length > 0) {
    console.log(`${colors.dim}└─ Keywords:${colors.reset} ${event.keywords.join(', ')}`);
  }
  
  if (event.message) {
    console.log(`${colors.dim}└─ Message:${colors.reset} "${event.message}"`);
  }
  
  // This is the special message format for Cascade
  if (process.env.CASCADE_INTEGRATION) {
    console.log(`CASCADE_AGENT_MESSAGE::${event.agent}::${JSON.stringify(event)}`);
  }
});

// Function to create test files to trigger agents
async function triggerAgents() {
  console.log(`${colors.bright}${colors.blue}🧪 Testing agent triggers for ALL 7 agents...${colors.reset}\n`);
  
  // QA Agent (Sherlock)
  console.log(`${colors.magenta}🔍 Triggering QA Agent (Sherlock)...${colors.reset}`);
  fs.writeFileSync(path.join(testDir, 'test_quality.test.js'), '// Test file to trigger QA agent\ndescribe("Quality tests", () => {\n  it("should test for quality", () => {\n    expect(true).toBe(true);\n  });\n});');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Architecture Agent (Leonardo)
  console.log(`${colors.blue}🏛️ Triggering Architecture Agent (Leonardo)...${colors.reset}`);
  fs.writeFileSync(path.join(testDir, 'system_architecture.yml'), 'architecture:\n  version: 1.0\n  design: "microservices"\n  patterns:\n    - "event-driven"\n    - "hexagonal"');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Dev Agent (Edison)
  console.log(`${colors.yellow}⚡ Triggering Dev Agent (Edison)...${colors.reset}`);
  fs.writeFileSync(path.join(testDir, 'implementation.js'), 'function optimizeAlgorithm() {\n  // This is a complex algorithm implementation\n  console.log("Performance optimization complete");\n  return true;\n}');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // UX Agent (Maya)
  console.log(`${colors.cyan}🎨 Triggering UX Agent (Maya)...${colors.reset}`);
  fs.writeFileSync(path.join(testDir, 'user_interface.css'), '/* User experience styles */\n.accessible-button {\n  color: #333;\n  background: #f5f5f5;\n  padding: 10px;\n  border-radius: 5px;\n}');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // PM Agent (Alex)
  console.log(`${colors.green}👑 Triggering PM Agent (Alex)...${colors.reset}`);
  fs.writeFileSync(path.join(testDir, 'project_roadmap.md'), '# Project Roadmap\n\n## Milestones\n\n- [x] Phase 1: Planning\n- [ ] Phase 2: Implementation\n- [ ] Phase 3: Testing\n- [ ] Phase 4: Deployment');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Scrum Master Agent (Vince)
  console.log(`${colors.red}🏈 Triggering Scrum Master Agent (Vince)...${colors.reset}`);
  fs.writeFileSync(path.join(testDir, 'sprint_planning.md'), '# Sprint Planning\n\n## Daily Standups\n\n- Team velocity: 24 points\n- Blockers: None\n- Sprint goals: Implement core features');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Analyst Agent (Marie)
  console.log(`${colors.white}${colors.bg.blue}🔬 Triggering Analyst Agent (Marie)...${colors.reset}`);
  fs.writeFileSync(path.join(testDir, 'data_analysis.json'), JSON.stringify({
    "analysis": {
      "metrics": {
        "users": 1500,
        "conversion": 3.5,
        "engagement": 7.2
      },
      "trends": ["increasing", "stable", "increasing"]
    }
  }, null, 2));
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log(`\n${colors.green}✅ All 7 agent triggers complete!${colors.reset}`);
  console.log(`${colors.blue}👀 Watching for agent activity... (Press Ctrl+C to exit)${colors.reset}`);
}

// Start the bridge and test agents
async function start() {
  try {
    // Set the environment variable for Cascade integration
    process.env.CASCADE_INTEGRATION = 'true';
    
    // Start monitoring
    await bridge.startMonitoring();
    console.log(`${colors.green}✅ PAIRED Agent Bridge is now active!${colors.reset}`);
    
    // Trigger the agents
    await triggerAgents();
    
  } catch (error) {
    console.error(`${colors.red}❌ Failed to start agent bridge:${colors.reset}`, error);
    process.exit(1);
  }
}

// Cleanup function
function cleanup() {
  console.log(`\n${colors.blue}🛑 Shutting down PAIRED Agent Bridge...${colors.reset}`);
  bridge.stopMonitoring();
  console.log(`${colors.green}✅ Agent bridge stopped gracefully${colors.reset}`);
  process.exit(0);
}

// Handle signals for cleanup
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start the application
start();
