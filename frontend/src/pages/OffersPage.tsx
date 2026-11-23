import { useEffect, useState } from 'react';
import { Copy, Ticket, Percent, Tag } from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { Coupon } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useToast } from '../context/ToastContext';

export default function OffersPage() {
  const { success, error } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    api
      .get<Coupon[]>('/coupons/public')
      .then((res) => setCoupons(res.data))
      .catch((err) => setLoadError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      success(`Copied ${code}`);
    } catch {
      error('Could not copy — select the code manually.');
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Offers & coupons</h1>
          <p>Grab a code and apply it at checkout to save more.</p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading offers..." />
      ) : loadError ? (
        <ErrorMessage message={loadError} />
      ) : (
        <>
          <div className="offer-banner" style={{ marginBottom: 30 }}>
            <div>
              <h2><Ticket size={22} /> Flat 20% off with FOODIE20</h2>
              <p>Applicable on orders above ₹399. Maximum discount ₹120. Valid on all restaurants.</p>
            </div>
            <button type="button" className="btn btn--primary btn--lg" onClick={() => copy('FOODIE20')}>
              <Copy size={16} /> Copy code
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 18 }}>
            {coupons.map((coupon) => (
              <article key={coupon.id} className="coupon-card">
                <div className="coupon-card__top">
                  <span className="coupon-card__badge">
                    <Percent size={14} /> {coupon.discountType === 'PERCENTAGE' ? `${Number(coupon.discountValue)}% OFF` : `₹${Number(coupon.discountValue)} OFF`}
                  </span>
                  <Tag size={16} color="#e23744" />
                </div>
                <h3>{coupon.code}</h3>
                <p>{coupon.description || coupon.title || 'Great savings on your next order.'}</p>
                <div className="coupon-card__meta">
                  <span>Min order ₹{Number(coupon.minOrderAmount).toFixed(0)}</span>
                  <span>
                    {coupon.discountType === 'PERCENTAGE' && coupon.maxDiscount
                      ? `Max ₹${Number(coupon.maxDiscount).toFixed(0)}`
                      : 'No cap'}
                  </span>
                </div>
                <div className="coupon-card__footer">
                  <small>
                    {coupon.validTo
                      ? `Expires ${new Date(coupon.validTo).toLocaleDateString()}`
                      : 'Valid for a limited time'}
                  </small>
                  <button type="button" className="btn btn--primary btn--sm" onClick={() => copy(coupon.code)}>
                    <Copy size={14} /> Copy
                  </button>
                </div>
              </article>
            ))}
          </div>

          <section className="section">
            <div className="section__head">
              <div><h2>How it works</h2></div>
            </div>
            <div className="dash-stats">
              <div className="stat-card">
                <strong>1. Pick a code</strong>
                <span style={{ fontSize: 13.5, color: '#6b6b6b', marginTop: 6 }}>Copy any coupon above that fits your order.</span>
              </div>
              <div className="stat-card">
                <strong>2. Fill your cart</strong>
                <span style={{ fontSize: 13.5, color: '#6b6b6b', marginTop: 6 }}>Add items worth at least the coupon minimum.</span>
              </div>
              <div className="stat-card accent">
                <strong>3. Apply & save</strong>
                <span style={{ fontSize: 13.5, marginTop: 6 }}>Enter the code on the cart or checkout page.</span>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
