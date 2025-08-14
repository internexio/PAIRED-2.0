#!/bin/bash
#
# WEE Bridge Status and Control
#
# Enhanced script for WEE bridge diagnostics, messaging, and control
# Features:
# - Detailed status with connection metrics
# - Message broadcasting to all terminals
# - Direct messaging to specific terminals
# - Fallback to global installation when local files are missing
# - Auto-repair for common installation issues

# Colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Path variables with fallback capability
LOCAL_WEE_DIR="$(pwd)/.wee"
GLOBAL_WEE_DIR="$HOME/.wee"

# Try to find bridge files with fallback logic
find_bridge_file() {
  local filename="$1"
  local fallback_message="$2"
  
  # Check local project first
  if [ -f "$LOCAL_WEE_DIR/src/$filename" ]; then
    echo "$LOCAL_WEE_DIR/src/$filename"
    return 0
  fi
  
  # Fallback to global installation
  if [ -f "$GLOBAL_WEE_DIR/src/$filename" ]; then
    echo "$GLOBAL_WEE_DIR/src/$filename"
    if [ "$fallback_message" = "true" ]; then
      echo -e "${YELLOW}ℹ️ Using global bridge file from ~/.wee (local file not found)${NC}" >&2
    fi
    return 0
  fi
  
  # Not found anywhere
  return 1
}

# Define utility function early since we need it for initial file discovery
# Utility function to suppress debug output from find_bridge_file
without_debug_output() {
  # Save original stdout and redirect to /dev/null
  exec 3>&1
  exec 1>/dev/null
  
  # Execute the command
  local output
  output="$($@)"
  local ret=$?
  
  # Restore stdout
  exec 1>&3
  
  # Output the result
  echo "$output"
  return $ret
}

# Temporarily redirect stderr to suppress initial debug messages
exec 2>/dev/null

# Find bridge files with fallback (suppressing debug output)
BRIDGE_SERVICE=$(find_bridge_file "cascade_bridge_service.js" true)
BRIDGE_CLIENT=$(find_bridge_file "cascade_bridge_client.js" true)
BRIDGE_API=$(find_bridge_file "cascade_bridge_api.js" true)

# Restore stderr
exec 2>&1

# Determine bridge PID file location
if [ -d "$LOCAL_WEE_DIR/cascade_bridge" ]; then
  BRIDGE_DIR="$LOCAL_WEE_DIR/cascade_bridge"
else
  BRIDGE_DIR="$GLOBAL_WEE_DIR/cascade_bridge"
  mkdir -p "$BRIDGE_DIR" 2>/dev/null || true
fi

BRIDGE_PID_FILE="$BRIDGE_DIR/bridge.pid"
BRIDGE_LOG_FILE="$BRIDGE_DIR/bridge.log"
BRIDGE_PORT=7890

# Function to check if bridge is running
is_bridge_running() {
  if [ -f "$BRIDGE_PID_FILE" ]; then
    local pid=$(cat "$BRIDGE_PID_FILE" 2>/dev/null)
    if [ -n "$pid" ] && ps -p "$pid" >/dev/null; then
      return 0  # Running
    fi
  fi
  return 1  # Not running
}

# Get connection count via API call
get_connection_count() {
  local result=$(curl -s "http://localhost:$BRIDGE_PORT/api/status" 2>/dev/null)
  echo "$result" | grep -o '"activeConnections":[0-9]*' | cut -d ':' -f2 || echo "?"
}

# Get bridge uptime via API call
get_bridge_uptime() {
  local result=$(curl -s "http://localhost:$BRIDGE_PORT/api/status" 2>/dev/null)
  echo "$result" | grep -o '"uptime":[0-9]*' | cut -d ':' -f2 || echo "?"
}

# Get memory usage
get_memory_usage() {
  if is_bridge_running; then
    local pid=$(cat "$BRIDGE_PID_FILE" 2>/dev/null)
    if [[ "$OSTYPE" == "darwin"* ]]; then
      # macOS
      ps -o rss= -p "$pid" | awk '{printf "%.1f MB", $1/1024}'
    else
      # Linux
      awk '/VmRSS/{printf "%.1f MB", $2/1024}' /proc/$pid/status 2>/dev/null || echo "?"
    fi
  else
    echo "N/A"
  fi
}

