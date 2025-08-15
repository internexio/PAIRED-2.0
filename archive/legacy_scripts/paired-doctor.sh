#!/bin/bash
# PAIRED Doctor - Unified Diagnostic and Troubleshooting Script
# Comprehensive health check, validation, and auto-repair for PAIRED installations

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Global variables
TOTAL_CHECKS=0
PASSED_CHECKS=0
WARNINGS=0
ERRORS=0
AUTO_REPAIR=${1:-false}

echo -e "${BLUE}🩺 PAIRED Doctor - System Health Check${NC}"
echo "=================================="
echo -e "${CYAN}Comprehensive diagnostic and troubleshooting for PAIRED${NC}"
echo ""

# Utility functions
run_check() {
    local check_name="$1"
    local check_function="$2"
    local auto_repair_function="${3:-}"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -e "${BLUE}🔍 Checking: $check_name${NC}"
    
    if $check_function; then
        echo -e "${GREEN}✅ $check_name: PASSED${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}❌ $check_name: FAILED${NC}"
        ERRORS=$((ERRORS + 1))
        
        if [ -n "$auto_repair_function" ] && [ "$AUTO_REPAIR" = "true" ]; then
            echo -e "${YELLOW}🔧 Attempting auto-repair...${NC}"
            if $auto_repair_function; then
                echo -e "${GREEN}✅ Auto-repair successful${NC}"
                PASSED_CHECKS=$((PASSED_CHECKS + 1))
                ERRORS=$((ERRORS - 1))
                return 0
            else
                echo -e "${RED}❌ Auto-repair failed${NC}"
            fi
        fi
        return 1
    fi
}

run_warning() {
    local warning_name="$1"
    local warning_function="$2"
    
    echo -e "${YELLOW}⚠️  Checking: $warning_name${NC}"
    
    if $warning_function; then
        echo -e "${GREEN}✅ $warning_name: OK${NC}"
    else
        echo -e "${YELLOW}⚠️  $warning_name: WARNING${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
}

run_info() {
    local info_name="$1"
    local info_function="$2"
    
    echo -e "${CYAN}ℹ️  Checking: $info_name${NC}"
    
    if $info_function; then
        echo -e "${GREEN}✅ $info_name: OK${NC}"
    else
        # Just show the info, don't count as warning
        echo -e "${CYAN}ℹ️  $info_name: INFO${NC}"
    fi
}

# Core system checks
check_global_paired_installation() {
    [ -d "$HOME/.paired" ] && \
    [ -f "$HOME/.paired/registry/projects.json" ] && \
    [ -f "$HOME/.paired/memory/global_knowledge.md" ] && \
    [ -d "$HOME/.paired/bin" ]
}

