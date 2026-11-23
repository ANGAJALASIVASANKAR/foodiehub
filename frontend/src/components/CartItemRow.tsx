import { useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem } from '../types';
import FoodImage from './FoodImage';

interface Props {
  item: CartItem;
  onQuantity: (itemId: number, quantity: number) => Promise<void>;
  onRemove: (itemId: number) => Promise<void>;
}

export default function CartItemRow({ item, onQuantity, onRemove }: Props) {
  const [busy, setBusy] = useState(false);

  const change = async (qty: number) => {
    setBusy(true);
    try {
      if (qty <= 0) await onRemove(item.id);
      else await onQuantity(item.id, qty);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cart-row">
      <span className={`veg-dot ${item.food.isVeg ? 'veg' : 'nonveg'}`} title={item.food.isVeg ? 'Vegetarian' : 'Non-vegetarian'}>
        <i />
      </span>
      <div className="cart-row__media">
        <FoodImage src={item.food.imageUrl} alt={item.food.name} />
      </div>
      <div className="cart-row__info">
        <h4>{item.food.name}</h4>
        <p className="cart-row__price">₹{Number(item.food.price).toFixed(2)} each</p>
      </div>
      <div className="qty-stepper" aria-label={`Quantity of ${item.food.name}`}>
        <button type="button" disabled={busy} onClick={() => change(item.quantity - 1)} aria-label="Decrease">
          <Minus size={14} />
        </button>
        <span>{item.quantity}</span>
        <button type="button" disabled={busy || item.quantity >= 50} onClick={() => change(item.quantity + 1)} aria-label="Increase">
          <Plus size={14} />
        </button>
      </div>
      <strong className="cart-row__total">₹{Number(item.itemTotal).toFixed(2)}</strong>
      <button
        type="button"
        className="icon-btn danger"
        aria-label="Remove item"
        disabled={busy}
        onClick={() => change(0)}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
