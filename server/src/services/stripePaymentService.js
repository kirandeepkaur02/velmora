import Stripe from 'stripe';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Coupon } from '../models/couponModel.js';
import { Order } from '../models/orderModel.js';
import { PaymentWebhookEvent } from '../models/paymentWebhookEventModel.js';
import { Product } from '../models/productModel.js';
import { User } from '../models/userModel.js';
import { ApiError } from '../utils/ApiError.js';

let stripe;

export function getStripeClient() {
  if (!env.STRIPE_SECRET_KEY) {
    throw new ApiError({
      statusCode: 503,
      code: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
      message: 'Stripe payments are not configured. Contact the site administrator.',
    });
  }
  stripe ??= new Stripe(env.STRIPE_SECRET_KEY);
  return stripe;
}

function publicOrigin() {
  return env.CLIENT_ORIGIN.split(',')[0].trim();
}

export async function createStripeCheckoutSession(order) {
  const client = getStripeClient();
  if (order.stripeSessionStatus === 'CREATING') {
    throw new ApiError({
      statusCode: 409,
      code: 'PAYMENT_SESSION_IN_PROGRESS',
      message: 'A payment session is already being created for this order.',
    });
  }

  if (order.stripeSessionStatus === 'OPEN' && order.stripeSessionId) {
    const existingSession = await client.checkout.sessions.retrieve(order.stripeSessionId);
    if (existingSession.status === 'open' && existingSession.url) {
      return { id: existingSession.id, url: existingSession.url };
    }
    if (existingSession.status === 'complete') {
      throw new ApiError({
        statusCode: 409,
        code: 'PAYMENT_ALREADY_SUBMITTED',
        message: 'Payment is being confirmed. Refresh the order status shortly.',
      });
    }
  }

  const update = {
    $set: {
      stripeSessionStatus: 'CREATING',
      status: 'PENDING',
      paymentStatus: 'PENDING',
    },
    $inc: { paymentAttempt: 1 },
  };
  if (order.paymentStatus === 'FAILED') {
    update.$push = {
      statusHistory: {
        status: 'PENDING',
        note: 'A new Stripe payment attempt was started.',
      },
    };
  }
  const claimedOrder = await Order.findOneAndUpdate(
    {
      _id: order._id,
      user: order.user,
      status: { $in: ['PENDING', 'PAYMENT_FAILED'] },
      paymentStatus: { $in: ['PENDING', 'FAILED'] },
      stripeSessionStatus: { $ne: 'CREATING' },
    },
    update,
    { returnDocument: 'after' },
  );
  if (!claimedOrder) {
    throw new ApiError({
      statusCode: 409,
      code: 'ORDER_NOT_PAYABLE',
      message: 'This order cannot start a new payment attempt.',
    });
  }

  try {
    const itemNames = claimedOrder.items
      .map((item) => `${item.name} × ${item.quantity}`)
      .join(', ');
    const origin = publicOrigin();
    const session = await client.checkout.sessions.create(
      {
        mode: 'payment',
        client_reference_id: claimedOrder.orderNumber,
        metadata: {
          orderId: claimedOrder._id.toString(),
          userId: claimedOrder.user.toString(),
        },
        payment_intent_data: {
          metadata: {
            orderId: claimedOrder._id.toString(),
            userId: claimedOrder.user.toString(),
          },
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: claimedOrder.currency.toLowerCase(),
              unit_amount: Math.round(claimedOrder.total * 100),
              product_data: {
                name: `Velmora order ${claimedOrder.orderNumber}`,
                description: `${itemNames}. Includes shipping, discounts, and tax.`,
              },
            },
          },
        ],
        success_url: `${origin}/?payment=success&orderId=${claimedOrder._id.toString()}`,
        cancel_url: `${origin}/?payment=cancelled&orderId=${claimedOrder._id.toString()}`,
      },
      { idempotencyKey: `velmora-order-${claimedOrder._id}-${claimedOrder.paymentAttempt}` },
    );
    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL.');
    }

    claimedOrder.stripeSessionId = session.id;
    claimedOrder.stripeSessionUrl = session.url;
    claimedOrder.stripeSessionStatus = 'OPEN';
    await claimedOrder.save();
    return { id: session.id, url: session.url };
  } catch (error) {
    await Order.updateOne(
      { _id: claimedOrder._id, stripeSessionStatus: 'CREATING' },
      { $set: { stripeSessionStatus: 'FAILED' } },
    );
    if (error instanceof ApiError) throw error;
    throw new ApiError({
      statusCode: 503,
      code: 'PAYMENT_SESSION_FAILED',
      message: 'Stripe could not start the payment session. Please try again.',
    });
  }
}

