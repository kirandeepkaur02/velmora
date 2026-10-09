import { createPendingOrder, getCheckoutQuote } from '../services/checkoutService.js';
import { sendSuccess } from '../utils/sendSuccess.js';

export async function checkoutQuote(req, res) {
  const quote = await getCheckoutQuote(req.user, req.body ?? {});
  return sendSuccess(res, { quote });
}

export async function createCheckoutOrder(req, res) {
  const order = await createPendingOrder(req.user, req.body ?? {});
  return sendSuccess(res, { order }, 201);
}
