# Velmora

Premium natural beauty e-commerce, built with the MERN stack.

## Project layout

- `client/` — React (Vite) storefront
- `server/` — Express API under `/api/v1`
- Specs at the repository root (`product-requirements.md`, `architecture.md`, `phase.md`, and related files)

## Prerequisites

- Node.js 22+
- npm 10+
- MongoDB locally, MongoDB Atlas, or `USE_IN_MEMORY_DB=true` for local foundation work

## Setup

```bash
cp .env.example .env
npm install
npm install --prefix client
npm install --prefix server
```

Configure `MONGODB_URI` in `.env`. For local work without MongoDB installed, keep `USE_IN_MEMORY_DB=true`. Do not use the in-memory database in production.

To insert the initial catalog, coupons, categories, ingredients, linked routines, journal entries, and curated bundles into MongoDB, run `npm run seed:catalog`. Seeded merchandising metadata and product rating aggregates are refreshed from approved database reviews; existing catalog content and bundle relationships are not overwritten.

Password recovery email requires SMTP settings (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, and optionally `SMTP_SECURE`) in `.env`. Reset tokens are one-time, expire after 20 minutes, and are stored hashed.

Checkout uses `CURRENCY` (default `USD`), `SHIPPING_FLAT_RATE`, `FREE_SHIPPING_THRESHOLD`, and `TAX_RATE` (a decimal fraction; default `0`). Configure rates for the selling jurisdiction before production.

Product and customer review image uploads require `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. Admin product uploads and optional verified-customer review photos accept JPEG, PNG, and WebP files up to 5 MB; image bytes are checked before upload. MongoDB stores only Cloudinary asset IDs and HTTPS delivery URLs. Configure the credentials in `.env` before using image uploads. Admins can configure product-level “frequently bought together” recommendations in the product editor.

The API applies process-local rate limits (300 requests per 15 minutes overall and 20 requests per 15 minutes for authentication routes). If deploying multiple API instances, configure a shared rate-limit store and set proxy trust only for the known reverse proxy. Production CORS allows only explicitly configured `CLIENT_ORIGIN` values; development additionally permits localhost origins.

## Production deployment checklist

1. Provision MongoDB Atlas or another replica-set deployment; payment fulfillment uses MongoDB transactions.
2. Configure `NODE_ENV=production`, a unique `JWT_SECRET` of at least 32 characters, `MONGODB_URI`, and the exact frontend URL in `CLIENT_ORIGIN`.
3. Set Stripe credentials and register `https://<api-host>/api/v1/payments/stripe/webhook` for checkout completion, expiration, and asynchronous payment failure events.
4. Set Cloudinary credentials for product photos and SMTP credentials for password recovery email.
5. Configure shipping/tax/currency for the selling region, run `npm run seed:catalog` as appropriate, then promote an existing account with `npm run admin:promote -- user@example.com`.
6. Run `npm test --prefix server`, `npm run lint`, and `npm run build:client`; deploy the generated `client/dist` to static hosting and run the API with `npm start --prefix server`.
7. Use HTTPS, a shared rate-limit store for multiple API instances, and configure trusted proxies at the hosting layer. Do not use `USE_IN_MEMORY_DB` in production.

## Development

```bash
npm run dev:server
npm run dev:client
```

- Client: http://localhost:5173
- API health: http://localhost:5000/api/v1/health

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev:client` | Start the Vite app |
| `npm run dev:server` | Start the Express API |
| `npm run lint` | Lint client and server |
| `npm run build:client` | Production client build |
| `npm run seed:catalog` | Insert missing sample products and coupons into MongoDB |

## Environment variables

See `.env.example`. Never commit `.env` or secrets.

## Documentation

- `product-requirements.md` — what the product must do
- `architecture.md` — technical architecture
- `rules.md` — implementation rules
- `phase.md` — roadmap and acceptance criteria
- `commands.md` — phase prompts
- `design.md` — visual system
- `decisions.md` — ADRs
