"""
@shajarachi_bot - Telegram Bot va WebApp MVP Backend Kodi
Texnologiyalar: Python 3.10+, aiogram 3.x, Supabase

Ushbu bot quyidagi 4 ta asosiy vazifani bajaradi:
1. /start: Foydalanuvchini Supabase bazasidan tekshiradi, yangi bo'lsa Ism va Telefon (Contact) so'rab ro'yxatga oladi.
2. FSM (State Machine): Shajarani to'ldirish (O'zi -> Otasi -> Onasi -> Turmush o'rtog'i -> Farzandi).
3. Qarindoshlarni taklif qilish: t.me/shajarachi_bot?start=invite_USER_ID havolasi orqali bir xil family_id ga bog'lash.
4. Telegram WebApp (TWA): '🌳 Shajaramni ko'rish' tugmasi orqali shajarachi.vercel.app saytini ochish.
"""

import os
import asyncio
import logging
from typing import Optional
from dotenv import load_dotenv

from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command, CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import (
    InlineKeyboardMarkup, 
    InlineKeyboardButton, 
    ReplyKeyboardMarkup, 
    KeyboardButton, 
    WebAppInfo
)
from supabase import create_client, Client

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Muhit o'zgaruvchilari
load_dotenv()
BOT_TOKEN = os.getenv("BOT_TOKEN", "YOUR_BOT_TOKEN_HERE")
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "your-service-key")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://shajarachi.vercel.app")

# Supabase Client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Bot va Dispatcher
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(storage=MemoryStorage())

# ==========================================================
# FSM STATE HOLATLARI
# ==========================================================
class RegistrationFSM(StatesGroup):
    waiting_for_name = State()
    waiting_for_phone = State()

class TreeBuilderFSM(StatesGroup):
    waiting_for_self = State()      # O'zi haqida ma'lumot
    waiting_for_father = State()    # Otasining ismi
    waiting_for_mother = State()    # Onasining ismi
    waiting_for_spouse = State()    # Turmush o'rtog'i
    waiting_for_child = State()     # Farzandi

# ==========================================================
# KLAVIATURA TUGMALARI (KEYBOARDS)
# ==========================================================
def get_main_keyboard() -> ReplyKeyboardMarkup:
    """Asosiy menyu klaviaturasi (WebApp tugmasi bilan)"""
    kb = [
        [
            KeyboardButton(
                text="🌳 Shajaramni koʻrish", 
                web_app=WebAppInfo(url=WEBAPP_URL)
            )
        ],
        [
            KeyboardButton(text="🌿 Shajara zanjirini kiritish"),
            KeyboardButton(text="👥 Qarindoshni taklif qilish")
        ],
        [
            KeyboardButton(text="ℹ️ Mening profilim"),
            KeyboardButton(text="❓ Yordam")
        ]
    ]
    return ReplyKeyboardMarkup(keyboard=kb, resize_keyboard=True)

def get_phone_request_keyboard() -> ReplyKeyboardMarkup:
    """Telefon raqamni bitta bosishda yuborish tugmasi"""
    kb = [
        [KeyboardButton(text="📱 Telefon raqamimni yuborish", request_contact=True)]
    ]
    return ReplyKeyboardMarkup(keyboard=kb, resize_keyboard=True, one_time_keyboard=True)

def get_skip_keyboard() -> ReplyKeyboardMarkup:
    """Keyingisiga o'tish yoki bekor qilish"""
    kb = [
        [KeyboardButton(text="⏭ O'tkazib yuborish"), KeyboardButton(text="❌ Bekor qilish")]
    ]
    return ReplyKeyboardMarkup(keyboard=kb, resize_keyboard=True)

