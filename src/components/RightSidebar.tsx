import React from 'react';
import { 
  X, 
  User, 
  UserPlus, 
  Bot, 
  BarChart3, 
  History, 
  ShieldCheck, 
  FileText, 
  LogOut, 
  Key, 
  Phone, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { AuthUser, Person } from '../types';

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: AuthUser | null;
  me?: Person | null;
  peopleCount: number;
  onOpenLoginModal: () => void;
  onOpenInviteModal: () => void;
  onOpenTelegramBotModal: () => void;
  onOpenStatsModal: () => void;
  onOpenHistoryModal: () => void;
  onOpenPolicy: (type: 'privacy' | 'terms' | 'offer' | 'consent') => void;
  onRequestLogout: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  isOpen,
  onClose,
  currentUser,
  me,
  peopleCount,
  onOpenLoginModal,
  onOpenInviteModal,
  onOpenTelegramBotModal,
  onOpenStatsModal,
  onOpenHistoryModal,
  onOpenPolicy,
  onRequestLogout,
}) => {
  if (!isOpen) return null;

  const displayName = currentUser?.fullName || (currentUser?.name ? `${currentUser.name} ${currentUser.surname || ''}` : (me ? `${me.name} ${me.surname || ''}` : 'Mehmon'));
  const avatarLetter = currentUser?.name ? currentUser.name.charAt(0) : (me ? me.name.charAt(0) : 'U');
  const roleName = currentUser?.role === 'owner' 
    ? 'Shajara Asoschisi (Ega)' 
    : (currentUser && !currentUser.isGuest ? 'Oila A\'zosi (Tahrirchi)' : 'Mehmon');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <aside className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xs sm:max-w-sm bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col z-50 animate-in slide-in-from-right duration-200">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  Foydalanuvchi Profili
                </h3>
                <p className="text-[10px] text-slate-400">
                  Hisob va shaxsiy sozlamalar
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

          {/* Scrollable Body */}
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">

            {/* User Profile Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-50 dark:from-emerald-950/40 dark:via-slate-800/60 dark:to-slate-900 border border-emerald-500/25 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-extrabold text-base shadow-md shadow-emerald-600/30 shrink-0">
                  {avatarLetter}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                    {displayName}
                  </div>
                  <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full mt-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>{roleName}</span>
                  </div>
                </div>
              </div>

              {/* Extra Account Info */}
              <div className="space-y-1 pt-2 border-t border-emerald-500/15 text-[11px] text-slate-600 dark:text-slate-300">
                {currentUser?.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Telefon:</span>
                    <span className="font-semibold">{currentUser.phone}</span>
                  </div>
                )}
                {currentUser?.telegramUsername && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Telegram:</span>
                    <span className="font-semibold text-[#24A1DE]">@{currentUser.telegramUsername}</span>
                  </div>
                )}
                {currentUser?.authProvider && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Kirish turi:</span>
                    <span className="font-semibold capitalize">{currentUser.authProvider}</span>
                  </div>
                )}
              </div>

              {/* Switch / Edit Account button */}
              <button
                onClick={() => {
                  onClose();
                  onOpenLoginModal();
                }}
                className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center justify-center gap-2"
              >
                <Key className="w-3.5 h-3.5 text-emerald-600" />
                <span>{currentUser ? 'Hisobni almashtirish / Tahrirlash' : 'Hisobga kirish / Ro\'yxatdan o\'tish'}</span>
              </button>
            </div>

            {/* Profile Actions & Family Collaboration */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                Oila & Hamkorlik
              </div>

              {/* Taklif qilish (Invite Family) - Moved here from navbar per user request */}
              <button
                id="btn-sidebar-invite-family"
                onClick={() => {
                  onClose();
                  onOpenInviteModal();
                }}
                className="w-full p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold text-left text-slate-800 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-purple-900 dark:text-purple-300">
                      Qarindoshlarni taklif qilish
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Havola orqali birgalikda shajara to'ldirish
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Telegram Bot */}
              <button
                id="btn-sidebar-tg-bot"
                onClick={() => {
                  onClose();
                  onOpenTelegramBotModal();
                }}
                className="w-full p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold text-left text-slate-800 dark:text-slate-200 hover:bg-[#24A1DE]/10 border border-[#24A1DE]/30 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#24A1DE]/10 text-[#24A1DE] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      Telegram Bot (@shajarachi_bot)
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Bot orqali ma'lumot kiritish va sinxronlash
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Statistika */}
              <button
                id="btn-sidebar-stats"
                onClick={() => {
                  onClose();
                  onOpenStatsModal();
                }}
                className="w-full p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold text-left text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/60 dark:border-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      Shajara statistikasi
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {peopleCount} a'zo • Erkak, ayol, fotosuratlar hisobi
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Shajara o'zgarishlar tarixi (Audit log) */}
              <button
                id="btn-sidebar-history"
                onClick={() => {
                  onClose();
                  onOpenHistoryModal();
                }}
                className="w-full p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold text-left text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-slate-200/60 dark:border-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      Amallar jurnali & Tarix
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Kiritilgan va o'zgartirilgan yozuvlar ro'yxati
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Huquqiy & Maxfiylik */}
            <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                Xavfsizlik & Qoidalar
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenPolicy('privacy');
                }}
                className="w-full p-2 rounded-xl flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Maxfiylik siyosati</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenPolicy('terms');
                }}
                className="w-full p-2 rounded-xl flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Foydalanish shartlari</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            {/* Logout section */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                id="btn-sidebar-logout"
                onClick={() => {
                  onClose();
                  onRequestLogout();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-rose-200 dark:border-rose-900/60"
              >
                <LogOut className="w-4 h-4" />
                <span>Hisobdan chiqish (Log out)</span>
              </button>
            </div>

          </div>
        </div>
      </aside>
    </div>
  );
};
