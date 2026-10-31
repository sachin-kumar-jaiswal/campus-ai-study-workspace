import mongoose, { Schema, Types } from 'mongoose';

export type MessageRole = 'user' | 'assistant';

export interface IMessage {
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export interface IConversation extends mongoose.Document {
  document: Types.ObjectId;
  user: Types.ObjectId;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: () => new Date(),
    },
  },
  { _id: false }
);

const conversationSchema = new Schema<IConversation>(
  {
    document: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// One conversation per (user, document) pair
conversationSchema.index({ document: 1, user: 1 }, { unique: true });
conversationSchema.index({ user: 1 });

conversationSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: unknown, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);
export default Conversation;
