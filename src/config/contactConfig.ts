/**
 * =======================================================================
 * SHAJARACHI (shajarachi.uz) — ALOQA VA XABARNOMALAR SOZLAMASI
 * =======================================================================
 * Foydalanuvchilar Landing Page'dagi "Biz bilan bog'laning" formasi orqali
 * xabar yozganda qayerga borishini boshqarish fayli.
 */

export const CONTACT_SETTINGS = {
  // -------------------------------------------------------------------
  // 1. TELEGRAM BOT ADMIN XABARNOMALARI (Hozirda faol)
  // -------------------------------------------------------------------
  telegram: {
    // Shajarachi rasmiy boti username'i
    botUsername: 'shajarachi_bot',

    // Bot tokeni (Agar bevosita Telegram Bot API orqali adminga yubormoqchi bo'lsangiz)
    // @BotFather dan olingan bot tokenini shu yerga yozishingiz yoki .env faylga qo'yishingiz mumkin:
    botToken: (typeof process !== 'undefined' && process.env?.TELEGRAM_BOT_TOKEN) || '',

    // Admin Telegram Chat ID (Sizning shaxsiy telegram ID'ingiz yoki admin guruhi ID'si)
    // Telegramda @userinfobot yoki @getmyid_bot orqali o'z ID'ingizni bilib olib shu yerga yozasiz:
    adminChatId: '716281734', // Sizning Telegram ID'ingiz

    // Admin panelga xabar yuborish yoqilganligi
    enabled: true,
  },

  // -------------------------------------------------------------------
  // 2. EMAIL XABARNOMALARI (shajarachi.uz maxsus emaili uchun)
  // -------------------------------------------------------------------
  // Kelajakda shajarachi.uz uchun maxsus email ochganingizda:
  // 1) `enabled: true` qilasiz
  // 2) `adminEmail` ga o'z emailingizni (masalan: info@shajarachi.uz yoki admin@shajarachi.uz) yozasiz
  // Bo'ldi! Tizim avtomatik ravishda xabarlarni emailga ham yo'naltiradi.
  email: {
    enabled: false, // Kelajakda email ochilganda buni `true` ga o'zgartirasiz
    adminEmail: 'info@shajarachi.uz', // Kelajakdagi rasmiy email manzilingiz
    senderName: 'Shajarachi Portali',
    subjectPrefix: '[Shajarachi.uz Murojaat]',
  },

  // -------------------------------------------------------------------
  // 3. MA'LUMOTLAR BAZASI VA ZAXIRA SAQLASH
  // -------------------------------------------------------------------
  storage: {
    saveToSupabase: true, // Supabase 'contact_messages' jadvaliga yozish
    saveToLocalStorage: true, // Brauzer xotirasiga zaxira nusxasini saqlash
  }
};
