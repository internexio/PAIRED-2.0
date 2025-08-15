#!/bin/bash

# Prepare Windsurf Ecosystem for Public Release
# This script removes project-specific data and creates a clean template

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧹 Preparing Windsurf Ecosystem for Public Release${NC}"
echo "=================================================="

# Backup current state
BACKUP_DIR="./windsurf-backup-$(date +%Y%m%d_%H%M%S)"
echo -e "${BLUE}📦 Creating backup at $BACKUP_DIR${NC}"
cp -r .paired "$BACKUP_DIR"
echo -e "${GREEN}✅ Backup created${NC}"

# Files and directories to remove (project-specific data)
CLEANUP_PATHS=(
    # Archives and old data
    ".paired/archive"
    ".paired/versions"
    
    # Project-specific memory and context
    ".paired/memory/ai_memory.md"
    ".paired/memory/reasoning_log.md"
    ".paired/memory/learning_insights.md"
    ".paired/memory/lint_cleanup_insights.md"
    ".paired/memory/meta_learning_strategy.md"
    ".paired/memory/learning_feedback_loops.md"
    ".paired/memory/type_improvement_insights.md"
    
    # Current project context
    ".paired/context"
    ".paired/contexts/context_discovery.md"
    ".paired/handoff/last_session.md"
    
    # Performance data
    ".paired/performance"
    
    # Project-specific logs
    ".paired/logs"
    
    # PAIRED project-specific files
    ".paired/knowledgeforge"
    
    # Project-specific agents
    ".paired/agents"
    
    # Temporary and cache files
    ".paired/.DS_Store"
    ".DS_Store"
)

# Remove project-specific files
echo -e "${BLUE}🗑️  Removing project-specific files...${NC}"
for path in "${CLEANUP_PATHS[@]}"; do
    if [ -e "$path" ]; then
        rm -rf "$path"
        echo -e "${GREEN}✅ Removed: $path${NC}"
    else
        echo -e "${YELLOW}⚠️  Not found: $path${NC}"
    fi
done

# Create clean template directories
echo -e "${BLUE}📁 Creating clean template directories...${NC}"
mkdir -p .paired/{memory,contexts,handoff,config,performance,logs}

# Create template files with placeholders
echo -e "${BLUE}📝 Creating template files...${NC}"

# Clean AI memory template
cat > .paired/memory/ai_memory.md << 'EOF'
# AI Memory and Learning Repository

This file accumulates AI learning and insights for the project.

## Architectural Decisions

## Patterns and Solutions

## Learning Outcomes

## Code Quality Insights

EOF

# Clean reasoning log template
cat > .paired/memory/reasoning_log.md << 'EOF'
# Reasoning Log

This file documents architectural decisions and reasoning for the project.

## Decision Log

### [Date] - Decision Title
- **Task**: Brief description
- **Considered Approaches**: Multiple options with pros/cons
- **Chosen Solution**: Selected approach
- **Rationale**: Decision reasoning
- **Potential Risks**: Risk assessment

EOF

# Clean context discovery template
cat > .paired/contexts/context_discovery.md << 'EOF'
# Context Discovery

Current project focus and development context.

## Current Focus

## Active Development Areas

## Key Priorities

## Context Notes

EOF

# Clean handoff template
cat > .paired/handoff/last_session.md << 'EOF'
# Session Handoff

## Last Session Summary

## Current State

## Next Steps

## Important Notes

EOF

# Clean project config template
cat > .paired/config/project_config.yml << 'EOF'
# Project Configuration
project:
  name: "Your Project Name"
  type: "web_app"  # or "library", "cli", etc.
  language: "python"  # primary language

development:
  environment: "development"
  testing_framework: "pytest"
  linting: true
  type_checking: true

ai_assistance:
  reasoning_required: true
  memory_updates: true
  context_preservation: true
EOF

# Update scripts to remove project-specific references
echo -e "${BLUE}🔧 Cleaning scripts...${NC}"

# Remove project-specific aliases from aliases.sh
if [ -f ".paired/scripts/aliases.sh" ]; then
    # Create a clean version without project-specific paths
    cat > .paired/scripts/aliases.sh << 'EOF'
#!/bin/bash
# Windsurf Development Aliases Template
# This file will be customized during project initialization

# Note: This is a template file. The actual aliases will be set up
# by the global Windsurf system at ~/.paired/aliases.sh

echo "⚠️  This is a template file. Run 'windsurf-init' to set up project aliases."
EOF
fi

# Clean up any Python cache files
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "*.pyc" -delete 2>/dev/null || true

# Create .gitignore for the repository
cat > .gitignore << 'EOF'
# Windsurf project-specific files (these will be generated)
.paired/memory/ai_memory.md
.paired/memory/reasoning_log.md
.paired/contexts/context_discovery.md
.paired/handoff/last_session.md
.paired/logs/
.paired/performance/
.paired/archive/
.paired/versions/

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual environments
venv/
env/
ENV/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log

# Temporary files
*.tmp
*.temp
EOF

echo ""
echo -e "${GREEN}🎉 Repository prepared for public release!${NC}"
echo ""
echo -e "${YELLOW}Summary of changes:${NC}"
echo "✅ Removed project-specific archives and memories"
echo "✅ Created clean template files"
echo "✅ Updated scripts to be template-friendly"
echo "✅ Added appropriate .gitignore"
echo "✅ Created backup at: $BACKUP_DIR"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Review the cleaned repository"
echo "2. Test the onboarding process: ./onboard.sh"
echo "3. Commit and push to GitHub"
echo "4. Update README with your actual GitHub URL"
echo ""
echo -e "${GREEN}The repository is now ready for public distribution! 🌊✨${NC}"
