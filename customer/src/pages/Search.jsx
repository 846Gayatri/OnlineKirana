import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, SlidersHorizontal, ChevronDown, Check } from 'lucide-react';
import API from '../api';
import { useCart } from '../App';
import { getImg } from './Home';
import ProductDetail from '../components/ProductDetail';

const RECENT_KEY = 'gf_recent_searches';
const MAX_RECENT = 8;

function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function saveRecent(list) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
}
function addRecent(term) {
  if (!term?.trim()) return;
  const prev = loadRecent().filter(r => r !== term.trim());
  saveRecent([term.trim(), ...prev]);
}

const SORT_OPTIONS = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
  { id: 'name_asc', label: 'Name: A–Z' },
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inputRef = useRef(null);

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [selectedCats, setSelectedCats] = useState([]);
  const [inStockOnly, setInStockOnly] = useState(true);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const [recent, setRecent] = useState(loadRecent);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toast, setToast] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    API.get('/categories').then(r => setCategories(r.data.categories || []));
    if (searchParams.get('q')) doSearch(searchParams.get('q'));
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const doSearch = useCallback(async (term) => {
    setLoading(true);
    setSearched(true);
    try {
      const params = {};
      if (term?.trim()) params.search = term.trim();
      const { data } = await API.get('/products', { params });
      setAllProducts(data.products || []);
    } catch { setAllProducts([]); }
    finally { setLoading(false); }
  }, []);

  const handleSearch = (term = query) => {
    if (!term.trim()) return;
    addRecent(term);
    setRecent(loadRecent());
    doSearch(term);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const clearQuery = () => {
    setQuery('');
    setAllProducts([]);
    setSearched(false);
    inputRef.current?.focus();
  };

  const removeRecent = (term) => {
    const updated = loadRecent().filter(r => r !== term);
    saveRecent(updated);
    setRecent(updated);
  };

  const clearAllRecent = () => { saveRecent([]); setRecent([]); };

  // Client-side filtering & sorting
  const filtered = allProducts.filter(p => {
    if (inStockOnly && !p.in_stock) return false;
    if (selectedCats.length > 0 && !selectedCats.includes(p.category_id)) return false;
    const price = p.default_price ?? 0;
    if (priceMin && price < Number(priceMin)) return false;
    if (priceMax && price > Number(priceMax)) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return (a.default_price ?? 0) - (b.default_price ?? 0);
    if (sortBy === 'price_desc') return (b.default_price ?? 0) - (a.default_price ?? 0);
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
    return 0;
  });

  const activeFilterCount =
    selectedCats.length +
    (inStockOnly ? 0 : 1) +
    (priceMin ? 1 : 0) +
    (priceMax ? 1 : 0);

  const resetFilters = () => {
    setSelectedCats([]);
    setInStockOnly(true);
    setPriceMin('');
    setPriceMax('');
    setSortBy('relevance');
  };

  const toggleCat = (id) => setSelectedCats(prev =>
    prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
  );

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000); };

  const PRICE_PRESETS = [
    { label: 'Under ₹20', min: '', max: '20' },
    { label: '₹20–₹50', min: '20', max: '50' },
    { label: '₹50–₹100', min: '50', max: '100' },
    { label: '₹100–₹200', min: '100', max: '200' },
    { label: '₹200+', min: '200', max: '' },
  ];

  return (
    <>
      {/* Search header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '10px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4, flexShrink: 0 }}>
            ←
          </button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--surface2)', borderRadius: 12, padding: '0 14px', gap: 10, border: '1.5px solid transparent', transition: 'border-color 0.15s' }}
            onFocus={() => {}} onBlur={() => {}}>
            <Search size={17} color="var(--muted)" style={{ flexShrink: 0 }} />
            <input ref={inputRef} value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Search groceries, brands..."
              style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, outline: 'none', padding: '11px 0', color: 'var(--text)' }} />
            {query && (
              <button onClick={clearQuery} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--muted)', flexShrink: 0 }}>
                <X size={16} />
              </button>
            )}
          </div>
          <button onClick={() => handleSearch()}
            style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 10, padding: '9px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>
            Search
          </button>
        </div>
      </div>

      <div style={{ padding: '0 0 100px' }}>

        {/* ── Before search: recent + popular ── */}
        {!searched && (
          <div style={{ padding: '16px' }}>
            {recent.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text2)', letterSpacing: 0.3 }}>RECENT SEARCHES</div>
                  <button onClick={clearAllRecent}
                    style={{ fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Clear all
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {recent.map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', background: 'var(--surface2)', marginBottom: 6 }}
                      onClick={() => { setQuery(r); handleSearch(r); }}>
                      <Search size={14} color="var(--muted)" style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 14, color: 'var(--text)' }}>{r}</span>
                      <button onClick={e => { e.stopPropagation(); removeRecent(r); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: 4 }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Popular searches */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text2)', marginBottom: 12, letterSpacing: 0.3 }}>POPULAR SEARCHES</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Rice', 'Dal', 'Atta', 'Oil', 'Sugar', 'Turmeric', 'Ghee', 'Coffee', 'Chilli', 'Cumin'].map(term => (
                  <button key={term} onClick={() => { setQuery(term); handleSearch(term); }}
                    style={{ padding: '8px 16px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--white)', fontSize: 13, fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Category quick access */}
            {categories.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text2)', marginBottom: 12, letterSpacing: 0.3 }}>BROWSE BY CATEGORY</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {categories.map(cat => (
                    <button key={cat.id} onClick={() => {
                      setSelectedCats([cat.id]);
                      doSearch('');
                      setSearched(true);
                    }}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 8px', borderRadius: 14, background: 'var(--surface2)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                      <div style={{ fontSize: 26 }}>{cat.icon}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', textAlign: 'center', lineHeight: 1.3 }}>{cat.name.split(' ')[0]}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── After search: filters + results ── */}
        {searched && (
          <>
            {/* Filter / sort bar */}
            <div style={{ display: 'flex', gap: 8, padding: '12px 16px', overflowX: 'auto', borderBottom: '1px solid var(--border)', background: 'var(--white)', position: 'sticky', top: 61, zIndex: 90 }}>
              {/* Filter button */}
              <button onClick={() => setShowFilters(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 20, border: `1.5px solid ${activeFilterCount > 0 ? 'var(--primary)' : 'var(--border)'}`, background: activeFilterCount > 0 ? 'var(--primary-light)' : 'var(--white)', color: activeFilterCount > 0 ? 'var(--primary)' : 'var(--text)', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
                <SlidersHorizontal size={14} />
                Filters
                {activeFilterCount > 0 && (
                  <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, marginLeft: 2 }}>
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Sort button */}
              <button onClick={() => setShowSort(!showSort)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 20, border: `1.5px solid ${sortBy !== 'relevance' ? 'var(--primary)' : 'var(--border)'}`, background: sortBy !== 'relevance' ? 'var(--primary-light)' : 'var(--white)', color: sortBy !== 'relevance' ? 'var(--primary)' : 'var(--text)', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
                {SORT_OPTIONS.find(s => s.id === sortBy)?.label || 'Sort'}
                <ChevronDown size={13} />
              </button>

              {/* In-stock quick chip */}
              <button onClick={() => setInStockOnly(!inStockOnly)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 20, border: `1.5px solid ${inStockOnly ? 'var(--primary)' : 'var(--border)'}`, background: inStockOnly ? 'var(--primary-light)' : 'var(--white)', color: inStockOnly ? 'var(--primary)' : 'var(--text)', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
                {inStockOnly && <Check size={13} />}
                In Stock
              </button>

              {/* Active category chips */}
              {selectedCats.map(cid => {
                const cat = categories.find(c => c.id === cid);
                if (!cat) return null;
                return (
                  <button key={cid} onClick={() => toggleCat(cid)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 20, border: '1.5px solid var(--primary)', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700, fontSize: 12, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {cat.icon} {cat.name.split(' ')[0]} <X size={12} />
                  </button>
                );
              })}

              {/* Active price chip */}
              {(priceMin || priceMax) && (
                <button onClick={() => { setPriceMin(''); setPriceMax(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 20, border: '1.5px solid var(--primary)', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700, fontSize: 12, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  ₹{priceMin || '0'}–{priceMax ? `₹${priceMax}` : '∞'} <X size={12} />
                </button>
              )}
            </div>

            {/* Sort dropdown */}
            {showSort && (
              <div style={{ position: 'sticky', top: 113, zIndex: 89, background: 'var(--white)', borderBottom: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                {SORT_OPTIONS.map(opt => (
                  <button key={opt.id} onClick={() => { setSortBy(opt.id); setShowSort(false); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: sortBy === opt.id ? 'var(--primary-light)' : 'var(--white)', color: sortBy === opt.id ? 'var(--primary)' : 'var(--text)', fontWeight: sortBy === opt.id ? 700 : 500, fontSize: 14, border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
                    {opt.label}
                    {sortBy === opt.id && <Check size={16} color="var(--primary)" />}
                  </button>
                ))}
              </div>
            )}

            {/* Results count */}
            <div style={{ padding: '14px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                {loading ? 'Searching...' : (
                  <>
                    <strong style={{ color: 'var(--text)' }}>{filtered.length}</strong> results
                    {query && <> for "<strong style={{ color: 'var(--text)' }}>{query}</strong>"</>}
                  </>
                )}
              </div>
              {activeFilterCount > 0 && (
                <button onClick={resetFilters}
                  style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                  Clear filters
                </button>
              )}
            </div>

            {/* Results */}
            {loading ? (
              <div className="loader"><div className="spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="empty" style={{ padding: '40px 20px' }}>
                <div className="icon">🔍</div>
                <div className="title">No results found</div>
                <div className="sub" style={{ maxWidth: 260, margin: '0 auto' }}>
                  {activeFilterCount > 0
                    ? 'Try removing some filters to see more products'
                    : `No products matching "${query}"`}
                </div>
                {activeFilterCount > 0 && (
                  <button onClick={resetFilters}
                    style={{ marginTop: 16, padding: '10px 24px', borderRadius: 10, background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="product-grid" style={{ padding: '0 16px 20px' }}>
                {filtered.map(p => (
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
          </>
        )}
      </div>

      {/* ── Filter sheet ── */}
      {showFilters && (
        <div className="detail-overlay" onClick={() => setShowFilters(false)}>
          <div className="detail-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            {/* Sheet header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Filters</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {activeFilterCount > 0 && (
                  <button onClick={resetFilters} style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                    Reset all
                  </button>
                )}
                <button onClick={() => setShowFilters(false)} style={{ background: 'var(--surface2)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Sheet body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '20px' }}>
              {/* Availability */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text2)', marginBottom: 12, letterSpacing: 0.5 }}>AVAILABILITY</div>
                <button onClick={() => setInStockOnly(!inStockOnly)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '14px', borderRadius: 12, border: `1.5px solid ${inStockOnly ? 'var(--primary)' : 'var(--border)'}`, background: inStockOnly ? 'var(--primary-light)' : 'var(--white)', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: inStockOnly ? 'var(--primary-dark)' : 'var(--text)', textAlign: 'left' }}>In Stock Only</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, textAlign: 'left' }}>Hide out of stock products</div>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: inStockOnly ? 'var(--primary)' : 'var(--white)', border: inStockOnly ? '2px solid var(--primary)' : '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {inStockOnly && <Check size={13} color="white" />}
                  </div>
                </button>
              </div>

              {/* Price range */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text2)', marginBottom: 12, letterSpacing: 0.5 }}>PRICE RANGE (per serving)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {PRICE_PRESETS.map(preset => {
                    const active = priceMin === preset.min && priceMax === preset.max;
                    return (
                      <button key={preset.label}
                        onClick={() => { setPriceMin(preset.min); setPriceMax(preset.max); }}
                        style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`, background: active ? 'var(--primary-light)' : 'var(--white)', color: active ? 'var(--primary)' : 'var(--text)', fontWeight: active ? 700 : 500, fontSize: 12, cursor: 'pointer' }}>
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, display: 'block', marginBottom: 6 }}>MIN PRICE (₹)</label>
                    <input type="number" placeholder="0" value={priceMin}
                      onChange={e => setPriceMin(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, display: 'block', marginBottom: 6 }}>MAX PRICE (₹)</label>
                    <input type="number" placeholder="Any" value={priceMax}
                      onChange={e => setPriceMax(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text2)', marginBottom: 12, letterSpacing: 0.5 }}>CATEGORIES</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {categories.map(cat => {
                    const active = selectedCats.includes(cat.id);
                    return (
                      <button key={cat.id} onClick={() => toggleCat(cat.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`, background: active ? 'var(--primary-light)' : 'var(--white)', cursor: 'pointer', textAlign: 'left' }}>
                        <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{cat.icon}</span>
                        <span style={{ flex: 1, fontSize: 14, fontWeight: active ? 700 : 500, color: active ? 'var(--primary-dark)' : 'var(--text)' }}>{cat.name}</span>
                        <div style={{ width: 20, height: 20, borderRadius: 5, background: active ? 'var(--primary)' : 'var(--white)', border: active ? '2px solid var(--primary)' : '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {active && <Check size={12} color="white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Apply button */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
              <button onClick={() => setShowFilters(false)}
                style={{ width: '100%', padding: 14, borderRadius: 12, background: 'var(--primary)', color: 'white', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer' }}>
                Show {filtered.length} Result{filtered.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedProduct && (
        <ProductDetail product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdded={(msg) => { setSelectedProduct(null); showToast(msg); }} />
      )}

      {toast && <div className="toast">✓ {toast}</div>}
    </>
  );
}
