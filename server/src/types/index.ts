import { Request } from 'express';
import { Document } from 'mongoose';

// ─── User ────────────────────────────────────────────────────────────────────

export type UserRole = 'student' | 'admin';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  id: string;
  role: UserRole;
}

/** Extends Express Request so authenticated routes can access req.user */
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ─── API Responses ───────────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: { field?: string; message: string }[];
}

// ─── Document ─────────────────────────────────────────────────────────────────

export type DocumentStatus = 'uploading' | 'processing' | 'ready' | 'failed';

export interface DocumentMeta {
  _id: string;
  owner: string;
  title: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  storageKey: string;
  summary: string;
  status: DocumentStatus;
  pageCount: number;
  errorMessage: string;
  createdAt: string;
  updatedAt: string;
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
