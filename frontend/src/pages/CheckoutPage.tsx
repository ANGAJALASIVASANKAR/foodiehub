import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, CreditCard, Banknote, ShieldCheck } from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { Address, AddressRequest } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PaymentMethod } from '../types';
import OrderSummary from '../components/OrderSummary';
import AddressCard from '../components/AddressCard';
import PaymentSelector from '../components/PaymentSelector';
import LoadingSpinner from '../components/LoadingSpinner';
import FoodImage from '../components/FoodImage';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const EMPTY_ADDRESS: AddressRequest = {
  label: 'HOME',
  fullName: '',
  phone: '',
  houseBuilding: '',
  street: '',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '',
  instructions: '',
  latitude: 12.9716,
  longitude: 77.5946,
  isDefault: false,
};

function loadRazorpayScript(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  const existing = document.querySelector<HTMLScriptElement>('script[src*="checkout.razorpay.com"]');
  if (existing) {
    return new Promise((resolve) => {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      if (window.Razorpay) resolve(true);
    });
  }
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, loading: cartLoading, applyCoupon, removeCoupon } = useCart();
  const { success, error, info } = useToast();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('COD');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [payError, setPayError] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const [newAddress, setNewAddress] = useState<AddressRequest>(EMPTY_ADDRESS);

  useEffect(() => {
    api
      .get<Address[]>('/addresses')
      .then((res) => {
        setAddresses(res.data);
        const def = res.data.find((a) => a.isDefault) || res.data[0];
        if (def) setSelectedId(def.id);
        else setShowAddressForm(true);
      })
      .catch(() => undefined)
      .finally(() => setPageLoading(false));
  }, []);

  useEffect(() => {
    if (!cartLoading && (!cart || cart.items.length === 0)) {
      navigate('/cart', { replace: true });
    }
  }, [cart, cartLoading, navigate]);

  if (pageLoading || cartLoading) return <div className="container"><LoadingSpinner label="Preparing checkout..." /></div>;
  if (!cart || cart.items.length === 0) return null;

  const saveAddress = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.post<Address>('/addresses', newAddress);
      setAddresses((prev) => [...prev, res.data]);
      setSelectedId(res.data.id);
      setShowAddressForm(false);
      success('Address saved');
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const placeOrder = async () => {
    if (!selectedId) {
      error('Please select a delivery address.');
      return;
    }
    setBusy(true);
    setPayError('');
    try {
      if (method === 'COD') {
        const res = await api.post<{ id: number }>('/orders', {
          addressId: selectedId,
          paymentMethod: 'COD',
          couponCode: cart.couponCode || null,
          notes: note || null,
        });
        success('Order placed successfully!');
        setBusy(false);
        navigate(`/order-confirmation/${res.data.id}`, { replace: true });
        return;
      }

      const orderRes = await api.post<{
        orderId: number;
        orderNumber: string;
        razorpayOrderId: string;
        amountPaise: number;
        currency: string;
        keyId: string;
      }>('/orders/razorpay-order', {
        addressId: selectedId,
        paymentMethod: 'RAZORPAY',
        couponCode: cart.couponCode || null,
        notes: note || null,
      });
      const payload = orderRes.data;

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Payment gateway could not be loaded. Please retry or choose Cash on Delivery.');
      }

      const rzp = new window.Razorpay({
        key: payload.keyId,
        amount: payload.amountPaise,
        currency: payload.currency,
        name: 'FOODIEHUB',
        description: `Order #${payload.orderNumber}`,
        order_id: payload.razorpayOrderId,
        prefill: {
          name: user?.fullName || '',
          email: user?.email || '',
          contact: user?.mobile || '',
        },
        theme: { color: '#e23744' },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await api.post(`/orders/${payload.orderId}/verify-payment`, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            success('Payment verified! Order confirmed.');
            navigate(`/order-confirmation/${payload.orderId}`, { replace: true });
          } catch (err) {
            setPayError(errorMessage(err));
            error(errorMessage(err));
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            info('Payment window closed. You can retry or choose Cash on Delivery.');
          },
        },
      });
      rzp.open();
      // Keep the button busy while the Razorpay modal is open;
      // busy is released by ondismiss / handler / error paths above.
    } catch (err) {
      const msg = errorMessage(err);
      setPayError(msg);
      error(msg);
      setBusy(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Checkout</h1>
          <p>Confirm your address, payment method and place the order.</p>
        </div>
      </div>

      <div className="cart-layout" style={{ gridTemplateColumns: '1fr 380px' }}>
        <div style={{ display: 'grid', gap: 22 }}>
          <section className="cart-panel">
            <div style={{ padding: '18px 22px 0' }}>
              <h2 style={{ fontSize: 18, display: 'flex', gap: 8, alignItems: 'center' }}>
                <MapPin size={18} /> Delivery address
              </h2>
            </div>
            <div style={{ padding: '14px 22px 22px', display: 'grid', gap: 12 }}>
              {addresses.map((addr) => (
                <AddressCard
                  key={addr.id}
                  address={addr}
                  selected={selectedId === addr.id}
                  onSelect={() => setSelectedId(addr.id)}
                />
              ))}
              {!showAddressForm && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowAddressForm(true)}>
                  <Plus size={15} /> Add new address
                </button>
              )}
              {showAddressForm && (
                <form className="form-card" style={{ padding: 18, background: '#fafafa' }} onSubmit={saveAddress}>
                  <div className="field-row">
                    <div className="field">
                      <label htmlFor="coFullName">Full name</label>
                      <input id="coFullName" value={newAddress.fullName} onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })} required />
                    </div>
                    <div className="field">
                      <label htmlFor="coPhone">Phone</label>
                      <input id="coPhone" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} required />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="coHouse">House / building</label>
                    <input id="coHouse" value={newAddress.houseBuilding} onChange={(e) => setNewAddress({ ...newAddress, houseBuilding: e.target.value })} required />
                  </div>
                  <div className="field">
                    <label htmlFor="coStreet">Street address</label>
                    <input id="coStreet" value={newAddress.street} onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })} required />
                  </div>
                  <div className="field-row">
                    <div className="field">
                      <label htmlFor="coCity">City</label>
                      <input id="coCity" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} required />
                    </div>
                    <div className="field">
                      <label htmlFor="coState">State</label>
                      <input id="coState" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} required />
                    </div>
                  </div>
                  <div className="field-row">
                    <div className="field">
                      <label htmlFor="coPincode">PIN code</label>
                      <input id="coPincode" value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} required />
                    </div>
                    <div className="field">
                      <label htmlFor="coLabel">Label</label>
                      <select id="coLabel" value={newAddress.label || 'HOME'} onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}>
                        <option value="HOME">Home</option>
                        <option value="WORK">Work</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="coInstructions">Delivery instructions (optional)</label>
                    <input id="coInstructions" value={newAddress.instructions || ''} onChange={(e) => setNewAddress({ ...newAddress, instructions: e.target.value })} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn--primary btn--sm" type="submit" disabled={busy}>Save address</button>
                    <button className="btn btn--ghost btn--sm" type="button" onClick={() => setShowAddressForm(false)}>Cancel</button>
                  </div>
                </form>
              )}
            </div>
          </section>

          <section className="cart-panel">
            <div style={{ padding: '18px 22px 0' }}>
              <h2 style={{ fontSize: 18, display: 'flex', gap: 8, alignItems: 'center' }}>
                <CreditCard size={18} /> Payment method
              </h2>
            </div>
            <div style={{ padding: '14px 22px 22px' }}>
              <PaymentSelector value={method} onChange={setMethod} />
              {method === 'RAZORPAY' && (
                <p style={{ fontSize: 13, color: '#6b6b6b', marginTop: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <ShieldCheck size={15} /> UPI / cards / netbanking via Razorpay (test mode).
                </p>
              )}
              {method === 'COD' && (
                <p style={{ fontSize: 13, color: '#6b6b6b', marginTop: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Banknote size={15} /> Pay in cash when your food arrives.
                </p>
              )}
              {payError && <div className="error-box" style={{ marginTop: 14 }}><span>⚠️</span><div className="error-box__body">{payError}</div></div>}
            </div>
          </section>

          <section className="cart-panel">
            <div style={{ padding: '18px 22px 22px' }}>
              <h2 style={{ fontSize: 18, marginBottom: 14 }}>Order from {cart.restaurant?.name}</h2>
              <div className="cart-rows">
                {cart.items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '10px 0' }}>
                    <FoodImage src={item.food.imageUrl} alt="" className="" />
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: 14.5 }}>{item.food.name}</strong>
                      <div style={{ fontSize: 13, color: '#6b6b6b' }}>{item.quantity} × ₹{Number(item.food.price).toFixed(0)}</div>
                    </div>
                    <strong style={{ fontSize: 14.5 }}>₹{Number(item.itemTotal).toFixed(2)}</strong>
                  </div>
                ))}
              </div>
              <div className="field" style={{ marginTop: 12 }}>
                <label>Special instructions (optional)</label>
                <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. less spicy, extra napkins..." />
              </div>
            </div>
          </section>
        </div>

        <div>
          <OrderSummary
            cart={cart}
            couponBusy={couponBusy}
            onApplyCoupon={async (code) => {
              setCouponBusy(true);
              try {
                await applyCoupon(code);
                success(`Coupon ${code} applied`);
              } catch (err) {
                error(errorMessage(err));
              } finally {
                setCouponBusy(false);
              }
            }}
            onRemoveCoupon={async () => {
              setCouponBusy(true);
              try {
                await removeCoupon();
                success('Coupon removed');
              } catch (err) {
                error(errorMessage(err));
              } finally {
                setCouponBusy(false);
              }
            }}
          />
          <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
            <button type="button" className="btn btn--primary btn--block btn--lg" onClick={placeOrder} disabled={busy || !selectedId}>
              {busy ? 'Processing...' : `Place order · ₹${Number(cart.total).toFixed(2)}`}
            </button>
            <p style={{ fontSize: 12.5, color: '#9a9a9a', textAlign: 'center' }}>
              By placing this order you agree to our terms. Taxes and delivery fee are included.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
