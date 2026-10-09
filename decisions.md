# Architecture Decision Record — Velmora

This file records important technical decisions so Cursor does not repeatedly reconsider settled architecture.

---

## ADR-001 — MERN Stack

### Decision

Use:

- React
- Node.js
- Express.js
- MongoDB
- Mongoose

### Reason

The project is intended as a MERN portfolio project and benefits from a single JavaScript/TypeScript ecosystem across frontend and backend.

### Status

Accepted.

---

## ADR-002 — Modular Monolith

### Decision

Use a modular monolith for v1.

### Reason

The project does not require microservices. A modular monolith is easier to develop, test, deploy and explain while still demonstrating clean architecture.

### Status

Accepted.

---

## ADR-003 — REST API

### Decision

Use versioned REST APIs under `/api/v1`.

### Reason

REST is straightforward for this domain and demonstrates common full-stack engineering skills.

### Status

Accepted.

---

## ADR-004 — Redux Toolkit

### Decision

Use Redux Toolkit for genuinely shared client state.

### Reason

Cart, authentication/session state and selected global UI state can benefit from predictable centralized state.

Do not place all server data into Redux merely because Redux exists.

### Status

Accepted.

---

## ADR-005 — Authentication

### Decision

Use secure authentication with short-lived access credentials and a refresh mechanism.

Prefer HttpOnly/Secure/SameSite cookies for refresh tokens where the chosen implementation supports the required CSRF protections.

### Reason

Reduces exposure of long-lived credentials to JavaScript and provides a production-oriented authentication architecture.

### Status

Accepted.

---

## ADR-006 — Password Hashing

### Decision

Use Argon2id or bcrypt with appropriate configuration.

### Reason

Passwords must never be stored in plaintext.

### Status

Accepted.

---

## ADR-007 — Role-Based Access Control

### Decision

Use RBAC with at least:

- CUSTOMER
- ADMIN

### Reason

The application needs separate customer and administration capabilities.

### Status

Accepted.

---

## ADR-008 — Payment Provider

### Decision

Use Razorpay for the primary India-focused implementation, or Stripe if the deployment/business requirement favors Stripe.

### Reason

A real payment-provider integration demonstrates production e-commerce concepts without handling raw card data directly.

### Status

Accepted.

### Important

Payment completion must be verified server-side using provider-supported verification/webhooks.

---

## ADR-009 — Product Images

### Decision

Use Cloudinary or equivalent object/image storage.

### Reason

Product images should not be stored directly in MongoDB as large binary documents.

### Status

Accepted.

---

## ADR-010 — Validation

### Decision

Use one server-side validation library consistently, preferably Zod or Joi.

### Reason

API boundaries need explicit schemas and predictable validation errors.

### Status

Accepted.

---

## ADR-011 — Security

### Decision

Apply:

- Helmet/security headers.
- Strict CORS.
- Rate limiting.
- Input validation.
- NoSQL injection defenses.
- XSS-safe rendering.
- Secure authentication.
- Server-side authorization.
- Secure file uploads.
- HTTPS in production.

### Reason

The application handles accounts, addresses, orders and payments.

### Status

Accepted.

---

## ADR-012 — Pricing Source of Truth

### Decision

The backend/database is the source of truth for product prices, inventory, discounts and final order totals.

### Reason

Frontend values can be manipulated.

### Status

Accepted.

---

## ADR-013 — Order History

### Decision

Store purchase-time item price and quantity inside the order.

### Reason

Product prices can change after an order is placed. Historical orders must remain accurate.

### Status

Accepted.

---

## ADR-014 — Product Deletion

### Decision

Prefer archive/soft-delete behavior for products referenced by historical orders.

### Reason

Hard deletion can damage historical order relationships and reporting.

### Status

Accepted.

---

## ADR-015 — Search

### Decision

Start with MongoDB-supported indexes/search.

Do not introduce Elasticsearch unless project scale or search requirements justify it.

### Reason

Avoid unnecessary infrastructure complexity.

### Status

Accepted.

---

## ADR-016 — Redis

### Decision

Redis is optional, not a v1 dependency.

Introduce it only for a concrete requirement such as:

- Distributed rate limiting.
- Session/cache needs.
- High-value query caching.

### Reason

Avoid premature infrastructure.

### Status

Accepted.

---

## ADR-017 — Testing

### Decision

Test critical business logic and API authorization/payment flows.

### Reason

The project should demonstrate reliability, not just UI functionality.

### Status

Accepted.

---

## ADR-018 — Docker

### Decision

Use Docker for reproducible local development/CI where practical.

### Reason

Demonstrates environment consistency and deployment skills.

Do not make Docker more complex than the application needs.

### Status

Accepted.

---

## ADR-019 — CI/CD

### Decision

Use GitHub Actions for:

- Install.
- Lint.
- Test.
- Build.

Deployment can be added according to hosting provider.

### Reason

Provides a professional development workflow.

### Status

Accepted.

---

## ADR-020 — UI References

### Decision

Use the two provided images as visual references only.

### Reference 1

`design-references/01-color-theme-reference.png`

Defines palette/mood.

### Reference 2

`design-references/02-ui-design-reference.png`

Defines layout/product presentation direction.

### Reason

The goal is an original brand implementation inspired by the references, not a direct clone.

### Status

Accepted.

---

## ADR-021 — No Premature AI Recommendation System

### Decision

Start the cosmetics recommendation feature as a transparent rule-based system.

### Reason

A rule-based concern/ingredient/routine system is easier to validate and explain. Machine learning is unnecessary unless real data and a measurable recommendation problem exist.

### Status

Accepted.

---

## ADR-022 — Brand Name

### Decision

The website and brand name is **Velmora**.

Use Velmora in the document title, header wordmark, footer, metadata, emails, and customer-facing copy. Do not substitute another store name.

### Reason

The product is a named beauty brand, not a generic cosmetics demo.

### Status

Accepted.

---

## ADR-023 — Local In-Memory MongoDB Fallback

### Decision

Allow `USE_IN_MEMORY_DB=true` during local Phase 0 development when a MongoDB process is not available. The API still connects through `MONGODB_URI` after the memory server starts. Production must use a real MongoDB URI and must not enable this flag.

### Reason

Foundation verification requires a working Mongoose connection via environment configuration, even when Docker/local MongoDB is not installed yet.

### Status

Accepted.
