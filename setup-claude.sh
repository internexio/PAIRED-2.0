#!/bin/bash
# Quick Claude Code Setup Script
# Run this to get started tonight

echo "🚀 Setting up Claude Code integration..."

# Check if API key is set
if [ -z "$CLAUDE_API_KEY" ]; then
    echo "❌ CLAUDE_API_KEY not set"
    echo "Get your API key from: https://console.anthropic.com/"
    echo "Then run: export CLAUDE_API_KEY='your-key-here'"
    exit 1
fi

# Make the script executable
chmod +x quick-claude-setup.js

echo "✅ Setup complete!"
echo ""
echo "🎯 Quick Commands:"
echo "  node quick-claude-setup.js                    # Analyze all PAIRED files"
echo "  node -e \"import('./quick-claude-setup.js').then(m => m.default)\"  # Interactive mode"
echo ""
echo "📁 Available PAIRED directories:"
ls -la | grep PAIRED
echo ""
echo "🔥 Ready to process $(find . -name '*.md' -path './PAIRED*' | wc -l) PAIRED documentation files!"
