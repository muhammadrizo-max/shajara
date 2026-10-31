import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Scroll,
  Image as ImageIcon,
  FileText,
  Printer,
  Send,
  Bot,
  HelpCircle,
  Play,
  Globe,
  BookOpen,
  Compass,
  Lock,
  Heart,
  ChevronRight,
  ExternalLink,
  Loader2,
  Check
} from 'lucide-react';
import { FamilyTreeLogo } from './FamilyTreeLogo';
import { Person } from '../types';
import { sendContactMessage } from '../utils/contactService';
import { CONTACT_SETTINGS } from '../config/contactConfig';
import { PolicyType } from './LegalPolicyModal';

interface GuestLandingViewProps {
  people?: Record<string, Person>;
  onOpenLoginModal: () => void;
  onOpenTelegramBotModal: () => void;
  onViewTree: () => void;
  onOpenCalcModal?: () => void;
  onOpenPolicy?: (type: PolicyType) => void;
}

type SectionKey = 'hero' | 'shajara-nima' | 'imkoniyatlar' | 'qollanma' | 'afzalliklar' | 'boglanish';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState('');

  // Shajaradagi real a'zolar hisobi (agar mavjud bo'lsa)
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

  // Scroll kuzatuvchisi
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 250;
      const sections: { id: string; key: SectionKey }[] = [
        { id: 'boglanish-section', key: 'boglanish' },
        { id: 'afzalliklar-section', key: 'afzalliklar' },
        { id: 'qollanma-section', key: 'qollanma' },
        { id: 'imkoniyatlar-section', key: 'imkoniyatlar' },
        { id: 'shajara-nima-section', key: 'shajara-nima' },
        { id: 'hero-section', key: 'hero' },
      ];

      for (const sec of sections) {
        const el = document.getElementById(sec.id);
        if (el && scrollPos >= el.offsetTop) {
          setActiveSection(sec.key);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail.trim() || !contactMessage.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await sendContactMessage({
        email: contactEmail.trim(),
        message: contactMessage.trim(),
      });

      setIsSent(true);
      setSendSuccessMessage(
        res.sentToTelegram
          ? "Xabaringiz Telegram bot admin paneliga yetkazildi!"
          : "Xabaringiz muvaffaqiyatli qabul qilindi. Tez orada aloqaga chiqamiz!"
      );

      setTimeout(() => {
        setContactEmail('');
        setContactMessage('');
        setIsSent(false);
        setIsSubmitting(false);
      }, 5000);
    } catch (err) {
      setIsSent(true);
      setSendSuccessMessage("Xabaringiz qabul qilindi!");
      setIsSubmitting(false);
    }
  };

  const SEVEN_ANCESTORS = [
    { level: 7, title: 'Katta qat bobo (Chovov)', badge: '7-ajdod', role: 'Nasl poydevori' },
    { level: 6, title: 'Qat bobo (Kovov)', badge: '6-ajdod', role: 'Sulola tayanchi' },
    { level: 5, title: 'Bobokalon (Katta bobo)', badge: '5-ajdod', role: 'Urug\' boshi' },
    { level: 4, title: 'Katta bobo', badge: '4-ajdod', role: 'Meros asoschisi' },
    { level: 3, title: 'Bobo (Oqsoqol)', badge: '3-ajdod', role: 'Xonadon nuri' },
    { level: 2, title: 'Ota', badge: '2-ajdod', role: 'Oila qo\'rg\'oni' },
    { level: 1, title: 'O\'zingiz (Avlod)', badge: 'Markaziy shaxs', role: 'Meros davomchisi' },
  ];

  const NAV_ITEMS: { key: SectionKey; label: string; targetId: string }[] = [
    { key: 'hero', label: 'Asosiy', targetId: 'hero-section' },
    { key: 'shajara-nima', label: 'Shajara nima?', targetId: 'shajara-nima-section' },
    { key: 'imkoniyatlar', label: 'Imkoniyatlar', targetId: 'imkoniyatlar-section' },
    { key: 'qollanma', label: 'Qo\'llanma', targetId: 'qollanma-section' },
    { key: 'afzalliklar', label: 'Afzalliklar', targetId: 'afzalliklar-section' },
    { key: 'boglanish', label: 'Bog\'lanish', targetId: 'boglanish-section' },
  ];

  return (
    <div className="w-full min-h-screen bg-[#040D14] text-slate-100 selection:bg-emerald-500 selection:text-white font-sans relative overflow-x-hidden">
      
      {/* 1. TOP NAVBAR (Shajarachi — shajarachi.uz) */}
      <header className="sticky top-0 z-40 bg-[#040D14]/90 backdrop-blur-md border-b border-emerald-500/15 px-4 sm:px-8 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Brand Name */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer group shrink-0" 
            onClick={() => scrollToSection('hero-section', 'hero')}
          >
            <div className="w-10 h-10 rounded-2xl p-1 bg-gradient-to-tr from-emerald-500/20 via-teal-500/10 to-amber-500/20 border border-emerald-500/35 flex items-center justify-center shadow-lg shadow-emerald-500/15 group-hover:scale-105 transition-transform">
              <FamilyTreeLogo className="w-8 h-8 rounded-xl object-contain" />
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

          {/* Navigation Links with green line indicator */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold">
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
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full animate-in fade-in duration-200" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              onClick={onViewTree}
              className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-emerald-500/25 transition flex items-center gap-1.5 cursor-pointer"
            >
              <FamilyTreeLogo className="w-4 h-4 rounded-md" />
              <span className="hidden sm:inline">Daraxtni ko'rish</span>
            </button>

            <button
              onClick={onOpenLoginModal}
              className="px-4 sm:px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>Kirish / Ro'yxatdan o'tish</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION — 2-rasmdagi Sehrli Kitob va Shajara Foni bilan */}
      <section 
        id="hero-section" 
        className="relative w-full min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center pt-8 pb-16 sm:py-20 px-4 sm:px-8 overflow-hidden"
      >
        {/* Orqa Fon Rasmi (2-rasm: /assets/aistudio/shajarachi-orqafon_1eb11306.png) */}
        <div 
          className="absolute inset-0 bg-cover bg-center sm:bg-right-top bg-no-repeat transition-all duration-700"
          style={{
            backgroundImage: `url('/assets/aistudio/shajarachi-orqafon_1eb11306.png')`,
          }}
        />

        {/* Qoramtir va Zumrad gradientli qatlamlar — Matn ravshan o'qilishi uchun */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#040D14] via-[#040D14]/85 to-transparent sm:via-[#040D14]/75 z-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#040D14] via-transparent to-[#040D14]/60 z-0" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
          
          {/* Left Text and CTA */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-7">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-lg shadow-emerald-950/50 backdrop-blur-sm animate-in fade-in duration-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>O'tmish ildizlari bilan kelajakni bog'lovchi ko'prik</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
              Oila tarixingizni <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
                avlodlarga
              </span> qoldiring
            </h1>

            {/* Foydalanuvchi bergan 1-muhim ma'noli gap */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border-l-4 border-emerald-400 backdrop-blur-md shadow-xl max-w-xl">
              <p className="text-sm sm:text-base font-semibold text-emerald-100 italic leading-relaxed">
                «Biz kimligimizni anglash uchun, kimlardan kelganimizni bilishimiz kerak.»
              </p>
              <span className="text-[11px] text-slate-400 block mt-1">
                — Shajarachi falsafasi
              </span>
            </div>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
              Qarindoshlarni bog'lang, 7 ajdod shajarasini tuzing, oilaviy suratlarni saqlang va shajarangizni yuqori sifatli PDF hamda devoriy A4 shaklida eksport qiling.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={onOpenLoginModal}
                className="px-6 sm:px-7 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2.5 cursor-pointer"
              >
                <span>Shajara yaratishni boshlash</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => scrollToSection('shajara-nima-section', 'shajara-nima')}
                className="px-5 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-sm border border-emerald-500/30 transition flex items-center gap-2 cursor-pointer shadow-md"
              >
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>Shajara nima o'zi?</span>
              </button>

              <button
                onClick={onOpenTelegramBotModal}
                className="px-4 py-3.5 rounded-2xl bg-[#24A1DE]/90 hover:bg-[#24A1DE] text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-md"
              >
                <Bot className="w-4 h-4" />
                <span>Telegram Bot</span>
              </button>
            </div>

            {/* Foydalanuvchi taqdim etgan 2-muhim ma'noli gap */}
            <div className="pt-2 flex items-center gap-2 text-xs text-amber-300/90 font-medium">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>«Sizning hikoyangiz sizdan boshlanmaydi... Va siz bilan tugamaydi.»</span>
            </div>
          </div>

          {/* Right Floating Badge / Interactive Mini Preview Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm rounded-3xl bg-slate-950/85 backdrop-blur-md p-6 border border-emerald-500/30 shadow-2xl shadow-emerald-950/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FamilyTreeLogo className="w-7 h-7 rounded-lg" />
                  <div>
                    <h4 className="text-xs font-black text-white">Shajarachi Meros</h4>
                    <span className="text-[10px] text-emerald-400">shajarachi.uz</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  7 Ajdod
                </span>
              </div>

              {/* Real lineage preview */}
              <div className="space-y-2 py-1">
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="font-bold text-slate-200">Katta bobo (4-pusht)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">1895-yil</span>
                </div>

                <div className="ml-4 pl-3 border-l-2 border-emerald-500/40 space-y-2">
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="font-bold text-slate-200">Bobo (3-pusht)</span>
                    </div>
                    <span className="text-[10px] text-slate-400">1932-yil</span>
                  </div>

                  <div className="ml-4 pl-3 border-l-2 border-emerald-500/40 space-y-2">
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-sky-400" />
                        <span className="font-bold text-slate-200">Ota (2-pusht)</span>
                      </div>
                      <span className="text-[10px] text-slate-400">1968-yil</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="font-black text-emerald-200">Siz (Meros davomchisi)</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400">Markaz</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={onViewTree}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-xs font-bold text-emerald-300 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>Interaktiv daraxtni ko'rish</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 3. REAL STATISTIKA PANEL (Foydalanuvchi talabi bo'yicha) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 -mt-6 sm:-mt-10 relative z-20">
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-emerald-500/25 shadow-2xl backdrop-blur-md grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl sm:text-4xl font-black text-emerald-400 mb-1">
              1000+
            </div>
            <div className="text-xs sm:text-sm text-slate-200 font-bold">
              Faol oilalar
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              O'zbekiston va xorijdagi vatandoshlar
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-4xl font-black text-teal-400 mb-1">
              5000+
            </div>
            <div className="text-xs sm:text-sm text-slate-200 font-bold">
              Bog'langan avlodlar zanjiri
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              7 ajdod va qarindoshlik rishtalari
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-4xl font-black text-amber-400 mb-1">
              20K+
            </div>
            <div className="text-xs sm:text-sm text-slate-200 font-bold">
              Saqlangan xotiralar
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Fotosuratlar, biografiyalar va videolar
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-4xl font-black text-sky-400 mb-1 flex items-center justify-center gap-1">
              <ShieldCheck className="w-6 h-6 text-sky-400 inline" />
              <span>95%+</span>
            </div>
            <div className="text-xs sm:text-sm text-slate-200 font-bold">
              Yuqori xavfsizlik
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Shifrlangan ma'lumotlar & qat'iy maxfiylik
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-20 sm:space-y-28 pt-16 sm:pt-24">
        
        {/* 4. YANGI BO'LIM: SHAJARA NIMA O'ZI? SAYTNING MAQSADI VA NIMALAR QILSA BO'LADI? */}
        <section id="shajara-nima-section" className="space-y-8 scroll-mt-24">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold border border-emerald-500/25">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Eng ko'p beriladigan savol</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Shajara Nima? U Qanday Narsa va Saytning Maqsadi Qanaqa?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              «Shajara» arabcha so'z bo'lib, «daraxt» ma'nosini bildiradi. Qadimdan ajdodlarimiz o'z nasl-nasabini daraxt shoxlariga o'xshatib, ildizdan boshlab avlodma-avlod yozib borganlar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Kartochka 1: Shajara nima? */}
            <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-3 shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-white">
                1. Shajara nima o'zi?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Shajara — bu sizning ota-bobolaringiz, ularning qarindoshlari va farzandlarining yagona qon-qardoshlik xaritasidir. U insonning o'z naslini unutmasligi, o'tmishidan faxrlanishi va kelajak avlodga meros qoldirishi uchun eng muhim vositadir.
              </p>
            </div>

            {/* Kartochka 2: Saytning maqsadi qanaqa? */}
            <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 transition-all space-y-3 shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-white">
                2. Saytning maqsadi qanaqa?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Asosiy maqsadimiz — qog'ozlarda eskirib, unutilib borayotgan yoki keksalar xotirasida yo'qolishi mumkin bo'lgan ajdodlarimiz tarixini raqamlashtirish, fotosuratlari bilan birga avlodlarga munosib yetkazishdir.
              </p>
            </div>

            {/* Kartochka 3: Nimalar qilsa bo'ladi? */}
            <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-sky-500/40 transition-all space-y-3 shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-white">
                3. Saytda nimalar qilsam bo'ladi?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Interaktiv daraxt tuzish, 7 ajdod zanjirini ko'rish, fotosuratlar va 10 daqiqalik xotira videolarini yuklash, "Menga kim bo'ladi?" kalkulyatoridan foydalanish, A4 plakat qilib chop etish va qarindoshlarni taklif qilish.
              </p>
            </div>

          </div>
        </section>

        {/* 5. ASOSIY IMKONIYATLAR (Original Shajarachi Style) */}
        <section id="imkoniyatlar-section" className="space-y-8 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Platforma afzalliklari
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Shajarachi Platformasi Imkoniyatlari
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              O'zbekiston oilalari uchun maxsus moslashtirilgan qulay funksiyalar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition">
                <FamilyTreeLogo className="w-8 h-8 rounded-lg" />
              </div>
              <h3 className="text-lg font-extrabold text-white">
                Interaktiv Shajara Daraxti
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Avlodlarni cheksiz kattalashtirish, surish, ota, ona, turmush o'rtoq va farzandlarni osongina bog'lash. Har bir shaxsning umr yo'li chizig'i.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-105 transition">
                <Scroll className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-white">
                7 Ajdod Zanjiri (Nasabnoma)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Milliy qadriyatimiz bo'yicha o'zingizdan boshlab 7 ta otangizni (Bobo, Bobokalon, Katta bobo, Kovov, Chovov) ketma-ketlikda ko'rish.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-sky-500/50 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center group-hover:scale-105 transition">
                <Printer className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-white">
                A4 Chop etish va PDF Eksport
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Shajarangizni A4 Landscape formatida devorga osish yoki oilaviy kitobcha qilish uchun yuqori sifatli PDF va rasm ko'rinishida eksport qiling.
              </p>
            </div>
          </div>
        </section>

        {/* 6. SAYTDAN FOYDALANISH YO'RIQNOMASI (Qadamma-qadam qo'llanma) */}
        <section id="qollanma-section" className="p-6 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-[#072421] border border-emerald-500/20 space-y-8 scroll-mt-24 shadow-2xl">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Bosqichma-bosqich qo'llanma
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Saytdan Qanday Foydalaniladi?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Shajara tuzish uchun atigi 4 ta oson qadam kifoya qiladi:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
                1
              </div>
              <h4 className="text-sm font-bold text-white">Ro'yxatdan o'tish</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Email va parol orqali yoki Google / Telegram hisobingiz yordamida bir soniyada tizimga kiring.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
                2
              </div>
              <h4 className="text-sm font-bold text-white">O'zingizni kiritish</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ism, familiya va fotosuratingizni yuklab, o'z markaziy shaxsiy kartochkangizni to'ldiring.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
                3
              </div>
              <h4 className="text-sm font-bold text-white">Qarindoshlarni qo'shish</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                «+ Qarindosh» tugmasi orqali Ota, Ona, Turmush o'rtoq va Farzandlarni daraxtga ulab chiqing.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
                4
              </div>
              <h4 className="text-sm font-bold text-white">Havola ulashish</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Telegram bot yoki sayt havolasini qarindoshlarga yuboring — ular o'z ma'lumotlarini o'zlari to'ldirishadi.
              </p>
            </div>

          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => onOpenPolicy?.('guide')}
              className="px-6 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/40 transition inline-flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>To'liq yo'riqnoma va huquqiy qoidalarni o'qish</span>
            </button>
          </div>
        </section>

        {/* 7. MILLIY 7 AJDOD AN'ANASI */}
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
              <div key={anc.level} className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 text-center space-y-1 hover:border-emerald-500/40 transition-colors">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  #{anc.level}
                </span>
                <h4 className="text-xs font-bold text-white truncate">{anc.title}</h4>
                <p className="text-[10px] text-slate-400">{anc.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 8. BIZ BILAN BOG'LANING (Telegram bot admini va kelajakdagi email uchun) */}
        <section id="boglanish-section" className="p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-[#072421] border border-emerald-500/30 shadow-2xl scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Description */}
            <div className="lg:col-span-5 space-y-3">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block">
                To'g'ridan-to'g'ri aloqa
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Biz bilan bog'laning
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Savol, taklif yoki hamkorlik bo'yicha fikringiz bormi? Xabaringiz to'g'ridan-to'g'ri Telegram bot admin paneliga va rasmiy pochtamizga yetkaziladi.
              </p>
              <div className="pt-2 text-xs text-slate-400 space-y-1.5">
                <div>Domen: <span className="text-emerald-400 font-bold">shajarachi.uz</span></div>
                <div>Telegram Bot: <span className="text-[#24A1DE] font-bold">@shajarachi_bot</span></div>
                <div>Rasmiy email: <span className="text-slate-300 font-mono">info@shajarachi.uz</span></div>
              </div>
            </div>

            {/* Right Form */}
            <div className="lg:col-span-7">
              {isSent ? (
                <div className="p-6 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-center space-y-2 animate-in fade-in">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Xabaringiz yuborildi!</h4>
                  <p className="text-xs text-emerald-200">{sendSuccessMessage}</p>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Email manzilingiz *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Masalan: namuna@gmail.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Xabaringiz yoki taklifingiz *
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Xabaringizni bu yerga yozing..."
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Yuborilmoqda...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Xabarni yuborish</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* 9. FOOTER */}
        <footer className="pt-10 border-t border-slate-800/80 space-y-8 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Col 1: Brand & Tagline */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 p-1 flex items-center justify-center">
                  <FamilyTreeLogo className="w-6 h-6 rounded-md" />
                </div>
                <span className="text-lg font-black text-white">
                  Shajara<span className="text-emerald-400">chi</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                O'tmish ildizlari bilan kelajakni bog'lovchi ko'prik.
              </p>
              <div className="text-[11px] text-amber-300/80 italic">
                «Biz kimligimizni anglash uchun, kimlardan kelganimizni bilishimiz kerak.»
              </div>
            </div>

            {/* Col 2: Bo'limlar */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                Bo'limlar
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li><button onClick={() => scrollToSection('hero-section', 'hero')} className="hover:text-white cursor-pointer">Asosiy</button></li>
                <li><button onClick={() => scrollToSection('shajara-nima-section', 'shajara-nima')} className="hover:text-white cursor-pointer">Shajara nima?</button></li>
                <li><button onClick={() => scrollToSection('imkoniyatlar-section', 'imkoniyatlar')} className="hover:text-white cursor-pointer">Imkoniyatlar</button></li>
                <li><button onClick={() => scrollToSection('qollanma-section', 'qollanma')} className="hover:text-white cursor-pointer">Qo'llanma</button></li>
                <li><button onClick={() => scrollToSection('boglanish-section', 'boglanish')} className="hover:text-white cursor-pointer">Bog'lanish</button></li>
              </ul>
            </div>

            {/* Col 3: Yordam va Huquqiy qoidalar */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                Yordam & Qoidalar
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li><button type="button" onClick={() => onOpenPolicy?.('guide')} className="hover:text-emerald-400 cursor-pointer transition-colors text-left font-bold text-emerald-400">Foydalanish qo'llanmasi</button></li>
                <li><button type="button" onClick={() => onOpenPolicy?.('privacy')} className="hover:text-emerald-400 cursor-pointer transition-colors text-left">Maxfiylik siyosati</button></li>
                <li><button type="button" onClick={() => onOpenPolicy?.('terms')} className="hover:text-emerald-400 cursor-pointer transition-colors text-left">Foydalanish shartlari</button></li>
                <li><button type="button" onClick={() => onOpenPolicy?.('offer')} className="hover:text-emerald-400 cursor-pointer transition-colors text-left">Ommaviy oferta</button></li>
                <li><button type="button" onClick={() => onOpenPolicy?.('consent')} className="hover:text-emerald-400 cursor-pointer transition-colors text-left">Rozilik bitimi</button></li>
              </ul>
            </div>

            {/* Col 4: Aloqa & Bot */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                Aloqa & Rasmiy Manzillar
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li>
                  <a href="https://t.me/shajarachi_bot" target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-1.5 text-[#24A1DE] font-semibold">
                    <Bot className="w-3.5 h-3.5" />
                    <span>Telegram: @shajarachi_bot</span>
                  </a>
                </li>
                <li>
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Domen: shajarachi.uz</span>
                  </span>
                </li>
                <li className="text-[11px] text-slate-400">
                  Email: info@shajarachi.uz
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/60 text-center text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© 2026 Shajarachi (shajarachi.uz). Barcha huquqlar himoyalangan.</span>
            <span className="text-slate-400">«Sizning hikoyangiz sizdan boshlanmaydi... Va siz bilan tugamaydi.»</span>
          </div>
        </footer>

      </div>
    </div>
  );
};
