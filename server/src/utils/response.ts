import { Response } from 'express';
import { ApiSuccess, ApiError } from '../types/index';

/**
 * Sends a standardised success response.
 */
export const sendSuccess = <T>(
  res: Response,
  message: string,
  data: T = {} as T,
  statusCode = 200
): Response<ApiSuccess<T>> => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Sends a standardised error response.
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  errors: ApiError['errors'] = []
): Response<ApiError> => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
  });
};
