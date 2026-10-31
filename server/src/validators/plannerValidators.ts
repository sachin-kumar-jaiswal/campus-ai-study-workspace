import { body, param, ValidationChain } from 'express-validator';

const priorities = ['low', 'medium', 'high'];

export const createStudyTaskValidator: ValidationChain[] = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Task title is required')
    .isLength({ max: 160 })
    .withMessage('Task title cannot exceed 160 characters'),
  body('subject')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Subject cannot exceed 100 characters'),
  body('dueDate').isISO8601().withMessage('Choose a valid due date').toDate(),
  body('durationMinutes')
    .isInt({ min: 5, max: 480 })
    .withMessage('Study duration must be between 5 and 480 minutes')
    .toInt(),
  body('priority').optional().isIn(priorities).withMessage('Choose a valid priority'),
];

export const updateStudyTaskValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid study task ID'),
  body('title').optional().trim().notEmpty().isLength({ max: 160 }),
  body('subject').optional().trim().isLength({ max: 100 }),
  body('dueDate').optional().isISO8601().toDate(),
  body('durationMinutes').optional().isInt({ min: 5, max: 480 }).toInt(),
  body('priority').optional().isIn(priorities),
  body('completed').optional().isBoolean().toBoolean(),
];

export const taskIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid study task ID'),
];
