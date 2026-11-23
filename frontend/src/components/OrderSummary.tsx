import { Cart } from '../types';

interface Props {
  cart: Cart;
  onApplyCoupon?: (code: string) => void;
  onRemoveCoupon?: () => void;
  couponBusy?: boolean;
}

export default function OrderSummary({ cart, onApplyCoupon, onRemoveCoupon, couponBusy }: Props) {
  return (
    <div className="order-summary">
      <h3>Order Summary</h3>
      <div className="order-summary__row">
        <span>Item total</span>
        <span>₹{Number(cart.subtotal).toFixed(2)}</span>
      </div>
      <div className="order-summary__row">
        <span>Delivery charges</span>
        <span className={cart.deliveryCharge === 0 ? 'success-text' : ''}>
          {cart.deliveryCharge === 0 ? 'FREE' : `₹${Number(cart.deliveryCharge).toFixed(2)}`}
        </span>
      </div>
      <div className="order-summary__row">
        <span>Taxes & charges</span>
        <span>₹{Number(cart.taxAmount).toFixed(2)}</span>
      </div>
      {Number(cart.discountAmount) > 0 && (
        <div className="order-summary__row discount">
          <span>
            Discount {cart.couponCode && <em>({cart.couponCode})</em>}
            {onRemoveCoupon && (
              <button type="button" className="link-btn" onClick={onRemoveCoupon} disabled={couponBusy}>
                remove
              </button>
            )}
          </span>
          <span>−₹{Number(cart.discountAmount).toFixed(2)}</span>
        </div>
      )}
      {Number(cart.discountAmount) === 0 && onApplyCoupon && (
        <CouponBox onApply={onApplyCoupon} busy={couponBusy} />
      )}
      <div className="order-summary__total">
        <span>To pay</span>
        <strong>₹{Number(cart.total).toFixed(2)}</strong>
      </div>
    </div>
  );
}

function CouponBox({ onApply, busy }: { onApply: (code: string) => void; busy?: boolean }) {
  return (
    <form
      className="coupon-box"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const code = String(data.get('code') || '').trim();
        if (code) onApply(code);
      }}
    >
      <input name="code" placeholder="Coupon code" aria-label="Coupon code" />
      <button type="submit" className="btn btn--dark btn--sm" disabled={busy}>
        {busy ? '...' : 'APPLY'}
      </button>
    </form>
  );
}
