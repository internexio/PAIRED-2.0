#!/bin/bash

# PAIRED Multi-Session Bridge - Global Installation Test Script
# 
# This script automates the fresh installation test process

# Color definitions
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🌍 PAIRED Multi-Session Bridge - Global Installation Test${NC}"
echo -e "${BLUE}Testing fresh deployment from GitHub${NC}"
echo ""

# Configuration
TEST_DIR="$HOME/Desktop/paired-global-test"
REPO_URL="https://github.com/SEMalytics/windsurf-evolutionary-ecosystem.git"

# Step 1: Clean up any existing test directory
if [ -d "$TEST_DIR" ]; then
  echo -e "${YELLOW}🧹 Cleaning up existing test directory...${NC}"
  rm -rf "$TEST_DIR"
fi

# Step 2: Create fresh test environment
echo -e "${BLUE}📁 Creating fresh test environment...${NC}"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Step 3: Clone fresh copy from GitHub
echo -e "${BLUE}📥 Cloning fresh copy from GitHub...${NC}"
git clone "$REPO_URL" paired-fresh
cd paired-fresh

# Step 4: Verify our files are present
echo -e "${BLUE}🔍 Verifying multi-session bridge files...${NC}"
if [ -f "src/cascade-bridge-service.js" ] && [ -f "scripts/start-multi-session-bridge.sh" ]; then
  echo -e "${GREEN}✅ Multi-session bridge files found${NC}"
else
  echo -e "${RED}❌ Multi-session bridge files missing${NC}"
  exit 1
fi

# Step 5: Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install --silent

# Step 6: Start the multi-session bridge
echo -e "${BLUE}🚀 Starting multi-session bridge...${NC}"
chmod +x scripts/start-multi-session-bridge.sh
./scripts/start-multi-session-bridge.sh start

# Wait a moment for startup
sleep 3

# Step 7: Test bridge functionality
echo -e "${BLUE}🧪 Testing bridge functionality...${NC}"

# Health check
echo -e "${YELLOW}   Health check...${NC}"
if curl -s http://localhost:8080/health > /dev/null; then
  echo -e "${GREEN}   ✅ Health endpoint responding${NC}"
else
  echo -e "${RED}   ❌ Health endpoint not responding${NC}"
  exit 1
fi

# Create test session
echo -e "${YELLOW}   Creating test session...${NC}"
SESSION_RESPONSE=$(curl -s -X POST http://localhost:8080/api/sessions \
  -H 'Content-Type: application/json' \
  -d "{\"projectPath\":\"$(pwd)\",\"windsurfInstanceId\":\"test-windsurf-$(date +%s)\"}")

if echo "$SESSION_RESPONSE" | grep -q "sessionId"; then
  SESSION_ID=$(echo "$SESSION_RESPONSE" | node -e "console.log(JSON.parse(require('fs').readFileSync('/dev/stdin')).sessionId)")
  echo -e "${GREEN}   ✅ Session created: $SESSION_ID${NC}"
else
  echo -e "${RED}   ❌ Session creation failed${NC}"
  exit 1
fi

# Test message routing
echo -e "${YELLOW}   Testing message routing...${NC}"
MESSAGE_RESPONSE=$(curl -s -X POST "http://localhost:8080/api/sessions/$SESSION_ID/messages" \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Test message from global installation",
    "type": "agent",
    "agent": "sherlock_qa_agent",
    "priority": "high"
  }')

if echo "$MESSAGE_RESPONSE" | grep -q "messageId"; then
  echo -e "${GREEN}   ✅ Message routing working${NC}"
else
  echo -e "${RED}   ❌ Message routing failed${NC}"
fi

# Show current status
echo -e "\n${PURPLE}📊 Current Bridge Status:${NC}"
./scripts/start-multi-session-bridge.sh status

echo -e "\n${PURPLE}🌐 Bridge Endpoints:${NC}"
echo -e "${BLUE}   Health: http://localhost:8080/health${NC}"
echo -e "${BLUE}   Sessions: http://localhost:8080/api/sessions${NC}"
echo -e "${BLUE}   WebSocket: ws://localhost:8080/ws${NC}"

echo -e "\n${PURPLE}📋 Next Steps:${NC}"
echo -e "${BLUE}1. Open Windsurf IDE${NC}"
echo -e "${BLUE}2. Open this project folder: $TEST_DIR/paired-fresh${NC}"
echo -e "${BLUE}3. Test CASCADE integration with agents${NC}"
echo -e "${BLUE}4. Try opening multiple Windsurf instances${NC}"

echo -e "\n${PURPLE}🛠️ Management Commands:${NC}"
echo -e "${BLUE}   Status: ./scripts/start-multi-session-bridge.sh status${NC}"
echo -e "${BLUE}   Logs: ./scripts/start-multi-session-bridge.sh logs${NC}"
echo -e "${BLUE}   Stop: ./scripts/start-multi-session-bridge.sh stop${NC}"

echo -e "\n${GREEN}🎉 Global Installation Test Complete!${NC}"
echo -e "${GREEN}Multi-session bridge is ready for Windsurf IDE testing${NC}"
