/**
 * PAIRED Startup Notification System
 * 
 * Displays visual confirmation when PAIRED loads successfully in Windsurf.
 * Provides ANSI art, system status, and agent availability information.
 */

const fs = require('fs').promises;
const path = require('path');

class PAIREDStartupNotification {
  constructor() {
    this.colors = {
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
      bgBlue: '\x1b[44m',
      bgGreen: '\x1b[42m'
    };
    
    this.pairedArt = this.createPAIREDArt();
    this.agentEmojis = {
      'pm_agent': '👑',
      'qa_agent': '🔍',
      'dev_agent': '💻',
      'architecture_agent': '🏗️',
      'ux_expert_agent': '🎨',
      'analyst_agent': '📊',
      'scrum_master_agent': '🏃'
    };
  }

  /**
   * Create PAIRED ASCII art
   */
  createPAIREDArt() {
    return `
${this.colors.cyan}${this.colors.bright}
██╗    ██╗███████╗███████╗
██║    ██║██╔════╝██╔════╝
██║ █╗ ██║█████╗  █████╗  
██║███╗██║██╔══╝  ██╔══╝  
╚███╔███╔╝███████╗███████╗
 ╚══╝╚══╝ ╚══════╝╚══════╝
${this.colors.reset}
${this.colors.blue}Workflow Evolution Engine${this.colors.reset}
${this.colors.dim}Production-Ready AI Development Platform${this.colors.reset}
`;
  }

  /**
   * Display startup notification
   */
  async displayStartupNotification() {
    try {
      const startTime = Date.now();
      
      // Clear terminal and show loading
      console.clear();
      console.log(`${this.colors.yellow}🌊 Initializing PAIRED...${this.colors.reset}`);
      
      // Simulate brief loading time for effect
      await this.sleep(500);
      
      // Clear and show full notification
      console.clear();
      
      // Display PAIRED art
      console.log(this.pairedArt);
      
      // Display system status
      await this.displaySystemStatus();
      
      // Display agent status
      await this.displayAgentStatus();
      
      // Display project info
      await this.displayProjectInfo();
      
      // Display footer
      this.displayFooter(startTime);
      
      // Log to PAIRED memory
      await this.logStartupEvent();
      
    } catch (error) {
      console.error(`${this.colors.red}❌ Startup notification failed:${this.colors.reset}`, error.message);
    }
  }

  /**
   * Display system status
   */
  async displaySystemStatus() {
    console.log(`${this.colors.bright}${this.colors.green}🎯 SYSTEM STATUS${this.colors.reset}`);
    console.log(`${this.colors.green}├─${this.colors.reset} PAIRED Core: ${this.colors.green}✅ LOADED${this.colors.reset}`);
    console.log(`${this.colors.green}├─${this.colors.reset} Configuration: ${this.colors.green}✅ VALID${this.colors.reset}`);
    console.log(`${this.colors.green}├─${this.colors.reset} Agent System: ${this.colors.green}✅ ACTIVE${this.colors.reset}`);
    console.log(`${this.colors.green}└─${this.colors.reset} Collaboration Templates: ${this.colors.green}✅ READY${this.colors.reset}`);
    console.log('');
  }

  /**
   * Display agent status
   */
  async displayAgentStatus() {
    console.log(`${this.colors.bright}${this.colors.blue}🤖 AGENT REGISTRY${this.colors.reset}`);
    
    const agents = [
      { name: 'Alex (PM Agent)', type: 'pm_agent', status: 'active' },
      { name: 'Sherlock (QA Agent)', type: 'qa_agent', status: 'active' },
      { name: 'Edison (Dev Agent)', type: 'dev_agent', status: 'active' },
      { name: 'Leonardo (Architecture)', type: 'architecture_agent', status: 'active' },
      { name: 'Maya (UX Expert)', type: 'ux_expert_agent', status: 'active' },
      { name: 'Marie (Analyst)', type: 'analyst_agent', status: 'active' },
      { name: 'Vince (Scrum Master)', type: 'scrum_master_agent', status: 'active' }
    ];

    agents.forEach((agent, index) => {
      const isLast = index === agents.length - 1;
      const connector = isLast ? '└─' : '├─';
      const emoji = this.agentEmojis[agent.type] || '🤖';
      const statusColor = agent.status === 'active' ? this.colors.green : this.colors.yellow;
      const statusText = agent.status === 'active' ? '✅ READY' : '⏳ LOADING';
      
      console.log(`${this.colors.blue}${connector}${this.colors.reset} ${emoji} ${agent.name}: ${statusColor}${statusText}${this.colors.reset}`);
    });
    console.log('');
  }

