import { NextResponse } from 'next/server';
import { agentStore } from '@/lib/agentStore';

// API endpoint that gets agent details from memory
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const agent = agentStore.getAgent(id);
  
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  return NextResponse.json({ agent });
}

// Update agent
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (status && ['active', 'inactive', 'error'].includes(status)) {
      const updated = agentStore.updateAgentStatus(id, status);
      if (!updated) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'Agent updated' });
    }

    return NextResponse.json({ error: 'Invalid update data' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
  }
}

// Delete agent
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const deleted = agentStore.deleteAgent(id);
  
  if (!deleted) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: 'Agent deleted' });
}
