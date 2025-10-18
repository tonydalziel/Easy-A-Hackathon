import { NextResponse } from 'next/server';

// API endpoint that proxies to external /all-events-on-chain
export async function GET() {
  return callExternalAPI();
}

function callExternalAPI() {
  // Skeleton function - replace with actual external API call
  // Should call: GET /all-events-on-chain

  // For now, return empty array
  return NextResponse.json([]);
}
