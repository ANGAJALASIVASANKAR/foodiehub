import { Link } from 'react-router-dom';
import { Github, Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <Link to="/" className="logo logo--light">
            <span className="logo__mark">F</span>
            <span className="logo__text">
              FOODIE<span>HUB</span>
            </span>
          </Link>
          <p>Delicious food, delivered to your door. Order from the best local restaurants.</p>
        </div>
        <div className="footer__col">
          <h4>Explore</h4>
          <Link to="/restaurants">All Restaurants</Link>
          <Link to="/offers">Offers</Link>
          <Link to="/orders">Order History</Link>
        </div>
        <div className="footer__col">
          <h4>Account</h4>
          <Link to="/profile">Profile</Link>
          <Link to="/addresses">Addresses</Link>
          <Link to="/cart">Cart</Link>
        </div>
        <div className="footer__col">
          <h4>Contact</h4>
          <span><Mail size={14} /> support@foodiehub.example</span>
          <span><Phone size={14} /> 1800-419-4364</span>
          <span><MapPin size={14} /> Bengaluru, India</span>
        </div>
      </div>
      <div className="footer__bottom">
        <span>© {new Date().getFullYear()} FOODIEHUB. Built for learning purposes.</span>
        <span className="footer__social">
          <a href="https://github.com" aria-label="GitHub" target="_blank" rel="noreferrer"><Github size={16} /></a>
        </span>
      </div>
    </footer>
  );
}