# Get bridge version information
get_bridge_version() {
  # Use without_debug_output to suppress messages from find_bridge_file
  local bridge_service=$(without_debug_output find_bridge_file "cascade_bridge_service.js" true)
  
  # Try to extract version from service file
  if [ -n "$bridge_service" ] && [ -f "$bridge_service" ]; then
    local version=$(grep -o 'version[[:space:]]*=[[:space:]]*"[0-9.]*"' "$bridge_service" | grep -o '[0-9.]*' | head -1)
    if [ -n "$version" ]; then
      echo "$version"
      return
    fi
  fi
  
  # Try API endpoint if bridge is running
  if is_bridge_running; then
    local result=$(curl -s "http://localhost:$BRIDGE_PORT/api/status" 2>/dev/null)
    local api_version=$(echo "$result" | grep -o '"version":"[0-9.]*"' | cut -d '"' -f4)
    if [ -n "$api_version" ]; then
      echo "$api_version"
      return
    fi
  fi
  
  echo "unknown"
}

# Check API health
check_api_health() {
  if ! is_bridge_running; then
    echo "${RED}✖ Offline${NC}"
    return 1
  fi
  
  local start_time=$(date +%s%N)
  local result=$(curl -s "http://localhost:$BRIDGE_PORT/api/ping" 2>/dev/null)
  local end_time=$(date +%s%N)
  local latency=$(( (end_time - start_time) / 1000000 ))
  
  if [ -n "$result" ] && echo "$result" | grep -q "pong"; then
    echo "${GREEN}✓ Healthy${NC} (${latency}ms latency)"
    return 0
  else
    echo "${YELLOW}⚠️ Degraded${NC} (API responding but unexpected response)"
    return 2
  fi
}

# Get last restart time
get_last_restart() {
  if [ -f "$BRIDGE_PID_FILE" ]; then
    local pid_file_time=$(stat -f "%m" "$BRIDGE_PID_FILE" 2>/dev/null || stat -c "%Y" "$BRIDGE_PID_FILE" 2>/dev/null)
    if [ -n "$pid_file_time" ]; then
      local date_cmd="date -r"
      if [[ "$OSTYPE" != "darwin"* ]]; then
        # Linux uses different date format
        date_cmd="date -d @"
      fi
      # Add space between command and timestamp
      echo "$(eval $date_cmd "$pid_file_time" "+%Y-%m-%d %H:%M:%S")"
      return
    fi
  fi
  echo "unknown"
}

# Get error count from log file
get_error_count() {
  if [ -f "$BRIDGE_LOG_FILE" ]; then
    local error_count=$(grep -c -i "error" "$BRIDGE_LOG_FILE" 2>/dev/null)
    local warning_count=$(grep -c -i "warning" "$BRIDGE_LOG_FILE" 2>/dev/null)
    echo "$error_count errors, $warning_count warnings"
  else
    echo "Log file not found"
  fi
}

# Check file integrity
check_file_integrity() {
  local use_colors=${1:-true}
  local missing_files=0
  local expected_files=("cascade_bridge_service.js" "cascade_bridge_client.js" "cascade_bridge_api.js" 
                        "cascade_bridge_lifecycle.js" "cascade_bridge_client_auto.js" "cascade_bridge_integration.js")
  
  for file in "${expected_files[@]}"; do
    # Use without_debug_output to suppress messages from find_bridge_file
    local file_path=$(without_debug_output find_bridge_file "$file" true)
    if [ ! -f "$file_path" ]; then
      missing_files=$((missing_files + 1))
    fi
  done
  
  if [ "$missing_files" -eq 0 ]; then
    if [ "$use_colors" = "true" ]; then
      echo "${GREEN}✓ All files present${NC}"
    else
      echo "All files present"
    fi
    return 0
  else
    if [ "$use_colors" = "true" ]; then
      echo "${YELLOW}⚠️ $missing_files file(s) missing${NC}"
    else
      echo "$missing_files file(s) missing"
    fi
    return 1
  fi
}

