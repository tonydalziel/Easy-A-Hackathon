import { NextResponse } from 'next/server';
import { client } from '../algoClient';
import { cookies } from 'next/headers';

// API endpoint that proxies to external /wallet-balance?id=
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let walletId = searchParams.get('id');

  // If no wallet ID provided in query, try to get from authenticated user
  if (!walletId) {
    try {
      const cookieStore = await cookies();
      const userCookie = cookieStore.get('user');
      
      if (userCookie) {
        const userData = JSON.parse(userCookie.value);
        walletId = userData.walletId;
        console.log('📍 Using authenticated user wallet:', walletId);
      }
    } catch (error) {
      console.error('Error getting user from cookie:', error);
    }
  }

  if (!walletId) {
    return NextResponse.json({ error: 'Wallet ID required. Please log in.' }, { status: 400 });
  }

  try {
    console.log('🔍 Fetching balance for wallet:', walletId);
    const accountInfo = await client.accountInformation(walletId).do();

    return NextResponse.json({
      currentValue: Number(accountInfo.amount),
      walletId: walletId
    });
  } catch (error) {
    console.error('❌ Error fetching wallet balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet balance', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
