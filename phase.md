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

---

# Phase 3 — Authentication & User Accounts

**Status:** Completed

### Implementation

- Added a real Mongo-backed user model with encrypted passwords.
- Added JWT-based login and register endpoints.
- Added auth middleware for protected routes.
- Integrated the client auth form with the API and token persistence.

### Acceptance

- Passwords are hashed.
- Protected API rejects unauthenticated requests.
- Customer cannot access another customer's data.
- Refresh/logout behavior is verified.
- Sensitive values are not exposed.

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
