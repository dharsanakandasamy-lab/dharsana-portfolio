import React, { useState, useEffect } from 'react';
import {
  Award,
  Code2,
  Image,
  Video,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  CheckCircle2,
  FileText,
  Activity,
  Database
} from 'lucide-react';

export default function AdminDashboardOverview({ token, onNavigateTab, showToast }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMetrics(data);
      }
    } catch (err) {
      showToast('Failed to load overview data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const counts = metrics?.counts || {
    totalCertificates: 0,
    publishedCertificates: 0,
    totalProjects: 0,
    publishedProjects: 0,
    featuredProjects: 0,
    totalPhotos: 0,
    publishedPhotos: 0,
    totalVideos: 0,
    publishedVideos: 0
  };

  return (
    <div>
      {/* 4 Stats Cards */}
      <div className="statsGrid">
        {/* Certificates */}
        <div className="statCard" onClick={() => onNavigateTab('certificates')} style={{ cursor: 'pointer' }}>
          <div className="statCardTop">
            <span className="statLabel">Total Certificates</span>
            <div className="statIconWrap purple">
              <Award size={22} />
            </div>
          </div>
          <div className="statNumber">{loading ? '...' : counts.totalCertificates}</div>
          <div className="statSubInfo">
            <strong>{counts.publishedCertificates} Published</strong> · {counts.totalCertificates - counts.publishedCertificates} Drafts
          </div>
        </div>

        {/* Projects */}
        <div className="statCard" onClick={() => onNavigateTab('projects')} style={{ cursor: 'pointer' }}>
          <div className="statCardTop">
            <span className="statLabel">Total Projects</span>
            <div className="statIconWrap blue">
              <Code2 size={22} />
            </div>
          </div>
          <div className="statNumber">{loading ? '...' : counts.totalProjects}</div>
          <div className="statSubInfo">
            <strong>{counts.publishedProjects} Published</strong> · {counts.featuredProjects} Featured
          </div>
        </div>

        {/* Photos */}
        <div className="statCard" onClick={() => onNavigateTab('photos')} style={{ cursor: 'pointer' }}>
          <div className="statCardTop">
            <span className="statLabel">Gallery Photos</span>
            <div className="statIconWrap cyan">
              <Image size={22} />
            </div>
          </div>
          <div className="statNumber">{loading ? '...' : counts.totalPhotos}</div>
          <div className="statSubInfo">
            <strong>{counts.publishedPhotos} Published</strong> in Gallery
          </div>
        </div>

        {/* Videos */}
        <div className="statCard" onClick={() => onNavigateTab('videos')} style={{ cursor: 'pointer' }}>
          <div className="statCardTop">
            <span className="statLabel">Total Videos</span>
            <div className="statIconWrap amber">
              <Video size={22} />
            </div>
          </div>
          <div className="statNumber">{loading ? '...' : counts.totalVideos}</div>
          <div className="statSubInfo">
            <strong>{counts.publishedVideos} Published</strong> Demonstrations
          </div>
        </div>
      </div>

      {/* Overview Row: Recent Activity & Quick Actions */}
      <div className="overviewRow">
        {/* Left: Recently Added Content */}
        <div className="adminPanel">
          <div className="adminPanelHead">
            <div className="adminPanelTitle">
              <Activity size={18} /> Recently Added & Updated Content
            </div>
          </div>

          {loading ? (
            <div style={{ color: '#94a3b8', padding: '20px 0' }}>Loading activity...</div>
          ) : !metrics?.recentActivity || metrics.recentActivity.length === 0 ? (
            <div style={{ padding: '30px 20px', textAlign: 'center', color: '#94a3b8', background: 'var(--admin-card-subtle)', borderRadius: '12px' }}>
              <Sparkles size={32} style={{ color: '#7c3aed', margin: '0 auto 10px' }} />
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#fff', fontWeight: 700 }}>
                No Content Added Yet
              </p>
              <p style={{ margin: 0, fontSize: '13px' }}>
                Use the Quick Actions on the right to upload your first certificate or project.
              </p>
            </div>
          ) : (
            <div className="activityList">
              {metrics.recentActivity.map((item, idx) => {
                const isCert = item.itemType === 'certificate';
                const isProj = item.itemType === 'project';
                const isPhoto = item.itemType === 'photo';
                const isVideo = item.itemType === 'video';

                return (
                  <div className="activityItem" key={idx}>
                    <div className="activityLeft">
                      <div className="activityIcon">
                        {isCert && <Award size={18} />}
                        {isProj && <Code2 size={18} />}
                        {isPhoto && <Image size={18} />}
                        {isVideo && <Video size={18} />}
                      </div>
                      <div>
                        <div className="activityTitle">{item.title}</div>
                        <div className="activityMeta">
                          <span style={{ textTransform: 'capitalize', color: '#a78bfa', fontWeight: 700 }}>
                            {item.itemType}
                          </span>{' '}
                          · Added {new Date(item.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        className={`statusBadge ${
                          item.status === 'published' ? 'statusPublished' : 'statusDraft'
                        }`}
                      >
                        {item.status}
                      </span>
                      <button
                        className="adminBtn adminBtnSm adminBtnSecondary"
                        onClick={() => onNavigateTab(isCert ? 'certificates' : isProj ? 'projects' : isPhoto ? 'photos' : 'videos')}
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Quick Actions & Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="adminPanel">
            <div className="adminPanelHead">
              <div className="adminPanelTitle">
                <Plus size={18} /> Quick Actions
              </div>
            </div>

            <div className="quickActionsGrid">
              <div className="quickActionCard" onClick={() => onNavigateTab('certificates')}>
                <Award size={22} color="#c4b5fd" />
                <span>Upload Certificate</span>
              </div>

              <div className="quickActionCard" onClick={() => onNavigateTab('projects')}>
                <Code2 size={22} color="#93c5fd" />
                <span>Add Project</span>
              </div>

              <div className="quickActionCard" onClick={() => onNavigateTab('photos')}>
                <Image size={22} color="#67e8f9" />
                <span>Upload Photo</span>
              </div>

              <div className="quickActionCard" onClick={() => onNavigateTab('videos')}>
                <Video size={22} color="#fde68a" />
                <span>Add Video</span>
              </div>
            </div>
          </div>

          {/* Database System Mode */}
          <div className="adminPanel">
            <div className="adminPanelHead">
              <div className="adminPanelTitle">
                <Database size={18} /> System Status
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                <span>Database Engine:</span>
                <strong style={{ color: metrics?.dbMode === 'postgresql' ? '#34d399' : '#38bdf8' }}>
                  {metrics?.dbMode === 'postgresql' ? 'PostgreSQL (Cloud)' : 'Persistent Local Storage'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                <span>File Storage:</span>
                <strong style={{ color: '#34d399' }}>Active (/uploads)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                <span>Public Portfolio Sync:</span>
                <strong style={{ color: '#34d399' }}>Instant (Real-Time)</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
