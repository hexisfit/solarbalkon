export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, phone, address, system, panels, components, extras, total } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone required' });
  }

  // Format order message
  const date = new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' });
  const componentsList = (components || []).map(c => `  • ${c.name} × ${c.qty} — ${c.price}`).join('\n');
  const extrasList = (extras || []).map(c => `  • ${c.name} × ${c.qty} — ${c.price}`).join('\n');

  const message = `🔔 НОВЕ ЗАМОВЛЕННЯ — SolarBalkon

👤 Клієнт: ${name}
📞 Телефон: ${phone}
${address ? `📍 Адреса: ${address}` : ''}
📅 Дата: ${date}

⚡ Система: ${system}
☀️ Панелі: ${panels}

🔧 Компоненти:
${componentsList || '  —'}

${extrasList ? `🛒 Додатково:\n${extrasList}` : ''}

💰 Загальна вартість: ${total}
🏦 Кредит 0%: ~${Math.round(parseInt(total?.replace(/\D/g, '') || 0) / 120).toLocaleString('uk-UA')} грн/міс`;

  const results = { telegram: false, email: false };

  // 1. Send to Telegram bot
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (BOT_TOKEN && CHAT_ID) {
    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      });
      results.telegram = tgRes.ok;
    } catch (err) {
      console.error('Telegram error:', err);
    }
  }

  // 2. Send email via Resend (or any configured service)
  const RESEND_KEY = process.env.RESEND_API_KEY;
  const EMAIL_TO = process.env.ORDER_EMAIL || 'manager@solarbalkon.shop';

  if (RESEND_KEY) {
    try {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_KEY}`,
        },
        body: JSON.stringify({
          from: 'SolarBalkon <orders@solarbalkon.shop>',
          to: EMAIL_TO,
          subject: `🔔 Замовлення від ${name} — ${system}`,
          text: message,
        }),
      });
      results.email = emailRes.ok;
    } catch (err) {
      console.error('Email error:', err);
    }
  }

  // At least one channel should work
  if (results.telegram || results.email) {
    res.status(200).json({ success: true, channels: results });
  } else if (!BOT_TOKEN && !RESEND_KEY) {
    // No channels configured — log to console as fallback
    console.log('=== NEW ORDER (no channels configured) ===');
    console.log(message);
    console.log('===========================================');
    res.status(200).json({ success: true, channels: { log: true } });
  } else {
    res.status(500).json({ error: 'Failed to send order' });
  }
}
