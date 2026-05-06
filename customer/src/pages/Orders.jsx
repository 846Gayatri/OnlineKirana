import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const STATUS_LABELS = {
  pending: 'Pending', confirmed: 'Confirmed', packed: 'Being Packed',
  out_for_delivery: 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled',
};

const STATUS_ICONS = {
  pending: '📦', confirmed: '✅', packed: '🧺',
  out_for_delivery: '🛵', delivered: '🎉', cancelled: '❌',
};

const ACTIVE_STATUSES = ['pending', 'confirmed', 'packed', 'out_for_delivery'];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/orders/my').then(r => { setOrders(r.data.orders); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const fmtDate = (d) => new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });

  const fmtQty = (q, unitType) => {
    if (unitType === 'pieces') return `${q}pcs`;
    if (unitType === 'liters') return q >= 1000 ? `${(q / 1000).toFixed(1)}L` : `${q}ml`;
    return q >= 1000 ? `${(q / 1000).toFixed(1)}kg` : `${q}g`;
  };

  const isLive = (status) => ACTIVE_STATUSES.includes(status);

  return (
    <>
      <div className="page-header"><h2>📋 My Orders</h2></div>
      <div className="page-content" style={{ padding: '12px 16px 100px' }}>
        {loading ? (
          <div className="loader"><div className="spin" /></div>
        ) : orders.length === 0 ? (
          <div className="empty">
            <div className="icon">📭</div>
            <div className="title">No orders yet</div>
            <div className="sub">Your order history will appear here</div>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="order-card" style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/orders/${order.id}/track`)}>
              <div className="order-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div className="order-number">{order.order_number}</div>
                    {isLive(order.status) && (
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#10b981', background: '#dcfce7', padding: '2px 7px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'liveDot 1.5s infinite' }} />
                        LIVE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{fmtDate(order.created_at)}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span className={`order-status status-${order.status}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {STATUS_ICONS[order.status]} {STATUS_LABELS[order.status]}
                  </span>
                </div>
              </div>
              <div className="order-items-list">
                {order.items?.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                    <span>{item.product_name} ({fmtQty(item.quantity_grams, item.unit_type)})</span>
                    <span style={{ fontWeight: 600 }}>₹{item.item_total}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {order.payment_method?.toUpperCase()}{order.delivery_fee > 0 ? ` · ₹${order.delivery_fee} delivery` : ' · Free delivery'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="order-total">₹{order.total}</span>
                  {!['delivered', 'cancelled'].includes(order.status) && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '4px 10px', borderRadius: 8 }}>
                      Track →
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <style>{`@keyframes liveDot { 0%,100%{opacity:1} 50%{opacity:.2} }`}</style>
    </>
  );
}
