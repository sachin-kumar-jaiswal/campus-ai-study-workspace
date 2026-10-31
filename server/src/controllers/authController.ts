import { Request, Response, NextFunction } from 'express';
import {
  registerUser,
  loginUser,
  getCurrentUser,
  updateUserName,
  changeUserPassword,
  requestPasswordReset,
  resetUserPassword,
} from '../services/authService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types/index';
// SafeUser is the serialised, password-free user shape returned by the service

/**
 * POST /api/auth/register
 * Creates a new student account.
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    const { user, token } = await registerUser({ name, email, password });

    sendSuccess(res, 'Account created successfully.', { user, token }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Authenticates a user and returns a JWT.
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const { user, token } = await loginUser({ email, password });

    sendSuccess(res, 'Logged in successfully.', { user, token });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile. Requires valid JWT.
 */
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated.', 401);
      return;
    }

    const user = await getCurrentUser(req.user.id);
    sendSuccess(res, 'User profile retrieved.', { user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated.', 401);
      return;
    }
    const user = await updateUserName(req.user.id, req.body.name);
    sendSuccess(res, 'Profile updated.', { user });
  } catch (error) {
    next(error);
  }
};

export const updatePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated.', 401);
      return;
    }
    await changeUserPassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    sendSuccess(res, 'Password updated.', {});
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await requestPasswordReset(req.body.email);
    sendSuccess(
      res,
      'If an account exists for this email, a password reset link has been sent.',
      {}
    );
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await resetUserPassword(req.body.token, req.body.password);
    sendSuccess(res, 'Password reset successfully. You can now log in.', {});
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Client-side logout — instructs the client to discard its token.
 * For stateless JWT, there is no server-side session to invalidate.
 * Phase 6 will add a token blacklist if needed.
 */
export const logout = (_req: Request, res: Response): void => {
  sendSuccess(res, 'Logged out successfully.', {});
};
