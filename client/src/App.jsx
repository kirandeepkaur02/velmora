import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const navItems = ['Home', 'Shop', 'Ingredients', 'Routines', 'Journal', 'About'];

const categories = [
  { name: 'Cleansers', tone: 'sage' },
  { name: 'Serums', tone: 'rose' },
  { name: 'Moisturizers', tone: 'sand' },
  { name: 'Body care', tone: 'green' },
];

const trustFeatures = ['Vegan formulas', 'Cruelty free', 'Clinically gentle', 'Small-batch crafted'];

const reviews = [
  {
    name: 'Aisha M.',
    quote: 'Velmora feels like a ritual — beautiful textures, real results, and ingredients I trust.',
  },
  {
    name: 'Leah R.',
    quote: 'The glow serum is a permanent part of my routine. It feels premium without being fussy.',
  },
  {
    name: 'Sofia T.',
    quote: 'Thoughtful packaging, calming scents, and formulas that actually respect sensitive skin.',
  },
];

const products = [
  {
    id: 1,
    name: 'Botanical Dew Serum',
    category: 'Serums',
    ingredient: 'Niacinamide',
    concern: 'Glow',
    skinType: 'All skin types',
    price: 48,
    compareAt: 62,
    rating: 4.9,
    reviews: 130,
    stock: 12,
    isNew: true,
    badge: 'Bestseller',
    accent: 'rose',
    description: 'Weightless hydration and radiance support for a dewy, balanced complexion.',
    benefits: ['Plumps skin', 'Boosts glow', 'Supports barrier'],
    ingredients: ['Niacinamide', 'Oat extract', 'Rose water'],
    format: '30 ml',
  },
  {
    id: 2,
    name: 'Velvet Oat Cleanser',
    category: 'Cleansers',
    ingredient: 'Oat',
    concern: 'Sensitivity',
    skinType: 'Dry skin',
    price: 34,
    compareAt: 44,
    rating: 4.8,
    reviews: 92,
    stock: 8,
    isNew: false,
    badge: 'Gentle',
    accent: 'sage',
    description: 'A creamy, low-foam cleanser that comforts and softens without stripping moisture.',
    benefits: ['Comforts skin', 'Removes buildup', 'Maintains softness'],
    ingredients: ['Colloidal oat', 'Chamomile', 'Ceramides'],
    format: '120 ml',
  },
  {
    id: 3,
    name: 'Rose Clay Mask',
    category: 'Masks',
    ingredient: 'Rose clay',
    concern: 'Detox',
    skinType: 'Combination skin',
    price: 42,
    compareAt: 54,
    rating: 4.7,
    reviews: 68,
    stock: 0,
    isNew: true,
    badge: 'New',
    accent: 'sand',
    description: 'A purifying clay treatment that lavishes skin with softness after a deep-cleanse ritual.',
    benefits: ['Absorbs excess oil', 'Smooths texture', 'Refines pores'],
    ingredients: ['Rose clay', 'Aloe vera', 'Kaolin'],
    format: '75 g',
  },
  {
    id: 4,
    name: 'Botanical Barrier Cream',
    category: 'Moisturizers',
    ingredient: 'Ceramides',
    concern: 'Dryness',
    skinType: 'Sensitive skin',
    price: 56,
    compareAt: 68,
    rating: 5,
    reviews: 145,
    stock: 15,
    isNew: false,
    badge: 'Best value',
    accent: 'green',
    description: 'A cushioning cream that hydrates deeply while reinforcing a resilient skin barrier.',
    benefits: ['Deep hydration', 'Comforts sensitivity', 'Locks in moisture'],
    ingredients: ['Ceramides', 'Squalane', 'Calendula'],
    format: '50 ml',
  },
  {
    id: 5,
    name: 'Sunlit Essence Mist',
    category: 'Mist',
    ingredient: 'Green tea',
    concern: 'Hydration',
    skinType: 'All skin types',
    price: 28,
    compareAt: 36,
    rating: 4.6,
    reviews: 54,
    stock: 22,
    isNew: false,
    badge: 'Refreshing',
    accent: 'sage',
    description: 'A soothing facial mist that refreshes and comforts the skin between cleansing and hydration.',
    benefits: ['Refreshes skin', 'Adds hydration', 'Helps prep layers'],
    ingredients: ['Green tea', 'Hyaluronic acid', 'Aloe'],
    format: '80 ml',
  },
  {
    id: 6,
    name: 'Golden Bloom Oil',
    category: 'Serums',
    ingredient: 'Safflower',
    concern: 'Fine lines',
    skinType: 'Mature skin',
    price: 64,
    compareAt: 78,
    rating: 4.9,
    reviews: 118,
    stock: 6,
    isNew: true,
    badge: 'Luxury',
    accent: 'rose',
    description: 'A silky facial oil that restores softness and adds a luminous finish with nourishing botanicals.',
    benefits: ['Smooths texture', 'Adds luminosity', 'Supports hydration'],
    ingredients: ['Safflower', 'Camellia', 'Vitamin E'],
    format: '30 ml',
  },
  {
    id: 7,
    name: 'Moss Renewal Lotion',
    category: 'Moisturizers',
    ingredient: 'Moss',
    concern: 'Dullness',
    skinType: 'Normal skin',
    price: 39,
    compareAt: 50,
    rating: 4.5,
    reviews: 47,
    stock: 10,
    isNew: false,
    badge: 'Daily staple',
    accent: 'green',
    description: 'A lightweight lotion with botanical extracts to improve suppleness and radiance.',
    benefits: ['Hydrates', 'Softens texture', 'Boosts radiance'],
    ingredients: ['Moss extract', 'Peptides', 'Shea butter'],
    format: '60 ml',
  },
  {
    id: 8,
    name: 'Citrus Calm Peel',
    category: 'Treatments',
    ingredient: 'Lactic acid',
    concern: 'Texture',
    skinType: 'Normal to dry skin',
    price: 52,
    compareAt: 66,
    rating: 4.7,
    reviews: 71,
    stock: 4,
    isNew: true,
    badge: 'Glow ritual',
    accent: 'sand',
    description: 'A gentle resurfacing treatment that smooths texture without leaving skin feeling raw.',
    benefits: ['Refines texture', 'Smooths tone', 'Improves brightness'],
    ingredients: ['Lactic acid', 'Papaya', 'Hyaluronic acid'],
    format: '50 ml',
  },
];

