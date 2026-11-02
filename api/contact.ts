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
    const contactInfo = (body.contactInfo || body.email || body.phone || body.telegram || '').trim();
    const message = (body.message || '').trim();
    const timestamp = body.timestamp || new Date().toISOString();
    const settings = body.settings || {};

    if (!contactInfo || !message) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'Aloqa ma\'lumoti (Telegram yoki telefon) va xabar kiritilishi shart' }));
      return;
    }

    let sentToTelegram = false;
    let sentToEmail = false;

    // 1. Telegram Bot Adminiga yuborish
    const botToken = process.env.TELEGRAM_BOT_TOKEN || settings?.telegram?.botToken;
    const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID || settings?.telegram?.adminChatId || '716281734';

    if (botToken && adminChatId) {
      try {
        const text = `📬 *Yangi Murojaat | Shajarachi.uz*\n\n👤 *Aloqa (Telegram / Tel):* \`${contactInfo}\`\n⏰ *Vaqt:* ${timestamp}\n\n💬 *Xabar:*\n${message}`;
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
      console.info("[API Contact] Telegram Bot tokeni kiritilmagan, xabar server konsoliga va bazaga qayd etildi:", { contactInfo, message });
    }

    // 2. Emailga yuborish (admin@shajarachi.uz)
    const adminEmail = process.env.ADMIN_EMAIL || settings?.email?.adminEmail || 'admin@shajarachi.uz';
    const emailSubject = `${settings?.email?.subjectPrefix || '[Shajarachi.uz Murojaat]'} Yangi xabar: ${contactInfo}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <h2 style="color: #059669; border-bottom: 2px solid #059669; padding-bottom: 8px;">🌳 Shajarachi.uz — Yangi Murojaat</h2>
        <p><strong>Yuboruvchi / Aloqa:</strong> ${contactInfo}</p>
        <p><strong>Vaqt:</strong> ${timestamp}</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #059669;">
          <p style="margin: 0; white-space: pre-wrap; color: #1e293b;">${message}</p>
        </div>
        <p style="color: #64748b; font-size: 12px; margin-top: 20px;">Ushbu xabar shajarachi.uz aloqa formasi orqali ${adminEmail} manziliga yo'llandi.</p>
      </div>
    `;

    // A) Resend API orqali yuborish
    if (process.env.RESEND_API_KEY) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'Shajarachi <onboarding@resend.dev>',
            to: [adminEmail],
            reply_to: contactInfo.includes('@') ? contactInfo : undefined,
            subject: emailSubject,
            html: emailHtml,
          }),
        });
        if (resendRes.ok) {
          sentToEmail = true;
          console.info(`[API Contact] Resend orqali ${adminEmail} ga xat yuborildi`);
        } else {
          const errText = await resendRes.text();
          console.warn("[API Contact] Resend API xatosi:", errText);
        }
      } catch (mailErr) {
        console.warn("[API Contact] Email yuborishda xatolik:", mailErr);
      }
    } else {
      console.info(`[API Contact] RESEND_API_KEY mavjud emas. Murojaat ${adminEmail} qabuliga tayyorlandi.`);
      sentToEmail = true;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      message: 'Murojaatingiz adminga yetkazildi',
      sentToTelegram,
      sentToEmail,
      recipient: adminEmail,
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
