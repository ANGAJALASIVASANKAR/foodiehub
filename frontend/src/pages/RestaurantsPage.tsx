import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import { Food, Page, Restaurant } from '../types';
import RestaurantCard from '../components/RestaurantCard';
import FilterSidebar, { Filters } from '../components/FilterSidebar';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import FoodCard from '../components/FoodCard';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const CUISINES = [
  'Biryani', 'Pizza', 'Burgers', 'South Indian', 'North Indian',
  'Chinese', 'Desserts', 'Fast Food', 'Beverages',
];

export default function RestaurantsPage() {
  const [params, setParams] = useSearchParams();
  const { cart, addItem, updateQuantity, removeItem } = useCart();
  const { success, error } = useToast();

  const [query, setQuery] = useState(params.get('q') || '');
  const [filters, setFilters] = useState<Filters>({
    cuisine: params.get('cuisine') || '',
    minRating: null,
    sort: 'popularity',
    vegOnly: params.get('vegOnly') === 'true',
  });
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Page<Restaurant> | null>(null);
  const [foodResults, setFoodResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const restaurantReq = useRef(0);
  const foodReq = useRef(0);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const reqId = ++restaurantReq.current;
      setLoading(true);
      setLoadError('');
      const search = new URLSearchParams();
      if (query.trim()) search.set('q', query.trim());
      if (filters.cuisine) search.set('cuisine', filters.cuisine);
      if (filters.minRating) search.set('minRating', String(filters.minRating));
      if (filters.vegOnly) search.set('vegOnly', 'true');
      search.set('sort', filters.sort);
      search.set('page', String(page));
      search.set('size', '9');
      api
        .get<Page<Restaurant>>(`/restaurants?${search.toString()}`)
        .then((res) => {
          if (reqId !== restaurantReq.current) return;
          setData(res.data);
          setFoodResults([]);
        })
        .catch((err) => {
          if (reqId === restaurantReq.current) setLoadError(errorMessage(err));
        })
        .finally(() => {
          if (reqId === restaurantReq.current) setLoading(false);
        });
    }, 350);
    return () => window.clearTimeout(t);
  }, [query, filters, page]);

  useEffect(() => {
    if (!query.trim()) return;
    const t = window.setTimeout(() => {
      const reqId = ++foodReq.current;
      api
        .get<Page<Food>>(`/foods?q=${encodeURIComponent(query.trim())}&size=6${filters.vegOnly ? '&veg=true' : ''}`)
        .then((res) => {
          if (reqId === foodReq.current) setFoodResults(res.data.content);
        })
        .catch(() => {
          if (reqId === foodReq.current) setFoodResults([]);
        });
    }, 450);
    return () => window.clearTimeout(t);
  }, [query, filters.vegOnly]);

  const onFiltersChange = (next: Filters) => {
    setFilters(next);
    setPage(0);
    const p = new URLSearchParams(params);
    if (next.cuisine) p.set('cuisine', next.cuisine);
    else p.delete('cuisine');
    setParams(p, { replace: true });
  };

  const onSearchSubmit = () => {
    setPage(0);
    const p = new URLSearchParams(params);
    if (query.trim()) p.set('q', query.trim());
    else p.delete('q');
    setParams(p, { replace: true });
  };

  const addFood = async (food: Food, quantity: number) => {
    try {
      await addItem(food.id, quantity);
      success(`${food.name} added to cart`);
    } catch (err) {
      error(errorMessage(err));
      throw err;
    }
  };

  const cartQuantity = (foodId: number) =>
    cart?.items.find((item) => item.food.id === foodId)?.quantity ?? 0;

  const changeFoodQuantity = async (food: Food, next: number) => {
    const item = cart?.items.find((i) => i.food.id === food.id);
    try {
      if (next <= 0) {
        if (item) await removeItem(item.id);
      } else if (item) {
        await updateQuantity(item.id, next);
      } else {
        await addItem(food.id, next);
      }
    } catch (err) {
      error(errorMessage(err));
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Explore restaurants</h1>
          <p>{data ? `${data.totalElements} places delivering to you` : 'Finding the best food around you...'}</p>
        </div>
        <div style={{ width: 'min(380px, 100%)' }}>
          <SearchBar
            value={query}
            onChange={(value) => {
              setQuery(value);
              setPage(0);
            }}
            onSubmit={onSearchSubmit}
            placeholder="Search restaurants or dishes..."
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 28, marginTop: 24, alignItems: 'start' }} className="listing-grid">
        <FilterSidebar filters={filters} onChange={onFiltersChange} cuisines={CUISINES} />

        <div>
          {loading ? (
            <LoadingSpinner label="Loading restaurants..." />
          ) : loadError ? (
            <ErrorMessage message={loadError} onRetry={() => setFilters({ ...filters })} />
          ) : (
            <>
              {foodResults.length > 0 && (
                <div style={{ marginBottom: 30 }}>
                  <div className="section__head">
                    <div>
                      <h2 style={{ fontSize: 20 }}>Dishes matching "{query}"</h2>
                    </div>
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #ececec', borderRadius: 14, padding: '4px 18px' }}>
                    {foodResults.map((food) => (
                      <FoodCard
                        key={food.id}
                        food={food}
                        quantity={cartQuantity(food.id)}
                        onAdd={addFood}
                        onQuantityChange={(f, next) => void changeFoodQuantity(f, next)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {data && data.content.length === 0 ? (
                <EmptyState
                  title="No restaurants found"
                  subtitle="Try changing your search or clearing a few filters."
                  action={
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={() => {
                        setQuery('');
                        setFilters({ cuisine: '', minRating: null, sort: 'popularity', vegOnly: false });
                      }}
                    >
                      Clear filters
                    </button>
                  }
                />
              ) : (
                <>
                  <div className="rest-grid">
                    {data?.content.map((r) => (
                      <RestaurantCard key={r.id} restaurant={r} />
                    ))}
                  </div>
                  {data && (
                    <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .listing-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
