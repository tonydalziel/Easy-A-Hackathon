import { NextResponse } from 'next/server';
import { agentDecisionStore } from '@/lib/agentDecisionStore';
import { AgentDecision } from '@/types/agent';

// POST - Register a new agent decision
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { id, agentId, itemId, itemName, itemPrice, decision } = body;
    
    if (!id || !agentId || !itemId || !itemName || itemPrice === undefined || !decision) {
      return NextResponse.json(
        { error: 'Missing required fields: id, agentId, itemId, itemName, itemPrice, decision' },
        { status: 400 }
      );
    }

    if (decision !== 'BUY' && decision !== 'IGNORE') {
      return NextResponse.json(
        { error: 'Decision must be either "BUY" or "IGNORE"' },
        { status: 400 }
      );
    }

    // Create decision object
    const agentDecision: AgentDecision = {
      id,
      agentId,
      itemId,
      itemName,
      itemPrice,
      decision,
      maxPrice: body.maxPrice,
      reasoning: body.reasoning,
      priceReasoning: body.priceReasoning,
      timestamp: body.timestamp || Date.now(),
      purchaseIntentId: body.purchaseIntentId
    };

    // Register decision
    const result = agentDecisionStore.registerDecision(agentDecision);

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.message,
          existingDecision: result.decision
        },
        { status: 409 } // Conflict
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      decision: result.decision
    });

  } catch (error) {
    console.error('Error registering decision:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

// GET - Retrieve all decisions or filter by query params
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const itemId = searchParams.get('itemId');
    const decisionId = searchParams.get('id');

    // Get specific decision by ID
    if (decisionId) {
      const decision = agentDecisionStore.getDecision(decisionId);
      if (!decision) {
        return NextResponse.json(
          { error: 'Decision not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ decision });
    }

    // Get decisions by agent
    if (agentId) {
      const decisions = agentDecisionStore.getDecisionsByAgent(agentId);
      return NextResponse.json({ decisions, count: decisions.length });
    }

    // Get decisions by item
    if (itemId) {
      const decisions = agentDecisionStore.getDecisionsByItem(itemId);
      return NextResponse.json({ decisions, count: decisions.length });
    }

    // Get all decisions
    const decisions = agentDecisionStore.getAllDecisions();
    const stats = agentDecisionStore.getStats();
    
    return NextResponse.json({ 
      decisions, 
      count: decisions.length,
      stats
    });

  } catch (error) {
    console.error('Error retrieving decisions:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve decisions' },
      { status: 500 }
    );
  }
}

// DELETE - Clear all decisions (useful for testing)
export async function DELETE() {
  try {
    agentDecisionStore.clear();
    return NextResponse.json({ 
      success: true, 
      message: 'All decisions cleared' 
    });
  } catch (error) {
    console.error('Error clearing decisions:', error);
    return NextResponse.json(
      { error: 'Failed to clear decisions' },
      { status: 500 }
    );
  }
}
