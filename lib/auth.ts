import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export const authOptions = {
  secret: JWT_SECRET,
};

// Create JWT token
export function createToken(user: AuthUser): string {
  return jwt.sign(
    { 
      id: user.id,
      email: user.email,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Verify JWT token
export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch (error) {
    return null;
  }
}

// Get user from token in cookies
export async function getServerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  if (!token) {
    return null;
  }
  
  const user = verifyToken(token);
  if (!user) {
    return null;
  }
  
  return { user };
}

// Auth middleware helper
export function isAuthenticated(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value;
  
  if (!token) {
    return null;
  }
  
  const user = verifyToken(token);
  if (!user) {
    return null;
  }
  
  return user;
} 