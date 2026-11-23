import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, Lock, Shield } from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const { success, error } = useToast();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [busy, setBusy] = useState(false);
  const [pwd, setPwd] = useState<PasswordForm>({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdBusy, setPwdBusy] = useState(false);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ totalElements: number }>('/orders?size=1')
      .then((res) => setOrderCount(res.data.totalElements))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  if (!user) return <div className="container"><LoadingSpinner label="Loading profile..." /></div>;

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await updateProfile({ fullName: fullName.trim(), mobile: mobile.trim() });
      success('Profile updated');
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (pwd.newPassword.length < 8) {
      error('New password must be at least 8 characters.');
      return;
    }
    if (pwd.newPassword !== pwd.confirmPassword) {
      error('Passwords do not match.');
      return;
    }
    setPwdBusy(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });
      success('Password changed successfully');
      setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setPwdBusy(false);
    }
  };

  const roleLabel = user.roles[0] === 'RESTAURANT_OWNER' ? 'Restaurant Partner'
    : user.roles[0] === 'DELIVERY_PARTNER' ? 'Delivery Partner'
    : user.roles[0] === 'ADMIN' ? 'Administrator' : 'Customer';

  return (
    <div className="container" style={{ maxWidth: 900 }}>
      <div className="page-header">
        <div>
          <h1>My profile</h1>
          <p>Manage your account details and security.</p>
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={logout}>
          Logout
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, alignItems: 'start' }} className="profile-grid">
        <div style={{ display: 'grid', gap: 22 }}>
          <section className="form-card">
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 20 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', background: '#e23744', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20,
              }}>
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 style={{ fontSize: 20 }}>{user.fullName}</h2>
                <div style={{ fontSize: 13.5, color: '#6b6b6b' }}>
                  {roleLabel} · Member
                </div>
              </div>
            </div>

            <form onSubmit={saveProfile}>
              <div className="field">
                <label htmlFor="pfFullName">Full name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 13, top: 15, color: '#9a9a9a' }} />
                  <input id="pfFullName" value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ paddingLeft: 38 }} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="pfEmail">Email address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 13, top: 15, color: '#9a9a9a' }} />
                  <input id="pfEmail" value={user.email} disabled style={{ paddingLeft: 38, background: '#fafafa' }} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="pfMobile">Mobile number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: 13, top: 15, color: '#9a9a9a' }} />
                  <input id="pfMobile" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} style={{ paddingLeft: 38 }} />
                </div>
              </div>
              <button className="btn btn--primary" type="submit" disabled={busy}>
                {busy ? 'Saving...' : 'Save changes'}
              </button>
            </form>
          </section>

          <section className="form-card">
            <h2 style={{ fontSize: 18, display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <Lock size={17} /> Change password
            </h2>
            <form onSubmit={changePassword} style={{ marginTop: 14 }}>
              <div className="field">
                <label htmlFor="pfCurrentPassword">Current password</label>
                <input id="pfCurrentPassword" type="password" value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} required />
              </div>
              <div className="field">
                <label htmlFor="pfNewPassword">New password</label>
                <input id="pfNewPassword" type="password" value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} required />
              </div>
              <div className="field">
                <label htmlFor="pfConfirmPassword">Confirm new password</label>
                <input id="pfConfirmPassword" type="password" value={pwd.confirmPassword} onChange={(e) => setPwd({ ...pwd, confirmPassword: e.target.value })} required />
              </div>
              <button className="btn btn--primary" type="submit" disabled={pwdBusy}>
                {pwdBusy ? 'Updating...' : 'Update password'}
              </button>
            </form>
          </section>
        </div>

        <div style={{ display: 'grid', gap: 22 }}>
          <section className="form-card">
            <h2 style={{ fontSize: 18, display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
              <Shield size={17} /> Account overview
            </h2>
            <div className="dash-stats" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="stat-card">
                <strong>{loading ? '—' : orderCount ?? 0}</strong>
                <span style={{ fontSize: 13, color: '#6b6b6b' }}>Orders placed</span>
              </div>
              <div className="stat-card">
                <strong>{user.roles.length}</strong>
                <span style={{ fontSize: 13, color: '#6b6b6b' }}>Active roles</span>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 10, marginTop: 16, fontSize: 14.5 }}>
              <InfoRow label="User ID" value={`#${user.id}`} />
              <InfoRow label="Email" value={user.email} />
              <InfoRow label="Mobile" value={user.mobile} />
              <InfoRow label="Role" value={roleLabel} />
              <InfoRow label="Status" value={user.enabled ? 'Active' : 'Disabled'} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
              <Link to="/addresses" className="btn btn--ghost btn--sm">Manage addresses</Link>
              <Link to="/orders" className="btn btn--ghost btn--sm">Order history</Link>
              {user.roles.includes('ADMIN') && <Link to="/admin" className="btn btn--primary btn--sm">Admin dashboard</Link>}
              {user.roles.includes('RESTAURANT_OWNER') && <Link to="/owner" className="btn btn--primary btn--sm">Owner dashboard</Link>}
              {user.roles.includes('DELIVERY_PARTNER') && <Link to="/delivery" className="btn btn--primary btn--sm">Delivery dashboard</Link>}
            </div>
          </section>
        </div>
      </div>

      <style>{`
        @media (max-width: 800px) {
          .profile-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #ececec', paddingBottom: 8 }}>
      <span style={{ color: '#6b6b6b' }}>{label}</span>
      <strong style={{ fontSize: 14 }}>{value}</strong>
    </div>
  );
}
