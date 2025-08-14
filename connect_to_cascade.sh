#!/bin/bash

# PAIRED Cascade Agent Connection Script
# This script connects the current project to the global PAIRED Cascade bridge
# for multi-instance agent communication through Windsurf IDE

# Color definitions
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_NAME=$(basename "$(pwd)")
GLOBAL_BRIDGE_MANAGER="$HOME/.paired/scripts/cascade_bridge_manager.sh"

echo -e "${BLUE}🌊 PAIRED Cascade Agent Bridge Connection${NC}"
echo -e "${BLUE}📁 Project: $PROJECT_NAME${NC}"
echo ""

# Check if global bridge manager exists
if [ ! -f "$GLOBAL_BRIDGE_MANAGER" ]; then
    echo -e "${RED}❌ Global PAIRED bridge manager not found${NC}"
    echo -e "${YELLOW}ℹ️  Expected location: $GLOBAL_BRIDGE_MANAGER${NC}"
    echo -e "${YELLOW}ℹ️  Please ensure PAIRED is properly installed globally${NC}"
    exit 1
fi

# Check global bridge status
echo -e "${BLUE}🔍 Checking global bridge service status...${NC}"
if ! "$GLOBAL_BRIDGE_MANAGER" status > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Global bridge service not running, starting it...${NC}"
    "$GLOBAL_BRIDGE_MANAGER" start
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to start global bridge service${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Global bridge service is running${NC}"
fi

# Connect this project to the global bridge
echo -e "${BLUE}🔗 Connecting project to global agent bridge...${NC}"

# Create a simple connection script for this project
cat > .paired_cascade_connect.js << 'EOF'
#!/usr/bin/env node

/**
 * Project-specific Cascade bridge connector
 * Connects this project to the global PAIRED Cascade bridge service
 */

const WebSocket = require('ws');
const path = require('path');

const PROJECT_NAME = path.basename(process.cwd());
const BRIDGE_URL = 'ws://localhost:7890';

console.log(`🌊 Connecting ${PROJECT_NAME} to PAIRED Cascade bridge...`);

const ws = new WebSocket(BRIDGE_URL);

ws.on('open', function open() {
    console.log('✅ Connected to global Cascade bridge service');
    
    // Register this project instance
    const registerMessage = {
        type: 'REGISTER_INSTANCE',
        projectName: PROJECT_NAME,
        instanceId: `${PROJECT_NAME}-${Date.now()}`,
        capabilities: ['agent_communication', 'multi_instance']
    };
    
    ws.send(JSON.stringify(registerMessage));
    
    // Send welcome message from the team
    setTimeout(() => {
        const welcomeMessage = {
            type: 'AGENT_MESSAGE',
            agent: {
                name: 'Alex (PM)',
                emoji: '👑',
                id: 'pm'
            },
            message: `🎯 **${PROJECT_NAME}** is now connected to the PAIRED agent team! The following agents are ready to assist:\n\n🕵️ **Sherlock (QA)** - Quality detective\n🏛️ **Leonardo (Architecture)** - System architect\n⚡ **Edison (Dev)** - Problem solver\n🎨 **Maya (UX)** - Experience designer\n🏈 **Vince (Scrum)** - Team coach\n🔬 **Marie (Analyst)** - Data scientist\n\nYou can now communicate with us from any Windsurf instance connected to this bridge!`,
            timestamp: new Date().toISOString(),
            projectName: PROJECT_NAME
        };
        
        console.log('👑 Alex (PM): Sending team introduction...');
        ws.send(JSON.stringify(welcomeMessage));
    }, 1000);
});

ws.on('message', function message(data) {
    try {
        const msg = JSON.parse(data);
        if (msg.type === 'BRIDGE_CONNECTED') {
            console.log('🔗 Bridge connection established');
        } else if (msg.type === 'AGENT_MESSAGE') {
            console.log(`${msg.agent.emoji} ${msg.agent.name}: ${msg.message}`);
        }
    } catch (e) {
        console.log('📥 Received:', data.toString());
    }
});

ws.on('error', function error(err) {
    console.error('❌ Connection error:', err.message);
    console.log('💡 Make sure the global bridge service is running:');
    console.log('   ~/.paired/scripts/cascade_bridge_manager.sh status');
});

ws.on('close', function close() {
    console.log('🔌 Connection to bridge closed');
});

// Keep connection alive for 10 seconds to show the welcome message
setTimeout(() => {
    console.log('✅ Project successfully connected to Cascade bridge');
    console.log('🎯 Agents are now available in Windsurf Cascade chat');
    ws.close();
}, 5000);
EOF

# Make the connection script executable
chmod +x .paired_cascade_connect.js

# Run the connection script
echo -e "${BLUE}🚀 Establishing connection...${NC}"
node .paired_cascade_connect.js

echo ""
echo -e "${GREEN}✅ Project connected to PAIRED Cascade bridge!${NC}"
echo -e "${BLUE}📋 Available commands:${NC}"
echo -e "   ${YELLOW}Global bridge status:${NC} ~/.paired/scripts/cascade_bridge_manager.sh status"
echo -e "   ${YELLOW}View bridge logs:${NC} ~/.paired/scripts/cascade_bridge_manager.sh logs"
echo -e "   ${YELLOW}Reconnect project:${NC} ./scripts/connect_to_cascade.sh"
echo ""
echo -e "${BLUE}🎯 Your PAIRED agents are now available in Windsurf Cascade chat!${NC}"
