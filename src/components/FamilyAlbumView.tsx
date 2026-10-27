import React, { useState } from 'react';
import { Person } from '../types';
import { 
  Image as ImageIcon, 
  Camera, 
  User, 
  Search, 
  Download, 
  ExternalLink, 
  X, 
  Sparkles, 
  Filter,
  Eye,
  Calendar
} from 'lucide-react';
import { FamilyTreeLogo } from './FamilyTreeLogo';

interface FamilyAlbumViewProps {
  people: Record<string, Person>;
  onSelectPerson: (person: Person) => void;
  onOpenEditModal?: (person: Person) => void;
  onViewInTree: (person: Person) => void;
}

export const FamilyAlbumView: React.FC<FamilyAlbumViewProps> = ({
  people,
  onSelectPerson,
  onOpenEditModal,
  onViewInTree,
}) => {
  const [filter, setFilter] = useState<'all' | 'photos' | 'ancestors' | 'alive'>('all');
  const [search, setSearch] = useState('');
  const [lightboxPerson, setLightboxPerson] = useState<Person | null>(null);

  const allPeople = Object.values(people) as Person[];
  const peopleWithPhotos = allPeople.filter((p) => !!p.photoUrl);

  const filteredPeople = allPeople.filter((p) => {
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = `${p.name} ${p.surname || ''}`.toLowerCase().includes(q);
      const matchYear = (p.birthYear || p.birthDate || '').includes(q);
      if (!matchName && !matchYear) return false;
    }

    if (filter === 'photos') return !!p.photoUrl;
    if (filter === 'ancestors') return p.generation <= 3;
    if (filter === 'alive') return p.isAlive !== false;
    return true; // all
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 text-white shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Oilaviy Xotiralar va Suratlar Arxivi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Oila Albomi
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Ajdodlar va avlodlarning barcha fotosuratlari, yillari va esdaliklari yagona go'zal galereyada.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
              <span className="text-xl sm:text-2xl font-black text-emerald-400 block">
                {peopleWithPhotos.length}
              </span>
              <span className="text-[10px] text-slate-300 font-medium">Suratli shaxslar</span>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
              <span className="text-xl sm:text-2xl font-black text-amber-400 block">
                {allPeople.length}
              </span>
              <span className="text-[10px] text-slate-300 font-medium">Jami a'zolar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'all'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Barchasi ({allPeople.length})
          </button>

          <button
            onClick={() => setFilter('photos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              filter === 'photos'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Faqat suratlar ({peopleWithPhotos.length})</span>
          </button>

          <button
            onClick={() => setFilter('ancestors')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'ancestors'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Katta ajdodlar
          </button>

          <button
            onClick={() => setFilter('alive')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'alive'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Hozir hayot
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Albomdan qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Grid of Photo Cards */}
      {filteredPeople.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            Hech qanday surat topilmadi
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Qidiruv so'zini o'zgartirib ko'ring yoki shajaradagi shaxslarga yangi surat yuklang.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {filteredPeople.map((person) => {
            const hasPhoto = !!person.photoUrl;
            return (
              <div
                key={person.id}
                className="group relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                {/* Image Container */}
                <div 
                  onClick={() => {
                    if (hasPhoto) setLightboxPerson(person);
                    else onSelectPerson(person);
                  }}
                  className="relative aspect-[4/5] bg-slate-100 dark:bg-slate-800 cursor-pointer overflow-hidden flex items-center justify-center"
                >
                  {hasPhoto ? (
                    <img
                      src={person.photoUrl}
                      alt={person.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${person.avatarColor || 'from-emerald-600 to-teal-800'} flex flex-col items-center justify-center text-white p-3 text-center`}>
                      <span className="text-3xl font-extrabold mb-1">
                        {person.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="text-[10px] opacity-75">Suratsiz</span>
                    </div>
                  )}

                  {/* Gradient bottom shadow */}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                  {/* Badges on Image */}
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/60 text-white backdrop-blur-sm">
                      {person.generation}-pusht
                    </span>
                    {!person.isAlive && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-600 text-white shadow-xs">
                        Vafot etgan
                      </span>
                    )}
                  </div>

                  {/* Hover Action overlay */}
                  <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasPhoto) setLightboxPerson(person);
                        else onSelectPerson(person);
                      }}
                      className="p-2.5 rounded-xl bg-white text-slate-900 shadow-md hover:scale-110 active:scale-95 transition"
                      title="Kattalashtirib ko'rish"
                    >
                      <Eye className="w-4 h-4 text-emerald-600" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewInTree(person);
                      }}
                      className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md hover:scale-110 active:scale-95 transition"
                      title="Daraxtda ko'rish"
                    >
                      <FamilyTreeLogo className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Info info below image */}
                <div className="p-3 bg-white dark:bg-slate-900 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 
                      onClick={() => onSelectPerson(person)}
                      className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate hover:text-emerald-600 cursor-pointer"
                    >
                      {person.name} {person.surname || ''}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>
                        {person.birthYear || (person.birthDate ? person.birthDate.slice(0, 4) : 'Noma\'lum')}
                        {!person.isAlive && person.deathYear ? ` — ${person.deathYear}` : ''}
                      </span>
                    </p>
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => onSelectPerson(person)}
                      className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Profil →
                    </button>
                    {onOpenEditModal && (
                      <button
                        onClick={() => onOpenEditModal(person)}
                        className="text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        title="Suratni yangilash"
                      >
                        <Camera className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox / Fullscreen Image Viewer Modal */}
      {lightboxPerson && lightboxPerson.photoUrl && (
        <div 
          onClick={() => setLightboxPerson(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Top Bar */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white bg-slate-950/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  {lightboxPerson.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {lightboxPerson.name} {lightboxPerson.surname || ''}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {lightboxPerson.generation}-pusht {lightboxPerson.birthYear ? `• ${lightboxPerson.birthYear}` : ''}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={lightboxPerson.photoUrl}
                  download={`${lightboxPerson.name}_surati.jpg`}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                  title="Suratni yuklab olish"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setLightboxPerson(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                  title="Yopish"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Photo View */}
            <div className="flex-1 overflow-hidden p-4 flex items-center justify-center bg-black/60">
              <img
                src={lightboxPerson.photoUrl}
                alt={lightboxPerson.name}
                referrerPolicy="no-referrer"
                className="max-h-[65vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
              />
            </div>

            {/* Bottom Controls */}
            <div className="p-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
              <button
                onClick={() => {
                  const p = lightboxPerson;
                  setLightboxPerson(null);
                  onSelectPerson(p);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
              >
                To'liq profilni ochish
              </button>

              <button
                onClick={() => {
                  const p = lightboxPerson;
                  setLightboxPerson(null);
                  onViewInTree(p);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition flex items-center gap-1.5"
              >
                <FamilyTreeLogo className="w-3.5 h-3.5" />
                <span>Daraxtda ko'rish</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
