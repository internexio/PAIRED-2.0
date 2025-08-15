/**
 * PAIRED Dynamic Text Pacing System
 * 
 * Manages realistic typing flow with natural pauses and 40-60 WPM pacing
 * for authentic demo experiences.
 */

class TextPacer {
  constructor(options = {}) {
    // Optimized for Cascade demos - very thoughtful, contemplative pace
    this.wpmMin = options.wpmMin || 10;
    this.wpmMax = options.wpmMax || 15;
    this.currentWPM = this.randomWPM();
    
    // Typing state for bursts and pauses
    this.burstMode = false;
    this.burstCharsLeft = 0;
    this.nextRandomPause = this.getNextRandomPausePosition();
    this.charsSinceLastPause = 0;
    
    // Pause multipliers for different punctuation
    this.pauseMultipliers = {
      '.': 3.0,    // Full stop - long pause
      '!': 2.5,    // Exclamation - emphasis pause
      '?': 2.5,    // Question - thinking pause
      ',': 1.5,    // Comma - short pause
      ';': 2.0,    // Semicolon - medium pause
      ':': 1.8,    // Colon - setup pause
      '...': 4.0,  // Ellipsis - dramatic pause
      '-': 1.2,    // Dash - slight pause
      '"': 1.3,    // Quote - emphasis pause
      '*': 1.5     // Emphasis marker - pause
    };
    
    // Emotional typing patterns
    this.emotionalPatterns = {
      excited: { wpmBoost: 1.2, pauseReduction: 0.8 },
      thoughtful: { wpmBoost: 0.8, pauseReduction: 1.5 },
      confident: { wpmBoost: 1.1, pauseReduction: 0.9 },
      careful: { wpmBoost: 0.7, pauseReduction: 1.8 }
    };
  }

  /**
   * Get next random pause position (every 8-25 characters)
   */
  getNextRandomPausePosition() {
    return 8 + Math.floor(Math.random() * 17); // 8-25 chars
  }

  /**
   * Check if we should start a typing burst (20% chance)
   */
  shouldStartBurst() {
    return Math.random() < 0.2;
  }

  /**
   * Generate random pause duration (thinking pauses)
   */
  getRandomPauseDuration() {
    return 800 + Math.random() * 1500; // 800-2300ms
  }

  /**
   * Calculate realistic typing delay based on text content
   */
  calculateDelay(text, position = 0, emotion = 'neutral') {
    const char = text[position];
    this.charsSinceLastPause++;
    
    // Check for random thinking pause
    if (this.charsSinceLastPause >= this.nextRandomPause && !this.burstMode) {
      this.charsSinceLastPause = 0;
      this.nextRandomPause = this.getNextRandomPausePosition();
      return this.getRandomPauseDuration();
    }
    
    // Check if we should start a burst
    if (!this.burstMode && this.shouldStartBurst()) {
      this.burstMode = true;
      this.burstCharsLeft = 3 + Math.floor(Math.random() * 8); // 3-10 chars
    }
    
    let baseDelay = this.getBaseCharDelay();
    
    // Apply burst mode (faster typing)
    if (this.burstMode) {
      baseDelay *= 0.4; // Much faster during bursts
      this.burstCharsLeft--;
      if (this.burstCharsLeft <= 0) {
        this.burstMode = false;
      }
    }
    
    // Apply emotional pattern
    let delay = baseDelay;
    if (this.emotionalPatterns[emotion]) {
      const pattern = this.emotionalPatterns[emotion];
      delay = baseDelay / pattern.wpmBoost;
    }
    
    // Check for punctuation pauses
    for (const [punct, multiplier] of Object.entries(this.pauseMultipliers)) {
      if (text.substr(position, punct.length) === punct) {
        delay *= multiplier;
        if (this.emotionalPatterns[emotion]) {
          delay *= this.emotionalPatterns[emotion].pauseReduction;
        }
        // End burst mode on punctuation
        this.burstMode = false;
        break;
      }
    }
    
    // Add natural variation (±30% for more randomness)
    delay *= (0.7 + Math.random() * 0.6);
    
    return Math.max(delay, 30); // Minimum 30ms between characters
  }

  /**
   * Get base character delay for current WPM
   */
  getBaseCharDelay() {
    // Average word length is 5 characters
    // WPM = words per minute, so characters per minute = WPM * 5
    // Characters per second = (WPM * 5) / 60
    // Milliseconds per character = 1000 / (characters per second)
    const charsPerSecond = (this.currentWPM * 5) / 60;
    return 1000 / charsPerSecond;
  }

  /**
   * Generate random WPM within range
   */
  randomWPM() {
    return this.wpmMin + Math.random() * (this.wpmMax - this.wpmMin);
  }

  /**
   * Type out text with realistic pacing
   */
  async typeText(text, options = {}) {
    const emotion = options.emotion || 'neutral';
    const onChar = options.onChar || (() => {});
    const onPause = options.onPause || (() => {});
    
    let output = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      output += char;
      
      // Call character callback
      onChar(char, output, i);
      
      // Calculate and apply delay
      if (i < text.length - 1) {
        const delay = this.calculateDelay(text, i, emotion);
        
        // Call pause callback for longer pauses
        if (delay > 500) {
          onPause(delay, char);
        }
        
        await this.sleep(delay);
        
        // Occasionally adjust WPM for natural variation
        if (Math.random() < 0.1) {
          this.currentWPM = this.randomWPM();
        }
      }
    }
    
    return output;
  }

  /**
   * Type multiple lines with agent-specific pacing
   */
  async typeAgentLines(lines, agentType = 'neutral') {
    const agentEmotions = {
      'sherlock': 'thoughtful',
      'alex': 'confident', 
      'leonardo': 'thoughtful',
      'edison': 'excited',
      'maya': 'careful',
      'marie': 'thoughtful',
      'vince': 'confident'
    };
    
    const emotion = agentEmotions[agentType] || 'neutral';
    
    for (const line of lines) {
      await this.typeText(line, { 
        emotion,
        onChar: (char, output) => {
          // In real implementation, this would update the display
          process.stdout.write(char);
        },
        onPause: (delay, char) => {
          // Just a time pause, no visual indicator
          // The delay itself creates the natural pause effect
        }
      });
      
      // Pause between lines
      await this.sleep(800 + Math.random() * 400);
      process.stdout.write('\n\n');
    }
  }

  /**
   * Utility sleep function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Demo the pacing system
   */
  async demo() {
    console.log('🎭 PAIRED Text Pacing Demo Starting...\n');
    
    const demoLines = [
      "🕵️ Sherlock (QA): \"Greetings! I'm your quality detective... here to investigate and ensure excellence!\"",
      "👑 Alex (PM): \"Strategic coordination is my specialty - let's build something extraordinary!\"",
      "🏛️ Leonardo (Architecture): \"Architectural vision guides us... I design systems that inspire!\""
    ];
    
    await this.typeAgentLines(demoLines, 'sherlock');
    
    console.log('\n🎭 Demo Complete!');
  }
}

module.exports = TextPacer;

// CLI execution
if (require.main === module) {
  const pacer = new TextPacer({ wpmMin: 40, wpmMax: 60 });
  pacer.demo().catch(console.error);
}
