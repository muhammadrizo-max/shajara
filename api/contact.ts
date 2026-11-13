/**
 * Vercel Serverless Function & Express API Handler:
 * /api/contact
 * Foydalanuvchi murojaatlarini Telegram Bot adminiga va kelajakdagi emailga jo'natish
 */
import { buildContactEmail } from '../lib/emailTemplate';

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

export default async function handlerInner(req: any, res: any) {
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
    const mail = buildContactEmail({
      contactInfo,
      message,
      timestamp: new Date().toISOString(),
    });
    const emailSubject = mail.subject;
    const emailHtml = mail.html;

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
            from: process.env.EMAIL_FROM || 'Shajarachi <noreply@send.shajarachi.uz>',
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

export default async function handler(req: any, res: any) {
  try {
    return await handlerInner(req, res);
  } catch (e: any) {
    console.error('[API Contact FATAL]', e);
    return res.status(500).json({
      success: false,
      error: 'XATO: ' + String(e?.stack || e?.message || e).slice(0, 800),
    });
  }
}