/**
 * contactService.ts
 * Mehmon xabarini backend (/api/contact) orqali yuboradi.
 * Bu faylda sirlar yo'q. Bot token, chat ID va email faqat serverda.
 */

export interface ContactMessagePayload {
  contactInfo: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
  sentToTelegram?: boolean;
  sentToEmail?: boolean;
  error?: string;
}

export async function sendContactMessage(payload: ContactMessagePayload): Promise<ContactResponse> {
  const contactInfo = (payload.contactInfo || '').trim().slice(0, 150);
  const message = (payload.message || '').trim().slice(0, 3000);

  if (!contactInfo || !message) {
    return {
      success: false,
      message: "Telegram yoki telefon raqamingiz va xabarni to'liq kiriting",
    };
  }

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactInfo, message }),
    });
    const data = await res.json().catch(() => ({} as any));

    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.error || "Xabar yuborilmadi. Keyinroq urinib ko'ring.",
      };
    }

    return {
      success: true,
      message: "Xabaringiz muvaffaqiyatli qabul qilindi! Tez orada aloqaga chiqamiz.",
      sentToTelegram: !!data.sentToTelegram,
      sentToEmail: !!data.sentToEmail,
    };
  } catch {
    return {
      success: false,
      message: "Tarmoq xatosi. Internetni tekshirib qayta urinib ko'ring.",
    };
  }
}
