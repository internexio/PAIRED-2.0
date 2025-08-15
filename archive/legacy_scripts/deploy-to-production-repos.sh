#!/bin/bash
# PAIRED Release Packaging Script
# Packages minimal, production-ready PAIRED for internexio/wee repository

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🤝 PAIRED Release Packaging Script${NC}"
echo "================================================="
echo -e "${YELLOW}📦 Preparing minimal production release for internexio/wee${NC}"
echo ""

# Configuration - CHANGE THIS TO TARGET DIFFERENT REPO
TARGET_REPO_URL="https://github.com/internexio/paired.git"
AUTO_DEPLOY=true  # Set to false to only create package without pushing

# Internal configuration
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMP_DIR="/tmp/paired-release-$(date +%s)"
VERSION=$(date +"%Y.%m.%d")

echo -e "${CYAN}📂 Source Directory: $SOURCE_DIR${NC}"
echo -e "${CYAN}🎯 Target Repository: $TARGET_REPO_URL${NC}"
echo -e "${CYAN}📅 Release Version: $VERSION${NC}"
echo ""

# Create temporary directory
echo -e "${BLUE}🔧 Creating temporary packaging directory...${NC}"
mkdir -p "$TEMP_DIR"
cd "$TEMP_DIR"

# Initialize new git repo
echo -e "${BLUE}🔧 Initializing clean git repository...${NC}"
git init
git remote add origin "$TARGET_REPO_URL"

# Define essential files and directories for production release
echo -e "${BLUE}📋 Defining essential files for production release...${NC}"

# COMPREHENSIVE ALLOW LIST - Include ALL code, scripts, and logic
# Only filter out development-specific documentation

# Root files
ROOT_ALLOW_LIST=(
    "README.md"
    "LICENSE" 
    "install.sh"
    "package.json"
    "QUICK_REFERENCE.md"
    ".gitignore"
)

# ESSENTIAL PAIRED COMPONENTS ONLY - No throwaway scripts or project-specific code

# Core PAIRED system (complete)
CORE_PAIRED_DIRS=(
    "src/core"
    "src/config"
    "config"                                # CRITICAL: Contains project-template.windsurfrules
    "src/index.js"
    "src/cascade_bridge_api.js"
    "src/cascade_bridge_unified.js"
    "src/agent_launcher.js"
    "src/windsurf_bridge_integration.js"
    
    # NEW: CASCADE Integration System (2025-08-13)
    "src/cascade"
    
    # NEW: Enhanced Cross-Agent Collaboration (2025-08-13)
    "src/collaboration"
    
    # NEW: Agent Security & Authenticity (2025-08-13)
    "src/security"
)

# Agent components (essential user-facing only - NO development planning tools)
AGENT_COMPONENTS=(
    # Main agent files
    "src/agents/*_agent.js"
    
    # Essential CLI tools (exclude planning tools)
    "src/agents/*/cli/quick_audit.js"
    "src/agents/*/cli/audit.js"
    "src/agents/*/cli/diagnostic_audit.js"
    "src/agents/*/cli/safe_audit.js"
    "src/agents/*/cli/debug.js"
    "src/agents/*/cli/quality.js"
    "src/agents/*/cli/story.js"
    "src/agents/*/cli/accessibility_audit.js"
    "src/agents/*/cli/design_system_audit.js"
    "src/agents/*/cli/competitive_analysis_cli.js"
    "src/agents/*/cli/market_research_cli.js"
    "src/agents/*/cli/sprint_health_monitor.js"
    "src/agents/*/cli/story_creation_cli.js"
    "src/agents/*/cli/adr.js"
    "src/agents/*/cli/debt.js"
    "src/agents/*/cli/patterns.js"
    
    # Essential modules (exclude planning/development modules)
    "src/agents/*/modules/code_reviewer.js"
    "src/agents/*/modules/quality_auditor.js"
    "src/agents/*/modules/test_manager.js"
    "src/agents/*/modules/debugging_assistant.js"
    "src/agents/*/modules/code_quality_manager.js"
    "src/agents/*/modules/story_tracker.js"
    "src/agents/*/modules/accessibility.js"
    "src/agents/*/modules/design_system.js"
    "src/agents/*/modules/user_research.js"
    "src/agents/*/modules/competitive_intelligence.js"
    "src/agents/*/modules/data_analysis.js"
    "src/agents/*/modules/market_research.js"
    "src/agents/*/modules/requirements_gathering.js"
    "src/agents/*/modules/ceremony_facilitation.js"
    "src/agents/*/modules/impediment_tracking.js"
    "src/agents/*/modules/sprint_management.js"
    "src/agents/*/modules/story_creation.js"
    "src/agents/*/modules/adr_manager.js"
    "src/agents/*/modules/pattern_catalog.js"
    "src/agents/*/modules/tech_debt_tracker.js"
    
    # Agent configuration and tracking
    "src/agents/*/philosophy_reminder.md"
    "src/agents/*/tracking/*.md"
    "src/agents/*/tracking/*.json"
    "src/agents/*/scripts/*.sh"
)

