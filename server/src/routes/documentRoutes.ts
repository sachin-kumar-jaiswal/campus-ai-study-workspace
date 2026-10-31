import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import upload from '../middleware/upload';
import { aiLimiter, uploadLimiter } from '../middleware/rateLimiter';
import {
  uploadDocument,
  listDocuments,
  getDocumentStats,
  getDocument,
  deleteDocument,
  summarizeDocument,
  askDocument,
  getConversation,
  clearConversation,
  streamDocumentFile,
} from '../controllers/documentController';
import { RequestHandler } from 'express';

const router = Router();

// All document routes require authentication
router.use(authenticate as RequestHandler);

/**
 * @route   POST /api/documents
 * @desc    Upload a PDF document
 * @access  Protected
 */
router.post(
  '/',
  uploadLimiter,
  upload.single('file'),
  uploadDocument as RequestHandler
);

/**
 * @route   GET /api/documents/stats
 * @desc    Get document statistics for the dashboard
 * @access  Protected
 * NOTE: must be registered BEFORE /:id so "stats" isn't treated as an id
 */
router.get('/stats', getDocumentStats as RequestHandler);

/**
 * @route   GET /api/documents
 * @desc    List user's documents (search, filter, sort, paginate)
 * @access  Protected
 */
router.get('/', listDocuments as RequestHandler);

/**
 * @route   GET /api/documents/:id
 * @desc    Get a single document with full extracted text
 * @access  Protected (owner only)
 */
router.get('/:id', getDocument as RequestHandler);

/**
 * @route   DELETE /api/documents/:id
 * @desc    Delete document, file, and conversation
 * @access  Protected (owner only)
 */
router.delete('/:id', deleteDocument as RequestHandler);

/**
 * @route   GET /api/documents/:id/file
 * @desc    Stream the original PDF securely
 * @access  Protected (owner only)
 */
router.get('/:id/file', streamDocumentFile as RequestHandler);

/**
 * @route   POST /api/documents/:id/summarize
 * @desc    Generate AI summary (?regenerate=true to force new)
 * @access  Protected (owner only)
 */
router.post('/:id/summarize', aiLimiter, summarizeDocument as RequestHandler);

/**
 * @route   POST /api/documents/:id/ask
 * @desc    Ask a question about the document
 * @access  Protected (owner only)
 */
router.post('/:id/ask', aiLimiter, askDocument as RequestHandler);

/**
 * @route   GET /api/documents/:id/conversation
 * @desc    Get conversation history for a document
 * @access  Protected (owner only)
 */
router.get('/:id/conversation', getConversation as RequestHandler);

/**
 * @route   DELETE /api/documents/:id/conversation
 * @desc    Clear conversation history
 * @access  Protected (owner only)
 */
router.delete('/:id/conversation', clearConversation as RequestHandler);

export default router;
