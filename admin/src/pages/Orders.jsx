import { useState, useEffect } from 'react';
import { Search, CheckCircle, Package, ChefHat, Bike, XCircle, Clock, RefreshCw } from 'lucide-react';
import API from '../api';

const STATUSES = ['pending','confirmed','packed','out_for_delivery','delivered','cancelled'];

const STATUS_META = {
  pending:          { label:'Pending',          badge:'badge-orange', icon:'⏳', next:'confirmed',       nextLabel:'Confirm Order',   nextClass:'btn-success' },
  confirmed:        { label:'Confirmed',         badge:'badge-blue',   icon:'✅', next:'packed',          nextLabel:'Mark as Packed',  nextClass:'btn-primary' },
  packed:           { label:'Packed',            badge:'badge-purple', icon:'📦', next:'out_for_delivery',nextLabel:'Send Out',         nextClass:'btn-primary' },
  out_for_delivery: { label:'Out for Delivery',  badge:'badge-blue',   icon:'🛵', next:'delivered',       nextLabel:'Mark Delivered',   nextClass:'btn-success' },
  delivered:        { label:'Delivered',         badge:'badge-green',  icon:'🎉', next:null,              nextLabel:null,              nextClass:'' },
  cancelled:        { label:'Cancelled',         badge:'badge-red',    icon:'❌', next:null,              nextLabel:null,              nextClass:'' },
};

const fmtDate = (d) => new Date(d).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
const fmtQty  = (q, u) => u === 'pieces' ? `${q}pcs` : u === 'liters' ? q >= 1000 ? `${(q/1000).toFixed(1)}L` : `${q}ml` : q >= 1000 ? `${(q/1000).toFixed(1)}kg` : `${q}g`;