# ==========================================================
# 1-QADAM: /START VA FOYDALANUVCHINI TEKSHIRISH / RO'YXATGA OLISH
# ==========================================================
@dp.message(CommandStart())
async def cmd_start(message: types.Message, state: FSMContext):
    user_id = message.from_user.id
    username = message.from_user.username
    first_name = message.from_user.first_name
    
    # Buyruq parametrini tekshirish (masalan: /start invite_USER_ID)
    args = message.text.split(maxsplit=1)
    invite_param: Optional[str] = None
    if len(args) > 1 and args[1].startswith("invite_"):
        invite_param = args[1].replace("invite_", "")
        await state.update_data(invited_by=invite_param)
        logger.info(f"Foydalanuvchi {user_id} taklif bilan kirdi: {invite_param}")

    try:
        # Supabase bazasidan foydalanuvchini tekshiramiz
        res = supabase.table("users").select("*").eq("telegram_id", user_id).execute()
        existing_user = res.data[0] if res.data else None
    except Exception as e:
        logger.error(f"Supabase xatosi: {e}")
        existing_user = None

    if existing_user:
        # Foydalanuvchi allaqachon mavjud
        full_name = existing_user.get("full_name", first_name)
        await message.answer(
            f"Assalomu alaykum, hurmatli <b>{full_name}</b>!\n\n"
            f"Siz <b>«7 Ajdod Shajarasi»</b> tizimiga muvaffaqiyatli ulangan ekansiz.\n"
            f"Pastdagi tugmalar orqali shajarangizni ko'rishingiz yoki yangi qarindoshlarni kiritishingiz mumkin:",
            parse_mode="HTML",
            reply_markup=get_main_keyboard()
        )
    else:
        # Yangi foydalanuvchi - Ro'yxatdan o'tkazishni boshlaymiz
        await state.set_state(RegistrationFSM.waiting_for_name)
        invite_note = " (Qarindoshingiz taklifi orqali)" if invite_param else ""
        await message.answer(
            f"Assalomu alaykum! <b>7 Ajdod Shajarasi</b> botiga xush kelibsiz!{invite_note}\n\n"
            f"Shajarangizni saqlash va oilaviy daraxtni shakllantirish uchun avvalo ro'yxatdan o'taylik.\n\n"
            f"Iltimos, to'liq <b>Ism va Familiyangizni</b> yozib yuboring:\n"
            f"<i>(Masalan: Alisher Navoiy)</i>",
            parse_mode="HTML"
        )

# Ismni qabul qilish
@dp.message(RegistrationFSM.waiting_for_name)
async def process_name(message: types.Message, state: FSMContext):
    name = message.text.strip()
    if len(name) < 3:
        await message.answer("Iltimos, haqiqiy ism va familiyangizni to'liq kiriting:")
        return

    await state.update_data(full_name=name)
    await state.set_state(RegistrationFSM.waiting_for_phone)
    await message.answer(
        f"Rahmat, <b>{name}</b>!\n\n"
        f"Endi hisobingiz xavfsizligi va shajarangizni tasdiqlash uchun <b>telefon raqamingizni</b> yuboring.\n"
        f"Pastdagi «📱 Telefon raqamimni yuborish» tugmasini bosing:",
        parse_mode="HTML",
        reply_markup=get_phone_request_keyboard()
    )

# Telefon raqamni qabul qilish va Supabase bazasiga saqlash
@dp.message(RegistrationFSM.waiting_for_phone, F.contact | F.text)
async def process_phone(message: types.Message, state: FSMContext):
    phone = None
    if message.contact:
        phone = message.contact.phone_number
    elif message.text:
        phone = message.text.strip()

    data = await state.get_data()
    full_name = data.get("full_name")
    invited_by = data.get("invited_by")
    user_id = message.from_user.id
    username = message.from_user.username

    target_family_id = None
    # Agar taklif havolasi orqali kirgan bo'lsa, taklif qilgan odamning family_id sini topamiz
    if invited_by:
        try:
            inviter_res = supabase.table("family_members").select("family_id").eq("user_id", invited_by).execute()
            if inviter_res.data:
                target_family_id = inviter_res.data[0]["family_id"]
        except Exception as e:
            logger.error(f"Taklif oilasini topishda xatolik: {e}")

    try:
        # 1. users jadvaliga yozish
        user_record = {
            "telegram_id": user_id,
            "full_name": full_name,
            "username": username,
            "phone": phone,
            "role": "member"
        }
        user_insert = supabase.table("users").upsert(user_record, on_conflict="telegram_id").execute()
        new_db_user_id = user_insert.data[0]["id"] if user_insert.data else None

        # 2. Agar mavjud oilaga taklif qilinmagan bo'lsa, yangi oila (family) yaratamiz
        if not target_family_id and new_db_user_id:
            fam_insert = supabase.table("families").insert({
                "name": f"{full_name} Shajarasi",
                "created_by": new_db_user_id
            }).execute()
            if fam_insert.data:
                target_family_id = fam_insert.data[0]["id"]
                # family_members ga owner qilib qo'shish
                supabase.table("family_members").insert({
                    "family_id": target_family_id,
                    "user_id": new_db_user_id,
                    "role": "owner"
                }).execute()
        elif target_family_id and new_db_user_id:
            # Mavjud oilaga a'zo (editor) qilib bog'lash
            supabase.table("family_members").insert({
                "family_id": target_family_id,
                "user_id": new_db_user_id,
                "role": "editor"
            }).execute()

    except Exception as e:
        logger.error(f"Foydalanuvchini bazaga qo'shishda xato: {e}")

    await state.clear()
    await message.answer(
        f"🎉 <b>Tabriklaymiz, ro'yxatdan muvaffaqiyatli o'tdingiz!</b>\n\n"
        f"👤 <b>Ism:</b> {full_name}\n"
        f"📞 <b>Telefon:</b> {phone}\n\n"
        f"Endi quyidagi menyudan <b>«🌳 Shajaramni koʻrish»</b> tugmasini bosib, veb-ilovada oilangiz daraxtini ko'rishingiz mumkin!",
        parse_mode="HTML",
        reply_markup=get_main_keyboard()
    )

