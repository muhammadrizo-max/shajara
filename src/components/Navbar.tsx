import React, { useRef, useState, useEffect } from 'react';
import { AuthUser, Person, ViewMode } from '../types';
import { FamilyTreeLogo } from './FamilyTreeLogo';
import { 
  Scroll, 
  Users, 
  Plus, 
  Calculator, 
  Download, 
  Upload, 
  User, 
  LogOut, 
  SlidersHorizontal, 
  Search, 
  History, 
  Camera, 
  Sun, 
  Moon, 
  Menu,
  ChevronDown,
  Info,
  Sparkles,
  Printer
} from 'lucide-react';
import { ThemeMode } from '../utils/theme';

interface NavbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  people: Record<string, Person>;
  meId: string;
  currentUser?: AuthUser | null;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
  onOpenAddModal: () => void;
  onOpenCalcModal: () => void;
  onOpenPrintModal: () => void;
  onOpenHistoryModal: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onRequestLogout: () => void;
  onOpenLoginModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  viewMode,
  onViewModeChange,
  people,
  meId,
  currentUser,
  theme,
  onToggleTheme,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  onOpenAddModal,
  onOpenCalcModal,
  onOpenPrintModal,
  onOpenHistoryModal,
  onExport,
  onImport,
  onRequestLogout,
  onOpenLoginModal,
}) => {
  const importFileRef = useRef<HTMLInputElement>(null);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const me = people[meId];
  const peopleList = Object.values(people);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsToolsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      setIsToolsDropdownOpen(false);
    }
  };

  const displayName = currentUser?.fullName || (currentUser?.name ? `${currentUser.name} ${currentUser.surname || ''}` : (me ? `${me.name} ${me.surname || ''}` : 'Mehmon'));
  const avatarLetter = currentUser?.name ? currentUser.name.charAt(0) : (me ? me.name.charAt(0) : 'U');

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs w-full transition-colors">
        <div className="w-full px-2.5 sm:px-5 py-2 flex items-center justify-between gap-2 overflow-x-hidden">
          
          {/* Left: Interactive Logo (Opens Left Sidebar) & Title + Subtitle */}
          <div className="flex items-center gap-2.5 shrink-0 min-w-0">
            {/* Clickable site icon triggers Left Sidebar */}
            <button
              id="btn-nav-toggle-left-sidebar"
              onClick={onToggleLeftSidebar}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/10 to-amber-500/20 border border-emerald-500/35 flex items-center justify-center p-1 shadow-xs hover:border-emerald-500 hover:scale-105 active:scale-95 transition-all cursor-pointer group shrink-0"
              title="Shajara menyusi (Chap sidebar)"
            >
              <FamilyTreeLogo className="w-7 h-7 sm:w-8 sm:h-8 group-hover:rotate-3 transition-transform" />
            </button>

            {/* Permanent brand title and subtitle */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white leading-none">
                  Shajarachi
                </h1>
                <span className="hidden xs:inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                  Meros
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight truncate max-w-[200px] sm:max-w-xs md:max-w-sm mt-0.5">
                O'tmish ildizlari bilan kelajakni bog'lovchi ko'prik.
              </p>
            </div>
          </div>

          {/* Desktop Center: View Mode Tabs */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold shrink-0">
            <button
              id="tab-tree-view"
              onClick={() => onViewModeChange('tree')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                viewMode === 'tree'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FamilyTreeLogo className="w-3.5 h-3.5" />
              <span>Daraxt</span>
            </button>

            <button
              id="tab-seven-ancestors"
              onClick={() => onViewModeChange('seven-ancestors')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                viewMode === 'seven-ancestors'
                  ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Scroll className="w-3.5 h-3.5 text-amber-500" />
              <span>7 Ajdod Zanjiri</span>
            </button>

            <button
              id="tab-list-view"
              onClick={() => onViewModeChange('list')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-sky-500" />
              <span>Ro'yxat ({peopleList.length})</span>
            </button>

            <button
              id="tab-album-view"
              onClick={() => onViewModeChange('album')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                viewMode === 'album'
                  ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-rose-500" />
              <span>Oila Albomi</span>
            </button>
          </div>

          {/* Right: + Qo'shish, Tools Dropdown, User Profile (Opens Right Sidebar), and Logout Icon */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Quick Add Button */}
            <button
              id="btn-nav-add-quick"
              onClick={onOpenAddModal}
              className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
              title="Yangi shaxs / Farzand qo'shish"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Qo'shish</span>
            </button>

            {/* Compact Tools / Settings Dropdown (Hover & Click) */}
            <div 
              ref={dropdownRef}
              className="relative"
              onMouseEnter={() => setIsToolsDropdownOpen(true)}
              onMouseLeave={() => setIsToolsDropdownOpen(false)}
            >
              <button
                id="btn-nav-tools-menu"
                type="button"
                onClick={() => setIsToolsDropdownOpen((prev) => !prev)}
                className={`p-2 rounded-xl text-slate-700 dark:text-slate-200 border transition-colors flex items-center justify-center cursor-pointer ${
                  isToolsDropdownOpen 
                    ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-700 text-emerald-600'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="Sozlamalar va qo'shimcha vositalar"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              {/* Dropdown Card */}
              {isToolsDropdownOpen && (
                <div className="absolute right-0 top-full pt-1.5 z-50 w-56 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 space-y-1 text-xs">
                    
                    {/* Theme Toggle */}
                    <button
                      onClick={() => {
                        onToggleTheme();
                      }}
                      className="w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition"
                    >
                      <div className="flex items-center gap-2.5">
                        {theme === 'dark' ? (
                          <Sun className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Moon className="w-4 h-4 text-slate-700" />
                        )}
                        <span>Mavzu ko'rinishi</span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {theme === 'dark' ? 'Dark' : 'Light'}
                      </span>
                    </button>

                    {/* Menga kim bo'ladi? */}
                    <button
                      onClick={() => {
                        setIsToolsDropdownOpen(false);
                        onOpenCalcModal();
                      }}
                      className="w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-medium transition"
                    >
                      <Calculator className="w-4 h-4 text-emerald-600" />
                      <span>Menga kim bo'ladi?</span>
                    </button>

                    {/* Chop etish */}
                    <button
                      onClick={() => {
                        setIsToolsDropdownOpen(false);
                        onOpenPrintModal();
                      }}
                      className="w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-medium transition"
                    >
                      <Printer className="w-4 h-4 text-amber-600" />
                      <span>Chop etish (A4 / PDF)</span>
                    </button>

                    {/* Tarix */}
                    <button
                      onClick={() => {
                        setIsToolsDropdownOpen(false);
                        onOpenHistoryModal();
                      }}
                      className="w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/40 font-medium transition"
                    >
                      <History className="w-4 h-4 text-sky-600" />
                      <span>Amallar tarixi</span>
                    </button>

                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                    {/* JSON Export */}
                    <button
                      onClick={() => {
                        setIsToolsDropdownOpen(false);
                        onExport();
                      }}
                      className="w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition"
                    >
                      <Download className="w-4 h-4 text-slate-500" />
                      <span>Shajarani yuklash (JSON)</span>
                    </button>

                    {/* JSON Import */}
                    <input
                      ref={importFileRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      onClick={() => importFileRef.current?.click()}
                      className="w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition"
                    >
                      <Upload className="w-4 h-4 text-indigo-500" />
                      <span>Fayldan tiklash (JSON)</span>
                    </button>

                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                    {/* Mehmon sahifasi */}
                    <button
                      onClick={() => {
                        setIsToolsDropdownOpen(false);
                        onViewModeChange('guest');
                      }}
                      className="w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 font-medium transition"
                    >
                      <Info className="w-4 h-4" />
                      <span>Tanishuv & Mehmon sahifasi</span>
                    </button>

                  </div>
                </div>
              )}
            </div>

            {/* User Profile Badge (Clicking triggers Right Sidebar) */}
            <button
              id="btn-nav-profile-right-sidebar"
              onClick={onToggleRightSidebar}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800/60 text-xs transition-colors cursor-pointer group"
              title="Foydalanuvchi profili (O'ng sidebar)"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shadow-xs group-hover:scale-105 transition-transform">
                {avatarLetter}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="font-bold text-emerald-950 dark:text-emerald-200 leading-tight max-w-[110px] truncate">
                  {displayName}
                </span>
                <span className="text-[9px] text-emerald-700 dark:text-emerald-400 leading-tight">
                  {currentUser?.role === 'owner' ? 'Shajara Asoschisi' : 'Oila A\'zosi'}
                </span>
              </div>
            </button>

            {/* Logout icon-only button with real confirmation prompt */}
            <button
              id="btn-nav-logout-icon"
              type="button"
              onClick={onRequestLogout}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors flex items-center justify-center cursor-pointer"
              title="Hisobdan chiqish (Log out)"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/90 dark:border-slate-800/90 shadow-2xl py-1 px-3 flex items-center justify-around safe-bottom">
        {/* Tab: Left Sidebar (Shajara) */}
        <button
          onClick={onToggleLeftSidebar}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-medium"
        >
          <Menu className="w-5 h-5 text-emerald-600" />
          <span className="text-[10px] mt-0.5">Shajara</span>
        </button>

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

        {/* Center Primary Action: + Qo'shish */}
        <button
          onClick={onOpenAddModal}
          className="flex flex-col items-center justify-center -mt-4 p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg ring-4 ring-white dark:ring-slate-900 active:scale-95 transition-transform"
          title="Farzand yoki shaxs qo'shish"
        >
          <Plus className="w-5 h-5" />
          <span className="text-[9px] font-extrabold mt-0.5">Qo'shish</span>
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

        {/* Tab: Profil (Right Sidebar) */}
        <button
          onClick={onToggleRightSidebar}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-medium"
        >
          <User className="w-5 h-5 text-emerald-600" />
          <span className="text-[10px] mt-0.5">Profil</span>
        </button>
      </nav>
    </>
  );
};
