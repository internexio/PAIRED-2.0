# 🚀 Deployment and Setup Guide
*Step-by-Step Implementation of Claude Code + PAIRED 1.0 Integration*

## 🎯 **Quick Start Checklist**

### **Prerequisites Verification**
```bash
# Verify Node.js version
node --version  # Should be >=16.0.0
npm --version   # Should be >=8.0.0

# Verify Claude Code installation
claude-code --version  # Should be installed and accessible

# Verify Windsurf with PAIRED 1.0
ls ~/.paired/  # Should exist if PAIRED 1.0 is installed
```

### **Project Setup (5 minutes)**
```bash
# 1. Create project directory
mkdir claude-code-paired && cd claude-code-paired

# 2. Initialize Node.js project
npm init -y

# 3. Install core dependencies
npm install express ws uuid chalk commander fs-extra js-yaml inquirer glob
npm install @babel/parser @babel/traverse @babel/types
npm install pino pino-pretty rate-limiter-flexible

# 4. Install development dependencies  
npm install --save-dev jest axios chai mocha eslint prettier nodemon

# 5. Create project structure
mkdir -p src/{core,agents,mcp-bridge,claude-integration,token-optimization,monitoring,utils}
mkdir -p config/{agents,integrations} tests/{unit,integration,e2e} scripts docs
```

## 📦 **Complete Package.json Template**

```json
{
  "name": "claude-code-paired",
  "version": "1.0.0",
  "description": "Claude Code + PAIRED 1.0 Integration with Token Optimization",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "dev:debug": "nodemon --inspect src/index.js",
    
    "bridge:start": "node src/mcp-bridge/bridge-service.js",
    "bridge:test": "node scripts/test-bridge-connection.js",
    "agents:validate": "node scripts/validate-agents.js",
    "tokens:analyze": "node scripts/analyze-token-usage.js",
    
    "test": "jest --detectOpenHandles",
    "test:watch": "jest --watch --detectOpenHandles",
    "test:coverage": "jest --coverage --detectOpenHandles",
    "test:integration": "jest tests/integration --detectOpenHandles",
    "test:e2e": "jest tests/e2e --detectOpenHandles",
    
    "setup": "node scripts/setup.js",
    "health": "node src/monitoring/health-checker.js",
    "dashboard": "node src/monitoring/dashboard-server.js",
    
    "lint": "eslint src/ --ext .js",
    "lint:fix": "eslint src/ --ext .js --fix",
    "format": "prettier --write src/**/*.js",
    
    "clean": "rm -rf node_modules package-lock.json && npm install"
  },
  "dependencies": {
    "express": "^5.1.0",
    "ws": "^8.18.3",
    "uuid": "^11.1.0",
    "chalk": "^4.1.2",
    "commander": "^9.4.1",
    "fs-extra": "^10.1.0",
    "js-yaml": "^4.1.0",
    "inquirer": "^8.2.5",
    "glob": "^11.0.3",
    "@babel/parser": "^7.28.0",
    "@babel/traverse": "^7.28.0",
    "@babel/types": "^7.28.2",
    "pino": "^8.0.0",
    "pino-pretty": "^10.0.0",
    "rate-limiter-flexible": "^3.0.0"
  },
  "devDependencies": {
    "jest": "^30.0.5",
    "axios": "^1.11.0",
    "chai": "^5.2.1",
    "mocha": "^11.7.1",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "nodemon": "^3.0.0",
    "supertest": "^6.0.0"
  },
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=8.0.0"
  },
  "keywords": [
    "claude-code",
    "paired",
    "ai-agents",
    "mcp-bridge",
    "token-optimization",
    "windsurf-integration"
  ],
  "author": "PAIRED Development Team",
  "license": "MIT"
}
```

## ⚙️ **Configuration Files**

