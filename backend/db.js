const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const hasDbUrl = Boolean(process.env.DATABASE_URL);
const pool = hasDbUrl
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
    })
  : null;

let isPgReady = false;

// Local JSON DB fallback path
const dataDir = path.join(__dirname, 'data');
const localDbPath = path.join(dataDir, 'db.json');

function ensureLocalDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(localDbPath)) {
    const defaultData = {
      admin_users: [],
      certificates: [],
      projects: [],
      photos: [],
      videos: [],
      messages: []
    };
    fs.writeFileSync(localDbPath, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}

function readLocalDb() {
  ensureLocalDb();
  try {
    const raw = fs.readFileSync(localDbPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading local DB, resetting to defaults:', err.message);
    return { admin_users: [], certificates: [], projects: [], photos: [], videos: [], messages: [] };
  }
}

function writeLocalDb(data) {
  ensureLocalDb();
  fs.writeFileSync(localDbPath, JSON.stringify(data, null, 2), 'utf8');
}

// Seed default admin if missing
async function seedDefaultAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@dharsana.dev').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'DharsanaAdmin@2029';
  const hash = await bcrypt.hash(password, 10);

  if (isPgReady && pool) {
    try {
      const res = await pool.query('SELECT id FROM admin_users LIMIT 1');
      if (res.rows.length === 0) {
        await pool.query(
          'INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)',
          [email, hash]
        );
        console.log(`[DB] Default admin seeded in PostgreSQL: ${email}`);
      }
    } catch (err) {
      console.error('[DB] Failed to check/seed admin in PostgreSQL:', err.message);
    }
  } else {
    const db = readLocalDb();
    if (!db.admin_users || db.admin_users.length === 0) {
      db.admin_users = [
        {
          id: 1,
          email,
          password_hash: hash,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      writeLocalDb(db);
      console.log(`[DB] Default admin seeded in local database: ${email}`);
    }
  }
}

// Initialize tables in PostgreSQL
async function initDb() {
  ensureLocalDb();

  if (pool) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id BIGSERIAL PRIMARY KEY,
          email VARCHAR(254) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS certificates (
          id BIGSERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          issuer VARCHAR(255) NOT NULL,
          issue_date VARCHAR(100),
          description TEXT,
          skills TEXT,
          file_url TEXT NOT NULL,
          file_name VARCHAR(255),
          file_type VARCHAR(50),
          status VARCHAR(20) NOT NULL DEFAULT 'published',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS projects (
          id BIGSERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          thumbnail_url TEXT,
          technologies TEXT,
          github_url TEXT,
          live_url TEXT,
          category VARCHAR(100),
          featured BOOLEAN NOT NULL DEFAULT FALSE,
          status VARCHAR(20) NOT NULL DEFAULT 'published',
          sort_order INT NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS photos (
          id BIGSERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(100),
          image_url TEXT NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'published',
          sort_order INT NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS videos (
          id BIGSERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          thumbnail_url TEXT,
          video_url TEXT NOT NULL,
          video_type VARCHAR(50) NOT NULL DEFAULT 'youtube',
          status VARCHAR(20) NOT NULL DEFAULT 'published',
          sort_order INT NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS messages (
          id BIGSERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(254) NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      isPgReady = true;
      console.log('[DB] PostgreSQL connected and tables initialized successfully.');
    } catch (err) {
      console.warn('[DB] PostgreSQL initialization failed, switching to local DB:', err.message);
      isPgReady = false;
    }
  } else {
    console.log('[DB] DATABASE_URL not set; using local persistent JSON storage.');
  }

  await seedDefaultAdmin();
}

// Unified Database Helpers
const db = {
  isReady: () => isPgReady || true,
  getMode: () => (isPgReady ? 'postgresql' : 'local_json'),

  // ADMIN USERS
  findAdminByEmail: async (email) => {
    const cleanEmail = email.trim().toLowerCase();
    if (isPgReady) {
      const res = await pool.query('SELECT * FROM admin_users WHERE email = $1', [cleanEmail]);
      return res.rows[0] || null;
    }
    const local = readLocalDb();
    return local.admin_users.find((u) => u.email.toLowerCase() === cleanEmail) || null;
  },

  findAdminById: async (id) => {
    if (isPgReady) {
      const res = await pool.query('SELECT id, email, created_at, updated_at FROM admin_users WHERE id = $1', [id]);
      return res.rows[0] || null;
    }
    const local = readLocalDb();
    const user = local.admin_users.find((u) => Number(u.id) === Number(id));
    if (!user) return null;
    const { password_hash, ...rest } = user;
    return rest;
  },

  updateAdminPassword: async (id, newHash) => {
    const now = new Date().toISOString();
    if (isPgReady) {
      await pool.query('UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, id]);
      return true;
    }
    const local = readLocalDb();
    const idx = local.admin_users.findIndex((u) => Number(u.id) === Number(id));
    if (idx !== -1) {
      local.admin_users[idx].password_hash = newHash;
      local.admin_users[idx].updated_at = now;
      writeLocalDb(local);
      return true;
    }
    return false;
  },

  // CERTIFICATES
  getCertificates: async ({ onlyPublished = false } = {}) => {
    if (isPgReady) {
      const query = onlyPublished
        ? "SELECT * FROM certificates WHERE status = 'published' ORDER BY created_at DESC"
        : 'SELECT * FROM certificates ORDER BY created_at DESC';
      const res = await pool.query(query);
      return res.rows;
    }
    const local = readLocalDb();
    let list = local.certificates || [];
    if (onlyPublished) list = list.filter((c) => c.status === 'published');
    return list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  },

  getCertificateById: async (id) => {
    if (isPgReady) {
      const res = await pool.query('SELECT * FROM certificates WHERE id = $1', [id]);
      return res.rows[0] || null;
    }
    const local = readLocalDb();
    return local.certificates.find((c) => Number(c.id) === Number(id)) || null;
  },

  createCertificate: async (data) => {
    const {
      title,
      issuer,
      issue_date = '',
      description = '',
      skills = '',
      file_url,
      file_name = '',
      file_type = 'image',
      status = 'published'
    } = data;

    if (isPgReady) {
      const res = await pool.query(
        `INSERT INTO certificates 
         (title, issuer, issue_date, description, skills, file_url, file_name, file_type, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [title, issuer, issue_date, description, skills, file_url, file_name, file_type, status]
      );
      return res.rows[0];
    }
    const local = readLocalDb();
    const newItem = {
      id: Date.now(),
      title,
      issuer,
      issue_date,
      description,
      skills,
      file_url,
      file_name,
      file_type,
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    local.certificates.unshift(newItem);
    writeLocalDb(local);
    return newItem;
  },

  updateCertificate: async (id, data) => {
    if (isPgReady) {
      const current = await db.getCertificateById(id);
      if (!current) return null;
      const updated = { ...current, ...data };
      const res = await pool.query(
        `UPDATE certificates 
         SET title = $1, issuer = $2, issue_date = $3, description = $4, skills = $5,
             file_url = $6, file_name = $7, file_type = $8, status = $9, updated_at = NOW()
         WHERE id = $10
         RETURNING *`,
        [
          updated.title,
          updated.issuer,
          updated.issue_date,
          updated.description,
          updated.skills,
          updated.file_url,
          updated.file_name,
          updated.file_type,
          updated.status,
          id
        ]
      );
      return res.rows[0];
    }
    const local = readLocalDb();
    const idx = local.certificates.findIndex((c) => Number(c.id) === Number(id));
    if (idx === -1) return null;
    local.certificates[idx] = {
      ...local.certificates[idx],
      ...data,
      updated_at: new Date().toISOString()
    };
    writeLocalDb(local);
    return local.certificates[idx];
  },

  deleteCertificate: async (id) => {
    if (isPgReady) {
      const res = await pool.query('DELETE FROM certificates WHERE id = $1 RETURNING *', [id]);
      return res.rows[0] || null;
    }
    const local = readLocalDb();
    const idx = local.certificates.findIndex((c) => Number(c.id) === Number(id));
    if (idx === -1) return null;
    const [deleted] = local.certificates.splice(idx, 1);
    writeLocalDb(local);
    return deleted;
  },

  // PROJECTS
  getProjects: async ({ onlyPublished = false } = {}) => {
    if (isPgReady) {
      const query = onlyPublished
        ? "SELECT * FROM projects WHERE status = 'published' ORDER BY featured DESC, sort_order ASC, created_at DESC"
        : 'SELECT * FROM projects ORDER BY featured DESC, sort_order ASC, created_at DESC';
      const res = await pool.query(query);
      return res.rows;
    }
    const local = readLocalDb();
    let list = local.projects || [];
    if (onlyPublished) list = list.filter((p) => p.status === 'published');
    return list.sort((a, b) => {
      if (a.featured !== b.featured) return b.featured ? 1 : -1;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  },

  getProjectById: async (id) => {
    if (isPgReady) {
      const res = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
      return res.rows[0] || null;
    }
    const local = readLocalDb();
    return local.projects.find((p) => Number(p.id) === Number(id)) || null;
  },

  createProject: async (data) => {
    const {
      title,
      description,
      thumbnail_url = '',
      technologies = '',
      github_url = '',
      live_url = '',
      category = 'AI & ML',
      featured = false,
      status = 'published',
      sort_order = 0
    } = data;

    if (isPgReady) {
      const res = await pool.query(
        `INSERT INTO projects 
         (title, description, thumbnail_url, technologies, github_url, live_url, category, featured, status, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [title, description, thumbnail_url, technologies, github_url, live_url, category, Boolean(featured), status, sort_order]
      );
      return res.rows[0];
    }
    const local = readLocalDb();
    const newItem = {
      id: Date.now(),
      title,
      description,
      thumbnail_url,
      technologies,
      github_url,
      live_url,
      category,
      featured: Boolean(featured),
      status,
      sort_order,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    local.projects.unshift(newItem);
    writeLocalDb(local);
    return newItem;
  },

  updateProject: async (id, data) => {
    if (isPgReady) {
      const current = await db.getProjectById(id);
      if (!current) return null;
      const updated = { ...current, ...data };
      const res = await pool.query(
        `UPDATE projects 
         SET title = $1, description = $2, thumbnail_url = $3, technologies = $4,
             github_url = $5, live_url = $6, category = $7, featured = $8, status = $9,
             sort_order = $10, updated_at = NOW()
         WHERE id = $11
         RETURNING *`,
        [
          updated.title,
          updated.description,
          updated.thumbnail_url,
          updated.technologies,
          updated.github_url,
          updated.live_url,
          updated.category,
          Boolean(updated.featured),
          updated.status,
          updated.sort_order,
          id
        ]
      );
      return res.rows[0];
    }
    const local = readLocalDb();
    const idx = local.projects.findIndex((p) => Number(p.id) === Number(id));
    if (idx === -1) return null;
    local.projects[idx] = {
      ...local.projects[idx],
      ...data,
      featured: data.featured !== undefined ? Boolean(data.featured) : local.projects[idx].featured,
      updated_at: new Date().toISOString()
    };
    writeLocalDb(local);
    return local.projects[idx];
  },

  deleteProject: async (id) => {
    if (isPgReady) {
      const res = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);
      return res.rows[0] || null;
    }
    const local = readLocalDb();
    const idx = local.projects.findIndex((p) => Number(p.id) === Number(id));
    if (idx === -1) return null;
    const [deleted] = local.projects.splice(idx, 1);
    writeLocalDb(local);
    return deleted;
  },

  // PHOTOS
  getPhotos: async ({ onlyPublished = false } = {}) => {
    if (isPgReady) {
      const query = onlyPublished
        ? "SELECT * FROM photos WHERE status = 'published' ORDER BY sort_order ASC, created_at DESC"
        : 'SELECT * FROM photos ORDER BY sort_order ASC, created_at DESC';
      const res = await pool.query(query);
      return res.rows;
    }
    const local = readLocalDb();
    let list = local.photos || [];
    if (onlyPublished) list = list.filter((p) => p.status === 'published');
    return list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  },

  getPhotoById: async (id) => {
    if (isPgReady) {
      const res = await pool.query('SELECT * FROM photos WHERE id = $1', [id]);
      return res.rows[0] || null;
    }
    const local = readLocalDb();
    return local.photos.find((p) => Number(p.id) === Number(id)) || null;
  },

  createPhoto: async (data) => {
    const { title, description = '', category = 'General', image_url, status = 'published', sort_order = 0 } = data;
    if (isPgReady) {
      const res = await pool.query(
        `INSERT INTO photos (title, description, category, image_url, status, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [title, description, category, image_url, status, sort_order]
      );
      return res.rows[0];
    }
    const local = readLocalDb();
    const newItem = {
      id: Date.now(),
      title,
      description,
      category,
      image_url,
      status,
      sort_order,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    local.photos.unshift(newItem);
    writeLocalDb(local);
    return newItem;
  },

  updatePhoto: async (id, data) => {
    if (isPgReady) {
      const current = await db.getPhotoById(id);
      if (!current) return null;
      const updated = { ...current, ...data };
      const res = await pool.query(
        `UPDATE photos 
         SET title = $1, description = $2, category = $3, image_url = $4, status = $5,
             sort_order = $6, updated_at = NOW()
         WHERE id = $7
         RETURNING *`,
        [updated.title, updated.description, updated.category, updated.image_url, updated.status, updated.sort_order, id]
      );
      return res.rows[0];
    }
    const local = readLocalDb();
    const idx = local.photos.findIndex((p) => Number(p.id) === Number(id));
    if (idx === -1) return null;
    local.photos[idx] = {
      ...local.photos[idx],
      ...data,
      updated_at: new Date().toISOString()
    };
    writeLocalDb(local);
    return local.photos[idx];
  },

  deletePhoto: async (id) => {
    if (isPgReady) {
      const res = await pool.query('DELETE FROM photos WHERE id = $1 RETURNING *', [id]);
      return res.rows[0] || null;
    }
    const local = readLocalDb();
    const idx = local.photos.findIndex((p) => Number(p.id) === Number(id));
    if (idx === -1) return null;
    const [deleted] = local.photos.splice(idx, 1);
    writeLocalDb(local);
    return deleted;
  },

  // VIDEOS
  getVideos: async ({ onlyPublished = false } = {}) => {
    if (isPgReady) {
      const query = onlyPublished
        ? "SELECT * FROM videos WHERE status = 'published' ORDER BY sort_order ASC, created_at DESC"
        : 'SELECT * FROM videos ORDER BY sort_order ASC, created_at DESC';
      const res = await pool.query(query);
      return res.rows;
    }
    const local = readLocalDb();
    let list = local.videos || [];
    if (onlyPublished) list = list.filter((v) => v.status === 'published');
    return list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  },

  getVideoById: async (id) => {
    if (isPgReady) {
      const res = await pool.query('SELECT * FROM videos WHERE id = $1', [id]);
      return res.rows[0] || null;
    }
    const local = readLocalDb();
    return local.videos.find((v) => Number(v.id) === Number(id)) || null;
  },

  createVideo: async (data) => {
    const {
      title,
      description = '',
      thumbnail_url = '',
      video_url,
      video_type = 'youtube',
      status = 'published',
      sort_order = 0
    } = data;

    if (isPgReady) {
      const res = await pool.query(
        `INSERT INTO videos (title, description, thumbnail_url, video_url, video_type, status, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [title, description, thumbnail_url, video_url, video_type, status, sort_order]
      );
      return res.rows[0];
    }
    const local = readLocalDb();
    const newItem = {
      id: Date.now(),
      title,
      description,
      thumbnail_url,
      video_url,
      video_type,
      status,
      sort_order,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    local.videos.unshift(newItem);
    writeLocalDb(local);
    return newItem;
  },

  updateVideo: async (id, data) => {
    if (isPgReady) {
      const current = await db.getVideoById(id);
      if (!current) return null;
      const updated = { ...current, ...data };
      const res = await pool.query(
        `UPDATE videos 
         SET title = $1, description = $2, thumbnail_url = $3, video_url = $4, video_type = $5,
             status = $6, sort_order = $7, updated_at = NOW()
         WHERE id = $8
         RETURNING *`,
        [
          updated.title,
          updated.description,
          updated.thumbnail_url,
          updated.video_url,
          updated.video_type,
          updated.status,
          updated.sort_order,
          id
        ]
      );
      return res.rows[0];
    }
    const local = readLocalDb();
    const idx = local.videos.findIndex((v) => Number(v.id) === Number(id));
    if (idx === -1) return null;
    local.videos[idx] = {
      ...local.videos[idx],
      ...data,
      updated_at: new Date().toISOString()
    };
    writeLocalDb(local);
    return local.videos[idx];
  },

  deleteVideo: async (id) => {
    if (isPgReady) {
      const res = await pool.query('DELETE FROM videos WHERE id = $1 RETURNING *', [id]);
      return res.rows[0] || null;
    }
    const local = readLocalDb();
    const idx = local.videos.findIndex((v) => Number(v.id) === Number(id));
    if (idx === -1) return null;
    const [deleted] = local.videos.splice(idx, 1);
    writeLocalDb(local);
    return deleted;
  },

  // OVERVIEW COUNTS & RECENT ACTIVITY
  getOverviewMetrics: async () => {
    const certs = await db.getCertificates();
    const projs = await db.getProjects();
    const photos = await db.getPhotos();
    const videos = await db.getVideos();

    const counts = {
      totalCertificates: certs.length,
      publishedCertificates: certs.filter((c) => c.status === 'published').length,
      totalProjects: projs.length,
      publishedProjects: projs.filter((p) => p.status === 'published').length,
      featuredProjects: projs.filter((p) => p.featured).length,
      totalPhotos: photos.length,
      publishedPhotos: photos.filter((p) => p.status === 'published').length,
      totalVideos: videos.length,
      publishedVideos: videos.filter((v) => v.status === 'published').length
    };

    // Combine recent items
    const taggedItems = [
      ...certs.map((i) => ({ ...i, itemType: 'certificate' })),
      ...projs.map((i) => ({ ...i, itemType: 'project' })),
      ...photos.map((i) => ({ ...i, itemType: 'photo' })),
      ...videos.map((i) => ({ ...i, itemType: 'video' }))
    ];

    taggedItems.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    const recentActivity = taggedItems.slice(0, 8);

    return {
      counts,
      recentActivity,
      dbMode: db.getMode()
    };
  },

  // CONTACT MESSAGES
  createMessage: async (name, email, message) => {
    if (isPgReady) {
      const res = await pool.query(
        'INSERT INTO messages (name, email, message) VALUES ($1, $2, $3) RETURNING *',
        [name.trim(), email.trim(), message.trim()]
      );
      return res.rows[0];
    }
    const local = readLocalDb();
    const newMsg = {
      id: Date.now(),
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      created_at: new Date().toISOString()
    };
    local.messages.unshift(newMsg);
    writeLocalDb(local);
    return newMsg;
  }
};

module.exports = {
  initDb,
  db
};
