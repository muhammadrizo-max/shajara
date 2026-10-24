import React, { useRef, useState } from 'react';
import { AuthUser, Person, ViewMode } from '../types';
import { FamilyTreeLogo } from './FamilyTreeLogo';
import { 
  Scroll, 
  Users, 
  BarChart3, 
  Plus, 
  Calculator, 
  Download, 
  Upload, 
  RotateCcw,
  Sparkles,
  LogIn,
  User,
  LogOut,
  Eye,
  SlidersHorizontal,
  X,
  UserCheck,
  Search,
  Printer,
  History,
  UserPlus,
  Bot
} from 'lucide-react';

interface NavbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  people: Record<string, Person>;
  meId: string;
  currentUser?: AuthUser | null;
  onOpenLoginModal: () => void;
  onOpenAddModal: () => void;
  onOpenCalcModal: () => void;
  onOpenStatsModal: () => void;
  onOpenPrintModal: () => void;
  onOpenHistoryModal: () => void;
  onOpenInviteModal: () => void;
  onOpenTelegramBotModal: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
  onCenterMe?: () => void;
  onSelectPerson?: (person: Person) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  people,
  meId,
  currentUser,
  onOpenLoginModal,
  onOpenAddModal,
  onOpenCalcModal,
  onOpenStatsModal,
  onOpenPrintModal,
  onOpenHistoryModal,
  onOpenInviteModal,
  onOpenTelegramBotModal,
  onExport,
  onImport,
  onReset,
  onCenterMe,
  onSelectPerson,
}) => {
  const importFileRef = useRef<HTMLInputElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const me = people[meId];
  const peopleList = Object.values(people) as Person[];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          {/* Left: Brand Logo & Title with 1-rasmdagi Oila Daraxti */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/10 to-amber-500/20 border border-emerald-500/30 flex items-center justify-center p-1 shadow-sm flex-shrink-0">
              <FamilyTreeLogo className="w-8 h-8 sm:w-9 sm:h-9" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                  7 Ajdod Shajarasi
                </h1>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Meros
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 hidden xs:block truncate">
                Ajdodlar va avlodlar nasabnomasi
              </p>
            </div>
          </div>

          {/* Desktop Center: View Switcher Tabs */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold">
            <button
              id="tab-tree-view"
              onClick={() => onViewModeChange('tree')}
              className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                viewMode === 'tree'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FamilyTreeLogo className="w-3.5 h-3.5" />
              <span>Daraxt</span>
            </button>

            <button
              id="tab-seven-ancestors"
              onClick={() => onViewModeChange('seven-ancestors')}
              className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                viewMode === 'seven-ancestors'
                  ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Scroll className="w-3.5 h-3.5" />
              <span>7 Ajdod Zanjiri</span>
            </button>

            <button
              id="tab-list-view"
              onClick={() => onViewModeChange('list')}
              className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Ro'yxat ({peopleList.length})</span>
            </button>
          </div>

          {/* Right: Actions, New Features (Print, History, Invite) & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsMobileSearchOpen((prev) => !prev)}
              className={`md:hidden p-2 rounded-xl border transition-colors ${
                isMobileSearchOpen || searchQuery
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
              title="Qidirish"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Desktop: Qarindoshlarni taklif qilish (Invite) */}
            <button
              id="btn-nav-invite"
              onClick={onOpenInviteModal}
              className="hidden lg:flex px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 text-xs font-bold items-center gap-1.5 transition-colors shadow-xs"
              title="Qarindoshlarni taklif qilish va birgalikda shajara tuzish"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Taklif qilish</span>
            </button>

            {/* Telegram Bot & WebApp */}
            <button
              id="btn-nav-telegram-bot"
              onClick={onOpenTelegramBotModal}
              className="flex px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 text-[#24A1DE] dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/60 text-xs font-bold items-center gap-1.5 transition-colors shadow-xs"
              title="Telegram Bot va WebApp integratsiyasi (@shajarachi_bot)"
            >
              <Bot className="w-3.5 h-3.5 text-[#24A1DE]" />
              <span className="hidden md:inline">Telegram Bot</span>
            </button>

            {/* Desktop: Chop etish uchun versiya (A4 Print / PDF) */}
            <button
              id="btn-nav-print"
              onClick={onOpenPrintModal}
              className="hidden sm:flex px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 text-xs font-bold items-center gap-1.5 transition-colors shadow-xs"
              title="Shajarani A4 Landscape formatida chop etish yoki PDF saqlash"
            >
              <Printer className="w-3.5 h-3.5 text-amber-600" />
              <span>Chop etish (A4)</span>
            </button>

            {/* Desktop: Shajara Tarixi (History) */}
            <button
              id="btn-nav-history"
              onClick={onOpenHistoryModal}
              className="hidden sm:flex p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              title="Shajara o'zgarishlar tarixi va jurnali"
            >
              <History className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>

            {/* Active Logged-in Person Box (Desktop) */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 text-xs">
              {currentUser && !currentUser.isGuest ? (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shadow-xs">
                    {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-emerald-950 dark:text-emerald-200 leading-tight">
                      {currentUser.fullName || `${currentUser.name} ${currentUser.surname || ''}`}
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 leading-tight">
                      {currentUser.role === 'owner' ? 'Shajara Asoschisi' : 'Oila A\'zosi'}
                    </span>
                  </div>
                </div>
              ) : me ? (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shadow-xs">
                    {me.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-emerald-950 dark:text-emerald-200 leading-tight">
                      {me.name} {me.surname || ''} <span className="text-emerald-600 dark:text-emerald-400 font-normal">(Siz)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      {me.generation}-pusht {me.birthDate ? `• ${me.birthDate}` : ''}
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenLoginModal}
                  className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold hover:underline"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ro'yxatdan o'tish</span>
                </button>
              )}

              <button
                id="btn-switch-account"
                onClick={onOpenLoginModal}
                title="Boshqa hisobga kirish / Ro'yxatdan o'tish"
                className="ml-1 p-1 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/60 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile User Profile Button */}
            <button
              onClick={onOpenLoginModal}
              className="lg:hidden px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-xs"
              title="Profilga kirish / Ro'yxatdan o'tish"
            >
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span className="max-w-[75px] truncate">
                {currentUser?.name || (me ? me.name : 'Kirish')}
              </span>
            </button>

            {/* Add person button (Desktop) */}
            <button
              id="btn-nav-add-person"
              onClick={onOpenAddModal}
              className="hidden md:flex px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold items-center gap-1.5 shadow-sm transition-colors"
              title="Yangi shaxs yoki farzand qo'shish"
            >
              <Plus className="w-4 h-4" />
              <span>Qo'shish</span>
            </button>

            {/* Desktop Kinship calculator */}
            <button
              id="btn-nav-calc"
              onClick={onOpenCalcModal}
              className="hidden xl:flex px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold items-center gap-1.5 transition-colors"
              title="Qarindoshlik rishtasini aniqlash"
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-600" />
              <span>Menga kim?</span>
            </button>

            {/* Desktop Export JSON */}
            <button
              id="btn-nav-export"
              onClick={onExport}
              className="hidden sm:block p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              title="Shajarani JSON formatda saqlab olish (Backup)"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Desktop Import JSON */}
            <input
              ref={importFileRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              id="btn-nav-import"
              onClick={() => importFileRef.current?.click()}
              className="hidden sm:block p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              title="Oldin saqlangan JSON shajarani yuklash"
            >
              <Upload className="w-4 h-4" />
            </button>

            {/* Mobile "More / Qo'shimcha" Tools Menu Button */}
            <button
              id="btn-mobile-more-menu"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
              title="Qo'shimcha vositalar"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Expandable Search Bar */}
        {isMobileSearchOpen && (
          <div className="md:hidden px-3 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="search-mobile-tree-input"
                type="text"
                autoFocus
                placeholder="Shajaradan qidirish (ism, kasb, joy)..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Right Sliding Sidebar Menu (Haqiqiy O'ng Tomondan Ochiladigan Sidebar) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-8">
            <div className="w-screen max-w-xs sm:max-w-sm bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col z-50 animate-in slide-in-from-right duration-200 overflow-y-auto">
              {/* Sidebar Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 p-1 flex items-center justify-center">
                    <FamilyTreeLogo className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      Shajara Menyu
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Barcha vositalar va sozlamalar
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User profile section */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {currentUser?.name ? currentUser.name.charAt(0) : (me ? me.name.charAt(0) : 'U')}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {currentUser?.fullName || (me ? `${me.name} ${me.surname || ''}` : 'Mehmon')}
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {currentUser?.role === 'owner' ? 'Shajara Asoschisi' : (currentUser ? 'Oila A\'zosi' : 'Ro\'yxatdan o\'tilmagan')}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenLoginModal();
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 transition-colors shrink-0"
                  >
                    {currentUser ? 'Almashtirish' : 'Kirish'}
                  </button>
                </div>
              </div>

              {/* Navigation & Action items */}
              <div className="p-4 space-y-4 flex-1">
                {/* Asosiy ko'rinishlar */}
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                    Ko'rinishlar
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    <button
                      onClick={() => {
                        onViewModeChange('tree');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl flex items-center gap-3 text-xs font-semibold text-left transition-colors ${
                        viewMode === 'tree'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <FamilyTreeLogo className="w-4 h-4" />
                      <span>Shajara Daraxti ko'rinishi</span>
                    </button>

                    <button
                      onClick={() => {
                        onViewModeChange('seven-ancestors');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl flex items-center gap-3 text-xs font-semibold text-left transition-colors ${
                        viewMode === 'seven-ancestors'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 font-bold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Scroll className="w-4 h-4 text-amber-500" />
                      <span>7 Ajdod Zanjiri</span>
                    </button>

                    <button
                      onClick={() => {
                        onViewModeChange('list');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl flex items-center gap-3 text-xs font-semibold text-left transition-colors ${
                        viewMode === 'list'
                          ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 font-bold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Users className="w-4 h-4 text-sky-500" />
                      <span>Barcha a'zolar ro'yxati ({peopleList.length})</span>
                    </button>
                  </div>
                </div>

                {/* Vositalar va ulashish */}
                <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                    Xizmatlar & Integratsiya
                  </div>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenTelegramBotModal();
                    }}
                    className="w-full p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold text-left text-slate-800 dark:text-slate-200 hover:bg-[#24A1DE]/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Bot className="w-4 h-4 text-[#24A1DE]" />
                      <span>Telegram Bot (@shajarachi_bot)</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#24A1DE]">Ulashish</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenInviteModal();
                    }}
                    className="w-full p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold text-left text-slate-800 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <UserPlus className="w-4 h-4 text-purple-600" />
                      <span>Qarindoshlarni taklif qilish</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenPrintModal();
                    }}
                    className="w-full p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold text-left text-slate-800 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Printer className="w-4 h-4 text-amber-600" />
                      <span>Chop etish (A4 Albom / PDF)</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenCalcModal();
                    }}
                    className="w-full p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold text-left text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Calculator className="w-4 h-4 text-emerald-600" />
                      <span>Menga kim bo'ladi?</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenHistoryModal();
                    }}
                    className="w-full p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold text-left text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <History className="w-4 h-4 text-sky-600" />
                      <span>Shajara o'zgarishlar tarixi</span>
                    </div>
                  </button>
                </div>

                {/* Zaxiralash */}
                <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                    Zaxira & Fayllar
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onExport();
                      }}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>JSON Eksport</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        importFileRef.current?.click();
                      }}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-500" />
                      <span>JSON Import</span>
                    </button>
                  </div>
                </div>

                {/* Noldan boshlash / tozalash */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onReset();
                    }}
                    className="w-full py-2.5 px-3 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium flex items-center justify-center gap-2 transition-colors border border-rose-200/60 dark:border-rose-900/40"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Barcha ma'lumotlarni tozalash</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Fixed Bottom Navigation Bar (App-like UX) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/90 dark:border-slate-800/90 shadow-2xl py-1 px-3 flex items-center justify-around safe-bottom">
        {/* Tab: Daraxt */}
        <button
          onClick={() => onViewModeChange('tree')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            viewMode === 'tree'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 font-medium'
          }`}
        >
          <div className={`w-5 h-5 ${viewMode === 'tree' ? 'scale-110' : ''}`}>
            <FamilyTreeLogo className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">Daraxt</span>
        </button>

        {/* Tab: 7 Ajdod */}
        <button
          onClick={() => onViewModeChange('seven-ancestors')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            viewMode === 'seven-ancestors'
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 font-medium'
          }`}
        >
          <Scroll className={`w-5 h-5 ${viewMode === 'seven-ancestors' ? 'scale-110' : ''}`} />
          <span className="text-[10px] mt-0.5">7 Ajdod</span>
        </button>

        {/* Center Primary Action: + Qo'shish */}
        <button
          onClick={onOpenAddModal}
          className="flex flex-col items-center justify-center -mt-4 p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg ring-4 ring-white dark:ring-slate-900 active:scale-95 transition-transform"
          title="Farzand yoki shaxs qo'shish"
        >
          <Plus className="w-5 h-5" />
          <span className="text-[9px] font-extrabold mt-0.5">Qo'shish</span>
        </button>

        {/* Tab: Ro'yxat */}
        <button
          onClick={() => onViewModeChange('list')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
            viewMode === 'list'
              ? 'text-sky-600 dark:text-sky-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 font-medium'
          }`}
        >
          <Users className={`w-5 h-5 ${viewMode === 'list' ? 'scale-110' : ''}`} />
          <span className="text-[10px] mt-0.5">Ro'yxat</span>
          <span className="absolute top-0 right-1 px-1 py-0.2 rounded-full text-[8px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
            {peopleList.length}
          </span>
        </button>

        {/* Men (O'z profilini ochish va fokus qilish) */}
        <button
          id="btn-bottom-nav-me"
          onClick={() => {
            if (me) {
              if (onSelectPerson) {
                onSelectPerson(me);
              }
              if (viewMode !== 'tree') {
                onViewModeChange('tree');
              }
              if (onCenterMe) {
                onCenterMe();
              }
            } else {
              onOpenLoginModal();
            }
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            me ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 hover:text-emerald-600 font-medium'
          }`}
          title="O'z profilingizni ochish"
        >
          <UserCheck className="w-5 h-5 text-emerald-600" />
          <span className="text-[10px] mt-0.5 font-bold">Men</span>
        </button>
      </nav>
    </>
  );
};