### **Main Configuration (config/default.yml)**
```yaml
# Claude Code + PAIRED Integration Configuration
app:
  name: "Claude Code PAIRED"
  version: "1.0.0"
  environment: "development"

# MCP Bridge Configuration
mcp_bridge:
  enabled: true
  claude_code:
    endpoint: "ws://localhost:8081"
    timeout: 30000
    retry_attempts: 5
    heartbeat_interval: 5000
  windsurf:
    endpoint: "ws://localhost:8080"
    timeout: 15000
    retry_attempts: 3
    heartbeat_interval: 3000

# Token Optimization
token_optimization:
  enabled: true
  cost_threshold: 1000
  complexity_threshold: 0.7
  claude_preference: 0.6
  quota_warning_threshold: 0.8
  quota_critical_threshold: 0.9

# Agent System
agents:
  max_concurrent: 7
  timeout: 30000
  retry_attempts: 2
  
  routing_preferences:
    alex-pm:
      claude_code: 0.8
      windsurf: 0.2
    sherlock-qa:
      claude_code: 0.7
      windsurf: 0.3
    leonardo-arch:
      claude_code: 0.9
      windsurf: 0.1
    edison-dev:
      claude_code: 0.6
      windsurf: 0.4
    maya-ux:
      claude_code: 0.8
      windsurf: 0.2
    vince-scrum:
      claude_code: 0.5
      windsurf: 0.5
    marie-analyst:
      claude_code: 0.9
      windsurf: 0.1

# Monitoring
monitoring:
  enabled: true
  dashboard_port: 3001
  metrics_interval: 10000
  log_level: "info"
  
# Security
security:
  api_key_rotation: true
  request_rate_limit: 100
  session_timeout: 3600000
```

### **Agent Configuration (config/agents/alex-pm.yml)**
```yaml
# Alex (PM) Agent Configuration
agent:
  name: "alex-pm"
  display_name: "👑 Alex (PM)"
  description: "Project coordination and strategic planning"
  
capabilities:
  - "project-planning"
  - "milestone-tracking" 
  - "resource-allocation"
  - "strategic-analysis"
  - "risk-assessment"
  - "timeline-management"

platform_optimization:
  claude_code_tasks:
    - "strategic-planning"
    - "complex-analysis"
    - "roadmap-development"
    - "risk-assessment"
  
  windsurf_tasks:
    - "file-organization"
    - "progress-monitoring"
    - "team-coordination"
    - "status-reporting"

token_estimation:
  base_tokens: 500
  complexity_multiplier: 1.5
  context_multiplier: 1.2

performance_targets:
  response_time: 5000
  success_rate: 0.95
  token_efficiency: 0.8
```

## 🔧 **Setup Scripts**

