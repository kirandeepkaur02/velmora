import { Router } from 'express';
import {
  adjustInventory,
  archiveAdminBundle,
  archiveAdminCategory,
  archiveAdminIngredient,
  archiveAdminProduct,
  createAdminCategory,
  createAdminCoupon,
  createAdminIngredient,
  createAdminRoutine,
  createAdminArticle,
  createAdminProduct,
  getAdminDashboard,
  listAdminCategories,
  listAdminBundles,
  listAdminCoupons,
  listAdminCustomers,
  listCustomerOrdersForAdmin,
  listAdminIngredients,
  listAdminOrders,
  listAdminProducts,
  archiveAdminRoutine,
  archiveAdminArticle,
  listInventoryMovements,
  setCustomerDisabled,
  saveAdminBundle,
  updateAdminCoupon,
  updateAdminOrderStatus,
  updateAdminProduct,
} from '../../controllers/adminController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  listAdminReviews,
  moderateReview,
} from '../../controllers/reviewController.js';
import { uploadProductImage } from '../../controllers/imageController.js';
import { parseProductImage } from '../../middleware/productImageUpload.js';

const adminRoutes = Router();

adminRoutes.use(requireAuth, requireAdmin);
adminRoutes.get('/dashboard', asyncHandler(getAdminDashboard));
adminRoutes.get('/bundles', asyncHandler(listAdminBundles));
adminRoutes.post('/bundles', asyncHandler(saveAdminBundle));
adminRoutes.patch('/bundles/:bundleId', asyncHandler(saveAdminBundle));
adminRoutes.delete('/bundles/:bundleId', asyncHandler(archiveAdminBundle));
adminRoutes.post('/product-images', parseProductImage, asyncHandler(uploadProductImage));
adminRoutes.get('/products', asyncHandler(listAdminProducts));
adminRoutes.post('/products', asyncHandler(createAdminProduct));
adminRoutes.patch('/products/:productId', asyncHandler(updateAdminProduct));
adminRoutes.delete('/products/:productId', asyncHandler(archiveAdminProduct));
adminRoutes.patch('/products/:productId/inventory', asyncHandler(adjustInventory));
adminRoutes.get('/inventory/movements', asyncHandler(listInventoryMovements));
adminRoutes.get('/products/:productId/inventory/movements', asyncHandler(listInventoryMovements));
adminRoutes.get('/categories', asyncHandler(listAdminCategories));
adminRoutes.post('/categories', asyncHandler(createAdminCategory));
adminRoutes.delete('/categories/:entryId', asyncHandler(archiveAdminCategory));
adminRoutes.get('/ingredients', asyncHandler(listAdminIngredients));
adminRoutes.post('/ingredients', asyncHandler(createAdminIngredient));
adminRoutes.delete('/ingredients/:entryId', asyncHandler(archiveAdminIngredient));
adminRoutes.post('/routines', asyncHandler(createAdminRoutine));
adminRoutes.delete('/routines/:entryId', asyncHandler(archiveAdminRoutine));
adminRoutes.post('/journal', asyncHandler(createAdminArticle));
adminRoutes.delete('/journal/:entryId', asyncHandler(archiveAdminArticle));
adminRoutes.get('/orders', asyncHandler(listAdminOrders));
adminRoutes.patch('/orders/:orderId/status', asyncHandler(updateAdminOrderStatus));
adminRoutes.get('/customers', asyncHandler(listAdminCustomers));
adminRoutes.get('/customers/:customerId/orders', asyncHandler(listCustomerOrdersForAdmin));
adminRoutes.patch('/customers/:customerId/status', asyncHandler(setCustomerDisabled));
adminRoutes.get('/coupons', asyncHandler(listAdminCoupons));
adminRoutes.post('/coupons', asyncHandler(createAdminCoupon));
adminRoutes.patch('/coupons/:couponId', asyncHandler(updateAdminCoupon));
adminRoutes.get('/reviews', asyncHandler(listAdminReviews));
adminRoutes.patch('/reviews/:reviewId/moderation', asyncHandler(moderateReview));

export { adminRoutes };
