/**
 * Vercel Serverless Function & Express API Handler:
 * /api/contact
 * Foydalanuvchi murojaatlarini Telegram Bot adminiga va kelajakdagi emailga jo'natish
 */
// Murojaat emaili uchun HTML va matnli shablon.
// Foydalanuvchi kiritgan matn doim escape qilinadi (xavfsizlik uchun).

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TG_RE = /^@?[A-Za-z0-9_]{4,}$/;

interface ContactEmailInput {
  contactInfo: string;
  message: string;
  timestamp?: string; // ISO formatdagi vaqt
}

// Forma xabari "[Mavzu: ...]" bilan boshlanishi mumkin, shuni ajratamiz
function splitTopic(message: string): { topic: string; body: string } {
  const m = message.match(/^\[Mavzu:\s*([^\]]+)\]\s*\n*([\s\S]*)$/);
  if (m) return { topic: m[1].replace(/\s+/g, ' ').trim(), body: m[2].trim() };
  return { topic: '', body: message.trim() };
}

function formatTime(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  const s = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tashkent',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
  return `${s} (Toshkent vaqti)`;
}

function buildContactEmail(input: ContactEmailInput) {
  const contact = input.contactInfo.trim();
  const { topic, body } = splitTopic(input.message);
  const time = formatTime(input.timestamp);

  const isEmail = EMAIL_RE.test(contact);
  const isTelegram = !isEmail && TG_RE.test(contact);
  const contactLabel = isEmail ? 'Email' : isTelegram ? 'Telegram' : 'Telefon / boshqa';

  // Javob berish tugmasi
  let ctaHref: string | null = null;
  let ctaLabel: string | null = null;
  if (isEmail) {
    ctaHref = `mailto:${contact}?subject=${encodeURIComponent('Re: Shajarachi.uz murojaati')}`;
    ctaLabel = 'Email orqali javob berish';
  } else if (isTelegram) {
    ctaHref = `https://t.me/${contact.replace(/^@/, '')}`;
    ctaLabel = "Telegram'da yozish";
  }

  const subject = `Yangi murojaat${topic ? `: ${topic}` : ''} | ${contact}`
    .replace(/[\r\n]+/g, ' ')
    .slice(0, 180);

  const html = `<!doctype html>
<html lang="uz">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
  <tr>
    <td style="background:#059669;padding:20px 24px;color:#ffffff;">
      <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.9;">Shajarachi.uz</div>
      <div style="font-size:20px;font-weight:bold;margin-top:4px;">Yangi murojaat</div>
      ${topic ? `<div style="margin-top:10px;display:inline-block;background:rgba(255,255,255,.2);padding:4px 12px;border-radius:999px;font-size:13px;">${esc(topic)}</div>` : ''}
    </td>
  </tr>
  <tr>
    <td style="padding:24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
        <tr>
          <td style="padding:6px 0;color:#64748b;width:150px;">Aloqa (${esc(contactLabel)})</td>
          <td style="padding:6px 0;font-weight:bold;word-break:break-all;">${esc(contact)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;">Vaqt</td>
          <td style="padding:6px 0;">${esc(time)}</td>
        </tr>
      </table>

      <div style="margin-top:18px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.05em;">Xabar</div>
      <div style="margin-top:6px;border-left:4px solid #059669;background:#f8fafc;padding:14px 16px;border-radius:6px;font-size:15px;line-height:1.6;white-space:pre-wrap;">${esc(body)}</div>

      ${ctaHref && ctaLabel ? `<div style="margin-top:22px;"><a href="${esc(ctaHref)}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:11px 18px;border-radius:8px;font-weight:bold;font-size:14px;">${esc(ctaLabel)}</a></div>` : ''}
    </td>
  </tr>
  <tr>
    <td style="padding:14px 24px;background:#f8fafc;color:#64748b;font-size:12px;border-top:1px solid #e2e8f0;">
      Bu xabar shajarachi.uz aloqa formasi orqali avtomatik yuborildi.
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    'Shajarachi.uz: yangi murojaat',
    topic ? `Mavzu: ${topic}` : null,
    `Aloqa (${contactLabel}): ${contact}`,
    `Vaqt: ${time}`,
    '',
    'Xabar:',
    body,
  ]
    .filter((l) => l !== null)
    .join('\n');

  return {
    subject,
    html,
    text,
    replyTo: isEmail ? contact : undefined,
  };
}


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
    const rawContact = (body.contactInfo || body.email || body.phone || body.telegram || '');
    const rawMessage = (body.message || '');

    // Server-side Input Validation & Sanitization
    const contactInfo = String(rawContact).trim().replace(/[\x00-\x1F\x7F]/g, '').slice(0, 150);
    const message = String(rawMessage).trim().slice(0, 3000);
    const timestamp = new Date().toISOString();
    const settings: any = {};

    if (!contactInfo || !message) {
    const sbUrl = process.env.SUPABASE_URL;
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (sbUrl && sbKey) {
      await fetch(`${sbUrl.replace(/\/$/, '')}/rest/v1/contact_messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          email: contactInfo,
          contact_info: contactInfo,
          message,
          sender_name: 'Mehmon',
          status: 'new',
          created_at: timestamp,
        }),
      }).catch(() => {});
    }
    }

    // HTML Injection Oldini olish (Output Escaping)
    const escape = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    const safeContactHtml = escape(contactInfo);
    const safeMessageHtml = escape(message);

    let sentToTelegram = false;
    let sentToEmail = false;

    // 1. Telegram Bot Adminiga yuborish
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID;

    if (botToken && adminChatId) {
      try {
        const text = `📬 *Yangi Murojaat | Shajarachi.uz*\n\n👤 *Aloqa (Telegram / Tel):* \`${contactInfo.replace(/[`*_\\[\\]]/g, '')}\`\n⏰ *Vaqt:* ${timestamp}\n\n💬 *Xabar:*\n${message.replace(/[`*_\\[\\]]/g, '')}`;
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
    const adminEmail = process.env.ADMIN_EMAIL || 'support@shajarachi.uz';
    const emailSubject = `[Shajarachi.uz Murojaat] Yangi xabar: ${contactInfo.slice(0, 60)}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <h2 style="color: #059669; border-bottom: 2px solid #059669; padding-bottom: 8px;">🌳 Shajarachi.uz — Yangi Murojaat</h2>
        <p><strong>Yuboruvchi / Aloqa:</strong> ${safeContactHtml}</p>
        <p><strong>Vaqt:</strong> ${timestamp}</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #059669;">
          <p style="margin: 0; white-space: pre-wrap; color: #1e293b;">${safeMessageHtml}</p>
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
      console.info(`[API Contact] RESEND_API_KEY mavjud emas. Email yuborilmadi.`);
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
