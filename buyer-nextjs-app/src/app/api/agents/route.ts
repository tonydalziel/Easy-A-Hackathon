import { NextResponse } from 'next/server';

// API endpoint that proxies to external /all-agents
export async function GET() {
  return callExternalAPI();
}

function callExternalAPI() {
  // Skeleton function - replace with actual external API call
  // Should call: GET /all-agents
  // Returns: array of agent IDs

  // For now, return empty array
  return NextResponse.json([]);
}
