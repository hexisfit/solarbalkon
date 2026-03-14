// /api/admin-data.js
// GET  → повертає admin.json (публічно, для сайту і мобільного)
// POST → оновлює admin.json через GitHub API (тільки з паролем)
//
// ENV змінні (Vercel):
//   ADMIN_PASSWORD   — пароль для POST запитів
//   GITHUB_TOKEN     — Personal Access Token (repo scope)
//   GITHUB_OWNER     — hexisfit
//   GITHUB_REPO      — solarbalkon
//   GITHUB_FILE_PATH — admin.json (шлях в репо)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const OWNER    = process.env.GITHUB_OWNER    || 'hexisfit';
  const REPO     = process.env.GITHUB_REPO     || 'solarbalkon';
  const FILE     = process.env.GITHUB_FILE_PATH || 'admin.json';
  const GH_TOKEN = process.env.GITHUB_TOKEN;
  const ADMIN_PW = process.env.ADMIN_PASSWORD;

  const ghHeaders = {
    'Authorization': `Bearer ${GH_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const fileUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}`;

  // ── GET: читаємо admin.json ──────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const r = await fetch(fileUrl, { headers: ghHeaders });
      if (!r.ok) {
        // Файл ще не існує — повертаємо дефолтну структуру
        if (r.status === 404) return res.status(200).json(defaultAdminData());
        throw new Error(`GitHub API ${r.status}`);
      }
      const data = await r.json();
      const content = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
      return res.status(200).json({ ...content, _sha: data.sha });
    } catch (err) {
      console.error('admin-data GET error:', err);
      return res.status(200).json(defaultAdminData());
    }
  }

  // ── POST: записуємо admin.json ───────────────────────────────────
  if (req.method === 'POST') {
    // Перевірка пароля
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace('Bearer ', '');
    if (!ADMIN_PW || token !== ADMIN_PW) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!GH_TOKEN) {
      return res.status(500).json({ error: 'GITHUB_TOKEN not set' });
    }

    try {
      const { _sha, ...payload } = req.body;
      const newContent = Buffer.from(JSON.stringify(payload, null, 2)).toString('base64');

      // Отримуємо поточний SHA якщо не передано
      let sha = _sha;
      if (!sha) {
        const check = await fetch(fileUrl, { headers: ghHeaders });
        if (check.ok) {
          const checkData = await check.json();
          sha = checkData.sha;
        }
      }

      const body = {
        message: `admin: update ${FILE} via admin panel`,
        content: newContent,
        ...(sha ? { sha } : {}),
      };

      const putRes = await fetch(fileUrl, {
        method: 'PUT',
        headers: { ...ghHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!putRes.ok) {
        const err = await putRes.json();
        throw new Error(err.message || `GitHub PUT ${putRes.status}`);
      }

      const putData = await putRes.json();
      return res.status(200).json({ success: true, sha: putData.content.sha });
    } catch (err) {
      console.error('admin-data POST error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// Структура за замовчуванням при першому запуску
function defaultAdminData() {
  return {
    settings: {
      markupEur: 25,          // надбавка до закупівельної ціни
      markupPercent: 15,      // відсоток роздрібної націнки
      currency: 'UAH',
    },
    overrides: [],
    // overrides — масив для ручного перевизначення ціни/даних товару:
    // { model: 'SUN-5K-SG05LP1-EU', manualPrice: 776, manualAvailability: 'В наявності', skipAutoUpdate: true }
    mobileExportVersion: 1,
    updatedAt: new Date().toISOString(),
  };
}
