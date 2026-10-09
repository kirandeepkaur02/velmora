# Product Requirements Document — Velmora

## 1. Product Overview

Build a production-quality natural cosmetics e-commerce platform using the MERN stack.

The website name and brand is **Velmora**.

The brand position is:

> **Velmora — premium natural beauty. Clean, botanical, modern, trustworthy.**

The website must feel like a real beauty brand rather than a generic MERN CRUD demo. Use the name Velmora in the page title, header/logo, footer, emails, metadata, and customer-facing copy.

### Primary goals

1. Present the brand and products beautifully.
2. Make product discovery fast and intuitive.
3. Support a complete shopping journey from browsing to payment to order tracking.
4. Provide a secure customer account system.
5. Provide a protected admin dashboard for products, inventory, customers, orders and analytics.
6. Demonstrate production-level engineering practices for a portfolio project.
7. Keep the architecture understandable and maintainable.

### Reference assets

- Color theme: `design-references/01-color-theme-reference.png`
- UI design reference: `design-references/02-ui-design-reference.png`

The first image is the **color and visual-language reference**.
The second image is the **layout/UI reference**.

Use the references for direction, not for pixel-for-pixel copying.

---

## 2. Target Users

### Customer

A customer should be able to:

- Browse products.
- Search and filter products.
- Explore products by category, ingredient and concern.
- View detailed product information.
- Add products to cart.
- Manage wishlist.
- Apply valid coupons.
- Checkout securely.
- Pay online.
- View orders.
- Track order status.
- Review purchased products.
- Manage profile and addresses.

### Admin

An admin should be able to:

- View dashboard metrics.
- Manage products.
- Manage product images.
- Manage categories and ingredients.
- Manage inventory.
- Manage orders.
- Update order status.
- Manage customers.
- Manage coupons.
- Moderate reviews.
- View basic sales analytics.

---

## 3. Core Customer Features

### 3.1 Home

Required sections:

1. Announcement bar.
2. Header/navigation.
3. Hero.
4. Shop by category.
5. Bestsellers.
6. Natural philosophy / trust features.
7. Shop by ingredient.
8. Shop by concern.
9. New arrivals.
10. Beauty routines.
11. Brand story.
12. Customer reviews.
13. Product bundles.
14. Journal/blog preview.
15. Newsletter.
16. Social proof.
17. Footer.

### 3.2 Product Discovery

Support:

- Search by product name.
- Category filtering.
- Price filtering.
- Rating filtering.
- Skin type filtering.
- Concern filtering.
- Ingredient filtering.
- Availability filtering.
- Sorting by newest, price and popularity.

Use server-side pagination.

### 3.3 Product Detail

Each product page should support:

- Product gallery.
- Product name.
- Short description.
- Price.
- Compare-at price when applicable.
- Rating.
- Review count.
- Availability.
- Stock status.
- Quantity selector.
- Add to cart.
- Buy now.
- Wishlist.
- Ingredients.
- Benefits.
- How to use.
- Suitable skin/hair type.
- Concerns.
- Shipping information.
- Related products.
- Frequently bought together.
- Reviews.

Never present unsupported medical or cosmetic claims as facts.

### 3.4 Cart

Cart must support:

- Add item.
- Remove item.
- Increase/decrease quantity.
- Stock validation.
- Price recalculation.
- Coupon application/removal.
- Subtotal.
- Discount.
- Shipping.
- Tax where applicable.
- Final total.

The backend is always the source of truth for price, stock and discount calculations.

### 3.5 Checkout

Checkout should include:

- Customer information.
- Shipping address.
- Order summary.
- Coupon.
- Shipping method.
- Payment method.
- Final amount.
- Payment status.

Do not trust client-supplied totals.

### 3.6 Orders

Order lifecycle:

`PENDING → CONFIRMED → PROCESSING → SHIPPED → OUT_FOR_DELIVERY → DELIVERED`

Possible exception states:

