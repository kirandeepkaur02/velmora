import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 5,
    fieldNameSize: 20,
  },
  fileFilter(_req, file, callback) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      callback(new ApiError({
        statusCode: 400,
        code: 'UNSUPPORTED_IMAGE_TYPE',
        message: 'Upload a JPEG, PNG, or WebP image.',
      }));
      return;
    }
    callback(null, true);
  },
}).single('image');

export function parseProductImage(req, res, next) {
  upload(req, res, (error) => {
    if (!error) {
      next();
      return;
    }
    if (error instanceof multer.MulterError) {
      const tooLarge = error.code === 'LIMIT_FILE_SIZE';
      next(new ApiError({
        statusCode: tooLarge ? 413 : 400,
        code: tooLarge ? 'IMAGE_TOO_LARGE' : 'INVALID_IMAGE_UPLOAD',
        message: tooLarge
          ? 'Image files must be 5 MB or smaller.'
          : 'The image upload is invalid.',
      }));
      return;
    }
    next(error);
  });
}
