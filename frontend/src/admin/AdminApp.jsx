import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Award,
  Code2,
  Image,
  Video,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Shield,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import AdminLogin from './AdminLogin';
import AdminDashboardOverview from './AdminDashboardOverview';
import CertificatesManager from './CertificatesManager';
import ProjectsManager from './ProjectsManager';
import PhotosManager from './PhotosManager';
import VideosManager from './VideosManager';
import SettingsManager from './SettingsManager';
import './admin.css';

export default function AdminApp() {
  const [token, setToken] = useState(() => localStorage.getItem('dharsana_admin_token') || '');
  const [user, setUser] = useState(null);
  const [verifying, setVerifying] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Toast notification helper
  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Verify token on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setVerifying(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.authenticated) {
          setUser(data.user);
        } else {
          // Token invalid or expired
          handleLogout();
        }
      } catch (err) {
        // Offline / network issue
        console.warn('Auth verify network issue:', err.message);
      } finally {
        setVerifying(false);
      }
    };

    checkAuth();
  }, [token]);

  const handleLoginSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    setActiveTab('overview');
    showToast(`Welcome back, ${newUser.email}!`, 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('dharsana_admin_token');
    setToken('');
    setUser(null);
    showToast('Logged out successfully.', 'success');
  };

  // If still checking authentication
  if (verifying) {
    return (
      <div style={{ minHeight: '100vh', background: '#090d16', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(124, 58, 237, 0.2)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Securing admin studio session...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show private Login Screen
  if (!token || !user) {
    return (
      <>
        <AdminLogin onLoginSuccess={handleLoginSuccess} />
        {/* Toast Container */}
        <div className="toastContainer">
          {toasts.map((t) => (
            <div key={t.id} className={`toast ${t.type === 'error' ? 'toastError' : 'toastSuccess'}`}>
              {t.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  const navItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'certificates', label: 'Certificates', icon: Award },
    { id: 'projects', label: 'Projects', icon: Code2 },
    { id: 'photos', label: 'Photo Gallery', icon: Image },
    { id: 'videos', label: 'Video Showcase', icon: Video },
    { id: 'settings', label: 'Settings & Security', icon: Settings }
  ];

  return (
    <div className="adminRoot">
      {/* Toast Notifications */}
      <div className="toastContainer">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type === 'error' ? 'toastError' : 'toastSuccess'}`}>
            {t.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Sidebar */}
      <aside className={`adminSidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebarHeader">
          <div className="sidebarBrand">
            <span className="sidebarBrandName">dharsana<span className="sidebarBrandDot">.</span></span>
            <span className="sidebarStudioBadge">Studio</span>
          </div>
          <button className="sidebarCloseBtn" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebarNav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div
                key={item.id}
                className={`sidebarNavItem ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
              >
                <div className="sidebarItemLeft">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="sidebarFooter">
          <div className="sidebarUserPill">
            <div className="sidebarAvatar">D</div>
            <div style={{ overflow: 'hidden' }}>
              <div className="sidebarUserEmail">{user?.email || 'admin@dharsana.dev'}</div>
              <div className="sidebarUserRole">Portfolio Owner</div>
            </div>
          </div>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="sidebarActionBtn"
            title="Open live public portfolio in new tab"
          >
            <span>View Public Site</span>
            <ExternalLink size={13} />
          </a>

          <button className="sidebarActionBtn logoutBtn" onClick={handleLogout}>
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="adminMainContent">
        {/* Top Navbar */}
        <header className="adminTopBar">
          <div className="topBarLeft">
            <button className="mobileMenuToggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={22} />
            </button>
            <h1 className="topBarTitle">
              {navItems.find((n) => n.id === activeTab)?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="topBarRight">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="adminBtn adminBtnSecondary adminBtnSm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span>Live Site</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </header>

        {/* Tab View */}
        <main className="adminContentArea">
          {activeTab === 'overview' && (
            <AdminDashboardOverview
              token={token}
              onNavigateTab={(tab) => setActiveTab(tab)}
              showToast={showToast}
            />
          )}

          {activeTab === 'certificates' && (
            <CertificatesManager token={token} showToast={showToast} />
          )}

          {activeTab === 'projects' && (
            <ProjectsManager token={token} showToast={showToast} />
          )}

          {activeTab === 'photos' && (
            <PhotosManager token={token} showToast={showToast} />
          )}

          {activeTab === 'videos' && (
            <VideosManager token={token} showToast={showToast} />
          )}

          {activeTab === 'settings' && (
            <SettingsManager
              token={token}
              user={user}
              showToast={showToast}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>
    </div>
  );
}
