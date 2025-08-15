/**
 * Agent Collaboration Templates
 * 
 * Standardized templates for multi-agent workflows in the PAIRED ecosystem.
 * These templates define how different agents work together on complex tasks,
 * ensuring consistent coordination and optimal outcomes.
 */

class AgentCollaborationTemplates {
  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  /**
   * Initialize all collaboration templates
   */
  initializeTemplates() {
    // Core Development Workflows
    this.templates.set('code_review_workflow', this.createCodeReviewWorkflow());
    this.templates.set('feature_development', this.createFeatureDevelopmentWorkflow());
    this.templates.set('bug_investigation', this.createBugInvestigationWorkflow());
    this.templates.set('architecture_review', this.createArchitectureReviewWorkflow());
    
    // Project Management Workflows
    this.templates.set('project_kickoff', this.createProjectKickoffWorkflow());
    this.templates.set('sprint_planning', this.createSprintPlanningWorkflow());
    this.templates.set('release_preparation', this.createReleasePreparationWorkflow());
    
    // Quality Assurance Workflows
    this.templates.set('comprehensive_testing', this.createComprehensiveTestingWorkflow());
    this.templates.set('performance_optimization', this.createPerformanceOptimizationWorkflow());
    
    // UX and Design Workflows
    this.templates.set('design_review', this.createDesignReviewWorkflow());
    this.templates.set('user_research', this.createUserResearchWorkflow());
    
    // Analysis and Strategy Workflows
    this.templates.set('market_analysis', this.createMarketAnalysisWorkflow());
    this.templates.set('technical_debt_assessment', this.createTechnicalDebtWorkflow());
  }

  /**
   * Get a specific collaboration template
   */
  getTemplate(templateName) {
    return this.templates.get(templateName);
  }

  /**
   * Get all available templates
   */
  getAllTemplates() {
    return Array.from(this.templates.keys());
  }

  /**
   * Code Review Workflow Template
   * Agents: Dev (Lead), QA, Architecture, PM
   */
  createCodeReviewWorkflow() {
    return {
      name: 'Code Review Workflow',
      description: 'Comprehensive code review process with multiple agent perspectives',
      phases: [
        {
          phase: 'initial_review',
          lead_agent: 'dev_agent',
          participating_agents: ['dev_agent'],
          duration_estimate: '30-60 minutes',
          tasks: [
            'Code structure analysis',
            'Logic flow validation',
            'Coding standards compliance',
            'Security vulnerability scan'
          ],
          deliverables: ['initial_review_report.md']
        },
        {
          phase: 'quality_assessment',
          lead_agent: 'qa_agent',
          participating_agents: ['qa_agent', 'dev_agent'],
          duration_estimate: '45-90 minutes',
          tasks: [
            'Test coverage analysis',
            'Edge case identification',
            'Performance impact assessment',
            'Integration testing requirements'
          ],
          deliverables: ['quality_assessment_report.md', 'test_recommendations.md']
        },
        {
          phase: 'architecture_validation',
          lead_agent: 'architecture_agent',
          participating_agents: ['architecture_agent', 'dev_agent'],
          duration_estimate: '30-45 minutes',
          tasks: [
            'Design pattern compliance',
            'System integration impact',
            'Scalability considerations',
            'Technical debt assessment'
          ],
          deliverables: ['architecture_review.md']
        },
        {
          phase: 'project_alignment',
          lead_agent: 'pm_agent',
          participating_agents: ['pm_agent', 'dev_agent', 'qa_agent'],
          duration_estimate: '15-30 minutes',
          tasks: [
            'Requirements alignment check',
            'Timeline impact assessment',
            'Resource allocation review',
            'Stakeholder communication plan'
          ],
          deliverables: ['project_alignment_summary.md']
        }
      ],
      success_criteria: [
        'All agents approve the code changes',
        'No critical security vulnerabilities',
        'Test coverage meets project standards',
        'Architecture patterns are maintained',
        'Project timeline is not negatively impacted'
      ],
      escalation_triggers: [
        'Critical security vulnerability found',
        'Major architecture pattern violation',
        'Significant performance degradation',
        'Timeline impact exceeds threshold'
      ]
    };
  }

