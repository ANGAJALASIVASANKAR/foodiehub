import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, MapPin, Search, Star, Zap, ChevronRight } from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { Category, InspirationDish, Page, Restaurant } from '../types';
import RestaurantCard from '../components/RestaurantCard';
import CategoryCard from '../components/CategoryCard';
import LoadingSpinner from '../components/LoadingSpinner';
import FoodImage from '../components/FoodImage';
import { useToast } from '../context/ToastContext';
import { LOCATIONS } from '../components/Navbar';

const CUISINE_CATEGORIES = [
  'Biryani', 'Pizza', 'Burgers', 'South Indian', 'North Indian',
  'Chinese', 'Desserts', 'Fast Food', 'Beverages',
];

export default function HomePage() {
  const navigate = useNavigate();
  const { info } = useToast();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState(() => localStorage.getItem('fh_location') || 'Indiranagar');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [inspiration, setInspiration] = useState<InspirationDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [inspoLoading, setInspoLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      api.get<Page<Restaurant>>('/restaurants?size=8&sort=rating'),
      api.get<Category[]>('/foods/categories'),
    ]).then(([restRes, catRes]) => {
      if (cancelled) return;
      if (restRes.status === 'fulfilled') setRestaurants(restRes.value.data.content);
      if (catRes.status === 'fulfilled') setCategories(catRes.value.data);
      setLoading(false);
    });
    api
      .get<InspirationDish[]>('/external/inspiration?q=chicken')
      .then((res) => !cancelled && setInspiration(res.data))
      .catch(() => undefined)
      .finally(() => !cancelled && setInspoLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (LOCATIONS.includes(location)) {
      params.set('city', 'Bengaluru');
      localStorage.setItem('fh_location', location);
    }
    navigate(`/restaurants?${params.toString()}`);
  };

  const onCategory = (name: string) => {
    navigate(`/restaurants?cuisine=${encodeURIComponent(name)}`);
  };

  return (
    <>
      <section className="hero">
        <div className="hero__inner">
          <span className="hero__badge">🔥 FREE delivery over ₹499</span>
          <h1>
            Delicious food, <em>delivered</em> to your door.
          </h1>
          <p>
            Discover the best restaurants around you, track your order live and enjoy
            restaurant-quality meals at home.
          </p>
          <form className="hero__search" onSubmit={onSearch}>
            <MapPin size={19} style={{ alignSelf: 'center', marginLeft: 10, color: '#e23744' }} />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Your location"
              aria-label="Location"
            />
            <span style={{ width: 1, background: '#ececec', alignSelf: 'stretch' }} />
            <Search size={18} style={{ alignSelf: 'center', color: '#6b6b6b' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search restaurants or dishes..."
              aria-label="Search restaurants or dishes"
            />
            <button type="submit" className="btn btn--primary">
              Search
            </button>
          </form>
          <div className="hero__stats">
            <div><strong>12+</strong><span>Top restaurants</span></div>
            <div><strong>87+</strong><span>Dishes on menu</span></div>
            <div><strong>4.5★</strong><span>Average rating</span></div>
            <div><strong>28 min</strong><span>Average delivery</span></div>
          </div>
        </div>
      </section>

      <div className="container">
        <section className="section">
          <div className="section__head">
            <div>
              <h2>What's on your mind?</h2>
              <p>Browse by category and find your next craving.</p>
            </div>
            <Link to="/restaurants" className="section__link">
              View all <ArrowRight size={15} />
            </Link>
          </div>
          <div className="category-row">
            {(categories.length ? categories : CUISINE_CATEGORIES.map((name, i) => ({ id: i, name, slug: name.toLowerCase(), sortOrder: i, imageUrl: null })) as Category[])
              .map((cat) => (
                <CategoryCard key={cat.id} category={cat} onClick={() => onCategory(cat.name)} />
              ))}
          </div>
        </section>

        <section className="section">
          <div className="section__head">
            <div>
              <h2>Top restaurants near you</h2>
              <p>Highly rated places delivering to {location || 'your area'}.</p>
            </div>
            <Link to="/restaurants" className="section__link">
              See all <ArrowRight size={15} />
            </Link>
          </div>
          {loading ? (
            <LoadingSpinner label="Fetching restaurants..." />
          ) : (
            <div className="rest-grid">
              {restaurants.map((r) => (
                <RestaurantCard key={r.id} restaurant={r} />
              ))}
            </div>
          )}
        </section>

        <section className="section">
          <div className="section__head">
            <div>
              <h2>Trending food inspiration</h2>
              <p>Powered by TheMealDB — real dish ideas from around the world.</p>
            </div>
          </div>
          {inspoLoading ? (
            <LoadingSpinner label="Loading inspiration..." />
          ) : (
            <div className="rest-grid">
              {inspiration.slice(0, 4).map((dish) => (
                <article key={dish.name} className="rest-card">
                  <div className="rest-card__media">
                    <FoodImage src={dish.imageUrl} alt={dish.name} />
                    <span className="rest-card__time">
                      <Zap size={13} /> {dish.area || 'Global'}
                    </span>
                  </div>
                  <div className="rest-card__body">
                    <div className="rest-card__title">
                      <h3>{dish.name}</h3>
                    </div>
                    <p className="rest-card__cuisine">{dish.category || 'Dish'}</p>
                    <Link to="/restaurants" className="section__link" style={{ marginTop: 10 }}>
                      Order similar <ChevronRight size={14} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="section">
          <div className="offer-banner">
            <div>
              <h2>Get 20% off with FOODIE20</h2>
              <p>Apply the coupon at checkout on orders above ₹399. Save up to ₹120.</p>
            </div>
            <Link to="/offers" className="btn btn--primary btn--lg">
              Explore offers <ArrowRight size={17} />
            </Link>
          </div>
        </section>

        <section className="section" style={{ paddingBottom: 20 }}>
          <div className="section__head">
            <div>
              <h2>Why FOODIEHUB?</h2>
            </div>
          </div>
          <div className="dash-stats">
            <div className="stat-card">
              <span><Clock size={14} /> Lightning fast</span>
              <strong>28 min</strong>
              <p style={{ fontSize: 13.5, color: '#6b6b6b', marginTop: 6 }}>Average delivery time across the city.</p>
            </div>
            <div className="stat-card">
              <span><Star size={14} /> Curated quality</span>
              <strong>4.5★ avg</strong>
              <p style={{ fontSize: 13.5, color: '#6b6b6b', marginTop: 6 }}>Only the highest rated restaurants make the cut.</p>
            </div>
            <div className="stat-card accent">
              <span><Zap size={14} /> Live tracking</span>
              <strong>Real-time</strong>
              <p style={{ fontSize: 13.5, opacity: 0.9, marginTop: 6 }}>Follow your order from kitchen to doorstep.</p>
            </div>
            <div className="stat-card">
              <span><MapPin size={14} /> Wide coverage</span>
              <strong>12 areas</strong>
              <p style={{ fontSize: 13.5, color: '#6b6b6b', marginTop: 6 }}>Serving every major neighbourhood in Bengaluru.</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
