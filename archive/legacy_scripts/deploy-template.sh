#!/bin/bash
# PAIRED Universal Deployment Script
# Uses deployment-config.yml to deploy to any target environment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory and configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="$SOURCE_DIR/templates/deployment-config.yml"
TEMP_DIR="/tmp/paired-deploy-$(date +%s)"

# Default values
ENVIRONMENT="development"
DRY_RUN=false
FORCE=false
VERBOSE=false

# Usage function
usage() {
    echo -e "${BLUE}🚀 PAIRED Universal Deployment Script${NC}"
    echo "================================================="
    echo ""
    echo "Usage: $0 [OPTIONS] <environment>"
    echo ""
    echo "Environments:"
    echo "  development  - Deploy to development repository"
    echo "  production   - Deploy to production repository" 
    echo "  public       - Deploy to public release repository"
    echo ""
    echo "Options:"
    echo "  -d, --dry-run     Show what would be deployed without actually doing it"
    echo "  -f, --force       Force deployment without confirmation prompts"
    echo "  -v, --verbose     Enable verbose output"
    echo "  -c, --config FILE Use custom configuration file"
    echo "  -h, --help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 development                    # Deploy to development"
    echo "  $0 production --dry-run           # Preview production deployment"
    echo "  $0 public --force                 # Force deploy to public repo"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -c|--config)
            CONFIG_FILE="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        -*)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            usage
            exit 1
            ;;
        *)
            ENVIRONMENT="$1"
            shift
            ;;
    esac
done

# Validate configuration file exists
if [[ ! -f "$CONFIG_FILE" ]]; then
    echo -e "${RED}❌ Configuration file not found: $CONFIG_FILE${NC}"
    exit 1
fi

# Function to parse YAML (simple implementation for our needs)
parse_yaml() {
    local prefix=$1
    local file=$2
    local environment=$3
    
    # Extract environment-specific configuration
    python3 -c "
import yaml
import sys

try:
    with open('$file', 'r') as f:
        config = yaml.safe_load(f)
    
    env_config = config['deployment_environments']['$environment']
    
    print(f'REPO_URL={env_config[\"repository\"]}')
    print(f'BRANCH={env_config[\"branch\"]}')
    print(f'AUTO_DEPLOY={str(env_config[\"auto_deploy\"]).lower()}')
    print(f'INCLUDE_DEV_DOCS={str(env_config.get(\"include_dev_docs\", False)).lower()}')
    print(f'INCLUDE_TEST_FILES={str(env_config.get(\"include_test_files\", False)).lower()}')
    print(f'SANITIZE_DATA={str(env_config.get(\"sanitize_sensitive_data\", False)).lower()}')
    print(f'DESCRIPTION=\"{env_config[\"description\"]}\"')
    
except Exception as e:
    print(f'ERROR: {e}', file=sys.stderr)
    sys.exit(1)
"
}

# Load configuration
echo -e "${BLUE}🔧 Loading deployment configuration...${NC}"
if ! CONFIG_VARS=$(parse_yaml "" "$CONFIG_FILE" "$ENVIRONMENT"); then
    echo -e "${RED}❌ Failed to parse configuration for environment: $ENVIRONMENT${NC}"
    exit 1
fi

# Source the configuration variables
eval "$CONFIG_VARS"

# Validate required variables
if [[ -z "${REPO_URL:-}" ]]; then
    echo -e "${RED}❌ No repository URL configured for environment: $ENVIRONMENT${NC}"
    exit 1
fi

# Display deployment information
echo -e "${BLUE}🚀 PAIRED Universal Deployment${NC}"
echo "================================================="
echo -e "${CYAN}📂 Source Directory: $SOURCE_DIR${NC}"
echo -e "${CYAN}🎯 Target Repository: $REPO_URL${NC}"
echo -e "${CYAN}🌿 Target Branch: $BRANCH${NC}"
echo -e "${CYAN}🏷️  Environment: $ENVIRONMENT${NC}"
echo -e "${CYAN}📝 Description: $DESCRIPTION${NC}"
echo -e "${CYAN}🤖 Auto Deploy: $AUTO_DEPLOY${NC}"

