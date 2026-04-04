import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, ClipboardList, User } from 'lucide-react';
import { useState, useEffect, createContext, useContext } from 'react';
import API from './api';
import HomePage from './pages/Home';
import CartPage from './pages/Cart';
import OrdersPage from './pages/Orders';
import LoginPage from './pages/Login';
import ProfilePage from './pages/Profile';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

const AddressContext = createContext();
export const useAddress = () => useContext(AddressContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('gf_user') || 'null'));
  const [token, setToken] = useState(localStorage.getItem('gf_token'));

  const login = (tok, usr) => {
    localStorage.setItem('gf_token', tok);
    localStorage.setItem('gf_user', JSON.stringify(usr));
    setToken(tok); setUser(usr);
  };

  const logout = () => {
    localStorage.removeItem('gf_token');
    localStorage.removeItem('gf_user');
    setToken(null); setUser(null);
  };

  return <AuthContext.Provider value={{ user, token, login, logout, isLoggedIn: !!token }}>{children}</AuthContext.Provider>;
}

function CartProvider({ children }) {
  const { isLoggedIn } = useAuth();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ item_count: 0, subtotal: 0, delivery_fee: 0, total: 0 });

  const fetchCart = async () => {
    if (!isLoggedIn) return;
    try {
      const { data } = await API.get('/cart');
      setItems(data.items);
      setSummary(data.summary);
    } catch { }
  };

  useEffect(() => { fetchCart(); }, [isLoggedIn]);

  const addToCart = async (productId, qty) => {
    await API.post('/cart/items', { product_id: productId, quantity_grams: qty });
    await fetchCart();
  };

  const updateItem = async (itemId, qty) => {
    await API.put(`/cart/items/${itemId}`, { quantity_grams: qty });
    await fetchCart();
  };

  const removeItem = async (itemId) => {
    await API.delete(`/cart/items/${itemId}`);
    await fetchCart();
  };

  const clearCart = async () => {
    await API.delete('/cart');
    await fetchCart();
  };

  return <CartContext.Provider value={{ items, summary, addToCart, updateItem, removeItem, clearCart, fetchCart }}>
    {children}
  </CartContext.Provider>;
}

function AddressProvider({ children }) {
  const [addresses, setAddresses] = useState(() => {
    const saved = localStorage.getItem('gf_addresses');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', label: 'Home', full: '42, MG Road, Block B, Koramangala' },
    ];
  });
  const [selectedAddress, setSelectedAddress] = useState(addresses[0]);

  const saveAddress = (addr) => {
    let newAddresses;
    if (addresses.find(a => a.id === addr.id)) {
      newAddresses = addresses.map(a => a.id === addr.id ? addr : a);
    } else {
      newAddresses = [...addresses, addr];
    }
    setAddresses(newAddresses);
    localStorage.setItem('gf_addresses', JSON.stringify(newAddresses));
    if (!selectedAddress || selectedAddress.id === addr.id) {
      setSelectedAddress(addr);
    }
  };

  return (
    <AddressContext.Provider value={{ addresses, selectedAddress, setSelectedAddress, saveAddress }}>
      {children}
    </AddressContext.Provider>
  );
}

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
}

function BottomNav() {
  const location = useLocation();
  const { summary } = useCart();
  const { isLoggedIn } = useAuth();
  if (['/login'].includes(location.pathname)) return null;

  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`} end>
        <Home className="icon" size={22} /><span>Home</span>
      </NavLink>
      <NavLink to="/cart" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
        <ShoppingCart className="icon" size={22} />
        {summary.item_count > 0 && <span className="cart-badge">{summary.item_count}</span>}
        <span>Cart</span>
      </NavLink>
      <NavLink to="/orders" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
        <ClipboardList className="icon" size={22} /><span>Orders</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
        <User className="icon" size={22} /><span>Profile</span>
      </NavLink>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AddressProvider>
          <CartProvider>
            <div className="app-shell">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<HomePage />} />
                <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              </Routes>
              <BottomNav />
            </div>
          </CartProvider>
        </AddressProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
