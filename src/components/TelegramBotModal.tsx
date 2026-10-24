import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Check, 
  Copy, 
  Send, 
  RotateCw, 
  Users, 
  UserPlus, 
  Sparkles,
  Link2,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { AuthUser, Person } from '../types';
import { saveInviteToSupabase, isSupabaseConfigured } from '../utils/supabaseDb';

interface TelegramBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: AuthUser | null;
  people?: Record<string, Person>;
  onSimulateTelegramLogin?: () => void;
}

export const TelegramBotModal: React.FC<TelegramBotModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  people = {},
}) => {
  // Taklif turi: 'general' (umumiy shajaraga) yoki 'slot' (aynan bir o'ringa)
  const [inviteType, setInviteType] = useState<'general' | 'slot'>('general');

  // Bir o'ringa taklif qilish uchun maydonlar
  const [slotPersonName, setSlotPersonName] = useState<string>('');
  const [slotRelationRole, setSlotRelationRole] = useState<string>('Farzand');
  const [slotExistingPersonId, setSlotExistingPersonId] = useState<string>('');

  // Generatsiya qilingan kod va havola
  const [generalCode, setGeneralCode] = useState<string>(() => 
    Math.random().toString(36).substring(2, 8).toUpperCase()
  );
  const [slotCode, setSlotCode] = useState<string>(() => 
    Math.random().toString(36).substring(2, 8).toUpperCase()
  );

  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedWebLink, setCopiedWebLink] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [slotError, setSlotError] = useState<string>('');

  const botUsername = 'shajarachi_bot';
  const inviterId = currentUser?.telegramId || currentUser?.id || 'demo_user';
  const inviterName = currentUser?.fullName || currentUser?.name || 'Shajara egasi';

  // Hozirgi aktiv kod va havolalarni hisoblash
  const currentCode = inviteType === 'general' ? generalCode : slotCode;
  const startParam = inviteType === 'general' ? `invite_${currentCode}` : `slot_${currentCode}`;
  const telegramBotLink = `https://t.me/${botUsername}?start=${startParam}`;

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://shajarachi.vercel.app';
  const webAppLink = inviteType === 'general'
    ? `${originUrl}/?invite=${currentCode}`
    : `${originUrl}/?invite=${currentCode}&slot=${currentCode}&name=${encodeURIComponent(slotPersonName.trim() || 'Azo')}`;

  // Supabase'ga taklifnomani yozish
  useEffect(() => {
    if (!isOpen) return;

    if (inviteType === 'slot' && !slotPersonName.trim()) {
      return; // Bir o'ringa taklifda ism kiritilmaguncha saqlanmaydi
    }

    saveInviteToSupabase({
      code: currentCode,
      inviterId,
      inviterName,
      inviteType,
      slotName: inviteType === 'slot' ? slotPersonName.trim() : undefined,
      slotPersonId: inviteType === 'slot' ? slotExistingPersonId || undefined : undefined,
      createdAt: Date.now(),
    });
  }, [isOpen, inviteType, currentCode, slotPersonName, slotExistingPersonId, inviterId, inviterName]);

  if (!isOpen) return null;

  // Nusxa olish
  const handleCopy = (text: string, isWeb = false) => {
    if (inviteType === 'slot' && !slotPersonName.trim()) {
      setSlotError("Iltimos, avval taklif qilinayotgan shaxsning ismini kiriting!");
      return;
    }
    setSlotError('');
    navigator.clipboard.writeText(text);
    if (isWeb) {
      setCopiedWebLink(true);
      setTimeout(() => setCopiedWebLink(false), 2200);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  // Yangi havola generatsiya qilish
  const handleRegenerate = () => {
    setIsGenerating(true);
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    if (inviteType === 'general') {
      setGeneralCode(newCode);
    } else {
      setSlotCode(newCode);
    }
    setTimeout(() => setIsGenerating(false), 300);
  };

  // Telegramda ulashish
  const handleShareTelegram = () => {
    if (inviteType === 'slot' && !slotPersonName.trim()) {
      setSlotError("Iltimos, avval taklif qilinayotgan shaxsning ismini kiriting!");
      return;
    }
    setSlotError('');

    const shareText = inviteType === 'general'
      ? `${inviterName} sizni «7 Ajdod Shajarasi» oilaviy shajarasiga taklif qilmoqda! Havola orqali botga kiring:`
      : `Salom ${slotPersonName.trim()}! ${inviterName} sizni oilaviy shajaradagi o'z o'rningizni to'ldirishga taklif qilmoqda:`;

    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(telegramBotLink)}&text=${encodeURIComponent(shareText)}`;
    window.open(shareUrl, '_blank');
  };

  const isConfigured = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col z-10">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-sky-500/10 via-teal-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#24A1DE] text-white flex items-center justify-center shadow-md">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Telegram Bot Taklifnomasi
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#24A1DE]/15 text-[#24A1DE]">
                  @shajarachi_bot
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Qarindoshlarni bot va sayt orqali shajaraga ulash
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Supabase status indicator */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-400'}`} />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {isConfigured ? "Supabase zanjiri ulangan (Real-time sync)" : "Supabase integratsiyasi faol"}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Bot & Sayt sinxron</span>
          </div>

          {/* 1. Taklif turini tanlash (Umumiy yoki Aynan bir o'rin) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Taklif turini tanlang:
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setInviteType('general');
                  setSlotError('');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  inviteType === 'general'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Umumiy shajara</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInviteType('slot');
                  setSlotError('');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  inviteType === 'slot'
                    ? 'bg-white dark:bg-slate-900 text-[#24A1DE] shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Aynan bir o'ringa</span>
              </button>
            </div>
          </div>

          {/* 2. Bir o'ringa taklif tanlansa: Ism va shaxs ma'lumotlari */}
          {inviteType === 'slot' && (
            <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#24A1DE]" />
                <span className="text-xs font-bold text-sky-950 dark:text-sky-200">
                  Taklif qilinayotgan shaxs ma'lumotlari
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Shaxsning ismi (kamida ismini kiriting) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Olimjon, Dilnoza, Rustam"
                  value={slotPersonName}
                  onChange={(e) => {
                    setSlotPersonName(e.target.value);
                    if (e.target.value.trim()) setSlotError('');
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-sky-300 dark:border-sky-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#24A1DE]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Qarindoshlik o'rni
                  </label>
                  <select
                    value={slotRelationRole}
                    onChange={(e) => setSlotRelationRole(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Farzand">Farzand (O'g'il/Qiz)</option>
                    <option value="Ota">Ota (Bosh bo'g'in)</option>
                    <option value="Aka-Uka">Aka / Uka</option>
                    <option value="Opa-Singil">Opa / Singil</option>
                    <option value="Turmush o'rtoq">Turmush o'rtoq</option>
                    <option value="Nabira">Nabira</option>
                  </select>
                </div>

                {Object.keys(people).length > 0 && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Mavjud bo'sh o'ringa bog'lash (Ixtiyoriy)
                    </label>
                    <select
                      value={slotExistingPersonId}
                      onChange={(e) => setSlotExistingPersonId(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="">Yangi bo'sh o'rin</option>
                      {(Object.values(people) as Person[]).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.surname || ''} ({p.generation}-pusht)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {slotError && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{slotError}</span>
            </div>
          )}

          {/* 3. Havola bloki (Image 2 muammosi: link to'liq tepada, tugmalar esa pastda) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-[#24A1DE]" />
                <span>
                  {inviteType === 'general' ? 'Umumiy Taklif Havolasi' : `«${slotPersonName || "Shaxs"}» uchun Taklif Havolasi`}
                </span>
              </label>
              <span className="text-[10px] text-slate-400">Telegram Deep Link</span>
            </div>

            {/* Havola matni to'liq ko'rinadigan qilib joylashtirilgan */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 break-all select-all text-xs font-mono text-slate-800 dark:text-slate-200 leading-relaxed shadow-inner">
              {telegramBotLink}
            </div>

            {/* Havola tagidagi 3 ta asosiy harakat tugmasi: Nusxalash, Telegramda ulashish, Yangi generatsiya */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              {/* 1. Nusxa olish */}
              <button
                type="button"
                onClick={() => handleCopy(telegramBotLink, false)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                  copiedLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Nusxa olindi!' : 'Nusxa olish'}</span>
              </button>

              {/* 2. Telegramda ulashish */}
              <button
                type="button"
                onClick={handleShareTelegram}
                className="py-2.5 px-3 rounded-xl bg-[#24A1DE] hover:bg-[#1E8BC0] active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>Telegramda ulashish</span>
              </button>

              {/* 3. Yangi generatsiya */}
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={isGenerating}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                title="Yangi unikal havola generatsiya qilish"
              >
                <RotateCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>Yangi generatsiya</span>
              </button>
            </div>
          </div>

          {/* Web App to'g'ridan-to'g'ri havolasi */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500">
                To'g'ridan-to'g'ri sayt (Web App) havolasi:
              </span>
              <button
                type="button"
                onClick={() => handleCopy(webAppLink, true)}
                className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
              >
                {copiedWebLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedWebLink ? 'Nusxalandi!' : 'Sayt havolasidan nusxa'}</span>
              </button>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-[11px] font-mono text-slate-600 dark:text-slate-400 truncate select-all">
              {webAppLink}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between">
          <a
            href={`https://t.me/${botUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-[#24A1DE] hover:underline flex items-center gap-1"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>@shajarachi_bot ni ochish</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
