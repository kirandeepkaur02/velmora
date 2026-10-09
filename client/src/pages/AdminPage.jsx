import { useCallback, useEffect, useState } from 'react';

const productDraft = {
  name: '',
  slug: '',
  description: '',
  category: '',
  ingredient: '',
  concern: '',
  skinType: '',
  hairType: '',
  howToUse: '',
  price: '',
  compareAt: '',
  stock: '',
  format: '',
  badge: 'Botanical care',
  accent: 'sage',
  benefits: '',
  ingredients: '',
  tags: '',
  isBestseller: false,
  isNew: false,
  images: [],
  frequentlyBoughtTogether: [],
};

const tabs = ['dashboard', 'products', 'inventory', 'orders', 'customers', 'coupons', 'categories', 'ingredients', 'bundles', 'reviews', 'routines', 'journal'];

export function AdminPage({ requestWithAuth }) {
  const [tab, setTab] = useState('dashboard');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(productDraft);
  const [editingProductId, setEditingProductId] = useState('');
  const [entryDraft, setEntryDraft] = useState({ name: '', slug: '', description: '' });
  const [bundleProducts, setBundleProducts] = useState([]);
  const [bundleDraft, setBundleDraft] = useState({ name: '', slug: '', description: '', productIds: [] });
  const [editingBundleId, setEditingBundleId] = useState('');
  const [customerOrderHistory, setCustomerOrderHistory] = useState({});
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');

  const api = useCallback(async (path, options = {}) => {
    const response = await requestWithAuth(path, {
      ...options,
      headers: {
        ...(options.body && !(options.body instanceof FormData)
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...options.headers,
      },
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.error?.message || 'Admin request failed.');
    }
    return payload.data;
  }, [requestWithAuth]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const endpoints = {
        dashboard: '/api/v1/admin/dashboard',
        products: '/api/v1/admin/products',
        inventory: '/api/v1/admin/inventory/movements',
        orders: '/api/v1/admin/orders',
        customers: '/api/v1/admin/customers',
        coupons: '/api/v1/admin/coupons',
        categories: '/api/v1/admin/categories',
        ingredients: '/api/v1/admin/ingredients',
        bundles: '/api/v1/admin/bundles',
        reviews: '/api/v1/admin/reviews',
        routines: '/api/v1/admin/routines',
        journal: '/api/v1/admin/journal',
      };
      if (tab === 'inventory') {
        const [products, movements] = await Promise.all([
          api('/api/v1/admin/products'),
          api('/api/v1/admin/inventory/movements'),
        ]);
        setData({ products: products.products, movements: movements.movements });
      } else if (tab === 'bundles' || tab === 'products') {
        const [bundles, products] = await Promise.all([
          tab === 'bundles' ? api(endpoints.bundles) : Promise.resolve(null),
          api('/api/v1/admin/products'),
        ]);
        setData(tab === 'bundles' ? bundles : products);
        setBundleProducts(products.products);
      } else if (tab === 'orders') {
        const query = new URLSearchParams();
        if (orderStatusFilter) query.set('status', orderStatusFilter);
        if (paymentStatusFilter) query.set('paymentStatus', paymentStatusFilter);
        setData(await api(`${endpoints.orders}?${query}`));
      } else {
        setData(await api(endpoints[tab]));
      }
    } catch (loadError) {
      setError(loadError.message || 'Admin data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [api, orderStatusFilter, paymentStatusFilter, tab]);

  useEffect(() => {
    const timer = setTimeout(reload, 0);
    return () => clearTimeout(timer);
  }, [reload]);

  async function createProduct(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await api(editingProductId
        ? `/api/v1/admin/products/${editingProductId}`
        : '/api/v1/admin/products', {
        method: editingProductId ? 'PATCH' : 'POST',
        body: JSON.stringify({
          ...draft,
          price: Number(draft.price),
          compareAt: Number(draft.compareAt),
          stock: Number(draft.stock),
          benefits: draft.benefits.split(',').map((value) => value.trim()).filter(Boolean),
          ingredients: draft.ingredients.split(',').map((value) => value.trim()).filter(Boolean),
          tags: draft.tags.split(',').map((value) => value.trim()).filter(Boolean),
          frequentlyBoughtTogether: draft.frequentlyBoughtTogether,
        }),
      });
      setDraft(productDraft);
      setEditingProductId('');
      setMessage(editingProductId ? 'Product updated.' : 'Product added.');
      await reload();
    } catch (createError) {
      setError(createError.message || 'Product could not be created.');
    }
  }

  async function uploadProductImage(event) {
    const input = event.currentTarget;
    const [file] = input.files ?? [];
    if (!file) return;
    setError('');
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const result = await api('/api/v1/admin/product-images', {
        method: 'POST',
        body: formData,
      });
      setDraft((currentDraft) => ({
        ...currentDraft,
        images: [...currentDraft.images, result.image],
      }));
      setMessage('Image uploaded. Save the product to attach it.');
    } catch (uploadError) {
      setError(uploadError.message || 'Image could not be uploaded.');
    } finally {
      input.value = '';
    }
  }

  async function adjustInventory(event, productId) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api(`/api/v1/admin/products/${productId}/inventory`, {
        method: 'PATCH',
        body: JSON.stringify({
          quantity: Number(form.get('quantity')),
          reason: String(form.get('reason')),
        }),
      });
      setMessage('Inventory updated.');
      await reload();
    } catch (updateError) {
      setError(updateError.message || 'Inventory could not be updated.');
    }
  }

  async function updateOrderStatus(orderId, status) {
    try {
      await api(`/api/v1/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setMessage('Order status updated.');
      await reload();
    } catch (updateError) {
      setError(updateError.message || 'Order status could not be updated.');
    }
  }

  async function toggleCustomer(customer) {
    try {
      await api(`/api/v1/admin/customers/${customer._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ disabled: !customer.disabledAt }),
      });
      setMessage('Customer status updated.');
      await reload();
    } catch (updateError) {
      setError(updateError.message || 'Customer status could not be updated.');
    }
  }

  async function createCoupon(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api('/api/v1/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: form.get('code'),
          discountPercent: Number(form.get('discountPercent')),
          minimumSubtotal: Number(form.get('minimumSubtotal')),
          maximumRedemptions: form.get('maximumRedemptions')
            ? Number(form.get('maximumRedemptions'))
            : undefined,
          expiresAt: form.get('expiresAt') || undefined,
        }),
      });
      event.currentTarget.reset();
      setMessage('Coupon created.');
      await reload();
    } catch (createError) {
      setError(createError.message || 'Coupon could not be created.');
    }
  }

  async function toggleCoupon(coupon) {
    try {
      await api(`/api/v1/admin/coupons/${coupon._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !coupon.active }),
      });
      setMessage('Coupon updated.');
      await reload();
    } catch (updateError) {
      setError(updateError.message || 'Coupon could not be updated.');
    }
  }

  async function moderateReview(review, status) {
    try {
      await api(`/api/v1/admin/reviews/${review._id}/moderation`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setMessage(`Review ${status.toLowerCase()}.`);
      await reload();
    } catch (moderationError) {
      setError(moderationError.message || 'Review moderation failed.');
    }
  }

  async function createTaxonomy(event) {
    event.preventDefault();
    const endpoint = tab === 'categories' ? '/api/v1/admin/categories' : '/api/v1/admin/ingredients';
    try {
      await api(endpoint, {
        method: 'POST',
        body: JSON.stringify(entryDraft),
      });
      setEntryDraft({ name: '', slug: '', description: '' });
      setMessage(`${tab === 'categories' ? 'Category' : 'Ingredient'} created.`);
      await reload();
    } catch (createError) {
      setError(createError.message || 'The entry could not be created.');
    }
  }

  async function createContentEntry(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      if (tab === 'routines') {
        const steps = String(form.get('steps'))
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((title, index) => ({
            title,
            productSlug: String(form.get('productSlugs') ?? '')
              .split('\n')
              .map((slug) => slug.trim())
              .filter(Boolean)[index] ?? '',
          }));
        await api('/api/v1/admin/routines', {
          method: 'POST',
          body: JSON.stringify({
            name: form.get('name'),
            slug: form.get('slug'),
            description: form.get('description'),
            steps,
          }),
        });
      } else {
        await api('/api/v1/admin/journal', {
          method: 'POST',
          body: JSON.stringify({
            title: form.get('title'),
            slug: form.get('slug'),
            excerpt: form.get('excerpt'),
            body: form.get('body'),
          }),
        });
      }

      event.currentTarget.reset();
      setMessage('Content published.');
      await reload();
    } catch (createError) {
      setError(createError.message || 'Content could not be published.');
    }
  }

  async function saveBundle(event) {
    event.preventDefault();
    try {
      await api(editingBundleId ? `/api/v1/admin/bundles/${editingBundleId}` : '/api/v1/admin/bundles', {
        method: editingBundleId ? 'PATCH' : 'POST',
        body: JSON.stringify(bundleDraft),
      });
      setMessage(editingBundleId ? 'Bundle updated.' : 'Bundle created.');
      setEditingBundleId('');
      setBundleDraft({ name: '', slug: '', description: '', productIds: [] });
      await reload();
    } catch (saveError) {
      setError(saveError.message || 'Bundle could not be saved.');
    }
  }

  async function loadCustomerOrders(customerId) {
    setError('');
    try {
      const result = await api(`/api/v1/admin/customers/${customerId}/orders`);
      setCustomerOrderHistory((current) => ({ ...current, [customerId]: result.orders }));
    } catch (loadError) {
      setError(loadError.message || 'Customer orders could not be loaded.');
    }
  }

  return (
    <section className="container section-block admin-page">
      <p className="eyebrow">Velmora operations</p>
      <h2>Admin dashboard</h2>
      <nav className="admin-tabs" aria-label="Admin sections">
        {tabs.map((item) => (
          <button type="button" key={item} className={tab === item ? 'button button-primary' : 'button button-secondary'} onClick={() => { setTab(item); setMessage(''); }}>
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </nav>
      {error && <p className="auth-error" role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      {loading && <p role="status">Loading admin data...</p>}

      {!loading && tab === 'dashboard' && data && (
        <>
          <div className="admin-metrics">
            {Object.entries(data.metrics).map(([key, value]) => (
              <article className="account-panel" key={key}><strong>{key === 'totalRevenue' ? `$${Number(value).toFixed(2)}` : value}</strong><p>{key.replace(/([A-Z])/g, ' $1')}</p></article>
            ))}
          </div>
          <h3>Revenue trend</h3>
          <ul>{data.revenueTrend.map((entry) => <li key={`${entry._id.year}-${entry._id.month}`}>{entry._id.year}-{String(entry._id.month).padStart(2, '0')}: ${entry.revenue.toFixed(2)} ({entry.orders} orders)</li>)}</ul>
          <h3>Low stock</h3>
          <ul>{data.lowStockProducts.map((product) => <li key={product.id}>{product.name}: {product.stock} left</li>)}</ul>
          <h3>Top products</h3>
          <ul>{data.topProducts.map((product) => <li key={product._id}>{product.name}: {product.quantity} sold</li>)}</ul>
          <h3>Recent orders</h3>
          <ul>{data.recentOrders.map((order) => <li key={order._id}>{order.orderNumber} · {order.status} · {order.currency} {order.total}</li>)}</ul>
        </>
      )}

      {!loading && tab === 'products' && data && (
        <>
          <form className="admin-form auth-form" onSubmit={createProduct}>
            <h3>{editingProductId ? 'Edit product' : 'Add product'}</h3>
            {[
              ['name', 'Name'],
              ['slug', 'URL slug'],
              ['description', 'Description'],
              ['category', 'Category'],
              ['ingredient', 'Primary ingredient'],
              ['concern', 'Concern'],
              ['skinType', 'Skin type'],
              ['hairType', 'Hair type (optional)'],
              ['howToUse', 'How to use'],
              ['format', 'Format'],
              ['price', 'Price'],
              ['compareAt', 'Compare-at price'],
              ['stock', 'Stock'],
              ['badge', 'Badge'],
              ['benefits', 'Benefits (comma-separated)'],
              ['ingredients', 'Ingredients (comma-separated)'],
              ['tags', 'Product tags (comma-separated)'],
            ].map(([field, label]) => (
              <label key={field}>{label}
                {field === 'howToUse'
                  ? <textarea value={draft[field]} maxLength="2000" onChange={(event) => setDraft({ ...draft, [field]: event.target.value })} />
                  : <input value={draft[field]} required={!['benefits', 'ingredients', 'hairType', 'tags'].includes(field)} type={['price', 'compareAt', 'stock'].includes(field) ? 'number' : 'text'} min={['price', 'compareAt', 'stock'].includes(field) ? '0' : undefined} step={field === 'price' || field === 'compareAt' ? '0.01' : undefined} onChange={(event) => setDraft({ ...draft, [field]: event.target.value })} />}
              </label>
            ))}
            <label>Accent<select value={draft.accent} onChange={(event) => setDraft({ ...draft, accent: event.target.value })}>{['rose', 'sage', 'sand', 'green'].map((accent) => <option key={accent}>{accent}</option>)}</select></label>
            <label className="checkbox-label"><input type="checkbox" checked={draft.isBestseller} onChange={(event) => setDraft({ ...draft, isBestseller: event.target.checked })} /> Bestseller</label>
            <label className="checkbox-label"><input type="checkbox" checked={draft.isNew} onChange={(event) => setDraft({ ...draft, isNew: event.target.checked })} /> New arrival</label>
            <label>Frequently bought together
              <select
                multiple
                size="5"
                value={draft.frequentlyBoughtTogether}
                onChange={(event) => setDraft({
                  ...draft,
                  frequentlyBoughtTogether: [...event.target.selectedOptions].map((option) => option.value),
                })}
              >
                {bundleProducts.filter((product) => product.id !== editingProductId).map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </label>
            <label>Product images (JPEG, PNG, WebP; max 5 MB each)
              <input type="file" accept="image/jpeg,image/png,image/webp" disabled={draft.images.length >= 8} onChange={uploadProductImage} />
            </label>
            {draft.images.length > 0 && (
              <div className="admin-image-list">
                {draft.images.map((image) => (
                  <div className="admin-image-preview" key={image.publicId}>
                    <img src={image.url} alt={`${draft.name || 'Product'} preview`} />
                    <button type="button" className="button button-secondary" onClick={() => setDraft({
                      ...draft,
                      images: draft.images.filter((entry) => entry.publicId !== image.publicId),
                    })}>Remove image</button>
                  </div>
                ))}
              </div>
            )}
            <button className="button button-primary" type="submit">{editingProductId ? 'Save product' : 'Create product'}</button>
            {editingProductId && <button className="button button-secondary" type="button" onClick={() => { setEditingProductId(''); setDraft(productDraft); }}>Cancel edit</button>}
          </form>
          <div className="review-grid">{data.products.map((product) => (
            <article className="review-card" key={product.id}>
              <h3>{product.name}</h3><p>{product.category} · ${product.price} · Stock {product.stock}</p>
              <button type="button" className="button button-secondary" onClick={() => {
                setEditingProductId(product.id);
                setDraft({
                  ...product,
                  price: String(product.price),
                  compareAt: String(product.compareAt),
                  stock: String(product.stock),
                  benefits: product.benefits.join(', '),
                  ingredients: product.ingredients.join(', '),
                  tags: (product.tags ?? []).join(', '),
                  isBestseller: product.isBestseller ?? false,
                  isNew: product.isNew ?? false,
                  images: product.images ?? [],
                  frequentlyBoughtTogether: product.frequentlyBoughtTogether ?? [],
                });
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}>Edit</button>
              <button type="button" className="button button-secondary" onClick={async () => {
                try {
                  await api(`/api/v1/admin/products/${product.id}`, { method: 'DELETE' });
                  setMessage('Product archived.');
                  await reload();
                } catch (archiveError) {
                  setError(archiveError.message || 'Product could not be archived.');
                }
              }}>Archive</button>
            </article>
          ))}</div>
        </>
      )}

      {!loading && tab === 'inventory' && data && (
        <>
          <h3>Adjust stock</h3>
          <div className="review-grid">{data.products.map((product) => (
            <article className="review-card" key={product.id}>
              <strong>{product.name}</strong><p>Current stock: {product.stock}</p>
              <form className="auth-form" onSubmit={(event) => adjustInventory(event, product.id)}>
                <label>New quantity<input name="quantity" type="number" min="0" defaultValue={product.stock} required /></label>
                <label>Reason<input name="reason" maxLength="200" required /></label>
                <button className="button button-primary" type="submit">Save stock</button>
              </form>
            </article>
          ))}</div>
          <h3>Inventory history</h3>
          <div className="review-grid">{data.movements.map((movement) => (
            <article className="review-card" key={movement._id}><strong>{movement.product?.name}</strong><p>{movement.previousStock} → {movement.nextStock} · {movement.reason}</p><small>{new Date(movement.createdAt).toLocaleString()}</small></article>
          ))}</div>
        </>
      )}

      {!loading && tab === 'orders' && data && (
        <>
          <div className="shop-toolbar">
            <label>Order status
              <select value={orderStatusFilter} onChange={(event) => setOrderStatusFilter(event.target.value)}>
                <option value="">All statuses</option>
                {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'PAYMENT_FAILED', 'REFUNDED'].map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <label>Payment
              <select value={paymentStatusFilter} onChange={(event) => setPaymentStatusFilter(event.target.value)}>
                <option value="">All payment statuses</option>
                {['PENDING', 'PAID', 'FAILED', 'REFUNDED'].map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
          </div>
          <div className="review-grid">{data.orders.map((order) => (
            <article className="review-card" key={order._id}>
              <h3>{order.orderNumber}</h3><p>{order.user?.name} · {order.user?.email}</p><p>{order.status} · Payment {order.paymentStatus} · ${order.total}</p>
              <ul>{order.items.map((item) => <li key={`${order._id}-${item.productId}`}>{item.name} × {item.quantity} @ ${item.unitPrice}</li>)}</ul>
              {({ CONFIRMED: ['PROCESSING', 'CANCELLED'], PROCESSING: ['SHIPPED', 'CANCELLED'], SHIPPED: ['OUT_FOR_DELIVERY'], OUT_FOR_DELIVERY: ['DELIVERED'] })[order.status]?.map((status) => <button className="button button-secondary" type="button" key={status} onClick={() => updateOrderStatus(order._id, status)}>{status}</button>)}
            </article>
          ))}</div>
        </>
      )}

      {!loading && tab === 'customers' && data && (
        <div className="review-grid">{data.customers.map((customer) => (
          <article className="review-card" key={customer._id}>
            <h3>{customer.name}</h3><p>{customer.email}</p><p>{customer.disabledAt ? 'Disabled' : 'Active'}</p>
            <button className="button button-secondary" type="button" onClick={() => toggleCustomer(customer)}>{customer.disabledAt ? 'Enable' : 'Disable'}</button>
            <button className="button button-secondary" type="button" onClick={() => loadCustomerOrders(customer._id)}>View order history</button>
            {customerOrderHistory[customer._id]?.map((order) => (
              <p key={order._id}>{order.orderNumber} · {order.status} · {order.currency} {order.total}</p>
            ))}
          </article>
        ))}</div>
      )}

      {!loading && tab === 'reviews' && data && (
        <div className="review-grid">{data.reviews.map((review) => (
          <article className="review-card" key={review._id}>
            <h3>{review.product?.name} · {review.rating}/5</h3>
            <strong>{review.title}</strong>
            <p>{review.body}</p>
            <p>{review.user?.name} · {review.user?.email} · {review.status}</p>
            {review.status !== 'APPROVED' && <button className="button button-primary" type="button" onClick={() => moderateReview(review, 'APPROVED')}>Approve</button>}
            {review.status !== 'REJECTED' && <button className="button button-secondary" type="button" onClick={() => moderateReview(review, 'REJECTED')}>Reject</button>}
          </article>
        ))}</div>
      )}

      {!loading && tab === 'bundles' && data && (
        <>
          <form className="auth-form admin-form" onSubmit={saveBundle}>
            <h3>{editingBundleId ? 'Edit curated bundle' : 'Create curated bundle'}</h3>
            <label>Name<input name="name" value={bundleDraft.name} onChange={(event) => setBundleDraft({ ...bundleDraft, name: event.target.value })} required maxLength="100" /></label>
            <label>Slug<input name="slug" value={bundleDraft.slug} onChange={(event) => setBundleDraft({ ...bundleDraft, slug: event.target.value })} required pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label>
            <label>Description<textarea name="description" value={bundleDraft.description} onChange={(event) => setBundleDraft({ ...bundleDraft, description: event.target.value })} required maxLength="1000" /></label>
            <label>Products (choose 2–8)
              <select name="productIds" multiple required size="8" value={bundleDraft.productIds} onChange={(event) => setBundleDraft({
                ...bundleDraft,
                productIds: Array.from(event.target.selectedOptions, (option) => option.value),
              })}>
                {bundleProducts.filter((product) => product.active).map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </label>
            <button className="button button-primary" type="submit">{editingBundleId ? 'Save bundle' : 'Create bundle'}</button>
            {editingBundleId && <button className="button button-secondary" type="button" onClick={() => {
              setEditingBundleId('');
              setBundleDraft({ name: '', slug: '', description: '', productIds: [] });
            }}>Cancel edit</button>}
          </form>
          <div className="review-grid">{data.bundles.map((bundle) => (
            <article className="review-card" key={bundle.id}>
              <h3>{bundle.name}</h3>
              <p>{bundle.description}</p>
              <ul>{bundle.products.map((product) => <li key={product.id}>{product.name}</li>)}</ul>
              {bundle.active && <button className="button button-secondary" type="button" onClick={() => {
                setEditingBundleId(bundle.id);
                setBundleDraft({
                  name: bundle.name,
                  slug: bundle.slug,
                  description: bundle.description,
                  productIds: bundle.products.map((product) => product.id),
                });
              }}>Edit bundle</button>}
              {bundle.active && <button className="button button-secondary" type="button" onClick={async () => {
                try {
                  await api(`/api/v1/admin/bundles/${bundle.id}`, { method: 'DELETE' });
                  setMessage('Bundle archived.');
                  await reload();
                } catch (archiveError) {
                  setError(archiveError.message || 'Bundle could not be archived.');
                }
              }}>Archive bundle</button>}
            </article>
          ))}</div>
        </>
      )}

      {!loading && tab === 'coupons' && data && (
        <>
          <form className="auth-form admin-form" onSubmit={createCoupon}>
            <h3>Create coupon</h3>
            <label>Code<input name="code" required minLength="3" maxLength="40" /></label>
            <label>Discount percent<input name="discountPercent" type="number" required min="1" max="100" /></label>
            <label>Minimum subtotal<input name="minimumSubtotal" type="number" min="0" step="0.01" defaultValue="0" /></label>
            <label>Maximum redemptions<input name="maximumRedemptions" type="number" min="1" /></label>
            <label>Expires at<input name="expiresAt" type="datetime-local" /></label>
            <button className="button button-primary" type="submit">Create coupon</button>
          </form>
          <div className="review-grid">{data.coupons.map((coupon) => (
            <article className="review-card" key={coupon._id}><h3>{coupon.code}</h3><p>{coupon.discountPercent}% · Redeemed {coupon.redemptionCount}</p><button className="button button-secondary" type="button" onClick={() => toggleCoupon(coupon)}>{coupon.active ? 'Deactivate' : 'Activate'}</button></article>
          ))}</div>
        </>
      )}

      {!loading && ['categories', 'ingredients'].includes(tab) && data && (
        <>
          <form className="auth-form admin-form" onSubmit={createTaxonomy}>
            <h3>Add {tab === 'categories' ? 'category' : 'ingredient'}</h3>
            <label>Name<input value={entryDraft.name} required onChange={(event) => setEntryDraft({ ...entryDraft, name: event.target.value })} /></label>
            <label>Slug<input value={entryDraft.slug} onChange={(event) => setEntryDraft({ ...entryDraft, slug: event.target.value })} placeholder="Generated from name if blank" /></label>
            <label>Description<textarea value={entryDraft.description} required={tab === 'ingredients'} onChange={(event) => setEntryDraft({ ...entryDraft, description: event.target.value })} /></label>
            <button className="button button-primary" type="submit">Create entry</button>
          </form>
          <div className="review-grid">{data.entries.map((entry) => (
            <article className="review-card" key={entry._id}><h3>{entry.name}</h3><p>{entry.description}</p><button className="button button-secondary" type="button" onClick={async () => { const resource = tab; await api(`/api/v1/admin/${resource}/${entry._id}`, { method: 'DELETE' }); setMessage('Entry archived.'); await reload(); }}>Archive</button></article>
          ))}</div>
        </>
      )}

      {!loading && ['routines', 'journal'].includes(tab) && data && (
        <>
          <form className="auth-form admin-form" onSubmit={createContentEntry}>
            <h3>Publish {tab === 'routines' ? 'routine' : 'journal article'}</h3>
            {tab === 'routines' ? (
              <>
                <label>Name<input name="name" required /></label>
                <label>Slug<input name="slug" required /></label>
                <label>Description<textarea name="description" required /></label>
                <label>Steps (one per line)<textarea name="steps" required /></label>
                <label>Product slugs (one per matching step, optional)<textarea name="productSlugs" placeholder={'velvet-oat-cleanser\nbotanical-dew-serum'} /></label>
              </>
            ) : (
              <>
                <label>Title<input name="title" required /></label>
                <label>Slug<input name="slug" required /></label>
                <label>Excerpt<textarea name="excerpt" required /></label>
                <label>Article body<textarea name="body" required rows="8" /></label>
              </>
            )}
            <button className="button button-primary" type="submit">Publish</button>
          </form>
          <div className="review-grid">{(tab === 'routines' ? data.routines : data.articles).map((entry) => (
            <article className="review-card" key={entry._id}><h3>{entry.name ?? entry.title}</h3><p>{entry.description ?? entry.excerpt}</p>
              <button className="button button-secondary" type="button" onClick={async () => {
                try {
                  await api(`/api/v1/admin/${tab}/${entry._id}`, { method: 'DELETE' });
                  setMessage('Content archived.');
                  await reload();
                } catch (archiveError) {
                  setError(archiveError.message || 'Content could not be archived.');
                }
              }}>Archive</button>
            </article>
          ))}</div>
        </>
      )}
    </section>
  );
}
