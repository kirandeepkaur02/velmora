import mongoose from 'mongoose';
import { Category } from '../models/categoryModel.js';
import { Bundle } from '../models/bundleModel.js';
import { Coupon } from '../models/couponModel.js';
import { Ingredient } from '../models/ingredientModel.js';
import { InventoryMovement } from '../models/inventoryMovementModel.js';
import { JournalArticle } from '../models/journalArticleModel.js';
import { Order } from '../models/orderModel.js';
import { Product } from '../models/productModel.js';
import { Routine } from '../models/routineModel.js';
import { User } from '../models/userModel.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/sendSuccess.js';

const allowedAccents = new Set(['rose', 'sage', 'sand', 'green']);
const orderTransitions = {
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
};

function badRequest(code, message) {
  return new ApiError({ statusCode: 400, code, message });
}

function toProductPayload(body, existing = {}) {
  const product = {
    name: body.name === undefined ? existing.name : String(body.name).trim(),
    slug: body.slug === undefined ? existing.slug : String(body.slug).trim().toLowerCase(),
    description: body.description === undefined ? existing.description : String(body.description).trim(),
    category: body.category === undefined ? existing.category : String(body.category).trim(),
    ingredient: body.ingredient === undefined ? existing.ingredient : String(body.ingredient).trim(),
    concern: body.concern === undefined ? existing.concern : String(body.concern).trim(),
    skinType: body.skinType === undefined ? existing.skinType : String(body.skinType).trim(),
    hairType: body.hairType === undefined ? existing.hairType ?? '' : String(body.hairType).trim(),
    howToUse: body.howToUse === undefined ? existing.howToUse ?? '' : String(body.howToUse).trim(),
    tags: body.tags === undefined ? existing.tags ?? [] : body.tags,
    isBestseller: body.isBestseller === undefined ? existing.isBestseller ?? false : body.isBestseller,
    format: body.format === undefined ? existing.format : String(body.format).trim(),
    price: body.price === undefined ? existing.price : Number(body.price),
    compareAt: body.compareAt === undefined ? existing.compareAt : Number(body.compareAt),
    stock: body.stock === undefined ? existing.stock : Number(body.stock),
    rating: body.rating === undefined ? existing.rating ?? 0 : Number(body.rating),
    reviews: body.reviews === undefined ? existing.reviews ?? 0 : Number(body.reviews),
    isNewArrival: body.isNew === undefined ? existing.isNewArrival ?? false : body.isNew,
    badge: body.badge === undefined ? existing.badge ?? 'Botanical care' : String(body.badge).trim(),
    accent: body.accent === undefined ? existing.accent ?? 'sage' : String(body.accent),
    benefits: body.benefits === undefined ? existing.benefits ?? [] : body.benefits,
    ingredients: body.ingredients === undefined ? existing.ingredients ?? [] : body.ingredients,
    images: body.images === undefined ? existing.images ?? [] : body.images,
    frequentlyBoughtTogether: body.frequentlyBoughtTogether === undefined
      ? existing.frequentlyBoughtTogether ?? []
      : body.frequentlyBoughtTogether,
    active: body.active === undefined ? existing.active ?? true : body.active,
  };

  const relatedProductIds = Array.isArray(product.frequentlyBoughtTogether)
    ? product.frequentlyBoughtTogether.map((id) => id.toString())
    : [];
  if (
    !product.name ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug) ||
    !product.description ||
    !product.category ||
    !product.ingredient ||
    !product.concern ||
    !product.skinType ||
    typeof product.hairType !== 'string' ||
    typeof product.howToUse !== 'string' ||
    product.howToUse.length > 2000 ||
    !product.format ||
    !Number.isFinite(product.price) ||
    product.price < 0 ||
    !Number.isFinite(product.compareAt) ||
    product.compareAt < product.price ||
    !Number.isInteger(product.stock) ||
    product.stock < 0 ||
    !Number.isFinite(product.rating) ||
    product.rating < 0 ||
    product.rating > 5 ||
    !Number.isInteger(product.reviews) ||
    product.reviews < 0 ||
    !allowedAccents.has(product.accent) ||
    typeof product.isNewArrival !== 'boolean' ||
    typeof product.isBestseller !== 'boolean' ||
    typeof product.active !== 'boolean' ||
    !Array.isArray(product.benefits) ||
    !Array.isArray(product.ingredients) ||
    !Array.isArray(product.tags) ||
    !Array.isArray(product.images) ||
    !Array.isArray(product.frequentlyBoughtTogether) ||
    product.frequentlyBoughtTogether.length > 8 ||
    relatedProductIds.some((id) => !mongoose.isValidObjectId(id)) ||
    new Set(relatedProductIds).size !== relatedProductIds.length ||
    relatedProductIds.includes(existing._id?.toString()) ||
    product.images.length > 8 ||
    product.images.some((image) =>
      !image ||
      typeof image.publicId !== 'string' ||
      !/^velmora\/products\/[A-Za-z0-9_-]+$/.test(image.publicId) ||
      typeof image.url !== 'string' ||
      !/^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(image.url)
    )
  ) {
    throw badRequest('INVALID_PRODUCT', 'Product fields are invalid.');
  }
  product.frequentlyBoughtTogether = relatedProductIds;
  return product;
}

