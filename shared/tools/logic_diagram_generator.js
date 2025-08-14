/**
 * PAIRED Logic Diagram Generator
 * 
 * Integrates LogicAnalyzer with XMindGenerator to create
 * visual diagrams of code logic, decision trees, and complex processes
 */

const { LogicAnalyzer } = require('./logic_analyzer');
const { MultiFormatGenerator } = require('./multi_format_generator');
const path = require('path');
const fs = require('fs').promises;

class LogicDiagramGenerator {
    constructor() {
        this.analyzer = new LogicAnalyzer();
        this.formatGenerator = new MultiFormatGenerator();
    }

    /**
     * Generate logic diagrams for entire codebase
     */
    async generateCodebaseLogicDiagram(rootPath, options = {}) {
        const {
            outputDir = './diagrams',
            format = 'both', // 'xmind', 'json', 'both'
            focusOn = 'all',
            maxComplexity = 10,
            groupBy = 'file', // 'file', 'type', 'complexity'
            title = 'Codebase Logic Analysis'
        } = options;

        console.log('🔍 Analyzing codebase logic patterns...');
        
        // Analyze the codebase
        const analysis = await this.analyzer.analyzeCodebase(rootPath, {
            extensions: ['.js', '.ts', '.jsx', '.tsx'],
            excludeDirs: ['node_modules', '.git', 'dist', 'build', '.windsurf']
        });

        console.log(`📊 Found ${analysis.summary.totalFiles} files with ${analysis.summary.totalPatterns} logic patterns`);

        // Generate different types of diagrams
        const diagrams = await this.generateMultipleDiagrams(analysis, options);

        // Ensure output directory exists
        await fs.mkdir(outputDir, { recursive: true });

        // Export diagrams
        const results = [];
        for (const diagram of diagrams) {
            const result = await this.exportDiagram(diagram, outputDir, format);
            results.push(result);
        }

        // Generate summary report
        const summary = await this.generateSummaryReport(analysis, results, outputDir);

        return {
            analysis,
            diagrams: results,
            summary
        };
    }

    /**
     * Generate multiple focused diagrams
     */
    async generateMultipleDiagrams(analysis, options) {
        const diagrams = [];

        // 1. Decision Trees Overview
        const decisionDiagram = this.analyzer.generateLogicDiagram(analysis, {
            title: 'Decision Trees & Conditional Logic',
            focusOn: 'decisions',
            maxComplexity: options.maxComplexity
        });
        decisionDiagram.agent = 'architecture';
        decisionDiagram.layout = 'hierarchical';
        diagrams.push(decisionDiagram);

        // 2. Logic Flows
        const flowDiagram = this.analyzer.generateLogicDiagram(analysis, {
            title: 'Function Logic Flows',
            focusOn: 'flows',
            maxComplexity: options.maxComplexity
        });
        flowDiagram.agent = 'dev';
        flowDiagram.layout = 'timeline';
        diagrams.push(flowDiagram);

        // 3. Complex Processes (Loops, Async)
        const processDiagram = this.analyzer.generateLogicDiagram(analysis, {
            title: 'Complex Processes & Loops',
            focusOn: 'processes',
            maxComplexity: options.maxComplexity
        });
        processDiagram.agent = 'qa';
        processDiagram.layout = 'radial';
        diagrams.push(processDiagram);

        // 4. High Complexity Areas
        const complexityDiagram = this.generateComplexityHeatmap(analysis);
        diagrams.push(complexityDiagram);

        // 5. Error Handling Patterns
        const errorDiagram = this.generateErrorHandlingDiagram(analysis);
        diagrams.push(errorDiagram);

        return diagrams;
    }