const ingredientOptions = ['All', 'Niacinamide', 'Oat', 'Rose clay', 'Ceramides', 'Green tea', 'Safflower'];
const concernOptions = ['All', 'Glow', 'Sensitivity', 'Detox', 'Dryness', 'Hydration', 'Fine lines', 'Texture'];
const priceOptions = [50, 75, 100];
const couponCatalog = {
  VELMORA10: 0.1,
  SKINCARE15: 0.15,
  BLOOM20: 0.2,
};

function App() {
  const [view, setView] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedIngredient, setSelectedIngredient] = useState('All');
  const [selectedConcern, setSelectedConcern] = useState('All');
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(products[0]);
  const [cart, setCart] = useState([
    { product: products[0], quantity: 1 },
    { product: products[1], quantity: 1 },
  ]);
  const [wishlist, setWishlist] = useState([1, 6]);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('VELMORA10');
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('velmora_token');
    if (!token) {
      return;
    }

    fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Session expired');
        }

        const payload = await response.json();
        setUser(payload.data.user);
      })
      .catch(() => {
        localStorage.removeItem('velmora_token');
        setUser(null);
      });
  }, []);

  const isInWishlist = (productId) => wishlist.includes(productId);

  const toggleWishlist = (productId) => {
    setWishlist((current) =>
      current.includes(productId)
        ? current.filter((item) => item !== productId)
        : [...current, productId],
    );
  };

  const addToCart = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId, delta) => {
    setCart((current) =>
      current
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (productId) => {
    setCart((current) => current.filter((item) => item.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = appliedCoupon ? subtotal * (couponCatalog[appliedCoupon] ?? 0) : 0;
  const shipping = subtotal > 75 ? 0 : cart.length > 0 ? 9 : 0;
  const total = Math.max(0, subtotal - discount + shipping);

  const filteredProducts = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    const nextProducts = products.filter((product) => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesIngredient = selectedIngredient === 'All' || product.ingredient === selectedIngredient;
      const matchesConcern = selectedConcern === 'All' || product.concern === selectedConcern;
      const matchesRating = product.rating >= minRating;
      const matchesPrice = product.price <= maxPrice;
      const matchesSearch =
        !normalized ||
        product.name.toLowerCase().includes(normalized) ||
        product.description.toLowerCase().includes(normalized) ||
        product.ingredients.some((ingredient) => ingredient.toLowerCase().includes(normalized));

      return matchesCategory && matchesIngredient && matchesConcern && matchesRating && matchesPrice && matchesSearch;
    });

    switch (sortBy) {
      case 'price-low':
        return [...nextProducts].sort((a, b) => a.price - b.price);
      case 'price-high':
        return [...nextProducts].sort((a, b) => b.price - a.price);
      case 'rating':
        return [...nextProducts].sort((a, b) => b.rating - a.rating);
      case 'newest':
        return [...nextProducts].sort((a, b) => Number(b.isNew) - Number(a.isNew));
      default:
        return [...nextProducts].sort((a, b) => b.rating * b.reviews - a.rating * a.reviews);
    }
  }, [selectedCategory, selectedConcern, selectedIngredient, maxPrice, minRating, search, sortBy]);

  const pageSize = 4;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const pagedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleViewChange = (nextView) => {
    setView(nextView);
  };

  const resetFilters = () => {
    setSelectedCategory('All');
    setSelectedIngredient('All');
    setSelectedConcern('All');
    setMinRating(0);
    setMaxPrice(100);
    setSearch('');
    setSortBy('featured');
    setCurrentPage(1);
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const endpoint = authMode === 'register' ? 'register' : 'login';
      const payload = {
        name: authForm.name.trim(),
        email: authForm.email.trim(),
        password: authForm.password,
      };

      if (!payload.email || !payload.password || (authMode === 'register' && !payload.name)) {
        throw new Error('Please complete all required fields.');
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authMode === 'register' ? payload : { email: payload.email, password: payload.password }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Authentication failed.');
      }

      localStorage.setItem('velmora_token', data.data.token);
      setUser(data.data.user);
      setView('account');
      setAuthForm({ name: '', email: '', password: '' });
    } catch (error) {
      setAuthError(error.message || 'Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleApplyCoupon = () => {
    const normalized = couponCode.trim().toUpperCase();
    if (couponCatalog[normalized]) {
      setAppliedCoupon(normalized);
    } else {
      setAppliedCoupon('');
    }
  };

  const handlePlaceOrder = () => {
    setOrderPlaced(true);
    setCart([]);
  };

  const renderHome = () => (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <p className="eyebrow">Natural cosmetics</p>
          <h1>Beauty, rooted in nature.</h1>
          <p className="lede">
            Thoughtfully crafted beauty essentials inspired by botanical ingredients and everyday rituals.
          </p>

          <div className="hero-actions">
            <button type="button" className="button button-primary" onClick={() => handleViewChange('shop')}>
              Shop bestsellers
            </button>
            <button type="button" className="button button-secondary" onClick={() => handleViewChange('shop')}>
              Explore routines
            </button>
          </div>

          <div className="hero-metrics">
            <div>
              <strong>98%</strong>
              <span>botanical ingredients</span>
            </div>
            <div>
              <strong>4.9/5</strong>
              <span>shop rating</span>
            </div>
            <div>
              <strong>24h</strong>
              <span>dispatch</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="visual-card main-card">
            <div className="card-badge">Best seller</div>
            <div className="product-visual product-visual--rose" />
            <div className="product-meta">
              <div>
                <span className="label">Botanical Dew Serum</span>
                <h3>Glow Ritual</h3>
              </div>
              <strong>$48</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <div className="container trust-inner">
          {trustFeatures.map((feature) => (
            <span key={feature} className="trust-pill">
              {feature}
            </span>
          ))}
        </div>
      </section>

      <section className="container section-block">
        <div className="section-heading">
          <p className="eyebrow">Shop by nature</p>
          <h2>Curated for every ritual.</h2>
        </div>

        <div className="category-grid">
          {categories.map((category) => (
            <article key={category.name} className={`category-card category-card--${category.tone}`}>
              <div className="category-art" aria-hidden="true" />
              <div className="category-content">
                <span className="label">Essentials</span>
                <h3>{category.name}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="container section-block">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">Bestsellers</p>
            <h2>Glow-boosting favorites.</h2>
          </div>
          <button type="button" className="text-button" onClick={() => handleViewChange('shop')}>
            View all products
          </button>
        </div>

        <div className="product-grid">
          {products.slice(0, 4).map((product) => (
            <article key={product.id} className="product-card">
              <div className={`product-image product-image--${product.accent}`} aria-hidden="true" />
              <div className="product-card-body">
                <span className="label">{product.badge}</span>
                <h3>{product.name}</h3>
                <div className="price-row">
                  <strong>${product.price}</strong>
                  <span>${product.compareAt}</span>
                </div>
                <button type="button" className="button button-primary full-width" onClick={() => { setSelectedProduct(product); setView('detail'); }}>
                  View details
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="story-panel">
        <div className="container story-layout">
          <div className="story-copy">
            <p className="eyebrow">Our philosophy</p>
            <h2>Clean beauty, honest ingredients.</h2>
            <p>
              We believe skin-first routines should feel elevated, effective, and deeply nourishing. Every Velmora formula is designed to support a calmer, healthier ritual.
            </p>
            <div className="story-points">
              <div>
                <strong>Botanical first</strong>
                <span>Concentrated, skin-kind ingredients.</span>
              </div>
              <div>
                <strong>Thoughtful formulas</strong>
                <span>Free from unnecessary irritants.</span>
              </div>
            </div>
          </div>
          <div className="story-visual" aria-hidden="true">
            <div className="story-glow" />
          </div>
        </div>
      </section>

      <section className="container section-block">
        <div className="section-heading">
          <p className="eyebrow">Customer love</p>
          <h2>Real routines, real results.</h2>
        </div>

        <div className="review-grid">
          {reviews.map((review) => (
            <article key={review.name} className="review-card">
              <div className="stars" aria-label="Five star review">
                ★★★★★
              </div>
              <p>“{review.quote}”</p>
              <strong>{review.name}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="container section-block newsletter-box">
        <div>
          <p className="eyebrow">Stay in bloom</p>
          <h2>Receive rituals, tips, and early access.</h2>
        </div>
        <button type="button" className="button button-primary">
          Join the newsletter
        </button>
      </section>
    </>
  );

  const renderShop = () => (
    <section className="container shop-page">
      <div className="shop-header-row">
        <div>
          <p className="eyebrow">Shop the collection</p>
          <h2>Premium natural essentials.</h2>
        </div>
        <div className="shop-results-meta">{filteredProducts.length} products</div>
      </div>

      <div className="shop-layout">
        <aside className="shop-sidebar">
          <div className="filter-block">
            <label htmlFor="search">Search</label>
            <input id="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" />
          </div>

          <div className="filter-block">
            <label htmlFor="category">Category</label>
            <select id="category" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
              <option value="All">All categories</option>
              {['Cleansers', 'Serums', 'Moisturizers', 'Masks', 'Mist', 'Treatments'].map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="filter-block">
            <label htmlFor="ingredient">Ingredient</label>
            <select id="ingredient" value={selectedIngredient} onChange={(event) => setSelectedIngredient(event.target.value)}>
              {ingredientOptions.map((ingredient) => (
                <option key={ingredient} value={ingredient}>{ingredient === 'All' ? 'Any ingredient' : ingredient}</option>
              ))}
            </select>
          </div>

          <div className="filter-block">
            <label htmlFor="concern">Concern</label>
            <select id="concern" value={selectedConcern} onChange={(event) => setSelectedConcern(event.target.value)}>
              {concernOptions.map((concern) => (
                <option key={concern} value={concern}>{concern === 'All' ? 'Any concern' : concern}</option>
              ))}
            </select>
          </div>

          <div className="filter-block">
            <label htmlFor="rating">Minimum rating</label>
            <select id="rating" value={minRating} onChange={(event) => setMinRating(Number(event.target.value))}>
              <option value={0}>Any rating</option>
              <option value={4.5}>4.5+</option>
              <option value={4.7}>4.7+</option>
              <option value={4.9}>4.9+</option>
            </select>
          </div>

          <div className="filter-block">
            <label htmlFor="price">Max price</label>
            <select id="price" value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))}>
              {priceOptions.map((price) => (
                <option key={price} value={price}>Up to ${price}</option>
              ))}
              <option value={100}>Up to $100</option>
            </select>
          </div>

          <button type="button" className="button button-secondary filter-reset" onClick={resetFilters}>
            Reset filters
          </button>
        </aside>

        <div className="shop-content">
          <div className="shop-toolbar">
            <div className="toolbar-sort">
              <label htmlFor="sortBy">Sort by</label>
              <select id="sortBy" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="rating">Top rated</option>
              </select>
            </div>
          </div>

          <div className="product-grid product-grid--catalog">
            {pagedProducts.length > 0 ? (
              pagedProducts.map((product) => (
                <article key={product.id} className="product-card">
                  <div className={`product-image product-image--${product.accent}`} aria-hidden="true" />
                  <div className="product-card-body">
                    <span className="label">{product.badge}</span>
                    <h3>{product.name}</h3>
                    <div className="product-card-meta">
                      <span>{product.category}</span>
                      <span>{product.rating} ★</span>
                    </div>
                    <div className="price-row">
                      <strong>${product.price}</strong>
                      <span>${product.compareAt}</span>
                    </div>
                    <button type="button" className="button button-primary full-width" onClick={() => { setSelectedProduct(product); setView('detail'); }}>
                      {product.stock > 0 ? 'View details' : 'Sold out'}
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <h3>No products match this filter.</h3>
                <p>Try clearing a filter or broadening your search criteria.</p>
                <button type="button" className="button button-primary" onClick={resetFilters}>
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {filteredProducts.length > 0 && (
            <div className="pagination">
              <button type="button" className="button button-secondary" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button type="button" className="button button-secondary" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );

  const renderDetail = () => (
    <section className="container detail-page">
      <button type="button" className="text-button" onClick={() => handleViewChange('shop')}>
        ← Back to shop
      </button>

      {selectedProduct && (
        <div className="detail-layout">
          <div className="detail-gallery">
            <div className={`detail-view detail-view--${selectedProduct.accent}`} aria-hidden="true" />
            <div className="detail-thumbs">
              <div className={`detail-thumb detail-thumb--${selectedProduct.accent}`} />
              <div className={`detail-thumb detail-thumb--${selectedProduct.accent} detail-thumb--soft`} />
              <div className={`detail-thumb detail-thumb--${selectedProduct.accent} detail-thumb--muted`} />
            </div>
          </div>

          <div className="detail-content">
            <div className="detail-badges">
              <span className="label">{selectedProduct.badge}</span>
              <span className="label">{selectedProduct.category}</span>
            </div>
            <h2>{selectedProduct.name}</h2>
            <p className="detail-rating">{selectedProduct.rating} ★ • {selectedProduct.reviews} reviews</p>
            <p className="detail-description">{selectedProduct.description}</p>

            <div className="detail-price-row">
              <strong>${selectedProduct.price}</strong>
              <span>${selectedProduct.compareAt}</span>
            </div>

            <div className="detail-actions">
              <button type="button" className="button button-primary" onClick={() => addToCart(selectedProduct)}>
                Add to cart
              </button>
              <button type="button" className="button button-secondary" onClick={() => toggleWishlist(selectedProduct.id)}>
                {isInWishlist(selectedProduct.id) ? 'Saved' : 'Save for later'}
              </button>
            </div>

            <div className="detail-meta-grid">
              <div>
                <span>Skin type</span>
                <strong>{selectedProduct.skinType}</strong>
              </div>
              <div>
                <span>Format</span>
                <strong>{selectedProduct.format}</strong>
              </div>
              <div>
                <span>Availability</span>
                <strong>{selectedProduct.stock > 0 ? `${selectedProduct.stock} in stock` : 'Out of stock'}</strong>
              </div>
            </div>

            <div className="detail-section">
              <h3>Benefits</h3>
              <ul>
                {selectedProduct.benefits.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
            </div>

            <div className="detail-section">
              <h3>Key ingredients</h3>
              <div className="ingredient-pills">
                {selectedProduct.ingredients.map((ingredient) => (
                  <span key={ingredient} className="ingredient-pill">{ingredient}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );

  const renderAuth = () => (
    <section className="container auth-page">
      <div className="auth-card">
        <div className="auth-tabs">
          <button type="button" className={authMode === 'login' ? 'auth-tab active' : 'auth-tab'} onClick={() => setAuthMode('login')}>
            Login
          </button>
          <button type="button" className={authMode === 'register' ? 'auth-tab active' : 'auth-tab'} onClick={() => setAuthMode('register')}>
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={handleAuthSubmit}>
          {authMode === 'register' && (
            <label>
              Full name
              <input type="text" value={authForm.name} onChange={(event) => setAuthForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ava Jordan" />
            </label>
          )}

          <label>
            Email
            <input type="email" value={authForm.email} onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))} placeholder="you@example.com" required />
          </label>

          <label>
            Password
            <input type="password" value={authForm.password} onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))} placeholder="••••••••" required />
          </label>

          {authError && <p className="auth-error">{authError}</p>}

          <button type="submit" className="button button-primary auth-submit" disabled={authLoading}>
            {authLoading ? 'Please wait...' : authMode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </section>
  );

  const renderAccount = () => (
    <section className="container account-page">
      <div className="account-header">
        <div>
          <p className="eyebrow">My account</p>
          <h2>Hello, {user?.name || 'Velmora customer'}.</h2>
        </div>
        <button type="button" className="button button-secondary" onClick={() => {
          localStorage.removeItem('velmora_token');
          setUser(null);
          setView('auth');
        }}>
          Logout
        </button>
      </div>

      <div className="account-grid">
        <div className="account-panel">
          <h3>Profile</h3>
          <p>{user?.email}</p>
          <p>Member since Jan 2026</p>
        </div>

        <div className="account-panel">
          <h3>Addresses</h3>
          <p>12 Willow Road</p>
          <p>Fitzroy, Victoria</p>
        </div>

        <div className="account-panel">
          <h3>Wishlist</h3>
          <ul>
            {products.filter((product) => wishlist.includes(product.id)).map((product) => (
              <li key={product.id}>{product.name}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );

  const renderCart = () => (
    <section className="container cart-page">
      <div className="section-heading">
        <p className="eyebrow">Your cart</p>
        <h2>{cart.length} items selected.</h2>
      </div>

      {cart.length === 0 ? (
        <div className="empty-state cart-empty">
          <h3>Your bag is empty.</h3>
          <button type="button" className="button button-primary" onClick={() => setView('shop')}>
            Continue shopping
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cart.map(({ product, quantity }) => (
              <div key={product.id} className="cart-item">
                <div className={`mini-product mini-product--${product.accent}`} aria-hidden="true" />
                <div className="cart-item-copy">
                  <h3>{product.name}</h3>
                  <p>{product.category}</p>
                </div>
                <div className="quantity-stepper">
                  <button type="button" onClick={() => updateCartQuantity(product.id, -1)}>-</button>
                  <span>{quantity}</span>
                  <button type="button" onClick={() => updateCartQuantity(product.id, 1)}>+</button>
                </div>
                <strong>${product.price * quantity}</strong>
                <button type="button" className="remove-button" onClick={() => removeFromCart(product.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>

          <aside className="summary-box">
            <h3>Order summary</h3>
            <div className="summary-row">
              <span>Subtotal</span>
              <strong>${subtotal}</strong>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <strong>{shipping === 0 ? 'Free' : `$${shipping}`}</strong>
            </div>
            <div className="summary-row">
              <span>Discount</span>
              <strong>- ${discount.toFixed(2)}</strong>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <strong>${total.toFixed(2)}</strong>
            </div>
            <button type="button" className="button button-primary full-width" onClick={() => setView('checkout')}>
              Proceed to checkout
            </button>
          </aside>
        </div>
      )}
    </section>
  );

  const renderCheckout = () => (
    <section className="container checkout-page">
      <div className="section-heading">
        <p className="eyebrow">Checkout</p>
        <h2>Secure payment.</h2>
      </div>

      {orderPlaced ? (
        <div className="confirm-box">
          <h3>Order confirmed!</h3>
          <p>Your Velmora ritual is on the way. Order #VM-2048 has been placed successfully.</p>
          <button type="button" className="button button-primary" onClick={() => setView('home')}>
            Back to home
          </button>
        </div>
      ) : (
        <div className="checkout-layout">
          <div className="checkout-panel">
            <h3>Shipping</h3>
            <div className="checkout-form">
              <label>
                Full name
                <input defaultValue={user?.name || 'Ava Jordan'} />
              </label>
              <label>
                Email
                <input defaultValue={user?.email || 'ava@velmora.com'} />
              </label>
              <label>
                Address
                <input defaultValue="12 Willow Road, Fitzroy" />
              </label>
            </div>

            <h3>Payment method</h3>
            <div className="payment-options">
              {['Card', 'Apple Pay', 'PayPal'].map((method) => (
                <button key={method} type="button" className={paymentMethod === method ? 'payment-option active' : 'payment-option'} onClick={() => setPaymentMethod(method)}>
                  {method}
                </button>
              ))}
            </div>

            <div className="coupon-box">
              <label htmlFor="coupon">Coupon code</label>
              <div className="coupon-row">
                <input id="coupon" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="VELMORA10" />
                <button type="button" className="button button-secondary" onClick={handleApplyCoupon}>
                  Apply
                </button>
              </div>
              <span className="coupon-status">
                {appliedCoupon ? `Applied: ${appliedCoupon}` : 'No valid coupon applied'}
              </span>
            </div>
          </div>

          <aside className="summary-box">
            <h3>Order summary</h3>
            {cart.map(({ product, quantity }) => (
              <div key={product.id} className="summary-line">
                <span>
                  {product.name} × {quantity}
                </span>
                <strong>${product.price * quantity}</strong>
              </div>
            ))}
            <div className="summary-row">
              <span>Subtotal</span>
              <strong>${subtotal}</strong>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <strong>{shipping === 0 ? 'Free' : `$${shipping}`}</strong>
            </div>
            <div className="summary-row">
              <span>Discount</span>
              <strong>- ${discount.toFixed(2)}</strong>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <strong>${total.toFixed(2)}</strong>
            </div>
            <button type="button" className="button button-primary full-width" onClick={handlePlaceOrder}>
              Pay with {paymentMethod}
            </button>
          </aside>
        </div>
      )}
    </section>
  );

  return (
    <div className="page-shell">
      <div className="announcement-bar">
        <div className="container announcement-inner">Free shipping on orders over $75 • New ritual collection is live</div>
      </div>

      <header className="site-header">
        <div className="container header-inner">
          <button type="button" className="brand-button" onClick={() => handleViewChange('home')}>
            <div className="brand-block">
              <div className="brand-mark">V</div>
              <span className="brand-name">Velmora</span>
            </div>
          </button>

          <nav className="main-nav" aria-label="Main navigation">
            {navItems.map((item) => (
              <button key={item} type="button" className="nav-link-button" onClick={() => handleViewChange(item === 'Home' ? 'home' : item === 'Shop' ? 'shop' : 'home')}>
                {item}
              </button>
            ))}
          </nav>

          <div className="header-actions">
            <button type="button" className="button button-ghost" onClick={() => handleViewChange(user ? 'account' : 'auth')}>
              {user ? 'Account' : 'Login'}
            </button>
            <button type="button" className="button button-primary" onClick={() => handleViewChange('cart')}>
              Bag ({cart.reduce((sum, item) => sum + item.quantity, 0)})
            </button>
          </div>
        </div>
      </header>

      <main>
        {view === 'home' && renderHome()}
        {view === 'shop' && renderShop()}
        {view === 'detail' && renderDetail()}
        {view === 'auth' && renderAuth()}
        {view === 'account' && renderAccount()}
        {view === 'cart' && renderCart()}
        {view === 'checkout' && renderCheckout()}
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div>
            <div className="brand-block footer-brand">
              <div className="brand-mark">V</div>
              <span className="brand-name">Velmora</span>
            </div>
            <p>Premium natural beauty for everyday rituals.</p>
          </div>

          <div className="footer-links">
            <a href="#">Shop</a>
            <a href="#">Ingredients</a>
            <a href="#">Journal</a>
            <a href="#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
