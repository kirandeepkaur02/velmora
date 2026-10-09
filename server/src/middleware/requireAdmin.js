import { ApiError } from '../utils/ApiError.js';

export function requireAdmin(req, _res, next) {
  if (!req.user || req.user.role !== 'admin') {
    throw new ApiError({
      statusCode: 403,
      code: 'ADMIN_REQUIRED',
      message: 'Administrator access is required.',
    });
  }
  next();
}