async function recordEvent(event, session) {
  await PaymentWebhookEvent.create(
    [{ eventId: event.id, eventType: event.type, provider: 'stripe' }],
    session ? { session } : undefined,
  );
}

async function refundCapturedPayment(client, order, paymentIntentId, reason) {
  await client.refunds.create(
    {
      payment_intent: paymentIntentId,
      metadata: { orderId: order._id.toString(), reason },
    },
    { idempotencyKey: `velmora-refund-${order._id}` },
  );
  order.paymentStatus = 'REFUNDED';
  order.status = 'REFUNDED';
  order.stripePaymentIntentId = paymentIntentId;
  order.statusHistory.push({ status: 'REFUNDED', note: reason });
  await order.save();
}

async function settlePaidSession(client, event, checkoutSession) {
  const orderId = checkoutSession.metadata?.orderId;
  if (!mongoose.isValidObjectId(orderId)) {
    throw new ApiError({
      statusCode: 400,
      code: 'INVALID_PAYMENT_METADATA',
      message: 'The payment event is missing valid order metadata.',
    });
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError({
      statusCode: 404,
      code: 'ORDER_NOT_FOUND',
      message: 'The order associated with this payment could not be found.',
    });
  }
  const paymentIntentId = typeof checkoutSession.payment_intent === 'string'
    ? checkoutSession.payment_intent
    : checkoutSession.payment_intent?.id;
  if (
    checkoutSession.payment_status !== 'paid' ||
    checkoutSession.amount_total !== Math.round(order.total * 100) ||
    checkoutSession.currency !== order.currency.toLowerCase() ||
    checkoutSession.id !== order.stripeSessionId ||
    checkoutSession.metadata?.userId !== order.user.toString() ||
    !paymentIntentId
  ) {
    if (paymentIntentId) {
      await refundCapturedPayment(client, order, paymentIntentId, 'Payment amount or currency did not match the order.');
    } else {
      throw new ApiError({
        statusCode: 400,
        code: 'PAYMENT_MISMATCH',
        message: 'The payment details do not match the order.',
      });
    }
    return;
  }

  const dbSession = await mongoose.startSession();
  try {
    await dbSession.withTransaction(async () => {
      const currentOrder = await Order.findById(orderId).session(dbSession);
      if (!currentOrder) {
        throw new ApiError({
          statusCode: 404,
          code: 'ORDER_NOT_FOUND',
          message: 'The order associated with this payment could not be found.',
        });
      }
      if (currentOrder.paymentStatus === 'PAID') {
        await recordEvent(event, dbSession);
        return;
      }
      if (currentOrder.paymentStatus !== 'PENDING' || currentOrder.status !== 'PENDING') {
        throw new ApiError({
          statusCode: 409,
          code: 'ORDER_NOT_PAYABLE',
          message: 'This order is no longer awaiting payment.',
        });
      }

      for (const item of currentOrder.items) {
        const result = await Product.updateOne(
          { _id: item.productId, active: true, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { session: dbSession },
        );
        if (result.modifiedCount !== 1) {
          throw new ApiError({
            statusCode: 409,
            code: 'INVENTORY_CHANGED',
            message: 'Inventory changed before payment confirmation.',
          });
        }
        await User.updateOne(
          {
            _id: currentOrder.user,
            cart: {
              $elemMatch: { product: item.productId, quantity: item.quantity },
            },
          },
          { $pull: { cart: { product: item.productId, quantity: item.quantity } } },
          { session: dbSession },
        );
      }

      if (currentOrder.couponCode) {
        const redeemedCoupon = await Coupon.findOneAndUpdate(
          {
            code: currentOrder.couponCode,
            active: true,
            $or: [
              { maximumRedemptions: { $exists: false } },
              { $expr: { $lt: ['$redemptionCount', '$maximumRedemptions'] } },
            ],
          },
          { $inc: { redemptionCount: 1 } },
          { returnDocument: 'after', session: dbSession },
        );
        if (!redeemedCoupon) {
          throw new ApiError({
            statusCode: 409,
            code: 'COUPON_REDEMPTION_LIMIT',
            message: 'The coupon is no longer available.',
          });
        }
      }

      currentOrder.paymentStatus = 'PAID';
      currentOrder.status = 'CONFIRMED';
      currentOrder.stripeSessionStatus = 'COMPLETE';
      currentOrder.stripePaymentIntentId = paymentIntentId;
      currentOrder.statusHistory.push({
        status: 'CONFIRMED',
        note: 'Payment verified by Stripe webhook.',
      });
      await currentOrder.save({ session: dbSession });
      await recordEvent(event, dbSession);
    });
  } catch (error) {
    if (
      error instanceof ApiError &&
      ['INVENTORY_CHANGED', 'COUPON_REDEMPTION_LIMIT'].includes(error.code)
    ) {
      await refundCapturedPayment(client, order, paymentIntentId, error.message);
      await recordEvent(event);
      return;
    }
    if (error?.code === 11000) return;
    throw error;
  } finally {
    await dbSession.endSession();
  }
}

export async function processStripeWebhookEvent(event) {
  if (await PaymentWebhookEvent.exists({ eventId: event.id })) {
    return { received: true, duplicate: true };
  }
  const client = getStripeClient();
  const object = event.data.object;

  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'checkout.session.async_payment_succeeded'
  ) {
    if (object.payment_status === 'paid') {
      await settlePaidSession(client, event, object);
    } else {
      await recordEvent(event);
    }
  } else if (event.type === 'checkout.session.async_payment_failed') {
    const orderId = object.metadata?.orderId;
    if (mongoose.isValidObjectId(orderId)) {
      await Order.updateOne(
        {
          _id: orderId,
          paymentStatus: 'PENDING',
          stripeSessionId: object.id,
        },
        {
          $set: { paymentStatus: 'FAILED', status: 'PAYMENT_FAILED', stripeSessionStatus: 'FAILED' },
          $push: { statusHistory: { status: 'PAYMENT_FAILED', note: 'Stripe reported a failed payment.' } },
        },
      );
    }
    await recordEvent(event);
  } else if (event.type === 'checkout.session.expired') {
    const orderId = object.metadata?.orderId;
    if (mongoose.isValidObjectId(orderId)) {
      await Order.updateOne(
        { _id: orderId, paymentStatus: 'PENDING', stripeSessionId: object.id },
        { $set: { stripeSessionStatus: 'EXPIRED', stripeSessionUrl: null } },
      );
    }
    await recordEvent(event);
  } else {
    await recordEvent(event);
  }

  return { received: true, duplicate: false };
}

export function constructStripeEvent(payload, signature) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new ApiError({
      statusCode: 503,
      code: 'PAYMENT_WEBHOOK_NOT_CONFIGURED',
      message: 'Stripe webhook verification is not configured.',
    });
  }
  try {
    return getStripeClient().webhooks.constructEvent(
      payload,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError({
      statusCode: 400,
      code: 'INVALID_WEBHOOK_SIGNATURE',
      message: 'The Stripe webhook signature is invalid.',
    });
  }
}
