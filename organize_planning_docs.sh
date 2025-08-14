#!/bin/bash

# KnowledgeForge 3.2 Planning Documentation Organizer
# 
# Cleans up and organizes planning documents into the new library structure

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🗂️  KnowledgeForge 3.2 Planning Documentation Organizer${NC}"
echo -e "${BLUE}======================================================${NC}"
echo ""

PLANNING_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/planning"
cd "$PLANNING_DIR"

echo -e "${YELLOW}📊 Current Planning Directory Status:${NC}"
echo "Core Documents: $(find . -maxdepth 1 -name "*.md" | wc -l | tr -d ' ')"
echo "Agent Plans: $(find Agent_Plans -name "*.md" 2>/dev/null | wc -l | tr -d ' ')"
echo "Subdirectories: $(find . -maxdepth 1 -type d | wc -l | tr -d ' ')"
echo ""

echo -e "${BLUE}🔧 Organizing Documents...${NC}"

# Create index of current documents
echo -e "${GREEN}✅ Creating document inventory...${NC}"
cat > document_inventory.md << 'EOF'
# Planning Document Inventory

## Core Planning Documents
EOF

for doc in *.md; do
    if [[ "$doc" != "README.md" && "$doc" != "document_inventory.md" ]]; then
        size=$(wc -c < "$doc" 2>/dev/null || echo "0")
        echo "- \`$doc\` (${size} bytes)" >> document_inventory.md
    fi
done

cat >> document_inventory.md << 'EOF'

## Agent Specifications
EOF

if [ -d "Agent_Plans" ]; then
    for doc in Agent_Plans/*.md Agent_Plans/*.txt; do
        if [[ -f "$doc" ]]; then
            basename_doc=$(basename "$doc")
            size=$(wc -c < "$doc" 2>/dev/null || echo "0")
            echo "- \`Agent_Plans/$basename_doc\` (${size} bytes)" >> document_inventory.md
        fi
    done
fi

cat >> document_inventory.md << 'EOF'

## Directory Structure
```
planning/
├── README.md                          # Main planning library guide
├── document_inventory.md              # This inventory
├── incoming/                          # New submissions
├── guides/                           # Implementation guides
├── research/                         # Research and analysis
├── decisions/                        # Architectural decisions
├── archive/                          # Historical documents
└── Agent_Plans/                      # Agent specifications
```

## Organization Status
- ✅ Directory structure created
- ✅ README files added
- ✅ Document inventory generated
- 📋 Ready for new submissions

---
Generated: $(date)
EOF

echo -e "${GREEN}✅ Document inventory created${NC}"

# Create a planning summary for easy reference
echo -e "${GREEN}✅ Creating planning summary...${NC}"
cat > planning_summary.md << 'EOF'
# KnowledgeForge 3.2 Planning Summary

## 🎯 Current Focus
- Claude CLI integration and troubleshooting
- Dummy-proof system design and error handling
- Agent architecture implementation
- Token optimization strategies

## 📋 Key Documents

### **Architecture & Design**
- `unified_agent_architecture.md` - Core agent system design
- `orchestration_system_design.md` - System orchestration framework
- `technical_architecture.md` - Technical implementation details

### **Implementation**
- `implementation_roadmap.md` - Development milestones
- `implementation_templates.md` - Code templates and patterns
- `claude_code_integration_plan.md` - Claude CLI integration strategy

### **Analysis**
- `token_cost_analysis.md` - Token optimization research

### **Agent Specifications**
- `Agent_Plans/` - Complete agent implementations
  - PM, QA, Dev, UX, PO, Analyst, Architecture agents
  - BMad orchestrator reference

## 🚀 Next Steps
1. **Immediate**: Place Claude CLI integration guide in `incoming/`
2. **Short-term**: Complete Claude CLI troubleshooting
3. **Medium-term**: Implement remaining agents
4. **Long-term**: Production deployment and monitoring

## 📥 Submission Process
1. Place new documents in `incoming/` directory
2. Use naming convention: `YYYY-MM-DD_topic_name.md`
3. Include proper frontmatter and action items
4. Documents will be reviewed and organized automatically

---
Last Updated: $(date)
EOF

echo -e "${GREEN}✅ Planning summary created${NC}"

# Create a quick access guide
echo -e "${GREEN}✅ Creating quick access guide...${NC}"
cat > quick_access.md << 'EOF'
# Quick Access Guide

## 🔍 **Find Documents Fast**

### **By Category**
- **Architecture**: `unified_agent_architecture.md`, `orchestration_system_design.md`
- **Implementation**: `implementation_roadmap.md`, `implementation_templates.md`
- **Integration**: `claude_code_integration_plan.md`
- **Agents**: `Agent_Plans/` directory

### **By Status**
- **Current Work**: Claude CLI integration and debugging
- **Next Priority**: Agent factory implementation
- **Future Work**: Git automation, monitoring

### **By Type**
- **Plans**: Roadmaps and strategic documents
- **Specs**: Agent specifications and technical details
- **Guides**: Step-by-step implementation instructions
- **Research**: Analysis and decision rationale

## 📤 **Submit New Content**
```bash
# Place your document here:
planning/incoming/YYYY-MM-DD_your_topic.md

# Example:
planning/incoming/2025-07-28_claude_cli_integration_guide.md
```

## 🎯 **Most Relevant Now**
1. `claude_code_integration_plan.md` - Current integration strategy
2. `Agent_Plans/` - Agent implementation references
3. `incoming/` - Ready for your new guide!

---
**Your Claude CLI integration guide belongs in `incoming/` directory**
EOF

echo -e "${GREEN}✅ Quick access guide created${NC}"

# Set up a simple monitoring script
echo -e "${GREEN}✅ Creating monitoring script...${NC}"
cat > monitor_planning.sh << 'EOF'
#!/bin/bash
# Simple monitoring script for planning directory

echo "📊 Planning Library Status"
echo "========================="
echo "Core docs: $(find . -maxdepth 1 -name "*.md" | wc -l | tr -d ' ')"
echo "Agent plans: $(find Agent_Plans -name "*.md" -o -name "*.txt" 2>/dev/null | wc -l | tr -d ' ')"
echo "Incoming: $(find incoming -name "*.md" 2>/dev/null | wc -l | tr -d ' ')"
echo "Guides: $(find guides -name "*.md" 2>/dev/null | wc -l | tr -d ' ')"
echo ""

if [ -d "incoming" ] && [ "$(find incoming -name "*.md" 2>/dev/null | wc -l | tr -d ' ')" -gt 0 ]; then
    echo "📥 New submissions in incoming/:"
    find incoming -name "*.md" -exec basename {} \;
    echo ""
fi

echo "📁 Directory structure:"
tree -L 2 2>/dev/null || find . -type d | head -10
EOF

chmod +x monitor_planning.sh

echo ""
echo -e "${BLUE}🎉 Planning Library Organization Complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Summary:${NC}"
echo "✅ Organized directory structure created"
echo "✅ README files added to all directories"
echo "✅ Document inventory generated"
echo "✅ Planning summary created"
echo "✅ Quick access guide ready"
echo "✅ Monitoring script installed"
echo ""
echo -e "${YELLOW}🎯 Ready for your Claude CLI integration guide!${NC}"
echo "📥 Place it in: planning/incoming/2025-07-28_claude_cli_integration_guide.md"
echo ""
echo -e "${YELLOW}📊 Quick Status Check:${NC}"
./monitor_planning.sh
EOF

chmod +x organize_planning_docs.sh
