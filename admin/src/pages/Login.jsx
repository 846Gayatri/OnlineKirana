import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

export default function Login() {
  const [phone, setPhone] = useState('9999999999');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await API.post('/auth/admin-login', { phone, password });
      localStorage.setItem('gf_admin_token', data.token);
      localStorage.setItem('gf_admin_user', JSON.stringify(data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <h1>🌿 GramFresh</h1>
          <p>Admin Panel</p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius:8, padding:'10px 14px', marginBottom:16, color:'#ef4444', fontSize:13 }}>
              {error}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input className="form-input" type="text" value={phone}
              onChange={e => setPhone(e.target.value)} placeholder="Enter admin phone" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="Enter password" />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', padding: '12px', fontSize: 15, marginTop: 8 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={{ fontSize:11, color:'var(--muted)', textAlign:'center', marginTop:20 }}>
          Default: 9999999999 / admin123
        </p>
      </div>
    </div>
  );
}
