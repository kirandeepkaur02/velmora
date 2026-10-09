import { useEffect, useState } from 'react';
import {
  AboutPage,
  BundlesSection,
  CustomerReviewHighlights,
  ConcernsPage,
  ContactPage,
  FaqPage,
  HomeRitualAndJournal,
  IngredientsPage,
  JournalPage,
  NewsletterSignup,
  PaymentReturnPage,
  PasswordRecoveryPage,
  RoutinesPage,
} from './pages/StorefrontPages.jsx';
import { OrdersPage } from './pages/OrdersPage.jsx';
import { AdminPage } from './pages/AdminPage.jsx';
import { ProductReviews } from './pages/ProductReviews.jsx';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const navItems = ['Home', 'Shop', 'Ingredients', 'Concerns', 'Routines', 'Journal', 'About', 'FAQ', 'Contact'];

const trustFeatures = ['Botanical-inspired care', 'Clear product details', 'Thoughtful daily rituals', 'Considered ingredients'];

const priceOptions = [50, 75, 100];
let refreshPromise;

async function requestWithAuth(path, options = {}) {
  const request = (token) =>
    fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  let response = await request(localStorage.getItem('velmora_token'));
  if (response.status !== 401 || path.endsWith('/auth/refresh')) return response;

  refreshPromise ??= fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then(async (refreshResponse) => ({
      ok: refreshResponse.ok,
      payload: await refreshResponse.json(),
    }))
    .finally(() => {
      refreshPromise = undefined;
    });
  const refreshed = await refreshPromise;
  if (!refreshed.ok) {
    localStorage.removeItem('velmora_token');
    return response;
  }
  const refreshPayload = refreshed.payload;
  if (!refreshPayload.success || !refreshPayload.data.token) {
    localStorage.removeItem('velmora_token');
    return response;
  }

  localStorage.setItem('velmora_token', refreshPayload.data.token);
  response = await request(refreshPayload.data.token);
  return response;
}

