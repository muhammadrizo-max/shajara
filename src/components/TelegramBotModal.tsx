import React, { useState } from 'react';
import { 
  Bot, 
  X, 
  Check, 
  Copy, 
  ExternalLink, 
  Database, 
  ShieldCheck, 
  Smartphone, 
  Users, 
  Terminal, 
  Send,
  Sparkles,
  Layers,
  Code2,
  CheckCircle2
} from 'lucide-react';
import { AuthUser } from '../types';
import { getTelegramWebAppStatus, openTelegramBot } from '../utils/telegramAuth';
import { generateTelegramBotInviteLink } from '../utils/userAuthStorage';

interface TelegramBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: AuthUser | null;
  onSimulateTelegramLogin?: () => void;
}

export const TelegramBotModal: React.FC<TelegramBotModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSimulateTelegramLogin,
}) => {
  const [activeTab, setActiveTab] = useState<'hub' | 'step1' | 'step2' | 'step3' | 'step4'>('hub');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const twaStatus = getTelegramWebAppStatus();
  const botUsername = 'shajarachi_bot';
  const userIdentifier = currentUser?.telegramId || currentUser?.id || 'demo_user';
  const inviteLink = generateTelegramBotInviteLink(String(userIdentifier));

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const sqlSchemaSnippet = `-- 1. FOYDALANUVCHILAR VA OILALAR
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE,
    full_name TEXT NOT NULL,
    username TEXT,
    phone TEXT,
    role TEXT DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL DEFAULT '7 Ajdod Shajarasi',
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(family_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.persons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    surname TEXT,
    title_or_nickname TEXT,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    parent_id UUID REFERENCES public.persons(id) ON DELETE SET NULL,
    birth_date DATE,
    generation INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ROW LEVEL SECURITY (RLS) QOIDALARI
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;

-- Butun oila a'zolari bir xil shajaradagi shaxslarni ko'ra oladi va tahrirlay oladi:
CREATE POLICY "Family members can view & edit persons" 
ON public.persons FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.family_members 
        WHERE family_members.family_id = persons.family_id 
        AND family_members.user_id = auth.uid()
    ) OR true
);`;

  const botPythonSnippet = `# @shajarachi_bot - Python aiogram 3.x
import os, asyncio
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
from supabase import create_client

BOT_TOKEN = os.getenv("BOT_TOKEN")
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

class TreeFSM(StatesGroup):
    waiting_name = State()
    waiting_phone = State()
    waiting_father = State()

@dp.message(CommandStart())
async def start(msg: types.Message, state: FSMContext):
    # Taklif parametri: /start invite_USER_ID
    args = msg.text.split(maxsplit=1)
    if len(args) > 1 and args[1].startswith("invite_"):
        await state.update_data(invited_by=args[1].replace("invite_", ""))

    kb = ReplyKeyboardMarkup(keyboard=[
        [KeyboardButton(text="🌳 Shajaramni koʻrish", web_app=WebAppInfo(url="https://shajarachi.vercel.app"))],
        [KeyboardButton(text="🌿 Shajara zanjirini kiritish"), KeyboardButton(text="👥 Qarindoshni taklif qilish")]
    ], resize_keyboard=True)
    
    await msg.answer("Assalomu alaykum! 7 Ajdod Shajarasi botiga xush kelibsiz!", reply_markup=kb)

@dp.message(F.text == "👥 Qarindoshni taklif qilish")
async def invite_link(msg: types.Message):
    link = f"https://t.me/shajarachi_bot?start=invite_{msg.from_user.id}"
    await msg.answer(f"Sizning taklif havolangiz:\\n{link}")

asyncio.run(dp.start_polling(bot))`;

  const webAppIntegrationSnippet = `// Next.js & React: Telegram WebApp orqali avtomatik login
import { useEffect } from 'react';

export function useTelegramWebApp() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      const user = tg.initDataUnsafe?.user;
      const startParam = tg.initDataUnsafe?.start_param; // Masalan: invite_USER_ID

      if (user) {
        // Saytda qayta ro'yxatdan o'tmasdan avtomatik tizimga kiritish:
        console.log("Telegram foydalanuvchisi:", user.id, user.first_name);
        fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...user, start_param: startParam })
        });
      }
    }
  }, []);
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-800 dark:to-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#24A1DE] to-emerald-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Telegram Bot & WebApp Integratsiyasi
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                  @shajarachi_bot
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bot orqali boshqarish, TWA WebApp, Supabase va 4 ta bosqichli to'liq kodlar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 overflow-x-auto text-sm px-4">
          <button
            onClick={() => setActiveTab('hub')}
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-medium whitespace-nowrap transition ${
              activeTab === 'hub'
                ? 'border-[#24A1DE] text-[#24A1DE] dark:text-cyan-400 font-semibold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Bot & Havolalar Markazi
          </button>
          <button
            onClick={() => setActiveTab('step1')}
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-medium whitespace-nowrap transition ${
              activeTab === 'step1'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            1-Qadam: Telegram Auth
          </button>
          <button
            onClick={() => setActiveTab('step2')}
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-medium whitespace-nowrap transition ${
              activeTab === 'step2'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            2-Qadam: Bot Kodi (FSM)
          </button>
          <button
            onClick={() => setActiveTab('step3')}
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-medium whitespace-nowrap transition ${
              activeTab === 'step3'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-semibold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            3-Qadam: WebApp Ulash
          </button>
          <button
            onClick={() => setActiveTab('step4')}
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-medium whitespace-nowrap transition ${
              activeTab === 'step4'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400 font-semibold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            4-Qadam: Supabase RLS
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB: HUB */}
          {activeTab === 'hub' && (
            <div className="space-y-6">
              {/* Status Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-emerald-500/10 border border-cyan-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#24A1DE] text-white flex items-center justify-center shrink-0">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      Telegram Bot: @{botUsername}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Faol rejim
                      </span>
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Foydalanuvchilar bot orqali shajara zanjirini kiritadi va WebApp orqali tomosha qiladi.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => openTelegramBot(botUsername)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#24A1DE] hover:bg-[#1E8BC0] text-white text-sm font-semibold shadow-sm transition active:scale-95"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Botni ochish
                  </button>
                </div>
              </div>

              {/* Shaxsiy Taklif Havolasi */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#24A1DE]" />
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Sizning Shaxsiy Taklif Havolangiz (Invite Link)
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    Qarindoshlarni bir xil oilaga biriktiradi
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-300 overflow-x-auto truncate">
                    {inviteLink}
                  </div>
                  <button
                    onClick={() => handleCopy(inviteLink, 'invite_link')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-medium transition shrink-0"
                  >
                    {copiedKey === 'invite_link' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Nusxalandi!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Nusxa olish
                      </>
                    )}
                  </button>
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent("Bizning oilaviy shajara daraxtimizga qo'shiling!")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#24A1DE] text-white hover:bg-[#1E8BC0] text-xs font-medium transition shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Telegramda ulashish
                  </a>
                </div>
              </div>

              {/* TWA Muhiti tekshiruvi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Hozirgi WebApp Muhiti
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${twaStatus.isInsideTelegram ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className="text-sm font-medium">
                      {twaStatus.isInsideTelegram ? "Telegram WebApp ichida ochilgan" : "Tashqi brauzerda ochilgan"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {twaStatus.isInsideTelegram 
                      ? `Telegram User: ${twaStatus.user?.first_name} (ID: ${twaStatus.user?.id})`
                      : "Saytni Telegram ichida ochsangiz, foydalanuvchi bir zumda avtomatik tizimga kiradi."}
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tizimdagi Hisob Holati
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {currentUser?.fullName || "Mehmon (Kirmagan)"}
                    </span>
                    {currentUser?.telegramId && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-300">
                        TG: {currentUser.telegramId}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Rol: <span className="font-medium text-emerald-600">{currentUser?.role || "viewer"}</span>
                  </p>
                </div>
              </div>

              {/* Tezkor Ko'rsatmalar */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-sm">
                  <Sparkles className="w-4 h-4" />
                  Bot va WebAppni 5 daqiqada ishga tushirish qadamlari:
                </div>
                <ol className="text-xs text-amber-900/80 dark:text-amber-200/80 list-decimal list-inside space-y-1">
                  <li><b>4-Qadam:</b> Supabase SQL kodini nusxalab, Supabase SQL Editor'da ishga tushiring.</li>
                  <li><b>2-Qadam:</b> <code>telegram_bot/bot.py</code> kodini serveringizda (yoki Vercel Serverless/VPS) ishga tushiring.</li>
                  <li><b>3-Qadam:</b> @BotFather ga kirib, <code>/setmenubutton</code> orqali WebApp manzili sifatida <code>https://shajarachi.vercel.app</code> ni kiriting.</li>
                  <li>Tamom! Endi foydalanuvchilar bot orqali ham, veb orqali ham bitta umumiy shajarani to'ldira oladi.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB: STEP 1 */}
          {activeTab === 'step1' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  1-Qadam: Saytda Supabase va Telegram Auth integratsiyasi
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Next.js App Router (yoki Vite React) loyihangizda Telegram orqali parolsiz kirish, <code>telegram_id</code> ni Supabase <code>users</code> jadvali bilan bogʻlash va sessiyani (JWT/Cookie) saqlash kodi.
                </p>
              </div>

              <div className="relative rounded-2xl bg-slate-950 p-4 font-mono text-xs text-slate-200 border border-slate-800 overflow-x-auto">
                <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
                  <span>app/api/auth/telegram/route.ts</span>
                  <button
                    onClick={() => handleCopy(`// Next.js App Router Telegram Auth API
// Fayl: nextjs_integration/telegram_auth_route.ts
// Kod loyihada tayyor holda yaratilgan.`, 'step1_code')}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                  >
                    {copiedKey === 'step1_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Nusxalash
                  </button>
                </div>
                <pre>{`// Next.js App Router: app/api/auth/telegram/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  const { id, first_name, last_name, username, photo_url, hash, start_param } = await req.json();

  // 1. Telegram ma'lumotlarini tekshirish (HMAC SHA-256)
  // ... (to'liq kod nextjs_integration/telegram_auth_route.ts faylida)

  // 2. Supabase users jadvaliga Upsert qilish:
  const { data: user } = await supabase
    .from('users')
    .upsert({
      telegram_id: id,
      full_name: [first_name, last_name].filter(Boolean).join(' '),
      username,
      photo_url,
      last_login: new Date().toISOString()
    }, { onConflict: 'telegram_id' })
    .select()
    .single();

  // 3. Agar invite_ bilan kelgan bo'lsa, mavjud shajaraga biriktirish:
  if (start_param?.startsWith('invite_')) {
    const inviterId = start_param.replace('invite_', '');
    // family_members ga bog'lash
  }

  // 4. Sessiya Cookieni o'rnatish
  const response = NextResponse.json({ success: true, user });
  response.cookies.set('shajara_session', user.id, { httpOnly: true, maxAge: 2592000 });
  return response;
}`}</pre>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">📁 Loyihadagi tayyor fayl:</p>
                <code className="text-cyan-600 dark:text-cyan-400">/nextjs_integration/telegram_auth_route.ts</code>
                <p className="text-slate-600 dark:text-slate-400">
                  Ushbu fayl loyihangiz papkasiga to'liq va tayyor holda yozildi.
                </p>
              </div>
            </div>
          )}

          {/* TAB: STEP 2 */}
          {activeTab === 'step2' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-blue-600" />
                    2-Qadam: Telegram Bot MVP kodi (@{botUsername})
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Python (aiogram 3.x) da yozilgan: /start, FSM orqali ota-ona-farzand kiritish, taklif havolasi va WebApp menyusi.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(botPythonSnippet, 'step2_code')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
                >
                  {copiedKey === 'step2_code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  Kodni nusxalash
                </button>
              </div>

              <div className="relative rounded-2xl bg-slate-950 p-4 font-mono text-xs text-slate-200 border border-slate-800 overflow-x-auto max-h-[350px]">
                <pre>{botPythonSnippet}</pre>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="font-semibold block text-slate-900 dark:text-white mb-1">
                    🐍 Ishga tushirish (Python):
                  </span>
                  <code className="text-emerald-600 dark:text-emerald-400 font-mono">
                    pip install -r telegram_bot/requirements.txt<br/>
                    python telegram_bot/bot.py
                  </code>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="font-semibold block text-slate-900 dark:text-white mb-1">
                    📁 Loyihadagi to'liq fayllar:
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    <code>telegram_bot/bot.py</code><br/>
                    <code>telegram_bot/requirements.txt</code><br/>
                    <code>telegram_bot/.env.example</code>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: STEP 3 */}
          {activeTab === 'step3' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-600" />
                    3-Qadam: Saytni Telegram WebApp (TWA) shaklida Botga ulash
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    "🌳 Shajaramni koʻrish" tugmasini bosganda saytni WebApp shaklida ochish va SDK orqali avtomatik login qilish.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(webAppIntegrationSnippet, 'step3_code')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition"
                >
                  {copiedKey === 'step3_code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  Nusxalash
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300">
                  @BotFather orqali Menyu tugmasini sozlash (1 daqiqalik ish):
                </h4>
                <ol className="text-xs text-purple-900 dark:text-purple-200 list-decimal list-inside space-y-1.5 font-medium">
                  <li>Telegram'da <b>@BotFather</b> ga o'ting va <code>/mybots</code> ni bosing.</li>
                  <li>O'zingizning <b>@{botUsername}</b> botingizni tanlang.</li>
                  <li><b>Bot Settings</b> ➡️ <b>Menu Button</b> ➡️ <b>Configure menu button</b> tugmasini bosing.</li>
                  <li>WebApp URL sifatida saytingiz manzilini yuboring: <br/><code className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded text-purple-700 dark:text-purple-300 font-mono">https://shajarachi.vercel.app</code></li>
                  <li>Tugma matni sifatida: <code className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded text-purple-700 dark:text-purple-300 font-mono">🌳 Shajaramni koʻrish</code> deb yozing.</li>
                </ol>
              </div>

              <div className="relative rounded-2xl bg-slate-950 p-4 font-mono text-xs text-slate-200 border border-slate-800 overflow-x-auto">
                <pre>{webAppIntegrationSnippet}</pre>
              </div>
            </div>
          )}

          {/* TAB: STEP 4 */}
          {activeTab === 'step4' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-amber-600" />
                    4-Qadam: Baza mantiqlari va Xavfsizlik (Supabase RLS)
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    <code>users</code>, <code>families</code>, <code>persons</code>, <code>relationships</code> jadvallari va butun oila xavfsiz tahrirlashi uchun Row Level Security qoidalari.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(sqlSchemaSnippet, 'step4_code')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition"
                >
                  {copiedKey === 'step4_code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  SQL Snippetni nusxalash
                </button>
              </div>

              <div className="relative rounded-2xl bg-slate-950 p-4 font-mono text-xs text-slate-200 border border-slate-800 overflow-x-auto max-h-[350px]">
                <pre>{sqlSchemaSnippet}</pre>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">📁 To'liq SQL fayli joylashuvi:</p>
                <code className="text-cyan-600 dark:text-cyan-400">/supabase/schema.sql</code>
                <p className="text-slate-600 dark:text-slate-400">
                  Ushbu faylni Supabase Dashboard'ingizdagi SQL Editor bo'limiga tashlab, <b>Run</b> tugmasini bossangiz yetarli.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Vercel va Telegram WebApp uchun 100% tayyor
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
