/**
 * PAIRED Multi-Format Generator
 * 
 * Extends XMind generator to support all XMind-compatible import formats:
 * - XMind XML (existing)
 * - Markdown
 * - OPML (Outline Processor Markup Language)
 * - TextBundle (rich text with attachments)
 */

const { XMindGenerator } = require('./xmind_generator');
const fs = require('fs').promises;
const path = require('path');

class MultiFormatGenerator extends XMindGenerator {
    constructor() {
        super();
        this.supportedFormats = ['xmind', 'markdown', 'opml', 'textbundle', 'json'];
    }

    /**
     * Generate diagram in specified format(s)
     */
    async generateDiagram(data, options = {}) {
        const {
            format = 'xmind',
            outputDir = './diagrams',
            filename = 'diagram',
            title = 'Logic Diagram'
        } = options;

        const results = [];
        const formats = format === 'all' ? this.supportedFormats : 
                       Array.isArray(format) ? format : [format];

        for (const fmt of formats) {
            try {
                const result = await this.generateFormat(data, fmt, {
                    ...options,
                    outputDir,
                    filename,
                    title
                });
                results.push(result);
            } catch (error) {
                console.warn(`⚠️ Failed to generate ${fmt} format: ${error.message}`);
            }
        }

        return results;
    }

    /**
     * Generate specific format
     */
    async generateFormat(data, format, options) {
        switch (format) {
            case 'xmind':
                return await this.generateXMindFormat(data, options);
            case 'markdown':
                return await this.generateMarkdownFormat(data, options);
            case 'opml':
                return await this.generateOPMLFormat(data, options);
            case 'textbundle':
                return await this.generateTextBundleFormat(data, options);
            case 'json':
                return await this.generateJSONFormat(data, options);
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    /**
     * Generate XMind XML format (existing functionality)
     */
    async generateXMindFormat(data, options) {
        // Ensure data structure is compatible with XMind generator
        const xmindData = {
            ...data,
            relationships: data.relationships || [],
            nodes: data.nodes || [],
            metadata: data.metadata || {}
        };
        
        const mindMap = this.generateMindMap({
            title: options.title,
            type: options.type || 'logic_analysis',
            data: xmindData,
            layout: options.layout || 'hierarchical',
            agent: options.agent || 'architecture'
        });
        
        const filename = `${options.filename}.xmind.xml`;
        const filepath = path.join(options.outputDir, filename);
        
        // Use the proper XMind export method that converts object to XML string
        await this.exportToXMind(mindMap, filepath);
        
        return {
            format: 'xmind',
            type: 'XMIND',
            path: filepath,
            size: (await fs.stat(filepath)).size
        };
    }

    /**
     * Generate Markdown format
     */
    async generateMarkdownFormat(data, options) {
        const markdown = this.convertToMarkdown(data, options);
        const filename = `${options.filename}.md`;
        const filepath = path.join(options.outputDir, filename);
        
        await fs.writeFile(filepath, markdown, 'utf8');
        
        return {
            format: 'markdown',
            type: 'MARKDOWN',
            path: filepath,
            size: (await fs.stat(filepath)).size
        };
    }

    /**
     * Generate OPML format
     */
    async generateOPMLFormat(data, options) {
        const opml = this.convertToOPML(data, options);
        const filename = `${options.filename}.opml`;
        const filepath = path.join(options.outputDir, filename);
        
        await fs.writeFile(filepath, opml, 'utf8');
        
        return {
            format: 'opml',
            type: 'OPML',
            path: filepath,
            size: (await fs.stat(filepath)).size
        };
    }

    /**
     * Generate TextBundle format
     */
    async generateTextBundleFormat(data, options) {
        const textBundle = await this.convertToTextBundle(data, options);
        const filename = `${options.filename}.textbundle`;
        const bundlePath = path.join(options.outputDir, filename);
        
        // Create TextBundle directory structure
        await fs.mkdir(bundlePath, { recursive: true });
        await fs.mkdir(path.join(bundlePath, 'assets'), { recursive: true });
        
        // Write main text file
        await fs.writeFile(
            path.join(bundlePath, 'text.md'), 
            textBundle.content, 
            'utf8'
        );
        
        // Write info.json metadata
        await fs.writeFile(
            path.join(bundlePath, 'info.json'),
            JSON.stringify(textBundle.metadata, null, 2),
            'utf8'
        );
        
        return {
            format: 'textbundle',
            type: 'TEXTBUNDLE',
            path: bundlePath,
            size: await this.calculateDirectorySize(bundlePath)
        };
    }

    /**
     * Generate JSON format
     */
    async generateJSONFormat(data, options) {
        const jsonContent = JSON.stringify(data, null, 2);
        const filename = `${options.filename}.json`;
        const filepath = path.join(options.outputDir, filename);
        
        await fs.writeFile(filepath, jsonContent, 'utf8');
        
        return {
            format: 'json',
            type: 'JSON',
            path: filepath,
            size: (await fs.stat(filepath)).size
        };
    }

    /**
     * Convert data structure to Markdown
     */
    convertToMarkdown(data, options) {
        const { title = 'Logic Diagram' } = options;
        let markdown = `# ${title}\n\n`;
        
        if (data.summary) {
            markdown += `## Summary\n\n`;
            markdown += `- **Files analyzed**: ${data.summary.totalFiles || 0}\n`;
            markdown += `- **Logic patterns**: ${data.summary.totalPatterns || 0}\n`;
            markdown += `- **Average complexity**: ${data.summary.averageComplexity || 0}\n\n`;
        }

        if (data.nodes && Array.isArray(data.nodes)) {
            markdown += `## Logic Structure\n\n`;
            markdown += this.nodesToMarkdown(data.nodes, 0);
        }

        if (data.insights && Array.isArray(data.insights)) {
            markdown += `## Key Insights\n\n`;
            data.insights.forEach(insight => {
                const icon = insight.level === 'warning' ? '⚠️' : 'ℹ️';
                markdown += `${icon} **${insight.title || 'Insight'}**: ${insight.message}\n\n`;
            });
        }

        return markdown;
    }

    /**
     * Convert nodes to Markdown hierarchy
     */
    nodesToMarkdown(nodes, depth) {
        let markdown = '';
        const indent = '  '.repeat(depth);
        const headerLevel = Math.min(depth + 3, 6);
        const header = '#'.repeat(headerLevel);
        
        for (const node of nodes) {
            if (depth === 0) {
                markdown += `${header} ${node.title || node.text || 'Node'}\n\n`;
            } else {
                markdown += `${indent}- **${node.title || node.text || 'Node'}**\n`;
            }
            
            if (node.description) {
                markdown += `${indent}  ${node.description}\n`;
            }
            
            if (node.children && Array.isArray(node.children)) {
                markdown += this.nodesToMarkdown(node.children, depth + 1);
            }
            
            markdown += '\n';
        }
        
        return markdown;
    }

    /**
     * Convert data structure to OPML
     */
    convertToOPML(data, options) {
        const { title = 'Logic Diagram' } = options;
        const timestamp = new Date().toISOString();
        
        let opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
    <head>
        <title>${this.escapeXml(title)}</title>
        <dateCreated>${timestamp}</dateCreated>
        <dateModified>${timestamp}</dateModified>
        <ownerName>PAIRED Logic Diagram Generator</ownerName>
    </head>
    <body>
`;

        if (data.nodes && Array.isArray(data.nodes)) {
            opml += this.nodesToOPML(data.nodes, 2);
        }

        opml += `    </body>
</opml>`;

        return opml;
    }

    /**
     * Convert nodes to OPML outline
     */
    nodesToOPML(nodes, indentLevel) {
        let opml = '';
        const indent = '    '.repeat(indentLevel);
        
        for (const node of nodes) {
            const title = this.escapeXml(node.title || node.text || 'Node');
            const description = node.description ? ` note="${this.escapeXml(node.description)}"` : '';
            
            if (node.children && Array.isArray(node.children) && node.children.length > 0) {
                opml += `${indent}<outline text="${title}"${description}>\n`;
                opml += this.nodesToOPML(node.children, indentLevel + 1);
                opml += `${indent}</outline>\n`;
            } else {
                opml += `${indent}<outline text="${title}"${description} />\n`;
            }
        }
        
        return opml;
    }

    /**
     * Convert data structure to TextBundle
     */
    async convertToTextBundle(data, options) {
        const { title = 'Logic Diagram' } = options;
        const markdown = this.convertToMarkdown(data, options);
        
        const metadata = {
            version: 2,
            type: "net.daringfireball.markdown",
            transient: false,
            creatorIdentifier: "com.paired.logic-diagram-generator",
            sourceURL: "",
            title: title
        };

        return {
            content: markdown,
            metadata: metadata
        };
    }

    /**
     * Utility: Escape XML characters
     */
    escapeXml(text) {
        if (typeof text !== 'string') return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Utility: Calculate directory size
     */
    async calculateDirectorySize(dirPath) {
        let totalSize = 0;
        const files = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const file of files) {
            const filePath = path.join(dirPath, file.name);
            if (file.isDirectory()) {
                totalSize += await this.calculateDirectorySize(filePath);
            } else {
                const stats = await fs.stat(filePath);
                totalSize += stats.size;
            }
        }
        
        return totalSize;
    }
}

module.exports = { MultiFormatGenerator };
