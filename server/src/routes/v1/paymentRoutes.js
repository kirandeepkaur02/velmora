import { Router } from 'express';
import {
  createPaymentSession,
  getPaymentStatus,
} from '../../controllers/paymentController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const paymentRoutes = Router();

paymentRoutes.post('/orders/:orderId/session', requireAuth, asyncHandler(createPaymentSession));
paymentRoutes.get('/orders/:orderId/status', requireAuth, asyncHandler(getPaymentStatus));

export { paymentRoutes };
