import React, { useState } from 'react';
import { X, ShieldCheck, FileText, ScrollText, CheckCircle2 } from 'lucide-react';
import { FamilyTreeLogo } from './FamilyTreeLogo';

export type PolicyType = 'privacy' | 'terms' | 'offer' | 'consent';

interface LegalPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPolicy?: PolicyType;
}

export const LegalPolicyModal: React.FC<LegalPolicyModalProps> = ({
  isOpen,
  onClose,
  initialPolicy = 'privacy',
}) => {
  const [activePolicy, setActivePolicy] = useState<PolicyType>(initialPolicy);

  // Sync initial tab when reopened
  React.useEffect(() => {
    if (initialPolicy) {
      setActivePolicy(initialPolicy);
    }
  }, [initialPolicy, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
      <div 
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FamilyTreeLogo className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                MyShajara — Huquqiy Ma'lumotlar va Siyosat
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Oila va shajara ma'lumotlarining xavfsizligi hamda foydalanish qoidalari
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 pt-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActivePolicy('privacy')}
            className={`px-3.5 py-2 rounded-t-xl border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activePolicy === 'privacy'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Maxfiylik siyosati</span>
          </button>

          <button
            onClick={() => setActivePolicy('terms')}
            className={`px-3.5 py-2 rounded-t-xl border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activePolicy === 'terms'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Foydalanish shartlari</span>
          </button>

          <button
            onClick={() => setActivePolicy('offer')}
            className={`px-3.5 py-2 rounded-t-xl border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activePolicy === 'offer'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ScrollText className="w-3.5 h-3.5" />
            <span>Ommaviy oferta</span>
          </button>

          <button
            onClick={() => setActivePolicy('consent')}
            className={`px-3.5 py-2 rounded-t-xl border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activePolicy === 'consent'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Rozilik bitimi</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {activePolicy === 'privacy' && (
            <div className="space-y-4">
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                Maxfiylik Siyosati (Privacy Policy)
              </h4>
              <p>
                MyShajara platformasi foydalanuvchilarning oilaviy merosi, shajaraviy ma'lumotlari, fotosurat va videolari daxlsizligini eng oliy qadriyat deb hisoblaydi.
              </p>
              
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 space-y-2">
                <strong className="text-emerald-800 dark:text-emerald-300 block">1. Ma'lumotlarni yig'ish va saqlash:</strong>
                <p className="text-xs">
                  Siz kiritgan ism-shariflar, tug'ilgan sanalar, avlodlar zanjiri, fotosuratlar va xotira videolari faqat siz va siz taklif qilgan qarindoshlaringiz uchun ochiq hisoblanadi. Ma'lumotlar shifrlangan holda saqlanadi va uchinchi shaxslarga, marketing tashkilotlariga hech qachon berilmaydi.
                </p>
              </div>

              <div className="space-y-2">
                <strong className="text-slate-900 dark:text-white block">2. Fotosurat va media fayllar xavfsizligi:</strong>
                <p>
                  Yuklangan har bir oilaviy surat va video xavfsiz fayl xotirasida saqlanadi. Foydalanuvchi istalgan vaqtda o'z profilidan ushbu ma'lumotlarni butunlay o'chirish yoki JSON formatida zaxiralab olish huquqiga ega.
                </p>
              </div>

              <div className="space-y-2">
                <strong className="text-slate-900 dark:text-white block">3. Telegram Bot va WebApp integratsiyasi:</strong>
                <p>
                  Telegram orqali kirganingizda faqat sizning ochiq Telegram ID raqamingiz va ismingizdan tizimga autentifikatsiya qilish uchun foydalaniladi. Xabarlaringiz yoki shaxsiy yozishmalaringizga kirish huquqi so'ralmaydi.
                </p>
              </div>
            </div>
          )}

          {activePolicy === 'terms' && (
            <div className="space-y-4">
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                Foydalanish Shartlari (Terms of Service)
              </h4>
              <p>
                MyShajara platformasidan foydalanish orqali siz quyidagi qoidalarga rioya qilishga rozilik bildirasiz:
              </p>

              <ul className="list-disc list-inside space-y-2 pl-1">
                <li>
                  <strong>Tarixiy va nasabiy aniqlik:</strong> Shajaraga ma'lumot kiritishda oila a'zolaringiz va ajdodlaringiz haqida ishonchli hamda haqiqatga mos ma'lumotlarni kiritish tavsiya etiladi.
                </li>
                <li>
                  <strong>Hurmat va axloq qoidalari:</strong> Platformada boshqa insonlarning sha'ni va qadr-qimmatini kamsituvchi, behayo yoki haqoratomuz surat va ma'lumotlarni yuklash qat'iyan taqiqlanadi.
                </li>
                <li>
                  <strong>Shajara asoschisi va tahrirchilar huquqi:</strong> Shajara asoschisi (owner) o'z daraxtiga yangi a'zolarni kiritish, o'chirish yoki taklif havolasi orqali tahrirlash vakolatini berish huquqiga ega.
                </li>
                <li>
                  <strong>Eksport va zaxira:</strong> Foydalanuvchi o'z shajarasi nusxasini xohlagan paytda bepul ravishda JSON, A4 PDF yoki PNG ko'rinishida eksport qilib olishi mumkin.
                </li>
              </ul>
            </div>
          )}

          {activePolicy === 'offer' && (
            <div className="space-y-4">
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                Ommaviy Oferta (Public Offer)
              </h4>
              <p>
                Ushbu hujjat MyShajara axborot-texnologiya xizmati va foydalanuvchi o'rtasidagi ommaviy kelishuv hisoblanadi.
              </p>

              <div className="space-y-2">
                <strong className="text-slate-900 dark:text-white block">1. Xizmat predmeti:</strong>
                <p>
                  MyShajara foydalanuvchilarga avlodlar shajarasini (7 ajdod zanjiri, interaktiv daraxt, fotosuratlar galereyasi va qarindoshlik aloqalarini hisoblash) tuzish va saqlash uchun raqamli platformani taqdim etadi.
                </p>
              </div>

              <div className="space-y-2">
                <strong className="text-slate-900 dark:text-white block">2. Bepul va xavfsiz xizmat:</strong>
                <p>
                  Asosiy funksiyalar (shajara yaratish, a'zolar qo'shish, 7 ajdodni ko'rish, Telegram bot bilan sinxronizatsiya) bepul taqdim etiladi. Tizim serverlari 24/7 rejimida uzluksiz ishlashni ta'minlaydi.
                </p>
              </div>

              <div className="space-y-2">
                <strong className="text-slate-900 dark:text-white block">3. Mualliflik va intellektual mulk:</strong>
                <p>
                  Foydalanuvchi tomonidan kiritilgan barcha oilaviy fotosuratlar, xotiralar va shajara ma'lumotlari faqat foydalanuvchi va uning oilasiga tegishli shaxsiy intellektual meros hisoblanadi.
                </p>
              </div>
            </div>
          )}

          {activePolicy === 'consent' && (
            <div className="space-y-4">
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                Foydalanuvchi Roziligi (Consent Agreement)
              </h4>
              <p>
                Tizimda ro'yxatdan o'tish orqali siz quyidagilarga ixtiyoriy va to'liq rozilik bildirasiz:
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-xs">
                    Shaxsiy ma'lumotlarni (ism, familiya, tug'ilgan sana, aloqa vositalari) oilaviy shajara tuzish maqsadida tizim bazasida qayta ishlashga roziman.
                  </span>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-xs">
                    Yuklangan fotosuratlar va videolardan faqat oilaviy galereya hamda shaxs kartochkalarida namoyish qilish uchun foydalanilishiga roziman.
                  </span>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-xs">
                    Qarindoshlarga taklif havolasi yuborilganda ularning ham ushbu shajaraga a'zolar qo'shishi va tahrirlashi mumkinligiga rozilik beraman.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Kuchga kirgan sana: 2026-yil
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
          >
            Tushundim
          </button>
        </div>
      </div>
    </div>
  );
};
