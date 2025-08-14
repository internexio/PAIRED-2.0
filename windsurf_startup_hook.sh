#!/bin/bash
# Windsurf Startup Hook - Reliable CASCADE Complete Takeover Activation
# This script ensures agents are available every time Windsurf opens

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 PAIRED: Windsurf startup detected - activating agents...${NC}"

# Wait a moment for Windsurf to fully load
sleep 2

# Check if we're in a development project
if [[ -d ".git" ]] || [[ -f "package.json" ]] || [[ -f "requirements.txt" ]] || [[ -f "Cargo.toml" ]] || [[ -f "pom.xml" ]] || [[ -f "go.mod" ]] || [[ -f "Makefile" ]] || [[ -f "README.md" ]]; then
  echo -e "${GREEN}✅ Development project detected${NC}"
  
  # Initialize PAIRED if not already done
  if [[ ! -f ".pairedrules" && ! -d ".paired" ]]; then
    echo -e "${BLUE}🔧 Auto-initializing PAIRED project...${NC}"
    if [[ -f ~/.paired/scripts/auto-init-project.sh ]]; then
      ~/.paired/scripts/auto-init-project.sh --quiet
    fi
  fi
  
  # Always activate CASCADE Complete Takeover
  echo -e "${BLUE}🎯 Activating CASCADE Complete Takeover...${NC}"
  if [[ -f ~/.paired/scripts/activate_cascade_complete.sh ]]; then
    # Run in background to avoid blocking Windsurf startup
    (~/.paired/scripts/activate_cascade_complete.sh > /tmp/paired_activation.log 2>&1 &)
    echo -e "${GREEN}✅ Agent activation started in background${NC}"
    echo -e "${BLUE}💬 Your PAIRED team will be available shortly!${NC}"
  else
    echo -e "${YELLOW}⚠️ CASCADE activation script not found${NC}"
  fi
else
  echo -e "${YELLOW}ℹ️ Not a development project - PAIRED agents not activated${NC}"
fi

echo -e "${GREEN}🎉 Windsurf startup hook complete!${NC}"