# Generate JSON output of bridge status
show_json_status() {
  # Temporarily redirect stderr to suppress debug messages
  exec 2>/dev/null
  
  # Get basic status
  local is_running=false
  if is_bridge_running; then
    is_running=true
  fi

  # Get metrics if bridge is running
  local connection_count="null"
  local uptime="null"
  local memory_usage="null"
  local version=$(get_bridge_version)
  local api_health="null"
  local api_latency="null"
  local last_restart=$(get_last_restart)
  local error_count="null"
  local warning_count="null"
  local file_integrity=$(check_file_integrity false)

  if [ "$is_running" = true ]; then
    connection_count=$(get_connection_count)
    uptime=$(get_bridge_uptime)
    memory_usage=$(get_memory_usage)
    
    # Get API health
    local api_health_result=$(check_api_health)
    api_health=$(echo "$api_health_result" | grep -o 'healthy:\s*[a-z]\+' | awk '{print $2}')
    api_latency=$(echo "$api_health_result" | grep -o 'latency:\s*[0-9]\+ms' | awk '{print $2}')
    
    # Get error statistics
    local error_stats=$(get_error_count)
    error_count=$(echo "$error_stats" | grep -o 'errors:\s*[0-9]\+' | awk '{print $2}')
    warning_count=$(echo "$error_stats" | grep -o 'warnings:\s*[0-9]\+' | awk '{print $2}')
  fi

  # Format bridge file paths as JSON objects
  local service_path="$BRIDGE_SERVICE"
  local client_path="$BRIDGE_CLIENT"
  local api_path="$BRIDGE_API"
  
  local service_source="global"
  local client_source="global"
  local api_source="global"
  
  if [[ "$service_path" == "$LOCAL_WEE_DIR"* ]]; then
    service_source="local"
  fi
  
  if [[ "$client_path" == "$LOCAL_WEE_DIR"* ]]; then
    client_source="local"
  fi
  
  if [[ "$api_path" == "$LOCAL_WEE_DIR"* ]]; then
    api_source="local"
  fi
  
  # Format JSON output
  cat << EOF
{
  "status": {
    "running": $is_running,
    "version": "${version:-unknown}",
    "connection_count": ${connection_count:-0},
    "uptime": ${uptime:-0},
    "memory_usage": "${memory_usage:-N/A}",
    "api_health": "${api_health:-unknown}",
    "api_latency": "${api_latency:-unknown}",
    "last_restart": "${last_restart:-unknown}",
    "errors": ${error_count:-0},
    "warnings": ${warning_count:-0},
    "file_integrity": "${file_integrity:-unknown}"
  },
  "files": {
    "service": {
      "path": "$service_path",
      "source": "$service_source"
    },
    "client": {
      "path": "$client_path",
      "source": "$client_source"
    },
    "api": {
      "path": "$api_path",
      "source": "$api_source"
    }
  }
}
EOF

  # Restore stderr
  exec 2>&1
}

