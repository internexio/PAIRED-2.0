#!/bin/bash
# Simple Plan Status Checker
# Shows current active tasks from the most recent plan.md

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Find the most recent plan.md file
PLAN_FILE=$(find ~/.codeium/windsurf/brain -name "plan.md" -type f -exec stat -f "%m %N" {} \; 2>/dev/null | sort -nr | head -1 | cut -d' ' -f2-)

if [ -z "$PLAN_FILE" ]; then
    echo -e "${RED}❌ No plan.md found${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Current Plan Status${NC}"
echo -e "${YELLOW}Plan file: $(basename $(dirname $PLAN_FILE))${NC}"
echo "----------------------------------------"

# Show active tasks
echo -e "${RED}🔴 ACTIVE TASKS:${NC}"
sed -n '/^## Active Task List/,/^## /p' "$PLAN_FILE" | grep '^- \[ \]' | sed 's/^- \[ \] /  ❌ /' || echo "  (none)"

echo ""
echo -e "${GREEN}✅ COMPLETED TASKS:${NC}"
sed -n '/^## Active Task List/,/^## /p' "$PLAN_FILE" | grep '^- \[x\]' | sed 's/^- \[x\] /  ✅ /' || echo "  (none)"

echo ""
echo -e "${BLUE}🎯 CURRENT GOAL:${NC}"
sed -n '/^## Current Goal/,/^## /p' "$PLAN_FILE" | grep -v '^## ' | sed 's/^/  /'

echo "----------------------------------------"

# Quick stats
ACTIVE_COUNT=$(sed -n '/^## Active Task List/,/^## /p' "$PLAN_FILE" | grep -c '^- \[ \]' || echo 0)
DONE_COUNT=$(sed -n '/^## Active Task List/,/^## /p' "$PLAN_FILE" | grep -c '^- \[x\]' || echo 0)

echo -e "${BLUE}📊 Stats: ${ACTIVE_COUNT} active, ${DONE_COUNT} completed${NC}"
