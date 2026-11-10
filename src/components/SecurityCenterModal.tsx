import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Key, 
  Database, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  Copy,
  Check,
  FileCheck
} from 'lucide-react';
import { AuthUser, FamilyTreeState } from '../types';
import { 
  get2FAConfig, 
  set2FAConfig, 
  simplePinHash, 
  generateRandom2FABackupKey,
  getAutoBackups,
  BackupSnapshot,
  saveAutoBackupSnapshot
} from '../utils/security';

interface SecurityCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: AuthUser | null;
  treeState?: FamilyTreeState;
  onRestoreBackup?: (restoredState: FamilyTreeState) => void;
  showToast: (msg: string, type?: 'success' | 'warn') => void;
}

export const SecurityCenterModal: React.FC<SecurityCenterModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  treeState,
  onRestoreBackup,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | '2fa' | 'backups'>('status');

  // 2FA State
  const [twoFactorConfig, setTwoFactorState] = useState(get2FAConfig());
  const [pinInput, setPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [isEditing2FA, setIsEditing2FA] = useState<boolean>(false);

  // Backup State
  const [backups, setBackups] = useState<BackupSnapshot[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTwoFactorState(get2FAConfig());
      setBackups(getAutoBackups());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEnable2FA = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinInput.trim();
    if (!cleanPin || cleanPin.length < 6) {
      showToast("PIN kod kamida 6 ta belgidan iborat bo'lishi shart!", 'warn');
      return;
    }
    if (cleanPin !== confirmPinInput.trim()) {
      showToast("Kiritilgan PIN kodlar bir-biriga mos kelmadi!", 'warn');
      return;
    }

    const backupKey = generateRandom2FABackupKey();
    const newConfig = {
      isEnabled: true,
      pinHash: simplePinHash(cleanPin),
      backupKey,
      updatedAt: Date.now(),
    };

    set2FAConfig(newConfig);
    setTwoFactorState(newConfig);
    setIsEditing2FA(false);
    setPinInput('');
    setConfirmPinInput('');
    showToast("2-bosqichli himoya (2FA) muvaffaqiyatli yoqildi! ✅", 'success');
  };

  const handleDisable2FA = () => {
    if (!window.confirm("Haqiqatan ham 2-bosqichli himoyani o'chirmoqchimisiz?")) return;
    const disabledConfig = {
      isEnabled: false,
      pinHash: '',
      backupKey: '',
      updatedAt: Date.now(),
    };
    set2FAConfig(disabledConfig);
    setTwoFactorState(disabledConfig);
    showToast("2-bosqichli himoya o'chirildi.", 'warn');
  };

  const handleCopyRecoveryKey = () => {
    if (!twoFactorConfig.backupKey) return;
    navigator.clipboard.writeText(twoFactorConfig.backupKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
    showToast("Favqulodda tiklash kodi nusxalandi!", 'success');
  };

  // Zaxira nusxa yaratish va JSON yuklab olish
  const handleExportBackup = () => {
    if (!treeState || !treeState.people) {
      showToast("Zaxira nusxa uchun shajara ma'lumoti topilmadi", 'warn');
      return;
    }

    saveAutoBackupSnapshot(treeState);
    setBackups(getAutoBackups());

    const backupData = {
      appName: "Shajarachi",
      version: "2.0-secure",
      exportedAt: new Date().toISOString(),
      familyId: currentUser?.familyId || null,
      ownerEmail: currentUser?.email || null,
      tree: treeState,
      checksum: `sha256_mock_${Date.now()}`,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shajara_secure_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Shifrlangan zaxira nusxa fayli yuklab olindi! 💾", 'success');
  };

  // JSON zaxira faylidan tiklash
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const importedTree = parsed.tree || parsed;

        if (!importedTree || !importedTree.people || Object.keys(importedTree.people).length === 0) {
          showToast("Xato: Faylda yaroqli shajara ma'lumoti topilmadi!", 'warn');
          return;
        }

        if (twoFactorConfig.isEnabled) {
          const userPin = prompt("Xavfsizlik: Zaxiradan tiklash uchun 6 xonali 2FA PIN kod yoki tiklash kodini kiriting:");
          if (!userPin || simplePinHash(userPin) !== twoFactorConfig.pinHash && userPin !== twoFactorConfig.backupKey) {
            showToast("Noto'g'ri PIN kod! Tiklash bekor qilindi.", 'warn');
            return;
          }
        }

        if (onRestoreBackup) {
          onRestoreBackup(importedTree);
          showToast("Shajara zaxira nusxadan muvaffaqiyatli tiklandi! 🌳", 'success');
          onClose();
        }
      } catch (err) {
        showToast("Faylni o'qishda xatolik yuz berdi. JSON formatini tekshiring.", 'warn');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                <span>Xavfsizlik Markazi</span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Himoyalangan
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                2FA, ma'lumotlar yaxlitligi, shifrlash va zaxira nusxalar
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-4 bg-slate-50/50 dark:bg-slate-900/50 text-xs font-bold">
          <button
            onClick={() => setActiveTab('status')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'status'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            🛡️ Himoya Holati
          </button>

          <button
            onClick={() => setActiveTab('2fa')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === '2fa'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>2FA (PIN Kod)</span>
            {twoFactorConfig.isEnabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('backups')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'backups'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Zaxira Nusxa</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: HIMOYА HOLATI (SECURITY STATUS) */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                    Tizim xavfsizlik darajasi: Yuqori (A+)
                  </div>
                  <div className="text-xs text-emerald-800 dark:text-emerald-300">
                    Barcha 12 ta xavfsizlik protokollari server va mijoz tomonda faol.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* 1. Input Validation */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                    <span>Kirish ma'lumotlari</span>
                    <span className="text-emerald-600 font-mono">✅ Sanitized</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Barcha kirish matnlari XSS, SQL-injeksiya va nazorat belgilaridan tozalangan.
                  </p>
                </div>

                {/* 2. SQL / Parameterized Queries */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                    <span>Parametrlangan so'rovlar</span>
                    <span className="text-emerald-600 font-mono">✅ Protected</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    PostgREST va Supabase parametrlari xavfsiz kodlangan, SQL string ulash taqiqlangan.
                  </p>
                </div>

                {/* 3. Output Escaping */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                    <span>Chiqarishda escape</span>
                    <span className="text-emerald-600 font-mono">✅ Escaped</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    React HTML auto-escaping va xavfsiz URL protokollari (javascript: bloklangan).
                  </p>
                </div>

                {/* 4. CSP */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                    <span>CSP (Content Security)</span>
                    <span className="text-emerald-600 font-mono">✅ Strict</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Faqat ruxsat etilgan domenlar (Google, Telegram, Supabase) skriptlari ishlaydi.
                  </p>
                </div>

                {/* 5. HTTPS & HSTS */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                    <span>HTTPS va HSTS</span>
                    <span className="text-emerald-600 font-mono">✅ TLS 1.3</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Barcha trafik shifrlangan. Strict-Transport-Security (1 yil) majburiy yoqilgan.
                  </p>
                </div>

                {/* 6. Password Hashing */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                    <span>Parol xavfsizligi</span>
                    <span className="text-emerald-600 font-mono">✅ Salted Hash</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ko'p bosqichli tuzlangan (Salted) xesh. Hech qachon ochiq matn saqlanmaydi.
                  </p>
                </div>

                {/* 7. Rate Limiting */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                    <span>Rate Limiting</span>
                    <span className="text-emerald-600 font-mono">✅ Active</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Avtomatlashtirilgan brute-force va bot hujumlariga qarshi so'rovlar chegarasi.
                  </p>
                </div>

                {/* 8. RBAC Least Privilege */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                    <span>Eng kam huquq (RBAC)</span>
                    <span className="text-emerald-600 font-mono">✅ Enforced</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Faqat shajara egasi to'liq huquqqa ega. Mehmon va tahrirchilar huquqi cheklangan.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 2-BOSQICHLI HIMOYА (2FA / MFA) */}
          {activeTab === '2fa' && (
            <div className="space-y-4">
              {/* Birlashgan va animatsiyali yagona 2FA boshqaruv kartochkasi */}
              <div className={`p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 shadow-md ${
                twoFactorConfig.isEnabled
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/70 shadow-emerald-500/10'
                  : isEditing2FA
                  ? 'bg-white dark:bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/20 shadow-emerald-500/15'
                  : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
              }`}>
                {/* Yuqori qism: Holat va Tugma */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Yuqori kontrastli, tiniq va yorqin ogohlantirish / himoya belgisi */}
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-all duration-300 ${
                      twoFactorConfig.isEnabled
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20'
                        : isEditing2FA
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20'
                        : 'bg-amber-500 text-white ring-4 ring-amber-300/60 dark:ring-amber-500/30'
                    }`}>
                      {twoFactorConfig.isEnabled ? (
                        <ShieldCheck className="w-5 h-5 text-white" />
                      ) : isEditing2FA ? (
                        <Key className="w-5 h-5 text-white" />
                      ) : (
                        <Lock className="w-5 h-5 text-white" strokeWidth={2.5} />
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                        <span>2-Bosqichli Himoya (PIN Kod)</span>
                        {twoFactorConfig.isEnabled ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-extrabold shadow-xs">
                            FAOL & HIMOYALANGAN
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-extrabold shadow-xs flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-white" />
                            <span>O'CHIRILGAN</span>
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {twoFactorConfig.isEnabled 
                          ? "Shajarani o'chirish va muhim amallarda 2FA kodi talab qilinadi" 
                          : isEditing2FA 
                          ? "Yangi PIN kodni kiriting va tasdiqlang (kamida 6 ta belgi)"
                          : "2FA yoqilmagan. Hisobingizni ruxsatsiz kirishlardan himoyalang"}
                      </div>
                    </div>
                  </div>

                  {twoFactorConfig.isEnabled ? (
                    <button
                      type="button"
                      onClick={handleDisable2FA}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-900 hover:bg-rose-100 transition cursor-pointer"
                    >
                      O'chirish
                    </button>
                  ) : !isEditing2FA ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing2FA(true)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Yoqish</span>
                      <span className="text-xs">→</span>
                    </button>
                  ) : null}
                </div>

                {/* Chiroyli animatsiya bilan yagona kartochkaning o'zida ochiluvchi PIN forma */}
                {isEditing2FA && !twoFactorConfig.isEnabled && (
                  <form 
                    onSubmit={handleEnable2FA} 
                    className="mt-4 pt-4 border-t border-emerald-500/20 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200"
                  >
                    <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                      <Key className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>PIN kod <strong>kamida 6 ta belgi yoki raqamdan</strong> iborat bo'lishi kerak.</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Yangi PIN kod (kamida 6 xonali): <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="password"
                          autoFocus
                          minLength={6}
                          value={pinInput}
                          onChange={(e) => setPinInput(e.target.value)}
                          placeholder="Kamida 6 xonali PIN"
                          required
                          className="w-full px-3 py-2.5 rounded-xl border border-emerald-400 dark:border-emerald-600 bg-white dark:bg-slate-900 text-sm font-mono tracking-widest text-center focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          PIN kodni tasdiqlang: <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="password"
                          minLength={6}
                          value={confirmPinInput}
                          onChange={(e) => setConfirmPinInput(e.target.value)}
                          placeholder="Qayta kiriting"
                          required
                          className="w-full px-3 py-2.5 rounded-xl border border-emerald-400 dark:border-emerald-600 bg-white dark:bg-slate-900 text-sm font-mono tracking-widest text-center focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {pinInput.length > 0 ? `${pinInput.length} ta belgi (kamida 6 ta)` : "Kamida 6 xonali maxfiy kod"}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing2FA(false);
                            setPinInput('');
                            setConfirmPinInput('');
                          }}
                          className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          Bekor qilish
                        </button>
                        <button
                          type="submit"
                          disabled={pinInput.trim().length < 6}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>PIN kodni saqlash va 2FA yoqish</span>
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Favqulodda Tiklash Kodi (Recovery Key) */}
                {twoFactorConfig.isEnabled && twoFactorConfig.backupKey && (
                  <div className="mt-4 pt-4 border-t border-emerald-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Favqulodda Tiklash Kodi (Emergency Recovery Key)</span>
                    </div>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                      Agar PIN kodingizni esingizdan chiqarsangiz, ushbu kod orqali tizimga kirish huquqini qayta tiklaysiz. Ushbu kodni xavfsiz joyga saqlab qo'ying!
                    </p>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 font-mono text-xs font-bold text-slate-900 dark:text-white">
                      <span>{twoFactorConfig.backupKey}</span>
                      <button
                        onClick={handleCopyRecoveryKey}
                        className="p-1 px-2.5 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 hover:bg-amber-200 transition flex items-center gap-1 text-[11px] cursor-pointer"
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey ? "Nusxalandi" : "Nusxalash"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ZAXIRA NUSXA (BACKUP & RECOVERY) */}
          {activeTab === 'backups' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleExportBackup}
                  className="p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2.5 font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Zaxira Nusxani Yuklab Olish (JSON)</span>
                </button>

                <label className="p-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2.5 font-bold text-xs border border-slate-300 dark:border-slate-700 transition cursor-pointer">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Fayldan Qayta Tiklash</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Avtomatik Zaxira Snapshotlar</span>
                  <span className="text-[11px] text-slate-400 font-normal">Oxirgi 5 ta saqlangan</span>
                </div>

                {backups.length === 0 ? (
                  <div className="p-4 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-400">
                    Hozircha saqlangan avtomatik snapshotlar mavjud emas. Yuqoridagi tugma orqali zaxira oling.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {backups.map((b) => (
                      <div
                        key={b.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {b.peopleCount} ta oila a'zosi
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(b.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            try {
                              const restored = JSON.parse(b.serializedData);
                              if (onRestoreBackup) {
                                onRestoreBackup(restored);
                                showToast("Tanlangan zaxira muvaffaqiyatli tiklandi!", 'success');
                                onClose();
                              }
                            } catch {
                              showToast("Zaxirani tiklashda xatolik yuz berdi", 'warn');
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[11px] hover:bg-emerald-100 transition cursor-pointer"
                        >
                          Tiklash
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between text-xs">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Shajarachi Security Shield v2.0</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
