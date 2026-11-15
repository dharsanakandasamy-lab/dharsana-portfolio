const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL ? process.env.SUPABASE_URL.trim() : null;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.trim() : null;

const BUCKET_NAME = 'portfolio-media';

// Server-side Supabase client with admin/service-role privileges
const supabase = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;

let bucketReady = false;

// Ensure portfolio-media bucket exists with public read access
async function ensureBucket() {
  if (!supabase) return false;
  if (bucketReady) return true;

  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.warn('[Supabase Storage] List buckets warning:', listError.message);
    } else {
      const exists = buckets.some((b) => b.name === BUCKET_NAME);
      if (!exists) {
        const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: 52428800 // 50MB
        });
        if (createError) {
          console.warn('[Supabase Storage] Create bucket warning:', createError.message);
        } else {
          console.log(`[Supabase Storage] Created public bucket: ${BUCKET_NAME}`);
        }
      }
    }
    bucketReady = true;
    return true;
  } catch (err) {
    console.warn('[Supabase Storage] Bucket check skipped:', err.message);
    return false;
  }
}

// Generate clean, sanitized storage file path
function sanitizeFileName(originalName, folder = 'misc') {
  const ext = path.extname(originalName || '').toLowerCase();
  const base = path
    .basename(originalName || 'file', ext)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 36);
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const cleanFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase() || 'misc';
  return `${cleanFolder}/${base}-${unique}${ext}`;
}

// Upload buffer directly to Supabase Storage (for files <= 4MB via server proxy)
async function uploadBuffer(buffer, originalName, mimeType, folder = 'general') {
  if (!supabase) {
    throw new Error('Supabase Storage is not configured. Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }

  await ensureBucket();

  const storagePath = sanitizeFileName(originalName, folder);

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);

  return {
    url: urlData.publicUrl,
    path: storagePath,
    fileName: originalName,
    size: buffer.length,
    mimeType
  };
}

// Generate a signed upload URL for large files (> 4MB up to 50MB) to bypass Vercel serverless request limits
async function createSignedUploadUrl(originalName, mimeType, folder = 'general') {
  if (!supabase) {
    throw new Error('Supabase Storage is not configured. Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }

  await ensureBucket();

  const storagePath = sanitizeFileName(originalName, folder);

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUploadUrl(storagePath);

  if (error) {
    throw new Error(`Failed to create signed upload URL: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);

  return {
    signedUrl: data.signedUrl,
    token: data.token,
    path: storagePath,
    publicUrl: urlData.publicUrl
  };
}

// Delete a file from Supabase Storage by its public URL
async function deleteFileByUrl(fileUrl) {
  if (!supabase || !fileUrl || typeof fileUrl !== 'string') return false;

  try {
    // Check if the URL points to this Supabase bucket
    const bucketMarker = `/${BUCKET_NAME}/`;
    const markerIndex = fileUrl.indexOf(bucketMarker);
    if (markerIndex === -1) return false;

    const storagePath = fileUrl.slice(markerIndex + bucketMarker.length).split('?')[0];
    if (!storagePath) return false;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storagePath]);

    if (error) {
      console.warn(`[Supabase Storage] Failed to delete file ${storagePath}:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase Storage] File delete error:', err.message);
    return false;
  }
}

module.exports = {
  supabase,
  BUCKET_NAME,
  isConfigured: () => Boolean(supabase),
  ensureBucket,
  uploadBuffer,
  createSignedUploadUrl,
  deleteFileByUrl
};
