import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Navigation, RefreshCw, MapPin, Clock } from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { Order, OrderStatus, Tracking } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import OrderStatusTimeline from '../components/OrderStatusTimeline';
import RestaurantMap from '../components/RestaurantMap';
import FoodImage from '../components/FoodImage';

const ACTIVE_STATUSES: OrderStatus[] = ['ORDER_PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'];

export default function OrderTrackingPage() {
  const { id } = useParams();
  const orderId = Number(id);
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [tick, setTick] = useState(0);
  const loadSeq = useRef(0);

  const load = useCallback(() => {
    const reqId = ++loadSeq.current;
    Promise.allSettled([
      api.get<Order>(`/orders/${orderId}`),
      api.get<Tracking>(`/orders/${orderId}/tracking`),
    ])
      .then(([o, t]) => {
        if (reqId !== loadSeq.current) return;
        if (o.status === 'fulfilled') setOrder(o.value.data);
        else setLoadError(errorMessage((o as PromiseRejectedResult).reason));
        if (t.status === 'fulfilled') setTracking(t.value.data);
      })
      .finally(() => {
        if (reqId === loadSeq.current) setLoading(false);
      });
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!order || !ACTIVE_STATUSES.includes(order.status)) return;
    const t = window.setInterval(() => setTick((v) => v + 1), 8000);
    return () => window.clearInterval(t);
  }, [order?.status]);

  useEffect(() => {
    if (tick > 0) {
      setLoading(false);
      load();
    }
  }, [tick, load]);

  if (loading) return <div className="container"><LoadingSpinner label="Loading tracking..." /></div>;
  if (loadError || !order) {
    return (
      <div className="container" style={{ padding: '50px 0' }}>
        <ErrorMessage message={loadError || 'Order not found'} />
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/orders" className="btn btn--primary">My orders</Link>
        </div>
      </div>
    );
  }

  const isActive = ACTIVE_STATUSES.includes(order.status);
  const rider = tracking?.deliveryPartner;
  const progress = Number(tracking?.progressPercent ?? 0);

  const restaurantPoint = {
    name: order.restaurant.name,
    latitude: tracking?.restaurantLatitude ?? null,
    longitude: tracking?.restaurantLongitude ?? null,
  };
  const destination =
    tracking?.destinationLatitude != null && tracking?.destinationLongitude != null
      ? {
          lat: Number(tracking.destinationLatitude),
          lng: Number(tracking.destinationLongitude),
          label: tracking.destinationLabel || 'Delivery',
        }
      : null;

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Track order #{order.orderNumber}</h1>
          <p>{order.restaurant.name} · {order.items.reduce((s, i) => s + i.quantity, 0)} items</p>
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setTick((v) => v + 1)}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }} className="track-grid">
        <div style={{ display: 'grid', gap: 20 }}>
          <div className="order-card" style={{ padding: 24 }}>
            <div className="order-card__head" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <FoodImage src={order.restaurant.imageUrl} alt="" className="" />
                <div>
                  <strong>{order.restaurant.name}</strong>
                  <div style={{ fontSize: 13, color: '#6b6b6b' }}>{order.deliveryAddress}</div>
                </div>
              </div>
              <span className={`status-chip ${order.status.toLowerCase().replace(/_/g, '-')}`}>
                {order.status.replace(/_/g, ' ')}
              </span>
            </div>

            {order.status === 'OUT_FOR_DELIVERY' && (
              <div className="success-box" style={{ marginTop: 14 }}>
                <span>🛵</span>
                <div>
                  <strong>{rider ? `${rider.name} is on the way` : 'Your rider is on the way'}</strong>
                  <p>Keep your phone handy — the rider will call on arrival.</p>
                </div>
              </div>
            )}

            <OrderStatusTimeline status={order.status} events={tracking?.timeline} />

            {order.status === 'DELIVERED' && (
              <p style={{ marginTop: 16, fontSize: 14, color: '#1ba672', fontWeight: 700 }}>
                🎉 Delivered! Enjoy your meal. How was it? Share a review on the restaurant page.
              </p>
            )}
            {order.status === 'CANCELLED' && (
              <p style={{ marginTop: 16, fontSize: 14, color: '#e23744', fontWeight: 700 }}>
                This order was cancelled.
              </p>
            )}
          </div>

          <RestaurantMap
            restaurant={restaurantPoint}
            destination={destination}
            progressPercent={progress}
          />
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <div className="order-card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 16, display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
              <Clock size={16} /> Order summary
            </h3>
            {order.items.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '7px 0', borderBottom: '1px dashed #ececec' }}>
                <span>{item.quantity} × {item.itemName}</span>
                <strong>₹{Number(item.totalPrice).toFixed(0)}</strong>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontWeight: 800 }}>
              <span>Total</span>
              <span>₹{Number(order.totalAmount).toFixed(2)}</span>
            </div>
            <div style={{ marginTop: 12, fontSize: 13.5, color: '#6b6b6b' }}>
              Payment: <strong>{order.paymentMethod === 'RAZORPAY' ? 'Razorpay' : 'Cash on Delivery'}</strong>
              {' · '}Status: <strong>{order.paymentStatus}</strong>
            </div>
          </div>

          <div className="order-card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 16, display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <Navigation size={16} /> Delivery details
            </h3>
            <div style={{ display: 'grid', gap: 10, fontSize: 14 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <MapPin size={16} color="#e23744" />
                <div>
                  <strong>{order.customerName}</strong>
                  <div style={{ color: '#6b6b6b' }}>{order.deliveryAddress}</div>
                  <div style={{ color: '#6b6b6b' }}>{order.customerPhone}</div>
                </div>
              </div>
              {isActive && tracking && tracking.simulated && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#fff1f0', padding: 12, borderRadius: 10 }}>
                  <Clock size={16} color="#e23744" />
                  <span>
                    <strong>{Math.round(progress)}%</strong> of the way · simulated live tracking
                  </span>
                </div>
              )}
              {rider && (
                <div style={{ background: '#fafafa', padding: 12, borderRadius: 10 }}>
                  <strong style={{ fontSize: 13 }}>Delivery partner</strong>
                  <div style={{ color: '#6b6b6b' }}>{rider.name} · {rider.phone}</div>
                  <div style={{ color: '#6b6b6b' }}>{rider.vehicleType || 'Vehicle'} · {Number(rider.rating || 0).toFixed(1)}★</div>
                </div>
              )}
              {order.deliveryInstructions && (
                <div style={{ background: '#fafafa', padding: 12, borderRadius: 10 }}>
                  <strong style={{ fontSize: 13 }}>Instructions</strong>
                  <div style={{ color: '#6b6b6b' }}>{order.deliveryInstructions}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .track-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
