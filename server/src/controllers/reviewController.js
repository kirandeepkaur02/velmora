import mongoose from 'mongoose';
import { Order } from '../models/orderModel.js';
import { Product } from '../models/productModel.js';
import { Review } from '../models/reviewModel.js';
import { storeReviewImage } from '../services/imageStorageService.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/sendSuccess.js';

function serializeReviewImage(image) {
  return image?.publicId && image?.url
    ? { publicId: image.publicId, url: image.url }
    : null;
}

async function refreshProductRating(productId) {
  const [aggregate] = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId), status: 'APPROVED' } },
    { $group: { _id: '$product', rating: { $avg: '$rating' }, reviews: { $sum: 1 } } },
  ]);
  await Product.updateOne(
    { _id: productId },
    {
      $set: {
        rating: aggregate ? Math.round(aggregate.rating * 10) / 10 : 0,
        reviews: aggregate?.reviews ?? 0,
      },
    },
  );
}

export async function listProductReviews(req, res) {
  if (!mongoose.isValidObjectId(req.params.productId)) {
    throw new ApiError({ statusCode: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' });
  }
  const [reviews, summary] = await Promise.all([
    Review.find({ product: req.params.productId, status: 'APPROVED' })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(req.params.productId), status: 'APPROVED' } },
      { $group: { _id: null, averageRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]),
  ]);
  return sendSuccess(res, {
    reviews: reviews.map((review) => ({
      id: review._id.toString(),
      name: review.user?.name ?? 'Customer',
      rating: review.rating,
      title: review.title,
      body: review.body,
      image: serializeReviewImage(review.image),
      verifiedPurchase: true,
      createdAt: review.createdAt,
    })),
    summary: {
      averageRating: summary[0]?.averageRating ?? 0,
      count: summary[0]?.count ?? 0,
    },
  });
}

export async function getMyProductReview(req, res) {
  if (!mongoose.isValidObjectId(req.params.productId)) {
    throw new ApiError({ statusCode: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' });
  }
  const review = await Review.findOne({ product: req.params.productId, user: req.user._id }).lean();
  return sendSuccess(res, {
    review: review ? {
      id: review._id.toString(),
      orderId: review.order.toString(),
      rating: review.rating,
      title: review.title,
      body: review.body,
      image: serializeReviewImage(review.image),
      status: review.status,
    } : null,
  });
}

export async function createProductReview(req, res) {
  if (!mongoose.isValidObjectId(req.params.productId)) {
    throw new ApiError({ statusCode: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' });
  }
  const rating = Number(req.body?.rating);
  const title = String(req.body?.title ?? '').trim();
  const body = String(req.body?.body ?? '').trim();
  const orderId = String(req.body?.orderId ?? '');
  if (
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5 ||
    !title ||
    title.length > 120 ||
    !body ||
    body.length > 3000 ||
    !mongoose.isValidObjectId(orderId)
  ) {
    throw new ApiError({ statusCode: 400, code: 'INVALID_REVIEW', message: 'Review fields are invalid.' });
  }
  const purchased = await Order.exists({
    _id: orderId,
    user: req.user._id,
    paymentStatus: 'PAID',
    'items.productId': req.params.productId,
  });
  if (!purchased) {
    throw new ApiError({
      statusCode: 403,
      code: 'PURCHASE_REQUIRED',
      message: 'Only customers who purchased this product can review it.',
    });
  }
  const existing = await Review.exists({ product: req.params.productId, user: req.user._id });
  if (existing) {
    throw new ApiError({
      statusCode: 409,
      code: 'REVIEW_EXISTS',
      message: 'You have already reviewed this product.',
    });
  }
  const image = req.file ? await storeReviewImage(req.file) : undefined;
  try {
    const review = await Review.create({
      product: req.params.productId,
      user: req.user._id,
      order: orderId,
      rating,
      title,
      body,
      image,
    });
    return sendSuccess(res, {
      review: { id: review._id.toString(), status: review.status, image: serializeReviewImage(review.image) },
    }, 201);
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError({
        statusCode: 409,
        code: 'REVIEW_EXISTS',
        message: 'You have already reviewed this product.',
      });
    }
    throw error;
  }
}

export async function updateProductReview(req, res) {
  if (!mongoose.isValidObjectId(req.params.reviewId)) {
    throw new ApiError({ statusCode: 404, code: 'REVIEW_NOT_FOUND', message: 'Review not found.' });
  }
  const rating = Number(req.body?.rating);
  const title = String(req.body?.title ?? '').trim();
  const body = String(req.body?.body ?? '').trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !title || title.length > 120 || !body || body.length > 3000) {
    throw new ApiError({ statusCode: 400, code: 'INVALID_REVIEW', message: 'Review fields are invalid.' });
  }
  const review = await Review.findOne({ _id: req.params.reviewId, user: req.user._id });
  if (!review) {
    throw new ApiError({ statusCode: 404, code: 'REVIEW_NOT_FOUND', message: 'Review not found.' });
  }
  if (req.file && (req.body?.removeImage === 'true' || req.body?.removeImage === true)) {
    throw new ApiError({ statusCode: 400, code: 'INVALID_REVIEW_IMAGE', message: 'Choose an image or remove the current image, not both.' });
  }
  if (req.body?.removeImage !== undefined && !['true', 'false', true, false].includes(req.body.removeImage)) {
    throw new ApiError({ statusCode: 400, code: 'INVALID_REVIEW_IMAGE', message: 'The image removal option is invalid.' });
  }
  if (req.file) review.image = await storeReviewImage(req.file);
  else if (req.body?.removeImage === 'true' || req.body?.removeImage === true) review.image = undefined;
  review.rating = rating;
  review.title = title;
  review.body = body;
  review.status = 'PENDING';
  review.moderatedBy = undefined;
  review.moderatedAt = undefined;
  await review.save();
  await refreshProductRating(review.product);
  return sendSuccess(res, {
    review: { id: review._id.toString(), status: review.status, image: serializeReviewImage(review.image) },
  });
}

export async function deleteProductReview(req, res) {
  const review = await Review.findOneAndDelete({ _id: req.params.reviewId, user: req.user._id });
  if (!review) {
    throw new ApiError({ statusCode: 404, code: 'REVIEW_NOT_FOUND', message: 'Review not found.' });
  }
  await refreshProductRating(review.product);
  return sendSuccess(res, { deleted: true });
}

export async function listAdminReviews(req, res) {
  const filter = {};
  if (req.query.status) filter.status = String(req.query.status);
  const reviews = await Review.find(filter)
    .populate('product', 'name slug')
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  return sendSuccess(res, { reviews });
}

export async function moderateReview(req, res) {
  if (!mongoose.isValidObjectId(req.params.reviewId)) {
    throw new ApiError({ statusCode: 404, code: 'REVIEW_NOT_FOUND', message: 'Review not found.' });
  }
  const status = String(req.body?.status ?? '');
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    throw new ApiError({ statusCode: 400, code: 'INVALID_REVIEW_STATUS', message: 'Review status must be APPROVED or REJECTED.' });
  }
  const review = await Review.findById(req.params.reviewId);
  if (!review) {
    throw new ApiError({ statusCode: 404, code: 'REVIEW_NOT_FOUND', message: 'Review not found.' });
  }
  review.status = status;
  review.moderatedBy = req.user._id;
  review.moderatedAt = new Date();
  await review.save();
  await refreshProductRating(review.product);
  return sendSuccess(res, { review: { id: review._id.toString(), status: review.status } });
}
