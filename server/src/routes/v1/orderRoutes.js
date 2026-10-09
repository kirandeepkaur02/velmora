import { Router } from 'express';
import {
  getCustomerOrder,
  listCustomerOrders,
} from '../../controllers/orderController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { parseProductImage } from '../../middleware/productImageUpload.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  deleteProductReview,
  updateProductReview,
} from '../../controllers/reviewController.js';

const orderRoutes = Router();

orderRoutes.get('/', requireAuth, asyncHandler(listCustomerOrders));
orderRoutes.get('/:orderId', requireAuth, asyncHandler(getCustomerOrder));
orderRoutes.patch('/reviews/:reviewId', requireAuth, parseProductImage, asyncHandler(updateProductReview));
orderRoutes.delete('/reviews/:reviewId', requireAuth, asyncHandler(deleteProductReview));

export { orderRoutes };
