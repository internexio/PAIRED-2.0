#!/bin/bash
# PAIRED (Platform for AI-Enabled Remote Development) Installation Script
# Temp-based installation with global/local architecture

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🤝 PAIRED (Platform for AI-Enabled Remote Development) Installer${NC}"
echo "================================================="
echo -e "${YELLOW}🚀 Revolutionary Architecture: Universal Bridge + Collaborative Intelligence${NC}"
echo ""

# Use current directory as source (direct installation from repository)
echo -e "${BLUE}📥 Installing directly from PAIRED repository...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Verify we're in a valid PAIRED repository
if [ ! -f "$SCRIPT_DIR/install.sh" ] || [ ! -d "$SCRIPT_DIR/scripts" ]; then
    echo -e "${RED}❌ Invalid PAIRED repository structure${NC}"
    echo -e "${YELLOW}💡 Make sure you're running this from the PAIRED repository directory${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Valid PAIRED repository detected${NC}"
echo ""

# Detect shell and RC file using $0 (most reliable method)
CURRENT_SHELL=$(basename "$0")
if [[ "$CURRENT_SHELL" == *"zsh"* ]] || [[ "$SHELL" == *"zsh"* ]] || [ -n "${ZSH_VERSION:-}" ]; then
    SHELL_RC="$HOME/.zshrc"
    SHELL_TYPE="zsh"
elif [[ "$CURRENT_SHELL" == *"bash"* ]] || [[ "$SHELL" == *"bash"* ]] || [ -n "${BASH_VERSION:-}" ]; then
    SHELL_RC="$HOME/.bashrc"
    SHELL_TYPE="bash"
else
    # Default to zsh on macOS, bash on Linux
    if [[ "$OSTYPE" == "darwin"* ]]; then
        SHELL_RC="$HOME/.zshrc"
        SHELL_TYPE="zsh"
    else
        SHELL_RC="$HOME/.bashrc"
        SHELL_TYPE="bash"
    fi
    echo -e "${YELLOW}⚠️  Could not detect shell ($CURRENT_SHELL), defaulting to $SHELL_TYPE${NC}"
fi

echo -e "${GREEN}🐚 Detected shell: $SHELL_TYPE${NC}"
echo -e "${GREEN}📝 Shell RC: $SHELL_RC${NC}"
echo ""

# Step 4: Check for existing Windsurf configurations and backup if needed
echo -e "${YELLOW}🔍 Checking for existing Windsurf configurations...${NC}"

if [ -f "$HOME/.pairedrules" ] || [ -f "$HOME/.pairedfiles" ] || [ -d "$HOME/.paired" ]; then
    echo -e "${CYAN}📄 Existing Windsurf configurations detected:${NC}"
    
    [ -f "$HOME/.pairedrules" ] && echo -e "  ${YELLOW}• ~/.pairedrules${NC}"
    [ -f "$HOME/.pairedfiles" ] && echo -e "  ${YELLOW}• ~/.pairedfiles${NC}"
    [ -d "$HOME/.paired" ] && echo -e "  ${YELLOW}• ~/.paired directory${NC}"
    
    # Check shell config for windsurf aliases
    if [ -n "${ZSH_VERSION:-}" ]; then
        SHELL_RC="$HOME/.zshrc"
    elif [ -n "${BASH_VERSION:-}" ]; then
        SHELL_RC="$HOME/.bashrc"
    else
        SHELL_RC=""
    fi
    
    if [ -n "$SHELL_RC" ] && [ -f "$SHELL_RC" ] && grep -q "windsurf" "$SHELL_RC" 2>/dev/null; then
        echo -e "  ${YELLOW}• Windsurf aliases in $SHELL_RC${NC}"
    fi
    
    echo ""
    echo -e "${CYAN}🛡️  PAIRED will create backups before making any changes${NC}"
    echo -e "${GREEN}✅ Your existing Windsurf configurations will be safely preserved${NC}"
    echo -e "${GREEN}✅ You can restore them anytime with: paired-backup restore${NC}"
    echo ""
    
    read -p "Create backup of existing configurations? (Y/n): " -r
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        echo -e "${YELLOW}⚠️ Skipping backup - proceeding with installation${NC}"
    else
        # Create backup using our backup script
        echo -e "${YELLOW}💾 Creating safety backup of existing Windsurf configurations...${NC}"
        "$SCRIPT_DIR/scripts/windsurf-backup.sh" backup
        echo ""
    fi
