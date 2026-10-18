import React from 'react';
import { AuthUser, Person } from '../types';
import { getLineageToRoot, UZBEK_ANCESTOR_TITLES } from '../utils/kinship';
import { 
  Crown, 
  Scroll, 
  Award, 
  Briefcase, 
  MapPin,
  Lock,
  Compass
} from 'lucide-react';

interface SevenAncestorsViewProps {
  meId: string;
  activePerspectiveId?: string;
  currentUser?: AuthUser | null;
  people: Record<string, Person>;
  onSelectPerson: (person: Person) => void;
  onEditPerson: (person: Person) => void;
  onUnauthorizedEditAttempt?: () => void;
}

export const SevenAncestorsView: React.FC<SevenAncestorsViewProps> = ({
  meId,
  activePerspectiveId,
  currentUser,
  people,
  onSelectPerson,
  onEditPerson,
  onUnauthorizedEditAttempt,
}) => {
  const effectiveMeId = activePerspectiveId || meId;
  const me = people[effectiveMeId];
  const lineage = getLineageToRoot(effectiveMeId, people); // Array: [0: me, 1: father, 2: grandfather, ...]

  return (
    <div id="seven-ancestors-view" className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-amber-700 to-emerald-800 text-white p-8 sm:p-10 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-amber-100 text-xs font-semibold">
            <Award className="w-4 h-4 text-amber-300" />
            <span>Milliy Meros va Qadriyat</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            7 Ajdod Shajarasi
          </h1>
          <p className="text-sm sm:text-base text-amber-100/90 leading-relaxed">
            «Yetti pushtini bilish — har bir insonning o'z o'tmishiga hurmati, milliy o'zligini anglashi va kelajakka mustahkam poydevoridir.»
          </p>

          {me && (
            <div className="pt-2 flex items-center gap-3 text-xs sm:text-sm text-emerald-100 flex-wrap">
              <span className="font-medium">Nuqtai nazar:</span>
              <span className="font-bold bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm text-white flex items-center gap-1.5">
                {activePerspectiveId && <Compass className="w-3.5 h-3.5 text-amber-300 animate-spin" />}
                {me.name} {me.surname || ''} {me.titleOrNickname ? `(«${me.titleOrNickname}»)` : ''}
              </span>
              <span className="text-amber-200 text-xs">
                ({lineage.length} ta ajdod zanjiri aniqlangan)
              </span>
            </div>
          )}
        </div>

        {/* Decorative Watermark */}
        <Scroll className="absolute -right-8 -bottom-8 w-64 h-64 text-white/10 pointer-events-none transform -rotate-12" />
      </div>

      {/* 7 Ajdod Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <span>Nasab Zanjiri (Ketma-ket 7 Ajdod)</span>
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Pastdan yuqoriga qarab o'rganing
          </span>
        </div>

        <div className="relative pl-6 sm:pl-10 space-y-6 before:absolute before:left-3 sm:before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-amber-400 before:to-amber-600">
          {lineage.map((person, idx) => {
            const levelInfo = UZBEK_ANCESTOR_TITLES[idx] || {
              title: `${idx}-ajdod`,
              desc: `${idx}-avlod yuqori`,
            };
            const isMe = idx === 0;
            const isRoot = idx === lineage.length - 1;
            const canEdit = Boolean(currentUser && currentUser.personId === person.id);

            return (
              <div
                key={person.id}
                id={`lineage-node-${person.id}`}
                className="relative group transition-all"
              >
                {/* Milestone Node on vertical line */}
                <div
                  className={`absolute -left-6 sm:-left-10 top-5 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 sm:border-4 border-white dark:border-slate-900 flex items-center justify-center text-[10px] sm:text-xs font-bold shadow-md ${
                    isMe
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950'
                      : isRoot
                      ? 'bg-amber-500 text-white ring-4 ring-amber-100 dark:ring-amber-950'
                      : 'bg-slate-700 text-white'
                  }`}
                >
                  {idx + 1}
                </div>

                {/* Ancestor Card */}
                <div
                  className={`p-5 sm:p-6 rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md ${
                    isMe
                      ? 'border-emerald-500/50 bg-gradient-to-r from-emerald-50/40 to-transparent dark:from-emerald-950/20'
                      : isRoot
                      ? 'border-amber-500/50 bg-gradient-to-r from-amber-50/40 to-transparent dark:from-amber-950/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Photo or Avatar */}
                      <div 
                        onClick={() => onSelectPerson(person)}
                        className="cursor-pointer group/avatar flex-shrink-0"
                      >
                        {person.photoUrl ? (
                          <img
                            src={person.photoUrl}
                            alt={person.name}
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm group-hover/avatar:scale-105 transition-transform"
                          />
                        ) : (
                          <div
                            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${
                              person.avatarColor || (person.gender === 'male' ? 'from-sky-600 to-indigo-800' : 'from-rose-500 to-pink-700')
                            } flex items-center justify-center text-white font-extrabold text-xl shadow-sm border-2 border-white dark:border-slate-800 group-hover/avatar:scale-105 transition-transform`}
                          >
                            {person.name.charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* Name & Title */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                            {idx + 1}-Pusht: {levelInfo.title}
                          </span>
                          {isMe && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white">
                              Siz
                            </span>
                          )}
                          {isRoot && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-600 text-white">
                              Bosh Ajdod
                            </span>
                          )}
                        </div>

                        <h3 
                          onClick={() => onSelectPerson(person)}
                          className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white cursor-pointer hover:text-emerald-600 transition-colors"
                        >
                          {person.name} {person.surname || ''}
                          {person.titleOrNickname && (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold ml-2 text-base">
                              «{person.titleOrNickname}»
                            </span>
                          )}
                        </h3>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {levelInfo.desc}
                        </p>

                        {(person.occupation || person.location) && (
                          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                            {person.occupation && (
                              <div className="flex items-center gap-1">
                                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                <span>{person.occupation}</span>
                              </div>
                            )}
                            {person.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span>{person.location}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 sm:self-center">
                      <button
                        id={`btn-lineage-view-${person.id}`}
                        onClick={() => onSelectPerson(person)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-slate-700 transition-colors"
                      >
                        Batafsil
                      </button>

                      {canEdit ? (
                        <button
                          id={`btn-lineage-edit-${person.id}`}
                          onClick={() => onEditPerson(person)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 transition-colors"
                        >
                          Tahrirlash / Rasm
                        </button>
                      ) : (
                        <button
                          onClick={() => onUnauthorizedEditAttempt && onUnauthorizedEditAttempt()}
                          className="p-1.5 rounded-xl text-slate-300 dark:text-slate-600 hover:text-slate-400 text-xs font-semibold transition-colors"
                          title="Faqat o'z profilingizni tahrirlashingiz mumkin"
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Traditional Uzbek 7 Ancestors Educational Matrix */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Scroll className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            O'zbek Milliy An'analarida 7 Ajdod Nomlanishi
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {Object.entries(UZBEK_ANCESTOR_TITLES).map(([levelStr, item]) => {
            const level = Number(levelStr);
            if (level === 0) return null;
            return (
              <div
                key={level}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1"
              >
                <div className="font-extrabold text-amber-700 dark:text-amber-400 text-sm">
                  {level}-Ajdod: {item.title}
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  {item.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

