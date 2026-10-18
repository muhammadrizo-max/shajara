import React from 'react';
import { AuthUser, Person, RelativeRelationInfo } from '../types';
import { calculateKinship } from '../utils/kinship';
import { 
  User, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Edit3, 
  Eye, 
  Crown,
  Briefcase,
  MapPin,
  Sparkles,
  Lock,
  Compass,
  Film
} from 'lucide-react';

interface PersonCardProps {
  person: Person;
  people: Record<string, Person>;
  meId: string;
  activePerspectiveId?: string;
  currentUser?: AuthUser | null;
  hasChildren: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelect: (person: Person) => void;
  onEdit: (person: Person) => void;
  onAddChild: (parent: Person) => void;
  onSetTemporaryPerspective: (personId: string) => void;
  onUnauthorizedEditAttempt?: () => void;
  isSelected?: boolean;
  isHighlighted?: boolean;
}

export const PersonCard: React.FC<PersonCardProps> = ({
  person,
  people,
  meId,
  activePerspectiveId,
  currentUser,
  hasChildren,
  isExpanded,
  onToggleExpand,
  onSelect,
  onEdit,
  onAddChild,
  onSetTemporaryPerspective,
  onUnauthorizedEditAttempt,
  isSelected = false,
  isHighlighted = false,
}) => {
  const isMe = person.id === meId;
  const isTemporaryPerspective = activePerspectiveId === person.id;
  const isMale = person.gender === 'male';
  
  // Compute kinship relative to active perspective if set, otherwise relative to real meId
  const effectiveMeId = activePerspectiveId || meId;
  const kinship: RelativeRelationInfo = calculateKinship(effectiveMeId, person.id, people);

  // Permission: Har bir shaxs faqatgina o'zining ma'lumotlarini tahrirlashi mumkin
  const canEdit = Boolean(currentUser && currentUser.personId === person.id);

  const getBadgeColor = () => {
    if (person.id === effectiveMeId) return 'bg-emerald-500 text-white font-bold ring-2 ring-emerald-300';
    if (kinship.isDirectAncestor) return 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-400/30';
    if (kinship.isDirectDescendant) return 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-400/30';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  };

  const getCardBorder = () => {
    if (isSelected) return 'ring-2 ring-emerald-600 shadow-xl scale-[1.02] border-emerald-500';
    if (isHighlighted) return 'ring-2 ring-amber-500 shadow-lg border-amber-400';
    if (isMe) return 'border-emerald-500/80 shadow-md ring-1 ring-emerald-400/50 bg-gradient-to-b from-emerald-50/60 to-white dark:from-emerald-950/20 dark:to-slate-900';
    if (isTemporaryPerspective) return 'border-amber-400 ring-2 ring-amber-400/60 shadow-md bg-gradient-to-b from-amber-50/50 to-white dark:from-amber-950/20 dark:to-slate-900';
    if (kinship.isDirectAncestor) return 'border-amber-400/50 bg-gradient-to-b from-amber-50/40 to-white dark:from-amber-950/20 dark:to-slate-900';
    return isMale
      ? 'border-sky-200 dark:border-sky-900/40 bg-white dark:bg-slate-900'
      : 'border-rose-200 dark:border-rose-900/40 bg-white dark:bg-slate-900';
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canEdit) {
      onEdit(person);
    } else {
      if (onUnauthorizedEditAttempt) {
        onUnauthorizedEditAttempt();
      }
    }
  };

  return (
    <div
      id={`person-card-${person.id}`}
      className={`relative w-64 rounded-2xl border transition-all duration-200 select-none shadow-sm hover:shadow-md ${getCardBorder()}`}
    >
      {/* 7 Ajdod / Ancestor Crown Badge */}
      {kinship.isDirectAncestor && person.id !== effectiveMeId && (
        <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500 text-white flex items-center gap-1 shadow-sm">
          <Crown className="w-3 h-3 text-amber-100" />
          <span>{kinship.ancestorTitleUz || 'Ajdod'}</span>
        </div>
      )}

      {/* "Siz (Men)" indicator badge (1-rasmdagi kabi) */}
      {isMe && (
        <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white flex items-center gap-1 shadow-sm">
          <Sparkles className="w-3 h-3 text-emerald-200" />
          <span>Siz (Men)</span>
        </div>
      )}

      {/* Vaqtinchalik tanlangan nuqtai nazar badge */}
      {isTemporaryPerspective && !isMe && (
        <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-600 text-white flex items-center gap-1 shadow-sm">
          <Compass className="w-3 h-3 text-amber-200" />
          <span>Vaqtincha tanlangan</span>
        </div>
      )}

      {/* Generation Tag */}
      <div className="absolute -top-3 right-4 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        {person.generation}-pusht
      </div>

      <div className="p-4 pt-4">
        <div className="flex items-start gap-3">
          {/* Avatar / Photo / Video Avatar */}
          <div 
            onClick={() => onSelect(person)}
            className="relative cursor-pointer group flex-shrink-0"
            title="Batafsil ma'lumotni ko'rish"
          >
            {person.avatarVideoUrl ? (
              <div className="relative w-13 h-13 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-sm group-hover:scale-105 transition-transform bg-black">
                <video
                  src={person.avatarVideoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-0.5 right-0.5 p-0.5 rounded bg-black/60 text-emerald-400">
                  <Film className="w-2.5 h-2.5" />
                </div>
              </div>
            ) : person.photoUrl ? (
              <img
                src={person.photoUrl}
                alt={person.name}
                referrerPolicy="no-referrer"
                className="w-13 h-13 rounded-xl object-cover border-2 border-white dark:border-slate-800 shadow-sm group-hover:scale-105 transition-transform"
              />
            ) : (
              <div
                className={`w-13 h-13 rounded-xl bg-gradient-to-br ${
                  person.avatarColor || (isMale ? 'from-sky-500 to-indigo-700' : 'from-rose-400 to-pink-600')
                } flex items-center justify-center text-white font-bold text-lg shadow-sm border-2 border-white dark:border-slate-800 group-hover:scale-105 transition-transform`}
              >
                {person.name.charAt(0).toUpperCase()}
              </div>
            )}
            
            {/* Gender icon badge */}
            <div
              className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white border-2 border-white dark:border-slate-900 ${
                isMale ? 'bg-sky-600' : 'bg-rose-500'
              }`}
            >
              {isMale ? '♂' : '♀'}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div 
              onClick={() => onSelect(person)}
              className="cursor-pointer group"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate leading-tight group-hover:text-emerald-600 transition-colors">
                {person.name} {person.surname || ''}
              </h3>
              
              {person.titleOrNickname && (
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 truncate mt-0.5">
                  «{person.titleOrNickname}»
                </p>
              )}
            </div>

            {/* Relationship badge */}
            <div className="mt-1.5 flex flex-wrap gap-1">
              <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] leading-snug truncate max-w-full ${getBadgeColor()}`}>
                {kinship.relationNameUz}
              </span>
            </div>
          </div>
        </div>

        {/* Quick meta info (2-rasmdagi kabi qisqa ma'lumot) */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
          {person.birthDate ? (
            <div className="text-[10px] text-slate-400 truncate">
              📅 {person.birthDate} {person.isAlive ? '(Hayot)' : `— ${person.deathYear || 'Vafot'}`}
            </div>
          ) : person.birthYear ? (
            <div className="text-[10px] text-slate-400 truncate">
              📅 {person.birthYear}-yil {person.isAlive ? '(Hayot)' : `— ${person.deathYear || 'Vafot'}`}
            </div>
          ) : null}

          {person.occupation && (
            <div className="flex items-center gap-1.5 truncate">
              <Briefcase className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span className="truncate">{person.occupation}</span>
            </div>
          )}
          {person.location && (
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span className="truncate">{person.location}</span>
            </div>
          )}
        </div>

        {/* Action Toolbar on Card */}
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1">
            {/* View full drawer */}
            <button
              id={`btn-view-${person.id}`}
              onClick={() => onSelect(person)}
              title="Batafsil ma'lumot"
              className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Edit (Faqatgina o'zining profilini tahrirlash mumkin) */}
            {canEdit ? (
              <button
                id={`btn-edit-${person.id}`}
                onClick={handleEditClick}
                title="O'z profilingizni tahrirlash"
                className="p-1.5 rounded-lg text-blue-600 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            ) : (
              <button
                id={`btn-edit-locked-${person.id}`}
                onClick={handleEditClick}
                title="Tahrirlash yopiq (Faqat o'zingizning ma'lumotlaringizni tahrirlashingiz mumkin)"
                className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-not-allowed"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Add Child / Farzand qo'shish (Faqat o'zi uchun) */}
            {canEdit ? (
              <button
                id={`btn-add-child-${person.id}`}
                onClick={() => onAddChild(person)}
                title="O'zingizga farzand / zurriyot qo'shish"
                className="px-2 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Farzand</span>
              </button>
            ) : (
              <button
                id={`btn-add-child-locked-${person.id}`}
                onClick={() => onUnauthorizedEditAttempt && onUnauthorizedEditAttempt()}
                title="Farzand qo'shish yopiq (Siz faqat o'z profilingizga farzand qo'sha olasiz)"
                className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5 opacity-40" />
              </button>
            )}
          </div>

          {/* Vaqtinchalik qarindoshlik nuqtai nazari (3-rasm bo'yicha vaqtinchalik qilingan) */}
          <button
            id={`btn-temp-perspective-${person.id}`}
            onClick={() => onSetTemporaryPerspective(person.id)}
            title={
              isTemporaryPerspective
                ? "Vaqtinchalik nuqtai nazar faol (Asl profilingizga qaytish uchun bosing)"
                : `«${person.name}» nomidan vaqtincha qarindoshlikni tekshirish`
            }
            className={`p-1.5 rounded-lg transition-colors ${
              isTemporaryPerspective
                ? 'bg-amber-500 text-white shadow-sm ring-1 ring-amber-400'
                : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" />
          </button>

          {/* Expand / Collapse Button if has children */}
          {hasChildren && (
            <button
              id={`btn-expand-${person.id}`}
              onClick={onToggleExpand}
              className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
                isExpanded 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
              title={isExpanded ? "Shoxchani yopish" : "Farzandlarni ko'rsatish"}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

