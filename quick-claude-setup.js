#!/usr/bin/env node
// Quick Claude Code Integration for PAIRED
// Setup time: ~15 minutes

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';

class QuickClaudeBridge {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY
    });
    this.pairedPath = process.cwd();
  }

  async loadPAIREDFiles() {
    const directories = [
      'PAIRED_ClaudeCode_2.0',
      'PAIRED_Windsurf_1.0', 
      'PAIRED_EmotionEngine'
    ];
    
    const files = [];
    for (const dir of directories) {
      const dirPath = path.join(this.pairedPath, dir);
      const dirFiles = await fs.readdir(dirPath);
      
      for (const file of dirFiles.filter(f => f.endsWith('.md'))) {
        const content = await fs.readFile(path.join(dirPath, file), 'utf8');
        files.push({ name: file, path: `${dir}/${file}`, content });
      }
    }
    return files;
  }

  async processWithClaude(prompt, files) {
    // Process files in smaller chunks to avoid rate limits
    const chunkSize = 5;
    const results = [];
    
    for (let i = 0; i < files.length; i += chunkSize) {
      const chunk = files.slice(i, i + chunkSize);
      const fileContext = chunk.map(f => 
        `## ${f.name}\n${f.content.substring(0, 1500)}...`
      ).join('\n\n');

      try {
        console.log(`Processing chunk ${Math.floor(i/chunkSize) + 1}/${Math.ceil(files.length/chunkSize)}...`);
        
        const message = await this.client.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 3000,
          messages: [{
            role: "user", 
            content: `${prompt}\n\nPAIRED Files (Chunk ${Math.floor(i/chunkSize) + 1}):\n${fileContext}`
          }]
        });
        
        results.push(message.content[0].text);
        
        // Wait between requests to respect rate limits
        if (i + chunkSize < files.length) {
          console.log('Waiting 2 seconds to respect rate limits...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        if (error.status === 429) {
          console.log(`Rate limit hit. Waiting 10 seconds before retry...`);
          await new Promise(resolve => setTimeout(resolve, 10000));
          i -= chunkSize; // Retry this chunk
        } else {
          throw error;
        }
      }
    }
    
    return results.join('\n\n---\n\n');
  }

  async planProject() {
    const files = await this.loadPAIREDFiles();
    const prompt = `
    Analyze these PAIRED documentation files and create a comprehensive project plan.
    Focus on:
    1. Implementation priorities
    2. Dependencies between components  
    3. Quick wins for tonight's work
    4. Claude Code integration strategy
    `;
    
    return await this.processWithClaude(prompt, files);
  }
}

// Quick setup and test
async function main() {
  if (!process.env.CLAUDE_API_KEY) {
    console.log('Set CLAUDE_API_KEY environment variable');
    process.exit(1);
  }

  const bridge = new QuickClaudeBridge();
  console.log('Loading PAIRED files...');
  
  const plan = await bridge.planProject();
  console.log('=== PAIRED Project Analysis ===');
  console.log(plan);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default QuickClaudeBridge;
