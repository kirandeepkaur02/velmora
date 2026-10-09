import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, required: true },
    slug: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], required: true, validate: (items) => items.length > 0 },
    shippingAddress: { type: shippingAddressSchema, required: true },
    couponCode: { type: String },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0 },
    shipping: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 },
    status: {
      type: String,
      enum: [
        'PENDING',
        'CONFIRMED',
        'PROCESSING',
        'SHIPPED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
        'PAYMENT_FAILED',
        'REFUNDED',
      ],
      default: 'PENDING',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
      index: true,
    },
    stripeSessionId: { type: String },
    stripeSessionUrl: { type: String },
    stripeSessionStatus: {
      type: String,
      enum: ['NONE', 'CREATING', 'OPEN', 'COMPLETE', 'EXPIRED', 'FAILED'],
      default: 'NONE',
    },
    paymentAttempt: { type: Number, default: 0, min: 0 },
    stripePaymentIntentId: { type: String },
    statusHistory: {
      type: [
        new mongoose.Schema(
          {
            status: { type: String, required: true },
            note: { type: String },
          },
          { timestamps: true },
        ),
      ],
      default: [],
    },
  },
  { timestamps: true },
);

export const Order = mongoose.model('Order', orderSchema);
