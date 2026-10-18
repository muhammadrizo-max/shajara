import React, { useRef, useState } from 'react';
import { Person } from '../types';
import { FamilyTreeLogo } from './FamilyTreeLogo';
import { 
  Printer, 
  X, 
  Download, 
  Check, 
  Sliders, 
  Sparkles, 
  Calendar, 
  Users, 
  FileText,
  Palette
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
    const titles: Record<number, string> = {
      1: "1-Pusht: Katta Bobokalon",
      2: "2-Pusht: Bobokalon",
      3: "3-Pusht: Katta Bobo",
      4: "4-Pusht: Bobo",
      5: "5-Pusht: Ota",
      6: "6-Pusht: O'g'il / Qiz",
      7: "7-Pusht: Nabira",
      8: "8-Pusht: Evara",
      9: "9-Pusht: Chevara"
    };
    return titles[gen] || `${gen}-Avlod`;
  };

  const handlePrint = () => {
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
                <span>Chop etish uchun versiya (A4 Landscape)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-semibold">
                  PDF / Qog'oz
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                A4 varaqqa to'liq moslangan shajara albomi va nasabnoma sertifikati
              </p>
            </div>
          </div>

          {/* Sozlamalar va Tugmalar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Fotosuratlarni yoqish/o'chirish */}
            <button
              onClick={() => setIncludePhotos(!includePhotos)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
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
                className={`px-2 py-1 rounded-lg ${themeStyle === 'classic-gold' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400'}`}
                title="Klassik zarhalli naqsh"
              >
                Klassik
              </button>
              <button
                onClick={() => setThemeStyle('emerald')}
                className={`px-2 py-1 rounded-lg ${themeStyle === 'emerald' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'}`}
                title="Zumrad yashil"
              >
                Zumrad
              </button>
              <button
                onClick={() => setThemeStyle('monochrome')}
                className={`px-2 py-1 rounded-lg ${themeStyle === 'monochrome' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'}`}
                title="Qora-oq (Siyoh tejash)"
              >
                Oq-qora
              </button>
            </div>

            {/* Asosiy Chop Etish Tugmasi */}
            <button
              onClick={handlePrint}
              id="btn-trigger-print"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Chop etish / PDF saqlash</span>
            </button>

            {/* Yopish */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
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
            className={`w-full max-w-5xl bg-white text-slate-900 rounded-2xl shadow-xl p-8 sm:p-10 border-4 transition-all relative ${
              themeStyle === 'classic-gold'
                ? 'border-amber-700/80 bg-gradient-to-b from-amber-50/30 via-white to-amber-50/20'
                : themeStyle === 'emerald'
                ? 'border-emerald-700/80 bg-gradient-to-b from-emerald-50/30 via-white to-emerald-50/20'
                : 'border-slate-800 bg-white'
            }`}
          >
            {/* O'zbek milliy o'yma naqsh burchaklari (Traditional Uzbek Corners) */}
            <div className="absolute top-2 left-2 w-10 h-10 border-t-2 border-l-2 border-amber-800 pointer-events-none opacity-60"></div>
            <div className="absolute top-2 right-2 w-10 h-10 border-t-2 border-r-2 border-amber-800 pointer-events-none opacity-60"></div>
            <div className="absolute bottom-2 left-2 w-10 h-10 border-b-2 border-l-2 border-amber-800 pointer-events-none opacity-60"></div>
            <div className="absolute bottom-2 right-2 w-10 h-10 border-b-2 border-r-2 border-amber-800 pointer-events-none opacity-60"></div>

            {/* A4 Header: Gerb, Logotip va Sarlavha */}
            <div className="flex items-center justify-between pb-6 border-b-2 border-amber-800/40 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-600/40 p-1 flex items-center justify-center shadow-sm flex-shrink-0">
                  <FamilyTreeLogo className="w-12 h-12" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-extrabold text-amber-800">
                    O'zbekiston Milliy Nasabnomasi
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-serif">
                    {treeTitle}
                  </h1>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Asoschi / Katta bobo: <strong className="text-amber-900">{rootPerson?.name} {rootPerson?.surname || ''}</strong> • Jami: <strong>{peopleList.length} nafar ajdod va avlodlar</strong>
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
            <div className="my-5 p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-center">
              <p className="text-xs italic font-serif text-amber-950 font-semibold">
                «Yetti pushtini bilgan yigit yetti elning g'amini yer, o'z nasabini bilmagan odam ildizsiz daraxt kabidir.»
              </p>
            </div>

            {/* Avlodlar Bo'yicha Ierarxik Ko'rinish (A4 Landscape Grid) */}
            <div className="space-y-6 pt-2">
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
                        {persons.length} nafar shaxs
                      </span>
                    </div>

                    {/* Shaxslar Kartochkalari Qatori */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                      {persons.map((person) => {
                        const isMale = person.gender === 'male';
                        const parent = person.parentId ? people[person.parentId] : null;

                        return (
                          <div
                            key={person.id}
                            className={`p-2.5 rounded-xl border transition-all text-left flex flex-col justify-between ${
                              isMale 
                                ? 'bg-sky-50/50 border-sky-200 text-slate-900' 
                                : 'bg-rose-50/50 border-rose-200 text-slate-900'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {/* Rasm / Avatar */}
                              {includePhotos && (
                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-300 flex-shrink-0 bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                                  {person.photoUrl ? (
                                    <img
                                      src={person.photoUrl}
                                      alt={person.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span>{person.name.charAt(0)}</span>
                                  )}
                                </div>
                              )}

                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-xs text-slate-900 truncate leading-snug">
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

            {/* A4 Footer: Muhr va Imzo Joyi */}
            <div className="mt-10 pt-6 border-t-2 border-amber-800/40 flex items-end justify-between text-xs text-slate-600">
              <div>
                <div className="font-bold text-slate-800">Oila Boshlig'i & Muallif:</div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  {me ? `${me.name} ${me.surname || ''}` : rootPerson?.name}
                </div>
                <div className="text-[9px] text-slate-400 mt-1">
                  Ushbu shajara 7 Ajdod Shajarasi ilovasi orqali shakllantirildi.
                </div>
              </div>

              {/* Rasmiy Muhr va Imzo ramzi */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="w-24 border-b border-slate-400 mb-1"></div>
                  <span className="text-[9px] text-slate-400 uppercase">Imzo</span>
                </div>
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-800 flex items-center justify-center text-center p-1 opacity-70">
                  <span className="text-[8px] font-bold text-amber-900 leading-tight">
                    NASABNOMA MUHRI
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
