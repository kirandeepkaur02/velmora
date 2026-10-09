import { Router } from 'express';
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  requestPasswordReset,
  refreshSession,
  registerUser,
  resetPassword,
} from '../../controllers/authController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authRateLimit } from '../../middleware/rateLimiters.js';


const authRoutes = Router();

authRoutes.use(authRateLimit);
authRoutes.post('/register', asyncHandler(registerUser));
authRoutes.post('/login', asyncHandler(loginUser));
authRoutes.post('/logout', asyncHandler(logoutUser));
authRoutes.post('/refresh', asyncHandler(refreshSession));
authRoutes.post('/forgot-password', asyncHandler(requestPasswordReset));
authRoutes.post('/reset-password', asyncHandler(resetPassword));
authRoutes.get('/me', requireAuth, asyncHandler(getCurrentUser));

export { authRoutes };