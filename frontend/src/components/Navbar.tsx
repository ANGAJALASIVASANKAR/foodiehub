import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Bike,
  ChefHat,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const LOCATIONS = [
  'Indiranagar',
  'Koramangala',
  'HSR Layout',
  'Jayanagar',
  'Whitefield',
  'MG Road',
  'BTM Layout',
  'Malleshwaram',
];

export default function Navbar() {
  const { user, logout, hasRole } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [location, setLocation] = useState(() => localStorage.getItem('fh_location') || 'Indiranagar');
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [locOpen, setLocOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('fh_location', location);
  }, [location]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/restaurants?q=${encodeURIComponent(query.trim())}`);
    setMobileOpen(false);
  };

  const cartCount = cart?.itemCount ?? 0;

  const links = (
    <>
      <Link to="/" onClick={() => setMobileOpen(false)}>Home</Link>
      <Link to="/restaurants" onClick={() => setMobileOpen(false)}>Restaurants</Link>
      <Link to="/offers" onClick={() => setMobileOpen(false)}>Offers</Link>
      {user && (
        <Link to="/orders" onClick={() => setMobileOpen(false)}>
          Orders
        </Link>
      )}
      {hasRole('ADMIN') && (
        <Link to="/admin" onClick={() => setMobileOpen(false)}>
          Admin
        </Link>
      )}
      {hasRole('RESTAURANT_OWNER') && (
        <Link to="/owner" onClick={() => setMobileOpen(false)}>
          Owner
        </Link>
      )}
      {hasRole('DELIVERY_PARTNER') && (
        <Link to="/delivery" onClick={() => setMobileOpen(false)}>
          Delivery
        </Link>
      )}
    </>
  );

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <button
          type="button"
          className="navbar__burger"
          aria-label="Toggle menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link to="/" className="logo" aria-label="FOODIEHUB home">
          <span className="logo__mark">F</span>
          <span className="logo__text">
            FOODIE<span>HUB</span>
          </span>
        </Link>

        <div className="navbar__location">
          <button type="button" className="loc-btn" onClick={() => setLocOpen((v) => !v)}>
            <MapPin size={15} />
            <span>{location}</span>
            <svg width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            </svg>
          </button>
          {locOpen && (
            <div className="loc-menu" onMouseLeave={() => setLocOpen(false)}>
              {LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  className={loc === location ? 'active' : ''}
                  onClick={() => {
                    setLocation(loc);
                    setLocOpen(false);
                  }}
                >
                  <MapPin size={13} /> {loc}
                </button>
              ))}
            </div>
          )}
        </div>

        <form className="navbar__search" onSubmit={onSearch}>
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search restaurants or dishes..."
            aria-label="Search"
          />
        </form>

        <nav className={`navbar__links ${mobileOpen ? 'open' : ''}`}>
          <div className="navbar__mobile-search">
            <form onSubmit={onSearch}>
              <Search size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search restaurants or dishes..."
              />
            </form>
          </div>
          {links}
          <div className="navbar__mobile-actions">
            {user ? (
              <>
                <Link to="/profile" onClick={() => setMobileOpen(false)}>
                  <User size={15} /> Profile
                </Link>
                <button type="button" onClick={() => { setMobileOpen(false); logout(); }}>
                  <LogOut size={15} /> Logout
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                Login / Signup
              </Link>
            )}
          </div>
        </nav>

        <div className="navbar__actions">
          <Link to="/cart" className="cart-link" aria-label={`Cart with ${cartCount} items`}>
            <ShoppingBag size={20} />
            {cartCount > 0 && <span className="cart-link__badge">{cartCount}</span>}
          </Link>
          {user ? (
            <div className="user-chip">
              <Link to="/profile" className="user-chip__avatar" title={user.fullName}>
                {user.fullName.charAt(0).toUpperCase()}
              </Link>
              <div className="user-chip__menu">
                <Link to="/profile"><User size={14} /> My Profile</Link>
                <Link to="/orders"><LayoutDashboard size={14} /> Order History</Link>
                <Link to="/addresses"><MapPin size={14} /> Addresses</Link>
                {hasRole('RESTAURANT_OWNER') && <Link to="/owner"><ChefHat size={14} /> Owner Dashboard</Link>}
                {hasRole('DELIVERY_PARTNER') && <Link to="/delivery"><Bike size={14} /> Delivery Dashboard</Link>}
                {hasRole('ADMIN') && <Link to="/admin"><LayoutDashboard size={14} /> Admin Dashboard</Link>}
                <button type="button" onClick={logout}>
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="btn btn--primary btn--sm">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
