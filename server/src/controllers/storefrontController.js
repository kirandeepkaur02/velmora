import { ContactMessage } from '../models/contactMessageModel.js';
import { NewsletterSubscriber } from '../models/newsletterSubscriberModel.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/sendSuccess.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createContactMessage(req, res) {
  const name = String(req.body?.name ?? '').trim();
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const subject = String(req.body?.subject ?? '').trim();
  const message = String(req.body?.message ?? '').trim();

  if (!name || name.length > 100 || !emailPattern.test(email) || !subject || subject.length > 150 || !message || message.length > 5000) {
    throw new ApiError({
      statusCode: 400,
      code: 'INVALID_CONTACT_MESSAGE',
      message: 'Please provide a valid name, email, subject, and message.',
    });
  }

  const contactMessage = await ContactMessage.create({ name, email, subject, message });
  return sendSuccess(res, { id: contactMessage._id.toString() }, 201);
}

export async function subscribeToNewsletter(req, res) {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  if (!emailPattern.test(email) || email.length > 254) {
    throw new ApiError({
      statusCode: 400,
      code: 'INVALID_EMAIL',
      message: 'Please provide a valid email address.',
    });
  }

  const result = await NewsletterSubscriber.updateOne(
    { email },
    { $setOnInsert: { email } },
    { upsert: true },
  );
  const alreadySubscribed = result.upsertedCount === 0;
  return sendSuccess(
    res,
    { subscribed: true, alreadySubscribed },
    alreadySubscribed ? 200 : 201,
  );
}
