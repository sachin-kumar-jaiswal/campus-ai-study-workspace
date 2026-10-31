import { Request, Response, NextFunction } from 'express';

/**
 * Custom application error with HTTP status code support.
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Centralised error handler — must be the last middleware registered.
 * Maps all errors to a consistent JSON response format.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  const errors: { field?: string; message: string }[] = [];

  // Operational errors thrown intentionally by our code
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Mongoose validation errors
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    const validationErr = err as unknown as {
      errors: Record<string, { message: string; path: string }>;
    };
    Object.values(validationErr.errors).forEach((e) => {
      errors.push({ field: e.path, message: e.message });
    });
  }

  // Mongoose duplicate key error
  else if ((err as NodeJS.ErrnoException).code === '11000') {
    statusCode = 409;
    const keyErr = err as unknown as { keyValue: Record<string, string> };
    const field = Object.keys(keyErr.keyValue || {})[0] || 'field';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  // JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please log in again.';
  }

  // Log non-operational errors in non-production environments
  if (process.env.NODE_ENV !== 'production' && !(err instanceof AppError)) {
    console.error('[Error]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    // Stack trace only in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
