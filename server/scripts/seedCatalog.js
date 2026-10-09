import '../src/config/loadDotenv.js';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { catalogSeed } from '../src/data/catalogSeed.js';
import { couponSeed } from '../src/data/couponSeed.js';
import {
  articleSeed,
  bundleSeed,
  categorySeed,
  frequentlyBoughtTogetherSeed,
  ingredientSeed,
  routineSeed,
} from '../src/data/contentSeed.js';
import { JournalArticle } from '../src/models/journalArticleModel.js';
import { Category } from '../src/models/categoryModel.js';
import { Ingredient } from '../src/models/ingredientModel.js';
import { Product } from '../src/models/productModel.js';
import { Coupon } from '../src/models/couponModel.js';
import { Routine } from '../src/models/routineModel.js';
import { Bundle } from '../src/models/bundleModel.js';
import { Review } from '../src/models/reviewModel.js';

try {
  await mongoose.connect(env.MONGODB_URI);
  const operations = catalogSeed.map((product) => {
    const { howToUse, isBestseller, tags, ...catalogContent } = product;
    return {
      updateOne: {
        filter: { slug: product.slug },
        update: {
          $setOnInsert: catalogContent,
          $set: { howToUse, isBestseller, tags },
        },
        upsert: true,
      },
    };
  });
  const result = await Product.bulkWrite(operations);
  const ratingSummaries = await Review.aggregate([
    { $match: { status: 'APPROVED' } },
    { $group: { _id: '$product', rating: { $avg: '$rating' }, reviews: { $sum: 1 } } },
  ]);
  const summariesByProductId = new Map(ratingSummaries.map((summary) => [summary._id.toString(), summary]));
  const storedProducts = await Product.find().select('_id').lean();
  await Product.bulkWrite(storedProducts.map((product) => {
    const summary = summariesByProductId.get(product._id.toString());
    return {
      updateOne: {
        filter: { _id: product._id },
        update: {
          $set: {
            rating: summary ? Math.round(summary.rating * 10) / 10 : 0,
            reviews: summary?.reviews ?? 0,
          },
        },
      },
    };
  }));
  for (const recommendation of frequentlyBoughtTogetherSeed) {
    const [product, relatedProducts] = await Promise.all([
      Product.findOne({ slug: recommendation.slug }).select('_id frequentlyBoughtTogether').lean(),
      Product.find({ slug: { $in: recommendation.relatedSlugs }, active: true }).select('_id slug').lean(),
    ]);
    if (!product || relatedProducts.length !== recommendation.relatedSlugs.length) {
      throw new Error(`Frequently bought together seed "${recommendation.slug}" is missing an active catalog product.`);
    }
    await Product.updateOne(
      {
        _id: product._id,
        $or: [
          { frequentlyBoughtTogether: { $exists: false } },
          { frequentlyBoughtTogether: { $size: 0 } },
        ],
      },
      { $set: { frequentlyBoughtTogether: relatedProducts.map((related) => related._id) } },
    );
  }
  const couponResult = await Coupon.bulkWrite(
    couponSeed.map((coupon) => ({
      updateOne: {
        filter: { code: coupon.code },
        update: { $setOnInsert: coupon },
        upsert: true,
      },
    })),
  );
  const [categoryResult, ingredientResult, routineResult, articleResult] = await Promise.all([
    Category.bulkWrite(categorySeed.map((record) => ({
      updateOne: { filter: { slug: record.slug }, update: { $setOnInsert: record }, upsert: true },
    }))),
    Ingredient.bulkWrite(ingredientSeed.map((record) => ({
      updateOne: { filter: { slug: record.slug }, update: { $setOnInsert: record }, upsert: true },
    }))),
    Routine.bulkWrite(routineSeed.map((record) => ({
      updateOne: { filter: { slug: record.slug }, update: { $setOnInsert: record }, upsert: true },
    }))),
    JournalArticle.bulkWrite(articleSeed.map((record) => ({
      updateOne: { filter: { slug: record.slug }, update: { $setOnInsert: record }, upsert: true },
    }))),
  ]);
  const bundleOperations = [];
  for (const bundle of bundleSeed) {
    const products = await Product.find({ slug: { $in: bundle.productSlugs }, active: true }).select('_id slug').lean();
    if (products.length !== bundle.productSlugs.length) {
      throw new Error(`Bundle seed "${bundle.slug}" is missing one or more active catalog products.`);
    }
    bundleOperations.push({
      updateOne: {
        filter: { slug: bundle.slug },
        update: {
          $setOnInsert: {
            name: bundle.name,
            slug: bundle.slug,
            description: bundle.description,
            products: products.map((product) => product._id),
            active: true,
          },
        },
        upsert: true,
      },
    });
  }
  const bundleResult = await Bundle.bulkWrite(bundleOperations);
  console.log(
    `Seed complete: ${result.upsertedCount} products, ${couponResult.upsertedCount} coupons, ${categoryResult.upsertedCount} categories, ${ingredientResult.upsertedCount} ingredients, ${routineResult.upsertedCount} routines, ${articleResult.upsertedCount} articles, and ${bundleResult.upsertedCount} bundles added; existing records left unchanged.`,
  );
} catch (error) {
  console.error('Catalog seed failed:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
