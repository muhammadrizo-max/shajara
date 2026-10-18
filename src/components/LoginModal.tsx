import React, { useState, useEffect } from 'react';
import { AuthUser, Person } from '../types';
import { 
  LogIn, 
  User, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  TreePine, 
  Eye, 
  ArrowRight,
  Trash2,
  X,
  Sparkles
} from 'lucide-react';

interface SavedLoginStat {
  personId: string;
  name: string;
  surname?: string;
  birthDate?: string;
  generation?: number;
  count: number;
  lastLogin: number;
}

const STORAGE_KEY_LOGIN_STATS = 'shajara_login_stats_v1';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  people: Record<string, Person>;
  onLogin: (user: AuthUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  people,
  onLogin,
}) => {
  const [name, setName] = useState<string>('');
  const [surname, setSurname] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [quickLogins, setQuickLogins] = useState<SavedLoginStat[]>([]);

  // Load quick logins from localStorage (only items with 2+ logins, max 3 items)
  const loadQuickLogins = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LOGIN_STATS);
      if (!raw) {
        setQuickLogins([]);
        return;
      }
      const data: Record<string, SavedLoginStat> = JSON.parse(raw);
      // Filter people who have logged in 2+ times, sort by lastLogin descending, take max 3
      const qualified = Object.values(data)
        .filter((item) => item && item.count >= 2 && people[item.personId])
        .sort((a, b) => b.lastLogin - a.lastLogin)
        .slice(0, 3);

      setQuickLogins(qualified);
    } catch {
      setQuickLogins([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadQuickLogins();
    }
  }, [isOpen, people]);

  if (!isOpen) return null;

  const recordLoginAttempt = (person: Person, customBirthDate?: string) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LOGIN_STATS);
      const data: Record<string, SavedLoginStat> = raw ? JSON.parse(raw) : {};
      
      const current = data[person.id] || {
        personId: person.id,
        name: person.name,
        surname: person.surname,
        birthDate: person.birthDate || customBirthDate,
        generation: person.generation,
        count: 0,
        lastLogin: Date.now(),
      };

      current.count = (current.count || 0) + 1;
      current.lastLogin = Date.now();
      current.name = person.name;
      current.surname = person.surname || current.surname;
      current.birthDate = person.birthDate || customBirthDate || current.birthDate;
      current.generation = person.generation;

      data[person.id] = current;
      localStorage.setItem(STORAGE_KEY_LOGIN_STATS, JSON.stringify(data));
      loadQuickLogins();
    } catch (err) {
      console.error("Error saving login stats:", err);
    }
  };

  const handleDeleteQuickLogin = (e: React.MouseEvent, personId: string) => {
    e.stopPropagation();
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LOGIN_STATS);
      if (raw) {
        const data: Record<string, SavedLoginStat> = JSON.parse(raw);
        delete data[personId];
        localStorage.setItem(STORAGE_KEY_LOGIN_STATS, JSON.stringify(data));
      }
      setQuickLogins((prev) => prev.filter((item) => item.personId !== personId));
    } catch (err) {
      console.error("Error deleting quick login:", err);
    }
  };

  const normalizeText = (txt: string) => {
    return txt
      .toLowerCase()
      .trim()
      .replace(/['`ʻʼ]/g, '')
      .replace(/kh/g, 'x')
      .replace(/sh/g, 'sh');
  };

  const handleSearchAndLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError("Iltimos, ismingizni kiriting.");
      return;
    }
    if (!birthDate) {
      setError("Iltimos, to'liq tug'ilgan sanangizni kiriting.");
      return;
    }

    const normName = normalizeText(name);
    const normSurname = surname.trim() ? normalizeText(surname) : '';
    const birthYearFromDate = birthDate ? birthDate.split('-')[0] : '';

    const peopleList = Object.values(people) as Person[];

    // Match priority:
    // 1. Exact birthDate + normalized name
    // 2. Exact birthYear + normalized name
    // 3. Normalized name + surname
    // 4. Normalized name alone
    let matched = peopleList.find((p) => {
      const pNameNorm = normalizeText(p.name);
      const nameMatches = pNameNorm.includes(normName) || normName.includes(pNameNorm);
      const dateMatches = p.birthDate === birthDate || (p.birthYear && p.birthYear === birthYearFromDate);
      return nameMatches && dateMatches;
    });

    if (!matched) {
      matched = peopleList.find((p) => {
        const pNameNorm = normalizeText(p.name);
        const nameMatches = pNameNorm === normName || pNameNorm.includes(normName) || normName.includes(pNameNorm);
        if (normSurname && p.surname) {
          const pSurNorm = normalizeText(p.surname);
          return nameMatches && (pSurNorm.includes(normSurname) || normSurname.includes(pSurNorm));
        }
        return false;
      });
    }

    if (!matched && !normSurname) {
      matched = peopleList.find((p) => normalizeText(p.name) === normName);
    }

    if (matched) {
      recordLoginAttempt(matched, birthDate);
      const authUser: AuthUser = {
        name: matched.name,
        surname: matched.surname || surname.trim() || undefined,
        birthDate: birthDate || matched.birthDate,
        personId: matched.id,
        isGuest: false,
      };
      onLogin(authUser);
    } else {
      setError("Kiritilgan ma'lumotlar bo'yicha shajaradan shaxs topilmadi. Ism va tug'ilgan sanani tekshiring yoki mehmon sifatida kiring.");
    }
  };

  const handleGuestEntry = () => {
    const authUser: AuthUser = {
      name: name.trim() || 'Mehmon',
      surname: surname.trim() || undefined,
      birthDate: birthDate || undefined,
      personId: null,
      isGuest: true,
    };
    onLogin(authUser);
  };

  // Quick 1-click login for 2+ times logged in users
  const handleQuickLoginClick = (item: SavedLoginStat) => {
    const person = people[item.personId];
    if (person) {
      recordLoginAttempt(person, item.birthDate);
      const authUser: AuthUser = {
        name: person.name,
        surname: person.surname || item.surname,
        birthDate: person.birthDate || item.birthDate,
        personId: person.id,
        isGuest: false,
      };
      onLogin(authUser);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close button if optional */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 p-6 text-white text-center relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner mb-3">
            <TreePine className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            7 Ajdod Shajarasiga Kirish
          </h2>
          <p className="text-emerald-100 text-xs mt-1 max-w-sm mx-auto">
            Ism, familiya va tug'ilgan sanangizni kiriting. Shajaradagi o'z o'rningiz avtomatik aniqlanadi.
          </p>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSearchAndLogin} className="space-y-4">
            {/* Ism */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ismingiz</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-login-name"
                type="text"
                required
                placeholder="Masalan: Muhammadrizo, Muxiddin, Dilafruz"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Familiya */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Familiyangiz (ixtiyoriy)</span>
              </label>
              <input
                id="input-login-surname"
                type="text"
                placeholder="Masalan: Xudoberdiyev"
                value={surname}
                onChange={(e) => {
                  setSurname(e.target.value);
                  setError('');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* To'liq Tug'ilgan sana */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>To'liq tug'ilgan sanangiz</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-login-birthdate"
                type="date"
                required
                value={birthDate}
                onChange={(e) => {
                  setBirthDate(e.target.value);
                  setError('');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400">
                Kun, oy va yil (masalan: 15/05/2005)
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                id="btn-submit-login"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Shajaradagi o'rnimni topish va kirish</span>
              </button>
            </div>
          </form>

          {/* Quick 2+ Logins Section (faqat 2+ marta kirilgan shaxslar uchun, max 3 ta) */}
          {quickLogins.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Tezkor kirish (2+ marta kirilganlar):</span>
                </span>
                <span className="text-emerald-600 font-medium">1 marta bosish bilan</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickLogins.map((item) => {
                  const p = people[item.personId];
                  if (!p) return null;
                  return (
                    <div
                      key={item.personId}
                      onClick={() => handleQuickLoginClick(item)}
                      className="group relative p-2.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50 cursor-pointer text-left transition-all flex items-center justify-between shadow-xs hover:shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-emerald-950 dark:text-emerald-200 truncate">
                            {item.name} {item.surname ? item.surname.charAt(0) + '.' : ''}
                          </div>
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 truncate">
                            {item.birthDate || `${p.generation}-pusht`} • {item.count} marta kirilgan
                          </div>
                        </div>
                      </div>

                      {/* Delete from quick login button */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteQuickLogin(e, item.personId)}
                        title="Tezkor kirishdan o'chirish"
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors opacity-70 group-hover:opacity-100 flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Guest login action */}
          <div className="pt-2 flex items-center justify-center border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleGuestEntry}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 py-1.5 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Mehmon sifatida kirish (faqat ko'rish uchun)</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
