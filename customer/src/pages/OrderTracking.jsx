import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, ChefHat, Bike, CheckCircle2, Clock, MapPin } from 'lucide-react';
import API from '../api';

const STEPS = [
  {
    key: 'pending',
    label: 'Order Placed',
    sub: 'We received your order',
    icon: Package,
    color: '#6366f1',
    bg: '#eef2ff',
  },
  {
    key: 'confirmed',
    label: 'Order Confirmed',
    sub: 'Your order is confirmed',
    icon: CheckCircle2,
    color: '#0ea5e9',
    bg: '#e0f2fe',
  },
  {
    key: 'packed',
    label: 'Being Packed',
    sub: 'Items are being packed fresh',
    icon: ChefHat,
    color: '#f59e0b',
    bg: '#fef3c7',
  },
  {
    key: 'out_for_delivery',
    label: 'Out for Delivery',
    sub: 'Our rider is on the way!',
    icon: Bike,
    color: '#10b981',
    bg: '#d1fae5',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    sub: 'Enjoy your fresh groceries!',
    icon: CheckCircle2,
    color: '#16a34a',
    bg: '#dcfce7',
  },
];

function fmtTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function Countdown({ target }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, Math.floor((new Date(target) - Date.now()) / 1000));
      setSecs(diff);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [target]);
  if (secs <= 0) return <span style={{ color: 'var(--primary)', fontWeight: 800 }}>Any moment now!</span>;
  const m = Math.floor(secs / 60), s = secs % 60;
  return <span style={{ color: 'var(--primary)', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{m}:{String(s).padStart(2, '0')} min</span>;
}

function DeliveryAnimation({ status }) {
  const icons = {
    pending: '📦',
    confirmed: '✅',
    packed: '🧺',
    out_for_delivery: '🛵',
    delivered: '🎉',
    cancelled: '❌',
  };
  const isRiding = status === 'out_for_delivery';
  return (
    <div style={{ position: 'relative', height: 90, marginBottom: 8, overflow: 'hidden' }}>
      {/* Road */}
      <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, height: 3, background: 'repeating-linear-gradient(90deg, var(--border) 0, var(--border) 16px, transparent 16px, transparent 30px)' }} />
      {/* Store icon left */}
      <div style={{ position: 'absolute', bottom: 16, left: 10, fontSize: 26 }}>🏪</div>
      {/* Home icon right */}
      <div style={{ position: 'absolute', bottom: 16, right: 10, fontSize: 26 }}>🏠</div>
      {/* Rider */}
      <div style={{
        position: 'absolute', bottom: 17,
        left: isRiding ? undefined : status === 'delivered' ? 'calc(100% - 60px)' : '30px',
        right: status === 'delivered' ? '30px' : undefined,
        fontSize: 28,
        transition: 'left 2s ease, right 2s ease',
        animation: isRiding ? 'rideAcross 3s ease-in-out infinite alternate' : undefined,
      }}>
        {icons[status] || '📦'}
      </div>
      <style>{`
        @keyframes rideAcross {
          from { left: 18%; }
          to   { left: 72%; }
        }
      `}</style>
    </div>
  );
}