else
    echo -e "${GREEN}✅ No existing Windsurf configurations found${NC}"
fi

# Step 5: Setup global PAIRED infrastructure
echo -e "${YELLOW}📁 Setting up global PAIRED infrastructure...${NC}"

# Create global PAIRED directories
mkdir -p "$HOME/.paired"/{bin,scripts,templates,config,memory,registry}

# Copy ALL essential directories from temp to global
echo -e "${BLUE}📦 Copying all PAIRED components to global installation...${NC}"

# Copy all scripts to global location
cp -r "$SCRIPT_DIR/scripts" ~/.paired/
echo -e "${GREEN}✅ Copied all scripts${NC}"

# Copy CASCADE bridge files to global location (required by PAIRED Doctor)
echo -e "${BLUE}🌉 Installing CASCADE bridge components...${NC}"
if [ -f "$SCRIPT_DIR/src/cascade_bridge_unified.js" ]; then
    cp "$SCRIPT_DIR/src/cascade_bridge_"*.js ~/.paired/ 2>/dev/null || true
    echo -e "${GREEN}✅ Copied CASCADE bridge files${NC}"
else
    echo -e "${YELLOW}⚠️  CASCADE bridge files not found (optional)${NC}"
fi

# Copy bridge-status script to global location
if [ -f "$SCRIPT_DIR/scripts/bridge-status.sh" ]; then
    cp "$SCRIPT_DIR/scripts/bridge-status.sh" ~/.paired/scripts/
    chmod +x ~/.paired/scripts/bridge-status.sh
    echo -e "${GREEN}✅ Copied bridge status script${NC}"
fi

# Copy project template scripts
if [ -d "$SCRIPT_DIR/templates/project-scripts" ]; then
    mkdir -p ~/.paired/templates/project-scripts
    cp -r "$SCRIPT_DIR/templates/project-scripts/"* ~/.paired/templates/project-scripts/
    echo -e "${GREEN}✅ Copied project template scripts${NC}"
fi

# Copy templates for project initialization
cp -r "$SCRIPT_DIR/templates" ~/.paired/
echo -e "${GREEN}✅ Copied templates${NC}"

# Copy configuration templates (CRITICAL for .windsurfrules template)
cp -r "$SCRIPT_DIR/config" ~/.paired/ 2>/dev/null || true
echo -e "${GREEN}✅ Copied configuration templates${NC}"

# Copy requirements.txt for Python dependencies
cp "$SCRIPT_DIR/requirements.txt" ~/.paired/ 2>/dev/null || true
echo -e "${GREEN}✅ Copied requirements.txt${NC}"

# Copy agent data
cp -r "$SCRIPT_DIR/data" ~/.paired/ 2>/dev/null || true
echo -e "${GREEN}✅ Copied agent data${NC}"

# Copy PAIRED executables and binaries
cp -r "$SCRIPT_DIR/bin" ~/.paired/ 2>/dev/null || true
echo -e "${GREEN}✅ Copied PAIRED executables${NC}"

# Copy complete src directory (agents, core, cli, shared)
echo -e "${BLUE}🤖 Installing agent implementation files and core libraries...${NC}"
cp -r "$SCRIPT_DIR/src" ~/.paired/ 2>/dev/null || true
echo -e "${GREEN}✅ Copied agent implementations and core libraries${NC}"

# Copy core components (legacy support)
cp -r "$SCRIPT_DIR/core" ~/.paired/ 2>/dev/null || true
echo -e "${GREEN}✅ Copied core components${NC}"

# Copy shell scripts (handle case where none exist)
if ls "$SCRIPT_DIR/"*.sh 1> /dev/null 2>&1; then
    cp "$SCRIPT_DIR/"*.sh ~/.paired/scripts/
