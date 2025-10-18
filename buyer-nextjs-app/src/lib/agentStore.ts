import { Agent } from '@/types/agent';
import { EventEmitter } from 'events';

// In-memory store for agents with event emitter
class AgentStore extends EventEmitter {
  private agents: Map<string, Agent> = new Map();

  // Create a new agent
  createAgent(agent: Agent): { success: boolean; message: string; agent?: Agent } {
    if (this.agents.has(agent.id)) {
      return {
        success: false,
        message: 'Agent already exists',
        agent: this.agents.get(agent.id)
      };
    }

    this.agents.set(agent.id, agent);
    console.log(`✅ Created new agent: ${agent.id} - "${agent.prompt}"`);
    
    // Emit event for real-time updates
    this.emit('agentCreated', agent);
    
    return {
      success: true,
      message: 'Agent created successfully',
      agent
    };
  }

  // Get a specific agent by ID
  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  // Get all agents
  getAllAgents(): Agent[] {
    return Array.from(this.agents.values())
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // Update agent status
  updateAgentStatus(id: string, status: 'active' | 'inactive' | 'error'): boolean {
    const agent = this.agents.get(id);
    if (!agent) return false;

    agent.status = status;
    this.emit('agentUpdated', agent);
    console.log(`Updated agent ${id} status to: ${status}`);
    return true;
  }

  // Add item to agent's acquired items
  addItemToAgent(agentId: string, itemName: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    if (!agent.currentItemsAcquired.includes(itemName)) {
      agent.currentItemsAcquired.push(itemName);
      this.emit('agentUpdated', agent);
      console.log(`Agent ${agentId} acquired item: ${itemName}`);
    }
    return true;
  }

  // Delete an agent
  deleteAgent(id: string): boolean {
    const deleted = this.agents.delete(id);
    if (deleted) {
      console.log(`🗑️  Deleted agent: ${id}`);
      this.emit('agentDeleted', id);
    }
    return deleted;
  }

  // Clear all agents (useful for testing)
  clear(): void {
    this.agents.clear();
    console.log('🗑️  Cleared all agents');
    this.emit('allAgentsCleared');
  }

  // Get stats
  getStats() {
    const all = Array.from(this.agents.values());
    return {
      total: all.length,
      active: all.filter(a => a.status === 'active').length,
      inactive: all.filter(a => a.status === 'inactive').length,
      error: all.filter(a => a.status === 'error').length,
      totalItemsAcquired: all.reduce((sum, a) => sum + a.currentItemsAcquired.length, 0)
    };
  }
}

// Export singleton instance
export const agentStore = new AgentStore();
