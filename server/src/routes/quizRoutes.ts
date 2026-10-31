import { Router, RequestHandler } from 'express';
import authenticate from '../middleware/authenticate';
import validate from '../middleware/validate';
import { aiLimiter } from '../middleware/rateLimiter';
import {
  createQuiz,
  deleteQuiz,
  getQuiz,
  listQuizzes,
  submitQuiz,
} from '../controllers/quizController';
import { createQuizValidator, quizIdValidator, submitQuizValidator } from '../validators/quizValidators';

const router = Router();

router.use(authenticate as RequestHandler);
router.get('/', listQuizzes as RequestHandler);
router.post('/', aiLimiter, createQuizValidator, validate as RequestHandler, createQuiz as RequestHandler);
router.get('/:id', quizIdValidator, validate as RequestHandler, getQuiz as RequestHandler);
router.post(
  '/:id/submit',
  [...quizIdValidator, ...submitQuizValidator],
  validate as RequestHandler,
  submitQuiz as RequestHandler
);
router.delete('/:id', quizIdValidator, validate as RequestHandler, deleteQuiz as RequestHandler);

export default router;
