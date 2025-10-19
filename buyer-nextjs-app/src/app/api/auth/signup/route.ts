import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const EXPRESS_SERVER_URL = process.env.EXPRESS_SERVER_URL || 'http://localhost:3000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, description } = body;

    // Validate username
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (username.length > 20) {
      return NextResponse.json(
        { error: 'Username must be less than 20 characters' },
        { status: 400 }
      );
    }

    // Call express server to create merchant account with real Algorand wallet
    console.log(`📡 Calling express server to create merchant: ${username}`);
    const merchantResponse = await fetch(`${EXPRESS_SERVER_URL}/merchants/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username.trim(),
        business_description: description || 'No description provided'
      })
    });

    if (!merchantResponse.ok) {
      const errorData = await merchantResponse.json();
      console.error('❌ Express server error:', errorData);
      throw new Error(errorData.error || 'Failed to create merchant account');
    }

    const merchantData = await merchantResponse.json();
    console.log('✅ Merchant created on express server:', merchantData.merchant.username);

    // Create user data for frontend
    const userData = {
      username: merchantData.merchant.username,
      walletId: merchantData.merchant.wallet_address,
      privateKey: merchantData.merchant.private_key,
      merchantId: merchantData.merchant.merchant_id,
      description: merchantData.merchant.business_description,
      createdAt: merchantData.merchant.created_at
    };

    // Set cookie (expires in 30 days)
    const cookieStore = await cookies();
    cookieStore.set('user', JSON.stringify(userData), {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    });

    return NextResponse.json({
      success: true,
      user: userData,
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// GET endpoint to check current user
export async function GET() {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('user');

    if (!userCookie) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    const userData = JSON.parse(userCookie.value);

    return NextResponse.json({
      authenticated: true,
      user: userData
    });

  } catch (error) {
    console.error('Error checking user:', error);
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}

// DELETE endpoint to logout
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('user');

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
