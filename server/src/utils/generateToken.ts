import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/jwt';
import { JwtPayload, UserRole } from '../types/index';

/**
 * Generates a signed JWT for the given user id and role.
 */
const generateToken = (id: string, role: UserRole): string => {
  const payload: JwtPayload = { id, role };
  return jwt.sign(payload, JWT_CONFIG.secret(), { expiresIn: JWT_CONFIG.expiresIn });
};

export default generateToken;
