import { FormEvent, useEffect, useState } from 'react';
import { Plus, MapPin } from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { Address, AddressRequest } from '../types';
import AddressCard from '../components/AddressCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

const EMPTY: AddressRequest = {
  label: 'HOME',
  fullName: '',
  phone: '',
  houseBuilding: '',
  street: '',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '',
  instructions: '',
  latitude: 12.9716,
  longitude: 77.5946,
  isDefault: false,
};

export default function AddressesPage() {
  const { success, error } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddressRequest>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    setLoadError('');
    api
      .get<Address[]>('/addresses')
      .then((res) => setAddresses(res.data))
      .catch((err) => setLoadError(errorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (editingId) {
        await api.put(`/addresses/${editingId}`, form);
        success('Address updated');
      } else {
        await api.post('/addresses', form);
        success('Address added');
      }
      setShowForm(false);
      setForm(EMPTY);
      setEditingId(null);
      load();
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (addr: Address) => {
    if (!window.confirm(`Delete address "${addr.street}"?`)) return;
    try {
      await api.delete(`/addresses/${addr.id}`);
      success('Address deleted');
      load();
    } catch (err) {
      error(errorMessage(err));
    }
  };

  const onSetDefault = async (addr: Address) => {
    try {
      await api.put(`/addresses/${addr.id}/default`);
      success('Default address updated');
      load();
    } catch (err) {
      error(errorMessage(err));
    }
  };

  const startEdit = (addr: Address) => {
    setForm({
      label: addr.label,
      fullName: addr.fullName,
      phone: addr.phone,
      houseBuilding: addr.houseBuilding,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      instructions: addr.instructions,
      latitude: addr.latitude,
      longitude: addr.longitude,
      isDefault: addr.isDefault,
    });
    setEditingId(addr.id);
    setShowForm(true);
  };

  return (
    <div className="container" style={{ maxWidth: 860 }}>
      <div className="page-header">
        <div>
          <h1>My addresses</h1>
          <p>Save frequently used delivery locations for faster checkout.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => { setShowForm((v) => !v); setEditingId(null); setForm(EMPTY); }}>
          <Plus size={16} /> {showForm ? 'Close' : 'Add address'}
        </button>
      </div>

      {showForm && (
        <form className="form-card" onSubmit={onSubmit} style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>{editingId ? 'Edit address' : 'New address'}</h2>
          <div className="field-row">
            <div className="field">
              <label htmlFor="addrFullName">Full name</label>
              <input id="addrFullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="addrPhone">Phone number</label>
              <input id="addrPhone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
          </div>
          <div className="field">
            <label htmlFor="addrHouse">House / building</label>
            <input id="addrHouse" value={form.houseBuilding} onChange={(e) => setForm({ ...form, houseBuilding: e.target.value })} required />
          </div>
          <div className="field">
            <label htmlFor="addrStreet">Street address</label>
            <input id="addrStreet" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} required />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="addrCity">City</label>
              <input id="addrCity" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="addrState">State</label>
              <input id="addrState" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="addrPincode">PIN code</label>
              <input id="addrPincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="addrLabel">Label</label>
              <select id="addrLabel" value={form.label || 'HOME'} onChange={(e) => setForm({ ...form, label: e.target.value })}>
                <option value="HOME">Home</option>
                <option value="WORK">Work</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="addrInstructions">Delivery instructions (optional)</label>
            <input id="addrInstructions" value={form.instructions || ''} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn--primary" type="submit" disabled={busy}>
              {busy ? 'Saving...' : editingId ? 'Update address' : 'Save address'}
            </button>
            <button className="btn btn--ghost" type="button" onClick={() => { setShowForm(false); setEditingId(null); }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <LoadingSpinner label="Loading addresses..." />
      ) : loadError ? (
        <ErrorMessage message={loadError} onRetry={load} />
      ) : addresses.length === 0 ? (
        <EmptyState
          icon="📍"
          title="No saved addresses"
          subtitle="Add your home, work or any delivery spot to speed up checkout."
          action={
            <button type="button" className="btn btn--primary" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Add address
            </button>
          }
        />
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              selected={Boolean(addr.isDefault)}
              onSelect={() => onSetDefault(addr)}
              onEdit={() => startEdit(addr)}
              onDelete={() => onDelete(addr)}
            />
          ))}
        </div>
      )}

      <div style={{ marginTop: 26, padding: 16, background: '#fafafa', borderRadius: 12, fontSize: 13.5, color: '#6b6b6b', display: 'flex', gap: 10 }}>
        <MapPin size={17} color="#e23744" />
        Tip: the map pin on each address can be dragged to fine-tune your exact delivery location.
      </div>
    </div>
  );
}
