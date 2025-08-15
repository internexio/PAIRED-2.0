#!/usr/bin/env python3
"""
PAIRED Learning Tracker - Advanced Pattern Recognition and Memory Enhancement

This module tracks learning patterns across all PAIRED agents and projects,
enabling continuous improvement and cross-project knowledge sharing.

Philosophy: "Intelligence Through Adaptation"
- Learns from every interaction and decision
- Identifies patterns that improve agent performance
- Enables knowledge transfer between projects
- Builds collective intelligence over time
"""

import json
import os
import sys
import hashlib
import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from collections import defaultdict, Counter
import re

@dataclass
class LearningEntry:
    """Represents a single learning event or pattern"""
    timestamp: str
    agent: str
    project: str
    pattern_type: str
    context: Dict[str, Any]
    outcome: str
    confidence: float
    tags: List[str]
    hash_id: str

@dataclass
class PatternInsight:
    """Represents a discovered pattern with statistical significance"""
    pattern_id: str
    pattern_type: str
    frequency: int
    success_rate: float
    contexts: List[Dict[str, Any]]
    agents: List[str]
    projects: List[str]
    recommendations: List[str]
    last_seen: str

class LearningTracker:
    """
    Advanced learning and pattern recognition system for PAIRED agents
    """
    
    def __init__(self, project_path: str = None, global_path: str = None):
        self.project_path = Path(project_path) if project_path else Path.cwd()
        self.global_path = Path(global_path) if global_path else Path.home() / '.paired'
        
        # Memory storage paths
        self.project_memory = self.project_path / '.paired' / 'memory'
        self.global_memory = self.global_path / 'memory'
        self.learning_db = self.project_memory / 'learning_patterns.json'
        self.insights_db = self.project_memory / 'pattern_insights.json'
        
        # Pattern recognition settings
        self.min_pattern_frequency = 3
        self.min_confidence_threshold = 0.7
        self.pattern_types = {
            'code_quality': ['bug_fix', 'refactor', 'optimization'],
            'architecture': ['design_pattern', 'component_structure', 'dependency'],
            'workflow': ['process_improvement', 'automation', 'efficiency'],
            'learning': ['knowledge_gap', 'skill_development', 'insight'],
            'collaboration': ['team_coordination', 'communication', 'handoff']
        }
        
        self.initialize_storage()
    
    def initialize_storage(self):
        """Initialize memory storage directories and files"""
        self.project_memory.mkdir(parents=True, exist_ok=True)
        self.global_memory.mkdir(parents=True, exist_ok=True)
        
        # Initialize learning database if it doesn't exist
        if not self.learning_db.exists():
            self._save_json(self.learning_db, [])
        
        if not self.insights_db.exists():
            self._save_json(self.insights_db, {})
    
    def record_learning(self, agent: str, pattern_type: str, context: Dict[str, Any], 
                       outcome: str, confidence: float = 0.8, tags: List[str] = None) -> str:
        """
        Record a learning event for pattern analysis
        
        Args:
            agent: Name of the agent (e.g., 'sherlock', 'leonardo', 'edison')
            pattern_type: Type of pattern (e.g., 'bug_fix', 'design_pattern')
            context: Contextual information about the event
            outcome: Result or outcome of the event
            confidence: Confidence level (0.0 to 1.0)
            tags: Optional tags for categorization
        
        Returns:
            Unique hash ID for the learning entry
        """
        timestamp = datetime.datetime.now().isoformat()
        project_name = self.project_path.name
        
        # Create unique hash for this learning entry
        hash_content = f"{timestamp}{agent}{pattern_type}{str(context)}{outcome}"
        hash_id = hashlib.sha256(hash_content.encode()).hexdigest()[:16]
        
        entry = LearningEntry(
            timestamp=timestamp,
            agent=agent,
            project=project_name,
            pattern_type=pattern_type,
            context=context,
            outcome=outcome,
            confidence=confidence,
            tags=tags or [],
            hash_id=hash_id
        )
        
        # Load existing learning data
        learning_data = self._load_json(self.learning_db, [])
        learning_data.append(asdict(entry))
        
        # Save updated learning data
        self._save_json(self.learning_db, learning_data)
        
        # Update pattern insights
        self._update_pattern_insights(entry)
        
        return hash_id
    
    def analyze_patterns(self, agent: str = None, pattern_type: str = None, 
                        days_back: int = 30) -> List[PatternInsight]:
        """
        Analyze learning patterns and extract insights
        """
        learning_data = self._load_json(self.learning_db, [])
        
        # Filter by date range
        cutoff_date = datetime.datetime.now() - datetime.timedelta(days=days_back)
        filtered_data = [
            entry for entry in learning_data
            if datetime.datetime.fromisoformat(entry['timestamp']) >= cutoff_date
        ]
        
        # Apply filters
        if agent:
            filtered_data = [e for e in filtered_data if e['agent'] == agent]
        if pattern_type:
            filtered_data = [e for e in filtered_data if e['pattern_type'] == pattern_type]
        
        # Group by pattern characteristics
        pattern_groups = defaultdict(list)
        for entry in filtered_data:
            signature = self._create_pattern_signature(entry)
            pattern_groups[signature].append(entry)
        
        # Generate insights for patterns with sufficient frequency
        insights = []
        for signature, entries in pattern_groups.items():
            if len(entries) >= self.min_pattern_frequency:
                insight = self._generate_pattern_insight(signature, entries)
                if insight.success_rate >= self.min_confidence_threshold:
                    insights.append(insight)
        
        insights.sort(key=lambda x: (x.frequency, x.success_rate), reverse=True)
        return insights
    
    def get_recommendations(self, agent: str, context: Dict[str, Any]) -> List[str]:
        """Get recommendations based on learned patterns for a specific context"""
        insights = self.analyze_patterns(agent=agent)
        recommendations = []
        
        for insight in insights:
            if self._context_matches_pattern(context, insight.contexts):
                recommendations.extend(insight.recommendations)
        
        return list(dict.fromkeys(recommendations))[:5]
    
    def sync_with_global(self) -> Dict[str, int]:
        """Sync project learning data with global PAIRED knowledge base"""
        project_data = self._load_json(self.learning_db, [])
        global_db = self.global_memory / 'global_learning_patterns.json'
        global_data = self._load_json(global_db, [])
        
        # Merge project data into global data (avoid duplicates)
        existing_hashes = {entry['hash_id'] for entry in global_data}
        new_entries = [entry for entry in project_data if entry['hash_id'] not in existing_hashes]
        
        global_data.extend(new_entries)
        self._save_json(global_db, global_data)
        
        # Update project with global insights
        global_insights = self._analyze_global_patterns(global_data)
        project_insights = self._load_json(self.insights_db, {})
        
        # Merge relevant global insights
        merged_count = 0
        for insight_id, insight in global_insights.items():
            if self._is_insight_relevant(insight, self.project_path.name):
                project_insights[insight_id] = insight
                merged_count += 1
        
        self._save_json(self.insights_db, project_insights)
        
        return {
            'uploaded': len(new_entries),
            'downloaded': merged_count,
            'total_global': len(global_data),
            'total_local': len(project_data)
        }
    
    # Private helper methods
    
    def _load_json(self, path: Path, default: Any = None) -> Any:
        """Load JSON data from file with error handling"""
        try:
            if path.exists():
                with open(path, 'r') as f:
                    return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            print(f"Warning: Could not load {path}: {e}")
        return default
    
    def _save_json(self, path: Path, data: Any):
        """Save JSON data to file with error handling"""
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
            with open(path, 'w') as f:
                json.dump(data, f, indent=2, default=str)
        except IOError as e:
            print(f"Error: Could not save {path}: {e}")
    
    def _create_pattern_signature(self, entry: Dict[str, Any]) -> str:
        """Create a unique signature for pattern grouping"""
        context_keys = sorted(entry['context'].keys())
        context_signature = '_'.join(context_keys[:3])
        return f"{entry['pattern_type']}_{context_signature}"
    
    def _generate_pattern_insight(self, signature: str, entries: List[Dict[str, Any]]) -> PatternInsight:
        """Generate insight from a group of similar patterns"""
        frequency = len(entries)
        successful_outcomes = [e for e in entries if 'success' in e['outcome'].lower() or e['confidence'] > 0.7]
        success_rate = len(successful_outcomes) / frequency if frequency > 0 else 0.0
        
        agents = list(set(e['agent'] for e in entries))
        projects = list(set(e['project'] for e in entries))
        contexts = [e['context'] for e in entries]
        recommendations = self._extract_recommendations(successful_outcomes)
        
        pattern_id = hashlib.sha256(signature.encode()).hexdigest()[:12]
        last_seen = max(e['timestamp'] for e in entries)
        
        return PatternInsight(
            pattern_id=pattern_id,
            pattern_type=signature.split('_')[0],
            frequency=frequency,
            success_rate=success_rate,
            contexts=contexts,
            agents=agents,
            projects=projects,
            recommendations=recommendations,
            last_seen=last_seen
        )
    
    def _extract_recommendations(self, successful_entries: List[Dict[str, Any]]) -> List[str]:
        """Extract actionable recommendations from successful patterns"""
        recommendations = []
        
        for entry in successful_entries:
            outcome = entry['outcome']
            
            if 'refactor' in outcome.lower():
                recommendations.append("Consider refactoring similar code patterns")
            if 'test' in outcome.lower():
                recommendations.append("Add comprehensive tests for this pattern")
            if 'performance' in outcome.lower():
                recommendations.append("Monitor performance impact of similar changes")
            if 'documentation' in outcome.lower():
                recommendations.append("Document this pattern for future reference")
        
        return list(set(recommendations))
    
    def _update_pattern_insights(self, entry: LearningEntry):
        """Update pattern insights with new learning entry"""
        insights = self._load_json(self.insights_db, {})
        pattern_key = f"{entry.agent}_{entry.pattern_type}"
        
        if pattern_key not in insights:
            insights[pattern_key] = {
                'count': 0,
                'success_count': 0,
                'last_updated': entry.timestamp,
                'examples': []
            }
        
        insight = insights[pattern_key]
        insight['count'] += 1
        insight['last_updated'] = entry.timestamp
        
        if entry.confidence > 0.7:
            insight['success_count'] += 1
        
        insight['examples'].append({
            'context': entry.context,
            'outcome': entry.outcome,
            'confidence': entry.confidence
        })
        
        if len(insight['examples']) > 5:
            insight['examples'] = insight['examples'][-5:]
        
        self._save_json(self.insights_db, insights)
    
    def _context_matches_pattern(self, context: Dict[str, Any], pattern_contexts: List[Dict[str, Any]]) -> bool:
        """Check if current context matches learned patterns"""
        for pattern_context in pattern_contexts:
            matches = 0
            total_keys = len(pattern_context)
            
            for key, value in pattern_context.items():
                if key in context and str(context[key]).lower() == str(value).lower():
                    matches += 1
            
            # Consider it a match if 60% of context keys match
            if matches / total_keys >= 0.6:
                return True
        
        return False
    
    def _analyze_global_patterns(self, global_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze global patterns for cross-project insights"""
        # Simplified global analysis - can be enhanced
        insights = {}
        pattern_groups = defaultdict(list)
        
        for entry in global_data:
            pattern_key = f"{entry['pattern_type']}_{entry['agent']}"
            pattern_groups[pattern_key].append(entry)
        
        for pattern_key, entries in pattern_groups.items():
            if len(entries) >= 5:  # Higher threshold for global patterns
                insights[pattern_key] = {
                    'frequency': len(entries),
                    'projects': list(set(e['project'] for e in entries)),
                    'success_rate': len([e for e in entries if e['confidence'] > 0.7]) / len(entries)
                }
        
        return insights
    
    def _is_insight_relevant(self, insight: Dict[str, Any], project_name: str) -> bool:
        """Check if a global insight is relevant to the current project"""
        # Simple relevance check - can be enhanced with ML
        return insight.get('success_rate', 0) > 0.8 and len(insight.get('projects', [])) > 2


if __name__ == "__main__":
    # CLI interface for testing
    tracker = LearningTracker()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "test":
            # Test recording a learning event
            hash_id = tracker.record_learning(
                agent="sherlock",
                pattern_type="bug_fix",
                context={"file_type": "javascript", "error_type": "undefined_variable"},
                outcome="Successfully fixed undefined variable issue",
                confidence=0.9,
                tags=["debugging", "javascript"]
            )
            print(f"Recorded learning event: {hash_id}")
            
        elif command == "analyze":
            insights = tracker.analyze_patterns()
            print(f"Found {len(insights)} patterns:")
            for insight in insights[:3]:  # Show top 3
                print(f"- {insight.pattern_type}: {insight.frequency} occurrences, {insight.success_rate:.1%} success")
        
        elif command == "sync":
            stats = tracker.sync_with_global()
            print(f"Sync complete: {stats}")
    
    else:
        print("Usage: learning_tracker.py [test|analyze|sync]")
