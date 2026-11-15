const express = require('express');
const { db } = require('../db');

const router = express.Router();

// Get all published portfolio content in a single call for fast load
router.get('/content', async (req, res) => {
  try {
    const [certificates, projects, photos, videos] = await Promise.all([
      db.getCertificates({ onlyPublished: true }),
      db.getProjects({ onlyPublished: true }),
      db.getPhotos({ onlyPublished: true }),
      db.getVideos({ onlyPublished: true })
    ]);

    return res.json({
      success: true,
      certificates,
      projects,
      photos,
      videos
    });
  } catch (err) {
    console.error('Public content fetch error:', err);
    return res.status(500).json({ error: 'Failed to load public portfolio content.' });
  }
});

router.get('/certificates', async (req, res) => {
  try {
    const items = await db.getCertificates({ onlyPublished: true });
    return res.json({ success: true, items });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load certificates.' });
  }
});

router.get('/projects', async (req, res) => {
  try {
    const items = await db.getProjects({ onlyPublished: true });
    return res.json({ success: true, items });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load projects.' });
  }
});

router.get('/photos', async (req, res) => {
  try {
    const items = await db.getPhotos({ onlyPublished: true });
    return res.json({ success: true, items });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load photos.' });
  }
});

router.get('/videos', async (req, res) => {
  try {
    const items = await db.getVideos({ onlyPublished: true });
    return res.json({ success: true, items });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load videos.' });
  }
});

module.exports = router;
