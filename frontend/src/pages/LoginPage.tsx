import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { api, errorMessage } from '../api/client';

export default function LoginPage() {
  const { login } = useAuth();
  const { refresh } = useCart();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotBusy, setForgotBusy] = useState(false);

  const from = (location.state as { from?: string } | null)?.from || '/';

  const requestReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotBusy(true);
    try {
      const res = await api.post<{ message: string }>('/auth/forgot-password', { email: forgotEmail.trim() });
      success(res.data.message);
      setShowForgot(false);
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setForgotBusy(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!email.trim() || !password) {
      setFormError('Please enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      const user = await login(email.trim(), password);
      await refresh();
      success(`Welcome back, ${user.fullName.split(' ')[0]}!`);
      if (user.roles.includes('ADMIN')) navigate('/admin', { replace: true });
      else if (user.roles.includes('RESTAURANT_OWNER') && from === '/') navigate('/owner', { replace: true });
      else navigate(from, { replace: true });
    } catch (err) {
      const msg = errorMessage(err);
      setFormError(msg);
      error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <form className="form-card" onSubmit={onSubmit} noValidate>
          <div className="logo">
            <span className="logo__mark">F</span>
            <span className="logo__text">
              FOODIE<span>HUB</span>
            </span>
          </div>
          <h2>Welcome back</h2>
          <p className="sub">Login to order your favourite food.</p>

          {formError && (
            <div className="error-box" role="alert" style={{ marginBottom: 16 }}>
              <span>⚠️</span>
              <div className="error-box__body">{formError}</div>
            </div>
          )}

          <div className="field">
            <label htmlFor="email">Email address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 13, top: 15, color: '#9a9a9a' }} />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: 38 }}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 13, top: 15, color: '#9a9a9a' }} />
              <input
                id="password"
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: 38, paddingRight: 42 }}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', right: 10, top: 11, background: 'none', border: 'none', color: '#6b6b6b' }}
              >
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <label className="check-row" style={{ margin: 0 }}>
              <input type="checkbox" defaultChecked /> Remember me
            </label>
            <button type="button" className="link-btn" onClick={() => setShowForgot(true)}>
              Forgot password?
            </button>
          </div>

          {showForgot && (
            <form className="form-card" style={{ padding: 16, marginBottom: 16, background: '#fafafa' }} onSubmit={requestReset}>
              <div className="field">
                <label htmlFor="forgot-email">Account email</label>
                <input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="submit" className="btn btn--primary btn--sm" disabled={forgotBusy}>
                  {forgotBusy ? 'Sending...' : 'Send reset link'}
                </button>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowForgot(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy}>
            {busy ? 'Logging in...' : 'Login'}
          </button>

          <p className="auth-switch">
            New to FOODIEHUB? <Link to="/signup">Create an account</Link>
          </p>

          {import.meta.env.DEV && (
            <div style={{ marginTop: 18, padding: '12px 14px', background: '#fafafa', border: '1px dashed #ececec', borderRadius: 10, fontSize: 12.5, color: '#6b6b6b' }}>
              <strong>Demo logins</strong><br />
              Customer: demo@foodiehub.com / Demo@123<br />
              Admin: admin@foodiehub.com / Admin@123<br />
              Owner: owner1@foodiehub.com / Owner@123<br />
              Rider: rider@foodiehub.com / Rider@123
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
