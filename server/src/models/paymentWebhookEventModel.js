import mongoose from 'mongoose';

const paymentWebhookEventSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true, enum: ['stripe'], default: 'stripe' },
    eventId: { type: String, required: true, unique: true },
    eventType: { type: String, required: true },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const PaymentWebhookEvent = mongoose.model(
  'PaymentWebhookEvent',
  paymentWebhookEventSchema,
);
