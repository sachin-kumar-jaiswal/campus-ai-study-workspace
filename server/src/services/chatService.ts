import AiConversation, { IAiMessage } from '../models/AiConversation';
import DocumentModel from '../models/Document';
import { AppError } from '../middleware/errorHandler';
import { tutorChat, tutorChatWithDocument } from './ai/aiService';
import { Types } from 'mongoose';

// How many recent messages to pass as history (keeps token usage bounded)
const HISTORY_WINDOW = 10;

export interface ChatInput {
  userId: string;
  message: string;
  /** Optional — if provided, grounds the answer in the document's extractedText */
  documentId?: string;
}

export interface ChatResult {
  reply: string;
  conversationId: string;
}

/**
 * Sends a message to the AI tutor, persists both turns, and returns the reply.
 *
 * - With no documentId: general academic conversation.
 * - With documentId: verifies ownership, loads extractedText, passes context to AI.
 */
export const chat = async (input: ChatInput): Promise<ChatResult> => {
  const { userId, message, documentId } = input;

  let extractedText: string | null = null;
  let docObjectId: Types.ObjectId | null = null;

  // ── Document-aware mode ─────────────────────────────────────────────────────
  if (documentId) {
    if (!Types.ObjectId.isValid(documentId)) {
      throw new AppError('Invalid document ID.', 400);
    }

    const doc = await DocumentModel.findById(documentId).select('owner status extractedText');
    if (!doc) throw new AppError('Document not found.', 404);
    if (doc.owner.toString() !== userId) throw new AppError('Access denied.', 403);
    if (doc.status !== 'ready') {
      throw new AppError('Document is not ready yet. Please wait for processing to complete.', 400);
    }
    if (!doc.extractedText?.trim()) {
      throw new AppError('This document has no extractable text to chat about.', 400);
    }

    extractedText = doc.extractedText;
    docObjectId = doc._id as Types.ObjectId;
  }

  // ── Load or create conversation ─────────────────────────────────────────────
  const conversationFilter = docObjectId
    ? { user: new Types.ObjectId(userId), document: docObjectId }
    : { user: new Types.ObjectId(userId), document: null };

  let conversation = await AiConversation.findOne(conversationFilter);
  if (!conversation) {
    conversation = await AiConversation.create({
      user: new Types.ObjectId(userId),
      document: docObjectId ?? undefined,
      messages: [],
    });
  }

  // ── Build history window ────────────────────────────────────────────────────
  const recentMessages = conversation.messages.slice(-HISTORY_WINDOW);
  const history = recentMessages.map((m: IAiMessage) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  // ── Call AI ─────────────────────────────────────────────────────────────────
  const reply = extractedText
    ? await tutorChatWithDocument(extractedText, message, history)
    : await tutorChat(message, history);

  // ── Persist both turns ──────────────────────────────────────────────────────
  const now = new Date();
  await AiConversation.findByIdAndUpdate(conversation._id, {
    $push: {
      messages: {
        $each: [
          { role: 'user', content: message, timestamp: now },
          { role: 'assistant', content: reply, timestamp: now },
        ],
      },
    },
  });

  return { reply, conversationId: (conversation._id as Types.ObjectId).toString() };
};

/**
 * Returns the conversation for the given user (+ optional document).
 * Returns empty messages array if no conversation exists yet.
 */
export const getAiConversation = async (
  userId: string,
  documentId?: string
): Promise<{ conversationId: string | null; messages: IAiMessage[] }> => {
  let docObjectId: Types.ObjectId | null = null;

  if (documentId) {
    if (!Types.ObjectId.isValid(documentId)) throw new AppError('Invalid document ID.', 400);

    const doc = await DocumentModel.findById(documentId).select('owner');
    if (!doc) throw new AppError('Document not found.', 404);
    if (doc.owner.toString() !== userId) throw new AppError('Access denied.', 403);

    docObjectId = doc._id as Types.ObjectId;
  }

  const filter = docObjectId
    ? { user: new Types.ObjectId(userId), document: docObjectId }
    : { user: new Types.ObjectId(userId), document: null };

  const conversation = await AiConversation.findOne(filter);

  return {
    conversationId: conversation ? (conversation._id as Types.ObjectId).toString() : null,
    messages: conversation?.messages ?? [],
  };
};

/**
 * Clears all messages for the given user's conversation.
 */
export const clearAiConversation = async (
  userId: string,
  documentId?: string
): Promise<void> => {
  let docObjectId: Types.ObjectId | null = null;

  if (documentId) {
    if (!Types.ObjectId.isValid(documentId)) throw new AppError('Invalid document ID.', 400);

    const doc = await DocumentModel.findById(documentId).select('owner');
    if (!doc) throw new AppError('Document not found.', 404);
    if (doc.owner.toString() !== userId) throw new AppError('Access denied.', 403);

    docObjectId = doc._id as Types.ObjectId;
  }

  const filter = docObjectId
    ? { user: new Types.ObjectId(userId), document: docObjectId }
    : { user: new Types.ObjectId(userId), document: null };

  await AiConversation.findOneAndUpdate(filter, { $set: { messages: [] } });
};
