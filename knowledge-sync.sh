#!/bin/bash
# PAIRED Knowledge Sync Script
# Bidirectional sync between global and local knowledge

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REGISTRY_FILE="$HOME/.paired/registry/projects.json"
GLOBAL_MEMORY="$HOME/.paired/memory/global_knowledge.md"
CURRENT_DIR=$(pwd)

# Help function
show_help() {
    echo -e "${BLUE}🔄 PAIRED Knowledge Sync${NC}"
    echo "===================="
    echo ""
    echo "Usage: paired-sync <command> [options]"
    echo ""
    echo "Commands:"
    echo "  up                   - Send local knowledge to global"
    echo "  down                 - Pull global knowledge to local"
    echo "  both                 - Bidirectional sync (default)"
    echo "  status               - Show sync status"
    echo "  backup               - Create knowledge backup"
    echo ""
    echo "Options:"
    echo "  --force              - Force sync without prompts"
    echo "  --dry-run            - Show what would be synced"
    echo ""
    echo "Examples:"
    echo "  paired-sync             # Bidirectional sync"
    echo "  paired-sync up          # Send local to global"
    echo "  paired-sync down        # Pull global to local"
    echo "  paired-sync --dry-run   # Preview changes"
}

# Check if in PAIRED project
check_paired_project() {
    if [ ! -f ".pairedrules" ] && [ ! -d ".paired" ]; then
        echo -e "${RED}❌ Not in a PAIRED project${NC}"
        echo -e "${YELLOW}💡 Run 'paired-init' to initialize PAIRED in this project${NC}"
        exit 1
    fi
}

# Create backup
create_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_dir="$HOME/.paired/memory/backups"
    mkdir -p "$backup_dir"
    
    # Backup global knowledge
    if [ -f "$GLOBAL_MEMORY" ]; then
        cp "$GLOBAL_MEMORY" "$backup_dir/global_knowledge_$timestamp.md"
        echo -e "${GREEN}📋 Global knowledge backed up${NC}"
    fi
    
    # Backup local knowledge if in project
    if [ -f ".paired/memory/ai_memory.md" ]; then
        cp ".paired/memory/ai_memory.md" "$backup_dir/local_$(basename "$CURRENT_DIR")_$timestamp.md"
        echo -e "${GREEN}📋 Local knowledge backed up${NC}"
    fi
}

# Sync up (local → global)
sync_up() {
    local dry_run=${1:-false}
    
    check_paired_project
    
    echo -e "${BLUE}📤 Syncing local knowledge to global...${NC}"
    
    # Check for local knowledge with better detection
    if [ ! -f ".paired/memory/ai_memory.md" ]; then
        echo -e "${YELLOW}⚠️  No local knowledge found${NC}"
        # Debug: Show what files exist in memory directory
        if [ -d ".paired/memory" ]; then
            echo -e "${BLUE}📁 Files in .paired/memory/:${NC}"
            ls -la .paired/memory/ | head -5
        else
            echo -e "${RED}❌ .paired/memory directory not found${NC}"
        fi
        return 0
    fi
    
    # Verify file has content
    if [ ! -s ".paired/memory/ai_memory.md" ]; then
        echo -e "${YELLOW}⚠️  Local knowledge file is empty${NC}"
        return 0
    fi
    
    # Extract key insights from local memory
    local project_name=$(basename "$CURRENT_DIR")
    local temp_file=$(mktemp)
    
    echo "## Knowledge from $project_name" > "$temp_file"
    echo "**Source**: $CURRENT_DIR" >> "$temp_file"
    echo "**Sync Date**: $(date)" >> "$temp_file"
    echo "" >> "$temp_file"
    
    # Extract patterns, solutions, and key insights
    echo "### Key Insights" >> "$temp_file"
    grep -E "^(#|##|\*\*|Key|Important|Solution|Pattern|Learning)" ".paired/memory/ai_memory.md" 2>/dev/null | head -20 >> "$temp_file" || true
    echo "" >> "$temp_file"
    
    # Extract architectural decisions
    if [ -f ".paired/memory/reasoning_log.md" ]; then
        echo "### Architectural Decisions" >> "$temp_file"
        grep -A 3 -E "^(#|##|\*\*Decision|\*\*Solution)" ".paired/memory/reasoning_log.md" 2>/dev/null | head -10 >> "$temp_file" || true
        echo "" >> "$temp_file"
    fi
    
    if [ "$dry_run" = true ]; then
        echo -e "${YELLOW}🔍 Dry run - would add to global knowledge:${NC}"
        cat "$temp_file"
        rm "$temp_file"
        return 0
    fi
    
    # Append to global knowledge
    cat "$temp_file" >> "$GLOBAL_MEMORY"
    rm "$temp_file"
    
    # Update project sync status
    local temp_registry=$(mktemp)
    jq --arg path "$CURRENT_DIR" \
       --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
       '(.projects[] | select(.path == $path) | .last_sync) = $timestamp | 
        (.projects[] | select(.path == $path) | .learning_contributions) += 1' \
       "$REGISTRY_FILE" > "$temp_registry" && mv "$temp_registry" "$REGISTRY_FILE"
    
    echo -e "${GREEN}✅ Local knowledge synced to global${NC}"
}

