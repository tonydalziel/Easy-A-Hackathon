import { NextResponse } from 'next/server';

// API endpoint that proxies to external /wallet-balance?id=
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletId = searchParams.get('id');

  if (!walletId) {
    return NextResponse.json({ error: 'Wallet ID required' }, { status: 400 });
  }

  return callExternalAPI(walletId);
}

function callExternalAPI(walletId: string) {
  // Skeleton function - replace with actual external API call
  // Should call: GET /wallet-balance?id=<walletId>

  return NextResponse.json({
    currentValue: 0,
    history: []
  });
}
