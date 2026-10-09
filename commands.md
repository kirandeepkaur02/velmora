# Cursor Commands — Phase Execution

Use these prompts in Cursor Agent/Chat one phase at a time.

## Global command

Before every phase, use:

```text
Read product-requirements.md, architecture.md, rules.md, design.md, decisions.md and phase.md.

Identify the current phase and its acceptance criteria.

Inspect the existing repository before changing anything.

Do not implement future-phase features unless they are required dependencies.

Create a concise implementation plan, then execute it.

After implementation:
1. Run relevant tests.
2. Run lint.
3. Run build where applicable.
4. Fix errors.
5. Summarize changed files.
6. Report which acceptance criteria passed and which did not.

Do not claim completion without verification.
```

---

# Phase 0 Command

```text
Execute Phase 0 from phase.md.

Set up the MERN project foundation only.

Create the client and server structure, Express API, MongoDB connection, environment configuration, API versioning, health endpoint, centralized error handling, Git configuration and baseline lint/format setup.

Do not build storefront features yet.

Verify client startup, server startup, API health and database connectivity.
```

# Phase 1 Command

```text
Execute Phase 1 from phase.md.

Read design.md carefully and inspect both files inside design-references/.

Build the reusable design system and application shell.

Implement color tokens, typography, responsive layout, Header, Footer, Button, Card, ProductCard, SectionHeading, Badge and loading/error primitives.

Use the first reference for color/mood and the second for UI composition.

Do not build the full store yet.
```

# Phase 2 Command

```text
Execute Phase 2 from phase.md.

Build the public storefront using real API-driven product data.

Implement Home, Shop, Category, Product Details, Search, Filters, Sorting, Pagination, Ingredients, Concerns, Routines, About, Journal, FAQ and Contact.

Follow design.md exactly for the visual system.

Include loading, empty and error states.

Do not implement checkout/payment/admin yet unless required as a dependency.
```

# Phase 3 Command

```text
Execute Phase 3 from phase.md.

Implement secure customer authentication and account management.

Include registration, login, logout, refresh, password reset, protected routes, profile and addresses.

Implement server-side authorization and secure password hashing.

Do not rely on frontend route guards for security.

Add tests for authentication and authorization.
```

# Phase 4 Command

```text
Execute Phase 4 from phase.md.

Implement persistent cart and wishlist.

The backend must be the source of truth for product price and stock.

Prevent invalid quantities and unavailable purchases.

Add API tests for cart authorization and pricing/stock rules.
```

# Phase 5 Command

```text
Execute Phase 5 from phase.md.

Implement checkout preparation, coupon validation, shipping/tax calculation where applicable and server-side order-total calculation.

Never trust client totals, prices or discounts.

Add tests for valid/invalid coupons, stock changes and total calculations.
```

# Phase 6 Command

```text
Execute Phase 6 from phase.md.

Integrate Razorpay or Stripe according to decisions.md.

Implement server-created payment intent/order, provider checkout, verified webhook, payment state and idempotent webhook handling.

Never mark an order paid based only on frontend success.

Add payment verification tests using mocked provider events.
```

# Phase 7 Command

```text
Execute Phase 7 from phase.md.

Implement customer order history/detail and admin order management.

Implement the defined order state machine and status history.

Ensure customers can only access their own orders.

Preserve purchase-time prices in order items.
```

# Phase 8 Command

```text
Execute Phase 8 from phase.md.

Build the protected admin dashboard.

Implement dashboard metrics, product CRUD, inventory, categories, ingredients, customers, reviews, coupons and orders.

Enforce ADMIN authorization on the server for every admin API.

Do not rely on hiding admin UI in React.
```

# Phase 9 Command

```text
Execute Phase 9 from phase.md.

Implement verified-purchase reviews and ratings.

Customers can create reviews only for products they purchased.

Implement moderation and ownership checks.

Add API tests for review authorization.
```

# Phase 10 Command

```text
Execute Phase 10 from phase.md.

Implement secure Cloudinary or object-storage image uploads for admin product management.

Validate file size/type/content and store only safe provider identifiers/URLs.

Update product gallery UI.
```

# Phase 11 Command

```text
Execute Phase 11 from phase.md.

Add automated tests for critical business logic.

Prioritize auth, RBAC, products, cart totals, coupons, inventory, order creation, payment webhook verification and review permissions.

Run the complete test suite and fix regressions.
```

# Phase 12 Command

```text
Execute Phase 12 from phase.md.

Perform a security hardening pass across the application.

Audit Helmet/security headers, CORS, rate limiting, validation, NoSQL injection, XSS, CSRF where applicable, cookies, uploads, authorization, secrets and production error handling.

Do not add security packages blindly. Configure and verify them.
```

# Phase 13 Command

```text
Execute Phase 13 from phase.md.

Perform performance and accessibility improvements.

Audit image loading, API queries, pagination, bundle size, semantic HTML, keyboard navigation, focus states, labels, contrast and reduced motion.

Do not sacrifice usability for micro-optimizations.
```

# Phase 14 Command

```text
Execute Phase 14 from phase.md.

Prepare production deployment.

Add Docker configuration if useful, GitHub Actions CI, production environment handling, health checks, frontend/backend deployment configuration, MongoDB Atlas configuration and monitoring.

Never place secrets in source control.

Verify the production build.
```

# Phase 15 Command

```text
Execute Phase 15 from phase.md.

Prepare the project for portfolio presentation.

Create/update README with:
- Project overview
- Features
- Tech stack
- Architecture
- Security
- API documentation
- Testing
- Deployment
- Screenshots
- Demo instructions
- Technical decisions
- Known limitations

Do not exaggerate features that are not actually implemented.
```

---

# Final Audit Command

Use after all phases:

```text
Perform a full production-readiness and portfolio audit.

Read all project documentation and inspect the implementation.

Check:
- Functional completeness
- Architecture consistency
- Authentication
- Authorization/RBAC
- Payment verification
- Pricing integrity
- Inventory integrity
- Input validation
- Security
- Accessibility
- Responsive UI
- Performance
- Testing
- Error handling
- Environment variables
- Deployment
- Documentation

Run lint, tests and production builds.

Create a final report with:
1. Passed
2. Failed
3. High-priority fixes
4. Medium-priority improvements
5. Optional enhancements

Do not modify architecture without updating decisions.md.
```
