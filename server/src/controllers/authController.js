import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { User } from '../models/userModel.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/sendSuccess.js';
import { signToken } from '../middleware/authMiddleware.js';

function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase();
}

export async function registerUser(req, res) {
  const name = String(req.body?.name ?? '').trim();
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password ?? '');

  if (!name || !email || !password) {
    throw new ApiError({
      statusCode: 400,
      code: 'INVALID_INPUT',
      message: 'Name, email, and password are required.',
    });
  }

  if (password.length < 8) {
    throw new ApiError({
      statusCode: 400,
      code: 'WEAK_PASSWORD',
      message: 'Password must be at least 8 characters long.',
    });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError({
      statusCode: 409,
      code: 'USER_EXISTS',
      message: 'An account with this email already exists.',
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    passwordHash,
  });

  const token = signToken(user);

  return sendSuccess(
    res,
    {
      user: user.toPublicJSON(),
      token,
    },
    201,
  );
}

export async function loginUser(req, res) {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password ?? '');

  if (!email || !password) {
    throw new ApiError({
      statusCode: 400,
      code: 'INVALID_INPUT',
      message: 'Email and password are required.',
    });
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'The provided email or password is incorrect.',
    });
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    throw new ApiError({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'The provided email or password is incorrect.',
    });
  }

  const token = signToken(user);

  return sendSuccess(res, {
    user: user.toPublicJSON(),
    token,
  });
}

export async function getCurrentUser(req, res) {
  return sendSuccess(res, {
    user: req.user.toPublicJSON(),
  });
}

export async function logoutUser(_req, res) {
  return sendSuccess(res, {
    message: 'Logout successful.',
  });
}

export function getAuthConfig() {
  return {
    jwtSecret: env.JWT_SECRET,
    expiresIn: '7d',
  };
}
