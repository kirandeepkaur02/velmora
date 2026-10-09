import { v2 as cloudinary } from 'cloudinary';
import { fileTypeFromBuffer } from 'file-type';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const supportedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

function storageNotConfigured() {
  throw new ApiError({
    statusCode: 503,
    code: 'IMAGE_STORAGE_NOT_CONFIGURED',
    message: 'Image storage is not configured.',
  });
}

async function storeImage(file, folder) {
  if (!file?.buffer || !file.size) {
    throw new ApiError({
      statusCode: 400,
      code: 'IMAGE_REQUIRED',
      message: 'Choose an image file to upload.',
    });
  }

  const detectedType = await fileTypeFromBuffer(file.buffer);
  if (
    !detectedType ||
    !supportedImageTypes.has(detectedType.mime) ||
    detectedType.mime !== file.mimetype
  ) {
    throw new ApiError({
      statusCode: 400,
      code: 'INVALID_IMAGE_CONTENT',
      message: 'The file content must match a JPEG, PNG, or WebP image.',
    });
  }

  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    storageNotConfigured();
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  let uploaded;
  try {
    uploaded = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({
        folder,
        resource_type: 'image',
        allowed_formats: ['jpg', 'png', 'webp'],
        unique_filename: true,
        use_filename: false,
        overwrite: false,
      }, (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      });
      stream.end(file.buffer);
    });
  } catch {
    throw new ApiError({
      statusCode: 502,
      code: 'IMAGE_STORAGE_FAILED',
      message: 'The image could not be stored. Please try again.',
    });
  }

  let assetUrl;
  try {
    assetUrl = new URL(uploaded?.secure_url);
  } catch {
    assetUrl = null;
  }
  const publicIdPattern = new RegExp(`^${folder.replace('/', '\\/')}\\/[A-Za-z0-9_-]+$`);
  if (
    !uploaded?.public_id?.startsWith(`${folder}/`) ||
    !publicIdPattern.test(uploaded.public_id) ||
    !assetUrl ||
    assetUrl.hostname !== 'res.cloudinary.com' ||
    assetUrl.protocol !== 'https:' ||
    !/^\/[^/]+\/image\/upload\//.test(assetUrl.pathname)
  ) {
    throw new ApiError({
      statusCode: 502,
      code: 'INVALID_IMAGE_STORAGE_RESPONSE',
      message: 'Image storage returned an invalid asset reference.',
    });
  }

  return {
    publicId: uploaded.public_id,
    url: uploaded.secure_url,
  };
}

export function storeProductImage(file) {
  return storeImage(file, 'velmora/products');
}

export function storeReviewImage(file) {
  return storeImage(file, 'velmora/reviews');
}
