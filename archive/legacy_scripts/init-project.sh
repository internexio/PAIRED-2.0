#!/bin/bash
# Initialize PAIRED in current project with global/local architecture
# DUMMY-PROOF VERSION with automatic validation and repair

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ROOT="$(pwd)"
PAIRED_DIR="$PROJECT_ROOT/.paired"
GLOBAL_PAIRED="$HOME/.paired"
REGISTRY_FILE="$GLOBAL_PAIRED/registry/projects.json"

echo -e "${BLUE}🤝 Initializing PAIRED in $(basename "$PROJECT_ROOT")${NC}"
echo -e "${YELLOW}🚀 Architecture: Local Execution + Global Knowledge${NC}"
echo ""

# DUMMY-PROOF: Ensure PATH includes PAIRED executables
ensure_paired_path() {
    if [[ ":$PATH:" != *":$HOME/.paired/bin:"* ]]; then
        echo -e "${CYAN}🔧 Adding PAIRED executables to PATH...${NC}"
        export PATH="$HOME/.paired/bin:$PATH"
        
        # Add to shell profile for persistence
        local shell_profile="$HOME/.zshrc"
        if [ -f "$HOME/.bashrc" ]; then
            shell_profile="$HOME/.bashrc"
        fi
        
        if ! grep -q "/.paired/bin" "$shell_profile" 2>/dev/null; then
            echo "# PAIRED (Platform for AI-Enabled Remote Development) PATH" >> "$shell_profile"
            echo 'export PATH="$HOME/.paired/bin:$PATH"' >> "$shell_profile"
            echo -e "${GREEN}✅ Added PAIRED to PATH in $shell_profile${NC}"
        fi
    fi
}

# DUMMY-PROOF: Validate and repair global PAIRED installation
validate_global_paired() {
    echo -e "${CYAN}🔍 Validating global PAIRED installation...${NC}"
    
    # Check if global PAIRED directory exists
    if [ ! -d "$GLOBAL_PAIRED" ]; then
        echo -e "${RED}❌ Global PAIRED directory not found${NC}"
        echo -e "${YELLOW}💡 Run the main PAIRED installer first${NC}"
        exit 1
    fi
    
    # Check if executables exist and are executable
    local missing_executables=()
    for cmd in paired-status paired-global paired-init paired-sync; do
        if [ ! -x "$GLOBAL_PAIRED/bin/$cmd" ]; then
            missing_executables+=("$cmd")
        fi
    done
    
    # Auto-repair missing executables
    if [ ${#missing_executables[@]} -gt 0 ]; then
        echo -e "${YELLOW}🔧 Repairing missing PAIRED executables...${NC}"
        mkdir -p "$GLOBAL_PAIRED/bin"
        
        # Create missing executables
        for cmd in "${missing_executables[@]}"; do
            case $cmd in
                "paired-status")
                    cat > "$GLOBAL_PAIRED/bin/paired-status" << 'EOF'
#!/bin/bash
if [ -f ".pairedrules" ] || [ -d ".paired" ]; then
    exec "$HOME/.paired/scripts/global-status.sh" "$@"
else
    exec "$HOME/.paired/scripts/global-status.sh" "$@"
fi
EOF
                    ;;
                "paired-global")
                    cat > "$GLOBAL_PAIRED/bin/paired-global" << 'EOF'
#!/bin/bash
exec "$HOME/.paired/scripts/global-manager.sh" "$@"
EOF
                    ;;
                "paired-init")
                    cat > "$GLOBAL_PAIRED/bin/paired-init" << 'EOF'
#!/bin/bash
exec "$HOME/.paired/scripts/init-project.sh" "$@"
EOF
                    ;;
                "paired-sync")
                    cat > "$GLOBAL_PAIRED/bin/paired-sync" << 'EOF'
