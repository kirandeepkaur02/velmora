import { Router } from 'express';
import {
  getProduct,
  getProductFacets,
  listProducts,
} from '../../controllers/productController.js';
import {
  createProductReview,
  getMyProductReview,
  listProductReviews,
} from '../../controllers/reviewController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { parseProductImage } from '../../middleware/productImageUpload.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const productRoutes = Router();

productRoutes.get('/', asyncHandler(listProducts));
productRoutes.get('/facets', asyncHandler(getProductFacets));
productRoutes.get('/:productId/reviews', asyncHandler(listProductReviews));
productRoutes.get('/:productId/reviews/mine', requireAuth, asyncHandler(getMyProductReview));
productRoutes.post('/:productId/reviews', requireAuth, parseProductImage, asyncHandler(createProductReview));
productRoutes.get('/:productId', asyncHandler(getProduct));

export { productRoutes };
