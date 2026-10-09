import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    rating: { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    body: { type: String, required: true, trim: true, maxlength: 3000 },
    image: {
      publicId: {
        type: String,
        match: /^velmora\/reviews\/[A-Za-z0-9_-]+$/,
      },
      url: {
        type: String,
        validate: (url) => {
          if (!url) return true;
          try {
            const parsedUrl = new URL(url);
            return parsedUrl.protocol === 'https:' && parsedUrl.hostname === 'res.cloudinary.com';
          } catch {
            return false;
          }
        },
      },
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    moderatedAt: { type: Date },
  },
  { timestamps: true },
);

reviewSchema.index({ product: 1, user: 1 }, { unique: true });

export const Review = mongoose.model('Review', reviewSchema);
