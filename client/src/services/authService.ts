import api from './api';
import { User, LoginCredentials, RegisterCredentials, ApiSuccess } from '@/types';

interface AuthData {
  user: User;
  token: string;
}

/**
 * Registers a new student account.
 */
export const registerApi = async (
  credentials: RegisterCredentials
): Promise<AuthData> => {
  const { data } = await api.post<ApiSuccess<AuthData>>('/auth/register', credentials);
  return data.data;
};

/**
 * Logs in with email and password, returns user + token.
 */
export const loginApi = async (
  credentials: LoginCredentials
): Promise<AuthData> => {
  const { data } = await api.post<ApiSuccess<AuthData>>('/auth/login', credentials);
  return data.data;
};

/**
 * Fetches the current authenticated user's profile.
 */
export const getMeApi = async (): Promise<User> => {
  const { data } = await api.get<ApiSuccess<{ user: User }>>('/auth/me');
  return data.data.user;
};

export const updateProfileApi = async (name: string): Promise<User> => {
  const { data } = await api.patch<ApiSuccess<{ user: User }>>('/auth/me', { name });
  return data.data.user;
};

export const updatePasswordApi = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  await api.patch('/auth/me/password', { currentPassword, newPassword });
};

export const requestPasswordResetApi = async (email: string): Promise<void> => {
  await api.post('/auth/forgot-password', { email });
};

export const resetPasswordApi = async (token: string, password: string): Promise<void> => {
  await api.post('/auth/reset-password', { token, password });
};

/**
 * Logs out — notifies the server (for future token blacklisting) and clears local state.
 */
export const logoutApi = async (): Promise<void> => {
  await api.post('/auth/logout');
};
