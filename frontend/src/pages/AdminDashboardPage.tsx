import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Store, Utensils, ShoppingBag, IndianRupee, Clock, CheckCircle, RefreshCw, Ban,
} from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { AdminDashboard, Order, OrderStatus, Page, Restaurant, Food, User } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useToast } from '../context/ToastContext';

type Tab = 'overview' | 'users' | 'restaurants' | 'foods' | 'orders';

const ORDER_STATUSES: OrderStatus[] = [
  'ORDER_PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED',
];

export default function AdminDashboardPage() {
  const { success, error } = useToast();
  const [tab, setTab] = useState<Tab>('overview');
  const [dash, setDash] = useState<AdminDashboard | null>(null);
  const [users, setUsers] = useState<Page<User> | null>(null);
  const [restaurants, setRestaurants] = useState<Page<Restaurant> | null>(null);
  const [foods, setFoods] = useState<Page<Food> | null>(null);
  const [orders, setOrders] = useState<Page<Order> | null>(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const loadSeq = useRef(0);

  const load = useCallback(() => {
    const reqId = ++loadSeq.current;
    setLoading(true);
    setLoadError('');
    Promise.allSettled([
      api.get<AdminDashboard>('/admin/dashboard'),
      api.get<Page<User>>(`/admin/users?q=${encodeURIComponent(q)}&page=${page}&size=10`),
      api.get<Page<Restaurant>>(`/admin/restaurants?q=${encodeURIComponent(q)}&page=${page}&size=10`),
      api.get<Page<Food>>(`/admin/foods?q=${encodeURIComponent(q)}&page=${page}&size=10`),
      api.get<Page<Order>>(`/admin/orders?q=${encodeURIComponent(q)}&page=${page}&size=10`),
    ])
      .then(([d, u, r, f, o]) => {
        if (reqId !== loadSeq.current) return;
        if (d.status === 'fulfilled') setDash(d.value.data);
        else setLoadError(errorMessage((d as PromiseRejectedResult).reason));
        if (u.status === 'fulfilled') setUsers(u.value.data);
        if (r.status === 'fulfilled') setRestaurants(r.value.data);
        if (f.status === 'fulfilled') setFoods(f.value.data);
        if (o.status === 'fulfilled') setOrders(o.value.data);
      })
      .finally(() => {
        if (reqId === loadSeq.current) setLoading(false);
      });
  }, [q, page]);

  useEffect(() => {
    const t = window.setTimeout(load, 300);
    return () => window.clearTimeout(t);
  }, [load]);

  const toggleUser = async (user: User) => {
    try {
      await api.put(`/admin/users/${user.id}/status`, { enabled: !user.enabled });
      success(`${user.fullName} ${user.enabled ? 'deactivated' : 'activated'}`);
      load();
    } catch (err) {
      error(errorMessage(err));
    }
  };

  const deleteRestaurant = async (restaurant: Restaurant) => {
    if (!window.confirm(`Remove ${restaurant.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/restaurants/${restaurant.id}`);
      success('Restaurant removed');
      load();
    } catch (err) {
      error(errorMessage(err));
    }
  };

  const setFoodAvailability = async (food: Food, available: boolean) => {
    try {
      await api.put(`/admin/foods/${food.id}/availability`, null, { params: { available } });
      success(`${food.name} ${available ? 'marked available' : 'marked unavailable'}`);
      load();
    } catch (err) {
      error(errorMessage(err));
    }
  };

  const updateOrderStatus = async (order: Order, status: OrderStatus) => {
    try {
      await api.put(`/admin/orders/${order.id}/status`, { status });
      success(`Order ${order.orderNumber} → ${status.replace(/_/g, ' ')}`);
      load();
    } catch (err) {
      error(errorMessage(err));
    }
  };

  if (loading && !dash) return <div className="container"><LoadingSpinner label="Loading admin dashboard..." /></div>;
  if (loadError && !dash) {
    return <div className="container" style={{ padding: '50px 0' }}><ErrorMessage message={loadError} onRetry={load} /></div>;
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'restaurants', label: 'Restaurants' },
    { id: 'foods', label: 'Foods' },
    { id: 'orders', label: 'Orders' },
  ];

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Admin dashboard</h1>
          <p>Platform analytics and management.</p>
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

      {tab === 'overview' && dash && (
        <>
          <div className="dash-stats" style={{ marginBottom: 28 }}>
            <div className="stat-card">
              <span><Users size={14} /> Users</span>
              <strong>{dash.totalUsers}</strong>
            </div>
            <div className="stat-card">
              <span><Store size={14} /> Restaurants</span>
              <strong>{dash.totalRestaurants}</strong>
            </div>
            <div className="stat-card">
              <span><Utensils size={14} /> Food items</span>
              <strong>{dash.totalFoodItems}</strong>
            </div>
            <div className="stat-card accent">
              <span><ShoppingBag size={14} /> Total orders</span>
              <strong>{dash.totalOrders}</strong>
            </div>
            <div className="stat-card">
              <span><IndianRupee size={14} /> Revenue</span>
              <strong>₹{Number(dash.totalRevenue).toFixed(2)}</strong>
            </div>
            <div className="stat-card">
              <span><Clock size={14} /> Pending</span>
              <strong>{dash.pendingOrders}</strong>
            </div>
            <div className="stat-card">
              <span><CheckCircle size={14} /> Delivered</span>
              <strong>{dash.deliveredOrders}</strong>
            </div>
          </div>

          <section className="cart-panel">
            <div style={{ padding: '18px 22px 0' }}>
              <h2 style={{ fontSize: 18 }}>Recent orders</h2>
            </div>
            <div style={{ padding: '14px 22px 22px', display: 'grid', gap: 10 }}>
              {dash.recentOrders.length === 0 && <p style={{ color: '#9a9a9a' }}>No orders yet.</p>}
              {dash.recentOrders.map((order) => (
                <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px dashed #ececec', fontSize: 14 }}>
                  <div>
                    <strong>#{order.orderNumber}</strong>
                    <span style={{ color: '#6b6b6b', marginLeft: 10 }}>{order.restaurant.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <span>₹{Number(order.totalAmount).toFixed(2)}</span>
                    <span className={`status-chip ${order.status.toLowerCase().replace(/_/g, '-')}`}>{order.status.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {tab !== 'overview' && (
        <div style={{ marginBottom: 16 }}>
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
            placeholder={`Search ${tab}...`}
            aria-label={`Search ${tab}`}
            style={{ width: 'min(360px, 100%)' }}
            className="search-bar__input"
          />
        </div>
      )}

      {tab === 'users' && users && (
        <div className="cart-panel" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Name</th><th>Email</th><th>Mobile</th><th>Roles</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {users.content.map((u) => (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>{u.mobile}</td>
                  <td>{u.roles.join(', ')}</td>
                  <td>
                    <span className={`status-chip ${u.enabled ? 'delivered' : 'cancelled'}`}>
                      {u.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => toggleUser(u)}>
                      {u.enabled ? <><Ban size={14} /> Disable</> : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: 16, display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn--ghost btn--sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</button>
            <span style={{ alignSelf: 'center', fontSize: 13, color: '#6b6b6b' }}>Page {users.page + 1} / {Math.max(users.totalPages, 1)}</span>
            <button className="btn btn--ghost btn--sm" disabled={users.last} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      )}

      {tab === 'restaurants' && restaurants && (
        <div className="cart-panel" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Name</th><th>Cuisine</th><th>City</th><th>Rating</th><th>Open</th><th></th></tr>
            </thead>
            <tbody>
              {restaurants.content.map((r) => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td><Link to={`/restaurants/${r.id}`}>{r.name}</Link></td>
                  <td>{r.cuisine}</td>
                  <td>{r.city}</td>
                  <td>{Number(r.rating).toFixed(1)}</td>
                  <td>
                    <span className={`status-chip ${r.open && r.active ? 'delivered' : 'cancelled'}`}>
                      {r.open && r.active ? 'Open' : 'Closed'}
                    </span>
                  </td>
                  <td>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => deleteRestaurant(r)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'foods' && foods && (
        <div className="cart-panel" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Name</th><th>Restaurant</th><th>Price</th><th>Veg</th><th>Available</th><th></th></tr>
            </thead>
            <tbody>
              {foods.content.map((f) => (
                <tr key={f.id}>
                  <td>#{f.id}</td>
                  <td>{f.name}</td>
                  <td>{f.restaurantName}</td>
                  <td>₹{Number(f.price).toFixed(0)}</td>
                  <td>{f.isVeg ? 'Yes' : 'No'}</td>
                  <td>
                    <span className={`status-chip ${f.isAvailable ? 'delivered' : 'cancelled'}`}>
                      {f.isAvailable ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => setFoodAvailability(f, !f.isAvailable)}>
                      {f.isAvailable ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'orders' && orders && (
        <div className="cart-panel" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Order</th><th>Restaurant</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {orders.content.map((o) => (
                <tr key={o.id}>
                  <td><Link to={`/orders/${o.id}/track`}>#{o.orderNumber}</Link></td>
                  <td>{o.restaurant.name}</td>
                  <td>{o.customerName}</td>
                  <td>₹{Number(o.totalAmount).toFixed(2)}</td>
                  <td>{o.paymentMethod} / {o.paymentStatus}</td>
                  <td>
                    <select
                      value={o.status}
                      onChange={(e) => updateOrderStatus(o, e.target.value as OrderStatus)}
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={`status-chip ${o.status.toLowerCase().replace(/_/g, '-')}`}>
                      {o.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .data-table th, .data-table td { text-align: left; padding: 12px 14px; border-bottom: 1px solid #f3f3f3; }
        .data-table th { color: #6b6b6b; font-weight: 600; font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.04em; }
        .data-table select { font: inherit; padding: 6px 8px; border: 1px solid #ececec; border-radius: 8px; background: #fff; }
        .search-bar__input { width: 100%; padding: 11px 14px; border: 1px solid #ececec; border-radius: 10px; font: inherit; }
        .search-bar__input:focus { outline: none; border-color: #e23744; }
      `}</style>
    </div>
  );
}
