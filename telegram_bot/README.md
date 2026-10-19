# 🌳 Shajarachi Telegram Bot & Supabase Integratsiyasi

Ushbu yo'riqnoma orqali siz **@shajarachi_bot** Telegram botini ishga tushirishingiz va Supabase ma'lumotlar bazasi bilan to'liq bog'lashingiz mumkin.

---

## 📋 1-Qadam: Supabase Bazasini Sozlash

1. [Supabase.com](https://supabase.com) ga kiring va yangi loyiha (Project) yarating.
2. Chap menyudan **SQL Editor** bo'limiga o'ting.
3. `/supabase/schema.sql` fayli ichidagi barcha SQL kodlarini nusxalab, SQL Editor ga qo'ying va **Run** tugmasini bosing.
4. Bu quyidagi jadvallarni va xavfsizlik (RLS) qoidalarini avtomatik yaratadi:
   - `users`: Foydalanuvchilar (`telegram_id`, `role`, `family_id` bilan)
   - `families`: Oila shajaralari
   - `persons`: Shajaradagi shaxslar (7 ajdod, o'g'il, qiz, vafot/tug'ilgan sana, fotosuratlar)
   - `relationships`: Qarindoshlik aloqalari (`parent-child`, `spouses`)
   - `audit_logs`: Barcha o'zgarishlar tarixi

5. **Project Settings -> API** bo'limiga o'ting va quyidagilarni nusxalang:
   - `Project URL` (`SUPABASE_URL`)
   - `service_role secret key` (`SUPABASE_SERVICE_ROLE_KEY` - bot serveri uchun)
   - `anon public key` (`SUPABASE_ANON_KEY` - sayt frontend uchun)

---

## 🤖 2-Qadam: Telegram Botni Tayyorlash

1. Telegramda [@BotFather](https://t.me/BotFather) ga kiring.
2. `/newbot` buyrug'i orqali yangi bot yarating (masalan: `Shajarachi Bot`, username: `shajarachi_family_bot`).
3. BotFather bergan **HTTP API Token**ni oling (`BOT_TOKEN`).
4. WebApp menyu tugmasini ulash:
   - BotFather ga `/setmenubutton` buyrug'ini yuboring.
   - Botingizni tanlang.
   - Tugma matnini kiriting: `🌳 Shajaramni ko'rish`
   - Saytingiz URL manzilini kiriting: `https://shajarachi.vercel.app` (yoki o'zingizning domeningiz)

---

## 🚀 3-Qadam: Botni Ishga Tushirish

Terminalda quyidagi buyruqlarni bajaring:

```bash
# 1. telegram_bot papkasiga kiring
cd telegram_bot

# 2. Virtual muhit yaratish va faollashtirish
python3 -m venv venv
source venv/bin/activate  # Windows uchun: venv\Scripts\activate

# 3. Kerakli kutubxonalarni o'rnatish
pip install -r requirements.txt

# 4. Muhit o'zgaruvchilarini sozlash
cp .env.example .env
nano .env  # yoki istalgan matn muharririda oching
```

`.env` faylini to'ldiring:
```env
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJh...
WEBAPP_URL=https://shajarachi.vercel.app
```

Botni ishga tushiring:
```bash
python bot.py
```

---

## 🌟 4-Qadam: Bot Qanday Ishlaydi?

1. **/start**:
   - Foydalanuvchini Supabase bazasidan tekshiradi.
   - Yangi bo'lsa, ismi va telefon raqamini (tugma orqali) so'rab ro'yxatdan o'tkazadi va yangi `family_id` biriktiradi.
   - Agar taklif havolasi (`/start invite_USERID`) orqali kirgan bo'lsa, avtomatik ravishda o'sha qarindoshning oilasiga qo'shadi.

2. **Muloqot rejimida shajara tuzish (FSM)**:
   - `➕ Shajara tuzishni boshlash` tugmasi bosilganda:
     1. Foydalanuvchining o'z ma'lumotlari
     2. Otasining ismi va familiyasi
     3. Onasining ismi va familiyasi
     4. Turmush o'rtog'ining ismi
     5. Farzandlari (ketma-ket kiritish)
   - Barcha ma'lumotlar avtomatik Supabase `persons` va `relationships` jadvallariga saqlanadi.

3. **🔗 Qarindoshni taklif qilish**:
   - `🔗 Qarindoshni taklif qilish` tugmasi bosilganda `https://t.me/shajarachi_bot?start=invite_{user_id}` havolasini beradi.
   - Ushbu havola orqali kirgan oila a'zosi shu shajaraga birlashadi va birgalikda tahrir qila oladi.

4. **🌳 WebApp orqali ko'rish**:
   - Telegram WebApp oynasida ochilganda, sayt `@twa-dev/sdk` va `window.Telegram.WebApp.initDataUnsafe` orqali foydalanuvchini hech qanday parolsiz, darhol taniydi va shajarani ochadi.
