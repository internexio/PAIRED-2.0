#!/usr/bin/env node

const StandaloneEnvironmentAgent = require('../agents/standalone_environment_agent');
const path = require('path');

/**
 * PAIRED Environment CLI
 * Part of PAIRED Platform (Platform for AI-Enabled Remote Development)Agent CLI Interface
 * 
 * Provides command-line access to environment state tracking capabilities.
 * Based on production-validated prototype from VectorSEM project.
 * 
 * Usage:
 *   node environment-cli.js snapshot [description]
 *   node environment-cli.js changes [baseline-id]
 *   node environment-cli.js list [limit]
 *   node environment-cli.js compare <snapshot1> <snapshot2>
 *   node environment-cli.js rollback <snapshot-id> [--confirm]
 *   node environment-cli.js health
 *   node environment-cli.js cleanup [keep-count]
 */

class EnvironmentCLI {
    constructor() {
        // Create proper config structure for BaseAgent
        const config = {
            agent: {
                id: 'environment-agent-cli',
                name: 'Environment Agent',
                role: 'Environment Manager',
                persona: '🌍 Environment Guardian - Protecting and managing your development ecosystem'
            }
        };
        
        this.agent = new StandaloneEnvironmentAgent();
        
        console.log('🌍 PAIRED Environment Agent CLI');
        console.log('🔬 Marie (Analyst): "Scientific precision in environment management!"');
        console.log('🏛️ Leonardo (Architecture): "Elegant configuration versioning system!"');
        console.log('⚡ Edison (Dev): "Revolutionary environment tracking capabilities!"');
        console.log('');
    }

    async run() {
        const args = process.argv.slice(2);
        
        if (args.length === 0) {
            this.showHelp();
            return;
        }

        const command = args[0];
        
        try {
            switch (command) {
                case 'snapshot':
                    await this.handleSnapshot(args.slice(1));
                    break;
                    
                case 'changes':
                    await this.handleChanges(args.slice(1));
                    break;
                    
                case 'list':
                    await this.handleList(args.slice(1));
                    break;
                    
                case 'compare':
                    await this.handleCompare(args.slice(1));
                    break;
                    
                case 'rollback':
                    await this.handleRollback(args.slice(1));
                    break;
                    
                case 'health':
                    await this.handleHealth();
                    break;
                    
                case 'cleanup':
                    await this.handleCleanup(args.slice(1));
                    break;
                    
                case 'create-env':
                    await this.handleCreateEnvironment(args);
                    break;
                    
                case 'list-envs':
                case 'environments':
                    await this.handleListEnvironments(args);
                    break;
                    
                case 'switch-env':
                    await this.handleSwitchEnvironment(args);
                    break;
                    
                case 'current-env':
                    await this.handleCurrentEnvironment();
                    break;
                    
                case 'compare-envs':
                    await this.handleCompareEnvironments(args);
                    break;
                    
                case 'delete-env':
                    await this.handleDeleteEnvironment(args);
                    break;
                    
                case 'select-env':
                    await this.handleSelectEnvironment();
                    break;
                    
                case 'dashboard':
                    await this.handleDashboard();
                    break;
                    
                case 'help':
                case '--help':
                case '-h':
                    this.showHelp();
                    break;
                    
                default:
                    console.error(`❌ Unknown command: ${command}`);
                    console.log('Use "help" to see available commands.');
                    process.exit(1);
            }
        } catch (error) {
            console.error('❌ Command failed:', error.message);
            process.exit(1);
        }
    }

    async handleSnapshot(args) {
        const description = args.join(' ') || 'Manual snapshot via CLI';
        
        console.log('🌍 Creating environment snapshot...');
        const result = await this.agent.createSnapshot(description);
        
        if (result.success) {
            console.log('✅ Snapshot created successfully!');
            console.log(`📋 Snapshot ID: ${result.snapshot_id}`);
            console.log(`📊 Files tracked: ${result.files_tracked}`);
            console.log(`💾 Total size: ${this.formatBytes(result.total_size)}`);
            console.log(`📝 Description: ${result.description}`);
        } else {
            console.error('❌ Failed to create snapshot:', result.error);
            process.exit(1);
        }
    }