# Show detailed bridge status
show_detailed_status() {
  echo -e "${CYAN}=========================================${NC}"
  echo -e "${CYAN}      WEE Cascade Bridge Status         ${NC}"
  echo -e "${CYAN}=========================================${NC}"
  
  # Check if bridge is running
  if is_bridge_running; then
    local pid=$(cat "$BRIDGE_PID_FILE" 2>/dev/null)
    local active_connections=$(get_connection_count)
    local uptime=$(get_bridge_uptime)
    local memory=$(get_memory_usage)
    local uptime_human
    
    # Convert seconds to human readable format
    if [ "$uptime" != "?" ]; then
      uptime_human=$(printf '%dd %dh %dm %ds' $((uptime/86400)) $((uptime%86400/3600)) $((uptime%3600/60)) $((uptime%60)))
    else
      uptime_human="?"
    fi
    
    local version=$(get_bridge_version)
    local api_health=$(check_api_health)
    local last_restart=$(get_last_restart)
    local error_stats=$(get_error_count)
    local file_integrity=$(check_file_integrity)
    
    echo -e "${GREEN}● Bridge Status: Running${NC}"
    echo -e "  PID: $pid"
    echo -e "  Version: $version"
    echo -e "  Port: $BRIDGE_PORT"
    echo -e "  Last Restart: $last_restart"
    echo -e "  API Health: $api_health"
    echo -e "  Active Connections: $active_connections"
    echo -e "  Uptime: $uptime_human"
    echo -e "  Memory Usage: $memory"
    echo -e "  Error Stats: $error_stats"
    echo -e "  File Integrity: $file_integrity"
    echo -e "  Log File: $BRIDGE_LOG_FILE"
    
    # Show recent activity
    echo -e "\n${CYAN}Recent Activity:${NC}"
    if [ -f "$BRIDGE_LOG_FILE" ]; then
      tail -n 5 "$BRIDGE_LOG_FILE" | while read -r line; do
        echo -e "  $line"
      done
    else
      echo -e "  ${YELLOW}No log file found${NC}"
    fi
    
    # Show bridge file locations with detailed fallback information
    echo -e "\n${CYAN}Bridge Files:${NC}"
    
    # Service file info with fallback status
    if [ -f "$LOCAL_WEE_DIR/src/cascade_bridge_service.js" ]; then
      echo -e "  Service: ${GREEN}Using local file${NC}"
      echo -e "    $BRIDGE_SERVICE"
    else
      echo -e "  Service: ${YELLOW}Using global file (local not found)${NC}"
      echo -e "    $BRIDGE_SERVICE"
      echo -e "    ${YELLOW}Local bridge service not found. Falling back to global.${NC}"
    fi
    
    # Client file info with fallback status
    if [ -f "$LOCAL_WEE_DIR/src/cascade_bridge_client.js" ]; then
      echo -e "  Client: ${GREEN}Using local file${NC}"
      echo -e "    $BRIDGE_CLIENT"
    else
      echo -e "  Client: ${YELLOW}Using global file (local not found)${NC}"
      echo -e "    $BRIDGE_CLIENT"
      echo -e "    ${YELLOW}Local bridge client not found. Falling back to global.${NC}"
    fi
    
    # API file info with fallback status
    if [ -f "$LOCAL_WEE_DIR/src/cascade_bridge_api.js" ]; then
      echo -e "  API: ${GREEN}Using local file${NC}"
      echo -e "    $BRIDGE_API"
    else
      echo -e "  API: ${YELLOW}Using global file (local not found)${NC}"
      echo -e "    $BRIDGE_API"
      echo -e "    ${YELLOW}Local bridge API not found. Falling back to global.${NC}"
    fi
    
    # Show summary
    local local_count=$(find "$LOCAL_WEE_DIR/src" -name "cascade_bridge_*.js" 2>/dev/null | wc -l)
    
    if [ -d "$LOCAL_WEE_DIR/src" ] && [ "$local_count" -gt 0 ]; then
      if [ "$local_count" -ge 6 ]; then
        echo -e "\n  ${GREEN}✅ Using local bridge files${NC}"
      else
        echo -e "\n  ${YELLOW}⚠️ Using mixed local/global files (some local files missing)${NC}"
        echo -e "     Run 'bridge-status --repair' to copy all bridge files locally"
      fi
    else
      echo -e "\n  ${YELLOW}⚠️ Using global bridge files (no local files found)${NC}"
      echo -e "     Run 'bridge-status --copy-local' to copy all bridge files locally"
    fi
    
  else
    local version=$(get_bridge_version)
    local file_integrity=$(check_file_integrity)
    
    echo -e "${RED}✖ Bridge Status: Not Running${NC}"
    echo -e "${YELLOW}ℹ️ To start the bridge, use: bridge-status --start${NC}"
    echo -e "  Version: $version"
    echo -e "  File Integrity: $file_integrity"
    
    # Always show bridge file paths, even when not running
    echo -e "\n${CYAN}Bridge Files:${NC}"
    
    # Service file info with fallback status
    if [ -f "$LOCAL_WEE_DIR/src/cascade_bridge_service.js" ]; then
      echo -e "  Service: ${GREEN}Using local file${NC}"
      echo -e "    $BRIDGE_SERVICE"
    else
      echo -e "  Service: ${YELLOW}Using global file (local not found)${NC}"
      echo -e "    $BRIDGE_SERVICE"
      echo -e "    ${YELLOW}Local bridge service not found. Falling back to global.${NC}"
    fi
    
    # Client file info with fallback status
    if [ -f "$LOCAL_WEE_DIR/src/cascade_bridge_client.js" ]; then
      echo -e "  Client: ${GREEN}Using local file${NC}"
      echo -e "    $BRIDGE_CLIENT"
    else
      echo -e "  Client: ${YELLOW}Using global file (local not found)${NC}"
      echo -e "    $BRIDGE_CLIENT"
      echo -e "    ${YELLOW}Local bridge client not found. Falling back to global.${NC}"
    fi
    
    # API file info with fallback status
    if [ -f "$LOCAL_WEE_DIR/src/cascade_bridge_api.js" ]; then
      echo -e "  API: ${GREEN}Using local file${NC}"
      echo -e "    $BRIDGE_API"
    else
      echo -e "  API: ${YELLOW}Using global file (local not found)${NC}"
      echo -e "    $BRIDGE_API"
      echo -e "    ${YELLOW}Local bridge API not found. Falling back to global.${NC}"
    fi
    
    # Show summary
    local local_count=$(find "$LOCAL_WEE_DIR/src" -name "cascade_bridge_*.js" 2>/dev/null | wc -l)
    
    if [ -d "$LOCAL_WEE_DIR/src" ] && [ "$local_count" -gt 0 ]; then
      if [ "$local_count" -ge 6 ]; then
        echo -e "\n  ${GREEN}✅ Using local bridge files${NC}"
      else
        echo -e "\n  ${YELLOW}⚠️ Using mixed local/global files (some local files missing)${NC}"
        echo -e "     Run 'bridge-status --repair' to copy all bridge files locally"
      fi
    else
      echo -e "\n  ${YELLOW}⚠️ Using global bridge files (no local files found)${NC}"
      echo -e "     Run 'bridge-status --copy-local' to copy all bridge files locally"
    fi
  fi
  
  echo -e "${CYAN}=========================================${NC}"
}