# Essential scripts only (no throwaway/development scripts)
ESSENTIAL_SCRIPTS=(
    "scripts/init-project.sh"
    "scripts/global-status.sh"
    "scripts/global-manager.sh"
    "scripts/install-dependencies.sh"
    "scripts/paired-doctor.sh"
    "scripts/activate_cascade_complete.sh"
    "scripts/aliases.sh"                    # CRITICAL: Shell integration and project aliases
    "scripts/windsurf-backup.sh"           # CRITICAL: Required by install.sh
    "scripts/knowledge-sync.sh"            # CRITICAL: Referenced in aliases
    "scripts/share-knowledge.sh"           # CRITICAL: Referenced in aliases
)

# Essential bin tools
ESSENTIAL_BIN=(
    "bin/paired-doctor"
)

# Essential templates
ESSENTIAL_TEMPLATES=(
    "templates/windsurf_agent_types.yml"
    "templates/project-windsurfrules-enhanced.md"
    "templates/windsurfrules"                      # Base template
    "templates/agent_definitions.md"               # Agent definitions
    
    # ALL project scripts (required for paired-init workflow)
    "templates/project-scripts/handoff.sh"         # wh command
    "templates/project-scripts/resume.sh"          # wr command
    "templates/project-scripts/doc_discovery.sh"   # wdocs command
    "templates/project-scripts/type_cleanup.py"    # wtype command
    "templates/project-scripts/set-env.sh"         # wenv-* commands
    "templates/project-scripts/bridge-status.sh"   # Bridge monitoring
    "templates/project-scripts/start-agents.sh"    # Agent startup
)

# Directories to completely exclude (archived/legacy content)
EXCLUDE_DIRS=(
    "archive"
    "Old-Files-Delete-After-Cascade-Resolution"
)

# Essential user-facing documentation (minimal set)
ESSENTIAL_DOCS=(
    "docs/QUICK_START.md"
    "docs/PHILOSOPHY.md"
    "docs/TROUBLESHOOTING.md"
    "docs/COMMANDS.md"
)

# Documentation to EXCLUDE (development-specific)
EXCLUDE_DOCS=(
    "docs/archive/"
    "docs/MASSIVE_CLEANUP_SUMMARY.md"
    "docs/TEST_COVERAGE_IMPROVEMENT_REPORT.md"
    "docs/VECTORSEM_TESTING_STRATEGY_REPORT.md"
    "docs/PAIRED_COMMERCIALIZATION_STRATEGY.md"
    "docs/cleanup_summary.md"
    "docs/setup_workflow.md"
    "docs/current/INTEGRATION_PLAN.md"
    "docs/current/KNOWLEDGEFORGE_IMPLEMENTATION.md"
    "docs/current/TESTING_FRAMEWORK.md"
    "docs/reference/NOTIFICATION_SYSTEM_UPDATE.md"
)

