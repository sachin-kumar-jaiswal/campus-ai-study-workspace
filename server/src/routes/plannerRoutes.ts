import { Router, RequestHandler } from 'express';
import authenticate from '../middleware/authenticate';
import validate from '../middleware/validate';
import {
  createStudyTask,
  deleteStudyTask,
  listStudyTasks,
  updateStudyTask,
} from '../controllers/plannerController';
import {
  createStudyTaskValidator,
  taskIdValidator,
  updateStudyTaskValidator,
} from '../validators/plannerValidators';

const router = Router();

router.use(authenticate as RequestHandler);
router.get('/', listStudyTasks as RequestHandler);
router.post('/', createStudyTaskValidator, validate as RequestHandler, createStudyTask as RequestHandler);
router.patch('/:id', updateStudyTaskValidator, validate as RequestHandler, updateStudyTask as RequestHandler);
router.delete('/:id', taskIdValidator, validate as RequestHandler, deleteStudyTask as RequestHandler);

export default router;
