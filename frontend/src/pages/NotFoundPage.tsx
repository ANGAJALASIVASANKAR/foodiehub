import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="container" style={{ textAlign: 'center', padding: '70px 20px' }}>
      <div style={{ fontSize: 90, fontWeight: 800, color: '#e23744', lineHeight: 1 }}>404</div>
      <h1 style={{ fontSize: 26, marginTop: 8 }}>Page not found</h1>
      <p style={{ color: '#6b6b6b', marginTop: 10 }}>
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link to="/" className="btn btn--primary btn--lg" style={{ marginTop: 24 }}>
        <Home size={16} /> Back to home
      </Link>
    </div>
  );
}
