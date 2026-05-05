import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, X, CreditCard, Smartphone, Building2, Wallet, CheckCircle2 } from 'lucide-react';

const STORAGE_KEY = 'gf_payment_methods';

function loadMethods() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function saveMethods(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', icon: '🟢', color: '#4285F4' },
  { id: 'phonepe', name: 'PhonePe', icon: '🟣', color: '#5f259f' },
  { id: 'paytm', name: 'Paytm', icon: '🔵', color: '#00BAF2' },
  { id: 'bhim', name: 'BHIM UPI', icon: '🟠', color: '#F57F17' },
  { id: 'amazon', name: 'Amazon Pay', icon: '🟡', color: '#FF9900' },
];

const CARD_NETWORKS = [
  { id: 'visa', label: 'Visa', icon: '💳' },
  { id: 'mastercard', label: 'Mastercard', icon: '💳' },
  { id: 'rupay', label: 'RuPay', icon: '💳' },
  { id: 'amex', label: 'Amex', icon: '💳' },
];

const NET_BANKS = [
  { id: 'sbi', name: 'State Bank of India', short: 'SBI' },
  { id: 'hdfc', name: 'HDFC Bank', short: 'HDFC' },
  { id: 'icici', name: 'ICICI Bank', short: 'ICICI' },
  { id: 'axis', name: 'Axis Bank', short: 'Axis' },
  { id: 'kotak', name: 'Kotak Mahindra Bank', short: 'Kotak' },
  { id: 'bob', name: 'Bank of Baroda', short: 'BoB' },
  { id: 'pnb', name: 'Punjab National Bank', short: 'PNB' },
  { id: 'canara', name: 'Canara Bank', short: 'Canara' },
  { id: 'union', name: 'Union Bank of India', short: 'Union' },
  { id: 'idfc', name: 'IDFC FIRST Bank', short: 'IDFC' },
];

