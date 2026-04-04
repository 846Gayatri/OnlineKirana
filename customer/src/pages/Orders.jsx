import { useState, useEffect } from 'react';
import API from '../api';

const STATUS_LABELS = {
  pending: 'Pending', confirmed: 'Confirmed', packed: 'Packed',
  out_for_delivery: 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/orders/my').then(r => { setOrders(r.data.orders); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const fmtDate = (d) => new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const fmtQty = (q, unitType) => {
    if (unitType === 'pieces') return `${q}pcs`;
    if (unitType === 'liters') return q >= 1000 ? `${(q / 1000).toFixed(1)}L` : `${q}ml`;
    return q >= 1000 ? `${(q / 1000).toFixed(1)}kg` : `${q}g`;
  };

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
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <div className="order-number">{order.order_number}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{fmtDate(order.created_at)}</div>
                </div>
                <span className={`order-status status-${order.status}`}>
                  {STATUS_LABELS[order.status]}
                </span>
              </div>
              <div className="order-items-list">
                {order.items?.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                    <span>{item.product_name} ({fmtQty(item.quantity_grams, item.unit_type)})</span>
                    <span style={{ fontWeight: 600 }}>₹{item.item_total}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {order.payment_method?.toUpperCase()}{order.delivery_fee > 0 ? ` + ₹${order.delivery_fee} delivery` : ' + Free delivery'}
                </span>
                <span className="order-total">₹{order.total}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
