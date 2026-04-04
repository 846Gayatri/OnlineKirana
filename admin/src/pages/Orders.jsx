import { useState, useEffect } from 'react';
import API from '../api';
import { Search, ChevronRight } from 'lucide-react';

const STATUSES = ['pending','confirmed','packed','out_for_delivery','delivered','cancelled'];
const STATUS_BADGES = {
  pending:'badge-orange', confirmed:'badge-blue', packed:'badge-purple',
  out_for_delivery:'badge-blue', delivered:'badge-green', cancelled:'badge-red',
};
const STATUS_LABELS = {
  pending:'Pending', confirmed:'Confirmed', packed:'Packed',
  out_for_delivery:'Out for Delivery', delivered:'Delivered', cancelled:'Cancelled',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchOrders = () => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    API.get('/orders', { params }).then(r => { setOrders(r.data.orders); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(fetchOrders, [statusFilter]);

  const updateStatus = async (id, status) => {
    await API.patch(`/orders/${id}/status`, { status });
    fetchOrders();
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  const nextStatus = (current) => {
    const idx = STATUSES.indexOf(current);
    return idx < STATUSES.length - 2 ? STATUSES[idx + 1] : null;
  };

  const fmtDate = (d) => new Date(d).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });

  return (
    <>
      <div className="topbar"><h2>Orders</h2></div>
      <div className="page">
        <div className="filters-bar">
          <button className={`btn ${!statusFilter ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setStatusFilter('')}>All</button>
          {STATUSES.map(s => (
            <button key={s} className={`btn ${statusFilter===s ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setStatusFilter(s)}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <div style={{display:'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap:16}}>
          <div className="card">
            {loading ? <div className="loading-center"><div className="spinner"/></div> : (
              <div className="table-wrap"><table><thead><tr>
                <th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th></th>
              </tr></thead><tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state"><div className="icon">📭</div>
                    <p>No orders found</p></div></td></tr>
                ) : orders.map(o => (
                  <tr key={o.id} style={{cursor:'pointer', background: selected?.id===o.id ? 'var(--surface2)' : undefined}}
                    onClick={() => setSelected(o)}>
                    <td style={{fontWeight:700, fontFamily:'monospace', fontSize:12}}>{o.order_number}</td>
                    <td>{o.customer_name || o.customer_phone}</td>
                    <td>{o.items?.length || 0} items</td>
                    <td style={{fontWeight:700}}>₹{o.total}</td>
                    <td><span className={`badge ${STATUS_BADGES[o.status]}`}>{STATUS_LABELS[o.status]}</span></td>
                    <td style={{fontSize:12, color:'var(--muted)'}}>{fmtDate(o.created_at)}</td>
                    <td>
                      {nextStatus(o.status) && (
                        <button className="btn btn-success btn-sm"
                          onClick={(e) => { e.stopPropagation(); updateStatus(o.id, nextStatus(o.status)); }}>
                          → {STATUS_LABELS[nextStatus(o.status)]}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody></table></div>
            )}
          </div>

          {selected && (
            <div className="card" style={{position:'sticky', top:84, alignSelf:'start'}}>
              <div className="card-header">
                <span className="card-title">Order Details</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
              </div>
              <div style={{fontSize:13}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:12}}>
                  <span style={{fontFamily:'monospace', fontWeight:700}}>{selected.order_number}</span>
                  <span className={`badge ${STATUS_BADGES[selected.status]}`}>{STATUS_LABELS[selected.status]}</span>
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:4, marginBottom:16, color:'var(--muted)', fontSize:12}}>
                  <span>👤 {selected.customer_name || 'Customer'} • {selected.customer_phone}</span>
                  <span>📅 {fmtDate(selected.created_at)}</span>
                  {selected.payment_method && <span>💳 {selected.payment_method.toUpperCase()}</span>}
                  {selected.notes && <span>📝 {selected.notes}</span>}
                </div>

                <div style={{borderTop:'1px solid var(--border)', paddingTop:12, marginBottom:12}}>
                  <div className="form-label" style={{marginBottom:8}}>Items</div>
                  {selected.items?.map((item, i) => (
                    <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'6px 0',
                      borderBottom: i < selected.items.length-1 ? '1px solid var(--border)' : 'none'}}>
                      <div>
                        <div style={{fontWeight:600}}>{item.product_name}</div>
                        <div style={{fontSize:11, color:'var(--muted)'}}>
                          {item.quantity_grams}{item.unit_type === 'pieces' ? 'pcs' : item.unit_type === 'liters' ? 'ml' : 'g'} × ₹{item.price_per_kg_snapshot}/{item.unit_type === 'pieces' ? 'pc' : item.unit_type === 'liters' ? 'L' : 'kg'}
                        </div>
                      </div>
                      <div style={{fontWeight:700}}>₹{item.item_total}</div>
                    </div>
                  ))}
                </div>

                <div style={{borderTop:'1px solid var(--border)', paddingTop:12}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:4}}>
                    <span style={{color:'var(--muted)'}}>Subtotal</span><span>₹{selected.subtotal}</span>
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
                    <span style={{color:'var(--muted)'}}>Delivery</span>
                    <span>{selected.delivery_fee > 0 ? `₹${selected.delivery_fee}` : 'Free'}</span>
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:16}}>
                    <span>Total</span><span style={{color:'var(--green)'}}>₹{selected.total}</span>
                  </div>
                </div>

                {nextStatus(selected.status) && (
                  <button className="btn btn-success" style={{width:'100%', marginTop:16, padding:12}}
                    onClick={() => updateStatus(selected.id, nextStatus(selected.status))}>
                    Move to "{STATUS_LABELS[nextStatus(selected.status)]}"
                  </button>
                )}
                {selected.status !== 'cancelled' && selected.status !== 'delivered' && (
                  <button className="btn btn-danger btn-ghost" style={{width:'100%', marginTop:8, padding:10, border:'1px solid rgba(239,68,68,0.3)', color:'var(--red)'}}
                    onClick={() => updateStatus(selected.id, 'cancelled')}>
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