if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "${YELLOW}🔍 DRY RUN MODE - No actual deployment will occur${NC}"
fi

echo ""

# Confirmation prompt (unless force or auto-deploy)
if [[ "$FORCE" != "true" && "$AUTO_DEPLOY" != "true" && "$DRY_RUN" != "true" ]]; then
    echo -e "${YELLOW}⚠️  This will deploy to $ENVIRONMENT environment${NC}"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🚫 Deployment cancelled${NC}"
        exit 0
    fi
fi

# Create temporary directory
echo -e "${BLUE}🔧 Creating temporary deployment directory...${NC}"
if [[ "$DRY_RUN" != "true" ]]; then
    mkdir -p "$TEMP_DIR"
    cd "$TEMP_DIR"
    
    # Initialize git repository
    git init
    git remote add origin "$REPO_URL"
else
    echo -e "${YELLOW}[DRY RUN] Would create: $TEMP_DIR${NC}"
fi

# Function to copy essential documentation with strategic content protection
copy_essential_docs() {
    echo -e "${BLUE}📚 Copying essential documentation (strategic content protection enabled)...${NC}"
    
    # Essential user documentation (always include in production)
    local essential_docs=(
        "docs/DEPLOYMENT_GUIDE.md"
        "docs/COMMANDS.md"
        "docs/QUICK_START.md"
        "docs/PROJECT_KNOWLEDGE_GUIDE.md"
        "docs/PROJECT_KNOWLEDGE_QUICKSTART.md"
        "docs/PHILOSOPHY.md"
        "docs/README.md"
    )
    
    # Strategic exclusions (NEVER include in public releases)
    local strategic_exclusions=(
        "planning"
        "CURRENT_PLAN.md"
        "CURRENT_SESSION_HANDOFF.md"
        "PROJECT_HANDOFF_"
        "MILESTONE_HANDOFF_"
        "ROADMAP.md"
        "roadmap.md"
        "CRITICAL_"
        "PAIRED_"
        "DEBUGGING_"
        "_ANALYSIS.md"
        "COLLABORATOR_"
        "HANDOFF"
    )
    
    # Security exclusions (API keys, secrets, credentials - NEVER include)
    local security_exclusions=(
        "*key*"
        "*KEY*"
        "*secret*"
        "*SECRET*"
        "*token*"
        "*TOKEN*"
        "*password*"
        "*PASSWORD*"
        ".env*"
        "config/secrets*"
        "credentials*"
        "*.pem"
        "*.p12"
        "*.pfx"
        "id_rsa*"
        "id_ed25519*"
    )
    
    # Copy essential documentation
    for doc in "${essential_docs[@]}"; do
        if [[ -f "$SOURCE_DIR/$doc" ]]; then
            if [[ "$DRY_RUN" == "true" ]]; then
                echo -e "${YELLOW}[DRY RUN] Would copy: $doc${NC}"
            else
                mkdir -p "$(dirname "$doc")"
                cp "$SOURCE_DIR/$doc" "$doc"
                echo -e "${GREEN}✅ Copied: $doc${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  Essential doc not found: $doc${NC}"
        fi
    done
    
    # Scan and exclude strategic and security content
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${YELLOW}[DRY RUN] Would scan for and exclude strategic content${NC}"
        for exclusion in "${strategic_exclusions[@]}"; do
            echo -e "${YELLOW}[DRY RUN] Would exclude strategic: *$exclusion*${NC}"
        done
        echo -e "${YELLOW}[DRY RUN] Would scan for and exclude security content${NC}"
        for exclusion in "${security_exclusions[@]}"; do
            echo -e "${YELLOW}[DRY RUN] Would exclude security: $exclusion${NC}"
        done
    else
        echo -e "${BLUE}🛡️  Applying strategic content protection...${NC}"
        local strategic_excluded=0
        local security_excluded=0
        
        # Remove any accidentally copied strategic files
        for exclusion in "${strategic_exclusions[@]}"; do
            if find . -name "*$exclusion*" -type f 2>/dev/null | grep -q .; then
                find . -name "*$exclusion*" -type f -delete 2>/dev/null
                strategic_excluded=$((strategic_excluded + 1))
            fi
        done
        
        echo -e "${BLUE}🔐 Applying security content protection...${NC}"
        
        # Remove any accidentally copied security files (API keys, secrets, etc.)
        for exclusion in "${security_exclusions[@]}"; do
            if find . -name "$exclusion" -type f 2>/dev/null | grep -q .; then
                find . -name "$exclusion" -type f -delete 2>/dev/null
                security_excluded=$((security_excluded + 1))
            fi
        done
        
        # Additional security scan for common patterns in file contents
        echo -e "${BLUE}🔍 Scanning file contents for security patterns...${NC}"
        local content_sanitized=0
        
        # Scan for API key patterns in remaining files
        if find . -name "*.js" -o -name "*.py" -o -name "*.md" -o -name "*.yml" -o -name "*.yaml" -o -name "*.json" | xargs grep -l -E "(api[_-]?key|secret[_-]?key|access[_-]?token)" 2>/dev/null | grep -q .; then
            echo -e "${RED}⚠️  WARNING: Found potential API keys in file contents!${NC}"
            find . -name "*.js" -o -name "*.py" -o -name "*.md" -o -name "*.yml" -o -name "*.yaml" -o -name "*.json" | xargs grep -l -E "(api[_-]?key|secret[_-]?key|access[_-]?token)" 2>/dev/null | while read -r file; do
                echo -e "${RED}🚨 Security risk in: $file${NC}"
                # Replace with placeholder
                sed -i.bak -E 's/(api[_-]?key|secret[_-]?key|access[_-]?token)[[:space:]]*[:=][[:space:]]*["\047][^"\047]+["\047]/\1: "YOUR_\U\1_HERE"/gi' "$file"
                rm -f "$file.bak"
                content_sanitized=$((content_sanitized + 1))
            done
        fi
        
        # Report protection results
        if [[ $strategic_excluded -gt 0 ]]; then
            echo -e "${GREEN}🛡️  Strategic Protection: Excluded $strategic_excluded files${NC}"
        fi
        
        if [[ $security_excluded -gt 0 ]]; then
            echo -e "${GREEN}🔐 Security Protection: Excluded $security_excluded files${NC}"
        fi
        
        if [[ $content_sanitized -gt 0 ]]; then
            echo -e "${GREEN}🔍 Content Sanitization: Sanitized $content_sanitized files${NC}"
        fi
        
        if [[ $strategic_excluded -eq 0 && $security_excluded -eq 0 && $content_sanitized -eq 0 ]]; then
            echo -e "${GREEN}🛡️  Protection Complete: No sensitive content found${NC}"
        fi
    fi
}

