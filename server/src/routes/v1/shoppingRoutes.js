import { Router } from 'express';
import {
  addCartItem,
  addBundleToCart,
  addWishlistItem,
  getCart,
  getWishlist,
  removeCartItem,
  removeWishlistItem,
  updateCartItem,
} from '../../controllers/shoppingController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const shoppingRoutes = Router();

shoppingRoutes.get('/cart', requireAuth, asyncHandler(getCart));
shoppingRoutes.post('/cart/items', requireAuth, asyncHandler(addCartItem));
shoppingRoutes.post('/cart/bundles', requireAuth, asyncHandler(addBundleToCart));
shoppingRoutes.patch('/cart/items/:productId', requireAuth, asyncHandler(updateCartItem));
shoppingRoutes.delete('/cart/items/:productId', requireAuth, asyncHandler(removeCartItem));
shoppingRoutes.get('/wishlist', requireAuth, asyncHandler(getWishlist));
shoppingRoutes.post('/wishlist', requireAuth, asyncHandler(addWishlistItem));
shoppingRoutes.delete('/wishlist/:productId', requireAuth, asyncHandler(removeWishlistItem));

export { shoppingRoutes };