# ESSENTIAL PAIRED ONLY - Clean, focused release without throwaway scripts
echo -e "${BLUE}📁 Copying essential PAIRED components only...${NC}"

# Function to copy file with directory creation
copy_allowed_file() {
    local file_path="$1"
    local source_file="$SOURCE_DIR/$file_path"
    
    if [ -f "$source_file" ]; then
        # Create directory if needed
        local dir_path=$(dirname "$file_path")
        if [ "$dir_path" != "." ]; then
            mkdir -p "$dir_path"
        fi
        
        echo -e "${GREEN}✅ $file_path${NC}"
        cp "$source_file" "$file_path"
    else
        echo -e "${YELLOW}⚠️  MISSING: $file_path${NC}"
        return 1
    fi
}

# Copy root files
echo -e "${BLUE}📄 Root files...${NC}"
for file in "${ROOT_ALLOW_LIST[@]}"; do
    copy_allowed_file "$file"
done

# Copy core PAIRED system components
echo -e "${BLUE}🔧 Core PAIRED system...${NC}"
for component in "${CORE_PAIRED_DIRS[@]}"; do
    if [[ "$component" == *.js ]]; then
        # Single file
        copy_allowed_file "$component"
    else
        # Directory
        if [ -d "$SOURCE_DIR/$component" ]; then
            echo -e "${GREEN}✅ Copying $component/ (complete)${NC}"
            mkdir -p "$(dirname "$component")"
            cp -r "$SOURCE_DIR/$component" "$component"
            
            # Clean out any VectorSEM/project-specific content and backup files
            find "$component" -name "*vectorsem*" -type f -delete 2>/dev/null || true
            find "$component" -name "*archive*" -type d -exec rm -rf {} + 2>/dev/null || true
            find "$component" -name "*.bak" -type f -delete 2>/dev/null || true
        else
            echo -e "${YELLOW}⚠️  Warning: $component not found${NC}"
        fi
    fi
done

# Copy agent components (exclude development planning tools)
echo -e "${BLUE}🤖 Agent components (user-facing only, NO development planning)...${NC}"
for component in "${AGENT_COMPONENTS[@]}"; do
    # Use find to handle glob patterns and exclude planning tools
    if [[ "$component" == *"*"* ]]; then
        # Handle glob patterns
        find "$SOURCE_DIR" -path "$SOURCE_DIR/$component" -type f 2>/dev/null | while read -r file; do
            if [ -f "$file" ]; then
                # Exclude development planning tools
                if [[ "$file" == *"planning"* ]] || [[ "$file" == *"project_planning"* ]] || [[ "$file" == *"milestone_tracking"* ]]; then
                    echo -e "${YELLOW}⚠️  EXCLUDED (dev planning): ${file#$SOURCE_DIR/}${NC}"
                    continue
                fi
                
                rel_path="${file#$SOURCE_DIR/}"
                copy_allowed_file "$rel_path"
            fi
        done
    else
        # Direct file copy
        if [[ "$component" != *"planning"* ]] && [[ "$component" != *"project_planning"* ]] && [[ "$component" != *"milestone_tracking"* ]]; then
            copy_allowed_file "$component"
        else
            echo -e "${YELLOW}⚠️  EXCLUDED (dev planning): $component${NC}"
        fi
    fi
done

# Copy essential scripts only
echo -e "${BLUE}📜 Essential scripts (no throwaway scripts)...${NC}"
for script in "${ESSENTIAL_SCRIPTS[@]}"; do
    copy_allowed_file "$script"
done

# Copy essential bin tools
echo -e "${BLUE}🛠️  Essential bin tools...${NC}"
for tool in "${ESSENTIAL_BIN[@]}"; do
    copy_allowed_file "$tool"
done

# Copy essential templates
echo -e "${BLUE}📋 Essential templates...${NC}"
for template in "${ESSENTIAL_TEMPLATES[@]}"; do
    copy_allowed_file "$template"
