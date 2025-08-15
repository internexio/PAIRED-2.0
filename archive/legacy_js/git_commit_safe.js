#!/usr/bin/env node
// Safe Git Commit for Tool Calls
// Handles multi-line commit messages with proper escaping
// Usage: node git_commit_safe.js "Title" "Bullet1" "Bullet2" ...

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to sanitize commit message lines
function sanitizeCommitLine(line) {
    return line
        .replace(/"/g, '\\"')        // Escape double quotes
        .replace(/`/g, '\\`')        // Escape backticks  
        .replace(/\$/g, '\\$')       // Escape dollar signs
        .trim();                     // Remove whitespace
}

// Function to validate commit message
function validateCommitMessage(title, bullets) {
    const warnings = [];
    
    // Check title length
    if (title.length > 72) {
        warnings.push(`Title is ${title.length} chars (recommended < 50)`);
    }
    
    // Check bullet format
    bullets.forEach(bullet => {
        if (!/^[\s]*[-*+][\s]/.test(bullet)) {
            warnings.push(`'${bullet}' doesn't start with bullet point`);
        }
    });
    
    return warnings;
}

// Function to build commit message
function buildCommitMessage(title, bullets) {
    const sanitizedTitle = sanitizeCommitLine(title);
    
    if (bullets.length === 0) {
        return sanitizedTitle;
    }
    
    const sanitizedBullets = bullets.map(sanitizeCommitLine);
    return [sanitizedTitle, '', ...sanitizedBullets].join('\n');
}

// Function to execute git commit safely
function executeGitCommit(commitMessage) {
    // Write to temporary file to avoid shell escaping issues
    const tempFile = path.join('/tmp', `git-commit-${Date.now()}.txt`);
    
    try {
        fs.writeFileSync(tempFile, commitMessage, 'utf8');
        
        // Execute git commit using file input
        execSync(`git commit --file="${tempFile}"`, { 
            stdio: 'inherit',
            timeout: 30000  // 30 second timeout
        });
        
        console.log('✅ Commit successful');
        return true;
        
    } catch (error) {
        console.error('❌ Commit failed:', error.message);
        return false;
        
    } finally {
        // Clean up temp file
        try {
            fs.unlinkSync(tempFile);
        } catch (e) {
            // Ignore cleanup errors
        }
    }
}

// Main execution
function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
        console.error('❌ Usage: node git_commit_safe.js "Title" ["Bullet1"] ["Bullet2"] ...');
        process.exit(1);
    }
    
    const title = args[0];
    const bullets = args.slice(1);
    
    // Validate commit message
    const warnings = validateCommitMessage(title, bullets);
    warnings.forEach(warning => console.warn(`⚠️ ${warning}`));
    
    // Build safe commit message
    const commitMessage = buildCommitMessage(title, bullets);
    
    console.log('📝 Commit message:');
    console.log('----------------------------------------');
    console.log(commitMessage);
    console.log('----------------------------------------');
    
    // Execute commit
    const success = executeGitCommit(commitMessage);
    process.exit(success ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { sanitizeCommitLine, buildCommitMessage, executeGitCommit };
