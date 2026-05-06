import { useState, useEffect, useRef } from 'react';
import { X, Keyboard, Star, Camera, Send, Trash2, ThumbsUp } from 'lucide-react';
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

function RatingSummary({ reviews, avgRating }) {
  const total = reviews.length;
  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: total > 0 ? (reviews.filter(r => r.rating === star).length / total) * 100 : 0,
  }));

  const ratingLabel = avg => {
    if (avg >= 4.5) return { text: 'Excellent', color: '#16a34a' };
    if (avg >= 4.0) return { text: 'Very Good', color: '#22c55e' };
    if (avg >= 3.5) return { text: 'Good', color: '#84cc16' };
    if (avg >= 3.0) return { text: 'Average', color: '#f59e0b' };
    return { text: 'Below Average', color: '#ef4444' };
  };
  const label = ratingLabel(avgRating);

  if (total === 0) return null;

  return (
    <div style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1px solid #f59e0b33', borderRadius: 14, padding: 16, marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        {/* Big number */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: '#92400e', lineHeight: 1 }}>{avgRating}</div>
          <StarDisplay value={avgRating} size={16} />
          <div style={{ fontSize: 11, fontWeight: 700, color: label.color, marginTop: 4 }}>{label.text}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{total} review{total !== 1 ? 's' : ''}</div>
        </div>
        {/* Breakdown bars */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {dist.map(d => (
            <div key={d.star} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', width: 12, textAlign: 'right', flexShrink: 0 }}>{d.star}</div>
              <Star size={10} fill="#f59e0b" color="#f59e0b" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, height: 6, background: '#fde68a', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${d.pct}%`, background: d.pct > 60 ? '#16a34a' : d.pct > 30 ? '#f59e0b' : '#ef4444', borderRadius: 4, transition: 'width 0.6s ease' }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', width: 20, textAlign: 'right', flexShrink: 0 }}>{d.count}</div>
            </div>
          ))}
        </div>
      </div>
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
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    API.get(`/products/${product.id}`).then(r => {
      setDetail(r.data.product);
      setQty(r.data.product.min_qty_grams);
    });
    fetchReviews();
  }, [product.id]);

  const fetchReviews = () => {
    API.get(`/reviews/product/${product.id}`).then(r => {
      setReviews(r.data.reviews || []);
      setAvgRating(r.data.avg_rating || 0);
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
  const reviewerLabel = (r) => r.reviewer_name || `User ****${r.reviewer_phone?.slice(-4)}`;

  const RATING_WORDS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-sheet" onClick={e => e.stopPropagation()}>
        <div className="detail-header">
          <img src={getImg(detail)} alt={detail.name} />
          <button className="detail-close" onClick={onClose}><X size={18} /></button>
          {/* Rating badge on image */}
          {reviews.length > 0 && (
            <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.7)', borderRadius: 20, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5, backdropFilter: 'blur(4px)' }}>
              <Star size={12} fill="#f59e0b" color="#f59e0b" />
              <span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>{avgRating}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>({reviews.length})</span>
            </div>
          )}
        </div>

        <div className="detail-body">
          <div className="detail-name">{detail.name}</div>
          {detail.name_local && <div className="detail-local">{detail.name_local}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div className="detail-category">{detail.category_icon} {detail.category_name}</div>
            {reviews.length > 0 && (
              <button onClick={() => setActiveTab('reviews')}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fef3c7', border: '1px solid #f59e0b33', borderRadius: 20, padding: '3px 10px', cursor: 'pointer' }}>
                <StarDisplay value={avgRating} size={11} />
                <span style={{ fontSize: 11, color: '#92400e', fontWeight: 700 }}>{avgRating} · {reviews.length} reviews</span>
              </button>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 10, padding: 3, marginBottom: 16, gap: 2 }}>
            {[
              { id: 'details', label: 'Details' },
              { id: 'reviews', label: `Reviews${reviews.length > 0 ? ` (${reviews.length})` : ''}` },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: activeTab === tab.id ? 'var(--white)' : 'transparent', color: activeTab === tab.id ? 'var(--primary)' : 'var(--muted)', boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── DETAILS TAB ── */}
          {activeTab === 'details' && (
            <>
              {detail.description && (
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.55 }}>{detail.description}</p>
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

              {/* Mini review teaser */}
              {reviews.length > 0 && (
                <button onClick={() => setActiveTab('reviews')}
                  style={{ width: '100%', marginTop: 12, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: '#fffbeb', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#92400e' }}>{avgRating}</div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <StarDisplay value={avgRating} size={14} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#92400e' }}>{avgRating} / 5</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      {reviews.length} customer review{reviews.length !== 1 ? 's' : ''} — tap to read →
                    </div>
                  </div>
                </button>
              )}
            </>
          )}

          {/* ── REVIEWS TAB ── */}
          {activeTab === 'reviews' && (
            <div>
              {/* Rating summary */}
              <RatingSummary reviews={reviews} avgRating={avgRating} />

              {/* Write review */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>
                  {reviews.length > 0 ? `${reviews.length} Review${reviews.length !== 1 ? 's' : ''}` : 'No Reviews Yet'}
                </div>
                {isLoggedIn && (
                  <button onClick={() => setShowReviewForm(!showReviewForm)}
                    style={{ fontSize: 12, fontWeight: 700, color: 'white', background: showReviewForm ? 'var(--muted)' : 'var(--primary)', border: 'none', borderRadius: 8, padding: '7px 13px', cursor: 'pointer' }}>
                    {showReviewForm ? '✕ Cancel' : '✍️ Write a Review'}
                  </button>
                )}
                {!isLoggedIn && (
                  <button onClick={() => { onClose(); navigate('/login'); }}
                    style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', border: 'none', borderRadius: 8, padding: '7px 13px', cursor: 'pointer' }}>
                    Login to Review
                  </button>
                )}
              </div>

              {/* Review form */}
              {showReviewForm && (
                <div style={{ background: 'var(--surface2)', borderRadius: 14, padding: 16, marginBottom: 16, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, color: 'var(--text2)' }}>YOUR REVIEW</div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>RATING *</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <StarPicker value={myRating} onChange={setMyRating} size={30} />
                      {myRating > 0 && (
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{RATING_WORDS[myRating]}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>COMMENT (optional)</div>
                    <textarea
                      placeholder="Share your experience — quality, freshness, value..."
                      value={myComment}
                      onChange={e => setMyComment(e.target.value)}
                      rows={3}
                      style={{ width: '100%', borderRadius: 10, border: '1.5px solid var(--border)', padding: '10px 12px', fontSize: 13, resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: 'var(--text1)', background: 'var(--white)', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input ref={photoInputRef} type="file" accept="image/*" capture="environment"
                      onChange={handlePhotoChange} style={{ display: 'none' }} />
                    <button onClick={() => photoInputRef.current?.click()}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-light)', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', flexShrink: 0 }}>
                      <Camera size={14} /> {myPhoto ? 'Change Photo' : 'Add Photo'}
                    </button>
                    {photoPreview && (
                      <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
                        <img src={photoPreview} alt="preview" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, border: '2px solid var(--primary)' }} />
                        <button onClick={() => { setMyPhoto(null); setPhotoPreview(null); }}
                          style={{ position: 'absolute', top: -6, right: -6, background: 'var(--red)', color: 'white', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                      </div>
                    )}
                    <button onClick={handleSubmitReview} disabled={submitting || myRating === 0}
                      style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: 'white', background: myRating > 0 ? 'var(--primary)' : 'var(--border)', border: 'none', borderRadius: 8, padding: '9px 16px', cursor: myRating > 0 ? 'pointer' : 'not-allowed', flexShrink: 0 }}>
                      <Send size={14} /> {submitting ? 'Posting...' : 'Post Review'}
                    </button>
                  </div>
                </div>
              )}

              {/* Reviews list */}
              {reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--muted)' }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>⭐</div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>No reviews yet</div>
                  <div style={{ fontSize: 13 }}>Be the first to review this product!</div>
                  {isLoggedIn && !showReviewForm && (
                    <button onClick={() => setShowReviewForm(true)}
                      style={{ marginTop: 14, padding: '10px 24px', borderRadius: 10, background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
                      Write a Review
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {reviews.map((r, idx) => {
                    const initials = (r.reviewer_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                    const hue = ((r.user_id || idx) * 47) % 360;
                    return (
                      <div key={r.id} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
                        {/* Reviewer header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <div style={{ width: 38, height: 38, borderRadius: '50%', background: `hsl(${hue}, 65%, 88%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: `hsl(${hue}, 50%, 35%)`, flexShrink: 0 }}>
                              {initials}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700 }}>{reviewerLabel(r)}</div>
                              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{fmtDate(r.created_at)}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                            <StarDisplay value={r.rating} size={14} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: r.rating >= 4 ? '#16a34a' : r.rating >= 3 ? '#f59e0b' : '#ef4444', background: r.rating >= 4 ? '#dcfce7' : r.rating >= 3 ? '#fef3c7' : '#fee2e2', padding: '2px 7px', borderRadius: 10 }}>
                              {RATING_WORDS[r.rating]}
                            </span>
                          </div>
                        </div>

                        {/* Review body */}
                        {r.comment && (
                          <p style={{ fontSize: 13, color: 'var(--text)', margin: '0 0 10px', lineHeight: 1.6, fontStyle: 'italic' }}>
                            "{r.comment}"
                          </p>
                        )}

                        {/* Photo */}
                        {r.photo_url && (
                          <img src={r.photo_url} alt="Review"
                            style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 10, marginBottom: 10 }} />
                        )}

                        {/* Delete own review */}
                        {user && r.user_id === user.id && (
                          <button onClick={async () => {
                            if (!confirm('Delete your review?')) return;
                            await API.delete(`/reviews/${r.id}`);
                            fetchReviews();
                          }}
                            style={{ fontSize: 11, color: 'var(--red)', background: '#fff5f5', border: '1px solid #fee2e2', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Trash2 size={11} /> Delete my review
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
