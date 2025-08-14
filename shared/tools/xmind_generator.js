/**
 * PAIRED Shared XMind Generator
 * 
 * A powerful, reusable tool for generating XMind-compatible mind maps
 * that can be used across all PAIRED agents for visual documentation.
 * 
 * Supports:
 * - XMind XML format export
 * - JSON structure for programmatic use
 * - Multiple layout types (hierarchical, radial, timeline, etc.)
 * - Agent-specific templates and styling
 * - Flexible node positioning for compact layouts
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class XMindGenerator {
    constructor() {
        this.templates = new Map();
        this.loadTemplates();
    }

    /**
     * Load agent-specific templates
     */
    async loadTemplates() {
        const templatesDir = path.join(__dirname, '../templates/xmind');
        try {
            const templateFiles = await fs.readdir(templatesDir);
            for (const file of templateFiles) {
                if (file.endsWith('.json')) {
                    const templateName = path.basename(file, '.json');
                    const templatePath = path.join(templatesDir, file);
                    const template = JSON.parse(await fs.readFile(templatePath, 'utf8'));
                    this.templates.set(templateName, template);
                }
            }
        } catch (error) {
            console.log('Templates directory not found, using defaults');
        }
    }

    /**
     * Generate XMind map from structured data
     * 
     * @param {Object} options - Configuration options
     * @param {string} options.title - Main title of the mind map
     * @param {string} options.type - Type of diagram (architecture, project, qa, ux, analysis)
     * @param {Object} options.data - Structured data to visualize
     * @param {string} options.layout - Layout type (hierarchical, radial, timeline, fishbone)
     * @param {string} options.agent - Agent name for styling
     * @param {Object} options.styling - Custom styling options
     * @returns {Object} XMind-compatible structure
     */
    generateMindMap(options) {
        const {
            title,
            type = 'general',
            data,
            layout = 'hierarchical',
            agent = 'default',
            styling = {}
        } = options;

        // Create base structure
        const mindMap = {
            id: uuidv4(),
            title,
            type,
            layout,
            agent,
            created: new Date().toISOString(),
            rootTopic: this.createRootTopic(title, type, agent),
            topics: [],
            relationships: [],
            boundaries: [],
            summaries: [],
            metadata: {
                generator: 'PAIRED XMind Generator',
                version: '1.0.0',
                agent,
                type
            }
        };

        // Apply template if available
        const template = this.templates.get(type) || this.templates.get('default');
        if (template) {
            mindMap.styling = { ...template.styling, ...styling };
        }

        // Generate topics based on data structure
        mindMap.topics = this.generateTopics(data, layout, type);
        
        // Generate relationships for complex diagrams
        if (data.relationships) {
            mindMap.relationships = this.generateRelationships(data.relationships);
        }

        // Add boundaries for grouping
        if (data.groups) {
            mindMap.boundaries = this.generateBoundaries(data.groups);
        }

        return mindMap;
    }

    /**
     * Create root topic with agent-specific styling
     */
    createRootTopic(title, type, agent) {
        const agentColors = {
            'pm': '#4CAF50',      // Green for PM (Alex)
            'architecture': '#2196F3', // Blue for Architecture (Winston)
            'qa': '#FF9800',      // Orange for QA (Quinn)
            'ux': '#E91E63',      // Pink for UX (Sally)
            'analyst': '#9C27B0', // Purple for Analyst (Mary)
            'scrum': '#607D8B',   // Blue-grey for Scrum (Bob)
            'dev': '#795548',     // Brown for Dev (James)
            'default': '#757575'  // Grey for default
        };

        return {
            id: uuidv4(),
            title,
            type: 'root',
            position: { x: 0, y: 0 },
            styling: {
                backgroundColor: agentColors[agent] || agentColors.default,
                textColor: '#FFFFFF',
                fontSize: 16,
                fontWeight: 'bold',
                shape: 'roundedRect',
                width: 'auto',
                height: 'auto'
            }
        };
    }

    /**
     * Generate topics from data structure
     */
    generateTopics(data, layout, type) {
        if (!data || typeof data !== 'object') return [];

        const topics = [];
        const positions = this.calculatePositions(data, layout);

        // Handle different data structures
        if (Array.isArray(data)) {
            data.forEach((item, index) => {
                topics.push(this.createTopic(item, positions[index], type));
            });
        } else if (data.nodes) {
            data.nodes.forEach((node, index) => {
                topics.push(this.createTopic(node, positions[index], type));
            });
        } else {
            // Handle object structure
            Object.entries(data).forEach(([key, value], index) => {
                topics.push(this.createTopic({
                    title: key,
                    content: value,
                    children: Array.isArray(value) ? value : undefined
                }, positions[index], type));
            });
        }

        return topics;
    }

    /**
     * Create individual topic
     */
    createTopic(item, position, type) {
        const topic = {
            id: uuidv4(),
            title: item.title || item.name || String(item),
            type: item.type || 'topic',
            position: position || { x: 0, y: 0 },
            styling: this.getTopicStyling(item, type),
            children: []
        };

        // Add content if available
        if (item.content) {
            topic.content = item.content;
        }

        // Add notes if available
        if (item.notes) {
            topic.notes = item.notes;
        }

        // Add children recursively
        if (item.children && Array.isArray(item.children)) {
            topic.children = item.children.map(child => 
                this.createTopic(child, { x: 0, y: 0 }, type)
            );
        }

        // Add metadata
        if (item.metadata) {
            topic.metadata = item.metadata;
        }

        return topic;
    }

    /**
     * Get topic styling based on type and content
     */
    getTopicStyling(item, type) {
        const baseStyle = {
            backgroundColor: '#F5F5F5',
            textColor: '#333333',
            fontSize: 12,
            fontWeight: 'normal',
            shape: 'roundedRect',
            borderColor: '#CCCCCC',
            borderWidth: 1
        };

        // Type-specific styling
        const typeStyles = {
            architecture: {
                component: { backgroundColor: '#E3F2FD', borderColor: '#2196F3' },
                service: { backgroundColor: '#E8F5E8', borderColor: '#4CAF50' },
                database: { backgroundColor: '#FFF3E0', borderColor: '#FF9800' },
                external: { backgroundColor: '#FCE4EC', borderColor: '#E91E63' }
            },
            project: {
                milestone: { backgroundColor: '#E8F5E8', borderColor: '#4CAF50', fontWeight: 'bold' },
                task: { backgroundColor: '#F3E5F5', borderColor: '#9C27B0' },
                risk: { backgroundColor: '#FFEBEE', borderColor: '#F44336' },
                dependency: { backgroundColor: '#E0F2F1', borderColor: '#009688' }
            },
            qa: {
                passed: { backgroundColor: '#E8F5E8', borderColor: '#4CAF50' },
                failed: { backgroundColor: '#FFEBEE', borderColor: '#F44336' },
                pending: { backgroundColor: '#FFF8E1', borderColor: '#FFC107' },
                blocked: { backgroundColor: '#EFEBE9', borderColor: '#795548' }
            }
        };

        // Apply type-specific styling
        if (typeStyles[type] && item.status) {
            return { ...baseStyle, ...typeStyles[type][item.status] };
        }

        if (typeStyles[type] && item.type) {
            return { ...baseStyle, ...typeStyles[type][item.type] };
        }

        return baseStyle;
    }

    /**
     * Calculate positions for different layouts
     */
    calculatePositions(data, layout) {
        const positions = [];
        const itemCount = Array.isArray(data) ? data.length : Object.keys(data).length;

        switch (layout) {
            case 'radial':
                return this.calculateRadialPositions(itemCount);
            case 'timeline':
                return this.calculateTimelinePositions(itemCount);
            case 'fishbone':
                return this.calculateFishbonePositions(itemCount);
            case 'hierarchical':
            default:
                return this.calculateHierarchicalPositions(itemCount);
        }
    }

    /**
     * Calculate radial positions around center
     */
    calculateRadialPositions(count) {
        const positions = [];
        const radius = 200;
        const angleStep = (2 * Math.PI) / count;

        for (let i = 0; i < count; i++) {
            const angle = i * angleStep;
            positions.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }

        return positions;
    }

    /**
     * Calculate timeline positions (horizontal)
     */
    calculateTimelinePositions(count) {
        const positions = [];
        const spacing = 300;
        const startX = -(count - 1) * spacing / 2;

        for (let i = 0; i < count; i++) {
            positions.push({
                x: startX + (i * spacing),
                y: 0
            });
        }

        return positions;
    }

    /**
     * Calculate fishbone positions
     */
    calculateFishbonePositions(count) {
        const positions = [];
        const spacing = 150;
        const angle = Math.PI / 6; // 30 degrees

        for (let i = 0; i < count; i++) {
            const side = i % 2 === 0 ? 1 : -1;
            const distance = Math.floor(i / 2) * spacing + spacing;
            
            positions.push({
                x: distance,
                y: side * distance * Math.tan(angle)
            });
        }

        return positions;
    }

    /**
     * Calculate hierarchical positions (tree-like)
     */
    calculateHierarchicalPositions(count) {
        const positions = [];
        const levelHeight = 150;
        const itemWidth = 200;

        // Simple tree layout - can be enhanced
        for (let i = 0; i < count; i++) {
            positions.push({
                x: (i - (count - 1) / 2) * itemWidth,
                y: levelHeight
            });
        }

        return positions;
    }

    /**
     * Generate relationships between topics
     */
    generateRelationships(relationships) {
        return relationships.map(rel => ({
            id: uuidv4(),
            from: rel.from,
            to: rel.to,
            type: rel.type || 'association',
            label: rel.label || '',
            styling: {
                lineColor: rel.color || '#666666',
                lineWidth: rel.width || 2,
                lineStyle: rel.style || 'solid'
            }
        }));
    }

    /**
     * Generate boundaries for grouping
     */
    generateBoundaries(groups) {
        return groups.map(group => ({
            id: uuidv4(),
            title: group.title,
            topicIds: group.topics,
            styling: {
                backgroundColor: group.color || '#F0F0F0',
                borderColor: group.borderColor || '#CCCCCC',
                borderWidth: 2,
                borderStyle: 'dashed'
            }
        }));
    }

    /**
     * Export to XMind XML format
     */
    async exportToXMind(mindMap, outputPath) {
        const xml = this.generateXMindXML(mindMap);
        await fs.writeFile(outputPath, xml, 'utf8');
        return outputPath;
    }

    /**
     * Export to JSON format
     */
    async exportToJSON(mindMap, outputPath) {
        const json = JSON.stringify(mindMap, null, 2);
        await fs.writeFile(outputPath, json, 'utf8');
        return outputPath;
    }

    /**
     * Generate XMind-compatible XML
     */
    generateXMindXML(mindMap) {
        // Simplified XMind XML structure
        // In a full implementation, this would generate proper XMind XML
        return `<?xml version="1.0" encoding="UTF-8"?>
<xmap-content xmlns="urn:xmind:xmap:xmlns:content:2.0">
    <sheet id="${mindMap.id}" theme="default">
        <title>${mindMap.title}</title>
        <topic id="${mindMap.rootTopic.id}">
            <title>${mindMap.rootTopic.title}</title>
            <children>
                ${mindMap.topics.map(topic => this.generateTopicXML(topic)).join('\n')}
            </children>
        </topic>
    </sheet>
</xmap-content>`;
    }

    /**
     * Generate XML for individual topic
     */
    generateTopicXML(topic) {
        const childrenXML = topic.children && topic.children.length > 0 
            ? `<children>${topic.children.map(child => this.generateTopicXML(child)).join('\n')}</children>`
            : '';

        return `<topic id="${topic.id}">
            <title>${topic.title}</title>
            ${topic.content ? `<notes><plain>${topic.content}</plain></notes>` : ''}
            ${childrenXML}
        </topic>`;
    }
}

