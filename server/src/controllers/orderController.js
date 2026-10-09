import mongoose from 'mongoose';
import { Order } from '../models/orderModel.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/sendSuccess.js';

function serializeOrder(order) {
  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    items: order.items.map((item) => ({
      productId: item.productId.toString(),
      slug: item.slug,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.unitPrice * item.quantity,
    })),
    shippingAddress: order.shippingAddress,
    couponCode: order.couponCode,
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shipping,
    tax: order.tax,
    total: order.total,
    currency: order.currency,
    status: order.status,
    paymentStatus: order.paymentStatus,
    statusHistory: order.statusHistory.map((entry) => ({
      status: entry.status,
      note: entry.note,
      createdAt: entry.createdAt,
    })),
    createdAt: order.createdAt,
  };
}

export async function listCustomerOrders(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const pageSize = 10;
  const [orders, totalItems] = await Promise.all([
    Order.find({ user: req.user._id })
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Order.countDocuments({ user: req.user._id }),
  ]);
  return sendSuccess(res, {
    orders: orders.map(serializeOrder),
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    },
  });
}

export async function getCustomerOrder(req, res) {
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
  }).lean();
  if (!order) {
    throw new ApiError({
      statusCode: 404,
      code: 'ORDER_NOT_FOUND',
      message: 'The requested order could not be found.',
    });
  }
  return sendSuccess(res, { order: serializeOrder(order) });
}

