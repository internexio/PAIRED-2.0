/**
 * PAIRED Logic Analyzer
 * 
 * Scans codebase to extract and analyze:
 * - Decision trees (if/else, switch/case, ternary operators)
 * - Logic flows (function calls, method chains)
 * - Complex processes (loops, async flows, error handling)
 * - State machines and workflow patterns
 * 
 * Generates structured data for XMind visualization
 */

const fs = require('fs').promises;
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

class LogicAnalyzer {
    constructor() {
        this.patterns = {
            decisionTrees: [],
            logicFlows: [],
            complexProcesses: [],
            stateMachines: [],
            errorHandling: []
        };
    }

    /**
     * Analyze entire codebase for logic patterns
     */
    async analyzeCodebase(rootPath, options = {}) {
        const {
            extensions = ['.js', '.ts', '.jsx', '.tsx'],
            excludeDirs = ['node_modules', '.git', 'dist', 'build'],
            maxDepth = 10
        } = options;

        const results = {
            files: [],
            patterns: {
                decisionTrees: [],
                logicFlows: [],
                complexProcesses: [],
                stateMachines: [],
                errorHandling: []
            },
            summary: {
                totalFiles: 0,
                totalPatterns: 0,
                complexity: 0
            }
        };

        const files = await this.findCodeFiles(rootPath, extensions, excludeDirs, maxDepth);
        
        for (const filePath of files) {
            try {
                const analysis = await this.analyzeFile(filePath);
                results.files.push(analysis);
                
                // Merge patterns
                Object.keys(results.patterns).forEach(key => {
                    results.patterns[key].push(...analysis.patterns[key]);
                });
                
                results.summary.totalFiles++;
                results.summary.totalPatterns += analysis.totalPatterns;
                results.summary.complexity += analysis.complexity;
            } catch (error) {
                console.warn(`Failed to analyze ${filePath}:`, error.message);
            }
        }

        return results;
    }

    /**
     * Analyze single file for logic patterns
     */
    async analyzeFile(filePath) {
        const content = await fs.readFile(filePath, 'utf8');
        const relativePath = path.relative(process.cwd(), filePath);
        
        const analysis = {
            file: relativePath,
            patterns: {
                decisionTrees: [],
                logicFlows: [],
                complexProcesses: [],
                stateMachines: [],
                errorHandling: []
            },
            functions: [],
            classes: [],
            complexity: 0,
            totalPatterns: 0
        };

        try {
            // Parse the code into AST
            const ast = parse(content, {
                sourceType: 'module',
                allowImportExportEverywhere: true,
                allowReturnOutsideFunction: true,
                plugins: [
                    'jsx',
                    'typescript',
                    'decorators-legacy',
                    'classProperties',
                    'asyncGenerators',
                    'functionBind',
                    'exportDefaultFrom',
                    'exportNamespaceFrom',
                    'dynamicImport',
                    'nullishCoalescingOperator',
                    'optionalChaining'
                ]
            });

            // Traverse AST and extract patterns
            traverse(ast, {
                // Decision Trees - If/Else Statements
                IfStatement: (path) => {
                    const decisionTree = this.extractDecisionTree(path, content);
                    if (decisionTree) {
                        analysis.patterns.decisionTrees.push(decisionTree);
                        analysis.complexity += decisionTree.complexity;
                    }
                },

                // Switch Statements
                SwitchStatement: (path) => {
                    const switchTree = this.extractSwitchTree(path, content);
                    if (switchTree) {
                        analysis.patterns.decisionTrees.push(switchTree);
                        analysis.complexity += switchTree.complexity;
                    }
                },

                // Function Declarations and Expressions
                'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression': (path) => {
                    const func = this.extractFunction(path, content);
                    if (func) {
                        analysis.functions.push(func);
                        if (func.logicFlow) {
                            analysis.patterns.logicFlows.push(func.logicFlow);
                        }
                    }
                },

                // Class Declarations
                ClassDeclaration: (path) => {
                    const classInfo = this.extractClass(path, content);
                    if (classInfo) {
                        analysis.classes.push(classInfo);
                        if (classInfo.stateMachine) {
                            analysis.patterns.stateMachines.push(classInfo.stateMachine);
                        }
                    }
                },

                // Try/Catch Error Handling
                TryStatement: (path) => {
                    const errorHandling = this.extractErrorHandling(path, content);
                    if (errorHandling) {
                        analysis.patterns.errorHandling.push(errorHandling);
                    }
                },

                // Loop Statements
                'ForStatement|WhileStatement|DoWhileStatement|ForInStatement|ForOfStatement': (path) => {
                    const loop = this.extractLoop(path, content);
                    if (loop) {
                        analysis.patterns.complexProcesses.push(loop);
                        analysis.complexity += loop.complexity;
                    }
                }
            });

            // Calculate total patterns
            analysis.totalPatterns = Object.values(analysis.patterns)
                .reduce((sum, patterns) => sum + patterns.length, 0);

        } catch (error) {
            console.warn(`Failed to parse ${filePath}:`, error.message);
        }

        return analysis;
    }

