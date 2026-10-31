import { createHash, randomBytes } from 'crypto';
import User from '../models/User';
import generateToken from '../utils/generateToken';
import { AppError } from '../middleware/errorHandler';
import { IUser } from '../types/index';
import {
  assertPasswordResetEmailConfigured,
  sendPasswordResetEmail,
} from './emailService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

/**
 * A plain serialisable user object (password excluded).
 * Using a plain Record avoids the complex Mongoose FlattenMaps cast issues.
 */
export type SafeUser = {
  _id: string;
  name: string;
  email: string;
  role: IUser['role'];
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
};

interface AuthResult {
  user: SafeUser;
  token: string;
}

// Helper: cast Mongoose toJSON result to SafeUser safely
const toSafeUser = (raw: unknown): SafeUser => raw as SafeUser;

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * Registers a new student account.
 * Throws AppError on duplicate email or invalid input.
 */
export const registerUser = async (input: RegisterInput): Promise<AuthResult> => {
  const { name, email, password } = input;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('An account with this email already exists.', 409);
  }

  // Password hashing is handled by the pre-save hook in the model
  const user = await User.create({ name, email, password });

  const token = generateToken(String(user._id), user.role);

  return { user: toSafeUser(user.toJSON()), token };
};

/**
 * Authenticates a user with email and password.
 * Throws AppError for invalid credentials.
 */
export const loginUser = async (input: LoginInput): Promise<AuthResult> => {
  const { email, password } = input;

  // Explicitly select password since it is excluded by default (select: false)
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    // Same message for both cases — prevents user enumeration
    throw new AppError('Invalid email or password.', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  const token = generateToken(String(user._id), user.role);

  return { user: toSafeUser(user.toJSON()), token };
};

/**
 * Fetches the current authenticated user by ID.
 */
export const getCurrentUser = async (userId: string): Promise<SafeUser> => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return toSafeUser(user.toJSON());
};

export const updateUserName = async (userId: string, name: string): Promise<SafeUser> => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { name } },
    { new: true, runValidators: true }
  );
  if (!user) throw new AppError('User not found.', 404);
  return toSafeUser(user.toJSON());
};

export const changeUserPassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new AppError('User not found.', 404);
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('Your current password is incorrect.', 400);
  }
  user.password = newPassword;
  user.set({
    passwordResetTokenHash: undefined,
    passwordResetExpiresAt: undefined,
  });
  await user.save();
};

export const requestPasswordReset = async (email: string): Promise<void> => {
  assertPasswordResetEmailConfigured();

  const user = await User.findOne({ email });
  if (!user) return;

  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  user.set({
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
  await user.save();

  try {
    await sendPasswordResetEmail(user.email, token);
  } catch (error) {
    await User.updateOne(
      { _id: user._id, passwordResetTokenHash: tokenHash },
      { $unset: { passwordResetTokenHash: 1, passwordResetExpiresAt: 1 } }
    );
    throw error;
  }
};

export const resetUserPassword = async (token: string, newPassword: string): Promise<void> => {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: new Date() },
  }).select('+passwordResetTokenHash +passwordResetExpiresAt');

  if (!user) {
    throw new AppError('This password reset link is invalid or has expired. Request a new one.', 400);
  }

  user.password = newPassword;
  user.set({
    passwordResetTokenHash: undefined,
    passwordResetExpiresAt: undefined,
  });
  await user.save();
};
