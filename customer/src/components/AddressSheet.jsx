import { useState } from 'react';
import { MapPin, X, Plus, Edit2, Check } from 'lucide-react';
import { useAddress } from '../App';

export default function AddressSheet({ onClose }) {
  const { addresses, selectedAddress, setSelectedAddress, saveAddress } = useAddress();
  const [editing, setEditing] = useState(null); // null means list view, {} means new, {id...} means edit
  
  const handleSave = (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const label = data.get('label');
    const full = data.get('full');
    saveAddress({ ...(editing.id ? editing : { id: Date.now().toString() }), label, full });
    setEditing(null);
  };

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-sheet" onClick={(e) => e.stopPropagation()} style={{ minHeight: 400 }}>
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>
            {editing ? (editing.id ? 'Edit Address' : 'Add New Address') : 'Delivery Address'}
          </div>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        
        <div style={{ padding: 20 }}>
          {editing ? (
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>LABEL (e.g., Home, Work)</label>
                <input name="label" required defaultValue={editing.label || ''}
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14 }}
                  placeholder="e.g. Home" />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>FULL ADDRESS</label>
                <textarea name="full" required defaultValue={editing.full || ''}
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, minHeight: 80 }}
                  placeholder="e.g. 42, MG Road, Block B, Floor 2" />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={() => setEditing(null)}
                  style={{ flex: 1, padding: 14, borderRadius: 10, background: 'var(--surface2)', fontWeight: 700 }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ flex: 1, padding: 14, borderRadius: 10, background: 'var(--primary)', color: 'white', fontWeight: 700 }}>
                  Save Address
                </button>
              </div>
            </form>
          ) : (
            <>
              <button onClick={() => setEditing({})}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: 14, border: '1px dashed var(--primary)', borderRadius: 12,
                  marginBottom: 16, color: 'var(--primary-dark)', fontWeight: 700,
                  justifyContent: 'center', background: 'var(--primary-light)'
                }}>
                <Plus size={18} /> Add New Address
              </button>

              {addresses.map((addr) => (
                <div key={addr.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', width: '100%', gap: 12,
                    padding: 16, border: addr.id === selectedAddress?.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: 12, marginBottom: 12, background: addr.id === selectedAddress?.id ? 'var(--primary-light)' : 'var(--white)',
                    cursor: 'pointer'
                  }}
                  onClick={() => { setSelectedAddress(addr); onClose(); }}>
                  
                  <MapPin size={22} style={{ marginTop: 2 }} color={addr.id === selectedAddress?.id ? 'var(--primary-dark)' : 'var(--muted)'} />
                  
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontWeight: 800, color: addr.id === selectedAddress?.id ? 'var(--primary-dark)' : 'var(--text)', fontSize: 14 }}>
                      {addr.label}
                    </div>
                    <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4, lineHeight: 1.4 }}>
                      {addr.full}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                    {addr.id === selectedAddress?.id && <Check size={18} color="var(--primary-dark)" fontWeight="bold" />}
                    <button onClick={(e) => { e.stopPropagation(); setEditing(addr); }}
                      style={{ padding: 6, color: 'var(--muted)' }}>
                      <Edit2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
