import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Message from '@/models/Message';
import ConversationMemory from '@/models/ConversationMemory';
import { getServerSession } from '../../../../lib/auth';

export async function POST(request: Request) {
  await dbConnect();
  
  // Check authentication
  const session = await getServerSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const { chatId } = await request.json().catch(() => ({ chatId: 'default' }));
    
    // Delete all messages for this user and chatId
    await Message.deleteMany({ userId, chatId });
    
    // Also clear the conversation memory for this chat
    await ConversationMemory.deleteOne({ userId, chatId });
    
    return NextResponse.json({ 
      success: true,
      message: 'Chat history cleared successfully' 
    });
  } catch (error) {
    console.error('Failed to clear chat history:', error);
    return NextResponse.json(
      { error: 'Failed to clear chat history' },
      { status: 500 }
    );
  }
} 