### **Automated Setup Script (scripts/setup.js)**
```javascript
#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

class SetupManager {
  constructor() {
    this.projectRoot = process.cwd();
    this.configDir = path.join(this.projectRoot, 'config');
    this.srcDir = path.join(this.projectRoot, 'src');
  }
  
  async run() {
    console.log(chalk.blue('🚀 Setting up Claude Code + PAIRED Integration...\n'));
    
    try {
      await this.verifyPrerequisites();
      await this.createDirectoryStructure();
      await this.copyConfigurationFiles();
      await this.setupEnvironmentFiles();
      await this.validateSetup();
      
      console.log(chalk.green('\n✅ Setup completed successfully!'));
      console.log(chalk.yellow('\nNext steps:'));
      console.log('1. npm run bridge:test  # Test MCP bridge connection');
      console.log('2. npm run agents:validate  # Validate agent system');
      console.log('3. npm run dev  # Start development server');
      
    } catch (error) {
      console.error(chalk.red('\n❌ Setup failed:'), error.message);
      process.exit(1);
    }
  }
  
  async verifyPrerequisites() {
    console.log(chalk.blue('🔍 Verifying prerequisites...'));
    
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 16) {
      throw new Error(`Node.js >= 16.0.0 required, found ${nodeVersion}`);
    }
    console.log(chalk.green(`✅ Node.js ${nodeVersion}`));
    
    // Check npm
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log(chalk.green(`✅ npm ${npmVersion}`));
    } catch (error) {
      throw new Error('npm not found');
    }
    
    // Check for PAIRED 1.0 installation
    const pairedDir = path.join(process.env.HOME, '.paired');
    if (await fs.pathExists(pairedDir)) {
      console.log(chalk.green('✅ PAIRED 1.0 installation found'));
    } else {
      console.log(chalk.yellow('⚠️ PAIRED 1.0 not found - will create basic setup'));
    }
  }
  
  async createDirectoryStructure() {
    console.log(chalk.blue('📁 Creating directory structure...'));
    
    const directories = [
      'src/core',
      'src/agents/alex-pm',
      'src/agents/sherlock-qa', 
      'src/agents/leonardo-arch',
      'src/agents/edison-dev',
      'src/agents/maya-ux',
      'src/agents/vince-scrum',
      'src/agents/marie-analyst',
      'src/mcp-bridge',
      'src/claude-integration',
      'src/token-optimization',
      'src/monitoring',
      'src/utils',
      'config/agents',
      'config/integrations',
      'tests/unit',
      'tests/integration',
      'tests/e2e',
      'scripts',
      'docs',
      'logs'
    ];
    
    for (const dir of directories) {
      await fs.ensureDir(path.join(this.projectRoot, dir));
    }
    
    console.log(chalk.green('✅ Directory structure created'));
  }
  
  async copyConfigurationFiles() {
    console.log(chalk.blue('⚙️ Creating configuration files...'));
    
    // Create basic configuration files
    const configs = {
      'config/default.yml': this.getDefaultConfig(),
      'config/development.yml': this.getDevelopmentConfig(),
      'config/production.yml': this.getProductionConfig(),
      '.env.example': this.getEnvExample(),
      '.gitignore': this.getGitignore(),
      'README.md': this.getReadme()
    };
    
    for (const [filePath, content] of Object.entries(configs)) {
      await fs.writeFile(path.join(this.projectRoot, filePath), content);
    }
    
    console.log(chalk.green('✅ Configuration files created'));
  }
  
  async setupEnvironmentFiles() {
    console.log(chalk.blue('🔐 Setting up environment files...'));
    
    const envFile = path.join(this.projectRoot, '.env');
    if (!(await fs.pathExists(envFile))) {
      await fs.copy(
        path.join(this.projectRoot, '.env.example'),
        envFile
      );
      console.log(chalk.yellow('📝 Please update .env file with your configuration'));
    }
    
    console.log(chalk.green('✅ Environment files ready'));
  }
  
  async validateSetup() {
    console.log(chalk.blue('✅ Validating setup...'));
    
    // Check if all required files exist
    const requiredFiles = [
      'package.json',
      'config/default.yml',
      '.env',
      'src',
      'config',
      'tests'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (!(await fs.pathExists(filePath))) {
        throw new Error(`Required file/directory missing: ${file}`);
      }
    }
    
    console.log(chalk.green('✅ Setup validation passed'));
  }
  
  getDefaultConfig() {
    return `# Claude Code + PAIRED Integration Configuration
app:
  name: "Claude Code PAIRED"
  version: "1.0.0"
  environment: "development"

mcp_bridge:
  enabled: true
  claude_code:
    endpoint: "ws://localhost:8081"
    timeout: 30000
  windsurf:
    endpoint: "ws://localhost:8080"
    timeout: 15000

token_optimization:
  enabled: true
  cost_threshold: 1000
  complexity_threshold: 0.7

agents:
  max_concurrent: 7
  timeout: 30000

monitoring:
  enabled: true
  dashboard_port: 3001
  log_level: "info"
`;
  }
  
  getDevelopmentConfig() {
    return `# Development Environment Configuration
app:
  environment: "development"

monitoring:
  log_level: "debug"
  dashboard_port: 3001

mcp_bridge:
  claude_code:
    endpoint: "ws://localhost:8081"
  windsurf:
    endpoint: "ws://localhost:8080"
`;
  }
  
  getProductionConfig() {
    return `# Production Environment Configuration
app:
  environment: "production"

monitoring:
  log_level: "warn"
  dashboard_port: 3000

security:
  api_key_rotation: true
  request_rate_limit: 100
`;
  }
  
  getEnvExample() {
    return `# Claude Code + PAIRED Environment Variables
NODE_ENV=development
PORT=3000

# Claude Code Configuration
CLAUDE_CODE_ENDPOINT=ws://localhost:8081
CLAUDE_API_KEY=your_claude_api_key_here

# Windsurf Configuration  
WINDSURF_ENDPOINT=ws://localhost:8080

# Token Optimization
TOKEN_OPTIMIZATION_ENABLED=true
COST_THRESHOLD=1000

