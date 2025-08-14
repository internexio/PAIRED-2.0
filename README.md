# 🤝 PAIRED - Platform for AI-Enabled Remote Development

**Never code alone - Whether paired with AI or humans**

*Revolutionary middleware that transforms how developers collaborate* ✨

🎯 **Better together!** PAIRED is intelligent middleware that orchestrates AI resources across multiple platforms while pioneering true pair programming in the AI age. It's the bridge that connects everything you use, adds intelligence where needed, and disappears when not.

**"Partnership is our platform, collaboration is our code"** - The PAIRED manifesto.

## 🤖 Your 7-Agent Development Team

Each agent has **real capabilities** - not just chat responses:

- 👑 **Alex (PM)** - Project coordination and strategic planning
  - Real project planning tools and milestone tracking
- 🕵️ **Sherlock (QA)** - Quality investigation and code auditing
  - Runs actual code quality audits and metrics analysis
- 🏛️ **Leonardo (Architecture)** - System design and architectural patterns
  - Performs real architectural pattern detection and analysis
- ⚡ **Edison (Dev)** - Development implementation and debugging
  - Provides actual debugging assistance and development tools
- 🎨 **Maya (UX)** - User experience design and accessibility
  - Conducts real WCAG accessibility audits and UX analysis
- 🏈 **Vince (Scrum Master)** - Team coordination and process management
  - Manages actual sprint health monitoring and team processes
- 🔬 **Marie (Analyst)** - Data analysis and market research
  - Performs real market research and competitive analysis

## ✨ Why PAIRED is Revolutionary

- **🤝 Universal Bridge** - One platform, every AI, infinite collaboration
- **🔧 Real Agent Tools** - Each agent uses actual analysis tools, not just chat
- **🌍 Works Everywhere** - Same intelligent bridge connects any project
- **⚡ One-Command Magic** - Single activation script, instant agent team
- **💬 Seamless Integration** - Agents appear naturally in CASCADE chat
- **🛡️ Rock-Solid Reliable** - Manual activation (always works)
- **📚 Beautifully Simple** - Clear docs that respect your time

## 🚀 Quick Start

### 1. Install PAIRED Globally
```bash
# Clone PAIRED repository
git clone git@github.com:internexio/wee.git ~/paired-temp
cd ~/paired-temp

# Run global installation (creates ~/.paired/ infrastructure)
./install.sh
```

**What this does:**
- Creates `~/.paired/` global infrastructure
- Installs all 7 PAIRED agents with real capabilities
- Sets up global commands: `paired-init`, `paired-status`, `paired-doctor`
- Configures shell aliases for seamless workflow

### 2. Initialize PAIRED in Your Project
```bash
# Navigate to your project
cd /path/to/your/project

# Initialize PAIRED (creates .paired/ directory and agent configs)
paired-init

# Open Windsurf IDE
windsurf .
```

**What this creates:**
- `.paired/` directory with project-specific agent data
- `.pairedrules` configuration for project-specific rules
- `.windsurfrules` for Windsurf IDE integration
- Agent memory and context preservation system

### 3. Activate PAIRED Agents Team ⭐
```bash
# Manual activation (always works)
paired-start
```

### 4. Start Working with Your Agents
In CASCADE chat, ask:
```
Alex, are you there?
```

You should immediately hear from Alex and your 7-agent team!

## 🚀 Production Deployment

### For Production Servers
```bash
# Install PAIRED on production server
curl -sSL https://raw.githubusercontent.com/internexio/wee/main/install.sh | bash

# Initialize in production project
cd /path/to/production/project
paired-init --production

# Verify installation
paired-doctor --full-check
```

### For Team Deployment
```bash
# Each team member installs globally
./install.sh

# Project lead initializes team project
paired-init --team-mode

# Team members join existing project
cd existing-paired-project
paired-status  # Auto-detects and connects
```

### Environment Variables
```bash
# Optional: Configure PAIRED behavior
export PAIRED_MODE="production"        # or "development"
export PAIRED_LOG_LEVEL="info"         # or "debug", "warn", "error"
export PAIRED_AUTO_CONNECT="true"      # Auto-connect to agents
export PAIRED_BRIDGE_PORT="3001"       # Custom bridge port
```

## 📚 Complete Command Reference

### Global Commands
- `paired-init` - Initialize PAIRED in current project
- `paired-status` - Show global and project status
- `paired-doctor` - Comprehensive health check and repair
- `paired-knowledge` - Sync knowledge between projects
- `paired knowledge <cmd>` - Project knowledge management (init, learn, context, search, stats, export)
- `paired-global` - Manage global PAIRED registry
- `paired-sync` - Sync project data with global knowledge

