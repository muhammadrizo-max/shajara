import React from 'react';
import { Person } from '../types';
import { X, UserPlus, Heart, Users, Shield, Sparkles } from 'lucide-react';

export type RelativeRelationType = 'father' | 'mother' | 'spouse' | 'son' | 'daughter';

interface AddRelativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPerson: Person | null;
  onSelectRelation: (type: RelativeRelationType, targetPerson: Person) => void;
}

export const AddRelativeModal: React.FC<AddRelativeModalProps> = ({
  isOpen,
  onClose,
  targetPerson,
  onSelectRelation,
}) => {
  if (!isOpen || !targetPerson) return null;

  const spouseLabel = targetPerson.gender === 'male' ? "Xotini (Turmush o'rtog'i)" : "Eri (Turmush o'rtog'i)";

  const options: {
    type: RelativeRelationType;
    title: string;
    description: string;
    icon: React.ReactNode;
    colorClass: string;
    bgClass: string;
    badge: string;
  }[] = [
    {
      type: 'father',
      title: 'Ota qo\'shish',
      description: `«${targetPerson.name}»ning otasi (yuqori bo'g'in)`,
      icon: <Shield className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
      colorClass: 'border-sky-200 dark:border-sky-900/60 hover:bg-sky-50 dark:hover:bg-sky-950/40',
      bgClass: 'bg-sky-100 dark:bg-sky-900/40',
      badge: 'Yuqori bo\'g\'in',
    },
    {
      type: 'mother',
      title: 'Ona qo\'shish',
      description: `«${targetPerson.name}»ning onasi (yuqori bo'g'in)`,
      icon: <Heart className="w-5 h-5 text-pink-600 dark:text-pink-400" />,
      colorClass: 'border-pink-200 dark:border-pink-900/60 hover:bg-pink-50 dark:hover:bg-pink-950/40',
      bgClass: 'bg-pink-100 dark:bg-pink-900/40',
      badge: 'Yuqori bo\'g\'in',
    },
    {
      type: 'spouse',
      title: 'Turmush o\'rtoq',
      description: spouseLabel,
      icon: <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      colorClass: 'border-amber-200 dark:border-amber-900/60 hover:bg-amber-50 dark:hover:bg-amber-950/40',
      bgClass: 'bg-amber-100 dark:bg-amber-900/40',
      badge: 'Oila ittifoqi',
    },
    {
      type: 'son',
      title: 'O\'g\'il farzand',
      description: `«${targetPerson.name}»ning o'g'il zurriyoti`,
      icon: <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      colorClass: 'border-blue-200 dark:border-blue-900/60 hover:bg-blue-50 dark:hover:bg-blue-950/40',
      bgClass: 'bg-blue-100 dark:bg-blue-900/40',
      badge: 'Quyi bo\'g\'in',
    },
    {
      type: 'daughter',
      title: 'Qiz farzand',
      description: `«${targetPerson.name}»ning qiz zurriyoti`,
      icon: <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      colorClass: 'border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40',
      bgClass: 'bg-emerald-100 dark:bg-emerald-900/40',
      badge: 'Quyi bo\'g\'in',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 px-5 py-4 text-white flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
              Shajaraga qarindosh bog'lash
            </div>
            <h3 className="text-base sm:text-lg font-black tracking-tight">
              Qaysi qarindoshni qo'shmoqchisiz?
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition active:scale-90"
            title="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Person Info pill */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
            {targetPerson.name.charAt(0)}
          </div>
          <div className="text-xs">
            <span className="text-slate-500 dark:text-slate-400">Bog'lanadigan shaxs: </span>
            <strong className="text-slate-900 dark:text-white font-bold">{targetPerson.name} {targetPerson.surname || ''}</strong>
            <span className="text-[10px] text-slate-400 ml-1.5">({targetPerson.generation}-pusht)</span>
          </div>
        </div>

        {/* Options List */}
        <div className="p-4 sm:p-5 space-y-2.5">
          {options.map((opt) => (
            <button
              key={opt.type}
              onClick={() => {
                onSelectRelation(opt.type, targetPerson);
                onClose();
              }}
              className={`w-full p-3 rounded-2xl border ${opt.colorClass} flex items-center justify-between text-left transition-all active:scale-[0.99] group cursor-pointer shadow-xs`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${opt.bgClass} flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform`}>
                  {opt.icon}
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {opt.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {opt.description}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                {opt.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-400">
            Tanlanganingizdan so'ng, shaxs ma'lumotlarini (ism, tug'ilgan sana, rasm) kiritish oynasi ochiladi.
          </p>
        </div>
      </div>
    </div>
  );
};
