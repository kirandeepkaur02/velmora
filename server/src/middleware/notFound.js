import { ApiError } from '../utils/ApiError.js';

export function notFound(req, _res, next) {
  next(
    new ApiError({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} was not found`,
    }),
  );
}
