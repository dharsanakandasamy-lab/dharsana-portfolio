import React, { useState } from 'react';
import { Shield, Key, Database, User, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';

export default function SettingsManager({ token, user, showToast, onLogout }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setStatusMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');

      setStatusMsg({ type: 'success', text: data.message });
      showToast('Admin password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Profile Info */}
      <div className="adminPanel">
        <div className="adminPanelHead">
          <div className="adminPanelTitle">
            <User size={18} /> Admin Profile & Security
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
          <div style={{ padding: '16px', background: 'var(--admin-card-subtle)', borderRadius: '12px', border: '1px solid var(--admin-border)' }}>
            <div style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
              Admin Account
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>
              {user?.email || 'admin@dharsana.dev'}
            </div>
          </div>

          <div style={{ padding: '16px', background: 'var(--admin-card-subtle)', borderRadius: '12px', border: '1px solid var(--admin-border)' }}>
            <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
              Security Status
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={16} color="#34d399" /> JWT Session Active
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Form */}
      <div className="adminPanel">
        <div className="adminPanelHead">
          <div className="adminPanelTitle">
            <Key size={18} /> Change Admin Password
          </div>
        </div>

        {statusMsg.text && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              marginBottom: '16px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: statusMsg.type === 'error' ? 'var(--admin-danger-bg)' : 'var(--admin-success-bg)',
              color: statusMsg.type === 'error' ? '#f87171' : '#34d399',
              border: `1px solid ${statusMsg.type === 'error' ? 'var(--admin-danger)' : '#059669'}`
            }}
          >
            {statusMsg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="formGroup">
            <label className="formLabel">Current Password</label>
            <input
              type="password"
              className="formInput"
              placeholder="Enter your current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="formRow">
            <div className="formGroup">
              <label className="formLabel">New Password (min 6 characters)</label>
              <input
                type="password"
                className="formInput"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="formGroup">
              <label className="formLabel">Confirm New Password</label>
              <input
                type="password"
                className="formInput"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            className="adminBtn adminBtnPrimary"
            disabled={saving}
            style={{ alignSelf: 'flex-start', minWidth: '180px' }}
          >
            {saving ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* System Status & Logout */}
      <div className="adminPanel">
        <div className="adminPanelHead">
          <div className="adminPanelTitle">
            <Database size={18} /> Storage & Deployment Architecture
          </div>
        </div>

        <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.7', marginBottom: '20px' }}>
          <p style={{ margin: '0 0 10px 0' }}>
            Content is permanently stored across dedicated database tables: <b>Certificates</b>,{' '}
            <b>Projects</b>, <b>Photos</b>, and <b>Videos</b>.
          </p>
          <p style={{ margin: '0 0 10px 0' }}>
            When deployed to Render with a PostgreSQL database, set the <code>DATABASE_URL</code> environment variable. Files uploaded are permanently accessible at <code>/uploads/*</code>.
          </p>
        </div>

        <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Dharsana K Portfolio Content Management System v2.0
          </span>
          <button
            className="adminBtn adminBtnDanger"
            onClick={onLogout}
          >
            <LogOut size={15} /> Logout from Studio
          </button>
        </div>
      </div>
    </div>
  );
}
