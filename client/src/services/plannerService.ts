import api from './api';
import { ApiSuccess, StudyPriority, StudyTask } from '@/types';

export interface StudyTaskInput {
  title: string;
  subject: string;
  dueDate: string;
  durationMinutes: number;
  priority: StudyPriority;
}

export const getStudyTasks = async (): Promise<StudyTask[]> => {
  const { data } = await api.get<ApiSuccess<{ tasks: StudyTask[] }>>('/planner');
  return data.data.tasks;
};

export const createStudyTask = async (input: StudyTaskInput): Promise<StudyTask> => {
  const { data } = await api.post<ApiSuccess<{ task: StudyTask }>>('/planner', input);
  return data.data.task;
};

export const updateStudyTask = async (
  id: string,
  updates: Partial<StudyTaskInput> & { completed?: boolean }
): Promise<StudyTask> => {
  const { data } = await api.patch<ApiSuccess<{ task: StudyTask }>>(`/planner/${id}`, updates);
  return data.data.task;
};

export const deleteStudyTask = async (id: string): Promise<void> => {
  await api.delete(`/planner/${id}`);
};
