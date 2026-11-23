import { Home, Building2, MapPin, Pencil, Trash2, Star } from 'lucide-react';
import { Address } from '../types';

interface Props {
  address: Address;
  selected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function AddressCard({ address, selected, onSelect, onEdit, onDelete }: Props) {
  const labelKey = (address.label || '').toLowerCase();
  const Icon = labelKey === 'work' ? Building2 : labelKey === 'home' ? Home : MapPin;
  const labelDisplay = address.label
    ? address.label.charAt(0).toUpperCase() + address.label.slice(1).toLowerCase()
    : 'Address';
  return (
    <div
      className={`address-card ${selected ? 'address-card--selected' : ''}`}
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={(e) => {
        if (onSelect && (e.key === 'Enter' || e.key === ' ')) onSelect();
      }}
    >
      <div className="address-card__head">
        <span className="address-card__label">
          <Icon size={14} /> {labelDisplay}
          {address.isDefault && <span className="chip chip--soft">Default</span>}
        </span>
        <div className="address-card__actions" onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <button type="button" className="icon-btn" aria-label="Edit address" onClick={onEdit}>
              <Pencil size={14} />
            </button>
          )}
          {onDelete && (
            <button type="button" className="icon-btn danger" aria-label="Delete address" onClick={onDelete}>
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
      <p className="address-card__name">
        {address.fullName} · {address.phone}
      </p>
      <p className="address-card__line">
        {address.houseBuilding}, {address.street}, {address.city}, {address.state} — {address.pincode}
      </p>
      {address.instructions && <p className="address-card__note">📝 {address.instructions}</p>}
      {onSelect && (
        <span className="address-card__radio" aria-hidden="true">
          {selected && <Star size={12} fill="currentColor" />}
        </span>
      )}
    </div>
  );
}
