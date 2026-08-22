import React from 'react';
import { AuthUser, Person } from '../types';
import { calculateKinship, getChildren, getLineageToRoot, getSiblings } from '../utils/kinship';
import { 
  X, 
  Crown, 
  Compass, 
  Edit3, 
  Plus, 
  Trash2, 
  MapPin, 
  Briefcase, 
  Calendar, 
  GitBranch, 
  ChevronRight,
  Upload,
  Lock,
  Film,
  Video as VideoIcon,
  Play,
  Clock
} from 'lucide-react';

interface PersonDetailDrawerProps {
  person: Person | null;
  people: Record<string, Person>;
  meId: string;
  activePerspectiveId?: string;
  currentUser?: AuthUser | null;
  onClose: () => void;
  onSelectPerson: (person: Person) => void;
  onEditPerson: (person: Person) => void;
  onAddChild: (parent: Person) => void;
  onSetTemporaryPerspective: (personId: string) => void;
  onDeletePerson: (personId: string) => void;
  onUnauthorizedEditAttempt?: () => void;
}

export const PersonDetailDrawer: React.FC<PersonDetailDrawerProps> = ({
  person,
  people,
  meId,
  activePerspectiveId,
  currentUser,
  onClose,
  onSelectPerson,
  onEditPerson,
  onAddChild,
  onSetTemporaryPerspective,
  onDeletePerson,
  onUnauthorizedEditAttempt,
}) => {
  if (!person) return null;

  const isMe = person.id === meId;
  const isMale = person.gender === 'male';
  const effectiveMeId = activePerspectiveId || meId;
  const isTemporaryPerspective = activePerspectiveId === person.id;
  const kinship = calculateKinship(effectiveMeId, person.id, people);
  const lineage = getLineageToRoot(person.id, people);
  const parent = person.parentId ? people[person.parentId] : null;
  const children = getChildren(person.id, people);
  const siblings = getSiblings(person.id, people);

  const canEdit = Boolean(currentUser && currentUser.personId === person.id);

  const handleEditClick = () => {
    if (canEdit) {
      onEditPerson(person);
    } else {
      if (onUnauthorizedEditAttempt) {
        onUnauthorizedEditAttempt();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {person.generation}-pusht
              </span>
              {kinship.isDirectAncestor && person.id !== effectiveMeId && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  <span>Ajdod</span>
                </span>
              )}
              {isMe && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-600 text-white">
                  Siz (Men)
                </span>
              )}
              {isTemporaryPerspective && !isMe && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500 text-white">
                  Vaqtinchalik nuqtai nazar
                </span>
              )}
            </div>

            <button
              id="btn-close-drawer"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Person Hero Info */}
            <div className="flex items-start gap-4">
              <div className="relative group/photo flex-shrink-0">
                {person.avatarVideoUrl ? (
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md bg-black">
                    <video
                      src={person.avatarVideoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/70 text-[9px] text-emerald-300 font-bold flex items-center gap-0.5">
                      <Film className="w-2.5 h-2.5" />
                      <span>{person.avatarVideoDuration || '1m'}</span>
                    </div>
                  </div>
                ) : person.photoUrl ? (
                  <img
                    src={person.photoUrl}
                    alt={person.name}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-md"
                  />
                ) : (
                  <div
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${
                      person.avatarColor || (isMale ? 'from-sky-500 to-indigo-700' : 'from-rose-400 to-pink-600')
                    } flex items-center justify-center text-white font-extrabold text-2xl shadow-md`}
                  >
                    {person.name.charAt(0)}
                  </div>
                )}

                {canEdit && (
                  <button
                    onClick={() => onEditPerson(person)}
                    title="Rasm yoki Video avatarni o'zgartirish"
                    className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-600 text-white rounded-lg shadow-md hover:bg-emerald-700 transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="space-y-1 min-w-0">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {person.name} {person.surname || ''}
                </h2>
                {person.titleOrNickname && (
                  <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                    «{person.titleOrNickname}»
                  </p>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Jinsi: {isMale ? 'Erkak' : 'Ayol'} {person.birthDate ? `• 📅 ${person.birthDate}` : person.birthYear ? `• 📅 ${person.birthYear}-yil` : ''}
                </p>
              </div>
            </div>

            {/* Kinship Card: "Sizga kim bo'ladi?" */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/30 dark:to-slate-800/40 border border-emerald-200/60 dark:border-emerald-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Qarindoshlik rishtasi:
                </span>
                <button
                  onClick={() => onSetTemporaryPerspective(person.id)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-colors ${
                    isTemporaryPerspective
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-white border border-slate-200 dark:border-slate-700'
                  }`}
                  title="Shu shaxs nigohi bilan qarindoshliklarni tekshirish"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>{isTemporaryPerspective ? 'Vaqtincha tanlangan' : 'Vaqtinchalik tekshirish'}</span>
                </button>
              </div>
              <div className="text-base font-extrabold text-emerald-900 dark:text-emerald-200">
                {kinship.relationNameUz}
              </div>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">
                {kinship.description}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              {canEdit ? (
                <button
                  id="btn-drawer-add-child"
                  onClick={() => onAddChild(person)}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Farzand qo'shish</span>
                </button>
              ) : (
                <button
                  id="btn-drawer-add-child-disabled"
                  onClick={() => onUnauthorizedEditAttempt && onUnauthorizedEditAttempt()}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-not-allowed"
                  title="Faqat o'z profilingizga farzand qo'sha olasiz"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Farzand qo'shish (yopiq)</span>
                </button>
              )}

              {canEdit ? (
                <button
                  id="btn-drawer-edit"
                  onClick={handleEditClick}
                  className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>O'z profilingizni tahrirlash</span>
                </button>
              ) : (
                <button
                  id="btn-drawer-edit-disabled"
                  onClick={handleEditClick}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-not-allowed"
                  title="Faqat o'zingizning ma'lumotlaringizni tahrirlashingiz mumkin"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tahrirlash yopiq</span>
                </button>
              )}
            </div>

            {!canEdit && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>Xavfsizlik qoidasi: Siz faqat o'z ma'lumotlaringizni tahrirlashingiz mumkin.</span>
              </div>
            )}

            {/* Details Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Shaxsiy Ma'lumotlar
              </h4>

              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {person.occupation && (
                  <div className="p-3 flex items-center gap-3">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Kasbi / Faoliyati</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{person.occupation}</span>
                    </div>
                  </div>
                )}

                {person.location && (
                  <div className="p-3 flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Yashagan joyi</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{person.location}</span>
                    </div>
                  </div>
                )}

                {person.notes && (
                  <div className="p-3">
                    <span className="text-slate-400 block text-[10px] mb-1">Xotiralar & Tarjimai hol</span>
                    <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed">
                      «{person.notes}»
                    </p>
                  </div>
                )}

                {/* Tarjimai hol videosi (max 10 daqiqa, 300MB) */}
                {person.biographyVideoUrl && (
                  <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-900 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5">
                        <Film className="w-4 h-4 text-amber-600" />
                        <span>Tarjimai hol videosi</span>
                      </span>
                      {person.biographyVideoDuration && (
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 flex items-center gap-1 font-semibold">
                          <Clock className="w-3 h-3" />
                          <span>{Math.floor(person.biographyVideoDuration / 60)}:{person.biographyVideoDuration % 60 < 10 ? '0' : ''}{person.biographyVideoDuration % 60} daq</span>
                        </span>
                      )}
                    </div>

                    <div className="rounded-xl overflow-hidden bg-black aspect-video border border-amber-300/60 dark:border-amber-800/60 shadow-sm">
                      <video
                        src={person.biographyVideoUrl}
                        controls
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Lineage Path to Root (Nasab yo'li) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Bosh Ajdodgacha Nasab Zanjiri
              </h4>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
                  {lineage.slice().reverse().map((anc, idx) => (
                    <React.Fragment key={anc.id}>
                      <button
                        onClick={() => onSelectPerson(anc)}
                        className={`px-2 py-1 rounded-lg transition-colors ${
                          anc.id === person.id
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-emerald-50'
                        }`}
                      >
                        {anc.name}
                      </button>
                      {idx < lineage.length - 1 && (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Relatives list (Parent, Children, Siblings) */}
            <div className="space-y-4">
              {/* Father/Parent */}
              {parent && (
                <div>
                  <h5 className="text-[11px] font-bold text-slate-400 mb-2">Otasi</h5>
                  <button
                    onClick={() => onSelectPerson(parent)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 flex items-center justify-center font-bold text-xs">
                        {parent.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">
                          {parent.name} {parent.titleOrNickname ? `(«${parent.titleOrNickname}»)` : ''}
                        </div>
                        <div className="text-[10px] text-slate-400">{parent.generation}-pusht</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              )}

              {/* Children */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-[11px] font-bold text-slate-400">
                    Farzandlari ({children.length})
                  </h5>
                  <button
                    onClick={() => onAddChild(person)}
                    className="text-[11px] text-emerald-600 font-semibold hover:underline"
                  >
                    + Yangi qo'shish
                  </button>
                </div>

                {children.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Hozircha farzandlar kiritilmagan.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-1.5">
                    {children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => onSelectPerson(child)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            child.gender === 'male' ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {child.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-900 dark:text-white">
                              {child.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {child.gender === 'male' ? "O'g'il" : "Qiz"} • {child.generation}-pusht
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Siblings */}
              {siblings.length > 0 && (
                <div>
                  <h5 className="text-[11px] font-bold text-slate-400 mb-2">
                    Tug'ishganlari ({siblings.length})
                  </h5>
                  <div className="grid grid-cols-2 gap-1.5">
                    {siblings.map((sib) => (
                      <button
                        key={sib.id}
                        onClick={() => onSelectPerson(sib)}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                      >
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px] ${
                          sib.gender === 'male' ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {sib.name.charAt(0)}
                        </div>
                        <span className="font-medium text-xs text-slate-800 dark:text-slate-200 truncate">
                          {sib.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Danger Zone: Delete Person */}
            {!isMe && person.parentId !== null && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  id={`btn-delete-${person.id}`}
                  onClick={() => {
                    if (confirm(`Rostdan ham ${person.name}ni va uning farzandlarini shajaradan o'chirmoqchimisiz?`)) {
                      onDeletePerson(person.id);
                      onClose();
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Shajaradan o'chirish</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
