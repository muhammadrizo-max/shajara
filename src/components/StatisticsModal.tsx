import React from 'react';
import { Person, AuthUser } from '../types';
import { 
  X, 
  Home, 
  Lock, 
  Sparkles,
  TreeDeciduous,
  Leaf,
  Crown
} from 'lucide-react';
import { FamilyTreeLogo } from './FamilyTreeLogo';

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: Record<string, Person>;
  currentUser?: AuthUser | null;
}

export const StatisticsModal: React.FC<StatisticsModalProps> = ({
  isOpen,
  onClose,
  people,
  currentUser,
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

  // Tree growth levels (Nihol -> Yosh daraxt -> Katta daraxt...)
  let levelName = 'Nihol';
  let nextGoal = 10;
  let nextLevelName = 'Yosh daraxt';

  if (total >= 400) {
    levelName = 'Oliy Shajara Saltanati';
    nextGoal = 400;
    nextLevelName = 'Mukammal daraja';
  } else if (total >= 270) {
    levelName = 'Ko\'hna Bo\'ston';
    nextGoal = 400;
    nextLevelName = 'Oliy Shajara';
  } else if (total >= 190) {
    levelName = 'Sulola Shajarasi';
    nextGoal = 270;
    nextLevelName = 'Ko\'hna Bo\'ston';
  } else if (total >= 115) {
    levelName = 'Mustahkam Chinor';
    nextGoal = 190;
    nextLevelName = 'Sulola Shajarasi';
  } else if (total >= 80) {
    levelName = 'Katta Bog\'';
    nextGoal = 115;
    nextLevelName = 'Mustahkam Chinor';
  } else if (total >= 40) {
    levelName = 'Katta daraxt';
    nextGoal = 80;
    nextLevelName = 'Katta Bog\'';
  } else if (total >= 15) {
    levelName = 'Yosh daraxt';
    nextGoal = 40;
    nextLevelName = 'Katta daraxt';
  } else {
    levelName = 'Nihol';
    nextGoal = 15;
    nextLevelName = 'Yosh daraxt';
  }

  const isPremiumUser = Boolean(
    currentUser?.isPremium || 
    currentUser?.role === 'owner_premium' || 
    (typeof localStorage !== 'undefined' && localStorage.getItem('shajarachi_premium_active') === 'true')
  );

  // 10 Trees Milestones:
  // 1-daraxt: 80 ta odam (Bepul / Freemium) — hamma uchun doim ochiq
  // 2-10 daraxtlar: Faqat Premium obuna sotib olganda va a'zolar yetarli bo'lganda ochiladi (jami 400 tagacha)
  const TREE_MILESTONES = [
    { id: 1, name: 'Birinchi shajara (Freemium)', limit: 80, isPremium: false, icon: '🌱' },
    { id: 2, name: 'Yosh shajara (#2)', limit: 115, isPremium: true, icon: '🌿' },
    { id: 3, name: 'Katta shajara (#3)', limit: 150, isPremium: true, icon: '🌳' },
    { id: 4, name: 'Sulola shajarasi (#4)', limit: 190, isPremium: true, icon: '🌲' },
    { id: 5, name: 'Mustahkam chinor (#5)', limit: 230, isPremium: true, icon: '🌴' },
    { id: 6, name: 'Serbutoq bo\'ston (#6)', limit: 270, isPremium: true, icon: '🍁' },
    { id: 7, name: 'Qadimgi nasl (#7)', limit: 310, isPremium: true, icon: '🍃' },
    { id: 8, name: 'Ulug\' chinor (#8)', limit: 340, isPremium: true, icon: '🎋' },
    { id: 9, name: 'Meros saltanati (#9)', limit: 370, isPremium: true, icon: '🌸' },
    { id: 10, name: 'Oliy shajara (#10)', limit: 400, isPremium: true, icon: '👑' },
  ];

  // Qaysi daraxtlar ochiq:
  // 1-daraxt har doim ochiq.
  // 2-10 faqat premium bo'lsa va avvalgi limit to'lsa ochiq.
  const isTreeUnlocked = (index: number) => {
    if (index === 0) return true; // 1-daraxt bepul va doim ochiq
    if (!isPremiumUser) return false; // Premium bo'lmasa 2-10 qulflangan
    const prevMilestone = TREE_MILESTONES[index - 1];
    return total >= prevMilestone.limit;
  };

  const unlockedCount = TREE_MILESTONES.filter((_, idx) => isTreeUnlocked(idx)).length;

  // Active current tree limit
  const currentTreeLimit = isPremiumUser ? (TREE_MILESTONES[unlockedCount - 1]?.limit || 400) : 80;
  const currentProgress = Math.min(100, Math.round((total / currentTreeLimit) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overscroll-contain animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white dark:bg-[#0B1720] text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto flex flex-col max-h-[95vh] transition-colors">
        
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-slate-50 dark:bg-[#08121A] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-1 flex items-center justify-center shadow-md">
              <FamilyTreeLogo className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                <span>Oila Daraxti</span>
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                Shajara nechta odam bilan o'sayotganini ko'rish
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
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

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 overscroll-contain">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Stats & Progress */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Top tags */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Mening shajaram
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  {levelName}
                </span>
                {!isPremiumUser && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <span>1-Daraxt (Freemium: 80 a'zo)</span>
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Sizning shajarangiz o'smoqda</span>
                  <span>🌳</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Boshlanish juda muhim. {total === 0 ? "Birinchi shaxsni qo'shing." : "Birinchi shox paydo bo'ldi."}
                </p>
              </div>

              {/* 6 Grid Metrics Cards */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0F202B] border border-slate-200 dark:border-slate-800 text-left">
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{total}</div>
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">A'zolar</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0F202B] border border-slate-200 dark:border-slate-800 text-left">
                  <div className="text-xl font-black text-sky-600 dark:text-sky-400">{generations}</div>
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Avlodlar</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0F202B] border border-slate-200 dark:border-slate-800 text-left">
                  <div className="text-xl font-black text-purple-600 dark:text-purple-400">{withPhotos}</div>
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Rasmli</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0F202B] border border-slate-200 dark:border-slate-800 text-left">
                  <div className="text-xl font-black text-blue-600 dark:text-blue-400">{males}</div>
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Erkaklar</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0F202B] border border-slate-200 dark:border-slate-800 text-left">
                  <div className="text-xl font-black text-rose-600 dark:text-rose-400">{females}</div>
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Ayollar</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0F202B] border border-slate-200 dark:border-slate-800 text-left">
                  <div className="text-xl font-black text-teal-600 dark:text-teal-400">{alive}</div>
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Tirik</div>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-3.5 pt-1">
                {/* Jins nisbati */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Jins nisbati</span>
                    <span className="flex items-center gap-3">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">● Erkaklar {males}</span>
                      <span className="text-rose-600 dark:text-rose-400 font-bold">● Ayollar {females}</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-500" 
                      style={{ width: `${total > 0 ? (males / total) * 100 : 50}%` }} 
                    />
                    <div 
                      className="h-full bg-rose-500 transition-all duration-500" 
                      style={{ width: `${total > 0 ? (females / total) * 100 : 50}%` }} 
                    />
                  </div>
                </div>

                {/* Hayot holati */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Hayot holati</span>
                    <span className="flex items-center gap-3">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">● Tirik {alive}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-bold">● Vafot etgan {deceased}</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-500" 
                      style={{ width: `${total > 0 ? (alive / total) * 100 : 100}%` }} 
                    />
                    <div 
                      className="h-full bg-slate-400 dark:bg-slate-600 transition-all duration-500" 
                      style={{ width: `${total > 0 ? (deceased / total) * 100 : 0}%` }} 
                    />
                  </div>
                </div>

                {/* Joriy daraxt to'lishi (Freemium: 80 ta, Premium: 400 tagacha) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>Joriy daraxt: {total}/{currentTreeLimit}</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{currentProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700 rounded-full"
                      style={{ width: `${currentProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                    <span>Keyingi bosqich</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                      {total < currentTreeLimit 
                        ? `Yana ${currentTreeLimit - total} odam — ${isPremiumUser ? 'Keyingi daraxt' : '1-daraxt (80 a\'zo)'}`
                        : "1-Daraxt to'liq to'ldi! 2-daraxt uchun Premium kerak"}
                    </span>
                  </div>
                </div>

              </div>

            </div>

            {/* Right Column: Visual illustration of the growing tree */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="w-full aspect-square max-w-sm rounded-3xl bg-slate-50 dark:bg-[#13222C] border border-slate-200 dark:border-slate-800/90 p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-radial from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

                {/* Sprout / Tree Illustration in Soil */}
                <div className="relative flex flex-col items-center justify-center my-auto">
                  <div className="relative transition-all duration-700">
                    {total <= 2 ? (
                      <div className="w-28 h-28 flex flex-col items-center justify-center animate-pulse">
                        <Leaf className="w-20 h-20 text-emerald-500" />
                      </div>
                    ) : total <= 8 ? (
                      <div className="w-36 h-36 flex flex-col items-center justify-center">
                        <TreeDeciduous className="w-28 h-28 text-emerald-500 drop-shadow-lg" />
                      </div>
                    ) : (
                      <div className="w-44 h-44 flex flex-col items-center justify-center">
                        <TreeDeciduous className="w-36 h-36 text-emerald-600 dark:text-emerald-400 drop-shadow-2xl" />
                      </div>
                    )}
                  </div>

                  {/* Soil mound */}
                  <div className="w-36 h-6 rounded-full bg-gradient-to-r from-amber-800 via-amber-950 to-stone-900 border-t border-amber-900/40 mt-1 shadow-md" />
                </div>

                <div className="text-center mt-3">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">{levelName}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Shajara rivoji darajasi</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Section: To'plangan daraxtlar (1/10) */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-300 gap-1">
              <span className="flex items-center gap-1.5">
                <span>To'plangan daraxtlar ({unlockedCount}/10)</span>
                {!isPremiumUser && (
                  <span className="text-[10px] font-normal text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                    1-daraxt ochiq (80 ta a'zo)
                  </span>
                )}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                Har bir bosqich yangi shox va daraxtni ochadi • Freemium: 1 ta daraxt (80 a'zo) • Premium: 10 tagacha daraxt (400 a'zo)
              </span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {TREE_MILESTONES.map((item, idx) => {
                const unlocked = isTreeUnlocked(idx);
                const isFirstFree = idx === 0;

                return (
                  <div
                    key={item.id}
                    className={`aspect-square rounded-2xl border flex flex-col items-center justify-center p-1 transition-all ${
                      unlocked
                        ? 'bg-emerald-50 dark:bg-[#152733] border-emerald-500/60 shadow-md ring-1 ring-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-[#0E1A22] border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 opacity-75'
                    }`}
                    title={
                      isFirstFree
                        ? "1-Daraxt: Bepul (80 tagacha odam)"
                        : `${item.name} (${item.limit} tagacha a'zo) — ${unlocked ? "Ochiq" : "Premium talab qilinadi"}`
                    }
                  >
                    {unlocked ? (
                      <span className="text-xl sm:text-2xl">{item.icon}</span>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <span className="text-[7px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">PRO</span>
                      </div>
                    )}
                    <span className="text-[8px] font-mono mt-1 text-slate-500 dark:text-slate-400">
                      #{idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>

            {!isPremiumUser && (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-[11px] leading-tight">
                    <strong>2-10 daraxtlarni ochish uchun:</strong> 80 ta a'zodan so'ng Premium hisob bilan 400 tagacha odam va 10 ta shajara daraxtini ochishingiz mumkin.
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
