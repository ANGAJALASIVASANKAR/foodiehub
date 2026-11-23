import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { errorMessage } from '../api/client';

export default function CartMismatchModal() {
  const { restaurantMismatch, dismissMismatch, confirmMismatchAndAdd } = useCart();
  const { success, error } = useToast();

  if (!restaurantMismatch) return null;

  return (
    <div className="modal-backdrop" onClick={dismissMismatch}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-mismatch-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="cart-mismatch-title">Start a new cart?</h3>
        <p>
          Your cart has items from another restaurant. Adding a dish from{' '}
          <strong>{restaurantMismatch.restaurantName}</strong> will clear your current cart.
        </p>
        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={dismissMismatch}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={async () => {
              try {
                await confirmMismatchAndAdd();
                success('Cart updated with the new restaurant');
              } catch (err) {
                error(errorMessage(err));
              }
            }}
          >
            Clear &amp; add
          </button>
        </div>
      </div>
    </div>
  );
}
