import { Router } from 'express';
import { authRoutes } from './authRoutes.js';
import { healthRoutes } from './healthRoutes.js';

const v1Router = Router();

v1Router.use('/health', healthRoutes);
v1Router.use('/auth', authRoutes);

export { v1Router };
