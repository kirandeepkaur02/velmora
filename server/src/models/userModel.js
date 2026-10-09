import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    disabledAt: { type: Date, default: null },
    addresses: {
      type: [
        new mongoose.Schema(
          {
            fullName: { type: String, required: true, trim: true, maxlength: 100 },
            phone: { type: String, required: true, trim: true, maxlength: 30 },
            addressLine1: { type: String, required: true, trim: true, maxlength: 200 },
            addressLine2: { type: String, trim: true, maxlength: 200 },
            city: { type: String, required: true, trim: true, maxlength: 100 },
            state: { type: String, required: true, trim: true, maxlength: 100 },
            postalCode: { type: String, required: true, trim: true, maxlength: 20 },
            country: { type: String, required: true, trim: true, maxlength: 100 },
            isDefault: { type: Boolean, default: false },
          },
          { timestamps: true },
        ),
      ],
      default: [],
    },
    cart: {
      type: [
        new mongoose.Schema(
          {
            product: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Product',
              required: true,
            },
            quantity: {
              type: Number,
              required: true,
              min: 1,
              max: 99,
              validate: Number.isInteger,
            },
          },
          { timestamps: true },
        ),
      ],
      default: [],
    },
    wishlist: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);


userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    createdAt: this.createdAt,
    addresses: this.addresses.map((address) => ({
      id: address._id.toString(),
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    })),
  };
};

export const User = mongoose.model('User', userSchema);