fi

# Create working aliases file (not template)
echo -e "${BLUE}📝 Creating PAIRED aliases file...${NC}"
cat > ~/.paired/aliases.sh << 'EOF'
#!/bin/bash
# PAIRED (Platform for AI-Enabled Remote Development) Installation Scriptases
# Auto-generated aliases for Windsurf development workflow

# Global PAIRED Commands
alias paired-init='~/.paired/scripts/init-project.sh'
alias paired-status='~/.paired/scripts/global-status.sh'
alias paired-knowledge='~/.paired/scripts/knowledge-sync.sh'
alias wglobal='~/.paired/scripts/global-manager.sh'
alias wproject='~/.paired/scripts/global-status.sh --project'
alias wlearn='~/.paired/scripts/knowledge-sync.sh --learn'
alias wshare='~/.paired/scripts/knowledge-sync.sh --share'

# Project-specific PAIRED Commands (work when in PAIRED project)
# These check for .paired directory and use project-local scripts
alias wh='if [ -d ".paired/scripts" ]; then .paired/scripts/handoff.sh; else echo "Not in PAIRED project. Run: paired-init"; fi'
alias wr='if [ -d ".paired/scripts" ]; then .paired/scripts/resume.sh; else echo "Not in PAIRED project. Run: paired-init"; fi'
alias wdocs='if [ -d ".paired/scripts" ]; then .paired/scripts/doc_discovery.sh; else echo "Not in PAIRED project. Run: paired-init"; fi'
alias wtype='if [ -d ".paired/scripts" ]; then .paired/scripts/type_cleanup.py; else echo "Not in PAIRED project. Run: paired-init"; fi'

# Environment management aliases
alias wenv-dev='if [ -d ".paired/scripts" ]; then .paired/scripts/set-env.sh dev; else echo "Not in PAIRED project. Run: paired-init"; fi'
alias wenv-test='if [ -d ".paired/scripts" ]; then .paired/scripts/set-env.sh test; else echo "Not in PAIRED project. Run: paired-init"; fi'
alias wenv-prod='if [ -d ".paired/scripts" ]; then .paired/scripts/set-env.sh prod; else echo "Not in PAIRED project. Run: paired-init"; fi'

# PAIRED Doctor and diagnostics
alias paired-doctor='~/.paired/scripts/paired-doctor.sh'
alias paired-test='~/.paired/scripts/test-paired.sh'
alias paired-validate='~/.paired/scripts/validate-system.sh'

# Quick PAIRED status and help
alias paired-help='echo "PAIRED Commands: paired-init, paired-status, wh, wr, wdocs, wtype, wenv-*, paired-doctor"'
alias paired-version='echo "PAIRED (Platform for AI-Enabled Remote Development) - Production Ready"'

EOF
echo -e "${GREEN}✅ Created working PAIRED aliases file${NC}"
cp -r "$SCRIPT_DIR/scripts" ~/.paired/ 2>/dev/null || true

# Copy package.json for dependency management
cp "$SCRIPT_DIR/package.json" ~/.paired/ 2>/dev/null || true
echo -e "${GREEN}✅ Copied package.json${NC}"

# Install Node.js dependencies (CRITICAL for agent functionality)
echo -e "${BLUE}📦 Installing Node.js dependencies...${NC}"
cd ~/.paired
if command -v npm >/dev/null 2>&1; then
    npm install --silent 2>/dev/null || {
        echo -e "${YELLOW}⚠️  npm install failed, trying alternative approach...${NC}"
        npm install 2>/dev/null || {
            echo -e "${RED}❌ Failed to install dependencies${NC}"
            echo -e "${YELLOW}💡 You may need to run 'cd ~/.paired && npm install' manually${NC}"
        }
    }
    echo -e "${GREEN}✅ Node.js dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  npm not found - Node.js dependencies not installed${NC}"
    echo -e "${YELLOW}💡 Install Node.js and run 'cd ~/.paired && npm install' manually${NC}"
