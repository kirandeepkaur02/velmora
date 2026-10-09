# Design System — Velmora

## 1. Design References

### Color reference

`design-references/01-color-theme-reference.png`

This image defines the primary visual palette.

### UI reference

`design-references/02-ui-design-reference.png`

This image defines the general composition, spacing, product presentation, botanical imagery and premium natural-beauty direction.

These are references, not assets to copy blindly.

---

# 2. Brand Direction

The brand name is **Velmora**. Display it as a wordmark in the header and footer. Do not invent a different store name.

The visual identity should communicate:

- Natural.
- Botanical.
- Premium.
- Warm.
- Calm.
- Clean.
- Modern.
- Trustworthy.
- Feminine without being overly decorative.

Avoid:

- Neon colors.
- Excessive gradients.
- Generic tech/SaaS aesthetics.
- Overly clinical medical aesthetics.
- Excessive rounded cards.
- Heavy shadows.
- Excessive animation.
- Visual clutter.

---

# 3. Color Tokens

Use CSS variables/design tokens so colors are centralized.

Approximate palette derived from the first reference image:

```css
:root {
  --color-sage: #8F9272;
  --color-dusty-rose: #A9664B;
  --color-blush: #D99A8B;
  --color-warm-beige: #E4C9AA;
  --color-cream: #F7F0E5;
  --color-coffee: #765038;
  --color-deep-green: #28402A;
  --color-soft-white: #FCF8F2;
  --color-text: #3F3A34;
  --color-muted: #746B61;
  --color-border: #D8C8B6;
}
```

Important:

- These values are a starting point.
- Preserve contrast and accessibility.
- Do not use every color on every section.
- Cream/warm beige should dominate.
- Sage/deep green should support the botanical identity.
- Dusty rose/blush should be used as accents.
- Coffee brown should be used for strong text/accent moments.

---

# 4. Color Usage

### Primary background

Warm cream / soft white.

### Primary brand color

Deep botanical green.

### Secondary

Sage green.

### Accent

Dusty rose / blush.

### Dark text

Coffee brown / deep charcoal.

### Borders

Soft beige/brown with low visual weight.

---

# 5. Typography

Use a sophisticated serif for major display headings and a clean sans-serif for UI/body.

Recommended pairing:

- Display: Playfair Display / Cormorant Garamond
- Body/UI: Inter / Manrope

Use only two font families unless there is a strong reason.

### Hierarchy

```text
Hero H1       Large, elegant serif
Section H2    Medium/large serif
Card title    Clean readable sans-serif
Body          Clean sans-serif
Labels        Small uppercase/medium-weight
Price         Strong but elegant
```

Avoid excessive font weights and decorative scripts for functional UI.

---

# 6. Layout

Use generous whitespace.

Desktop:

```text
Max content width: ~1200–1280px
Page side padding: ~24–48px
Section spacing: ~80–120px
```

Tablet:

```text
Side padding: ~24px
Section spacing: ~64–88px
```

Mobile:

```text
Side padding: ~16–20px
Section spacing: ~48–64px
```

Use a consistent spacing scale.

---

# 7. Homepage Composition

The homepage should follow the visual rhythm of the second reference:

```text
Announcement
    ↓
Header
    ↓
Hero / Product Story
    ↓
Trust / Natural Values
    ↓
Shop by Nature / Category
    ↓
Featured Products
    ↓
Brand/Nature Story
    ↓
Commitment / Sustainability
    ↓
Reviews
    ↓
CTA / Beauty Journey
    ↓
Newsletter
    ↓
Footer
```

Do not copy the exact reference content. Use the project's own brand and product data.

---

# 8. Hero

Hero should have:

- Strong serif headline.
- Short supporting copy.
- One primary CTA.
- One secondary CTA if needed.
- Premium product photography.
- Botanical/natural composition.
- Subtle texture or background treatment.

Suggested headline:

> Beauty, Rooted in Nature.

Suggested supporting copy:

> Thoughtfully crafted beauty essentials inspired by botanical ingredients and everyday rituals.

---

# 9. Product Cards

Product cards should be clean and premium.

Include:

- Image.
- Product name.
- Short descriptor.
- Price.
- Compare-at price where relevant.
- Rating.
- Wishlist.
- Add to cart.

Interaction:

- Gentle image transition on hover.
- No excessive motion.
- Clear focus state.
- Mobile touch targets at least comfortably tappable.

---

# 10. Buttons

Primary:

- Deep green background.
- Light text.
- Subtle hover state.

Secondary:

- Transparent/cream background.
- Coffee/dark-green border.
- Dark text.

Use consistent border radius.

Recommended:

```text
Buttons: 8–12px radius
Cards: 12–18px radius
Inputs: 8–12px radius
```

Do not make every element a pill.

---

# 11. Cards

Use subtle structure rather than heavy shadows.

Preferred:

- Cream/white background.
- Thin soft border.
- Very subtle shadow only where useful.
- Moderate radius.
- Consistent internal spacing.

---

# 12. Imagery

Photography direction:

- Natural daylight.
- Warm neutral surfaces.
- Botanical ingredients.
- Leaves, flowers, herbs, seeds.
- Stone/wood/linen textures.
- Premium product closeups.
- Human lifestyle imagery where useful.

Do not use low-quality random stock images.

Keep product photography visually consistent.

---

# 13. Botanical Decoration

Use botanical elements as supporting decoration.

Good:

- Small leaf illustrations.
- Fine botanical line art.
- Natural ingredient photography.
- Soft organic shapes.

Avoid:

- Large decorative leaves covering content.
- Excessive floral borders.
- Decorative elements reducing readability.

---

# 14. Motion

Use subtle motion only.

Allowed:

- Fade-in.
- Small translate-on-scroll.
- Product image hover.
- Button hover.
- Soft drawer transitions.
- Modal transitions.

Respect:

```css
@media (prefers-reduced-motion: reduce) {
  /* reduce non-essential motion */
}
```

No distracting parallax or continuous animations.

---

# 15. Responsive Design

Design mobile-first.

### Mobile

- Single-column product grids.
- Collapsible navigation.
- Sticky cart/checkout action where useful.
- Horizontal category scrolling only where it improves UX.
- Large readable typography.
- Touch-friendly controls.

### Desktop

- Spacious product grids.
- Full navigation.
- Two-column product detail.
- Rich editorial sections.

---

# 16. Accessibility

Required:

- Semantic HTML.
- Correct heading order.
- Keyboard support.
- Focus indicators.
- Accessible form labels.
- Alt text.
- Good color contrast.
- No information communicated by color alone.
- Buttons must have clear labels.
- Modals/drawers must manage focus correctly.

---

# 17. Design Implementation Rule

Create design tokens first.

Do not scatter values such as:

```css
color: #8F9272;
```

through dozens of files.

Prefer:

```css
color: var(--color-sage);
```

This makes the design system easy to evolve.

---

# 18. Reference Interpretation

Reference 1 = **palette + tactile botanical mood**.

Reference 2 = **layout + e-commerce visual direction**.

Combine them into:

> Warm botanical editorial design + clean premium e-commerce UX.

Do not reproduce brand names, logos, copy, or exact layouts from the reference images.
