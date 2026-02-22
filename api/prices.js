export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS-PgV78c_o0Jf0zJ1jAXtlb7ojQ5OuIFyuM5_xAC6dK0GS2j0I9fEBFVTJzIcXNonVHPRUbmafZsxw/pub?output=csv';
  const PRIVAT_API = 'https://api.privatbank.ua/p24api/pubinfo?exchange&coursid=5';

  // System SKUs (rows 2-4)
  const SYSTEM_SKUS = ['ZDSF2400AC+', 'STREAM AC Pro', 'AE-FS2.0-2H2'];
  const SYSTEM_NAMES = {
    'ZDSF2400AC+': 'Zendure SolarFlow 2400 AC+',
    'STREAM AC Pro': 'EcoFlow STREAM AC Pro',
    'AE-FS2.0-2H2': 'Deye AE-FS2.0-2H2',
  };
  // Column D=Zendure, E=EcoFlow, F=Deye
  const SYSTEM_COLS = { 3: 'zendure', 4: 'ecoflow', 5: 'deye' };

  function parseCSV(csv) {
    return csv.split('\n').map(row => {
      const cells = [];
      let current = '';
      let inQuotes = false;
      for (const ch of row) {
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === ',' && !inQuotes) { cells.push(current.trim()); current = ''; }
        else { current += ch; }
      }
      cells.push(current.trim());
      return cells.map(c => c.replace(/^"|"$/g, '').trim());
    });
  }

  try {
    const [sheetRes, privatRes] = await Promise.all([
      fetch(SHEET_CSV_URL),
      fetch(PRIVAT_API),
    ]);

    if (!sheetRes.ok) throw new Error('Sheet fetch failed');
    if (!privatRes.ok) throw new Error('PrivatBank fetch failed');

    const csv = await sheetRes.text();
    const rates = await privatRes.json();

    const eurRate = rates.find(r => r.ccy === 'EUR');
    const eurSale = eurRate ? parseFloat(eurRate.sale) : 44.0;

    const rows = parseCSV(csv);

    // Parse systems (rows 2-4, indices 1-3)
    const prices = {};
    for (let i = 1; i <= 3 && i < rows.length; i++) {
      const sku = rows[i][1];
      const name = SYSTEM_NAMES[sku];
      const rawPrice = rows[i][6];
      if (name && rawPrice) {
        const eur = parseFloat(rawPrice.replace(',', '.'));
        if (!isNaN(eur)) {
          prices[name] = Math.round((eur * eurSale) / 100) * 100;
        }
      }
    }

    // Parse all components (rows 5+, indices 4+)
    const components = [];
    for (let i = 4; i < rows.length; i++) {
      const name = rows[i][0];
      const sku = rows[i][1];
      const qty = parseInt(rows[i][2]) || 1;
      const rawPrice = rows[i][6];
      const note = (rows[i][7] || '').toLowerCase();

      if (!name || !rawPrice) continue;

      const eur = parseFloat(rawPrice.replace(',', '.'));
      if (isNaN(eur)) continue;

      // Determine compatible systems from columns D, E, F
      const systems = [];
      for (const [colIdx, sysKey] of Object.entries(SYSTEM_COLS)) {
        const val = rows[i][parseInt(colIdx)];
        if (val && val !== '' && val !== '0') {
          systems.push(sysKey);
        }
      }

      const priceUah = Math.round((eur * eurSale) / 100) * 100;
      const optional = note.includes('вибор') || note.includes('вибір');

      components.push({
        name,
        sku,
        qty,
        priceEur: eur,
        priceUah,
        systems: systems.length > 0 ? systems : ['zendure', 'ecoflow', 'deye'],
        optional,
      });
    }

    res.status(200).json({
      prices,
      components,
      eurRate: eurSale,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
