import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    benefits: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Ingredient = mongoose.model('Ingredient', ingredientSchema);