    /**
     * Generate complexity heatmap
     */
    generateComplexityHeatmap(analysis) {
        const heatmap = {
            title: 'Code Complexity Heatmap',
            type: 'complexity_analysis',
            agent: 'qa',
            layout: 'radial',
            nodes: []
        };

        // Sort files by complexity
        const sortedFiles = analysis.files
            .sort((a, b) => b.complexity - a.complexity)
            .slice(0, 20); // Top 20 most complex files

        sortedFiles.forEach(file => {
            const complexityLevel = this.getComplexityLevel(file.complexity);
            
            heatmap.nodes.push({
                title: path.basename(file.file),
                type: 'file',
                status: complexityLevel,
                metadata: {
                    path: file.file,
                    complexity: file.complexity,
                    patterns: file.totalPatterns,
                    functions: file.functions.length
                },
                children: file.patterns.decisionTrees
                    .filter(tree => tree.complexity > 3)
                    .map(tree => ({
                        title: `${tree.subtype}: Complexity ${tree.complexity}`,
                        type: 'decision',
                        status: this.getComplexityLevel(tree.complexity)
                    }))
            });
        });

        return heatmap;
    }

    /**
     * Generate error handling diagram
     */
    generateErrorHandlingDiagram(analysis) {
        const errorDiagram = {
            title: 'Error Handling Patterns',
            type: 'error_analysis',
            agent: 'qa',
            layout: 'hierarchical',
            nodes: []
        };

        analysis.files.forEach(file => {
            if (file.patterns.errorHandling.length > 0) {
                const fileNode = {
                    title: path.basename(file.file),
                    type: 'file',
                    children: file.patterns.errorHandling.map(error => ({
                        title: `Try/Catch at line ${error.location.startLine}`,
                        type: 'error_handler',
                        metadata: {
                            hasCatch: !!error.catchBlock,
                            hasFinally: !!error.finallyBlock,
                            location: error.location
                        }
                    }))
                };
                errorDiagram.nodes.push(fileNode);
            }
        });

        return errorDiagram;
    }

    /**
     * Export diagram in specified format
     */
    async exportDiagram(diagram, outputDir, format) {
        const sanitizedTitle = diagram.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const timestamp = new Date().toISOString().slice(0, 10);
        const baseFilename = `${sanitizedTitle}_${timestamp}`;

        const result = {
            title: diagram.title,
            files: []
        };

        // Generate diagrams using multi-format generator
        const formatResults = await this.formatGenerator.generateDiagram(diagram, {
            format: format,
            outputDir: outputDir,
            filename: baseFilename,
            title: diagram.title,
            type: diagram.type,
            layout: diagram.layout,
            agent: diagram.agent
        });

        // Add all generated files to result
        result.files = formatResults.map(formatResult => ({
            type: formatResult.type,
            path: formatResult.path
        }));

        return result;
    }

    /**
     * Generate summary report
     */
    async generateSummaryReport(analysis, diagrams, outputDir) {
        const report = {
            timestamp: new Date().toISOString(),
            summary: analysis.summary,
            insights: this.generateInsights(analysis),
            recommendations: this.generateRecommendations(analysis),
            diagrams: diagrams.map(d => ({
                title: d.title,
                files: d.files
            }))
        };

        const reportPath = path.join(outputDir, 'logic_analysis_report.md');
        const markdown = this.generateMarkdownReport(report);
        await fs.writeFile(reportPath, markdown, 'utf8');

        return { ...report, reportPath };
    }

    /**
     * Generate insights from analysis
     */
    generateInsights(analysis) {
        const insights = [];

        // Complexity insights
        const avgComplexity = analysis.summary.complexity / analysis.summary.totalFiles;
        if (avgComplexity > 5) {
            insights.push({
                type: 'complexity',
                level: 'warning',
                message: `Average file complexity (${avgComplexity.toFixed(1)}) is high. Consider refactoring.`
            });
        }

        // Decision tree insights
        const decisionTrees = analysis.patterns.decisionTrees;
        const complexDecisions = decisionTrees.filter(tree => tree.complexity > 5);
        if (complexDecisions.length > 0) {
            insights.push({
                type: 'decisions',
                level: 'info',
                message: `Found ${complexDecisions.length} complex decision trees that could benefit from simplification.`
            });
        }

        // Error handling insights
        const errorHandlers = analysis.patterns.errorHandling;
        const filesWithErrors = analysis.files.filter(f => f.patterns.errorHandling.length > 0);
        const errorCoverage = (filesWithErrors.length / analysis.summary.totalFiles) * 100;
        
        if (errorCoverage < 30) {
            insights.push({
                type: 'error_handling',
                level: 'warning',
                message: `Only ${errorCoverage.toFixed(1)}% of files have error handling. Consider adding try/catch blocks.`
            });
        }

        return insights;
    }

