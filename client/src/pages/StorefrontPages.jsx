import { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function IngredientsPage({ ingredients, onSelect }) {
  const [storedIngredients, setStoredIngredients] = useState([]);
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/content/ingredients`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error?.message || 'Ingredients could not be loaded.');
        setStoredIngredients(payload.data.ingredients);
      })
      .catch(() => setStoredIngredients([]));
  }, []);
  const ingredientNames = storedIngredients.length ? storedIngredients.map((ingredient) => ingredient.name) : ingredients;
  return (
    <section className="container section-block">
      <p className="eyebrow">Ingredient explorer</p>
      <h2>Explore botanical ingredients.</h2>
      <div className="product-grid">
        {ingredientNames.map((ingredient) => (
          <article className="review-card" key={ingredient}>
            <h3>{ingredient}</h3>
            <p>Discover products featuring {ingredient.toLowerCase()}.</p>
            <button className="button button-secondary" type="button" onClick={() => onSelect(ingredient)}>
              Shop ingredient
            </button>
          </article>
        ))}
        {ingredients.length === 0 && <p>No ingredients are available yet.</p>}
      </div>
    </section>
  );
}

export function ConcernsPage({ concerns, skinTypes, hairTypes, onFind }) {
  const [skinType, setSkinType] = useState('All');
  const [hairType, setHairType] = useState('All');
  const [concern, setConcern] = useState('All');
  const [inStock, setInStock] = useState(false);
  return (
    <section className="container section-block">
      <p className="eyebrow">Concern finder</p>
      <h2>Find care that fits your preferences.</h2>
      <div className="account-panel concern-finder">
        <label>Skin type
          <select value={skinType} onChange={(event) => setSkinType(event.target.value)}>
            <option value="All">Any skin type</option>
            {skinTypes.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        {hairTypes.length > 0 && <label>Hair type
          <select value={hairType} onChange={(event) => setHairType(event.target.value)}>
            <option value="All">Any hair type</option>
            {hairTypes.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>}
        <label>Concern
          <select value={concern} onChange={(event) => setConcern(event.target.value)}>
            <option value="All">Any concern</option>
            {concerns.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={inStock} onChange={(event) => setInStock(event.target.checked)} />
          Only show available products
        </label>
        <button className="button button-primary" type="button" onClick={() => onFind({ concern, skinType, hairType, inStock })}>
          View matching products
        </button>
      </div>
      <div className="product-grid">
        {concerns.map((concern) => (
          <article className="review-card" key={concern}>
            <h3>{concern}</h3>
            <p>Explore products selected for {concern.toLowerCase()}.</p>
            <button className="button button-secondary" type="button" onClick={() => {
              setConcern(concern);
              onFind({ concern, skinType, hairType, inStock });
            }}>
              Explore products
            </button>
          </article>
        ))}
        {concerns.length === 0 && <p>No concerns are available yet.</p>}
      </div>
    </section>
  );
}

export function RoutinesPage({ onShop, onProduct }) {
  const [routines, setRoutines] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/content/routines`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error?.message || 'Routines could not be loaded.');
        setRoutines(payload.data.routines);
      })
      .catch((loadError) => setError(loadError.message || 'Routines could not be loaded.'));
  }, []);

  return (
    <section className="container section-block">
      <p className="eyebrow">Beauty routines</p>
      <h2>Simple rituals, thoughtful steps.</h2>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <div className="product-grid">
        {routines.map((routine) => (
          <article className="review-card" key={routine.name}>
            <h3>{routine.name}</h3>
            <p>{routine.description}</p>
            <ol>{routine.steps.map((step) => (
              <li key={step.title}>
                {step.title}: {step.description}
                {step.product && <button type="button" className="text-button routine-product" onClick={() => onProduct(step.product)}>Shop {step.product.name} · ${step.product.price}</button>}
              </li>
            ))}</ol>
            <button className="button button-secondary" type="button" onClick={onShop}>
              Shop the collection
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export function BundlesSection({ onProduct, onShop, onAddBundle }) {
  const [bundles, setBundles] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/content/bundles`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error?.message || 'Bundles could not be loaded.');
        setBundles(payload.data.bundles);
      })
      .catch((loadError) => setError(loadError.message || 'Bundles could not be loaded.'));
  }, []);

  return (
    <section className="container section-block">
      <div className="section-heading">
        <p className="eyebrow">Curated bundles</p>
        <h2>Rituals, thoughtfully brought together.</h2>
      </div>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <div className="review-grid">
        {bundles.map((bundle) => (
          <article className="review-card" key={bundle.id}>
            <h3>{bundle.name}</h3>
            <p>{bundle.description}</p>
            <ul>{bundle.products.map((product) => (
              <li key={product.id}>
                <button className="text-button" type="button" onClick={() => onProduct(product)}>{product.name}</button>
              </li>
            ))}</ul>
            <button className="button button-secondary" type="button" onClick={onShop}>Explore the collection</button>
            <button className="button button-primary" type="button" disabled={bundle.products.some((product) => product.stock < 1)} onClick={() => onAddBundle(bundle)}>
              Add bundle to bag
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export function HomeRitualAndJournal({ onProduct, onShop, onJournal }) {
  const [routines, setRoutines] = useState([]);
  const [articles, setArticles] = useState([]);
  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE_URL}/api/v1/content/routines`).then((response) => response.json()),
      fetch(`${API_BASE_URL}/api/v1/content/journal`).then((response) => response.json()),
    ])
      .then(([routinePayload, articlePayload]) => {
        if (!routinePayload.success || !articlePayload.success) {
          throw new Error(routinePayload.error?.message || articlePayload.error?.message || 'Home content could not be loaded.');
        }
        setRoutines(routinePayload.data.routines);
        setArticles(articlePayload.data.articles);
      })
      .catch(() => {
        setRoutines([]);
        setArticles([]);
      });
  }, []);

  return (
    <>
      <section className="container section-block">
        <div className="section-heading">
          <p className="eyebrow">Beauty routines</p>
          <h2>Build a ritual, one thoughtful step at a time.</h2>
        </div>
        <div className="review-grid">
          {routines.slice(0, 3).map((routine) => (
            <article className="review-card" key={routine.slug}>
              <h3>{routine.name}</h3>
              <p>{routine.description}</p>
              <ol>{routine.steps.map((step) => (
                <li key={step.title}>
                  {step.title}: {step.description}
                  {step.product && <button type="button" className="text-button routine-product" onClick={() => onProduct(step.product)}>{step.product.name}</button>}
                </li>
              ))}</ol>
              <button className="button button-secondary" type="button" onClick={onShop}>Explore products</button>
            </article>
          ))}
        </div>
      </section>
      <section className="container section-block">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">From the journal</p>
            <h2>Notes for everyday rituals.</h2>
          </div>
          <button className="text-button" type="button" onClick={onJournal}>Read the journal</button>
        </div>
        <div className="review-grid">
          {articles.slice(0, 3).map((article) => (
            <article className="review-card" key={article.slug}>
              <h3>{article.title}</h3>
              <p>{article.excerpt}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

export function CustomerReviewHighlights() {
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/content/reviews`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error?.message || 'Customer reviews could not be loaded.');
        setReviews(payload.data.reviews);
      })
      .catch((loadError) => setError(loadError.message || 'Customer reviews could not be loaded.'));
  }, []);
  return (
    <section className="container section-block">
      <div className="section-heading">
        <p className="eyebrow">Customer love</p>
        <h2>Verified routines, shared by customers.</h2>
      </div>
      {error && <p className="auth-error" role="alert">{error}</p>}
      {reviews.length === 0 && !error && <p>Approved verified-purchase reviews will appear here.</p>}
      <div className="review-grid">
        {reviews.map((review) => (
          <article key={review.id} className="review-card">
            <div className="stars" aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
            <h3>{review.title}</h3>
            <p>{review.body}</p>
            <strong>{review.customerName} · {review.productName}</strong>
            <span>Verified purchase</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export function JournalPage() {
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/content/journal`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error?.message || 'Journal articles could not be loaded.');
        setArticles(payload.data.articles);
      })
      .catch((loadError) => setError(loadError.message || 'Journal articles could not be loaded.'));
  }, []);
  return (
    <section className="container section-block">
      <p className="eyebrow">The Velmora journal</p>
      <h2>Notes on ingredients and everyday rituals.</h2>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <div className="review-grid">
        {articles.map((article) => <article className="review-card" key={article.slug}><h3>{article.title}</h3><p>{article.excerpt}</p></article>)}
      </div>
    </section>
  );
}

