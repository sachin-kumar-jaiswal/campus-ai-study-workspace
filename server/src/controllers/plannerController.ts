import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import StudyTask from '../models/StudyTask';
import { AppError } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/response';

const userId = (req: AuthRequest): string => req.user!.id;

export const listStudyTasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tasks = await StudyTask.find({ owner: userId(req) })
      .sort({ completed: 1, dueDate: 1, createdAt: -1 })
      .limit(200);
    sendSuccess(res, 'Study tasks retrieved.', { tasks });
  } catch (error) {
    next(error);
  }
};

export const createStudyTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await StudyTask.create({ ...req.body, owner: userId(req) });
    sendSuccess(res, 'Study task created.', { task }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateStudyTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updates: {
      title?: string;
      subject?: string;
      dueDate?: Date;
      durationMinutes?: number;
      priority?: string;
      completed?: boolean;
      completedAt?: Date;
    } = {};
    const { title, subject, dueDate, durationMinutes, priority, completed } = req.body as {
      title?: string;
      subject?: string;
      dueDate?: string;
      durationMinutes?: number;
      priority?: string;
      completed?: boolean;
    };
    if (title !== undefined) updates.title = title;
    if (subject !== undefined) updates.subject = subject;
    if (dueDate !== undefined) updates.dueDate = new Date(dueDate);
    if (durationMinutes !== undefined) updates.durationMinutes = durationMinutes;
    if (priority !== undefined) updates.priority = priority;
    if (typeof completed === 'boolean') {
      updates.completed = completed;
      updates.completedAt = completed ? new Date() : undefined;
    }

    const task = await StudyTask.findOneAndUpdate(
      { _id: req.params.id, owner: userId(req) },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!task) throw new AppError('Study task not found.', 404);
    sendSuccess(res, 'Study task updated.', { task });
  } catch (error) {
    next(error);
  }
};

export const deleteStudyTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await StudyTask.findOneAndDelete({ _id: req.params.id, owner: userId(req) });
    if (!task) throw new AppError('Study task not found.', 404);
    sendSuccess(res, 'Study task deleted.', {});
  } catch (error) {
    next(error);
  }
};
