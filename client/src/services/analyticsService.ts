import api from './api';
import { ApiSuccess, StudyAnalytics } from '@/types';

export const getStudyAnalytics = async (): Promise<StudyAnalytics> => {
  const { data } = await api.get<ApiSuccess<StudyAnalytics>>('/analytics');
  return data.data;
};
