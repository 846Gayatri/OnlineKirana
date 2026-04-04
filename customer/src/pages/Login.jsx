import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import API from '../api';

export default function Login() {
  const [step, setStep] = useState('phone'); // phone | otp
  const [phone, setPhone] = useState('9876543210');
  const [otp, setOtp] = useState('123456');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const sendOtp = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await API.post('/auth/send-otp', { phone });
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const verifyOtp = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const { data } = await API.post('/auth/verify-otp', { phone, otp, name: name || undefined });
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-container">
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🌿</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#16a34a' }}>
          Gram<span style={{ color: '#1a1d23' }}>Fresh</span>
        </h1>
        <p style={{ color: '#6b7280', fontSize: 14 }}>Fresh groceries, custom quantities</p>
      </div>

      <div className="login-box">
        {step === 'phone' ? (
          <form onSubmit={sendOtp}>
            <div className="login-title">Welcome!</div>
            <div className="login-sub">Enter your phone number to continue</div>
            {error && <div className="error-msg">{error}</div>}
            <div className="form-g">
              <div className="form-l">Phone Number</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="form-i" value="+91" disabled style={{ width: 56, textAlign: 'center', color: '#9ca3af' }} />
                <input className="form-i" type="tel" value={phone} maxLength={10}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit number" autoFocus />
              </div>
            </div>
            <button className="login-btn" disabled={phone.length !== 10 || loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp}>
            <div className="login-title">Verify OTP</div>
            <div className="login-sub">Enter the 6-digit code sent to +91 {phone}</div>
            {error && <div className="error-msg">{error}</div>}
            <div className="form-g">
              <div className="form-l">OTP Code</div>
              <input className="form-i" type="text" value={otp} maxLength={6}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter OTP" style={{ textAlign: 'center', fontSize: 22, letterSpacing: 8 }} autoFocus />
            </div>
            <div className="form-g">
              <div className="form-l">Your Name (optional)</div>
              <input className="form-i" value={name} onChange={e => setName(e.target.value)}
                placeholder="Enter your name" />
            </div>
            <button className="login-btn" disabled={otp.length !== 6 || loading}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button type="button" onClick={() => setStep('phone')}
              style={{ width: '100%', marginTop: 12, fontSize: 13, color: '#6b7280', fontWeight: 600 }}>
              ← Change phone number
            </button>
          </form>
        )}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#9ca3af' }}>
          Dev: phone=9876543210, OTP=123456
        </p>
      </div>
    </div>
  );
}