    /**
     * Extract decision tree from if/else statements
     */
    extractDecisionTree(path, content) {
        const node = path.node;
        const startLine = node.loc?.start.line || 0;
        const endLine = node.loc?.end.line || 0;

        const tree = {
            type: 'decision_tree',
            subtype: 'if_else',
            location: {
                startLine,
                endLine,
                function: this.findContainingFunction(path)
            },
            condition: this.extractCondition(node.test, content),
            branches: [],
            complexity: 1
        };

        // Extract consequent (if branch)
        if (node.consequent) {
            tree.branches.push({
                type: 'if',
                condition: tree.condition,
                body: this.extractStatements(node.consequent),
                complexity: this.calculateComplexity(node.consequent)
            });
        }

        // Extract alternate (else branch)
        if (node.alternate) {
            if (t.isIfStatement(node.alternate)) {
                // Nested if (else if)
                const nestedTree = this.extractDecisionTree({ node: node.alternate }, content);
                tree.branches.push({
                    type: 'else_if',
                    nested: nestedTree
                });
                tree.complexity += nestedTree.complexity;
            } else {
                // Simple else
                tree.branches.push({
                    type: 'else',
                    body: this.extractStatements(node.alternate),
                    complexity: this.calculateComplexity(node.alternate)
                });
            }
        }

        return tree;
    }

    /**
     * Extract switch statement tree
     */
    extractSwitchTree(path, content) {
        const node = path.node;
        const startLine = node.loc?.start.line || 0;
        const endLine = node.loc?.end.line || 0;

        const tree = {
            type: 'decision_tree',
            subtype: 'switch',
            location: {
                startLine,
                endLine,
                function: this.findContainingFunction(path)
            },
            discriminant: this.extractExpression(node.discriminant, content),
            cases: [],
            complexity: node.cases.length
        };

        node.cases.forEach(caseNode => {
            const caseInfo = {
                type: caseNode.test ? 'case' : 'default',
                value: caseNode.test ? this.extractExpression(caseNode.test, content) : 'default',
                body: caseNode.consequent.map(stmt => this.extractStatement(stmt, content)),
                hasBreak: caseNode.consequent.some(stmt => t.isBreakStatement(stmt))
            };
            tree.cases.push(caseInfo);
        });

        return tree;
    }

