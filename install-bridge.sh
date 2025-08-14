#!/bin/bash
#
# PAIRED Cascade Bridge Installation Script
#
# This script provides a fully automated installation/update process for the
# PAIRED Cascade Agent Bridge from a GitHub clone.
#
# Usage:
#   ./install-bridge.sh [--global]
#     --global : Install to global ~/.paired directory
#     No args  : Use current directory for local install

set -e

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Determine script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(dirname "$SCRIPT_DIR")"

# Check if this is a valid PAIRED repository
if [ ! -f "$SOURCE_DIR/package.json" ] || [ ! -d "$SOURCE_DIR/src" ]; then
  echo -e "${RED}❌ Error: Not a valid PAIRED repository. Please run this script from within a PAIRED repository.${NC}"
  exit 1
fi

# Parse arguments
GLOBAL_INSTALL=false
if [ "$1" == "--global" ]; then
  GLOBAL_INSTALL=true
  TARGET_DIR="$HOME/.paired"
else
  TARGET_DIR="$SOURCE_DIR"
fi

echo -e "\n${CYAN}🌊 PAIRED Cascade Bridge Installation${NC}"
echo -e "==============================="

# Install dependencies
echo -e "\n${CYAN}📦 Installing dependencies...${NC}"
cd "$SOURCE_DIR"
npm install ws express uuid
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Ensure required directories exist
if [ "$GLOBAL_INSTALL" = true ]; then
  echo -e "\n${CYAN}📂 Setting up global directory structure...${NC}"
  mkdir -p "$TARGET_DIR/src"
  mkdir -p "$TARGET_DIR/scripts"
  mkdir -p "$TARGET_DIR/docs"
fi

# Copy bridge source files
echo -e "\n${CYAN}🔄 Installing bridge files...${NC}"

# List of required source files
SOURCE_FILES=(
  "cascade_bridge_api.js"
  "cascade_bridge_client.js"
  "cascade_bridge_client_auto.js" 
  "cascade_bridge_lifecycle.js"
  "cascade_bridge_service.js"
  "windsurf_bridge_integration.js"
)

# Copy source files
for file in "${SOURCE_FILES[@]}"; do
  if [ -f "$SOURCE_DIR/src/$file" ]; then
    if [ "$GLOBAL_INSTALL" = true ]; then
      cp "$SOURCE_DIR/src/$file" "$TARGET_DIR/src/"
      echo -e "${GREEN}✅ Installed: $file${NC}"
    else
      echo -e "${GREEN}✅ Using local: $file${NC}"
    fi
  else
    echo -e "${RED}❌ Error: Required file not found: $file${NC}"
    exit 1
  fi
done

# List of script files
SCRIPT_FILES=(
  "start_windsurf_bridge.js"
  "cascade_bridge_manager.sh"
  "paired-init.sh"
)

# Copy and make executable script files
for file in "${SCRIPT_FILES[@]}"; do
  if [ -f "$SOURCE_DIR/scripts/$file" ]; then
    if [ "$GLOBAL_INSTALL" = true ]; then
      cp "$SOURCE_DIR/scripts/$file" "$TARGET_DIR/scripts/"
      chmod +x "$TARGET_DIR/scripts/$file"
      echo -e "${GREEN}✅ Installed: $file${NC}"
    else
      chmod +x "$SOURCE_DIR/scripts/$file"
      echo -e "${GREEN}✅ Made executable: $file${NC}"
    fi
  else
    echo -e "${RED}❌ Error: Required script not found: $file${NC}"
    exit 1
  fi
done

# If global, update the initialization script
if [ "$GLOBAL_INSTALL" = true ]; then
  if [ -f "$SOURCE_DIR/scripts/paired-init.sh" ]; then
    cp "$SOURCE_DIR/scripts/paired-init.sh" "$TARGET_DIR/scripts/init-project.sh"
    chmod +x "$TARGET_DIR/scripts/init-project.sh"
    echo -e "${GREEN}✅ Updated global initialization script${NC}"
  fi
fi

# Verify installation
echo -e "\n${CYAN}🔍 Verifying installation...${NC}"

if [ "$GLOBAL_INSTALL" = true ]; then
  CHECK_DIR="$TARGET_DIR"
else
  CHECK_DIR="$SOURCE_DIR"
fi

VERIFICATION_PASSED=true

# Check source files
for file in "${SOURCE_FILES[@]}"; do
  if [ ! -f "$CHECK_DIR/src/$file" ]; then
    VERIFICATION_PASSED=false
    echo -e "${RED}❌ Missing source file: $file${NC}"
  fi
done

# Check script files
for file in "${SCRIPT_FILES[@]}"; do
  script_path="$CHECK_DIR/scripts/$file"
  if [ "$file" == "paired-init.sh" ] && [ "$GLOBAL_INSTALL" = true ]; then
    script_path="$CHECK_DIR/scripts/init-project.sh"
  fi
  
  if [ ! -f "$script_path" ]; then
    VERIFICATION_PASSED=false
    echo -e "${RED}❌ Missing script: $file${NC}"
  elif [ ! -x "$script_path" ]; then
    VERIFICATION_PASSED=false
    echo -e "${RED}❌ Script not executable: $file${NC}"
  fi
done

if [ "$VERIFICATION_PASSED" = true ]; then
  echo -e "\n${GREEN}✅ Installation verified successfully!${NC}"

  if [ "$GLOBAL_INSTALL" = true ]; then
    echo -e "\n${CYAN}🚀 Global installation complete${NC}"
    echo -e "You can now use the following commands:"
    echo -e "  - ${YELLOW}paired-init <project-dir>${NC} - Initialize a new PAIRED project"
    echo -e "  - ${YELLOW}cd <project-dir> && npm start${NC} - Start the bridge service"
  else
    echo -e "\n${CYAN}🚀 Local installation complete${NC}"
    echo -e "You can now use the following commands:"
    echo -e "  - ${YELLOW}./scripts/paired-init.sh <project-dir>${NC} - Initialize a new PAIRED project"
    echo -e "  - ${YELLOW}cd <project-dir> && npm start${NC} - Start the bridge service" 
  fi
else
  echo -e "\n${RED}❌ Installation verification failed${NC}"
  echo -e "Please check the errors above and try again."
  exit 1
fi
