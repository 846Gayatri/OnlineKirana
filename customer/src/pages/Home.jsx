import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, ChevronDown, X } from 'lucide-react';
import API from '../api';
import { useAuth, useCart, useAddress } from '../App';
import ProductDetail from '../components/ProductDetail';
import AddressSheet from '../components/AddressSheet';

export const getImg = (p) => {
  if (p?.image_url) return p.image_url;

  const c = (p?.category_name || '').toLowerCase();
  const n = (p?.name || '').toLowerCase();
  
  if (n.includes('sugar') || n.includes('chakkera')) return 'https://www.themealdb.com/images/ingredients/Sugar.png';
  if (n.includes('jaggery') || n.includes('bellam')) return 'https://www.themealdb.com/images/ingredients/Brown%20Sugar.png';
  if (c.includes('tea') || c.includes('coffee')) return 'https://www.themealdb.com/images/ingredients/Tea.png';
  if (c.includes('flour') || c.includes('pindi') || c.includes('ravva')) return 'https://www.themealdb.com/images/ingredients/Flour.png';
  
  if (n.includes('shampoo')) return 'https://placehold.co/400x400/775ade/ffffff/png?text=Shampoo+Sachet';
  if (n.includes('surf') || n.includes('detergent')) return 'https://placehold.co/400x400/ff6b2b/ffffff/png?text=Surf+Sachet';
  if (n.includes('maggi') || n.includes('noodles')) return 'https://placehold.co/400x400/ffd800/000000/png?text=Maggi';
  if (n.includes('bru') || n.includes('coffee sachet')) return 'https://placehold.co/400x400/773300/ffffff/png?text=Bru+Sachet';
  if (c.includes('sachet')) return 'https://placehold.co/400x400/10b981/ffffff/png?text=Mini+Pack';
  
  if (n.includes('rice') || n.includes('biyyam')) return 'https://www.themealdb.com/images/ingredients/Rice.png';
  if (n.includes('dal') || n.includes('pappu') || c.includes('pulse')) return 'https://www.themealdb.com/images/ingredients/Lentils.png';
  if (c.includes('spice') || c.includes('masala')) return 'https://www.themealdb.com/images/ingredients/Chili%20Powder.png';
  if (n.includes('ghee') || n.includes('neyyi')) return 'https://www.themealdb.com/images/ingredients/Butter.png';
  if (c.includes('oil') || n.includes('nune')) return 'https://www.themealdb.com/images/ingredients/Olive%20Oil.png';
  if (n.includes('almond') || c.includes('dry') || c.includes('phala')) return 'https://www.themealdb.com/images/ingredients/Almonds.png';
  if (c.includes('dairy') || c.includes('egg')) return 'https://www.themealdb.com/images/ingredients/Milk.png';
  if (c.includes('snack')) return 'https://www.themealdb.com/images/ingredients/Biscuits.png';
  
  return 'https://www.themealdb.com/images/ingredients/Salt.png';
};

export default function HomePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const { isLoggedIn } = useAuth();
  const { selectedAddress, addresses, setSelectedAddress } = useAddress();

  useEffect(() => {
    API.get('/categories').then(r => setCategories(r.data.categories));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (activeCat) params.category_id = activeCat;
    if (search) params.search = search;
    params.in_stock = 'true';
    API.get('/products', { params }).then(r => { setProducts(r.data.products); setLoading(false); });
  }, [activeCat, search]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000); };

  return (
    <>
      <div className="app-header">
        <div className="header-top">
          <div>
            <div className="header-logo">🌿 Gram<span>Fresh</span></div>
            <button className="header-location" onClick={() => setShowAddressModal(true)} style={{ textAlign: 'left' }}>
              <MapPin size={12} /> <span style={{ fontWeight: 600 }}>{selectedAddress.label}</span>
              <span style={{ margin: '0 4px', opacity: 0.5 }}>•</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                {selectedAddress.full.split(',')[0]}
              </span>
              <ChevronDown size={12} style={{ marginLeft: 2 }} />
            </button>
          </div>
        </div>
      </div>

      <div className="search-bar" onClick={() => navigate('/search')} style={{ cursor: 'pointer' }}>
        <Search size={18} color="var(--muted)" />
        <input placeholder="Search groceries..." readOnly
          style={{ cursor: 'pointer', pointerEvents: 'none' }} />
      </div>

      <div className="page-content">
        {/* Categories */}
        <div style={{ padding: '4px 0 12px' }}>
          <div className="cat-scroll">
            <div className={`cat-chip ${!activeCat ? 'active' : ''}`} onClick={() => setActiveCat(null)}>
              <div className="icon-wrap">🛒</div>
              <div className="label">All</div>
            </div>
            {categories.map(c => (
              <div key={c.id} className={`cat-chip ${activeCat === c.id ? 'active' : ''}`}
                onClick={() => setActiveCat(activeCat === c.id ? null : c.id)}>
                <div className="icon-wrap">{c.icon}</div>
                <div className="label">{c.name.split(' ')[0]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Products */}
        <div className="section">
          <div className="section-header">
            <div className="section-title">
              {activeCat ? categories.find(c => c.id === activeCat)?.name || 'Products' : 'All Products'}
            </div>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{products.length} items</span>
          </div>

          {loading ? (
            <div className="loader"><div className="spin" /></div>
          ) : products.length === 0 ? (
            <div className="empty">
              <div className="icon">🔍</div>
              <div className="title">No products found</div>
              <div className="sub">Try a different search or category</div>
            </div>
          ) : (
            <div className="product-grid">
              {products.map(p => (
                <div key={p.id} className="product-card" onClick={() => setSelectedProduct(p)}>
                  <div className="product-img-wrap">
                    <img src={getImg(p)} alt={p.name} loading="lazy" />
                    {!p.in_stock && <span className="out-tag">Out of Stock</span>}
                  </div>
                  <div className="product-info">
                    <div className="name">{p.name}</div>
                    {p.name_local && <div className="local">{p.name_local}</div>}
                    <div className="price-row">
                      <div>
                        <div className="price">₹{p.default_price}</div>
                        <div className="unit">{p.default_qty_label}</div>
                      </div>
                      <button className="add-btn" onClick={e => { e.stopPropagation(); setSelectedProduct(p); }}>Add</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedProduct && (
        <ProductDetail product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdded={(msg) => { setSelectedProduct(null); showToast(msg); }} />
      )}

      {showAddressModal && (
        <AddressSheet onClose={() => setShowAddressModal(false)} />
      )}

      {toast && <div className="toast">✓ {toast}</div>}
    </>
  );
}
