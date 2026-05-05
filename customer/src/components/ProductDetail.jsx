import { useState, useEffect, useRef } from 'react';
import { X, Keyboard } from 'lucide-react';
import { useAuth, useCart } from '../App';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { getImg } from '../pages/Home';

export default function ProductDetail({ product, onClose, onAdded }) {
  const { isLoggedIn } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [qty, setQty] = useState(product.min_qty_grams);
  const [adding, setAdding] = useState(false);
  const [typingQty, setTypingQty] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    API.get(`/products/${product.id}`).then(r => {
      setDetail(r.data.product);
      setQty(r.data.product.min_qty_grams);
    });
  }, [product.id]);

  if (!detail) return null;

  const step = detail.qty_step_grams || 50;
  const min = detail.min_qty_grams;
  const max = detail.max_qty_grams || 10000;
  const unitType = detail.unit_type || 'grams';

  const calcPrice = (q) => {
    if (unitType === 'pieces') return Math.round(q * detail.price_per_kg);
    return Math.round((q / 1000) * detail.price_per_kg);
  };

  const fmtQty = (q) => {
    if (unitType === 'pieces') return `${q} pc${q > 1 ? 's' : ''}`;
    if (unitType === 'liters') return q >= 1000 ? `${(q / 1000).toFixed(1)}L` : `${q}ml`;
    return q >= 1000 ? `${(q / 1000).toFixed(1)}kg` : `${q}g`;
  };

  const snapToStep = (raw) => {
    const clamped = Math.max(min, Math.min(max, raw));
    return Math.round((clamped - min) / step) * step + min;
  };

  const price = calcPrice(qty);
  const priceLabel = unitType === 'pieces' ? '/pc' : unitType === 'liters' ? '/L' : '/kg';

  const decrease = () => setQty(Math.max(min, qty - step));
  const increase = () => setQty(Math.min(max, qty + step));

  const quickQtys = detail.price_table?.map(p => p.quantity) ||
    [100, 250, 500, 1000, 2000].filter(q => q >= min && q <= max);

  const openTyping = () => {
    setInputVal(String(qty));
    setTypingQty(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const commitTyped = () => {
    const raw = parseFloat(inputVal);
    if (!isNaN(raw) && raw > 0) {
      setQty(snapToStep(Math.round(raw)));
    }
    setTypingQty(false);
  };

  const handleInputKey = (e) => {
    if (e.key === 'Enter') commitTyped();
    if (e.key === 'Escape') setTypingQty(false);
  };

  const unitSuffix = unitType === 'pieces' ? 'pcs' : unitType === 'liters' ? 'ml' : 'g';

  const handleAdd = async () => {
    if (!isLoggedIn) { onClose(); navigate('/login'); return; }
    setAdding(true);
    try {
      await addToCart(detail.id, qty);
      onAdded(`${detail.name} (${fmtQty(qty)}) added to cart`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add');
    } finally { setAdding(false); }
  };

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-sheet" onClick={e => e.stopPropagation()}>
        <div className="detail-header">
          <img src={getImg(detail)} alt={detail.name} />
          <button className="detail-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="detail-body">
          <div className="detail-name">{detail.name}</div>
          {detail.name_local && <div className="detail-local">{detail.name_local}</div>}
          <div className="detail-category">{detail.category_icon} {detail.category_name}</div>
          {detail.description && (
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.55 }}>
              {detail.description}
            </p>
          )}

          <div className="qty-picker">
            <div className="label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Select Quantity</span>
              <button
                onClick={openTyping}
                title="Type a quantity"
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 12, color: 'var(--primary)', background: 'none',
                  border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0
                }}
              >
                <Keyboard size={13} /> Type qty
              </button>
            </div>

            <div className="qty-slider-row">
              <button className="qty-btn" onClick={decrease}>−</button>

              {typingQty ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' }}>
                  <input
                    ref={inputRef}
                    type="number"
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    onBlur={commitTyped}
                    onKeyDown={handleInputKey}
                    style={{
                      width: 80, textAlign: 'center', fontSize: 18, fontWeight: 700,
                      border: '2px solid var(--primary)', borderRadius: 8, padding: '4px 6px',
                      outline: 'none', color: 'var(--text1)', background: 'var(--surface)'
                    }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{unitSuffix}</span>
                </div>
              ) : (
                <div className="qty-display" onClick={openTyping} style={{ cursor: 'text' }} title="Click to type a quantity">
                  {fmtQty(qty)}
                </div>
              )}

              <button className="qty-btn" onClick={increase}>+</button>
            </div>

            <input type="range" className="qty-slider" min={min} max={max} step={step}
              value={qty} onChange={e => setQty(Number(e.target.value))} />

            <div className="quick-qtys">
              {quickQtys.map(q => (
                <button key={q} className={`quick-qty ${qty === q ? 'active' : ''}`}
                  onClick={() => setQty(q)}>{fmtQty(q)}</button>
              ))}
            </div>
          </div>

          <div className="live-price">
            <div>
              <div className="amount">₹{price}</div>
            </div>
            <div className="breakdown">
              <strong>{fmtQty(qty)}</strong> × ₹{detail.price_per_kg}{priceLabel}<br />
              <span>₹{detail.price_per_kg}{priceLabel}</span>
            </div>
          </div>

          <button className="add-to-cart-btn" onClick={handleAdd} disabled={adding}>
            {adding ? 'Adding...' : `Add to Cart — ₹${price}`}
          </button>
        </div>
      </div>
    </div>
  );
}