repair_global_paired_installation() {
    echo "Creating missing global PAIRED directories..."
    mkdir -p "$HOME/.paired"/{bin,scripts,templates,config,memory,registry}
    
    # Create minimal registry if missing
    if [ ! -f "$HOME/.paired/registry/projects.json" ]; then
        cat > "$HOME/.paired/registry/projects.json" << 'EOF'
{
  "projects": [],
  "global_stats": {
    "total_projects": 0,
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
    fi
    
    # Create minimal global knowledge if missing
    if [ ! -f "$HOME/.paired/memory/global_knowledge.md" ]; then
        cat > "$HOME/.paired/memory/global_knowledge.md" << 'EOF'
# PAIRED Global Knowledge Base

## Installation
- **Date**: $(date)
- **Version**: 2.0.0-alpha
- **Architecture**: Global Orchestrator + Local Execution

## Learning Aggregation
*This section will be populated as projects contribute knowledge*
EOF
    fi
    
    return 0
}

check_global_windsurfrules() {
    [ -f "$HOME/.pairedrules" ]
}

repair_global_windsurfrules() {
    cat > "$HOME/.pairedrules" << 'EOF'
---
description: PAIRED Global Auto-Detection and Onboarding
globs: **/*
alwaysApply: true
---

# PAIRED Auto-Detection System
# This file enables intelligent project onboarding when Windsurf opens directories

## Auto-Onboarding Rules:
- If development project + no PAIRED → Offer installation
- If PAIRED detected but not initialized → Offer setup
- If PAIRED update available → Offer upgrade
- Respect user preferences (auto-install, never ask, etc.)

*This global configuration enables seamless PAIRED onboarding across all projects*
EOF
    return 0
}

check_paired_executables() {
    command -v paired-status >/dev/null 2>&1 && \
    command -v paired-global >/dev/null 2>&1 && \
    command -v paired-init >/dev/null 2>&1 && \
    command -v paired-sync >/dev/null 2>&1
}

repair_paired_executables() {
    # Ensure PATH includes PAIRED bin directory
    if [[ ":$PATH:" != *":$HOME/.paired/bin:"* ]]; then
        export PATH="$HOME/.paired/bin:$PATH"
    fi
    
    # Recreate executable wrappers if missing
    mkdir -p "$HOME/.paired/bin"
    
    cat > "$HOME/.paired/bin/paired-status" << 'EOF'
#!/bin/bash
if [ -f ".pairedrules" ] || [ -d ".paired" ]; then
    exec "$HOME/.paired/scripts/status.sh" "$@"
else
    exec "$HOME/.paired/scripts/global-status.sh" "$@"
fi
EOF
    
    cat > "$HOME/.paired/bin/paired-global" << 'EOF'
#!/bin/bash
exec "$HOME/.paired/scripts/global-manager.sh" "$@"
EOF
    
    cat > "$HOME/.paired/bin/paired-init" << 'EOF'
#!/bin/bash
exec "$HOME/.paired/scripts/init-project.sh" "$@"
EOF
    
    cat > "$HOME/.paired/bin/paired-sync" << 'EOF'
#!/bin/bash
exec "$HOME/.paired/scripts/knowledge-sync.sh" "$@"
EOF
    
    chmod +x "$HOME/.paired/bin"/*
    return 0
}

check_shell_integration() {
    if [ -n "${ZSH_VERSION:-}" ]; then
        SHELL_RC="$HOME/.zshrc"
    elif [ -n "${BASH_VERSION:-}" ]; then
        SHELL_RC="$HOME/.bashrc"
    else
        return 1
    fi
    
    [ -f "$SHELL_RC" ] && grep -q "PAIRED (Platform for AI-Enabled Remote Development)" "$SHELL_RC"
}

repair_shell_integration() {
    if [ -n "${ZSH_VERSION:-}" ]; then
        SHELL_RC="$HOME/.zshrc"
    elif [ -n "${BASH_VERSION:-}" ]; then
        SHELL_RC="$HOME/.bashrc"
    else
        return 1
    fi
    
    if [ -f "$SHELL_RC" ] && ! grep -q "PAIRED (Platform for AI-Enabled Remote Development)" "$SHELL_RC"; then
        echo "" >> "$SHELL_RC"
        echo "# PAIRED (Platform for AI-Enabled Remote Development) - Global Architecture" >> "$SHELL_RC"
        echo "export PATH=\"\$HOME/.paired/bin:\$PATH\"" >> "$SHELL_RC"
        echo "source ~/.paired/aliases.sh" >> "$SHELL_RC"
    fi
    return 0
}

check_project_paired_structure() {
    if [ -f ".pairedrules" ] || [ -d ".paired" ]; then
        [ -d ".paired/memory" ] && \
        [ -d ".paired/config" ] && \
        [ -d ".paired/contexts" ] && \
        [ -f ".pairedrules" ]
    else
        return 0  # Not in a PAIRED project, so this check passes
    fi
}

check_project_windsurf_config() {
    if [ -f ".pairedrules" ] || [ -d ".paired" ]; then
        local has_windsurfrules=false
        local has_windsurffile=false
        local config_valid=true
        
        # Check for .windsurfrules
        if [ -f ".windsurfrules" ]; then
            has_windsurfrules=true
            # Validate it points to .paired directory
            if ! grep -q "\.paired" ".windsurfrules" 2>/dev/null; then
                echo -e "${YELLOW}⚠️  .windsurfrules exists but may not reference .paired directory${NC}"
                config_valid=false
            fi
        fi
        
        # Check for .windsurffile
        if [ -f ".windsurffile" ]; then
            has_windsurffile=true
            # Validate it points to .paired directory
            if ! grep -q "\.paired" ".windsurffile" 2>/dev/null; then
                echo -e "${YELLOW}⚠️  .windsurffile exists but may not reference .paired directory${NC}"
                config_valid=false
            fi
        fi
        
        if [ "$has_windsurfrules" = true ] || [ "$has_windsurffile" = true ]; then
            return 0  # At least one config file exists
        else
            echo -e "${YELLOW}⚠️  No .windsurfrules or .windsurffile found in project root${NC}"
            return 1
        fi
    else
        return 0  # Not in a PAIRED project, so this check passes
    fi
}

repair_project_windsurf_config() {
    if [ -f ".pairedrules" ] || [ -d ".paired" ]; then
        echo -e "${CYAN}🔧 Creating Windsurf configuration files...${NC}"
        
        # Create .windsurfrules if it doesn't exist
        if [ ! -f ".windsurfrules" ]; then
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
EOF
            echo -e "${GREEN}✅ Created .windsurfrules${NC}"
        fi
        
        # Create .windsurffile if it doesn't exist
        if [ ! -f ".windsurffile" ]; then
            cat > ".windsurffile" << 'EOF'
# Windsurf Project Configuration
# PAIRED (Platform for AI-Enabled Remote Development) Integration

project_type: paired_enabled
paired_directory: .paired
agent_system: enabled

# Include PAIRED-specific configurations
include:
  - .paired/config/project_config.yml
  - .paired/rules/ai_interaction_rules.md

# Agent activation thresholds
agent_activation:
  auto_detect: true
  threshold_file: .paired/config/adaptive_thresholds.yml
EOF
            echo -e "${GREEN}✅ Created .windsurffile${NC}"
        fi
        
        return 0
    else
        echo -e "${YELLOW}⚠️  Not in a PAIRED project - skipping Windsurf config creation${NC}"
        return 1
    fi
}

check_registry_integrity() {
    if [ -f "$HOME/.paired/registry/projects.json" ]; then
        # Basic JSON validation
        python3 -m json.tool "$HOME/.paired/registry/projects.json" >/dev/null 2>&1
    else
        return 1
    fi
}

check_agent_functionality() {
    # Check if agent system is properly configured
    # Look for actual agent config files that exist in the system
    local agent_configs_found=0
    
    # Check for individual agent config files
    [ -f ".paired/config/agents/pm_agent_config.yml" ] && agent_configs_found=$((agent_configs_found + 1))
    [ -f ".paired/config/agents/qa_agent_config.yml" ] && agent_configs_found=$((agent_configs_found + 1))
    [ -f ".paired/config/agents/architecture_agent_config.yml" ] && agent_configs_found=$((agent_configs_found + 1))
    [ -f ".paired/config/agents/dev_agent_config.yml" ] && agent_configs_found=$((agent_configs_found + 1))
    
    # Check for core PAIRED structure files
    local core_files_found=0
    [ -f ".pairedrules" ] && core_files_found=$((core_files_found + 1))
    [ -d ".paired/config" ] && core_files_found=$((core_files_found + 1))
    [ -d ".paired/memory" ] && core_files_found=$((core_files_found + 1))
    
    # Agent functionality is considered working if we have:
    # - At least 2 agent config files
    # - Core PAIRED structure (3 items: .pairedrules, .paired/config, .paired/memory)
    if [ $agent_configs_found -ge 2 ] && [ $core_files_found -ge 3 ]; then
        return 0
    else
        echo -e "${YELLOW}⚠️  Found $agent_configs_found agent configs and $core_files_found core files${NC}"
        return 1
    fi
}

check_agent_activation_system() {
    # Test if agent system can be loaded and basic functionality works
    if command -v node >/dev/null 2>&1; then
        # Check if we have agent config files and can access the source
        local agent_configs_found=0
        [ -f ".paired/config/agents/pm_agent_config.yml" ] && agent_configs_found=$((agent_configs_found + 1))
        [ -f ".paired/config/agents/qa_agent_config.yml" ] && agent_configs_found=$((agent_configs_found + 1))
        
        if [ $agent_configs_found -ge 1 ]; then
            # Find global PAIRED source directory for testing
            local GLOBAL_SRC=""
            if [ -d "$(dirname "$HOME/.paired")/Scripts/wee/src" ]; then
                GLOBAL_SRC="$(dirname "$HOME/.paired")/Scripts/wee/src"
            elif [ -d "$(dirname "$HOME/.paired")/wee/src" ]; then
                GLOBAL_SRC="$(dirname "$HOME/.paired")/wee/src"
            fi
            
            if [ -d "$GLOBAL_SRC" ] && [ -f "$GLOBAL_SRC/core/base_agent.js" ]; then
                # Test basic agent system loading
                node -e "
                    try {
                        const BaseAgent = require('$GLOBAL_SRC/core/base_agent.js');
                        // Basic test - can we load the base agent class?
                        if (typeof BaseAgent === 'function') {
                            process.exit(0);
                        } else {
                            process.exit(1);
                        }
                    } catch (e) {
                        process.exit(1);
                    }
                " 2>/dev/null
            else
                echo -e "${YELLOW}⚠️  Agent source files not found for testing${NC}"
                return 1
            fi
        else
            echo -e "${YELLOW}⚠️  No agent config files found${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  Node.js not available for agent testing${NC}"
        return 1
    fi
}

check_adaptive_threshold_system() {
    # Check if adaptive threshold system exists and is functional
    # Look for actual adaptive threshold files that exist in the system
    local threshold_system_found=false
    
    # Find global PAIRED source directory
    local GLOBAL_SRC=""
    if [ -d "$(dirname "$HOME/.paired")/Scripts/wee/src" ]; then
        GLOBAL_SRC="$(dirname "$HOME/.paired")/Scripts/wee/src"
    elif [ -d "$(dirname "$HOME/.paired")/wee/src" ]; then
        GLOBAL_SRC="$(dirname "$HOME/.paired")/wee/src"
    fi
    
    # Check for adaptive threshold CLI tool
    if [ -f "$(dirname "$GLOBAL_SRC")/adaptive-threshold-cli.js" ]; then
        threshold_system_found=true
    fi
    
    # Check for agent config files that would support adaptive thresholds
    local agent_configs_found=0
    [ -f ".paired/config/agents/pm_agent_config.yml" ] && agent_configs_found=$((agent_configs_found + 1))
    [ -f ".paired/config/agents/qa_agent_config.yml" ] && agent_configs_found=$((agent_configs_found + 1))
    
    # Adaptive threshold system is considered functional if:
    # - We have the adaptive threshold CLI tool
    # - We have at least 1 agent config file
    if [ "$threshold_system_found" = true ] && [ $agent_configs_found -ge 1 ]; then
        return 0
    else
        echo -e "${YELLOW}⚠️  Adaptive threshold CLI found: $threshold_system_found, Agent configs: $agent_configs_found${NC}"
        return 1
    fi
}

check_windsurf_ide_integration() {
    # Check if .windsurffile exists and uses .paired/ paths (not .windsurf/)
    if [ -f ".windsurffile" ]; then
        ! grep -q "\.windsurf/" ".windsurffile" 2>/dev/null
    else
        # No .windsurffile is OK for some projects
        return 0
    fi
}

check_js_yaml_dependency() {
    # Check if js-yaml is available (critical for agent activation)
    if command -v node >/dev/null 2>&1; then
        node -e "require('js-yaml')" 2>/dev/null
    else
        return 1
    fi
}

check_knowledge_sync_capability() {
    [ -f "$HOME/.paired/scripts/knowledge-sync.sh" ] && \
    [ -x "$HOME/.paired/scripts/knowledge-sync.sh" ]
}

check_dependencies() {
    command -v node >/dev/null 2>&1 && \
    command -v python3 >/dev/null 2>&1 && \
    command -v git >/dev/null 2>&1
}

check_disk_space() {
    # Check if we have at least 100MB free space
    local available_space
    if command -v df >/dev/null 2>&1; then
        available_space=$(df "$HOME" | awk 'NR==2 {print $4}')
        [ "$available_space" -gt 102400 ]  # 100MB in KB
    else
        return 0  # Can't check, assume OK
    fi
}

# Warning checks (non-critical)
check_old_windsurf_aliases() {
    # Detect shell using $0 (most reliable method)
    CURRENT_SHELL=$(basename "$0")
    if [[ "$CURRENT_SHELL" == *"zsh"* ]] || [[ "$SHELL" == *"zsh"* ]] || [ -n "${ZSH_VERSION:-}" ]; then
        SHELL_RC="$HOME/.zshrc"
    elif [[ "$CURRENT_SHELL" == *"bash"* ]] || [[ "$SHELL" == *"bash"* ]] || [ -n "${BASH_VERSION:-}" ]; then
        SHELL_RC="$HOME/.bashrc"
    else
        # Default based on OS
        if [[ "$OSTYPE" == "darwin"* ]]; then
            SHELL_RC="$HOME/.zshrc"  # macOS default
        else
            SHELL_RC="$HOME/.bashrc"  # Linux default
        fi
    fi
    
    # Check for legacy Windsurf configurations (informational only)
    local has_legacy=false
    local legacy_items=()
    
    if [ -f "$SHELL_RC" ]; then
        # Check for old windsurf aliases
        if grep -q "windsurf/aliases.sh" "$SHELL_RC" 2>/dev/null; then
            legacy_items+=("Windsurf aliases in $SHELL_RC")
            has_legacy=true
        fi
        
        # Check for other windsurf references that aren't PAIRED
        if grep -q "windsurf" "$SHELL_RC" 2>/dev/null && ! grep -q "PAIRED (Platform for AI-Enabled Remote Development)" "$SHELL_RC" 2>/dev/null; then
            legacy_items+=("Non-PAIRED Windsurf config in $SHELL_RC")
            has_legacy=true
        fi
    fi
    
    # Check for legacy Windsurf files
    if [ -f "$HOME/.pairedrules" ] && ! grep -q "PAIRED Global Auto-Detection" "$HOME/.pairedrules" 2>/dev/null; then
        legacy_items+=("Legacy ~/.pairedrules")
        has_legacy=true
    fi
    
    if [ -f "$HOME/.pairedfiles" ]; then
        legacy_items+=("Legacy ~/.pairedfiles")
        has_legacy=true
    fi
    
    # Only show info if legacy items are found
    if [ "$has_legacy" = true ]; then
        echo -e "${CYAN}ℹ️  Found: ${legacy_items[*]}${NC}"
        echo -e "${CYAN}💡 These coexist safely with PAIRED (no action needed)${NC}"
        return 0  # Return success - this is just informational
    fi
    
    # No legacy items found - this is also success
    return 0
}

check_node_version() {
    if command -v node >/dev/null 2>&1; then
        local node_version
        node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        [ "$node_version" -ge 16 ]
    else
        return 0  # Node not required for basic PAIRED functionality
    fi
}

check_project_scripts() {
    # Only check if we're in a PAIRED project
    if [ ! -f ".pairedrules" ] && [ ! -d ".paired" ]; then
        return 0  # Not in a PAIRED project, skip this check
    fi
    
    # Check for essential project scripts in .paired/scripts/ (clean architecture)
    [ -f ".paired/scripts/handoff.sh" ] && \
    [ -f ".paired/scripts/resume.sh" ] && \
    [ -f ".paired/scripts/doc_discovery.sh" ] && \
    [ -f ".paired/scripts/type_cleanup.py" ] && \
    [ -f ".paired/scripts/set-env.sh" ]
}

repair_project_scripts() {
    # Only repair if we're in a PAIRED project
    if [ ! -f ".pairedrules" ] && [ ! -d ".paired" ]; then
        return 0  # Not in a PAIRED project, skip this repair
    fi
    
    echo "🔧 Installing missing project scripts..."
    
    # Ensure .paired/scripts directory exists (clean architecture)
    mkdir -p ".paired/scripts"
    
    # Check if global templates exist
    local template_dir="$HOME/.paired/templates/project-scripts"
    if [ -d "$template_dir" ]; then
        # Create symlinks to templates inside .paired/scripts/ (clean architecture)
        for script in "$template_dir"/*; do
            if [ -f "$script" ]; then
                local script_name=$(basename "$script")
                local target_path=".paired/scripts/$script_name"
                if [ ! -f "$target_path" ] && [ ! -L "$target_path" ]; then
                    ln -sf "$script" "$target_path"
                    echo "  ✅ Linked: $script_name -> .paired/scripts/ (clean architecture)"
                fi
            fi
        done
    else
        # Create basic scripts inside .paired/scripts/ if templates don't exist
        if [ ! -f ".paired/scripts/handoff.sh" ]; then
            cat > ".paired/scripts/handoff.sh" << 'EOF'
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
            chmod +x ".paired/scripts/handoff.sh"
            echo "  ✅ Created basic handoff.sh"
        fi
        
        if [ ! -f ".paired/scripts/resume.sh" ]; then
            cat > ".paired/scripts/resume.sh" << 'EOF'
#!/bin/bash
# Basic PAIRED Resume Script
echo "📋 Resuming work on $(basename $(pwd))..."
if [ -f "CURRENT_SESSION_HANDOFF.md" ]; then
    echo "📖 Last session handoff:"
    cat CURRENT_SESSION_HANDOFF.md
else
    echo "ℹ️  No previous session handoff found"
fi
EOF
            chmod +x ".paired/scripts/resume.sh"
            echo "  ✅ Created basic resume.sh"
        fi
        
        if [ ! -f ".paired/scripts/doc_discovery.sh" ]; then
            cat > ".paired/scripts/doc_discovery.sh" << 'EOF'
#!/bin/bash
# Basic PAIRED Documentation Discovery
echo "📚 Discovering documentation..."
find . -type f -name "*.md" -o -name "*.txt" | xargs -I {} echo "  ✅ Found: {}"
EOF
            chmod +x ".paired/scripts/doc_discovery.sh"
            echo "  ✅ Created basic doc_discovery.sh"
        fi
        
        if [ ! -f ".paired/scripts/type_cleanup.py" ]; then
            cat > ".paired/scripts/type_cleanup.py" << 'EOF'
#!/usr/bin/env python3
# Basic PAIRED Type Cleanup
import os
import re

print("🧹 Cleaning up type annotations...")
for root, dirs, files in os.walk("."):
    for file in files:
        if file.endswith(".py"):
            file_path = os.path.join(root, file)
            with open(file_path, "r") as f:
                content = f.read()
            # Remove type annotations
            content = re.sub(r"# type: .*", "", content)
            with open(file_path, "w") as f:
                f.write(content)
            print("  ✅ Cleaned: {}".format(file_path))
EOF
            chmod +x ".paired/scripts/type_cleanup.py"
            echo "  ✅ Created basic type_cleanup.py"
        fi
        
        if [ ! -f ".paired/scripts/set-env.sh" ]; then
            cat > ".paired/scripts/set-env.sh" << 'EOF'
#!/bin/bash
# Basic PAIRED Environment Setup
echo "🌐 Setting up environment..."
export PAIRED_PROJECT=$(basename $(pwd))
export PAIRED_SESSION=$(date +%Y-%m-%d-%H-%M-%S)
echo "  ✅ Set PAIRED_PROJECT: $PAIRED_PROJECT"
echo "  ✅ Set PAIRED_SESSION: $PAIRED_SESSION"
EOF
            chmod +x ".paired/scripts/set-env.sh"
            echo "  ✅ Created basic set-env.sh"
        fi
    fi
    
    return 0
}

# Main diagnostic routine
main() {
    echo -e "${BLUE}🔍 Running comprehensive PAIRED health check...${NC}"
    echo ""
    
    # Core system checks
    echo -e "${CYAN}=== CORE SYSTEM CHECKS ===${NC}"
    run_check "Global PAIRED Installation" check_global_paired_installation repair_global_paired_installation
    run_check "Global Windsurf Rules" check_global_windsurfrules repair_global_windsurfrules
    run_check "PAIRED Executables" check_paired_executables repair_paired_executables
    run_check "Shell Integration" check_shell_integration repair_shell_integration
    run_check "Registry Integrity" check_registry_integrity
    echo ""
    
    # Project-specific checks (if in a PAIRED project)
    if [ -f ".pairedrules" ] || [ -d ".paired" ]; then
        echo -e "${CYAN}=== PROJECT-SPECIFIC CHECKS ===${NC}"
        run_check "Project PAIRED Structure" check_project_paired_structure
        run_check "Project Windsurf Configuration" check_project_windsurf_config repair_project_windsurf_config
        run_check "Project Scripts" check_project_scripts repair_project_scripts
        echo ""
    fi
    
    # Functionality checks
    echo -e "${CYAN}=== FUNCTIONALITY CHECKS ===${NC}"
    run_check "Agent Functionality" check_agent_functionality
    run_check "Agent Activation System" check_agent_activation_system
    run_check "Adaptive Threshold System" check_adaptive_threshold_system
    run_check "JS-YAML Dependency" check_js_yaml_dependency
    run_check "Knowledge Sync Capability" check_knowledge_sync_capability
    echo ""
    
    # System requirements
    echo -e "${CYAN}=== SYSTEM REQUIREMENTS ===${NC}"
    run_check "Dependencies Available" check_dependencies
    run_check "Sufficient Disk Space" check_disk_space
    run_check "Node.js Version" check_node_version
    echo ""
    
    # Integration checks
    echo -e "${CYAN}=== INTEGRATION CHECKS ===${NC}"
    run_check "Windsurf IDE Integration" check_windsurf_ide_integration
    echo ""
    
    # Compatibility info checks
    echo -e "${CYAN}=== COMPATIBILITY INFO ===${NC}"
    run_info "Legacy Windsurf Aliases" check_old_windsurf_aliases
    echo ""
    
    # Summary
    echo -e "${BLUE}=== DIAGNOSTIC SUMMARY ===${NC}"
    echo -e "${GREEN}✅ Passed: $PASSED_CHECKS/$TOTAL_CHECKS${NC}"
    
    if [ $ERRORS -gt 0 ]; then
        echo -e "${RED}❌ Errors: $ERRORS${NC}"
    fi
    
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
    fi
    
    echo ""
    
    # Recommendations
    if [ $ERRORS -gt 0 ]; then
        echo -e "${RED}🚨 CRITICAL ISSUES DETECTED${NC}"
        echo -e "${YELLOW}💡 Run with auto-repair: paired-doctor --repair${NC}"
        echo -e "${YELLOW}💡 Or manually address the failed checks above${NC}"
        exit 1
    elif [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  MINOR ISSUES DETECTED${NC}"
        echo -e "${YELLOW}💡 Consider addressing the warnings above${NC}"
        exit 0
    else
        echo -e "${GREEN}🎉 PAIRED SYSTEM HEALTHY${NC}"
        echo -e "${GREEN}All checks passed! Your PAIRED installation is working properly.${NC}"
        exit 0
    fi
}

# Handle command line arguments
case "${1:-}" in
    "--repair"|"-r")
        AUTO_REPAIR=true
        echo -e "${YELLOW}🔧 Auto-repair mode enabled${NC}"
        echo ""
        ;;
    "--help"|"-h")
        echo "PAIRED Doctor - Diagnostic and Troubleshooting Tool"
        echo ""
        echo "Usage:"
        echo "  paired-doctor           Run diagnostic checks"
        echo "  paired-doctor --repair  Run with auto-repair enabled"
        echo "  paired-doctor --help    Show this help"
        echo ""
        exit 0
        ;;
esac

# Run main diagnostic
main
