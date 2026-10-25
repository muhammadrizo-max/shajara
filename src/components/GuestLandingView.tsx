import React, { useState } from 'react';
import {
  Users,
  Scroll,
  Bot,
  UserPlus,
  Share2,
  Printer,
  Calculator,
  Film,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Heart,
  ChevronRight,
  Database,
  ExternalLink,
  Info
} from 'lucide-react';
import { FamilyTreeLogo } from './FamilyTreeLogo';

interface GuestLandingViewProps {
  onOpenLoginModal: () => void;
  onOpenTelegramBotModal: () => void;
  onViewTree: () => void;
  onOpenCalcModal?: () => void;
}

export const GuestLandingView: React.FC<GuestLandingViewProps> = ({
  onOpenLoginModal,
  onOpenTelegramBotModal,
  onViewTree,
  onOpenCalcModal,
}) => {
  const [selectedDemoIndex, setSelectedDemoIndex] = useState<number>(3); // "Siz" by default

  const SEVEN_ANCESTORS = [
    {
      level: 7,
      title: 'Katta qat bobo (Chovov / Begona)',
      badge: '7-ajdod',
      desc: "Shajaraning eng yuqori ildiz poydevori. Qon-qarindoshlik va nasl tozaligining chegarasi.",
      role: 'Nasl poydevori',
      color: 'from-amber-600 to-yellow-700',
    },
    {
      level: 6,
      title: 'Qat bobo (Kovov)',
      badge: '6-ajdod',
      desc: "Urug' va nasl zanjirining mustahkam halqasi. Tarixiy shajara va sulolaning iftixori.",
      role: 'Sulola tayanchi',
      color: 'from-amber-500 to-amber-600',
    },
    {
      level: 5,
      title: 'Bobokalon (Katta katta bobo)',
      badge: '5-ajdod',
      desc: "Xonadonning uzoq o'tmishdagi ehtiromli ulug'i. Ko'plab urug' tarmoqlarining umumiy ajdodi.",
      role: 'Urug\' boshi',
      color: 'from-emerald-600 to-teal-700',
    },
    {
      level: 4,
      title: 'Katta bobo',
      badge: '4-ajdod',
      desc: "Bobongizning otasi. Oilaviy an'analar va kasb-hunar merosini boshlab bergan zot.",
      role: 'Meros asoschisi',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      level: 3,
      title: 'Bobo (Ota bobo / Ona bobo)',
      badge: '3-ajdod',
      desc: "Oila oqsoqoli, donishmand maslahatchi va xonadon fayzi. Nabiralar suyanchig'i.",
      role: 'Xonadon nuri',
      color: 'from-teal-600 to-cyan-700',
    },
    {
      level: 2,
      title: 'Ota',
      badge: '2-ajdod',
      desc: "Oilaning qo'rg'oni, tarbiyachi va yo'l ko'rsatuvchi. Zuryod davomchisi.",
      role: 'Oila qo\'rg\'oni',
      color: 'from-cyan-600 to-sky-700',
    },
    {
      level: 1,
      title: 'O\'zingiz (Avlod)',
      badge: 'Boshlang\'ich nuqta',
      desc: "Ajdodlar merosini qabul qilib oluvchi va kelajak avlodlarga yetkazuvchi mas'ul shaxs.",
      role: 'Meros davomchisi',
      color: 'from-emerald-600 via-teal-600 to-amber-600',
    },
  ];

  const DEMO_CHAIN = [
    {
      id: 'd1',
      title: 'Katta bobo',
      name: 'Abdurahmon bobo',
      years: '1910 — 1982',
      relation: '4-pusht ajdod',
      desc: "Hunarmand, usta duradgor. Xonadonning mustahkam asoschilaridan.",
      gender: 'male',
    },
    {
      id: 'd2',
      title: 'Bobo',
      name: 'Bahodir bobo',
      years: '1942 — 2015',
      relation: '3-pusht ajdod',
      desc: "O'qituvchi, maktab direktori. 4 farzand va 12 nabiraning sevimli bobosi.",
      gender: 'male',
    },
    {
      id: 'd3',
      title: 'Ota',
      name: 'Rustam ota',
      years: '1970 yilda tug\'ilgan',
      relation: '2-pusht ajdod',
      desc: "Muhandis, oila tayanchi. Shajara an'analarini saqlab kelmoqda.",
      gender: 'male',
    },
    {
      id: 'd4',
      title: 'Siz (Avlod)',
      name: 'Sizning ismingiz',
      years: 'Hozirgi avlod',
      relation: '1-pusht (Markaziy shaxs)',
      desc: "O'z 7 ajdodini aniqlab, oila daraxtini raqamli shaklda jamlayotgan shaxs.",
      gender: 'male',
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-10 sm:space-y-14 py-4 sm:py-8 px-2 sm:px-4">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 text-white p-6 sm:p-12 shadow-2xl border border-emerald-500/30">
        {/* Background glow decoration */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold mb-4 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>O'zbek xalqining asriy merosi va oilaviy nasabnomasi</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-2 flex items-center justify-center shrink-0 shadow-inner">
              <FamilyTreeLogo className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              7 Ajdod Shajarasi
            </h1>
          </div>

          <p className="text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed mb-6 font-normal">
            «Yetti pushtini bilgan inson o'z ildizini biladi». Ushbu platforma orqali siz o'z oilangiz 
            shajarasini interaktiv tuzishingiz, ota-bobolaringiz xotirasini video va fotosuratlar bilan saqlashingiz 
            hamda Telegram bot orqali butun xonadon bilan birgalikda to'ldirishingiz mumkin.
          </p>

          {/* Action CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenLoginModal}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/40 hover:shadow-xl transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Shajarani boshlash / Ro'yxatdan o'tish</span>
            </button>

            <button
              onClick={onOpenTelegramBotModal}
              className="px-5 py-3 rounded-2xl bg-[#24A1DE] hover:bg-[#1E8BC0] text-white font-bold text-xs sm:text-sm shadow-lg transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span>Telegram Bot (@shajarachi_bot)</span>
            </button>

            <button
              onClick={onViewTree}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 backdrop-blur-sm transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <span>Shajara daraxtini ko'rish</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. WHY 7 ANCESTORS? (7 PUSHT AN'ANASI) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Scroll className="w-4 h-4" />
              <span>Milliy an'ana va qadriyat</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              Nega aynan 7 ajdodni bilish kerak?
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md">
            O'zbek xalqida qadimdan har bir inson o'zining yetti pushtini bilishi farz va nomus hisoblangan.
          </p>
        </div>

        {/* 7 Ancestors Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
          {SEVEN_ANCESTORS.map((anc) => (
            <div
              key={anc.level}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {anc.badge}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    Pusht #{anc.level}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                  {anc.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {anc.desc}
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Maqomi:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {anc.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. INTERACTIVE DEMO PREVIEW */}
      <section className="p-5 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Jonli Namuna (Interaktiv)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              Shajara qanday ko'rinishda tuziladi?
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Quyidagi kartochkalardan birini bosing va ota-bola zanjirini sinab ko'ring:
            </p>
          </div>

          <button
            onClick={onViewTree}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm self-start sm:self-auto cursor-pointer"
          >
            <span>To'liq daraxtda ko'rish</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Chain steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DEMO_CHAIN.map((item, idx) => {
            const isSelected = selectedDemoIndex === idx;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedDemoIndex(idx)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-white dark:bg-slate-800 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    #{4 - idx}-bosqich
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {item.name}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {item.years}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Selected demo detail box */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black text-lg">
              {DEMO_CHAIN[selectedDemoIndex].name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {DEMO_CHAIN[selectedDemoIndex].name}
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {DEMO_CHAIN[selectedDemoIndex].relation}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {DEMO_CHAIN[selectedDemoIndex].desc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onOpenLoginModal}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>O'z shajarangizga qo'shing</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. KEY CAPABILITIES & FEATURES */}
      <section className="space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Imkoniyatlar
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            Platformaning asosiy afzalliklari
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Feature 1 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FamilyTreeLogo className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Interaktiv Oila Daraxti
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Daraxt bo'ylab erkin surish, yaqinlashtirish, har bir shaxsga ota yoki farzand qo'shish va 
              shoxlarni avtomatik tartiblash qobiliyati.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#24A1DE] flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Telegram Bot (@shajarachi_bot)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Sayt va Telegram bot bitta umumiy Supabase ma'lumotlar bazasiga ulangan. Bot orqali taklif havolalari 
              yuborish va mini-ilovaga bir bosishda kirish.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <Share2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Ikki xil Taklif Havolasi
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              1) Umumiy shajaraga taklif — butun oila a'zolari uchun. 
              2) Aniq bo'sh o'ringa taklif — ismini kiritib aynan bitta o'rin uchun taklifnoma generatsiya qilish.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <Calculator className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Qarindoshlik & Pusht Hisoblagichi
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Istalgan ikki shaxs o'rtasidagi qon-qarindoshlik rishtalarini aniqlab, an'anaviy o'zbekona atamalar 
              (amaki, amma, tog'a, xola, jiyan, pusht farqi) bilan tushuntiradi.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <Film className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Media & Video Xotiralar
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Har bir shaxs uchun rasm, 1 daqiqalik qisqa video avatar va 10 daqiqalik xotira-tarjimai hol 
              videolarini biriktirish imkoniyati.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
              <Printer className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              A4 Chop Etish va Devoriy Format
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Shajarani A4 Landscape formatida chop etishga tayyorlash, ramkaga solish yoki PDF formatida 
              arxivlab saqlash imkoniyati.
            </p>
          </div>
        </div>
      </section>

      {/* 5. BOTTOM CALL TO ACTION */}
      <section className="p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 text-white text-center space-y-4 shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-black">
          O'z oilaviy tarixingizni bugunoq boshlang!
        </h2>
        <p className="text-emerald-100 text-xs sm:text-sm max-w-xl mx-auto">
          Ro'yxatdan o'tish mutlaqo bepul. Ism-familiyangiz, telefoningiz va emailingizni kiritib 
          darhol o'z 7 ajdodingiz zanjirini tuzishga kirishing.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onOpenLoginModal}
            className="px-6 py-3 rounded-2xl bg-white text-emerald-800 font-black text-xs sm:text-sm shadow-md hover:bg-emerald-50 transition active:scale-95 cursor-pointer"
          >
            Ro'yxatdan o'tish / Kirish
          </button>
          <button
            onClick={onViewTree}
            className="px-6 py-3 rounded-2xl bg-black/20 hover:bg-black/30 text-white font-bold text-xs sm:text-sm border border-white/20 transition active:scale-95 cursor-pointer"
          >
            Daraxtni ochish
          </button>
        </div>
      </section>
    </div>
  );
};