    async handleChanges(args) {
        const baselineId = args[0] || null;
        
        console.log('🔍 Detecting environment changes...');
        const result = await this.agent.detectChanges(baselineId);
        
        if (result.success) {
            console.log('✅ Change detection complete!');
            console.log(`📋 Baseline: ${result.baseline_id}`);
            console.log(`⏰ Baseline time: ${new Date(result.baseline_timestamp).toLocaleString()}`);
            console.log('');
            console.log('📊 Summary:');
            console.log(`  📝 Modified: ${result.summary.modified_count} files`);
            console.log(`  ➕ Added: ${result.summary.added_count} files`);
            console.log(`  ➖ Deleted: ${result.summary.deleted_count} files`);
            console.log(`  🔢 Total changes: ${result.summary.total_changes}`);
            
            if (result.summary.total_changes > 0) {
                console.log('');
                console.log('📋 Detailed Changes:');
                
                if (result.changes.modified.length > 0) {
                    console.log('  📝 Modified Files:');
                    result.changes.modified.forEach(change => {
                        const sizeChange = change.size_change > 0 ? `+${change.size_change}` : change.size_change;
                        console.log(`    • ${change.file} (${sizeChange} bytes)`);
                    });
                }
                
                if (result.changes.added.length > 0) {
                    console.log('  ➕ Added Files:');
                    result.changes.added.forEach(change => {
                        console.log(`    • ${change.file} (${change.size} bytes)`);
                    });
                }
                
                if (result.changes.deleted.length > 0) {
                    console.log('  ➖ Deleted Files:');
                    result.changes.deleted.forEach(change => {
                        console.log(`    • ${change.file} (was ${change.size} bytes)`);
                    });
                }
            }
        } else {
            console.error('❌ Failed to detect changes:', result.error);
            process.exit(1);
        }
    }

    async handleList(args) {
        const limit = parseInt(args[0]) || 20;
        
        console.log('📋 Listing environment snapshots...');
        const result = await this.agent.listSnapshots(limit);
        
        if (result.success) {
            console.log(`✅ Found ${result.snapshots.length} snapshots (showing ${Math.min(limit, result.snapshots.length)} of ${result.total_count})`);
            console.log('');
            
            if (result.snapshots.length === 0) {
                console.log('📭 No snapshots found. Create your first snapshot with:');
                console.log('   node environment-cli.js snapshot "Initial baseline"');
                return;
            }
            
            console.log('📋 Snapshots:');
            console.log('');
            
            result.snapshots.forEach((snapshot, index) => {
                const isLatest = index === 0;
                const marker = isLatest ? '🌟' : '📸';
                const timeAgo = this.getTimeAgo(new Date(snapshot.timestamp));
                
                console.log(`${marker} ${snapshot.snapshot_id}`);
                console.log(`   📝 ${snapshot.description}`);
                console.log(`   ⏰ ${new Date(snapshot.timestamp).toLocaleString()} (${timeAgo})`);
                console.log(`   📊 ${snapshot.files_count} files, ${this.formatBytes(snapshot.total_size)}`);
                console.log(`   🌿 ${snapshot.git_branch} (${snapshot.git_commit})`);
                
                if (snapshot.tags && snapshot.tags.length > 0) {
                    console.log(`   🏷️  ${snapshot.tags.join(', ')}`);
                }
                
                console.log('');
            });
        } else {
            console.error('❌ Failed to list snapshots:', result.error);
            process.exit(1);
        }
    }

