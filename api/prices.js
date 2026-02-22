export default async function handler(req, res) {
  // Allow CORS from our domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600'); // cache 5 min

  const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS-PgV78c_o0Jf0zJ1jAXtlb7ojQ5OuIFyuM5_xAC6dK0GS2j0I9fEBFVTJzIcXNonVHPRUbmafZsxw/pub?output=csv';
  const PRIVAT_API = 'https://api.privatbank.ua/p24api/pubinfo?exchange&coursid=5';

  const SKU_MAP = {
    'ZDSF2400AC+': 'Zendure SolarFlow 2400 AC+',
    'STREAM AC Pro': 'EcoFlow STREAM AC Pro',
    'AE-FS2.0-2H2': 'Deye AE-FS2.0-2H2',
  };

  try {
    const [sheetRes, privatRes] = await Promise.all([
      fetch(SHEET_CSV_URL),
      fetch(PRIVAT_API),
    ]);

    if (!sheetRes.ok) throw new Error('Sheet fetch failed');
    if (!privatRes.ok) throw new Error('PrivatBank fetch failed');

    const csv = await sheetRes.text();
    const rates = await privatRes.json();

    // Get EUR sale rate
    const eurRate = rates.find(r => r.ccy === 'EUR');
    const eurSale = eurRate ? parseFloat(eurRate.sale) : 44.0;

    // Parse CSV
    const rows = csv.split('\n').map(row => {
      const cells = [];
      let current = '';
      let inQuotes = false;
      for (const ch of row) {
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === ',' && !inQuotes) { cells.push(current.trim()); current = ''; }
        else { current += ch; }
      }
      cells.push(current.trim());
      return cells;
    });

    const prices = {};
    for (let i = 1; i <= 3 && i < rows.length; i++) {
      const sku = (rows[i][1] || '').replace(/^"|"$/g, '').trim();
      const rawPrice = (rows[i][6] || '').replace(/^"|"$/g, '').trim();
      const productName = SKU_MAP[sku];
      if (productName && rawPrice) {
        const priceEur = parseFloat(rawPrice.replace(',', '.'));
        if (!isNaN(priceEur)) {
          prices[productName] = Math.round((priceEur * eurSale) / 100) * 100;
        }
      }
    }

    res.status(200).json({
      prices,
      eurRate: eurSale,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