    /**
     * Extract function information and logic flow
     */
    extractFunction(path, content) {
        const node = path.node;
        if (!node) return null;
        
        const startLine = node.loc?.start.line || 0;
        const endLine = node.loc?.end.line || 0;

        const func = {
            type: 'function',
            name: this.getFunctionName(node),
            location: { startLine, endLine },
            parameters: (node.params || []).map(param => this.extractParameter(param)),
            async: Boolean(node.async),
            generator: Boolean(node.generator),
            complexity: this.calculateComplexity(node.body)
        };

        // Add enhanced semantic analysis
        const semantics = this.analyzeFunctionSemantics(node, func.name);
        func.purpose = semantics.purpose;
        func.patterns = semantics.patterns;
        func.detailedComplexity = semantics.complexity;

        // Extract logic flow if function is complex enough
        if (func.complexity > 2) {
            func.logicFlow = this.extractLogicFlow(path, content);
        }

        return func;
    }

    /**
     * Extract logic flow from function body
     */
    extractLogicFlow(path, content) {
        const node = path.node;
        const flow = {
            type: 'logic_flow',
            function: this.getFunctionName(node),
            steps: [],
            branches: [],
            loops: [],
            asyncOperations: []
        };

        // Traverse function body to extract flow
        path.traverse({
            CallExpression: (callPath) => {
                const call = this.extractFunctionCall(callPath.node, content);
                flow.steps.push(call);
            },
            AwaitExpression: (awaitPath) => {
                const asyncOp = this.extractAsyncOperation(awaitPath.node, content);
                flow.asyncOperations.push(asyncOp);
            },
            IfStatement: (ifPath) => {
                const branch = {
                    type: 'conditional',
                    condition: this.extractCondition(ifPath.node.test, content),
                    location: ifPath.node.loc?.start.line || 0
                };
                flow.branches.push(branch);
            }
        });

        return flow;
    }

    /**
     * Extract class information and potential state machines
     */
    extractClass(path, content) {
        const node = path.node;
        const className = node.id?.name || 'Anonymous';
        
        const classInfo = {
            type: 'class',
            name: className,
            location: {
                startLine: node.loc?.start.line || 0,
                endLine: node.loc?.end.line || 0
            },
            methods: [],
            properties: [],
            hasState: false
        };

        // Extract methods and look for state patterns
        node.body.body.forEach(member => {
            if (t.isMethod(member) || (t.isObjectMethod && t.isObjectMethod(member)) || (member.type === 'MethodDefinition')) {
                const method = {
                    name: member.key.name || 'anonymous',
                    type: member.kind, // method, constructor, get, set
                    static: member.static,
                    async: member.value.async
                };
                classInfo.methods.push(method);
            } else if (t.isClassProperty(member)) {
                const prop = {
                    name: member.key.name || 'anonymous',
                    static: member.static
                };
                classInfo.properties.push(prop);
                
                // Check if this looks like state
                if (prop.name.toLowerCase().includes('state')) {
                    classInfo.hasState = true;
                }
            }
        });

        // If class has state-like patterns, extract state machine
        if (classInfo.hasState || this.hasStateMachinePattern(classInfo.methods)) {
            classInfo.stateMachine = this.extractStateMachine(classInfo, content);
        }

        return classInfo;
    }

    /**
     * Extract error handling patterns
     */
    extractErrorHandling(path, content) {
        const node = path.node;
        
        return {
            type: 'error_handling',
            location: {
                startLine: node.loc?.start.line || 0,
                endLine: node.loc?.end.line || 0
            },
            tryBlock: this.extractStatements(node.block),
            catchBlock: node.handler ? {
                parameter: node.handler.param?.name || 'error',
                body: this.extractStatements(node.handler.body)
            } : null,
            finallyBlock: node.finalizer ? this.extractStatements(node.finalizer) : null
        };
    }

    /**
     * Extract loop information
     */
    extractLoop(path, content) {
        const node = path.node;
        const loopType = node.type.replace('Statement', '').toLowerCase();
        
        return {
            type: 'complex_process',
            subtype: 'loop',
            loopType,
            location: {
                startLine: node.loc?.start.line || 0,
                endLine: node.loc?.end.line || 0
            },
            condition: this.extractLoopCondition(node, content),
            body: this.extractStatements(node.body),
            complexity: this.calculateComplexity(node.body) + 1
        };
    }

