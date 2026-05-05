import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Gift } from 'lucide-react';
import { useCart, useAuth, useAddress } from '../App';
import API from '../api';
import { getImg } from './Home';
import AddressSheet from '../components/AddressSheet';

export default function CartPage() {
  const { items, summary, removeItem, fetchCart } = useCart();
  const { isLoggedIn } = useAuth();
  const { selectedAddress } = useAddress();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [toast, setToast] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [upiApp, setUpiApp] = useState('gpay');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [paymentSimulation, setPaymentSimulation] = useState(null);
  const [rewardsBalance, setRewardsBalance] = useState(0);
  const [useRewards, setUseRewards] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      API.get('/auth/me').then(r => setRewardsBalance(r.data.user?.rewards_points || 0)).catch(() => {});
    }
  }, [isLoggedIn]);

  const fmtQty = (q, unitType) => {
    if (unitType === 'pieces') return `${q} pc${q > 1 ? 's' : ''}`;
    if (unitType === 'liters') return q >= 1000 ? `${(q / 1000).toFixed(1)}L` : `${q}ml`;
    return q >= 1000 ? `${(q / 1000).toFixed(1)}kg` : `${q}g`;
  };

  const rewardsDiscount = useRewards
    ? Math.min(rewardsBalance, Math.floor((summary.subtotal || 0) + (summary.delivery_fee || 0)))
    : 0;
  const finalTotal = (summary.total || 0) - rewardsDiscount;
  const estimatedPoints = Math.floor((summary.subtotal || 0) * 0.05);

  const placeOrder = async () => {
    if (paymentMethod === 'upi') {
      const appName = upiApp === 'gpay' ? 'Google Pay' : upiApp === 'phonepe' ? 'PhonePe' : upiApp === 'paytm' ? 'Paytm' : 'UPI App';
      setPaymentSimulation(`Opening ${appName}...`);
      await new Promise(r => setTimeout(r, 1500));
      setPaymentSimulation(`Awaiting payment from ${appName}...`);
      await new Promise(r => setTimeout(r, 2000));
      setPaymentSimulation('Payment Successful! ✅');
      await new Promise(r => setTimeout(r, 1000));
    } else if (paymentMethod === 'online') {
      setPaymentSimulation('Verifying Card Details...');
      await new Promise(r => setTimeout(r, 1000));
      setPaymentSimulation('Processing Payment securely... 🔒');
      await new Promise(r => setTimeout(r, 1500));
      setPaymentSimulation('Payment Successful! ✅');
      await new Promise(r => setTimeout(r, 1000));
    } else if (paymentMethod === 'wallet') {
      setPaymentSimulation('Deducting from GramFresh Wallet... 💳');
      await new Promise(r => setTimeout(r, 1000));
    }

    setPaymentSimulation(null);
    setPlacing(true);
    try {
      const { data } = await API.post('/orders', { payment_method: paymentMethod, use_rewards: useRewards });
      await fetchCart();
      const earned = data.points_earned || 0;
      const redeemed = data.points_redeemed || 0;
      let msg = `Order ${data.order.order_number} placed!`;
      if (redeemed > 0) msg += ` −${redeemed} pts used`;
      if (earned > 0) msg += ` · +${earned} pts earned 🎁`;
      setRewardsBalance(prev => prev - redeemed + earned);
      setUseRewards(false);
      setToast(msg);
      setTimeout(() => navigate('/orders'), 2500);
    } catch (err) {
      alert(err.response?.data?.error || 'Order failed');
    } finally { setPlacing(false); }
  };

  return (
    <>
      <div className="page-header"><h2>🛒 Cart</h2></div>
      <div className="page-content" style={{ padding: '0 16px 100px' }}>
        {items.length === 0 ? (
          <div className="empty">
            <div className="icon">🛒</div>
            <div className="title">Your cart is empty</div>
            <div className="sub">Browse products and add items</div>
            <button onClick={() => navigate('/')}
              style={{ marginTop: 16, padding: '10px 24px', borderRadius: 10, background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: 14 }}>
              Browse Products
            </button>
          </div>
        ) : (
          <>
            {summary.is_first_order && (
              <div style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', borderRadius: 12, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #6ee7b733' }}>
                <span style={{ fontSize: 18 }}>🎉</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#065f46' }}>First Order Perk: FREE Delivery!</div>
              </div>
            )}

            {items.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-img">
                  <img src={getImg(item)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                </div>
                <div className="cart-item-info">
                  <div className="name">{item.name}</div>
                  <div className="qty">{item.quantity_label} × ₹{item.price_per_kg}/{item.unit_type === 'pieces' ? 'pc' : item.unit_type === 'liters' ? 'L' : 'kg'}</div>
                </div>
                <div className="cart-item-right">
                  <div className="price">₹{item.item_total}</div>
                  <button className="remove" onClick={() => removeItem(item.id)}>
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
            ))}

            {/* Order Summary */}
            <div className="cart-summary">
              <div className="cart-row">
                <span>Subtotal ({summary.item_count} items)</span>
                <span style={{ fontWeight: 700 }}>₹{summary.subtotal}</span>
              </div>
              <div className="cart-row">
                <span>Delivery</span>
                <span style={{ fontWeight: 600, color: summary.delivery_fee === 0 ? 'var(--primary)' : undefined }}>
                  {summary.delivery_fee === 0
                    ? summary.is_first_order ? 'FREE 🎉 (1st order)' : 'FREE'
                    : `₹${summary.delivery_fee}`}
                </span>
              </div>
              {!summary.is_first_order && summary.delivery_fee > 0 && (
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Flat ₹5 on all orders</div>
              )}
              {useRewards && rewardsDiscount > 0 && (
                <div className="cart-row" style={{ color: '#065f46' }}>
                  <span>🎁 Rewards Discount</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>−₹{rewardsDiscount}</span>
                </div>
              )}
              {estimatedPoints > 0 && !useRewards && (
                <div className="cart-row" style={{ fontSize: 12, color: '#92400e' }}>
                  <span>🌟 Rewards you'll earn</span>
                  <span style={{ fontWeight: 700, color: '#f59e0b' }}>+{estimatedPoints} pts</span>
                </div>
              )}
              <div className="cart-row total">
                <span>Total</span>
                <span className="val">₹{finalTotal}</span>
              </div>
            </div>

            {/* Rewards Redemption Card */}
            {rewardsBalance > 0 && (
              <div style={{
                background: useRewards
                  ? 'linear-gradient(135deg, #fef9ec, #fef3c7)'
                  : 'var(--surface2)',
                border: useRewards ? '2px solid #f59e0b' : '1px solid var(--border)',
                borderRadius: 12, padding: 14, marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer', transition: 'all 0.2s'
              }} onClick={() => setUseRewards(!useRewards)}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: useRewards ? '#f59e0b' : 'var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'background 0.2s'
                }}>
                  <Gift size={18} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: useRewards ? '#92400e' : 'var(--text)' }}>
                    {useRewards ? `Saving ₹${rewardsDiscount} with rewards!` : 'Use Reward Points'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                    You have <strong style={{ color: '#f59e0b' }}>{rewardsBalance} pts</strong> ≈ ₹{rewardsBalance} available
                  </div>
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: useRewards ? '#f59e0b' : 'var(--white)',
                  border: useRewards ? '2px solid #f59e0b' : '2px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, fontSize: 13, color: 'white', fontWeight: 800
                }}>
                  {useRewards ? '✓' : ''}
                </div>
              </div>
            )}

            {/* Delivery Address */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Delivery Address</div>
                <button onClick={() => setShowAddressModal(true)} style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>Change</button>
              </div>
              <div onClick={() => setShowAddressModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface2)', padding: 14, borderRadius: 10, cursor: 'pointer' }}>
                <div style={{ fontSize: 13 }}>
                  <div style={{ fontWeight: 600 }}>{selectedAddress?.label || 'Select Address'}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 11 }}>{selectedAddress?.full || 'Please select an address for delivery'}</div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Payment Method</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { id: 'wallet', label: 'GramFresh Wallet', sub: 'Available balance: ₹500', icon: '💳' },
                  { id: 'upi', label: 'UPI', sub: 'Google Pay, PhonePe, Paytm', icon: '📱' },
                  { id: 'online', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay', icon: '🏧' },
                  { id: 'cod', label: 'Cash on Delivery', sub: 'Pay with cash at doorstep', icon: '💵' },
                ].map(pm => (
                  <div key={pm.id}
                    style={{ display: 'flex', flexDirection: 'column', background: paymentMethod === pm.id ? 'var(--primary-light)' : 'var(--white)', borderRadius: 10, border: paymentMethod === pm.id ? '2px solid var(--primary)' : '1px solid var(--border)', padding: 12, cursor: 'pointer' }}
                    onClick={() => setPaymentMethod(pm.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input type="radio" checked={paymentMethod === pm.id} onChange={() => {}} style={{ pointerEvents: 'none' }} />
                      <div style={{ fontSize: 20 }}>{pm.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: paymentMethod === pm.id ? 'var(--primary-dark)' : 'var(--text)' }}>{pm.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{pm.sub}</div>
                      </div>
                    </div>
                    {pm.id === 'upi' && paymentMethod === 'upi' && (
                      <div style={{ marginLeft: 32, marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {['gpay', 'phonepe', 'paytm', 'other'].map(app => (
                          <button key={app} onClick={e => { e.stopPropagation(); setUpiApp(app); }}
                            style={{ padding: '8px 4px', borderRadius: 8, border: upiApp === app ? '2px solid var(--primary)' : '1px solid var(--border)', background: 'white', fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            {app === 'gpay' ? 'Google Pay' : app === 'phonepe' ? 'PhonePe' : app === 'paytm' ? 'Paytm' : 'New UPI ID'}
                          </button>
                        ))}
                        {upiApp === 'other' && (
                          <div style={{ gridColumn: 'span 2', marginTop: 4 }}>
                            <input type="text" placeholder="e.g. 9876543210@ybl" onClick={e => e.stopPropagation()}
                              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }} />
                          </div>
                        )}
                      </div>
                    )}
                    {pm.id === 'online' && paymentMethod === 'online' && (
                      <div style={{ marginLeft: 32, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <input type="text" placeholder="Card Number" onClick={e => e.stopPropagation()}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'monospace' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <input type="text" placeholder="MM/YY" onClick={e => e.stopPropagation()}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }} />
                          <input type="password" placeholder="CVV" onClick={e => e.stopPropagation()}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button className="checkout-btn" onClick={placeOrder} disabled={placing || !!paymentSimulation}>
              {placing ? 'Placing Order...' : `Place Order — ₹${finalTotal}`}
            </button>
            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
              🚚 30-min delivery
              {!useRewards && estimatedPoints > 0 && ` · 🌟 Earn ${estimatedPoints} reward pts`}
              {useRewards && rewardsDiscount > 0 && ` · 🎁 Saving ₹${rewardsDiscount} with rewards`}
            </p>
          </>
        )}
      </div>

      {showAddressModal && <AddressSheet onClose={() => setShowAddressModal(false)} />}
      {toast && <div className="toast">✓ {toast}</div>}

      {paymentSimulation && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--white)', color: 'var(--text)', padding: 30, borderRadius: 16, textAlign: 'center', maxWidth: 300, width: '90%' }}>
            <div className="spinner" style={{ marginBottom: 20, width: 40, height: 40, border: '4px solid var(--primary-light)', borderTopColor: 'var(--primary)' }}></div>
            <h3 style={{ fontSize: 16, fontWeight: 800 }}>Processing Payment</h3>
            <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 8 }}>{paymentSimulation}</p>
          </div>
        </div>
      )}
    </>
  );
}
