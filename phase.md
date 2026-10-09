# Implementation Phases

This document is the execution plan for Cursor AI.

## How to use this file

Work strictly phase-by-phase.

For each phase :  

1. Read the phase requirements.
2. Inspect the repository.
3. Implement only that phase and required dependencies.
4. Run verification commands.
5. Fix failures.
6. Update the phase status.
7. Do not start the next phase until acceptance criteria pass.

---

# Phase 0 — Project Foundation

**Status:** Completed

### Goal

Create the project structure and development baseline.

### Commands

```bash
git init
npm create vite@latest client -- --template react
mkdir server
cd server
npm init -y
```

Install required core packages after confirming the project's current Node/npm versions.

### Tasks

- Create client/server structure.
- Configure React.
- Configure Express.
- Configure MongoDB connection.
- Add `.env.example`.
- Add `.gitignore`.
- Add basic README.
- Add health endpoint.
- Add centralized error middleware.
- Add basic lint/format configuration.
- Add API version prefix `/api/v1`.

### Acceptance

- Client starts.
- Server starts.
- `/api/v1/health` responds.
- MongoDB connection works through environment variables.
- No secrets are committed.

---

# Phase 1 — Design System & UI Foundation

**Status:** Completed

### Goal

Build the visual foundation from `design.md`.

### Tasks

- Set typography.
- Set color tokens.
- Create layout system.
- Create Header.
- Create Footer.
- Create Button.
- Create Card.
- Create ProductCard.
- Create SectionHeading.
- Create Badge.
- Create Loading/Skeleton components.
- Configure responsive breakpoints.

### Acceptance

- Visual system matches the references.
- Mobile/tablet/desktop layouts work.
- Components are reusable.
- No hardcoded inconsistent colors throughout components.

---

# Phase 2 — Public Storefront

**Status:** Completed

### Implementation

- Replaced the browser-only sample catalog with MongoDB-backed product and facet APIs.
- Added server-side search, filters, sorting, pagination, and product detail lookup.
- Added skin/hair type and stock availability filters, merchandising flags, product usage guidance, and Cloudinary-backed product galleries.
- Added functional ingredient/concern exploration, storefront information pages, and database-backed contact/newsletter forms.
- Added MongoDB-backed curated bundles, linked routine steps, and journal/review home content.
- Added configurable product-level “frequently bought together” relationships with detail-page recommendations.
- Added an explicit, idempotent MongoDB seed command for catalog and curated content.

### Goal

Build the customer-facing browsing experience.

### Tasks

- Home page.
- Shop page.
- Category page.
- Product listing.
- Product detail.
- Search.
- Filters.
- Sorting.
- Pagination.
- Ingredient explorer.
- Concern explorer.
- Beauty routines.
- About/story.
- Journal UI.
- FAQ.
- Contact UI.

### Acceptance

- Products load from API.
- Search/filter/sort work.
- Product details work.
- Empty/loading/error states exist.
- Responsive behavior works.
- Catalog products and filter facets are read from MongoDB.
- Server-side filtering and pagination are covered by API tests.
- Contact messages and newsletter subscriptions are persisted in MongoDB.

---

# Phase 3 — Authentication & User Accounts

**Status:** Completed

### Implementation

- Added a real Mongo-backed user model with encrypted passwords.
- Added JWT-based login and register endpoints.
- Added short-lived access tokens with rotated, revocable refresh sessions in MongoDB.
- Added protected profile and address management with per-user ownership checks.
- Added password reset tokens stored hashed, single-use, and expiring after 20 minutes.
- Integrated profile/address/recovery forms with the account API.

### Acceptance

- Passwords are hashed.
- Protected API rejects unauthenticated requests.
- Customer cannot access another customer's data.
- Refresh/logout behavior is verified.
- Sensitive values are not exposed.
- SMTP must be configured before password reset emails can be delivered.

### Goal

Implement secure customer authentication.

### Tasks

- Register.
- Login.
- Logout.
- Refresh session/token.
- Forgot password.
- Reset password.
- Protected routes.
- Profile.
- Addresses.
- Server-side authorization.

### Acceptance

- Passwords are hashed.
- Protected API rejects unauthenticated requests.
- Customer cannot access another customer's data.
- Refresh/logout behavior is verified.
- Sensitive values are not exposed.

---  

# Phase 4 — Cart & Wishlist

**Status:** Completed

### Implementation

- Added authenticated MongoDB-backed cart and wishlist endpoints.
- Cart pricing and stock availability are read from active product records on every request.
- Added quantity bounds and stock validation; client-provided totals/prices are ignored.
- The storefront loads and mutates persistent shopping data through the API.

### Goal  

Implement persistent shopping state.

### Tasks

- Add to cart.
- Update quantity.
- Remove item.
- Cart persistence.
- Wishlist add/remove.
- Stock validation.
- Price retrieval from backend.
- Cart API.

### Acceptance

- Quantity cannot be invalid.
- Out-of-stock products cannot be purchased.
- Client cannot manipulate trusted final prices.
- Cart works after refresh/login.

---

# Phase 5 — Coupons & Checkout

**Status:** Completed

### Implementation

- Added MongoDB-backed coupons with start/expiry, minimum subtotal, and redemption-cap validation.
- Added server-calculated checkout quotes and persisted pending-order snapshots.
- Rechecks current MongoDB stock and prices at quote/order creation; ignores browser totals.
- Shipping and tax rates are configurable through environment variables.

