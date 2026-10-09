import { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function ProductReviews({ productId, user, requestWithAuth }) {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ averageRating: 0, count: 0 });
  const [orders, setOrders] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [draft, setDraft] = useState({
    orderId: '',
    rating: 5,
    title: '',
    body: '',
    imageFile: null,
    removeImage: false,
  });

  async function loadReviews() {
    const response = await fetch(`${API_BASE_URL}/api/v1/products/${productId}/reviews`);
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.error?.message || 'Reviews could not be loaded.');
    }
    setReviews(payload.data.reviews);
    setSummary(payload.data.summary);
  }

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/api/v1/products/${productId}/reviews`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error?.message || 'Reviews could not be loaded.');
        if (active) {
          setReviews(payload.data.reviews);
          setSummary(payload.data.summary);
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Reviews could not be loaded.');
      });
    if (user) {
      Promise.all([
        requestWithAuth('/api/v1/orders').then(async (response) => {
          const payload = await response.json();
          if (!response.ok || !payload.success) throw new Error(payload.error?.message || 'Purchase history could not be loaded.');
          return payload.data.orders;
        }),
        requestWithAuth(`/api/v1/products/${productId}/reviews/mine`).then(async (response) => {
          const payload = await response.json();
          if (!response.ok || !payload.success) throw new Error(payload.error?.message || 'Your review could not be loaded.');
          return payload.data.review;
        }),
      ])
        .then(([customerOrders, ownReview]) => {
          if (!active) return;
          const eligible = customerOrders.filter((order) =>
            order.paymentStatus === 'PAID' &&
            order.items.some((item) => item.productId === productId),
          );
          setOrders(eligible);
          setMyReview(ownReview);
          setDraft(ownReview
            ? {
              orderId: ownReview.orderId,
              rating: ownReview.rating,
              title: ownReview.title,
              body: ownReview.body,
              imageFile: null,
              removeImage: false,
            }
            : (current) => ({ ...current, orderId: eligible[0]?.id ?? '' }));
        })
        .catch((loadError) => {
          if (active) setError(loadError.message || 'Purchase history could not be loaded.');
        });
    }
    return () => {
      active = false;
    };
  }, [productId, requestWithAuth, user]);

  async function submitReview(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const formData = new FormData();
      if (!myReview) formData.append('orderId', draft.orderId);
      formData.append('rating', String(Number(draft.rating)));
      formData.append('title', draft.title);
      formData.append('body', draft.body);
      formData.append('removeImage', String(draft.removeImage));
      if (draft.imageFile) formData.append('image', draft.imageFile);
      const response = await requestWithAuth(myReview
        ? `/api/v1/orders/reviews/${myReview.id}`
        : `/api/v1/products/${productId}/reviews`, {
        method: myReview ? 'PATCH' : 'POST',
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message || 'Review could not be submitted.');
      setMessage(myReview ? 'Review updated and returned to moderation.' : 'Review submitted for moderation.');
      setMyReview(payload.data.review ?? { ...myReview, status: 'PENDING' });
      setDraft((current) => ({ ...current, imageFile: null, removeImage: false }));
      await loadReviews();
    } catch (submitError) {
      setError(submitError.message || 'Review could not be submitted.');
    }
  }

  async function deleteReview() {
    setError('');
    setMessage('');
    try {
      const response = await requestWithAuth(`/api/v1/orders/reviews/${myReview.id}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message || 'Review could not be deleted.');
      setMyReview(null);
      setDraft((current) => ({ ...current, title: '', body: '', imageFile: null, removeImage: false }));
      setMessage('Your review was deleted.');
      await loadReviews();
    } catch (deleteError) {
      setError(deleteError.message || 'Review could not be deleted.');
    }
  }

  return (
    <section className="detail-section product-reviews">
      <h3>Customer reviews · {summary.count}</h3>
      {summary.count > 0 && <p>Average rating: {summary.averageRating.toFixed(1)} / 5</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      {reviews.map((review) => (
        <article className="review-card" key={review.id}>
          <p aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
          <h4>{review.title}</h4>
          <p>{review.body}</p>
          {review.image?.url && <img className="review-image" src={review.image.url} alt={`Photo shared in ${review.title}`} loading="lazy" />}
          <small>{review.name} · Verified purchase · {new Date(review.createdAt).toLocaleDateString()}</small>
        </article>
      ))}
      {user && (orders.length > 0 || myReview) && (
        <form className="auth-form" onSubmit={submitReview}>
          <h4>{myReview ? `Your review · ${myReview.status.toLowerCase()}` : 'Review a purchase'}</h4>
          {!myReview && <label>Order<select value={draft.orderId} onChange={(event) => setDraft({ ...draft, orderId: event.target.value })}>{orders.map((order) => <option value={order.id} key={order.id}>{order.orderNumber}</option>)}</select></label>}
          <label>Rating<select value={draft.rating} onChange={(event) => setDraft({ ...draft, rating: event.target.value })}>{[5, 4, 3, 2, 1].map((rating) => <option value={rating} key={rating}>{rating} stars</option>)}</select></label>
          <label>Title<input value={draft.title} maxLength="120" onChange={(event) => setDraft({ ...draft, title: event.target.value })} required /></label>
          <label>Your review<textarea value={draft.body} maxLength="3000" onChange={(event) => setDraft({ ...draft, body: event.target.value })} required /></label>
          <label>Photo (optional; JPEG, PNG, or WebP, max 5 MB)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setDraft({ ...draft, imageFile: event.target.files?.[0] ?? null, removeImage: false })}
            />
          </label>
          {draft.imageFile && <p>New photo selected: {draft.imageFile.name}</p>}
          {myReview?.image?.url && !draft.removeImage && (
            <div className="admin-image-preview">
              <img src={myReview.image.url} alt="Your current review photo" />
              <button type="button" className="button button-secondary" onClick={() => setDraft({ ...draft, removeImage: true, imageFile: null })}>Remove photo</button>
            </div>
          )}
          {draft.removeImage && <p>The current photo will be removed when you save.</p>}
          {message && <p role="status">{message}</p>}
          <button type="submit" className="button button-primary">{myReview ? 'Update review' : 'Submit for moderation'}</button>
          {myReview && <button type="button" className="button button-secondary" onClick={deleteReview}>Delete review</button>}
        </form>
      )}
      {user && orders.length === 0 && <p>Verified-purchase reviews are available after payment for this product.</p>}
    </section>
  );
}
