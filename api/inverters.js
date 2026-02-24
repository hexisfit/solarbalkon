export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

  const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRugOouDlg1Dy8RaUVuAXtJSYl1UI3qpwu-Lhib0OjFBVS6IlM6t-puBvzfWEGRNikipQtU9nXKv5YY/pub?output=csv';
  const PRIVAT_API = 'https://api.privatbank.ua/p24api/pubinfo?exchange&coursid=5';

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

  // Extract kW from model name, e.g. "SUN-3.6K-..." -> 3.6, "SUN-50K-..." -> 50
  function extractKw(model) {
    const m = model.match(/(\d+\.?\d*)K/i);
    return m ? parseFloat(m[1]) : 0;
  }

  try {
    const [sheetRes, privatRes] = await Promise.all([
      fetch(SHEET_CSV_URL),
      fetch(PRIVAT_API),
    ]);

    if (!sheetRes.ok) throw new Error('Sheet fetch failed: ' + sheetRes.status);
    if (!privatRes.ok) throw new Error('PrivatBank fetch failed');

    const csv = await sheetRes.text();
    const rates = await privatRes.json();

    const eurRate = rates.find(r => r.ccy === 'EUR');
    const eurSale = eurRate ? parseFloat(eurRate.sale) : 44.0;

    const rows = parseCSV(csv);

    // Columns (0-indexed):
    // A(0)=Назва товару (UA), B(1)=Категорія, C(2)=Виробник, D(3)=Модель,
    // E(4)=Кількість фаз, F(5)=Технічні характеристики, G(6)=Посилання на джерело,
    // H(7)=Вага (кг), I(8)=Ціна закупочна, J(9)=Ціна для клієнта (EUR),
    // K(10)=Наявність, L(11)=Ключова перевага (USP), M(12)=Посилання на товар,
    // N(13)=Сумісні товари (ID)

    const inverters = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[0] || r[0] === '') continue;

      const name = r[0] || '';
      const category = r[1] || '';
      const manufacturer = r[2] || '';
      const model = r[3] || '';
      const phases = parseInt(r[4]) || 1;
      const specs = r[5] || '';
      const sourceUrl = r[6] || '';
      const weight = parseFloat((r[7] || '').replace(',', '.')) || 0;
      const purchaseEur = parseFloat((r[8] || '').replace(',', '.')) || 0;
      const clientEur = parseFloat((r[9] || '').replace(',', '.')) || 0;
      const availability = r[10] || '';
      const usp = r[11] || '';
      const productUrl = r[12] || '';
      const compatibleIds = r[13] || '';

      if (clientEur === 0) continue;

      const kw = extractKw(model);
      const priceUah = Math.round((clientEur * eurSale) / 100) * 100;

      inverters.push({
        name,
        category,
        manufacturer,
        model,
        kw,
        phases,
        specs,
        sourceUrl,
        weight,
        clientEur,
        priceUah,
        availability,
        usp,
        productUrl,
        compatibleIds,
      });
    }

    // Sort: 1-phase first (by kW), then 3-phase (by kW)
    inverters.sort((a, b) => {
      if (a.phases !== b.phases) return a.phases - b.phases;
      return a.kw - b.kw;
    });

    res.status(200).json({
      inverters,
      eurRate: eurSale,
      updated: new Date().toISOString(),
    });

  } catch (err) {
    console.error('Inverters API error:', err);
    res.status(500).json({ error: err.message, inverters: [] });
  }
}