### Goal

Build a production-style checkout flow.

### Tasks

- Address selection.
- Coupon validation.
- Shipping calculation.
- Tax calculation if required.
- Server-side order total calculation.
- Checkout review page.
- Order creation preparation.

### Acceptance

- Backend recalculates all trusted amounts.
- Invalid/expired coupons fail.
- Stock is rechecked.
- Checkout cannot be manipulated through browser values.

--- 

# Phase 6 — Payment Integration

**Status:** Completed

### Implementation

- Integrated Stripe Checkout with per-order idempotent payment attempts.
- Added raw-body signature-verified webhook handling and duplicate-event persistence.
- Only verified Stripe-paid events confirm orders; stock/coupon redemption and cart clearing run transactionally.
- Failed/expired payment handling, retries, and mismatch refunds are supported.
- Requires `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` for live payment sessions/webhooks.

### Goal  

Integrate Razorpay or Stripe.

### Tasks  

- Payment provider setup.
- Secure checkout API.
- Payment confirmation hook.
- Success/failure states.
- Refund handling notes.
- Payment retries.

### Acceptance  

- Payment success and failure states are visible.
- Orders are marked only after successful verification.
- No secrets are exposed in client code.
- Payment flow is documented.

---

# Phase 7 — Orders & Fulfillment

**Status:** Completed

### Implementation

- Added authenticated, paginated customer order history and order details.
- Order queries are always scoped to the authenticated customer.
- Purchase-time items, prices, delivery address, totals, payment status, and status history are retained.

### Acceptance

- Customers can list and view only their own orders.
- Admin order changes follow the order state machine and write status history.
- Purchase-time item prices remain unchanged.

---

# Phase 8 — Admin Dashboard

**Status:** Completed

### Implementation

- Added admin-only dashboard metrics and revenue, stock, and order summaries.
- Added role-protected management APIs and UI for products, inventory adjustments/history, filtered orders, customer order history, customers, coupons, bundles, categories, ingredients, routines, journal entries, and review moderation.
- Added an explicit script for promoting an existing registered account to admin; public registration cannot self-assign privileges.

### Acceptance

- Admin metrics and product, inventory, order, customer, review, and coupon management are available.
- Every admin endpoint enforces server-side admin authorization.

---

# Phase 9 — Reviews

**Status:** Completed

### Implementation

- Added authenticated reviews tied to a paid order containing the reviewed product.
- Enforced one review per customer/product, ownership-limited edit/delete, and pending status after edits; customers can manage their own reviews in the product interface.
- Added admin approval/rejection, public display of approved verified-purchase reviews, and rating/count recalculation.
- Added optional Cloudinary-backed review photos with file-content validation, verified-customer upload, and customer photo replacement/removal.
- Added integration coverage for purchase verification, duplicate prevention, moderation, public visibility, ownership, photo persistence, and rating aggregation.

### Acceptance

- Reviews require a delivered/purchased item and are unique per customer/product.
- Customers can manage their own reviews and optional photos; admins can moderate them.

---

# Phase 10 — Image Storage

**Status:** Completed

### Implementation

- Added role-protected Cloudinary uploads using in-memory multipart handling, with a 5 MB limit and JPEG/PNG/WebP content-signature and MIME checks.
- Product records accept only Cloudinary asset IDs and HTTPS Cloudinary delivery URLs; storefront product cards render uploaded images.
- Cloudinary credentials are server-only and documented in `.env.example` and the README.

### Acceptance

- Admin uploads validate file type, content, and size.
- Only safe storage identifiers/URLs are persisted.

---

# Phase 11 — Automated Test Coverage

**Status:** Completed

### Implementation

- Added in-memory replica-set integration tests covering auth/session recovery, Mongo-backed catalog and storefront, accounts, cart/wishlist, checkout pricing and coupons, Stripe webhooks, order ownership/state, admin authorization, verified reviews, and validated image uploads.
- The complete backend suite passes with client/server linting and production client build.

### Acceptance

- Critical auth, RBAC, catalog, cart, pricing, coupon, stock, payment, review, and order flows are tested.
- Complete test suite passes.

---

# Phase 12 — Security Hardening

**Status:** Completed

### Implementation

- Added process-local API/authentication rate limits and security headers.
- Restricted production CORS to configured origins, rejected unsafe JSON object keys, and enforced strong production JWT secrets.
- Added explicit safe production responses for malformed/oversized request bodies and verified upload MIME/content/size handling.
- Documented the need for a shared rate-limit store and carefully configured proxy trust in multi-instance deployments.

### Acceptance

- Input validation, rate limiting, CORS, security headers, auth, file uploads, and production errors are verified.
- No credentials or tokens are logged or exposed.

---

# Phase 13 — Accessibility & Release Quality

**Status:** Completed

### Implementation

- Added global keyboard focus indicators, a keyboard-accessible skip link, reduced-motion support, and native labeled controls across customer/admin forms.
- Documented production environment, MongoDB transaction/replica-set, Stripe webhook, SMTP, Cloudinary, admin promotion, and frontend/backend deployment requirements.
- Verified the responsive production client build and the complete backend integration suite.

### Acceptance

- Responsive production build works across mobile and desktop.
- Core flows are keyboard accessible, labeled, and support visible focus/reduced motion.
- Setup, environment, architecture, and deployment documentation is complete.

---
