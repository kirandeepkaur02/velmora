import { Router } from 'express';
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from '../../controllers/authController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const authRoutes = Router();

authRoutes.post('/register', asyncHandler(registerUser));
authRoutes.post('/login', asyncHandler(loginUser));
authRoutes.post('/logout', asyncHandler(logoutUser));
authRoutes.get('/me', requireAuth, asyncHandler(getCurrentUser));

export { authRoutes };