    /**
     * Helper methods for extraction
     */
    extractCondition(node, content) {
        if (!node) return { text: 'unknown', type: 'unknown', variables: [], description: 'No condition' };
        
        try {
            // Get the source code for the condition
            let conditionText = 'unknown';
            if (node.loc) {
                const lines = content.split('\n');
                const startLine = node.loc.start.line - 1;
                const endLine = node.loc.end.line - 1;
                const startCol = node.loc.start.column;
                const endCol = node.loc.end.column;
                
                if (startLine === endLine) {
                    conditionText = lines[startLine].substring(startCol, endCol).trim();
                } else {
                    let result = lines[startLine].substring(startCol);
                    for (let i = startLine + 1; i < endLine; i++) {
                        result += '\n' + lines[i];
                    }
                    result += '\n' + lines[endLine].substring(0, endCol);
                    conditionText = result.trim();
                }
            }
            
            // Perform semantic analysis
            return this.analyzeConditionSemantics(conditionText);
        } catch (error) {
            // Fallback to node type
            return { text: node.type || 'unknown', type: 'error', variables: [], description: 'Parse error' };
        }
    }
    
    /**
     * Analyze condition semantics for richer content
     */
    analyzeConditionSemantics(text) {
        const variables = [];
        const operators = [];
        let type = 'simple';
        let description = '';
        
        // Extract variables (identifiers)
        const variableRegex = /\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g;
        const foundVars = text.match(variableRegex) || [];
        
        // Filter out JavaScript keywords
        const keywords = ['if', 'else', 'return', 'true', 'false', 'null', 'undefined', 'typeof', 'instanceof'];
        foundVars.forEach(v => {
            if (!keywords.includes(v) && !variables.includes(v)) {
                variables.push(v);
            }
        });
        
        // Extract operators
        const operatorMatches = text.match(/(===|!==|==|!=|<=|>=|<|>|&&|\|\||!)/g) || [];
        operators.push(...operatorMatches);
        
        // Determine condition type and create description
        if (operators.includes('&&') || operators.includes('||')) {
            type = 'compound';
            const parts = operators.filter(op => op === '&&' || op === '||').length + 1;
            description = `Compound logic with ${parts} conditions`;
        } else if (operators.some(op => ['===', '!==', '==', '!='].includes(op))) {
            type = 'equality';
            description = `Equality check: ${variables.slice(0, 2).join(' vs ')}`;
        } else if (operators.some(op => ['<', '>', '<=', '>='].includes(op))) {
            type = 'comparison';
            description = `Numeric comparison: ${variables.slice(0, 2).join(' vs ')}`;
        } else if (text.includes('typeof')) {
            type = 'type_check';
            description = `Type validation for ${variables[0] || 'variable'}`;
        } else if (text.includes('.length') || text.includes('.size')) {
            type = 'length_check';
            description = `Size validation`;
        } else if (variables.length === 1 && operators.length === 0) {
            type = 'truthiness';
            description = `Truthiness check for ${variables[0]}`;
        } else if (text.includes('!')) {
            type = 'negation';
            description = `Negation check`;
        } else {
            description = `${type} condition`;
        }
        
        return {
            text: text,
            type: type,
            variables: variables,
            operators: operators,
            description: description
        };
    }

    extractExpression(node, content) {
        return this.extractCondition(node, content);
    }

    extractStatement(node, content) {
        return {
            type: node.type,
            code: this.extractCondition(node, content)
        };
    }

    extractStatements(node) {
        if (!node) return [];
        
        if (t.isBlockStatement(node)) {
            return node.body.map(stmt => ({ type: stmt.type }));
        } else {
            return [{ type: node.type }];
        }
    }

    getFunctionName(node) {
        if (node.id && node.id.name) {
            return node.id.name;
        } else if (t.isArrowFunctionExpression(node)) {
            return 'arrow_function';
        } else {
            return 'anonymous';
        }
    }
    
