import React, { useState } from 'react';
import { X, UserPlus, Shield } from 'lucide-react';

export interface GoogleAccountOption {
  id: string;
  name: string;
  email: string;
  letter: string;
  bgClass: string;
}

const DEFAULT_ACCOUNTS: GoogleAccountOption[] = [
  {
    id: 'g_1',
    name: 'Muhammadrizo Xudoberdiyev',
    email: 'muhammadrizoxudoberdiyev834@gmail.com',
    letter: 'M',
    bgClass: 'bg-emerald-600 text-white',
  },
  {
    id: 'g_2',
    name: 'SAYTLAR UCHUN',
    email: 'xudoyberdiyevmuhammadrizo069@gmail.com',
    letter: 'S',
    bgClass: 'bg-blue-600 text-white',
  },
  {
    id: 'g_3',
    name: 'Youtube kanal',
    email: 'xudoberdiyevmuhammadrizo1@gmail.com',
    letter: 'Y',
    bgClass: 'bg-rose-600 text-white',
  },
];

interface GoogleAccountChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (account: { name: string; email: string }) => void;
  onOpenPolicy?: (type: 'privacy' | 'terms') => void;
}

export const GoogleAccountChooserModal: React.FC<GoogleAccountChooserModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
  onOpenPolicy,
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customError, setCustomError] = useState('');

  if (!isOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customEmail.includes('@')) {
      setCustomError("To'g'ri Google email manzilini kiriting");
      return;
    }
    const nameToUse = customName.trim() || customEmail.split('@')[0];
    onSelectAccount({
      name: nameToUse,
      email: customEmail.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-md bg-[#202124] text-[#e8eaed] rounded-2xl shadow-2xl border border-[#3c4043] overflow-hidden flex flex-col font-sans animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar with Google brand icon */}
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span className="text-xs text-[#9aa0a6] font-medium">Google hisobingiz bilan kiring</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#303134] text-[#9aa0a6] hover:text-[#e8eaed] transition-colors"
            title="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Header Titles */}
        <div className="px-6 pb-4">
          <div className="text-xs font-semibold text-emerald-400 mb-1">
            MyShajara ilovasiga o'tish
          </div>
          <h2 className="text-2xl font-bold text-[#e8eaed] tracking-tight">
            Hisobni tanlang
          </h2>
        </div>

        {/* Accounts List (2-rasmdagi ko'rinish) */}
        <div className="px-3 pb-3 divide-y divide-[#3c4043]/60">
          {DEFAULT_ACCOUNTS.map((acc) => (
            <button
              key={acc.id}
              onClick={() => onSelectAccount({ name: acc.name, email: acc.email })}
              className="w-full px-3 py-3 rounded-xl hover:bg-[#303134] active:bg-[#3c4043] flex items-center gap-3.5 transition-colors text-left group cursor-pointer"
            >
              <div className={`w-9 h-9 rounded-full ${acc.bgClass} flex items-center justify-center font-bold text-sm shrink-0 shadow-sm`}>
                {acc.letter}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-[#e8eaed] group-hover:text-white truncate">
                  {acc.name}
                </div>
                <div className="text-xs text-[#9aa0a6] group-hover:text-[#bdc1c6] truncate">
                  {acc.email}
                </div>
              </div>
            </button>
          ))}

          {/* Use another account option */}
          {!showCustomInput ? (
            <button
              onClick={() => setShowCustomInput(true)}
              className="w-full px-3 py-3 rounded-xl hover:bg-[#303134] active:bg-[#3c4043] flex items-center gap-3.5 transition-colors text-left group cursor-pointer mt-1"
            >
              <div className="w-9 h-9 rounded-full bg-[#303134] text-[#9aa0a6] flex items-center justify-center shrink-0 border border-[#5f6368]">
                <UserPlus className="w-4 h-4" />
              </div>
              <div className="flex-1 font-semibold text-sm text-[#e8eaed] group-hover:text-white">
                Boshqa hisobdan foydalanish
              </div>
            </button>
          ) : (
            <form onSubmit={handleCustomSubmit} className="p-3 bg-[#303134]/60 rounded-xl mt-2 space-y-2.5">
              <div className="text-xs font-semibold text-slate-300">
                Boshqa Google hisobingizni kiriting:
              </div>
              {customError && (
                <div className="text-[11px] text-rose-400 font-medium">{customError}</div>
              )}
              <input
                type="text"
                placeholder="Ism va familiyangiz"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#202124] border border-[#5f6368] text-xs text-white focus:outline-none focus:border-[#8ab4f8]"
              />
              <input
                type="email"
                required
                placeholder="namuna@gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#202124] border border-[#5f6368] text-xs text-white focus:outline-none focus:border-[#8ab4f8]"
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCustomInput(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#9aa0a6] hover:bg-[#3c4043]"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#8ab4f8] text-[#202124] font-bold text-xs hover:bg-[#a8c7fa] transition"
                >
                  Davom etish
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Note (Matching 2-rasm) */}
        <div className="px-6 py-4 bg-[#1a1a1c] border-t border-[#3c4043]/50 text-[11px] text-[#9aa0a6] leading-relaxed">
          Bu ilovani ishlatishdan oldin MyShajara{' '}
          <button
            type="button"
            onClick={() => onOpenPolicy && onOpenPolicy('privacy')}
            className="text-[#8ab4f8] hover:underline"
          >
            maxfiylik siyosati
          </button>{' '}
          va{' '}
          <button
            type="button"
            onClick={() => onOpenPolicy && onOpenPolicy('terms')}
            className="text-[#8ab4f8] hover:underline"
          >
            xizmat shartlari
          </button>{' '}
          bilan tanishib chiqing.
        </div>
      </div>
    </div>
  );
};