export default function PaymentMethods() {
  const navigate = useNavigate();
  const [methods, setMethods] = useState(loadMethods);
  const [tab, setTab] = useState('upi');
  const [showAddUpi, setShowAddUpi] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newUpi, setNewUpi] = useState('');
  const [newUpiApp, setNewUpiApp] = useState('gpay');
  const [newUpiNickname, setNewUpiNickname] = useState('');
  const [cardForm, setCardForm] = useState({ number: '', name: '', expiry: '', network: 'visa', nickname: '' });
  const [toast, setToast] = useState('');
  const [walletBalance] = useState(500);

  const persist = (updated) => { setMethods(updated); saveMethods(updated); };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  // UPI methods
  const savedUpis = methods.upis || [];
  const addUpi = () => {
    if (!newUpi.trim()) return;
    const upiRegex = /^[\w.\-]+@[\w]+$/;
    if (!upiRegex.test(newUpi.trim())) { alert('Invalid UPI ID format (e.g. 9876543210@ybl)'); return; }
    const app = UPI_APPS.find(a => a.id === newUpiApp);
    const entry = { id: Date.now(), upi_id: newUpi.trim(), app: newUpiApp, app_name: app?.name || 'UPI', nickname: newUpiNickname.trim() || newUpi.trim(), added_at: new Date().toISOString() };
    persist({ ...methods, upis: [...savedUpis, entry] });
    setNewUpi(''); setNewUpiNickname(''); setShowAddUpi(false);
    showToast('UPI ID saved!');
  };
  const removeUpi = (id) => persist({ ...methods, upis: savedUpis.filter(u => u.id !== id) });
  const setPrimaryUpi = (id) => persist({ ...methods, primary_upi: id });

  // Card methods
  const savedCards = methods.cards || [];
  const addCard = () => {
    const digits = cardForm.number.replace(/\s/g, '');
    if (digits.length < 12) { alert('Enter at least 12 card digits'); return; }
    const last4 = digits.slice(-4);
    const entry = { id: Date.now(), last4, network: cardForm.network, name: cardForm.name.trim(), expiry: cardForm.expiry, nickname: cardForm.nickname.trim() || `${cardForm.network.toUpperCase()} ••••${last4}`, added_at: new Date().toISOString() };
    persist({ ...methods, cards: [...savedCards, entry] });
    setCardForm({ number: '', name: '', expiry: '', network: 'visa', nickname: '' });
    setShowAddCard(false);
    showToast('Card saved!');
  };
  const removeCard = (id) => persist({ ...methods, cards: savedCards.filter(c => c.id !== id) });

  const formatCardNumber = (val) => val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (val) => { const v = val.replace(/\D/g, '').slice(0, 4); return v.length >= 3 ? `${v.slice(0, 2)}/${v.slice(2)}` : v; };

  const tabs = [
    { id: 'wallet', label: 'Wallet', icon: <Wallet size={16} /> },
    { id: 'upi', label: 'UPI', icon: <Smartphone size={16} /> },
    { id: 'card', label: 'Cards', icon: <CreditCard size={16} /> },
    { id: 'netbanking', label: 'Net Banking', icon: <Building2 size={16} /> },
  ];

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text)' }}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin: 0 }}>💳 Payment Methods</h2>
      </div>

      <div className="page-content" style={{ padding: '0 16px 100px' }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: 'var(--surface2)', borderRadius: 12, padding: 4 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 4px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, background: tab === t.id ? 'var(--white)' : 'transparent', color: tab === t.id ? 'var(--primary)' : 'var(--muted)', boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* ── WALLET ── */}
        {tab === 'wallet' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', borderRadius: 20, padding: 28, color: 'white', marginBottom: 20, textAlign: 'center', boxShadow: '0 8px 32px rgba(22,163,74,0.3)' }}>
              <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 600, letterSpacing: 1 }}>GRAMFRESH WALLET</div>
              <div style={{ fontSize: 48, fontWeight: 900, margin: '10px 0 4px' }}>₹{walletBalance}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Available Balance</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[50, 100, 200, 500].map(amt => (
                <button key={amt} onClick={() => showToast(`₹${amt} added to wallet! (Demo)`)}
                  style={{ padding: '14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--white)', fontSize: 15, fontWeight: 700, color: 'var(--primary)', cursor: 'pointer' }}>
                  + ₹{amt}
                </button>
              ))}
            </div>
            <button onClick={() => showToast('Custom amount added! (Demo)')}
              style={{ width: '100%', padding: 14, borderRadius: 12, background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: 14 }}>
              + Add Custom Amount
            </button>
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text2)' }}>HOW IT WORKS</div>
              {[
                { icon: '⚡', title: 'Instant Checkout', desc: 'Pay in one tap without entering details every time' },
                { icon: '🎁', title: 'Bonus Cashback', desc: 'Get 2% cashback on all wallet payments' },
                { icon: '🔒', title: '100% Secure', desc: 'Your wallet is protected with bank-grade encryption' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ fontSize: 22, width: 36, textAlign: 'center', flexShrink: 0 }}>{f.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{f.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── UPI ── */}
        {tab === 'upi' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Saved UPI IDs ({savedUpis.length})</div>
              <button onClick={() => setShowAddUpi(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
                <Plus size={14} /> Add UPI ID
              </button>
            </div>

            {savedUpis.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--muted)' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📱</div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>No UPI IDs saved</div>
                <div style={{ fontSize: 13 }}>Add your UPI ID for faster checkout</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {savedUpis.map(u => {
                  const app = UPI_APPS.find(a => a.id === u.app);
                  const isPrimary = methods.primary_upi === u.id;
                  return (
                    <div key={u.id} style={{ background: 'var(--white)', border: `2px solid ${isPrimary ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 12, padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ fontSize: 26, width: 44, height: 44, background: 'var(--surface2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {app?.icon || '📱'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {u.nickname}
                            {isPrimary && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 7px', borderRadius: 10 }}>PRIMARY</span>}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{u.upi_id}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          {!isPrimary && (
                            <button onClick={() => setPrimaryUpi(u.id)}
                              style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-light)', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer' }}>
                              Set Primary
                            </button>
                          )}
                          <button onClick={() => removeUpi(u.id)}
                            style={{ color: 'var(--red)', background: '#fff5f5', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* UPI Apps quick links */}
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text2)' }}>SUPPORTED UPI APPS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {UPI_APPS.map(app => (
                <div key={app.id} style={{ textAlign: 'center', padding: '10px 4px', background: 'var(--surface2)', borderRadius: 10 }}>
                  <div style={{ fontSize: 22 }}>{app.icon}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4, fontWeight: 600 }}>{app.name.split(' ')[0]}</div>
                </div>
              ))}
            </div>

            {/* Add UPI modal */}
            {showAddUpi && (
              <div className="detail-overlay" onClick={() => setShowAddUpi(false)}>
                <div className="detail-sheet" onClick={e => e.stopPropagation()}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>Add UPI ID</div>
                    <button onClick={() => setShowAddUpi(false)}><X size={18} /></button>
                  </div>
                  <div style={{ padding: '20px 20px 32px' }}>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>SELECT APP</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                        {UPI_APPS.map(app => (
                          <button key={app.id} onClick={() => setNewUpiApp(app.id)}
                            style={{ textAlign: 'center', padding: '10px 4px', borderRadius: 10, border: `2px solid ${newUpiApp === app.id ? 'var(--primary)' : 'var(--border)'}`, background: newUpiApp === app.id ? 'var(--primary-light)' : 'var(--white)', cursor: 'pointer' }}>
                            <div style={{ fontSize: 22 }}>{app.icon}</div>
                            <div style={{ fontSize: 10, marginTop: 4, fontWeight: 600, color: newUpiApp === app.id ? 'var(--primary)' : 'var(--muted)' }}>{app.name.split(' ')[0]}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>UPI ID *</label>
                      <input type="text" placeholder="e.g. 9876543210@ybl or name@okaxis"
                        value={newUpi} onChange={e => setNewUpi(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, boxSizing: 'border-box', fontFamily: 'monospace' }} />
                    </div>
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>NICKNAME (optional)</label>
                      <input type="text" placeholder="e.g. My PhonePe"
                        value={newUpiNickname} onChange={e => setNewUpiNickname(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, boxSizing: 'border-box' }} />
                    </div>
                    <button onClick={addUpi}
                      style={{ width: '100%', padding: 14, borderRadius: 12, background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
                      Save UPI ID
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CARDS ── */}
        {tab === 'card' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Saved Cards ({savedCards.length})</div>
              <button onClick={() => setShowAddCard(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
                <Plus size={14} /> Add Card
              </button>
            </div>

            {savedCards.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--muted)' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>💳</div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>No cards saved</div>
                <div style={{ fontSize: 13 }}>Save your card for faster checkout</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {savedCards.map(card => (
                  <div key={card.id} style={{ background: 'linear-gradient(135deg, #1e293b, #334155)', borderRadius: 16, padding: '20px', color: 'white', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                    <div style={{ position: 'absolute', bottom: -30, left: 60, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                      <div>
                        <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 600, letterSpacing: 1 }}>GRAMFRESH</div>
                        <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>{card.network.toUpperCase()}</div>
                      </div>
                      <button onClick={() => removeCard(card.id)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, padding: '5px', cursor: 'pointer', color: 'white', display: 'flex' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: 18, letterSpacing: 4, marginBottom: 16 }}>
                      •••• •••• •••• {card.last4}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div>
                        <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 2 }}>CARD HOLDER</div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{card.name || 'Card Holder'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 2 }}>EXPIRES</div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{card.expiry}</div>
                      </div>
                    </div>
                    {card.nickname && <div style={{ marginTop: 10, fontSize: 11, opacity: 0.6 }}>{card.nickname}</div>}
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 18 }}>🔒</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                Only the last 4 digits are saved. We never store your full card number or CVV. All payments are secured with 256-bit encryption.
              </div>
            </div>

            {/* Add Card modal */}
            {showAddCard && (
              <div className="detail-overlay" onClick={() => setShowAddCard(false)}>
                <div className="detail-sheet" onClick={e => e.stopPropagation()}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>Add Card</div>
                    <button onClick={() => setShowAddCard(false)}><X size={18} /></button>
                  </div>
                  <div style={{ padding: '20px 20px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>CARD NETWORK</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                        {CARD_NETWORKS.map(n => (
                          <button key={n.id} onClick={() => setCardForm({ ...cardForm, network: n.id })}
                            style={{ padding: '8px 4px', borderRadius: 8, border: `2px solid ${cardForm.network === n.id ? 'var(--primary)' : 'var(--border)'}`, background: cardForm.network === n.id ? 'var(--primary-light)' : 'var(--white)', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: cardForm.network === n.id ? 'var(--primary)' : 'var(--muted)' }}>
                            {n.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>CARD NUMBER *</label>
                      <input type="text" placeholder="1234 5678 9012 3456" inputMode="numeric"
                        value={cardForm.number}
                        onChange={e => setCardForm({ ...cardForm, number: formatCardNumber(e.target.value) })}
                        style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 16, boxSizing: 'border-box', fontFamily: 'monospace', letterSpacing: 2 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>CARD HOLDER NAME *</label>
                      <input type="text" placeholder="As printed on card"
                        value={cardForm.name} onChange={e => setCardForm({ ...cardForm, name: e.target.value })}
                        style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, boxSizing: 'border-box', textTransform: 'uppercase' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>EXPIRY (MM/YY) *</label>
                        <input type="text" placeholder="MM/YY" inputMode="numeric"
                          value={cardForm.expiry} onChange={e => setCardForm({ ...cardForm, expiry: formatExpiry(e.target.value) })}
                          style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, boxSizing: 'border-box', fontFamily: 'monospace' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>NICKNAME</label>
                        <input type="text" placeholder="e.g. My HDFC Card"
                          value={cardForm.nickname} onChange={e => setCardForm({ ...cardForm, nickname: e.target.value })}
                          style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, boxSizing: 'border-box' }} />
                      </div>
                    </div>
                    <button onClick={addCard}
                      style={{ width: '100%', padding: 14, borderRadius: 12, background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', marginTop: 4 }}>
                      Save Card Securely
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── NET BANKING ── */}
        {tab === 'netbanking' && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--text2)' }}>POPULAR BANKS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {NET_BANKS.map(bank => (
                <div key={bank.id} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, var(--primary-light), var(--primary))', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: 'white' }}>{bank.short.slice(0, 3)}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{bank.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>Net Banking · Instant</div>
                  </div>
                  <CheckCircle2 size={18} color="var(--primary)" />
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>ℹ️ About Net Banking</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                Net Banking is available at checkout for all the banks listed above. You'll be redirected to your bank's secure portal to complete the payment. No setup needed — just select your bank when placing an order.
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && <div className="toast">✓ {toast}</div>}
    </>
  );
}