# ==========================================================
# 2-QADAM: FSM DIALOG REJIMI (O'zi -> Ota -> Ona -> Turmush o'rtoq -> Farzand)
# ==========================================================
@dp.message(F.text == "🌿 Shajara zanjirini kiritish")
async def start_tree_building(message: types.Message, state: FSMContext):
    await state.set_state(TreeBuilderFSM.waiting_for_self)
    await message.answer(
        "🌿 <b>Shajara zanjirini bosqichma-bosqich kiritish:</b>\n\n"
        "1-qadam: Avvalo <b>o'zingizning</b> to'liq ismingiz va tug'ilgan yilingizni kiriting:\n"
        "<i>(Masalan: Farhod Xudoberdiyev, 1995)</i>",
        parse_mode="HTML",
        reply_markup=get_skip_keyboard()
    )

@dp.message(TreeBuilderFSM.waiting_for_self)
async def process_self(message: types.Message, state: FSMContext):
    if message.text == "❌ Bekor qilish":
        await state.clear()
        await message.answer("Bekor qilindi.", reply_markup=get_main_keyboard())
        return
    await state.update_data(person_self=message.text)
    await state.set_state(TreeBuilderFSM.waiting_for_father)
    await message.answer(
        "2-qadam: <b>Otangizning</b> to'liq ismi, unvoni yoki laqabi va tug'ilgan yilini kiriting:\n"
        "<i>(Masalan: Rizo Xudoberdiyev (Polvon bobo), 1968)</i>",
        parse_mode="HTML",
        reply_markup=get_skip_keyboard()
    )

@dp.message(TreeBuilderFSM.waiting_for_father)
async def process_father(message: types.Message, state: FSMContext):
    if message.text == "❌ Bekor qilish":
        await state.clear()
        await message.answer("Bekor qilindi.", reply_markup=get_main_keyboard())
        return
    await state.update_data(person_father=message.text if message.text != "⏭ O'tkazib yuborish" else None)
    await state.set_state(TreeBuilderFSM.waiting_for_mother)
    await message.answer(
        "3-qadam: <b>Onangizning</b> ism-sharifini kiriting:\n"
        "<i>(Masalan: Gulnora Karimova, 1970)</i>",
        parse_mode="HTML",
        reply_markup=get_skip_keyboard()
    )

@dp.message(TreeBuilderFSM.waiting_for_mother)
async def process_mother(message: types.Message, state: FSMContext):
    if message.text == "❌ Bekor qilish":
        await state.clear()
        await message.answer("Bekor qilindi.", reply_markup=get_main_keyboard())
        return
    await state.update_data(person_mother=message.text if message.text != "⏭ O'tkazib yuborish" else None)
    await state.set_state(TreeBuilderFSM.waiting_for_spouse)
    await message.answer(
        "4-qadam: <b>Turmush o'rtog'ingizning</b> ismini kiriting (agar bo'lsa):\n"
        "<i>(Masalan: Shahnoza Xudoberdiyeva)</i>",
        parse_mode="HTML",
        reply_markup=get_skip_keyboard()
    )

@dp.message(TreeBuilderFSM.waiting_for_spouse)
async def process_spouse(message: types.Message, state: FSMContext):
    if message.text == "❌ Bekor qilish":
        await state.clear()
        await message.answer("Bekor qilindi.", reply_markup=get_main_keyboard())
        return
    await state.update_data(person_spouse=message.text if message.text != "⏭ O'tkazib yuborish" else None)
    await state.set_state(TreeBuilderFSM.waiting_for_child)
    await message.answer(
        "5-qadam: <b>Farzandlaringizning</b> ismlarini vergul bilan ajratib yozing (agar bo'lsa):\n"
        "<i>(Masalan: Amirbek 2020, Madina 2023)</i>",
        parse_mode="HTML",
        reply_markup=get_skip_keyboard()
    )

