import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/userModel.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export function signToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    env.JWT_SECRET,
    { expiresIn: '7d' },
  );
}

export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new ApiError({
      statusCode: 401,
      code: 'UNAUTHORIZED',
      message: 'Authentication token is required.',
    });
  }

  const token = header.replace('Bearer ', '').trim();

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new ApiError({
      statusCode: 401,
      code: 'INVALID_TOKEN',
      message: 'The provided token is invalid or expired.',
    });
  }

  const user = await User.findById(decoded.sub).select('-passwordHash');

  if (!user) {
    throw new ApiError({
      statusCode: 401,
      code: 'USER_NOT_FOUND',
      message: 'The authenticated user no longer exists.',
    });
  }

  req.user = user;
  next();
});
