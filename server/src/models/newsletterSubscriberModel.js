import mongoose from 'mongoose';

const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
  },
  { timestamps: true },
);

export const NewsletterSubscriber = mongoose.model(
  'NewsletterSubscriber',
  newsletterSubscriberSchema,
);
