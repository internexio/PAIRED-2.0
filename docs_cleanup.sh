#!/bin/bash

# PAIRED (Platform for AI-Enabled Remote Development) Documentation Cleanup & Organization Script
# 
# Reviews backup docs, archives outdated content, and creates clean current docs structure

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📚 PAIRED Documentation Cleanup${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Create docs directory structure
echo -e "${YELLOW}📁 Creating clean docs directory structure...${NC}"
mkdir -p docs/{current,archive,reference}
mkdir -p docs/current/{architecture,guides,api,troubleshooting}

# Analyze backup docs for relevance
echo -e "${YELLOW}🔍 Analyzing backup documentation...${NC}"

BACKUP_DIR="windsurf-backup-20250727_235936/docs"
CURRENT_DOCS="docs/current"
ARCHIVE_DOCS="docs/archive"
REFERENCE_DOCS="docs/reference"

echo -e "${GREEN}✅ Processing backup documentation...${NC}"

# Process relevant files to current docs
if [[ -f "$BACKUP_DIR/KNOWLEDGEFORGE_IMPLEMENTATION.md" ]]; then
    echo "📄 Moving KNOWLEDGEFORGE_IMPLEMENTATION.md to current docs"
    cp "$BACKUP_DIR/KNOWLEDGEFORGE_IMPLEMENTATION.md" "$CURRENT_DOCS/"
fi

if [[ -f "$BACKUP_DIR/INTEGRATION_PLAN.md" ]]; then
    echo "📄 Moving INTEGRATION_PLAN.md to current docs"
    cp "$BACKUP_DIR/INTEGRATION_PLAN.md" "$CURRENT_DOCS/"
fi

if [[ -f "$BACKUP_DIR/KNOWLEDGE_NAVIGATOR.md" ]]; then
    echo "📄 Moving KNOWLEDGE_NAVIGATOR.md to current docs"
    cp "$BACKUP_DIR/KNOWLEDGE_NAVIGATOR.md" "$CURRENT_DOCS/"
fi

if [[ -f "$BACKUP_DIR/TESTING_FRAMEWORK.md" ]]; then
    echo "📄 Moving TESTING_FRAMEWORK.md to current docs"
    cp "$BACKUP_DIR/TESTING_FRAMEWORK.md" "$CURRENT_DOCS/"
fi

if [[ -f "$BACKUP_DIR/CONTRIBUTING.md" ]]; then
    echo "📄 Moving CONTRIBUTING.md to current docs"
    cp "$BACKUP_DIR/CONTRIBUTING.md" "$CURRENT_DOCS/"
fi

if [[ -f "$BACKUP_DIR/ONBOARDING.md" ]]; then
    echo "📄 Moving ONBOARDING.md to current docs"
    cp "$BACKUP_DIR/ONBOARDING.md" "$CURRENT_DOCS/"
fi

# Process reference files
if [[ -f "$BACKUP_DIR/AGENT_SAFETY_PROTOCOLS.md" ]]; then
    echo "📚 Moving AGENT_SAFETY_PROTOCOLS.md to reference docs"
    cp "$BACKUP_DIR/AGENT_SAFETY_PROTOCOLS.md" "$REFERENCE_DOCS/"
fi

if [[ -f "$BACKUP_DIR/NOTIFICATION_SYSTEM_UPDATE.md" ]]; then
    echo "📚 Moving NOTIFICATION_SYSTEM_UPDATE.md to reference docs"
    cp "$BACKUP_DIR/NOTIFICATION_SYSTEM_UPDATE.md" "$REFERENCE_DOCS/"
fi

if [[ -f "$BACKUP_DIR/RULES_INTEGRATION.md" ]]; then
    echo "📚 Moving RULES_INTEGRATION.md to reference docs"
    cp "$BACKUP_DIR/RULES_INTEGRATION.md" "$REFERENCE_DOCS/"
fi

# Archive outdated files
echo "🗃️  Archiving outdated documentation..."
for file in "$BACKUP_DIR"/*.md; do
    if [[ -f "$file" ]]; then
        filename=$(basename "$file")
        # Only archive if not already processed above
        if [[ ! -f "$CURRENT_DOCS/$filename" && ! -f "$REFERENCE_DOCS/$filename" ]]; then
            echo "🗃️  Archiving $filename"
            cp "$file" "$ARCHIVE_DOCS/"
        fi
    fi
done

# Create updated documentation index
echo -e "${GREEN}✅ Creating documentation index...${NC}"
cat > docs/README.md << 'EOF'
# PAIRED (Platform for AI-Enabled Remote Development) Documentation

## 📚 **Documentation Structure**

### **Current Documentation** (`current/`)
Active documentation relevant to PAIRED development:

#### Architecture
- Core system design and architectural decisions
- Agent architecture and orchestration patterns
- Integration strategies and technical frameworks

#### Guides
- Implementation guides and how-to documents
- Setup and configuration instructions
- Development workflows and best practices

#### API
- API documentation and endpoint specifications
- Integration guides for external services
- Claude CLI integration documentation

#### Troubleshooting
- Common issues and solutions
- Debugging guides and diagnostic tools
- Performance optimization guides

### **Reference Documentation** (`reference/`)
Supporting documentation that provides context and background:
- Agent safety protocols
- Notification system specifications
- Rules integration guidelines

### **Archive** (`archive/`)
Historical documentation from previous projects (SEMalytics, VectorSEM):
- Preserved for reference but not actively maintained
- Contains outdated roadmaps and legacy architecture docs

## 🎯 **Quick Access**

### **For Developers:**
- `current/guides/` - Implementation instructions
- `current/architecture/` - System design documents
- `current/troubleshooting/` - Problem-solving resources

### **For Integration:**
- `current/api/` - API and integration documentation
- `reference/` - Supporting protocols and guidelines

### **For Historical Context:**
- `archive/` - Previous project documentation

## 📝 **Documentation Standards**

### **File Naming:**
- Use descriptive, lowercase names with underscores
- Include version or date when relevant
- Example: `claude_cli_integration_guide.md`

### **Document Structure:**
```markdown
---
title: Document Title
version: 1.0
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: [draft|review|approved|deprecated]
---

# Document Title

## Purpose
Brief description of document purpose and scope.

## Content
[Main content here]

## Related Documents
- Links to related documentation
- Dependencies and prerequisites
```

## 🔄 **Maintenance**

### **Regular Updates:**
- Review and update current documentation monthly
- Archive outdated documents when no longer relevant
- Ensure all guides include current version information

### **Quality Standards:**
- All documentation should be actionable
- Include troubleshooting sections where applicable
- Provide clear examples and code snippets
- Test all instructions before publishing

---

**Last Updated:** $(date)  
**Maintained By:** PAIRED Development Team
EOF

# Create current documentation structure with placeholders
echo -e "${GREEN}✅ Setting up current documentation structure...${NC}"

# Architecture documentation
cat > docs/current/architecture/README.md << 'EOF'
# Architecture Documentation

## 📐 **System Architecture**

### **Core Components:**
- Agent orchestration system
- Claude CLI integration layer
- Token optimization engine
- Unified agent architecture

### **Key Documents:**
- `system_overview.md` - High-level system design
- `agent_architecture.md` - Agent system specifications
- `integration_patterns.md` - Integration design patterns
- `orchestration_design.md` - Orchestration system architecture

### **Design Principles:**
- Dummy-proof operation and error handling
- Intelligent routing for token optimization
- Modular, extensible agent architecture
- Production-ready scalability and reliability

---
Ready for PAIRED architecture documentation!
EOF

# Guides documentation
cat > docs/current/guides/README.md << 'EOF'
# Implementation Guides

## 🛠️ **Available Guides**

### **Setup & Installation:**
- System setup and configuration
- Environment preparation
- Dependency management

### **Development:**
- Agent development guide
- Integration patterns
- Testing procedures

### **Integration:**
- Claude CLI integration guide
- External service integration
- API usage examples

### **Troubleshooting:**
- Common issues and solutions
- Diagnostic procedures
- Performance optimization

---
**Your Claude CLI integration guide belongs here!**
EOF

# API documentation
cat > docs/current/api/README.md << 'EOF'
# API Documentation

## 🔌 **API Reference**

### **Core APIs:**
- Orchestrator API
- Agent communication protocols
- Claude CLI integration interface

### **Integration Points:**
- External service APIs
- Webhook endpoints
- Authentication mechanisms

### **Documentation Standards:**
- OpenAPI/Swagger specifications
- Example requests and responses
- Error handling documentation
- Rate limiting and usage guidelines

---
Ready for PAIRED API documentation!
EOF

# Troubleshooting documentation
cat > docs/current/troubleshooting/README.md << 'EOF'
# Troubleshooting Documentation

## 🔧 **Troubleshooting Resources**

### **Common Issues:**
- Claude CLI integration problems
- Authentication and configuration issues
- Performance and latency problems
- Agent orchestration failures

### **Diagnostic Tools:**
- System health checks
- Performance monitoring
- Error analysis procedures
- Log analysis guides

### **Resolution Procedures:**
- Step-by-step problem resolution
- Escalation procedures
- Recovery and fallback strategies

---
**Your Claude CLI troubleshooting guide belongs here!**
EOF

# Create summary report
echo -e "${GREEN}✅ Generating cleanup summary...${NC}"
cat > docs/cleanup_summary.md << EOF
# Documentation Cleanup Summary

## 📊 **Cleanup Results**

### **Files Processed:**
- **Current Documentation**: $(find docs/current -name "*.md" | wc -l | tr -d ' ') files
- **Reference Documentation**: $(find docs/reference -name "*.md" 2>/dev/null | wc -l | tr -d ' ') files  
- **Archived Documentation**: $(find docs/archive -name "*.md" 2>/dev/null | wc -l | tr -d ' ') files

### **Current Documentation:**
$(find docs/current -name "*.md" -exec basename {} \; | sort)

### **Reference Documentation:**
$(find docs/reference -name "*.md" 2>/dev/null -exec basename {} \; | sort)

### **Archived Documentation:**
$(find docs/archive -name "*.md" 2>/dev/null -exec basename {} \; | sort)

## 🎯 **Next Steps**

### **Immediate:**
1. Place Claude CLI integration guide in \`docs/current/guides/\`
2. Update architecture documentation with PAIRED specifics
3. Create API documentation for orchestrator and agents

### **Short-term:**
1. Review and update current documentation for accuracy
2. Create comprehensive troubleshooting guides
3. Establish documentation maintenance procedures

### **Long-term:**
1. Integrate documentation with development workflow
2. Automate documentation generation where possible
3. Establish review and approval processes

## 📁 **Directory Structure:**
\`\`\`
docs/
├── README.md                    # Main documentation index
├── cleanup_summary.md           # This summary
├── current/                     # Active PAIRED docs
│   ├── architecture/           # System design documents
│   ├── guides/                 # Implementation guides
│   ├── api/                    # API documentation
│   └── troubleshooting/        # Problem-solving resources
├── reference/                  # Supporting documentation
└── archive/                    # Historical/outdated docs
\`\`\`

---
**Cleanup Completed:** $(date)
**Status:** Ready for PAIRED documentation
EOF

echo ""
echo -e "${BLUE}🎉 Documentation Cleanup Complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Summary:${NC}"
echo "✅ Clean docs directory structure created"
echo "✅ Backup documentation analyzed and classified"
echo "✅ Current documentation framework established"
echo "✅ Reference materials preserved"
echo "✅ Outdated content archived"
echo "✅ Documentation standards defined"
echo ""
echo -e "${YELLOW}🎯 Ready for your content:${NC}"
echo "📝 Claude CLI integration guide → docs/current/guides/"
echo "📐 Architecture updates → docs/current/architecture/"
echo "🔧 Troubleshooting guides → docs/current/troubleshooting/"
echo ""
echo -e "${YELLOW}📊 Quick Status:${NC}"
find docs -name "*.md" | wc -l | xargs echo "Total documentation files:"
echo ""
echo -e "${GREEN}Documentation is now organized and ready for PAIRED! 🚀${NC}"
