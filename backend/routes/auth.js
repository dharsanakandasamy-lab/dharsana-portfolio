const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { verifyAdmin, getJwtSecret } = require('../middleware/auth');

const router = express.Router();

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide both email and password.' });
    }

    const admin = await db.findAdminByEmail(email);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const secret = getJwtSecret();
    if (!secret) {
      return res.status(503).json({ error: 'Server authentication configuration missing (JWT_SECRET).' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      secret,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: admin.id,
        email: admin.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Verify current session
router.get('/me', verifyAdmin, (req, res) => {
  return res.json({
    authenticated: true,
    user: req.admin
  });
});

// Change Admin Password
router.post('/change-password', verifyAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current password and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const adminFull = await db.findAdminByEmail(req.admin.email);
    if (!adminFull) {
      return res.status(404).json({ error: 'Admin account not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, adminFull.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.updateAdminPassword(req.admin.id, newHash);

    return res.json({
      success: true,
      message: 'Password updated successfully. Please use your new password next time you log in.'
    });
  } catch (err) {
    console.error('Password change error:', err);
    return res.status(500).json({ error: 'Failed to update password.' });
  }
});

module.exports = router;
