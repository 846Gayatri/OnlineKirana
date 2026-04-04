import { useState } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { LogOut, Phone, Wallet, MapPin, Package, HelpCircle, Info, X } from 'lucide-react';
import AddressSheet from '../components/AddressSheet';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <div className="page-header"><h2>👤 Profile</h2></div>
      <div className="page-content" style={{ padding: '16px 16px 100px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          borderRadius: 16, padding: 24, textAlign: 'center', marginBottom: 20
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--primary)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 800, margin: '0 auto 12px'
          }}>
            {(user?.name || user?.phone || 'U')[0].toUpperCase()}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{user?.name || 'Customer'}</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Phone size={13} /> +91 {user?.phone}
          </div>
        </div>

        <div style={{
          background: 'var(--white)', border: '1px solid var(--border)',
          borderRadius: 14, overflow: 'hidden'
        }}>
          {[
            { label: 'My Orders', icon: <Package size={20} color="var(--primary)"/>, action: () => navigate('/orders') },
            { label: 'Saved Addresses', icon: <MapPin size={20} color="var(--orange)"/>, action: () => setShowAddressModal(true) },
            { label: 'GramFresh Wallet', icon: <Wallet size={20} color="var(--blue)"/>, action: () => setShowWalletModal(true) },
            { label: 'Help & Support', icon: <HelpCircle size={20} color="var(--red)"/>, action: () => alert('Support line: 1800-GRAM-FRESH\\nEmail: support@gramfresh.in') },
            { label: 'About GramFresh', icon: <Info size={20} color="var(--green)"/>, action: () => alert('GramFresh v1.0\\nDelivering fresh micro-quantities in Vijayawada!') },
          ].map((item, i) => (
            <button key={i} onClick={item.action}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '16px', borderBottom: '1px solid var(--border)',
                fontSize: 14, fontWeight: 600, textAlign: 'left',
                background: 'var(--white)'
              }}>
              <div style={{ background: 'var(--surface2)', padding: 8, borderRadius: 10, display: 'flex' }}>
                {item.icon}
              </div>
              {item.label}
              <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 18 }}>›</span>
            </button>
          ))}
        </div>

        <button onClick={handleLogout}
          style={{
            width: '100%', marginTop: 20, padding: 14,
            borderRadius: 12, border: '1px solid #fee2e2',
            background: '#fff5f5', color: 'var(--red)',
            fontSize: 15, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}>
          <LogOut size={18} /> Sign Out
        </button>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: 'var(--muted)' }}>
          GramFresh v1.0 — Fresh groceries, custom quantities
        </p>

        {showAddressModal && <AddressSheet onClose={() => setShowAddressModal(false)} />}
        
        {showWalletModal && (
          <div className="detail-overlay" onClick={() => setShowWalletModal(false)}>
            <div className="detail-sheet" onClick={e => e.stopPropagation()} style={{ minHeight: 300, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>GramFresh Wallet</div>
                <button onClick={() => setShowWalletModal(false)}><X size={18} /></button>
              </div>
              <div style={{ padding: 30, textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 700, marginBottom: 8 }}>CURRENT BALANCE</div>
                <div style={{ fontSize: 42, fontWeight: 800, color: 'var(--primary-dark)', marginBottom: 24 }}>₹500.00</div>
                <button style={{ 
                  background: 'var(--primary)', color: 'white', fontWeight: 700, 
                  padding: '14px 24px', borderRadius: 12, width: '100%' 
                }}>
                  + Add Money
                </button>
                <p style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)' }}>
                  Wallet balance can be used for instant zero-click checkouts!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
