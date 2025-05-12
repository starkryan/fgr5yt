import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  content: string;
  role: 'user' | 'assistant' | 'system';
  userId: string;
  createdAt: Date;
  summary?: string;
  isImportant?: boolean;
}

const MessageSchema: Schema = new Schema({
  content: { type: String, required: true },
  role: { type: String, required: true, enum: ['user', 'assistant', 'system'] },
  userId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  summary: { type: String, default: null },
  isImportant: { type: Boolean, default: false }
});

// Create compound index for efficient queries
MessageSchema.index({ userId: 1, createdAt: 1 });
MessageSchema.index({ userId: 1, isImportant: 1 });

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