    /**
     * Enhanced function analysis with semantic information
     */
    analyzeFunctionSemantics(node, name) {
        const analysis = {
            name: name,
            purpose: this.inferFunctionPurpose(name, node),
            parameters: this.analyzeParameters(node.params || []),
            complexity: this.calculateDetailedComplexity(node),
            patterns: this.detectFunctionPatterns(node),
            isAsync: node.async || false,
            isGenerator: node.generator || false
        };
        
        return analysis;
    }
    
    /**
     * Infer function purpose from name and structure
     */
    inferFunctionPurpose(name, node) {
        const namePatterns = {
            'get': 'Data retrieval',
            'set': 'Data modification', 
            'create': 'Object creation',
            'delete': 'Data removal',
            'update': 'Data modification',
            'find': 'Search operation',
            'filter': 'Data filtering',
            'map': 'Data transformation',
            'reduce': 'Data aggregation',
            'validate': 'Input validation',
            'parse': 'Data parsing',
            'format': 'Data formatting',
            'handle': 'Event handling',
            'process': 'Data processing',
            'calculate': 'Computation',
            'render': 'UI rendering',
            'init': 'Initialization',
            'setup': 'Configuration',
            'cleanup': 'Resource cleanup',
            'fetch': 'Data fetching',
            'save': 'Data persistence',
            'load': 'Data loading'
        };
        
        const lowerName = name.toLowerCase();
        for (const [pattern, purpose] of Object.entries(namePatterns)) {
            if (lowerName.includes(pattern)) {
                return purpose;
            }
        }
        
        // Analyze function characteristics
        if (node.async) {
            return 'Asynchronous operation';
        }
        
        if (node.generator) {
            return 'Generator function';
        }
        
        return 'General purpose';
    }
    
    /**
     * Analyze function parameters with semantic information
     */
    analyzeParameters(params) {
        return params.map(param => {
            const analysis = {
                name: 'unknown',
                type: 'unknown',
                optional: false,
                defaultValue: null
            };
            
            if (t.isIdentifier(param)) {
                analysis.name = param.name;
                analysis.type = this.inferParameterType(param.name);
            } else if (t.isAssignmentPattern(param)) {
                analysis.name = param.left.name;
                analysis.optional = true;
                analysis.type = this.inferParameterType(param.left.name);
                analysis.defaultValue = this.extractDefaultValue(param.right);
            } else if (t.isRestElement(param)) {
                analysis.name = `...${param.argument.name}`;
                analysis.type = 'rest_parameter';
            }
            
            return analysis;
        });
    }
    
    /**
     * Infer parameter type from name patterns
     */
    inferParameterType(name) {
        const typePatterns = {
            'id': 'identifier',
            'index': 'number',
            'count': 'number',
            'size': 'number',
            'length': 'number',
            'callback': 'function',
            'handler': 'function',
            'fn': 'function',
            'func': 'function',
            'options': 'object',
            'config': 'object',
            'data': 'object',
            'item': 'object',
            'element': 'object',
            'name': 'string',
            'title': 'string',
            'message': 'string',
            'text': 'string',
            'url': 'string',
            'path': 'string',
            'enabled': 'boolean',
            'active': 'boolean',
            'visible': 'boolean'
        };
        
        const lowerName = name.toLowerCase();
        for (const [pattern, type] of Object.entries(typePatterns)) {
            if (lowerName.includes(pattern)) {
                return type;
            }
        }
        
        return 'unknown';
    }
    
    /**
     * Extract default value from assignment pattern
     */
    extractDefaultValue(node) {
        if (t.isLiteral(node)) {
            return node.value;
        } else if (t.isIdentifier(node)) {
            return node.name;
        } else {
            return 'complex_default';
        }
    }
    
