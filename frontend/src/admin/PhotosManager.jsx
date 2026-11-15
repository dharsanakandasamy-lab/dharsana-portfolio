import React, { useState, useEffect } from 'react';
import { uploadMediaFile } from './uploadHelper';
import {
  Image,
  Plus,
  Search,
  Trash2,
  Edit2,
  UploadCloud,
  X,
  Eye,
  Camera
} from 'lucide-react';

export default function PhotosManager({ token, showToast }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Hackathons',
    image_url: '',
    status: 'published'
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/photos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPhotos(data.items || []);
      }
    } catch (err) {
      showToast('Failed to load photos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (photo = null) => {
    if (photo) {
      setEditingPhoto(photo);
      setFormData({
        title: photo.title || '',
        description: photo.description || '',
        category: photo.category || 'Hackathons',
        image_url: photo.image_url || '',
        status: photo.status || 'published'
      });
    } else {
      setEditingPhoto(null);
      setFormData({
        title: '',
        description: '',
        category: 'Hackathons',
        image_url: '',
        status: 'published'
      });
    }
    setModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const resData = await uploadMediaFile(file, 'photos', token);

      setFormData((prev) => ({
        ...prev,
        image_url: resData.url
      }));
      showToast('Photo uploaded successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'File upload error', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.image_url) {
      showToast('Please provide a Photo Title and Image', 'error');
      return;
    }

    try {
      const url = editingPhoto
        ? `/api/admin/photos/${editingPhoto.id}`
        : '/api/admin/photos';
      const method = editingPhoto ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save photo');

      showToast(
        editingPhoto ? 'Photo updated successfully!' : 'Photo added to portfolio gallery!',
        'success'
      );
      setModalOpen(false);
      fetchPhotos();
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    }
  };

  const toggleStatus = async (photo) => {
    const nextStatus = photo.status === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch(`/api/admin/photos/${photo.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPhotos((prev) =>
        prev.map((p) => (p.id === photo.id ? { ...p, status: nextStatus } : p))
      );
      showToast(`Status changed to ${nextStatus}`, 'success');
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/admin/photos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPhotos((prev) => prev.filter((p) => p.id !== id));
      showToast('Photo deleted permanently', 'success');
      setDeleteConfirmId(null);
    } catch (err) {
      showToast('Failed to delete photo', 'error');
    }
  };

  const filtered = photos.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCategory;
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
              placeholder="Search gallery photos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filterSelect"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="Hackathons">Hackathons & Wins</option>
            <option value="Events">Symposiums & Events</option>
            <option value="Campus">College & Campus</option>
            <option value="Projects">Project Showcases</option>
            <option value="Moments">Milestones & Moments</option>
          </select>
        </div>

        <button className="adminBtn adminBtnPrimary" onClick={() => handleOpenModal()}>
          <Plus size={16} />
          <span>Upload Photo</span>
        </button>
      </div>

      {/* Photos Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
          Loading your gallery photos...
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
          <Camera size={48} style={{ color: '#06b6d4', margin: '0 auto 14px' }} />
          <h3 style={{ fontSize: '18px', color: '#fff', marginBottom: '8px' }}>
            No Gallery Photos Found
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '13.5px', marginBottom: '20px' }}>
            Upload memorable moments from hackathons, college symposiums, and achievements.
          </p>
          <button className="adminBtn adminBtnPrimary" onClick={() => handleOpenModal()}>
            <Plus size={16} /> Upload First Photo
          </button>
        </div>
      ) : (
        <div className="contentGrid">
          {filtered.map((photo) => (
            <div className="contentCard" key={photo.id}>
              <div
                className="cardMedia"
                style={{ height: '220px', cursor: 'pointer' }}
                onClick={() => setPreviewPhoto(photo)}
              >
                <img
                  src={photo.image_url}
                  alt={photo.title}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />

                <div className="cardOverlayBadges">
                  <span className="cardCategoryPill">{photo.category}</span>
                  <button
                    className={`statusBadge ${
                      photo.status === 'published' ? 'statusPublished' : 'statusDraft'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStatus(photo);
                    }}
                    title="Toggle Status"
                  >
                    {photo.status === 'published' ? '● Published' : '○ Draft'}
                  </button>
                </div>
              </div>

              <div className="cardBody">
                <h4 className="cardTitle">{photo.title}</h4>
                {photo.description && <p className="cardDesc">{photo.description}</p>}

                <div className="cardFooter">
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {new Date(photo.created_at).toLocaleDateString()}
                  </span>

                  <div className="cardActionGroup">
                    <button
                      className="actionBtnIcon"
                      title="View Fullscreen"
                      onClick={() => setPreviewPhoto(photo)}
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      className="actionBtnIcon"
                      title="Edit Photo Info"
                      onClick={() => handleOpenModal(photo)}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      className="actionBtnIcon deleteBtn"
                      title="Delete Photo"
                      onClick={() => setDeleteConfirmId(photo.id)}
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
              <h3>{editingPhoto ? 'Edit Photo Info' : 'Upload Gallery Photo'}</h3>
              <button className="modalCloseBtn" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modalBody">
                <div className="formGroup">
                  <label className="formLabel">
                    Photo Title <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="formInput"
                    placeholder="e.g. 1st Place Hackathon Award Ceremony"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="formRow">
                  <div className="formGroup">
                    <label className="formLabel">Category</label>
                    <select
                      className="formSelect"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="Hackathons">Hackathons & Wins</option>
                      <option value="Events">Symposiums & Events</option>
                      <option value="Campus">College & Campus</option>
                      <option value="Projects">Project Showcases</option>
                      <option value="Moments">Milestones & Moments</option>
                    </select>
                  </div>

                  <div className="formGroup">
                    <label className="formLabel">Publish Status</label>
                    <select
                      className="formSelect"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="published">Published (Visible in Portfolio Gallery)</option>
                      <option value="draft">Draft (Private Admin Only)</option>
                    </select>
                  </div>
                </div>

                <div className="formGroup">
                  <label className="formLabel">Description / Memory</label>
                  <textarea
                    className="formTextarea"
                    placeholder="Share what happened in this photo, event context, and team members..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                {/* Photo File Upload */}
                <div className="formGroup">
                  <label className="formLabel">
                    Photo Image File <span className="req">*</span>
                  </label>
                  {formData.image_url ? (
                    <div className="uploadPreviewBox" style={{ height: '200px' }}>
                      <img src={formData.image_url} alt="Uploaded Photo" />
                      <button
                        type="button"
                        className="uploadPreviewClearBtn"
                        onClick={() => setFormData({ ...formData, image_url: '' })}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="uploadDropzone">
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleFileUpload}
                          disabled={uploading}
                        />
                        <div className="uploadIcon">
                          <UploadCloud size={24} />
                        </div>
                        <div className="uploadText">
                          {uploading ? 'Uploading Photo...' : 'Click to Upload Photo'}
                        </div>
                        <div className="uploadHint">Supports PNG, JPG, WebP, GIF up to 20MB</div>
                      </label>

                      <div style={{ marginTop: '8px', textAlign: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>- OR enter external image URL -</span>
                        <input
                          type="url"
                          className="formInput"
                          style={{ marginTop: '6px' }}
                          placeholder="https://images.unsplash.com/..."
                          value={formData.image_url}
                          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
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
                  {editingPhoto ? 'Save Changes' : 'Publish Photo'}
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
              <h3>Delete Photo</h3>
              <button className="modalCloseBtn" onClick={() => setDeleteConfirmId(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modalBody">
              <p style={{ color: '#cbd5e1', fontSize: '14px', margin: 0 }}>
                Are you sure you want to permanently delete this photo? It will be removed from your
                gallery immediately.
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

      {/* Lightbox Modal */}
      {previewPhoto && (
        <div className="modalBackdrop" onClick={() => setPreviewPhoto(null)}>
          <div
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              position: 'relative',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewPhoto(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              <X size={26} />
            </button>
            <img
              src={previewPhoto.image_url}
              alt={previewPhoto.title}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
              }}
            />
            <div style={{ marginTop: '12px', color: '#fff', fontSize: '16px', fontWeight: 800 }}>
              {previewPhoto.title}
            </div>
            {previewPhoto.description && (
              <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
                {previewPhoto.description}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
