// /api/export-mobile.js
// Повертає всі дані для мобільного додатку в одному запиті:
// - інвертори та батареї (з /api/inverters)
// - системи та компоненти (з /api/prices)
// - налаштування (з admin.json)
// - курс EUR/UAH

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');

  const BASE = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://solarbalkon.shop';

  try {
    const [invertersRes, pricesRes, adminRes] = await Promise.all([
      fetch(`${BASE}/api/inverters`),
      fetch(`${BASE}/api/prices`),
      fetch(`${BASE}/api/admin-data`),
    ]);

    const invertersData = invertersRes.ok ? await invertersRes.json() : { inverters: [], eurRate: 44 };
    const pricesData    = pricesRes.ok    ? await pricesRes.json()    : { prices: {}, components: [], eurRate: 44 };
    const adminData     = adminRes.ok     ? await adminRes.json()     : {};

    // Розділяємо інвертори і батареї
    const allItems   = invertersData.inverters || [];
    const inverters  = allItems.filter(d => {
      const cat = (d.category || '').toLowerCase();
      return !cat.includes('батар') && !cat.includes('battery') && !cat.includes('bms');
    });
    const batteries  = allItems.filter(d => {
      const cat = (d.category || '').toLowerCase();
      return cat.includes('батар') || cat.includes('battery') || cat.includes('bms');
    });

    return res.status(200).json({
      version: adminData.mobileExportVersion || 1,
      eurRate: invertersData.eurRate || pricesData.eurRate || 44,
      updatedAt: new Date().toISOString(),

      // Комерційні інвертори
      inverters,

      // Батареї
      batteries,

      // Побутові системи + компоненти конфігуратора
      systems: {
        prices: pricesData.prices || {},
        components: pricesData.components || [],
      },

      // Налаштування ціноутворення
      pricingSettings: adminData.settings || {
        markupEur: 25,
        markupPercent: 15,
      },

      // Ручні перевизначення
      overrides: adminData.overrides || [],
    });
  } catch (err) {
    console.error('export-mobile error:', err);
    return res.status(500).json({ error: err.message });
  }
}
