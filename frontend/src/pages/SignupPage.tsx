import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { errorMessage, toApiError } from '../api/client';

interface Errors {
  fullName?: string;
  email?: string;
  mobile?: string;
  password?: string;
  confirmPassword?: string;
}

export default function SignupPage() {
  const { register } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');

  const set = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Errors = {};
    if (form.fullName.trim().length < 2) next.fullName = 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) next.mobile = 'Enter a valid 10-digit mobile number.';
    if (form.password.length < 8) next.password = 'Password must be at least 8 characters.';
    else if (!/[A-Z]/.test(form.password) || !/\d/.test(form.password))
      next.password = 'Include an uppercase letter and a number.';
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setBusy(true);
    try {
      await register(form);
      success('Account created! Please login to continue.');
      navigate('/login', { replace: true });
    } catch (err) {
      const payload = toApiError(err);
      if (payload.fieldErrors) setErrors((prev) => ({ ...prev, ...payload.fieldErrors }));
      const msg = errorMessage(err);
      setFormError(msg);
      error(msg);
    } finally {
      setBusy(false);
    }
  };

  const strength = Math.min(
    4,
    (form.password.length >= 8 ? 1 : 0) +
      (/[A-Z]/.test(form.password) ? 1 : 0) +
      (/\d/.test(form.password) ? 1 : 0) +
      (/[^A-Za-z0-9]/.test(form.password) ? 1 : 0),
  );
  const strengthLabel = ['Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength];

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
          <h2>Create your account</h2>
          <p className="sub">Sign up and start ordering from the best restaurants.</p>

          {formError && (
            <div className="error-box" role="alert" style={{ marginBottom: 16 }}>
              <span>⚠️</span>
              <div className="error-box__body">{formError}</div>
            </div>
          )}

          <div className={`field ${errors.fullName ? 'has-error' : ''}`}>
            <label htmlFor="fullName">Full name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: 13, top: 15, color: '#9a9a9a' }} />
              <input id="fullName" placeholder="John Doe" value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)} style={{ paddingLeft: 38 }} />
            </div>
            {errors.fullName && <span className="error-text">{errors.fullName}</span>}
          </div>

          <div className={`field ${errors.email ? 'has-error' : ''}`}>
            <label htmlFor="email">Email address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 13, top: 15, color: '#9a9a9a' }} />
              <input id="email" type="email" placeholder="you@example.com" value={form.email}
                onChange={(e) => set('email', e.target.value)} style={{ paddingLeft: 38 }} />
            </div>
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className={`field ${errors.mobile ? 'has-error' : ''}`}>
            <label htmlFor="mobile">Mobile number</label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={{ position: 'absolute', left: 13, top: 15, color: '#9a9a9a' }} />
              <input id="mobile" inputMode="numeric" placeholder="9876543210" value={form.mobile}
                onChange={(e) => set('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))} style={{ paddingLeft: 38 }} />
            </div>
            {errors.mobile && <span className="error-text">{errors.mobile}</span>}
          </div>

          <div className={`field ${errors.password ? 'has-error' : ''}`}>
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 13, top: 15, color: '#9a9a9a' }} />
              <input id="password" type={show ? 'text' : 'password'} placeholder="Min 8 characters" value={form.password}
                onChange={(e) => set('password', e.target.value)} style={{ paddingLeft: 38, paddingRight: 42 }} />
              <button type="button" onClick={() => setShow((v) => !v)}
                aria-label={show ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', right: 10, top: 11, background: 'none', border: 'none', color: '#6b6b6b' }}>
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {form.password && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1, height: 5, background: '#ececec', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    width: `${(strength / 4) * 100}%`, height: '100%',
                    background: strength <= 1 ? '#e23744' : strength === 2 ? '#f5a623' : '#1ba672',
                    transition: 'width .2s',
                  }} />
                </div>
                <span className="password-hint">{strengthLabel}</span>
              </div>
            )}
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <div className={`field ${errors.confirmPassword ? 'has-error' : ''}`}>
            <label htmlFor="confirmPassword">Confirm password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 13, top: 15, color: '#9a9a9a' }} />
              <input id="confirmPassword" type={show ? 'text' : 'password'} placeholder="Repeat password"
                value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)}
                style={{ paddingLeft: 38 }} />
            </div>
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy}>
            {busy ? 'Creating account...' : 'Sign up'}
          </button>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
