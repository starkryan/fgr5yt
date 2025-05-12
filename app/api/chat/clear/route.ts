import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Message from '@/models/Message';
import { getServerSession } from '../../../../lib/auth';

export async function POST() {
  await dbConnect();
  
  // Check authentication
  const session = await getServerSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Delete all messages for this user
    await Message.deleteMany({ userId });
    
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