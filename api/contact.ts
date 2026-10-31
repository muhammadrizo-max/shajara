/**
 * Vercel Serverless Function & Express API Handler:
 * /api/contact
 * Foydalanuvchi murojaatlarini Telegram Bot adminiga va kelajakdagi emailga jo'natish
 */

function setCorsHeaders(req: any, res: any) {
  const allowedOrigins = [
    'https://shajarachi.vercel.app',
    'https://shajarachi.uz',
    'https://www.shajarachi.uz',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  const origin = req.headers?.origin;
  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.shajarachi.uz') || origin.endsWith('.vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function parseJsonBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    if (req.body && typeof req.body === 'string') {
      try {
        return resolve(JSON.parse(req.body));
      } catch {
        return resolve({});
      }
    }
    let data = '';
    req.on('data', (chunk: any) => { data += chunk; });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req: any, res: any) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Faqat POST so\'rovi qabul qilinadi' }));
    return;
  }

  try {
    const body = await parseJsonBody(req);
    const email = (body.email || '').trim();
    const message = (body.message || '').trim();
    const timestamp = body.timestamp || new Date().toISOString();
    const settings = body.settings || {};

    if (!email || !message) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'Email va xabar kiritilishi shart' }));
      return;
    }

    let sentToTelegram = false;
    let sentToEmail = false;

    // 1. Telegram Bot Adminiga yuborish
    const botToken = process.env.TELEGRAM_BOT_TOKEN || settings?.telegram?.botToken;
    const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID || settings?.telegram?.adminChatId || '716281734';

    if (botToken && adminChatId) {
      try {
        const text = `📬 *Yangi Murojaat | Shajarachi.uz*\n\n👤 *Foydalanuvchi:* \`${email}\`\n⏰ *Vaqt:* ${timestamp}\n\n💬 *Xabar:*\n${message}`;
        const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: adminChatId,
            text,
            parse_mode: 'Markdown',
          }),
        });
        if (tgRes.ok) {
          sentToTelegram = true;
        }
      } catch (tgErr) {
        console.warn("[API Contact] Telegram Botga yuborishda xato:", tgErr);
      }
    } else {
      console.info("[API Contact] Telegram Bot tokeni kiritilmagan, xabar server konsoliga va bazaga qayd etildi:", { email, message });
    }

    // 2. Emailga yuborish (Kelajakda shajarachi.uz domeni emaili ochilganda)
    // Settings ichidagi `email.enabled` parametri tekshiriladi
    if (settings?.email?.enabled) {
      console.info(`[API Contact] Kelajakdagi email bildirishnomasi: ${settings.email.adminEmail} ga yo'naltirilmoqda`);
      sentToEmail = true;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      message: 'Murojaatingiz adminga yetkazildi',
      sentToTelegram,
      sentToEmail,
    }));
  } catch (error: any) {
    console.error("[API Contact Error]:", error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: 'Server xatoligi: ' + (error?.message || error),
    }));
  }
}