# Monitoring
MONITORING_ENABLED=true
LOG_LEVEL=info
`;
  }
  
  getGitignore() {
    return `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Build outputs
dist/
build/
`;
  }
  
  getReadme() {
    return `# Claude Code + PAIRED Integration

Token-optimized integration of PAIRED 1.0's 7-agent development team with Claude Code.

## Quick Start

\`\`\`bash
npm install
npm run setup
npm run dev
\`\`\`

## Available Scripts

- \`npm run dev\` - Start development server
- \`npm run bridge:test\` - Test MCP bridge connection
- \`npm run agents:validate\` - Validate agent system
- \`npm test\` - Run test suite

## Documentation

See the \`docs/\` directory for detailed documentation.
`;
  }
}

// Run setup if called directly
if (require.main === module) {
  new SetupManager().run();
}

module.exports = SetupManager;
```

### **Bridge Connection Test (scripts/test-bridge-connection.js)**
```javascript
#!/usr/bin/env node

const chalk = require('chalk');
const WebSocket = require('ws');

class BridgeConnectionTester {
  async run() {
    console.log(chalk.blue('🌉 Testing MCP Bridge Connections...\n'));
    
    await this.testClaudeCodeConnection();
    await this.testWindsurfConnection();
    
    console.log(chalk.green('\n✅ Bridge connection tests completed'));
  }
  
  async testClaudeCodeConnection() {
    console.log(chalk.blue('Testing Claude Code connection...'));
    
    try {
      const ws = new WebSocket('ws://localhost:8081');
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 5000);
        
        ws.on('open', () => {
          clearTimeout(timeout);
          console.log(chalk.green('✅ Claude Code connection successful'));
          ws.close();
          resolve();
        });
        
        ws.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
      
    } catch (error) {
      console.log(chalk.yellow('⚠️ Claude Code connection failed:'), error.message);
      console.log(chalk.gray('   This is expected if Claude Code is not running'));
    }
  }
  
  async testWindsurfConnection() {
    console.log(chalk.blue('Testing Windsurf connection...'));
    
    try {
      const ws = new WebSocket('ws://localhost:8080');
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 5000);
        
        ws.on('open', () => {
          clearTimeout(timeout);
          console.log(chalk.green('✅ Windsurf connection successful'));
          ws.close();
          resolve();
        });
        
        ws.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
      
    } catch (error) {
      console.log(chalk.yellow('⚠️ Windsurf connection failed:'), error.message);
      console.log(chalk.gray('   Make sure PAIRED 1.0 is running'));
    }
  }
}

// Run test if called directly
if (require.main === module) {
  new BridgeConnectionTester().run();
}

module.exports = BridgeConnectionTester;
```

## 🧪 **Testing Strategy**

### **Jest Configuration (jest.config.js)**
```javascript
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/index.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000
};
```

### **Test Setup (tests/setup.js)**
```javascript
// Global test setup
const chalk = require('chalk');

// Suppress console.log during tests unless DEBUG is set
if (!process.env.DEBUG) {
  console.log = jest.fn();
  console.info = jest.fn();
}

// Global test timeout
jest.setTimeout(10000);

// Setup and teardown
beforeAll(async () => {
  console.error(chalk.blue('🧪 Starting test suite...'));
});

afterAll(async () => {
  console.error(chalk.green('✅ Test suite completed'));
});
```

## 🚀 **Deployment Commands**

### **Development Deployment**
```bash
# 1. Clone and setup
git clone <repository-url> claude-code-paired
cd claude-code-paired

# 2. Install dependencies
npm install

# 3. Run setup
npm run setup

# 4. Configure environment
cp .env.example .env
# Edit .env with your configuration

# 5. Test connections
npm run bridge:test

# 6. Validate agents
npm run agents:validate

# 7. Start development server
npm run dev
```

### **Production Deployment**
```bash
# 1. Set production environment
export NODE_ENV=production

# 2. Install production dependencies
npm ci --only=production

# 3. Run health check
npm run health

# 4. Start production server
npm start
```

---

**This deployment guide provides all the missing execution pieces: package.json, configuration files, setup scripts, testing framework, and step-by-step deployment procedures.**

*Now we have both comprehensive planning AND immediate execution readiness!*
