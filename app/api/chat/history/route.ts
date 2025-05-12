import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Message from '@/models/Message';
import { getServerSession } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();
    
    // Check authentication
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get messages for the current user only
    const messages = await Message.find({ userId })
      .sort({ createdAt: 1 })
      .limit(50);
      
    return NextResponse.json(messages);
  } catch (error) {
    console.error('History error:', error);
    return NextResponse.json(
      { error: 'Failed to load chat history' },
      { status: 500 }
    );
  }
}
