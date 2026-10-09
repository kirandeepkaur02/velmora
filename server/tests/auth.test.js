import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import http from 'node:http';
import mongoose from 'mongoose';
import { afterEach, beforeEach, describe, mock, test } from 'node:test';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { Product } from '../src/models/productModel.js';
import { Bundle } from '../src/models/bundleModel.js';
import { ContactMessage } from '../src/models/contactMessageModel.js';
import { NewsletterSubscriber } from '../src/models/newsletterSubscriberModel.js';
import { User } from '../src/models/userModel.js';
import { Coupon } from '../src/models/couponModel.js';
import { Order } from '../src/models/orderModel.js';
import { Review } from '../src/models/reviewModel.js';
import { getStripeClient } from '../src/services/stripePaymentService.js';
import { v2 as cloudinary } from 'cloudinary';
import { apiRateLimit, authRateLimit } from '../src/middleware/rateLimiters.js';

let createApp;
let connectDatabase;
let disconnectDatabase;
let mongod;
let server;
let port;

const request = async (path, options = {}) => {
  const { headers: optionHeaders, ...requestOptions } = options;
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    ...requestOptions,
    headers: {
      ...(requestOptions.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(optionHeaders ?? {}),
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  return {
    status: response.status,
    body,
    headers: response.headers,
  };
};

beforeEach(async () => {
  apiRateLimit.resetKey('127.0.0.1');
  authRateLimit.resetKey('127.0.0.1');
  process.env.JWT_SECRET = 'test-secret';
  process.env.SHIPPING_FLAT_RATE = '9';
  process.env.FREE_SHIPPING_THRESHOLD = '75';
  process.env.TAX_RATE = '0';
  process.env.CURRENCY = 'USD';
  process.env.MONGODB_URI = '';
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = mongod.getUri('velmora');
  process.env.STRIPE_SECRET_KEY = 'sk_test_velmora';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_velmora';
  process.env.CLOUDINARY_CLOUD_NAME = '';
  process.env.CLOUDINARY_API_KEY = '';
  process.env.CLOUDINARY_API_SECRET = '';

  ({ createApp } = await import('../src/app.js'));
  ({ connectDatabase, disconnectDatabase } = await import('../src/config/db.js'));
  await connectDatabase();

  server = http.createServer(createApp());
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  port = address.port;
});

afterEach(async () => {
  if (server) {
    server.closeAllConnections?.();
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  if (disconnectDatabase) {
    await disconnectDatabase();
  }

  if (mongod) {
    await mongod.stop();
  }
});

describe('Phase 3 authentication', () => {
  test('rejects unsafe JSON keys and rate limits authentication requests', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalJwtSecret = process.env.JWT_SECRET;
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'production-test-secret-with-more-than-32-characters';
    let unsafeJson;
    let disallowedOrigin;
    try {
      unsafeJson = await request('/api/v1/auth/login', {
        method: 'POST',
        body: '{"$where":"true"}',
      });
      disallowedOrigin = await request('/api/v1/health', {
        headers: { Origin: 'http://localhost:9999' },
      });
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
      process.env.JWT_SECRET = originalJwtSecret;
    }
    assert.equal(unsafeJson.status, 400);
    assert.equal(unsafeJson.body.error.code, 'INVALID_JSON');
    assert.equal(Object.hasOwn(unsafeJson.body.error, 'stack'), false);
    assert.equal(disallowedOrigin.status, 403);
    assert.equal(disallowedOrigin.body.error.code, 'ORIGIN_NOT_ALLOWED');

    let lastResponse;
    for (let attempt = 0; attempt < 21; attempt += 1) {
      lastResponse = await request('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({}),
      });
    }
    assert.equal(lastResponse.status, 429);
    assert.equal(lastResponse.body.error.code, 'RATE_LIMITED');
  });

  test('API root returns service information', async () => {
    const result = await request('/');

    assert.equal(result.status, 200);
    assert.equal(result.body.success, true);
    assert.equal(result.body.data.service, 'velmora-api');
    assert.equal(result.body.data.apiBase, '/api/v1');
  });

  describe('MongoDB product catalog', () => {
    test('returns product facets from stored catalog data', async () => {
      await Product.create({
        name: 'Oat Cleanser',
        slug: 'oat-cleanser',
        description: 'Gentle daily cleansing.',
        category: 'Cleansers',
        ingredient: 'Oat',
        concern: 'Sensitivity',
        skinType: 'Dry skin',
        price: 30,
        compareAt: 40,
        stock: 5,
        format: '100 ml',
      });

      const result = await request('/api/v1/products/facets');
      assert.equal(result.status, 200);
      assert.deepEqual(result.body.data.categories, ['Cleansers']);
      assert.deepEqual(result.body.data.ingredients, ['Oat']);
    });

    test('lists stored products with server-side filters and pagination', async () => {
      await Product.create(
        Array.from({ length: 5 }, (_, index) => ({
          name: `Oat Product ${index}`,
          slug: `oat-product-${index}`,
          description: 'Gentle daily cleansing.',
          category: index === 0 ? 'Cleansers' : 'Serums',
          ingredient: 'Oat',
          concern: 'Sensitivity',
          skinType: 'Dry skin',
          price: 30 + index,
          compareAt: 40 + index,
          stock: 5,
          format: '100 ml',
        })),
      );

      const result = await request('/api/v1/products?category=Cleansers&page=1');
      assert.equal(result.status, 200);
      assert.equal(result.body.data.products.length, 1);
      assert.equal(result.body.data.products[0].name, 'Oat Product 0');
      assert.equal(result.body.data.pagination.totalItems, 1);
      assert.ok(result.body.data.products[0].id);

      const pageOne = await request('/api/v1/products?page=1');
      const pageTwo = await request('/api/v1/products?page=2');
      assert.equal(pageOne.body.data.products.length, 4);
      assert.equal(pageOne.body.data.pagination.totalPages, 2);
      assert.equal(pageTwo.body.data.products.length, 1);

      const searched = await request('/api/v1/products?q=Product&maxPrice=32&sort=price-high');
      assert.equal(searched.body.data.pagination.totalItems, 3);
      assert.equal(searched.body.data.products[0].price, 32);
    });

    test('returns a product by slug and rejects invalid filter values', async () => {
      const product = await Product.create({
        name: 'Rose Serum',
        slug: 'rose-serum',
        description: 'Hydrating serum.',
        category: 'Serums',
        ingredient: 'Rose',
        concern: 'Glow',
        skinType: 'All skin types',
        price: 50,
        compareAt: 60,
        stock: 3,
        format: '30 ml',
      });

      const detail = await request('/api/v1/products/rose-serum');
      assert.equal(detail.status, 200);
      assert.equal(detail.body.data.product.id, product._id.toString());

      const invalid = await request('/api/v1/products?minRating=6');
      assert.equal(invalid.status, 400);
    });

    test('filters products by skin type and in-stock availability', async () => {
      await Product.create([
        {
          name: 'Available Dry Skin Care',
          slug: 'available-dry-skin-care',
          description: 'A stocked dry-skin product.',
          category: 'Care',
          ingredient: 'Oat',
          concern: 'Dryness',
          skinType: 'Dry skin',
          price: 30,
          compareAt: 35,
          stock: 2,
          format: '50 ml',
        },
        {
          name: 'Sold Out Dry Skin Care',
          slug: 'sold-out-dry-skin-care',
          description: 'A sold-out dry-skin product.',
          category: 'Care',
          ingredient: 'Oat',
          concern: 'Dryness',
          skinType: 'Dry skin',
          price: 30,
          compareAt: 35,
          stock: 0,
          format: '50 ml',
        },
        {
          name: 'Available Sensitive Skin Care',
          slug: 'available-sensitive-skin-care',
          description: 'A stocked sensitive-skin product.',
          category: 'Care',
          ingredient: 'Oat',
          concern: 'Sensitivity',
          skinType: 'Sensitive skin',
          price: 30,
          compareAt: 35,
          stock: 3,
          format: '50 ml',
        },
      ]);
      const filtered = await request('/api/v1/products?skinType=Dry%20skin&inStock=true');
      assert.equal(filtered.status, 200);
      assert.deepEqual(filtered.body.data.products.map((product) => product.slug), ['available-dry-skin-care']);
      const invalid = await request('/api/v1/products?inStock=maybe');
      assert.equal(invalid.status, 400);
    });
  });

  describe('MongoDB storefront submissions', () => {
    test('persists contact messages and newsletter subscriptions', async () => {
      const contact = await request('/api/v1/storefront/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Ava Jordan',
          email: 'AVA@example.com',
          subject: 'Product question',
          message: 'Could you share more about this product?',
        }),
      });
      assert.equal(contact.status, 201);
      assert.ok(contact.body.data.id);
      assert.equal(await ContactMessage.countDocuments(), 1);

      const invalidContact = await request('/api/v1/storefront/contact', {
        method: 'POST',
        body: JSON.stringify({ email: 'invalid', message: 'Missing fields' }),
      });
      assert.equal(invalidContact.status, 400);

      const firstSubscription = await request('/api/v1/storefront/newsletter', {
        method: 'POST',
        body: JSON.stringify({ email: 'Ava@example.com' }),
      });
      const duplicateSubscription = await request('/api/v1/storefront/newsletter', {
        method: 'POST',
        body: JSON.stringify({ email: 'ava@example.com' }),
      });
      assert.equal(firstSubscription.status, 201);
      assert.equal(duplicateSubscription.status, 200);
      assert.equal(duplicateSubscription.body.data.alreadySubscribed, true);
      assert.equal(await NewsletterSubscriber.countDocuments(), 1);
    });
  });

  test('register creates a user and returns a JWT', async () => {
    const result = await request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Ava Jordan',
        email: 'ava@example.com',
        password: 'Velmora123!',
      }),
    });

    assert.equal(result.status, 201);
    assert.equal(result.body.success, true);
    assert.equal(result.body.data.user.email, 'ava@example.com');
    assert.ok(result.body.data.token);
  });

  test('login returns a token for valid credentials', async () => {
    await request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Ava Jordan',
        email: 'ava@example.com',
        password: 'Velmora123!',
      }),
    });

    const result = await request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'ava@example.com',
        password: 'Velmora123!',
      }),
    });

    assert.equal(result.status, 200);
    assert.equal(result.body.success, true);
    assert.ok(result.body.data.token);
  });

  test('protected profile route rejects missing token', async () => {
    const result = await request('/api/v1/auth/me');

    assert.equal(result.status, 401);
    assert.equal(result.body.success, false);
  });

  test('rotates and revokes refresh sessions on refresh and logout', async () => {
    const registration = await request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Ava Jordan',
        email: 'refresh@example.com',
        password: 'Velmora123!',
      }),
    });
    const originalCookie = registration.headers.get('set-cookie').split(';')[0];
    const refreshed = await request('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { Cookie: originalCookie },
    });

    assert.equal(refreshed.status, 200);
    assert.notEqual(refreshed.headers.get('set-cookie').split(';')[0], originalCookie);

    const rotatedCookie = refreshed.headers.get('set-cookie').split(';')[0];
    const logout = await request('/api/v1/auth/logout', {
      method: 'POST',
      headers: { Cookie: rotatedCookie },
    });
    assert.equal(logout.status, 200);

    const replay = await request('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { Cookie: rotatedCookie },
    });
    assert.equal(replay.status, 401);
  });

  test('persists profile and address changes and isolates them by account', async () => {
    const registration = await request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Ava Jordan',
        email: 'account@example.com',
        password: 'Velmora123!',
      }),
    });
    const token = registration.body.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };
    const profile = await request('/api/v1/account/profile', {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Ava Rose', email: 'ava.rose@example.com' }),
    });
    assert.equal(profile.status, 200);
    assert.equal(profile.body.data.user.name, 'Ava Rose');

    const address = await request('/api/v1/account/addresses', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Ava Rose',
        phone: '+1 555 0100',
        addressLine1: '12 Willow Road',
        city: 'Fitzroy',
        state: 'Victoria',
        postalCode: '3065',
        country: 'Australia',
      }),
    });
    assert.equal(address.status, 201);
    assert.equal(address.body.data.address.isDefault, true);

    const otherUser = await request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Leah Rose',
        email: 'other-account@example.com',
        password: 'Velmora123!',
      }),
    });
    const forbiddenAddress = await request(
      `/api/v1/account/addresses/${address.body.data.address.id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${otherUser.body.data.token}` },
      },
    );
    assert.equal(forbiddenAddress.status, 404);
  });

  test('persists cart and wishlist while enforcing server stock and prices', async () => {
    const product = await Product.create({
      name: 'Daily Oat Cleanser',
      slug: 'daily-oat-cleanser',
      description: 'A gentle cleanser.',
      category: 'Cleansers',
      ingredient: 'Oat',
      concern: 'Sensitivity',
      skinType: 'All skin types',
      price: 35,
      compareAt: 45,
      stock: 2,
      format: '100 ml',
    });
    const registration = await request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Ava Jordan',
        email: 'shopping@example.com',
        password: 'Velmora123!',
      }),
    });
    const authHeaders = { Authorization: `Bearer ${registration.body.data.token}` };

    const unauthenticated = await request('/api/v1/cart');
    assert.equal(unauthenticated.status, 401);

    const added = await request('/api/v1/cart/items', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product._id.toString(), quantity: 1, price: 0 }),
    });
    assert.equal(added.status, 201);
    assert.equal(added.body.data.cart.subtotal, 35);

    const exceededStock = await request('/api/v1/cart/items', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product._id.toString(), quantity: 2 }),
    });
    assert.equal(exceededStock.status, 409);

    const saved = await request('/api/v1/wishlist', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product._id.toString() }),
    });
    assert.equal(saved.status, 201);
    assert.equal(saved.body.data.products[0].id, product._id.toString());

    const cart = await request('/api/v1/cart', { headers: authHeaders });
    assert.equal(cart.body.data.cart.items[0].product.price, 35);
    assert.equal(cart.body.data.cart.items[0].quantity, 1);
  });

  test('calculates checkout totals from MongoDB and saves purchase-time snapshots', async () => {
    const product = await Product.create({
      name: 'Hydration Serum',
      slug: 'hydration-serum',
      description: 'A daily hydration serum.',
      category: 'Serums',
      ingredient: 'Aloe',
      concern: 'Hydration',
      skinType: 'All skin types',
      price: 40,
      compareAt: 50,
      stock: 4,
      format: '30 ml',
    });
    await Coupon.create({ code: 'SAVE10', discountPercent: 10, active: true });
    const registration = await request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Ava Jordan',
        email: 'checkout@example.com',
        password: 'Velmora123!',
      }),
    });
    const authHeaders = {
      Authorization: `Bearer ${registration.body.data.token}`,
      'Content-Type': 'application/json',
    };
    const addressResult = await request('/api/v1/account/addresses', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        fullName: 'Ava Jordan',
        phone: '+1 555 0100',
        addressLine1: '12 Willow Road',
        city: 'Fitzroy',
        state: 'Victoria',
        postalCode: '3065',
        country: 'Australia',
      }),
    });
    await request('/api/v1/cart/items', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ productId: product._id.toString(), quantity: 2 }),
    });

    const requestBody = {
      addressId: addressResult.body.data.address.id,
      couponCode: 'save10',
      subtotal: 1,
      discount: 0,
      shipping: 100,
      total: 1,
    };
    const quote = await request('/api/v1/checkout/quote', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(requestBody),
    });
    assert.equal(quote.status, 200);
    assert.deepEqual(
      {
        subtotal: quote.body.data.quote.subtotal,
        discount: quote.body.data.quote.discount,
        shipping: quote.body.data.quote.shipping,
        total: quote.body.data.quote.total,
      },
      { subtotal: 80, discount: 8, shipping: 0, total: 72 },
    );

    const orderResult = await request('/api/v1/checkout/orders', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(requestBody),
    });
    assert.equal(orderResult.status, 201);
    assert.equal(orderResult.body.data.order.total, 72);
    assert.equal(orderResult.body.data.order.status, 'PENDING');
    const order = await Order.findById(orderResult.body.data.order.id).lean();
    assert.equal(order.items[0].unitPrice, 40);
    assert.equal(order.shippingAddress.addressLine1, '12 Willow Road');

    await request(`/api/v1/cart/items/${product._id.toString()}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ quantity: 1 }),
    });
    const flatShippingQuote = await request('/api/v1/checkout/quote', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        addressId: requestBody.addressId,
        couponCode: 'SAVE10',
      }),
    });
    assert.equal(flatShippingQuote.body.data.quote.shipping, 9);
    assert.equal(flatShippingQuote.body.data.quote.total, 45);

    await Coupon.create({
      code: 'EXPIRED',
      discountPercent: 20,
      expiresAt: new Date(Date.now() - 1000),
    });
    const expiredCoupon = await request('/api/v1/checkout/quote', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        addressId: requestBody.addressId,
        couponCode: 'EXPIRED',
      }),
    });
    assert.equal(expiredCoupon.status, 400);

    await Product.updateOne({ _id: product._id }, { $set: { stock: 0 } });
    const staleStock = await request('/api/v1/checkout/quote', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        addressId: requestBody.addressId,
        couponCode: 'SAVE10',
      }),
    });
    assert.equal(staleStock.status, 409);
  });

  test('creates Stripe sessions and verifies webhook payments idempotently', async () => {
    const product = await Product.create({
      name: 'Stripe Test Serum',
      slug: 'stripe-test-serum',
      description: 'A payment integration test product.',
      category: 'Serums',
      ingredient: 'Aloe',
      concern: 'Hydration',
      skinType: 'All skin types',
      price: 45,
      compareAt: 55,
      stock: 4,
      format: '30 ml',
    });
    await Coupon.create({ code: 'PAY10', discountPercent: 10, active: true });
    const registration = await request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Ava Jordan',
        email: 'stripe@example.com',
        password: 'Velmora123!',
      }),
    });
    const authHeaders = {
      Authorization: `Bearer ${registration.body.data.token}`,
      'Content-Type': 'application/json',
    };
    const address = await request('/api/v1/account/addresses', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        fullName: 'Ava Jordan',
        phone: '+1 555 0100',
        addressLine1: '12 Willow Road',
        city: 'Fitzroy',
        state: 'Victoria',
        postalCode: '3065',
        country: 'Australia',
      }),
    });
    await request('/api/v1/cart/items', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ productId: product._id.toString(), quantity: 1 }),
    });
    const orderResponse = await request('/api/v1/checkout/orders', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        addressId: address.body.data.address.id,
        couponCode: 'PAY10',
      }),
    });
    const orderId = orderResponse.body.data.order.id;
    const stripe = getStripeClient();
    let sessionCount = 0;
    const createdSessions = [];
    const createSession = mock.method(
      stripe.checkout.sessions,
      'create',
      async (params, options) => {
        sessionCount += 1;
        createdSessions.push({ params, options });
        return {
          id: `cs_test_${sessionCount}`,
          status: 'open',
          url: `https://checkout.stripe.test/session-${sessionCount}`,
        };
      },
    );
    mock.method(stripe.checkout.sessions, 'retrieve', async () => ({
      id: 'cs_test_1',
      status: 'open',
      url: 'https://checkout.stripe.test/session-1',
    }));

    const paymentSession = await request(`/api/v1/payments/orders/${orderId}/session`, {
      method: 'POST',
      headers: authHeaders,
    });
    assert.equal(paymentSession.status, 200);
    assert.equal(paymentSession.body.data.checkoutUrl, 'https://checkout.stripe.test/session-1');
    assert.equal(createdSessions[0].params.line_items[0].price_data.unit_amount, 4950);
    assert.equal(createdSessions[0].params.metadata.orderId, orderId);
    assert.ok(createdSessions[0].options.idempotencyKey.includes(orderId));
    const repeatedSession = await request(`/api/v1/payments/orders/${orderId}/session`, {
      method: 'POST',
      headers: authHeaders,
    });
    assert.equal(repeatedSession.status, 200);
    assert.equal(createSession.mock.callCount(), 1);

    const paymentEvent = {
      id: 'evt_velmora_paid_1',
      object: 'event',
      api_version: '2025-01-01',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'cs_test_1',
          object: 'checkout.session',
          metadata: { orderId, userId: registration.body.data.user.id },
          payment_status: 'paid',
          amount_total: 4950,
          currency: 'usd',
          payment_intent: 'pi_velmora_test_1',
        },
      },
      livemode: false,
      pending_webhooks: 1,
      type: 'checkout.session.completed',
    };
    const payload = JSON.stringify(paymentEvent);
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: process.env.STRIPE_WEBHOOK_SECRET,
    });
    const invalidSignature = await request('/api/v1/payments/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 'invalid' },
      body: payload,
    });
    assert.equal(invalidSignature.status, 400);

    const webhook = await request('/api/v1/payments/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': signature },
      body: payload,
    });
    assert.equal(webhook.status, 200);
    const duplicateWebhook = await request('/api/v1/payments/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': signature },
      body: payload,
    });
    assert.equal(duplicateWebhook.body.data.duplicate, true);
    const paidOrder = await Order.findById(orderId).lean();
    assert.equal(paidOrder.paymentStatus, 'PAID');
    assert.equal(paidOrder.status, 'CONFIRMED');
    assert.equal(await Product.findById(product._id).then((saved) => saved.stock), 3);
    assert.equal((await Coupon.findOne({ code: 'PAY10' })).redemptionCount, 1);
    const clearedCart = await request('/api/v1/cart', { headers: authHeaders });
    assert.equal(clearedCart.body.data.cart.items.length, 0);

    await request('/api/v1/cart/items', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ productId: product._id.toString(), quantity: 1 }),
    });
    const failedOrderResponse = await request('/api/v1/checkout/orders', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ addressId: address.body.data.address.id }),
    });
    const failedOrderId = failedOrderResponse.body.data.order.id;
    const failedSession = await request(`/api/v1/payments/orders/${failedOrderId}/session`, {
      method: 'POST',
      headers: authHeaders,
    });
    assert.equal(
      failedSession.status,
      200,
      `${JSON.stringify(failedSession.body)} sessions=${JSON.stringify(createdSessions.map((entry) => ({
        orderId: entry.params.metadata.orderId,
        amount: entry.params.line_items[0].price_data.unit_amount,
        idempotencyKey: entry.options.idempotencyKey,
      })))}`,
    );
    assert.equal(createdSessions[1].params.line_items[0].price_data.unit_amount, 5400);
    const failureEvent = {
      ...paymentEvent,
      id: 'evt_velmora_failed_1',
      type: 'checkout.session.async_payment_failed',
      data: {
        object: {
          ...paymentEvent.data.object,
          id: 'cs_test_2',
          metadata: { orderId: failedOrderId },
          payment_status: 'unpaid',
        },
      },
    };
    const failurePayload = JSON.stringify(failureEvent);
    const failureSignature = stripe.webhooks.generateTestHeaderString({
      payload: failurePayload,
      secret: process.env.STRIPE_WEBHOOK_SECRET,
    });
    const failedWebhook = await request('/api/v1/payments/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': failureSignature },
      body: failurePayload,
    });
    assert.equal(failedWebhook.status, 200);
    const failedOrder = await Order.findById(failedOrderId).lean();
    assert.equal(failedOrder.paymentStatus, 'FAILED');
    assert.equal(failedOrder.status, 'PAYMENT_FAILED');
    const retrySession = await request(`/api/v1/payments/orders/${failedOrderId}/session`, {
      method: 'POST',
      headers: authHeaders,
    });
    assert.equal(retrySession.status, 200, JSON.stringify(retrySession.body));
    assert.equal(retrySession.body.data.checkoutUrl, 'https://checkout.stripe.test/session-3');
    const retriedOrder = await Order.findById(failedOrderId).lean();
    assert.equal(retriedOrder.paymentStatus, 'PENDING');
    assert.equal(retriedOrder.status, 'PENDING');
    assert.ok(retriedOrder.statusHistory.some((entry) => entry.note.includes('new Stripe payment attempt')));
    assert.notEqual(createdSessions[1].options.idempotencyKey, createdSessions[2].options.idempotencyKey);
  });

  test('limits order history and order details to their owner', async () => {
    const owner = await request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Order Owner',
        email: 'order-owner@example.com',
        password: 'Velmora123!',
      }),
    });
    const other = await request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Other Customer',
        email: 'order-other@example.com',
        password: 'Velmora123!',
      }),
    });
    const order = await Order.create({
      orderNumber: 'VM-OWNER-TEST',
      user: owner.body.data.user.id,
      items: [{
        productId: new mongoose.Types.ObjectId(),
        slug: 'snapshot-product',
        name: 'Snapshot Product',
        quantity: 2,
        unitPrice: 25,
      }],
      shippingAddress: {
        fullName: 'Order Owner',
        phone: '+1 555 0100',
        addressLine1: '12 Willow Road',
        city: 'Fitzroy',
        state: 'Victoria',
        postalCode: '3065',
        country: 'Australia',
      },
      subtotal: 50,
      discount: 0,
      shipping: 9,
      tax: 0,
      total: 59,
      currency: 'USD',
    });
    const ownerOrders = await request('/api/v1/orders', {
      headers: { Authorization: `Bearer ${owner.body.data.token}` },
    });
    const otherOrders = await request('/api/v1/orders', {
      headers: { Authorization: `Bearer ${other.body.data.token}` },
    });
    assert.equal(ownerOrders.body.data.orders.length, 1);
    assert.equal(ownerOrders.body.data.orders[0].items[0].unitPrice, 25);
    assert.equal(otherOrders.body.data.orders.length, 0);

    const unauthorizedDetail = await request(`/api/v1/orders/${order._id}`, {
      headers: { Authorization: `Bearer ${other.body.data.token}` },
    });
    assert.equal(unauthorizedDetail.status, 404);
  });

  test('enforces admin authorization for catalog, inventory, customer, and order management', async () => {
    const customer = await request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Admin Test Customer',
        email: 'admin-test-customer@example.com',
        password: 'Velmora123!',
      }),
    });

    const admin = await request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Admin Test Operator',
        email: 'admin-test-operator@example.com',
        password: 'Velmora123!',
      }),
    });
    await User.updateOne({ _id: admin.body.data.user.id }, { $set: { role: 'admin' } });
    const customerHeaders = { Authorization: `Bearer ${customer.body.data.token}` };
    const adminHeaders = {
      Authorization: `Bearer ${admin.body.data.token}`,
      'Content-Type': 'application/json',
    };

    const relatedProduct = await Product.create({
      name: 'Admin Managed Serum',
      slug: 'admin-managed-serum',
      description: 'A sample serum.',
      category: 'Serums',
      ingredient: 'Oat',
      concern: 'Dryness',
      skinType: 'All skin types',
      price: 18,
      compareAt: 22,
      stock: 4,
      format: '30 ml',
    });
    const forbidden = await request('/api/v1/admin/dashboard', { headers: customerHeaders });
    assert.equal(forbidden.status, 403);
    assert.equal(forbidden.body.error.code, 'ADMIN_REQUIRED');

    const created = await request('/api/v1/admin/products', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        name: 'Admin Managed Balm',
        slug: 'admin-managed-balm',
        description: 'A sample balm.',
        category: 'Balms',
        ingredient: 'Shea',
        concern: 'Dryness',
        skinType: 'All skin types',
        price: 20,
        compareAt: 25,
        stock: 3,
        format: '50 ml',
        frequentlyBoughtTogether: [relatedProduct._id.toString()],
      }),
    });
    assert.equal(created.status, 201);
    assert.deepEqual(created.body.data.product.frequentlyBoughtTogether, [relatedProduct._id.toString()]);
    const productId = created.body.data.product.id;
    const publicProduct = await request(`/api/v1/products/${productId}`);
    assert.equal(publicProduct.status, 200);
    assert.deepEqual(
      publicProduct.body.data.product.frequentlyBoughtTogether.map((product) => product.id),
      [relatedProduct._id.toString()],
    );

    const invalidProduct = await request('/api/v1/admin/products', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ ...created.body.data.product, slug: 'invalid slug' }),
    });
    assert.equal(invalidProduct.status, 400);

    const inventory = await request(`/api/v1/admin/products/${productId}/inventory`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ quantity: 9, reason: 'Restocked shipment' }),
    });
    assert.equal(inventory.status, 200);
    assert.equal(inventory.body.data.product.stock, 9);

    const movements = await request(`/api/v1/admin/products/${productId}/inventory/movements`, {
      headers: adminHeaders,
    });
    assert.equal(movements.body.data.movements.length, 1);
    assert.equal(movements.body.data.movements[0].nextStock, 9);

    const disable = await request(`/api/v1/admin/customers/${customer.body.data.user.id}/status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ disabled: true }),
    });
    assert.equal(disable.status, 200);
    const disabledMe = await request('/api/v1/auth/me', { headers: customerHeaders });
    assert.equal(disabledMe.status, 403);
    const reenable = await request(`/api/v1/admin/customers/${customer.body.data.user.id}/status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ disabled: false }),
    });
    assert.equal(reenable.status, 200);

    const order = await Order.create({
      orderNumber: 'VM-ADMIN-TEST',
      user: customer.body.data.user.id,
      items: [{
        productId: new mongoose.Types.ObjectId(),
        slug: 'historic-admin-product',
        name: 'Historic Product',
        quantity: 1,
        unitPrice: 20,
      }],
      shippingAddress: {
        fullName: 'Admin Test Customer',
        phone: '+1 555 0100',
        addressLine1: '12 Willow Road',
        city: 'Fitzroy',
        state: 'Victoria',
        postalCode: '3065',
        country: 'Australia',
      },
      subtotal: 20,
      discount: 0,
      shipping: 9,
      tax: 0,
      total: 29,
      currency: 'USD',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
    });
    const invalidTransition = await request(`/api/v1/admin/orders/${order.id}/status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'DELIVERED' }),
    });
    assert.equal(invalidTransition.status, 409);
    const processing = await request(`/api/v1/admin/orders/${order.id}/status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'PROCESSING', note: 'Packing order' }),
    });
    assert.equal(processing.status, 200);
    assert.equal(processing.body.data.order.status, 'PROCESSING');
    assert.equal(processing.body.data.order.statusHistory.at(-1).note, 'Packing order');

    const coupon = await request('/api/v1/admin/coupons', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ code: 'ADMIN25', discountPercent: 25, minimumSubtotal: 50 }),
    });
    assert.equal(coupon.status, 201);
    const dashboard = await request('/api/v1/admin/dashboard', { headers: adminHeaders });
    assert.equal(dashboard.status, 200);
    assert.ok(dashboard.body.data.metrics.orders >= 1);
  });

  test('validates admin product image uploads and persists only Cloudinary asset references', async () => {
    const admin = await request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Image Admin',
        email: 'image-admin@example.com',
        password: 'Velmora123!',
      }),
    });
    await User.updateOne({ _id: admin.body.data.user.id }, { $set: { role: 'admin' } });
    const adminHeaders = { Authorization: `Bearer ${admin.body.data.token}` };

    const forbidden = await request('/api/v1/admin/product-images', {
      method: 'POST',
      body: new FormData(),
    });
    assert.equal(forbidden.status, 401);

    const invalidForm = new FormData();
    invalidForm.append('image', new Blob(['not an image'], { type: 'image/png' }), 'bad.png');
    const invalidContent = await request('/api/v1/admin/product-images', {
      method: 'POST',
      headers: adminHeaders,
      body: invalidForm,
    });
    assert.equal(invalidContent.status, 400);
    assert.equal(invalidContent.body.error.code, 'INVALID_IMAGE_CONTENT');

    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-key';
    process.env.CLOUDINARY_API_SECRET = 'test-secret';
    mock.method(cloudinary.uploader, 'upload_stream', (_options, callback) => ({
      end() {
        callback(null, {
          public_id: 'velmora/products/test_asset',
          secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/v123/velmora/products/test_asset.png',
        });
      },
    }));
    const pngBytes = Buffer.from('89504e470d0a1a0a0000000d4948445200000001', 'hex');
    const validForm = new FormData();
    validForm.append('image', new Blob([pngBytes], { type: 'image/png' }), 'product.png');
    const uploaded = await request('/api/v1/admin/product-images', {
      method: 'POST',
      headers: adminHeaders,
      body: validForm,
    });
    assert.equal(uploaded.status, 201, JSON.stringify(uploaded.body));
    assert.deepEqual(uploaded.body.data.image, {
      publicId: 'velmora/products/test_asset',
      url: 'https://res.cloudinary.com/test-cloud/image/upload/v123/velmora/products/test_asset.png',
    });

    const created = await request('/api/v1/admin/products', {
      method: 'POST',
      headers: { ...adminHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Image-backed Product',
        slug: 'image-backed-product',
        description: 'Stored with a validated Cloudinary image.',
        category: 'Care',
        ingredient: 'Oat',
        concern: 'Dryness',
        skinType: 'All skin types',
        price: 20,
        compareAt: 25,
        stock: 2,
        format: '50 ml',
        images: [uploaded.body.data.image],
      }),
    });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const storedProduct = await Product.findById(created.body.data.product.id).lean();
    assert.equal(storedProduct.images[0].publicId, uploaded.body.data.image.publicId);
    assert.equal(storedProduct.images[0].url, uploaded.body.data.image.url);

    const externalImage = await request('/api/v1/admin/products', {
      method: 'POST',
      headers: { ...adminHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Unsafe Image Product',
        slug: 'unsafe-image-product',
        description: 'External images are not accepted.',
        category: 'Care',
        ingredient: 'Oat',
        concern: 'Dryness',
        skinType: 'All skin types',
        price: 20,
        compareAt: 25,
        stock: 2,
        format: '50 ml',
        images: [{ publicId: 'external/id', url: 'https://example.com/image.png' }],
      }),
    });
    assert.equal(externalImage.status, 400);
  });

  test('manages curated bundles with active product relationships', async () => {
    const products = await Product.create([
      {
        name: 'Bundle Cleanser',
        slug: 'bundle-cleanser',
        description: 'Gentle cleansing.',
        category: 'Cleansers',
        ingredient: 'Oat',
        concern: 'Sensitivity',
        skinType: 'Dry skin',
        price: 20,
        compareAt: 25,
        stock: 5,
        format: '50 ml',
      },
      {
        name: 'Bundle Serum',
        slug: 'bundle-serum',
        description: 'Daily hydration.',
        category: 'Serums',
        ingredient: 'Oat',
        concern: 'Dryness',
        skinType: 'All skin types',
        price: 30,
        compareAt: 35,
        stock: 4,
        format: '30 ml',
      },
    ]);
    const admin = await request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Bundle Admin',
        email: 'bundle-admin@example.com',
        password: 'Velmora123!',
      }),
    });
    await User.updateOne({ _id: admin.body.data.user.id }, { $set: { role: 'admin' } });
    const headers = {
      Authorization: `Bearer ${admin.body.data.token}`,
      'Content-Type': 'application/json',
    };
    const created = await request('/api/v1/admin/bundles', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Daily Glow Set',
        slug: 'daily-glow-set',
        description: 'A cleanser and serum pairing.',
        productIds: products.map((product) => product._id.toString()),
      }),
    });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    assert.equal(created.body.data.bundle.products.length, 2);
    assert.equal(await Bundle.countDocuments(), 1);

    const publicBundles = await request('/api/v1/content/bundles');
    assert.equal(publicBundles.status, 200);
    assert.equal(publicBundles.body.data.bundles[0].name, 'Daily Glow Set');

    const customer = await request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Bundle Customer',
        email: 'bundle-customer@example.com',
        password: 'Velmora123!',
      }),
    });
    const customerHeaders = { Authorization: `Bearer ${customer.body.data.token}` };
    await Product.updateOne({ _id: products[1]._id }, { $set: { stock: 0 } });
    const unavailableBundle = await request('/api/v1/cart/bundles', {
      method: 'POST',
      headers: { ...customerHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ productIds: products.map((product) => product._id.toString()) }),
    });
    assert.equal(unavailableBundle.status, 409);
    assert.equal((await request('/api/v1/cart', { headers: customerHeaders })).body.data.cart.items.length, 0);

    await Product.updateOne({ _id: products[1]._id }, { $set: { stock: 4 } });
    const addedBundle = await request('/api/v1/cart/bundles', {
      method: 'POST',
      headers: { ...customerHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ productIds: products.map((product) => product._id.toString()) }),
    });
    assert.equal(addedBundle.status, 201);
    assert.equal(addedBundle.body.data.cart.items.length, 2);

    const invalid = await request('/api/v1/admin/bundles', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Broken Bundle',
        slug: 'broken-bundle',
        description: 'Needs two different active products.',
        productIds: [products[0]._id.toString(), products[0]._id.toString()],
      }),
    });
    assert.equal(invalid.status, 400);

    const archived = await request(`/api/v1/admin/bundles/${created.body.data.bundle.id}`, {
      method: 'DELETE',
      headers,
    });
    assert.equal(archived.status, 200);
    assert.equal((await request('/api/v1/content/bundles')).body.data.bundles.length, 0);
  });

  test('requires verified purchases for reviews and recalculates moderated product ratings', async () => {
    const product = await Product.create({
      name: 'Review Test Cream',
      slug: 'review-test-cream',
      description: 'A review test product.',
      category: 'Moisturizers',
      ingredient: 'Oat',
      concern: 'Dryness',
      skinType: 'All skin types',
      price: 30,
      compareAt: 35,
      stock: 5,
      format: '50 ml',
      rating: 0,
      reviews: 0,
    });
    const customer = await request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Verified Reviewer',
        email: 'verified-reviewer@example.com',
        password: 'Velmora123!',
      }),
    });
    const otherCustomer = await request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Unverified Reviewer',
        email: 'unverified-reviewer@example.com',
        password: 'Velmora123!',
      }),
    });
    const draftOrder = await Order.create({
      orderNumber: 'VM-REVIEW-PENDING',
      user: customer.body.data.user.id,
      items: [{
        productId: product._id,
        slug: product.slug,
        name: product.name,
        quantity: 1,
        unitPrice: product.price,
      }],
      shippingAddress: {
        fullName: 'Verified Reviewer',
        phone: '+1 555 0100',
        addressLine1: '12 Willow Road',
        city: 'Fitzroy',
        state: 'Victoria',
        postalCode: '3065',
        country: 'Australia',
      },
      subtotal: 30,
      discount: 0,
      shipping: 9,
      tax: 0,
      total: 39,
      currency: 'USD',
    });
    const customerHeaders = {
      Authorization: `Bearer ${customer.body.data.token}`,
      'Content-Type': 'application/json',
    };
    const reviewPayload = {
      orderId: draftOrder._id.toString(),
      rating: 5,
      title: 'A thoughtful formula',
      body: 'A pleasant product for my routine.',
    };
    const unpaidReview = await request(`/api/v1/products/${product._id}/reviews`, {
      method: 'POST',
      headers: customerHeaders,
      body: JSON.stringify(reviewPayload),
    });
    assert.equal(unpaidReview.status, 403);

    draftOrder.paymentStatus = 'PAID';
    draftOrder.status = 'CONFIRMED';
    await draftOrder.save();
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-key';
    process.env.CLOUDINARY_API_SECRET = 'test-secret';
    mock.method(cloudinary.uploader, 'upload_stream', (options, callback) => ({
      end() {
        callback(null, {
          public_id: `${options.folder}/review_asset`,
          secure_url: `https://res.cloudinary.com/test-cloud/image/upload/v123/${options.folder}/review_asset.png`,
        });
      },
    }));
    const reviewMultipartHeaders = { ...customerHeaders };
    delete reviewMultipartHeaders['Content-Type'];
    const reviewImageForm = new FormData();
    reviewImageForm.append('orderId', draftOrder._id.toString());
    reviewImageForm.append('rating', '5');
    reviewImageForm.append('title', 'A thoughtful formula');
    reviewImageForm.append('body', 'A pleasant product for my routine.');
    reviewImageForm.append('removeImage', 'false');
    reviewImageForm.append('image', new Blob([
      Buffer.from('89504e470d0a1a0a0000000d4948445200000001', 'hex'),
    ], { type: 'image/png' }), 'review.png');
    const reviewResponse = await request(`/api/v1/products/${product._id}/reviews`, {
      method: 'POST',
      headers: reviewMultipartHeaders,
      body: reviewImageForm,
    });
    assert.equal(reviewResponse.status, 201);
    assert.equal(reviewResponse.body.data.review.image.publicId, 'velmora/reviews/review_asset');
    const reviewId = reviewResponse.body.data.review.id;
    const ownReview = await request(`/api/v1/products/${product._id}/reviews/mine`, {
      headers: customerHeaders,
    });
    assert.equal(ownReview.status, 200);
    assert.equal(ownReview.body.data.review.id, reviewId);
    const otherOwnReview = await request(`/api/v1/products/${product._id}/reviews/mine`, {
      headers: { Authorization: `Bearer ${otherCustomer.body.data.token}` },
    });
    assert.equal(otherOwnReview.body.data.review, null);

    const duplicate = await request(`/api/v1/products/${product._id}/reviews`, {
      method: 'POST',
      headers: customerHeaders,
      body: JSON.stringify(reviewPayload),
    });
    assert.equal(duplicate.status, 409);
    const hiddenReview = await request(`/api/v1/products/${product._id}/reviews`);
    assert.equal(hiddenReview.body.data.reviews.length, 0);

    const otherDelete = await request(`/api/v1/orders/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${otherCustomer.body.data.token}` },
    });
    assert.equal(otherDelete.status, 404);

    const admin = await User.create({
      name: 'Review Moderator',
      email: 'review-moderator@example.com',
      passwordHash: 'not-used-for-auth-test',
      role: 'admin',
    });
    const { signToken } = await import('../src/middleware/authMiddleware.js');
    const adminHeaders = {
      Authorization: `Bearer ${signToken(admin)}`,
      'Content-Type': 'application/json',
    };
    const approve = await request(`/api/v1/admin/reviews/${reviewId}/moderation`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    assert.equal(approve.status, 200);
    assert.equal((await Product.findById(product._id)).rating, 5);
    assert.equal((await Product.findById(product._id)).reviews, 1);
    const publicReview = await request(`/api/v1/products/${product._id}/reviews`);
    assert.equal(publicReview.body.data.reviews.length, 1);
    assert.equal(publicReview.body.data.reviews[0].verifiedPurchase, true);
    assert.equal(publicReview.body.data.reviews[0].image.publicId, 'velmora/reviews/review_asset');

    const edit = await request(`/api/v1/orders/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: reviewMultipartHeaders,
      body: (() => {
        const editForm = new FormData();
        editForm.append('rating', '4');
        editForm.append('title', 'Updated review');
        editForm.append('body', 'Updated verified feedback.');
        editForm.append('removeImage', 'true');
        return editForm;
      })(),
    });
    assert.equal(edit.status, 200);
    assert.equal(edit.body.data.review.status, 'PENDING');
    assert.equal(edit.body.data.review.image, null);
    assert.equal((await Review.findById(reviewId)).image?.url, undefined);
    assert.equal((await Product.findById(product._id)).reviews, 0);
    assert.equal(await Review.countDocuments(), 1);
    const deleteOwnReview = await request(`/api/v1/orders/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: customerHeaders,
    });
    assert.equal(deleteOwnReview.status, 200);
    assert.equal(await Review.countDocuments(), 0);
  });

  test('resets passwords with one-time tokens and revokes existing sessions', async () => {
    const registration = await request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Ava Jordan',
        email: 'reset@example.com',
        password: 'Velmora123!',
      }),
    });
    const resetToken = 'a'.repeat(64);
    const user = await User.findOne({ email: 'reset@example.com' });
    user.passwordResetTokenHash = createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpiresAt = new Date(Date.now() + 60_000);
    await user.save();

    const reset = await request('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: resetToken, password: 'NewVelmora123!' }),
    });
    assert.equal(reset.status, 200);
    const revokedRefresh = await request('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { Cookie: registration.headers.get('set-cookie').split(';')[0] },
    });
    assert.equal(revokedRefresh.status, 401);

    const replay = await request('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: resetToken, password: 'AnotherPass123!' }),
    });
    assert.equal(replay.status, 400);

    const oldPassword = await request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'reset@example.com', password: 'Velmora123!' }),
    });
    const newPassword = await request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'reset@example.com', password: 'NewVelmora123!' }),
    });
    assert.equal(oldPassword.status, 401);
    assert.equal(newPassword.status, 200);
  });

  test('does not expose reset token when SMTP email is not configured', async () => {
    const originalSmtpValues = Object.fromEntries(
      ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM'].map((key) => [
        key,
        process.env[key],
      ]),
    );
    for (const key of Object.keys(originalSmtpValues)) process.env[key] = '';

    try {
      const result = await request('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'reset@example.com' }),
      });
      assert.equal(result.status, 503);
      assert.equal(result.body.error.code, 'EMAIL_NOT_CONFIGURED');
    } finally {
      for (const [key, value] of Object.entries(originalSmtpValues)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });
});
