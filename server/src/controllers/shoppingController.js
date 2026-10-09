import mongoose from 'mongoose';
import { Product } from '../models/productModel.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/sendSuccess.js';

function parseProductId(value) {
  if (!mongoose.isValidObjectId(value)) {
    throw new ApiError({
      statusCode: 400,
      code: 'INVALID_PRODUCT_ID',
      message: 'A valid product id is required.',
    });
  }
  return value;
}

function parseQuantity(value) {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new ApiError({
      statusCode: 400,
      code: 'INVALID_QUANTITY',
      message: 'Quantity must be a whole number between 1 and 99.',
    });
  }
  return quantity;
}

function serializeProduct(product) {
  if (!product) return null;
  return {
    id: product._id.toString(),
    name: product.name,
    slug: product.slug,
    category: product.category,
    price: product.price,
    compareAt: product.compareAt,
    accent: product.accent,
    stock: product.stock,
    active: product.active,
    images: product.images ?? [],
  };
}

export async function addBundleToCart(req, res) {
  const productIds = req.body?.productIds;
  if (
    !Array.isArray(productIds) ||
    productIds.length < 2 ||
    productIds.length > 8 ||
    productIds.some((productId) => !mongoose.isValidObjectId(productId)) ||
    new Set(productIds.map(String)).size !== productIds.length
  ) {
    throw new ApiError({
      statusCode: 400,
      code: 'INVALID_BUNDLE',
      message: 'Choose two to eight unique bundle products.',
    });
  }
  const products = await Product.find({ _id: { $in: productIds }, active: true });
  if (products.length !== productIds.length) {
    throw new ApiError({
      statusCode: 404,
      code: 'BUNDLE_PRODUCTS_UNAVAILABLE',
      message: 'One or more products in this bundle are no longer available.',
    });
  }
  for (const product of products) {
    const existing = req.user.cart.find((item) => item.product.toString() === product._id.toString());
    if (product.stock < (existing?.quantity ?? 0) + 1) {
      throw new ApiError({
        statusCode: 409,
        code: 'INSUFFICIENT_STOCK',
        message: `There is not enough stock for ${product.name}.`,
        details: { productId: product._id.toString(), available: product.stock },
      });
    }
  }
  for (const product of products) {
    const existing = req.user.cart.find((item) => item.product.toString() === product._id.toString());
    if (existing) existing.quantity += 1;
    else req.user.cart.push({ product: product._id, quantity: 1 });
  }
  await req.user.save();
  await req.user.populate('cart.product');
  return sendSuccess(res, { cart: serializeCart(req.user) }, 201);
}

function serializeCart(user) {
  const items = user.cart.map((item) => {
    const product = serializeProduct(item.product);
    return {
      product,
      quantity: item.quantity,
      lineTotal: product?.active ? product.price * item.quantity : 0,
      available: Boolean(product?.active && product.stock >= item.quantity),
    };
  });
  return {
    items,
    subtotal: items.reduce((total, item) => total + item.lineTotal, 0),
  };
}

export async function getCart(req, res) {
  await req.user.populate('cart.product');
  return sendSuccess(res, { cart: serializeCart(req.user) });
}

export async function addCartItem(req, res) {
  const productId = parseProductId(req.body?.productId);
  const quantity = parseQuantity(req.body?.quantity ?? 1);
  const product = await Product.findOne({ _id: productId, active: true });
  if (!product) {
    throw new ApiError({
      statusCode: 404,
      code: 'PRODUCT_NOT_FOUND',
      message: 'The requested product is not available.',
    });
  }

  const item = req.user.cart.find((entry) => entry.product.toString() === productId);
  const nextQuantity = (item?.quantity ?? 0) + quantity;
  if (product.stock < nextQuantity) {
    throw new ApiError({
      statusCode: 409,
      code: 'INSUFFICIENT_STOCK',
      message: 'The requested quantity exceeds available stock.',
      details: { available: product.stock },
    });
  }
  if (item) item.quantity = nextQuantity;
  else req.user.cart.push({ product: product._id, quantity });

  await req.user.save();
  await req.user.populate('cart.product');
  return sendSuccess(res, { cart: serializeCart(req.user) }, 201);
}

export async function updateCartItem(req, res) {
  const productId = parseProductId(req.params.productId);
  const quantity = parseQuantity(req.body?.quantity);
  const item = req.user.cart.find((entry) => entry.product.toString() === productId);
  if (!item) {
    throw new ApiError({
      statusCode: 404,
      code: 'CART_ITEM_NOT_FOUND',
      message: 'The item is not in your cart.',
    });
  }

  const product = await Product.findOne({ _id: productId, active: true });
  if (!product || product.stock < quantity) {
    throw new ApiError({
      statusCode: 409,
      code: 'INSUFFICIENT_STOCK',
      message: 'The requested quantity is not available.',
      details: { available: product?.stock ?? 0 },
    });
  }
  item.quantity = quantity;
  await req.user.save();
  await req.user.populate('cart.product');
  return sendSuccess(res, { cart: serializeCart(req.user) });
}

export async function removeCartItem(req, res) {
  const productId = parseProductId(req.params.productId);
  req.user.cart = req.user.cart.filter((item) => item.product.toString() !== productId);
  await req.user.save();
  await req.user.populate('cart.product');
  return sendSuccess(res, { cart: serializeCart(req.user) });
}

export async function getWishlist(req, res) {
  await req.user.populate('wishlist');
  const products = req.user.wishlist
    .filter((product) => product?.active)
    .map(serializeProduct);
  return sendSuccess(res, { products });
}

export async function addWishlistItem(req, res) {
  const productId = parseProductId(req.body?.productId);
  const product = await Product.findOne({ _id: productId, active: true });
  if (!product) {
    throw new ApiError({
      statusCode: 404,
      code: 'PRODUCT_NOT_FOUND',
      message: 'The requested product is not available.',
    });
  }

  if (!req.user.wishlist.some((savedProduct) => savedProduct.toString() === productId)) {
    req.user.wishlist.push(product._id);
    await req.user.save();
  }
  await req.user.populate('wishlist');
  return sendSuccess(res, {
    products: req.user.wishlist.filter((saved) => saved?.active).map(serializeProduct),
  }, 201);
}

export async function removeWishlistItem(req, res) {
  const productId = parseProductId(req.params.productId);
  req.user.wishlist = req.user.wishlist.filter(
    (savedProduct) => savedProduct.toString() !== productId,
  );
  await req.user.save();
  await req.user.populate('wishlist');
  return sendSuccess(res, {
    products: req.user.wishlist.filter((saved) => saved?.active).map(serializeProduct),
  });
}