# Start the bridge
start_bridge() {
  if is_bridge_running; then
    echo -e "${YELLOW}ℹ️ Bridge is already running${NC}"
    return 0
  fi
  
  if [ ! -f "$BRIDGE_SERVICE" ]; then
    echo -e "${RED}✖ Bridge service file not found: $BRIDGE_SERVICE${NC}"
    echo -e "${YELLOW}ℹ️ Trying to repair...${NC}"
    repair_bridge_installation
    
    # Check again after repair
    if [ ! -f "$BRIDGE_SERVICE" ]; then
      echo -e "${RED}✖ Bridge service file still missing after repair attempt${NC}"
      return 1
    fi
  fi
  
  # Create bridge directory if it doesn't exist
  mkdir -p "$BRIDGE_DIR"
  
  echo -e "${BLUE}⏳ Starting bridge service...${NC}"
  nohup node "$BRIDGE_SERVICE" > "$BRIDGE_LOG_FILE" 2>&1 & 
  
  local pid=$!
  echo $pid > "$BRIDGE_PID_FILE"
  
  # Wait a moment for the server to start
  sleep 2
  
  if is_bridge_running; then
    echo -e "${GREEN}✅ Bridge started successfully (PID: $pid)${NC}"
  else
    echo -e "${RED}✖ Bridge failed to start${NC}"
    return 1
  fi
}

# Stop the bridge
stop_bridge() {
  if is_bridge_running; then
    local pid=$(cat "$BRIDGE_PID_FILE" 2>/dev/null)
    echo -e "${BLUE}⏳ Stopping bridge service (PID: $pid)...${NC}"
    
    kill $pid 2>/dev/null
    sleep 1
    
    # Check if process is still running
    if ps -p $pid >/dev/null; then
      echo -e "${YELLOW}⚠️ Bridge didn't stop gracefully, forcing...${NC}"
      kill -9 $pid 2>/dev/null
      sleep 1
    fi
    
    rm -f "$BRIDGE_PID_FILE"
    
    if ! is_bridge_running; then
      echo -e "${GREEN}✅ Bridge stopped successfully${NC}"
    else
      echo -e "${RED}✖ Failed to stop bridge${NC}"
      return 1
    fi
  else
    echo -e "${YELLOW}ℹ️ Bridge is not running${NC}"
  fi
}

# Restart the bridge
restart_bridge() {
  echo -e "${BLUE}⏳ Restarting bridge service...${NC}"
  stop_bridge
  sleep 1
  start_bridge
}

# Send a message through the bridge
send_message() {
  local recipient="$1"
  local message="$2"
  
  if ! is_bridge_running; then
    echo -e "${RED}✖ Bridge is not running. Start it first with --start${NC}"
    return 1
  fi
  
  if [ ! -f "$BRIDGE_CLIENT" ]; then
    echo -e "${RED}✖ Bridge client file not found: $BRIDGE_CLIENT${NC}"
    return 1
  fi
  
  if [ -z "$message" ]; then
    echo -e "${YELLOW}ℹ️ Message content required${NC}"
    echo -e "Usage: bridge-status --message \"Your message\""
    echo -e "       bridge-status --to <terminal_id> \"Your message\""
    return 1
  fi
  
  if [ -z "$recipient" ] || [ "$recipient" = "broadcast" ]; then
    echo -e "${BLUE}⏳ Broadcasting message to all terminals...${NC}"
    node -e "
      const client = require('$BRIDGE_CLIENT');
      client.sendMessage({
        type: 'broadcast',
        content: '$message'
      });
      setTimeout(() => process.exit(0), 1000);
    "
  else
    echo -e "${BLUE}⏳ Sending message to terminal $recipient...${NC}"
    node -e "
      const client = require('$BRIDGE_CLIENT');
      client.sendMessage({
        type: 'direct',
        recipient: '$recipient',
        content: '$message'
      });
      setTimeout(() => process.exit(0), 1000);
    "
  fi
  
  echo -e "${GREEN}✅ Message sent successfully${NC}"
}

