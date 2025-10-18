import { AgentDecision } from '@/types/agent';
import { EventEmitter } from 'events';

// In-memory store for agent decisions with event emitter
class AgentDecisionStore extends EventEmitter {
  private decisions: Map<string, AgentDecision> = new Map();

  // Register a new decision (only if it doesn't already exist)
  registerDecision(decision: AgentDecision): { success: boolean; message: string; decision?: AgentDecision } {
    if (this.decisions.has(decision.id)) {
      return {
        success: false,
        message: 'Decision already exists',
        decision: this.decisions.get(decision.id)
      };
    }

    this.decisions.set(decision.id, decision);
    console.log(`✅ Registered new decision: ${decision.id} - Agent ${decision.agentId} ${decision.decision} ${decision.itemName}`);
    
    // Emit event for real-time streaming
    this.emit('newDecision', decision);
    
    return {
      success: true,
      message: 'Decision registered successfully',
      decision
    };
  }

  // Get a specific decision by ID
  getDecision(id: string): AgentDecision | undefined {
    return this.decisions.get(id);
  }

  // Get all decisions for a specific agent
  getDecisionsByAgent(agentId: string): AgentDecision[] {
    return Array.from(this.decisions.values())
      .filter(d => d.agentId === agentId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get all decisions
  getAllDecisions(): AgentDecision[] {
    return Array.from(this.decisions.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get decisions by item
  getDecisionsByItem(itemId: string): AgentDecision[] {
    return Array.from(this.decisions.values())
      .filter(d => d.itemId === itemId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // Clear all decisions (useful for testing)
  clear(): void {
    this.decisions.clear();
    console.log('🗑️  Cleared all decisions');
  }

  // Get stats
  getStats() {
    const all = Array.from(this.decisions.values());
    return {
      total: all.length,
      buy: all.filter(d => d.decision === 'BUY').length,
      ignore: all.filter(d => d.decision === 'IGNORE').length,
      uniqueAgents: new Set(all.map(d => d.agentId)).size,
      uniqueItems: new Set(all.map(d => d.itemId)).size
    };
  }
}

// Export singleton instance
export const agentDecisionStore = new AgentDecisionStore();
