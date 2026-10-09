import { useEffect, useState } from 'react';

export function OrdersPage({ requestWithAuth }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  useEffect(() => {
    let active = true;
    requestWithAuth(`/api/v1/orders?page=${page}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error?.message || 'Order history could not be loaded.');
        }
        if (active) {
          setOrders(payload.data.orders);
          setPagination(payload.data.pagination);
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Order history could not be loaded.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, requestWithAuth]);

  return (
    <section className="container section-block">
      <p className="eyebrow">Your account</p>
      <h2>Order history</h2>
      {loading && <p role="status">Loading your orders...</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      {!loading && !error && orders.length === 0 && (
        <p>You have not placed any orders yet.</p>
      )}
      <div className="review-grid">
        {orders.map((order) => (
          <article className="review-card" key={order.id}>
            <h3>{order.orderNumber}</h3>
            <p>{new Date(order.createdAt).toLocaleDateString()} · {order.status.replaceAll('_', ' ')}</p>
            <p>Payment: {order.paymentStatus.toLowerCase()}</p>
            <ul>
              {order.items.map((item) => (
                <li key={`${order.id}-${item.productId}`}>
                  {item.name} × {item.quantity} · {order.currency} {(item.lineTotal).toFixed(2)}
                </li>
              ))}
            </ul>
            <p><strong>Total: {order.currency} {order.total.toFixed(2)}</strong></p>
            <ol>
              {order.statusHistory.map((entry, index) => (
                <li key={`${entry.status}-${entry.createdAt}-${index}`}>
                  {entry.status.replaceAll('_', ' ')} · {new Date(entry.createdAt).toLocaleString()}
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
      {!loading && pagination.totalPages > 1 && (
        <div className="pagination">
          <button className="button button-secondary" type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <button className="button button-secondary" type="button" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Next</button>
        </div>
      )}
    </section>
  );
}
