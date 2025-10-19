// Item-Agent Matching Service
// Automatically processes items with agents for purchase consideration

import { AgentState, ItemState } from './types';
import { haveLLMConsiderPurchase } from './llms';
import { processListingPayment } from './chain';

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
                console.log(`🔍 DEBUG: Starting smart contract payment execution...`);
                
                // Execute smart contract payment
                try {
                    console.log(`💰 Processing payment on smart contract for agent "${agent.agent_id}"...`);
                    console.log(`   Item: ${item.name}, Price: ${item.price}, Seller: ${item.seller_id}`);
                    console.log(`   Agent wallet: ${agent.wallet_id}`);
                    
                    // Get seller's wallet address if seller_id is provided
                    let sellerWallet = item.seller_id;
                    if (item.seller_id) {
                        try {
                            console.log(`🔍 Fetching merchant wallet for seller: ${item.seller_id}`);
                            const merchantResponse = await fetch(`http://localhost:3000/merchants/${item.seller_id}/wallet`);
                            console.log(`🔍 Merchant response status: ${merchantResponse.status}`);
                            if (merchantResponse.ok) {
                                const { wallet_address } = await merchantResponse.json();
                                sellerWallet = wallet_address;
                                console.log(`   Seller wallet: ${sellerWallet}`);
                            } else {
                                console.log(`⚠️  Merchant ${item.seller_id} not found, using seller_id as wallet`);
                            }
                        } catch (err) {
                            console.error('Failed to fetch seller wallet:', err);
                        }
                    }
                    
                    console.log(`🔍 About to call processListingPayment with: sender=${agent.wallet_id}, amount=${item.price}`);
                    
                    // Check if item has a contract appId
                    if (!item.contractAppId) {
                        throw new Error('Item does not have a contract appId - listing may not have been created successfully');
                    }
                    
                    const itemAppId = parseInt(item.contractAppId);
                    console.log(`🔍 Using contract App ID: ${itemAppId}`);
                    
                    // First check listing status
                    console.log(`🔍 Checking current listing status...`);
                    const { getListingStatusFromChain } = await import('./chain');
                    const listingStatus = await getListingStatusFromChain(itemAppId, agent.wallet_id, agent.wallet_pwd);
                    console.log(`📋 Current listing status: ${listingStatus}`);
                    
                    // Process payment through smart contract using agent's mnemonic and item's contract
                    const paymentResult = await processListingPayment(itemAppId, agent.wallet_pwd, item.price);
                    console.log(`✅ Smart contract payment processed: ${paymentResult}`);
                    
                    // Check if payment was successful or if listing wasn't active
                    if (paymentResult.includes('No active listing') || paymentResult.includes('No listing')) {
                        console.log(`⚠️  PROBLEM: Smart contract says "${paymentResult}"`);
                        console.log(`⚠️  This item may not have an active listing on the contract`);
                        console.log(`⚠️  Item listingId: ${item.listingId}`);
                    }
                    
                    // Send decision to frontend with payment confirmation
                    await this.sendDecisionToFrontend(agent, item, 'BUY', id, 
                        `${reasoning}\n\n🔗 Smart Contract: ${paymentResult}`);
                } catch (contractError) {
                    console.error(`⚠️  Smart contract payment failed:`, contractError);
                    console.error(`⚠️  Error stack:`, contractError instanceof Error ? contractError.stack : 'No stack trace');
                    // Still send decision to frontend even if contract fails
                    await this.sendDecisionToFrontend(agent, item, 'BUY', id, 
                        `${reasoning}\n\n⚠️ Smart contract payment pending/failed: ${contractError instanceof Error ? contractError.message : 'Unknown error'}`);
                }
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
