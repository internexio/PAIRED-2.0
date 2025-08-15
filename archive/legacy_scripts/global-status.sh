#!/bin/bash
# PAIRED Global Status Script
# Shows global PAIRED system status and registered projects

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REGISTRY_FILE="$HOME/.paired/registry/projects.json"
GLOBAL_MEMORY="$HOME/.paired/memory/global_knowledge.md"

echo -e "${BLUE}🌍 PAIRED Global System Status${NC}"
echo "=========================="
echo ""

# Check if PAIRED is properly installed
if [ ! -f "$REGISTRY_FILE" ]; then
    echo -e "${RED}❌ PAIRED global registry not found${NC}"
    echo -e "${YELLOW}💡 Run the install script to set up PAIRED${NC}"
    exit 1
fi

# Parse registry data
TOTAL_PROJECTS=$(jq -r '.global_stats.total_projects' "$REGISTRY_FILE" 2>/dev/null || echo "0")
ACTIVE_PROJECTS=$(jq -r '.global_stats.active_projects' "$REGISTRY_FILE" 2>/dev/null || echo "0")
PAIRED_VERSION=$(jq -r '.global_stats.paired_version' "$REGISTRY_FILE" 2>/dev/null || echo "unknown")
INSTALL_DATE=$(jq -r '.global_stats.installation_date' "$REGISTRY_FILE" 2>/dev/null || echo "unknown")
LEARNING_ITEMS=$(jq -r '.global_stats.total_learning_items' "$REGISTRY_FILE" 2>/dev/null || echo "0")

echo -e "${GREEN}📊 System Overview${NC}"
echo "   Version: $PAIRED_VERSION"
echo "   Installed: $INSTALL_DATE"
echo "   Total Projects: $TOTAL_PROJECTS"
echo "   Active Projects: $ACTIVE_PROJECTS"
echo "   Learning Items: $LEARNING_ITEMS"
echo ""

# Show recent projects
echo -e "${BLUE}📁 Recent Projects${NC}"
if [ "$TOTAL_PROJECTS" -gt 0 ]; then
    jq -r '.projects[] | "   • \(.name) (\(.path)) - \(.status)"' "$REGISTRY_FILE" 2>/dev/null | head -5
else
    echo "   No projects registered yet"
    echo -e "${YELLOW}   💡 Use 'paired-init' in a project directory to get started${NC}"
fi
echo ""

# Global memory status
echo -e "${BLUE}🧠 Global Knowledge${NC}"
if [ -f "$GLOBAL_MEMORY" ]; then
    MEMORY_SIZE=$(wc -l < "$GLOBAL_MEMORY")
    echo "   Knowledge base: $MEMORY_SIZE lines"
    echo "   Location: $GLOBAL_MEMORY"
else
    echo -e "${YELLOW}   Knowledge base not found${NC}"
fi
echo ""

# Auto-onboarding status
echo -e "${BLUE}🎯 Auto-Onboarding${NC}"
if [ -f "$HOME/.pairedrules" ]; then
    echo -e "${GREEN}   ✅ Global rules active${NC}"
    echo "   Location: ~/.pairedrules"
else
    echo -e "${YELLOW}   ⚠️  Global rules not found${NC}"
    echo -e "${YELLOW}   💡 Auto-onboarding may not work properly${NC}"
fi
echo ""

# Available commands
echo -e "${BLUE}🔧 Available Commands${NC}"
echo "   Global:"
echo "     paired-global registry    - View all projects"
echo "     paired-global status      - This status display"
echo "     paired-sync              - Sync knowledge"
echo ""
echo "   Project:"
echo "     paired-init              - Initialize PAIRED in project"
echo "     paired-status            - Project status"
echo ""

echo -e "${GREEN}🚀 PAIRED Global System Ready${NC}"