# Function to copy files based on rules
copy_deployment_files() {
    echo -e "${BLUE}📦 Copying deployment files...${NC}"
    
    # Essential core files (always included)
    local core_files=(
        "README.md"
        "LICENSE" 
        "install.sh"
        "bin/paired"
    )
    
    for file in "${core_files[@]}"; do
        if [[ -f "$SOURCE_DIR/$file" ]]; then
            if [[ "$DRY_RUN" == "true" ]]; then
                echo -e "${YELLOW}[DRY RUN] Would copy: $file${NC}"
            else
                mkdir -p "$(dirname "$file")"
                cp "$SOURCE_DIR/$file" "$file"
                echo -e "${GREEN}✅ Copied: $file${NC}"
            fi
        fi
    done
    
    # Copy src directory
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${YELLOW}[DRY RUN] Would copy: src/ directory${NC}"
    else
        cp -r "$SOURCE_DIR/src" .
        echo -e "${GREEN}✅ Copied: src/ directory${NC}"
    fi
    
    # Copy templates
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${YELLOW}[DRY RUN] Would copy: templates/ directory${NC}"
    else
        cp -r "$SOURCE_DIR/templates" .
        echo -e "${GREEN}✅ Copied: templates/ directory${NC}"
    fi
    
    # Copy essential documentation (strategic content protection)
    copy_essential_docs
    
    # Conditional files based on environment
    if [[ "$INCLUDE_DEV_DOCS" == "true" && -d "$SOURCE_DIR/docs/development" ]]; then
        if [[ "$DRY_RUN" == "true" ]]; then
            echo -e "${YELLOW}[DRY RUN] Would copy: docs/development/${NC}"
        else
            mkdir -p docs
            cp -r "$SOURCE_DIR/docs/development" docs/
            echo -e "${GREEN}✅ Copied: docs/development/${NC}"
        fi
    fi
    
    if [[ "$INCLUDE_TEST_FILES" == "true" && -d "$SOURCE_DIR/test" ]]; then
        if [[ "$DRY_RUN" == "true" ]]; then
            echo -e "${YELLOW}[DRY RUN] Would copy: test/ directory${NC}"
        else
            cp -r "$SOURCE_DIR/test" .
            echo -e "${GREEN}✅ Copied: test/ directory${NC}"
        fi
    fi
}

