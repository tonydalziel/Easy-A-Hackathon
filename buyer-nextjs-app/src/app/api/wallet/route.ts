import { NextResponse } from 'next/server';
import { client } from '../algoClient';

// API endpoint that proxies to external /wallet-balance?id=
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let walletId = searchParams.get('id');

  walletId = 'VQKN6Y336A26P4EUGNLKW2KO7WF5K7OO3DODUCSSYFCXF35JBSJ6EHMSMU'; //TODO
  if (!walletId) {
    return NextResponse.json({ error: 'Wallet ID required' }, { status: 400 });
  }

  const accountInfo = await client.accountInformation(walletId).do();

  return NextResponse.json({
    currentValue: Number(accountInfo.amount)
  });
}
