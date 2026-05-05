import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { LogOut, Phone, Wallet, MapPin, Package, HelpCircle, Info, X, Gift, CreditCard } from 'lucide-react';
import AddressSheet from '../components/AddressSheet';
import API from '../api';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [rewardsPoints, setRewardsPoints] = useState(user?.rewards_points || 0);

  useEffect(() => {
    API.get('/orders/my').then(r => setOrderCount(r.data.orders?.length || 0)).catch(() => {});
    API.get('/auth/me').then(r => setRewardsPoints(r.data.user?.rewards_points || 0)).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const isFirstOrder = orderCount === 0;

  return (
    <>
      <div className="page-header"><h2>👤 Profile</h2></div>
      <div className="page-content" style={{ padding: '16px 16px 100px' }}>

        {/* Profile card */}
        <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: 16, padding: 24, textAlign: 'center', marginBottom: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, margin: '0 auto 12px' }}>
            {(user?.name || user?.phone || 'U')[0].toUpperCase()}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{user?.name || 'Customer'}</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Phone size={13} /> +91 {user?.phone}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 14 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary-dark)' }}>{orderCount}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Orders</div>
            </div>
            <div style={{ width: 1, background: 'var(--border)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>{rewardsPoints}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Reward Pts</div>
            </div>
          </div>
        </div>

        {/* Rewards Banner */}
        <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', borderRadius: 14, padding: 16, marginBottom: 16, border: '1px solid #f59e0b33' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 28 }}>🎁</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#92400e' }}>GramFresh Rewards</div>
              <div style={{ fontSize: 12, color: '#78350f', marginTop: 2 }}>
                You have <strong>{rewardsPoints} points</strong> ≈ ₹{rewardsPoints} off
              </div>
            </div>
          </div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              { icon: '⭐', text: 'Earn 5% of every order as reward points' },
              { icon: '🚚', text: isFirstOrder ? 'Your FIRST order gets FREE delivery!' : `Flat ₹5 delivery on all orders` },
              { icon: '💰', text: '1 point = ₹1 discount on your next order' },
            ].map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 12, color: '#78350f' }}>
                <span>{b.icon}</span><span>{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery badge for first order */}
        {isFirstOrder && (
          <div style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', borderRadius: 12, padding: 14, marginBottom: 16, border: '1px solid #6ee7b733', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 24 }}>🎉</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#065f46' }}>First Order Perk!</div>
              <div style={{ fontSize: 12, color: '#047857' }}>Your first order ships FREE — no delivery charge!</div>
            </div>
          </div>
        )}

        {/* Menu */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
          {[
            { label: 'My Orders', icon: <Package size={20} color="var(--primary)" />, action: () => navigate('/orders') },
            { label: 'Saved Addresses', icon: <MapPin size={20} color="var(--orange)" />, action: () => setShowAddressModal(true) },
            { label: 'Payment Methods', icon: <CreditCard size={20} color="var(--blue)" />, action: () => navigate('/payment-methods') },
            { label: 'GramFresh Wallet', icon: <Wallet size={20} color="#8b5cf6" />, action: () => setShowWalletModal(true) },
            { label: 'Rewards & Discounts', icon: <Gift size={20} color="#f59e0b" />, action: () => alert(`You have ${rewardsPoints} reward points (₹${rewardsPoints} value).\n\nEarn 5% back on every order!\nFlat ₹5 delivery on all orders.\nFirst order ships FREE!`) },
            { label: 'Help & Support', icon: <HelpCircle size={20} color="var(--red)" />, action: () => alert('Support: 1800-GRAM-FRESH\nEmail: support@gramfresh.in') },
            { label: 'About GramFresh', icon: <Info size={20} color="var(--green)" />, action: () => alert('GramFresh v1.0\nDelivering fresh micro-quantities in Vijayawada!') },
          ].map((item, i, arr) => (
            <button key={i} onClick={item.action}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '16px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 14, fontWeight: 600, textAlign: 'left', background: 'var(--white)' }}>
              <div style={{ background: 'var(--surface2)', padding: 8, borderRadius: 10, display: 'flex' }}>{item.icon}</div>
              {item.label}
              <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 18 }}>›</span>
            </button>
          ))}
        </div>

        <button onClick={handleLogout}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #fee2e2', background: '#fff5f5', color: 'var(--red)', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <LogOut size={18} /> Sign Out
        </button>
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: 'var(--muted)' }}>GramFresh v1.0 — Fresh groceries, custom quantities</p>

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
                <div style={{ fontSize: 42, fontWeight: 800, color: 'var(--primary-dark)', marginBottom: 8 }}>₹500.00</div>
                <div style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600, marginBottom: 20 }}>+ {rewardsPoints} Reward Points ≈ ₹{rewardsPoints}</div>
                <button style={{ background: 'var(--primary)', color: 'white', fontWeight: 700, padding: '14px 24px', borderRadius: 12, width: '100%', fontSize: 14 }}>
                  + Add Money
                </button>
                <p style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)' }}>Use wallet + rewards for instant zero-click checkouts!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
