import React, { useRef, useState, useMemo } from 'react';
import { Person } from '../types';
import { FamilyTreeLogo } from './FamilyTreeLogo';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
  Printer, 
  X, 
  Download, 
  Check, 
  Sparkles, 
  Calendar, 
  FileText,
  Image as ImageIcon,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Heart,
  LayoutGrid,
  GitFork
} from 'lucide-react';
import { calculateKinship, getChildren } from '../utils/kinship';

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
  // Ko'rinish turi: 1) Rasmiy Nasabnoma Sertifikati (Generations)  2) Grafik Shajara Daraxti (Visual Tree)
  const [viewFormat, setViewFormat] = useState<'certificate' | 'tree'>('certificate');
  const [includePhotos, setIncludePhotos] = useState<boolean>(true);
  const [includeDates, setIncludeDates] = useState<boolean>(true);
  const [themeStyle, setThemeStyle] = useState<'classic-gold' | 'emerald' | 'monochrome'>('classic-gold');
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [previewZoom, setPreviewZoom] = useState<number>(1);
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

  // Capture canvas helper with complete oklch sanitization & CORS protection
  const capturePrintCanvas = async (): Promise<HTMLCanvasElement | null> => {
    if (!printAreaRef.current) return null;
    const element = printAreaRef.current;

    // Helper to convert oklch color string to rgb
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    const oklchRegex = /oklch\([^)]+\)/gi;
    const convertOklch = (str: string): string => {
      if (!str || !str.includes('oklch')) return str;
      return str.replace(oklchRegex, (match) => {
        try {
          if (tempCtx) {
            tempCtx.fillStyle = '#ffffff';
            tempCtx.fillStyle = match;
            return tempCtx.fillStyle;
          }
        } catch {}
        return '#ffffff';
      });
    };

    return await html2canvas(element, {
      scale: 2, // High resolution
      useCORS: true,
      allowTaint: false, // Must be false to allow canvas.toDataURL() without SecurityError
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDoc, clonedElement) => {
        // 1. Sanitize all stylesheet style tags in the cloned document
        clonedDoc.querySelectorAll('style').forEach((styleEl) => {
          if (styleEl.textContent && styleEl.textContent.includes('oklch')) {
            styleEl.textContent = convertOklch(styleEl.textContent);
          }
        });

        // 2. Sanitize inline styles and computed styles on the cloned elements
        const allElements = [clonedElement, ...Array.from(clonedElement.querySelectorAll('*'))];
        const colorProps = ['color', 'backgroundColor', 'borderColor', 'outlineColor', 'fill', 'stroke'];
        
        allElements.forEach((el) => {
          const node = el as HTMLElement;
          if (!node || !node.style) return;

          const inlineStyle = node.getAttribute('style');
          if (inlineStyle && inlineStyle.includes('oklch')) {
            node.setAttribute('style', convertOklch(inlineStyle));
          }

          try {
            const comp = window.getComputedStyle(node);
            colorProps.forEach((prop) => {
              const val = (comp as any)[prop];
              if (val && typeof val === 'string' && val.includes('oklch')) {
                (node.style as any)[prop] = convertOklch(val);
              }
            });
          } catch {}
        });
      },
    });
  };

  // 1. Printer orqali chop etish
  const handlePrint = () => {
    window.print();
  };

  // 2. PNG yoki JPG yuklab olish
  const handleExportImage = async (format: 'png' | 'jpeg') => {
    setIsExporting(format);
    try {
      const canvas = await capturePrintCanvas();
      if (!canvas) throw new Error("Canvas yaratib bo'lmadi");

      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const dataUrl = canvas.toDataURL(mimeType, 0.95);

      const dateStr = new Date().toISOString().slice(0, 10);
      const link = document.createElement('a');
      link.download = `Shajarachi_${viewFormat === 'tree' ? 'Daraxt' : 'Nasabnoma'}_${dateStr}.${format === 'png' ? 'png' : 'jpg'}`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => link.remove(), 100);
    } catch (err) {
      console.error('[Export Image Error]:', err);
      // Fallback to browser print if image capture was blocked
      window.print();
    } finally {
      setIsExporting(null);
    }
  };

  // 3. To'g'ridan-to'g'ri haqiqiy PDF fayl yuklab olish (jsPDF)
  const handleSavePdf = async () => {
    setIsExporting('pdf');
    try {
      const canvas = await capturePrintCanvas();
      if (!canvas) throw new Error("Canvas yaratib bo'lmadi");

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / imgHeight;

      // Fit within A4 margins (6mm padding)
      const margin = 6;
      let renderWidth = pageWidth - margin * 2;
      let renderHeight = renderWidth / ratio;

      if (renderHeight > pageHeight - margin * 2) {
        renderHeight = pageHeight - margin * 2;
        renderWidth = renderHeight * ratio;
      }

      const x = (pageWidth - renderWidth) / 2;
      const y = (pageHeight - renderHeight) / 2;

      pdf.addImage(imgData, 'JPEG', x, y, renderWidth, renderHeight);
      
      const dateStr = new Date().toISOString().slice(0, 10);
      pdf.save(`Shajarachi_Nasabnoma_${dateStr}.pdf`);
    } catch (err) {
      console.error('[PDF Export Error]:', err);
      window.print();
    } finally {
      setIsExporting(null);
    }
  };

  // Render Visual Tree Format (Grafik Daraxt Ko'rinishi)
  const renderVisualTreeBranch = (personId: string, visited = new Set<string>()): React.ReactNode => {
    const person = people[personId];
    if (!person || visited.has(personId)) return null;
    visited.add(personId);

    const spouseId = person.spouseId || peopleList.find(o => o.spouseId === person.id)?.id;
    const spouse = spouseId ? people[spouseId] : null;
    if (spouse) visited.add(spouse.id);

    const children = peopleList.filter(c => c.parentId === person.id || (spouse && c.parentId === spouse.id));

    return (
      <div key={person.id} className="flex flex-col items-center relative my-3">
        {/* Couple or Person Card */}
        <div className="flex items-center gap-2 bg-white/95 border-2 border-amber-900/40 p-2.5 rounded-2xl shadow-sm z-10">
          <div className="flex items-center gap-2">
            {includePhotos && (
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 border border-slate-300 flex items-center justify-center shrink-0">
                {person.photoUrl ? (
                  <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                ) : (
                  <div className="w-full h-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
                    {person.name.charAt(0)}
                  </div>
                )}
              </div>
            )}
            <div>
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {person.name} {person.surname || ''}
              </div>
              <div className="text-[10px] text-amber-800 font-semibold">
                {person.generation}-pusht {person.id === meId ? "• Siz (Ega)" : ""}
              </div>
            </div>
          </div>

          {spouse && (
            <>
              <div className="w-6 h-6 rounded-full bg-rose-50 border border-rose-300 flex items-center justify-center text-rose-500 shrink-0">
                <Heart className="w-3 h-3 fill-rose-500" />
              </div>
              <div className="flex items-center gap-2">
                {includePhotos && (
                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 border border-slate-300 flex items-center justify-center shrink-0">
                    {spouse.photoUrl ? (
                      <img src={spouse.photoUrl} alt={spouse.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                    ) : (
                      <div className="w-full h-full bg-rose-600 text-white font-bold text-xs flex items-center justify-center">
                        {spouse.name.charAt(0)}
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {spouse.name} {spouse.surname || ''}
                  </div>
                  <div className="text-[10px] text-rose-700 font-semibold">
                    Turmush o'rtog'i
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Children connections */}
        {children.length > 0 && (
          <div className="flex flex-col items-center w-full mt-3">
            <div className="w-0.5 h-4 bg-amber-800" />
            <div className="flex items-start justify-center gap-6 relative pt-2">
              {children.length > 1 && (
                <div 
                  className="absolute top-0 h-0.5 bg-amber-800"
                  style={{ left: '20%', right: '20%' }}
                />
              )}
              {children.map(child => (
                <div key={child.id} className="flex flex-col items-center">
                  <div className="w-0.5 h-2 bg-amber-800" />
                  {renderVisualTreeBranch(child.id, visited)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen flex flex-col bg-slate-950/95 backdrop-blur-md overflow-hidden print:p-0 print:bg-white print:static print:w-full print:h-auto">
      
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
            padding: 10mm;
            box-shadow: none !important;
            border: 2px solid #854d0e !important;
          }
          @page {
            size: A4 landscape;
            margin: 6mm;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* TOP FULLSCREEN CONTROL TOOLBAR */}
      <div className="no-print bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0 z-20 shadow-md">
        
        {/* Left: Title & Mode */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Printer className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Chop etish va saqlash (A4 Landscape)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold">
                To'liq Ekran
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Rasmiy muhrlangan nasabnoma va shajara sertifikati
            </p>
          </div>
        </div>

        {/* Center: Radio Buttons (Format Selector) */}
        <div className="flex items-center gap-1.5 bg-slate-800/90 p-1 rounded-2xl border border-slate-700">
          <label 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
              viewFormat === 'certificate' 
                ? 'bg-amber-600 text-white shadow-xs' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <input 
              type="radio" 
              name="printFormat" 
              value="certificate" 
              checked={viewFormat === 'certificate'} 
              onChange={() => setViewFormat('certificate')} 
              className="sr-only"
            />
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Nasabnoma Sertifikati</span>
          </label>

          <label 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
              viewFormat === 'tree' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <input 
              type="radio" 
              name="printFormat" 
              value="tree" 
              checked={viewFormat === 'tree'} 
              onChange={() => setViewFormat('tree')} 
              className="sr-only"
            />
            <GitFork className="w-3.5 h-3.5" />
            <span>Grafik Daraxt Ko'rinishi</span>
          </label>
        </div>

        {/* Zoom & Style Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 p-0.5">
            <button
              type="button"
              onClick={() => setPreviewZoom(prev => Math.max(0.6, prev - 0.1))}
              className="p-1.5 text-slate-400 hover:text-white transition"
              title="Kichraytirish"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold px-2 text-slate-300">
              {Math.round(previewZoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setPreviewZoom(prev => Math.min(1.6, prev + 0.1))}
              className="p-1.5 text-slate-400 hover:text-white transition"
              title="Kattalashtirish"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewZoom(1)}
              className="p-1.5 text-slate-400 hover:text-white border-l border-slate-700 transition"
              title="Asliga qaytarish (100%)"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Rasmlar bilan */}
          <button
            type="button"
            onClick={() => setIncludePhotos(!includePhotos)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
              includePhotos 
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Check className={`w-3.5 h-3.5 ${includePhotos ? 'opacity-100' : 'opacity-0'}`} />
            <span>Rasmlar</span>
          </button>

          {/* Action Download Buttons */}
          <div className="flex items-center gap-1.5">
            {/* 1. Chop etish */}
            <button
              type="button"
              onClick={handlePrint}
              id="btn-trigger-print"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Chop etish</span>
            </button>

            {/* 2. PNG */}
            <button
              type="button"
              onClick={() => handleExportImage('png')}
              disabled={isExporting !== null}
              id="btn-download-png"
              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isExporting === 'png' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
              <span>PNG yuklash</span>
            </button>

            {/* 3. JPG */}
            <button
              type="button"
              onClick={() => handleExportImage('jpeg')}
              disabled={isExporting !== null}
              id="btn-download-jpg"
              className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-600 active:scale-95 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isExporting === 'jpeg' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>JPG yuklash</span>
            </button>

            {/* 4. Real PDF Download */}
            <button
              type="button"
              onClick={handleSavePdf}
              disabled={isExporting !== null}
              id="btn-save-pdf"
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 active:scale-95 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isExporting === 'pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              <span>PDF yuklab olish</span>
            </button>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-white transition cursor-pointer"
            title="Oynani yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* FULLSCREEN PAN & SCROLL PREVIEW AREA */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-900/90 flex justify-center items-start print:p-0 print:bg-white print:overflow-visible">
        
        <div 
          style={{ transform: `scale(${previewZoom})`, transformOrigin: 'top center', transition: 'transform 0.15s ease-out' }}
          className="w-full flex justify-center"
        >
          {/* A4 LANDSCAPE DOCUMENT CONTAINER */}
          <div
            ref={printAreaRef}
            id="print-document-area"
            className="w-full max-w-6xl min-h-[720px] bg-[#FAF8F5] text-slate-900 rounded-3xl shadow-2xl p-8 sm:p-12 border-4 border-amber-800/90 relative overflow-visible print:border-2 print:border-amber-900 print:rounded-none print:shadow-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(245, 239, 230, 0.8) 0%, rgba(250, 248, 245, 1) 100%)',
            }}
          >
            {/* Tiniq suv belgisi / Watermark (Opacity 22% qilib tiniqlashtirildi) */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.20] select-none z-0">
              <div className="transform -rotate-12 flex flex-col items-center">
                <img
                  src="/assets/aistudio/file_00000000699481f4bf9593e1e840b793_190c7202.png"
                  alt="Watermark"
                  className="w-[420px] h-[420px] object-contain drop-shadow-sm"
                />
                <span className="text-3xl sm:text-4xl font-serif font-black tracking-widest text-amber-950/80 mt-4">
                  ShajaraChi.uz • NASABNOMA
                </span>
              </div>
            </div>

            {/* O'zbek milliy o'yma naqsh burchaklari */}
            <div className="absolute top-3 left-3 w-12 h-12 border-t-3 border-l-3 border-amber-900 pointer-events-none opacity-80 z-10" />
            <div className="absolute top-3 right-3 w-12 h-12 border-t-3 border-r-3 border-amber-900 pointer-events-none opacity-80 z-10" />
            <div className="absolute bottom-3 left-3 w-12 h-12 border-b-3 border-l-3 border-amber-900 pointer-events-none opacity-80 z-10" />
            <div className="absolute bottom-3 right-3 w-12 h-12 border-b-3 border-r-3 border-amber-900 pointer-events-none opacity-80 z-10" />

            {/* Header: Gerb, Sarlavha va Tasdiq sanasi */}
            <div className="relative z-10 flex items-center justify-between pb-6 border-b-2 border-amber-900/40 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-2 border-amber-800/60 p-2 flex items-center justify-center shadow-md shrink-0">
                  <FamilyTreeLogo className="w-14 h-14" />
                </div>
                <div>
                  <span className="text-[10px] sm:text-xs uppercase tracking-widest font-extrabold text-amber-900 block">
                    O'ZBEKISTON MILLIY NASABNOMASI • SHAJARACHI.UZ
                  </span>
                  <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight font-serif mt-0.5">
                    {treeTitle}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1">
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

            {/* Shajara hikmati */}
            <div className="relative z-10 my-5 p-3 rounded-xl bg-amber-100/50 border border-amber-300/80 text-center">
              <p className="text-xs sm:text-sm italic font-serif text-amber-950 font-bold">
                «Yetti pushtini bilgan yigit yetti elning g'amini yer, o'z nasabini bilmagan odam ildizsiz daraxt kabidir.»
              </p>
            </div>

            {/* Dynamic View: Format 1 (Sertifikat) vs Format 2 (Grafik Daraxt) */}
            {viewFormat === 'certificate' ? (
              /* FORMAT 1: Avlodlar bo'yicha to'liq nasabnoma */
              <div className="relative z-10 space-y-6 pt-2">
                {sortedGens.map((gen) => {
                  const persons = generationsMap[gen] || [];
                  return (
                    <div key={gen} className="relative">
                      {/* Avlod Hoshiyasi */}
                      <div className="flex items-center gap-3 mb-2.5">
                        <span className="px-3.5 py-1 rounded-lg bg-amber-900 text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
                          {getGenerationTitle(gen)}
                        </span>
                        <div className="flex-1 h-[2px] bg-gradient-to-r from-amber-800/60 via-slate-300 to-transparent" />
                        <span className="text-[11px] text-amber-950 font-bold">
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
                              className={`p-3 rounded-2xl border-2 transition-all flex flex-col justify-between relative bg-white/95 shadow-sm ${
                                isUserMe
                                  ? 'border-emerald-600 ring-2 ring-emerald-500/20'
                                  : person.gender === 'male'
                                  ? 'border-slate-300'
                                  : 'border-rose-300'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {includePhotos && (
                                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                    {person.photoUrl ? (
                                      <img
                                        src={person.photoUrl}
                                        alt={person.name}
                                        className="w-full h-full object-cover"
                                        crossOrigin="anonymous"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-emerald-700 to-teal-800 flex items-center justify-center text-white text-xs font-bold">
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
                                  {isUserMe && (
                                    <span className="inline-block px-1.5 py-0.5 rounded text-[8px] bg-emerald-100 text-emerald-800 font-bold mt-0.5">
                                      Siz (Ega)
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="mt-2 pt-1.5 border-t border-slate-200 text-[9px] text-slate-600 space-y-0.5">
                                {includeDates && (
                                  <div className="font-semibold text-slate-800">
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
            ) : (
              /* FORMAT 2: Grafik Shajara Daraxti */
              <div className="relative z-10 py-6 overflow-x-auto flex justify-center">
                {renderVisualTreeBranch(rootPerson?.id || peopleList[0]?.id)}
              </div>
            )}

            {/* A4 Footer: Muhr va Imzo Joyi (Tiniq ko'k pechat) */}
            <div className="relative z-10 mt-10 pt-6 border-t-2 border-amber-900/40 flex items-end justify-between text-xs text-slate-600">
              <div>
                <div className="font-bold text-slate-900 text-sm">Shajara egasi:</div>
                <div className="text-xs text-slate-800 font-semibold mt-0.5">
                  {me ? `${me.name} ${me.surname || ''}` : `${rootPerson?.name} ${rootPerson?.surname || ''}`}
                </div>
                <div className="text-[9px] text-slate-500 mt-1">
                  Ushbu shajara «Shajarachi.uz» milliy tizimi orqali shakllantirildi va tasdiqlandi.
                </div>
              </div>

              {/* Rasmiy Muhr (Tiniq va aniq ko'k pechat) */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="w-28 border-b-2 border-slate-500 mb-1" />
                  <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">Shaxsiy Imzo</span>
                </div>
                
                {/* 2-rasmdagi Haqiqiy ko'k dumaloq rasmiy muhr (aniqlashtirilgan) */}
                <div className="flex flex-col items-center">
                  <img
                    src="/assets/aistudio/file_00000000699481f4bf9593e1e840b793_190c7202.png"
                    alt="NASABNOMA - Oila Shajarasi - ShajaraChi.uz Rasmiy Muhri"
                    className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-md contrast-125 saturate-110 transform rotate-[-4deg]"
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