# Function to sanitize files if required
sanitize_files() {
    if [[ "$SANITIZE_DATA" == "true" ]]; then
        echo -e "${BLUE}🧹 Sanitizing sensitive data...${NC}"
        
        if [[ "$DRY_RUN" == "true" ]]; then
            echo -e "${YELLOW}[DRY RUN] Would sanitize files for production${NC}"
        else
            # Remove debug statements
            find . -name "*.js" -type f -exec sed -i.bak 's/console\.log.*;//g' {} \;
            find . -name "*.js" -type f -exec sed -i.bak 's/debugger;//g' {} \;
            
            # Replace hardcoded paths
            find . -type f -exec sed -i.bak 's|/Users/davidpedersen|$HOME|g' {} \;
            
            # Remove backup files
            find . -name "*.bak" -delete
            
            echo -e "${GREEN}✅ Files sanitized${NC}"
        fi
    fi
}

# Function to create deployment commit
create_deployment_commit() {
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${YELLOW}[DRY RUN] Would create deployment commit${NC}"
        return
    fi
    
    echo -e "${BLUE}📝 Creating deployment commit...${NC}"
    
    # Generate version
    VERSION=$(date +"%Y.%m.%d-%H%M")
    
    # Add all files
    git add .
    
    # Create commit
    git commit -m "🚀 PAIRED Deployment - $ENVIRONMENT ($VERSION)

Environment: $ENVIRONMENT
Repository: $REPO_URL
Branch: $BRANCH
Timestamp: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

Deployment Configuration:
- Include Dev Docs: $INCLUDE_DEV_DOCS
- Include Test Files: $INCLUDE_TEST_FILES  
- Sanitize Data: $SANITIZE_DATA

Generated by: PAIRED Universal Deployment Script"

    echo -e "${GREEN}✅ Deployment commit created${NC}"
}

# Function to push deployment
push_deployment() {
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${YELLOW}[DRY RUN] Would push to: $REPO_URL ($BRANCH)${NC}"
        return
    fi
    
    echo -e "${BLUE}🚀 Pushing deployment...${NC}"
    
    if git push origin "$BRANCH"; then
        echo -e "${GREEN}✅ Deployment successful!${NC}"
    else
        echo -e "${RED}❌ Deployment failed!${NC}"
        exit 1
    fi
}

# Execute deployment steps
copy_deployment_files
sanitize_files

if [[ "$DRY_RUN" != "true" ]]; then
    create_deployment_commit
    push_deployment
    
    # Cleanup
    echo -e "${BLUE}🧹 Cleaning up temporary files...${NC}"
    cd /
    rm -rf "$TEMP_DIR"
fi

# Success message
echo ""
echo -e "${GREEN}🎉 PAIRED Deployment Complete!${NC}"
echo "================================================="
echo -e "${CYAN}Environment: $ENVIRONMENT${NC}"
echo -e "${CYAN}Repository: $REPO_URL${NC}"
echo -e "${CYAN}Branch: $BRANCH${NC}"

if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "${YELLOW}Note: This was a dry run. No actual deployment occurred.${NC}"
fi

echo ""
echo -e "${BLUE}🔗 Repository URL: $REPO_URL${NC}"
echo ""