done

# Copy essential documentation only
echo -e "${BLUE}📚 Essential documentation...${NC}"
mkdir -p docs
for doc in "${ESSENTIAL_DOCS[@]}"; do
    copy_allowed_file "$doc"
done

# Create production-ready package.json if needed
echo -e "${BLUE}📦 Updating package.json for production...${NC}"
if [ -f "package.json" ]; then
    # Update version and remove dev dependencies
    node -e "
        const pkg = JSON.parse(require('fs').readFileSync('package.json', 'utf8'));
        pkg.version = '$VERSION';
        pkg.description = 'PAIRED (Platform for AI-Enabled Remote Development) - Tiny middleware for AI-powered development';
        pkg.repository = {
            type: 'git',
            url: 'https://github.com/internexio/wee.git'
        };
        pkg.homepage = 'https://github.com/internexio/wee';
        pkg.bugs = {
            url: 'https://github.com/internexio/wee/issues'
        };
        // Keep only production dependencies
        if (pkg.devDependencies) {
            delete pkg.devDependencies;
        }
        require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));
        console.log('✅ Updated package.json for production');
    " 2>/dev/null || echo -e "${YELLOW}⚠️  Could not update package.json (Node.js required)${NC}"
fi

# Create production README if needed
echo -e "${BLUE}📖 Creating production README...${NC}"
cat > README.md << 'EOF'
# 🤝 PAIRED - Platform for AI-Enabled Remote Development

**Tiny middleware for AI-powered development**

PAIRED is a minimalist, joyful middleware that quietly enables powerful AI agent collaboration within Windsurf IDE. Small by design, mighty by nature.

## ✨ What is PAIRED?

PAIRED transforms your Windsurf IDE into an AI-powered development environment with 7 specialized agents:

- 🕵️ **Sherlock (QA)** - Quality investigation and testing
- 👑 **Alex (PM)** - Project management and coordination  
- 🏛️ **Leonardo (Architecture)** - System design and patterns
- ⚡ **Edison (Dev)** - Development and implementation
- 🎨 **Maya (UX)** - User experience and design
- 🏈 **Vince (Scrum Master)** - Team coordination and process
- 🔬 **Marie (Analyst)** - Data analysis and insights

## 🚀 Quick Start

```bash
# Install PAIRED
git clone git@github.com:internexio/wee.git ~/paired-temp
cd ~/paired-temp
./install.sh

# Activate in any project
cd your-project
paired-init

# Start collaborating with AI agents
./scripts/activate_cascade_complete.sh

# Try these friendly prompts to meet your team:
# "Hi Alex" or "Hey PM" - Meet your Project Manager
# "Hey Sherlock" or "QA, audit my code" - Quality review
# "Leonardo, what's the architecture?" or "Architect, help" - System design
# "Edison, debug this" or "Dev, fix this bug" - Development assistance
# "Maya, how's the UX?" or "UX, review this design" - User experience
# "Vince, sprint status?" or "Scrum, what's our velocity?" - Coordination
# "Marie, analyze this" or "Analyst, research this topic" - Insights
```

## 🎯 Philosophy

PAIRED embodies the "tiny middleware" philosophy:
- **Minimal footprint** - Only essential components
- **Maximum impact** - Powerful AI collaboration
- **Joyful experience** - Seamless collaboration, not complexity
- **Quiet operation** - Works behind the scenes

## 📚 Documentation

- [Quick Start](docs/QUICK_START.md) - Getting started guide
- [Philosophy](docs/PHILOSOPHY.md) - PAIRED principles and positioning
- [Commands](docs/COMMANDS.md) - Complete command reference
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions

## 🤝 Contributing

PAIRED is an open source project - contributions welcome!

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

**Small by design, mighty by nature.** 🐁✨
EOF

# Create release notes
echo -e "${BLUE}📝 Creating release notes...${NC}"
cat > RELEASE_NOTES.md << EOF
# PAIRED Release $VERSION

