const jwt = require('jsonwebtoken');
const { db } = require('../db');

const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
const JWT_SECRET = process.env.JWT_SECRET || (!isProduction ? 'dev_only_jwt_secret_local_testing' : null);

if (isProduction && !process.env.JWT_SECRET) {
  console.error('[Auth] CRITICAL SECURITY WARNING: JWT_SECRET environment variable is not defined.');
}

async function verifyAdmin(req, res, next) {
  try {
    if (!JWT_SECRET) {
      return res.status(503).json({ error: 'Authentication service configuration error (missing JWT_SECRET).' });
    }

    const authHeader = req.headers.authorization || req.headers['x-admin-token'];
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (typeof authHeader === 'string') {
      token = authHeader;
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    }

    const admin = await db.findAdminById(decoded.id);
    if (!admin) {
      return res.status(401).json({ error: 'Admin account not found or access revoked.' });
    }

    req.admin = admin;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid authentication token.' });
  }
}

module.exports = {
  verifyAdmin,
  getJwtSecret: () => JWT_SECRET
};