async function validateRelatedProducts(productIds) {
  if (!productIds.length) return;
  const activeCount = await Product.countDocuments({ _id: { $in: productIds }, active: true });
  if (activeCount !== productIds.length) {
    throw badRequest('INVALID_RELATED_PRODUCTS', 'Frequently bought together items must be active products.');
  }
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
    hairType: product.hairType,
    howToUse: product.howToUse,
    tags: product.tags,
    isBestseller: product.isBestseller,
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
    images: product.images,
    frequentlyBoughtTogether: (product.frequentlyBoughtTogether ?? []).map((related) => related.toString()),
    active: product.active,
  };
}

export async function getAdminDashboard(_req, res) {
  const lowStockThreshold = 5;
  const [revenue, orderCount, customerCount, productCount, lowStock, recentOrders, topProducts] =
    await Promise.all([
      Order.aggregate([{ $match: { paymentStatus: 'PAID' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments({ active: true }),
      Product.find({ active: true, stock: { $lte: lowStockThreshold } }).sort({ stock: 1 }).limit(10).lean(),
      Order.find().sort({ createdAt: -1 }).limit(10).select('orderNumber total currency status paymentStatus createdAt').lean(),
      Order.aggregate([
        { $match: { paymentStatus: 'PAID' } },
        { $unwind: '$items' },
        { $group: { _id: '$items.productId', name: { $first: '$items.name' }, quantity: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } } } },
        { $sort: { quantity: -1 } },
        { $limit: 5 },
      ]),
    ]);
  const since = new Date();
  since.setMonth(since.getMonth() - 5, 1);
  since.setHours(0, 0, 0, 0);
  const revenueTrend = await Order.aggregate([
    { $match: { paymentStatus: 'PAID', createdAt: { $gte: since } } },
    { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);
  return sendSuccess(res, {
    metrics: {
      totalRevenue: revenue[0]?.total ?? 0,
      orders: orderCount,
      customers: customerCount,
      products: productCount,
    },
    lowStockProducts: lowStock.map(serializeProduct),
    recentOrders,
    topProducts,
    revenueTrend,
  });
}

function serializeBundle(bundle) {
  return {
    id: bundle._id.toString(),
    name: bundle.name,
    slug: bundle.slug,
    description: bundle.description,
    products: bundle.products.map((product) => ({
      id: product._id.toString(),
      name: product.name,
      slug: product.slug,
      price: product.price,
      images: product.images ?? [],
    })),
    active: bundle.active,
  };
}

export async function listAdminBundles(_req, res) {
  const bundles = await Bundle.find()
    .populate('products', 'name slug price images active')
    .sort({ name: 1 })
    .lean();
  return sendSuccess(res, { bundles: bundles.map(serializeBundle) });
}

export async function saveAdminBundle(req, res) {
  const { bundleId } = req.params;
  if (bundleId && !mongoose.isValidObjectId(bundleId)) {
    throw new ApiError({ statusCode: 404, code: 'BUNDLE_NOT_FOUND', message: 'Bundle not found.' });
  }
  const name = String(req.body?.name ?? '').trim();
  const slug = String(req.body?.slug ?? '').trim().toLowerCase();
  const description = String(req.body?.description ?? '').trim();
  const productIds = req.body?.productIds;
  if (
    !name ||
    name.length > 100 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
    !description ||
    description.length > 1000 ||
    !Array.isArray(productIds) ||
    productIds.length < 2 ||
    productIds.length > 8 ||
    new Set(productIds.map(String)).size !== productIds.length ||
    productIds.some((id) => !mongoose.isValidObjectId(id))
  ) {
    throw badRequest('INVALID_BUNDLE', 'Bundle details and two to eight unique products are required.');
  }
  const products = await Product.find({ _id: { $in: productIds }, active: true }).select('_id').lean();
  if (products.length !== productIds.length) {
    throw badRequest('INVALID_BUNDLE_PRODUCTS', 'All bundle products must exist and be active.');
  }
  const bundle = bundleId
    ? await Bundle.findByIdAndUpdate(bundleId, {
      $set: { name, slug, description, products: productIds },
    }, { returnDocument: 'after', runValidators: true })
    : await Bundle.create({ name, slug, description, products: productIds });
  if (!bundle) {
    throw new ApiError({ statusCode: 404, code: 'BUNDLE_NOT_FOUND', message: 'Bundle not found.' });
  }
  await bundle.populate('products', 'name slug price images active');
  return sendSuccess(res, { bundle: serializeBundle(bundle) }, bundleId ? 200 : 201);
}

export async function archiveAdminBundle(req, res) {
  if (!mongoose.isValidObjectId(req.params.bundleId)) {
    throw new ApiError({ statusCode: 404, code: 'BUNDLE_NOT_FOUND', message: 'Bundle not found.' });
  }
  const bundle = await Bundle.findByIdAndUpdate(
    req.params.bundleId,
    { $set: { active: false } },
    { returnDocument: 'after' },
  );
  if (!bundle) {
    throw new ApiError({ statusCode: 404, code: 'BUNDLE_NOT_FOUND', message: 'Bundle not found.' });
  }
  return sendSuccess(res, { archived: true });
}

export async function listAdminProducts(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const pageSize = 20;
  const filter = {};
  if (req.query.active === 'true') filter.active = true;
  if (req.query.active === 'false') filter.active = false;
  const [products, totalItems] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    Product.countDocuments(filter),
  ]);
  return sendSuccess(res, {
    products: products.map(serializeProduct),
    pagination: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) },
  });
}