**Workflow Evolution Engine - Production Release**

## 🎯 What's New

This release represents the complete transformation of PAIRED into a truly "tiny middleware" system:

### ✨ Features
- 7 specialized AI agents for development workflow
- Manual activation system (\`activate_cascade_complete.sh\`)
- Unified CASCADE bridge for multi-instance support
- Complete Windsurf IDE integration
- Production-ready middleware architecture

### 🧹 Cleanup & Organization
- Reduced from 110+ files to 53 core files (52% reduction)
- Clean root directory with only essential files
- Comprehensive documentation package
- Professional brand identity throughout

### 🔧 Installation
- One-command installation via \`install.sh\`
- Zero-manual-step project onboarding
- Self-healing health check system
- Cross-platform compatibility

## 📦 What's Included

- **Core System**: Agent framework, bridge, orchestration
- **Installation**: Automated setup and configuration
- **Documentation**: Complete guides and references

EOF

# Add and commit all files
echo -e "${BLUE}📝 Committing production release...${NC}"
git add .
git commit -m "PAIRED Production Release $VERSION

- Complete tiny middleware system
- 7 specialized AI agents
- Manual activation system
- Windsurf IDE integration
- Production-ready architecture

Generated from internexio/wee"

# Final cleanup: Remove any .bak files from entire deployment
echo -e "${BLUE}🧹 Final cleanup: Removing .bak files...${NC}"
find . -name "*.bak" -type f -delete 2>/dev/null || true
BAK_COUNT=$(find . -name "*.bak" -type f 2>/dev/null | wc -l)
if [ "$BAK_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ No .bak files found - deployment is clean${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: $BAK_COUNT .bak files still present${NC}"
fi

# Deploy to target repository if AUTO_DEPLOY is enabled
if [ "$AUTO_DEPLOY" = true ]; then
    echo ""
    echo -e "${BLUE}🚀 Deploying to target repository...${NC}"
    echo "================================================="
    
    # Set up remote origin
    echo -e "${YELLOW}🔗 Setting up remote origin: $TARGET_REPO_URL${NC}"
    git remote remove origin 2>/dev/null || true
    git remote add origin "$TARGET_REPO_URL"
    
    # Switch to main branch if we're on master (git init creates master by default)
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" = "master" ]; then
        echo -e "${YELLOW}🔄 Switching from master to main branch...${NC}"
        git checkout -b main
    fi
    
    # Push to main branch
    echo -e "${YELLOW}📤 Pushing to main branch...${NC}"
    if git push origin main --force; then
        echo ""
        echo -e "${GREEN}✅ Successfully deployed to $TARGET_REPO_URL${NC}"
        echo -e "${GREEN}🎉 PAIRED Production Release $VERSION is now live!${NC}"
    else
        echo ""
        echo -e "${RED}❌ Failed to push to repository${NC}"
        echo -e "${YELLOW}💡 You can manually push with:${NC}"
        echo "   cd $TEMP_DIR"
        echo "   git push origin main --force"
        exit 1
    fi
else
    # Show manual deployment instructions
    echo ""
    echo -e "${GREEN}🎉 PAIRED Release Package Complete!${NC}"
    echo "================================================="
    echo -e "${CYAN}📦 Package Location: $TEMP_DIR${NC}"
    echo -e "${CYAN}📊 Release Version: $VERSION${NC}"
    echo -e "${CYAN}📁 Files Included:${NC}"
    find . -type f | grep -v '.git' | sort
    echo ""
    echo -e "${YELLOW}🚀 Manual Deployment Steps:${NC}"
    echo "1. Review the packaged files in: $TEMP_DIR"
    echo "2. Push to target repository:"
    echo "   cd $TEMP_DIR"
    echo "   git remote add origin $TARGET_REPO_URL"
    echo "   git push origin main --force"
fi

echo ""
echo -e "${BLUE}💡 Tip: This script can be run anytime to create a fresh production release!${NC}"