#!/bin/bash
exec "$HOME/.paired/scripts/knowledge-sync.sh" "$@"
EOF
                    ;;

            esac
            chmod +x "$GLOBAL_PAIRED/bin/$cmd"
            echo -e "${GREEN}✅ Created $cmd executable${NC}"
        done
    fi
    
    # Ensure registry directory exists
    mkdir -p "$(dirname "$REGISTRY_FILE")"
    if [ ! -f "$REGISTRY_FILE" ]; then
        echo '{}' > "$REGISTRY_FILE"
        echo -e "${GREEN}✅ Created project registry${NC}"
    fi
}

# Check if PAIRED is already initialized
if [ -f ".pairedrules" ] || [ -d ".paired" ]; then
    echo -e "${YELLOW}⚠️  PAIRED already initialized in this project${NC}"
    echo -e "${BLUE}📋 Use 'paired-status' to see current status${NC}"
    exit 0
fi

# DUMMY-PROOF: Run validation and setup
ensure_paired_path
validate_global_paired

# Create project .paired directory structure
echo -e "${BLUE}📁 Creating project structure...${NC}"
mkdir -p "$PAIRED_DIR"/{config,memory,scripts,docs,workflows,contexts,handoff,agents,shared}

# Copy templates from global directory
if [ -d "$GLOBAL_PAIRED/templates" ]; then
    echo -e "${BLUE}📋 Copying templates from global PAIRED...${NC}"
    cp -r "$GLOBAL_PAIRED/templates/"* "$PAIRED_DIR/" 2>/dev/null || true
fi

# Copy essential agent system files from global PAIRED source
echo -e "${BLUE}🤖 Setting up agent system...${NC}"
# Find the PAIRED source directory (could be in Scripts/wee or directly in wee)
GLOBAL_SRC=""
if [ -d "$(dirname "$GLOBAL_PAIRED")/Scripts/wee/src" ]; then
    GLOBAL_SRC="$(dirname "$GLOBAL_PAIRED")/Scripts/wee/src"
elif [ -d "$(dirname "$GLOBAL_PAIRED")/wee/src" ]; then
    GLOBAL_SRC="$(dirname "$GLOBAL_PAIRED")/wee/src"
fi
if [ -d "$GLOBAL_SRC" ]; then
    # Create agent config directory
    mkdir -p "$PAIRED_DIR/config/agents"
    
    # Copy actual agent configuration files that exist
    files_copied=0
    for agent_config in "$GLOBAL_SRC/config/agents/"*.yml; do
        if [ -f "$agent_config" ]; then
            cp "$agent_config" "$PAIRED_DIR/config/agents/" 2>/dev/null && files_copied=$((files_copied + 1))
        fi
    done
    
    if [ $files_copied -gt 0 ]; then
        echo -e "${GREEN}✅ Copied $files_copied agent config files${NC}"
    else
        echo -e "${YELLOW}⚠️  No agent config files found to copy${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Global PAIRED source not found at $GLOBAL_SRC${NC}"
    echo -e "${YELLOW}💡 Agent system will be set up during sync${NC}"
fi

# Create basic project files with enhanced content
echo -e "${BLUE}📝 Creating project files...${NC}"

# AI Memory with global sync integration
cat > "$PAIRED_DIR/memory/ai_memory.md" << 'EOF'
# Project AI Memory

## Project Overview
- **Name**: PROJECT_NAME
- **Initialized**: INIT_DATE
- **Global Sync**: Enabled

## Key Learnings
*This section will be populated as you work with PAIRED agents*

## Architectural Decisions
*Document important decisions here for global knowledge sharing*

## Patterns and Solutions
*Successful patterns will be shared with global knowledge base*

## Notes
- This memory syncs with global PAIRED knowledge base
- Use 'paired-sync' to manually sync knowledge
- Sensitive information stays local, patterns are shared globally
EOF

# Context Discovery
cat > "$PAIRED_DIR/contexts/context_discovery.md" << 'EOF'
# Project Context Discovery

## Current Focus
- **Phase**: Initial Setup
- **Priority**: PAIRED Integration

## Development Context
*Update this as your project evolves*

## Team Context
*Add team information and collaboration notes*

## Technical Context
*Document technical stack and architecture decisions*
EOF

