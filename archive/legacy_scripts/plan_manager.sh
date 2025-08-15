#!/bin/bash
# Plan Management System
# Helps maintain accurate plan.md state and prevents duplicate work

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PLAN_FILE="$HOME/.codeium/windsurf/brain/*/plan.md"

# Function to mark task as completed
mark_completed() {
    local task_pattern="$1"
    local plan_file=$(ls $PLAN_FILE 2>/dev/null | head -1)
    
    if [ -z "$plan_file" ]; then
        echo -e "${RED}❌ Plan file not found${NC}"
        return 1
    fi
    
    echo -e "${BLUE}🔄 Marking task as completed: ${task_pattern}${NC}"
    
    # Use sed to replace [ ] with [x] for matching tasks
    sed -i.bak "s/^- \[ \] \(.*${task_pattern}.*\)/- [x] \1/" "$plan_file"
    
    echo -e "${GREEN}✅ Task marked as completed${NC}"
}

# Function to add new task
add_task() {
    local task_description="$1"
    local plan_file=$(ls $PLAN_FILE 2>/dev/null | head -1)
    
    if [ -z "$plan_file" ]; then
        echo -e "${RED}❌ Plan file not found${NC}"
        return 1
    fi
    
    echo -e "${BLUE}➕ Adding new task: ${task_description}${NC}"
    
    # Add to Active Task List section
    sed -i.bak "/^## Active Task List/a\\
- [ ] ${task_description}" "$plan_file"
    
    echo -e "${GREEN}✅ Task added to Active Task List${NC}"
}

# Function to show current active tasks
show_active() {
    local plan_file=$(ls $PLAN_FILE 2>/dev/null | head -1)
    
    if [ -z "$plan_file" ]; then
        echo -e "${RED}❌ Plan file not found${NC}"
        return 1
    fi
    
    echo -e "${BLUE}📋 Current Active Tasks:${NC}"
    echo "----------------------------------------"
    
    # Extract active tasks (lines between "## Active Task List" and next "##")
    sed -n '/^## Active Task List/,/^## /p' "$plan_file" | \
    grep '^- \[ \]' | \
    sed 's/^- \[ \] /  ❌ /'
    
    echo ""
    echo -e "${GREEN}📋 Completed Tasks:${NC}"
    sed -n '/^## Active Task List/,/^## /p' "$plan_file" | \
    grep '^- \[x\]' | \
    sed 's/^- \[x\] /  ✅ /'
    
    echo "----------------------------------------"
}

# Function to validate plan consistency
validate_plan() {
    local plan_file=$(ls $PLAN_FILE 2>/dev/null | head -1)
    
    if [ -z "$plan_file" ]; then
        echo -e "${RED}❌ Plan file not found${NC}"
        return 1
    fi
    
    echo -e "${BLUE}🔍 Validating plan consistency...${NC}"
    
    # Count active vs completed tasks
    local active_count=$(sed -n '/^## Active Task List/,/^## /p' "$plan_file" | grep -c '^- \[ \]' || echo 0)
    local completed_count=$(sed -n '/^## Active Task List/,/^## /p' "$plan_file" | grep -c '^- \[x\]' || echo 0)
    
    echo "  📊 Active tasks: $active_count"
    echo "  ✅ Completed tasks: $completed_count"
    
    # Check for duplicate tasks
    local duplicates=$(sed -n '/^## Active Task List/,/^## /p' "$plan_file" | \
                      grep '^- \[' | \
                      sort | uniq -d | wc -l)
    
    if [ "$duplicates" -gt 0 ]; then
        echo -e "${YELLOW}⚠️ Found $duplicates potential duplicate tasks${NC}"
    else
        echo -e "${GREEN}✅ No duplicate tasks found${NC}"
    fi
}