export function AboutPage() {
  return (
    <section className="container section-block">
      <p className="eyebrow">Our philosophy</p>
      <h2>Premium natural beauty, rooted in care.</h2>
      <p>Velmora brings together considered ingredients, clear product information, and uncomplicated rituals for everyday care.</p>
      <p>We aim to describe cosmetic products responsibly and encourage customers to choose formulas that suit their own needs.</p>
    </section>
  );
}

export function FaqPage() {
  const answers = [
    ['How do I choose products?', 'Explore products by category, ingredient, or concern, and review each product’s ingredient and usage information.'],
    ['Where can I find shipping details?', 'Shipping options and costs are shown during checkout before an order is submitted.'],
    ['Can I change an order?', 'Contact our team promptly with your order details. Changes depend on the order’s fulfillment status.'],
  ];
  return (
    <section className="container section-block">
      <p className="eyebrow">Frequently asked questions</p>
      <h2>How can we help?</h2>
      {answers.map(([question, answer]) => (
        <details className="review-card" key={question}>
          <summary>{question}</summary>
          <p>{answer}</p>
        </details>
      ))}
    </section>
  );
}

export function ContactPage() {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submitMessage(event) {
    event.preventDefault();
    setError('');
    setStatus('');
    setSubmitting(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/storefront/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message || 'Your message could not be sent.');
      }
      formElement.reset();
      setStatus('Thank you. Your message has been received.');
    } catch (submitError) {
      setError(submitError.message || 'Your message could not be sent.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="container section-block">
      <p className="eyebrow">Contact</p>
      <h2>We’d love to hear from you.</h2>
      <form className="auth-form" onSubmit={submitMessage}>
        <label>Name<input name="name" autoComplete="name" maxLength="100" required /></label>
        <label>Email<input name="email" type="email" autoComplete="email" maxLength="254" required /></label>
        <label>Subject<input name="subject" maxLength="150" required /></label>
        <label>Message<textarea name="message" maxLength="5000" rows="6" required /></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {status && <p role="status">{status}</p>}
        <button className="button button-primary" type="submit" disabled={submitting}>
          {submitting ? 'Sending...' : 'Send message'}
        </button>
      </form>
    </section>
  );
}

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function subscribe(event) {
    event.preventDefault();
    setError('');
    setStatus('');
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/storefront/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message || 'Newsletter signup failed.');
      }
      setStatus(payload.data.alreadySubscribed ? 'You are already subscribed.' : 'Thanks for subscribing.');
      setEmail('');
    } catch (submitError) {
      setError(submitError.message || 'Newsletter signup failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="newsletter-form" onSubmit={subscribe}>
      <label className="visually-hidden" htmlFor="newsletter-email">Email address</label>
      <input id="newsletter-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required />
      <button type="submit" className="button button-primary" disabled={submitting}>
        {submitting ? 'Joining...' : 'Join the newsletter'}
      </button>
      {error && <p className="auth-error" role="alert">{error}</p>}
      {status && <p role="status">{status}</p>}
    </form>
  );
}

