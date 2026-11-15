import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, ArrowLeft, Eye, EyeOff, Sparkles } from 'lucide-react';

export default function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed. Please check credentials.');
      }

      // Save token and trigger callback
      localStorage.setItem('dharsana_admin_token', data.token);
      if (onLoginSuccess) {
        onLoginSuccess(data.token, data.user);
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseDefault = () => {
    setEmail('admin@dharsana.dev');
    setPassword('DharsanaAdmin@2029');
  };

  return (
    <div className="adminLoginWrapper">
      <div className="loginCard">
        <div className="loginHeader">
          <div className="loginIconCircle">
            <Shield size={28} />
          </div>
          <h2 className="loginTitle">Admin Studio</h2>
          <p className="loginSubtitle">Private Content Management System for Dharsana K</p>
        </div>

        {error && <div className="loginErrorAlert">{error}</div>}

        <form className="loginForm" onSubmit={handleSubmit}>
          <div className="formGroup">
            <label className="formLabel">Admin Email</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="formInput"
                placeholder="admin@dharsana.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="formGroup">
            <label className="formLabel">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="formInput"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="adminBtn adminBtnPrimary"
            disabled={loading}
            style={{ width: '100%', padding: '13px', marginTop: '6px' }}
          >
            {loading ? (
              <span>Verifying Credentials...</span>
            ) : (
              <>
                <span>Access Admin Studio</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid #1f293d', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 6px 0' }}>
            First time logging in?
          </p>
          <button
            type="button"
            onClick={handleUseDefault}
            style={{ background: 'none', border: 'none', color: '#c4b5fd', fontSize: '12px', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Auto-fill Default Admin Credentials
          </button>
        </div>

        <div className="loginBackLink">
          <a href="/" onClick={(e) => { e.preventDefault(); window.location.href = '/'; }}>
            ← Return to Public Portfolio
          </a>
        </div>
      </div>
    </div>
  );
}
