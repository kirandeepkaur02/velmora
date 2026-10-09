import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Order } from '../models/orderModel.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/sendSuccess.js';
import {
  constructStripeEvent,
  createStripeCheckoutSession,
  processStripeWebhookEvent,
} from '../services/stripePaymentService.js';

export async function createPaymentSession(req, res) {
  if (!mongoose.isValidObjectId(req.params.orderId)) {
    throw new ApiError({
      statusCode: 404,
      code: 'ORDER_NOT_FOUND',
      message: 'The requested order could not be found.',
    });
  }

  const order = await Order.findOne({
    _id: req.params.orderId,
    user: req.user._id,
    status: { $in: ['PENDING', 'PAYMENT_FAILED'] },
    paymentStatus: { $in: ['PENDING', 'FAILED'] },
  });
  if (!order) {
    throw new ApiError({
      statusCode: 404,
      code: 'ORDER_NOT_FOUND',
      message: 'The requested payable order could not be found.',
    });
  }
  const session = await createStripeCheckoutSession(order);
  return sendSuccess(res, { checkoutUrl: session.url });
}

export async function getPaymentStatus(req, res) {
  if (!mongoose.isValidObjectId(req.params.orderId)) {
    throw new ApiError({
      statusCode: 404,
      code: 'ORDER_NOT_FOUND',
      message: 'The requested order could not be found.',
    });
  }
  const order = await Order.findOne(
    { _id: req.params.orderId, user: req.user._id },
    'orderNumber status paymentStatus total currency',
  ).lean();
  if (!order) {
    throw new ApiError({
      statusCode: 404,
      code: 'ORDER_NOT_FOUND',
      message: 'The requested order could not be found.',
    });
  }
  return sendSuccess(res, {
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: order.total,
    currency: order.currency,
  });
}

export async function handleStripeWebhook(req, res) {
  const signature = req.headers['stripe-signature'];
  if (!signature || !Buffer.isBuffer(req.body)) {
    throw new ApiError({
      statusCode: 400,
      code: 'INVALID_WEBHOOK_REQUEST',
      message: 'A raw Stripe webhook payload and signature are required.',
    });
  }
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new ApiError({
      statusCode: 503,
      code: 'PAYMENT_WEBHOOK_NOT_CONFIGURED',
      message: 'Stripe webhook verification is not configured.',
    });
  }
  const event = constructStripeEvent(req.body, signature);
  const result = await processStripeWebhookEvent(event);
  return sendSuccess(res, result);
}
