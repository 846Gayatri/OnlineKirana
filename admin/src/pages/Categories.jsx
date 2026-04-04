import { useState, useEffect } from 'react';
import API from '../api';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name:'', name_local:'', icon:'📦', sort_order:0 });

  const fetchCategories = () => {
    API.get('/categories?include_inactive=1').then(r => { setCategories(r.data.categories); setLoading(false); });
  };
  useEffect(fetchCategories, []);

  const openAdd = () => { setEditing(null); setForm({ name:'', name_local:'', icon:'📦', sort_order:0 }); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name:c.name, name_local:c.name_local||'', icon:c.icon, sort_order:c.sort_order }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { ...form, sort_order: Number(form.sort_order) };
    if (editing) await API.put(`/categories/${editing.id}`, payload);
    else await API.post('/categories', payload);
    setShowModal(false); fetchCategories();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    await API.delete(`/categories/${id}`); fetchCategories();
  };

  const toggleActive = async (c) => {
    await API.put(`/categories/${c.id}`, { is_active: !c.is_active }); fetchCategories();
  };

  const EMOJIS = ['🌾','🫘','🌶️','🫙','🥜','🌿','🍬','☕','🥛','🍿','🧈','🍯','🥥','🧂','🫒','🍚','🫑','🥬','🍎','🥚'];

  return (
    <>
      <div className="topbar"><h2>Categories</h2>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/>Add Category</button>
        </div>
      </div>
      <div className="page">
        <div className="card">
          {loading ? <div className="loading-center"><div className="spinner"/></div> : (
            <div className="table-wrap"><table><thead><tr>
              <th>Icon</th><th>Name</th><th>Local Name</th><th>Products</th><th>Order</th><th>Status</th><th>Actions</th>
            </tr></thead><tbody>
              {categories.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="icon">📂</div>
                  <p>No categories</p><span>Add your first category</span></div></td></tr>
              ) : categories.map(c => (
                <tr key={c.id}>
                  <td style={{fontSize:24}}>{c.icon}</td>
                  <td style={{fontWeight:600}}>{c.name}</td>
                  <td style={{color:'var(--muted)'}}>{c.name_local || '—'}</td>
                  <td><span className="badge badge-blue">{c.product_count}</span></td>
                  <td>{c.sort_order}</td>
                  <td><button className={`toggle ${c.is_active ? 'on' : ''}`} onClick={() => toggleActive(c)}/></td>
                  <td>
                    <div style={{display:'flex', gap:4}}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(c)}><Edit2 size={14}/></button>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleDelete(c.id)}><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody></table></div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editing ? 'Edit Category' : 'Add Category'}</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowModal(false)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label className="form-label">Icon</label>
                  <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                    {EMOJIS.map(e => (
                      <button key={e} type="button" onClick={() => setForm({...form, icon:e})}
                        style={{width:36, height:36, fontSize:18, border: form.icon===e ? '2px solid var(--accent)' : '1px solid var(--border)',
                          borderRadius:8, background: form.icon===e ? 'rgba(79,138,255,0.1)' : 'var(--surface2)',
                          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category Name *</label>
                    <input className="form-input" required value={form.name}
                      onChange={e => setForm({...form, name:e.target.value})} placeholder="e.g. Grains & Rice"/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Local Name</label>
                    <input className="form-input" value={form.name_local}
                      onChange={e => setForm({...form, name_local:e.target.value})} placeholder="e.g. अनाज"/>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Sort Order</label>
                  <input className="form-input" type="number" value={form.sort_order}
                    onChange={e => setForm({...form, sort_order:e.target.value})}/>
                </div>
                <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginTop:8}}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add Category'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
