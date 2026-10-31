import { body, param, ValidationChain } from 'express-validator';

export const createQuizValidator: ValidationChain[] = [
  body('documentId')
    .optional({ values: 'falsy' })
    .isMongoId()
    .withMessage('Choose a valid document'),
  body('topic')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 2, max: 160 })
    .withMessage('Topic must be between 2 and 160 characters'),
  body('questionCount')
    .optional()
    .isInt({ min: 3, max: 10 })
    .withMessage('Choose between 3 and 10 questions')
    .toInt(),
];

export const quizIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid quiz ID'),
];

export const submitQuizValidator: ValidationChain[] = [
  body('answers')
    .isArray({ min: 3, max: 10 })
    .withMessage('Answers must be provided for every quiz question'),
  body('answers.*')
    .isInt({ min: 0, max: 3 })
    .withMessage('Each answer must select one of the four choices')
    .toInt(),
];
