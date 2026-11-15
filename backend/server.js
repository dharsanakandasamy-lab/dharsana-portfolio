require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const { initDb, db } = require('./db');
const supabaseHelper = require('./supabase');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');

const app = express();
const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// For local offline development, serve uploads if directory exists
if (!isProduction) {
  const uploadsDir = path.join(__dirname, 'uploads');
  if (fs.existsSync(uploadsDir)) {
    app.use('/uploads', express.static(uploadsDir));
  }
}

// Rate limiters (protect endpoints from brute-force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' }
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

// Lazy DB initialization middleware (handles serverless cold starts seamlessly)
let initPromise = null;
function ensureDbReady() {
  if (!initPromise) {
    initPromise = initDb().catch((err) => {
      console.error('[DB] Cold-start initialization error:', err.message);
      initPromise = null; // Allow retry on subsequent requests
      throw err;
    });
  }
  return initPromise;
}

app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    try {
      await ensureDbReady();
    } catch (err) {
      if (isProduction) {
        return res.status(503).json({
          error: 'Database connection failed. Please ensure DATABASE_URL is properly configured in your Supabase & Vercel settings.'
        });
      }
    }
  }
  next();
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
    storage: supabaseHelper.isConfigured() ? 'supabase' : (isProduction ? 'unconfigured' : 'local_dev'),
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

// For standalone server running outside Vercel (e.g. Render, VPS, or local preview)
if (!process.env.VERCEL) {
  const dist = path.join(__dirname, '../frontend/dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found.' });
      }
      res.sendFile(path.join(dist, 'index.html'));
    });
  }
}

const port = Number(process.env.PORT) || 10000;

// Start HTTP listener only when run directly (not when required as a serverless module by Vercel)
if (require.main === module && !process.env.VERCEL) {
  ensureDbReady()
    .then(() => {
      app.listen(port, '0.0.0.0', () => {
        console.log(`[Server] Dharsana Portfolio & Admin running on port ${port} (mode: ${db.getMode()})`);
      });
    })
    .catch((err) => {
      console.error('[Server] Fatal startup error:', err.message);
      if (isProduction) process.exit(1);
    });
}

module.exports = app;