    async handleCompare(args) {
        if (args.length < 2) {
            console.error('❌ Compare requires two snapshot IDs');
            console.log('Usage: node environment-cli.js compare <snapshot1> <snapshot2>');
            process.exit(1);
        }
        
        const snapshot1Id = args[0];
        const snapshot2Id = args[1];
        
        console.log(`🔍 Comparing snapshots: ${snapshot1Id} vs ${snapshot2Id}...`);
        const result = await this.agent.compareSnapshots(snapshot1Id, snapshot2Id);
        
        if (result.success) {
            console.log('✅ Snapshot comparison complete!');
            console.log('');
            console.log('📋 Snapshot 1:');
            console.log(`   📸 ${result.snapshot1.id}`);
            console.log(`   📝 ${result.snapshot1.description}`);
            console.log(`   ⏰ ${new Date(result.snapshot1.timestamp).toLocaleString()}`);
            console.log('');
            console.log('📋 Snapshot 2:');
            console.log(`   📸 ${result.snapshot2.id}`);
            console.log(`   📝 ${result.snapshot2.description}`);
            console.log(`   ⏰ ${new Date(result.snapshot2.timestamp).toLocaleString()}`);
            console.log('');
            console.log('📊 Changes:');
            console.log(`  📝 Modified: ${result.summary.modified_count} files`);
            console.log(`  ➕ Added: ${result.summary.added_count} files`);
            console.log(`  ➖ Deleted: ${result.summary.deleted_count} files`);
            console.log(`  🔢 Total changes: ${result.summary.total_changes}`);
            
            // Show detailed changes (similar to handleChanges)
            if (result.summary.total_changes > 0) {
                console.log('');
                console.log('📋 Detailed Changes:');
                
                if (result.changes.modified.length > 0) {
                    console.log('  📝 Modified Files:');
                    result.changes.modified.forEach(change => {
                        const sizeChange = change.size_change > 0 ? `+${change.size_change}` : change.size_change;
                        console.log(`    • ${change.file} (${sizeChange} bytes)`);
                    });
                }
                
                if (result.changes.added.length > 0) {
                    console.log('  ➕ Added Files:');
                    result.changes.added.forEach(change => {
                        console.log(`    • ${change.file} (${change.size} bytes)`);
                    });
                }
                
                if (result.changes.deleted.length > 0) {
                    console.log('  ➖ Deleted Files:');
                    result.changes.deleted.forEach(change => {
                        console.log(`    • ${change.file} (was ${change.size} bytes)`);
                    });
                }
            }
        } else {
            console.error('❌ Failed to compare snapshots:', result.error);
            process.exit(1);
        }
    }

    async handleRollback(args) {
        if (args.length === 0) {
            console.error('❌ Rollback requires a snapshot ID');
            console.log('Usage: node environment-cli.js rollback <snapshot-id> [--confirm]');
            process.exit(1);
        }
        
        const snapshotId = args[0];
        const confirm = args.includes('--confirm');
        
        if (!confirm) {
            console.log('⚠️  ROLLBACK WARNING ⚠️');
            console.log('');
            console.log('This operation will restore your environment to a previous state.');
            console.log('Current environment files may be overwritten or deleted.');
            console.log('A backup snapshot will be created before rollback.');
            console.log('');
            console.log('To proceed, add --confirm flag:');
            console.log(`   node environment-cli.js rollback ${snapshotId} --confirm`);
            return;
        }
        
        console.log(`🔄 Rolling back to snapshot: ${snapshotId}...`);
        const result = await this.agent.rollbackToSnapshot(snapshotId, true);
        
        if (result.success) {
            console.log('✅ Rollback completed!');
            console.log(`📋 Snapshot: ${result.snapshot_id}`);
            console.log(`💾 Backup created: ${result.backup_snapshot_id}`);
            console.log(`📄 Files restored: ${result.files_restored}`);
            
            if (result.errors > 0) {
                console.log(`⚠️  Errors encountered: ${result.errors}`);
                console.log('📋 Error details:');
                result.error_details.forEach(error => {
                    console.log(`   • ${error.file}: ${error.error}`);
                });
            }
            
            if (result.note) {
                console.log('');
                console.log('📝 Note:', result.note);
            }
        } else {
            console.error('❌ Failed to rollback:', result.error);
            if (result.warning) {
                console.log('⚠️ ', result.warning);
            }
            process.exit(1);
        }
    }

