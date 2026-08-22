import React, { useState } from 'react';
import { Person } from '../types';
import { calculateKinship, findLowestCommonAncestor } from '../utils/kinship';
import { 
  X, 
  Users, 
  ArrowRight, 
  Crown, 
  Sparkles, 
  GitBranch, 
  HelpCircle,
  CheckCircle,
  CornerDownRight
} from 'lucide-react';

interface RelationCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: Record<string, Person>;
  initialFromId: string;
}

export const RelationCalculatorModal: React.FC<RelationCalculatorModalProps> = ({
  isOpen,
  onClose,
  people,
  initialFromId,
}) => {
  const peopleList = Object.values(people) as Person[];

  const [fromId, setFromId] = useState<string>(initialFromId || peopleList[0]?.id || '');
  const [toId, setToId] = useState<string>(
    peopleList.find((p) => p.id !== initialFromId)?.id || peopleList[0]?.id || ''
  );

  if (!isOpen) return null;

  const personA = people[fromId];
  const personB = people[toId];

  const relation = personA && personB ? calculateKinship(fromId, toId, people) : null;
  const lcaData = personA && personB ? findLowestCommonAncestor(fromId, toId, people) : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-emerald-600 text-white shadow-sm flex-shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                «Menga Kim Bo'ladi?»
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                2 ta qarindoshingiz o'rtasidagi nasab rishtasini aniqlash
              </p>
            </div>
          </div>

          <button
            id="btn-close-calc"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Person A */}
            <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
              <label className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                1-Shaxs (Kimdan):
              </label>
              <select
                id="select-calc-person-a"
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none"
              >
                {peopleList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.titleOrNickname ? `(«${p.titleOrNickname}»)` : ''} — {p.generation}-pusht
                  </option>
                ))}
              </select>
            </div>

            {/* Person B */}
            <div className="p-4 rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/40 dark:bg-sky-950/20 space-y-2">
              <label className="text-xs font-bold text-sky-800 dark:text-sky-300 block">
                2-Shaxs (Kimgacha):
              </label>
              <select
                id="select-calc-person-b"
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-sky-300 dark:border-sky-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none"
              >
                {peopleList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.titleOrNickname ? `(«${p.titleOrNickname}»)` : ''} — {p.generation}-pusht
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Result Card */}
          {relation && personA && personB && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-300 border-b border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Qarindoshlik Xulosasi:</span>
                </div>
                <span className="text-amber-300 font-medium">
                  {personA.name} ➔ {personB.name}
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-slate-400">
                  {personA.name} uchun {personB.name} kim bo'ladi?
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">
                  {relation.relationNameUz}
                </div>
                <p className="text-sm text-slate-200 leading-relaxed pt-1">
                  {relation.description}
                </p>
              </div>

              {/* Common Ancestor */}
              {lcaData?.lca && (
                <div className="pt-3 border-t border-slate-700/80 flex items-center gap-2 text-xs text-slate-300">
                  <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>
                    Eng yaqin umumiy bobosi: <strong className="text-white">{lcaData.lca.name} {lcaData.lca.titleOrNickname ? `(«${lcaData.lca.titleOrNickname}»)` : ''}</strong> ({lcaData.lca.generation}-pusht)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Lineage Path Details */}
          {lcaData?.lca && personA && personB && fromId !== toId && (
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-emerald-600" />
                <span>Nasab Bog'lanish Zanjiri</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span><strong>{personA.name}</strong>ning ajdodlar yo'li:</span>
                  <span className="text-slate-500">
                    {lcaData.pathA.map((p) => p.name).join(' ➔ ')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-sky-500" />
                  <span><strong>{personB.name}</strong>ning ajdodlar yo'li:</span>
                  <span className="text-slate-500">
                    {lcaData.pathB.map((p) => p.name).join(' ➔ ')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-800/20">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white text-xs font-bold transition-colors"
          >
            Tushundim
          </button>
        </div>
      </div>
    </div>
  );
};
