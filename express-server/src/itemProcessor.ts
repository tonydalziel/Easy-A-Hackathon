// Item-Agent Matching Service
// Automatically processes items with agents for purchase consideration

import { AgentState, ItemState } from './types';
import { haveLLMConsiderPurchase } from './llms';

// Configuration
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

export class ItemProcessor {
    private processing = false;
    private queue: Array<{ agent: AgentState; item: ItemState }> = [];

    constructor() {
        console.log('🔄 Item Processor initialized');
        console.log(`📡 Frontend URL: ${FRONTEND_URL}`);
    }

    /**
     * Send decision to frontend for streaming
     */
    private async sendDecisionToFrontend(
        agent: AgentState, 
        item: ItemState, 
        decision: 'BUY' | 'IGNORE',
        purchaseIntentId: number | null,
        reasoning?: string
    ): Promise<void> {
        try {
            const decisionData = {
                id: `decision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                agentId: agent.agent_id,
                itemId: item.id,
                itemName: item.name,
                itemPrice: item.price,
                decision,
                purchaseIntentId,
                reasoning: reasoning || (decision === 'BUY' 
                    ? `Agent "${agent.prompt}" decided to purchase this item.`
                    : `Agent "${agent.prompt}" decided to pass on this item.`),
                timestamp: Date.now()
            };

            console.log(`📤 Sending decision to frontend: ${decision} - ${item.name}`);

            const response = await fetch(`${FRONTEND_URL}/api/decisions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(decisionData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Failed to send decision to frontend: ${response.status} ${errorText}`);
            } else {
                console.log(`✅ Decision sent to frontend successfully`);
            }
        } catch (error) {
            console.error('❌ Error sending decision to frontend:', error);
            // Don't throw - we still want to continue processing even if frontend is down
        }
    }

    /**
     * Process a single item with a single agent
     */
    async processItemWithAgent(agent: AgentState, item: ItemState): Promise<void> {
        try {
            console.log(`🤖 Processing: Agent "${agent.agent_id}" considering item "${item.name}" ($${item.price})`);

            const {id, reasoning} = await haveLLMConsiderPurchase(agent, item);

            if (id) {
                console.log(`✅ Agent "${agent.agent_id}" wants to buy "${item.name}"! Purchase Intent: ${id}`);
                await this.sendDecisionToFrontend(agent, item, 'BUY', id, reasoning);
            } else {
                console.log(`⏭️  Agent "${agent.agent_id}" passed on "${item.name}"`);
                await this.sendDecisionToFrontend(agent, item, 'IGNORE', null, reasoning);
            }
        } catch (error) {
            console.error(`❌ Error processing item "${item.name}" with agent "${agent.agent_id}":`, error);
        }
    }

    /**
     * Process all existing items with a new agent
     */
    async processAllItemsWithAgent(agent: AgentState, items: ItemState[]): Promise<void> {
        if (items.length === 0) {
            console.log(`📭 No items available for agent "${agent.agent_id}"`);
            return;
        }

        console.log(`📦 Processing ${items.length} item(s) with new agent "${agent.agent_id}"`);
        
        for (const item of items) {
            await this.processItemWithAgent(agent, item);
        }
        
        console.log(`✅ Finished processing all items with agent "${agent.agent_id}"`);
    }

    /**
     * Process a new item with all existing agents
     */
    async processItemWithAllAgents(item: ItemState, agents: AgentState[]): Promise<void> {
        if (agents.length === 0) {
            console.log(`👤 No agents available to consider item "${item.name}"`);
            return;
        }

        console.log(`🔔 New item "${item.name}" - notifying ${agents.length} agent(s)`);
        
        for (const agent of agents) {
            await this.processItemWithAgent(agent, item);
        }
        
        console.log(`✅ Finished processing item "${item.name}" with all agents`);
    }

    /**
     * Add item-agent pair to queue for processing
     */
    queueProcessing(agent: AgentState, item: ItemState): void {
        this.queue.push({ agent, item });
        console.log(`📝 Queued: Agent "${agent.agent_id}" + Item "${item.name}" (Queue size: ${this.queue.length})`);
        
        // Start processing if not already running
        if (!this.processing) {
            this.processQueue();
        }
    }

    /**
     * Process queued items (useful for batch processing)
     */
    private async processQueue(): Promise<void> {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;
        console.log(`🚀 Starting queue processing (${this.queue.length} items)`);

        while (this.queue.length > 0) {
            const pair = this.queue.shift();
            if (pair) {
                await this.processItemWithAgent(pair.agent, pair.item);
            }
        }

        this.processing = false;
        console.log('✅ Queue processing completed');
    }

    /**
     * Get queue status
     */
    getQueueStatus(): { queueSize: number; isProcessing: boolean } {
        return {
            queueSize: this.queue.length,
            isProcessing: this.processing
        };
    }
}

// Export singleton instance
export const itemProcessor = new ItemProcessor();