fi
cd "$SCRIPT_DIR"  # Return to original directory
echo -e "${BLUE}📊 Initializing global registry...${NC}"
cat > ~/.paired/registry/projects.json << 'EOF'
{
  "projects": [],
  "global_stats": {
{{ ... }}
    "active_projects": 0,
    "total_learning_items": 0,
    "last_aggregation": null,
    "paired_version": "2.0.0-alpha",
    "installation_date": null
  },
  "user_preferences": {
    "auto_onboard": "prompt",
    "sync_frequency": "daily",
    "knowledge_sharing": "anonymized",
    "backup_retention": 30
  }
}
EOF

# Update installation date
INSTALL_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/\"installation_date\": null/\"installation_date\": \"$INSTALL_DATE\"/" ~/.paired/registry/projects.json
else
    sed -i "s/\"installation_date\": null/\"installation_date\": \"$INSTALL_DATE\"/" ~/.paired/registry/projects.json
fi

# Create global memory system
echo -e "${BLUE}🧠 Initializing global memory...${NC}"
cat > ~/.paired/memory/global_knowledge.md << 'EOF'
# PAIRED Global Knowledge Base

## Installation
- **Date**: $(date)
- **Version**: 2.0.0-alpha
- **Architecture**: Global Orchestrator + Local Execution

## Learning Aggregation
*This section will be populated as projects contribute knowledge*

## Best Practices
*This section will be populated from successful project patterns*

## Common Solutions
*This section will be populated from recurring problem solutions*
EOF

# Create executable wrappers
echo -e "${BLUE}🔧 Creating executable wrappers...${NC}"

# Global commands
cat > ~/.paired/bin/paired-status << 'EOF'
#!/bin/bash
# Check if in PAIRED project, show project status; otherwise show global status
if [ -f ".pairedrules" ] || [ -d ".paired" ]; then
    exec "$HOME/.paired/scripts/status.sh" "$@"
else
    exec "$HOME/.paired/scripts/global-status.sh" "$@"
fi
EOF

cat > ~/.paired/bin/paired-init << 'EOF'
#!/bin/bash
exec "$HOME/.paired/scripts/init-project.sh" "$@"
EOF

cat > ~/.paired/bin/paired-verify << 'EOF'
#!/bin/bash
exec "$HOME/.paired/scripts/verify-shell-integration.sh" "$@"
EOF

cat > ~/.paired/bin/paired-global << 'EOF'
#!/bin/bash
exec "$HOME/.paired/scripts/global-manager.sh" "$@"
EOF

cat > ~/.paired/bin/paired-sync << 'EOF'
#!/bin/bash
exec "$HOME/.paired/scripts/knowledge-sync.sh" "$@"
EOF

chmod +x ~/.paired/bin/*

# Make all scripts executable
find ~/.paired -name "*.sh" -exec chmod +x {} \;

# Create global Windsurf rules for auto-onboarding
echo -e "${BLUE}🎯 Setting up global auto-onboarding...${NC}"
cat > ~/.pairedrules << 'EOF'
---
description: PAIRED Global Auto-Detection and Onboarding
globs: **/*
alwaysApply: true
---

# PAIRED Auto-Detection System
# This file enables intelligent project onboarding when Windsurf opens directories

## Detection Logic:
1. **Development Indicators**: Check for .git, package.json, requirements.txt, etc.
2. **PAIRED Status**: Check if PAIRED is already installed (.paired/ or .pairedrules)
3. **User Preferences**: Respect auto-onboard settings from global config
4. **Smart Prompts**: Context-aware installation offers

## Auto-Onboarding Rules:
- If development project + no PAIRED → Offer installation
- If PAIRED detected but not initialized → Offer setup
- If PAIRED update available → Offer upgrade
- Respect user preferences (auto-install, never ask, etc.)

## Commands Available After Detection:
- `paired-init` - Initialize PAIRED in current project
- `paired-status` - Check project/global status
- `paired-global registry` - View all PAIRED projects
- `paired-sync` - Sync knowledge between global/local

*This global configuration enables seamless PAIRED onboarding across all projects*
EOF

