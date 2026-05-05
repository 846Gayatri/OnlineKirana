import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Gift, ChevronRight } from 'lucide-react';
import { useCart, useAuth, useAddress } from '../App';
import API from '../api';
import { getImg } from './Home';
import AddressSheet from '../components/AddressSheet';

const STORAGE_KEY = 'gf_payment_methods';
function loadSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

const NET_BANKS = [
  { id: 'sbi', name: 'SBI', full: 'State Bank of India' },
  { id: 'hdfc', name: 'HDFC', full: 'HDFC Bank' },
  { id: 'icici', name: 'ICICI', full: 'ICICI Bank' },
  { id: 'axis', name: 'Axis', full: 'Axis Bank' },
  { id: 'kotak', name: 'Kotak', full: 'Kotak Mahindra Bank' },
  { id: 'bob', name: 'BoB', full: 'Bank of Baroda' },
  { id: 'pnb', name: 'PNB', full: 'Punjab National Bank' },
  { id: 'canara', name: 'Canara', full: 'Canara Bank' },
];

const UPI_APPS_STATIC = [
  { id: 'gpay', name: 'Google Pay' },
  { id: 'phonepe', name: 'PhonePe' },
  { id: 'paytm', name: 'Paytm' },
  { id: 'other', name: 'New UPI ID' },
];

