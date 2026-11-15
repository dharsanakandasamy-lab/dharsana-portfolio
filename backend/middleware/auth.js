const jwt = require('jsonwebtoken');
const { db } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'dharsana_portfolio_super_secure_admin_jwt_secret_2029';

async function verifyAdmin(req, res, next) {
  try {
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
  JWT_SECRET
};
