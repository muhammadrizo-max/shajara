/**
 * contactService.ts
 * Foydalanuvchi xabarlarini Telegram Bot adminiga va kelajakdagi email manziliga yetkazish
 */

import { CONTACT_SETTINGS } from '../config/contactConfig';
import { supabase } from './supabaseClient';

export interface ContactMessagePayload {
  email: string;
  message: string;
  senderName?: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
  sentToTelegram?: boolean;
  sentToEmail?: boolean;
  error?: string;
}

/**
 * Foydalanuvchi xabarini yuborish
 */
export async function sendContactMessage(payload: ContactMessagePayload): Promise<ContactResponse> {
  const cleanEmail = payload.email.trim();
  const cleanMsg = payload.message.trim();
  const timestamp = new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });

  if (!cleanEmail || !cleanMsg) {
    return {
      success: false,
      message: "Iltimos, email va xabarni to'liq kiriting",
    };
  }

  const record = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    email: cleanEmail,
    message: cleanMsg,
    sender_name: payload.senderName || 'Mehmon',
    created_at: new Date().toISOString(),
    status: 'new',
  };

  // 1. LocalStorage zaxira
  if (CONTACT_SETTINGS.storage.saveToLocalStorage) {
    try {
      const raw = localStorage.getItem('shajarachi_contact_messages') || '[]';
      const list = JSON.parse(raw);
      list.unshift(record);
      localStorage.setItem('shajarachi_contact_messages', JSON.stringify(list.slice(0, 100)));
    } catch (err) {
      console.warn("[Contact] LocalStorage saqlashda ogohlantirish:", err);
    }
  }

  // 2. Supabase bazasiga saqlash
  if (CONTACT_SETTINGS.storage.saveToSupabase && supabase) {
    try {
      await supabase.from('contact_messages').insert([record]);
    } catch (dbErr) {
      console.info("[Contact] Supabase contact_messages yozildi/mavjud emas");
    }
  }

  // 3. Backend /api/contact orqali Telegram bot adminga va emailga yuborish
  let sentToTelegram = false;
  let sentToEmail = false;

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        message: cleanMsg,
        timestamp,
        settings: CONTACT_SETTINGS,
      }),
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      sentToTelegram = !!data.sentToTelegram;
      sentToEmail = !!data.sentToEmail;
    }
  } catch (apiErr) {
    console.warn("[Contact] Backend API ga yuborishda tarmoq xatosi:", apiErr);
  }

  // 4. Agar botToken to'g'ridan-to'g'ri sozlangan bo'lsa, clientdan ham Telegram Bot API ga yuborishga urinish
  if (!sentToTelegram && CONTACT_SETTINGS.telegram.botToken && CONTACT_SETTINGS.telegram.adminChatId) {
    try {
      const text = `📬 *Yangi Murojaat | Shajarachi.uz*\n\n👤 *Yuboruvchi Emaili:* \`${cleanEmail}\`\n⏰ *Vaqt:* ${timestamp}\n\n💬 *Xabar:*\n${cleanMsg}`;
      const tgUrl = `https://api.telegram.org/bot${CONTACT_SETTINGS.telegram.botToken}/sendMessage`;
      await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CONTACT_SETTINGS.telegram.adminChatId,
          text,
          parse_mode: 'Markdown',
        }),
      });
      sentToTelegram = true;
    } catch (tgErr) {
      console.warn("[Contact] Telegram API yuborishda ogohlantirish:", tgErr);
    }
  }

  return {
    success: true,
    message: "Xabaringiz muvaffaqiyatli qabul qilindi! Tez orada aloqaga chiqamiz.",
    sentToTelegram,
    sentToEmail,
  };
}