function fmtQty(q, unitType) {
  if (unitType === 'pieces') return `${q} pc${q > 1 ? 's' : ''}`;
  if (unitType === 'liters') return q >= 1000 ? `${(q / 1000).toFixed(1)}L` : `${q}ml`;
  return q >= 1000 ? `${(q / 1000).toFixed(1)}kg` : `${q}g`;
}

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const pollingRef = useRef(null);

  const fetchTracking = async (quiet = false) => {
    try {
      if (!quiet) setLoading(true);
      const { data: resp } = await API.get(`/orders/${id}/track`);
      setData(resp);
      setLastRefresh(Date.now());
    } catch {
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    pollingRef.current = setInterval(() => fetchTracking(true), 5000);
    return () => clearInterval(pollingRef.current);
  }, [id]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="spinner" style={{ width: 40, height: 40, border: '4px solid var(--primary-light)', borderTopColor: 'var(--primary)', marginBottom: 16 }} />
      <div style={{ color: 'var(--muted)', fontSize: 14 }}>Loading tracking info…</div>
    </div>
  );

  if (!data) return null;

  const { order, timeline, estimated_delivery, is_cancelled } = data;
  const isDelivered = order.status === 'delivered';
  const isActive = !is_cancelled && !isDelivered;
  const currentStepIdx = STEPS.findIndex(s => s.key === order.status);
  const progressPct = is_cancelled ? 0 : Math.max(0, Math.round((currentStepIdx / (STEPS.length - 1)) * 100));

  return (
    <>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => navigate('/orders')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: 17 }}>🛵 Track Order</h2>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{order.order_number}</div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#10b981' : 'var(--muted)', animation: isActive ? 'pulse 1.5s infinite' : 'none' }} />
          {isActive ? 'Live' : 'Final'}
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }`}</style>
        </div>
      </div>

      <div className="page-content" style={{ padding: '0 16px 100px' }}>

        {/* Delivery animation */}
        {!is_cancelled && (
          <div style={{ background: 'var(--surface2)', borderRadius: 16, padding: '16px 20px 10px', marginBottom: 16 }}>
            <DeliveryAnimation status={order.status} />

            {/* Progress bar */}
            <div style={{ height: 6, background: 'var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: isDelivered ? '#16a34a' : 'var(--primary)', borderRadius: 10, transition: 'width 0.8s ease' }} />
            </div>

            {isDelivered ? (
              <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 800, color: '#16a34a', padding: '4px 0 8px' }}>
                🎉 Delivered! Enjoy your fresh groceries.
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  <Clock size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                  Est. delivery
                </div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  <Countdown target={estimated_delivery} />
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, marginLeft: 6 }}>by {fmtTime(estimated_delivery)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {is_cancelled && (
          <div style={{ background: '#fff5f5', border: '2px solid #fee2e2', borderRadius: 16, padding: 20, marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>❌</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--red)' }}>Order Cancelled</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>This order was cancelled. Any payments will be refunded shortly.</div>
          </div>
        )}

        {/* Timeline */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 20px 8px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 18, color: 'var(--text2)', letterSpacing: 0.3 }}>DELIVERY TIMELINE</div>
          {STEPS.map((step, i) => {
            const tl = timeline[i];
            const isDone = tl?.done;
            const isActiveStep = tl?.active;
            const Icon = step.icon;
            const isLast = i === STEPS.length - 1;
            return (
              <div key={step.key} style={{ display: 'flex', gap: 16, marginBottom: isLast ? 0 : 4, position: 'relative' }}>
                {/* Icon column */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: isDone ? step.bg : 'var(--surface2)',
                    border: isActiveStep ? `2px solid ${step.color}` : isDone ? `2px solid ${step.bg}` : '2px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isActiveStep ? `0 0 0 4px ${step.color}22` : 'none',
                    transition: 'all 0.4s ease',
                    position: 'relative',
                    zIndex: 1,
                  }}>
                    {isActiveStep ? (
                      <>
                        <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `2px solid ${step.color}44`, animation: 'ringPulse 1.5s infinite' }} />
                        <style>{`@keyframes ringPulse { 0%{transform:scale(1);opacity:1} 100%{transform:scale(1.5);opacity:0} }`}</style>
                      </>
                    ) : null}
                    <Icon size={20} color={isDone ? step.color : 'var(--border)'} strokeWidth={2.5} />
                  </div>
                  {!isLast && (
                    <div style={{ width: 2, flex: 1, minHeight: 30, background: isDone && !isActiveStep ? step.color : 'var(--border)', margin: '4px 0', borderRadius: 2, transition: 'background 0.4s ease' }} />
                  )}
                </div>

                {/* Text column */}
                <div style={{ flex: 1, paddingBottom: isLast ? 0 : 24, paddingTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: isDone ? 800 : 600, color: isDone ? 'var(--text)' : 'var(--muted)' }}>
                        {step.label}
                        {isActiveStep && (
                          <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: step.color, background: step.bg, padding: '2px 8px', borderRadius: 10, verticalAlign: 'middle' }}>
                            IN PROGRESS
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{step.sub}</div>
                    </div>
                    {isDone && tl.timestamp && (
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, flexShrink: 0, marginTop: 2 }}>
                        {fmtTime(tl.timestamp)}
                      </div>
                    )}
                    {!isDone && (
                      <div style={{ fontSize: 11, color: 'var(--border)', fontWeight: 600, marginTop: 2 }}>—</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order summary */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 14, color: 'var(--text2)' }}>ORDER SUMMARY</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {order.items?.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.product_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{fmtQty(item.quantity_grams, item.unit_type)}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>₹{item.item_total}</div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 14, paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
              <span>Subtotal</span><span>₹{order.subtotal}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
              <span>Delivery</span>
              <span style={{ color: order.delivery_fee === 0 ? 'var(--primary)' : undefined }}>
                {order.delivery_fee === 0 ? 'FREE' : `₹${order.delivery_fee}`}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15 }}>
              <span>Total</span><span>₹{order.total}</span>
            </div>
          </div>
        </div>

        {/* Delivery info */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, color: 'var(--text2)' }}>DELIVERY DETAILS</div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <MapPin size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Home</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Vijayawada, Andhra Pradesh</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Clock size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Ordered at {fmtDate(order.created_at)}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                Payment: {order.payment_method?.toUpperCase?.()}
              </div>
            </div>
          </div>
        </div>

        {/* Refresh hint */}
        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
          Refreshing every 5 seconds
        </div>
      </div>
    </>
  );
}
