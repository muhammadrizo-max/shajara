import React from 'react';
import { Person } from '../types';
import { 
  X, 
  BarChart3, 
  Users, 
  Crown, 
  Heart, 
  Layers, 
  Award,
  Sparkles
} from 'lucide-react';

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: Record<string, Person>;
}

export const StatisticsModal: React.FC<StatisticsModalProps> = ({
  isOpen,
  onClose,
  people,
}) => {
  if (!isOpen) return null;

  const peopleList = Object.values(people) as Person[];
  const total = peopleList.length;
  const males = peopleList.filter((p) => p.gender === 'male').length;
  const females = peopleList.filter((p) => p.gender === 'female').length;
  const alive = peopleList.filter((p) => p.isAlive !== false).length;
  const deceased = total - alive;

  // Group by generation
  const byGen: Record<number, number> = {};
  peopleList.forEach((p) => {
    byGen[p.generation] = (byGen[p.generation] || 0) + 1;
  });

  const maxGen = Math.max(...peopleList.map((p) => p.generation), 1);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Shajara Tahlili va Statistikasi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ajdodlar soni, pushtlar taqsimoti va demografik ko'rsatkichlar
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-center space-y-1">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Jami Shaxslar</span>
              <div className="text-2xl font-black text-emerald-900 dark:text-emerald-100">{total}</div>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 text-center space-y-1">
              <span className="text-xs font-semibold text-sky-800 dark:text-sky-300">Erkaklar</span>
              <div className="text-2xl font-black text-sky-900 dark:text-sky-100">{males}</div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-center space-y-1">
              <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">Ayollar</span>
              <div className="text-2xl font-black text-rose-900 dark:text-rose-100">{females}</div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-center space-y-1">
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">Pushtlar soni</span>
              <div className="text-2xl font-black text-amber-900 dark:text-amber-100">{maxGen}</div>
            </div>
          </div>

          {/* Generations distribution */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Pushtlar (Avlodlar) Taqsimoti</span>
            </h4>

            <div className="space-y-2.5">
              {Array.from({ length: maxGen }, (_, i) => i + 1).map((gen) => {
                const count = byGen[gen] || 0;
                const percentage = total > 0 ? (count / total) * 100 : 0;

                return (
                  <div key={gen} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">
                        {gen}-Pusht avlodi
                      </span>
                      <span className="text-slate-500">
                        {count} nafar ({Math.round(percentage)}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cultural Proverb */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-transparent border border-amber-200 dark:border-amber-900/50 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
              <Award className="w-4 h-4" />
              <span>O'zbek Milliy Hikmati</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
              «O'z ota-bobolarini va yetti pushtini tanigan xalq hech qachon o'zligini yo'qotmaydi. Shajara — o'tmishimiz bilan kelajagimizni bog'lovchi muqaddas oltin zanjirdir.»
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white text-xs font-bold transition-colors"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