  /**
   * Feature Development Workflow Template
   * Agents: PM (Lead), Architecture, Dev, QA, UX
   */
  createFeatureDevelopmentWorkflow() {
    return {
      name: 'Feature Development Workflow',
      description: 'End-to-end feature development with cross-functional collaboration',
      phases: [
        {
          phase: 'requirements_analysis',
          lead_agent: 'pm_agent',
          participating_agents: ['pm_agent', 'analyst_agent', 'ux_expert_agent'],
          duration_estimate: '2-4 hours',
          tasks: [
            'Stakeholder requirements gathering',
            'User story creation and refinement',
            'Acceptance criteria definition',
            'Market research and competitive analysis'
          ],
          deliverables: ['requirements_document.md', 'user_stories.md', 'market_analysis.md']
        },
        {
          phase: 'design_and_architecture',
          lead_agent: 'architecture_agent',
          participating_agents: ['architecture_agent', 'ux_expert_agent', 'dev_agent'],
          duration_estimate: '3-6 hours',
          tasks: [
            'System architecture design',
            'UI/UX mockups and wireframes',
            'Technical specification creation',
            'Integration points identification'
          ],
          deliverables: ['technical_spec.md', 'architecture_diagrams/', 'ui_mockups/']
        },
        {
          phase: 'development_planning',
          lead_agent: 'dev_agent',
          participating_agents: ['dev_agent', 'qa_agent', 'pm_agent'],
          duration_estimate: '1-2 hours',
          tasks: [
            'Development task breakdown',
            'Testing strategy definition',
            'Timeline estimation',
            'Resource allocation planning'
          ],
          deliverables: ['development_plan.md', 'testing_strategy.md']
        },
        {
          phase: 'implementation',
          lead_agent: 'dev_agent',
          participating_agents: ['dev_agent', 'qa_agent'],
          duration_estimate: 'Variable (days to weeks)',
          tasks: [
            'Code implementation',
            'Unit testing',
            'Integration testing',
            'Code review cycles'
          ],
          deliverables: ['feature_code/', 'test_suites/', 'implementation_notes.md']
        },
        {
          phase: 'quality_validation',
          lead_agent: 'qa_agent',
          participating_agents: ['qa_agent', 'ux_expert_agent', 'dev_agent'],
          duration_estimate: '1-3 days',
          tasks: [
            'Comprehensive testing execution',
            'User experience validation',
            'Performance testing',
            'Security testing'
          ],
          deliverables: ['test_results.md', 'ux_validation_report.md', 'performance_report.md']
        },
        {
          phase: 'deployment_preparation',
          lead_agent: 'pm_agent',
          participating_agents: ['pm_agent', 'dev_agent', 'qa_agent'],
          duration_estimate: '4-8 hours',
          tasks: [
            'Deployment strategy finalization',
            'Rollback plan creation',
            'Stakeholder communication',
            'Documentation updates'
          ],
          deliverables: ['deployment_plan.md', 'rollback_procedures.md', 'release_notes.md']
        }
      ],
      success_criteria: [
        'All acceptance criteria met',
        'Quality gates passed',
        'Performance benchmarks achieved',
        'User experience validated',
        'Documentation complete'
      ],
      escalation_triggers: [
        'Timeline overrun exceeds 25%',
        'Critical quality issues discovered',
        'Major scope changes requested',
        'Resource constraints identified'
      ]
    };
  }

  /**
   * Bug Investigation Workflow Template
   * Agents: QA (Lead), Dev, Architecture
   */
  createBugInvestigationWorkflow() {
    return {
      name: 'Bug Investigation Workflow',
      description: 'Systematic approach to bug investigation and resolution',
      phases: [
        {
          phase: 'bug_triage',
          lead_agent: 'qa_agent',
          participating_agents: ['qa_agent', 'pm_agent'],
          duration_estimate: '15-30 minutes',
          tasks: [
            'Bug severity assessment',
            'Impact analysis',
            'Priority assignment',
            'Initial reproduction attempt'
          ],
          deliverables: ['bug_triage_report.md']
        },
        {
          phase: 'investigation',
          lead_agent: 'qa_agent',
          participating_agents: ['qa_agent', 'dev_agent'],
          duration_estimate: '1-4 hours',
          tasks: [
            'Detailed reproduction steps',
            'Environment analysis',
            'Log analysis',
            'Root cause hypothesis'
          ],
          deliverables: ['investigation_report.md', 'reproduction_steps.md']
        },
        {
          phase: 'root_cause_analysis',
          lead_agent: 'dev_agent',
          participating_agents: ['dev_agent', 'architecture_agent'],
          duration_estimate: '2-6 hours',
          tasks: [
            'Code analysis',
            'System interaction review',
            'Architecture impact assessment',
            'Fix strategy development'
          ],
          deliverables: ['root_cause_analysis.md', 'fix_strategy.md']
        },
        {
          phase: 'resolution_implementation',
          lead_agent: 'dev_agent',
          participating_agents: ['dev_agent', 'qa_agent'],
          duration_estimate: 'Variable',
          tasks: [
            'Fix implementation',
            'Unit testing',
            'Regression testing',
            'Code review'
          ],
          deliverables: ['fix_code/', 'test_results.md']
        }
      ],
      success_criteria: [
        'Bug is resolved and verified',
        'No regression introduced',
        'Root cause documented',
        'Prevention measures identified'
      ],
      escalation_triggers: [
        'Critical production impact',
        'Fix complexity exceeds estimates',
        'Multiple system components affected',
        'Customer escalation received'
      ]
    };
  }

