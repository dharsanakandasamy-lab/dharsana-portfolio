import React, { useState, useEffect } from 'react';
import {
  Code2,
  Plus,
  Search,
  Trash2,
  Edit2,
  ExternalLink,
  Github,
  Star,
  UploadCloud,
  Check,
  X,
  Eye,
  Layers
} from 'lucide-react';

export default function ProjectsManager({ token, showToast }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    category: 'AI & ML',
    description: '',
    thumbnail_url: '',
    technologies: '',
    github_url: '',
    live_url: '',
    featured: false,
    status: 'published'
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setProjects(data.items || []);
      }
    } catch (err) {
      showToast('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (project = null) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        title: project.title || '',
        category: project.category || 'AI & ML',
        description: project.description || '',
        thumbnail_url: project.thumbnail_url || '',
        technologies: project.technologies || '',
        github_url: project.github_url || '',
        live_url: project.live_url || '',
        featured: Boolean(project.featured),
        status: project.status || 'published'
      });
    } else {
      setEditingProject(null);
      setFormData({
        title: '',
        category: 'AI & ML',
        description: '',
        thumbnail_url: '',
        technologies: '',
        github_url: '',
        live_url: '',
        featured: false,
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
        thumbnail_url: resData.url
      }));
      showToast('Thumbnail uploaded successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'File upload error', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      showToast('Please provide Project Title and Description', 'error');
      return;
    }

    try {
      const url = editingProject
        ? `/api/admin/projects/${editingProject.id}`
        : '/api/admin/projects';
      const method = editingProject ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save project');

      showToast(
        editingProject ? 'Project updated successfully!' : 'Project published successfully!',
        'success'
      );
      setModalOpen(false);
      fetchProjects();
    } catch (err) {
      showToast(err.message || 'Failed to save project', 'error');
    }
  };

  const toggleFeatured = async (project) => {
    const nextFeatured = !project.featured;
    try {
      const res = await fetch(`/api/admin/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...project, featured: nextFeatured })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, featured: nextFeatured } : p))
      );
      showToast(nextFeatured ? 'Marked as Featured Project ⭐' : 'Unmarked from Featured', 'success');
    } catch (err) {
      showToast('Failed to update featured flag', 'error');
    }
  };

  const toggleStatus = async (project) => {
    const nextStatus = project.status === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch(`/api/admin/projects/${project.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, status: nextStatus } : p))
      );
      showToast(`Status changed to ${nextStatus}`, 'success');
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setProjects((prev) => prev.filter((p) => p.id !== id));
      showToast('Project deleted permanently', 'success');
      setDeleteConfirmId(null);
    } catch (err) {
      showToast('Failed to delete project', 'error');
    }
  };

  // Filter & Search
  const filtered = projects.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      (p.technologies && p.technologies.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
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
              placeholder="Search projects by title, tech stack..."
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
            <option value="AI & ML">AI & ML</option>
            <option value="Web Development">Web Development</option>
            <option value="Algorithms">Algorithms & DS</option>
            <option value="Hackathon">Hackathon Projects</option>
            <option value="Academic">Academic</option>
          </select>

          <select
            className="filterSelect"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Drafts Only</option>
          </select>
        </div>

        <button className="adminBtn adminBtnPrimary" onClick={() => handleOpenModal()}>
          <Plus size={16} />
          <span>Add Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
          Loading your projects...
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
          <Code2 size={48} style={{ color: '#7c3aed', margin: '0 auto 14px' }} />
          <h3 style={{ fontSize: '18px', color: '#fff', marginBottom: '8px' }}>
            No Projects Found
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '13.5px', marginBottom: '20px' }}>
            Add your developer projects, ML models, or hackathon prototypes to show on your portfolio.
          </p>
          <button className="adminBtn adminBtnPrimary" onClick={() => handleOpenModal()}>
            <Plus size={16} /> Add First Project
          </button>
        </div>
      ) : (
        <div className="contentGrid">
          {filtered.map((proj) => (
            <div className="contentCard" key={proj.id}>
              <div className="cardMedia">
                {proj.thumbnail_url ? (
                  <img
                    src={proj.thumbnail_url}
                    alt={proj.title}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="cardMediaPlaceholder">
                    <Code2 size={48} />
                  </div>
                )}

                <div className="cardOverlayBadges">
                  <span className="cardCategoryPill">{proj.category}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => toggleFeatured(proj)}
                      className="statusBadge"
                      style={{
                        background: proj.featured ? '#f59e0b' : 'rgba(0,0,0,0.6)',
                        color: proj.featured ? '#fff' : '#94a3b8',
                        border: '1px solid rgba(255,255,255,0.2)'
                      }}
                      title="Toggle Featured"
                    >
                      ★ {proj.featured ? 'Featured' : 'Standard'}
                    </button>
                    <button
                      className={`statusBadge ${
                        proj.status === 'published' ? 'statusPublished' : 'statusDraft'
                      }`}
                      onClick={() => toggleStatus(proj)}
                      title="Toggle Draft/Published"
                    >
                      {proj.status === 'published' ? '● Published' : '○ Draft'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="cardBody">
                <h4 className="cardTitle">{proj.title}</h4>
                <p className="cardDesc">{proj.description}</p>

                {proj.technologies && (
                  <div className="cardTags">
                    {proj.technologies.split(',').map((tech, i) => (
                      <span className="tagPill" key={i}>
                        {tech.trim()}
                      </span>
                    ))}
                  </div>
                )}

                <div className="cardFooter">
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {proj.github_url && (
                      <a
                        href={proj.github_url}
                        target="_blank"
                        rel="noreferrer"
                        className="actionBtnIcon"
                        title="GitHub Repository"
                      >
                        <Github size={15} />
                      </a>
                    )}
                    {proj.live_url && (
                      <a
                        href={proj.live_url}
                        target="_blank"
                        rel="noreferrer"
                        className="actionBtnIcon"
                        title="Live Demo"
                      >
                        <ExternalLink size={15} />
                      </a>
                    )}
                  </div>

                  <div className="cardActionGroup">
                    <button
                      className="actionBtnIcon"
                      title="Edit Project"
                      onClick={() => handleOpenModal(proj)}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      className="actionBtnIcon deleteBtn"
                      title="Delete Project"
                      onClick={() => setDeleteConfirmId(proj.id)}
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

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="modalBackdrop">
          <div className="modalBox">
            <div className="modalHeader">
              <h3>{editingProject ? 'Edit Project' : 'Create New Project'}</h3>
              <button className="modalCloseBtn" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modalBody">
                <div className="formGroup">
                  <label className="formLabel">
                    Project Title <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="formInput"
                    placeholder="e.g. AI Lung Disease Detection System"
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
                      <option value="AI & ML">AI & ML</option>
                      <option value="Web Development">Web Development</option>
                      <option value="Algorithms">Algorithms & DS</option>
                      <option value="Hackathon">Hackathon Project</option>
                      <option value="Academic">Academic</option>
                      <option value="Tools">Developer Tools</option>
                    </select>
                  </div>

                  <div className="formGroup">
                    <label className="formLabel">Publish Status</label>
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

                <div className="formGroup">
                  <label className="formLabel">
                    Project Description <span className="req">*</span>
                  </label>
                  <textarea
                    className="formTextarea"
                    rows={4}
                    placeholder="Describe what the project does, challenges solved, architecture, and your contributions..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="formGroup">
                  <label className="formLabel">Technologies Used (comma separated)</label>
                  <input
                    type="text"
                    className="formInput"
                    placeholder="e.g. Python, TensorFlow, React, FastAPI, Docker"
                    value={formData.technologies}
                    onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                  />
                </div>

                {/* Thumbnail Upload */}
                <div className="formGroup">
                  <label className="formLabel">Project Thumbnail Image</label>
                  {formData.thumbnail_url ? (
                    <div className="uploadPreviewBox">
                      <img src={formData.thumbnail_url} alt="Thumbnail Preview" />
                      <button
                        type="button"
                        className="uploadPreviewClearBtn"
                        onClick={() => setFormData({ ...formData, thumbnail_url: '' })}
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
                          {uploading ? 'Uploading...' : 'Click to Upload Thumbnail'}
                        </div>
                        <div className="uploadHint">Supports PNG, JPG, WebP up to 15MB</div>
                      </label>

                      <div style={{ marginTop: '8px', textAlign: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>- OR enter external image URL -</span>
                        <input
                          type="url"
                          className="formInput"
                          style={{ marginTop: '6px' }}
                          placeholder="https://images.unsplash.com/photo-..."
                          value={formData.thumbnail_url}
                          onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="formRow">
                  <div className="formGroup">
                    <label className="formLabel">GitHub Repository URL</label>
                    <input
                      type="url"
                      className="formInput"
                      placeholder="https://github.com/username/project"
                      value={formData.github_url}
                      onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                    />
                  </div>

                  <div className="formGroup">
                    <label className="formLabel">Live Demo URL</label>
                    <input
                      type="url"
                      className="formInput"
                      placeholder="https://myproject.onrender.com"
                      value={formData.live_url}
                      onChange={(e) => setFormData({ ...formData, live_url: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    id="featuredCheckbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: '#7c3aed' }}
                  />
                  <label htmlFor="featuredCheckbox" style={{ fontSize: '13px', color: '#f1f5f9', cursor: 'pointer' }}>
                    Feature this project on top of my portfolio (⭐ Featured Project)
                  </label>
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
                  {editingProject ? 'Save Changes' : 'Publish Project'}
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
              <h3>Delete Project</h3>
              <button className="modalCloseBtn" onClick={() => setDeleteConfirmId(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modalBody">
              <p style={{ color: '#cbd5e1', fontSize: '14px', margin: 0 }}>
                Are you sure you want to permanently delete this project? It will be removed from your
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
