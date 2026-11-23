import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock, MapPin, Star, Search, Leaf, ShoppingBag } from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { MenuSection, Restaurant, Review } from '../types';
import FoodCard from '../components/FoodCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import FoodImage from '../components/FoodImage';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function RestaurantDetailsPage() {
  const { id } = useParams();
  const restaurantId = Number(id);
  const { addItem, cart, updateQuantity, removeItem } = useCart();
  const { success, error } = useToast();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [menuQuery, setMenuQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewBusy, setReviewBusy] = useState(false);
  const loadReq = useRef(0);

  useEffect(() => {
    const reqId = ++loadReq.current;
    setLoading(true);
    setLoadError('');
    setActiveTab('');
    Promise.allSettled([
      api.get<Restaurant>(`/restaurants/${restaurantId}`),
      api.get<MenuSection[]>(`/restaurants/${restaurantId}/menu`),
      api.get<Review[]>(`/restaurants/${restaurantId}/reviews`),
    ])
      .then(([r, m, rev]) => {
        if (reqId !== loadReq.current) return;
        if (r.status === 'fulfilled') setRestaurant(r.value.data);
        else setLoadError(errorMessage((r as PromiseRejectedResult).reason));
        if (m.status === 'fulfilled') {
          setSections(m.value.data);
          setActiveTab(m.value.data[0]?.name ?? '');
        }
        if (rev.status === 'fulfilled') setReviews(rev.value.data);
      })
      .finally(() => {
        if (reqId === loadReq.current) setLoading(false);
      });
  }, [restaurantId]);

  const filteredSections = useMemo(() => {
    let result = sections;
    if (menuQuery.trim()) {
      const q = menuQuery.trim().toLowerCase();
      result = result
        .map((s) => ({ ...s, items: s.items.filter((i) => i.name.toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q)) }))
        .filter((s) => s.items.length > 0);
    }
    if (vegOnly) {
      result = result.map((s) => ({ ...s, items: s.items.filter((i) => i.isVeg) })).filter((s) => s.items.length > 0);
    }
    return result;
  }, [sections, menuQuery, vegOnly]);

  const quantities = useMemo(() => {
    const map: Record<number, number> = {};
    cart?.items.forEach((item) => {
      map[item.food.id] = item.quantity;
    });
    return map;
  }, [cart]);

  const cartItemIds = useMemo(() => {
    const map: Record<number, number> = {};
    cart?.items.forEach((item) => {
      map[item.food.id] = item.id;
    });
    return map;
  }, [cart]);

  const sectionsWithRecommended = useMemo(() => {
    const best: MenuSection = {
      categoryId: -1,
      name: 'Recommended',
      items: sections.flatMap((s) => s.items).filter((i) => i.isBestseller).slice(0, 6),
    };
    const rest = sections.filter((s) => s.items.length > 0);
    return best.items.length > 0 ? [best, ...rest] : rest;
  }, [sections]);

  const onAdd = async (foodId: number, qty: number) => {
    try {
      await addItem(foodId, qty);
      success(`${qty} × item added to cart`);
    } catch (err) {
      error(errorMessage(err));
      throw err;
    }
  };

  const onQuantityChange = async (foodId: number, nextQty: number) => {
    const itemId = cartItemIds[foodId];
    try {
      if (itemId != null) {
        if (nextQty <= 0) {
          await removeItem(itemId);
          success('Item removed from cart');
        } else {
          await updateQuantity(itemId, nextQty);
        }
      } else if (nextQty > 0) {
        await addItem(foodId, nextQty);
      }
    } catch (err) {
      error(errorMessage(err));
    }
  };

  const submitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (reviewBusy) return;
    setReviewBusy(true);
    try {
      await api.post(`/restaurants/${restaurantId}/reviews`, { rating: reviewRating, comment: reviewText });
      success('Thanks for your review!');
      setReviewText('');
      const res = await api.get<Review[]>(`/restaurants/${restaurantId}/reviews`);
      setReviews(res.data);
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setReviewBusy(false);
    }
  };

  if (loading) return <div className="container"><LoadingSpinner label="Loading restaurant..." /></div>;
  if (loadError || !restaurant) {
    return (
      <div className="container" style={{ padding: '50px 0' }}>
        <ErrorMessage message={loadError || 'Restaurant not found'} />
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/restaurants" className="btn btn--primary">Browse restaurants</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rest-hero">
        <FoodImage src={restaurant.bannerUrl || restaurant.imageUrl} alt={restaurant.name} />
        <div className="rest-hero__overlay">
          <div className="rest-hero__content">
            <h1>{restaurant.name}</h1>
            <div className="rest-hero__meta">
              <span><Star size={15} fill="currentColor" /> {Number(restaurant.rating).toFixed(1)} ({restaurant.ratingCount} ratings)</span>
              <span>{restaurant.cuisine}</span>
              <span><Clock size={15} /> {restaurant.deliveryTimeMinutes} mins</span>
              <span><MapPin size={15} /> {restaurant.address}, {restaurant.city}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="rest-info-bar">
          <div><strong>⭐ {Number(restaurant.rating).toFixed(1)}</strong><span>{restaurant.ratingCount}+ ratings</span></div>
          <div><strong>🕐 {restaurant.openingTime} – {restaurant.closingTime}</strong><span>{restaurant.open ? 'Open now' : 'Closed now'}</span></div>
          <div><strong>₹{Number(restaurant.priceForTwo).toFixed(0)} for two</strong><span>Approx. cost</span></div>
          <div><strong>🛵 ₹{Number(restaurant.minOrderAmount).toFixed(0)} minimum</strong><span>Min. order</span></div>
          <div><strong>{restaurant.deliveryTimeMinutes} mins</strong><span>Delivery time</span></div>
        </div>

        <p style={{ color: '#6b6b6b', marginTop: 18, maxWidth: 780, fontSize: 15 }}>{restaurant.description}</p>

        <div className="two-col" style={{ marginTop: 10 }}>
          <div>
            <div className="menu-toolbar">
              <div className="menu-tabs">
                {sectionsWithRecommended.map((s) => (
                  <button
                    key={s.categoryId + s.name}
                    type="button"
                    className={`menu-tab ${activeTab === s.name ? 'active' : ''}`}
                    onClick={() => setActiveTab(s.name)}
                  >
                    {s.name} ({s.items.length})
                  </button>
                ))}
              </div>
            </div>

            <div className="menu-toolbar" style={{ marginTop: 4 }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div className="search-bar" style={{ width: '100%' }}>
                  <Search size={16} />
                  <input value={menuQuery} onChange={(e) => setMenuQuery(e.target.value)} placeholder="Search this menu..." aria-label="Search this menu" />
                </div>
              </div>
              <button
                type="button"
                className={`menu-tab ${vegOnly ? 'active' : ''}`}
                onClick={() => setVegOnly((v) => !v)}
              >
                <Leaf size={13} /> Veg only
              </button>
            </div>

            {filteredSections.length === 0 && (
              <EmptyNote text="No dishes match your search." />
            )}

            {(menuQuery || vegOnly ? filteredSections : filteredSections.filter((s) => s.name === activeTab || activeTab === '')).map((section) => (
              <section key={section.categoryId + section.name} className="menu-section">
                <div className="menu-section__head">
                  <h3>{section.name}</h3>
                  <span>{section.items.length} items</span>
                </div>
                {section.items.map((food) => (
                  <FoodCard
                    key={food.id}
                    food={food}
                    quantity={quantities[food.id] || 0}
                    onAdd={(f, q) => onAdd(f.id, q)}
                    onQuantityChange={(f, q) => onQuantityChange(f.id, q)}
                  />
                ))}
              </section>
            ))}

            <section className="section" style={{ borderTop: '1px solid #ececec', paddingTop: 30 }}>
              <div className="section__head">
                <div>
                  <h2 style={{ fontSize: 22 }}>Ratings & Reviews</h2>
                </div>
              </div>
              <form className="form-card" style={{ padding: 20, marginBottom: 20 }} onSubmit={submitReview}>
                <div className="field">
                  <label>Your rating</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setReviewRating(n)}
                        style={{
                          background: n <= reviewRating ? '#f5a623' : '#fff',
                          border: '1px solid #ececec', borderRadius: 8, width: 40, height: 38,
                          color: n <= reviewRating ? '#fff' : '#9a9a9a', fontWeight: 800,
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label>Your review</label>
                  <textarea rows={3} value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Tell others about your experience (order required first)..." />
                </div>
                <button className="btn btn--primary btn--sm" type="submit" disabled={reviewBusy}>
                  {reviewBusy ? 'Posting...' : 'Post review'}
                </button>
              </form>
              {reviews.length === 0 && <EmptyNote text="No reviews yet. Be the first!" />}
              {reviews.map((rev) => (
                <div key={rev.id} className="order-card" style={{ marginBottom: 12 }}>
                  <div className="order-card__head">
                    <strong>{rev.userName}</strong>
                    <span className="rating-pill"><Star size={12} fill="currentColor" /> {rev.rating}</span>
                  </div>
                  <p style={{ color: '#6b6b6b', fontSize: 14, marginTop: 8 }}>{rev.comment || 'No comment'}</p>
                  <small style={{ color: '#9a9a9a' }}>{new Date(rev.createdAt).toLocaleDateString()}</small>
                </div>
              ))}
            </section>
          </div>

          <aside className="side-card">
            <h3><ShoppingBag size={17} /> Your order</h3>
            {cart && cart.restaurant && cart.restaurant.id === restaurant.id ? (
              <>
                <p style={{ fontSize: 14, color: '#6b6b6b', marginBottom: 12 }}>
                  {cart.itemCount} item{cart.itemCount > 1 ? 's' : ''} from this restaurant
                </p>
                {cart.items.slice(0, 4).map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '7px 0', borderBottom: '1px dashed #ececec' }}>
                    <span>{item.quantity} × {item.food.name}</span>
                    <strong>₹{Number(item.itemTotal).toFixed(0)}</strong>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontWeight: 800, fontSize: 16 }}>
                  <span>Total</span>
                  <span>₹{Number(cart.total).toFixed(2)}</span>
                </div>
                <Link to="/cart" className="btn btn--primary btn--block" style={{ marginTop: 16 }}>View cart</Link>
              </>
            ) : (
              <p style={{ fontSize: 14, color: '#6b6b6b' }}>
                {cart && cart.restaurant
                  ? `Your cart has items from ${cart.restaurant.name}. Adding here will ask to start a new order.`
                  : 'Your cart is empty. Add dishes from the menu to get started.'}
              </p>
            )}
            <div style={{ marginTop: 18, padding: 14, background: '#fff1f0', borderRadius: 10, fontSize: 13, color: '#c62828' }}>
              🎟️ Use <strong>FOODIE20</strong> at checkout for 20% off (max ₹120) on orders above ₹399.
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <p style={{ color: '#9a9a9a', padding: '30px 0', textAlign: 'center', fontSize: 14.5 }}>{text}</p>;
}
