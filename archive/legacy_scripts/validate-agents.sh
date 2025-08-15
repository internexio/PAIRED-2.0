#!/bin/bash

# PAIRED Agent Validation Script
# Fixes Maya's identified issue: No installation validation system

set -e  # Exit on any error

echo "🧪 Validating PAIRED agents..."
echo "=========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILED_AGENTS=()
PASSED_AGENTS=()

# Function to test agent
test_agent() {
    local agent_name=$1
    local agent_path=$2
    
    echo -n "Testing ${agent_name}_agent... "
    
    if [ ! -f "$agent_path" ]; then
        echo -e "${RED}❌ MISSING FILE${NC}"
        FAILED_AGENTS+=("$agent_name: File not found")
        return 1
    fi
    
    # Test basic syntax
    if node -c "$agent_path" 2>/dev/null; then
        # Test basic execution (with --help flag to avoid full execution)
        if timeout 10s node "$agent_path" --help >/dev/null 2>&1 || 
           timeout 10s node "$agent_path" --version >/dev/null 2>&1 || 
           timeout 10s node "$agent_path" --test-mode >/dev/null 2>&1; then
            echo -e "${GREEN}✅ OK${NC}"
            PASSED_AGENTS+=("$agent_name")
            return 0
        else
            echo -e "${YELLOW}⚠️ SYNTAX OK, EXECUTION ISSUES${NC}"
            FAILED_AGENTS+=("$agent_name: Execution failed")
            return 1
        fi
    else
        echo -e "${RED}❌ SYNTAX ERROR${NC}"
        FAILED_AGENTS+=("$agent_name: Syntax error")
        return 1
    fi
}

# Test core infrastructure
echo "🔍 Testing core infrastructure..."
if [ ! -f "src/core/base_agent.js" ]; then
    echo -e "${RED}❌ Critical: src/core/base_agent.js missing${NC}"
    FAILED_AGENTS+=("base_agent: Missing core infrastructure")
else
    echo -e "${GREEN}✅ Base agent infrastructure found${NC}"
fi

# Test all agents
echo ""
echo "🤖 Testing individual agents..."

# List of agents to test
AGENTS=(
    "analyst:src/agents/analyst_agent.js"
    "architecture:src/agents/architecture_agent.js"
    "dev:src/agents/dev_agent.js"
    "pm:src/agents/pm_agent.js"
    "qa:src/agents/qa_agent.js"
    "scrum_master:src/agents/scrum_master_agent.js"
    "ux_expert:src/agents/ux_expert_agent.js"
)

for agent_info in "${AGENTS[@]}"; do
    IFS=':' read -r agent_name agent_path <<< "$agent_info"
    test_agent "$agent_name" "$agent_path"
done

# Test CLI tools
echo ""
echo "🛠️ Testing CLI tools..."
CLI_TOOLS=(
    "logic-diagram:src/cli/logic-diagram.js"
    "paired_cli:src/cli/paired_cli.js"
)

for tool_info in "${CLI_TOOLS[@]}"; do
    IFS=':' read -r tool_name tool_path <<< "$tool_info"
    if [ -f "$tool_path" ]; then
        test_agent "$tool_name" "$tool_path"
    else
        echo -e "${YELLOW}⚠️ Optional tool $tool_name not found${NC}"
    fi
done

# Test dependencies
echo ""
echo "📦 Testing critical dependencies..."
CRITICAL_DEPS=("js-yaml" "chalk" "@babel/parser" "uuid")

for dep in "${CRITICAL_DEPS[@]}"; do
    if npm list "$dep" &> /dev/null; then
        echo -e "✅ $dep: ${GREEN}installed${NC}"
    else
        echo -e "❌ $dep: ${RED}missing${NC}"
        FAILED_AGENTS+=("dependency: $dep missing")
    fi
done

# Summary
echo ""
echo "📊 Validation Summary"
echo "===================="
echo -e "✅ Passed: ${GREEN}${#PASSED_AGENTS[@]}${NC}"
echo -e "❌ Failed: ${RED}${#FAILED_AGENTS[@]}${NC}"

if [ ${#PASSED_AGENTS[@]} -gt 0 ]; then
    echo ""
    echo "✅ Working agents:"
    for agent in "${PASSED_AGENTS[@]}"; do
        echo "   • $agent"
    done
fi

if [ ${#FAILED_AGENTS[@]} -gt 0 ]; then
    echo ""
    echo -e "${RED}❌ Issues found:${NC}"
    for issue in "${FAILED_AGENTS[@]}"; do
        echo "   • $issue"
    done
    echo ""
    echo "🔧 Suggested fixes:"
    echo "   1. Run: npm run install-deps"
    echo "   2. Check: npm run health"
    echo "   3. Repair: npm run repair"
    echo ""
    exit 1
else
    echo ""
    echo -e "${GREEN}🎉 All agents validated successfully!${NC}"
    echo ""
    echo "🚀 Ready to use PAIRED:"
    echo "   • Quick start: npm run quickstart"
    echo "   • Generate diagrams: npm run logic-diagram"
    echo "   • Run health check: npm run health"
    echo ""
fi