    async handleHealth() {
        console.log('🏥 Checking environment health...');
        const result = await this.agent.getEnvironmentHealth();
        
        if (result.success) {
            const health = result.health;
            console.log(`✅ Environment Status: ${health.status.toUpperCase()}`);
            console.log(`⏰ Check time: ${new Date(health.timestamp).toLocaleString()}`);
            console.log('');
            console.log('📊 Environment Overview:');
            console.log(`  📄 Tracked files: ${health.environment.tracked_files}`);
            console.log(`  💾 Total size: ${this.formatBytes(health.environment.total_size)}`);
            console.log(`  📋 File types: ${Object.keys(health.environment.file_types).length} different types`);
            console.log('');
            console.log('📸 Snapshots:');
            console.log(`  🔢 Total snapshots: ${health.snapshots.total_count}`);
            
            if (health.snapshots.latest_snapshot) {
                const latest = health.snapshots.latest_snapshot;
                const timeAgo = this.getTimeAgo(new Date(latest.timestamp));
                console.log(`  🌟 Latest: ${latest.snapshot_id} (${timeAgo})`);
                console.log(`     📝 ${latest.description}`);
            } else {
                console.log('  📭 No snapshots yet - create your first with: snapshot "Initial baseline"');
            }
            
            console.log('');
            console.log('🌿 Git Status:');
            console.log(`  🌿 Branch: ${health.git.branch}`);
            console.log(`  📝 Commit: ${health.git.commit.substring(0, 8)}`);
            console.log('');
            console.log('⚙️  Configuration:');
            console.log(`  📋 Tracking patterns: ${health.configuration.tracking_patterns}`);
            console.log(`  🚫 Excluded patterns: ${health.configuration.excluded_patterns}`);
            console.log(`  📏 Max file size: ${health.configuration.max_file_size_mb}MB`);
            console.log(`  🔢 Max snapshots: ${health.configuration.max_snapshots}`);
        } else {
            console.error('❌ Environment health check failed:', result.error);
            if (result.health && result.health.status === 'unhealthy') {
                console.log('🏥 System is unhealthy. Try running:');
                console.log('   node environment-cli.js snapshot "Recovery baseline"');
            }
            process.exit(1);
        }
    }

    async handleCleanup(args) {
        const keepCount = parseInt(args[0]) || 50;
        
        console.log(`🗑️  Cleaning up old snapshots (keeping ${keepCount} most recent)...`);
        const deletedCount = await this.agent.cleanupOldSnapshots(keepCount);
        
        if (deletedCount > 0) {
            console.log(`✅ Cleaned up ${deletedCount} old snapshots`);
        } else {
            console.log('✅ No cleanup needed - snapshot count within limits');
        }
    }

    async handleCreateEnvironment(args) {
        const environmentName = args[1];
        const description = args[2] || '';
        const type = args[3] || 'custom';
        const snapshotId = args[4] || null;
        
        if (!environmentName) {
            console.log('❌ Environment name is required');
            console.log('Usage: create-env <name> [description] [type] [snapshot-id]');
            return;
        }
        
        const result = await this.agent.createEnvironment(environmentName, snapshotId, description, type);
        
        if (result.success) {
            console.log(`✅ Environment '${result.environment_name}' created successfully!`);
            console.log(`📋 Type: ${result.type}`);
            console.log(`📝 Description: ${result.description}`);
            console.log(`📸 Snapshot ID: ${result.snapshot_id}`);
        } else {
            console.log(`❌ Failed to create environment: ${result.error}`);
        }
    }
    
