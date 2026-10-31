import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/jwt';
import { AuthRequest, JwtPayload } from '../types/index';
import { AppError } from './errorHandler';

/**
 * Protects routes by verifying the JWT in the Authorization header.
 * Attaches the decoded payload to req.user for downstream handlers.
 */
const authenticate = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_CONFIG.secret()) as JwtPayload;

    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
