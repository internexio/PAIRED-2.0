/**
 * PAIRED Interactive Demo Framework
 * 
 * Personalized demo experience that discovers prospect needs
 * and demonstrates relevant agent capabilities in real-time.
 */

class InteractiveDemoFramework {
  constructor() {
    this.prospectProfile = {
      industry: null,
      role: null,
      challenges: [],
      currentTools: [],
      workflowPainPoints: [],
      codingStyle: null, // vibe, professional, scientist
      techStack: []
    };
    
    this.industryAgentMappings = this.loadIndustryMappings();
    this.discoveryQuestions = this.loadDiscoveryQuestions();
  }

  /**
   * Load industry-specific agent team mappings
   */
  loadIndustryMappings() {
    return {
      'software_development': {
        agents: ['sherlock', 'alex', 'leonardo', 'edison', 'maya', 'marie', 'vince'],
        focus: 'Code quality, architecture, user experience'
      },
      'digital_marketing': {
        agents: ['content_strategist', 'brand_voice', 'analytics_expert', 'visual_designer', 'scheduler', 'community_manager'],
        focus: 'Content creation, engagement, performance optimization'
      },
      'ecommerce': {
        agents: ['product_manager', 'visual_merchandiser', 'copywriter', 'conversion_analyst', 'operations_coordinator', 'revenue_optimizer'],
        focus: 'Sales optimization, customer experience, operations'
      },
      'paid_advertising': {
        agents: ['campaign_strategist', 'ad_copywriter', 'bid_manager', 'keyword_researcher', 'performance_analyst', 'creative_director'],
        focus: 'ROI maximization, audience targeting, creative optimization'
      },
      'healthcare': {
        agents: ['clinical_coordinator', 'documentation_specialist', 'patient_liaison', 'treatment_planner', 'outcomes_analyst', 'compliance_officer'],
        focus: 'Patient care, compliance, operational efficiency'
      },
      'legal': {
        agents: ['case_strategist', 'document_drafter', 'research_analyst', 'deadline_manager', 'client_relations', 'practice_analyst'],
        focus: 'Case management, documentation, client service'
      },
      'real_estate': {
        agents: ['project_coordinator', 'design_reviewer', 'cost_estimator', 'quality_inspector', 'progress_tracker', 'stakeholder_manager'],
        focus: 'Project management, quality control, stakeholder communication'
      },
      'education': {
        agents: ['curriculum_designer', 'content_creator', 'media_producer', 'learning_analyst', 'student_support', 'outcome_assessor'],
        focus: 'Learning effectiveness, engagement, outcomes measurement'
      },
      'financial_services': {
        agents: ['portfolio_manager', 'research_analyst', 'risk_assessor', 'client_advisor', 'trade_executor', 'compliance_monitor'],
        focus: 'Risk management, compliance, client service'
      },
      'event_management': {
        agents: ['event_director', 'logistics_coordinator', 'experience_designer', 'marketing_manager', 'budget_controller', 'success_analyst'],
        focus: 'Experience creation, logistics, ROI measurement'
      }
    };
  }

  /**
   * Load discovery questions for different contexts
   */
  loadDiscoveryQuestions() {
    return {
      opening: [
        "What industry are you in, and what's your primary role?",
        "What does a typical day look like for you?",
        "What are your biggest daily challenges or time-consuming tasks?"
      ],
      software_specific: [
        "What's your coding style - are you more of a vibe coder, professional developer, or scientific researcher?",
        "What's your current tech stack?",
        "What development tools do you use daily?",
        "What frustrates you most about your current development workflow?"
      ],
      workflow_analysis: [
        "How do you currently handle [specific workflow they mentioned]?",
        "What tools do you use, and what frustrates you about them?",
        "Where do you spend the most time that feels repetitive or inefficient?",
        "What would your ideal workflow look like?"
      ],
      vision_questions: [
        "If you could have a perfect AI assistant team, what would they do?",
        "What would success look like for you with AI assistance?",
        "What's the biggest impact you'd want to see on your daily work?"
      ]
    };
  }

  /**
   * Start interactive demo with discovery
   */
  async startDemo() {
    console.log("🎭 Welcome to the PAIRED Interactive Demo Experience!");
    console.log("=====================================");
    console.log();
    
    // Phase 1: Discovery
    await this.conductDiscovery();
    
    // Phase 2: Agent Team Design
    await this.designCustomAgentTeam();
    
    // Phase 3: Live Simulation
    await this.simulateAgentTeam();
    
    // Phase 4: ROI Projection
    await this.projectROI();
    
    // Phase 5: Next Steps
    await this.proposeNextSteps();
  }

