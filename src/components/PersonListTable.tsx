import React, { useState } from 'react';
import { AuthUser, Person } from '../types';
import { calculateKinship } from '../utils/kinship';
import { 
  Search, 
  Filter, 
  Crown, 
  Compass, 
  Edit3, 
  Plus, 
  Eye, 
  Briefcase, 
  MapPin, 
  Trash2,
  Users,
  Lock
} from 'lucide-react';

interface PersonListTableProps {
  people: Record<string, Person>;
  meId: string;
  activePerspectiveId?: string;
  currentUser?: AuthUser | null;
  onSelectPerson: (person: Person) => void;
  onEditPerson: (person: Person) => void;
  onAddChild: (parent: Person) => void;
  onSetTemporaryPerspective: (personId: string) => void;
  onDeletePerson: (personId: string) => void;
  onUnauthorizedEditAttempt?: () => void;
}

export const PersonListTable: React.FC<PersonListTableProps> = ({
  people,
  meId,
  activePerspectiveId,
  currentUser,
  onSelectPerson,
  onEditPerson,
  onAddChild,
  onSetTemporaryPerspective,
  onDeletePerson,
  onUnauthorizedEditAttempt,
}) => {
  const [search, setSearch] = useState<string>('');
  const [filterGen, setFilterGen] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<string>('all');

  const peopleList = Object.values(people) as Person[];
  const effectiveMeId = activePerspectiveId || meId;

  // Available generations
  const generations = Array.from(new Set(peopleList.map((p) => p.generation))).sort((a, b) => a - b);

  const filteredPeople = peopleList.filter((p) => {
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchSurname = p.surname && p.surname.toLowerCase().includes(q);
      const matchNick = p.titleOrNickname && p.titleOrNickname.toLowerCase().includes(q);
      const matchJob = p.occupation && p.occupation.toLowerCase().includes(q);
      const matchLoc = p.location && p.location.toLowerCase().includes(q);
      if (!matchName && !matchSurname && !matchNick && !matchJob && !matchLoc) return false;
    }

    // Generation
    if (filterGen !== 'all' && p.generation !== Number(filterGen)) return false;

    // Gender
    if (filterGender !== 'all' && p.gender !== filterGender) return false;

    return true;
  });

  return (
    <div id="person-list-view" className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Search and Filters */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              id="search-table-input"
              type="text"
              placeholder="Ism, unvon yoki kasb bo'yicha qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Generation Filter */}
            <select
              id="filter-generation-select"
              value={filterGen}
              onChange={(e) => setFilterGen(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">Barcha pushtlar (1-8)</option>
              {generations.map((gen) => (
                <option key={gen} value={gen}>
                  {gen}-pusht
                </option>
              ))}
            </select>

            {/* Gender Filter */}
            <select
              id="filter-gender-select"
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">Barcha jinslar</option>
              <option value="male">Erkaklar (O'g'illar)</option>
              <option value="female">Ayollar (Qizlar)</option>
            </select>

            <div className="text-xs font-semibold text-slate-500 pl-2">
              Jami: {filteredPeople.length} ta shaxs
            </div>
          </div>
        </div>
      </div>

      {/* People Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPeople.map((person) => {
          const isMe = person.id === meId;
          const isTemporaryPerspective = activePerspectiveId === person.id;
          const isMale = person.gender === 'male';
          const kinship = calculateKinship(effectiveMeId, person.id, people);
          const parent = person.parentId ? people[person.parentId] : null;
          const canEdit = Boolean(currentUser && currentUser.personId === person.id);

          return (
            <div
              key={person.id}
              id={`table-card-${person.id}`}
              className={`p-5 rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md ${
                isMe
                  ? 'border-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-950 bg-emerald-50/20'
                  : isTemporaryPerspective
                  ? 'border-amber-500 ring-2 ring-amber-200 dark:ring-amber-950 bg-amber-50/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start gap-3.5">
                {/* Avatar */}
                <div 
                  onClick={() => onSelectPerson(person)}
                  className="cursor-pointer group/avatar flex-shrink-0"
                >
                  {person.photoUrl ? (
                    <img
                      src={person.photoUrl}
                      alt={person.name}
                      referrerPolicy="no-referrer"
                      className="w-13 h-13 rounded-xl object-cover border-2 border-white dark:border-slate-800 shadow-sm group-hover/avatar:scale-105 transition-transform"
                    />
                  ) : (
                    <div
                      className={`w-13 h-13 rounded-xl bg-gradient-to-br ${
                        person.avatarColor || (isMale ? 'from-sky-500 to-indigo-700' : 'from-rose-400 to-pink-600')
                      } flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover/avatar:scale-105 transition-transform`}
                    >
                      {person.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 
                      onClick={() => onSelectPerson(person)}
                      className="text-base font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:text-emerald-600 transition-colors"
                    >
                      {person.name} {person.surname || ''}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex-shrink-0">
                      {person.generation}-pusht
                    </span>
                  </div>

                  {person.titleOrNickname && (
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 truncate">
                      «{person.titleOrNickname}»
                    </p>
                  )}

                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                      {kinship.relationNameUz}
                    </span>
                  </div>

                  {person.birthDate ? (
                    <p className="text-[11px] text-slate-400 mt-1 truncate">
                      📅 {person.birthDate}
                    </p>
                  ) : parent ? (
                    <p className="text-[11px] text-slate-400 mt-1 truncate">
                      Otasi: {parent.name} {parent.titleOrNickname ? `(«${parent.titleOrNickname}»)` : ''}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onSelectPerson(person)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs font-semibold transition-colors"
                    title="Batafsil ma'lumot"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {canEdit ? (
                    <button
                      onClick={() => onEditPerson(person)}
                      className="p-1.5 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs font-semibold transition-colors"
                      title="O'z profilingizni tahrirlash"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onUnauthorizedEditAttempt && onUnauthorizedEditAttempt()}
                      className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-slate-400 text-xs font-semibold transition-colors"
                      title="Faqat o'zingizning ma'lumotlaringizni tahrirlashingiz mumkin"
                    >
                      <Lock className="w-4 h-4" />
                    </button>
                  )}

                  {canEdit ? (
                    <button
                      onClick={() => onAddChild(person)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="O'zingizga farzand qo'shish"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Farzand</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onUnauthorizedEditAttempt && onUnauthorizedEditAttempt()}
                      className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-slate-400 text-xs font-semibold transition-colors cursor-not-allowed"
                      title="Farzand qo'shish yopiq (Faqat o'zingiz uchun farzand qo'sha olasiz)"
                    >
                      <Plus className="w-3.5 h-3.5 opacity-40" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => onSetTemporaryPerspective(person.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                    isTemporaryPerspective
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-500 hover:text-amber-700 hover:bg-amber-50'
                  }`}
                  title="Vaqtinchalik nuqtai nazarni tekshirish"
                >
                  <Compass className="w-3 h-3" />
                  <span>{isTemporaryPerspective ? 'Tanlangan' : 'Vaqtincha tekshirish'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
