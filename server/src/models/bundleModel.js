import mongoose from 'mongoose';

const bundleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true },
    products: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
      validate: (productIds) => productIds.length >= 2 && productIds.length <= 8,
    },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export const Bundle = mongoose.model('Bundle', bundleSchema);
