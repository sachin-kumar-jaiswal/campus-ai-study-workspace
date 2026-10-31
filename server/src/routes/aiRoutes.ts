import { Router } from 'express';
import { RequestHandler } from 'express';
import authenticate from '../middleware/authenticate';
import validate from '../middleware/validate';
import { aiLimiter } from '../middleware/rateLimiter';
import { chatValidator } from '../validators/aiValidators';
import {
  sendChat,
  getConversation,
  clearConversation,
} from '../controllers/aiController';

const router = Router();

// All AI routes require authentication
router.use(authenticate as RequestHandler);

/**
 * @route   POST /api/ai/chat
 * @desc    Send a message to the AI tutor (general or document-aware)
 * @access  Protected
 */
router.post(
  '/chat',
  aiLimiter,
  chatValidator,
  validate as RequestHandler,
  sendChat as RequestHandler
);

/**
 * @route   GET /api/ai/conversation
 * @desc    Retrieve AI tutor conversation history
 * @access  Protected
 * @query   ?documentId=<id>  (optional)
 */
router.get('/conversation', getConversation as RequestHandler);

/**
 * @route   DELETE /api/ai/conversation
 * @desc    Clear AI tutor conversation history
 * @access  Protected
 * @query   ?documentId=<id>  (optional)
 */
router.delete('/conversation', clearConversation as RequestHandler);

export default router;
