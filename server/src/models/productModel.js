import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    ingredient: { type: String, required: true, trim: true, index: true },
    concern: { type: String, required: true, trim: true, index: true },
    skinType: { type: String, required: true, trim: true },
    hairType: { type: String, trim: true, default: '' },
    howToUse: { type: String, trim: true, default: '' },
    tags: { type: [String], default: [] },
    isBestseller: { type: Boolean, default: false },
    price: { type: Number, required: true, min: 0 },
    compareAt: { type: Number, required: true, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: { type: Number, default: 0, min: 0 },
    stock: { type: Number, required: true, min: 0, validate: Number.isInteger },
    isNewArrival: { type: Boolean, default: false },
    badge: { type: String, default: 'Botanical care', trim: true },
    accent: { type: String, enum: ['rose', 'sage', 'sand', 'green'], default: 'sage' },
    benefits: { type: [String], default: [] },
    ingredients: { type: [String], default: [] },
    format: { type: String, required: true, trim: true },
    images: {
      type: [{
        publicId: {
          type: String,
          required: true,
          match: /^velmora\/products\/[A-Za-z0-9_-]+$/,
        },
        url: {
          type: String,
          required: true,
          validate: (url) => {
            try {
              const parsedUrl = new URL(url);
              return parsedUrl.protocol === 'https:' && parsedUrl.hostname === 'res.cloudinary.com';
            } catch {
              return false;
            }
          },
        },
      }],
      default: [],
      validate: (images) => images.length <= 8,
    },
    frequentlyBoughtTogether: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
      default: [],
      validate: (productIds) => productIds.length <= 8,
    },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

productSchema.index({ name: 'text', description: 'text', ingredients: 'text' });

export const Product = mongoose.model('Product', productSchema);
