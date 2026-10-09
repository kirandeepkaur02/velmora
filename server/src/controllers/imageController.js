import { storeProductImage } from '../services/imageStorageService.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/sendSuccess.js';

export async function uploadProductImage(req, res) {
  if (!req.file) {
    throw new ApiError({
      statusCode: 400,
      code: 'IMAGE_REQUIRED',
      message: 'Choose an image file to upload.',
    });
  }

  const image = await storeProductImage(req.file);
  return sendSuccess(res, { image }, 201);
}
