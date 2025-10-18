import { NextResponse } from 'next/server';
import { client } from '../algoClient';

// API endpoint that proxies to external /wallet-balance?id=
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletId = searchParams.get('id');

  if (!walletId) {
    return NextResponse.json({ error: 'Wallet ID required' }, { status: 400 });
  }

  const accountInfo = await client.accountInformation(walletId).do();

  return NextResponse.json({
		currentValue: accountInfo.amount
	});
}
