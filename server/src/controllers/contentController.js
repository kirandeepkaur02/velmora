import { Ingredient } from '../models/ingredientModel.js';
import { Bundle } from '../models/bundleModel.js';
import { JournalArticle } from '../models/journalArticleModel.js';
import { Product } from '../models/productModel.js';
import { Routine } from '../models/routineModel.js';
import { Review } from '../models/reviewModel.js';
import { sendSuccess } from '../utils/sendSuccess.js';

export async function listIngredients(_req, res) {
  const ingredients = await Ingredient.find({ active: true })
    .sort({ name: 1 })
    .lean();
  return sendSuccess(res, { ingredients });
}

export async function getIngredient(req, res) {
  const ingredient = await Ingredient.findOne({ slug: String(req.params.slug).toLowerCase(), active: true }).lean();
  if (!ingredient) {
    return sendSuccess(res, { ingredient: null, products: [] });
  }
  const products = await Product.find({
    active: true,
    $or: [{ ingredient: ingredient.name }, { ingredients: ingredient.name }],
  })
    .sort({ rating: -1 })
    .limit(12)
    .select('name slug price compareAt rating reviews stock badge accent')
    .lean();
  return sendSuccess(res, { ingredient, products });
}

export async function listRoutines(_req, res) {
  const routines = await Routine.find({ active: true }).sort({ name: 1 }).lean();
  const productSlugs = [...new Set(routines.flatMap((routine) => routine.steps.map((step) => step.productSlug).filter(Boolean)))];
  const products = await Product.find({ slug: { $in: productSlugs }, active: true })
    .select('name slug price images')
    .lean();
  const productsBySlug = new Map(products.map((product) => [product.slug, {
    id: product._id.toString(),
    name: product.name,
    slug: product.slug,
    price: product.price,
    images: product.images,
  }]));
  return sendSuccess(res, {
    routines: routines.map((routine) => ({
      ...routine,
      steps: routine.steps.map((step) => ({
        ...step,
        product: productsBySlug.get(step.productSlug) ?? null,
      })),
    })),
  });
}

export async function listBundles(_req, res) {
  const bundles = await Bundle.find({ active: true })
    .populate({ path: 'products', match: { active: true }, select: 'name slug price compareAt rating reviews stock badge accent images' })
    .sort({ name: 1 })
    .lean();
  return sendSuccess(res, {
    bundles: bundles.flatMap((bundle) => {
      const activeProducts = bundle.products.filter(Boolean);
      if (activeProducts.length < 2) return [];
      return [{
        id: bundle._id.toString(),
        name: bundle.name,
        slug: bundle.slug,
        description: bundle.description,
        products: activeProducts.map((product) => ({
          id: product._id.toString(),
          name: product.name,
          slug: product.slug,
          price: product.price,
          compareAt: product.compareAt,
          stock: product.stock,
          images: product.images,
        })),
      }];
    }),
  });
}

export async function listFeaturedReviews(_req, res) {
  const reviews = await Review.find({ status: 'APPROVED' })
    .populate('user', 'name')
    .populate('product', 'name')
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();
  return sendSuccess(res, {
    reviews: reviews.map((review) => ({
      id: review._id.toString(),
      customerName: review.user?.name ?? 'Customer',
      productName: review.product?.name ?? 'Velmora product',
      rating: review.rating,
      title: review.title,
      body: review.body,
      verifiedPurchase: true,
      createdAt: review.createdAt,
    })),
  });
}

export async function listJournalArticles(_req, res) {
  const articles = await JournalArticle.find({ active: true })
    .sort({ publishedAt: -1 })
    .limit(30)
    .select('title slug excerpt publishedAt')
    .lean();
  return sendSuccess(res, { articles });
}