    async handleListEnvironments(args) {
        const result = await this.agent.listEnvironments();
        
        if (result.success) {
            console.log('🌍 Available Environments:');
            console.log('');
            
            if (result.environments.length === 0) {
                console.log('📋 No environments found. Create one with: create-env <name>');
                return;
            }
            
            result.environments.forEach((env, index) => {
                const current = env.is_current ? ' (Current: ✅)' : '';
                const timeAgo = this.getTimeAgo(new Date(env.last_accessed));
                const healthIcon = env.health_score >= 90 ? '✅' : env.health_score >= 70 ? '⚠️' : '❌';
                
                console.log(`  ${index + 1}. 🔧 ${env.name}${current}`);
                console.log(`     📋 Type: ${env.type}`);
                console.log(`     📝 ${env.description}`);
                console.log(`     ⏰ Last accessed: ${timeAgo}`);
                console.log(`     🏥 Health: ${healthIcon} ${env.health_score}%`);
                console.log('');
            });
            
            console.log(`📊 Total environments: ${result.total_count}`);
            if (result.current_environment) {
                console.log(`🎯 Current environment: ${result.current_environment}`);
            }
        } else {
            console.log(`❌ Failed to list environments: ${result.error}`);
        }
    }
    
    async handleSwitchEnvironment(args) {
        const environmentName = args[1];
        
        if (!environmentName) {
            console.log('❌ Environment name is required');
            console.log('Usage: switch-env <environment-name>');
            return;
        }
        
        const result = await this.agent.switchToEnvironment(environmentName);
        
        if (result.success) {
            console.log(`✅ Switched to environment '${result.environment_name}'`);
            console.log(`📋 Type: ${result.type}`);
            console.log(`📝 Description: ${result.description}`);
            console.log(`📸 Snapshot ID: ${result.snapshot_id}`);
        } else {
            console.log(`❌ Failed to switch environment: ${result.error}`);
        }
    }
    
    async handleCurrentEnvironment() {
        const result = await this.agent.getCurrentEnvironment();
        
        if (result.success) {
            if (result.environment_name) {
                console.log('🎯 Current Environment:');
                console.log(`📋 Name: ${result.environment_name}`);
                console.log(`📋 Type: ${result.type}`);
                console.log(`📝 Description: ${result.description}`);
                console.log(`📸 Snapshot ID: ${result.snapshot_id}`);
                console.log(`🔄 Switched at: ${new Date(result.switched_at).toLocaleString()}`);
                console.log(`📅 Created at: ${new Date(result.created_at).toLocaleString()}`);
            } else {
                console.log('📋 No environment currently selected');
                console.log('💡 Use "list-envs" to see available environments');
                console.log('💡 Use "switch-env <name>" to select an environment');
            }
        } else {
            console.log(`❌ Failed to get current environment: ${result.error}`);
        }
    }
    
    async handleCompareEnvironments(args) {
        const env1Name = args[1];
        const env2Name = args[2];
        
        if (!env1Name || !env2Name) {
            console.log('❌ Two environment names are required');
            console.log('Usage: compare-envs <env1> <env2>');
            return;
        }
        
        const result = await this.agent.compareEnvironments(env1Name, env2Name);
        
        if (result.success) {
            console.log(`🔍 Comparing environments '${env1Name}' vs '${env2Name}':`);
            console.log('');
            console.log(`📋 Environment 1: ${result.environment1.name} (${result.environment1.type})`);
            console.log(`📝 ${result.environment1.description}`);
            console.log('');
            console.log(`📋 Environment 2: ${result.environment2.name} (${result.environment2.type})`);
            console.log(`📝 ${result.environment2.description}`);
            console.log('');
            
            if (result.changes && result.changes.length > 0) {
                console.log('📊 Differences found:');
                result.changes.forEach(change => {
                    const icon = change.type === 'modified' ? '📝' : change.type === 'added' ? '➕' : '➖';
                    console.log(`  ${icon} ${change.file} (${change.type})`);
                });
            } else {
                console.log('✅ No differences found - environments are identical');
            }
            
            if (result.summary) {
                console.log('');
                console.log('📊 Summary:');
                console.log(`  📄 Files compared: ${result.summary.total_files || 0}`);
                console.log(`  📝 Modified: ${result.summary.modified || 0}`);
                console.log(`  ➕ Added: ${result.summary.added || 0}`);
                console.log(`  ➖ Removed: ${result.summary.removed || 0}`);
            }
        } else {
            console.log(`❌ Failed to compare environments: ${result.error}`);
        }
    }
    