# Repair common bridge installation issues
repair_bridge_installation() {
  echo -e "${BLUE}⏳ Repairing bridge installation...${NC}"
  
  # Check global installation
  if [ ! -d "$GLOBAL_WEE_DIR/src" ]; then
    echo -e "${RED}✖ Global WEE installation appears incomplete${NC}"
    echo -e "${YELLOW}ℹ️ Please run 'wee-doctor' or reinstall WEE${NC}"
    return 1
  fi
  
  # Check if bridge service exists globally
  if [ ! -f "$GLOBAL_WEE_DIR/src/cascade_bridge_service.js" ]; then
    echo -e "${RED}✖ Bridge service not found in global installation${NC}"
    echo -e "${YELLOW}ℹ️ Please run 'wee-doctor' or reinstall WEE${NC}"
    return 1
  fi
  
  # Ensure local .wee directory exists
  if [ ! -d "$LOCAL_WEE_DIR" ]; then
    echo -e "${YELLOW}ℹ️ Creating local .wee directory...${NC}"
    mkdir -p "$LOCAL_WEE_DIR/src"
  fi
  
  # Copy required bridge files from global to local
  if [ ! -d "$LOCAL_WEE_DIR/src" ]; then
    mkdir -p "$LOCAL_WEE_DIR/src"
  fi
  
  echo -e "${BLUE}⏳ Copying bridge files from global installation...${NC}"
  cp "$GLOBAL_WEE_DIR/src/cascade_bridge_service.js" "$LOCAL_WEE_DIR/src/" 2>/dev/null || true
  cp "$GLOBAL_WEE_DIR/src/cascade_bridge_client.js" "$LOCAL_WEE_DIR/src/" 2>/dev/null || true
  cp "$GLOBAL_WEE_DIR/src/cascade_bridge_api.js" "$LOCAL_WEE_DIR/src/" 2>/dev/null || true
  cp "$GLOBAL_WEE_DIR/src/cascade_bridge_lifecycle.js" "$LOCAL_WEE_DIR/src/" 2>/dev/null || true
  cp "$GLOBAL_WEE_DIR/src/cascade_bridge_client_auto.js" "$LOCAL_WEE_DIR/src/" 2>/dev/null || true
  cp "$GLOBAL_WEE_DIR/src/cascade_bridge_integration.js" "$LOCAL_WEE_DIR/src/" 2>/dev/null || true
  
  echo -e "${GREEN}✅ Repair completed${NC}"
}

# Show detailed information about bridge file paths
show_path_info() {
  echo -e "${CYAN}${BOLD}WEE Bridge File Paths${NC}"
  echo -e "${BLUE}=======================${NC}\n"
  
  # Check if local .wee directory exists
  if [ -d "$LOCAL_WEE_DIR" ]; then
    echo -e "${CYAN}Local project directory:${NC} $LOCAL_WEE_DIR"
  else
    echo -e "${YELLOW}⚠️ No local .wee directory found${NC}"
  fi
  
  echo -e "${CYAN}Global installation:${NC} $GLOBAL_WEE_DIR\n"
  
  # Check bridge service
  if [ -f "$LOCAL_WEE_DIR/src/cascade_bridge_service.js" ]; then
    echo -e "  ${CYAN}Service:${NC} ${GREEN}local${NC} - $BRIDGE_SERVICE"
  else
    echo -e "  ${CYAN}Service:${NC} ${YELLOW}global${NC} - $BRIDGE_SERVICE"
    echo -e "  Local bridge service not found"
    echo -e "  Falling back to global installation"
  fi
  
  # Check bridge client
  if [ -f "$LOCAL_WEE_DIR/src/cascade_bridge_client.js" ]; then
    echo -e "  ${CYAN}Client:${NC} ${GREEN}local${NC} - $BRIDGE_CLIENT"
  else
    echo -e "  ${CYAN}Client:${NC} ${YELLOW}global${NC} - $BRIDGE_CLIENT"
    echo -e "  Local bridge client not found"
    echo -e "  Falling back to global installation"
  fi
  
  # Check bridge API
  if [ -f "$LOCAL_WEE_DIR/src/cascade_bridge_api.js" ]; then
    echo -e "  ${CYAN}API:${NC} ${GREEN}local${NC} - $BRIDGE_API"
  else
    echo -e "  ${CYAN}API:${NC} ${YELLOW}global${NC} - $BRIDGE_API"
    echo -e "  Local bridge API not found"
    echo -e "  Falling back to global installation"
  fi
  
  # Show log file path
  echo -e "\n${CYAN}Log File:${NC} $BRIDGE_LOG_FILE"
  
  # Show PID file path
  echo -e "${CYAN}PID File:${NC} $BRIDGE_PID_FILE"
  
  # Show summary
  echo -e "\n${CYAN}Summary:${NC}"
  local_count=$(find "$LOCAL_WEE_DIR/src" -name "cascade_bridge_*.js" 2>/dev/null | wc -l)
  global_count=$(find "$GLOBAL_WEE_DIR/src" -name "cascade_bridge_*.js" 2>/dev/null | wc -l)
  
  if [ -d "$LOCAL_WEE_DIR/src" ] && [ "$local_count" -gt 0 ]; then
    if [ "$local_count" -ge 6 ]; then
      echo -e "${GREEN}✅ Using local bridge files${NC}"
    else
      echo -e "${YELLOW}⚠️ Using mixed local/global files (some local files missing)${NC}"
      echo -e "   Run 'bridge-status --repair' to copy all bridge files locally"
    fi
  else
    echo -e "${YELLOW}⚠️ Using global bridge files (no local files found)${NC}"
    echo -e "   Run 'bridge-status --copy-local' to copy all bridge files locally"
  fi
}