### Project Commands (work in PAIRED projects)
- `wh` - Generate handoff documentation
- `wr` - Resume from last session
- `wdocs` - Discover and analyze documentation
- `wtype` - Clean up type definitions
- `wenv-dev/test/prod` - Set environment configurations

### Diagnostic Commands
- `paired-test` - Run PAIRED system tests
- `paired-validate` - Validate system configuration
- `paired-help` - Show all available commands
- `paired-version` - Show PAIRED version info

## 🔧 Troubleshooting

### Agents Not Responding?
```bash
# 1. Ensure global bridge is running
~/.paired/scripts/bridge_status.sh

# 2. Re-run activation command
~/.paired/scripts/activate_cascade_complete.sh

# 3. Check PAIRED health
paired-doctor
```

### Common Issues
- **"Alex, are you there?" gets no response** → Run the activation script again
- **Bridge connection failed** → Check if another Windsurf instance is running
- **Agents give generic responses** → Activation script may not have completed successfully

## 🧠 Project Knowledge System

PAIRED includes an intelligent project knowledge system that learns from your development sessions and provides contextual recommendations.

### Quick Start
```bash
# Initialize knowledge system
paired knowledge init

# Learn from development session
paired knowledge learn --interactive

# Get project context and recommendations
paired knowledge context

# Search project knowledge
paired knowledge search "authentication"
```

### Key Features
- **🔍 Pattern Recognition** - Automatically detects code patterns and development approaches
- **📋 Decision Tracking** - Captures architectural and technical decisions with rationale
- **💡 Insight Generation** - Generates actionable insights from development activities
- **🔄 Cross-Session Learning** - Maintains knowledge across development sessions
- **📤 Export Capabilities** - Export knowledge in JSON or Markdown formats

### Documentation
- **[Quick Start Guide](docs/PROJECT_KNOWLEDGE_QUICKSTART.md)** - Get started in 5 minutes
- **[Complete Guide](docs/PROJECT_KNOWLEDGE_GUIDE.md)** - Comprehensive documentation with examples

## 📚 Complete Documentation

- **[Quick Start Guide](docs/QUICK_START.md)** - One-command activation
- **[Complete System Guide](docs/PAIRED_COMPLETE_SYSTEM_GUIDE.md)** - Comprehensive setup
- **[Essential Files Checklist](docs/ESSENTIAL_FILES_CHECKLIST.md)** - Required files
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Step-by-step setup

## 🎯 The Tiny Revolution

**"Why build massive infrastructure when a tiny bridge will do?"**

- **🐁 Intentionally Small** - Microscopic footprint, massive impact
- **🕰️ Quietly Effective** - Barely there, always helping
- **🎉 Joyfully Simple** - "Wheee!" - the delight of smooth workflows
- **🔗 Perfect Middleware** - Connects what you have, adds what you need
- **💫 Humble Confidence** - Small but mighty, like the best assistants

*From Internexio's "Between the Networks" philosophy comes PAIRED's mission: prove that the smallest bridges carry the most important traffic.*

## 🤝 Contributing

PAIRED is open source and we'd love your help making it better!

### 🚀 Jump In!

- **🐛 Found a bug?** [Open an issue](https://github.com/internexio/paired/issues) - we'll figure it out together
- **💡 Got an idea?** Share it in [Discussions](https://github.com/internexio/paired/discussions) - all ideas welcome!
- **📖 Improve docs** - Fix typos, add examples, make things clearer
- **🔧 Submit code** - Bug fixes, new features, whatever helps
- **🧪 Test stuff** - Try new features, break things, report what happens
- **🎨 Enhance agents** - Make the AI agents smarter and more useful

### 📋 How to Contribute

1. **Fork it** - Make your own copy to work on
2. **Test it** - Make sure you didn't break anything
3. **Document it** - Help others understand your changes
4. **Keep it simple** - One thing per pull request works best

### 🏗️ Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/paired.git
cd paired

# Install development dependencies
./install.sh

# Run tests
paired doctor --validate
```

### 📞 Get Help

- **💬 Discussions** - General questions and ideas
- **🐛 Issues** - Bug reports and feature requests
- **📧 Email** - Direct contact for sensitive topics

We're excited to see what you'll build with PAIRED! 🎉

---

**Ready to transform your development workflow? Follow the Quick Start guide above and meet your new AI development team!**

*For detailed setup instructions, troubleshooting, and advanced features, see the complete documentation linked above.*