    async handleDeleteEnvironment(args) {
        const environmentName = args[1];
        const confirm = args.includes('--confirm');
        
        if (!environmentName) {
            console.log('❌ Environment name is required');
            console.log('Usage: delete-env <environment-name> --confirm');
            return;
        }
        
        if (!confirm) {
            console.log('⚠️  Environment deletion requires confirmation');
            console.log('⚠️  This operation cannot be undone');
            console.log(`💡 Use: delete-env ${environmentName} --confirm`);
            console.log('⚠️      globalPath: path.join(require(\'os\').homedir(), \'.paired\'),');
            return;
        }
        
        const result = await this.agent.deleteEnvironment(environmentName, confirm);
        
        if (result.success) {
            console.log(`✅ Environment '${result.environment_name}' deleted successfully`);
        } else {
            console.log(`❌ Failed to delete environment: ${result.error}`);
            if (result.suggestion) {
                console.log(`💡 ${result.suggestion}`);
            }
        }
    }
    
    async handleSelectEnvironment() {
        console.log('🌍 PAIRED Interactive Environment Selector');
        console.log('🔄 Loading environments...');
        
        const result = await this.agent.listEnvironments();
        
        if (!result.success) {
            console.log(`❌ Failed to load environments: ${result.error}`);
            return;
        }
        
        if (result.environments.length === 0) {
            console.log('📋 No environments found.');
            console.log('💡 Create your first environment with: create-env <name>');
            return;
        }
        
        console.log('');
        console.log('📋 Available Environments:');
        console.log('');
        
        result.environments.forEach((env, index) => {
            const current = env.is_current ? ' (Current: ✅)' : '';
            const timeAgo = this.getTimeAgo(new Date(env.last_accessed));
            const healthIcon = env.health_score >= 90 ? '✅' : env.health_score >= 70 ? '⚠️' : '❌';
            const typeIcon = this.getTypeIcon(env.type);
            
            console.log(`  ${typeIcon} ${env.name}${current}  - ${env.description}`);
            console.log(`     📋 Type: ${env.type} | ⏰ ${timeAgo} | 🏥 ${healthIcon} ${env.health_score}%`);
            console.log('');
        });
        
        console.log('📋 Actions:');
        console.log('  💡 Use "switch-env <name>" to switch to an environment');
        console.log('  💡 Use "create-env <name>" to create a new environment');
        console.log('  💡 Use "compare-envs <env1> <env2>" to compare environments');
        console.log('  💡 Use "dashboard" for a comprehensive overview');
    }
    
