import { Router } from 'express';
import {
  register,
  login,
  getMe,
  logout,
  updateProfile,
  updatePassword,
  forgotPassword,
  resetPassword,
} from '../controllers/authController';
import authenticate from '../middleware/authenticate';
import validate from '../middleware/validate';
import {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  updatePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from '../validators/authValidators';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply strict rate limiting to all auth routes
router.use(authLimiter);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new student
 * @access  Public
 */
router.post('/register', registerValidator, validate, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login and receive JWT
 * @access  Public
 */
router.post('/login', loginValidator, validate, login);
router.post(
  '/forgot-password',
  passwordResetLimiter,
  forgotPasswordValidator,
  validate,
  forgotPassword
);
router.post(
  '/reset-password',
  passwordResetLimiter,
  resetPasswordValidator,
  validate,
  resetPassword
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Protected
 */
router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, updateProfileValidator, validate, updateProfile);
router.patch('/me/password', authenticate, updatePasswordValidator, validate, updatePassword);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout (client-side token discard)
 * @access  Protected
 */
router.post('/logout', authenticate, logout);

export default router;