    /**
     * Detect function patterns (factory, observer, etc.)
     */
    detectFunctionPatterns(node) {
        const patterns = [];
        
        if (!node.body || !node.body.body) {
            return patterns;
        }
        
        const statements = node.body.body;
        
        // Factory pattern - returns new objects
        if (statements.some(stmt => 
            t.isReturnStatement(stmt) && 
            stmt.argument && 
            (t.isObjectExpression(stmt.argument) || t.isNewExpression(stmt.argument))
        )) {
            patterns.push('factory');
        }
        
        // Event handler pattern
        if (statements.some(stmt => 
            t.isExpressionStatement(stmt) &&
            stmt.expression &&
            t.isCallExpression(stmt.expression) &&
            this.isEventRelatedCall(stmt.expression)
        )) {
            patterns.push('event_handler');
        }
        
        // Validation pattern - throws errors or returns boolean
        if (statements.some(stmt => 
            t.isIfStatement(stmt) &&
            this.hasValidationPattern(stmt)
        )) {
            patterns.push('validator');
        }
        
        // Async pattern
        if (node.async || statements.some(stmt => this.hasAsyncPattern(stmt))) {
            patterns.push('async_operation');
        }
        
        return patterns;
    }
    
    /**
     * Check if call expression is event-related
     */
    isEventRelatedCall(callExpr) {
        if (!callExpr.callee || !callExpr.callee.property) {
            return false;
        }
        
        const methodName = callExpr.callee.property.name;
        return ['addEventListener', 'on', 'emit', 'trigger', 'dispatch'].includes(methodName);
    }
    
    /**
     * Check if statement has validation pattern
     */
    hasValidationPattern(stmt) {
        if (!stmt.consequent || !stmt.consequent.body) {
            return false;
        }
        
        return stmt.consequent.body.some(s => 
            t.isThrowStatement(s) || 
            (t.isReturnStatement(s) && s.argument && t.isBooleanLiteral(s.argument, { value: false }))
        );
    }
    
    /**
     * Check if statement has async pattern
     */
    hasAsyncPattern(stmt) {
        // Check for await expressions, Promise usage, etc.
        return t.isExpressionStatement(stmt) &&
               stmt.expression &&
               (t.isAwaitExpression(stmt.expression) ||
                (t.isCallExpression(stmt.expression) &&
                 stmt.expression.callee &&
                 stmt.expression.callee.name === 'Promise'));
    }
    
    /**
     * Calculate detailed complexity metrics
     */
    calculateDetailedComplexity(node) {
        let cyclomatic = 1; // Base complexity
        let cognitive = 0;
        let nesting = 0;
        
        if (node.body && node.body.body) {
            this.traverseForComplexity(node.body.body, 0, (nodeType, depth) => {
                // Cyclomatic complexity
                if (['IfStatement', 'WhileStatement', 'ForStatement', 'SwitchCase', 
                     'ConditionalExpression', 'LogicalExpression'].includes(nodeType)) {
                    cyclomatic++;
                }
                
                // Cognitive complexity (considers nesting)
                if (['IfStatement', 'WhileStatement', 'ForStatement'].includes(nodeType)) {
                    cognitive += Math.max(1, depth);
                }
                
                nesting = Math.max(nesting, depth);
            });
        }
        
        return {
            cyclomatic,
            cognitive,
            nesting,
            overall: Math.max(cyclomatic, cognitive)
        };
    }
    
    /**
     * Traverse statements for complexity calculation
     */
    traverseForComplexity(statements, depth, callback) {
        statements.forEach(stmt => {
            callback(stmt.type, depth);
            
            // Recursively traverse nested statements
            if (t.isIfStatement(stmt)) {
                if (stmt.consequent && stmt.consequent.body) {
                    this.traverseForComplexity(stmt.consequent.body, depth + 1, callback);
                }
                if (stmt.alternate) {
                    if (t.isBlockStatement(stmt.alternate)) {
                        this.traverseForComplexity(stmt.alternate.body, depth + 1, callback);
                    } else if (t.isIfStatement(stmt.alternate)) {
                        this.traverseForComplexity([stmt.alternate], depth + 1, callback);
                    }
                }
            } else if (t.isWhileStatement(stmt) || t.isForStatement(stmt)) {
                if (stmt.body && stmt.body.body) {
                    this.traverseForComplexity(stmt.body.body, depth + 1, callback);
                }
            }
        });
    }