# Show message queue and pending communications
show_message_queue() {
  if ! is_bridge_running; then
    echo -e "${RED}✖ Bridge is not running. Start it first with --start${NC}"
    return 1
  fi
  
  if [ ! -f "$BRIDGE_API" ]; then
    echo -e "${RED}✖ Bridge API file not found: $BRIDGE_API${NC}"
    return 1
  fi
  
  echo -e "${CYAN}=========================================${NC}"
  echo -e "${CYAN}      WEE Cascade Bridge Message Queue    ${NC}"
  echo -e "${CYAN}=========================================${NC}"
  
  # Get queue status via API call
  local queue_result=$(curl -s "http://localhost:$BRIDGE_PORT/api/queue" 2>/dev/null)
  
  if [ -z "$queue_result" ] || [[ "$queue_result" == *"error"* ]]; then
    echo -e "${RED}✖ Failed to retrieve message queue data${NC}"
    echo -e "API Response: $queue_result"
    return 1
  fi
  
  # Parse queue information
  local queue_length=$(echo "$queue_result" | grep -o '"pendingMessages":[0-9]*' | cut -d ':' -f2)
  local processed_count=$(echo "$queue_result" | grep -o '"processedMessages":[0-9]*' | cut -d ':' -f2)
  local active_terminals=$(echo "$queue_result" | grep -o '"activeTerminals":[0-9]*' | cut -d ':' -f2)
  
  echo -e "Queue Status:"
  echo -e "  Pending Messages: ${YELLOW}$queue_length${NC}"
  echo -e "  Processed Messages: ${GREEN}$processed_count${NC}"
  echo -e "  Active Terminals: ${BLUE}$active_terminals${NC}"
  echo
  
  # Get pending messages
  local pending_messages=$(echo "$queue_result" | grep -o '"pending":\[.*\]' | sed 's/"pending"://g')
  
  if [ "$queue_length" -gt 0 ] && [ -n "$pending_messages" ]; then
    echo -e "Pending Messages:"
    
    # Use a temporary JS file to process messages
    local temp_js_file=$(mktemp)
    cat > "$temp_js_file" << 'EOF'
    try {
      const messages = JSON.parse(process.argv[1]);
      messages.forEach((msg, i) => {
        console.log(`  \x1b[35m[${i+1}]\x1b[0m Type: ${msg.type}, From: ${msg.source || 'system'}`);
        console.log(`      To: ${msg.recipient || 'broadcast'}`);
        console.log(`      Content: ${msg.content ? (msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content) : 'N/A'}`);
        if (msg.timestamp) {
          const date = new Date(msg.timestamp);
          console.log(`      Time: ${date.toLocaleString()}`);
        }
        console.log();
      });
    } catch (e) {
      console.error('Error parsing messages:', e.message);
      process.exit(1);
    }
EOF
    
    # Execute the JavaScript to format messages
    node "$temp_js_file" "$pending_messages"
    rm "$temp_js_file"
  else
    echo -e "${GREEN}No pending messages in queue${NC}"
  fi
  
  echo -e "${CYAN}=========================================${NC}"
}

