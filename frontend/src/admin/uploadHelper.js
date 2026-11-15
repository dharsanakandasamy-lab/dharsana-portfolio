/**
 * Universal upload utility for Dharsana Portfolio Admin Studio.
 * Seamlessly handles:
 * - Files <= 3.8 MB via standard serverless proxy (/api/admin/upload)
 * - Large files (> 3.8 MB up to 50 MB, such as video demos) via Supabase Storage signed URLs,
 *   bypassing Vercel's 4.5 MB serverless function payload limit.
 */
export async function uploadMediaFile(file, folder = 'general', token) {
  if (!file) throw new Error('No file provided for upload.');

  // Check 50MB absolute cap
  if (file.size > 50 * 1024 * 1024) {
    throw new Error('File exceeds the 50MB maximum allowed limit.');
  }

  const isLargeFile = file.size > 3.8 * 1024 * 1024;

  if (isLargeFile) {
    // 1. Get signed upload URL from backend
    const signRes = await fetch('/api/admin/storage/sign-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        folder
      })
    });

    const signData = await signRes.json();
    if (!signRes.ok) {
      throw new Error(signData.error || 'Failed to prepare secure upload URL.');
    }

    // 2. Upload file directly to Supabase Storage via PUT
    const uploadRes = await fetch(signData.signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream'
      },
      body: file
    });

    if (!uploadRes.ok) {
      throw new Error('Direct upload to Supabase Storage failed.');
    }

    const fileType = file.type.startsWith('video/')
      ? 'video'
      : file.type === 'application/pdf'
      ? 'pdf'
      : 'image';

    return {
      success: true,
      url: signData.publicUrl,
      fileName: file.name,
      fileType,
      size: file.size,
      storageProvider: 'supabase-signed'
    };
  }

  // For smaller files (<= 3.8 MB), upload via standard backend proxy
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  const resData = await res.json();
  if (!res.ok) {
    throw new Error(resData.error || 'File upload failed.');
  }

  return resData;
}