    findContainingFunction(path) {
        let current = path.parent;
        while (current) {
            if (t.isFunction(current)) {
                return this.getFunctionName(current);
            }
            current = current.parent;
        }
        return 'global';
    }

    calculateComplexity(node) {
        if (!node) return 0;
        
        let complexity = 0;
        
        // Simple complexity calculation
        if (t.isBlockStatement(node)) {
            node.body.forEach(stmt => {
                if (t.isIfStatement(stmt) || t.isWhileStatement(stmt) || 
                    t.isForStatement(stmt) || t.isSwitchStatement(stmt)) {
                    complexity += 1;
                }
            });
        }
        
        return complexity;
    }
    
    /**
     * Extract loop condition for different loop types
     */
    extractLoopCondition(node, content) {
        if (!node) return { text: 'unknown', type: 'unknown' };
        
        try {
            if (t.isForStatement(node)) {
                // For loop: extract test condition
                if (node.test) {
                    return this.extractCondition(node.test, content);
                }
                return { text: 'for loop', type: 'iteration', description: 'For loop iteration' };
            } else if (t.isWhileStatement(node)) {
                // While loop: extract test condition
                if (node.test) {
                    return this.extractCondition(node.test, content);
                }
                return { text: 'while loop', type: 'conditional', description: 'While loop condition' };
            } else if (t.isDoWhileStatement(node)) {
                // Do-while loop: extract test condition
                if (node.test) {
                    return this.extractCondition(node.test, content);
                }
                return { text: 'do-while loop', type: 'conditional', description: 'Do-while loop condition' };
            } else if (t.isForInStatement(node) || t.isForOfStatement(node)) {
                // For-in/for-of loop: extract right side (what we're iterating over)
                if (node.right) {
                    const rightCondition = this.extractCondition(node.right, content);
                    return {
                        text: `iterate over ${rightCondition.text}`,
                        type: 'iteration',
                        description: `Iterate over ${rightCondition.description || rightCondition.text}`
                    };
                }
                return { text: 'for-in/for-of loop', type: 'iteration', description: 'For-in/for-of iteration' };
            }
        } catch (error) {
            return { text: 'loop condition error', type: 'error', description: 'Failed to parse loop condition' };
        }
        
        return { text: 'unknown loop', type: 'unknown', description: 'Unknown loop type' };
    }
    
    /**
     * Extract parameter information
     */
    extractParameter(param) {
        if (!param) return { name: 'unknown', type: 'unknown' };
        
        try {
            if (t.isIdentifier(param)) {
                return {
                    name: param.name,
                    type: this.inferParameterType(param.name),
                    optional: false
                };
            } else if (t.isAssignmentPattern(param)) {
                return {
                    name: param.left.name || 'unknown',
                    type: this.inferParameterType(param.left.name || 'unknown'),
                    optional: true,
                    defaultValue: this.extractDefaultValue(param.right)
                };
            } else if (t.isRestElement(param)) {
                return {
                    name: `...${param.argument.name || 'args'}`,
                    type: 'rest_parameter',
                    optional: false
                };
            } else if (t.isObjectPattern(param)) {
                return {
                    name: 'destructured_object',
                    type: 'object',
                    optional: false
                };
            } else if (t.isArrayPattern(param)) {
                return {
                    name: 'destructured_array',
                    type: 'array',
                    optional: false
                };
            }
        } catch (error) {
            return { name: 'parameter_error', type: 'error' };
        }
        
        return { name: param.type || 'unknown', type: 'unknown' };
    }