# Sync down (global → local)
sync_down() {
    local dry_run=${1:-false}
    
    check_paired_project
    
    echo -e "${BLUE}📥 Syncing global knowledge to local...${NC}"
    
    if [ ! -f "$GLOBAL_MEMORY" ]; then
        echo -e "${YELLOW}⚠️  No global knowledge found${NC}"
        return 0
    fi
    
    # Create local memory directory if it doesn't exist
    mkdir -p ".paired/memory"
    
    # Extract relevant patterns for this project
    local project_name=$(basename "$CURRENT_DIR")
    local temp_file=$(mktemp)
    
    echo "## Global Knowledge Applied to $project_name" > "$temp_file"
    echo "**Sync Date**: $(date)" >> "$temp_file"
    echo "" >> "$temp_file"
    
    # Extract general best practices
    echo "### Best Practices from Other Projects" >> "$temp_file"
    grep -A 2 -E "Best Practice|Pattern|Solution" "$GLOBAL_MEMORY" 2>/dev/null | head -15 >> "$temp_file" || true
    echo "" >> "$temp_file"
    
    # Extract similar project insights (basic matching)
    if grep -q -i "$(echo "$project_name" | tr '[:upper:]' '[:lower:]')" "$GLOBAL_MEMORY" 2>/dev/null; then
        echo "### Insights from Similar Projects" >> "$temp_file"
        grep -A 3 -B 1 -i "$(echo "$project_name" | tr '[:upper:]' '[:lower:]')" "$GLOBAL_MEMORY" 2>/dev/null >> "$temp_file" || true
        echo "" >> "$temp_file"
    fi
    
    if [ "$dry_run" = true ]; then
        echo -e "${YELLOW}🔍 Dry run - would add to local knowledge:${NC}"
        cat "$temp_file"
        rm "$temp_file"
        return 0
    fi
    
    # Append to local memory
    if [ -f ".paired/memory/ai_memory.md" ]; then
        echo "" >> ".paired/memory/ai_memory.md"
        cat "$temp_file" >> ".paired/memory/ai_memory.md"
    else
        cat "$temp_file" > ".paired/memory/ai_memory.md"
    fi
    
    rm "$temp_file"
    
    # Ensure agent system files are present
    echo -e "${BLUE}🤖 Checking agent system files...${NC}"
    
    # Create agent directories if missing
    mkdir -p ".paired/agents" ".paired/shared"
    
    # Find global PAIRED source directory (could be in Scripts/wee or directly in wee)
    GLOBAL_SRC=""
    if [ -d "$(dirname "$HOME/.paired")/Scripts/wee/src" ]; then
        GLOBAL_SRC="$(dirname "$HOME/.paired")/Scripts/wee/src"
    elif [ -d "$(dirname "$HOME/.paired")/wee/src" ]; then
        GLOBAL_SRC="$(dirname "$HOME/.paired")/wee/src"
    fi
    if [ -d "$GLOBAL_SRC" ]; then
        # Ensure agent config directory exists
        mkdir -p ".paired/config/agents"
        
        # Copy missing agent configuration files
        local files_copied=0
        
        for agent_config in "$GLOBAL_SRC/config/agents/"*.yml; do
            if [ -f "$agent_config" ]; then
                local config_name=$(basename "$agent_config")
                if [ ! -f ".paired/config/agents/$config_name" ]; then
                    cp "$agent_config" ".paired/config/agents/" 2>/dev/null && files_copied=$((files_copied + 1))
                fi
            fi
        done
        
        if [ $files_copied -gt 0 ]; then
            echo -e "${GREEN}✅ Synced $files_copied agent system files${NC}"
        else
            echo -e "${GREEN}✅ Agent system files already up to date${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Global PAIRED source not found - agent files may need manual setup${NC}"
    fi
    
    echo -e "${GREEN}✅ Global knowledge synced to local${NC}"
}

# Show sync status
show_status() {
    echo -e "${BLUE}📊 Knowledge Sync Status${NC}"
    echo "========================"
    echo ""
    
    # Global status
    if [ -f "$GLOBAL_MEMORY" ]; then
        local global_size=$(wc -l < "$GLOBAL_MEMORY")
        echo -e "${GREEN}Global Knowledge: $global_size lines${NC}"
    else
        echo -e "${YELLOW}Global Knowledge: Not found${NC}"
    fi
    
    # Local status (if in project)
    if [ -f ".pairedrules" ] || [ -d ".paired" ]; then
        if [ -f ".paired/memory/ai_memory.md" ]; then
            local local_size=$(wc -l < ".paired/memory/ai_memory.md")
            echo -e "${GREEN}Local Knowledge: $local_size lines${NC}"
        else
            echo -e "${YELLOW}Local Knowledge: Not found${NC}"
        fi
        
        # Check last sync
        local project_path=$(realpath "$CURRENT_DIR")
        local last_sync=$(jq -r --arg path "$project_path" '.projects[] | select(.path == $path) | .last_sync' "$REGISTRY_FILE" 2>/dev/null || echo "null")
        
        if [ "$last_sync" != "null" ] && [ "$last_sync" != "" ]; then
            echo -e "${GREEN}Last Sync: $last_sync${NC}"
        else
            echo -e "${YELLOW}Last Sync: Never${NC}"
        fi
    else
        echo -e "${BLUE}Not in a PAIRED project${NC}"
    fi
    
    echo ""
    
    # Recent backups
    if [ -d "$HOME/.paired/memory/backups" ]; then
        local backup_count=$(ls -1 "$HOME/.paired/memory/backups" 2>/dev/null | wc -l)
        echo -e "${BLUE}Available Backups: $backup_count${NC}"
    fi
}

# Parse options
DRY_RUN=false
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        *)
            break
            ;;
    esac
done

# Main command handling
case "${1:-both}" in
    "up")
        create_backup
        sync_up "$DRY_RUN"
        ;;
    "down")
        create_backup
        sync_down "$DRY_RUN"
        ;;
    "both")
        create_backup
        sync_up "$DRY_RUN"
        sync_down "$DRY_RUN"
        ;;
    "status")
        show_status
        ;;
    "backup")
        create_backup
        echo -e "${GREEN}✅ Backup completed${NC}"
        ;;
    "help"|*)
        show_help
        ;;
esac
