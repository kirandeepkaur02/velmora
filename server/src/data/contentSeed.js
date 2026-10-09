export const categorySeed = [
  ['Cleansers', 'cleansers'],
  ['Serums', 'serums'],
  ['Masks', 'masks'],
  ['Moisturizers', 'moisturizers'],
  ['Mist', 'mist'],
  ['Treatments', 'treatments'],
].map(([name, slug]) => ({ name, slug }));

export const ingredientSeed = [
  { name: 'Niacinamide', slug: 'niacinamide', description: 'A cosmetic ingredient used in skin-care formulations.', benefits: ['Helps support an even-looking complexion'] },
  { name: 'Oat', slug: 'oat', description: 'A botanical ingredient commonly used in gentle cleansing and comfort-focused formulas.', benefits: ['Supports a comfortable skin feel'] },
  { name: 'Rose clay', slug: 'rose-clay', description: 'A mineral clay used in rinse-off cosmetic treatments.', benefits: ['Helps absorb surface oil'] },
  { name: 'Ceramides', slug: 'ceramides', description: 'Lipids used in cosmetic formulations to support the skin barrier.', benefits: ['Supports moisture retention'] },
  { name: 'Green tea', slug: 'green-tea', description: 'A botanical extract used in a range of skin-care products.', benefits: ['Adds a botanical component to skin-care formulas'] },
  { name: 'Safflower', slug: 'safflower', description: 'A plant-derived oil used as an emollient in cosmetic formulas.', benefits: ['Helps soften skin'] },
  { name: 'Moss', slug: 'moss', description: 'A botanical extract included in selected skin-care formulations.', benefits: ['Adds a botanical component to skin-care formulas'] },
  { name: 'Lactic acid', slug: 'lactic-acid', description: 'An alpha hydroxy acid used in cosmetic exfoliating formulations.', benefits: ['Helps smooth the appearance of skin texture'] },
].map((ingredient) => ({ ...ingredient, active: true }));

export const routineSeed = [
  {
    name: 'Morning skincare',
    slug: 'morning-skincare',
    description: 'A considered sequence to start your daily skin-care ritual.',
    steps: [
      { title: 'Cleanse', description: 'Begin with a gentle cleanse.', productSlug: 'velvet-oat-cleanser' },
      { title: 'Hydrate', description: 'Layer a lightweight hydrating formula.', productSlug: 'botanical-dew-serum' },
      { title: 'Moisturize', description: 'Finish with a moisturizer that suits your routine.', productSlug: 'botanical-barrier-cream' },
    ],
  },
  {
    name: 'Evening skincare',
    slug: 'evening-skincare',
    description: 'A gentle evening ritual focused on cleansing and moisture.',
    steps: [
      { title: 'Cleanse', description: 'Remove the day with a gentle cleanser.', productSlug: 'velvet-oat-cleanser' },
      { title: 'Treat', description: 'Choose one treatment that suits your preferences.', productSlug: 'citrus-calm-peel' },
      { title: 'Nourish', description: 'Seal your routine with a nourishing formula.', productSlug: 'golden-bloom-oil' },
    ],
  },
  {
    name: 'Botanical body care',
    slug: 'botanical-body-care',
    description: 'Simple ideas for a botanical-inspired body-care ritual.',
    steps: [
      { title: 'Refresh', description: 'Start with a comfortable cleansing ritual.', productSlug: 'velvet-oat-cleanser' },
      { title: 'Hydrate', description: 'Add hydration to your everyday routine.', productSlug: 'sunlit-essence-mist' },
      { title: 'Restore', description: 'Finish with a moisturizer.', productSlug: 'moss-renewal-lotion' },
    ],
  },
];

export const articleSeed = [
  {
    title: 'A gentler daily cleanse',
    slug: 'a-gentler-daily-cleanse',
    excerpt: 'How to build a simple cleansing ritual around your skin’s comfort.',
    body: 'A gentle daily cleansing ritual can be simple. Choose a cleanser that suits your skin preferences, follow the product directions, and adjust your routine if a product causes discomfort.',
  },
  {
    title: 'Layering hydration',
    slug: 'layering-hydration',
    excerpt: 'A thoughtful approach to adding hydration without overcomplicating your routine.',
    body: 'Keep a hydration routine comfortable and uncomplicated. Follow product directions, introduce new products gradually, and select formulas based on your own skin preferences.',
  },
  {
    title: 'Getting to know botanicals',
    slug: 'getting-to-know-botanicals',
    excerpt: 'Explore ingredient labels and choose products that suit your preferences.',
    body: 'Ingredient lists help you understand what is in a cosmetic product. Review the full product information and choose products that fit your personal preferences.',
  },
].map((article) => ({ ...article, active: true }));

export const bundleSeed = [
  {
    name: 'Glow Ritual',
    slug: 'glow-ritual',
    description: 'A considered cleanse, serum, and moisturizer routine.',
    productSlugs: ['velvet-oat-cleanser', 'botanical-dew-serum', 'botanical-barrier-cream'],
  },
  {
    name: 'Hydration Ritual',
    slug: 'hydration-ritual',
    description: 'Layer a refreshing mist with a nourishing face oil.',
    productSlugs: ['sunlit-essence-mist', 'golden-bloom-oil', 'botanical-barrier-cream'],
  },
  {
    name: 'Botanical Starter Kit',
    slug: 'botanical-starter-kit',
    description: 'Begin with a gentle cleanser, botanical serum, and calming mask.',
    productSlugs: ['velvet-oat-cleanser', 'botanical-dew-serum', 'rose-clay-mask'],
  },
];

export const frequentlyBoughtTogetherSeed = [
  {
    slug: 'botanical-dew-serum',
    relatedSlugs: ['velvet-oat-cleanser', 'botanical-barrier-cream'],
  },
  {
    slug: 'velvet-oat-cleanser',
    relatedSlugs: ['botanical-dew-serum'],
  },
  {
    slug: 'botanical-barrier-cream',
    relatedSlugs: ['botanical-dew-serum'],
  },
];
