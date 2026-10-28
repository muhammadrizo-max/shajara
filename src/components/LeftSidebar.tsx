import React, { useRef } from 'react';
import { 
  X, 
  Plus, 
  Printer, 
  Calculator, 
  Download, 
  Upload, 
  RotateCcw, 
  Scroll, 
  Users, 
  Camera, 
  Compass, 
  Sparkles, 
  HelpCircle,
  FileText,
  Info
} from 'lucide-react';
import { FamilyTreeLogo } from './FamilyTreeLogo';
import { Person, ViewMode } from '../types';

interface LeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  people: Record<string, Person>;
  meId: string;
  rootId: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenAddModal: () => void;
  onOpenPrintModal: () => void;
  onOpenCalcModal: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  isOpen,
  onClose,
  people,
  meId,
  rootId,
  viewMode,
  onViewModeChange,
  onOpenAddModal,
  onOpenPrintModal,
  onOpenCalcModal,
  onExport,
  onImport,
  onReset,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const peopleList = Object.values(people) as Person[];
  const totalCount = peopleList.length;
  const menCount = peopleList.filter((p) => p.gender === 'male').length;
  const womenCount = peopleList.filter((p) => p.gender === 'female').length;
  const maxGen = peopleList.length > 0 ? Math.max(...peopleList.map((p) => p.generation || 1), 1) : 0;
  const rootPerson = people[rootId] || peopleList[0];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <aside className="fixed inset-y-0 left-0 max-w-full flex pr-10">
        <div className="w-screen max-w-xs sm:max-w-sm bg-white dark:bg-slate-900 shadow-2xl border-r border-slate-200 dark:border-slate-800 flex flex-col z-50 animate-in slide-in-from-left duration-200">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/10 to-amber-500/20 border border-emerald-500/30 flex items-center justify-center p-1 shadow-sm">
                <FamilyTreeLogo className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                    Shajarachi
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Shajara
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Shajara boshqaruvi va vositalar
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

            {/* Tree Summary Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-100/50 dark:from-emerald-950/40 dark:via-slate-800/50 dark:to-slate-900 border border-emerald-500/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Shajara holati
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                  {maxGen} pusht
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-base font-black text-slate-900 dark:text-white leading-tight">
                    {totalCount}
                  </div>
                  <div className="text-[9px] text-slate-500 font-medium">Jami a'zo</div>
                </div>

                <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-base font-black text-sky-600 dark:text-sky-400 leading-tight">
                    {menCount}
                  </div>
                  <div className="text-[9px] text-slate-500 font-medium">Erkak</div>
                </div>

                <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-base font-black text-rose-500 dark:text-rose-400 leading-tight">
                    {womenCount}
                  </div>
                  <div className="text-[9px] text-slate-500 font-medium">Ayol</div>
                </div>
              </div>

              {rootPerson && (
                <div className="text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-emerald-500/10 flex items-center justify-between">
                  <span className="text-slate-400">Bosh ajdod:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {rootPerson.name} {rootPerson.surname || ''}
                  </span>
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            <button
              id="btn-sidebar-add-relative"
              onClick={() => {
                onClose();
                onOpenAddModal();
              }}
              className="w-full py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Yangi shaxs / Farzand qo'shish</span>
            </button>

            {/* Tree Specific Tools (Chop etish, Menga kim, etc.) */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                Shajara vositalari
              </div>

              {/* Chop etish (A4 Albom / PDF) - Moved here per user request */}
              <button
                id="btn-sidebar-print"
                onClick={() => {
                  onClose();
                  onOpenPrintModal();
                }}
                className="w-full p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold text-left text-slate-800 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-amber-900 dark:text-amber-300">
                      Chop etish (A4 / PDF)
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Shajarani chop etish yoki poster qilib saqlash
                    </div>
                  </div>
                </div>
              </button>

              {/* Menga kim bo'ladi? */}
              <button
                id="btn-sidebar-calc"
                onClick={() => {
                  onClose();
                  onOpenCalcModal();
                }}
                className="w-full p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold text-left text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/60 dark:border-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      Menga kim bo'ladi?
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Qarindoshlik rishtalarini aniqlash kalkulyatori
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Ko'rinishlar */}
            <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                Ko'rinish rejimlari
              </div>

              <button
                onClick={() => {
                  onViewModeChange('tree');
                  onClose();
                }}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 text-xs font-semibold text-left transition-colors ${
                  viewMode === 'tree'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <FamilyTreeLogo className="w-4 h-4" />
                <span>Interaktiv Shajara Daraxti</span>
              </button>

              <button
                onClick={() => {
                  onViewModeChange('seven-ancestors');
                  onClose();
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
                  onClose();
                }}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 text-xs font-semibold text-left transition-colors ${
                  viewMode === 'list'
                    ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Users className="w-4 h-4 text-sky-500" />
                <span>Barcha a'zolar ro'yxati ({totalCount})</span>
              </button>

              <button
                onClick={() => {
                  onViewModeChange('album');
                  onClose();
                }}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 text-xs font-semibold text-left transition-colors ${
                  viewMode === 'album'
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Camera className="w-4 h-4 text-rose-500" />
                <span>Oila Albomi (Suratlar)</span>
              </button>
            </div>

            {/* Tree Legend / Belgilar */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Daraxt belgilari (Afsona)
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <strong>Siz (Men)</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <strong>7 Ajdod</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                  <strong>O'g'il farzand</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  <strong>Qiz farzand</strong>
                </span>
              </div>
            </div>

            {/* Zaxira & Fayllar (JSON Export / Import) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                Zaxira & Fayllar
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onExport();
                    onClose();
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>JSON Eksport</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-500" />
                  <span>JSON Import</span>
                </button>
              </div>
            </div>

            {/* 7 Ajdod qoidasi haqida ma'lumot */}
            <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-300/90 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>7 Ajdod an'anasi:</span>
              </div>
              O'g'il va qiz farzandlar o'zlarining 7 pusht ota-bobolarini (Katta qat bobo, Qat bobo, Bobokalon, Katta bobo, Bobo, Ota, O'zi) bilishi o'zbek oilaviy merosining eng muhim asoslaridan biridir.
            </div>

            {/* Shajarani tozalash */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  onClose();
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
      </aside>
    </div>
  );
};
