import { NextResponse } from 'next/server';
import { agentStore } from '@/lib/agentStore';

// API endpoint that returns all agents from memory
export async function GET() {
  try {
    const agents = agentStore.getAllAgents();
    const stats = agentStore.getStats();
    
    return NextResponse.json({
      agents,
      count: agents.length,
      stats
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}
