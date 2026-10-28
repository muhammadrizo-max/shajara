import React, { useState, useEffect } from 'react';
import { Person, FamilyInvite, AuthUser } from '../types';
import { createFamilyInvite, getFamilyInvites } from '../utils/userAuthStorage';
import { addHistoryRecord } from '../utils/historyStorage';
import { saveInviteToSupabase } from '../utils/supabaseDb';
import { 
  Users, 
  X, 
  Copy, 
  Check, 
  Send, 
  Share2, 
  ShieldCheck, 
  UserPlus, 
  Sparkles, 
  QrCode,
  Link,
  MessageCircle,
  Bot
} from 'lucide-react';

interface InviteFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: Record<string, Person>;
  currentUser?: AuthUser | null;
  onShowToast: (msg: string, type?: 'success' | 'warn') => void;
}

export const InviteFamilyModal: React.FC<InviteFamilyModalProps> = ({
  isOpen,
  onClose,
  people,
  currentUser,
  onShowToast,
}) => {
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [targetPersonId, setTargetPersonId] = useState<string>('');
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [invites, setInvites] = useState<FamilyInvite[]>([]);
  const [latestInvite, setLatestInvite] = useState<FamilyInvite | null>(null);

  useEffect(() => {
    if (isOpen) {
      const stored = getFamilyInvites();
      setInvites(stored);
      if (stored.length > 0 && !latestInvite) {
        setLatestInvite(stored[0]);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const peopleList = Object.values(people) as Person[];
  const currentUrl = window.location.origin + window.location.pathname;

  const handleCreateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const actorName = currentUser?.name || 'Oila a\'zosi';
    const targetPerson = targetPersonId ? people[targetPersonId] : undefined;

    const newInvite = createFamilyInvite({
      invitedByName: actorName,
      invitedByEmail: currentUser?.email,
      targetPersonId: targetPersonId || undefined,
      targetPersonName: targetPerson ? `${targetPerson.name} ${targetPerson.surname || ''}` : undefined,
      role,
      familyTreeName: "7 Ajdod Shajarasi"
    });

    setLatestInvite(newInvite);
    setInvites(getFamilyInvites());

    // Supabase'dagi invite_tokens jadvaliga yozish
    saveInviteToSupabase({
      token: newInvite.code,
      familyId: currentUser?.familyId,
      createdBy: currentUser?.id,
      role: role === 'editor' ? 'editor' : 'viewer',
      inviteType: targetPersonId ? 'person' : 'family',
      targetPersonId: targetPersonId || undefined,
      slotName: targetPerson ? `${targetPerson.name} ${targetPerson.surname || ''}`.trim() : undefined,
      inviterName: actorName,
      createdAt: Date.now(),
    });

    // Tarixga yozish
    addHistoryRecord({
      action: 'member_invited',
      actorName,
      title: "Yangi taklifnoma yaratildi",
      description: `${actorName} tomonidan ${targetPerson ? `"${targetPerson.name}" uchun ` : ''}${role === 'editor' ? 'Tahrirlovchi' : 'Kuzatuvchi'} taklifnomasi yaratildi.`,
      details: `Taklif kodi: ${newInvite.code}`
    });

    onShowToast("Yangi taklif havolasi muvaffaqiyatli yaratildi!", "success");
  };

  const generateInviteUrl = (code: string, personId?: string) => {
    const params = new URLSearchParams();
    params.set('token', code);
    params.set('mode', 'guest');
    if (personId) params.set('personId', personId);
    return `${currentUrl}?${params.toString()}`;
  };

  const generateTelegramBotUrl = (code: string) => {
    return `https://t.me/shajarachi_bot?start=invite_${code}`;
  };

  const handleCopyLink = (invite: FamilyInvite) => {
    const url = generateInviteUrl(invite.code, invite.targetPersonId);
    navigator.clipboard.writeText(url);
    setCopiedInviteId(invite.id);
    onShowToast("Havola nusxalandi! Qarindoshingizga yuboring.", "success");
    setTimeout(() => setCopiedInviteId(null), 3000);
  };

  const handleShareTelegram = (invite: FamilyInvite) => {
    const tgUrl = generateTelegramBotUrl(invite.code);
    const text = encodeURIComponent(
      `Assalomu alaykum! Sizni oilamizning «Shajarachi» shajarasiga taklif qilaman.\n\nBot orqali kirish: ${tgUrl}`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(tgUrl)}&text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Qarindoshlarni Taklif Qilish</h2>
              <p className="text-emerald-100 text-xs">
                Butun oila birgalikda shajara daraxtini tuzishi va to'ldirishi mumkin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* Create Invite Form */}
          <form onSubmit={handleCreateInvite} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3.5">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <span>Yangi Taklifnoma Yaratish</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Biriktiriladigan shaxs */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Kimga taklif yuborilmoqda?
                </label>
                <select
                  value={targetPersonId}
                  onChange={(e) => setTargetPersonId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Ixtiyoriy qarindosh uchun</option>
                  {peopleList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.surname || ''} ({p.generation}-pusht)
                    </option>
                  ))}
                </select>
              </div>

              {/* Ruxsat darajasi */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Ruxsat darajasi
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="editor">Tahrirlovchi (Qo'shish va to'ldirish)</option>
                  <option value="viewer">Kuzatuvchi (Faqat ko'rish)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Maxsus taklif havolasini yaratish</span>
            </button>
          </form>

          {/* Latest Generated Link Box */}
          {latestInvite && (
            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-950 dark:text-emerald-200">
                <span className="flex items-center gap-1.5">
                  <Link className="w-4 h-4 text-emerald-600" />
                  <span>Tayyor taklif havolasi:</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-200">
                  Kod: {latestInvite.code}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/80 text-[11px] font-mono text-slate-700 dark:text-slate-300 break-all select-all">
                {generateInviteUrl(latestInvite.code, latestInvite.targetPersonId)}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleCopyLink(latestInvite)}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {copiedInviteId === latestInvite.id ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Nusxalandi!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Havolani nusxalash</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleShareTelegram(latestInvite)}
                  className="py-2 px-3.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                  title="Telegram orqali qarindoshlarga yuborish"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Telegramda ulashish</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const botLink = `https://t.me/shajarachi_bot?start=invite_${latestInvite.code}`;
                    navigator.clipboard.writeText(botLink);
                    onShowToast("Telegram Bot taklif havolasi nusxalandi!", "success");
                  }}
                  className="py-2 px-3.5 rounded-xl bg-[#24A1DE] hover:bg-[#1E8BC0] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                  title="Telegram Bot orqali taklif havolasi (t.me/shajarachi_bot?start=invite_...)"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Bot Taklif Linki</span>
                </button>
              </div>
            </div>
          )}

          {/* Active Invites List */}
          {invites.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Yaratilgan taklifnomalar ({invites.length})
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {invites.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <span>{inv.targetPersonName ? `Mo'ljal: ${inv.targetPersonName}` : 'Umumiy taklif'}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                          {inv.role === 'editor' ? 'Tahrirlovchi' : 'Kuzatuvchi'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Kodi: {inv.code} • {new Date(inv.createdAt).toLocaleDateString('uz-UZ')}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyLink(inv)}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 transition-colors"
                        title="Nusxalash"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleShareTelegram(inv)}
                        className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-300 hover:bg-sky-200 transition-colors"
                        title="Telegram"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips Info */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs">
            <span className="font-bold">Eslatma:</span> Qarindoshingiz havola orqali saytga kirganda, o'z ism-familiyasi, tug'ilgan sanasi va paroli bilan ro'yxatdan o'tib, oila shajarasiga yangi ma'lumotlarni kiritish huquqiga ega bo'ladi.
          </div>

        </div>

      </div>
    </div>
  );
};
