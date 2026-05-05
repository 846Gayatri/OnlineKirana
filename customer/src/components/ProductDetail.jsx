import { useState, useEffect, useRef } from 'react';
import { X, Keyboard, Star, Camera, Send, Trash2 } from 'lucide-react';
import { useAuth, useCart } from '../App';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { getImg } from '../pages/Home';

function StarPicker({ value, onChange, size = 24 }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
          <Star size={size}
            fill={(hover || value) >= s ? '#f59e0b' : 'none'}
            color={(hover || value) >= s ? '#f59e0b' : '#d1d5db'}
            strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ value, size = 14 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={size}
          fill={value >= s ? '#f59e0b' : value >= s - 0.5 ? '#f59e0b' : 'none'}
          color={value >= s ? '#f59e0b' : '#d1d5db'}
          strokeWidth={1.5} />
      ))}
    </div>
  );
}

export default function ProductDetail({ product, onClose, onAdded }) {
  const { isLoggedIn, user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [qty, setQty] = useState(product.min_qty_grams);
  const [adding, setAdding] = useState(false);
  const [typingQty, setTypingQty] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef(null);

  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [myPhoto, setMyPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const photoInputRef = useRef(null);

  useEffect(() => {
    API.get(`/products/${product.id}`).then(r => {
      setDetail(r.data.product);
      setQty(r.data.product.min_qty_grams);
    });
    fetchReviews();
  }, [product.id]);

  const fetchReviews = () => {
    API.get(`/reviews/product/${product.id}`).then(r => {
      setReviews(r.data.reviews);
      setAvgRating(r.data.avg_rating);
    }).catch(() => {});
  };

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
    if (!isNaN(raw) && raw > 0) setQty(snapToStep(Math.round(raw)));
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

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMyPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmitReview = async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    if (myRating === 0) { alert('Please select a star rating'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('product_id', detail.id);
      fd.append('rating', myRating);
      if (myComment) fd.append('comment', myComment);
      if (myPhoto) fd.append('photo', myPhoto);
      await API.post('/reviews', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMyRating(0); setMyComment(''); setMyPhoto(null); setPhotoPreview(null);
      setShowReviewForm(false);
      fetchReviews();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit review');
    } finally { setSubmitting(false); }
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const reviewerLabel = (r) => r.reviewer_name || `+91 ${r.reviewer_phone?.slice(-4).padStart(10, '*')}`;

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div className="detail-category">{detail.category_icon} {detail.category_name}</div>
            {reviews.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <StarDisplay value={avgRating} size={13} />
                <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{avgRating} ({reviews.length})</span>
              </div>
            )}
          </div>
          {detail.description && (
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.55 }}>
              {detail.description}
            </p>
          )}

          <div className="qty-picker">
            <div className="label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Select Quantity</span>
              <button onClick={openTyping} title="Type a quantity"
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>
                <Keyboard size={13} /> Type qty
              </button>
            </div>
            <div className="qty-slider-row">
              <button className="qty-btn" onClick={decrease}>−</button>
              {typingQty ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' }}>
                  <input ref={inputRef} type="number" value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    onBlur={commitTyped} onKeyDown={handleInputKey}
                    style={{ width: 80, textAlign: 'center', fontSize: 18, fontWeight: 700, border: '2px solid var(--primary)', borderRadius: 8, padding: '4px 6px', outline: 'none', color: 'var(--text1)', background: 'var(--surface)' }} />
                  <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{unitSuffix}</span>
                </div>
              ) : (
                <div className="qty-display" onClick={openTyping} style={{ cursor: 'text' }}>{fmtQty(qty)}</div>
              )}
              <button className="qty-btn" onClick={increase}>+</button>
            </div>
            <input type="range" className="qty-slider" min={min} max={max} step={step}
              value={qty} onChange={e => setQty(Number(e.target.value))} />
            <div className="quick-qtys">
              {quickQtys.map(q => (
                <button key={q} className={`quick-qty ${qty === q ? 'active' : ''}`} onClick={() => setQty(q)}>{fmtQty(q)}</button>
              ))}
            </div>
          </div>

          <div className="live-price">
            <div><div className="amount">₹{price}</div></div>
            <div className="breakdown">
              <strong>{fmtQty(qty)}</strong> × ₹{detail.price_per_kg}{priceLabel}<br />
              <span>₹{detail.price_per_kg}{priceLabel}</span>
            </div>
          </div>

          <button className="add-to-cart-btn" onClick={handleAdd} disabled={adding}>
            {adding ? 'Adding...' : `Add to Cart — ₹${price}`}
          </button>

          {/* ─── Reviews Section ─── */}
          <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>
                Customer Reviews {reviews.length > 0 && <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>({reviews.length})</span>}
              </div>
              {isLoggedIn && (
                <button onClick={() => setShowReviewForm(!showReviewForm)}
                  style={{ fontSize: 12, fontWeight: 700, color: 'white', background: 'var(--primary)', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
                  {showReviewForm ? 'Cancel' : '✍️ Write Review'}
                </button>
              )}
            </div>

            {showReviewForm && (
              <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text2)' }}>YOUR RATING</div>
                  <StarPicker value={myRating} onChange={setMyRating} size={28} />
                </div>
                <textarea
                  placeholder="Share your experience with this product..."
                  value={myComment}
                  onChange={e => setMyComment(e.target.value)}
                  rows={3}
                  style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)', padding: '10px', fontSize: 13, resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: 'var(--text1)', background: 'var(--white)' }} />
                <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                  <input ref={photoInputRef} type="file" accept="image/*" capture="environment"
                    onChange={handlePhotoChange} style={{ display: 'none' }} />
                  <button onClick={() => photoInputRef.current?.click()}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-light)', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>
                    <Camera size={14} /> {myPhoto ? 'Change Photo' : 'Add Photo'}
                  </button>
                  {photoPreview && (
                    <div style={{ position: 'relative', width: 48, height: 48 }}>
                      <img src={photoPreview} alt="preview" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                      <button onClick={() => { setMyPhoto(null); setPhotoPreview(null); }}
                        style={{ position: 'absolute', top: -6, right: -6, background: 'var(--red)', color: 'white', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>
                  )}
                  <button onClick={handleSubmitReview} disabled={submitting || myRating === 0}
                    style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: 'white', background: myRating > 0 ? 'var(--primary)' : 'var(--muted)', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: myRating > 0 ? 'pointer' : 'not-allowed' }}>
                    <Send size={14} /> {submitting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            )}

            {reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted)', fontSize: 13 }}>
                No reviews yet. Be the first to review!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {reviews.map(r => (
                  <div key={r.id} style={{ background: 'var(--surface2)', borderRadius: 10, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{reviewerLabel(r)}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{fmtDate(r.created_at)}</div>
                      </div>
                      <StarDisplay value={r.rating} size={13} />
                    </div>
                    {r.comment && <p style={{ fontSize: 13, color: 'var(--text2)', margin: '6px 0', lineHeight: 1.5 }}>{r.comment}</p>}
                    {r.photo_url && (
                      <img src={r.photo_url} alt="Review"
                        style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8, marginTop: 6 }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
