require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { initDb, db } = require('../db');
const supabaseHelper = require('../supabase');

async function migrate() {
  console.log('====================================================');
  console.log('Dharsana Portfolio: Supabase Data & Media Migration');
  console.log('====================================================');

  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL is not set. Please provide your Supabase PostgreSQL connection string in .env.');
    process.exit(1);
  }

  if (!supabaseHelper.isConfigured()) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not configured. Supabase Storage migration requires these.');
    process.exit(1);
  }

  console.log('\n[1/4] Connecting to Supabase PostgreSQL and ensuring tables...');
  await initDb();
  console.log('✓ Database tables verified.');

  console.log('\n[2/4] Ensuring Supabase Storage bucket (portfolio-media)...');
  await supabaseHelper.ensureBucket();
  console.log('✓ Storage bucket verified.');

  // Find local data backup
  const backupFile = path.join(__dirname, '../backup/db.json');
  const dataFile = path.join(__dirname, '../data/db.json');
  const targetFile = fs.existsSync(backupFile) ? backupFile : (fs.existsSync(dataFile) ? dataFile : null);

  if (!targetFile) {
    console.log('\nNo local db.json found to migrate. Migration complete (empty state).');
    process.exit(0);
  }

  console.log(`\n[3/4] Reading local data from: ${targetFile}`);
  const localData = JSON.parse(fs.readFileSync(targetFile, 'utf8'));

  const uploadsDir = path.join(__dirname, '../uploads');

  // Helper to upload local file if it exists and return Supabase public URL
  async function migrateMediaFile(fileUrl, folder) {
    if (!fileUrl || !fileUrl.startsWith('/uploads/')) return fileUrl;

    const localFileName = path.basename(fileUrl);
    const localFilePath = path.join(uploadsDir, localFileName);

    if (fs.existsSync(localFilePath)) {
      try {
        const fileBuffer = fs.readFileSync(localFilePath);
        const ext = path.extname(localFileName).toLowerCase();
        let mime = 'application/octet-stream';
        if (['.jpg', '.jpeg'].includes(ext)) mime = 'image/jpeg';
        else if (ext === '.png') mime = 'image/png';
        else if (ext === '.webp') mime = 'image/webp';
        else if (ext === '.pdf') mime = 'application/pdf';
        else if (ext === '.mp4') mime = 'video/mp4';
        else if (ext === '.webm') mime = 'video/webm';

        const uploaded = await supabaseHelper.uploadBuffer(fileBuffer, localFileName, mime, folder);
        console.log(`  Uploaded ${localFileName} -> ${uploaded.url}`);
        return uploaded.url;
      } catch (err) {
        console.warn(`  Failed to upload ${localFileName}:`, err.message);
        return fileUrl;
      }
    }
    return fileUrl;
  }

  console.log('\n[4/4] Migrating records to Supabase PostgreSQL...');

  // 1. Certificates
  const certs = localData.certificates || [];
  console.log(`- Migrating ${certs.length} certificate(s)...`);
  for (const cert of certs) {
    const finalUrl = await migrateMediaFile(cert.file_url, 'certificates');
    await db.createCertificate({
      ...cert,
      file_url: finalUrl
    });
  }

  // 2. Projects
  const projs = localData.projects || [];
  console.log(`- Migrating ${projs.length} project(s)...`);
  for (const proj of projs) {
    const finalThumb = await migrateMediaFile(proj.thumbnail_url, 'projects');
    await db.createProject({
      ...proj,
      thumbnail_url: finalThumb
    });
  }

  // 3. Photos
  const photos = localData.photos || [];
  console.log(`- Migrating ${photos.length} photo(s)...`);
  for (const photo of photos) {
    const finalImg = await migrateMediaFile(photo.image_url, 'photos');
    await db.createPhoto({
      ...photo,
      image_url: finalImg
    });
  }

  // 4. Videos
  const videos = localData.videos || [];
  console.log(`- Migrating ${videos.length} video(s)...`);
  for (const video of videos) {
    let finalVideoUrl = video.video_url;
    if (video.video_url && video.video_url.startsWith('/uploads/')) {
      finalVideoUrl = await migrateMediaFile(video.video_url, 'videos');
    }
    let finalThumb = video.thumbnail_url;
    if (video.thumbnail_url && video.thumbnail_url.startsWith('/uploads/')) {
      finalThumb = await migrateMediaFile(video.thumbnail_url, 'videos');
    }

    await db.createVideo({
      ...video,
      video_url: finalVideoUrl,
      thumbnail_url: finalThumb
    });
  }

  console.log('\n====================================================');
  console.log('✓ Migration to Supabase completed successfully!');
  console.log('====================================================\n');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('\nMigration failed with error:', err);
  process.exit(1);
});
