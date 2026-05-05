import { useState, useEffect } from 'react';
import API from '../api';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm());

  function defaultForm() {
    return { name:'', name_local:'', description:'', category_id:'', price_per_kg:'',
      min_qty_grams:100, max_qty_grams:10000, qty_step_grams:50, unit_type:'grams', image_url:'' };
  }

  const fetchProducts = () => {
    const params = {};
    if (search) params.search = search;
    if (catFilter) params.category_id = catFilter;
    API.get('/products', { params }).then(r => { setProducts(r.data.products); setLoading(false); });
  };

  useEffect(() => { fetchProducts(); }, [search, catFilter]);
  useEffect(() => { API.get('/categories').then(r => setCategories(r.data.categories)); }, []);

  const openAdd = () => { setEditing(null); setForm(defaultForm()); setShowModal(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ name:p.name, name_local:p.name_local||'', description:p.description||'',
      category_id: p.category_id||'', price_per_kg:p.price_per_kg, min_qty_grams:p.min_qty_grams,
      max_qty_grams:p.max_qty_grams, qty_step_grams:p.qty_step_grams, unit_type:p.unit_type,
      image_url: p.image_url||'' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { ...form, price_per_kg: Number(form.price_per_kg),
      min_qty_grams: Number(form.min_qty_grams), max_qty_grams: Number(form.max_qty_grams),
      qty_step_grams: Number(form.qty_step_grams),
      category_id: form.category_id ? Number(form.category_id) : null };
    if (editing) { await API.put(`/products/${editing.id}`, payload); }
    else { await API.post('/products', payload); }
    setShowModal(false); fetchProducts();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    await API.delete(`/products/${id}`); fetchProducts();
  };

  const toggleStock = async (p) => {
    await API.put(`/products/${p.id}`, { in_stock: !p.in_stock }); fetchProducts();
  };

  const calcPrice = (qty) => {
    if (!form.price_per_kg) return 0;
    if (form.unit_type === 'pieces') return Math.round(qty * form.price_per_kg);
    return Math.round((qty / 1000) * form.price_per_kg);
  };

  const unitLabel = form.unit_type === 'pieces' ? 'pcs' : form.unit_type === 'liters' ? 'ml' : 'g';

  return (
    <>
      <div className="topbar">
        <h2>Products</h2>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/>Add Product</button>
        </div>
      </div>
      <div className="page">
        <div className="filters-bar">
          <div className="search-wrap">
            <Search size={16} className="search-icon"/>
            <input className="form-input" placeholder="Search products..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-select" style={{width:180}} value={catFilter}
            onChange={e => setCatFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>

        <div className="card">
          {loading ? <div className="loading-center"><div className="spinner"/></div> : (
            <div className="table-wrap"><table><thead><tr>
              <th>Product</th><th>Category</th><th>Price/kg</th><th>Min Qty</th><th>Step</th><th>Stock</th><th>Actions</th>
            </tr></thead><tbody>
              {products.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="icon">📦</div>
                  <p>No products</p><span>Add your first product</span></div></td></tr>
              ) : products.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="product-cell">
                      <div className="product-img">{p.category_icon || '📦'}</div>
                      <div className="info"><p>{p.name}</p><p>{p.name_local||''}</p></div>
                    </div>
                  </td>
                  <td>{p.category_name || '—'}</td>
                  <td style={{fontWeight:700}}>₹{p.price_per_kg}/{p.unit_type === 'pieces' ? 'pc' : p.unit_type === 'liters' ? 'L' : 'kg'}</td>
                  <td>{p.min_qty_grams}{p.unit_type === 'pieces' ? 'pcs' : p.unit_type === 'liters' ? 'ml' : 'g'}</td>
                  <td>{p.qty_step_grams}{p.unit_type === 'pieces' ? 'pcs' : p.unit_type === 'liters' ? 'ml' : 'g'}</td>
                  <td><button className={`toggle ${p.in_stock ? 'on' : ''}`} onClick={() => toggleStock(p)}/></td>
                  <td>
                    <div style={{display:'flex', gap:4}}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(p)}><Edit2 size={14}/></button>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleDelete(p.id)}><Trash2 size={14}/></button>
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
              <h3 className="modal-title">{editing ? 'Edit Product' : 'Add Product'}</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowModal(false)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Product Name *</label>
                    <input className="form-input" required value={form.name}
                      onChange={e => setForm({...form, name:e.target.value})} placeholder="e.g. Basmati Rice"/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Local Name</label>
                    <input className="form-input" value={form.name_local}
                      onChange={e => setForm({...form, name_local:e.target.value})} placeholder="e.g. बासमती चावल"/>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={form.description}
                    onChange={e => setForm({...form, description:e.target.value})} placeholder="Optional description"/>
                </div>
                <div className="form-group">
                  <label className="form-label">Product Image URL</label>
                  <input className="form-input" value={form.image_url}
                    onChange={e => setForm({...form, image_url:e.target.value})}
                    placeholder="https://example.com/image.jpg"/>
                  {form.image_url && (
                    <div style={{marginTop:8, display:'flex', alignItems:'center', gap:10}}>
                      <img src={form.image_url} alt="preview"
                        onError={e => { e.target.style.display='none'; }}
                        style={{width:56, height:56, objectFit:'contain', borderRadius:8, border:'1px solid var(--border)', background:'#f8fafc'}}/>
                      <span style={{fontSize:12, color:'var(--muted)'}}>Image preview</span>
                    </div>
                  )}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={form.category_id}
                      onChange={e => setForm({...form, category_id:e.target.value})}>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit Type</label>
                    <select className="form-select" value={form.unit_type}
                      onChange={e => setForm({...form, unit_type:e.target.value})}>
                      <option value="grams">Grams (weight)</option>
                      <option value="pieces">Pieces (count)</option>
                      <option value="liters">Liters (volume)</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Price per {form.unit_type === 'pieces' ? 'piece' : form.unit_type === 'liters' ? 'liter' : 'kg'} (₹) *
                  </label>
                  <input className="form-input" type="number" step="0.01" required value={form.price_per_kg}
                    onChange={e => setForm({...form, price_per_kg:e.target.value})} placeholder="e.g. 160"/>
                </div>
                <div className="form-row-3">
                  <div className="form-group">
                    <label className="form-label">Min Qty ({unitLabel})</label>
                    <input className="form-input" type="number" value={form.min_qty_grams}
                      onChange={e => setForm({...form, min_qty_grams:e.target.value})}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Qty ({unitLabel})</label>
                    <input className="form-input" type="number" value={form.max_qty_grams}
                      onChange={e => setForm({...form, max_qty_grams:e.target.value})}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Step ({unitLabel})</label>
                    <input className="form-input" type="number" value={form.qty_step_grams}
                      onChange={e => setForm({...form, qty_step_grams:e.target.value})}/>
                  </div>
                </div>
                {form.price_per_kg && (
                  <div className="price-preview" style={{marginBottom:20}}>
                    💡 Price preview:&nbsp;
                    <strong>₹{calcPrice(Number(form.min_qty_grams))}</strong> for {form.min_qty_grams}{unitLabel}
                    &nbsp;•&nbsp;
                    <strong>₹{calcPrice(500)}</strong> for 500{unitLabel}
                    &nbsp;•&nbsp;
                    <strong>₹{calcPrice(1000)}</strong> for 1000{unitLabel}
                  </div>
                )}
                <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add Product'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
