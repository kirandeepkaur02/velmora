import { Router } from 'express';
import {
  getIngredient,
  listBundles,
  listFeaturedReviews,
  listIngredients,
  listJournalArticles,
  listRoutines,
} from '../../controllers/contentController.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const contentRoutes = Router();

contentRoutes.get('/ingredients', asyncHandler(listIngredients));
contentRoutes.get('/ingredients/:slug', asyncHandler(getIngredient));
contentRoutes.get('/routines', asyncHandler(listRoutines));
contentRoutes.get('/bundles', asyncHandler(listBundles));
contentRoutes.get('/reviews', asyncHandler(listFeaturedReviews));
contentRoutes.get('/journal', asyncHandler(listJournalArticles));

export { contentRoutes };