# Function to reorganize tasks (completed first, then active)
reorganize_tasks() {
    local plan_file=$(ls $PLAN_FILE 2>/dev/null | head -1)
    
    if [ -z "$plan_file" ]; then
        echo -e "${RED}❌ Plan file not found${NC}"
        return 1
    fi
    
    echo -e "${BLUE}🔄 Reorganizing Active Task List (completed first, then active)...${NC}"
    
    # Create backup
    cp "$plan_file" "${plan_file}.backup"
    
    # Create temporary file
    local temp_file=$(mktemp)
    
    # Extract everything before Active Task List
    sed -n '1,/^## Active Task List/p' "$plan_file" > "$temp_file"
    
    # Extract completed and active tasks
    local completed_tasks=$(sed -n '/^## Active Task List/,/^## /p' "$plan_file" | grep '^- \[x\]')
    local active_tasks=$(sed -n '/^## Active Task List/,/^## /p' "$plan_file" | grep '^- \[ \]')
    
    # Write reorganized tasks (completed first, then active)
    if [ -n "$completed_tasks" ]; then
        echo "$completed_tasks" >> "$temp_file"
        [ -n "$active_tasks" ] && echo "" >> "$temp_file"
    fi
    
    if [ -n "$active_tasks" ]; then
        echo "$active_tasks" >> "$temp_file"
        echo "" >> "$temp_file"
    fi
    
    # Extract everything after Active Task List section
    sed -n '/^## Active Task List/,/^## /{/^## Active Task List/d; /^- \[/d; /^$/d;}; /^## /,$p' "$plan_file" >> "$temp_file"
    
    # Replace original with reorganized version
    mv "$temp_file" "$plan_file"
    
    # Show summary
    local completed_count=$(echo "$completed_tasks" | grep -c '^' 2>/dev/null || echo 0)
    local active_count=$(echo "$active_tasks" | grep -c '^' 2>/dev/null || echo 0)
    
    echo -e "${GREEN}✅ Tasks reorganized:${NC}"
    echo -e "  ✅ $completed_count completed tasks (moved to top)"
    echo -e "  ❌ $active_count active tasks (moved to bottom)"
    echo -e "  📁 Backup saved: ${plan_file}.backup"
}

# Function to clean up completed tasks
archive_completed() {
    local plan_file=$(ls $PLAN_FILE 2>/dev/null | head -1)
    
    if [ -z "$plan_file" ]; then
        echo -e "${RED}❌ Plan file not found${NC}"
        return 1
    fi
    
    echo -e "${BLUE}📦 Archiving completed tasks...${NC}"
    
    # Move completed tasks from Active to main Task List
    local completed_tasks=$(sed -n '/^## Active Task List/,/^## /p' "$plan_file" | grep '^- \[x\]')
    
    if [ -n "$completed_tasks" ]; then
        # Add to main task list
        echo "$completed_tasks" | while read -r task; do
            sed -i.bak "/^## Task List/a\\
$task" "$plan_file"
        done
        
        # Remove from active task list
        sed -i.bak '/^## Active Task List/,/^## /{/^- \[x\]/d;}' "$plan_file"
        
        echo -e "${GREEN}✅ Completed tasks archived${NC}"
    else
        echo -e "${YELLOW}ℹ️ No completed tasks to archive${NC}"
    fi
}

# Main command handling
case "${1:-help}" in
    "complete"|"done")
        if [ $# -lt 2 ]; then
            echo -e "${RED}Usage: $0 complete \"task pattern\"${NC}"
            exit 1
        fi
        mark_completed "$2"
        ;;
    "add"|"new")
        if [ $# -lt 2 ]; then
            echo -e "${RED}Usage: $0 add \"task description\"${NC}"
            exit 1
        fi
        add_task "$2"
        ;;
    "show"|"list")
        show_active
        ;;
    "validate"|"check")
        validate_plan
        ;;
    "reorganize"|"reorg")
        reorganize_tasks
        ;;
    "archive"|"cleanup")
        archive_completed
        ;;
    "help"|*)
        echo -e "${BLUE}Plan Manager - Maintain accurate plan.md state${NC}"
        echo ""
        echo "Usage:"
        echo "  $0 complete \"pattern\"    - Mark task containing pattern as completed"
        echo "  $0 add \"description\"     - Add new task to Active Task List"
        echo "  $0 show                   - Show current active and completed tasks"
        echo "  $0 reorganize             - Move completed tasks above active ones"
        echo "  $0 validate               - Check plan consistency and duplicates"
        echo "  $0 archive                - Move completed tasks to main Task List"
        echo ""
        echo "Examples:"
        echo "  $0 complete \"CASCADE integration\""
        echo "  $0 add \"Fix memory leak in bridge service\""
        echo "  $0 show"
        ;;
esac