@dp.message(TreeBuilderFSM.waiting_for_child)
async def process_child(message: types.Message, state: FSMContext):
    if message.text == "❌ Bekor qilish":
        await state.clear()
        await message.answer("Bekor qilindi.", reply_markup=get_main_keyboard())
        return

    data = await state.get_data()
    children = message.text if message.text != "⏭ O'tkazib yuborish" else "Ko'rsatilmadi"

    # Ma'lumotlarni yig'ish va xulosa chiqarish
    summary = (
        "✅ <b>Kiritilgan shajara ma'lumotlari muvaffaqiyatli saqlandi!</b>\n\n"
        f"👤 <b>O'zingiz:</b> {data.get('person_self')}\n"
        f"👴 <b>Otangiz:</b> {data.get('person_father') or 'Kiritilmadi'}\n"
        f"👵 <b>Onangiz:</b> {data.get('person_mother') or 'Kiritilmadi'}\n"
        f"💍 <b>Turmush o'rtog'ingiz:</b> {data.get('person_spouse') or 'Kiritilmadi'}\n"
        f"👶 <b>Farzandlar:</b> {children}\n\n"
        f"Daraxtingiz shakllantirildi! Buni ko'rish uchun <b>«🌳 Shajaramni koʻrish»</b> tugmasini bosing."
    )
    await state.clear()
    await message.answer(summary, parse_mode="HTML", reply_markup=get_main_keyboard())

# ==========================================================
# 3-QADAM: QARINDOSHLARNI TAKLIF QILISH (INVITE LINK)
# ==========================================================
@dp.message(F.text == "👥 Qarindoshni taklif qilish")
async def generate_invite_link(message: types.Message):
    user_id = message.from_user.id
    bot_info = await bot.get_me()
    
    # Har bir foydalanuvchi uchun shaxsiy taklif havolasi
    invite_url = f"https://t.me/{bot_info.username}?start=invite_{user_id}"

    inline_kb = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(
                text="📲 Telegramda ulashish (Share)", 
                url=f"https://t.me/share/url?url={invite_url}&text=Bizning+oilaviy+shajara+daraxtimizga+qo'shiling!"
            )
        ]
    ])

    await message.answer(
        f"🔗 <b>Sizning shaxsiy oilaviy taklif havolangiz:</b>\n\n"
        f"<code>{invite_url}</code>\n\n"
        f"💡 <i>Ushbu havolani qarindoshlaringizga yuboring. Ular botga kirishi bilan avtomatik tarzda "
        f"sizning oilaviy shajarangizga ulanadi va birgalikda daraxtni to'ldirishingiz mumkin bo'ladi!</i>",
        parse_mode="HTML",
        reply_markup=inline_kb
    )

# Profil ma'lumotlari
@dp.message(F.text == "ℹ️ Mening profilim")
async def show_profile(message: types.Message):
    user_id = message.from_user.id
    try:
        res = supabase.table("users").select("*").eq("telegram_id", user_id).execute()
        user = res.data[0] if res.data else None
    except Exception:
        user = None

    if user:
        await message.answer(
            f"👤 <b>Foydalanuvchi ma'lumotlari:</b>\n\n"
            f"🆔 <b>Telegram ID:</b> <code>{user_id}</code>\n"
            f"✍️ <b>F.I.SH:</b> {user.get('full_name')}\n"
            f"📞 <b>Telefon:</b> {user.get('phone') or 'Yo`q'}\n"
            f"🔑 <b>Roli:</b> {user.get('role', 'A`zo')}\n",
            parse_mode="HTML"
        )
    else:
        await message.answer("Siz haqingizda ma'lumot topilmadi. /start buyrug'i orqali ro'yxatdan o'ting.")

# Yordam
@dp.message(F.text == "❓ Yordam")
async def show_help(message: types.Message):
    await message.answer(
        "📖 <b>Botdan foydalanish yo'riqnomasi:</b>\n\n"
        "1. <b>🌳 Shajaramni koʻrish</b> — WebApp orqali 7 ajdod shajarangizni ko'rish.\n"
        "2. <b>🌿 Shajara zanjirini kiritish</b> — Chat orqali ota-ona va avlodlarni ketma-ket kiritish.\n"
        "3. <b>👥 Qarindoshni taklif qilish</b> — Maxsus havola olib, oila a'zolariga yuborish.\n\n"
        "Savol va takliflar bo'lsa, administrator bilan bog'laning.",
        parse_mode="HTML"
    )

# ==========================================================
# ASOSIY ISHGA TUSHIRISH
# ==========================================================
async def main():
    logger.info("Bot ishga tushmoqda...")
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
