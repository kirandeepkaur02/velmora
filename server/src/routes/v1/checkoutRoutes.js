import { Router } from 'express';
import {
  checkoutQuote,
  createCheckoutOrder,
} from '../../controllers/checkoutController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const checkoutRoutes = Router();

checkoutRoutes.post('/quote', requireAuth, asyncHandler(checkoutQuote));
checkoutRoutes.post('/orders', requireAuth, asyncHandler(createCheckoutOrder));

export { checkoutRoutes };