export async function createAdminProduct(req, res) {
  const payload = toProductPayload(req.body ?? {});
  await validateRelatedProducts(payload.frequentlyBoughtTogether);
  const product = await Product.create(payload);
  return sendSuccess(res, { product: serializeProduct(product) }, 201);
}

export async function updateAdminProduct(req, res) {
  if (!mongoose.isValidObjectId(req.params.productId)) {
    throw new ApiError({ statusCode: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' });
  }
  const product = await Product.findById(req.params.productId);
  if (!product) {
    throw new ApiError({ statusCode: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' });
  }
  const payload = toProductPayload(req.body ?? {}, product.toObject());
  await validateRelatedProducts(payload.frequentlyBoughtTogether);
  Object.assign(product, payload);
  await product.save();
  return sendSuccess(res, { product: serializeProduct(product) });
}

export async function archiveAdminProduct(req, res) {
  if (!mongoose.isValidObjectId(req.params.productId)) {
    throw new ApiError({ statusCode: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' });
  }
  const product = await Product.findByIdAndUpdate(req.params.productId, { active: false }, { returnDocument: 'after' });
  if (!product) {
    throw new ApiError({ statusCode: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' });
  }
  return sendSuccess(res, { product: serializeProduct(product) });
}

export async function adjustInventory(req, res) {
  if (!mongoose.isValidObjectId(req.params.productId)) {
    throw new ApiError({ statusCode: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' });
  }
  const quantity = Number(req.body?.quantity);
  const reason = String(req.body?.reason ?? '').trim();
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 1_000_000 || !reason || reason.length > 200) {
    throw badRequest('INVALID_INVENTORY_ADJUSTMENT', 'Provide a non-negative whole stock quantity and reason.');
  }
  const product = await Product.findById(req.params.productId);
  if (!product) {
    throw new ApiError({ statusCode: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' });
  }
  const previousStock = product.stock;
  product.stock = quantity;
  await product.save();
  await InventoryMovement.create({
    product: product._id,
    admin: req.user._id,
    previousStock,
    nextStock: quantity,
    reason,
  });
  return sendSuccess(res, { product: serializeProduct(product) });
}

export async function listInventoryMovements(req, res) {
  const filter = {};
  if (req.params.productId) {
    if (!mongoose.isValidObjectId(req.params.productId)) {
      throw new ApiError({ statusCode: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' });
    }
    filter.product = req.params.productId;
  }
  const movements = await InventoryMovement.find(filter)
    .populate('product', 'name slug')
    .populate('admin', 'name email')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  return sendSuccess(res, { movements });
}

export async function updateAdminOrderStatus(req, res) {
  if (!mongoose.isValidObjectId(req.params.orderId)) {
    throw new ApiError({ statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found.' });
  }
  const nextStatus = String(req.body?.status ?? '');
  const order = await Order.findById(req.params.orderId);
  if (!order) {
    throw new ApiError({ statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found.' });
  }
  if (!(orderTransitions[order.status] ?? []).includes(nextStatus)) {
    throw new ApiError({
      statusCode: 409,
      code: 'INVALID_ORDER_TRANSITION',
      message: `Cannot transition order from ${order.status} to ${nextStatus}.`,
    });
  }
  if (nextStatus === 'CANCELLED' && order.paymentStatus === 'PAID') {
    throw new ApiError({
      statusCode: 409,
      code: 'REFUND_REQUIRED',
      message: 'Paid orders must be refunded through the payment provider before cancellation.',
    });
  }
  order.status = nextStatus;
  order.statusHistory.push({
    status: nextStatus,
    note: String(req.body?.note ?? `Order status updated to ${nextStatus}.`).slice(0, 500),
  });
  await order.save();
  return sendSuccess(res, { order: { id: order._id.toString(), orderNumber: order.orderNumber, status: order.status, statusHistory: order.statusHistory } });
}

export async function listAdminOrders(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const pageSize = 20;
  const filter = {};
  const allowedStatuses = new Set(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'PAYMENT_FAILED', 'REFUNDED']);
  const allowedPaymentStatuses = new Set(['PENDING', 'PAID', 'FAILED', 'REFUNDED']);
  if (req.query.status) {
    const status = String(req.query.status);
    if (!allowedStatuses.has(status)) throw badRequest('INVALID_ORDER_FILTER', 'Order status filter is invalid.');
    filter.status = status;
  }
  if (req.query.paymentStatus) {
    const paymentStatus = String(req.query.paymentStatus);
    if (!allowedPaymentStatuses.has(paymentStatus)) throw badRequest('INVALID_ORDER_FILTER', 'Payment status filter is invalid.');
    filter.paymentStatus = paymentStatus;
  }
  const [orders, totalItems] = await Promise.all([
    Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    Order.countDocuments(filter),
  ]);
  return sendSuccess(res, {
    orders,
    pagination: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) },
  });
}

export async function listCustomerOrdersForAdmin(req, res) {
  if (!mongoose.isValidObjectId(req.params.customerId)) {
    throw new ApiError({ statusCode: 404, code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found.' });
  }
  const customer = await User.findOne({ _id: req.params.customerId, role: 'customer' }).select('_id');
  if (!customer) {
    throw new ApiError({ statusCode: 404, code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found.' });
  }
  const orders = await Order.find({ user: customer._id })
    .select('orderNumber status paymentStatus total currency createdAt')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  return sendSuccess(res, { orders });
}

export async function listAdminCustomers(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const pageSize = 20;
  const filter = { role: 'customer' };
  if (req.query.q) {
    const term = String(req.query.q).trim().slice(0, 100);
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [{ name: new RegExp(escaped, 'i') }, { email: new RegExp(escaped, 'i') }];
  }
  const [customers, totalItems] = await Promise.all([
    User.find(filter).select('name email role disabledAt createdAt').sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    User.countDocuments(filter),
  ]);
  return sendSuccess(res, {
    customers,
    pagination: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) },
  });
}

export async function setCustomerDisabled(req, res) {
  if (!mongoose.isValidObjectId(req.params.customerId)) {
    throw new ApiError({ statusCode: 404, code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found.' });
  }
  if (typeof req.body?.disabled !== 'boolean') {
    throw badRequest('INVALID_CUSTOMER_STATE', 'disabled must be a boolean.');
  }
  const customer = await User.findOneAndUpdate(
    { _id: req.params.customerId, role: 'customer' },
    { $set: { disabledAt: req.body.disabled ? new Date() : null } },
    { returnDocument: 'after', projection: 'name email disabledAt' },
  );
  if (!customer) {
    throw new ApiError({ statusCode: 404, code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found.' });
  }
  return sendSuccess(res, { customer });
}

export async function listAdminCoupons(_req, res) {
  const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
  return sendSuccess(res, { coupons });
}

export async function createAdminCoupon(req, res) {
  const code = String(req.body?.code ?? '').trim().toUpperCase();
  const discountPercent = Number(req.body?.discountPercent);
  const minimumSubtotal = Number(req.body?.minimumSubtotal ?? 0);
  const expiresAt = req.body?.expiresAt ? new Date(req.body.expiresAt) : undefined;
  const maximumRedemptions = req.body?.maximumRedemptions === undefined
    ? undefined
    : Number(req.body.maximumRedemptions);
  if (
    !/^[A-Z0-9_-]{3,40}$/.test(code) ||
    !Number.isFinite(discountPercent) ||
    discountPercent <= 0 ||
    discountPercent > 100 ||
    !Number.isFinite(minimumSubtotal) ||
    minimumSubtotal < 0 ||
    (expiresAt && Number.isNaN(expiresAt.getTime())) ||
    (maximumRedemptions !== undefined && (!Number.isInteger(maximumRedemptions) || maximumRedemptions < 1))
  ) {
    throw badRequest('INVALID_COUPON', 'Coupon fields are invalid.');
  }
  const coupon = await Coupon.create({ code, discountPercent, minimumSubtotal, expiresAt, maximumRedemptions });
  return sendSuccess(res, { coupon }, 201);
}

export async function updateAdminCoupon(req, res) {
  if (!mongoose.isValidObjectId(req.params.couponId)) {
    throw new ApiError({ statusCode: 404, code: 'COUPON_NOT_FOUND', message: 'Coupon not found.' });
  }
  const coupon = await Coupon.findById(req.params.couponId);
  if (!coupon) {
    throw new ApiError({ statusCode: 404, code: 'COUPON_NOT_FOUND', message: 'Coupon not found.' });
  }
  if (req.body?.active !== undefined) {
    if (typeof req.body.active !== 'boolean') throw badRequest('INVALID_COUPON', 'active must be a boolean.');
    coupon.active = req.body.active;
  }
  if (req.body?.expiresAt !== undefined) {
    const expiresAt = new Date(req.body.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) throw badRequest('INVALID_COUPON', 'expiresAt is invalid.');
    coupon.expiresAt = expiresAt;
  }
  await coupon.save();
  return sendSuccess(res, { coupon });
}

async function listTaxonomy(Model, _req, res) {
  const entries = await Model.find({ active: true }).sort({ name: 1 }).lean();
  return sendSuccess(res, { entries });
}

async function createTaxonomy(Model, req, res, kind) {
  const name = String(req.body?.name ?? '').trim();
  const slug = String(req.body?.slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  const description = String(req.body?.description ?? '').trim();
  if (!name || name.length > 100 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw badRequest(`INVALID_${kind.toUpperCase()}`, `${kind} name and slug are required.`);
  }
  const fields = { name, slug, description };
  if (kind === 'ingredient') {
    fields.benefits = Array.isArray(req.body?.benefits) ? req.body.benefits : [];
    if (!description) throw badRequest('INVALID_INGREDIENT', 'Ingredient description is required.');
  }
  const entry = await Model.create(fields);
  return sendSuccess(res, { entry }, 201);
}

async function archiveTaxonomy(Model, req, res, kind) {
  if (!mongoose.isValidObjectId(req.params.entryId)) {
    throw new ApiError({ statusCode: 404, code: `${kind.toUpperCase()}_NOT_FOUND`, message: `${kind} not found.` });
  }
  const entry = await Model.findByIdAndUpdate(req.params.entryId, { active: false }, { returnDocument: 'after' });
  if (!entry) {
    throw new ApiError({ statusCode: 404, code: `${kind.toUpperCase()}_NOT_FOUND`, message: `${kind} not found.` });
  }
  return sendSuccess(res, { entry });
}

export const listAdminCategories = (req, res) => listTaxonomy(Category, req, res);
export const createAdminCategory = (req, res) => createTaxonomy(Category, req, res, 'category');
export const archiveAdminCategory = (req, res) => archiveTaxonomy(Category, req, res, 'category');
export const listAdminIngredients = (req, res) => listTaxonomy(Ingredient, req, res);
export const createAdminIngredient = (req, res) => createTaxonomy(Ingredient, req, res, 'ingredient');
export const archiveAdminIngredient = (req, res) => archiveTaxonomy(Ingredient, req, res, 'ingredient');

export async function createAdminRoutine(req, res) {
  const name = String(req.body?.name ?? '').trim();
  const slug = String(req.body?.slug ?? '').trim().toLowerCase();
  const description = String(req.body?.description ?? '').trim();
  const steps = req.body?.steps;
  if (!name || !slug || !description || !Array.isArray(steps) || steps.length < 1 || steps.length > 12) {
    throw badRequest('INVALID_ROUTINE', 'Provide a name, slug, description and 1–12 routine steps.');
  }
  for (const step of steps) {
    if (!step.title || typeof step.title !== 'string' || step.title.length > 120 || typeof (step.description ?? '') !== 'string') {
      throw badRequest('INVALID_ROUTINE', 'Each routine step requires a title.');
    }
  }
  const productSlugs = steps.map((step) => step.productSlug).filter(Boolean);
  if (productSlugs.length) {
    const linkedProducts = await Product.countDocuments({ slug: { $in: productSlugs }, active: true });
    if (linkedProducts !== new Set(productSlugs).size) {
      throw badRequest('INVALID_ROUTINE_PRODUCTS', 'Routine product slugs must identify active products.');
    }
  }
  const routine = await Routine.create({ name, slug, description, steps });
  return sendSuccess(res, { routine }, 201);
}

export async function archiveAdminRoutine(req, res) {
  return archiveTaxonomy(Routine, req, res, 'routine');
}

export async function createAdminArticle(req, res) {
  const title = String(req.body?.title ?? '').trim();
  const slug = String(req.body?.slug ?? '').trim().toLowerCase();
  const excerpt = String(req.body?.excerpt ?? '').trim();
  const body = String(req.body?.body ?? '').trim();
  if (!title || !slug || !excerpt || !body) {
    throw badRequest('INVALID_ARTICLE', 'Title, slug, excerpt, and article body are required.');
  }
  const article = await JournalArticle.create({ title, slug, excerpt, body });
  return sendSuccess(res, { article }, 201);
}

export async function archiveAdminArticle(req, res) {
  return archiveTaxonomy(JournalArticle, req, res, 'article');
}