# Copy bridge files from global to local without repair message
copy_local() {
  echo -e "${CYAN}${BOLD}Copying Bridge Files Locally${NC}"
  echo -e "${BLUE}==========================${NC}\n"
  
  # Create local directories if they don't exist
  mkdir -p "$LOCAL_WEE_DIR/src"
  mkdir -p "$LOCAL_WEE_DIR/cascade_bridge"
  
  # Copy bridge files
  echo -e "${BLUE}⏳ Copying bridge files to local project...${NC}"
  cp "$GLOBAL_WEE_DIR/src/cascade_bridge_service.js" "$LOCAL_WEE_DIR/src/" 2>/dev/null && echo -e "${GREEN}✓ Copied cascade_bridge_service.js${NC}" || echo -e "${RED}✗ Failed to copy cascade_bridge_service.js${NC}"
  cp "$GLOBAL_WEE_DIR/src/cascade_bridge_client.js" "$LOCAL_WEE_DIR/src/" 2>/dev/null && echo -e "${GREEN}✓ Copied cascade_bridge_client.js${NC}" || echo -e "${RED}✗ Failed to copy cascade_bridge_client.js${NC}"
  cp "$GLOBAL_WEE_DIR/src/cascade_bridge_api.js" "$LOCAL_WEE_DIR/src/" 2>/dev/null && echo -e "${GREEN}✓ Copied cascade_bridge_api.js${NC}" || echo -e "${RED}✗ Failed to copy cascade_bridge_api.js${NC}"
  cp "$GLOBAL_WEE_DIR/src/cascade_bridge_lifecycle.js" "$LOCAL_WEE_DIR/src/" 2>/dev/null && echo -e "${GREEN}✓ Copied cascade_bridge_lifecycle.js${NC}" || echo -e "${RED}✗ Failed to copy cascade_bridge_lifecycle.js${NC}"
  cp "$GLOBAL_WEE_DIR/src/cascade_bridge_client_auto.js" "$LOCAL_WEE_DIR/src/" 2>/dev/null && echo -e "${GREEN}✓ Copied cascade_bridge_client_auto.js${NC}" || echo -e "${RED}✗ Failed to copy cascade_bridge_client_auto.js${NC}"
  cp "$GLOBAL_WEE_DIR/src/cascade_bridge_integration.js" "$LOCAL_WEE_DIR/src/" 2>/dev/null && echo -e "${GREEN}✓ Copied cascade_bridge_integration.js${NC}" || echo -e "${RED}✗ Failed to copy cascade_bridge_integration.js${NC}"
  
  echo -e "\n${GREEN}✅ Bridge files copied locally${NC}"
}

# Show usage
show_usage() {
  echo -e "${CYAN}${BOLD}WEE Bridge Status and Control${NC}"
  echo -e "Usage: bridge-status [option]\n"
  echo -e "Options:"
  echo -e "  --start               Start the bridge"
  echo -e "  --stop                Stop the bridge"
  echo -e "  --restart             Restart the bridge"
  echo -e "  --status              Show bridge status (default)"
  echo -e "  --json                Show status in JSON format"
  echo -e "  --path-info           Show bridge file path information"
  echo -e "  --queue               Show message queue status"
  echo -e "  --message \"text\"     Broadcast message to all terminals"
  echo -e "  --to <id> \"text\"     Send message to specific terminal"
  echo -e "  --logs                Show bridge logs"
  echo -e "  --repair              Repair bridge installation"
  echo -e "  --copy-local          Copy bridge files to local project"
  echo -e "  --help                Show this help message"
  echo -e ""
  echo -e "Examples:"
  echo -e "  bridge-status                     # Show status"
  echo -e "  bridge-status --json              # Show status in JSON format"
  echo -e "  bridge-status --queue             # Show message queue"
  echo -e "  bridge-status --message \"Hello\"   # Broadcast message"
  echo -e "  bridge-status --to term1 \"Hello\"  # Send to specific terminal"
}

# Main execution
case "$1" in
  --start)
    start_bridge
    ;;
  --stop)
    stop_bridge
    ;;
  --restart)
    restart_bridge
    ;;
  --status)
    show_detailed_status
    ;;
  --json)
    show_json_status
    ;;
  --queue)
    show_message_queue
    ;;
  --message)
    send_message "broadcast" "$2"
    ;;
  --to)
    if [ -z "$2" ] || [ -z "$3" ]; then
      echo -e "${RED}✖ Missing terminal ID or message${NC}"
      echo -e "Usage: bridge-status --to <terminal_id> \"Your message\""
      exit 1
    fi
    send_message "$2" "$3"
    ;;
  --logs)
    if [ -f "$BRIDGE_LOG_FILE" ]; then
      cat "$BRIDGE_LOG_FILE"
    else
      echo -e "${RED}✖ Log file not found: $BRIDGE_LOG_FILE${NC}"
    fi
    ;;
  --tail)
    if [ -f "$BRIDGE_LOG_FILE" ]; then
      tail -f "$BRIDGE_LOG_FILE"
    else
      echo -e "${RED}✖ Log file not found: $BRIDGE_LOG_FILE${NC}"
    fi
    ;;
  --repair)
    repair_bridge_installation
    ;;
  --path-info)
    show_path_info
    ;;
  --copy-local)
    copy_local
    ;;
  --help)
    show_usage
    ;;
  *)
    # Default is to show status
    show_detailed_status
    ;;
esac

exit 0