function App() {
  const [view, setView] = useState(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.has('resetToken')) return 'resetPassword';
    if (query.has('payment')) return 'paymentResult';
    return 'home';
  });
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedIngredient, setSelectedIngredient] = useState('All');
  const [selectedConcern, setSelectedConcern] = useState('All');
  const [selectedSkinType, setSelectedSkinType] = useState('All');
  const [selectedHairType, setSelectedHairType] = useState('All');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [productFacets, setProductFacets] = useState({
    categories: [],
    ingredients: [],
    concerns: [],
    skinTypes: [],
    hairTypes: [],
  });
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [accountMessage, setAccountMessage] = useState('');
  const [accountLoading, setAccountLoading] = useState(false);
  const [shoppingError, setShoppingError] = useState('');
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    isDefault: false,
  });
  const [editingAddressId, setEditingAddressId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [checkoutQuote, setCheckoutQuote] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({
      page: String(currentPage),
      sort: sortBy,
    });
    if (selectedCategory !== 'All') query.set('category', selectedCategory);
    if (selectedIngredient !== 'All') query.set('ingredient', selectedIngredient);
    if (selectedConcern !== 'All') query.set('concern', selectedConcern);
    if (selectedSkinType !== 'All') query.set('skinType', selectedSkinType);
    if (selectedHairType !== 'All') query.set('hairType', selectedHairType);
    if (inStockOnly) query.set('inStock', 'true');
    if (minRating > 0) query.set('minRating', String(minRating));
    if (maxPrice < 100) query.set('maxPrice', String(maxPrice));
    if (search.trim()) query.set('q', search.trim());

    fetch(`${API_BASE_URL}/api/v1/products?${query}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error?.message || 'Could not load products.');
        }
        setProducts(payload.data.products);
        setCatalogTotal(payload.data.pagination.totalItems);
        setTotalPages(Math.max(1, payload.data.pagination.totalPages));
        setCatalogError('');
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setCatalogError(error.message || 'Could not load products.');
          setProducts([]);
          setCatalogTotal(0);
          setTotalPages(1);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCatalogLoading(false);
      });

    return () => controller.abort();
  }, [
    currentPage,
    maxPrice,
    minRating,
    search,
    selectedCategory,
    selectedConcern,
    selectedIngredient,
    selectedSkinType,
    selectedHairType,
    inStockOnly,
    sortBy,
  ]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/products/facets`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error?.message || 'Could not load product filters.');
        }
        setProductFacets(payload.data);
      })
      .catch((error) => setCatalogError(error.message || 'Could not load product filters.'));
  }, []);

  useEffect(() => {
    if (view !== 'checkout' || !selectedAddressId) return undefined;
    const controller = new AbortController();
    requestWithAuth('/api/v1/checkout/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        addressId: selectedAddressId,
        couponCode: appliedCoupon,
      }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error?.message || 'Checkout quote could not be calculated.');
        }
        setCheckoutQuote(payload.data.quote);
        setCheckoutError('');
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setCheckoutQuote(null);
          setCheckoutError(error.message || 'Checkout quote could not be calculated.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCheckoutLoading(false);
      });
    return () => controller.abort();
  }, [appliedCoupon, selectedAddressId, view]);

  useEffect(() => {
    const token = localStorage.getItem('velmora_token');
    if (!token) {
      return;
    }

    requestWithAuth('/api/v1/auth/me', {
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
        setProfileForm({ name: payload.data.user.name, email: payload.data.user.email });
        loadShoppingState().catch((error) =>
          setShoppingError(error.message || 'Shopping data could not be loaded.'),
        );
      })
      .catch(() => {
        localStorage.removeItem('velmora_token');
        setUser(null);
      });
  }, []);

  const isInWishlist = (productId) => wishlist.some((product) => product.id === productId);

  async function loadShoppingState() {
    const [cartResponse, wishlistResponse] = await Promise.all([
      requestWithAuth('/api/v1/cart'),
      requestWithAuth('/api/v1/wishlist'),
    ]);
    const [cartPayload, wishlistPayload] = await Promise.all([
      cartResponse.json(),
      wishlistResponse.json(),
    ]);
    if (!cartResponse.ok || !cartPayload.success || !wishlistResponse.ok || !wishlistPayload.success) {
      throw new Error(
        cartPayload.error?.message ||
          wishlistPayload.error?.message ||
          'Shopping data could not be loaded.',
      );
    }
    setCart(cartPayload.data.cart.items
      .filter((item) => item.product)
      .map((item) => ({ product: item.product, quantity: item.quantity, available: item.available })));
    setWishlist(wishlistPayload.data.products);
    setShoppingError('');
  }

  const toggleWishlist = async (productId) => {
    if (!user) {
      setAuthError('Sign in to save items to your wishlist.');
      setView('auth');
      return;
    }
    setShoppingError('');
    try {
      const saved = wishlist.some((product) => product.id === productId);
      const response = await requestWithAuth(
        saved ? `/api/v1/wishlist/${productId}` : '/api/v1/wishlist',
        {
          method: saved ? 'DELETE' : 'POST',
          ...(saved
            ? {}
            : {
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId }),
              }),
        },
      );
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message || 'Wishlist could not be updated.');
      }
      setWishlist(payload.data.products);
    } catch (error) {
      setShoppingError(error.message || 'Wishlist could not be updated.');
    }
  };

  const addToCart = async (product, quantity = selectedQuantity, buyNow = false) => {
    if (!user) {
      setAuthError('Sign in to save your cart.');
      setView('auth');
      return;
    }
    setShoppingError('');
    try {
      const response = await requestWithAuth('/api/v1/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message || 'The item could not be added to your cart.');
      }
      setCart(payload.data.cart.items
        .filter((item) => item.product)
        .map((item) => ({ product: item.product, quantity: item.quantity, available: item.available })));
      if (buyNow) goToCheckout();
      else setView('cart');
    } catch (error) {
      setShoppingError(error.message || 'The item could not be added to your cart.');
    }
  };

  const addBundleToCart = async (bundle) => {
    if (!user) {
      setAuthError('Sign in to add a curated bundle to your cart.');
      setView('auth');
      return;
    }
    try {
      const response = await requestWithAuth('/api/v1/cart/bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: bundle.products.map((product) => product.id) }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message || 'Bundle could not be added to your cart.');
      setCart(payload.data.cart.items
        .filter((item) => item.product)
        .map((item) => ({ product: item.product, quantity: item.quantity, available: item.available })));
      setShoppingError('');
      setView('cart');
    } catch (error) {
      setShoppingError(error.message || 'Bundle could not be added to your cart.');
    }
  };

  const updateCartQuantity = async (productId, delta) => {
    const item = cart.find((entry) => entry.product.id === productId);
    if (!item) return;
    const quantity = item.quantity + delta;
    if (quantity < 1) {
      await removeFromCart(productId);
      return;
    }
    setShoppingError('');
    try {
      const response = await requestWithAuth(`/api/v1/cart/items/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message || 'Cart quantity could not be updated.');
      }
      setCart(payload.data.cart.items
        .filter((cartItem) => cartItem.product)
        .map((cartItem) => ({ product: cartItem.product, quantity: cartItem.quantity, available: cartItem.available })));
    } catch (error) {
      setShoppingError(error.message || 'Cart quantity could not be updated.');
    }
  };

  const removeFromCart = async (productId) => {
    setShoppingError('');
    try {
      const response = await requestWithAuth(`/api/v1/cart/items/${productId}`, {
        method: 'DELETE',
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message || 'Cart item could not be removed.');
      }
      setCart(payload.data.cart.items
        .filter((item) => item.product)
        .map((item) => ({ product: item.product, quantity: item.quantity, available: item.available })));
    } catch (error) {
      setShoppingError(error.message || 'Cart item could not be removed.');
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = 0;
  const shipping = subtotal > 75 ? 0 : cart.length > 0 ? 9 : 0;
  const total = Math.max(0, subtotal - discount + shipping);

  const pagedProducts = products;

  const handleViewChange = (nextView) => {
    setView(nextView);
  };

  const resetFilters = () => {
    setSelectedCategory('All');
    setSelectedIngredient('All');
    setSelectedConcern('All');
    setSelectedSkinType('All');
    setSelectedHairType('All');
    setInStockOnly(false);
    setMinRating(0);
    setMaxPrice(100);
    setCatalogLoading(true);
    setSearch('');
    setSortBy('featured');
    setCurrentPage(1);
  };

  const openProduct = async (product) => {
    setSelectedProduct(product);
    setSelectedQuantity(1);
    setSelectedImageIndex(0);
    setView('detail');
    if (product.slug || product.id) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/products/${encodeURIComponent(product.slug || product.id)}`);
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error?.message || 'Product details could not be loaded.');
        setSelectedProduct(payload.data.product);
      } catch (error) {
        setCatalogError(error.message || 'Product details could not be loaded.');
      }
    }
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
        credentials: 'include',
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
      setProfileForm({ name: data.data.user.name, email: data.data.user.email });
      loadShoppingState().catch((error) =>
        setShoppingError(error.message || 'Shopping data could not be loaded.'),
      );
      setView('account');
      setAuthForm({ name: '', email: '', password: '' });
    } catch (error) {
      setAuthError(error.message || 'Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setAccountError('');
    setAccountMessage('');
    setAccountLoading(true);
    try {
      const response = await requestWithAuth('/api/v1/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message || 'Profile could not be updated.');
      }
      setUser(payload.data.user);
      setAccountMessage('Profile saved.');
    } catch (error) {
      setAccountError(error.message || 'Profile could not be updated.');
    } finally {
      setAccountLoading(false);
    }
  };

  const handleAddressSubmit = async (event) => {
    event.preventDefault();
    setAccountError('');
    setAccountMessage('');
    setAccountLoading(true);
    try {
      const method = editingAddressId ? 'PATCH' : 'POST';
      const endpoint = editingAddressId
        ? `/api/v1/account/addresses/${editingAddressId}`
        : '/api/v1/account/addresses';
      const response = await requestWithAuth(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message || 'Address could not be saved.');
      }
      const addresses = editingAddressId
        ? user.addresses.map((address) =>
            address.id === editingAddressId ? payload.data.address : address,
          )
        : [...(user.addresses ?? []), payload.data.address];
      setUser({ ...user, addresses });
      setAddressForm({
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        isDefault: false,
      });
      setEditingAddressId('');
      setAccountMessage('Address saved.');
    } catch (error) {
      setAccountError(error.message || 'Address could not be saved.');
    } finally {
      setAccountLoading(false);
    }
  };

  const handleAddressDelete = async (addressId) => {
    setAccountError('');
    setAccountMessage('');
    try {
      const response = await requestWithAuth(`/api/v1/account/addresses/${addressId}`, {
        method: 'DELETE',
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message || 'Address could not be removed.');
      }
      setUser({ ...user, addresses: payload.data.addresses });
      if (editingAddressId === addressId) setEditingAddressId('');
      setAccountMessage('Address removed.');
    } catch (error) {
      setAccountError(error.message || 'Address could not be removed.');
    }
  };

  const handleLogout = async () => {
    setAccountError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message || 'Logout failed.');
      }
      localStorage.removeItem('velmora_token');
      setUser(null);
      setCart([]);
      setWishlist([]);
      setView('auth');
    } catch (error) {
      setAccountError(error.message || 'Logout failed.');
    }
  };

  const handleApplyCoupon = () => {
    setCheckoutError('');
    setCheckoutLoading(true);
    setAppliedCoupon(couponCode.trim().toUpperCase());
  };

  const handlePlaceOrder = async () => {
    setCheckoutError('');
    setCheckoutLoading(true);
    try {
      let order = createdOrder;
      if (!order) {
        const response = await requestWithAuth('/api/v1/checkout/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            addressId: selectedAddressId,
            couponCode: appliedCoupon,
          }),
        });
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error?.message || 'Order could not be prepared.');
        }
        order = payload.data.order;
        setCreatedOrder(order);
      }

      const paymentResponse = await requestWithAuth(
        `/api/v1/payments/orders/${order.id}/session`,
        { method: 'POST' },
      );
      const paymentPayload = await paymentResponse.json();
      if (!paymentResponse.ok || !paymentPayload.success) {
        throw new Error(paymentPayload.error?.message || 'Stripe checkout could not be started.');
      }
      window.location.assign(paymentPayload.data.checkoutUrl);
    } catch (error) {
      setCheckoutError(error.message || 'Order could not be prepared.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePaymentRetry = async (orderId) => {
    const response = await requestWithAuth(`/api/v1/payments/orders/${orderId}/session`, {
      method: 'POST',
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.error?.message || 'Stripe checkout could not be started.');
    }
    window.location.assign(payload.data.checkoutUrl);
  };

  const goToCheckout = () => {
    if (!user) {
      setAuthError('Sign in to continue to checkout.');
      setView('auth');
      return;
    }
    const addresses = user.addresses ?? [];
    if (addresses.length === 0) {
      setAccountMessage('Add a shipping address before checkout.');
      setView('account');
      return;
    }
    setCheckoutError('');
    setCheckoutQuote(null);
    setCheckoutLoading(true);
    setSelectedAddressId(
      addresses.find((address) => address.isDefault)?.id ?? addresses[0].id,
    );
    setView('checkout');
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
              <strong>Thoughtful</strong>
              <span>ingredient details</span>
            </div>
            <div>
              <strong>Everyday</strong>
              <span>beauty rituals</span>
            </div>
            <div>
              <strong>Curated</strong>
              <span>botanical care</span>
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
          {productFacets.categories.map((name, index) => {
            const category = { name, tone: ['sage', 'rose', 'sand', 'green'][index % 4] };
            return (
            <article key={category.name} className={`category-card category-card--${category.tone}`}>
              <div className="category-art" aria-hidden="true" />
              <div className="category-content">
                <span className="label">Essentials</span>
                <h3>{category.name}</h3>
                <button type="button" className="text-button" onClick={() => {
                  setSelectedCategory(category.name);
                  setCurrentPage(1);
                  setView('shop');
                }}>Shop {category.name}</button>
              </div>
            </article>
            );
          })}
        </div>
      </section>

      <section className="container section-block">
        <div className="section-heading">
          <p className="eyebrow">Find your fit</p>
          <h2>Shop by ingredient or concern.</h2>
        </div>
        <h3>Ingredients</h3>
        <div className="ingredient-pills">
          {productFacets.ingredients.slice(0, 8).map((ingredient) => (
            <button type="button" className="ingredient-pill" key={ingredient} onClick={() => {
              setSelectedIngredient(ingredient);
              setCurrentPage(1);
              setView('shop');
            }}>{ingredient}</button>
          ))}
        </div>
        <h3>Concerns</h3>
        <div className="ingredient-pills">
          {productFacets.concerns.slice(0, 8).map((concern) => (
            <button type="button" className="ingredient-pill" key={concern} onClick={() => {
              setSelectedConcern(concern);
              setCurrentPage(1);
              setView('shop');
            }}>{concern}</button>
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
              <div className={`product-image product-image--${product.accent}`}>
                {product.images?.[0]?.url && <img src={product.images[0].url} alt={product.name} loading="lazy" />}
              </div>
              <div className="product-card-body">
                <span className="label">{product.badge}</span>
                <h3>{product.name}</h3>
                <div className="price-row">
                  <strong>${product.price}</strong>
                  <span>${product.compareAt}</span>
                </div>
                <button type="button" className="button button-primary full-width" onClick={() => openProduct(product)}>
                  View details
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {products.some((product) => product.isNew) && (
        <section className="container section-block">
          <div className="section-heading">
            <p className="eyebrow">Just arrived</p>
            <h2>Meet the newest additions.</h2>
          </div>
          <div className="product-grid">
            {products.filter((product) => product.isNew).slice(0, 4).map((product) => (
              <article className="product-card" key={product.id}>
                <div className={`product-image product-image--${product.accent}`}>
                  {product.images?.[0]?.url && <img src={product.images[0].url} alt={product.name} loading="lazy" />}
                </div>
                <div className="product-card-body">
                  <span className="label">New arrival</span>
                  <h3>{product.name}</h3>
                  <strong>${product.price}</strong>
                  <button type="button" className="button button-primary full-width" onClick={() => openProduct(product)}>View details</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <BundlesSection
        onProduct={openProduct}
        onShop={() => handleViewChange('shop')}
        onAddBundle={addBundleToCart}
      />
      <HomeRitualAndJournal
        onProduct={openProduct}
        onShop={() => handleViewChange('shop')}
        onJournal={() => handleViewChange('journal')}
      />

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
                <span>Clear information to support considered choices.</span>
              </div>
            </div>
          </div>
          <div className="story-visual" aria-hidden="true">
            <div className="story-glow" />
          </div>
        </div>
      </section>

      <CustomerReviewHighlights />

      <section className="container section-block newsletter-box">
        <div>
          <p className="eyebrow">Stay in bloom</p>
          <h2>Receive rituals, tips, and early access.</h2>
        </div>
        <NewsletterSignup />
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
        <div className="shop-results-meta">{catalogTotal} products</div>
      </div>

      <div className="shop-layout">
        <aside className="shop-sidebar">
          <div className="filter-block">
            <label htmlFor="search">Search</label>
            <input id="search" value={search} onChange={(event) => { setCatalogLoading(true); setCurrentPage(1); setSearch(event.target.value); }} placeholder="Search products" />
          </div>

          <div className="filter-block">
            <label htmlFor="category">Category</label>
            <select id="category" value={selectedCategory} onChange={(event) => { setCatalogLoading(true); setCurrentPage(1); setSelectedCategory(event.target.value); }}>
              <option value="All">All categories</option>
              {productFacets.categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="filter-block">
            <label htmlFor="ingredient">Ingredient</label>
            <select id="ingredient" value={selectedIngredient} onChange={(event) => { setCatalogLoading(true); setCurrentPage(1); setSelectedIngredient(event.target.value); }}>
              {['All', ...productFacets.ingredients].map((ingredient) => (
                <option key={ingredient} value={ingredient}>{ingredient === 'All' ? 'Any ingredient' : ingredient}</option>
              ))}
            </select>
          </div>

          <div className="filter-block">
            <label htmlFor="concern">Concern</label>
            <select id="concern" value={selectedConcern} onChange={(event) => { setCatalogLoading(true); setCurrentPage(1); setSelectedConcern(event.target.value); }}>
              {['All', ...productFacets.concerns].map((concern) => (
                <option key={concern} value={concern}>{concern === 'All' ? 'Any concern' : concern}</option>
              ))}
            </select>
          </div>

          <div className="filter-block">
            <label htmlFor="skinType">Skin type</label>
            <select id="skinType" value={selectedSkinType} onChange={(event) => { setCatalogLoading(true); setCurrentPage(1); setSelectedSkinType(event.target.value); }}>
              <option value="All">All skin types</option>
              {productFacets.skinTypes.map((skinType) => <option key={skinType} value={skinType}>{skinType}</option>)}
            </select>
          </div>

          {productFacets.hairTypes.length > 0 && (
            <div className="filter-block">
              <label htmlFor="hairType">Hair type</label>
              <select id="hairType" value={selectedHairType} onChange={(event) => { setCatalogLoading(true); setCurrentPage(1); setSelectedHairType(event.target.value); }}>
                <option value="All">All hair types</option>
                {productFacets.hairTypes.map((hairType) => <option key={hairType} value={hairType}>{hairType}</option>)}
              </select>
            </div>
          )}

          <div className="filter-block">
            <label className="checkbox-label" htmlFor="inStock">
              <input id="inStock" type="checkbox" checked={inStockOnly} onChange={(event) => { setCatalogLoading(true); setCurrentPage(1); setInStockOnly(event.target.checked); }} />
              In-stock products only
            </label>
          </div>

          <div className="filter-block">
            <label htmlFor="rating">Minimum rating</label>
            <select id="rating" value={minRating} onChange={(event) => { setCatalogLoading(true); setCurrentPage(1); setMinRating(Number(event.target.value)); }}>
              <option value={0}>Any rating</option>
              <option value={4.5}>4.5+</option>
              <option value={4.7}>4.7+</option>
              <option value={4.9}>4.9+</option>
            </select>
          </div>

          <div className="filter-block">
            <label htmlFor="price">Max price</label>
            <select id="price" value={maxPrice} onChange={(event) => { setCatalogLoading(true); setCurrentPage(1); setMaxPrice(Number(event.target.value)); }}>
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
              <select id="sortBy" value={sortBy} onChange={(event) => { setCatalogLoading(true); setCurrentPage(1); setSortBy(event.target.value); }}>
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="rating">Top rated</option>
              </select>
            </div>
          </div>

          {catalogLoading && <p role="status">Loading products...</p>}
          {catalogError && <p className="auth-error" role="alert">{catalogError}</p>}
          <div className="product-grid product-grid--catalog">
            {pagedProducts.length > 0 ? (
              pagedProducts.map((product) => (
                <article key={product.id} className="product-card">
                  <div className={`product-image product-image--${product.accent}`}>
                    {product.images?.[0]?.url && <img src={product.images[0].url} alt={product.name} loading="lazy" />}
                  </div>
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
                    <button type="button" className="button button-primary full-width" onClick={() => openProduct(product)}>
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

          {catalogTotal > 0 && (
            <div className="pagination">
              <button type="button" className="button button-secondary" disabled={currentPage === 1} onClick={() => { setCatalogLoading(true); setCurrentPage((page) => Math.max(1, page - 1)); }}>
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button type="button" className="button button-secondary" disabled={currentPage === totalPages} onClick={() => { setCatalogLoading(true); setCurrentPage((page) => Math.min(totalPages, page + 1)); }}>
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
      {shoppingError && <p className="auth-error" role="alert">{shoppingError}</p>}

      {selectedProduct && (
        <div className="detail-layout">
          <div className="detail-gallery">
            <div className={`detail-view detail-view--${selectedProduct.accent}`}>
              {selectedProduct.images?.[selectedImageIndex]?.url && (
                <img src={selectedProduct.images[selectedImageIndex].url} alt={selectedProduct.name} />
              )}
            </div>
            {selectedProduct.images?.length > 1 && (
              <div className="detail-thumbs">
                {selectedProduct.images.map((image, index) => (
                  <button
                    type="button"
                    className={`detail-thumb ${selectedImageIndex === index ? 'detail-thumb--selected' : ''}`}
                    key={image.publicId}
                    onClick={() => setSelectedImageIndex(index)}
                    aria-label={`View ${selectedProduct.name} image ${index + 1}`}
                  >
                    <img src={image.url} alt="" />
                  </button>
                ))}
              </div>
            )}
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
              <label className="quantity-control">
                Quantity
                <input
                  type="number"
                  min="1"
                  max={selectedProduct.stock}
                  value={selectedQuantity}
                  disabled={selectedProduct.stock < 1}
                  onChange={(event) => setSelectedQuantity(Math.min(
                    selectedProduct.stock,
                    Math.max(1, Number(event.target.value) || 1),
                  ))}
                />
              </label>
              <button type="button" className="button button-primary" disabled={selectedProduct.stock < 1} onClick={() => addToCart(selectedProduct)}>
                Add to cart
              </button>
              <button type="button" className="button button-secondary" disabled={selectedProduct.stock < 1} onClick={() => addToCart(selectedProduct, selectedQuantity, true)}>
                Buy now
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
              {selectedProduct.hairType && (
                <div>
                  <span>Hair type</span>
                  <strong>{selectedProduct.hairType}</strong>
                </div>
              )}
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
            {selectedProduct.howToUse && (
              <div className="detail-section">
                <h3>How to use</h3>
                <p>{selectedProduct.howToUse}</p>
              </div>
            )}
            <div className="detail-section">
              <h3>Shipping</h3>
              <p>Shipping costs and delivery details are confirmed before you pay at checkout. Free standard shipping applies above the configured order threshold.</p>
            </div>
            {products.filter((product) => product.id !== selectedProduct.id && product.category === selectedProduct.category).length > 0 && (
              <div className="detail-section">
                <h3>You may also like</h3>
                <div className="ingredient-pills">
                  {products
                    .filter((product) => product.id !== selectedProduct.id && product.category === selectedProduct.category)
                    .slice(0, 4)
                    .map((product) => (
                      <button className="ingredient-pill" type="button" key={product.id} onClick={() => openProduct(product)}>
                        {product.name}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {selectedProduct.frequentlyBoughtTogether?.length > 0 && (
              <section className="detail-section">
                <h3>Frequently bought together</h3>
                <div className="review-grid">
                  {selectedProduct.frequentlyBoughtTogether.map((product) => (
                    <article className="review-card" key={product.id}>
                      {product.images?.[0]?.url && <img src={product.images[0].url} alt={product.name} loading="lazy" />}
                      <h4>{product.name}</h4>
                      <p>${product.price} · {product.rating} ★</p>
                      <button type="button" className="button button-secondary" onClick={() => openProduct(product)}>View product</button>
                    </article>
                  ))}
                </div>
              </section>
            )}
            <ProductReviews
              productId={selectedProduct.id}
              user={user}
              requestWithAuth={requestWithAuth}
            />
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
          {authMode === 'login' && (
            <button type="button" className="text-button" onClick={() => setView('forgotPassword')}>
              Forgot password?
            </button>
          )}
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
        <button type="button" className="button button-secondary" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {accountError && <p className="auth-error" role="alert">{accountError}</p>}
      {accountMessage && <p role="status">{accountMessage}</p>}

      <div className="account-grid">
        <div className="account-panel">
          <h3>Profile</h3>
          <form className="auth-form" onSubmit={handleProfileSubmit}>
            <label>Name<input value={profileForm.name} maxLength="100" onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} required /></label>
            <label>Email<input type="email" value={profileForm.email} maxLength="254" onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })} required /></label>
            <button className="button button-primary" type="submit" disabled={accountLoading}>Save profile</button>
          </form>
        </div>

        <div className="account-panel">
          <h3>Addresses</h3>
          {(user?.addresses ?? []).map((address) => (
            <article className="review-card" key={address.id}>
              <strong>{address.fullName}{address.isDefault ? ' · Default' : ''}</strong>
              <p>{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}</p>
              <p>{address.city}, {address.state} {address.postalCode}, {address.country}</p>
              <p>{address.phone}</p>
              <button type="button" className="text-button" onClick={() => {
                setEditingAddressId(address.id);
                setAddressForm({
                  fullName: address.fullName,
                  phone: address.phone,
                  addressLine1: address.addressLine1,
                  addressLine2: address.addressLine2 ?? '',
                  city: address.city,
                  state: address.state,
                  postalCode: address.postalCode,
                  country: address.country,
                  isDefault: address.isDefault,
                });
              }}>Edit</button>
              <button type="button" className="text-button" onClick={() => handleAddressDelete(address.id)}>Remove</button>
            </article>
          ))}
          <form className="auth-form" onSubmit={handleAddressSubmit}>
            <h4>{editingAddressId ? 'Edit address' : 'Add an address'}</h4>
            {[
              ['fullName', 'Full name'],
              ['phone', 'Phone'],
              ['addressLine1', 'Address line 1'],
              ['addressLine2', 'Address line 2'],
              ['city', 'City'],
              ['state', 'State / Province'],
              ['postalCode', 'Postal code'],
              ['country', 'Country'],
            ].map(([field, label]) => (
              <label key={field}>{label}
                <input
                  value={addressForm[field]}
                  maxLength={field === 'addressLine1' || field === 'addressLine2' ? 200 : 100}
                  onChange={(event) => setAddressForm({ ...addressForm, [field]: event.target.value })}
                  required={field !== 'addressLine2'}
                />
              </label>
            ))}
            <label className="checkbox-label">
              <input type="checkbox" checked={addressForm.isDefault} onChange={(event) => setAddressForm({ ...addressForm, isDefault: event.target.checked })} />
              Set as default address
            </label>
            <button className="button button-primary" type="submit" disabled={accountLoading}>{editingAddressId ? 'Save address' : 'Add address'}</button>
            {editingAddressId && <button className="button button-secondary" type="button" onClick={() => {
              setEditingAddressId('');
              setAddressForm({
                fullName: '', phone: '', addressLine1: '', addressLine2: '',
                city: '', state: '', postalCode: '', country: '', isDefault: false,
              });
            }}>Cancel edit</button>}
          </form>
        </div>

        <div className="account-panel">
          <h3>Wishlist</h3>
          <ul>
            {wishlist.map((product) => (
              <li key={product.id} className="wishlist-item">
                <button type="button" className="text-button" onClick={() => openProduct(product)}>{product.name}</button>
                <button type="button" className="text-button" onClick={() => toggleWishlist(product.id)}>Remove</button>
              </li>
            ))}
          </ul>
          <button type="button" className="button button-secondary" onClick={() => setView('orders')}>
            View orders
          </button>
          {user?.role === 'admin' && (
            <button type="button" className="button button-primary" onClick={() => setView('admin')}>
              Admin dashboard
            </button>
          )}
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
      {shoppingError && <p className="auth-error" role="alert">{shoppingError}</p>}

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
            {cart.map(({ product, quantity, available }) => (
              <div key={product.id} className="cart-item">
                <div className={`mini-product mini-product--${product.accent}`}>
                  {product.images?.[0]?.url && <img src={product.images[0].url} alt="" />}
                </div>
                <div className="cart-item-copy">
                  <h3>{product.name}</h3>
                  <p>{product.category}{available ? '' : ' · No longer available in this quantity'}</p>
                </div>
                <div className="quantity-stepper">
                  <button type="button" onClick={() => updateCartQuantity(product.id, -1)}>-</button>
                  <span>{quantity}</span>
                  <button type="button" onClick={() => updateCartQuantity(product.id, 1)} disabled={quantity >= product.stock}>+</button>
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
            <button type="button" className="button button-primary full-width" disabled={cart.some((item) => !item.available)} onClick={goToCheckout}>
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
        <h2>Review your order.</h2>
      </div>

      <div className="checkout-layout">
          <div className="checkout-panel">
            <h3>Shipping</h3>
            <div className="checkout-form">
              <label>
                Ship to
                <select value={selectedAddressId} disabled={Boolean(createdOrder)} onChange={(event) => {
                  setCheckoutLoading(true);
                  setSelectedAddressId(event.target.value);
                }}>
                  {(user?.addresses ?? []).map((address) => (
                    <option value={address.id} key={address.id}>
                      {address.fullName} · {address.addressLine1}, {address.city}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {!user?.addresses?.length && (
              <p>No saved shipping address. Add one in your account before checkout.</p>
            )}

            <div className="coupon-box">
              <label htmlFor="coupon">Coupon code</label>
              <div className="coupon-row">
                <input id="coupon" value={couponCode} disabled={Boolean(createdOrder)} onChange={(event) => setCouponCode(event.target.value)} placeholder="VELMORA10" />
                <button type="button" className="button button-secondary" disabled={Boolean(createdOrder)} onClick={handleApplyCoupon}>
                  Apply
                </button>
              </div>
              <span className="coupon-status">
                {checkoutQuote?.couponCode ? `Applied: ${checkoutQuote.couponCode}` : 'No coupon applied'}
              </span>
            </div>
            {checkoutError && <p className="auth-error" role="alert">{checkoutError}</p>}
            {checkoutLoading && <p role="status">Recalculating totals…</p>}
          </div>

          <aside className="summary-box">
            <h3>Order summary</h3>
            {(createdOrder?.items ?? checkoutQuote?.items ?? []).map((item) => (
              <div key={item.productId} className="summary-line">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <strong>{createdOrder?.currency ?? checkoutQuote?.currency ?? 'USD'} {(item.lineTotal ?? item.unitPrice * item.quantity).toFixed(2)}</strong>
              </div>
            ))}
            <div className="summary-row">
              <span>Subtotal</span>
              <strong>{createdOrder?.currency ?? checkoutQuote?.currency ?? 'USD'} {(createdOrder?.subtotal ?? checkoutQuote?.subtotal ?? 0).toFixed(2)}</strong>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <strong>{createdOrder?.currency ?? checkoutQuote?.currency ?? 'USD'} {(createdOrder?.shipping ?? checkoutQuote?.shipping ?? 0).toFixed(2)}</strong>
            </div>
            <div className="summary-row">
              <span>Discount</span>
              <strong>- {createdOrder?.currency ?? checkoutQuote?.currency ?? 'USD'} {(createdOrder?.discount ?? checkoutQuote?.discount ?? 0).toFixed(2)}</strong>
            </div>
            <div className="summary-row">
              <span>Tax</span>
              <strong>{createdOrder?.currency ?? checkoutQuote?.currency ?? 'USD'} {(createdOrder?.tax ?? checkoutQuote?.tax ?? 0).toFixed(2)}</strong>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <strong>{createdOrder?.currency ?? checkoutQuote?.currency ?? 'USD'} {(createdOrder?.total ?? checkoutQuote?.total ?? 0).toFixed(2)}</strong>
            </div>
            <button
              type="button"
              className="button button-primary full-width"
              disabled={!checkoutQuote || checkoutLoading || !selectedAddressId}
              onClick={handlePlaceOrder}
            >
              {checkoutLoading ? 'Please wait...' : createdOrder ? 'Retry secure payment' : 'Pay securely with Stripe'}
            </button>
          </aside>
      </div>
    </section>
  );

  return (
    <div className="page-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
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
              <button key={item} type="button" className="nav-link-button" onClick={() => handleViewChange(item.toLowerCase())}>
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

      <main id="main-content">
        {view === 'home' && renderHome()}
        {view === 'shop' && renderShop()}
        {view === 'detail' && renderDetail()}
        {view === 'ingredients' && <IngredientsPage ingredients={productFacets.ingredients} onSelect={(ingredient) => { setSelectedIngredient(ingredient); setCurrentPage(1); setView('shop'); }} />}
        {view === 'concerns' && <ConcernsPage
          concerns={productFacets.concerns}
          skinTypes={productFacets.skinTypes}
          hairTypes={productFacets.hairTypes}
          onFind={({ concern, skinType, hairType, inStock }) => {
            setSelectedConcern(concern);
            setSelectedSkinType(skinType);
            setSelectedHairType(hairType);
            setInStockOnly(inStock);
            setCurrentPage(1);
            setView('shop');
          }}
        />}
        {view === 'routines' && <RoutinesPage onShop={() => setView('shop')} onProduct={openProduct} />}
        {view === 'journal' && <JournalPage />}
        {view === 'about' && <AboutPage />}
        {view === 'faq' && <FaqPage />}
        {view === 'contact' && <ContactPage />}
        {(view === 'forgotPassword' || view === 'resetPassword') && (
          <PasswordRecoveryPage
            token={new URLSearchParams(window.location.search).get('resetToken') ?? ''}
            onBackToLogin={() => setView('auth')}
          />
        )}
        {view === 'paymentResult' && (
          <PaymentReturnPage
            orderId={new URLSearchParams(window.location.search).get('orderId') ?? ''}
            cancelled={new URLSearchParams(window.location.search).get('payment') === 'cancelled'}
            requestWithAuth={requestWithAuth}
            onRetry={handlePaymentRetry}
            onHome={() => setView('home')}
          />
        )}
        {view === 'auth' && renderAuth()}
        {view === 'account' && renderAccount()}
        {view === 'orders' && user && <OrdersPage requestWithAuth={requestWithAuth} />}
        {view === 'admin' && user?.role === 'admin' && <AdminPage requestWithAuth={requestWithAuth} />}
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
            <button type="button" className="text-button" onClick={() => setView('shop')}>Shop</button>
            <button type="button" className="text-button" onClick={() => setView('ingredients')}>Ingredients</button>
            <button type="button" className="text-button" onClick={() => setView('journal')}>Journal</button>
            <button type="button" className="text-button" onClick={() => setView('contact')}>Support</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
