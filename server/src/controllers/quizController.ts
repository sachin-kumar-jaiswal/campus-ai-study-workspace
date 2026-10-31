import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../types';
import DocumentModel from '../models/Document';
import QuizModel, { IQuiz } from '../models/Quiz';
import { AppError } from '../middleware/errorHandler';
import { generateQuizQuestions, isAiConfigured } from '../services/ai/aiService';
import { sendError, sendSuccess } from '../utils/response';

const userId = (req: AuthRequest): string => req.user!.id;

const toQuizSummary = (quiz: IQuiz) => ({
  _id: String(quiz._id),
  title: quiz.title,
  sourceLabel: quiz.sourceLabel,
  questionCount: quiz.questions.length,
  attemptCount: quiz.attempts.length,
  latestScore: quiz.attempts[quiz.attempts.length - 1]?.score ?? null,
  createdAt: quiz.createdAt,
});

export const listQuizzes = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const quizzes = await QuizModel.find({ owner: userId(req) }).sort({ createdAt: -1 }).limit(50);
    sendSuccess(res, 'Quizzes retrieved.', { quizzes: quizzes.map(toQuizSummary) });
  } catch (error) {
    next(error);
  }
};

export const createQuiz = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!isAiConfigured()) {
      sendError(res, 'Quiz generation is unavailable until a valid OPENAI_API_KEY is set in the server environment.', 503);
      return;
    }

    const { documentId, topic, questionCount = 5 } = req.body as {
      documentId?: string;
      topic?: string;
      questionCount?: number;
    };

    if (!documentId && !topic?.trim()) {
      sendError(res, 'Choose a document or enter a topic to create a quiz.', 400);
      return;
    }

    let source = topic?.trim() || '';
    let sourceLabel = source;
    let linkedDocument: Types.ObjectId | undefined;

    if (documentId) {
      const document = await DocumentModel.findOne({
        _id: documentId,
        owner: userId(req),
        status: 'ready',
      }).select('title extractedText');
      if (!document) throw new AppError('Document not found or not ready yet.', 404);
      if (!document.extractedText.trim()) {
        throw new AppError('This document has no readable text. Try a topic-based quiz instead.', 400);
      }
      source = document.extractedText;
      sourceLabel = document.title;
      linkedDocument = document._id;
    }

    const questions = await generateQuizQuestions(source, questionCount);
    const quiz = await QuizModel.create({
      owner: userId(req),
      title: topic?.trim() || `Quiz: ${sourceLabel}`,
      sourceLabel,
      document: linkedDocument,
      questions,
    });

    sendSuccess(res, 'Quiz created.', { quiz: toQuizSummary(quiz) }, 201);
  } catch (error) {
    next(error);
  }
};

export const getQuiz = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const quiz = await QuizModel.findOne({ _id: req.params.id, owner: userId(req) });
    if (!quiz) throw new AppError('Quiz not found.', 404);

    sendSuccess(res, 'Quiz retrieved.', {
      quiz: {
        ...toQuizSummary(quiz),
        questions: quiz.questions.map(({ prompt, options }) => ({ prompt, options })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const submitQuiz = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const quiz = await QuizModel.findOne({ _id: req.params.id, owner: userId(req) });
    if (!quiz) throw new AppError('Quiz not found.', 404);

    const { answers } = req.body as { answers: number[] };
    if (answers.length !== quiz.questions.length) {
      sendError(res, 'Answer every question before submitting.', 400);
      return;
    }

    const correctCount = quiz.questions.reduce(
      (count, question, index) => count + (answers[index] === question.correctIndex ? 1 : 0),
      0
    );
    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const completedAt = new Date();
    quiz.attempts.push({ answers, score, completedAt });
    await quiz.save();

    sendSuccess(res, 'Quiz submitted.', {
      score,
      correctCount,
      totalQuestions: quiz.questions.length,
      completedAt,
      review: quiz.questions.map((question, index) => ({
        prompt: question.prompt,
        options: question.options,
        selectedIndex: answers[index],
        correctIndex: question.correctIndex,
        explanation: question.explanation,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteQuiz = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const quiz = await QuizModel.findOneAndDelete({ _id: req.params.id, owner: userId(req) });
    if (!quiz) throw new AppError('Quiz not found.', 404);
    sendSuccess(res, 'Quiz deleted.', {});
  } catch (error) {
    next(error);
  }
};
