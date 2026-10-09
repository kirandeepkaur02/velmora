import { Router } from 'express';
import {
  createContactMessage,
  subscribeToNewsletter,
} from '../../controllers/storefrontController.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const storefrontRoutes = Router();

storefrontRoutes.post('/contact', asyncHandler(createContactMessage));
storefrontRoutes.post('/newsletter', asyncHandler(subscribeToNewsletter));

export { storefrontRoutes };
