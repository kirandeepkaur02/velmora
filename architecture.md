# Architecture — Velmora

## 1. Architecture Principles

Use a modular MERN architecture with clear boundaries:

- React handles presentation and client interaction.
- Redux Toolkit handles global client state where needed.
- Express handles HTTP/API concerns.
- Services contain business logic.
- Mongoose handles MongoDB persistence.
- Controllers remain thin.
- Middleware handles cross-cutting concerns.
- Validation happens at API boundaries.
- Authorization happens on the server.
- External services are isolated behind service modules.

Do not put business logic directly into React components.

---

## 2. High-level Architecture

```text
Browser
  |
  v
React + Redux Toolkit
  |
  | HTTPS / REST
  v
Express API
  |
  +--> Auth Middleware
  +--> Validation Middleware
  +--> Authorization Middleware
  +--> Controllers
  +--> Services
  +--> Repositories / Models
  |
  +--> MongoDB
  +--> Cloudinary
  +--> Razorpay
  +--> Email Provider
```

---

## 3. Recommended Repository Structure

```text
natural-cosmetics/
├── client/
│   ├── src/
│   │   ├── app/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── store/
│   │   ├── utils/
│   │   └── main.jsx
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
│
├── docs/
├── tests/
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```

Adjust structure only when there is a concrete reason.

---

## 4. Frontend Architecture

### Pages

Customer:

- Home
- Shop
- Category
- ProductDetails
- SearchResults
- Wishlist
- Cart
- Checkout
- OrderSuccess
- Orders
- OrderDetails
- Profile
- Login
- Register
- ForgotPassword
- ResetPassword
- About
- Ingredients
- IngredientDetails
- Concerns
- Routines
- Journal
- Contact

Admin:

- AdminDashboard
- AdminProducts
- AdminProductForm
- AdminInventory
- AdminOrders
- AdminCustomers
- AdminReviews
- AdminCoupons

### State

Use Redux Toolkit for shared state:

- Authentication/session state.
- Cart.
- Wishlist.
- UI state where genuinely global.
- Server data only when caching through a deliberate data-fetching strategy.

Avoid putting every component state into Redux.

---

## 5. Backend Layers

### Route

Responsible for URL mapping and middleware composition.

### Controller

Responsible for:

- Reading request data.
- Calling service methods.
- Returning response.
- Mapping known errors.

### Service

Responsible for:

- Business rules.
- Pricing.
- Coupon rules.
- Inventory rules.
- Order creation.
- Payment orchestration.
- Recommendation logic.

### Model

Responsible for:

- MongoDB schema.
- Indexes.
- Persistence-level constraints.

### Validator

Responsible for:

- Request body validation.
- Query validation.
- Params validation.

---

## 6. Core Data Models

### User

```text
_id
name
email
passwordHash
role
phone
addresses[]
isActive
createdAt
updatedAt
```

### Product

```text
_id
name
slug
description
shortDescription
images[]
price
compareAtPrice
stock
lowStockThreshold
category
ingredients[]
concerns[]
skinTypes[]
hairTypes[]
benefits[]
howToUse
isActive
isBestseller
isNew
createdAt
updatedAt
```

### Category

```text
_id
name
slug
description
image
isActive
```

### Ingredient

```text
_id
name
slug
description
benefits[]
image
```

### Coupon

```text
_id
code
type
value
minimumOrderValue
maximumDiscount
usageLimit
usedCount
expiresAt
isActive
```

### Cart

```text
_id
userId
items[]
updatedAt
```

Never persist trusted final price from the client as the source of truth.

### Order

```text
_id
orderNumber
userId
items[]
shippingAddress
subtotal
discount
shipping
tax
total
coupon
paymentStatus
paymentProvider
paymentReference
orderStatus
statusHistory[]
createdAt
updatedAt
```

### Review

```text
_id
productId
userId
orderId
rating
comment
images[]
isVerifiedPurchase
isApproved
createdAt
updatedAt
```

---

## 7. API Convention

Base:

`/api/v1`

Examples:

```text
GET    /api/v1/products
GET    /api/v1/products/:id
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/me
GET    /api/v1/cart
POST   /api/v1/cart/items
PATCH  /api/v1/cart/items/:id
DELETE /api/v1/cart/items/:id
POST   /api/v1/coupons/validate
POST   /api/v1/orders
GET    /api/v1/orders
GET    /api/v1/orders/:id
POST   /api/v1/payments/create
POST   /api/v1/payments/webhook
```

Admin:

```text
GET    /api/v1/admin/products
POST   /api/v1/admin/products
PATCH  /api/v1/admin/products/:id
DELETE /api/v1/admin/products/:id
GET    /api/v1/admin/orders
PATCH  /api/v1/admin/orders/:id/status
GET    /api/v1/admin/customers
```

Use consistent HTTP status codes and response shapes.

---

## 8. Authentication Architecture

Preferred approach:

```text
Login
  |
  v
Validate credentials
  |
  v
Create short-lived access token
  +
Create refresh token
  |
  v
Secure HttpOnly cookie for refresh token
```

If access tokens are stored client-side, minimize their lifetime and do not put sensitive information in JWT payloads.

Implement refresh-token rotation and revocation.

Never store password hashes in frontend responses.

---

## 9. Authorization

Use RBAC:

```text
CUSTOMER
ADMIN
```

Authorization must be enforced on the API.

Frontend route guards are UX only; they are not security controls.

---

## 10. Payment Architecture

Use Razorpay or Stripe.

```text
Client
  |
  v
Backend creates payment order/session
  |
  v
Payment Provider
  |
  v
Customer pays
  |
  v
Provider webhook
  |
  v
Backend verifies signature/event
  |
  v
Update payment + order
```

Never mark an order as paid solely because the frontend reports success.

---

## 11. File Upload Architecture

Use Cloudinary or object storage.

```text
Admin
  |
  v
Backend validation
  |
  v
Cloudinary
  |
  v
Store safe asset URL/public ID
```

Validate file type, size and content. Do not trust filenames.

---

## 12. Error Architecture

Use centralized error middleware.

Response example:

```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found"
  }
}
```

Do not expose stack traces in production.

---

## 13. Deployment Architecture

```text
GitHub
  |
  v
GitHub Actions
  |
  +--> Test
  +--> Lint
  +--> Build
  |
  v
Frontend Hosting
Backend Hosting
  |
  v
MongoDB Atlas

External:
Cloudinary
Razorpay/Stripe
Email Provider
Sentry
```

Use environment variables/secrets in deployment.

---

## 14. Scalability Rules

Start simple.

Do not introduce microservices, Kubernetes or complex event-driven infrastructure for v1.

Use:

- Modular monolith.
- Proper indexes.
- Pagination.
- Efficient queries.
- Image optimization.
- Optional Redis only when there is a demonstrated caching/rate-limit need.

The architecture should be easy to explain in an interview.
