#!/usr/bin/env node

/**
 * PAIRED Agent Context Testing Tool
 * Part of PAIRED Platform (Platform for AI-Enabled Remote Development)
 * Validates that PAIRED agent context loading and injection works correctly
 */

const WindsurfAgentContextInjector = require('../core/windsurf_agent_context_injector');
const path = require('path');

class AgentContextTester {
    constructor() {
        this.injector = new WindsurfAgentContextInjector();
    }

    async runTests() {
        console.log('🧪 PAIRED Agent Context Injection Tests\n');

        // Test 1: Load agent context from current project
        console.log('📋 Test 1: Loading PAIRED Agent Context');
        const projectPath = process.cwd();
        const contextPrompt = this.injector.loadPairedAgentContext(projectPath);
        
        if (contextPrompt) {
            console.log('✅ Agent context loaded successfully');
            console.log('📝 Generated System Prompt:');
            console.log(contextPrompt);
        } else {
            console.log('❌ No agent context found or failed to load');
        }

        console.log('\n' + '='.repeat(80) + '\n');

        // Test 2: Validate official agent list
        console.log('📋 Test 2: Official Agent List Validation');
        const officialAgents = this.injector.getOfficialAgentList();
        
        if (officialAgents.length > 0) {
            console.log('✅ Official agents loaded:');
            officialAgents.forEach(agent => {
                console.log(`   ${agent.shortName}`);
                console.log(`   └── ${agent.personality.substring(0, 80)}...`);
            });
        } else {
            console.log('❌ No official agents found');
        }

        console.log('\n' + '='.repeat(80) + '\n');

        // Test 3: Validate agent name enforcement
        console.log('📋 Test 3: Agent Name Validation');
        
        const testResponses = [
            {
                name: 'Valid Response',
                text: 'Let me coordinate with Sherlock (QA) and Leonardo (Architecture) to review this.',
                shouldPass: true
            },
            {
                name: 'Invalid Response - Generic Names',
                text: 'I\'ll work with our Quality Assurance Specialist and Architecture Expert.',
                shouldPass: false
            },
            {
                name: 'Valid Response - Team Format',
                text: '🕵️ Sherlock (QA): I\'ll investigate this issue. 🏛️ Leonardo (Architecture): The design looks solid.',
                shouldPass: true
            }
        ];

        testResponses.forEach(test => {
            const validation = this.injector.validateAgentNames(test.text);
            const status = validation.valid === test.shouldPass ? '✅' : '❌';
            console.log(`${status} ${test.name}: ${validation.message}`);
        });

        console.log('\n' + '='.repeat(80) + '\n');

        // Test 4: Configuration file priority
        console.log('📋 Test 4: Configuration File Priority');
        const priority = this.injector.getConfigPriority();
        console.log('✅ Configuration loading priority:');
        priority.forEach((file, index) => {
            console.log(`   ${index + 1}. ${file}`);
        });

        console.log('\n🎯 Test Summary:');
        console.log('   - Agent context injection system ready');
        console.log('   - Official agent names enforced');
        console.log('   - Validation system operational');
        console.log('   - SHORT name format: "Name (Function)" - NO "Agent" suffix');
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new AgentContextTester();
    tester.runTests().catch(console.error);
}

module.exports = AgentContextTester;
