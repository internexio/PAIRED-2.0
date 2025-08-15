#!/bin/bash
# PAIRED Auto-Start Script
# Smart startup: Connect if running, start if stopped

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PAIRED_ROOT="$(dirname "$SCRIPT_DIR")"
PID_DIR="$HOME/.paired/pids"

# Check if any agents are running
check_agents_status() {
    local running_count=0
    local agents=("alex" "sherlock" "edison" "leonardo" "maya" "vince" "marie")
    
    for agent in "${agents[@]}"; do
        local pid_file="$PID_DIR/agent_${agent}.pid"
        if [ -f "$pid_file" ]; then
            local pid=$(cat "$pid_file")
            if ps -p "$pid" > /dev/null 2>&1; then
                running_count=$((running_count + 1))
            fi
        fi
    done
    
    echo $running_count
}

# Main logic
echo -e "${BLUE}🤝 PAIRED Auto-Start${NC}"

running_agents=$(check_agents_status)

if [ "$running_agents" -eq 7 ]; then
    echo -e "${GREEN}✅ All 7 PAIRED agents already running - connecting...${NC}"
    # Agents are running, just connect/verify connection
    "$SCRIPT_DIR/start-agents.sh" --status
elif [ "$running_agents" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Some agents running ($running_agents/7) - restarting all for consistency...${NC}"
    # Some agents running, restart all for clean state
    "$SCRIPT_DIR/start-agents.sh" --stop
    sleep 2
    "$SCRIPT_DIR/start-agents.sh"
else
    echo -e "${BLUE}🚀 No agents running - starting all PAIRED agents...${NC}"
    # No agents running, start them
    "$SCRIPT_DIR/start-agents.sh"
fi

echo -e "${GREEN}🎉 PAIRED agents ready for collaboration!${NC}"
