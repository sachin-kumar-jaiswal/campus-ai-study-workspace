import { Router, RequestHandler } from 'express';
import authenticate from '../middleware/authenticate';
import { getAnalytics } from '../controllers/analyticsController';

const router = Router();

router.use(authenticate as RequestHandler);
router.get('/', getAnalytics as RequestHandler);

export default router;
