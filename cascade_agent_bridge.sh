#!/bin/bash

# Cascade Agent Bridge Manager
# This script manages the WEE agent bridge specifically for Cascade integration
# It ensures proper startup, monitoring, and shutdown of the agent bridge

# Color definitions
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Paths
PROJECT_ROOT="$(pwd)"
WEE_DIR="$PROJECT_ROOT/.wee"
BRIDGE_SCRIPT="$PROJECT_ROOT/src/start_agent_bridge.js"
PID_FILE="/tmp/wee_cascade_bridge.pid"
LOG_FILE="/tmp/wee_cascade_bridge.log"

# Ensure we're in a WEE project
if [ ! -d "$WEE_DIR" ]; then
  echo -e "${RED}❌ Not in a WEE project directory${NC}"
  exit 1
fi

# Command functions
start_bridge() {
  # Check if already running
  if [ -f "$PID_FILE" ] && ps -p "$(cat "$PID_FILE")" > /dev/null; then
    echo -e "${YELLOW}⚠️  Agent bridge is already running with PID: $(cat "$PID_FILE")${NC}"
    echo -e "${BLUE}📋 View logs with: cascade_agent_bridge.sh logs${NC}"
    return 0
  fi
  
  echo -e "${BLUE}🚀 Starting WEE agent bridge with Cascade integration...${NC}"
  
  # Set Cascade integration environment variable to enable special output formatting
  export CASCADE_INTEGRATION=true
  
  # Start the bridge with output to both terminal and log file
  node "$BRIDGE_SCRIPT" 2>&1 | tee "$LOG_FILE" &
  
  # Save the PID
  echo $! > "$PID_FILE"
  
  echo -e "${GREEN}✅ Agent bridge started with PID: $(cat "$PID_FILE")${NC}"
  echo -e "${BLUE}📋 View logs with: cascade_agent_bridge.sh logs${NC}"
}

stop_bridge() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null; then
      echo -e "${BLUE}🛑 Stopping agent bridge with PID: $PID${NC}"
      kill -15 "$PID"
      sleep 1
      
      # Check if it's still running
      if ps -p "$PID" > /dev/null; then
        echo -e "${YELLOW}⚠️  Process not responding to graceful shutdown, forcing...${NC}"
        kill -9 "$PID"
      fi
      
      echo -e "${GREEN}✅ Agent bridge stopped${NC}"
    else
      echo -e "${YELLOW}⚠️  No running bridge process found (PID: $PID)${NC}"
    fi
    rm -f "$PID_FILE"
  else
    echo -e "${YELLOW}⚠️  No PID file found, agent bridge may not be running${NC}"
  fi
}

status_bridge() {
  if [ -f "$PID_FILE" ] && ps -p "$(cat "$PID_FILE")" > /dev/null; then
    PID=$(cat "$PID_FILE")
    echo -e "${GREEN}✅ Agent bridge is RUNNING${NC}"
    echo -e "${BLUE}📊 PID: $PID${NC}"
    echo -e "${BLUE}📝 Log file: $LOG_FILE${NC}"
    
    # Show recent log entries
    echo -e "\n${BLUE}📋 Recent log entries:${NC}"
    tail -n 5 "$LOG_FILE"
  else
    echo -e "${YELLOW}⚠️  Agent bridge is NOT running${NC}"
    if [ -f "$LOG_FILE" ]; then
      echo -e "${BLUE}📝 Last log entries before shutdown:${NC}"
      tail -n 5 "$LOG_FILE"
    fi
  fi
}

view_logs() {
  if [ -f "$LOG_FILE" ]; then
    echo -e "${BLUE}📋 Agent bridge log (last 20 lines):${NC}"
    tail -n 20 "$LOG_FILE"
  else
    echo -e "${RED}❌ No log file found${NC}"
  fi
}

restart_bridge() {
  stop_bridge
  sleep 1
  start_bridge
}

test_agents() {
  echo -e "${BLUE}🧪 Testing agent triggers for Cascade integration...${NC}"
  
  # Start the bridge if not running
  if [ ! -f "$PID_FILE" ] || ! ps -p "$(cat "$PID_FILE")" > /dev/null; then
    start_bridge
    sleep 2
  fi
  
  # Create test files to trigger different agents
  TEST_DIR="$PROJECT_ROOT/test_cascade_integration"
  mkdir -p "$TEST_DIR"
  
  echo -e "${YELLOW}🔍 Triggering QA Agent (Sherlock)...${NC}"
  echo "// Test file to trigger QA agent" > "$TEST_DIR/test_trigger.test.js"
  sleep 2
  
  echo -e "${YELLOW}🏛️ Triggering Architecture Agent (Leonardo)...${NC}"
  echo "# Test config to trigger Architecture agent" > "$TEST_DIR/test_config.yml"
  sleep 2
  
  echo -e "${YELLOW}⚡ Triggering Dev Agent (Edison)...${NC}"
  echo "function testFunction() { return true; }" > "$TEST_DIR/test_implementation.js"
  sleep 2
  
  echo -e "${YELLOW}🎨 Triggering UX Agent (Maya)...${NC}"
  echo ".test-class { color: blue; }" > "$TEST_DIR/test_styles.css"
  sleep 2
  
  # Show the log output
  echo -e "\n${BLUE}📋 Agent trigger log:${NC}"
  tail -n 20 "$LOG_FILE"
  
  echo -e "\n${GREEN}✅ Agent test complete!${NC}"
  echo -e "${BLUE}📋 Check for CASCADE_AGENT_MESSAGE entries in the log above${NC}"
}

# Command handling
case "$1" in
  start)
    start_bridge
    ;;
  stop)
    stop_bridge
    ;;
  restart)
    restart_bridge
    ;;
  status)
    status_bridge
    ;;
  logs)
    view_logs
    ;;
  test)
    test_agents
    ;;
  *)
    echo -e "${BLUE}WEE Cascade Agent Bridge Manager${NC}"
    echo -e "Usage: $0 {start|stop|restart|status|logs|test}"
    echo -e "  start   - Start the agent bridge with Cascade integration"
    echo -e "  stop    - Stop the running agent bridge"
    echo -e "  restart - Restart the agent bridge"
    echo -e "  status  - Check if the agent bridge is running"
    echo -e "  logs    - View the last 20 lines of the log"
    echo -e "  test    - Test agent triggers for Cascade integration"
    ;;
esac

exit 0
