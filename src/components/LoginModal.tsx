import React, { useState, useEffect, useRef } from 'react';
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
  AlertTriangle,
  Copy,
  Check,
  X, 
  UserPlus, 
  Bot,
  ShieldCheck,
  Key
} from 'lucide-react';
import { 
  signInWithGooglePopup, 
  syncGoogleUserWithBackend, 
  GoogleAuthCancelledError 
} from '../utils/googleAuth';
import { 
  sanitizeInput, 
  isValidEmail, 
  checkPasswordStrength, 
  get2FAConfig, 
  verify2FAPin, 
  getLoginAttempts, 
  recordFailedLoginAttempt, 
  clearLoginAttempts 
} from '../utils/security';

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
  const regStrength = checkPasswordStrength(regPassword);

  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [googleFallbackInfo, setGoogleFallbackInfo] = useState<{
    type: 'origin_mismatch' | 'popup_blocked' | 'sdk_failed' | 'timeout' | 'other';
    title: string;
    message: string;
    domain?: string;
  } | null>(null);
  const [copiedDomain, setCopiedDomain] = useState<boolean>(false);
  const googleLoadingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (googleLoadingTimeoutRef.current) {
        clearTimeout(googleLoadingTimeoutRef.current);
      }
    };
  }, []);

  const [error, setError] = useState<string>('');

  // Xavfsizlik: Brute-force & Rate Limit holati
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(() => {
    const attempts = getLoginAttempts();
    return attempts.lockedUntil > Date.now() ? Math.ceil((attempts.lockedUntil - Date.now()) / 1000) : 0;
  });

  // 2FA PIN kiritish holati
  const [requires2FA, setRequires2FA] = useState<boolean>(false);
  const [pin2FA, setPin2FA] = useState<string>('');
  const [pendingAuthUser, setPendingAuthUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          clearLoginAttempts();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  useEffect(() => {
    if (targetPersonId) {
      setRegPersonId(targetPersonId);
    }
  }, [targetPersonId]);

  if (!isOpen) return null;

  const peopleList = Object.values(people) as Person[];
  const isTreeEmpty = peopleList.length === 0;

  // Parol mustahkamligi hisobi
  const passStrength = checkPasswordStrength(regPassword);

  // Ro'yxatdan o'tish (Faqat Ism-familiya, Telefon va Email majburiy)
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanName = sanitizeInput(regFullName, 100);
    const cleanEmail = sanitizeInput(regEmail, 150).toLowerCase();
    const cleanPhone = sanitizeInput(regPhone, 30);
    const cleanPassword = regPassword.trim();

    if (!cleanName) {
      setError("Iltimos, ism va familiyangizni to'g'ri kiriting");
      return;
    }
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setError("Iltimos, haqiqiy va to'g'ri email manzilini kiriting (masalan: nom@domain.uz)");
      return;
    }
    if (!cleanPassword || cleanPassword.length < 6) {
      setError("Xavfsizlik: Parol kamida 6 ta belgidan iborat bo'lishi shart!");
      return;
    }
    if (!agreedToTerms) {
      setError("Iltimos, foydalanish shartlari va maxfiylik siyosatiga rozilik bildiring");
      return;
    }

    const res = registerNewUser({
      fullName: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password: cleanPassword,
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

  // LoginModal.tsx — handleGoogleLogin funksiyasini shu bilan almashtiring

const handleGoogleLogin = async () => {
  setError('');
  setGoogleFallbackInfo(null);
  setIsGoogleLoading(true);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  if (googleLoadingTimeoutRef.current) clearTimeout(googleLoadingTimeoutRef.current);
  googleLoadingTimeoutRef.current = setTimeout(() => {
    setIsGoogleLoading(false);
    setGoogleFallbackInfo({
      type: 'timeout',
      title: "Google avtorizatsiya oynasi javob bermadi",
      message: "Google oynasi o'z vaqtida yakunlanmadi. Brauzerda popup ruxsat bering yoki email/parol orqali kiring.",
    });
  }, 12000);

  if (typeof window !== 'undefined' && !window.google?.accounts?.oauth2) {
    if (googleLoadingTimeoutRef.current) clearTimeout(googleLoadingTimeoutRef.current);
    setIsGoogleLoading(false);
    setGoogleFallbackInfo({
      type: 'sdk_failed',
      title: "Google Identity xizmati yuklanmadi",
      message: "Sahifani yangilang yoki email/parol orqali kiring.",
    });
    return;
  }

  try {
    // 1. Google'dan profil olamiz
    const authUser = await signInWithGooglePopup();

    // 2. Supabase'ga to'g'ridan-to'g'ri upsert qilamiz
    if (authUser.googleId && authUser.email) {
      try {
        const sbUrl = (import.meta as any).env?.VITE_SUPABASE_URL || localStorage.getItem('shajarachi_supabase_url') || '';
        const sbKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || localStorage.getItem('shajarachi_supabase_anon_key') || '';

        if (sbUrl && sbKey && sbUrl.includes('supabase.co')) {
          const h = {
            'Content-Type': 'application/json',
            apikey: sbKey,
            Authorization: `Bearer ${sbKey}`,
            Prefer: 'return=representation',
          };

          // Email bo'yicha mavjudligini tekshir
          const checkRes = await fetch(
            `${sbUrl}/rest/v1/users?email=eq.${encodeURIComponent(authUser.email)}&select=id,person_id`,
            { headers: h }
          );
          const existing = await checkRes.json();

          let dbUserId: string;
          let isNewUser = false;

          if (Array.isArray(existing) && existing.length > 0) {
            // Mavjud foydalanuvchi
            dbUserId = existing[0].id;
            await fetch(`${sbUrl}/rest/v1/users?id=eq.${dbUserId}`, {
              method: 'PATCH',
              headers: h,
              body: JSON.stringify({
                google_id: authUser.googleId,
                photo_url: authUser.photoUrl || null,
                last_login: new Date().toISOString(),
              }),
            });
            if (existing[0].person_id) {
              authUser.personId = existing[0].person_id;
            }
          } else {
            // Yangi foydalanuvchi
            isNewUser = true;
            const createRes = await fetch(`${sbUrl}/rest/v1/users`, {
              method: 'POST',
              headers: h,
              body: JSON.stringify({
                google_id: authUser.googleId,
                full_name: authUser.fullName,
                email: authUser.email,
                photo_url: authUser.photoUrl || null,
                role: 'owner',
                created_at: new Date().toISOString(),
                last_login: new Date().toISOString(),
              }),
            });
            const created = await createRes.json();
            dbUserId = Array.isArray(created) && created.length > 0
              ? created[0].id
              : `google_${authUser.googleId}`;
          }

          // Haqiqiy UUID ni set qilamiz
          authUser.id = dbUserId;

          // Oila a'zoligini tekshir
          const memRes = await fetch(
            `${sbUrl}/rest/v1/family_members?user_id=eq.${dbUserId}&select=family_id`,
            { headers: h }
          );
          const members = await memRes.json();

          if (Array.isArray(members) && members.length > 0) {
            authUser.familyId = members[0].family_id;
          } else if (isNewUser) {
            // Yangi oila yaratamiz
            const famRes = await fetch(`${sbUrl}/rest/v1/families`, {
              method: 'POST',
              headers: h,
              body: JSON.stringify({
                name: `${authUser.name}ning Shajarasi`,
                created_by: dbUserId,
                created_at: new Date().toISOString(),
              }),
            });
            const families = await famRes.json();
            if (Array.isArray(families) && families.length > 0) {
              authUser.familyId = families[0].id;
              // Trigger qo'shadi, lekin backup:
              await fetch(`${sbUrl}/rest/v1/family_members`, {
                method: 'POST',
                headers: { ...h, Prefer: 'resolution=merge-duplicates' },
                body: JSON.stringify({
                  family_id: authUser.familyId,
                  user_id: dbUserId,
                  role: 'owner',
                }),
              }).catch(() => {});
            }
          }
        }
      } catch (sbErr) {
        console.warn('[Google Auth] Supabase upsert xatolik (lokal rejim davom etadi):', sbErr);
      }
    }

    // 3. Session va App state ni yangilaymiz
    setCurrentSessionUser(authUser);
    onLogin(authUser, { gender: regGender });

  } catch (err: any) {
    const errCode = err?.code;
    const errMsg = err?.message || '';
    const isCancelled = err instanceof GoogleAuthCancelledError || errCode === 'POPUP_CLOSED' || err?.isCancelled;
    const isPopupBlocked = errCode === 'POPUP_BLOCKED';

    if (isPopupBlocked) {
      setGoogleFallbackInfo({
        type: 'popup_blocked',
        title: "Qalqib chiquvchi oyna bloklandi",
        message: "Brauzer qidiruv qatoridagi popup belgisini bosib, «Ruxsat berish»ni tanlang.",
      });
    } else if (isCancelled) {
      setError("Google hisobini tanlash bekor qilindi.");
    } else {
      setGoogleFallbackInfo({
        type: 'other',
        title: "Google orqali kirish amalga oshmadi",
        message: errMsg || "Email/Parol yoki Telegram orqali kirishingiz mumkin.",
      });
    }
  } finally {
    if (googleLoadingTimeoutRef.current) clearTimeout(googleLoadingTimeoutRef.current);
    setIsGoogleLoading(false);
  }
};

  // Kirish (Brute-force himoyasi va 2FA bilan)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (lockoutRemaining > 0) {
      setError(`Xavfsizlik himoyasi: Juda ko'p xato urinishlar tufayli tizim ${lockoutRemaining} soniyaga bloklandi.`);
      return;
    }

    const cleanIdentifier = sanitizeInput(loginIdentifier, 150);
    const cleanPassword = loginPassword.trim();

    if (!cleanIdentifier) {
      setError("Email yoki telefon raqamingizni kiriting");
      return;
    }
    if (!cleanPassword) {
      setError("Parolingizni kiriting");
      return;
    }

    const res = loginUserWithCredentials(cleanIdentifier, cleanPassword);
    if (!res.success || !res.user) {
      const lockStatus = recordFailedLoginAttempt();
      if (lockStatus.isLocked) {
        setLockoutRemaining(lockStatus.remainingSeconds);
        setError(`Xavfsizlik: 5 marta xato parol kiritildi! Tizim ${lockStatus.remainingSeconds} soniyaga bloklandi.`);
      } else {
        setError(res.error || "Login yoki parol noto'g'ri kiritildi");
      }
      return;
    }

    // Muvaffaqiyatli parol kiritildi — urinishlar tarixini tozalash
    clearLoginAttempts();
    setLockoutRemaining(0);

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

    // 2-Bosqichli himoyani (2FA) tekshirish
    const twoFactor = get2FAConfig();
    if (twoFactor.isEnabled && twoFactor.pinHash) {
      setPendingAuthUser(authUser);
      setRequires2FA(true);
      setError('');
      return;
    }

    onLogin(authUser);
  };

  // 2FA PIN kodini tasdiqlash
  const handleVerify2FASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const twoFactor = get2FAConfig();

    if (!verify2FAPin(pin2FA, twoFactor.pinHash, twoFactor.backupKey)) {
      setError("Noto'g'ri 2FA PIN kod yoki favqulodda tiklash kodi kiritildi!");
      return;
    }

    if (pendingAuthUser) {
      setRequires2FA(false);
      onLogin(pendingAuthUser);
    }
  };

  // Telegram orqali tezkor va parolsiz kirish (3-rasmdagi prompt o'rniga to'g'ridan-to'g'ri botga yo'naltirish)
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
      // Prompt oynasi o'rniga to'g'ridan-to'g'ri Telegram botga yo'naltirish
      try {
        window.open('https://t.me/shajarachi_bot?start=login', '_blank');
      } catch {
        window.location.href = 'https://t.me/shajarachi_bot?start=login';
      }
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
                {/* Parol mustahkamligi indikatori */}
                {regPassword.length > 0 && (
                  <div className="pt-1.5 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">Parol mustahkamligi:</span>
                      <span className={`font-bold ${
                        regStrength.score >= 4 ? 'text-emerald-600' :
                        regStrength.score >= 3 ? 'text-blue-600' :
                        regStrength.score >= 2 ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        {regStrength.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full flex-1 rounded-full transition-all duration-300 ${
                            regStrength.score >= step
                              ? regStrength.score >= 4 ? 'bg-emerald-500'
                                : regStrength.score >= 3 ? 'bg-blue-500'
                                : regStrength.score >= 2 ? 'bg-amber-500'
                                : 'bg-rose-500'
                              : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                    {regStrength.feedback && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">{regStrength.feedback}</p>
                    )}
                  </div>
                )}
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

          {/* TAB 2: TIZIMGA KIRISH (LOGIN) & 2FA HIMOYA */}
          {activeTab === 'login' && (
            requires2FA ? (
              <form onSubmit={handleVerify2FASubmit} className="space-y-4 animate-in fade-in duration-200">
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-1.5">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                    2-Bosqichli Tasdiqlash (2FA)
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Hisobingiz ikki bosqichli himoya bilan himoyalangan. 6 xonali PIN kodingizni yoki favqulodda tiklash kalitingizni kiriting.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>2FA PIN kod yoki Favqulodda Kalit</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    autoFocus
                    placeholder="Masalan: 123456 yoki SHJ-XXXX-XXXX"
                    value={pin2FA}
                    onChange={(e) => setPin2FA(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm tracking-widest text-center font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>PIN kodni tasdiqlash va Kirish</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRequires2FA(false);
                      setPin2FA('');
                      setError('');
                    }}
                    className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    ← Boshqa hisob bilan kirish
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-3.5">
                {lockoutRemaining > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      Haddan tashqari ko'p xato urinish! Hisob himoyasi uchun{' '}
                      <span className="font-bold">{lockoutRemaining} soniya</span> kuting.
                    </div>
                  </div>
                )}

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
                    disabled={lockoutRemaining > 0}
                    className={`w-full py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      lockoutRemaining > 0
                        ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white'
                    }`}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{lockoutRemaining > 0 ? `Qulflangan (${lockoutRemaining}s)` : 'Tizimga kirish'}</span>
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
            )
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
                disabled={isGoogleLoading}
                onClick={handleGoogleLogin}
                className={`w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer ${
                  isGoogleLoading ? 'opacity-70 cursor-wait' : ''
                }`}
              >
                {isGoogleLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span>Ulanmoqda...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Google orqali</span>
                  </>
                )}
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

            {/* Fallback UI: Google SDK xatosi, Origin mismatch yoki Popup bloklanganda tushunarli ko'rsatma */}
            {googleFallbackInfo && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-slate-800 dark:text-slate-200 space-y-2.5 animate-in fade-in slide-in-from-top-1 text-left">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{googleFallbackInfo.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGoogleFallbackInfo(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
                    title="Yopish"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                  {googleFallbackInfo.message}
                </p>

                {googleFallbackInfo.domain && (
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-amber-100/60 dark:bg-amber-900/30 p-2.5 rounded-xl leading-relaxed">
                      Google OAuth xizmati rasmiy tasdiqlangan domenda (<strong>https://shajarachi.vercel.app</strong>) to'liq ishlaydi. Ushbu sinov muhitida esa quyidagi Email/Parol yoki Telegram orqali kirishingiz mumkin.
                    </div>
                  </div>
                )}

                <div className="pt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setGoogleFallbackInfo(null);
                      setActiveTab('login');
                    }}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Email va parol bilan kirish →
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGoogleLogin()}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                  >
                    Qayta urinish
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
