const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../db');
const { verifyAdmin } = require('../middleware/auth');
const supabaseHelper = require('../supabase');

const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
const router = express.Router();

// Fallback uploads directory for local offline development only
const localUploadsDir = path.join(__dirname, '../uploads');
if (!isProduction && !fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true });
}

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
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

// Memory storage for serverless-safe uploads (files <= 4MB)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: ${file.mimetype}. Allowed types: JPG, PNG, WebP, GIF, SVG, PDF, MP4, WebM.`
      )
    );
  }
};

// 4MB limit for serverless proxy upload (keeps requests safely under Vercel's 4.5MB limit)
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 4 * 1024 * 1024
  }
});

// Protect all admin endpoints with JWT middleware
router.use(verifyAdmin);

// ==========================================
// FILE UPLOAD ENDPOINT (DIRECT / BUFFER)
// ==========================================
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const folder = req.body.folder || 'general';

    // If Supabase Storage is configured, upload directly to Supabase Storage bucket
    if (supabaseHelper.isConfigured()) {
      const uploaded = await supabaseHelper.uploadBuffer(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        folder
      );

      const fileType = req.file.mimetype.startsWith('video/')
        ? 'video'
        : req.file.mimetype === 'application/pdf'
        ? 'pdf'
        : 'image';

      return res.status(201).json({
        success: true,
        url: uploaded.url,
        fileName: req.file.originalname,
        storagePath: uploaded.path,
        fileType,
        size: uploaded.size,
        mimetype: req.file.mimetype,
        storageProvider: 'supabase'
      });
    }

    // In production, Supabase Storage is required
    if (isProduction) {
      return res.status(503).json({
        error: 'Storage service unavailable. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.'
      });
    }

    // Local offline development fallback
    const ext = path.extname(req.file.originalname).toLowerCase();
    const sanitizedBase = path
      .basename(req.file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .slice(0, 36);
    const filename = `${sanitizedBase}-${Date.now()}${ext}`;
    const localFilePath = path.join(localUploadsDir, filename);

    fs.writeFileSync(localFilePath, req.file.buffer);

    const fileType = req.file.mimetype.startsWith('video/')
      ? 'video'
      : req.file.mimetype === 'application/pdf'
      ? 'pdf'
      : 'image';

    return res.status(201).json({
      success: true,
      url: `/uploads/${filename}`,
      fileName: req.file.originalname,
      storedName: filename,
      fileType,
      size: req.file.size,
      mimetype: req.file.mimetype,
      storageProvider: 'local_dev'
    });
  } catch (err) {
    console.error('File upload error:', err);
    return res.status(500).json({ error: err.message || 'Failed to process file upload.' });
  }
});

// ==========================================
// SIGNED UPLOAD URL ENDPOINT (FOR LARGE FILES > 4MB UP TO 50MB)
// ==========================================
router.post('/storage/sign-upload', async (req, res) => {
  try {
    const { fileName, fileType, folder = 'general' } = req.body || {};

    if (!fileName || !fileType) {
      return res.status(400).json({ error: 'fileName and fileType are required.' });
    }

    if (!ALLOWED_MIME_TYPES.includes(fileType)) {
      return res.status(400).json({
        error: `Unsupported file type: ${fileType}. Allowed: Images, PDFs, and MP4/WebM Videos.`
      });
    }

    if (!supabaseHelper.isConfigured()) {
      if (isProduction) {
        return res.status(503).json({ error: 'Supabase Storage is not configured.' });
      }
      return res.status(400).json({
        error: 'Signed uploads require Supabase Storage configuration (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY).'
      });
    }

    const signedData = await supabaseHelper.createSignedUploadUrl(fileName, fileType, folder);

    return res.json({
      success: true,
      ...signedData
    });
  } catch (err) {
    console.error('Signed upload error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate signed upload URL.' });
  }
});

// Error handling for Multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File exceeds direct upload size limit of 4MB. For larger videos or files, use the signed upload method.'
      });
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
      ...data,
      storageConfigured: supabaseHelper.isConfigured()
    });
  } catch (err) {
    console.error('Overview error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch dashboard metrics.' });
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
    return res.status(500).json({ error: err.message || 'Failed to fetch certificates.' });
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
    return res.status(500).json({ error: err.message || 'Failed to create certificate.' });
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
    return res.status(500).json({ error: err.message || 'Failed to update certificate.' });
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
    return res.status(500).json({ error: err.message || 'Failed to change certificate status.' });
  }
});

router.delete('/certificates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await db.getCertificateById(id);
    const deleted = await db.deleteCertificate(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Certificate not found.' });
    }

    // Clean up file in Supabase Storage if hosted there
    if (item && item.file_url) {
      await supabaseHelper.deleteFileByUrl(item.file_url);
    }

    return res.json({ success: true, message: 'Certificate deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to delete certificate.' });
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
    return res.status(500).json({ error: err.message || 'Failed to fetch projects.' });
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
    return res.status(500).json({ error: err.message || 'Failed to create project.' });
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
    return res.status(500).json({ error: err.message || 'Failed to update project.' });
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
    return res.status(500).json({ error: err.message || 'Failed to change project status.' });
  }
});

router.delete('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await db.getProjectById(id);
    const deleted = await db.deleteProject(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    if (item && item.thumbnail_url) {
      await supabaseHelper.deleteFileByUrl(item.thumbnail_url);
    }

    return res.json({ success: true, message: 'Project deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to delete project.' });
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
    return res.status(500).json({ error: err.message || 'Failed to fetch photos.' });
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
    return res.status(500).json({ error: err.message || 'Failed to create photo.' });
  }
});

router.put('/photos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await db.updatePhoto(id, req.body);
    if (!updated) return res.status(404).json({ error: 'Photo not found.' });
    return res.json({ success: true, item: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to update photo.' });
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
    return res.status(500).json({ error: err.message || 'Failed to update photo status.' });
  }
});

router.delete('/photos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await db.getPhotoById(id);
    const deleted = await db.deletePhoto(id);
    if (!deleted) return res.status(404).json({ error: 'Photo not found.' });

    if (item && item.image_url) {
      await supabaseHelper.deleteFileByUrl(item.image_url);
    }

    return res.json({ success: true, message: 'Photo deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to delete photo.' });
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
    return res.status(500).json({ error: err.message || 'Failed to fetch videos.' });
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
    return res.status(500).json({ error: err.message || 'Failed to create video.' });
  }
});

router.put('/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await db.updateVideo(id, req.body);
    if (!updated) return res.status(404).json({ error: 'Video not found.' });
    return res.json({ success: true, item: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to update video.' });
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
    return res.status(500).json({ error: err.message || 'Failed to update video status.' });
  }
});

router.delete('/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await db.getVideoById(id);
    const deleted = await db.deleteVideo(id);
    if (!deleted) return res.status(404).json({ error: 'Video not found.' });

    if (item) {
      if (item.video_url) await supabaseHelper.deleteFileByUrl(item.video_url);
      if (item.thumbnail_url) await supabaseHelper.deleteFileByUrl(item.thumbnail_url);
    }

    return res.json({ success: true, message: 'Video deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to delete video.' });
  }
});

module.exports = router;
