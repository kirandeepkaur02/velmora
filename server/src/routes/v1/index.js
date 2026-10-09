import { Router } from 'express';
import { authRoutes } from './authRoutes.js';
import { accountRoutes } from './accountRoutes.js';
import { healthRoutes } from './healthRoutes.js';
import { productRoutes } from './productRoutes.js';
import { storefrontRoutes } from './storefrontRoutes.js';
import { shoppingRoutes } from './shoppingRoutes.js';
import { checkoutRoutes } from './checkoutRoutes.js';
import { paymentRoutes } from './paymentRoutes.js';
import { orderRoutes } from './orderRoutes.js';
import { adminRoutes } from './adminRoutes.js';
import { contentRoutes } from './contentRoutes.js';

const v1Router = Router();

v1Router.use('/health', healthRoutes);
v1Router.use('/auth', authRoutes);
v1Router.use('/account', accountRoutes);
v1Router.use('/products', productRoutes);
v1Router.use('/storefront', storefrontRoutes);
v1Router.use('/', shoppingRoutes);
v1Router.use('/checkout', checkoutRoutes);
v1Router.use('/payments', paymentRoutes);
v1Router.use('/orders', orderRoutes);
v1Router.use('/admin', adminRoutes);
v1Router.use('/content', contentRoutes);

export { v1Router };
