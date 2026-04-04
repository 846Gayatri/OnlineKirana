import { useState, useEffect } from 'react';
import API from '../api';
import { IndianRupee, ShoppingCart, Package, AlertTriangle } from 'lucide-react';

const STATUS_BADGES = {
  pending: 'badge-orange', confirmed: 'badge-blue', packed: 'badge-purple',
  out_for_delivery: 'badge-blue', delivered: 'badge-green', cancelled: 'badge-red',
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/orders/stats/dashboard').then(r => { setStats(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <><div className="topbar"><h2>Dashboard</h2></div>
    <div className="page"><div className="loading-center"><div className="spinner"></div>Loading...</div></div></>;

  if (!stats) return <><div className="topbar"><h2>Dashboard</h2></div>
    <div className="page"><div className="empty-state"><p>Could not load dashboard data</p></div></div></>;

  return (
    <>
      <div className="topbar"><h2>Dashboard</h2>
        <div className="topbar-actions">
          <span style={{fontSize:12, color:'var(--muted)'}}>
            {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </span>
        </div>
      </div>
      <div className="page">
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-label">Today's Revenue</div>
            <div className="stat-value blue">₹{stats.today.revenue.toLocaleString('en-IN')}</div>
            <div className="stat-sub">{stats.today.orders} order{stats.today.orders !== 1 ? 's' : ''} today</div>
          </div>
          <div className="stat-card green">
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value green">₹{stats.total.revenue.toLocaleString('en-IN')}</div>
            <div className="stat-sub">{stats.total.orders} total orders</div>
          </div>
          <div className="stat-card orange">
            <div className="stat-label">Pending Orders</div>
            <div className="stat-value orange">{stats.pending_orders}</div>
            <div className="stat-sub">Needs attention</div>
          </div>
          <div className="stat-card red">
            <div className="stat-label">Active Products</div>
            <div className="stat-value" style={{color:'var(--text)'}}>{stats.active_products}</div>
            <div className="stat-sub">{stats.out_of_stock} out of stock</div>
          </div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
          <div className="card">
            <div className="card-header"><span className="card-title">Recent Orders</span></div>
            {stats.recent_orders.length === 0 ? (
              <div className="empty-state"><div className="icon">📭</div><p>No orders yet</p>
                <span>Orders will appear here</span></div>
            ) : (
              <div className="table-wrap"><table><thead><tr>
                <th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Actions</th>
              </tr></thead><tbody>
                {stats.recent_orders.map(o => (
                  <tr key={o.id}>
                    <td style={{fontWeight:600, fontFamily:'monospace'}}>{o.order_number}</td>
                    <td>{o.customer_name || o.customer_phone}</td>
                    <td style={{fontWeight:600}}>₹{o.total}</td>
                    <td><span className={`badge ${STATUS_BADGES[o.status] || 'badge-gray'}`}>
                      {o.status.replace(/_/g,' ')}
                    </span></td>
                    <td>
                      <a href="/orders" className="btn btn-ghost btn-sm" style={{textDecoration:'none', color:'var(--accent)'}}>
                        Process →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody></table></div>
            )}
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Order Status Breakdown</span></div>
            {stats.status_breakdown.length === 0 ? (
              <div className="empty-state"><div className="icon">📊</div><p>No data yet</p></div>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:10, marginTop:8}}>
                {stats.status_breakdown.map(s => {
                  const maxCount = Math.max(...stats.status_breakdown.map(x => x.count));
                  return (
                    <div key={s.status}>
                      <div style={{display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4}}>
                        <span style={{textTransform:'capitalize'}}>{s.status.replace(/_/g,' ')}</span>
                        <span style={{fontWeight:700}}>{s.count}</span>
                      </div>
                      <div style={{height:6, borderRadius:3, background:'var(--surface3)', overflow:'hidden'}}>
                        <div style={{height:'100%', borderRadius:3, width:`${(s.count/maxCount)*100}%`,
                          background: s.status === 'delivered' ? 'var(--green)' : s.status === 'cancelled' ? 'var(--red)' : 'var(--accent)',
                          transition:'width 0.5s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
