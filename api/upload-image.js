// /api/upload-image.js
// POST multipart/form-data → завантажує зображення в GitHub репо /public/
// Body: { file: File, folder: 'inverters'|'batteries'|'systems'|'blog', filename: 'SUN-8K.png' }
//
// ENV: ADMIN_PASSWORD, GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO

export const config = { api: { bodyParser: { sizeLimit: '5mb' } } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Auth
  const token = (req.headers['authorization'] || '').replace('Bearer ', '');
  if (!process.env.ADMIN_PASSWORD || token !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const GH_TOKEN = process.env.GITHUB_TOKEN;
  const OWNER    = process.env.GITHUB_OWNER || 'hexisfit';
  const REPO     = process.env.GITHUB_REPO  || 'solarbalkon';

  if (!GH_TOKEN) return res.status(500).json({ error: 'GITHUB_TOKEN not set' });

  try {
    const { fileBase64, filename, folder } = req.body;

    if (!fileBase64 || !filename || !folder) {
      return res.status(400).json({ error: 'fileBase64, filename, folder required' });
    }

    // Sanitize filename
    const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, '-');
    const filePath = `public/${folder}/${safeName}`;
    const fileUrl  = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`;

    const ghHeaders = {
      'Authorization': `Bearer ${GH_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    };

    // Check if file exists (need SHA for update)
    let sha;
    const checkRes = await fetch(fileUrl, { headers: ghHeaders });
    if (checkRes.ok) {
      const checkData = await checkRes.json();
      sha = checkData.sha;
    }

    // Upload to GitHub
    const body = {
      message: `admin: upload ${filePath}`,
      content: fileBase64,
      ...(sha ? { sha } : {}),
    };

    const putRes = await fetch(fileUrl, {
      method: 'PUT',
      headers: ghHeaders,
      body: JSON.stringify(body),
    });

    if (!putRes.ok) {
      const err = await putRes.json();
      throw new Error(err.message || `GitHub PUT ${putRes.status}`);
    }

    const publicUrl = `/${folder}/${safeName}`;
    return res.status(200).json({ success: true, url: publicUrl, path: filePath });

  } catch (err) {
    console.error('upload-image error:', err);
    return res.status(500).json({ error: err.message });
  }
}