export function PasswordRecoveryPage({ token, onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (token && password !== confirmation) {
      setError('The passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/${token ? 'reset-password' : 'forgot-password'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(token ? { token, password } : { email }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message || 'Password recovery could not be completed.');
      }
      setMessage(token ? payload.data.message : 'If an account exists for that email, instructions will be sent.');
    } catch (submitError) {
      setError(submitError.message || 'Password recovery could not be completed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="container auth-page">
      <form className="auth-form auth-card" onSubmit={submit}>
        <h2>{token ? 'Choose a new password' : 'Reset your password'}</h2>
        {!token && (
          <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
        )}
        {token && (
          <>
            <label>New password<input type="password" minLength="8" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required /></label>
            <label>Confirm password<input type="password" minLength="8" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" required /></label>
          </>
        )}
        {error && <p className="auth-error" role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}
        {!message && <button className="button button-primary" type="submit" disabled={submitting}>{submitting ? 'Please wait...' : token ? 'Update password' : 'Send reset instructions'}</button>}
        <button className="button button-secondary" type="button" onClick={onBackToLogin}>Back to sign in</button>
      </form>
    </section>
  );
}

export function PaymentReturnPage({ orderId, cancelled, requestWithAuth, onRetry, onHome }) {
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!orderId || cancelled) return undefined;
    let stopped = false;
    let timer;
    let attempts = 0;

    async function checkPayment() {
      try {
        const response = await requestWithAuth(`/api/v1/payments/orders/${orderId}/status`);
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error?.message || 'Payment status could not be checked.');
        }
        if (stopped) return;
        setPayment(payload.data);
        setError('');
        if (
          !['PAID', 'FAILED', 'REFUNDED'].includes(payload.data.paymentStatus) &&
          attempts < 8
        ) {
          attempts += 1;
          timer = setTimeout(checkPayment, 1500);
        }
      } catch (statusError) {
        if (!stopped) setError(statusError.message || 'Payment status could not be checked.');
      }
    }

    checkPayment();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [cancelled, orderId, requestWithAuth]);

  async function retryPayment() {
    setError('');
    setRetrying(true);
    try {
      await onRetry(orderId);
    } catch (retryError) {
      setError(retryError.message || 'A new payment session could not be started.');
    } finally {
      setRetrying(false);
    }
  }

  const title = cancelled
    ? 'Payment cancelled'
    : payment?.paymentStatus === 'PAID'
      ? 'Payment confirmed'
      : payment?.paymentStatus === 'FAILED'
        ? 'Payment failed'
        : payment?.paymentStatus === 'REFUNDED'
          ? 'Payment refunded'
          : 'Confirming your payment';

  return (
    <section className="container section-block confirm-box" aria-live="polite">
      <p className="eyebrow">Order {payment?.orderNumber ?? orderId}</p>
      <h2>{title}</h2>
      {payment?.paymentStatus === 'PAID' && <p>Your payment is verified and your order is confirmed.</p>}
      {payment?.paymentStatus === 'FAILED' && <p>Stripe could not complete the payment. You can try again.</p>}
      {payment?.paymentStatus === 'REFUNDED' && <p>The payment was refunded because the order could not be fulfilled as quoted.</p>}
      {!cancelled && !['PAID', 'FAILED', 'REFUNDED'].includes(payment?.paymentStatus) && (
        <p>We are waiting for Stripe to confirm the payment. This page will update automatically.</p>
      )}
      {cancelled && <p>No payment was captured. Your pending order is still available to retry.</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      {((cancelled || ['FAILED', 'PENDING'].includes(payment?.paymentStatus)) && orderId) && (
        <button type="button" className="button button-primary" onClick={retryPayment} disabled={retrying}>
          {retrying ? 'Starting secure checkout...' : 'Retry payment'}
        </button>
      )}
      <button type="button" className="button button-secondary" onClick={onHome}>Back to store</button>
    </section>
  );
}