    async handleDashboard() {
        console.log('🌍 PAIRED Environment Dashboard');
        console.log('');
        
        const result = await this.agent.listEnvironments();
        
        if (!result.success) {
            console.log(`❌ Failed to load dashboard: ${result.error}`);
            return;
        }
        
        console.log('📊 Environment Overview:');
        console.log('┌─────────────────────────┬─────────┬──────────────┬─────────────┬────────────┐');
        console.log('│ Environment             │ Type    │ Last Updated │ Health      │ Status     │');
        console.log('├─────────────────────────┼─────────┼──────────────┼─────────────┼────────────┤');
        
        if (result.environments.length === 0) {
            console.log('│ No environments found   │         │              │             │            │');
        } else {
            result.environments.forEach(env => {
                const current = env.is_current ? '✅ Current' : '⚪ Available';
                const timeAgo = this.getTimeAgo(new Date(env.last_accessed));
                const healthIcon = env.health_score >= 90 ? '✅ Healthy' : env.health_score >= 70 ? '⚠️ Warning' : '❌ Issues';
                const typeIcon = this.getTypeIcon(env.type);
                
                const name = `${typeIcon} ${env.name}`.padEnd(23);
                const type = env.type.padEnd(7);
                const time = timeAgo.padEnd(12);
                const health = healthIcon.padEnd(11);
                const status = current.padEnd(10);
                
                console.log(`│ ${name} │ ${type} │ ${time} │ ${health} │ ${status} │`);
            });
        }
        
        console.log('└─────────────────────────┴─────────┴──────────────┴─────────────┴────────────┘');
        console.log('');
        
        if (result.current_environment) {
            console.log(`🎯 Current Environment: ${result.current_environment}`);
        } else {
            console.log('📋 No environment currently selected');
        }
        
        console.log(`📊 Total Environments: ${result.total_count}`);
        console.log('');
        
        console.log('🎯 Quick Actions:');
        console.log('  [s] switch-env <name>     Switch to environment');
        console.log('  [c] create-env <name>     Create new environment');
        console.log('  [h] health                Check all environment health');
        console.log('  [d] compare-envs <a> <b>  Compare two environments');
    }
    
    getTypeIcon(type) {
        const icons = {
            'dev': '🔧',
            'development': '🔧',
            'test': '🧪',
            'testing': '🧪',
            'prod': '🚀',
            'production': '🚀',
            'feature': '🎨',
            'experimental': '🔬',
            'client': '👤',
            'demo': '👤',
            'bugfix': '🐛',
            'fix': '🐛',
            'release': '📦',
            'security': '🔒',
            'performance': '⚡',
            'custom': '⚙️'
        };
        
        return icons[type.toLowerCase()] || '⚙️';
    }

    showHelp() {
        console.log('🌍 PAIRED Environment Agent - Development Environment State Management');
        console.log('');
        console.log('📋 Snapshot Commands:');
        console.log('');
        console.log('  📸 snapshot [description]           Create environment snapshot');
        console.log('  🔍 changes [baseline-id]           Detect changes since baseline');
        console.log('  📋 list [limit]                    List available snapshots');
        console.log('  🔍 compare <snap1> <snap2>         Compare two snapshots');
        console.log('  🔄 rollback <snapshot-id> [--confirm]  Rollback to snapshot');
        console.log('  🏥 health                          Check environment health');
        console.log('  🗑️  cleanup [keep-count]            Clean up old snapshots');
        console.log('');
        console.log('🌍 Environment Commands:');
        console.log('');
        console.log('  🌟 create-env <name> [desc] [type]  Create new environment');
        console.log('  📋 list-envs / environments         List all environments');
        console.log('  🔄 switch-env <name>               Switch to environment');
        console.log('  🎯 current-env                     Show current environment');
        console.log('  🔍 compare-envs <env1> <env2>      Compare two environments');
        console.log('  🗑️  delete-env <name> --confirm     Delete environment');
        console.log('  🎛️  select-env                      Interactive environment selector');
        console.log('  📊 dashboard                       Environment dashboard');
        console.log('');
        console.log('📖 Examples:');
        console.log('');
        console.log('  # Snapshot management');
        console.log('  node environment-cli.js snapshot "Initial PAIRED setup"');
        console.log('  node environment-cli.js changes');
        console.log('  node environment-cli.js list 10');
        console.log('');
        console.log('  # Environment management');
        console.log('  node environment-cli.js create-env dev-main "Main development" dev');
        console.log('  node environment-cli.js switch-env dev-main');
        console.log('  node environment-cli.js compare-envs dev-main testing-v2.1');
        console.log('  node environment-cli.js dashboard');
        console.log('');
        console.log('🔬 Built by the PAIRED Team with scientific precision and architectural elegance!');
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }
}

// Run CLI if called directly
if (require.main === module) {
    const cli = new EnvironmentCLI();
    cli.run().catch(error => {
        console.error('❌ CLI Error:', error.message);
        process.exit(1);
    });
}

module.exports = EnvironmentCLI;
