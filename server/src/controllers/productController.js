import mongoose from 'mongoose';
import { Product } from '../models/productModel.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/sendSuccess.js';

const PAGE_SIZE = 4;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function serializeProduct(product) {
  return {
    id: product._id.toString(),
    name: product.name,
    slug: product.slug,
    description: product.description,
    category: product.category,
    ingredient: product.ingredient,
    concern: product.concern,
    skinType: product.skinType,
    hairType: product.hairType ?? '',
    howToUse: product.howToUse ?? '',
    tags: product.tags ?? [],
    isBestseller: product.isBestseller ?? false,
    price: product.price,
    compareAt: product.compareAt,
    rating: product.rating,
    reviews: product.reviews,
    stock: product.stock,
    isNew: product.isNewArrival,
    badge: product.badge,
    accent: product.accent,
    benefits: product.benefits,
    ingredients: product.ingredients,
    format: product.format,
    images: product.images ?? [],
    frequentlyBoughtTogether: (product.frequentlyBoughtTogether ?? []).map((related) =>
      related && related.name
        ? {
          id: related._id.toString(),
          name: related.name,
          slug: related.slug,
          price: related.price,
          rating: related.rating,
          images: related.images ?? [],
          accent: related.accent,
        }
        : related.toString(),
    ),
  };
}

export async function listProducts(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const filter = { active: true };

  const minRating = req.query.minRating === undefined ? undefined : Number(req.query.minRating);
  const maxPrice = req.query.maxPrice === undefined ? undefined : Number(req.query.maxPrice);
  if (
    (minRating !== undefined && (!Number.isFinite(minRating) || minRating < 0 || minRating > 5)) ||
    (maxPrice !== undefined && (!Number.isFinite(maxPrice) || maxPrice < 0))
  ) {
    throw new ApiError({
      statusCode: 400,
      code: 'INVALID_PRODUCT_FILTER',
      message: 'The product filter values are invalid.',
    });
  }

  if (req.query.category) filter.category = String(req.query.category);
  if (req.query.concern) filter.concern = String(req.query.concern);
  if (req.query.skinType) filter.skinType = String(req.query.skinType);
  if (req.query.hairType) filter.hairType = String(req.query.hairType);
  if (req.query.inStock === 'true') filter.stock = { $gt: 0 };
  if (req.query.inStock !== undefined && !['true', 'false'].includes(String(req.query.inStock))) {
    throw new ApiError({
      statusCode: 400,
      code: 'INVALID_PRODUCT_FILTER',
      message: 'The availability filter is invalid.',
    });
  }
  if (minRating !== undefined && minRating > 0) filter.rating = { $gte: minRating };
  if (maxPrice !== undefined) filter.price = { $lte: maxPrice };
  if (req.query.ingredient) {
    filter.$or = [
      { ingredient: String(req.query.ingredient) },
      { ingredients: String(req.query.ingredient) },
    ];
  }
  if (req.query.q) {
    const searchText = String(req.query.q).trim().slice(0, 100);
    const search = new RegExp(escapeRegex(searchText), 'i');
    const searchFilter = [{ name: search }, { description: search }, { ingredients: search }];
    filter.$and = [...(filter.$and ?? []), { $or: searchFilter }];
  }

  const sortOptions = {
    featured: { isBestseller: -1, rating: -1, reviews: -1, _id: 1 },
    newest: { createdAt: -1, _id: 1 },
    'price-low': { price: 1, _id: 1 },
    'price-high': { price: -1, _id: 1 },
    rating: { rating: -1, reviews: -1, _id: 1 },
  };
  const sort = sortOptions[req.query.sort] ?? sortOptions.featured;
  const [products, totalItems] = await Promise.all([
    Product.find(filter).sort(sort).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
    Product.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    products: products.map(serializeProduct),
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      totalItems,
      totalPages: Math.ceil(totalItems / PAGE_SIZE),
    },
  });
}

export async function getProductFacets(_req, res) {
  const [categories, ingredients, concerns, skinTypes, hairTypes] = await Promise.all([
    Product.distinct('category', { active: true }),
    Product.distinct('ingredient', { active: true }),
    Product.distinct('concern', { active: true }),
    Product.distinct('skinType', { active: true }),
    Product.distinct('hairType', { active: true, hairType: { $exists: true, $ne: '' } }),
  ]);
  return sendSuccess(res, {
    categories: categories.sort(),
    ingredients: ingredients.sort(),
    concerns: concerns.sort(),
    skinTypes: skinTypes.sort(),
    hairTypes: hairTypes.sort(),
  });
}

export async function getProduct(req, res) {
  const identifier = String(req.params.productId);
  const query = mongoose.isValidObjectId(identifier)
    ? { _id: identifier, active: true }
    : { slug: identifier.toLowerCase(), active: true };
  const product = await Product.findOne(query)
    .populate({
      path: 'frequentlyBoughtTogether',
      match: { active: true },
      select: 'name slug price rating images accent',
    })
    .lean();

  if (!product) {
    throw new ApiError({
      statusCode: 404,
      code: 'PRODUCT_NOT_FOUND',
      message: 'The requested product could not be found.',
    });
  }

  return sendSuccess(res, { product: serializeProduct(product) });
}
