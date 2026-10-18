import React, { useState, useEffect } from 'react';
import { AuthUser, Person, RegisteredAccount } from '../types';
import { 
  registerNewUser, 
  loginUserWithCredentials, 
  getRegisteredUsers,
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
  Check
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  people: Record<string, Person>;
  onLogin: (user: AuthUser) => void;
  inviteCode?: string | null;
  targetPersonId?: string | null;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  people,
  onLogin,
  inviteCode,
  targetPersonId
}) => {
  const [activeTab, setActiveTab] = useState<'register' | 'login'>(inviteCode ? 'register' : 'login');
  
  // Register state
  const [regFullName, setRegFullName] = useState<string>('');
  const [regBirthDate, setRegBirthDate] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('+998 ');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regPersonId, setRegPersonId] = useState<string>(targetPersonId || '');

  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    if (targetPersonId) {
      setRegPersonId(targetPersonId);
    }
    if (inviteCode) {
      setActiveTab('register');
    }
  }, [targetPersonId, inviteCode]);

  if (!isOpen) return null;

  const peopleList = Object.values(people) as Person[];

  // Ro'yxatdan o'tish
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!regFullName.trim() || regFullName.trim().split(' ').length < 2) {
      setError("Iltimos, to'liq ism va familiyangizni kiriting (masalan: Muhammadrizo Xudoberdiyev)");
      return;
    }
    if (!regBirthDate) {
      setError("Iltimos, tug'ilgan sanangizni tanlang");
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setError("Iltimos, to'g'ri email manzilini kiriting");
      return;
    }
    if (!regPhone.trim() || regPhone.trim().length < 9) {
      setError("Iltimos, to'liq telefon raqamingizni kiriting");
      return;
    }
    if (!regPassword || regPassword.length < 5) {
      setError("Parol kamida 5 ta belgidan iborat bo'lishi kerak");
      return;
    }

    const res = registerNewUser({
      fullName: regFullName.trim(),
      birthDate: regBirthDate,
      email: regEmail.trim(),
      phone: regPhone.trim(),
      password: regPassword,
      personId: regPersonId || undefined,
      role: 'editor',
    });

    if (!res.success || !res.user) {
      setError(res.error || "Ro'yxatdan o'tishda xatolik");
      return;
    }

    // Tarixga yozish
    addHistoryRecord({
      action: 'user_registered',
      actorName: res.user.fullName,
      title: "Yangi oila a'zosi ro'yxatdan o'tdi",
      description: `${res.user.fullName} shajaraga qo'shildi va to'ldirish huquqiga ega bo'ldi.`,
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
      birthDate: res.user.birthDate,
      personId: res.user.personId,
      role: res.user.role,
      isGuest: false,
    };

    onLogin(authUser);
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
    };

    onLogin(authUser);
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 animate-in fade-in zoom-in-95 duration-200">
        
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Top Header Banner with 1-rasmdagi daraxt logosi */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 p-6 text-white text-center relative">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner mb-3 p-1">
            <FamilyTreeLogo className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            7 Ajdod Shajarasi
          </h2>
          <p className="text-emerald-100 text-xs mt-1 max-w-sm mx-auto">
            {inviteCode 
              ? "Siz oilaviy shajaraga taklif qilindingiz! Ro'yxatdan o'ting." 
              : "Oila a'zolari bilan birgalikda shajara daraxtini tuzing va to'ldiring"}
          </p>
        </div>

        {/* Tabs: Kirish vs Ro'yxatdan o'tish */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-1">
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
            <span>Tizimga Kirish</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('register');
              setError('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'register'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Ro'yxatdan O'tish</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* TAB 1: RO'YXATDAN O'TISH (REGISTER) */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* To'liq Ism-familiya */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ism va Familiyangiz (to'liq)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Muhammadrizo Xudoberdiyev"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Tug'ilgan sana va Shajaradagi shaxs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tug'ilgan sana</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={regBirthDate}
                    onChange={(e) => setRegBirthDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Shajaradagi o'rningiz</span>
                  </label>
                  <select
                    value={regPersonId}
                    onChange={(e) => setRegPersonId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="">Yangi a'zo (Yaratish)</option>
                    {peopleList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.surname || ''} ({p.generation}-pusht)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Email & Telefon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Email</span>
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

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Telefon</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+998 90 123 45 67"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Parol */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Maxfiy Parol</span>
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Kamida 5 ta belgi"
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

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Ro'yxatdan o'tish va Shajaraga kirish</span>
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
                  <span>Email yoki Telefon raqamingiz</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Email yoki +998..."
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
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
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
                  Hisobingiz yo'qmi? Yangi ro'yxatdan o'tish →
                </button>
              </div>
            </form>
          )}

          {/* Guest Entry */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              type="button"
              onClick={handleGuestEntry}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 py-1 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>Mehmon sifatida kirish (faqat ko'rish rejimi)</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
