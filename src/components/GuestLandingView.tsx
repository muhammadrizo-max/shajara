import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Scroll,
  Image as ImageIcon,
  FileText,
  Printer,
  Smartphone,
  Send,
  Bot,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  Play
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
  const [selectedDemoIndex, setSelectedDemoIndex] = useState<number>(3); // "Siz"
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [activeLang, setActiveLang] = useState<'UZ' | 'ЎЗ' | 'РУ' | 'EN'>('UZ');

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail.trim() || !contactMessage.trim()) return;
    setIsSent(true);
    setTimeout(() => {
      setContactEmail('');
      setContactMessage('');
      setIsSent(false);
    }, 4000);
  };

  const SEVEN_ANCESTORS = [
    { level: 7, title: 'Katta qat bobo (Chovov)', badge: '7-ajdod', role: 'Nasl poydevori' },
    { level: 6, title: 'Qat bobo (Kovov)', badge: '6-ajdod', role: 'Sulola tayanchi' },
    { level: 5, title: 'Bobokalon (Katta katta bobo)', badge: '5-ajdod', role: 'Urug\' boshi' },
    { level: 4, title: 'Katta bobo', badge: '4-ajdod', role: 'Meros asoschisi' },
    { level: 3, title: 'Bobo (Oqsoqol)', badge: '3-ajdod', role: 'Xonadon nuri' },
    { level: 2, title: 'Ota', badge: '2-ajdod', role: 'Oila qo\'rg\'oni' },
    { level: 1, title: 'O\'zingiz (Avlod)', badge: 'Markaziy shaxs', role: 'Meros davomchisi' },
  ];

  const DEMO_CHAIN = [
    { id: 'd1', title: 'Katta bobo', name: 'Abdurahmon bobo', years: '1910 — 1982', relation: '4-pusht ajdod', desc: "Usta duradgor. Xonadonning mustahkam asoschilaridan." },
    { id: 'd2', title: 'Bobo', name: 'Bahodir bobo', years: '1942 — 2015', relation: '3-pusht ajdod', desc: "Maktab direktori. 4 farzand va 12 nabiraning sevimli bobosi." },
    { id: 'd3', title: 'Ota', name: 'Rustam ota', years: '1970 yilda tug\'ilgan', relation: '2-pusht ajdod', desc: "Muhandis, oila tayanchi. Shajara an'analarini saqlab kelmoqda." },
    { id: 'd4', title: 'Siz (Avlod)', name: 'Sizning ismingiz', years: 'Hozirgi avlod', relation: '1-pusht', desc: "O'z 7 ajdodini aniqlab, oila daraxtini jamlayotgan shaxs." },
  ];

  return (
    <div className="w-full min-h-screen bg-[#07131D] text-slate-100 selection:bg-emerald-500 selection:text-white pb-20">
      
      {/* 1. TOP NAVBAR (Matching 1-rasm) */}
      <header className="sticky top-0 z-40 bg-[#07131D]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => scrollToSection('hero-section')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-1 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <FamilyTreeLogo className="w-7 h-7 text-white" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg sm:text-xl font-black text-white tracking-tight">
                My<span className="text-emerald-400">Shajara</span>
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <button 
              onClick={() => scrollToSection('hero-section')} 
              className="text-emerald-400 border-b-2 border-emerald-400 pb-0.5"
            >
              Asosiy
            </button>
            <button 
              onClick={() => scrollToSection('imkoniyatlar-section')} 
              className="hover:text-white transition"
            >
              Imkoniyatlar
            </button>
            <button 
              onClick={() => scrollToSection('afzalliklar-section')} 
              className="hover:text-white transition"
            >
              Afzalliklar
            </button>
            <button 
              onClick={() => scrollToSection('boglanish-section')} 
              className="hover:text-white transition"
            >
              Bog'lanish
            </button>
          </nav>

          {/* Right Language Pills & Auth */}
          <div className="flex items-center gap-3">
            {/* Language Pills (1-rasm) */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-bold text-slate-400">
              {(['UZ', 'ЎЗ', 'РУ', 'EN'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLang(lang)}
                  className={`hover:text-white transition px-1 ${activeLang === lang ? 'text-white font-extrabold' : ''}`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <button
              onClick={onOpenLoginModal}
              className="hidden sm:flex px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-900/40 transition active:scale-95"
            >
              Kirish / Boshlash
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-16 sm:space-y-24 pt-8 sm:pt-14">
        
        {/* 2. HERO SECTION (Matching 1-rasm) */}
        <section id="hero-section" className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Oila tarixingizni saqlashning zamonaviy usuli</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
              Oila tarixingizni <br />
              <span className="text-emerald-400">avlodlarga</span> qoldiring
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
              Qarindoshlarni bog'lang, oilaviy daraxt yarating, suratlarni saqlang va shajarangizni yuqori sifatli PNG hamda PDF ko'rinishida eksport qiling.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={onOpenLoginModal}
                className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>Shajara yaratishni boshlash</span>
              </button>

              <button
                onClick={() => scrollToSection('imkoniyatlar-section')}
                className="px-5 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white font-bold text-sm border border-slate-700/80 transition flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                <span>Ko'proq ma'lumot</span>
              </button>
            </div>

            {/* Social proof (1-rasm: +1K 1000+ foydalanuvchi) */}
            <div className="flex items-center gap-3 pt-3">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600 border-2 border-[#07131D] flex items-center justify-center text-[10px] font-bold text-white">
                  A
                </div>
                <div className="w-8 h-8 rounded-full bg-teal-600 border-2 border-[#07131D] flex items-center justify-center text-[10px] font-bold text-white">
                  R
                </div>
                <div className="w-8 h-8 rounded-full bg-sky-600 border-2 border-[#07131D] flex items-center justify-center text-[10px] font-bold text-white">
                  B
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-[#07131D] flex items-center justify-center text-[10px] font-black text-slate-950">
                  +1K
                </div>
              </div>
              <div className="text-xs">
                <span className="font-extrabold text-white block">1000+ foydalanuvchi</span>
                <span className="text-slate-400 text-[11px]">biz bilan birga bo'ladi</span>
              </div>
            </div>
          </div>

          {/* Right Visual Tree Art (1-rasm) */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-slate-900/90 to-emerald-950/60 p-6 border border-emerald-500/20 shadow-2xl backdrop-blur-sm overflow-hidden">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
              
              {/* Illustrated Visual Tree */}
              <div className="relative z-10 py-4 flex flex-col items-center">
                {/* Generation 1: Top Grandparents */}
                <div className="flex items-center justify-center gap-6 mb-4">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full border-2 border-emerald-400 p-0.5 bg-slate-800 shadow-md">
                      <div className="w-full h-full rounded-full bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center text-white text-xs font-bold">
                        A
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 mt-1">Abdulla bobo</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full border-2 border-emerald-400 p-0.5 bg-slate-800 shadow-md">
                      <div className="w-full h-full rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                        M
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 mt-1">Mavluda momo</span>
                  </div>
                </div>

                {/* Connecting branch lines */}
                <div className="w-24 h-4 border-t-2 border-emerald-400/80 mb-2 relative">
                  <div className="absolute left-1/2 -top-1 w-2 h-2 rounded-full bg-emerald-400 -translate-x-1/2 shadow-sm" />
                </div>

                {/* Generation 2: Middle Parents */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full border-2 border-emerald-500 p-0.5 bg-slate-800">
                      <div className="w-full h-full rounded-full bg-sky-600 flex items-center justify-center text-white text-[11px] font-bold">
                        B
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5">Bahrom</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-11 h-11 rounded-full border-2 border-emerald-400 p-0.5 bg-slate-800 ring-2 ring-emerald-500/40">
                      <div className="w-full h-full rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                        D
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-300 mt-0.5">Dilshoda</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full border-2 border-emerald-500 p-0.5 bg-slate-800">
                      <div className="w-full h-full rounded-full bg-teal-600 flex items-center justify-center text-white text-[11px] font-bold">
                        J
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5">Jasur</span>
                  </div>
                </div>

                {/* Generation 3: Children */}
                <div className="flex items-center justify-center gap-3 mt-1">
                  {['Otabek', 'Alisher', 'Sevinch'].map((child, i) => (
                    <div key={child} className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full border border-emerald-400/80 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-emerald-200">
                        {child.charAt(0)}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-0.5">{child}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quote pill at bottom of tree graphic (1-rasm) */}
              <div className="mt-4 p-3 rounded-2xl bg-black/60 border border-emerald-500/30 text-[11px] text-slate-200 leading-snug flex items-center gap-2">
                <span className="text-emerald-400 text-lg font-serif">“</span>
                <span>Biz kim ekanimizni bilsak, kelajagimiz yanada mustahkam bo'ladi.</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. THREE FEATURE CARDS (Matching 2-rasm) */}
        <section id="imkoniyatlar-section" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Oila daraxti */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-3 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition">
              <FamilyTreeLogo className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-white">
              Oila daraxti
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Avlodlarni oson bog'lash va vizual ko'rish. Har bir ajdod va farzandni xaritada erkin boshqarish.
            </p>
          </div>

          {/* Card 2: Oilaviy suratlar */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 transition-all space-y-3 group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-105 transition">
              <ImageIcon className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-white">
              Oilaviy suratlar
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Har bir qarindosh uchun foto va ma'lumotlar. Oila albomi orqali barcha fotosuratlarni jamlash.
            </p>
          </div>

          {/* Card 3: PNG va PDF eksport */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 transition-all space-y-3 group">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center group-hover:scale-105 transition">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-white">
              PNG va PDF eksport
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Yuqori sifatli eksport va chop etish imkoniyati. A4 Landscape formatida devoriy shajara tayyorlash.
            </p>
          </div>
        </section>

        {/* 4. STATS NUMBERS BAR (Matching 2-rasm) */}
        <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/40 border border-slate-800/80 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mb-1">
              1000+
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Kutilayotgan foydalanuvchilar
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mb-1">
              5000+
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Yaratiladigan shajaralar
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mb-1">
              20K+
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Saqlanadigan suratlar
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mb-1">
              100%
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Ma'lumotlar xavfsizligi
            </div>
          </div>
        </section>

        {/* 5. SHOWCASE: BARCHASI BITTA PLATFORMADA (Matching 2-rasm) */}
        <section id="afzalliklar-section" className="p-6 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900/80 via-slate-900 to-[#0c1f2e] border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Tez kunda</span>
            </span>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Barchasi bitta platformada
            </h2>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Kompyuter va mobil qurilmalarda ishlaydi. Qayerda bo'lsangiz ham, shajarangiz doimo siz bilan.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm text-slate-200 font-medium">
                  Oson boshqaruv va qulay interfeys
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm text-slate-200 font-medium">
                  Shajara, suratlar va eslatmalar bir joyda
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm text-slate-200 font-medium">
                  Telegram Bot (@shajarachi_bot) bilan to'g'ridan-to'g'ri bog'liqlik
                </span>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenTelegramBotModal}
                className="px-5 py-2.5 rounded-xl bg-[#24A1DE] hover:bg-[#1E8BC0] text-white text-xs font-bold flex items-center gap-2 shadow-md transition"
              >
                <Bot className="w-4 h-4" />
                <span>Telegram Botni ulash</span>
              </button>

              <button
                onClick={onViewTree}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition"
              >
                <span>Daraxtni ko'rish</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Smartphone Mockup Visual (2-rasm) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-xs p-4 rounded-3xl bg-slate-950 border-2 border-slate-700 shadow-2xl">
              <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-3" />
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-2">
                  <span>MyShajara App</span>
                  <span className="text-emerald-400">Online</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold text-lg">
                    D
                  </div>
                  <h4 className="text-xs font-bold text-white">Dilshoda Karimova</h4>
                  <p className="text-[10px] text-slate-400">1987-yilda tug'ilgan • 2-pusht</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 rounded-xl bg-slate-900 text-center">
                    <span className="text-slate-400 block">Ota-onasi</span>
                    <span className="font-bold text-white">Bahrom & Mavluda</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 text-center">
                    <span className="text-slate-400 block">Farzandlari</span>
                    <span className="font-bold text-white">3 nafar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. OUR 7 AJDOD TRADITION SECTION (Bizning shajara tuzilmamiz) */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Milliy Qadriyat
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              7 Ajdod Zanjiri Qanday Tuziladi?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              «Yetti pushtini bilgan inson o'z ildizini biladi». O'zbek xalqida har bir nasl o'zining yetti ajdodini sanay olgan:
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {SEVEN_ANCESTORS.map((anc) => (
              <div key={anc.level} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  #{anc.level}
                </span>
                <h4 className="text-xs font-bold text-white truncate">{anc.title}</h4>
                <p className="text-[10px] text-slate-400">{anc.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 7. BIZ BILAN BOG'LANING (Matching 3-rasm) */}
        <section id="boglanish-section" className="p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900/90 to-[#072421] border border-emerald-500/20 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Description */}
            <div className="lg:col-span-5 space-y-3">
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Biz bilan bog'laning
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Savol yoki taklifingiz bormi? Bizga yozing — tez orada javob beramiz.
              </p>
            </div>

            {/* Right Form (3-rasm) */}
            <div className="lg:col-span-7">
              {isSent ? (
                <div className="p-6 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-center space-y-2 animate-in fade-in">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Xabaringiz yuborildi!</h4>
                  <p className="text-xs text-emerald-200">Tez orada emailingiz orqali aloqaga chiqamiz.</p>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="space-y-3">
                  <input
                    type="email"
                    required
                    placeholder="E-mail manzilingiz"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />

                  <textarea
                    rows={4}
                    required
                    placeholder="Xabaringiz..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition active:scale-95 cursor-pointer"
                  >
                    Yuborish
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* 8. FOOTER (Matching 3-rasm) */}
        <footer className="pt-10 border-t border-slate-800/80 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: Brand & Tagline */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black">
                  <FamilyTreeLogo className="w-6 h-6 text-slate-950" />
                </div>
                <span className="text-lg font-black text-white">
                  My<span className="text-emerald-400">Shajara</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Oila tarixingiz — kelajak avlodlar uchun eng qimmatli meros.
              </p>
            </div>

            {/* Col 2: Bo'limlar */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                Bo'limlar
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li><button onClick={() => scrollToSection('hero-section')} className="hover:text-white">Asosiy</button></li>
                <li><button onClick={() => scrollToSection('imkoniyatlar-section')} className="hover:text-white">Imkoniyatlar</button></li>
                <li><button onClick={() => scrollToSection('afzalliklar-section')} className="hover:text-white">Afzalliklar</button></li>
              </ul>
            </div>

            {/* Col 3: Yordam */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                Yordam
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li><span className="hover:text-white cursor-pointer">Maxfiylik siyosati</span></li>
                <li><span className="hover:text-white cursor-pointer">Foydalanish shartlari</span></li>
                <li><span className="hover:text-white cursor-pointer">Ommaviy oferta</span></li>
                <li><span className="hover:text-white cursor-pointer">Rozilik</span></li>
              </ul>
            </div>

            {/* Col 4: Ijtimoiy tarmoqlar */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                Ijtimoiy tarmoqlar
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li>
                  <a href="https://t.me/shajarachi_bot" target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-[#24A1DE]" />
                    <span>Telegram (@shajarachi_bot)</span>
                  </a>
                </li>
                <li>
                  <span className="hover:text-white cursor-pointer flex items-center gap-1.5">
                    <span>Instagram</span>
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/60 text-center text-[11px] text-slate-500">
            © 2026 MyShajara. Barcha huquqlar himoyalangan.
          </div>
        </footer>

      </div>
    </div>
  );
};
