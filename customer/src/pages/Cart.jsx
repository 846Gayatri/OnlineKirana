import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useCart, useAuth, useAddress } from '../App';
import API from '../api';
import { getImg } from './Home';
import AddressSheet from '../components/AddressSheet';

export default function CartPage() {
  const { items, summary, removeItem, clearCart, fetchCart } = useCart();
  const { isLoggedIn } = useAuth();
  const { addresses, selectedAddress, setSelectedAddress } = useAddress();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [toast, setToast] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [upiApp, setUpiApp] = useState('gpay');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [paymentSimulation, setPaymentSimulation] = useState(null);

  const fmtQty = (q, unitType) => {
    if (unitType === 'pieces') return `${q} pc${q > 1 ? 's' : ''}`;
    if (unitType === 'liters') return q >= 1000 ? `${(q / 1000).toFixed(1)}L` : `${q}ml`;
    return q >= 1000 ? `${(q / 1000).toFixed(1)}kg` : `${q}g`;
  };

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
      const { data } = await API.post('/orders', { payment_method: paymentMethod });
      await fetchCart();
      setToast(`Order ${data.order.order_number} placed!`);
      setTimeout(() => navigate('/orders'), 1500);
    } catch (err) {
      alert(err.response?.data?.error || 'Order failed');
    } finally { setPlacing(false); }
  };

  return (
    <>
      <div className="page-header">
        <h2>🛒 Cart</h2>
      </div>
      <div className="page-content" style={{ padding: '0 16px 100px' }}>
        {items.length === 0 ? (
          <div className="empty">
            <div className="icon">🛒</div>
            <div className="title">Your cart is empty</div>
            <div className="sub">Browse products and add items</div>
            <button onClick={() => navigate('/')}
              style={{ marginTop: 16, padding: '10px 24px', borderRadius: 10, background: 'var(--primary)',
                color: 'white', fontWeight: 700, fontSize: 14 }}>
              Browse Products
            </button>
          </div>
        ) : (
          <>
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

            <div className="cart-summary">
              <div className="cart-row">
                <span>Subtotal ({summary.item_count} items)</span>
                <span style={{ fontWeight: 700 }}>₹{summary.subtotal}</span>
              </div>
              <div className="cart-row">
                <span>Delivery</span>
                <span style={{ fontWeight: 600, color: summary.delivery_fee === 0 ? 'var(--primary)' : undefined }}>
                  {summary.delivery_fee === 0 ? 'FREE' : `₹${summary.delivery_fee}`}
                </span>
              </div>
              {summary.delivery_fee > 0 && (
                <div className="free-delivery">
                  Add ₹{summary.free_delivery_threshold - summary.subtotal} more for free delivery
                </div>
              )}
              <div className="cart-row total">
                <span>Total</span>
                <span className="val">₹{summary.total}</span>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Delivery Address</div>
                <button onClick={() => setShowAddressModal(true)} style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>Change</button>
              </div>
              <div
                onClick={() => setShowAddressModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface2)', padding: 14, borderRadius: 10, cursor: 'pointer' }}>
                <div style={{ fontSize: 13 }}>
                  <div style={{ fontWeight: 600 }}>{selectedAddress?.label || 'Select Address'}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 11 }}>{selectedAddress?.full || 'Please select an address for delivery'}</div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Payment Method</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { id: 'wallet', label: 'GramFresh Wallet', sub: 'Available balance: ₹500', icon: '💳' },
                  { id: 'upi', label: 'UPI', sub: 'Google Pay, PhonePe, Paytm', icon: '📱' },
                  { id: 'online', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay', icon: '🏧' },
                  { id: 'cod', label: 'Cash on Delivery', sub: 'Pay with cash at doorstep', icon: '💵' },
                ].map(pm => (
                  <div key={pm.id} style={{ display: 'flex', flexDirection: 'column', background: paymentMethod === pm.id ? 'var(--primary-light)' : 'var(--white)', borderRadius: 10, border: paymentMethod === pm.id ? '2px solid var(--primary)' : '1px solid var(--border)', padding: 12, cursor: 'pointer' }}
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
                        <button onClick={(e) => { e.stopPropagation(); setUpiApp('gpay'); }} 
                          style={{ padding: '8px 4px', borderRadius: 8, border: upiApp === 'gpay' ? '2px solid var(--primary)' : '1px solid var(--border)', background: 'white', fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          Google Pay
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setUpiApp('phonepe'); }} 
                          style={{ padding: '8px 4px', borderRadius: 8, border: upiApp === 'phonepe' ? '2px solid var(--primary)' : '1px solid var(--border)', background: 'white', fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          PhonePe
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setUpiApp('paytm'); }} 
                          style={{ padding: '8px 4px', borderRadius: 8, border: upiApp === 'paytm' ? '2px solid var(--primary)' : '1px solid var(--border)', background: 'white', fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          Paytm
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setUpiApp('other'); }} 
                          style={{ padding: '8px 4px', borderRadius: 8, border: upiApp === 'other' ? '2px solid var(--primary)' : '1px solid var(--border)', background: 'white', fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          New UPI ID
                        </button>
                        {upiApp === 'other' && (
                          <div style={{ gridColumn: 'span 2', marginTop: 4 }}>
                            <input type="text" placeholder="e.g. 9876543210@ybl" onClick={e => e.stopPropagation()} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }} />
                          </div>
                        )}
                      </div>
                    )}
                    {pm.id === 'online' && paymentMethod === 'online' && (
                      <div style={{ marginLeft: 32, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <input type="text" placeholder="Card Number (Valid: 4111 ....)" onClick={e => e.stopPropagation()} 
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

            <button className="checkout-btn" onClick={placeOrder} disabled={placing || paymentSimulation}>
              {placing ? 'Placing Order...' : `Place Order — ₹${summary.total}`}
            </button>
            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
              🚚 30-min delivery
            </p>
          </>
        )}
      </div>
      
      {showAddressModal && <AddressSheet onClose={() => setShowAddressModal(false)} />}
      {toast && <div className="toast">✓ {toast}</div>}

      {paymentSimulation && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', color: 'white', zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--white)', color: 'var(--text)', padding: 30,
            borderRadius: 16, textAlign: 'center', maxWidth: 300, width: '90%'
          }}>
            <div className="spinner" style={{ marginBottom: 20, width: 40, height: 40, border: '4px solid var(--primary-light)', borderTopColor: 'var(--primary)' }}></div>
            <h3 style={{ fontSize: 16, fontWeight: 800 }}>Processing Payment</h3>
            <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 8 }}>{paymentSimulation}</p>
          </div>
        </div>
      )}
    </>
  );
}