// Agent-specific helper functions
const AgentHelpers = {
    /**
     * Architecture-specific mind map generation
     */
    architecture: {
        generateSystemDiagram(components, services, databases) {
            return {
                title: 'System Architecture',
                nodes: [
                    ...components.map(c => ({ ...c, type: 'component' })),
                    ...services.map(s => ({ ...s, type: 'service' })),
                    ...databases.map(d => ({ ...d, type: 'database' }))
                ],
                relationships: this.generateArchRelationships(components, services, databases)
            };
        },

        generateArchRelationships(components, services, databases) {
            // Generate relationships based on dependencies
            const relationships = [];
            // Implementation would analyze dependencies and create relationships
            return relationships;
        }
    },

    /**
     * Project Management-specific mind map generation
     */
    project: {
        generateProjectRoadmap(milestones, tasks, dependencies) {
            return {
                title: 'Project Roadmap',
                nodes: [
                    ...milestones.map(m => ({ ...m, type: 'milestone' })),
                    ...tasks.map(t => ({ ...t, type: 'task' }))
                ],
                relationships: dependencies.map(d => ({
                    from: d.from,
                    to: d.to,
                    type: 'dependency',
                    label: 'depends on'
                }))
            };
        }
    },

    /**
     * QA-specific mind map generation
     */
    qa: {
        generateTestCoverageMap(testSuites, testCases, coverage) {
            return {
                title: 'Test Coverage Map',
                nodes: testSuites.map(suite => ({
                    title: suite.name,
                    type: 'test-suite',
                    children: suite.tests.map(test => ({
                        title: test.name,
                        type: 'test-case',
                        status: test.status
                    }))
                }))
            };
        }
    }
};

module.exports = {
    XMindGenerator,
    AgentHelpers
};