  /**
   * Conduct discovery conversation
   */
  async conductDiscovery() {
    console.log("🔍 DISCOVERY PHASE");
    console.log("Let's learn about your specific context and challenges...");
    console.log();
    
    // This would be interactive in a real implementation
    console.log("Demo Questions:");
    this.discoveryQuestions.opening.forEach((q, i) => {
      console.log(`${i + 1}. ${q}`);
    });
    
    console.log();
    console.log("Based on your responses, we'll customize the demo to your specific needs...");
  }

  /**
   * Design custom agent team based on discovery
   */
  async designCustomAgentTeam() {
    console.log("🎯 CUSTOM AGENT TEAM DESIGN");
    console.log("Based on what you've told me, here's how we'd design your agent team...");
    console.log();
    
    // Example for software development
    const industry = this.prospectProfile.industry || 'software_development';
    const mapping = this.industryAgentMappings[industry];
    
    console.log(`Industry Focus: ${mapping.focus}`);
    console.log("Recommended Agent Team:");
    
    mapping.agents.forEach((agent, i) => {
      console.log(`  ${i + 1}. ${this.formatAgentName(agent)} - ${this.getAgentDescription(agent)}`);
    });
    
    console.log();
    console.log("Each agent would be specifically trained on your industry's best practices and challenges.");
  }

  /**
   * Simulate the custom agent team in action
   */
  async simulateAgentTeam() {
    console.log("🎬 LIVE AGENT SIMULATION");
    console.log("Let me show you how your custom agent team would work together...");
    console.log();
    
    // This would show relevant agents solving their actual problems
    console.log("Scenario: [Based on their specific challenge mentioned in discovery]");
    console.log();
    
    // Show agents collaborating on their real problem
    console.log("Agent Collaboration in Progress...");
    console.log("(This would be a live demonstration of agents solving their specific challenge)");
  }

  /**
   * Project ROI and value
   */
  async projectROI() {
    console.log("📊 ROI PROJECTION");
    console.log("Based on your workflow, here's the projected impact:");
    console.log();
    
    console.log("Time Savings:");
    console.log("  • Daily task automation: 2-4 hours saved");
    console.log("  • Quality improvements: 30-50% reduction in errors");
    console.log("  • Decision speed: 60% faster with AI insights");
    console.log();
    
    console.log("Quantified Benefits:");
    console.log("  • Monthly time savings: $X,XXX value");
    console.log("  • Quality improvement value: $X,XXX");
    console.log("  • Competitive advantage: Priceless");
  }

  /**
   * Propose next steps
   */
  async proposeNextSteps() {
    console.log("🚀 NEXT STEPS");
    console.log("Here's how we can build your custom agent suite:");
    console.log();
    
    console.log("Phase 1: Core Team Development (2-3 weeks)");
    console.log("  • 3-4 core agents specific to your workflow");
    console.log("  • Integration with your existing tools");
    console.log("  • Initial training on your processes");
    console.log();
    
    console.log("Phase 2: Specialized Additions (2-3 weeks)");
    console.log("  • 2-3 specialized agents for advanced workflows");
    console.log("  • Advanced integrations and automations");
    console.log("  • Performance optimization");
    console.log();
    
    console.log("Phase 3: Continuous Optimization (Ongoing)");
    console.log("  • Learning from your usage patterns");
    console.log("  • Regular updates and improvements");
    console.log("  • New agent additions as needs evolve");
    console.log();
    
    console.log("Investment: Custom pricing based on your specific requirements");
    console.log("ROI Timeline: Typically 30-60 days to full value realization");
  }

  /**
   * Utility methods
   */
  formatAgentName(agent) {
    return agent.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  getAgentDescription(agent) {
    const descriptions = {
      'sherlock': 'Quality detective ensuring excellence',
      'alex': 'Strategic project coordination',
      'leonardo': 'Architectural vision and design',
      'edison': 'Persistent problem-solving',
      'maya': 'User experience optimization',
      'marie': 'Data analysis and insights',
      'vince': 'Team coordination and coaching',
      'content_strategist': 'Platform-specific content strategy',
      'brand_voice': 'Consistent messaging and tone',
      'analytics_expert': 'Performance tracking and optimization',
      // Add more as needed
    };
    
    return descriptions[agent] || 'Specialized domain expertise';
  }

  /**
   * Update prospect profile based on discovery
   */
  updateProspectProfile(key, value) {
    this.prospectProfile[key] = value;
  }

  /**
   * Get recommended agents for prospect
   */
  getRecommendedAgents() {
    const industry = this.prospectProfile.industry || 'software_development';
    return this.industryAgentMappings[industry];
  }
}

module.exports = InteractiveDemoFramework;

// CLI execution
if (require.main === module) {
  const demo = new InteractiveDemoFramework();
  demo.startDemo().catch(console.error);
}