    /**
     * Find all code files in directory
     */
    async findCodeFiles(rootPath, extensions, excludeDirs, maxDepth, currentDepth = 0) {
        if (currentDepth >= maxDepth) return [];
        
        const files = [];
        
        try {
            const entries = await fs.readdir(rootPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(rootPath, entry.name);
                
                if (entry.isDirectory()) {
                    if (!excludeDirs.includes(entry.name)) {
                        const subFiles = await this.findCodeFiles(
                            fullPath, extensions, excludeDirs, maxDepth, currentDepth + 1
                        );
                        files.push(...subFiles);
                    }
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name);
                    if (extensions.includes(ext)) {
                        files.push(fullPath);
                    }
                }
            }
        } catch (error) {
            console.warn(`Cannot read directory ${rootPath}:`, error.message);
        }
        
        return files;
    }

    /**
     * Generate XMind-compatible data structure from analysis
     */
    generateLogicDiagram(analysis, options = {}) {
        const {
            title = 'Logic Flow Analysis',
            focusOn = 'all', // 'decisions', 'flows', 'processes', 'errors'
            maxComplexity = 10
        } = options;

        const diagram = {
            title,
            type: 'logic_analysis',
            layout: 'hierarchical',
            nodes: [],
            relationships: [],
            groups: []
        };

        // Add file nodes
        analysis.files.forEach(file => {
            const fileNode = {
                title: path.basename(file.file),
                type: 'file',
                metadata: {
                    path: file.file,
                    complexity: file.complexity,
                    patterns: file.totalPatterns
                },
                children: []
            };

            // Add decision trees
            if (focusOn === 'all' || focusOn === 'decisions') {
                file.patterns.decisionTrees.forEach(tree => {
                    if (tree.complexity <= maxComplexity) {
                        fileNode.children.push(this.createDecisionNode(tree));
                    }
                });
            }

            // Add logic flows
            if (focusOn === 'all' || focusOn === 'flows') {
                file.patterns.logicFlows.forEach(flow => {
                    fileNode.children.push(this.createFlowNode(flow));
                });
            }

            // Add complex processes
            if (focusOn === 'all' || focusOn === 'processes') {
                file.patterns.complexProcesses.forEach(process => {
                    if (process.complexity <= maxComplexity) {
                        fileNode.children.push(this.createProcessNode(process));
                    }
                });
            }

            if (fileNode.children.length > 0) {
                diagram.nodes.push(fileNode);
            }
        });

        return diagram;
    }

    createDecisionNode(tree) {
        return {
            title: `${tree.subtype.toUpperCase()}: ${tree.condition}`,
            type: 'decision',
            status: tree.complexity > 5 ? 'complex' : 'simple',
            metadata: {
                complexity: tree.complexity,
                location: tree.location,
                branches: tree.branches?.length || tree.cases?.length || 0
            },
            children: tree.branches?.map(branch => ({
                title: `${branch.type}: ${branch.condition || 'default'}`,
                type: 'branch'
            })) || tree.cases?.map(caseItem => ({
                title: `${caseItem.type}: ${caseItem.value}`,
                type: 'case'
            })) || []
        };
    }

    createFlowNode(flow) {
        return {
            title: `Flow: ${flow.function}`,
            type: 'flow',
            metadata: {
                steps: flow.steps.length,
                branches: flow.branches.length,
                asyncOps: flow.asyncOperations.length
            },
            children: [
                ...flow.steps.map(step => ({
                    title: step.name || step.type,
                    type: 'step'
                })),
                ...flow.asyncOperations.map(op => ({
                    title: `Async: ${op.type}`,
                    type: 'async'
                }))
            ]
        };
    }

    createProcessNode(process) {
        return {
            title: `${process.subtype.toUpperCase()}: ${process.loopType || process.type}`,
            type: 'process',
            status: process.complexity > 3 ? 'complex' : 'simple',
            metadata: {
                complexity: process.complexity,
                location: process.location
            }
        };
    }
}

module.exports = { LogicAnalyzer };
