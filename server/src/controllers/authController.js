import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { env } from '../config/env.js';
import { Session } from '../models/sessionModel.js';
import { User } from '../models/userModel.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/sendSuccess.js';
import { signToken } from '../middleware/authMiddleware.js';
import { assertEmailConfigured, sendPasswordResetEmail } from '../services/emailService.js';

const refreshCookieName = 'velmora_refresh';
const refreshLifetimeMs = 30 * 24 * 60 * 60 * 1000;

function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase();
}

function hashRefreshToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function hashPasswordResetToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function readRefreshCookie(req) {
  const cookieHeader = req.headers.cookie ?? '';
  const cookie = cookieHeader
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${refreshCookieName}=`));
  return cookie?.slice(refreshCookieName.length + 1);
}

function writeRefreshCookie(res, token) {
  const secure = env.isProduction ? '; Secure' : '';
  res.append(
    'Set-Cookie',
    `${refreshCookieName}=${token}; HttpOnly; SameSite=Strict; Path=/api/v1/auth; Max-Age=${Math.floor(refreshLifetimeMs / 1000)}${secure}`,
  );
}

function clearRefreshCookie(res) {
  const secure = env.isProduction ? '; Secure' : '';
  res.append(
    'Set-Cookie',
    `${refreshCookieName}=; HttpOnly; SameSite=Strict; Path=/api/v1/auth; Max-Age=0${secure}`,
  );
}

async function issueSession(user, res) {
  const refreshToken = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + refreshLifetimeMs);
  await Session.create({
    user: user._id,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt,
  });
  writeRefreshCookie(res, refreshToken);
  return signToken(user);
}

export async function registerUser(req, res) {
  const name = String(req.body?.name ?? '').trim();
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password ?? '');

  if (!name || name.length > 100 || !email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
    throw new ApiError({
      statusCode: 400,
      code: 'INVALID_INPUT',
      message: 'Name, email, and password are required.',
    });
  }

  if (password.length < 8 || password.length > 128) {
    throw new ApiError({
      statusCode: 400,
      code: 'WEAK_PASSWORD',
      message: 'Password must be between 8 and 128 characters long.',
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

  const token = await issueSession(user, res);

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

  const token = await issueSession(user, res);

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

export async function logoutUser(req, res) {
  const refreshToken = readRefreshCookie(req);
  if (refreshToken) {
    await Session.deleteOne({ tokenHash: hashRefreshToken(refreshToken) });
  }
  clearRefreshCookie(res);
  return sendSuccess(res, {
    message: 'Logout successful.',
  });
}

export async function refreshSession(req, res) {
  const refreshToken = readRefreshCookie(req);
  if (!refreshToken) {
    throw new ApiError({
      statusCode: 401,
      code: 'INVALID_SESSION',
      message: 'A valid refresh session is required.',
    });
  }

  const session = await Session.findOne({
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: { $gt: new Date() },
  }).populate('user');

  if (!session?.user) {
    clearRefreshCookie(res);
    throw new ApiError({
      statusCode: 401,
      code: 'INVALID_SESSION',
      message: 'The refresh session is invalid or expired.',
    });
  }

  const nextRefreshToken = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + refreshLifetimeMs);
  session.tokenHash = hashRefreshToken(nextRefreshToken);
  session.expiresAt = expiresAt;
  await session.save();
  writeRefreshCookie(res, nextRefreshToken);

  return sendSuccess(res, {
    user: session.user.toPublicJSON(),
    token: signToken(session.user),
  });
}

export async function requestPasswordReset(req, res) {
  const email = normalizeEmail(req.body?.email);
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError({
      statusCode: 400,
      code: 'INVALID_EMAIL',
      message: 'Please provide a valid email address.',
    });
  }

  assertEmailConfigured();
  const user = await User.findOne({ email });
  if (user) {
    const resetToken = randomBytes(32).toString('hex');
    user.passwordResetTokenHash = hashPasswordResetToken(resetToken);
    user.passwordResetExpiresAt = new Date(Date.now() + 20 * 60 * 1000);
    await user.save();
    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (error) {
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpiresAt = undefined;
      await user.save();
      throw error;
    }
  }

  return sendSuccess(res, {
    message: 'If an account exists for that email, password reset instructions will be sent.',
  });
}

export async function resetPassword(req, res) {
  const token = String(req.body?.token ?? '');
  const password = String(req.body?.password ?? '');
  if (token.length !== 64 || password.length < 8 || password.length > 128) {
    throw new ApiError({
      statusCode: 400,
      code: 'INVALID_RESET_REQUEST',
      message: 'A valid reset token and a password between 8 and 128 characters are required.',
    });
  }

  const user = await User.findOne({
    passwordResetTokenHash: hashPasswordResetToken(token),
    passwordResetExpiresAt: { $gt: new Date() },
  }).select('+passwordResetTokenHash +passwordResetExpiresAt');
  if (!user) {
    throw new ApiError({
      statusCode: 400,
      code: 'INVALID_RESET_TOKEN',
      message: 'The password reset link is invalid or expired.',
    });
  }

  user.passwordHash = await bcrypt.hash(password, 10);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();
  await Session.deleteMany({ user: user._id });

  return sendSuccess(res, { message: 'Password reset successfully. Please sign in again.' });
}

export function getAuthConfig() {
  return {
    jwtSecret: env.JWT_SECRET,
    expiresIn: '15m',
  };
}
