import { Banknote, CreditCard, ShieldCheck } from 'lucide-react';
import { PaymentMethod } from '../types';

interface Props {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

export default function PaymentSelector({ value, onChange }: Props) {
  return (
    <div className="payment-selector">
      <label className={`pay-option ${value === 'COD' ? 'active' : ''}`}>
        <input
          type="radio"
          name="payment"
          checked={value === 'COD'}
          onChange={() => onChange('COD')}
        />
        <Banknote size={20} />
        <span>
          <strong>Cash on Delivery</strong>
          <small>Pay when your order arrives</small>
        </span>
      </label>
      <label className={`pay-option ${value === 'RAZORPAY' ? 'active' : ''}`}>
        <input
          type="radio"
          name="payment"
          checked={value === 'RAZORPAY'}
          onChange={() => onChange('RAZORPAY')}
        />
        <CreditCard size={20} />
        <span>
          <strong>Razorpay (Test)</strong>
          <small>Card, UPI & wallets · test mode</small>
        </span>
      </label>
      <p className="payment-selector__note">
        <ShieldCheck size={13} /> Payments are verified server-side. Test keys only — no real money is charged.
      </p>
    </div>
  );
}
