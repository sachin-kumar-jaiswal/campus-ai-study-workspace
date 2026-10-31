import mongoose, { Schema, Types } from 'mongoose';

export type MessageRole = 'user' | 'assistant';

export interface IAiMessage {
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export interface IAiConversation extends mongoose.Document {
  user: Types.ObjectId;
  /** Optional — set when the conversation is grounded in an uploaded document */
  document?: Types.ObjectId;
  messages: IAiMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const aiMessageSchema = new Schema<IAiMessage>(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const aiConversationSchema = new Schema<IAiConversation>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    document: { type: Schema.Types.ObjectId, ref: 'Document', default: null },
    messages: { type: [aiMessageSchema], default: [] },
  },
  { timestamps: true }
);

// One general conversation per user (document = null)
// One document conversation per (user, document) pair
aiConversationSchema.index({ user: 1, document: 1 }, { unique: true, sparse: true });

aiConversationSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: unknown, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

const AiConversation = mongoose.model<IAiConversation>('AiConversation', aiConversationSchema);
export default AiConversation;
