import mongoose from 'mongoose';

const routineStepSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    productSlug: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const routineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, trim: true, unique: true, lowercase: true },
    description: { type: String, required: true, trim: true },
    steps: { type: [routineStepSchema], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Routine = mongoose.model('Routine', routineSchema);