    /**
     * Generate recommendations
     */
    generateRecommendations(analysis) {
        const recommendations = [];

        // Find most complex files
        const complexFiles = analysis.files
            .filter(f => f.complexity > 10)
            .sort((a, b) => b.complexity - a.complexity)
            .slice(0, 5);

        if (complexFiles.length > 0) {
            recommendations.push({
                type: 'refactoring',
                priority: 'high',
                title: 'Refactor High Complexity Files',
                files: complexFiles.map(f => f.file),
                description: 'These files have high complexity and should be refactored into smaller functions.'
            });
        }

        // Find deeply nested decision trees
        const deepDecisions = analysis.patterns.decisionTrees
            .filter(tree => tree.complexity > 7);

        if (deepDecisions.length > 0) {
            recommendations.push({
                type: 'simplification',
                priority: 'medium',
                title: 'Simplify Complex Decision Logic',
                count: deepDecisions.length,
                description: 'Consider using strategy pattern or lookup tables for complex conditional logic.'
            });
        }

        return recommendations;
    }

    /**
     * Generate markdown report
     */
    generateMarkdownReport(report) {
        return `# Logic Analysis Report

Generated: ${report.timestamp}

## Summary

- **Total Files Analyzed**: ${report.summary.totalFiles}
- **Total Logic Patterns**: ${report.summary.totalPatterns}
- **Average Complexity**: ${(report.summary.complexity / report.summary.totalFiles).toFixed(1)}

## Insights

${report.insights.map(insight => 
    `- **${insight.type.toUpperCase()}** (${insight.level}): ${insight.message}`
).join('\n')}

## Recommendations

${report.recommendations.map((rec, index) => 
    `### ${index + 1}. ${rec.title} (${rec.priority} priority)

${rec.description}

${rec.files ? `**Files**: ${rec.files.join(', ')}` : ''}
${rec.count ? `**Count**: ${rec.count}` : ''}
`).join('\n')}

## Generated Diagrams

${report.diagrams.map(diagram => 
    `### ${diagram.title}

${diagram.files.map(file => `- [${file.type.toUpperCase()}](${file.path})`).join('\n')}
`).join('\n')}

---
*Generated by PAIRED Logic Diagram Generator*`;
    }

    /**
     * Get complexity level for styling
     */
    getComplexityLevel(complexity) {
        if (complexity <= 3) return 'low';
        if (complexity <= 7) return 'medium';
        if (complexity <= 12) return 'high';
        return 'critical';
    }

    /**
     * Generate diagram for specific file
     */
    async generateFileLogicDiagram(filePath, options = {}) {
        const analysis = await this.analyzer.analyzeFile(filePath);
        
        const diagram = {
            title: `Logic Analysis: ${path.basename(filePath)}`,
            type: 'file_analysis',
            agent: 'dev',
            layout: 'hierarchical',
            nodes: []
        };

        // Add function nodes
        analysis.functions.forEach(func => {
            const funcNode = {
                title: `Function: ${func.name}`,
                type: 'function',
                status: this.getComplexityLevel(func.complexity),
                metadata: {
                    complexity: func.complexity,
                    async: func.async,
                    parameters: func.parameters.length
                },
                children: []
            };

            // Add decision trees within function
            analysis.patterns.decisionTrees
                .filter(tree => tree.location.function === func.name)
                .forEach(tree => {
                    funcNode.children.push({
                        title: `${tree.subtype}: ${tree.condition}`,
                        type: 'decision',
                        status: this.getComplexityLevel(tree.complexity)
                    });
                });

            diagram.nodes.push(funcNode);
        });

        return diagram;
    }
}

module.exports = { LogicDiagramGenerator };
