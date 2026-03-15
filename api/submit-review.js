// /api/submit-review.js
// POST { productKey, author, email, phone, city, rating, text, authType, googleToken }
// Saves review with status:'pending' to admin.json
// Also saves lead data for marketing

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const GH_TOKEN = process.env.GITHUB_TOKEN;
  const OWNER    = process.env.GITHUB_OWNER || 'hexisfit';
  const REPO     = process.env.GITHUB_REPO  || 'solarbalkon';
  const FILE     = process.env.GITHUB_FILE_PATH || 'admin.json';

  if (!GH_TOKEN) return res.status(500).json({ error: 'Server config error' });

  try {
    const { productKey, author, email, phone, city, rating, text, authType, googleName, googleEmail } = req.body;

    // Validate required fields
    if (!productKey || !rating || !text?.trim()) {
      return res.status(400).json({ error: 'productKey, rating та text обов\'язкові' });
    }
    if (!author?.trim()) {
      return res.status(400).json({ error: 'Вкажіть ваше ім\'я' });
    }
    if (!email?.trim() && !phone?.trim()) {
      return res.status(400).json({ error: 'Вкажіть email або телефон' });
    }

    const ghHeaders = {
      'Authorization': `Bearer ${GH_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    const fileUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}`;

    // Read current admin.json
    const readRes = await fetch(fileUrl, { headers: ghHeaders });
    let adminData = {};
    let sha;
    if (readRes.ok) {
      const data = await readRes.json();
      sha = data.sha;
      adminData = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
    }

    // Add review with pending status
    const newReview = {
      productKey,
      author: authType === 'google' ? googleName : author,
      email: authType === 'google' ? googleEmail : email,
      phone: phone || null,
      city: city || null,
      rating: parseInt(rating),
      text: text.trim(),
      date: new Date().toISOString().slice(0, 10),
      status: 'pending', // needs admin approval
      authType: authType || 'form',
      submittedAt: new Date().toISOString(),
    };

    // Add lead for marketing
    const newLead = {
      name: newReview.author,
      email: email || googleEmail || null,
      phone: phone || null,
      city: city || null,
      source: 'review',
      productKey,
      submittedAt: new Date().toISOString(),
    };

    if (!adminData.pendingReviews) adminData.pendingReviews = [];
    if (!adminData.leads) adminData.leads = [];

    adminData.pendingReviews.push(newReview);
    adminData.leads.push(newLead);

    // Save to GitHub
    const putRes = await fetch(fileUrl, {
      method: 'PUT',
      headers: { ...ghHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `review: new pending review for ${productKey}`,
        content: Buffer.from(JSON.stringify(adminData, null, 2)).toString('base64'),
        ...(sha ? { sha } : {}),
      }),
    });

    if (!putRes.ok) {
      const err = await putRes.json();
      throw new Error(err.message || 'GitHub save failed');
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('submit-review error:', err);
    return res.status(500).json({ error: err.message });
  }
}
