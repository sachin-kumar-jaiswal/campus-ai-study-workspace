import api from './api';
import { ApiSuccess, QuizDetail, QuizResult, QuizSummary } from '@/types';

export const getQuizzes = async (): Promise<QuizSummary[]> => {
  const { data } = await api.get<ApiSuccess<{ quizzes: QuizSummary[] }>>('/quizzes');
  return data.data.quizzes;
};

export const getQuiz = async (id: string): Promise<QuizDetail> => {
  const { data } = await api.get<ApiSuccess<{ quiz: QuizDetail }>>(`/quizzes/${id}`);
  return data.data.quiz;
};

export const createQuiz = async (input: {
  topic?: string;
  documentId?: string;
  questionCount: number;
}): Promise<QuizSummary> => {
  const { data } = await api.post<ApiSuccess<{ quiz: QuizSummary }>>('/quizzes', input);
  return data.data.quiz;
};

export const submitQuiz = async (id: string, answers: number[]): Promise<QuizResult> => {
  const { data } = await api.post<ApiSuccess<QuizResult>>(`/quizzes/${id}/submit`, { answers });
  return data.data;
};

export const deleteQuiz = async (id: string): Promise<void> => {
  await api.delete(`/quizzes/${id}`);
};
