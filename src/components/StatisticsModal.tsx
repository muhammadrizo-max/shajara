import React from 'react';
import { Person } from '../types';
import { 
  X, 
  Home, 
  Lock, 
  Sparkles,
  TreeDeciduous,
  Leaf
} from 'lucide-react';
import { FamilyTreeLogo } from './FamilyTreeLogo';

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
  const withPhotos = peopleList.filter((p) => !!p.photoUrl).length;

  // Max generation count
  const generations = total > 0 ? Math.max(...peopleList.map((p) => p.generation), 1) : 0;

  // Tree levels
  let levelName = 'Nihol';
  let nextGoal = 6;
  let nextLevelName = 'Yosh daraxt';
  let treeStageIndex = 0;

  if (total >= 100) {
    levelName = 'Ko\'hna Bo\'ston';
    nextGoal = 150;
    nextLevelName = 'Mukammal Saltanat';
    treeStageIndex = 9;
  } else if (total >= 70) {
    levelName = 'Ulug\' Chinor';
    nextGoal = 100;
    nextLevelName = 'Ko\'hna Bo\'ston';
    treeStageIndex = 8;
  } else if (total >= 45) {
    levelName = 'Serbutoq Boq';
    nextGoal = 70;
    nextLevelName = 'Ulug\' Chinor';
    treeStageIndex = 6;
  } else if (total >= 25) {
    levelName = 'Mustahkam Daraxt';
    nextGoal = 45;
    nextLevelName = 'Serbutoq Boq';
    treeStageIndex = 4;
  } else if (total >= 12) {
    levelName = 'Katta daraxt';
    nextGoal = 25;
    nextLevelName = 'Mustahkam Daraxt';
    treeStageIndex = 2;
  } else if (total >= 6) {
    levelName = 'Yosh daraxt';
    nextGoal = 12;
    nextLevelName = 'Katta daraxt';
    treeStageIndex = 1;
  } else {
    levelName = 'Nihol';
    nextGoal = 6;
    nextLevelName = 'Yosh daraxt';
    treeStageIndex = 0;
  }

  const neededForNext = Math.max(0, nextGoal - total);
  const currentProgress = Math.min(100, Math.round((total / 100) * 100));

  // 10 Trees Milestones
  const TREE_MILESTONES = [
    { id: 1, name: 'Birinchi nihol', min: 1, icon: '🌱' },
    { id: 2, name: 'Yosh shox', min: 6, icon: '🌿' },
    { id: 3, name: 'Yosh daraxt', min: 12, icon: '🌳' },
    { id: 4, name: 'Kengayuvchi shoxlar', min: 20, icon: '🌲' },
    { id: 5, name: 'Mustahkam daraxt', min: 25, icon: '🌴' },
    { id: 6, name: 'Serbutoq daraxt', min: 35, icon: '🍁' },
    { id: 7, name: 'Qadimgi chinor', min: 50, icon: '🍃' },
    { id: 8, name: 'Ulug\' chinor', min: 70, icon: '🎋' },
    { id: 9, name: 'Meros bog\'i', min: 85, icon: '🌸' },
    { id: 10, name: 'Saltanat shajarasi', min: 100, icon: '👑' },
  ];

  const unlockedCount = TREE_MILESTONES.filter(m => total >= m.min).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overscroll-contain">
      <div className="relative w-full max-w-5xl bg-[#0B1720] text-slate-100 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden my-auto flex flex-col max-h-[95vh]">
        
        {/* Top Header Bar (6-rasm) */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-[#08121A] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-1 flex items-center justify-center shadow-md">
              <FamilyTreeLogo className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white leading-tight flex items-center gap-1.5">
                <span>Oila Daraxti</span>
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-400">
                Shajara nechta odam bilan o'sayotganini ko'rish
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Asosiy oynaga qaytish"
            >
              <Home className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <FamilyTreeLogo className="w-3.5 h-3.5" />
              <span>Shajara</span>
            </button>
          </div>
        </div>

        {/* Modal Body (6-rasm 2-ustunli struktura) */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 overscroll-contain">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Stats & Progress */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Top tags */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">
                  Mening shajaram (#01955)
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {levelName}
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <span>Sizning shajarangiz o'smoqda</span>
                  <span>🌳</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Boshlanish juda muhim. {total === 0 ? "Birinchi shaxsni qo'shing." : "Birinchi shox paydo bo'ldi."}
                </p>
              </div>

              {/* 6 Grid Metrics Cards (6-rasm) */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-2xl bg-[#0F202B] border border-slate-800 text-left">
                  <div className="text-xl font-black text-emerald-400">{total}</div>
                  <div className="text-[11px] font-medium text-slate-400">A'zolar</div>
                </div>

                <div className="p-3 rounded-2xl bg-[#0F202B] border border-slate-800 text-left">
                  <div className="text-xl font-black text-sky-400">{generations}</div>
                  <div className="text-[11px] font-medium text-slate-400">Avlodlar</div>
                </div>

                <div className="p-3 rounded-2xl bg-[#0F202B] border border-slate-800 text-left">
                  <div className="text-xl font-black text-purple-400">{withPhotos}</div>
                  <div className="text-[11px] font-medium text-slate-400">Rasmli</div>
                </div>

                <div className="p-3 rounded-2xl bg-[#0F202B] border border-slate-800 text-left">
                  <div className="text-xl font-black text-blue-400">{males}</div>
                  <div className="text-[11px] font-medium text-slate-400">Erkaklar</div>
                </div>

                <div className="p-3 rounded-2xl bg-[#0F202B] border border-slate-800 text-left">
                  <div className="text-xl font-black text-rose-400">{females}</div>
                  <div className="text-[11px] font-medium text-slate-400">Ayollar</div>
                </div>

                <div className="p-3 rounded-2xl bg-[#0F202B] border border-slate-800 text-left">
                  <div className="text-xl font-black text-teal-400">{alive}</div>
                  <div className="text-[11px] font-medium text-slate-400">Tirik</div>
                </div>
              </div>

              {/* Progress Bars (6-rasm) */}
              <div className="space-y-3.5 pt-1">
                {/* Jins nisbati */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>Jins nisbati</span>
                    <span className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-sky-400">
                        <span className="w-2 h-2 rounded-full bg-sky-400" />
                        Erkaklar {males}
                      </span>
                      <span className="flex items-center gap-1 text-rose-400">
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        Ayollar {females}
                      </span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden flex">
                    <div 
                      style={{ width: `${total > 0 ? (males / total) * 100 : 50}%` }} 
                      className="bg-sky-500 h-full transition-all" 
                    />
                    <div 
                      style={{ width: `${total > 0 ? (females / total) * 100 : 50}%` }} 
                      className="bg-rose-500 h-full transition-all" 
                    />
                  </div>
                </div>

                {/* Hayot holati */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>Hayot holati</span>
                    <span className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        Tirik {alive}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-slate-500" />
                        Vafot etgan {deceased}
                      </span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden flex">
                    <div 
                      style={{ width: `${total > 0 ? (alive / total) * 100 : 100}%` }} 
                      className="bg-emerald-500 h-full transition-all" 
                    />
                    <div 
                      style={{ width: `${total > 0 ? (deceased / total) * 100 : 0}%` }} 
                      className="bg-slate-600 h-full transition-all" 
                    />
                  </div>
                </div>

                {/* Joriy daraxt progress pill (6-rasm) */}
                <div className="p-3 rounded-2xl bg-[#0F202B] border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-300">Joriy daraxt: {total}/100</span>
                    <span className="text-emerald-400">{currentProgress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      style={{ width: `${Math.max(5, currentProgress)}%` }} 
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all" 
                    />
                  </div>
                </div>

                {/* Keyingi bosqich banner (6-rasm) */}
                <div className="p-3 rounded-2xl bg-[#0F202B] border border-slate-800/80 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">Keyingi bosqich</span>
                  <span className="text-emerald-400">
                    {neededForNext > 0 ? `Yana ${neededForNext} odam — ${nextLevelName}` : 'Eng yuqori cho\'qqi'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  Har bir qo'shilgan odam shajarangizni yanada boyitadi.
                </p>
              </div>

            </div>

            {/* Right Column: Visual illustration of the growing tree (6-rasm) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="w-full aspect-square max-w-sm rounded-3xl bg-[#13222C] border border-slate-800/90 p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-radial from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

                {/* Sprout / Tree Illustration in Soil (6-rasm) */}
                <div className="relative flex flex-col items-center justify-center my-auto">
                  {/* Leaves / Branches based on total */}
                  <div className="relative transition-all duration-700">
                    {total <= 2 ? (
                      /* Small 2-leaf sprout */
                      <div className="w-28 h-28 flex flex-col items-center justify-center animate-pulse">
                        <Leaf className="w-20 h-20 text-emerald-400" />
                      </div>
                    ) : total <= 8 ? (
                      /* Growing seedling */
                      <div className="w-36 h-36 flex flex-col items-center justify-center">
                        <TreeDeciduous className="w-28 h-28 text-emerald-400 drop-shadow-lg" />
                      </div>
                    ) : (
                      /* Majestic flourishing tree */
                      <div className="w-44 h-44 flex flex-col items-center justify-center">
                        <TreeDeciduous className="w-36 h-36 text-emerald-400 drop-shadow-2xl" />
                      </div>
                    )}
                  </div>

                  {/* Soil mound (6-rasm) */}
                  <div className="w-36 h-6 rounded-full bg-gradient-to-r from-stone-800 via-amber-950 to-stone-900 border-t border-amber-900/40 mt-1 shadow-md" />
                </div>

                <div className="text-center mt-3">
                  <span className="text-xs font-bold text-white block">{levelName}</span>
                  <span className="text-[10px] text-slate-400">Shajara rivoji darajasi</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Section: To'plangan daraxtlar (0/10) (6-rasm) */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>To'plangan daraxtlar ({unlockedCount}/10)</span>
              <span className="text-[10px] text-slate-500 font-normal">Har bir bosqich yangi daraxtni ochadi</span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {TREE_MILESTONES.map((item, idx) => {
                const isUnlocked = total >= item.min;
                return (
                  <div
                    key={item.id}
                    className={`aspect-square rounded-2xl border flex flex-col items-center justify-center p-1 transition-all ${
                      isUnlocked
                        ? 'bg-[#152733] border-emerald-500/60 shadow-md ring-1 ring-emerald-500/20 text-emerald-300'
                        : 'bg-[#0E1A22] border-slate-800 text-slate-600 opacity-60'
                    }`}
                    title={`${item.name} (${item.min}+ a'zo)`}
                  >
                    {isUnlocked ? (
                      <span className="text-xl sm:text-2xl">{item.icon}</span>
                    ) : (
                      <Lock className="w-4 h-4 text-slate-500" />
                    )}
                    <span className="text-[8px] font-mono mt-1 text-slate-400">
                      #{idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
