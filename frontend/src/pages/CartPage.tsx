import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ShoppingBag, ArrowRight, AlertTriangle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import CartItemRow from '../components/CartItemRow';
import OrderSummary from '../components/OrderSummary';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import FoodImage from '../components/FoodImage';
import { errorMessage } from '../api/client';

export default function CartPage() {
  const { cart, loading, updateQuantity, removeItem, applyCoupon, removeCoupon, clear } = useCart();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [couponBusy, setCouponBusy] = useState(false);

  if (loading && !cart) return <div className="container"><LoadingSpinner label="Loading your cart..." /></div>;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container">
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          subtitle="Good food is just a few clicks away. Browse restaurants and add something delicious."
          action={
            <Link to="/restaurants" className="btn btn--primary">
              Explore restaurants <ArrowRight size={16} />
            </Link>
          }
        />
      </div>
    );
  }

  const belowMin = cart.restaurant && Number(cart.subtotal) < Number(cart.minOrderAmount);

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Your cart</h1>
          <p>{cart.itemCount} item{cart.itemCount > 1 ? 's' : ''} ready to order</p>
        </div>
        <button type="button" className="btn btn--danger btn--sm" onClick={async () => {
          try { await clear(); success('Cart cleared'); } catch (err) { error(errorMessage(err)); }
        }}>
          Clear cart
        </button>
      </div>

      <div className="cart-layout">
        <div className="cart-panel">
          {cart.restaurant && (
            <div className="cart-restaurant">
              <FoodImage src={cart.restaurant.imageUrl} alt="" className="" />
              <span>Ordering from <strong>{cart.restaurant.name}</strong></span>
            </div>
          )}
          <div className="cart-rows">
            {cart.items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onQuantity={async (itemId, quantity) => {
                  try {
                    await updateQuantity(itemId, quantity);
                  } catch (err) {
                    error(errorMessage(err));
                  }
                }}
                onRemove={async (itemId) => {
                  try {
                    await removeItem(itemId);
                  } catch (err) {
                    error(errorMessage(err));
                  }
                }}
              />
            ))}
          </div>
          {cart.restaurant && (
            <div style={{ padding: '16px 22px' }}>
              <Link to={`/restaurants/${cart.restaurant.id}`} className="btn btn--ghost btn--sm">
                + Add more items
              </Link>
            </div>
          )}
        </div>

        <div>
          {belowMin && (
            <div className="error-box" style={{ marginBottom: 16 }}>
              <AlertTriangle size={18} />
              <div className="error-box__body">
                Add ₹{(Number(cart.minOrderAmount) - Number(cart.subtotal)).toFixed(2)} more to reach the
                minimum order of ₹{Number(cart.minOrderAmount).toFixed(0)}.
              </div>
            </div>
          )}
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
          <button
            type="button"
            className="btn btn--primary btn--block btn--lg"
            style={{ marginTop: 16 }}
            disabled={Boolean(belowMin)}
            onClick={() => navigate('/checkout')}
          >
            <ShoppingBag size={17} /> Proceed to checkout
          </button>
        </div>
      </div>
    </div>
  );
}
