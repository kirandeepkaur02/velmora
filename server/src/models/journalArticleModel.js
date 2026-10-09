import mongoose from 'mongoose';

const journalArticleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true, lowercase: true },
    excerpt: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    publishedAt: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const JournalArticle = mongoose.model('JournalArticle', journalArticleSchema);
