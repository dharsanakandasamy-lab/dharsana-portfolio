import React, { useState, useEffect } from 'react';
import { uploadMediaFile } from './uploadHelper';
import {
  Video,
  Plus,
  Search,
  Trash2,
  Edit2,
  UploadCloud,
  X,
  Play,
  Film,
  ExternalLink
} from 'lucide-react';

function getYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export default function VideosManager({ token, showToast }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail_url: '',
    video_url: '',
    video_type: 'youtube', // 'youtube' or 'upload'
    status: 'published'
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/videos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setVideos(data.items || []);
      }
    } catch (err) {
      showToast('Failed to load videos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (video = null) => {
    if (video) {
      setEditingVideo(video);
      setFormData({
        title: video.title || '',
        description: video.description || '',
        thumbnail_url: video.thumbnail_url || '',
        video_url: video.video_url || '',
        video_type: video.video_type || (video.video_url && video.video_url.includes('youtu') ? 'youtube' : 'upload'),
        status: video.status || 'published'
      });
    } else {
      setEditingVideo(null);
      setFormData({
        title: '',
        description: '',
        thumbnail_url: '',
        video_url: '',
        video_type: 'youtube',
        status: 'published'
      });
    }
    setModalOpen(true);
  };

  const handleVideoFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const resData = await uploadMediaFile(file, 'videos', token);

      setFormData((prev) => ({
        ...prev,
        video_url: resData.url,
        video_type: 'upload'
      }));
      showToast('Video file uploaded successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'File upload error', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const resData = await uploadMediaFile(file, 'videos', token);

      setFormData((prev) => ({
        ...prev,
        thumbnail_url: resData.url
      }));
      showToast('Thumbnail uploaded!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.video_url) {
      showToast('Please provide a Video Title and Video URL/file', 'error');
      return;
    }

    try {
      // Auto-extract YouTube thumbnail if empty
      let payload = { ...formData };
      const ytId = getYouTubeId(payload.video_url);
      if (ytId) {
        payload.video_type = 'youtube';
        if (!payload.thumbnail_url) {
          payload.thumbnail_url = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
        }
      }

      const url = editingVideo
        ? `/api/admin/videos/${editingVideo.id}`
        : '/api/admin/videos';
      const method = editingVideo ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save video');

      showToast(
        editingVideo ? 'Video updated successfully!' : 'Video added and published!',
        'success'
      );
      setModalOpen(false);
      fetchVideos();
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    }
  };

  const toggleStatus = async (video) => {
    const nextStatus = video.status === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch(`/api/admin/videos/${video.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setVideos((prev) =>
        prev.map((v) => (v.id === video.id ? { ...v, status: nextStatus } : v))
      );
      showToast(`Status changed to ${nextStatus}`, 'success');
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/admin/videos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setVideos((prev) => prev.filter((v) => v.id !== id));
      showToast('Video deleted permanently', 'success');
      setDeleteConfirmId(null);
    } catch (err) {
      showToast('Failed to delete video', 'error');
    }
  };

  const filtered = videos.filter((v) => {
    return (
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      (v.description && v.description.toLowerCase().includes(search.toLowerCase()))
    );
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
              placeholder="Search videos by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <button className="adminBtn adminBtnPrimary" onClick={() => handleOpenModal()}>
          <Plus size={16} />
          <span>Add Video</span>
        </button>
      </div>

      {/* Videos Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
          Loading your videos...
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
          <Film size={48} style={{ color: '#7c3aed', margin: '0 auto 14px' }} />
          <h3 style={{ fontSize: '18px', color: '#fff', marginBottom: '8px' }}>
            No Videos Found
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '13.5px', marginBottom: '20px' }}>
            Upload project demos, technical presentations, or YouTube talk links.
          </p>
          <button className="adminBtn adminBtnPrimary" onClick={() => handleOpenModal()}>
            <Plus size={16} /> Add First Video
          </button>
        </div>
      ) : (
        <div className="contentGrid">
          {filtered.map((video) => {
            const ytId = getYouTubeId(video.video_url);
            const thumb =
              video.thumbnail_url || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '');

            return (
              <div className="contentCard" key={video.id}>
                <div
                  className="cardMedia"
                  style={{ height: '200px', cursor: 'pointer', position: 'relative' }}
                  onClick={() => setPreviewVideo(video)}
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={video.title}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="cardMediaPlaceholder" style={{ background: '#1e1b4b' }}>
                      <Film size={48} />
                    </div>
                  )}

                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(0,0,0,0.35)'
                    }}
                  >
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: 'rgba(124, 58, 237, 0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.5)'
                      }}
                    >
                      <Play size={20} style={{ marginLeft: '3px' }} />
                    </div>
                  </div>

                  <div className="cardOverlayBadges">
                    <span className="cardCategoryPill">
                      {ytId ? 'YouTube' : 'Uploaded Video'}
                    </span>
                    <button
                      className={`statusBadge ${
                        video.status === 'published' ? 'statusPublished' : 'statusDraft'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStatus(video);
                      }}
                      title="Toggle Status"
                    >
                      {video.status === 'published' ? '● Published' : '○ Draft'}
                    </button>
                  </div>
                </div>

                <div className="cardBody">
                  <h4 className="cardTitle">{video.title}</h4>
                  {video.description && <p className="cardDesc">{video.description}</p>}

                  <div className="cardFooter">
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {new Date(video.created_at).toLocaleDateString()}
                    </span>

                    <div className="cardActionGroup">
                      <button
                        className="actionBtnIcon"
                        title="Watch Video"
                        onClick={() => setPreviewVideo(video)}
                      >
                        <Play size={15} />
                      </button>
                      <button
                        className="actionBtnIcon"
                        title="Edit Video"
                        onClick={() => handleOpenModal(video)}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        className="actionBtnIcon deleteBtn"
                        title="Delete Video"
                        onClick={() => setDeleteConfirmId(video.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Video Modal */}
      {modalOpen && (
        <div className="modalBackdrop">
          <div className="modalBox">
            <div className="modalHeader">
              <h3>{editingVideo ? 'Edit Video' : 'Add New Video'}</h3>
              <button className="modalCloseBtn" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modalBody">
                <div className="formGroup">
                  <label className="formLabel">
                    Video Title <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="formInput"
                    placeholder="e.g. AI Lung Detection Demo Presentation"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="formGroup">
                  <label className="formLabel">Video Source Type</label>
                  <div style={{ display: 'flex', gap: '14px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#cbd5e1', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="vtype"
                        checked={formData.video_type === 'youtube'}
                        onChange={() => setFormData({ ...formData, video_type: 'youtube' })}
                      />
                      YouTube Video Link
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#cbd5e1', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="vtype"
                        checked={formData.video_type === 'upload'}
                        onChange={() => setFormData({ ...formData, video_type: 'upload' })}
                      />
                      Upload Video File (MP4/WebM)
                    </label>
                  </div>
                </div>

                {formData.video_type === 'youtube' ? (
                  <div className="formGroup">
                    <label className="formLabel">
                      YouTube Video URL <span className="req">*</span>
                    </label>
                    <input
                      type="url"
                      className="formInput"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      required
                    />
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Thumbnails and embedded players will be automatically generated.
                    </span>
                  </div>
                ) : (
                  <div className="formGroup">
                    <label className="formLabel">
                      Upload Video File (MP4 / WebM) <span className="req">*</span>
                    </label>
                    {formData.video_url ? (
                      <div style={{ padding: '12px', background: '#0f172a', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: '#a78bfa' }}>Video Uploaded: {formData.video_url}</span>
                        <button
                          type="button"
                          className="adminBtn adminBtnSm adminBtnSecondary"
                          onClick={() => setFormData({ ...formData, video_url: '' })}
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <label className="uploadDropzone">
                        <input
                          type="file"
                          accept="video/mp4,video/webm"
                          style={{ display: 'none' }}
                          onChange={handleVideoFileUpload}
                          disabled={uploading}
                        />
                        <div className="uploadIcon">
                          <UploadCloud size={24} />
                        </div>
                        <div className="uploadText">
                          {uploading ? 'Uploading Video...' : 'Click to Upload MP4/WebM Video'}
                        </div>
                        <div className="uploadHint">Max file size: 45MB</div>
                      </label>
                    )}
                  </div>
                )}

                <div className="formGroup">
                  <label className="formLabel">Custom Video Thumbnail (Optional)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="url"
                      className="formInput"
                      placeholder="https://.../thumbnail.jpg"
                      value={formData.thumbnail_url}
                      onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                    />
                    <label className="adminBtn adminBtnSecondary" style={{ whiteSpace: 'nowrap', cursor: 'pointer' }}>
                      Upload <UploadCloud size={14} />
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleThumbnailUpload}
                      />
                    </label>
                  </div>
                </div>

                <div className="formGroup">
                  <label className="formLabel">Description</label>
                  <textarea
                    className="formTextarea"
                    placeholder="Brief description of the presentation or demo..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="formGroup">
                  <label className="formLabel">Status</label>
                  <select
                    className="formSelect"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="published">Published (Visible in Portfolio)</option>
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
                  {editingVideo ? 'Save Changes' : 'Publish Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {previewVideo && (
        <div className="modalBackdrop" onClick={() => setPreviewVideo(null)}>
          <div
            className="modalBox"
            style={{ maxWidth: '800px', background: '#000' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modalHeader" style={{ borderBottomColor: '#222' }}>
              <h3>{previewVideo.title}</h3>
              <button className="modalCloseBtn" onClick={() => setPreviewVideo(null)}>
                <X size={20} />
              </button>
            </div>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              {getYouTubeId(previewVideo.video_url) ? (
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeId(previewVideo.video_url)}?autoplay=1`}
                  title={previewVideo.title}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={previewVideo.video_url}
                  controls
                  autoPlay
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                />
              )}
            </div>
            {previewVideo.description && (
              <div style={{ padding: '16px 20px', color: '#cbd5e1', fontSize: '13px' }}>
                {previewVideo.description}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modalBackdrop">
          <div className="modalBox" style={{ maxWidth: '420px' }}>
            <div className="modalHeader">
              <h3>Delete Video</h3>
              <button className="modalCloseBtn" onClick={() => setDeleteConfirmId(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modalBody">
              <p style={{ color: '#cbd5e1', fontSize: '14px', margin: 0 }}>
                Are you sure you want to permanently delete this video? It will be removed from your
                portfolio immediately.
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
    </div>
  );
}
