import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, FolderOpen, ShoppingCart, Users, LogOut } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/categories', icon: FolderOpen, label: 'Categories' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/customers', icon: Users, label: 'Customers' },
];

export default function Layout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('gf_admin_user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('gf_admin_token');
    localStorage.removeItem('gf_admin_user');
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>🌿 GramFresh</h1>
          <p>Admin Panel</p>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-label">Menu</div>
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <item.icon className="icon" size={18} />
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
        <div className="sidebar-footer">
          <div className="avatar">{(user.name || 'A')[0]}</div>
          <div className="user-info" style={{flex:1}}>
            <p>{user.name || 'Admin'}</p>
            <p>{user.phone}</p>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
