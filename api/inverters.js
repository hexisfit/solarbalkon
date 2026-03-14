export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRugOouDlg1Dy8RaUVuAXtJSYl1UI3qpwu-Lhib0OjFBVS6IlM6t-puBvzfWEGRNikipQtU9nXKv5YY/pub?output=csv';
  const PRIVAT_API    = 'https://api.privatbank.ua/p24api/pubinfo?exchange&coursid=5';
  const ADMIN_JSON    = 'https://raw.githubusercontent.com/hexisfit/solarbalkon/main/admin.json';

  const KNOWN_IMGS = [
    'SUN-12K-SG02LP1-EU','SUN-12K-SG05LP3-EU','SUN-3.6K-SG05LP1-EU-AM2-P',
    'SUN-30K-SG02HP3-EU-AM2','SUN-50K-SG01HP3-EU','SUN-5K-SG05LP1-EU',
    'SUN-6K-SG05LP1-EU-AM2-P','SUN-6K-SG05LP3-EU','SUN-8K-SG05LP3-EU',
  ];

  function findImageUrl(model) {
    const exact = KNOWN_IMGS.find(f => f === model);
    if (exact) return `/inverters/${exact}.png`;
    const core = model.replace(/-(EU|AM\d*|SM\d*|AU|US)([-A-Z0-9]*)?$/i, '');
    const partial = KNOWN_IMGS.find(f => f.startsWith(core));
    return partial ? `/inverters/${partial}.png` : null;
  }

  function parseCSV(csv) {
    return csv.split('\n').map(row => {
      const cells = []; let current = ''; let inQuotes = false;
      for (const ch of row) {
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === ',' && !inQuotes) { cells.push(current.trim()); current = ''; }
        else { current += ch; }
      }
      cells.push(current.trim());
      return cells.map(c => c.replace(/^"|"$/g, '').trim());
    });
  }

  function extractKw(model) {
    const m = model.match(/(\d+\.?\d*)K/i);
    return m ? parseFloat(m[1]) : 0;
  }

  try {
    const [sheetRes, privatRes, adminRes] = await Promise.all([
      fetch(SHEET_CSV_URL),
      fetch(PRIVAT_API),
      fetch(ADMIN_JSON).catch(() => null),
    ]);

    if (!sheetRes.ok) throw new Error('Sheet fetch failed: ' + sheetRes.status);
    if (!privatRes.ok) throw new Error('PrivatBank fetch failed');

    const csv   = await sheetRes.text();
    const rates = await privatRes.json();
    const eurSale = parseFloat(rates.find(r => r.ccy === 'EUR')?.sale || 44.0);

    // Load admin.json overrides
    let adminOverrides = {};
    let markupPercent  = 15;
    if (adminRes?.ok) {
      try {
        const adminData = await adminRes.json();
        (adminData.overrides || []).forEach(o => { if (o.model) adminOverrides[o.model] = o; });
        if (adminData.settings?.markupPercent) markupPercent = adminData.settings.markupPercent;
      } catch (e) { console.warn('admin.json parse:', e.message); }
    }

    const rows = parseCSV(csv);
    const inverters = [];

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[0] || r[0] === '') continue;

      const name          = r[0] || '';
      const category      = r[1] || '';
      const manufacturer  = r[2] || '';
      const model         = r[3] || '';
      const phases        = parseInt(r[4]) || 1;
      const specs         = r[5] || '';
      const sourceUrl     = r[6] || '';
      const weight        = parseFloat((r[7] || '').replace(',', '.')) || 0;
      const purchaseEur   = parseFloat((r[8] || '').replace(',', '.')) || 0;
      const clientEur     = parseFloat((r[9] || '').replace(',', '.')) || 0;
      const availability  = r[10] || '';
      const usp           = r[11] || '';
      const productUrl    = r[12] || '';
      const compatibleIds = r[13] || '';

      if (clientEur === 0) continue;

      const kw = extractKw(model);

      // Retail price = col J × (1 + markup%)
      // If purchaseEur === 0 → manually set price, use clientEur as-is
      const retailEur = purchaseEur > 0
        ? Math.round(clientEur * (1 + markupPercent / 100) * 100) / 100
        : clientEur;
      const priceUah = Math.round((retailEur * eurSale) / 100) * 100;

      // Admin overrides
      const ov = adminOverrides[model] || {};
      let finalClientEur = retailEur;
      let finalPriceUah  = priceUah;
      if (ov.skipAutoUpdate && ov.manualPrice > 0) {
        finalClientEur = ov.manualPrice;
        finalPriceUah  = Math.round((ov.manualPrice * eurSale) / 100) * 100;
      }

      const imageUrl = ov.imageUrl || findImageUrl(model);

      inverters.push({
        name:          ov.name          || name,
        category,
        manufacturer,
        model,
        kw,
        phases,
        specs:         ov.specs         || specs,
        sourceUrl,
        weight:        ov.weight        || weight,
        purchaseEur,
        clientEur:     finalClientEur,
        priceUah:      finalPriceUah,
        availability:  ov.manualAvailability || availability,
        usp:           ov.usp           || usp,
        productUrl,
        compatibleIds,
        imageUrl,
      });
    }

    inverters.sort((a, b) => a.phases !== b.phases ? a.phases - b.phases : a.kw - b.kw);

    res.status(200).json({ inverters, eurRate: eurSale, updated: new Date().toISOString() });

  } catch (err) {
    console.error('Inverters API error:', err);
    res.status(500).json({ error: err.message, inverters: [] });
  }
}