  /**
   * Architecture Review Workflow Template
   * Agents: Architecture (Lead), Dev, QA, PM
   */
  createArchitectureReviewWorkflow() {
    return {
      name: 'Architecture Review Workflow',
      description: 'Comprehensive architecture review and validation process',
      phases: [
        {
          phase: 'architecture_analysis',
          lead_agent: 'architecture_agent',
          participating_agents: ['architecture_agent'],
          duration_estimate: '2-4 hours',
          tasks: [
            'Current architecture assessment',
            'Design pattern evaluation',
            'Scalability analysis',
            'Technical debt identification'
          ],
          deliverables: ['architecture_assessment.md', 'technical_debt_report.md']
        },
        {
          phase: 'development_impact_review',
          lead_agent: 'dev_agent',
          participating_agents: ['dev_agent', 'architecture_agent'],
          duration_estimate: '1-2 hours',
          tasks: [
            'Implementation feasibility',
            'Development effort estimation',
            'Risk assessment',
            'Alternative approaches evaluation'
          ],
          deliverables: ['development_impact_analysis.md']
        },
        {
          phase: 'quality_implications',
          lead_agent: 'qa_agent',
          participating_agents: ['qa_agent', 'architecture_agent'],
          duration_estimate: '1-2 hours',
          tasks: [
            'Testing strategy implications',
            'Quality gate adjustments',
            'Performance testing requirements',
            'Security considerations'
          ],
          deliverables: ['quality_implications_report.md']
        },
        {
          phase: 'project_alignment',
          lead_agent: 'pm_agent',
          participating_agents: ['pm_agent', 'architecture_agent', 'dev_agent'],
          duration_estimate: '30-60 minutes',
          tasks: [
            'Timeline impact assessment',
            'Resource requirement analysis',
            'Stakeholder communication plan',
            'Migration strategy development'
          ],
          deliverables: ['project_impact_summary.md', 'migration_plan.md']
        }
      ],
      success_criteria: [
        'Architecture improvements identified',
        'Implementation plan approved',
        'Quality standards maintained',
        'Project timeline preserved'
      ],
      escalation_triggers: [
        'Major architectural changes required',
        'Significant timeline impact',
        'Resource constraints identified',
        'Technical feasibility concerns'
      ]
    };
  }

  /**
   * Project Kickoff Workflow Template
   * Agents: PM (Lead), All Agents
   */
  createProjectKickoffWorkflow() {
    return {
      name: 'Project Kickoff Workflow',
      description: 'Comprehensive project initiation with all agent perspectives',
      phases: [
        {
          phase: 'project_charter',
          lead_agent: 'pm_agent',
          participating_agents: ['pm_agent', 'analyst_agent'],
          duration_estimate: '2-3 hours',
          tasks: [
            'Project objectives definition',
            'Stakeholder identification',
            'Success criteria establishment',
            'Initial risk assessment'
          ],
          deliverables: ['project_charter.md', 'stakeholder_matrix.md']
        },
        {
          phase: 'multi_agent_consultation',
          lead_agent: 'pm_agent',
          participating_agents: ['pm_agent', 'architecture_agent', 'dev_agent', 'qa_agent', 'ux_expert_agent', 'analyst_agent', 'scrum_master_agent'],
          duration_estimate: '3-4 hours',
          tasks: [
            'Technical feasibility assessment',
            'Quality requirements definition',
            'User experience considerations',
            'Market analysis insights',
            'Process framework selection'
          ],
          deliverables: ['technical_feasibility.md', 'quality_requirements.md', 'ux_considerations.md', 'market_insights.md', 'process_framework.md']
        },
        {
          phase: 'planning_synthesis',
          lead_agent: 'pm_agent',
          participating_agents: ['pm_agent', 'scrum_master_agent'],
          duration_estimate: '1-2 hours',
          tasks: [
            'Integrated project plan creation',
            'Timeline development',
            'Resource allocation',
            'Communication plan establishment'
          ],
          deliverables: ['integrated_project_plan.md', 'communication_plan.md']
        }
      ],
      success_criteria: [
        'Clear project objectives established',
        'All agents aligned on approach',
        'Realistic timeline created',
        'Risk mitigation strategies defined'
      ],
      escalation_triggers: [
        'Major disagreement between agents',
        'Technical feasibility concerns',
        'Resource availability issues',
        'Stakeholder alignment problems'
      ]
    };
  }

