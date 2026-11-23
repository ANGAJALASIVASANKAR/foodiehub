import { useState } from 'react';
import { Plus, Minus, Star } from 'lucide-react';
import { Food } from '../types';
import FoodImage from './FoodImage';

interface Props {
  food: Food;
  quantity?: number;
  onAdd?: (food: Food, quantity: number) => void | Promise<void>;
  onQuantityChange?: (food: Food, quantity: number) => void;
}

export default function FoodCard({ food, quantity = 0, onAdd, onQuantityChange }: Props) {
  const [localQty, setLocalQty] = useState(0);
  const qty = quantity || localQty;

  const add = async () => {
    const next = qty + 1;
    if (onQuantityChange) {
      onQuantityChange(food, next);
      return;
    }
    try {
      await onAdd?.(food, 1);
      setLocalQty(next);
    } catch {
      // Error already surfaced by the caller; leave qty unchanged.
    }
  };

  const remove = () => {
    const next = Math.max(0, qty - 1);
    if (onQuantityChange) onQuantityChange(food, next);
    else setLocalQty(next);
  };

  return (
    <article className={`food-card ${!food.isAvailable ? 'food-card--out' : ''}`}>
      <div className="food-card__info">
        <span className={`veg-dot ${food.isVeg ? 'veg' : 'nonveg'}`} title={food.isVeg ? 'Vegetarian' : 'Non-vegetarian'}>
          <i />
        </span>
        {food.isBestseller && <span className="food-card__best">★ Bestseller</span>}
        <h4>{food.name}</h4>
        <div className="food-card__rating">
          <Star size={12} fill="currentColor" /> {Number(food.rating || 0).toFixed(1)}
        </div>
        <p className="food-card__price">₹{Number(food.price).toFixed(0)}</p>
        <p className="food-card__desc">{food.description}</p>
        {!food.isAvailable && <span className="food-card__oos">Currently unavailable</span>}
      </div>
      <div className="food-card__media">
        <FoodImage src={food.imageUrl} alt={food.name} />
        {food.isAvailable ? (
          qty === 0 ? (
            <button type="button" className="btn btn--primary btn--sm food-card__add" onClick={add}>
              <Plus size={15} /> ADD
            </button>
          ) : (
            <div className="qty-stepper food-card__stepper">
              <button type="button" onClick={remove} aria-label="Decrease quantity"><Minus size={14} /></button>
              <span>{qty}</span>
              <button type="button" onClick={add} aria-label="Increase quantity"><Plus size={14} /></button>
            </div>
          )
        ) : (
          <span className="food-card__na">Unavailable</span>
        )}
      </div>
    </article>
  );
}
