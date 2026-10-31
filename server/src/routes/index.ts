import { Router } from 'express';
import authRoutes from './authRoutes';
import documentRoutes from './documentRoutes';
import aiRoutes from './aiRoutes';
import quizRoutes from './quizRoutes';
import plannerRoutes from './plannerRoutes';
import analyticsRoutes from './analyticsRoutes';

const router = Router();

// Mount route groups
router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/ai', aiRoutes);
router.use('/quizzes', quizRoutes);
router.use('/planner', plannerRoutes);
router.use('/analytics', analyticsRoutes);

/**
 * GET /api/health
 * Simple health check endpoint — useful for deployment monitoring.
 */
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'CampusAI API is running.',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

export default router;