  /**
   * Sprint Planning Workflow Template
   * Agents: Scrum Master (Lead), PM, Dev, QA
   */
  createSprintPlanningWorkflow() {
    return {
      name: 'Sprint Planning Workflow',
      description: 'Agile sprint planning with multi-agent input',
      phases: [
        {
          phase: 'backlog_refinement',
          lead_agent: 'scrum_master_agent',
          participating_agents: ['scrum_master_agent', 'pm_agent'],
          duration_estimate: '1-2 hours',
          tasks: [
            'Backlog prioritization',
            'Story refinement',
            'Acceptance criteria review',
            'Dependencies identification'
          ],
          deliverables: ['refined_backlog.md', 'sprint_candidates.md']
        },
        {
          phase: 'capacity_planning',
          lead_agent: 'dev_agent',
          participating_agents: ['dev_agent', 'qa_agent', 'scrum_master_agent'],
          duration_estimate: '30-60 minutes',
          tasks: [
            'Team capacity assessment',
            'Story point estimation',
            'Technical complexity evaluation',
            'Testing effort estimation'
          ],
          deliverables: ['capacity_assessment.md', 'effort_estimates.md']
        },
        {
          phase: 'sprint_commitment',
          lead_agent: 'scrum_master_agent',
          participating_agents: ['scrum_master_agent', 'pm_agent', 'dev_agent', 'qa_agent'],
          duration_estimate: '30-45 minutes',
          tasks: [
            'Sprint goal definition',
            'Story selection finalization',
            'Task breakdown',
            'Definition of done confirmation'
          ],
          deliverables: ['sprint_plan.md', 'sprint_goal.md', 'task_breakdown.md']
        }
      ],
      success_criteria: [
        'Realistic sprint commitment made',
        'Clear sprint goal established',
        'All team members aligned',
        'Dependencies identified and managed'
      ],
      escalation_triggers: [
        'Capacity constraints identified',
        'Major dependencies discovered',
        'Technical complexity concerns',
        'Resource availability issues'
      ]
    };
  }

  /**
   * Additional workflow templates would continue here...
   * For brevity, I'm including the structure for the remaining templates
   */

  createReleasePreparationWorkflow() {
    return {
      name: 'Release Preparation Workflow',
      description: 'Comprehensive release preparation with quality gates',
      phases: [
        // Implementation details...
      ]
    };
  }

  createComprehensiveTestingWorkflow() {
    return {
      name: 'Comprehensive Testing Workflow',
      description: 'Multi-layered testing approach with agent coordination',
      phases: [
        // Implementation details...
      ]
    };
  }

  createPerformanceOptimizationWorkflow() {
    return {
      name: 'Performance Optimization Workflow',
      description: 'Systematic performance analysis and optimization',
      phases: [
        // Implementation details...
      ]
    };
  }

  createDesignReviewWorkflow() {
    return {
      name: 'Design Review Workflow',
      description: 'UX-focused design review with technical validation',
      phases: [
        // Implementation details...
      ]
    };
  }

  createUserResearchWorkflow() {
    return {
      name: 'User Research Workflow',
      description: 'User-centered research and validation process',
      phases: [
        // Implementation details...
      ]
    };
  }

  createMarketAnalysisWorkflow() {
    return {
      name: 'Market Analysis Workflow',
      description: 'Comprehensive market research and competitive analysis',
      phases: [
        // Implementation details...
      ]
    };
  }

  createTechnicalDebtWorkflow() {
    return {
      name: 'Technical Debt Assessment Workflow',
      description: 'Systematic technical debt identification and prioritization',
      phases: [
        // Implementation details...
      ]
    };
  }
}

module.exports = AgentCollaborationTemplates;