export default function Orders() {
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch]           = useState('');
  const [selected, setSelected]       = useState(null);
  const [updating, setUpdating]       = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await API.get('/orders', { params });
      setOrders(data.orders);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await API.patch(`/orders/${id}/status`, { status });
      await fetchOrders();
      if (selected?.id === id) setSelected(prev => ({ ...prev, status }));
    } finally { setUpdating(null); }
  };

  const filtered = orders.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return o.order_number?.toLowerCase().includes(q) ||
           o.customer_name?.toLowerCase().includes(q) ||
           o.customer_phone?.includes(q);
  });

  const pending  = orders.filter(o => o.status === 'pending');
  const active   = orders.filter(o => ['confirmed','packed','out_for_delivery'].includes(o.status));

  return (
    <>
      <div className="topbar">
        <h2>Orders</h2>
        <button onClick={fetchOrders}
          style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--muted)', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 12px', cursor:'pointer' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="page">

        {/* ── Pending orders banner ── */}
        {pending.length > 0 && !statusFilter && (
          <div style={{ background:'linear-gradient(135deg,#fef3c7,#fde68a)', border:'1px solid #f59e0b44', borderRadius:14, padding:'16px 20px', marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'#f59e0b', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Clock size={18} color="white" />
              </div>
              <div>
                <div style={{ fontWeight:800, fontSize:15, color:'#92400e' }}>
                  {pending.length} Order{pending.length > 1 ? 's' : ''} Waiting for Confirmation
                </div>
                <div style={{ fontSize:12, color:'#78350f', marginTop:1 }}>Tap "Confirm Order" to accept each one</div>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {pending.map(o => (
                <div key={o.id} style={{ background:'white', borderRadius:10, padding:'12px 14px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', cursor:'pointer' }}
                  onClick={() => setSelected(o)}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:13, fontFamily:'monospace' }}>{o.order_number}</div>
                    <div style={{ fontSize:12, color:'var(--muted)', marginTop:1 }}>
                      {o.customer_name || o.customer_phone} · {o.items?.length || 0} item{(o.items?.length || 0) !== 1 ? 's' : ''} · ₹{o.total}
                    </div>
                  </div>
                  <div style={{ fontSize:11, color:'var(--muted)', flexShrink:0 }}>{fmtDate(o.created_at)}</div>
                  <button
                    className="btn btn-success btn-sm"
                    disabled={updating === o.id}
                    onClick={e => { e.stopPropagation(); updateStatus(o.id, 'confirmed'); }}
                    style={{ flexShrink:0, display:'flex', alignItems:'center', gap:5 }}>
                    <CheckCircle size={13} />
                    {updating === o.id ? 'Confirming…' : 'Confirm Order'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Active orders summary ── */}
        {active.length > 0 && !statusFilter && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
            {[
              { status:'confirmed',        icon:<CheckCircle size={18} color="#0ea5e9"/>, label:'Confirmed',       color:'#e0f2fe' },
              { status:'packed',           icon:<Package size={18} color="#8b5cf6"/>,     label:'Packed',          color:'#ede9fe' },
              { status:'out_for_delivery', icon:<Bike size={18} color="#10b981"/>,        label:'Out for Delivery',color:'#d1fae5' },
            ].map(({ status, icon, label, color }) => {
              const cnt = orders.filter(o => o.status === status).length;
              return (
                <div key={status} onClick={() => setStatusFilter(status)}
                  style={{ background:color, borderRadius:12, padding:'14px', cursor:'pointer', display:'flex', flexDirection:'column', gap:6 }}>
                  {icon}
                  <div style={{ fontSize:22, fontWeight:900 }}>{cnt}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--text2)' }}>{label}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Filters & search ── */}
        <div className="card" style={{ marginBottom:16 }}>
          <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ position:'relative', flex:1, minWidth:200 }}>
              <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--muted)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search order # or customer…"
                style={{ width:'100%', padding:'8px 8px 8px 32px', borderRadius:8, border:'1px solid var(--border)', fontSize:13, boxSizing:'border-box' }} />
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <button className={`btn btn-sm ${!statusFilter ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setStatusFilter('')}>All</button>
              {STATUSES.map(s => (
                <button key={s}
                  className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
                  style={{ display:'flex', alignItems:'center', gap:4 }}>
                  {STATUS_META[s].icon} {STATUS_META[s].label}
                  {!statusFilter && orders.filter(o => o.status === s).length > 0 && (
                    <span style={{ background:'var(--primary)', color:'white', borderRadius:'50%', width:16, height:16, fontSize:10, fontWeight:800, display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
                      {orders.filter(o => o.status === s).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Table + detail panel ── */}
        <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap:16, alignItems:'start' }}>
          <div className="card" style={{ overflow:'hidden' }}>
            {loading ? (
              <div className="loading-center"><div className="spinner" /></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr></thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={8}><div className="empty-state"><div className="icon">📭</div><p>No orders found</p></div></td></tr>
                    ) : filtered.map(o => {
                      const meta = STATUS_META[o.status];
                      return (
                        <tr key={o.id}
                          style={{ cursor:'pointer', background: selected?.id === o.id ? 'var(--surface2)' : undefined, transition:'background 0.15s' }}
                          onClick={() => setSelected(selected?.id === o.id ? null : o)}>
                          <td style={{ fontWeight:800, fontFamily:'monospace', fontSize:12, color:'var(--primary)' }}>{o.order_number}</td>
                          <td>
                            <div style={{ fontWeight:600, fontSize:13 }}>{o.customer_name || '—'}</div>
                            <div style={{ fontSize:11, color:'var(--muted)' }}>{o.customer_phone}</div>
                          </td>
                          <td style={{ color:'var(--muted)', fontSize:13 }}>{o.items?.length || 0} items</td>
                          <td style={{ fontWeight:800, fontSize:14 }}>₹{o.total}</td>
                          <td style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase' }}>{o.payment_method}</td>
                          <td><span className={`badge ${meta.badge}`} style={{ display:'inline-flex', alignItems:'center', gap:4 }}>{meta.icon} {meta.label}</span></td>
                          <td style={{ fontSize:11, color:'var(--muted)' }}>{fmtDate(o.created_at)}</td>
                          <td onClick={e => e.stopPropagation()}>
                            {meta.next && (
                              <button className={`btn ${meta.nextClass} btn-sm`}
                                disabled={updating === o.id}
                                onClick={() => updateStatus(o.id, meta.next)}
                                style={{ display:'flex', alignItems:'center', gap:4, whiteSpace:'nowrap' }}>
                                {updating === o.id ? '…' : meta.nextLabel}
                              </button>
                            )}
                            {!['delivered','cancelled'].includes(o.status) && meta.next && (
                              <button className="btn btn-ghost btn-sm"
                                style={{ color:'var(--red)', fontSize:11, marginTop:4, display:'flex', alignItems:'center', gap:3 }}
                                onClick={() => updateStatus(o.id, 'cancelled')}>
                                <XCircle size={12} /> Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Order detail panel ── */}
          {selected && (
            <div className="card" style={{ position:'sticky', top:84 }}>
              <div className="card-header">
                <span className="card-title">Order Detail</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
              </div>

              {/* Status flow */}
              <div style={{ display:'flex', gap:4, marginBottom:16, overflowX:'auto', paddingBottom:4 }}>
                {STATUSES.filter(s => s !== 'cancelled').map((s, i, arr) => {
                  const meta = STATUS_META[s];
                  const idx = STATUSES.indexOf(selected.status);
                  const sIdx = STATUSES.indexOf(s);
                  const done = idx >= sIdx && selected.status !== 'cancelled';
                  const current = selected.status === s;
                  return (
                    <div key={s} style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                      <div style={{ textAlign:'center' }}>
                        <div style={{ width:28, height:28, borderRadius:'50%', background: done ? 'var(--green)' : 'var(--surface2)', display:'flex', alignItems:'center', justifyContent:'center', border: current ? '2px solid var(--green)' : 'none', fontSize:12 }}>
                          {done ? '✓' : meta.icon}
                        </div>
                        <div style={{ fontSize:9, color: done ? 'var(--green)' : 'var(--muted)', fontWeight:700, marginTop:2, maxWidth:40, lineHeight:1.2 }}>{meta.label}</div>
                      </div>
                      {i < arr.length - 1 && <div style={{ width:12, height:2, background: done && sIdx < idx ? 'var(--green)' : 'var(--border)', flexShrink:0, marginBottom:14 }} />}
                    </div>
                  );
                })}
              </div>

              <div style={{ fontSize:13 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <span style={{ fontFamily:'monospace', fontWeight:800, fontSize:14, color:'var(--primary)' }}>{selected.order_number}</span>
                  <span className={`badge ${STATUS_META[selected.status].badge}`}>{STATUS_META[selected.status].icon} {STATUS_META[selected.status].label}</span>
                </div>

                <div style={{ background:'var(--surface2)', borderRadius:10, padding:'10px 12px', marginBottom:12, display:'flex', flexDirection:'column', gap:5 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ fontSize:16 }}>👤</span>
                    <div>
                      <div style={{ fontWeight:700, fontSize:13 }}>{selected.customer_name || 'Customer'}</div>
                      <div style={{ fontSize:11, color:'var(--muted)' }}>{selected.customer_phone}</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center', fontSize:12, color:'var(--muted)' }}>
                    <span>📅</span> {fmtDate(selected.created_at)}
                  </div>
                  {selected.payment_method && (
                    <div style={{ display:'flex', gap:8, alignItems:'center', fontSize:12, color:'var(--muted)' }}>
                      <span>💳</span> {selected.payment_method.toUpperCase()}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom:12 }}>
                  <div className="form-label" style={{ marginBottom:8 }}>ITEMS</div>
                  {selected.items?.map((item, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom: i < selected.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div>
                        <div style={{ fontWeight:600, fontSize:13 }}>{item.product_name}</div>
                        <div style={{ fontSize:11, color:'var(--muted)' }}>{fmtQty(item.quantity_grams, item.unit_type)}</div>
                      </div>
                      <div style={{ fontWeight:700 }}>₹{item.item_total}</div>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop:'1px solid var(--border)', paddingTop:10, display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--muted)' }}>
                    <span>Subtotal</span><span>₹{selected.subtotal}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--muted)' }}>
                    <span>Delivery</span><span>{selected.delivery_fee > 0 ? `₹${selected.delivery_fee}` : 'Free'}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:16 }}>
                    <span>Total</span><span style={{ color:'var(--green)' }}>₹{selected.total}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:8 }}>
                  {STATUS_META[selected.status].next && (
                    <button className={`btn ${STATUS_META[selected.status].nextClass}`}
                      style={{ width:'100%', padding:'12px', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
                      disabled={updating === selected.id}
                      onClick={() => updateStatus(selected.id, STATUS_META[selected.status].next)}>
                      {updating === selected.id ? 'Updating…' : (
                        <>
                          <CheckCircle size={16} />
                          {STATUS_META[selected.status].nextLabel}
                        </>
                      )}
                    </button>
                  )}
                  {!['cancelled','delivered'].includes(selected.status) && (
                    <button className="btn btn-ghost"
                      style={{ width:'100%', padding:'10px', border:'1px solid rgba(239,68,68,0.3)', color:'var(--red)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
                      onClick={() => updateStatus(selected.id, 'cancelled')}>
                      <XCircle size={15} /> Cancel Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
