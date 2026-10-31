import React, { useRef, useState } from 'react';
import { Person } from '../types';
import { FamilyTreeLogo } from './FamilyTreeLogo';
import html2canvas from 'html2canvas';
import { 
  Printer, 
  X, 
  Download, 
  Check, 
  Sparkles, 
  Calendar, 
  FileText,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';

interface PrintTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: Record<string, Person>;
  rootId: string;
  meId: string;
  treeTitle?: string;
}

export const PrintTreeModal: React.FC<PrintTreeModalProps> = ({
  isOpen,
  onClose,
  people,
  rootId,
  meId,
  treeTitle = "7 Ajdod Shajarasi — Nasabnoma"
}) => {
  const [includePhotos, setIncludePhotos] = useState(true);
  const [includeDates, setIncludeDates] = useState(true);
  const [themeStyle, setThemeStyle] = useState<'classic-gold' | 'emerald' | 'monochrome'>('classic-gold');
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const peopleList = Object.values(people) as Person[];
  const rootPerson = people[rootId] || peopleList[0];
  const me = people[meId];

  // Avlodlar bo'yicha guruhlash (Generations)
  const generationsMap: Record<number, Person[]> = {};
  peopleList.forEach((p) => {
    const gen = p.generation || 1;
    if (!generationsMap[gen]) generationsMap[gen] = [];
    generationsMap[gen].push(p);
  });

  const sortedGens = Object.keys(generationsMap)
    .map(Number)
    .sort((a, b) => a - b);

  const getGenerationTitle = (gen: number) => {
    const minGen = sortedGens[0] || 1;
    const diff = gen - minGen;

    if (diff === 0) return `${gen}-Pusht: Bosh ajdod (Ildiz)`;
    if (diff === 1) return `${gen}-Pusht: Ota-onalar avlodi`;
    if (diff === 2) return `${gen}-Pusht: Farzandlar va vorislar`;
    if (diff === 3) return `${gen}-Pusht: Nabiralar avlodi`;
    if (diff === 4) return `${gen}-Pusht: Evaralar avlodi`;
    return `${gen}-Pusht avlodlari`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportImage = async (format: 'png' | 'jpeg') => {
    if (!printAreaRef.current) return;
    setIsExporting(format);

    try {
      const element = printAreaRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution for crystal clear print quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const dataUrl = canvas.toDataURL(mimeType, 0.95);

      const link = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      link.download = `Shajarachi_Nasabnoma_${dateStr}.${format === 'png' ? 'png' : 'jpg'}`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('[Export Image Error]:', err);
      window.alert("Rasm tayyorlashda xatolik yuz berdi. Iltimos, «Chop etish» tugmasidan foydalaning.");
    } finally {
      setIsExporting(null);
    }
  };

  const handleSavePdf = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      {/* Chop etish uchun CSS (@media print) */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-document-area, #print-document-area * {
            visibility: visible;
          }
          #print-document-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 12mm;
            box-shadow: none !important;
            border: 2px solid #854d0e !important;
          }
          @page {
            size: A4 landscape;
            margin: 8mm;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-6xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 print:my-0 print:border-none print:shadow-none print:rounded-none">
        
        {/* Top Control Bar (Faqat ekranda ko'rinadi, chop etishda yashiriladi) */}
        <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Chop etish va saqlash (A4 Landscape)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-semibold">
                  PNG • JPG • PDF • Qog'oz
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Rasmiy muhrlangan nasabnoma va shajara sertifikati
              </p>
            </div>
          </div>

          {/* Sozlamalar va Tugmalar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Fotosuratlarni yoqish/o'chirish */}
            <button
              onClick={() => setIncludePhotos(!includePhotos)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                includePhotos 
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Check className={`w-3.5 h-3.5 ${includePhotos ? 'opacity-100' : 'opacity-0'}`} />
              <span>Rasmlar bilan</span>
            </button>

            {/* Uslub: Oltin / Yashil / Monoxrom */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-xs">
              <button
                onClick={() => setThemeStyle('classic-gold')}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${themeStyle === 'classic-gold' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400'}`}
                title="Klassik zarhalli naqsh"
              >
                Klassik
              </button>
              <button
                onClick={() => setThemeStyle('emerald')}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${themeStyle === 'emerald' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'}`}
                title="Zumrad yashil"
              >
                Zumrad
              </button>
              <button
                onClick={() => setThemeStyle('monochrome')}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${themeStyle === 'monochrome' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'}`}
                title="Qora-oq (Siyoh tejash)"
              >
                Oq-qora
              </button>
            </div>

            {/* 4 Ta Alohida Yuklab Olish / Chop Etish Tugmalari */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* 1. 🖨️ Chop etish */}
              <button
                onClick={handlePrint}
                id="btn-trigger-print"
                title="Printerda to'g'ridan-to'g'ri chop etish"
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Chop etish</span>
              </button>

              {/* 2. 📥 PNG rasm yuklab olish */}
              <button
                onClick={() => handleExportImage('png')}
                disabled={isExporting !== null}
                id="btn-download-png"
                title="Yuqori sifatli tiniq PNG formatda yuklab olish"
                className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isExporting === 'png' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5" />
                )}
                <span>PNG yuklab olish</span>
              </button>

              {/* 3. 📥 JPG rasm yuklab olish */}
              <button
                onClick={() => handleExportImage('jpeg')}
                disabled={isExporting !== null}
                id="btn-download-jpg"
                title="Kichik hajmli JPG formatda yuklab olish"
                className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isExporting === 'jpeg' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>JPG yuklab olish</span>
              </button>

              {/* 4. 📄 PDF saqlash */}
              <button
                onClick={handleSavePdf}
                id="btn-save-pdf"
                title="A4 landscape PDF fayl sifatida saqlash"
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF saqlash</span>
              </button>
            </div>

            {/* Yopish */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Container for Preview */}
        <div className="max-h-[82vh] overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 flex justify-center print:p-0 print:bg-white print:max-h-none print:overflow-visible">
          
          {/* A4 LANDSCAPE PAPER CONTAINER (297mm x 210mm nisbatda) */}
          <div
            ref={printAreaRef}
            id="print-document-area"
            className={`w-full max-w-5xl bg-white text-slate-900 rounded-2xl shadow-xl p-8 sm:p-10 border-4 transition-all relative overflow-hidden ${
              themeStyle === 'classic-gold'
                ? 'border-amber-700/80 bg-gradient-to-b from-amber-50/30 via-white to-amber-50/20'
                : themeStyle === 'emerald'
                ? 'border-emerald-700/80 bg-gradient-to-b from-emerald-50/30 via-white to-emerald-50/20'
                : 'border-slate-800 bg-white'
            }`}
          >
            {/* Suv belgisi (Watermark background pattern) */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.035] select-none z-0">
              <div className="transform -rotate-12 flex flex-col items-center">
                <img
                  src="/assets/aistudio/file_00000000699481f4bf9593e1e840b793_190c7202.png"
                  alt="Watermark"
                  className="w-96 h-96 object-contain"
                />
                <span className="text-4xl font-serif font-black tracking-widest text-slate-950 mt-4">
                  ShajaraChi.uz • NASABNOMA
                </span>
              </div>
            </div>

            {/* O'zbek milliy o'yma naqsh burchaklari (Traditional Uzbek Corners) */}
            <div className="absolute top-2 left-2 w-10 h-10 border-t-2 border-l-2 border-amber-800 pointer-events-none opacity-60 z-10"></div>
            <div className="absolute top-2 right-2 w-10 h-10 border-t-2 border-r-2 border-amber-800 pointer-events-none opacity-60 z-10"></div>
            <div className="absolute bottom-2 left-2 w-10 h-10 border-b-2 border-l-2 border-amber-800 pointer-events-none opacity-60 z-10"></div>
            <div className="absolute bottom-2 right-2 w-10 h-10 border-b-2 border-r-2 border-amber-800 pointer-events-none opacity-60 z-10"></div>

            {/* A4 Header: Gerb, Logotip va Sarlavha */}
            <div className="relative z-10 flex items-center justify-between pb-6 border-b-2 border-amber-800/40 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-600/40 p-1 flex items-center justify-center shadow-sm flex-shrink-0">
                  <FamilyTreeLogo className="w-12 h-12" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-extrabold text-amber-800">
                    O'zbekiston Milliy Nasabnomasi • Shajarachi.uz
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-serif">
                    {treeTitle}
                  </h1>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Bosh ajdod: <strong className="text-amber-900">{rootPerson?.name} {rootPerson?.surname || ''}</strong> • Jami: <strong>{peopleList.length} nafar ajdod va avlodlar</strong>
                  </p>
                </div>
              </div>

              <div className="text-right hidden sm:block">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                  Hujjat tasdiqlangan sana
                </div>
                <div className="text-sm font-bold text-slate-800 flex items-center justify-end gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-700" />
                  <span>{new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="text-[10px] text-emerald-800 font-semibold mt-1">
                  7 Ajdod Zanjiri • Asl nusxa
                </div>
              </div>
            </div>

            {/* 7 Ajdod shiori / O'git */}
            <div className="relative z-10 my-5 p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-center">
              <p className="text-xs italic font-serif text-amber-950 font-semibold">
                «Yetti pushtini bilgan yigit yetti elning g'amini yer, o'z nasabini bilmagan odam ildizsiz daraxt kabidir.»
              </p>
            </div>

            {/* Avlodlar Bo'yicha Ierarxik Ko'rinish (A4 Landscape Grid) */}
            <div className="relative z-10 space-y-6 pt-2">
              {sortedGens.map((gen) => {
                const persons = generationsMap[gen] || [];
                return (
                  <div key={gen} className="relative">
                    {/* Avlod Darajasi Hoshiyasi */}
                    <div className="flex items-center gap-3 mb-2.5">
                      <span className="px-3 py-1 rounded-lg bg-amber-900 text-white text-[11px] font-black uppercase tracking-wider shadow-xs">
                        {getGenerationTitle(gen)}
                      </span>
                      <div className="flex-1 h-[1.5px] bg-gradient-to-r from-amber-700/50 via-slate-300 to-transparent"></div>
                      <span className="text-[10px] text-slate-500 font-bold">
                        {persons.length} nafar
                      </span>
                    </div>

                    {/* Avlod Kartochkalari */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {persons.map((person) => {
                        const parent = person.parentId ? people[person.parentId] : null;
                        const isUserMe = person.id === meId;

                        return (
                          <div
                            key={person.id}
                            className={`p-3 rounded-xl border-2 transition-all flex flex-col justify-between relative ${
                              isUserMe
                                ? 'border-emerald-600 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-500/30'
                                : person.gender === 'male'
                                ? 'border-slate-300 bg-white'
                                : 'border-rose-300/80 bg-rose-50/20'
                            }`}
                          >
                            {/* Card Content */}
                            <div className="flex items-start gap-2.5">
                              {/* Fotosurat yoki Avatar */}
                              {includePhotos && (
                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                                  {person.photoUrl ? (
                                    <img
                                      src={person.photoUrl}
                                      alt={person.name}
                                      className="w-full h-full object-cover"
                                      crossOrigin="anonymous"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white text-xs font-bold">
                                      {person.name.charAt(0)}
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-slate-900 truncate">
                                  {person.name}
                                </div>
                                {person.surname && (
                                  <div className="text-[10px] text-slate-600 truncate leading-tight">
                                    {person.surname}
                                  </div>
                                )}
                                {person.titleOrNickname && (
                                  <span className="inline-block px-1 py-0.2 rounded text-[8px] bg-amber-200/80 text-amber-900 font-bold mt-0.5">
                                    "{person.titleOrNickname}"
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Sanasi va Otasi */}
                            <div className="mt-2 pt-1.5 border-t border-slate-200/80 text-[9px] text-slate-500 space-y-0.5">
                              {includeDates && (
                                <div className="font-medium text-slate-700">
                                  {person.birthYear ? `${person.birthYear}-yil` : (person.birthDate || '—')}
                                  {person.deathYear ? ` – ${person.deathYear}` : (person.isAlive ? ' (Hayot)' : '')}
                                </div>
                              )}
                              {parent && (
                                <div className="text-slate-600 truncate">
                                  Otasi: <strong>{parent.name}</strong>
                                </div>
                              )}
                              {person.occupation && (
                                <div className="text-emerald-800 font-medium truncate">
                                  {person.occupation}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* A4 Footer: Muhr va Imzo Joyi (Shajara egasi) */}
            <div className="relative z-10 mt-10 pt-6 border-t-2 border-amber-800/40 flex items-end justify-between text-xs text-slate-600">
              <div>
                <div className="font-bold text-slate-800 text-sm">Shajara egasi:</div>
                <div className="text-xs text-slate-700 font-semibold mt-0.5">
                  {me ? `${me.name} ${me.surname || ''}` : `${rootPerson?.name} ${rootPerson?.surname || ''}`}
                </div>
                <div className="text-[9px] text-slate-400 mt-1">
                  Ushbu shajara «Shajarachi.uz» milliy tizimi orqali shakllantirildi va tasdiqlandi.
                </div>
              </div>

              {/* Rasmiy Muhr va Imzo ramzi */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="w-28 border-b-2 border-slate-400 mb-1"></div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Shaxsiy Imzo</span>
                </div>
                
                {/* 2-rasmdagi Haqiqiy ko'k dumaloq rasmiy muhr */}
                <div className="flex flex-col items-center">
                  <img
                    src="/assets/aistudio/file_00000000699481f4bf9593e1e840b793_190c7202.png"
                    alt="NASABNOMA - Oila Shajarasi - ShajaraChi.uz Rasmiy Muhri"
                    className="w-20 h-20 sm:w-24 sm:h-24 object-contain shadow-xs transform rotate-[-4deg]"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
