import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index';
import { sendSuccess, sendError } from '../utils/response';
import * as docService from '../services/documentService';
import * as storage from '../services/storageService';
import { isAiConfigured } from '../services/ai/aiService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const userId = (req: AuthRequest): string => req.user!.id;

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/documents
 * Upload a PDF document.
 */
export const uploadDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      sendError(res, 'No file uploaded. Please attach a PDF.', 400);
      return;
    }

    const doc = await docService.uploadDocument({
      buffer: req.file.buffer,
      originalFileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      userId: userId(req),
    });

    sendSuccess(res, 'Document uploaded successfully.', { document: doc }, 201);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/documents
 * List authenticated user's documents with search/filter/sort/pagination.
 */
export const listDocuments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, status, sort, page, limit } = req.query as Record<string, string>;

    const result = await docService.listDocuments({
      userId: userId(req),
      search,
      status,
      sort: sort as 'newest' | 'oldest' | 'name',
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? Math.min(parseInt(limit, 10), 50) : 20,
    });

    sendSuccess(res, 'Documents retrieved.', result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/documents/stats
 * Dashboard statistics for authenticated user's documents.
 */
export const getDocumentStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await docService.getDocumentStats(userId(req));
    sendSuccess(res, 'Document stats retrieved.', stats);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/documents/:id
 * Get a single document (ownership enforced in service).
 */
export const getDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const doc = await docService.getDocument(req.params.id, userId(req));
    sendSuccess(res, 'Document retrieved.', { document: doc });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/documents/:id
 * Delete document, file, and conversation history.
 */
export const deleteDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await docService.deleteDocument(req.params.id, userId(req));
    sendSuccess(res, 'Document deleted successfully.', {});
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/documents/:id/summarize
 * Generate (or return cached) AI summary.
 * Pass query ?regenerate=true to force a new summary.
 */
export const summarizeDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isAiConfigured()) {
      sendError(
        res,
        'AI features are not configured. Add a valid OPENAI_API_KEY to the server environment to enable summaries.',
        503
      );
      return;
    }

    const force = req.query.regenerate === 'true';
    const summary = await docService.summarizeDocument(req.params.id, userId(req), force);
    sendSuccess(res, 'Summary ready.', { summary });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/documents/:id/ask
 * Answer a student question about the document.
 * Body: { question: string }
 */
export const askDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isAiConfigured()) {
      sendError(
        res,
        'AI features are not configured. Add a valid OPENAI_API_KEY to the server environment to enable document Q&A.',
        503
      );
      return;
    }

    const { question } = req.body as { question?: string };

    if (!question?.trim()) {
      sendError(res, 'Question cannot be empty.', 400);
      return;
    }

    const result = await docService.askDocument(req.params.id, userId(req), question);
    sendSuccess(res, 'Answer ready.', result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/documents/:id/conversation
 * Retrieve chat history for a document.
 */
export const getConversation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const conversation = await docService.getConversation(req.params.id, userId(req));
    sendSuccess(res, 'Conversation retrieved.', { conversation });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/documents/:id/conversation
 * Clear all messages in the conversation.
 */
export const clearConversation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await docService.clearConversation(req.params.id, userId(req));
    sendSuccess(res, 'Conversation cleared.', {});
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/documents/:id/file
 * Securely stream the original PDF to the authenticated owner.
 * Never exposes the filesystem path publicly.
 */
export const streamDocumentFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const doc = await docService.getDocument(req.params.id, userId(req));

    if (!(await storage.fileExists(doc.storageKey))) {
      sendError(res, 'File not found on server.', 404);
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(doc.originalFileName)}"`
    );
    res.setHeader('Cache-Control', 'private, no-store');

    const stream = await storage.streamFile(doc.storageKey);
    stream.on('error', () => {
      if (!res.headersSent) sendError(res, 'Error reading file.', 500);
    });
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
};
