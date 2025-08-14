#!/bin/bash

# Vectorsem Agent Context Troubleshooting Script
# Diagnoses why agent naming protocol isn't working in vectorsem directory

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Emoji for visual feedback
CHECK="✅"
CROSS="❌"
WARNING="⚠️"
INFO="ℹ️"
DETECTIVE="🕵️"

echo -e "${BLUE}${DETECTIVE} Vectorsem Agent Context Troubleshooting${NC}"
echo -e "${BLUE}=============================================${NC}\n"

# Function to print status
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "pass" ]; then
        echo -e "${GREEN}${CHECK} ${message}${NC}"
    elif [ "$status" = "fail" ]; then
        echo -e "${RED}${CROSS} ${message}${NC}"
    elif [ "$status" = "warn" ]; then
        echo -e "${YELLOW}${WARNING} ${message}${NC}"
    else
        echo -e "${BLUE}${INFO} ${message}${NC}"
    fi
}

# Check if we're in vectorsem directory
if [[ ! "$PWD" == *"vectorsem"* ]]; then
    print_status "warn" "Not in vectorsem directory. Please run this from vectorsem project root."
    echo -e "${INFO} Current directory: $PWD"
    echo -e "${INFO} Expected: path containing 'vectorsem'"
    exit 1
fi

print_status "info" "Analyzing vectorsem directory: $PWD"
echo ""

# Check 1: Hidden files and directories that might interfere
echo -e "${BLUE}📋 Check 1: Hidden Files and Caching${NC}"
echo -e "${INFO} Scanning for potential caching files..."

# Check for Windsurf-specific cache files
windsurf_cache_files=(
    ".windsurf"
    ".windsurfrules"
    ".windsurf-cache"
    ".cascade"
    ".cascade-cache"
)

for file in "${windsurf_cache_files[@]}"; do
    if [ -e "$file" ]; then
        if [ -d "$file" ]; then
            file_count=$(find "$file" -type f 2>/dev/null | wc -l | tr -d ' ')
            print_status "warn" "Found directory: $file (contains $file_count files)"
        else
            print_status "warn" "Found file: $file"
        fi
    else
        print_status "pass" "No $file found"
    fi
done

# Check for PAIRED files
paired_files=(
    ".paired"
    ".pairedrules"
    ".paired-cache"
)

for file in "${paired_files[@]}"; do
    if [ -e "$file" ]; then
        if [ -d "$file" ]; then
            file_count=$(find "$file" -type f 2>/dev/null | wc -l | tr -d ' ')
            print_status "info" "Found PAIRED directory: $file (contains $file_count files)"
            
            # Check specific PAIRED files
            if [ -f "$file/windsurf_agent_types.yml" ]; then
                print_status "pass" "Agent definitions found in $file/"
            else
                print_status "fail" "Agent definitions MISSING from $file/"
            fi
        else
            print_status "info" "Found PAIRED file: $file"
        fi
    else
        print_status "warn" "No $file found"
    fi
done

echo ""

# Check 2: Global PAIRED installation status
echo -e "${BLUE}📋 Check 2: Global PAIRED Installation${NC}"
if [ -d "$HOME/.paired" ]; then
    print_status "pass" "Global PAIRED installation found"
    
    # Check if agent context injector exists globally
    if [ -f "$HOME/.paired/src/core/windsurf_agent_context_injector.js" ]; then
        print_status "pass" "Global agent context injector available"
    else
        print_status "fail" "Global agent context injector MISSING"
    fi
    
    # Check global agent definitions
    if [ -f "$HOME/.paired/templates/windsurf_agent_types.yml" ]; then
        print_status "pass" "Global agent definitions template available"
    else
        print_status "fail" "Global agent definitions template MISSING"
    fi
else
    print_status "fail" "Global PAIRED installation NOT found at ~/.paired"
fi

echo ""

# Check 3: Project-specific PAIRED initialization
echo -e "${BLUE}📋 Check 3: Project PAIRED Initialization${NC}"
if [ -f ".paired/windsurf_agent_types.yml" ]; then
    print_status "pass" "Project agent definitions exist"
    
    # Validate YAML structure
    if command -v python3 >/dev/null 2>&1; then
        if python3 -c "import yaml; yaml.safe_load(open('.paired/windsurf_agent_types.yml'))" 2>/dev/null; then
            print_status "pass" "Agent definitions YAML is valid"
            
            # Check for specific agents
            agents_found=0
            for agent in "sherlock_qa_agent" "alex_pm_agent" "leonardo_architecture_agent" "edison_dev_agent"; do
                if grep -q "$agent:" ".paired/windsurf_agent_types.yml"; then
                    agents_found=$((agents_found + 1))
                fi
            done
            print_status "info" "Found $agents_found/4 core agents in definitions"
        else
            print_status "fail" "Agent definitions YAML has syntax errors"
        fi
    fi
