export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'no-store');

  const SPREADSHEET_ID  = process.env.DOLYA_SPREADSHEET_ID;
  const REFRESH_TOKEN   = process.env.GOOGLE_REFRESH_TOKEN;
  const CLIENT_ID       = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET   = process.env.GOOGLE_CLIENT_SECRET;

  if (!SPREADSHEET_ID || !REFRESH_TOKEN || !CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).json({ error: 'Missing env vars', items: [] });
  }

  const wantCsv = req.query.format === 'csv';

  const SHEETS = [
    {
      name: 'Інвертори Мережеві',
      range: 'Інвертори Мережеві!A7:N200',
      category: 'Інвертори Мережеві',
      priceCol: 11, availCol: 13,
      map: (r) => ({ power_kw: r[4], phases: r[5], _dw: r[6], type: r[8] }),
    },
    {
      name: 'Інвертори Гібридні',
      range: 'Інвертори Гібридні!A7:N200',
      category: 'Інвертори Гібридні',
      priceCol: 11, availCol: 13,
      map: (r) => ({ power_kw: r[4], phases: r[5], batt_voltage_v: r[6], _dw: r[7], type: r[8] }),
    },
    {
      name: 'Акумулятори Високовольтні',
      range: 'Акумулятори Високовольтні!A7:N200',
      category: 'Акумулятори Високовольтні',
      priceCol: 11, availCol: 13,
      map: (r) => ({ capacity_kwh: r[4], capacity_ah: r[5], voltage_v: r[6], cycles: r[7], hv_lv: r[8] }),
    },
    {
      name: 'Акумулятори Низьковольтні',
      range: 'Акумулятори Низьковольтні!A7:N200',
      category: 'Акумулятори Низьковольтні',
      priceCol: 11, availCol: 13,
      map: (r) => ({ capacity_kwh: r[4], capacity_ah: r[5], voltage_v: r[6], cycles: r[7], hv_lv: r[8] }),
    },
    {
      name: 'Фотомодулі та Кабель',
      range: 'Фотомодулі та Кабель!A7:N200',
      category: 'Фотомодулі та Кабель',
      priceCol: 11, availCol: 13,
      map: (r) => ({ power_kw: r[4], dims: r[5], weight: r[6], frame: r[7], panel_type: r[8] }),
    },
    {
      name: 'Системи Накопичення Енергії (ESS)',
      range: "'Системи Накопичення Енергії (ESS)'!A7:N200",
      category: 'Системи Накопичення Енергії',
      priceCol: 11, availCol: 13,
      map: (r) => ({ power_kw: r[4], capacity_kwh: r[5], cycles: r[6], phases: r[7], hv_lv: r[8] }),
    },
    {
      name: 'Модульні Системи "Все в Одному"',
      range: `'Модульні Системи "Все в Одному"'!A7:N200`,
      category: 'Модульні Системи Все в Одному',
      priceCol: 11, availCol: 13,
      map: (r) => ({ power_kw: r[4], capacity_kwh: r[5], cycles: r[6], phases: r[7], hv_lv: r[8] }),
    },
    {
      name: 'Комплекти АКБ',
      range: 'Комплекти АКБ!A7:N200',
      category: 'Комплекти АКБ',
      priceCol: 11, availCol: 13,
      map: (r) => ({ capacity_kwh: r[4], capacity_ah: r[5], voltage_v: r[6], cycles: r[7], hv_lv: r[8] }),
    },
    {
      name: 'Готові Комплекти Резервного Живлення',
      range: 'Готові Комплекти Резервного Живлення!A7:M200',
      category: 'Готові Комплекти Резервного Живлення',
      priceCol: 10, availCol: 12,
      map: (r) => ({ power_kw: r[4], capacity_kwh: r[5], type: r[6], phases: r[7] }),
    },
    {
      name: 'Зарядні Станції',
      range: 'Зарядні Станції!A7:M200',
      category: 'Зарядні Станції',
      priceCol: 8, availCol: 10,
      map: (r) => ({ power_kw: r[4], capacity_wh: r[5] }),
    },
  ];

  const cs = (v) => v != null ? String(v).replace(/\s+/g, ' ').trim() : '';
  const cn = (v) => {
    if (v == null || v === '') return null;
    const n = parseFloat(String(v).replace(/[\s\u00A0]/g, '').replace(',', '.'));
    return isNaN(n) ? null : Math.round(n * 100) / 100;
  };
  const brand = (name, sku) => {
    const s = (sku || '').toUpperCase().trim();
    const n = (name || '').toLowerCase();

    // ── DAH SOLAR ─────────────────────────────────────────
    if (s.startsWith('DHN') || s.startsWith('DHT')) return 'DAH Solar';

    // ── LONGI ─────────────────────────────────────────────
    if (s.startsWith('LR8-66HGD')) return 'Longi';

    // ── JA SOLAR ──────────────────────────────────────────
    if (s.startsWith('JAM72D40')) return 'JA Solar';

    // ── JSDSOLAR ──────────────────────────────────────────
    if (['J12100LY','J24100','J12100','J12200','J24230','BG48100'].some(p => s.includes(p))) return 'JSDSolar';

    // ── DYNESS ────────────────────────────────────────────
    if (s.startsWith('BX51100') || s.includes('DYNESS') || s.includes('DL5.0C') ||
        s.includes('POWERBRICK') || s.includes('S51100') || s.includes('SBDU') ||
        s.includes('HV4F') || s.includes('BDU_HV4F') || s.includes('HUB_HV4F') ||
        s.includes('BR_11SHV4F')) return 'Dyness';

    // ── FLASHFISH ─────────────────────────────────────────
    if (s.startsWith('FF') || s.startsWith('F132') || n.includes('flashfish')) return 'FlashFish';

    // ── AGENT ─────────────────────────────────────────────
    const agentSkus = ['HSI_3500','HSI_5500','HSI_3500-WF','HSI_5500-WF',
      'SP-ESS','J3000L-24','J5500HP','51_2V100AH','24V200AH',
      'SP-ESS-5K-5K','SP-ESS-5K-5K-A3','24V200AH_4U','J24230','WI-FI MODULE AGENT'];
    if (agentSkus.some(p => s.includes(p)) || n.includes('agent')) return 'AGENT';

    // ── DEYE ──────────────────────────────────────────────
    const deyeSkus = [
      'SUN-','DEYE','BOS-G','BOS-A','GB-S','GB-L','MGB-L',
      'SE-G5.1PRO','SE-F5','SE-F12','SE-F16','RW-M','RW-F',
      'AI-W5.1','AE-F2.0','SUN M1000','BK01','GE-F',
      'ASM20','ASM02','HVB750','3U-HRACK','3U-LRACK',
      'BOS-GM5.1','BOS-G-PDU','BOS-A-PDU','BOS-A-RACK',
      'GB-S10K','GB-S20K','GB-SL','GB-L-HVCBWS','GB-L-BB',
    ];
    if (deyeSkus.some(p => s.includes(p)) || n.includes('deye')) return 'Deye';

    // ── По названию ───────────────────────────────────────
    if (n.includes('longi')) return 'Longi';
    if (n.includes('ja solar')) return 'JA Solar';
    if (n.includes('ecoflow')) return 'EcoFlow';

    return '';
  };
  const dw = (s) => {
    const str = cs(s);
    return {
      dims:   (str.match(/^([^,]+)/)?.[1] || str).trim(),
      weight: str.match(/([\d.]+)\s*кг/)?.[1] || '',
    };
  };
  const stock = (v) => {
    const s = cs(v).toLowerCase().trim();
    if (s === 'є в наявності')    return 5;
    if (s === 'закінчуються')     return 1;
    return null;
  };

  async function getAccessToken() {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'refresh_token',
        refresh_token: REFRESH_TOKEN,
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });
    const data = await r.json();
    if (!data.access_token) throw new Error('Token refresh failed: ' + JSON.stringify(data));
    return data.access_token;
  }

  async function fetchAll(token) {
    const params = SHEETS.map(s => `ranges=${encodeURIComponent(s.range)}`).join('&');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchGet?${params}&valueRenderOption=FORMATTED_VALUE`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) {
      const txt = await r.text();
      throw new Error(`Sheets API ${r.status}: ${txt.slice(0, 300)}`);
    }
    return r.json();
  }

  function parseSheet(rows, sheet) {
    const items = [];
    for (const row of rows || []) {
      while (row.length < 14) row.push('');
      const sku  = cs(row[2]);
      const name = cs(row[3]);
      if (!sku && !name) continue;
      const price = cn(row[sheet.priceCol]);
      if (!price) continue;

      const extra = sheet.map(row);
      const item  = {
        category:         sheet.category,
        brand:            brand(name, sku),
        sku,
        name,
        price_dealer_usd: price,
        availability:     stock(row[sheet.availCol]),
      };

      if (extra._dw !== undefined) {
        const d = dw(extra._dw);
        item.dims   = d.dims;
        item.weight = d.weight;
        delete extra._dw;
      }

      for (const [k, v] of Object.entries(extra)) {
        if (v === undefined || v === '') continue;
        const num = cn(v);
        item[k] = num !== null ? num : cs(v);
      }

      items.push(item);
    }
    return items;
  }

  try {
    const token    = await getAccessToken();
    const data     = await fetchAll(token);
    const allItems = [];
    const errors   = [];

    for (let i = 0; i < SHEETS.length; i++) {
      try {
        allItems.push(...parseSheet(data.valueRanges?.[i]?.values, SHEETS[i]));
      } catch (e) {
        errors.push({ sheet: SHEETS[i].name, error: e.message });
      }
    }

    if (wantCsv) {
      const COLS = ['category','brand','sku','name','price_dealer_usd','availability',
                    'type','phases','batt_voltage_v','power_kw','capacity_kwh',
                    'capacity_ah','voltage_v','cycles','hv_lv','dims','weight',
                    'panel_type','frame','capacity_wh'];
      const esc = v => {
        const s = v == null ? '' : String(v);
        return (s.includes(',') || s.includes('"') || s.includes('\n'))
          ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const csv = [COLS.join(','), ...allItems.map(item => COLS.map(c => esc(item[c])).join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="solarbalkon_pricelist_${new Date().toISOString().slice(0,10)}.csv"`);
      return res.status(200).send('\uFEFF' + csv);
    }

    return res.status(200).json({
      ok: true,
      total: allItems.length,
      updatedAt: new Date().toISOString(),
      errors: errors.length ? errors : undefined,
      items: allItems,
    });

  } catch (err) {
    console.error('Pricelist error:', err);
    return res.status(500).json({ ok: false, error: err.message, items: [] });
  }
}
