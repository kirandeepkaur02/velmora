import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export function assertEmailConfigured() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD || !env.SMTP_FROM) {
    throw new ApiError({
      statusCode: 503,
      code: 'EMAIL_NOT_CONFIGURED',
      message: 'Password recovery email is not configured. Contact the site administrator.',
    });
  }
}

export async function sendPasswordResetEmail(email, token) {
  assertEmailConfigured();
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
  });
  const clientOrigin = env.CLIENT_ORIGIN.split(',')[0].trim();
  const resetUrl = new URL('/', clientOrigin);
  resetUrl.searchParams.set('resetToken', token);

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: email,
      subject: 'Reset your Velmora password',
      text: `Use this link to reset your Velmora password. It expires in 20 minutes: ${resetUrl}`,
      html: `<p>Use the link below to reset your Velmora password. It expires in 20 minutes.</p><p><a href="${resetUrl}">Reset password</a></p>`,
    });
  } catch {
    throw new ApiError({
      statusCode: 503,
      code: 'PASSWORD_RESET_EMAIL_FAILED',
      message: 'The password reset email could not be sent. Please try again later.',
    });
  }
}
