import { body, ValidationChain } from 'express-validator';

/**
 * Validates the POST /api/ai/chat request body.
 * - message: required, non-empty string, max 4000 chars
 * - documentId: optional, must be a valid MongoDB ObjectId if provided
 */
export const chatValidator: ValidationChain[] = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message cannot be empty.')
    .isLength({ max: 4000 })
    .withMessage('Message cannot exceed 4000 characters.'),

  body('documentId')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('documentId must be a valid document ID.'),
];
