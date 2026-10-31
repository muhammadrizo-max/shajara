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
  AlertCircle,
  Globe
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

  // Unikal generatsiya qilingan tokenlar
  const [generalToken, setGeneralToken] = useState<string>(() => 
    `gen_${Math.random().toString(36).substring(2, 7).toUpperCase()}${Date.now().toString(36).slice(-3).toUpperCase()}`
  );
  const [slotToken, setSlotToken] = useState<string>(() => 
    `slot_${Math.random().toString(36).substring(2, 7).toUpperCase()}${Date.now().toString(36).slice(-3).toUpperCase()}`
  );

  const [copiedBotLink, setCopiedBotLink] = useState<boolean>(false);
  const [copiedWebLink, setCopiedWebLink] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [slotError, setSlotError] = useState<string>('');

  const botUsername = 'shajarachi_bot';
  const officialDomain = 'https://shajarachi.uz';
  const inviterId = currentUser?.telegramId || currentUser?.id || 'admin';
  const inviterName = currentUser?.fullName || currentUser?.name || 'Shajara egasi';

  // 1. Umumiy shajara havolalari
  const generalTgLink = `https://t.me/${botUsername}?start=tree_${generalToken}`;
  const generalWebLink = `${officialDomain}/?invite=tree&token=${generalToken}`;

  // 2. Aynan bir o'ringa taklif havolalari (alohida va mustaqil parametrlar bilan)
  const encodedName = encodeURIComponent(slotPersonName.trim() || 'Qarindosh');
  const encodedRole = encodeURIComponent(slotRelationRole || 'Azo');
  const slotTgLink = `https://t.me/${botUsername}?start=slot_${slotToken}`;
  const slotWebLink = `${officialDomain}/?invite=slot&token=${slotToken}&name=${encodedName}&role=${encodedRole}${
    slotExistingPersonId ? `&node=${encodeURIComponent(slotExistingPersonId)}` : ''
  }`;

  // Aktiv havolalar
  const currentTgLink = inviteType === 'general' ? generalTgLink : slotTgLink;
  const currentWebLink = inviteType === 'general' ? generalWebLink : slotWebLink;
  const activeToken = inviteType === 'general' ? generalToken : slotToken;

  // Supabase'dagi invite_tokens jadvaliga taklifnomani yozish
  useEffect(() => {
    if (!isOpen) return;

    if (inviteType === 'slot' && !slotPersonName.trim()) {
      return; // Bir o'ringa taklifda ism kiritilmaguncha saqlanmaydi
    }

    saveInviteToSupabase({
      token: activeToken,
      familyId: currentUser?.familyId,
      createdBy: currentUser?.id,
      role: 'editor',
      inviteType: inviteType === 'general' ? 'family' : 'person',
      targetPersonId: inviteType === 'slot' ? slotExistingPersonId || undefined : undefined,
      slotName: inviteType === 'slot' ? slotPersonName.trim() : undefined,
      inviterName,
      createdAt: Date.now(),
    });
  }, [isOpen, inviteType, activeToken, slotPersonName, slotRelationRole, slotExistingPersonId, inviterId, inviterName, currentUser?.familyId, currentUser?.id]);

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
      setCopiedBotLink(true);
      setTimeout(() => setCopiedBotLink(false), 2200);
    }
  };

  // Bir tugma bilan ikkala havolani (Telegram va Sayt) yangi token bilan generatsiya qilish
  const handleRegenerateBoth = () => {
    setIsGenerating(true);
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const timeSuffix = Date.now().toString(36).slice(-3).toUpperCase();

    if (inviteType === 'general') {
      setGeneralToken(`gen_${randomSuffix}${timeSuffix}`);
    } else {
      setSlotToken(`slot_${randomSuffix}${timeSuffix}`);
    }

    setTimeout(() => setIsGenerating(false), 300);
  };

  // Telegramda to'g'ridan-to'g'ri ulashish
  const handleShareTelegram = () => {
    if (inviteType === 'slot' && !slotPersonName.trim()) {
      setSlotError("Iltimos, avval taklif qilinayotgan shaxsning ismini kiriting!");
      return;
    }
    setSlotError('');

    const shareText = inviteType === 'general'
      ? `${inviterName} sizni «Shajarachi» (shajarachi.uz) oilaviy shajarasiga taklif qilmoqda!\n\n🤖 Telegram bot orqali: ${generalTgLink}\n🌐 Sayt orqali: ${generalWebLink}`
      : `Salom ${slotPersonName.trim()}! ${inviterName} sizni «Shajarachi» shajarasidagi o'z o'rningizga (${slotRelationRole}) taklif qilmoqda!\n\n🤖 Telegram bot orqali: ${slotTgLink}\n🌐 Sayt orqali: ${slotWebLink}`;

    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(currentTgLink)}&text=${encodeURIComponent(shareText)}`;
    window.open(shareUrl, '_blank');
  };

  const isConfigured = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col z-10 max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-transparent flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#24A1DE] text-white flex items-center justify-center shadow-md shadow-[#24A1DE]/25 shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                  Shajara Taklifnomasi
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#24A1DE]/15 text-[#24A1DE] border border-[#24A1DE]/25">
                  @shajarachi_bot
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                shajarachi.uz va Telegram bot orqali shajaraga ulash
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Supabase status indicator */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-400'}`} />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {isConfigured ? "Supabase zanjiri ulangan (Real-time sync)" : "Shajarachi xavfsiz havolalar tizimi"}
              </span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">shajarachi.uz</span>
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
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  inviteType === 'general'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Umumiy shajaraga</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInviteType('slot');
                  setSlotError('');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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

          {/* 2. Bir o'ringa taklif tanlansa: Ism va Qarindoshlik o'rni */}
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
                    Qarindoshlik o'rni / Bog'liqlik
                  </label>
                  <select
                    value={slotRelationRole}
                    onChange={(e) => setSlotRelationRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Farzand">Farzand (O'g'il / Qiz)</option>
                    <option value="Ota">Ota</option>
                    <option value="Ona">Ona</option>
                    <option value="Aka-Uka">Aka / Uka</option>
                    <option value="Opa-Singil">Opa / Singil</option>
                    <option value="Turmush o'rtoq">Turmush o'rtoq</option>
                    <option value="Nabira">Nabira</option>
                    <option value="Bobo">Bobo</option>
                    <option value="Buvi / Momo">Buvi / Momo</option>
                  </select>
                </div>

                {Object.keys(people).length > 0 && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Mavjud o'ringa bog'lash (Ixtiyoriy)
                    </label>
                    <select
                      value={slotExistingPersonId}
                      onChange={(e) => setSlotExistingPersonId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none"
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

          {/* 3. Havola 1: Telegram Bot Havolasi */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-[#24A1DE]" />
                <span>
                  {inviteType === 'general' ? '1. Telegram Bot Taklif Havolasi' : `1. «${slotPersonName || "Shaxs"}» uchun Telegram Havolasi`}
                </span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">@shajarachi_bot</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 break-all select-all text-xs font-mono text-slate-800 dark:text-slate-200 shadow-inner">
              {currentTgLink}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleCopy(currentTgLink, false)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                  copiedBotLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200'
                }`}
              >
                {copiedBotLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedBotLink ? 'Bot havolasi nusxalandi!' : 'Bot havolasidan nusxa'}</span>
              </button>

              <button
                type="button"
                onClick={handleShareTelegram}
                className="py-2 px-4 rounded-xl bg-[#24A1DE] hover:bg-[#1E8BC0] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                title="Telegram orqali ulashish"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Ulashish</span>
              </button>
            </div>
          </div>

          {/* 4. Havola 2: To'g'ridan-to'g'ri Sayt (shajarachi.uz) Havolasi */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {inviteType === 'general' ? '2. To\'g\'ridan-to\'g\'ri Sayt (shajarachi.uz) Havolasi' : `2. «${slotPersonName || "Shaxs"}» uchun Sayt Havolasi`}
                </span>
              </label>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">shajarachi.uz</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 break-all select-all text-xs font-mono text-slate-800 dark:text-slate-200 shadow-inner">
              {currentWebLink}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleCopy(currentWebLink, true)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                  copiedWebLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                }`}
              >
                {copiedWebLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedWebLink ? 'Sayt havolasi nusxalandi!' : 'Sayt havolasidan nusxa'}</span>
              </button>
            </div>
          </div>

          {/* 5. Bitta tugma: Ikkala havolani yangi unikal token bilan yangilash (Foydalanuvchi talabi) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleRegenerateBoth}
              disabled={isGenerating}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all border border-slate-200/80 dark:border-slate-700/80 cursor-pointer active:scale-95"
            >
              <RotateCw className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Yangi havola generatsiya qilish (Bot va Sayt ikkalasi uchun)</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between flex-shrink-0">
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
            className="py-2 px-5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
