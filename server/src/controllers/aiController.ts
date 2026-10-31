import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index';
import { sendSuccess, sendError } from '../utils/response';
import { isAiConfigured } from '../services/ai/aiService';
import * as chatService from '../services/chatService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const userId = (req: AuthRequest): string => req.user!.id;

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/ai/chat
 * Send a message to the AI tutor.
 * Body: { message: string, documentId?: string }
 */
export const sendChat = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isAiConfigured()) {
      sendError(
        res,
        'AI features are not configured. Add a valid OPENAI_API_KEY to the server environment to enable the AI Tutor.',
        503
      );
      return;
    }

    const { message, documentId } = req.body as { message?: string; documentId?: string };

    // Inline guard (validators also run before this, but belt-and-suspenders)
    if (!message?.trim()) {
      sendError(res, 'Message cannot be empty.', 400);
      return;
    }

    const result = await chatService.chat({
      userId: userId(req),
      message: message.trim(),
      documentId: documentId?.trim() || undefined,
    });

    sendSuccess(res, 'Reply ready.', result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/ai/conversation
 * Retrieve AI tutor conversation history.
 * Query: ?documentId=<id>  (optional — omit for general chat history)
 */
export const getConversation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { documentId } = req.query as { documentId?: string };

    const result = await chatService.getAiConversation(
      userId(req),
      documentId?.trim() || undefined
    );

    sendSuccess(res, 'Conversation retrieved.', result);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/ai/conversation
 * Clear AI tutor conversation history.
 * Query: ?documentId=<id>  (optional)
 */
export const clearConversation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { documentId } = req.query as { documentId?: string };

    await chatService.clearAiConversation(
      userId(req),
      documentId?.trim() || undefined
    );

    sendSuccess(res, 'Conversation cleared.', {});
  } catch (err) {
    next(err);
  }
};
