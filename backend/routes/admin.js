const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../db');
const { verifyAdmin } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .slice(0, 40);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${sanitizedBase}-${uniqueSuffix}${ext}`);
  }
});

// File filter for images, documents (PDF), and videos
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'application/pdf',
    'video/mp4',
    'video/webm',
    'video/ogg'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: Images (JPG, PNG, WebP), PDFs, and Videos (MP4, WebM)`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 45 * 1024 * 1024 // 45MB max
  }
});

// Protect all admin endpoints with JWT middleware
router.use(verifyAdmin);

// ==========================================
// FILE UPLOAD ENDPOINT
// ==========================================
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const fileType = req.file.mimetype.startsWith('video/')
      ? 'video'
      : req.file.mimetype === 'application/pdf'
      ? 'pdf'
      : 'image';

    return res.status(201).json({
      success: true,
      url: fileUrl,
      fileName: req.file.originalname,
      storedName: req.file.filename,
      fileType,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (err) {
    console.error('File upload error:', err);
    return res.status(500).json({ error: 'Failed to process file upload.' });
  }
});

// Error handling for Multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds maximum limit of 45MB.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

// ==========================================
// DASHBOARD OVERVIEW METRICS
// ==========================================
router.get('/overview', async (req, res) => {
  try {
    const data = await db.getOverviewMetrics();
    return res.json({
      success: true,
      ...data
    });
  } catch (err) {
    console.error('Overview error:', err);
    return res.status(500).json({ error: 'Failed to fetch dashboard metrics.' });
  }
});

// ==========================================
// CERTIFICATES CRUD
// ==========================================
router.get('/certificates', async (req, res) => {
  try {
    const items = await db.getCertificates({ onlyPublished: false });
    return res.json({ success: true, items });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch certificates.' });
  }
});

router.post('/certificates', async (req, res) => {
  try {
    const { title, issuer, file_url } = req.body || {};
    if (!title || !issuer || !file_url) {
      return res.status(400).json({ error: 'Title, Issuing Organization, and Certificate File URL are required.' });
    }

    const created = await db.createCertificate(req.body);
    return res.status(201).json({ success: true, item: created });
  } catch (err) {
    console.error('Create certificate error:', err);
    return res.status(500).json({ error: 'Failed to create certificate.' });
  }
});

router.put('/certificates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await db.updateCertificate(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Certificate not found.' });
    }
    return res.json({ success: true, item: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update certificate.' });
  }
});

router.patch('/certificates/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['draft', 'published'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'draft' or 'published'." });
    }
    const updated = await db.updateCertificate(id, { status });
    if (!updated) return res.status(404).json({ error: 'Certificate not found.' });
    return res.json({ success: true, item: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to change certificate status.' });
  }
});

router.delete('/certificates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteCertificate(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Certificate not found.' });
    }
    return res.json({ success: true, message: 'Certificate deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete certificate.' });
  }
});

// ==========================================
// PROJECTS CRUD
// ==========================================
router.get('/projects', async (req, res) => {
  try {
    const items = await db.getProjects({ onlyPublished: false });
    return res.json({ success: true, items });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch projects.' });
  }
});

router.post('/projects', async (req, res) => {
  try {
    const { title, description } = req.body || {};
    if (!title || !description) {
      return res.status(400).json({ error: 'Project title and description are required.' });
    }

    const created = await db.createProject(req.body);
    return res.status(201).json({ success: true, item: created });
  } catch (err) {
    console.error('Create project error:', err);
    return res.status(500).json({ error: 'Failed to create project.' });
  }
});

router.put('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await db.updateProject(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    return res.json({ success: true, item: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update project.' });
  }
});

router.patch('/projects/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['draft', 'published'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'draft' or 'published'." });
    }
    const updated = await db.updateProject(id, { status });
    if (!updated) return res.status(404).json({ error: 'Project not found.' });
    return res.json({ success: true, item: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to change project status.' });
  }
});

router.delete('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteProject(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    return res.json({ success: true, message: 'Project deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete project.' });
  }
});

// ==========================================
// PHOTOS CRUD
// ==========================================
router.get('/photos', async (req, res) => {
  try {
    const items = await db.getPhotos({ onlyPublished: false });
    return res.json({ success: true, items });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch photos.' });
  }
});

router.post('/photos', async (req, res) => {
  try {
    const { title, image_url } = req.body || {};
    if (!title || !image_url) {
      return res.status(400).json({ error: 'Photo title and Image URL are required.' });
    }

    const created = await db.createPhoto(req.body);
    return res.status(201).json({ success: true, item: created });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create photo.' });
  }
});

router.put('/photos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await db.updatePhoto(id, req.body);
    if (!updated) return res.status(404).json({ error: 'Photo not found.' });
    return res.json({ success: true, item: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update photo.' });
  }
});

router.patch('/photos/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await db.updatePhoto(id, { status });
    if (!updated) return res.status(404).json({ error: 'Photo not found.' });
    return res.json({ success: true, item: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update photo status.' });
  }
});

router.delete('/photos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deletePhoto(id);
    if (!deleted) return res.status(404).json({ error: 'Photo not found.' });
    return res.json({ success: true, message: 'Photo deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete photo.' });
  }
});

// ==========================================
// VIDEOS CRUD
// ==========================================
router.get('/videos', async (req, res) => {
  try {
    const items = await db.getVideos({ onlyPublished: false });
    return res.json({ success: true, items });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch videos.' });
  }
});

router.post('/videos', async (req, res) => {
  try {
    const { title, video_url } = req.body || {};
    if (!title || !video_url) {
      return res.status(400).json({ error: 'Video title and Video URL are required.' });
    }

    const created = await db.createVideo(req.body);
    return res.status(201).json({ success: true, item: created });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create video.' });
  }
});

router.put('/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await db.updateVideo(id, req.body);
    if (!updated) return res.status(404).json({ error: 'Video not found.' });
    return res.json({ success: true, item: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update video.' });
  }
});

router.patch('/videos/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await db.updateVideo(id, { status });
    if (!updated) return res.status(404).json({ error: 'Video not found.' });
    return res.json({ success: true, item: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update video status.' });
  }
});

router.delete('/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteVideo(id);
    if (!deleted) return res.status(404).json({ error: 'Video not found.' });
    return res.json({ success: true, message: 'Video deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete video.' });
  }
});

module.exports = router;
