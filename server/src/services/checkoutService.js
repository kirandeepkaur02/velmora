import { randomBytes } from 'node:crypto';
import { env } from '../config/env.js';
import { Coupon } from '../models/couponModel.js';
import { Order } from '../models/orderModel.js';
import { Product } from '../models/productModel.js';
import { ApiError } from '../utils/ApiError.js';

function dollars(cents) {
  return cents / 100;
}

async function calculateCheckout(user, { addressId, couponCode }) {
  const address = user.addresses.id(addressId);
  if (!address) {
    throw new ApiError({
      statusCode: 400,
      code: 'INVALID_SHIPPING_ADDRESS',
      message: 'Select a saved shipping address to continue.',
    });
  }
  if (user.cart.length === 0) {
    throw new ApiError({
      statusCode: 400,
      code: 'EMPTY_CART',
      message: 'Add an available product to your cart before checkout.',
    });
  }

  const products = await Product.find({
    _id: { $in: user.cart.map((item) => item.product) },
    active: true,
  }).lean();
  const productById = new Map(products.map((product) => [product._id.toString(), product]));
  const items = user.cart.map((item) => {
    const product = productById.get(item.product.toString());
    if (!product || product.stock < item.quantity) {
      throw new ApiError({
        statusCode: 409,
        code: 'INSUFFICIENT_STOCK',
        message: 'One or more cart items are unavailable or no longer in stock.',
        details: { productId: item.product.toString(), available: product?.stock ?? 0 },
      });
    }
    return {
      product,
      quantity: item.quantity,
      lineTotalCents: Math.round(product.price * 100) * item.quantity,
    };
  });
  const subtotalCents = items.reduce((total, item) => total + item.lineTotalCents, 0);

  let coupon;
  const normalizedCouponCode = String(couponCode ?? '').trim().toUpperCase();
  if (normalizedCouponCode) {
    coupon = await Coupon.findOne({ code: normalizedCouponCode, active: true }).lean();
    const now = new Date();
    if (
      !coupon ||
      (coupon.startsAt && coupon.startsAt > now) ||
      (coupon.expiresAt && coupon.expiresAt <= now) ||
      (coupon.maximumRedemptions !== undefined &&
        coupon.redemptionCount >= coupon.maximumRedemptions) ||
      subtotalCents < Math.round(coupon.minimumSubtotal * 100)
    ) {
      throw new ApiError({
        statusCode: 400,
        code: 'INVALID_COUPON',
        message: 'This coupon is invalid, expired, or does not meet its requirements.',
      });
    }
  }

  const discountCents = coupon
    ? Math.min(subtotalCents, Math.round(subtotalCents * coupon.discountPercent / 100))
    : 0;
  const shippingCents =
    subtotalCents >= Math.round(env.FREE_SHIPPING_THRESHOLD * 100)
      ? 0
      : Math.round(env.SHIPPING_FLAT_RATE * 100);
  const taxableCents = subtotalCents - discountCents + shippingCents;
  const taxCents = Math.round(taxableCents * env.TAX_RATE);
  const totalCents = taxableCents + taxCents;

  return {
    address,
    items,
    coupon,
    subtotalCents,
    discountCents,
    shippingCents,
    taxCents,
    totalCents,
  };
}

function serializeQuote(calculation) {
  return {
    items: calculation.items.map(({ product, quantity, lineTotalCents }) => ({
      productId: product._id.toString(),
      name: product.name,
      quantity,
      unitPrice: product.price,
      lineTotal: dollars(lineTotalCents),
    })),
    couponCode: calculation.coupon?.code ?? null,
    subtotal: dollars(calculation.subtotalCents),
    discount: dollars(calculation.discountCents),
    shipping: dollars(calculation.shippingCents),
    tax: dollars(calculation.taxCents),
    total: dollars(calculation.totalCents),
    currency: env.CURRENCY,
  };
}

export async function getCheckoutQuote(user, input) {
  return serializeQuote(await calculateCheckout(user, input));
}

export async function createPendingOrder(user, input) {
  const calculation = await calculateCheckout(user, input);
  const order = await Order.create({
    orderNumber: `VM-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`,
    user: user._id,
    items: calculation.items.map(({ product, quantity }) => ({
      productId: product._id,
      slug: product.slug,
      name: product.name,
      quantity,
      unitPrice: product.price,
    })),
    shippingAddress: {
      fullName: calculation.address.fullName,
      phone: calculation.address.phone,
      addressLine1: calculation.address.addressLine1,
      addressLine2: calculation.address.addressLine2,
      city: calculation.address.city,
      state: calculation.address.state,
      postalCode: calculation.address.postalCode,
      country: calculation.address.country,
    },
    couponCode: calculation.coupon?.code,
    subtotal: dollars(calculation.subtotalCents),
    discount: dollars(calculation.discountCents),
    shipping: dollars(calculation.shippingCents),
    tax: dollars(calculation.taxCents),
    total: dollars(calculation.totalCents),
    currency: env.CURRENCY,
    statusHistory: [{ status: 'PENDING', note: 'Order created; payment is pending.' }],
  });

  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    ...serializeQuote(calculation),
  };
}