`CANCELLED`, `PAYMENT_FAILED`, `REFUNDED`

Customers can view:

- Order number.
- Items.
- Price.
- Shipping address.
- Payment status.
- Order status.
- Timeline.
- Created date.

### 3.7 Reviews

Only customers who purchased the product can create a verified review.

Support:

- Rating.
- Review text.
- Optional image.
- Edit/delete own review.
- Admin moderation.

---

## 4. Cosmetics-specific Differentiators

These features make the project different from a generic e-commerce clone.

### Ingredient Explorer

Users can browse ingredients and see:

- Ingredient name.
- Description.
- General cosmetic benefits.
- Products containing the ingredient.

### Concern Finder

A guided selector:

`Skin/Hair Type → Concern → Preferences → Recommended Products`

Keep recommendations rule-based in v1. Do not add machine learning unless it solves a real requirement.

### Beauty Routine Builder

Allow users to explore routines such as:

- Morning skincare.
- Night skincare.
- Hair care.
- Body care.

Each routine contains ordered product steps.

### Bundles

Support curated bundles such as:

- Glow Ritual.
- Hydration Ritual.
- Self-Care Set.
- Botanical Starter Kit.

---

## 5. Admin Requirements

### Dashboard

Show:

- Total revenue.
- Orders.
- Customers.
- Products.
- Low-stock products.
- Recent orders.
- Top products.
- Revenue trend.

### Product Management

Admin can:

- Create.
- Read.
- Update.
- Archive/delete according to business rules.
- Upload images.
- Set price.
- Set stock.
- Set category.
- Set ingredients.
- Set concerns.
- Set tags.
- Mark bestseller/new arrival.
- Configure bundle relationships.

Prefer soft deletion/archive for products referenced by historical orders.

### Inventory

Support:

- Current stock.
- Low-stock threshold.
- Stock adjustment.
- Out-of-stock status.
- Inventory history if practical.

### Order Management

Admin can:

- View orders.
- Filter orders.
- Update fulfillment status.
- View payment status.
- View customer/order details.

### Customer Management

Admin can:

- View customers.
- View customer order history.
- Disable accounts when required.
- Never view plaintext passwords.

---

## 6. Non-functional Requirements

### Performance

- Responsive UI.
- Lazy-load non-critical images.
- Optimize product images.
- Paginate large datasets.
- Avoid unnecessary API calls.
- Use caching only where it provides measurable value.

### Accessibility

Target WCAG-aware implementation:

- Semantic HTML.
- Keyboard navigation.
- Visible focus states.
- Accessible labels.
- Useful alt text.
- Sufficient contrast.
- Reduced-motion consideration.

### Security

Required:

- Password hashing with bcrypt or Argon2id.
- Secure authentication.
- HttpOnly/Secure/SameSite cookies where used.
- Short-lived access tokens if JWT architecture is selected.
- Refresh-token rotation/revocation strategy.
- RBAC.
- Server-side authorization.
- Backend validation.
- Rate limiting.
- Helmet/security headers.
- Strict CORS.
- NoSQL injection protection.
- XSS-safe rendering.
- CSRF protection where cookie-authenticated state-changing requests require it.
- Secure file upload validation.
- No secrets in frontend.
- HTTPS in production.
- Payment verification through backend/webhook.

### Privacy

Do not collect unnecessary personal data.

Do not log:

- Passwords.
- Access/refresh tokens.
- Payment secrets.
- Full sensitive payment information.

---

## 7. Success Criteria

The project is complete when:

- Customer can discover a product.
- Customer can add it to cart.
- Backend validates stock and price.
- Customer can complete checkout.
- Payment is verified server-side.
- Order is created only after valid payment/order conditions.
- Customer can see order status.
- Admin can manage the product/order lifecycle.
- Unauthorized users cannot access protected resources.
- Production build works on mobile and desktop.
- Core APIs have automated tests.
- README explains setup, architecture, environment variables and deployment.
