import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountPercent: { type: Number, required: true, min: 0, max: 100 },
    minimumSubtotal: { type: Number, default: 0, min: 0 },
    startsAt: { type: Date },
    expiresAt: { type: Date },
    maximumRedemptions: { type: Number, min: 1 },
    redemptionCount: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Coupon = mongoose.model('Coupon', couponSchema);
