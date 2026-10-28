import React, { useState, useEffect } from 'react';
import { AuthUser, Gender, Person, RegisteredAccount } from '../types';
import { 
  registerNewUser, 
  loginUserWithCredentials, 
  loginWithTelegram,
  setCurrentSessionUser 
} from '../utils/userAuthStorage';
import { addHistoryRecord } from '../utils/historyStorage';
import { FamilyTreeLogo } from './FamilyTreeLogo';
import { 
  LogIn, 
  User, 
  Calendar, 
  Mail, 
  Phone, 
  Lock, 
  Sparkles, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  UserPlus, 
  ShieldCheck,
  Bot
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  people: Record<string, Person>;
  onLogin: (user: AuthUser, initialPersonData?: { gender: Gender }) => void;
  inviteCode?: string | null;
  targetPersonId?: string | null;
  onOpenTelegramModal?: () => void;
  onOpenPolicy?: (type: 'privacy' | 'terms' | 'offer' | 'consent') => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  people,
  onLogin,
  inviteCode,
  targetPersonId,
  onOpenTelegramModal,
  onOpenPolicy,
}) => {
  // Ilk marta kelgan foydalanuvchilar uchun boshlang'ich tab HAR DOIM 'register' (Ro'yxatdan o'tish)
  const [activeTab, setActiveTab] = useState<'register' | 'login'>('register');
  
  // Register state
  const [regFullName, setRegFullName] = useState<string>('');
  const [regGender, setRegGender] = useState<Gender>('male');
  const [regBirthDate, setRegBirthDate] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('+998 ');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regPersonId, setRegPersonId] = useState<string>(targetPersonId || '');
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(true);

  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (targetPersonId) {
      setRegPersonId(targetPersonId);
    }
  }, [targetPersonId]);

  if (!isOpen) return null;

  const peopleList = Object.values(people) as Person[];
  const isTreeEmpty = peopleList.length === 0;

  // Ro'yxatdan o'tish (Faqat Ism-familiya, Telefon va Email majburiy)
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regFullName.trim()) {
      setError("Iltimos, ism va familiyangizni kiriting");
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setError("Iltimos, to'g'ri email manzilini kiriting");
      return;
    }
    if (!regPassword.trim() || regPassword.trim().length < 4) {
      setError("Iltimos, kamida 4 belgidan iborat parol kiriting");
      return;
    }
    if (!agreedToTerms) {
      setError("Iltimos, foydalanish shartlari va maxfiylik siyosatiga rozilik bildiring");
      return;
    }

    const res = registerNewUser({
      fullName: regFullName.trim(),
      email: regEmail.trim(),
      password: regPassword.trim(),
      role: isTreeEmpty ? 'owner' : 'editor',
    });

    if (!res.success || !res.user) {
      setError(res.error || "Ro'yxatdan o'tishda xatolik yuz berdi");
      return;
    }

    // Tarixga yozish
    addHistoryRecord({
      action: 'user_registered',
      actorName: res.user.fullName,
      title: "Yangi foydalanuvchi ro'yxatdan o'tdi",
      description: `${res.user.fullName} ro'yxatdan o'tib, ${isTreeEmpty ? 'yangi shajara yaratuvchisi' : 'shajara a\'zosi'} bo'ldi.`,
      details: `Email: ${res.user.email}, Tel: ${res.user.phone}`
    });

    const parts = res.user.fullName.split(' ');
    const authUser: AuthUser = {
      id: res.user.id,
      name: parts[0] || res.user.fullName,
      surname: parts.slice(1).join(' ') || undefined,
      fullName: res.user.fullName,
      email: res.user.email,
      phone: res.user.phone,
      birthDate: res.user.birthDate || undefined,
      personId: res.user.personId,
      role: res.user.role,
      isGuest: false,
      authProvider: 'credentials',
    };

    onLogin(authUser, { gender: regGender });
  };

  const handleGoogleLogin = () => {
    const defaultEmail = "muhammadrizoxudoberdiyev834@gmail.com";
    const enteredEmail = prompt("Google hisobingiz email manzilini kiriting (yoki tezkor kirish uchun OK ni bosing):", defaultEmail);
    if (enteredEmail === null) return;
    const effectiveEmail = enteredEmail.trim() || defaultEmail;
    const namePart = effectiveEmail.split('@')[0].replace(/[._-]/g, ' ');
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

    const authUser: AuthUser = {
      id: `google_${Date.now()}`,
      name: formattedName.split(' ')[0] || "Foydalanuvchi",
      surname: formattedName.split(' ')[1] || undefined,
      fullName: formattedName,
      email: effectiveEmail,
      role: isTreeEmpty ? 'owner' : 'editor',
      isGuest: false,
      authProvider: 'credentials',
    };

    addHistoryRecord({
      action: 'user_registered',
      actorName: authUser.fullName || authUser.name,
      title: "Google orqali tizimga kirildi",
      description: `${authUser.fullName} Google hisobi orqali tizimga kirdi.`,
      details: `Email: ${authUser.email}`
    });

    onLogin(authUser, { gender: regGender });
  };

  // Kirish
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!loginIdentifier.trim()) {
      setError("Email yoki telefon raqamingizni kiriting");
      return;
    }
    if (!loginPassword) {
      setError("Parolingizni kiriting");
      return;
    }

    const res = loginUserWithCredentials(loginIdentifier, loginPassword);
    if (!res.success || !res.user) {
      setError(res.error || "Kirishda xatolik yuz berdi");
      return;
    }

    const parts = res.user.fullName.split(' ');
    const authUser: AuthUser = {
      id: res.user.id,
      name: parts[0] || res.user.fullName,
      surname: parts.slice(1).join(' ') || undefined,
      fullName: res.user.fullName,
      email: res.user.email,
      phone: res.user.phone,
      birthDate: res.user.birthDate,
      personId: res.user.personId,
      role: res.user.role,
      isGuest: false,
      authProvider: res.user.authProvider || 'credentials',
    };

    onLogin(authUser);
  };

  // Telegram orqali tezkor va parolsiz kirish
  const handleTelegramLogin = () => {
    setError('');
    const twaUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    
    if (twaUser) {
      const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
      const res = loginWithTelegram(twaUser, startParam);
      
      const parts = res.user.fullName.split(' ');
      const authUser: AuthUser = {
        id: res.user.id,
        name: parts[0] || res.user.fullName,
        surname: parts.slice(1).join(' ') || undefined,
        fullName: res.user.fullName,
        email: res.user.email,
        phone: res.user.phone,
        personId: res.user.personId,
        role: res.user.role,
        isGuest: false,
        telegramId: res.user.telegramId,
        telegramUsername: res.user.telegramUsername,
        telegramPhotoUrl: res.user.telegramPhotoUrl,
        authProvider: 'telegram',
      };
      onLogin(authUser, { gender: 'male' });
    } else {
      const inputUsername = window.prompt("Telegram username yoki to'liq ismingizni kiriting:", "Alisher");
      if (!inputUsername) return;

      const mockTgUser = {
        id: Math.floor(100000000 + Math.random() * 900000000),
        first_name: inputUsername.replace('@', ''),
        username: inputUsername.replace('@', ''),
      };
      const res = loginWithTelegram(mockTgUser);
      const parts = res.user.fullName.split(' ');
      const authUser: AuthUser = {
        id: res.user.id,
        name: parts[0] || res.user.fullName,
        surname: parts.slice(1).join(' ') || undefined,
        fullName: res.user.fullName,
        email: res.user.email,
        phone: res.user.phone,
        personId: res.user.personId,
        role: res.user.role,
        isGuest: false,
        telegramId: res.user.telegramId,
        telegramUsername: res.user.telegramUsername,
        authProvider: 'telegram',
      };
      onLogin(authUser, { gender: 'male' });
    }
  };

  // Mehmon rejimi
  const handleGuestEntry = () => {
    const authUser: AuthUser = {
      name: 'Mehmon',
      isGuest: true,
      role: 'viewer'
    };
    setCurrentSessionUser(authUser);
    onLogin(authUser);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-start sm:justify-center p-2 sm:p-4 overscroll-contain">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col my-auto max-h-[94vh] sm:max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 px-4 py-3.5 sm:px-6 sm:py-5 text-white text-center relative shrink-0">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 z-40 p-2 sm:p-2.5 rounded-full bg-black/30 hover:bg-black/50 text-white active:scale-90 transition-all shadow-md border border-white/20 flex items-center justify-center cursor-pointer"
              title="Oynani yopish va mehmon sahifasiga o'tish"
              aria-label="Yopish"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          <div className="w-11 h-11 sm:w-14 sm:h-14 mx-auto rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner mb-2 p-1">
            <FamilyTreeLogo className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            7 Ajdod Shajarasi
          </h2>
          <p className="text-emerald-100 text-[11px] sm:text-xs mt-0.5 max-w-sm mx-auto">
            {inviteCode 
              ? "Siz oilaviy shajaraga taklif qilindingiz! Ro'yxatdan o'ting." 
              : isTreeEmpty
                ? "Yangi shajara yaratish uchun ro'yxatdan o'ting"
                : "Oila a'zolari bilan birgalikda shajara daraxtini tuzing"}
          </p>
        </div>

        {/* Tabs: Ro'yxatdan o'tish (birinchi) vs Kirish */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-1 shrink-0">
          <button
            onClick={() => {
              setActiveTab('register');
              setError('');
            }}
            className={`flex-1 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'register'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Ro'yxatdan O'tish</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('login');
              setError('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'login'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Mavjud Hisobga Kirish</span>
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* Telegram orqali tezkor kirish tugmasi */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-slate-800/80 dark:to-cyan-950/30 border border-sky-200 dark:border-sky-900/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#24A1DE] text-white flex items-center justify-center shrink-0 shadow-sm">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.99 1.27-5.61 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.89.03-.25.38-.51 1.05-.78 4.12-1.79 6.87-2.97 8.25-3.54 3.92-1.63 4.74-1.91 5.27-1.92.12 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.19-.04.34z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Telegram orqali parolsiz kirish
                </p>
                <p className="text-[11px] text-slate-500">
                  Python bot (@shajarachi_bot) orqali avtomatik bog'lanadi
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTelegramLogin}
              className="px-3.5 py-2 rounded-xl bg-[#24A1DE] hover:bg-[#1E8BC0] text-white text-xs font-bold shadow-sm transition active:scale-95 shrink-0"
            >
              Telegram bilan kirish
            </button>
          </div>

          <div className="relative flex items-center justify-center my-1">
            <div className="border-t border-slate-200 dark:border-slate-700 w-full" />
            <span className="bg-white dark:bg-slate-900 px-3 text-[11px] text-slate-400 uppercase tracking-wider shrink-0 font-medium">
              Yoki quyidagi formani to'ldiring
            </span>
          </div>

          {/* TAB 1: RO'YXATDAN O'TISH (REGISTER) */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* To'liq Ism-familiya */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ism va Familiyangiz</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Rustam Karimov"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Email manzilingiz</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="namuna@mail.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Parol */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Parol</span>
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Kamida 4 ta belgi"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Shartlarga rozilik checkboxi */}
              <div className="flex items-start gap-2 pt-1 text-left">
                <input
                  type="checkbox"
                  id="reg-terms-checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer shrink-0"
                />
                <label htmlFor="reg-terms-checkbox" className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight cursor-pointer">
                  Men{' '}
                  <button
                    type="button"
                    onClick={() => onOpenPolicy?.('terms')}
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    Foydalanish shartlari
                  </button>{' '}
                  va{' '}
                  <button
                    type="button"
                    onClick={() => onOpenPolicy?.('privacy')}
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    Maxfiylik siyosati
                  </button>
                  ga roziman.
                </label>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Ro'yxatdan o'tish va Shajarani boshlash</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: TIZIMGA KIRISH (LOGIN) */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Email manzilingiz</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="namuna@mail.com"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Parolingiz</span>
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Parolni kiriting"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Tizimga kirish</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  Yangi foydalanuvchimisiz? Ro'yxatdan o'tish →
                </button>
              </div>
            </form>
          )}

          {/* Social Logins: Google & Telegram (Mehmon tugmasi o'rniga) */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="relative flex py-0.5 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
              <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Yoki quyidagilar orqali kiring
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Google orqali kirish */}
              <button
                id="btn-google-login"
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google orqali</span>
              </button>

              {/* Telegram orqali kirish */}
              <button
                id="btn-telegram-login"
                type="button"
                onClick={handleTelegramLogin}
                className="w-full py-2.5 px-3 rounded-xl bg-[#24A1DE] hover:bg-[#1f8ec4] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <Bot className="w-4 h-4" />
                <span>Telegram bot orqali</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
