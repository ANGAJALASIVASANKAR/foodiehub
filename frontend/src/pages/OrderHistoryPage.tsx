import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, RefreshCw, ArrowRight } from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { Order, OrderStatus, Page } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import OrderStatusTimeline from '../components/OrderStatusTimeline';
import FoodImage from '../components/FoodImage';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';

const FILTERS: { label: string; values: OrderStatus[] | null }[] = [
  { label: 'All', values: null },
  { label: 'Active', values: ['ORDER_PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'] },
  { label: 'Delivered', values: ['DELIVERED'] },
  { label: 'Cancelled', values: ['CANCELLED', 'REFUNDED'] },
];

export default function OrderHistoryPage() {
  const { error, success } = useToast();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState(0);

  const load = () => {
    setLoading(true);
    setLoadError('');
    api
      .get<Page<Order>>('/orders?size=50')
      .then((res) => setOrders(res.data.content))
      .catch((err) => setLoadError(errorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = orders.filter((o) => {
    const f = FILTERS[filter].values;
    if (!f) return true;
    return f.includes(o.status);
  });

  const reorder = async (order: Order) => {
    try {
      for (const item of order.items) {
        if (item.foodId) {
          await addItem(item.foodId, item.quantity);
        }
      }
      success('Items added to cart');
      navigate('/cart');
    } catch (err) {
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code;
      if (code !== 'RESTAURANT_MISMATCH') {
        error(errorMessage(err));
      }
      // RESTAURANT_MISMATCH shows the global "start a new cart?" modal.
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>My orders</h1>
          <p>Track current deliveries and reorder your favourites.</p>
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={load}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="filter-chips" style={{ marginBottom: 24 }}>
        {FILTERS.map((f, i) => (
          <button key={f.label} type="button" className={`filter-chip ${filter === i ? 'active' : ''}`} onClick={() => setFilter(i)}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner label="Loading your orders..." />
      ) : loadError ? (
        <ErrorMessage message={loadError} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🧾"
          title="No orders here yet"
          subtitle="When you place an order it will show up here with live tracking."
          action={
            <Link to="/restaurants" className="btn btn--primary">
              Start ordering <ArrowRight size={16} />
            </Link>
          }
        />
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          {filtered.map((order) => (
            <article key={order.id} className="order-card">
              <div className="order-card__head">
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <FoodImage src={order.restaurant.imageUrl} alt="" className="" />
                  <div>
                    <strong>{order.restaurant.name}</strong>
                    <div style={{ fontSize: 13, color: '#6b6b6b' }}>
                      Order #{order.orderNumber} · {new Date(order.placedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`status-chip ${order.status.toLowerCase().replace(/_/g, '-')}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                  <div style={{ fontWeight: 800, marginTop: 6 }}>₹{Number(order.totalAmount).toFixed(2)}</div>
                </div>
              </div>

              <div style={{ fontSize: 14.5, color: '#6b6b6b', margin: '12px 0' }}>
                {order.items.map((i) => `${i.quantity} × ${i.itemName}`).join(', ')}
              </div>

              <OrderStatusTimeline status={order.status} />

              <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                <Link to={`/orders/${order.id}/track`} className="btn btn--primary btn--sm">
                  <Package size={14} /> Track order
                </Link>
                {(order.status === 'DELIVERED' || order.status === 'CANCELLED') && (
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => reorder(order)}>
                    Reorder
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
