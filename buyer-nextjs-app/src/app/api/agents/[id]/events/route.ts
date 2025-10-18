import { NextResponse } from 'next/server';

// API endpoint that gets events for a specific agent
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return callExternalAPI(id);
}

function callExternalAPI(agentId: string) {
  // Skeleton function - replace with actual external API call
  // Should call external API to get agent events

  return NextResponse.json([]);
}
