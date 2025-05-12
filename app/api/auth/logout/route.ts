import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Clear auth cookie with Response
    const response = NextResponse.json({ message: 'Logged out successfully' });
    
    response.cookies.set({
      name: 'auth-token',
      value: '',
      httpOnly: true,
      path: '/',
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
} 