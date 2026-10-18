import React, { useRef, useState } from 'react';
import { AuthUser, Person, ViewMode } from '../types';
import { 
  TreePine, 
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
  Search
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
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
  onCenterMe?: () => void;
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
  onExport,
  onImport,
  onReset,
  onCenterMe,
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
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-amber-500 flex items-center justify-center text-white shadow-md flex-shrink-0">
              <TreePine className="w-5 h-5 sm:w-6 sm:h-6" />
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
              <TreePine className="w-3.5 h-3.5" />
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

          {/* Right: Actions & Logged-in Profile (Desktop) + Mobile Action Icons */}
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

            {/* Active Logged-in Person Box (Desktop) */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 text-xs">
              {me ? (
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
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-semibold">
                  <Eye className="w-3.5 h-3.5 text-amber-600" />
                  <span>Mehmon rejimi</span>
                </div>
              )}

              <button
                id="btn-switch-account"
                onClick={onOpenLoginModal}
                title="Boshqa hisobga kirish yoki login qilish"
                className="ml-1 p-1 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/60 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile User Profile Button */}
            <button
              onClick={onOpenLoginModal}
              className="lg:hidden px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-xs"
              title="Profilga kirish / almashtirish"
            >
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span className="max-w-[75px] truncate">{me ? me.name : 'Kirish'}</span>
            </button>

            {/* Kinship calculator button (Desktop) */}
            <button
              id="btn-nav-calc"
              onClick={onOpenCalcModal}
              className="hidden md:flex px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold items-center gap-1.5 transition-colors"
              title="Qarindoshlik rishtasini aniqlash"
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-600" />
              <span>Menga kim bo'ladi?</span>
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

            {/* Desktop Stats Button */}
            <button
              id="btn-nav-stats"
              onClick={onOpenStatsModal}
              className="hidden sm:block p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              title="Statistika"
            >
              <BarChart3 className="w-4 h-4" />
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

            {/* Desktop Reset to Default */}
            <button
              id="btn-nav-reset"
              onClick={onReset}
              className="hidden sm:block p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
              title="Boshlang'ich rasm holatiga qaytarish"
            >
              <RotateCcw className="w-4 h-4" />
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

      {/* Mobile Tools Bottom Sheet / Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-slate-800 p-5 space-y-4 animate-in slide-in-from-bottom duration-200">
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                  <TreePine className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Qo'shimcha vositalar</h3>
                  <p className="text-[10px] text-slate-400">Shajarani boshqarish va hisob-kitoblar</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Action Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {/* Kinship Calc */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenCalcModal();
                }}
                className="p-3.5 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200/80 dark:border-emerald-800/60 text-left transition-all flex flex-col gap-1.5"
              >
                <Calculator className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="text-xs font-bold text-emerald-950 dark:text-emerald-200">Menga kim bo'ladi?</div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400">Qarindoshlik rishtasi</div>
                </div>
              </button>

              {/* Statistics */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenStatsModal();
                }}
                className="p-3.5 rounded-2xl bg-amber-50/70 hover:bg-amber-100/70 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 border border-amber-200/80 dark:border-amber-800/60 text-left transition-all flex flex-col gap-1.5"
              >
                <BarChart3 className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="text-xs font-bold text-amber-950 dark:text-amber-200">Statistika</div>
                  <div className="text-[10px] text-amber-700 dark:text-amber-400">Avlodlar & yoshlar</div>
                </div>
              </button>

              {/* Export JSON */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onExport();
                }}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-all flex flex-col gap-1.5"
              >
                <Download className="w-5 h-5 text-sky-600" />
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Eksport (JSON)</div>
                  <div className="text-[10px] text-slate-400">Faylni saqlab olish</div>
                </div>
              </button>

              {/* Import JSON */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  importFileRef.current?.click();
                }}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-all flex flex-col gap-1.5"
              >
                <Upload className="w-5 h-5 text-indigo-600" />
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Import (JSON)</div>
                  <div className="text-[10px] text-slate-400">Fayldan tiklash</div>
                </div>
              </button>
            </div>

            {/* Secondary actions */}
            <div className="pt-2 space-y-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenLoginModal();
                }}
                className="w-full py-2.5 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>Profilni o'zgartirish / Login</span>
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">{me ? me.name : 'Mehmon'}</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onReset();
                }}
                className="w-full py-2 px-3 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Shajarani boshlang'ich holatga qaytarish</span>
              </button>
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
          <TreePine className={`w-5 h-5 ${viewMode === 'tree' ? 'scale-110' : ''}`} />
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

        {/* Focus on Me / Center Action */}
        <button
          onClick={() => {
            if (viewMode !== 'tree') {
              onViewModeChange('tree');
            }
            if (onCenterMe) {
              onCenterMe();
            }
          }}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-emerald-600 font-medium transition-all"
          title="O'zimga fokus"
        >
          <UserCheck className="w-5 h-5 text-emerald-600" />
          <span className="text-[10px] mt-0.5">Men</span>
        </button>
      </nav>
    </>
  );
};