else
    print_status "fail" "Project agent definitions MISSING"
    print_status "info" "Expected: .paired/windsurf_agent_types.yml"
fi

if [ -f ".windsurfrules" ]; then
    print_status "pass" "Windsurf rules file exists"
    
    if grep -q "paired_agent_integration:" ".windsurfrules"; then
        print_status "pass" "PAIRED agent integration configured"
    else
        print_status "fail" "PAIRED agent integration NOT configured"
    fi
else
    print_status "fail" "Windsurf rules file MISSING"
    print_status "info" "Expected: .windsurfrules"
fi

echo ""

# Check 4: Windsurf IDE session cache
echo -e "${BLUE}📋 Check 4: Windsurf IDE Session State${NC}"
windsurf_cache_locations=(
    "$HOME/.config/windsurf"
    "$HOME/.windsurf"
    "$HOME/Library/Application Support/Windsurf"
    "$HOME/Library/Caches/Windsurf"
)

for cache_dir in "${windsurf_cache_locations[@]}"; do
    if [ -d "$cache_dir" ]; then
        print_status "warn" "Windsurf cache directory found: $cache_dir"
        if [ -w "$cache_dir" ]; then
            print_status "info" "Cache directory is writable (can be cleared if needed)"
        else
            print_status "warn" "Cache directory is not writable"
        fi
    fi
done

echo ""

# Check 5: Environment and PATH
echo -e "${BLUE}📋 Check 5: Environment Configuration${NC}"
if command -v paired-init >/dev/null 2>&1; then
    paired_init_path=$(which paired-init)
    print_status "pass" "paired-init command available: $paired_init_path"
else
    print_status "fail" "paired-init command NOT available in PATH"
fi

if [ -n "$PAIRED_HOME" ]; then
    print_status "info" "PAIRED_HOME environment variable: $PAIRED_HOME"
else
    print_status "warn" "PAIRED_HOME environment variable not set"
fi

echo ""

# Check 6: Recent paired-init activity
echo -e "${BLUE}📋 Check 6: Recent PAIRED Initialization${NC}"
if [ -f ".paired/init.log" ]; then
    last_init=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" ".paired/init.log" 2>/dev/null || stat -c "%y" ".paired/init.log" 2>/dev/null)
    print_status "info" "Last PAIRED initialization: $last_init"
else
    print_status "warn" "No PAIRED initialization log found"
fi

echo ""

# Recommendations
echo -e "${BLUE}🎯 Troubleshooting Recommendations${NC}"
echo -e "${BLUE}===================================${NC}"

echo -e "${YELLOW}⚠️  POTENTIAL ISSUES DETECTED:${NC}"

# Issue 1: Missing agent definitions
if [ ! -f ".paired/windsurf_agent_types.yml" ]; then
    echo -e "${RED}1. MISSING AGENT DEFINITIONS${NC}"
    echo "   Problem: .paired/windsurf_agent_types.yml not found"
    echo "   Solution: cp ~/.paired/templates/windsurf_agent_types.yml .paired/"
    echo ""
fi

# Issue 2: Missing Windsurf rules
if [ ! -f ".windsurfrules" ]; then
    echo -e "${RED}2. MISSING WINDSURF RULES${NC}"
    echo "   Problem: .windsurfrules not found"
    echo "   Solution: cp ~/.paired/templates/windsurfrules .windsurfrules"
    echo ""
fi

# Issue 3: Windsurf cache
windsurf_cache_exists=false
for cache_dir in "${windsurf_cache_locations[@]}"; do
    if [ -d "$cache_dir" ]; then
        windsurf_cache_exists=true
        break
    fi
done

if [ "$windsurf_cache_exists" = true ]; then
    echo -e "${YELLOW}3. WINDSURF IDE CACHE${NC}"
    echo "   Problem: Windsurf IDE may be caching old session context"
    echo "   Solution: Restart Windsurf IDE completely (Quit → Reopen)"
    echo "   Advanced: Clear Windsurf cache directories if issue persists"
    echo ""
fi

echo -e "${GREEN}🚀 RECOMMENDED RECOVERY STEPS:${NC}"
echo "1. Ensure agent definitions: cp ~/.paired/templates/windsurf_agent_types.yml .paired/"
echo "2. Ensure Windsurf rules: cp ~/.paired/templates/windsurfrules .windsurfrules"
echo "3. Completely quit and restart Windsurf IDE"
echo "4. Test agent context: node ~/.paired/src/cli/test-agent-context.js"
echo "5. If still failing, clear Windsurf cache and restart"

echo -e "\n${BLUE}📞 DIAGNOSTIC COMPLETE${NC}"
echo -e "${INFO} Run this script again after applying fixes to verify resolution"
