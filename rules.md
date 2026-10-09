# Cursor AI Engineering Rules

These rules apply to every implementation phase.

## 1. General

- Read `product-requirements.md`, `architecture.md`, `design.md`, `decisions.md` and the current `phase.md` before making major changes.
- Implement only the current phase unless a dependency is required.
- Do not rewrite working features without a concrete reason.
- Prefer small, reviewable changes.
- Do not create duplicate components, services or utilities.
- Reuse existing patterns.
- Keep naming consistent.
- Do not invent requirements.
- The website and brand name is **Velmora**. Use it in UI copy, metadata, and customer-facing surfaces.

## 2. Technology Rules

- Frontend: React.
- Styling: Tailwind CSS unless the existing project establishes another styling system.
- State: Redux Toolkit for shared client state.
- Routing: React Router.
- Backend: Node.js + Express.
- Database: MongoDB + Mongoose.
- API style: versioned REST API.
- Validation: Zod/Joi/express-validator; use one validation approach consistently.
- Authentication: secure token/session architecture documented in `decisions.md`.
- Payments: Razorpay or Stripe.
- Images: Cloudinary or approved object storage.
- Testing: Jest/Vitest + Supertest/React Testing Library as appropriate.
- GitHub is the source-control system.

## 3. Code Quality

- Use clear, descriptive names.
- Keep functions focused.
- Avoid giant React components.
- Avoid giant Express controllers.
- Move business logic into services.
- Avoid duplicated validation/business rules.
- Keep API response shapes consistent.
- Handle loading, empty, success and error states.
- Avoid unnecessary abstraction.
- Prefer composition over inheritance.
- Do not add dependencies without a reason.

## 4. Security — Non-negotiable

- Never trust frontend prices, totals, stock or discount values.
- Never trust frontend role/permission claims.
- Never trust payment success reported only by the browser.
- Validate all external input server-side.
- Authorize every protected resource.
- Prevent users from accessing another user's orders/data.
- Hash passwords with bcrypt or Argon2id.
- Never return password hashes.
- Keep secrets server-side.
- Never commit `.env`.
- Use secure cookies when cookies are used for authentication.
- Configure CORS explicitly.
- Use Helmet/security headers.
- Rate-limit sensitive endpoints.
- Protect against NoSQL injection.
- Avoid unsafe HTML rendering/XSS.
- Validate uploads.
- Do not log secrets or tokens.
- Do not expose stack traces in production.

## 5. E-commerce Rules

- Server/database is the source of truth for product price.
- Recalculate order totals on the server.
- Recheck stock during order creation.
- Coupon validity is checked server-side.
- Never allow negative quantity.
- Never allow purchasing more than available stock.
- Historical orders must preserve the price/quantity at purchase time.
- Prefer archiving products over hard deletion when historical orders reference them.
- Payment webhooks must be verified.
- Order/payment updates should be idempotent where applicable.

## 6. Frontend Rules

- Do not place secrets in React environment variables.
- Use accessible semantic HTML.
- Every image needs meaningful alt text unless decorative.
- Buttons must communicate action.
- Forms need validation and useful error messages.
- Do not block the whole application with unnecessary global loading states.
- Use skeletons for meaningful content-loading states where appropriate.
- Mobile-first responsive design.
- Keep visual styles consistent with `design.md`.

## 7. API Rules

- Use `/api/v1`.
- Use correct HTTP methods.
- Use appropriate status codes.
- Validate params, query and body.
- Return predictable JSON.
- Do not leak database implementation details.
- Centralize error handling.
- Protect admin endpoints with server-side RBAC.

## 8. Database Rules

- Add indexes for frequent queries.
- Use normalized references where appropriate.
- Avoid unbounded arrays in documents.
- Use timestamps.
- Validate important fields at both API and schema levels.
- Never expose MongoDB credentials.

## 9. Testing Rules

Every important business rule must have tests.

Prioritize:

- Authentication.
- Authorization.
- Product retrieval.
- Cart totals.
- Coupon validation.
- Stock validation.
- Order creation.
- Payment verification.
- Admin permissions.

Do not write tests that only test implementation details.

## 10. Git Rules

Use small commits.

Examples:

```text
feat: add product listing API
feat: add cart persistence
fix: prevent invalid coupon discount
test: add order authorization tests
refactor: extract checkout service
docs: update setup instructions
```

Never commit:

- `.env`
- credentials
- API keys
- production secrets
- generated large build artifacts unless intentionally required.

## 11. Cursor Agent Behavior

Before coding:

1. Inspect existing files.
2. Identify the smallest affected area.
3. Explain the plan briefly.
4. Implement.
5. Run relevant tests/lint/build.
6. Fix errors.
7. Summarize changed files and verification.

If a requirement conflicts with existing architecture, stop and update `decisions.md` rather than silently changing architecture.

Do not mark a phase complete if its acceptance criteria have not been verified.

## 12. Definition of Done

A feature is done only when:

- It works.
- It is integrated with the existing architecture.
- It handles errors.
- It is responsive where applicable.
- It is accessible where applicable.
- Security implications are addressed.
- Tests exist for important business logic.
- No obvious console/build/lint errors remain.
- Documentation is updated when behavior/architecture changes.

