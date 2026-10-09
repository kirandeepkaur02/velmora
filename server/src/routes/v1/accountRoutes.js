import { Router } from 'express';
import {
  createAddress,
  deleteAddress,
  listAddresses,
  updateAddress,
  updateProfile,
} from '../../controllers/accountController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const accountRoutes = Router();

accountRoutes.use(requireAuth);
accountRoutes.patch('/profile', asyncHandler(updateProfile));
accountRoutes.get('/addresses', listAddresses);
accountRoutes.post('/addresses', asyncHandler(createAddress));
accountRoutes.patch('/addresses/:addressId', asyncHandler(updateAddress));
accountRoutes.delete('/addresses/:addressId', asyncHandler(deleteAddress));

export { accountRoutes };
