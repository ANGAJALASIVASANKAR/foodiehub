import { useCallback, useEffect, useState } from 'react';
import {
  RefreshCw, Store, Utensils, ShoppingBag, IndianRupee, Clock, CheckCircle, Plus, Power,
} from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { Food, FoodRequest, Order, OrderStatus, Page, OwnerStats, Restaurant, RestaurantRequest } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useToast } from '../context/ToastContext';

type Tab = 'overview' | 'orders' | 'foods' | 'settings';

const KITCHEN_FLOW: OrderStatus[] = ['ORDER_PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'];

const EMPTY_FOOD: FoodRequest = {
  name: '',
  description: '',
  price: 0,
  imageUrl: '',
  isVeg: true,
  isAvailable: true,
  isBestseller: false,
  categoryId: 1,
};

export default function OwnerDashboardPage() {
  const { success, error } = useToast();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [orders, setOrders] = useState<Page<Order> | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [foodForm, setFoodForm] = useState<FoodRequest>(EMPTY_FOOD);
  const [busy, setBusy] = useState(false);
  const [restForm, setRestForm] = useState<RestaurantRequest | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError('');
    const orderQuery = new URLSearchParams();
    orderQuery.set('page', String(page));
    orderQuery.set('size', '10');
    if (statusFilter) orderQuery.set('status', statusFilter);
    Promise.allSettled([
      api.get<OwnerStats>('/owner/stats'),
      api.get<Restaurant>('/owner/restaurant'),
      api.get<Food[]>('/owner/foods'),
      api.get<Page<Order>>(`/owner/orders?${orderQuery.toString()}`),
    ])
      .then(([s, r, f, o]) => {
        if (s.status === 'fulfilled') setStats(s.value.data);
        else setLoadError(errorMessage((s as PromiseRejectedResult).reason));
        if (r.status === 'fulfilled') {
          setRestaurant(r.value.data);
          setRestForm({
            name: r.value.data.name,
            description: r.value.data.description,
            cuisineType: r.value.data.cuisine,
            addressLine: r.value.data.address,
            city: r.value.data.city,
            state: r.value.data.state,
            pincode: r.value.data.pincode,
            latitude: r.value.data.latitude,
            longitude: r.value.data.longitude,
            imageUrl: r.value.data.imageUrl,
            bannerUrl: r.value.data.bannerUrl,
            minOrderAmount: Number(r.value.data.minOrderAmount),
            deliveryTimeMinutes: r.value.data.deliveryTimeMinutes,
            priceForTwo: Number(r.value.data.priceForTwo),
            openingTime: r.value.data.openingTime,
            closingTime: r.value.data.closingTime,
            active: r.value.data.active,
            open: r.value.data.open,
          });
        }
        if (f.status === 'fulfilled') setFoods(f.value.data);
        if (o.status === 'fulfilled') setOrders(o.value.data);
      })
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const advanceOrder = async (order: Order) => {
    const idx = KITCHEN_FLOW.indexOf(order.status);
    if (idx < 0 || idx >= KITCHEN_FLOW.length - 1) return;
    const next = KITCHEN_FLOW[idx + 1];
    try {
      await api.put(`/owner/orders/${order.id}/status`, { status: next });
      success(`Order ${order.orderNumber} → ${next.replace(/_/g, ' ')}`);
      load();
    } catch (err) {
      error(errorMessage(err));
    }
  };

  const cancelOrder = async (order: Order) => {
    if (!window.confirm(`Cancel order ${order.orderNumber}?`)) return;
    try {
      await api.put(`/owner/orders/${order.id}/status`, { status: 'CANCELLED' });
      success('Order cancelled');
      load();
    } catch (err) {
      error(errorMessage(err));
    }
  };

  const toggleAvailability = async (food: Food) => {
    try {
      await api.put(`/owner/foods/${food.id}/availability`, null, { params: { available: !food.isAvailable } });
      success(`${food.name} updated`);
      load();
    } catch (err) {
      error(errorMessage(err));
    }
  };

  const saveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/owner/foods', foodForm);
      success('Food item added');
      setShowFoodForm(false);
      setFoodForm(EMPTY_FOOD);
      load();
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const saveRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restForm) return;
    setBusy(true);
    try {
      const res = await api.put<Restaurant>('/owner/restaurant', restForm);
      setRestaurant(res.data);
      success('Restaurant updated');
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading && !stats) return <div className="container"><LoadingSpinner label="Loading owner dashboard..." /></div>;
  if (loadError && !stats) {
    return <div className="container" style={{ padding: '50px 0' }}><ErrorMessage message={loadError} onRetry={load} /></div>;
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'orders', label: 'Kitchen orders' },
    { id: 'foods', label: 'Menu' },
    { id: 'settings', label: 'Restaurant' },
  ];

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>{restaurant?.name || 'Owner dashboard'}</h1>
          <p>Manage your kitchen, menu and orders.</p>
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={load}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="filter-chips" style={{ marginBottom: 24 }}>
        {tabs.map((t) => (
          <button key={t.id} type="button" className={`filter-chip ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && stats && (
        <div className="dash-stats" style={{ marginBottom: 28 }}>
          <div className="stat-card accent">
            <span><ShoppingBag size={14} /> Total orders</span>
            <strong>{stats.totalOrders}</strong>
          </div>
          <div className="stat-card">
            <span><IndianRupee size={14} /> Revenue</span>
            <strong>₹{Number(stats.revenue).toFixed(2)}</strong>
          </div>
          <div className="stat-card">
            <span><Clock size={14} /> Pending</span>
            <strong>{stats.pendingOrders}</strong>
          </div>
          <div className="stat-card">
            <span><CheckCircle size={14} /> Delivered</span>
            <strong>{stats.deliveredOrders}</strong>
          </div>
          <div className="stat-card">
            <span><Utensils size={14} /> Menu items</span>
            <strong>{stats.totalFoodItems}</strong>
          </div>
          <div className="stat-card">
            <span><Store size={14} /> Available now</span>
            <strong>{stats.availableFoodItems}</strong>
          </div>
        </div>
      )}

      {tab === 'overview' && stats && (
        <section className="cart-panel">
          <div style={{ padding: '18px 22px 0' }}>
            <h2 style={{ fontSize: 18 }}>Recent orders</h2>
          </div>
          <div style={{ padding: '14px 22px 22px', display: 'grid', gap: 10 }}>
            {stats.recentOrders.length === 0 && <p style={{ color: '#9a9a9a' }}>No orders yet.</p>}
            {stats.recentOrders.map((order) => (
              <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px dashed #ececec', fontSize: 14, gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <strong>#{order.orderNumber}</strong>
                  <span style={{ color: '#6b6b6b', marginLeft: 10 }}>
                    {order.items.map((i) => `${i.quantity}× ${i.itemName}`).join(', ')}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span>₹{Number(order.totalAmount).toFixed(2)}</span>
                  <span className={`status-chip ${order.status.toLowerCase().replace(/_/g, '-')}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'orders' && orders && (
        <>
          <div className="filter-chips" style={{ marginBottom: 16 }}>
            <button type="button" className={`filter-chip ${statusFilter === '' ? 'active' : ''}`} onClick={() => { setStatusFilter(''); setPage(0); }}>All</button>
            {KITCHEN_FLOW.map((s) => (
              <button key={s} type="button" className={`filter-chip ${statusFilter === s ? 'active' : ''}`} onClick={() => { setStatusFilter(s); setPage(0); }}>
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            {orders.content.length === 0 && <p style={{ color: '#9a9a9a' }}>No orders match this filter.</p>}
            {orders.content.map((order) => {
              const idx = KITCHEN_FLOW.indexOf(order.status);
              const next = idx >= 0 && idx < KITCHEN_FLOW.length - 1 ? KITCHEN_FLOW[idx + 1] : null;
              const cancellable = order.status === 'ORDER_PLACED' || order.status === 'CONFIRMED';
              return (
                <article key={order.id} className="order-card">
                  <div className="order-card__head">
                    <div>
                      <strong>#{order.orderNumber}</strong>
                      <div style={{ fontSize: 13, color: '#6b6b6b' }}>
                        {order.customerName} · {new Date(order.placedAt).toLocaleString()}
                      </div>
                    </div>
                    <span className={`status-chip ${order.status.toLowerCase().replace(/_/g, '-')}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: 14.5, color: '#6b6b6b', margin: '10px 0' }}>
                    {order.items.map((i) => `${i.quantity} × ${i.itemName}`).join(', ')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 12 }}>
                    <span>{order.deliveryAddress}</span>
                    <strong>₹{Number(order.totalAmount).toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {next && (
                      <button type="button" className="btn btn--primary btn--sm" onClick={() => advanceOrder(order)}>
                        Mark {next.replace(/_/g, ' ').toLowerCase()}
                      </button>
                    )}
                    {cancellable && (
                      <button type="button" className="btn btn--danger btn--sm" onClick={() => cancelOrder(order)}>
                        Cancel order
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          {orders.totalPages > 1 && (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 18 }}>
              <button className="btn btn--ghost btn--sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</button>
              <span style={{ alignSelf: 'center', fontSize: 13, color: '#6b6b6b' }}>Page {orders.page + 1} / {orders.totalPages}</span>
              <button className="btn btn--ghost btn--sm" disabled={orders.last} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      {tab === 'foods' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 style={{ fontSize: 20 }}>Menu items ({foods.length})</h2>
            <button type="button" className="btn btn--primary btn--sm" onClick={() => setShowFoodForm((v) => !v)}>
              <Plus size={15} /> {showFoodForm ? 'Close' : 'Add food'}
            </button>
          </div>
          {showFoodForm && (
            <form className="form-card" onSubmit={saveFood} style={{ marginBottom: 22 }}>
              <h3 style={{ fontSize: 16, marginBottom: 14 }}>New food item</h3>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="foodName">Name</label>
                  <input id="foodName" value={foodForm.name} onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })} required />
                </div>
                <div className="field">
                  <label htmlFor="foodPrice">Price (₹)</label>
                  <input id="foodPrice" type="number" min={1} value={foodForm.price || ''} onChange={(e) => setFoodForm({ ...foodForm, price: Number(e.target.value) })} required />
                </div>
              </div>
              <div className="field">
                <label htmlFor="foodDescription">Description</label>
                <textarea id="foodDescription" rows={2} value={foodForm.description || ''} onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })} />
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="foodCategory">Category ID</label>
                  <input id="foodCategory" type="number" min={1} value={foodForm.categoryId} onChange={(e) => setFoodForm({ ...foodForm, categoryId: Number(e.target.value) })} required />
                </div>
                <div className="field">
                  <label htmlFor="foodImageUrl">Image URL</label>
                  <input id="foodImageUrl" value={foodForm.imageUrl || ''} onChange={(e) => setFoodForm({ ...foodForm, imageUrl: e.target.value })} />
                </div>
              </div>
              <div className="field-row">
                <label className="check-row">
                  <input type="checkbox" checked={foodForm.isVeg} onChange={(e) => setFoodForm({ ...foodForm, isVeg: e.target.checked })} /> Vegetarian
                </label>
                <label className="check-row">
                  <input type="checkbox" checked={foodForm.isBestseller} onChange={(e) => setFoodForm({ ...foodForm, isBestseller: e.target.checked })} /> Bestseller
                </label>
              </div>
              <button className="btn btn--primary" type="submit" disabled={busy}>{busy ? 'Saving...' : 'Add food'}</button>
            </form>
          )}
          <div style={{ display: 'grid', gap: 10 }}>
            {foods.map((food) => (
              <div key={food.id} className="order-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div>
                  <strong>{food.name}</strong>
                  <div style={{ fontSize: 13, color: '#6b6b6b' }}>
                    {food.categoryName} · ₹{Number(food.price).toFixed(0)} · {food.isVeg ? 'Veg' : 'Non-veg'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span className={`status-chip ${food.isAvailable ? 'delivered' : 'cancelled'}`}>
                    {food.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => toggleAvailability(food)}>
                    <Power size={14} /> Toggle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'settings' && restForm && (
        <form className="form-card" onSubmit={saveRestaurant} style={{ maxWidth: 720 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Restaurant settings</h2>
          <div className="field-row">
            <div className="field">
              <label htmlFor="restName">Name</label>
              <input id="restName" value={restForm.name} onChange={(e) => setRestForm({ ...restForm, name: e.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="restCuisine">Cuisine</label>
              <input id="restCuisine" value={restForm.cuisineType} onChange={(e) => setRestForm({ ...restForm, cuisineType: e.target.value })} required />
            </div>
          </div>
          <div className="field">
            <label htmlFor="restDescription">Description</label>
            <textarea id="restDescription" rows={3} value={restForm.description} onChange={(e) => setRestForm({ ...restForm, description: e.target.value })} required />
          </div>
          <div className="field">
            <label htmlFor="restAddress">Address</label>
            <input id="restAddress" value={restForm.addressLine} onChange={(e) => setRestForm({ ...restForm, addressLine: e.target.value })} required />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="restCity">City</label>
              <input id="restCity" value={restForm.city} onChange={(e) => setRestForm({ ...restForm, city: e.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="restMinOrder">Min order (₹)</label>
              <input id="restMinOrder" type="number" min={0} value={restForm.minOrderAmount ?? 0} onChange={(e) => setRestForm({ ...restForm, minOrderAmount: Number(e.target.value) })} />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="restPriceForTwo">Price for two (₹)</label>
              <input id="restPriceForTwo" type="number" min={0} value={restForm.priceForTwo ?? 0} onChange={(e) => setRestForm({ ...restForm, priceForTwo: Number(e.target.value) })} />
            </div>
            <div className="field">
              <label htmlFor="restDeliveryTime">Delivery time (mins)</label>
              <input id="restDeliveryTime" type="number" min={5} value={restForm.deliveryTimeMinutes ?? 30} onChange={(e) => setRestForm({ ...restForm, deliveryTimeMinutes: Number(e.target.value) })} />
            </div>
          </div>
          <div className="field-row">
            <label className="check-row">
              <input type="checkbox" checked={Boolean(restForm.active)} onChange={(e) => setRestForm({ ...restForm, active: e.target.checked })} /> Active
            </label>
            <label className="check-row">
              <input type="checkbox" checked={Boolean(restForm.open)} onChange={(e) => setRestForm({ ...restForm, open: e.target.checked })} /> Open for orders
            </label>
          </div>
          <button className="btn btn--primary" type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button>
        </form>
      )}
    </div>
  );
}
