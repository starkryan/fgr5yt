import mongoose, { Document, Schema } from 'mongoose';

export interface IConversationMemory extends Document {
  userId: string;
  chatId: string;
  keyPoints: string[];
  personalityTraits: {
    affectionLevel: number;
    agreementStyle: string;
    emojiFrequency: number;
    lastMessages: string[];
  };
  lastUpdated: Date;
  title: string;
}

const ConversationMemorySchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  chatId: { type: String, required: true },
  keyPoints: [{ type: String }],
  personalityTraits: {
    affectionLevel: { type: Number, default: 0.5 },
    agreementStyle: { type: String, default: 'neutral' },
    emojiFrequency: { type: Number, default: 3 },
    lastMessages: [{ type: String }]
  },
  lastUpdated: { type: Date, default: Date.now },
  title: { type: String, default: 'Untitled Conversation' }
});

// Create compound index for efficient queries
ConversationMemorySchema.index({ userId: 1, chatId: 1 }, { unique: true });

export default mongoose.models.ConversationMemory || 
  mongoose.model<IConversationMemory>('ConversationMemory', ConversationMemorySchema);
