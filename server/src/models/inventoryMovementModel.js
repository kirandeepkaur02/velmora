import mongoose from 'mongoose';

const inventoryMovementSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    previousStock: { type: Number, required: true, min: 0 },
    nextStock: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true, trim: true, maxlength: 200 },
  },
  { timestamps: true },
);

export const InventoryMovement = mongoose.model('InventoryMovement', inventoryMovementSchema);
