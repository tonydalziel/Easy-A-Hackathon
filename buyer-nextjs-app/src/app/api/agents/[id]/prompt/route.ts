import { NextResponse } from 'next/server';

// API endpoint that gets agent prompt
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return callExternalAPI(id);
}

function callExternalAPI(agentId: string) {
  // Skeleton function - replace with actual external API call
  // Should call external API to get agent prompt

  return NextResponse.json({ prompt: '' });
}
