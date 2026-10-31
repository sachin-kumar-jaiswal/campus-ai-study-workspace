import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import DocumentModel from '../models/Document';
import QuizModel from '../models/Quiz';
import StudyTask from '../models/StudyTask';
import { sendSuccess } from '../utils/response';

export const getAnalytics = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const owner = req.user!.id;
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);

    const [documentCount, readyDocumentCount, completedTasks, upcomingTasks, quizzes, recentCompletedTasks] =
      await Promise.all([
        DocumentModel.countDocuments({ owner }),
        DocumentModel.countDocuments({ owner, status: 'ready' }),
        StudyTask.find({ owner, completed: true }).select('durationMinutes'),
        StudyTask.countDocuments({ owner, completed: false, dueDate: { $gte: new Date() } }),
        QuizModel.find({ owner }).select('attempts'),
        StudyTask.find({ owner, completed: true, completedAt: { $gte: since } }).select('durationMinutes completedAt'),
      ]);

    const attempts = quizzes.flatMap((quiz) => quiz.attempts);
    const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
    const weeklyActivity = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(since);
      date.setDate(since.getDate() + index);
      const day = date.toISOString().slice(0, 10);
      return {
        date: day,
        minutes: recentCompletedTasks
          .filter((task) => task.completedAt?.toISOString().slice(0, 10) === day)
          .reduce((sum, task) => sum + task.durationMinutes, 0),
        quizAttempts: attempts.filter((attempt) => attempt.completedAt.toISOString().slice(0, 10) === day).length,
      };
    });

    sendSuccess(res, 'Analytics retrieved.', {
      documents: documentCount,
      readyDocuments: readyDocumentCount,
      completedTasks: completedTasks.length,
      upcomingTasks,
      trackedStudyMinutes: completedTasks.reduce((sum, task) => sum + task.durationMinutes, 0),
      quizAttempts: attempts.length,
      averageQuizScore: attempts.length ? Math.round(totalScore / attempts.length) : null,
      weeklyActivity,
    });
  } catch (error) {
    next(error);
  }
};
