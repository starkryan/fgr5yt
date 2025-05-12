import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Message from '@/models/Message';
import ConversationMemory from '@/models/ConversationMemory';
import { getServerSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    // Check authentication
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const url = new URL(request.url);
    const chatId = url.searchParams.get('chatId') || 'default';
    
    // Get messages for the current user only
    const messages = await Message.find({ userId })
      .sort({ createdAt: 1 })
      .limit(50);
    
    // Get conversation memory if it exists
    const memory = await ConversationMemory.findOne({ userId, chatId });
      
    return NextResponse.json({
      messages,
      memory: memory?.keyPoints || []
    });
  } catch (error) {
    console.error('History error:', error);
    return NextResponse.json(
      { error: 'Failed to load chat history' },
      { status: 500 }
    );
  }
}