# Project Configuration
cat > "$PAIRED_DIR/config/project_config.yml" << 'EOF'
# PAIRED Project Configuration
project:
  name: "PROJECT_NAME"
  type: "development"
  initialized: "INIT_DATE"
  paired_version: "2.0.0-alpha"

# Agent Configuration
agents:
  active:
    - pm_agent
    - qa_agent
    - dev_agent
  
# Knowledge Sync Configuration
knowledge_sync:
  enabled: true
  frequency: "daily"
  auto_contribute: true
  privacy_level: "anonymized"

# Global Integration
global_integration:
  registry_sync: true
  pattern_sharing: true
  learning_contribution: true
EOF

# Reasoning Log
cat > "$PAIRED_DIR/memory/reasoning_log.md" << 'EOF'
# Reasoning Log

## PAIRED Initialization Decision
- **Date**: INIT_DATE
- **Decision**: Initialize PAIRED with global/local architecture
- **Rationale**: Enable intelligent development workflow with knowledge sharing
- **Expected Benefits**: 
  - AI-assisted development
  - Cross-project learning
  - Automated quality assurance
  - Pattern recognition and reuse

*Continue documenting architectural decisions here*
EOF

# Last Session Handoff
cat > "$PAIRED_DIR/handoff/last_session.md" << 'EOF'
# Last Session Handoff

## Session: PAIRED Initialization
- **Date**: INIT_DATE
- **Action**: Project initialized with PAIRED
- **Status**: Ready for development

## Next Steps
1. Configure active agents based on project needs
2. Start using PAIRED commands for development workflow
3. Let PAIRED learn from your development patterns

*This file will be updated automatically as you work*
EOF

