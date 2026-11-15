require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const { initDb, db } = require('./db');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');

const app = express();

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Ensure uploads folder exists and serve static uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' }
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

// API Routes
app.use('/api/auth', (req, res, next) => {
  if (req.path === '/login') return loginLimiter(req, res, next);
  next();
}, authRoutes);

app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: db.getMode(),
    timestamp: new Date().toISOString()
  });
});

// Contact message endpoint
app.post('/api/contact', contactLimiter, async (req, res) => {
  const { name, email, message } = req.body || {};
  if (
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof message !== 'string' ||
    name.trim().length < 2 ||
    name.length > 100 ||
    !/^\S+@\S+\.\S+$/.test(email) ||
    email.length > 254 ||
    message.trim().length < 10 ||
    message.length > 3000
  ) {
    return res.status(400).json({
      error: 'Please enter a valid name, email, and message (at least 10 characters).'
    });
  }

  try {
    const saved = await db.createMessage(name, email, message);
    return res.status(201).json({ success: true, message: 'Message sent successfully.' });
  } catch (err) {
    console.error('Contact message error:', err);
    return res.status(500).json({ error: 'Unable to save your message right now.' });
  }
});

// Serve frontend in production
const dist = path.join(__dirname, '../frontend/dist');
app.use(express.static(dist));
app.get('*', (req, res) => {
  // If request is for an API route that does not exist, return 404 JSON
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found.' });
  }
  res.sendFile(path.join(dist, 'index.html'));
});

const port = Number(process.env.PORT) || 10000;

initDb()
  .then(() => {
    app.listen(port, '0.0.0.0', () => {
      console.log(`[Server] Dharsana Portfolio & Admin running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  });
