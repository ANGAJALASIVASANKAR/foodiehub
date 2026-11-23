import { Link } from 'react-router-dom';
import { Clock, Star, MapPin } from 'lucide-react';
import { Restaurant } from '../types';
import FoodImage from './FoodImage';

export default function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const closed = !restaurant.open || !restaurant.active;
  return (
    <Link to={`/restaurants/${restaurant.id}`} className="rest-card">
      <div className="rest-card__media">
        <FoodImage src={restaurant.imageUrl} alt={restaurant.name} />
        <span className={`rest-card__time ${closed ? 'closed' : ''}`}>
          <Clock size={13} /> {closed ? 'Closed' : `${restaurant.deliveryTimeMinutes} mins`}
        </span>
        {restaurant.rating >= 4.4 && <span className="rest-card__tag">TOP RATED</span>}
      </div>
      <div className="rest-card__body">
        <div className="rest-card__title">
          <h3>{restaurant.name}</h3>
          <span className="rating-pill">
            <Star size={12} fill="currentColor" /> {Number(restaurant.rating).toFixed(1)}
          </span>
        </div>
        <p className="rest-card__cuisine">{restaurant.cuisine}</p>
        <div className="rest-card__meta">
          <span><MapPin size={13} /> {restaurant.city}</span>
          <span>₹{restaurant.priceForTwo} for two</span>
        </div>
      </div>
    </Link>
  );
}