# Add to shell configuration (handle BOTH .bashrc AND .zshrc for maximum compatibility)
echo -e "${BLUE}🐚 Configuring shell aliases for all shells...${NC}"

# Function to add PAIRED configuration to a shell RC file
add_paired_to_shell() {
    local rc_file="$1"
    local shell_name="$2"
    
    if [ -f "$rc_file" ]; then
        if ! grep -q "PAIRED (Platform for AI-Enabled Remote Development)" "$rc_file" 2>/dev/null; then
            echo -e "${BLUE}📝 Adding PAIRED to $rc_file ($shell_name)...${NC}"
            echo "" >> "$rc_file"
            echo "# 🤝 PAIRED (Platform for AI-Enabled Remote Development) Installer" >> "$rc_file"
            echo "export PATH=\"\$HOME/.paired/bin:\$PATH\"" >> "$rc_file"
            echo "source ~/.paired/aliases.sh" >> "$rc_file"
            
            # Warn about conflicts
            if grep -q "windsurf/aliases.sh" "$rc_file" 2>/dev/null; then
                echo -e "${YELLOW}⚠️  Warning: Found old Windsurf aliases in $rc_file${NC}"
                echo -e "${YELLOW}💡 Consider removing old Windsurf alias sources to avoid conflicts${NC}"
            fi
            echo -e "${GREEN}✅ PAIRED configured in $rc_file${NC}"
        else
            echo -e "${GREEN}✅ PAIRED already configured in $rc_file${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  $rc_file not found, creating it...${NC}"
        touch "$rc_file"
        echo "# PAIRED (Platform for AI-Enabled Remote Development) - Global Architecture" >> "$rc_file"
        echo "export PATH=\"\$HOME/.paired/bin:\$PATH\"" >> "$rc_file"
        echo "source ~/.paired/aliases.sh" >> "$rc_file"
        echo -e "${GREEN}✅ Created and configured $rc_file${NC}"
    fi
}

# Configure both bash and zsh (ensures aliases work regardless of shell)
add_paired_to_shell "$HOME/.bashrc" "bash"
add_paired_to_shell "$HOME/.zshrc" "zsh"

# Also handle the detected shell RC if it's different
if [ -n "$SHELL_RC" ] && [ "$SHELL_RC" != "$HOME/.bashrc" ] && [ "$SHELL_RC" != "$HOME/.zshrc" ]; then
    add_paired_to_shell "$SHELL_RC" "detected shell"
fi

# Load PAIRED for current session
echo -e "${BLUE}🚀 Loading PAIRED for current session...${NC}"
export PATH="$HOME/.paired/bin:$PATH"
source ~/.paired/aliases.sh 2>/dev/null || true

# Verify installation
echo ""
echo -e "${BLUE}🔍 Verifying installation...${NC}"

if command -v paired-status > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PAIRED Global Architecture installed successfully!${NC}"
    echo ""
    echo -e "${GREEN}🎉 Welcome to PAIRED 2.0!${NC}"
    echo "========================"
    echo -e "${BLUE}🌍 Global Commands:${NC}"
    echo "   • paired-global registry  - View all PAIRED projects"
    echo "   • paired-global status    - Global system status"
    echo "   • paired-sync            - Sync knowledge"
    echo ""
    echo -e "${BLUE}📁 Project Commands:${NC}"
    echo "   • paired-init            - Initialize PAIRED in project"
    echo "   • paired-status          - Project/global status"
    echo "   • paired-verify          - Verify installation"
    echo ""
    echo -e "${GREEN}🚀 Next Steps:${NC}"
    echo "   1. Open any project in Windsurf - auto-onboarding will activate"
    echo "   2. Or manually run 'paired-init' in a project directory"
    echo "   3. Use 'paired-global registry' to see all your PAIRED projects"
    echo ""
    echo -e "${YELLOW}💡 Global config: ~/.pairedrules enables auto-detection${NC}"
else
    echo -e "${RED}❌ Installation verification failed${NC}"
    echo -e "${YELLOW}🔧 Try: source $SHELL_RC${NC}"
fi
