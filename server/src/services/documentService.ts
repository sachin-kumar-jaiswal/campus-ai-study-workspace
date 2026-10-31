// pdf-parse uses CJS — use require to avoid TypeScript call-signature mismatch
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string; numpages: number }>;
import DocumentModel, { IDocument } from '../models/Document';
import Conversation from '../models/Conversation';
import * as storage from './storageService';
import { summariseDocument, answerQuestion } from './ai/aiService';
import { AppError } from '../middleware/errorHandler';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadInput {
  buffer: Buffer;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  userId: string;
}

export interface ListQuery {
  userId: string;
  search?: string;
  status?: string;
  sort?: 'newest' | 'oldest' | 'name';
  page?: number;
  limit?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Derives a display title from the original filename (strips extension). */
const titleFromFilename = (filename: string): string =>
  filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim() || filename;

/**
 * Extracts text from a PDF buffer using pdf-parse.
 * Returns empty string for image-only / unreadable PDFs rather than throwing.
 */
const extractPdfText = async (
  buffer: Buffer
): Promise<{ text: string; pageCount: number; warning?: string }> => {
  try {
    const result = await pdfParse(buffer);
    const text = result.text?.trim() ?? '';
    const pageCount = result.numpages ?? 0;

    if (!text) {
      return {
        text: '',
        pageCount,
        warning:
          'This PDF does not contain selectable text. It may be a scanned image. OCR support can be added in a future version.',
      };
    }
    return { text, pageCount };
  } catch {
    return {
      text: '',
      pageCount: 0,
      warning: 'Text extraction failed. The PDF may be corrupted or password-protected.',
    };
  }
};

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Uploads a PDF, saves it to storage, extracts text, and persists the Document record.
 * Processing happens synchronously within the request so the client gets a
 * fully-resolved status in the upload response (suitable for Phase 2 scale).
 */
export const uploadDocument = async (input: UploadInput): Promise<IDocument> => {
  const { buffer, originalFileName, fileSize, userId } = input;

  const storageKey = storage.generateStorageKey();
  const title = titleFromFilename(originalFileName);

  // 1 — Create DB record in "uploading" state
  const doc = await DocumentModel.create({
    owner: userId,
    title,
    originalFileName,
    fileType: 'application/pdf',
    fileSize,
    storageKey,
    status: 'uploading',
  });

  try {
    // 2 — Persist file to storage
    await storage.saveFile(storageKey, buffer);

    // 3 — Mark as processing and extract text
    doc.status = 'processing';
    await doc.save();

    const { text, pageCount, warning } = await extractPdfText(buffer);

    // 4 — Persist extracted text and mark ready (or ready-with-warning)
    doc.extractedText = text;
    doc.pageCount = pageCount;
    doc.status = 'ready';
    if (warning) doc.errorMessage = warning;
    await doc.save();
  } catch (err) {
    // Keep failed uploads visible without turning storage failures into HTTP success.
    doc.status = 'failed';
    doc.errorMessage =
      err instanceof Error ? err.message : 'An unexpected error occurred during processing.';
    try {
      await doc.save();
    } catch (recordingError) {
      console.error('[Documents] Could not record failed upload:', recordingError);
    }
    try {
      await storage.deleteFile(storageKey);
    } catch (cleanupError) {
      console.error('[Documents] Could not clean up failed upload:', cleanupError);
    }
    throw err;
  }

  return doc;
};

/**
 * Returns a paginated list of the user's documents, with optional search/filter/sort.
 */
export const listDocuments = async (query: ListQuery) => {
  const { userId, search, status, sort = 'newest', page = 1, limit = 20 } = query;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = { owner: userId };

  if (status && ['uploading', 'processing', 'ready', 'failed'].includes(status)) {
    filter.status = status;
  }

  if (search?.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [{ title: regex }, { originalFileName: regex }];
  }

  const sortMap = {
    newest: { createdAt: -1 as const },
    oldest: { createdAt: 1 as const },
    name: { title: 1 as const },
  };

  const skip = (page - 1) * limit;

  const [documents, total] = await Promise.all([
    DocumentModel.find(filter)
      .select('-extractedText')   // don't send large text in list view
      .sort(sortMap[sort] ?? sortMap.newest)
      .skip(skip)
      .limit(limit)
      .lean(),
    DocumentModel.countDocuments(filter),
  ]);

  return { documents, total, page, limit, pages: Math.ceil(total / limit) };
};

/**
 * Fetches a single document — verifies ownership.
 * Returns full document including extractedText for the detail view.
 */
export const getDocument = async (documentId: string, userId: string): Promise<IDocument> => {
  const doc = await DocumentModel.findById(documentId);

  if (!doc) throw new AppError('Document not found.', 404);
  if (doc.owner.toString() !== userId) throw new AppError('Access denied.', 403);

  return doc;
};

/**
 * Deletes a document, its stored file, and all conversation history.
 */
export const deleteDocument = async (documentId: string, userId: string): Promise<void> => {
  const doc = await DocumentModel.findById(documentId);

  if (!doc) throw new AppError('Document not found.', 404);
  if (doc.owner.toString() !== userId) throw new AppError('Access denied.', 403);

  await Promise.all([
    storage.deleteFile(doc.storageKey),
    Conversation.deleteMany({ document: documentId }),
    DocumentModel.deleteOne({ _id: documentId }),
  ]);
};

/**
 * Generates (or returns cached) an AI summary for a document.
 * Pass force=true to regenerate even if a summary exists.
 */
export const summarizeDocument = async (
  documentId: string,
  userId: string,
  force = false
): Promise<string> => {
  const doc = await DocumentModel.findById(documentId);

  if (!doc) throw new AppError('Document not found.', 404);
  if (doc.owner.toString() !== userId) throw new AppError('Access denied.', 403);
  if (doc.status !== 'ready') throw new AppError('Document is not ready yet.', 400);
  if (!doc.extractedText?.trim()) throw new AppError('This document has no extractable text to summarise.', 400);

  // Return cached summary unless forced
  if (doc.summary && !force) return doc.summary;

  const summary = await summariseDocument(doc.extractedText);

  doc.summary = summary;
  await doc.save();

  return summary;
};

/**
 * Answers a student question about a document, stores the exchange.
 */
export const askDocument = async (
  documentId: string,
  userId: string,
  question: string
): Promise<{ answer: string; conversationId: string }> => {
  if (!question?.trim()) throw new AppError('Question cannot be empty.', 400);

  const doc = await DocumentModel.findById(documentId);

  if (!doc) throw new AppError('Document not found.', 404);
  if (doc.owner.toString() !== userId) throw new AppError('Access denied.', 403);
  if (doc.status !== 'ready') throw new AppError('Document is not ready yet.', 400);
  if (!doc.extractedText?.trim()) throw new AppError('This document has no extractable text.', 400);

  const answer = await answerQuestion(doc.extractedText, question.trim());

  // Upsert conversation — one conversation per (user, document)
  const conversation = await Conversation.findOneAndUpdate(
    { document: documentId, user: userId },
    {
      $push: {
        messages: {
          $each: [
            { role: 'user', content: question.trim(), timestamp: new Date() },
            { role: 'assistant', content: answer, timestamp: new Date() },
          ],
        },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return { answer, conversationId: conversation._id.toString() };
};

/**
 * Retrieves conversation history for a document.
 */
export const getConversation = async (documentId: string, userId: string) => {
  // Ownership check via document
  const doc = await DocumentModel.findById(documentId);
  if (!doc) throw new AppError('Document not found.', 404);
  if (doc.owner.toString() !== userId) throw new AppError('Access denied.', 403);

  const conversation = await Conversation.findOne({ document: documentId, user: userId });
  return conversation ?? { messages: [] };
};

/**
 * Clears all messages in a document's conversation (for the current user).
 */
export const clearConversation = async (documentId: string, userId: string): Promise<void> => {
  const doc = await DocumentModel.findById(documentId);
  if (!doc) throw new AppError('Document not found.', 404);
  if (doc.owner.toString() !== userId) throw new AppError('Access denied.', 403);

  await Conversation.findOneAndUpdate(
    { document: documentId, user: userId },
    { $set: { messages: [] } }
  );
};

/**
 * Returns real document statistics for the dashboard.
 */
export const getDocumentStats = async (userId: string) => {
  const [total, processing, ready, failed, recent] = await Promise.all([
    DocumentModel.countDocuments({ owner: userId }),
    DocumentModel.countDocuments({ owner: userId, status: { $in: ['uploading', 'processing'] } }),
    DocumentModel.countDocuments({ owner: userId, status: 'ready' }),
    DocumentModel.countDocuments({ owner: userId, status: 'failed' }),
    DocumentModel.find({ owner: userId })
      .select('-extractedText')
      .sort({ createdAt: -1 })
      .limit(3)
      .lean(),
  ]);

  return { total, processing, ready, failed, recent };
};