export default function CartPage() {
  const { items, summary, removeItem, fetchCart } = useCart();
  const { isLoggedIn } = useAuth();
  const { selectedAddress } = useAddress();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [toast, setToast] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [upiApp, setUpiApp] = useState('gpay');
  const [manualUpiId, setManualUpiId] = useState('');
  const [selectedSavedUpi, setSelectedSavedUpi] = useState(null);
  const [selectedSavedCard, setSelectedSavedCard] = useState(null);
  const [selectedBank, setSelectedBank] = useState('sbi');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [paymentSimulation, setPaymentSimulation] = useState(null);
  const [rewardsBalance, setRewardsBalance] = useState(0);
  const [useRewards, setUseRewards] = useState(false);
  const [saved, setSaved] = useState(loadSaved());

  useEffect(() => {
    if (isLoggedIn) {
      API.get('/auth/me').then(r => setRewardsBalance(r.data.user?.rewards_points || 0)).catch(() => {});
    }
    // Auto-select primary UPI if saved
    const s = loadSaved();
    setSaved(s);
    if (s.primary_upi && s.upis?.length) {
      const primary = s.upis.find(u => u.id === s.primary_upi);
      if (primary) setSelectedSavedUpi(primary);
    }
    if (s.cards?.length) setSelectedSavedCard(s.cards[0]);
  }, [isLoggedIn]);

  const savedUpis = saved.upis || [];
  const savedCards = saved.cards || [];

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
      setPaymentSimulation('Redirecting to UPI app...');
      await new Promise(r => setTimeout(r, 1200));
      setPaymentSimulation('Awaiting UPI confirmation...');
      await new Promise(r => setTimeout(r, 2000));
      setPaymentSimulation('Payment Successful! ✅');
      await new Promise(r => setTimeout(r, 900));
    } else if (paymentMethod === 'card') {
      setPaymentSimulation('Verifying card details...');
      await new Promise(r => setTimeout(r, 900));
      setPaymentSimulation('Processing payment securely 🔒');
      await new Promise(r => setTimeout(r, 1500));
      setPaymentSimulation('Payment Successful! ✅');
      await new Promise(r => setTimeout(r, 900));
    } else if (paymentMethod === 'netbanking') {
      const bank = NET_BANKS.find(b => b.id === selectedBank);
      setPaymentSimulation(`Redirecting to ${bank?.full || 'your bank'}...`);
      await new Promise(r => setTimeout(r, 1200));
      setPaymentSimulation('Awaiting bank confirmation...');
      await new Promise(r => setTimeout(r, 2000));
      setPaymentSimulation('Payment Successful! ✅');
      await new Promise(r => setTimeout(r, 900));
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

  const PAYMENT_METHODS = [
    { id: 'wallet', label: 'GramFresh Wallet', sub: 'Balance: ₹500 · 2% cashback', icon: '💳' },
    { id: 'upi', label: 'UPI', sub: savedUpis.length > 0 ? `${savedUpis.length} saved ID${savedUpis.length > 1 ? 's' : ''}` : 'Google Pay, PhonePe, Paytm', icon: '📱' },
    { id: 'card', label: 'Credit / Debit Card', sub: savedCards.length > 0 ? `${savedCards.length} saved card${savedCards.length > 1 ? 's' : ''}` : 'Visa, Mastercard, RuPay', icon: '🏧' },
    { id: 'netbanking', label: 'Net Banking', sub: 'All major banks supported', icon: '🏦' },
    { id: 'cod', label: 'Cash on Delivery', sub: 'Pay with cash at doorstep', icon: '💵' },
  ];

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

            {/* Cart items */}
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

            {/* Summary */}
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

            {/* Rewards toggle */}
            {rewardsBalance > 0 && (
              <div style={{ background: useRewards ? 'linear-gradient(135deg, #fef9ec, #fef3c7)' : 'var(--surface2)', border: useRewards ? '2px solid #f59e0b' : '1px solid var(--border)', borderRadius: 12, padding: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                onClick={() => setUseRewards(!useRewards)}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: useRewards ? '#f59e0b' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
                <div style={{ width: 22, height: 22, borderRadius: 6, background: useRewards ? '#f59e0b' : 'var(--white)', border: useRewards ? '2px solid #f59e0b' : '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, color: 'white', fontWeight: 800 }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Payment Method</div>
                <button onClick={() => navigate('/payment-methods')}
                  style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                  Manage <ChevronRight size={13} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {PAYMENT_METHODS.map(pm => (
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

                    {/* UPI expanded */}
                    {pm.id === 'upi' && paymentMethod === 'upi' && (
                      <div style={{ marginLeft: 32, marginTop: 14 }}>
                        {savedUpis.length > 0 && (
                          <>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>SAVED UPI IDS</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                              {savedUpis.map(u => (
                                <div key={u.id} onClick={e => { e.stopPropagation(); setSelectedSavedUpi(u); setUpiApp('saved'); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: `2px solid ${selectedSavedUpi?.id === u.id && upiApp === 'saved' ? 'var(--primary)' : 'var(--border)'}`, background: selectedSavedUpi?.id === u.id && upiApp === 'saved' ? 'white' : 'var(--surface2)', cursor: 'pointer' }}>
                                  <input type="radio" readOnly checked={selectedSavedUpi?.id === u.id && upiApp === 'saved'} style={{ pointerEvents: 'none' }} />
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700 }}>{u.nickname}</div>
                                    <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>{u.upi_id}</div>
                                  </div>
                                  {u.id === saved.primary_upi && <span style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 700, background: 'var(--primary-light)', padding: '2px 6px', borderRadius: 6 }}>PRIMARY</span>}
                                </div>
                              ))}
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>OR USE ANOTHER APP</div>
                          </>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {UPI_APPS_STATIC.map(app => (
                            <button key={app.id} onClick={e => { e.stopPropagation(); setUpiApp(app.id); setSelectedSavedUpi(null); }}
                              style={{ padding: '8px 4px', borderRadius: 8, border: upiApp === app.id && !selectedSavedUpi ? '2px solid var(--primary)' : '1px solid var(--border)', background: 'white', fontSize: 12, fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>
                              {app.name}
                            </button>
                          ))}
                        </div>
                        {upiApp === 'other' && !selectedSavedUpi && (
                          <div style={{ marginTop: 10 }}>
                            <input type="text" placeholder="e.g. 9876543210@ybl" value={manualUpiId}
                              onChange={e => setManualUpiId(e.target.value)}
                              onClick={e => e.stopPropagation()}
                              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'monospace', boxSizing: 'border-box' }} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Card expanded */}
                    {pm.id === 'card' && paymentMethod === 'card' && (
                      <div style={{ marginLeft: 32, marginTop: 14 }}>
                        {savedCards.length > 0 && (
                          <>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>SAVED CARDS</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                              {savedCards.map(card => (
                                <div key={card.id} onClick={e => { e.stopPropagation(); setSelectedSavedCard(card); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: `2px solid ${selectedSavedCard?.id === card.id ? 'var(--primary)' : 'var(--border)'}`, background: selectedSavedCard?.id === card.id ? 'white' : 'var(--surface2)', cursor: 'pointer' }}>
                                  <input type="radio" readOnly checked={selectedSavedCard?.id === card.id} style={{ pointerEvents: 'none' }} />
                                  <div style={{ fontSize: 20 }}>💳</div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700 }}>{card.nickname || `${card.network.toUpperCase()} ••••${card.last4}`}</div>
                                    <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>•••• •••• •••• {card.last4} · {card.expiry}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>OR ENTER NEW CARD</div>
                          </>
                        )}
                        {(!savedCards.length || !selectedSavedCard) && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <input type="text" placeholder="Card Number" onClick={e => e.stopPropagation()}
                              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'monospace', boxSizing: 'border-box' }} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                              <input type="text" placeholder="MM/YY" onClick={e => e.stopPropagation()}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, boxSizing: 'border-box' }} />
                              <input type="password" placeholder="CVV" onClick={e => e.stopPropagation()}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, boxSizing: 'border-box' }} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Net Banking expanded */}
                    {pm.id === 'netbanking' && paymentMethod === 'netbanking' && (
                      <div style={{ marginLeft: 32, marginTop: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>SELECT YOUR BANK</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
                          {NET_BANKS.map(bank => (
                            <button key={bank.id} onClick={e => { e.stopPropagation(); setSelectedBank(bank.id); }}
                              style={{ padding: '8px 4px', borderRadius: 8, border: selectedBank === bank.id ? '2px solid var(--primary)' : '1px solid var(--border)', background: selectedBank === bank.id ? 'var(--primary-light)' : 'white', fontSize: 11, fontWeight: 700, color: selectedBank === bank.id ? 'var(--primary-dark)' : 'var(--text)', cursor: 'pointer', textAlign: 'center' }}>
                              {bank.name}
                            </button>
                          ))}
                        </div>
                        {selectedBank && (
                          <div style={{ fontSize: 12, color: 'var(--muted)', padding: '8px 10px', background: 'var(--surface2)', borderRadius: 8 }}>
                            You'll be redirected to <strong>{NET_BANKS.find(b => b.id === selectedBank)?.full}</strong> secure portal
                          </div>
                        )}
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--white)', color: 'var(--text)', padding: 30, borderRadius: 20, textAlign: 'center', maxWidth: 300, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div className="spinner" style={{ marginBottom: 20, width: 44, height: 44, border: '4px solid var(--primary-light)', borderTopColor: 'var(--primary)', margin: '0 auto 20px' }}></div>
            <h3 style={{ fontSize: 16, fontWeight: 800 }}>Processing Payment</h3>
            <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 8 }}>{paymentSimulation}</p>
          </div>
        </div>
      )}
    </>
  );
}