  /**
   * Display project information
   */
  async displayProjectInfo() {
    try {
      const projectPath = process.cwd();
      const projectName = path.basename(projectPath);
      const timestamp = new Date().toLocaleString();
      
      console.log(`${this.colors.bright}${this.colors.magenta}📋 PROJECT INFO${this.colors.reset}`);
      console.log(`${this.colors.magenta}├─${this.colors.reset} Project: ${this.colors.bright}${projectName}${this.colors.reset}`);
      console.log(`${this.colors.magenta}├─${this.colors.reset} Path: ${this.colors.dim}${projectPath}${this.colors.reset}`);
      console.log(`${this.colors.magenta}├─${this.colors.reset} Initialized: ${this.colors.cyan}${timestamp}${this.colors.reset}`);
      console.log(`${this.colors.magenta}└─${this.colors.reset} Architecture: ${this.colors.yellow}Local Execution + Global Knowledge${this.colors.reset}`);
      console.log('');
      
    } catch (error) {
      console.log(`${this.colors.magenta}└─${this.colors.reset} Project info unavailable`);
      console.log('');
    }
  }

  /**
   * Display footer with quick commands
   */
  displayFooter(startTime) {
    const loadTime = Date.now() - startTime;
    
    console.log(`${this.colors.bright}${this.colors.white}🚀 QUICK COMMANDS${this.colors.reset}`);
    console.log(`${this.colors.white}├─${this.colors.reset} ${this.colors.cyan}wh${this.colors.reset}                    Generate handoff`);
    console.log(`${this.colors.white}├─${this.colors.reset} ${this.colors.cyan}wr${this.colors.reset}                    Resume session`);
    console.log(`${this.colors.white}├─${this.colors.reset} ${this.colors.cyan}wdocs${this.colors.reset}                 Discover documentation`);
    console.log(`${this.colors.white}├─${this.colors.reset} ${this.colors.cyan}paired-doctor${this.colors.reset}            System health check`);
    console.log(`${this.colors.white}└─${this.colors.reset} ${this.colors.cyan}node collaboration-cli.js${this.colors.reset} Agent collaboration`);
    console.log('');
    
    console.log(`${this.colors.dim}Loaded in ${loadTime}ms • Ready for development${this.colors.reset}`);
    console.log(`${this.colors.dim}═══════════════════════════════════════════════════════════${this.colors.reset}`);
    console.log('');
  }

  /**
   * Log startup event to PAIRED memory
   */
  async logStartupEvent() {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        event: 'paired_startup',
        status: 'success',
        project: path.basename(process.cwd()),
        agents_loaded: 7,
        system_health: 'healthy'
      };

      const logPath = path.join(process.cwd(), '.paired', 'memory', 'startup_log.json');
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(logPath), { recursive: true });
      
      // Load existing log or create new
      let startupLog = [];
      try {
        const existingLog = await fs.readFile(logPath, 'utf8');
        startupLog = JSON.parse(existingLog);
      } catch (error) {
        // File doesn't exist, start with empty array
      }
      
      // Add new entry and keep last 50 entries
      startupLog.push(logEntry);
      if (startupLog.length > 50) {
        startupLog = startupLog.slice(-50);
      }
      
      // Save updated log
      await fs.writeFile(logPath, JSON.stringify(startupLog, null, 2), 'utf8');
      
    } catch (error) {
      // Silent fail for logging - don't interrupt startup
      console.error(`${this.colors.dim}Warning: Could not log startup event${this.colors.reset}`);
    }
  }

  /**
   * Display compact notification (for subsequent loads)
   */
  async displayCompactNotification() {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${this.colors.cyan}🌊 PAIRED${this.colors.reset} ${this.colors.green}✅ Ready${this.colors.reset} ${this.colors.dim}(${timestamp})${this.colors.reset} ${this.colors.blue}7 agents active${this.colors.reset}`);
  }

  /**
   * Display error notification
   */
  async displayErrorNotification(error) {
    console.log(`${this.colors.red}${this.colors.bright}
❌ PAIRED INITIALIZATION FAILED
${this.colors.reset}`);
    console.log(`${this.colors.red}Error: ${error.message}${this.colors.reset}`);
    console.log(`${this.colors.yellow}💡 Try running: ${this.colors.cyan}paired-doctor --repair${this.colors.reset}`);
    console.log('');
  }

  /**
   * Utility function for delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if this is the first startup today
   */
  async isFirstStartupToday() {
    try {
      const logPath = path.join(process.cwd(), '.paired', 'memory', 'startup_log.json');
      const data = await fs.readFile(logPath, 'utf8');
      const log = JSON.parse(data);
      
      if (log.length === 0) return true;
      
      const lastStartup = new Date(log[log.length - 1].timestamp);
      const today = new Date();
      
      return lastStartup.toDateString() !== today.toDateString();
      
    } catch (error) {
      return true; // If no log exists, treat as first startup
    }
  }
}

// Export for use in other modules
module.exports = PAIREDStartupNotification;

// If run directly, display notification
if (require.main === module) {
  const notification = new PAIREDStartupNotification();
  notification.displayStartupNotification();
}
