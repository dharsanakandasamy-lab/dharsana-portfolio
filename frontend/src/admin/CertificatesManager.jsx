import React, { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Eye,
  UploadCloud,
  FileText,
  CheckCircle2,
  Clock,
  X,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

export default function CertificatesManager({ token, showToast }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [previewCert, setPreviewCert] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    issuer: '',
    issue_date: '',
    description: '',
    skills: '',
    file_url: '',
    file_name: '',
    file_type: 'image',
    status: 'published'
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/certificates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCertificates(data.items || []);
      }
    } catch (err) {
      showToast('Failed to load certificates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cert = null) => {
    if (cert) {
      setEditingCert(cert);
      setFormData({
        title: cert.title || '',
        issuer: cert.issuer || '',
        issue_date: cert.issue_date || '',
        description: cert.description || '',
        skills: cert.skills || '',
        file_url: cert.file_url || '',
        file_name: cert.file_name || '',
        file_type: cert.file_type || 'image',
        status: cert.status || 'published'
      });
    } else {
      setEditingCert(null);
      setFormData({
        title: '',
        issuer: '',
        issue_date: '',
        description: '',
        skills: '',
        file_url: '',
        file_name: '',
        file_type: 'image',
        status: 'published'
      });
    }
    setModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);

    setUploading(true);
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Upload failed');

      setFormData((prev) => ({
        ...prev,
        file_url: resData.url,
        file_name: resData.fileName,
        file_type: resData.fileType
      }));
      showToast('Certificate file uploaded successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'File upload error', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.issuer || !formData.file_url) {
      showToast('Please provide Title, Issuer, and Certificate file', 'error');
      return;
    }

    try {
      const url = editingCert
        ? `/api/admin/certificates/${editingCert.id}`
        : '/api/admin/certificates';
      const method = editingCert ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save certificate');

      showToast(
        editingCert ? 'Certificate updated successfully!' : 'Certificate created and published!',
        'success'
      );
      setModalOpen(false);
      fetchCertificates();
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    }
  };

  const toggleStatus = async (cert) => {
    const nextStatus = cert.status === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch(`/api/admin/certificates/${cert.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCertificates((prev) =>
        prev.map((c) => (c.id === cert.id ? { ...c, status: nextStatus } : c))
      );
      showToast(`Status changed to ${nextStatus}`, 'success');
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/admin/certificates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCertificates((prev) => prev.filter((c) => c.id !== id));
      showToast('Certificate deleted permanently', 'success');
      setDeleteConfirmId(null);
    } catch (err) {
      showToast('Failed to delete certificate', 'error');
    }
  };

  // Filter & Sort
  const filtered = certificates
    .filter((c) => {
      const matchSearch =
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.issuer.toLowerCase().includes(search.toLowerCase()) ||
        (c.skills && c.skills.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      return new Date(a.created_at) - new Date(b.created_at);
    });

  return (
    <div>
      {/* Controls Bar */}
      <div className="controlsBar">
        <div className="controlsLeft">
          <div className="searchBox">
            <Search size={16} className="searchIcon" />
            <input
              type="text"
              className="searchInput"
              placeholder="Search certificates by title, issuer, skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filterSelect"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="published">Published Only</option>
            <option value="draft">Drafts Only</option>
          </select>

          <select
            className="filterSelect"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        <button className="adminBtn adminBtnPrimary" onClick={() => handleOpenModal()}>
          <Plus size={16} />
          <span>Upload Certificate</span>
        </button>
      </div>

      {/* Grid of Certificates */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
          Loading your certificates...
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '70px 20px',
            background: 'var(--admin-card)',
            borderRadius: '16px',
            border: '1px dashed var(--admin-border)'
          }}
        >
          <Award size={48} style={{ color: '#7c3aed', margin: '0 auto 14px' }} />
          <h3 style={{ fontSize: '18px', color: '#fff', marginBottom: '8px' }}>
            No Certificates Found
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '13.5px', marginBottom: '20px' }}>
            Upload your first certificate or diploma to showcase it automatically on your portfolio.
          </p>
          <button className="adminBtn adminBtnPrimary" onClick={() => handleOpenModal()}>
            <Plus size={16} /> Add First Certificate
          </button>
        </div>
      ) : (
        <div className="contentGrid">
          {filtered.map((cert) => (
            <div className="contentCard" key={cert.id}>
              <div className="cardMedia">
                {cert.file_type === 'pdf' ? (
                  <div className="cardMediaPlaceholder" style={{ background: '#1e1b4b' }}>
                    <FileText size={48} />
                    <span style={{ fontSize: '12px', marginTop: '8px', fontWeight: 700 }}>
                      PDF DOCUMENT
                    </span>
                  </div>
                ) : (
                  <img
                    src={cert.file_url}
                    alt={cert.title}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                <div className="cardOverlayBadges">
                  <span className="cardCategoryPill">{cert.issuer}</span>
                  <button
                    className={`statusBadge ${
                      cert.status === 'published' ? 'statusPublished' : 'statusDraft'
                    }`}
                    onClick={() => toggleStatus(cert)}
                    title="Click to toggle Draft / Published"
                  >
                    {cert.status === 'published' ? '● Published' : '○ Draft'}
                  </button>
                </div>
              </div>

              <div className="cardBody">
                <h4 className="cardTitle">{cert.title}</h4>
                <div className="cardSub">{cert.issue_date || 'Ongoing'}</div>
                {cert.description && <p className="cardDesc">{cert.description}</p>}

                {cert.skills && (
                  <div className="cardTags">
                    {cert.skills.split(',').map((skill, i) => (
                      <span className="tagPill" key={i}>
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                )}

                <div className="cardFooter">
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {new Date(cert.created_at).toLocaleDateString()}
                  </span>

                  <div className="cardActionGroup">
                    <button
                      className="actionBtnIcon"
                      title="Preview Document"
                      onClick={() => setPreviewCert(cert)}
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      className="actionBtnIcon"
                      title="Edit Certificate"
                      onClick={() => handleOpenModal(cert)}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      className="actionBtnIcon deleteBtn"
                      title="Delete Certificate"
                      onClick={() => setDeleteConfirmId(cert.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload/Edit Modal */}
      {modalOpen && (
        <div className="modalBackdrop">
          <div className="modalBox">
            <div className="modalHeader">
              <h3>{editingCert ? 'Edit Certificate' : 'Upload New Certificate'}</h3>
              <button className="modalCloseBtn" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modalBody">
                <div className="formGroup">
                  <label className="formLabel">
                    Certificate Title <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="formInput"
                    placeholder="e.g. Python for Data Science & AI Foundations"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="formRow">
                  <div className="formGroup">
                    <label className="formLabel">
                      Issuing Organization <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      className="formInput"
                      placeholder="e.g. NPTEL, Coursera, IBM, HackerRank"
                      value={formData.issuer}
                      onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                      required
                    />
                  </div>

                  <div className="formGroup">
                    <label className="formLabel">Issue Date</label>
                    <input
                      type="text"
                      className="formInput"
                      placeholder="e.g. October 2026"
                      value={formData.issue_date}
                      onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="formGroup">
                  <label className="formLabel">Skills / Technologies (comma separated)</label>
                  <input
                    type="text"
                    className="formInput"
                    placeholder="e.g. Python, Machine Learning, Data Analytics"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  />
                </div>

                <div className="formGroup">
                  <label className="formLabel">Description / Overview</label>
                  <textarea
                    className="formTextarea"
                    placeholder="Briefly describe what this certification covers and practical skills gained..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                {/* File Upload Section */}
                <div className="formGroup">
                  <label className="formLabel">
                    Certificate Document (Image or PDF) <span className="req">*</span>
                  </label>

                  {formData.file_url ? (
                    <div
                      style={{
                        padding: '14px',
                        background: '#0f172a',
                        borderRadius: '12px',
                        border: '1px solid #1f293d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={20} color="#7c3aed" />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                            {formData.file_name || 'Certificate File'}
                          </div>
                          <a
                            href={formData.file_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: '11px', color: '#c4b5fd', textDecoration: 'underline' }}
                          >
                            Preview URL Link
                          </a>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="adminBtn adminBtnSm adminBtnSecondary"
                        onClick={() => setFormData({ ...formData, file_url: '', file_name: '' })}
                      >
                        Replace
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="uploadDropzone">
                        <input
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/webp"
                          style={{ display: 'none' }}
                          onChange={handleFileUpload}
                          disabled={uploading}
                        />
                        <div className="uploadIcon">
                          <UploadCloud size={24} />
                        </div>
                        <div className="uploadText">
                          {uploading ? 'Uploading to Server...' : 'Click to Upload Certificate'}
                        </div>
                        <div className="uploadHint">Supports PDF, PNG, JPG, WebP up to 40MB</div>
                      </label>

                      <div style={{ marginTop: '8px', textAlign: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>- OR enter external document URL -</span>
                        <input
                          type="url"
                          className="formInput"
                          style={{ marginTop: '6px' }}
                          placeholder="https://example.com/certificate.pdf"
                          value={formData.file_url}
                          onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="formGroup">
                  <label className="formLabel">Publishing Status</label>
                  <select
                    className="formSelect"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="published">Published (Visible on Portfolio)</option>
                    <option value="draft">Draft (Private Admin Only)</option>
                  </select>
                </div>
              </div>

              <div className="modalFooter">
                <button
                  type="button"
                  className="adminBtn adminBtnSecondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="adminBtn adminBtnPrimary" disabled={uploading}>
                  {editingCert ? 'Save Changes' : 'Publish Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modalBackdrop">
          <div className="modalBox" style={{ maxWidth: '420px' }}>
            <div className="modalHeader">
              <h3>Confirm Deletion</h3>
              <button className="modalCloseBtn" onClick={() => setDeleteConfirmId(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modalBody">
              <p style={{ color: '#cbd5e1', fontSize: '14px', margin: 0 }}>
                Are you sure you want to permanently delete this certificate? This action cannot be
                undone and will remove it from your public portfolio.
              </p>
            </div>
            <div className="modalFooter">
              <button
                className="adminBtn adminBtnSecondary"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button
                className="adminBtn adminBtnDanger"
                onClick={() => handleDelete(deleteConfirmId)}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewCert && (
        <div className="modalBackdrop">
          <div className="modalBox" style={{ maxWidth: '800px', height: '85vh' }}>
            <div className="modalHeader">
              <h3>{previewCert.title}</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href={previewCert.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="adminBtn adminBtnSm adminBtnSecondary"
                >
                  Open in New Tab <ExternalLink size={14} />
                </a>
                <button className="modalCloseBtn" onClick={() => setPreviewCert(null)}>
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="modalBody" style={{ padding: '0', display: 'flex', height: '100%' }}>
              {previewCert.file_type === 'pdf' ? (
                <iframe
                  src={previewCert.file_url}
                  title={previewCert.title}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0f19', padding: '20px' }}>
                  <img
                    src={previewCert.file_url}
                    alt={previewCert.title}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
