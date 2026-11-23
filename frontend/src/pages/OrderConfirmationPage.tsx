import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle, MapPin, Receipt, ArrowRight } from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { Order } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import FoodImage from '../components/FoodImage';
import { useCart } from '../context/CartContext';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const orderId = Number(id);
  const { refresh } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    refresh().catch(() => undefined);
    api
      .get<Order>(`/orders/${orderId}`)
      .then((res) => setOrder(res.data))
      .catch((err) => setLoadError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <div className="container"><LoadingSpinner label="Loading your order..." /></div>;
  if (loadError || !order) {
    return (
      <div className="container" style={{ padding: '50px 0' }}>
        <ErrorMessage message={loadError || 'Order not found'} />
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/orders" className="btn btn--primary">View my orders</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div style={{ textAlign: 'center', padding: '46px 0 10px' }}>
        <div style={{
          width: 76, height: 76, borderRadius: '50%', background: '#e8f7f0', color: '#1ba672',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px',
        }}>
          <CheckCircle size={40} />
        </div>
        <h1 style={{ fontSize: 30 }}>Order confirmed!</h1>
        <p style={{ color: '#6b6b6b', marginTop: 8 }}>
          Order <strong>#{order.orderNumber}</strong> has been placed successfully. The restaurant is preparing your food.
        </p>
        <p style={{ marginTop: 6, fontSize: 15 }}>
          {order.estimatedDeliveryAt
            ? <>Estimated delivery by <strong>{new Date(order.estimatedDeliveryAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></>
            : <>Estimated delivery in <strong>~28 minutes</strong></>}
        </p>
      </div>

      <div className="order-card" style={{ marginTop: 24 }}>
        <div className="order-card__head">
          <strong>{order.restaurant.name}</strong>
          <span className={`status-chip ${order.status.toLowerCase().replace(/_/g, '-')}`}>
            {order.status.replace(/_/g, ' ')}
          </span>
        </div>
        {order.items.map((item) => (
          <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '9px 0', borderBottom: '1px dashed #ececec' }}>
            <FoodImage src={item.itemImage} alt="" className="" />
            <div style={{ flex: 1, fontSize: 14 }}>
              {item.quantity} × {item.itemName}
            </div>
            <strong style={{ fontSize: 14 }}>₹{Number(item.totalPrice).toFixed(2)}</strong>
          </div>
        ))}
        <div style={{ display: 'grid', gap: 8, marginTop: 14, fontSize: 14.5 }}>
          <Row label="Food total" value={`₹${Number(order.subtotal).toFixed(2)}`} />
          <Row label="Discount" value={`− ₹${Number(order.discountAmount || 0).toFixed(2)}`} />
          <Row label="Delivery fee" value={`₹${Number(order.deliveryCharge).toFixed(2)}`} />
          <Row label="Tax" value={`₹${Number(order.taxAmount || 0).toFixed(2)}`} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 17, borderTop: '1px solid #ececec', paddingTop: 10 }}>
            <span>Paid ({order.paymentMethod === 'RAZORPAY' ? 'Razorpay' : 'Cash on delivery'})</span>
            <span>₹{Number(order.totalAmount).toFixed(2)}</span>
          </div>
        </div>
        <div style={{ marginTop: 16, padding: 14, background: '#fafafa', borderRadius: 10, fontSize: 14, display: 'flex', gap: 10 }}>
          <MapPin size={17} color="#e23744" />
          <div>
            <strong>Delivering to</strong>
            <div style={{ color: '#6b6b6b' }}>{order.deliveryAddress}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 26, flexWrap: 'wrap' }}>
        <Link to={`/orders/${order.id}/track`} className="btn btn--primary btn--lg">
          Track order <ArrowRight size={16} />
        </Link>
        <Link to="/orders" className="btn btn--ghost btn--lg">
          <Receipt size={16} /> Order history
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: '#6b6b6b' }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
