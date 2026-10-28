import React, { useState, useEffect } from 'react';
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
  Play,
  Compass,
  Globe
} from 'lucide-react';
import { FamilyTreeLogo } from './FamilyTreeLogo';
import { Person } from '../types';
import { supabase } from '../utils/supabaseClient';

interface GuestLandingViewProps {
  people?: Record<string, Person>;
  onOpenLoginModal: () => void;
  onOpenTelegramBotModal: () => void;
  onViewTree: () => void;
  onOpenCalcModal?: () => void;
  onOpenPolicy?: (type: 'privacy' | 'terms' | 'offer' | 'consent') => void;
}

type SectionKey = 'hero' | 'imkoniyatlar' | 'afzalliklar' | 'boglanish';

export const GuestLandingView: React.FC<GuestLandingViewProps> = ({
  people = {},
  onOpenLoginModal,
  onOpenTelegramBotModal,
  onViewTree,
  onOpenCalcModal,
  onOpenPolicy,
}) => {
  const [activeSection, setActiveSection] = useState<SectionKey>('hero');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  // Real statistics calculation based on people in tree
  const peopleList = Object.values(people) as Person[];
  const realPeopleCount = peopleList.length;
  const realPhotoCount = peopleList.filter((p) => !!p.photoUrl).length;
  const realGenerationsCount = peopleList.length > 0
    ? Math.max(...peopleList.map((p) => p.generation || 1), 1)
    : 0;

  const scrollToSection = (id: string, sectionKey: SectionKey) => {
    setActiveSection(sectionKey);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Scroll detection to update active tab indicator automatically
  useEffect(() => {
    const handleScroll = () => {
      const hero = document.getElementById('hero-section');
      const imkoniyatlar = document.getElementById('imkoniyatlar-section');
      const afzalliklar = document.getElementById('afzalliklar-section');
      const boglanish = document.getElementById('boglanish-section');

      const scrollPos = window.scrollY + 200;

      if (boglanish && scrollPos >= boglanish.offsetTop) {
        setActiveSection('boglanish');
      } else if (afzalliklar && scrollPos >= afzalliklar.offsetTop) {
        setActiveSection('afzalliklar');
      } else if (imkoniyatlar && scrollPos >= imkoniyatlar.offsetTop) {
        setActiveSection('imkoniyatlar');
      } else {
        setActiveSection('hero');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail.trim() || !contactMessage.trim()) return;

    const payload = {
      id: `msg_${Date.now()}`,
      email: contactEmail.trim(),
      message: contactMessage.trim(),
      created_at: new Date().toISOString(),
    };

    // 1. Local backup in localStorage
    try {
      const existingRaw = localStorage.getItem('shajarachi_contact_messages') || '[]';
      const existing = JSON.parse(existingRaw);
      existing.unshift(payload);
      localStorage.setItem('shajarachi_contact_messages', JSON.stringify(existing.slice(0, 50)));
    } catch (err) {
      console.warn("Could not save to localStorage:", err);
    }

    // 2. Try Supabase insert if table exists
    if (supabase) {
      try {
        await supabase.from('contact_messages').insert([payload]);
      } catch (err) {
        console.info("Supabase feedback saved locally:", payload);
      }
    }

    setIsSent(true);
    setTimeout(() => {
      setContactEmail('');
      setContactMessage('');
      setIsSent(false);
    }, 5000);
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

  const NAV_ITEMS: { key: SectionKey; label: string; targetId: string }[] = [
    { key: 'hero', label: 'Asosiy', targetId: 'hero-section' },
    { key: 'imkoniyatlar', label: 'Imkoniyatlar', targetId: 'imkoniyatlar-section' },
    { key: 'afzalliklar', label: 'Afzalliklar', targetId: 'afzalliklar-section' },
    { key: 'boglanish', label: 'Bog\'lanish', targetId: 'boglanish-section' },
  ];

  return (
    <div className="w-full min-h-screen bg-[#07131D] text-slate-100 selection:bg-emerald-500 selection:text-white pb-20">
      
      {/* 1. TOP NAVBAR (Shajarachi — Mehmon Sahifasi Navbari) */}
      <header className="sticky top-0 z-40 bg-[#07131D]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Brand Name */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer group" 
            onClick={() => scrollToSection('hero-section', 'hero')}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-1 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
              <FamilyTreeLogo className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Shajara<span className="text-emerald-400">chi</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  uz
                </span>
              </div>
              <span className="text-[9px] text-slate-400 hidden sm:block">
                O'tmish ildizlari bilan kelajakni bog'lovchi ko'prik.
              </span>
            </div>
          </div>

          {/* Navigation Links with dynamic moving green line indicator */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.key;
              return (
                <button 
                  key={item.key}
                  onClick={() => scrollToSection(item.targetId, item.key)} 
                  className={`relative py-1 transition-colors cursor-pointer ${
                    isActive 
                      ? 'text-emerald-400 font-bold' 
                      : 'text-slate-300 hover:text-white font-medium'
                  }`}
                >
                  <span>{item.label}</span>
                  {/* Dynamic green underline */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full animate-in fade-in duration-200" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons (Language selector completely removed per user request) */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={onViewTree}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 transition flex items-center gap-1.5"
            >
              <FamilyTreeLogo className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Daraxtni ko'rish</span>
            </button>

            <button
              onClick={onOpenLoginModal}
              className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/25 transition active:scale-95 cursor-pointer"
            >
              Kirish / Boshlash
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-16 sm:space-y-24 pt-8 sm:pt-14">
        
        {/* 2. HERO SECTION */}
        <section id="hero-section" className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>O'tmish ildizlari bilan kelajakni bog'lovchi ko'prik</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
              Oila tarixingizni <br />
              <span className="text-emerald-400">avlodlarga</span> qoldiring
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
              Qarindoshlarni bog'lang, 7 ajdod shajarasini tuzing, oilaviy suratlarni saqlang va shajarangizni yuqori sifatli PDF hamda devoriy A4 shaklida eksport qiling.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={onOpenLoginModal}
                className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>Shajara yaratishni boshlash</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => scrollToSection('imkoniyatlar-section', 'imkoniyatlar')}
                className="px-5 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white font-bold text-sm border border-slate-700/80 transition flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                <span>Ko'proq ma'lumot</span>
              </button>
            </div>

            {/* Social proof */}
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
                <span className="font-extrabold text-white block">1000+ oila a'zosi</span>
                <span className="text-slate-400 text-[11px]">shajarachi.uz platformasida o'z shajarasini tuzmoqda</span>
              </div>
            </div>
          </div>

          {/* Right Visual Tree Art */}
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
                  {['Otabek', 'Alisher', 'Sevinch'].map((child) => (
                    <div key={child} className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full border border-emerald-400/80 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-emerald-200">
                        {child.charAt(0)}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-0.5">{child}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quote pill at bottom of tree graphic */}
              <div className="mt-4 p-3 rounded-2xl bg-black/60 border border-emerald-500/30 text-[11px] text-slate-200 leading-snug flex items-center gap-2">
                <span className="text-emerald-400 text-lg font-serif">“</span>
                <span>Biz kim ekanimizni bilsak, kelajagimiz yanada mustahkam bo'ladi.</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. THREE FEATURE CARDS */}
        <section id="imkoniyatlar-section" className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {/* Card 1: Oila daraxti */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-3 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition">
              <FamilyTreeLogo className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-white">
              Oila daraxti va 7 Ajdod
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Avlodlarni oson bog'lash va interaktiv vizual ko'rish. Har bir ajdod va farzandni xaritada erkin tahrirlash.
            </p>
          </div>

          {/* Card 2: Oilaviy suratlar */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 transition-all space-y-3 group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-105 transition">
              <ImageIcon className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-white">
              Oilaviy suratlar & Albom
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Har bir qarindosh uchun fotosuratlar va tarjimai hollar. Oila albomi orqali xotiralarni bir joyda asrash.
            </p>
          </div>

          {/* Card 3: PNG va PDF eksport */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 transition-all space-y-3 group">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center group-hover:scale-105 transition">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-white">
              A4 Chop etish va Eksport
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Yuqori sifatli eksport va chop etish imkoniyati. A4 Landscape formatida devoriy shajara plakatini tayyorlash.
            </p>
          </div>
        </section>

        {/* 4. STATS NUMBERS BAR */}
        <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/40 border border-slate-800/80 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mb-1">
              {realPeopleCount > 0 ? `${realPeopleCount} nafar` : "1000+"}
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {realPeopleCount > 0 ? "Shajaradagi a'zolar" : "Faol oilalar"}
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mb-1">
              {realGenerationsCount > 0 ? `${realGenerationsCount} pusht` : "7 Ajdod"}
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Bog'langan avlodlar zanjiri
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mb-1">
              {realPhotoCount > 0 ? `${realPhotoCount} ta` : "20K+"}
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {realPhotoCount > 0 ? "Yuklangan oilaviy suratlar" : "Saqlangan xotiralar"}
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mb-1">
              100%
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Xavfsiz va shifrlangan
            </div>
          </div>
        </section>

        {/* 5. SHOWCASE: BARCHASI BITTA PLATFORMADA */}
        <section id="afzalliklar-section" className="p-6 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900/80 via-slate-900 to-[#0c1f2e] border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4">
          <div className="lg:col-span-7 space-y-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>shajarachi.uz</span>
            </span>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Barchasi bitta platformada
            </h2>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Kompyuter, planshet va mobil qurilmalarda tezkor ishlaydi. Qayerda bo'lsangiz ham, shajarangiz doimo siz bilan.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm text-slate-200 font-medium">
                  Oson boshqaruv va zamonaviy 2 ta qulay sidebar tizimi
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm text-slate-200 font-medium">
                  Shajara, suratlar, qarindoshlik kalkulyatori bir joyda
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm text-slate-200 font-medium">
                  Telegram Bot (@shajarachi_bot) bilan to'liq integratsiya
                </span>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenTelegramBotModal}
                className="px-5 py-2.5 rounded-xl bg-[#24A1DE] hover:bg-[#1E8BC0] text-white text-xs font-bold flex items-center gap-2 shadow-md transition cursor-pointer"
              >
                <Bot className="w-4 h-4" />
                <span>Telegram Bot (@shajarachi_bot)</span>
              </button>

              <button
                onClick={onViewTree}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <span>Daraxtni ochish</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Smartphone Mockup Visual */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-xs p-4 rounded-3xl bg-slate-950 border-2 border-slate-700 shadow-2xl">
              <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-3" />
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-2">
                  <span>Shajarachi App</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Online
                  </span>
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

        {/* 6. OUR 7 AJDOD TRADITION SECTION */}
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

        {/* 7. BIZ BILAN BOG'LANING */}
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
              <div className="pt-2 text-xs text-slate-400 space-y-1">
                <div>Domen: <span className="text-emerald-400 font-bold">shajarachi.uz</span></div>
                <div>Telegram Bot: <span className="text-[#24A1DE] font-bold">@shajarachi_bot</span></div>
              </div>
            </div>

            {/* Right Form */}
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

        {/* 8. FOOTER */}
        <footer className="pt-10 border-t border-slate-800/80 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: Brand & Tagline */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black">
                  <FamilyTreeLogo className="w-6 h-6 text-slate-950" />
                </div>
                <span className="text-lg font-black text-white">
                  Shajara<span className="text-emerald-400">chi</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                O'tmish ildizlari bilan kelajakni bog'lovchi ko'prik.
              </p>
            </div>

            {/* Col 2: Bo'limlar */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                Bo'limlar
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li><button onClick={() => scrollToSection('hero-section', 'hero')} className="hover:text-white cursor-pointer">Asosiy</button></li>
                <li><button onClick={() => scrollToSection('imkoniyatlar-section', 'imkoniyatlar')} className="hover:text-white cursor-pointer">Imkoniyatlar</button></li>
                <li><button onClick={() => scrollToSection('afzalliklar-section', 'afzalliklar')} className="hover:text-white cursor-pointer">Afzalliklar</button></li>
                <li><button onClick={() => scrollToSection('boglanish-section', 'boglanish')} className="hover:text-white cursor-pointer">Bog'lanish</button></li>
              </ul>
            </div>

            {/* Col 3: Yordam */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                Yordam
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li><button type="button" onClick={() => onOpenPolicy?.('privacy')} className="hover:text-emerald-400 cursor-pointer transition-colors text-left">Maxfiylik siyosati</button></li>
                <li><button type="button" onClick={() => onOpenPolicy?.('terms')} className="hover:text-emerald-400 cursor-pointer transition-colors text-left">Foydalanish shartlari</button></li>
                <li><button type="button" onClick={() => onOpenPolicy?.('offer')} className="hover:text-emerald-400 cursor-pointer transition-colors text-left">Ommaviy oferta</button></li>
                <li><button type="button" onClick={() => onOpenPolicy?.('consent')} className="hover:text-emerald-400 cursor-pointer transition-colors text-left">Rozilik</button></li>
              </ul>
            </div>

            {/* Col 4: Ijtimoiy tarmoqlar */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                Aloqa & Bot
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li>
                  <a href="https://t.me/shajarachi_bot" target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-[#24A1DE]" />
                    <span>Telegram (@shajarachi_bot)</span>
                  </a>
                </li>
                <li>
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <span>shajarachi.uz</span>
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/60 text-center text-[11px] text-slate-500">
            © 2026 Shajarachi (shajarachi.uz). Barcha huquqlar himoyalangan.
          </div>
        </footer>

      </div>
    </div>
  );
};