# Create project-specific .pairedrules file
echo -e "${BLUE}📝 Creating project configuration...${NC}"
cat > ".pairedrules" << 'EOF'
---
description: PAIRED Project Configuration
globs: **/*
alwaysApply: true
---

# Project-Specific PAIRED Configuration
# Inherits from global ~/.pairedrules with project-specific overrides

## Project Information
- **Name**: PROJECT_NAME
- **Type**: Development Project  
- **PAIRED Version**: 2.0.0-alpha
- **Initialized**: INIT_DATE
- **Architecture**: Local Execution + Global Knowledge

## Local Configuration
# Project-specific rules that override global defaults

## Active Agents
# All agents enabled for comprehensive software development support
active_agents:
  - pm_agent           # Project management and coordination (Alex)
  - qa_agent           # Quality assurance and testing (Sherlock)
  - dev_agent          # Development assistance and debugging (Edison)
  - architecture_agent # System architecture and design (Leonardo)
  - ux_expert_agent    # User experience and design (Maya)
  - analyst_agent      # Data analysis and insights (Marie)
  - scrum_master_agent # Agile process and team coordination (Vince)

## Knowledge Management
# How this project participates in global knowledge sharing
knowledge_sync:
  auto_sync: true                    # Automatically sync with global
  sync_frequency: "daily"            # How often to sync
  contribute_to_global: true         # Share learnings globally
  privacy_level: "anonymized"        # Level of data sharing

## Development Workflow
# Project-specific development preferences
workflow:
  auto_handoff: true                 # Automatic session handoffs
  quality_gates: true                # Enable quality checks
  pattern_detection: true            # Learn from code patterns
  
## Integration Points
# How this project integrates with global PAIRED
global_integration:
  registry_tracking: true            # Track in global registry
  pattern_sharing: true              # Share successful patterns
  cross_project_learning: true       # Learn from other projects
EOF

# Create .windsurfrules for Windsurf IDE integration
echo -e "${BLUE}🎯 Creating Windsurf IDE integration...${NC}"
if [ -f "$GLOBAL_PAIRED/templates/windsurfrules" ]; then
    cp "$GLOBAL_PAIRED/templates/windsurfrules" ".windsurfrules"
    echo -e "${GREEN}✅ Created .windsurfrules from template${NC}"
else
    echo -e "${YELLOW}⚠️  Template .windsurfrules not found, creating basic version...${NC}"
    cat > ".windsurfrules" << 'EOF'
# Windsurf Rules for PAIRED Integration
# This file configures Windsurf IDE to work with the PAIRED (Platform for AI-Enabled Remote Development)

# Include PAIRED configuration
include .paired/rules/*.md
include .paired/config/*.yml

# PAIRED Agent Integration
agent_config: .paired/config/agents/
memory_path: .paired/memory/
context_path: .paired/contexts/

# Official PAIRED Agent Names (use these ONLY):
# - 🕵️ Sherlock (QA) - Detective-like quality investigation
# - 👑 Alex/Alexander (PM) - Strategic project coordination  
# - 🏛️ Leonardo (Architecture) - Visionary system design
# - ⚡ Edison (Dev) - Persistent problem-solving implementation
# - 🎨 Maya (UX) - Empathetic human experience design
# - 🏈 Vince (Scrum Master) - Disciplined team coaching
# - 🔬 Marie (Analyst) - Scientific data analysis
EOF
    echo -e "${GREEN}✅ Created basic .windsurfrules${NC}"
fi

# Replace placeholders
PROJECT_NAME=$(basename "$PROJECT_ROOT")
INIT_DATE=$(date)

# Replace placeholders with OS-compatible sed syntax
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i "" "s/PROJECT_NAME/$PROJECT_NAME/g" ".pairedrules" ".windsurfrules" "$PAIRED_DIR/memory/ai_memory.md" "$PAIRED_DIR/config/project_config.yml" "$PAIRED_DIR/memory/reasoning_log.md" "$PAIRED_DIR/handoff/last_session.md"
    sed -i "" "s/INIT_DATE/$INIT_DATE/g" ".pairedrules" ".windsurfrules" "$PAIRED_DIR/memory/ai_memory.md" "$PAIRED_DIR/config/project_config.yml" "$PAIRED_DIR/memory/reasoning_log.md" "$PAIRED_DIR/handoff/last_session.md"
else
    sed -i "s/PROJECT_NAME/$PROJECT_NAME/g" ".pairedrules" ".windsurfrules" "$PAIRED_DIR/memory/ai_memory.md" "$PAIRED_DIR/config/project_config.yml" "$PAIRED_DIR/memory/reasoning_log.md" "$PAIRED_DIR/handoff/last_session.md"
    sed -i "s/INIT_DATE/$INIT_DATE/g" ".pairedrules" ".windsurfrules" "$PAIRED_DIR/memory/ai_memory.md" "$PAIRED_DIR/config/project_config.yml" "$PAIRED_DIR/memory/reasoning_log.md" "$PAIRED_DIR/handoff/last_session.md"
fi

# Copy essential project scripts to .paired/scripts/ (keep project root clean)
echo -e "${BLUE}📋 Installing essential project scripts...${NC}"
TEMPLATE_SCRIPTS="$GLOBAL_PAIRED/templates/project-scripts"
mkdir -p "$PAIRED_DIR/scripts"

if [ -d "$TEMPLATE_SCRIPTS" ]; then
    # Copy all essential scripts to .paired/scripts/ directory
    for script in "$TEMPLATE_SCRIPTS"/*; do
        if [ -f "$script" ]; then
            script_name=$(basename "$script")
            cp "$script" "$PAIRED_DIR/scripts/$script_name"
            chmod +x "$PAIRED_DIR/scripts/$script_name"
            echo -e "${GREEN}  ✅ Installed: .paired/scripts/$script_name${NC}"
        fi
    done
    echo -e "${GREEN}✅ Project scripts installed to .paired/scripts/${NC}"
else
    echo -e "${YELLOW}⚠️  Template scripts not found, creating basic handoff script...${NC}"
    # Create a basic handoff script if templates are missing
    cat > "$PAIRED_DIR/scripts/handoff.sh" << 'EOF'
#!/bin/bash
# Basic PAIRED Handoff Generator
echo "# PAIRED Project Handoff - $(date)" > CURRENT_SESSION_HANDOFF.md
echo "## Project Status" >> CURRENT_SESSION_HANDOFF.md
echo "- Project: $(basename $(pwd))" >> CURRENT_SESSION_HANDOFF.md
echo "- Last Updated: $(date)" >> CURRENT_SESSION_HANDOFF.md
echo "" >> CURRENT_SESSION_HANDOFF.md
echo "## Recent Changes" >> CURRENT_SESSION_HANDOFF.md
git log --oneline -5 2>/dev/null >> CURRENT_SESSION_HANDOFF.md || echo "No git history available" >> CURRENT_SESSION_HANDOFF.md
echo "" >> CURRENT_SESSION_HANDOFF.md
echo "## Next Steps" >> CURRENT_SESSION_HANDOFF.md
echo "- Continue development" >> CURRENT_SESSION_HANDOFF.md
echo "" >> CURRENT_SESSION_HANDOFF.md
echo "Handoff generated: CURRENT_SESSION_HANDOFF.md"
EOF
    chmod +x "$PAIRED_DIR/scripts/handoff.sh"
    echo -e "${GREEN}  ✅ Created basic .paired/scripts/handoff.sh${NC}"
fi

# Register project with global PAIRED
echo -e "${BLUE}📊 Registering with global PAIRED...${NC}"
if command -v paired-global >/dev/null 2>&1; then
    paired-global register "$PROJECT_ROOT" || echo -e "${YELLOW}⚠️  Could not auto-register project${NC}"
else
    echo -e "${YELLOW}⚠️  Global PAIRED commands not available, skipping auto-registration${NC}"
fi

# DUMMY-PROOF: Final validation to ensure everything works
echo -e "${CYAN}🔍 Running final validation...${NC}"
validation_passed=true

# Test that PAIRED executables are accessible
for cmd in paired-status paired-sync; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo -e "${RED}❌ Command '$cmd' not accessible${NC}"
        validation_passed=false
    fi
done

# Test that project structure is complete
for dir in config memory scripts docs workflows contexts handoff; do
    if [ ! -d "$PAIRED_DIR/$dir" ]; then
        echo -e "${RED}❌ Missing directory: .paired/$dir${NC}"
        validation_passed=false
    fi
done

# Test that key files exist
for file in ".pairedrules" ".windsurfrules" "$PAIRED_DIR/config/project_config.yml" "$PAIRED_DIR/memory/ai_memory.md"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Missing file: $file${NC}"
        validation_passed=false
    fi
done

if [ "$validation_passed" = true ]; then
    echo -e "${GREEN}✅ All validation checks passed!${NC}"
    
    # PAIRED initialization complete - no repair needed during init
    echo -e "${GREEN}✅ PAIRED initialization complete!${NC}"
else
    echo -e "${RED}❌ Validation failed! Some components are missing.${NC}"
    echo -e "${YELLOW}🔧 Please check your PAIRED installation and try again${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ PAIRED initialized successfully!${NC}"
echo -e "${GREEN}🎉 Welcome to the PAIRED ecosystem!${NC}"
echo "========================="
echo -e "${BLUE}📁 Project Structure:${NC}"
echo "   • .paired/              - Local PAIRED data and configuration"
echo "   • .paired/scripts/      - Project utility scripts"
echo "   • .pairedrules          - Project-specific PAIRED rules"
echo "   • .windsurfrules     - Windsurf IDE integration"
echo ""
echo -e "${BLUE}🤖 Available Agents:${NC}"
echo "   • PM Agent           - Project management and coordination"
echo "   • QA Agent           - Quality assurance and testing"
echo "   • Dev Agent          - Development assistance"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "   1. Run 'paired-status' to see project status"
echo "   2. Use 'paired-sync' to sync with global knowledge"
echo "   3. Start developing - PAIRED will learn from your patterns!"
echo ""
echo -e "${YELLOW}💡 Your project is now part of the global PAIRED ecosystem${NC}"
echo -e "${YELLOW}   Knowledge will be shared anonymously to help all projects${NC}"
echo ""
echo -e "${GREEN}🔧 Installation is DUMMY-PROOF and ready to use!${NC}"
