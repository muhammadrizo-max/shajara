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

export interface ContactEmailInput {
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

export function buildContactEmail(input: ContactEmailInput) {
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
