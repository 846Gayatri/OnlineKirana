import { useState, useEffect, useCallback } from 'react';
import { Search, Gift, TrendingUp, ShoppingBag, Calendar, ChevronUp, ChevronDown, X, Check, UserX, UserCheck } from 'lucide-react';
import API from '../api';

function PointsModal({ customer, onClose, onSaved }) {
  const [mode, setMode] = useState('add');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const num = parseInt(value);
    if (isNaN(num) || (mode !== 'set' && num === 0)) {
      setError('Enter a valid number'); return;
    }
    setSaving(true); setError('');
    try {
      const payload = { reason };
      if (mode === 'set') payload.set_to = num;
      else payload.delta = mode === 'add' ? Math.abs(num) : -Math.abs(num);
      const { data } = await API.patch(`/customers/${customer.id}/points`, payload);
      onSaved(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update points');
    } finally { setSaving(false); }
  };

  const preview = (() => {
    const num = parseInt(value);
    if (isNaN(num)) return null;
    if (mode === 'set') return { result: Math.max(0, num), change: Math.max(0, num) - customer.rewards_points };
    if (mode === 'add') return { result: customer.rewards_points + Math.abs(num), change: Math.abs(num) };
    return { result: Math.max(0, customer.rewards_points - Math.abs(num)), change: -Math.abs(num) };
  })();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Adjust Reward Points</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          {/* Customer info */}
          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{customer.name || `+91 ${customer.phone}`}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>+91 {customer.phone}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Current Balance</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>{customer.rewards_points} pts</div>
            </div>
          </div>

          {/* Mode selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 16 }}>
            {[
              { id: 'add', label: '+ Add', color: '#16a34a' },
              { id: 'subtract', label: '− Subtract', color: '#dc2626' },
              { id: 'set', label: '= Set to', color: '#2563eb' },
            ].map(m => (
              <button key={m.id} onClick={() => { setMode(m.id); setValue(''); setError(''); }}
                style={{ padding: '8px 4px', borderRadius: 8, border: `2px solid ${mode === m.id ? m.color : 'var(--border)'}`, background: mode === m.id ? `${m.color}15` : 'var(--white)', color: mode === m.id ? m.color : 'var(--muted)', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}>
                {m.label}
              </button>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label">
              {mode === 'add' ? 'Points to Add' : mode === 'subtract' ? 'Points to Subtract' : 'Set Points to'}
            </label>
            <input className="form-input" type="number" min="0" placeholder="e.g. 50"
              value={value} onChange={e => { setValue(e.target.value); setError(''); }}
              style={{ fontSize: 20, fontWeight: 700, textAlign: 'center' }} />
          </div>

          {preview && (
            <div style={{ background: preview.change >= 0 ? '#f0fdf4' : '#fff5f5', border: `1px solid ${preview.change >= 0 ? '#86efac' : '#fca5a5'}`, borderRadius: 8, padding: '10px 14px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>New balance after adjustment</span>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: preview.change >= 0 ? '#16a34a' : '#dc2626' }}>
                  {preview.result} pts
                </span>
                <div style={{ fontSize: 12, color: preview.change >= 0 ? '#16a34a' : '#dc2626' }}>
                  {preview.change >= 0 ? '+' : ''}{preview.change} pts
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Reason (optional)</label>
            <input className="form-input" placeholder="e.g. Goodwill adjustment, compensation..."
              value={reason} onChange={e => setReason(e.target.value)} />
          </div>

          {error && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !value}>
              {saving ? 'Saving...' : 'Update Points'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerDrawer({ customerId, onClose, onPointsUpdated }) {
  const [data, setData] = useState(null);
  const [showPoints, setShowPoints] = useState(false);

  useEffect(() => {
    API.get(`/customers/${customerId}`).then(r => setData(r.data)).catch(() => {});
  }, [customerId]);

  const fmtDate = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  const STATUS_COLOR = { pending: '#f59e0b', confirmed: '#3b82f6', packed: '#8b5cf6', out_for_delivery: '#06b6d4', delivered: '#16a34a', cancelled: '#ef4444' };

  if (!data) return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>
      </div>
    </div>
  );

  const { customer, orders } = data;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" style={{ maxWidth: 520, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Customer Profile</h3>
            <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
          </div>
          <div className="modal-body" style={{ overflowY: 'auto' }}>
            {/* Header card */}
            <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#16a34a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, flexShrink: 0 }}>
                  {(customer.name || customer.phone || 'C')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{customer.name || 'Unnamed'}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>+91 {customer.phone}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    Joined {fmtDate(customer.created_at)}
                  </div>
                </div>
                <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: customer.is_active ? '#dcfce7' : '#fee2e2', color: customer.is_active ? '#16a34a' : '#dc2626' }}>
                  {customer.is_active ? 'Active' : 'Blocked'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 16 }}>
                {[
                  { label: 'Orders', value: customer.order_count, icon: '🛍️' },
                  { label: 'Total Spend', value: `₹${customer.total_spend.toLocaleString('en-IN')}`, icon: '💰' },
                  { label: 'Reward Pts', value: customer.rewards_points, icon: '⭐' },
                ].map((s, i) => (
                  <div key={i} style={{ background: 'white', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18 }}>{s.icon}</div>
                    <div style={{ fontWeight: 800, fontSize: 15, marginTop: 2 }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setShowPoints(true)}>
                <Gift size={15} /> Adjust Points
              </button>
            </div>

            {/* Order history */}
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--text2)' }}>
              RECENT ORDERS ({orders.length})
            </div>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted)', fontSize: 13 }}>No orders yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {orders.map(o => (
                  <div key={o.id} style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 13 }}>{o.order_number}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{fmtDate(o.created_at)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>₹{o.total}</div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLOR[o.status] || '#6b7280', textTransform: 'capitalize' }}>
                        {o.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {showPoints && (
        <PointsModal
          customer={customer}
          onClose={() => setShowPoints(false)}
          onSaved={(result) => {
            setData(prev => ({ ...prev, customer: { ...prev.customer, rewards_points: result.new_points } }));
            onPointsUpdated(customer.id, result.new_points);
          }}
        />
      )}
    </>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [pointsModal, setPointsModal] = useState(null);
  const [sortKey, setSortKey] = useState('last_order_at');
  const [sortDir, setSortDir] = useState('desc');

  const fetchCustomers = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    API.get('/customers', { params }).then(r => {
      setCustomers(r.data.customers);
      setTotal(r.data.total);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = [...customers].sort((a, b) => {
    let aVal = a[sortKey]; let bVal = b[sortKey];
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const SortIcon = ({ col }) => sortKey !== col ? null : sortDir === 'asc'
    ? <ChevronUp size={13} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 2 }} />
    : <ChevronDown size={13} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 2 }} />;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const handlePointsUpdated = (customerId, newPoints) => {
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, rewards_points: newPoints } : c));
  };

  // Summary stats
  const totalCustomers = total;
  const totalRevenue = customers.reduce((s, c) => s + c.total_spend, 0);
  const totalPoints = customers.reduce((s, c) => s + c.rewards_points, 0);
  const activeCount = customers.filter(c => c.is_active).length;

  return (
    <>
      <div className="topbar">
        <h2>Customers</h2>
        <div className="topbar-actions">
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{total} registered customers</span>
        </div>
      </div>
      <div className="page">

        {/* Summary cards */}
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card blue">
            <div className="stat-label">Total Customers</div>
            <div className="stat-value blue">{totalCustomers}</div>
            <div className="stat-sub">{activeCount} active</div>
          </div>
          <div className="stat-card green">
            <div className="stat-label">Customer Revenue</div>
            <div className="stat-value green">₹{totalRevenue.toLocaleString('en-IN')}</div>
            <div className="stat-sub">all time</div>
          </div>
          <div className="stat-card orange">
            <div className="stat-label">Rewards Outstanding</div>
            <div className="stat-value orange">{totalPoints}</div>
            <div className="stat-sub">points across all customers</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg. Spend / Customer</div>
            <div className="stat-value" style={{ color: 'var(--text)' }}>
              ₹{totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers).toLocaleString('en-IN') : 0}
            </div>
            <div className="stat-sub">per customer</div>
          </div>
        </div>

        {/* Search */}
        <div className="filters-bar" style={{ marginBottom: 16 }}>
          <div className="search-wrap" style={{ flex: 1, maxWidth: 360 }}>
            <Search size={16} className="search-icon" />
            <input className="form-input" placeholder="Search by name or phone..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Table */}
        <div className="card">
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th onClick={() => handleSort('order_count')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Orders <SortIcon col="order_count" />
                    </th>
                    <th onClick={() => handleSort('total_spend')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Total Spend <SortIcon col="total_spend" />
                    </th>
                    <th onClick={() => handleSort('rewards_points')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Reward Pts <SortIcon col="rewards_points" />
                    </th>
                    <th onClick={() => handleSort('last_order_at')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Last Order <SortIcon col="last_order_at" />
                    </th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 ? (
                    <tr><td colSpan={7}>
                      <div className="empty-state">
                        <div className="icon">👥</div>
                        <p>No customers found</p>
                        <span>{search ? 'Try a different search' : 'Customers will appear once they sign up'}</span>
                      </div>
                    </td></tr>
                  ) : sorted.map(c => (
                    <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedId(c.id)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                            {(c.name || c.phone || 'C')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name || <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>No name</span>}</div>
                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>+91 {c.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <ShoppingBag size={14} color="var(--muted)" />
                          <span style={{ fontWeight: 700 }}>{c.order_count}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: '#16a34a' }}>
                        ₹{Number(c.total_spend).toLocaleString('en-IN')}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: c.rewards_points > 0 ? '#f59e0b' : 'var(--muted)' }}>
                            {c.rewards_points > 0 ? '⭐ ' : ''}{c.rewards_points}
                          </span>
                          <button
                            onClick={e => { e.stopPropagation(); setPointsModal(c); }}
                            title="Adjust points"
                            style={{ background: 'var(--surface2)', border: 'none', borderRadius: 6, padding: '3px 7px', cursor: 'pointer', fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
                            Edit
                          </button>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--muted)' }}>
                          <Calendar size={13} />
                          {fmtDate(c.last_order_at)}
                        </div>
                      </td>
                      <td>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.is_active ? '#dcfce7' : '#fee2e2', color: c.is_active ? '#16a34a' : '#dc2626' }}>
                          {c.is_active ? 'Active' : 'Blocked'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setPointsModal(c); }}
                            title="Adjust points" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Gift size={14} /> Points
                          </button>
                          <button className="btn btn-ghost btn-sm btn-icon"
                            onClick={async e => {
                              e.stopPropagation();
                              await API.patch(`/customers/${c.id}/status`, { is_active: !c.is_active });
                              fetchCustomers();
                            }}
                            title={c.is_active ? 'Block customer' : 'Unblock customer'}
                            style={{ color: c.is_active ? '#dc2626' : '#16a34a' }}>
                            {c.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {pointsModal && (
        <PointsModal
          customer={pointsModal}
          onClose={() => setPointsModal(null)}
          onSaved={(result) => {
            handlePointsUpdated(pointsModal.id, result.new_points);
            setPointsModal(null);
          }}
        />
      )}

      {selectedId && (
        <CustomerDrawer
          customerId={selectedId}
          onClose={() => setSelectedId(null)}
          onPointsUpdated={handlePointsUpdated}
        />
      )}
    </>
  );
}
