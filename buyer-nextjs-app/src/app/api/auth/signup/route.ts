import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Placeholder wallet generation function
// TODO: Replace with actual Algorand wallet generation
function generateWalletId(username: string): string {
  // Generate a unique wallet ID (placeholder)
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `wallet-${username}-${timestamp}-${random}`;
}

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

    // Generate wallet ID
    const walletId = generateWalletId(username);
    
    console.log(`✅ Created user: ${username} with wallet: ${walletId}`);

    // Create user data
    const userData = {
      username,
      walletId,
      description: description || '',
      createdAt: Date.now()
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
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
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
