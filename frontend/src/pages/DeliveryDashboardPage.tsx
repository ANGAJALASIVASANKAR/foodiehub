import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, Package, Bike, CheckCircle, MapPin } from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { DeliveryOrder } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import FoodImage from '../components/FoodImage';
import { useToast } from '../context/ToastContext';

export default function DeliveryDashboardPage() {
  const { success, error } = useToast();
  const [available, setAvailable] = useState<DeliveryOrder[]>([]);
  const [mine, setMine] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const loadSeq = useRef(0);

  const load = useCallback(() => {
    const reqId = ++loadSeq.current;
    setLoading(true);
    setLoadError('');
    Promise.allSettled([
      api.get<DeliveryOrder[]>('/delivery/orders'),
      api.get<DeliveryOrder[]>('/delivery/orders/mine'),
    ])
      .then(([a, m]) => {
        if (reqId !== loadSeq.current) return;
        if (a.status === 'fulfilled') setAvailable(a.value.data);
        else setLoadError(errorMessage((a as PromiseRejectedResult).reason));
        if (m.status === 'fulfilled') setMine(m.value.data);
      })
      .finally(() => {
        if (reqId === loadSeq.current) setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const accept = async (order: DeliveryOrder) => {
    setBusyId(order.order.id);
    try {
      await api.put(`/delivery/orders/${order.order.id}/accept`);
      success(`Assigned order #${order.order.orderNumber}`);
      load();
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const updateStatus = async (order: DeliveryOrder, status: 'OUT_FOR_DELIVERY' | 'DELIVERED') => {
    setBusyId(order.order.id);
    try {
      await api.put(`/delivery/orders/${order.order.id}/status`, { status });
      success(status === 'DELIVERED' ? 'Delivery completed 🎉' : 'Marked out for delivery');
      load();
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  if (loading && mine.length === 0 && available.length === 0) {
    return <div className="container"><LoadingSpinner label="Loading deliveries..." /></div>;
  }
  if (loadError && mine.length === 0) {
    return <div className="container" style={{ padding: '50px 0' }}><ErrorMessage message={loadError} onRetry={load} /></div>;
  }

  const activeMine = mine.filter((d) => d.deliveryStatus === 'ASSIGNED' || d.deliveryStatus === 'OUT_FOR_DELIVERY' || d.order.status === 'READY_FOR_PICKUP' || d.order.status === 'OUT_FOR_DELIVERY');
  const completedMine = mine.filter((d) => !activeMine.includes(d));

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Delivery dashboard</h1>
          <p>Accept jobs and drop off orders around the city.</p>
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={load}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="dash-stats" style={{ marginBottom: 28 }}>
        <div className="stat-card accent">
          <span><Bike size={14} /> Active jobs</span>
          <strong>{activeMine.length}</strong>
        </div>
        <div className="stat-card">
          <span><Package size={14} /> Available now</span>
          <strong>{available.length}</strong>
        </div>
        <div className="stat-card">
          <span><CheckCircle size={14} /> Completed</span>
          <strong>{completedMine.length}</strong>
        </div>
      </div>

      <section style={{ marginBottom: 34 }}>
        <div className="section__head">
          <div>
            <h2>My active deliveries</h2>
            <p>Pick up from the restaurant, then drop at the customer address.</p>
          </div>
        </div>
        {activeMine.length === 0 ? (
          <EmptyState
            icon="🛵"
            title="No active deliveries"
            subtitle="Accept a job from the available list below to get started."
          />
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {activeMine.map((d) => (
              <article key={d.order.id} className="order-card">
                <div className="order-card__head">
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <FoodImage src={d.order.restaurant.imageUrl} alt="" className="" />
                    <div>
                      <strong>#{d.order.orderNumber}</strong>
                      <div style={{ fontSize: 13, color: '#6b6b6b' }}>{d.order.restaurant.name}</div>
                    </div>
                  </div>
                  <span className={`status-chip ${d.order.status.toLowerCase().replace(/_/g, '-')}`}>
                    {d.order.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div style={{ display: 'grid', gap: 10, margin: '14px 0', fontSize: 14 }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <MapPin size={16} color="#e23744" />
                    <div>
                      <strong>Pickup</strong>
                      <div style={{ color: '#6b6b6b' }}>{d.pickupAddress}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <MapPin size={16} color="#1ba672" />
                    <div>
                      <strong>Drop-off · {d.order.customerName} ({d.order.customerPhone})</strong>
                      <div style={{ color: '#6b6b6b' }}>{d.dropAddress}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 14 }}>
                  <span>Payment: {d.order.paymentMethod}</span>
                  <strong>₹{Number(d.order.totalAmount).toFixed(2)}</strong>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {(d.order.status === 'READY_FOR_PICKUP' || d.deliveryStatus === 'ASSIGNED') && (
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      disabled={busyId === d.order.id}
                      onClick={() => updateStatus(d, 'OUT_FOR_DELIVERY')}
                    >
                      Start delivery
                    </button>
                  )}
                  {d.order.status === 'OUT_FOR_DELIVERY' && (
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      disabled={busyId === d.order.id}
                      onClick={() => updateStatus(d, 'DELIVERED')}
                    >
                      Mark delivered
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="section__head">
          <div>
            <h2>Available for pickup</h2>
            <p>Orders ready at restaurants and waiting for a rider.</p>
          </div>
        </div>
        {available.length === 0 ? (
          <EmptyState
            icon="📭"
            title="Nothing available right now"
            subtitle="New jobs appear here as soon as restaurants mark orders ready for pickup."
            action={
              <button type="button" className="btn btn--ghost" onClick={load}>
                <RefreshCw size={15} /> Check again
              </button>
            }
          />
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {available.map((d) => (
              <article key={d.order.id} className="order-card" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <strong>#{d.order.orderNumber}</strong>
                  <div style={{ fontSize: 13.5, color: '#6b6b6b', marginTop: 4 }}>
                    {d.order.restaurant.name} → {d.dropAddress}
                  </div>
                  <div style={{ fontSize: 13, color: '#9a9a9a', marginTop: 4 }}>
                    {d.order.items.reduce((s, i) => s + i.quantity, 0)} items · {d.order.paymentMethod}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <strong>₹{Number(d.order.totalAmount).toFixed(2)}</strong>
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    disabled={busyId === d.order.id}
                    onClick={() => accept(d)}
                  >
                    Accept job
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {completedMine.length > 0 && (
        <section style={{ marginTop: 34 }}>
          <div className="section__head">
            <div><h2>Recently completed</h2></div>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {completedMine.slice(0, 8).map((d) => (
              <div key={d.order.id} className="order-card" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span>#{d.order.orderNumber} · {d.order.restaurant.name}</span>
                <span className="status-chip delivered">Delivered</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
