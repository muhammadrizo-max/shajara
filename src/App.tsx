import React, { useState, useEffect } from 'react';
import { AuthUser, FamilyTreeState, Person, ViewMode } from './types';
import { 
  loadFamilyTreeState, 
  saveFamilyTreeState, 
  exportStateAsJSON, 
  importStateFromJSON 
} from './utils/storage';
import { hydrateAllMediaUrls } from './utils/mediaStorage';
import { DEFAULT_ME_ID, DEFAULT_ROOT_ID, INITIAL_PEOPLE } from './data/initialData';
import { Navbar } from './components/Navbar';
import { FamilyTreeCanvas } from './components/FamilyTreeCanvas';
import { SevenAncestorsView } from './components/SevenAncestorsView';
import { PersonListTable } from './components/PersonListTable';
import { PersonDetailDrawer } from './components/PersonDetailDrawer';
import { EditPersonModal } from './components/EditPersonModal';
import { RelationCalculatorModal } from './components/RelationCalculatorModal';
import { StatisticsModal } from './components/StatisticsModal';
import { LoginModal } from './components/LoginModal';
import { 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  Lock,
  Compass,
  Sparkles,
  Info
} from 'lucide-react';

export default function App() {
  const [state, setState] = useState<FamilyTreeState>(() => loadFamilyTreeState());
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Drawers
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(() => !state.currentUser);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);
  const [parentForNewChild, setParentForNewChild] = useState<Person | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isCalcModalOpen, setIsCalcModalOpen] = useState<boolean>(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type?: 'success' | 'warn' } | null>(null);

  // Save to localStorage on state change
  useEffect(() => {
    saveFamilyTreeState(state);
  }, [state]);

  // Hydrate video & media URLs from IndexedDB on startup
  useEffect(() => {
    hydrateAllMediaUrls().then((mediaMap) => {
      if (Object.keys(mediaMap).length > 0) {
        setState((prev) => {
          let hasChanges = false;
          const updatedPeople = { ...prev.people };

          Object.keys(updatedPeople).forEach((pId) => {
            const p = updatedPeople[pId];
            let updated = { ...p };
            let pChanged = false;

            if (p.avatarMediaId && mediaMap[p.avatarMediaId]) {
              updated.avatarVideoUrl = mediaMap[p.avatarMediaId];
              pChanged = true;
            }
            if (p.biographyMediaId && mediaMap[p.biographyMediaId]) {
              updated.biographyVideoUrl = mediaMap[p.biographyMediaId];
              pChanged = true;
            }

            if (pChanged) {
              updatedPeople[pId] = updated;
              hasChanges = true;
            }
          });

          return hasChanges ? { ...prev, people: updatedPeople } : prev;
        });
      }
    });
  }, []);

  const showToast = (text: string, type: 'success' | 'warn' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3800);
  };

  const handleUnauthorizedEditAttempt = (customMsg?: string) => {
    showToast(
      customMsg || "Xavfsizlik: Siz faqat o'z ma'lumotlaringizni tahrirlashingiz va faqat o'zingiz uchun farzand qo'shishingiz mumkin!",
      "warn"
    );
  };

  // Login handler
  const handleLogin = (user: AuthUser) => {
    if (user.personId && state.people[user.personId]) {
      setState((prev) => ({
        ...prev,
        currentUser: user,
        meId: user.personId!,
        activePerspectiveId: undefined,
      }));
      setSelectedPerson(state.people[user.personId]);
      showToast(`Xush kelibsiz, ${user.name}! Sizning shajaradagi o'rningiz ko'rsatildi.`);
    } else {
      setState((prev) => ({
        ...prev,
        currentUser: user,
        activePerspectiveId: undefined,
      }));
      showToast(`Mehmon sifatida xush kelibsiz, ${user.name}!`);
    }
    setIsLoginModalOpen(false);
  };

  // Temporary Perspective handlers
  const handleSetTemporaryPerspective = (personId: string) => {
    setState((prev) => ({
      ...prev,
      activePerspectiveId: personId,
    }));
    const p = state.people[personId];
    showToast(`Vaqtinchalik nuqtai nazar: «${p?.name || 'Shaxs'}» nigohi bilan tekshirilmoqda.`);
  };

  const handleClearTemporaryPerspective = () => {
    setState((prev) => ({
      ...prev,
      activePerspectiveId: undefined,
    }));
    showToast("Asl profilingizga qaytildi.");
  };

  // Handlers for people state
  const handleSavePerson = (person: Person) => {
    // Permission check for modifying existing person
    if (personToEdit && state.currentUser?.personId) {
      if (personToEdit.id !== state.currentUser.personId) {
        handleUnauthorizedEditAttempt();
        return;
      }
    }

    setState((prev) => {
      const updatedPeople = { ...prev.people, [person.id]: person };
      return {
        ...prev,
        people: updatedPeople,
      };
    });

    // Update selected person if currently open
    if (selectedPerson && selectedPerson.id === person.id) {
      setSelectedPerson(person);
    }
    showToast(`«${person.name}» ma'lumotlari muvaffaqiyatli saqlandi!`);
  };

  const handleDeletePerson = (personId: string) => {
    // Cannot delete own profile
    if (state.currentUser?.personId === personId) {
      showToast("O'z profilingizni shajaradan o'chira olmaysiz!", "warn");
      return;
    }

    setState((prev) => {
      // Find all descendants recursively
      const idsToDelete = new Set<string>();
      const findDescendants = (id: string) => {
        idsToDelete.add(id);
        (Object.values(prev.people) as Person[]).forEach((p) => {
          if (p.parentId === id) {
            findDescendants(p.id);
          }
        });
      };
      findDescendants(personId);

      const newPeople = { ...prev.people };
      idsToDelete.forEach((id) => delete newPeople[id]);

      // If deleted person was root or me, fallback
      let newMeId = prev.meId;
      if (idsToDelete.has(prev.meId)) {
        newMeId = Object.keys(newPeople)[0] || DEFAULT_ME_ID;
      }

      return {
        ...prev,
        people: newPeople,
        meId: newMeId,
      };
    });
    showToast("Shaxs va uning shoxlari shajaradan o'chirildi.");
  };

  const handleAddChild = (parent: Person) => {
    if (state.currentUser?.personId && parent.id !== state.currentUser.personId) {
      handleUnauthorizedEditAttempt("Xavfsizlik: Siz faqat o'z profilingizga farzand qo'sha olasiz!");
      return;
    }
    setParentForNewChild(parent);
    setPersonToEdit(null);
    setIsEditModalOpen(true);
  };

  const handleEditPerson = (person: Person) => {
    const canEdit = Boolean(state.currentUser && state.currentUser.personId === person.id);
    if (!canEdit) {
      handleUnauthorizedEditAttempt();
      return;
    }
    setPersonToEdit(person);
    setParentForNewChild(null);
    setIsEditModalOpen(true);
  };

  const handleOpenAddRoot = () => {
    setPersonToEdit(null);
    setParentForNewChild(null);
    setIsEditModalOpen(true);
  };

  const handleExport = () => {
    exportStateAsJSON(state);
    showToast("Shajara fayli (JSON) muvaffaqiyatli yuklab olindi.");
  };

  const handleImport = async (file: File) => {
    try {
      const importedState = await importStateFromJSON(file);
      setState(importedState);
      showToast("Shajara ma'lumotlari muvaffaqiyatli yuklandi!");
    } catch (err: any) {
      alert("Faylni yuklashda xatolik yuz berdi: " + err.message);
    }
  };

  const handleCenterMe = () => {
    setViewMode('tree');
    setTimeout(() => {
      const centerMeBtn = document.getElementById('btn-center-me');
      if (centerMeBtn) {
        centerMeBtn.click();
      }
    }, 50);
  };

  const handleResetToDefault = () => {
    if (confirm("Shajarani boshlang'ich holatiga qaytarmoqchimisiz? Kiritilgan yangi ma'lumotlar o'chiriladi.")) {
      const freshState: FamilyTreeState = {
        people: INITIAL_PEOPLE,
        rootId: DEFAULT_ROOT_ID,
        meId: DEFAULT_ME_ID,
        currentUser: {
          name: 'Muhammadrizo',
          surname: 'Xudoberdiyev',
          birthDate: '2005-05-15',
          personId: 'p-muhammadrizo',
          isGuest: false,
        },
      };
      setState(freshState);
      showToast("Boshlang'ich shajara ma'lumotlari qayta tiklandi!");
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-slate-100/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 px-4 py-3 rounded-2xl text-white shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-bounce ${
            toastMessage.type === 'warn'
              ? 'bg-amber-600 border border-amber-500'
              : 'bg-slate-900 dark:bg-emerald-600 border border-slate-700 dark:border-emerald-500'
          }`}
        >
          {toastMessage.type === 'warn' ? (
            <AlertTriangle className="w-4 h-4 text-white" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-white" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        people={state.people}
        meId={state.meId}
        currentUser={state.currentUser}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenAddModal={handleOpenAddRoot}
        onOpenCalcModal={() => setIsCalcModalOpen(true)}
        onOpenStatsModal={() => setIsStatsModalOpen(true)}
        onExport={handleExport}
        onImport={handleImport}
        onReset={handleResetToDefault}
        onCenterMe={handleCenterMe}
      />

      {/* Main Content Area */}
      <main className={`flex-1 w-full min-h-0 ${
        viewMode === 'tree' 
          ? 'overflow-hidden flex flex-col p-1 sm:p-2.5 pb-16 md:pb-2 max-w-full' 
          : 'overflow-y-auto max-w-7xl mx-auto p-2 sm:p-6 pb-24 md:pb-6'
      }`}>
        {/* Tree View */}
        {viewMode === 'tree' && (
          <div className="space-y-1.5 sm:space-y-2 flex-1 w-full h-full min-h-0 flex flex-col overflow-hidden">
            {/* Quick Tree Search & Info Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex-shrink-0">
              <div className="relative w-full sm:w-72 hidden md:block">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="search-tree-input"
                  type="text"
                  placeholder="Shajaradan qidirish (ism, unvon)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Legend Badges */}
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 flex-wrap justify-center w-full sm:w-auto">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 inline-block" />
                  <strong>Siz (Men)</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500 inline-block" />
                  <strong>7 Ajdod</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-sky-500 inline-block" />
                  <strong>O'g'il</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500 inline-block" />
                  <strong>Qiz</strong>
                </span>
              </div>
            </div>

            {/* Tree Canvas */}
            <FamilyTreeCanvas
              people={state.people}
              rootId={state.rootId}
              meId={state.meId}
              activePerspectiveId={state.activePerspectiveId}
              currentUser={state.currentUser}
              searchQuery={searchQuery}
              selectedPersonId={selectedPerson?.id || null}
              onSelectPerson={(p) => setSelectedPerson(p)}
              onEditPerson={handleEditPerson}
              onAddChild={handleAddChild}
              onSetTemporaryPerspective={handleSetTemporaryPerspective}
              onClearTemporaryPerspective={handleClearTemporaryPerspective}
              onUnauthorizedEditAttempt={handleUnauthorizedEditAttempt}
            />
          </div>
        )}

        {/* 7 Ancestors Lineage View */}
        {viewMode === 'seven-ancestors' && (
          <SevenAncestorsView
            meId={state.meId}
            activePerspectiveId={state.activePerspectiveId}
            currentUser={state.currentUser}
            people={state.people}
            onSelectPerson={(p) => setSelectedPerson(p)}
            onEditPerson={handleEditPerson}
            onUnauthorizedEditAttempt={handleUnauthorizedEditAttempt}
          />
        )}

        {/* List Directory View */}
        {viewMode === 'list' && (
          <PersonListTable
            people={state.people}
            meId={state.meId}
            activePerspectiveId={state.activePerspectiveId}
            currentUser={state.currentUser}
            onSelectPerson={(p) => setSelectedPerson(p)}
            onEditPerson={handleEditPerson}
            onAddChild={handleAddChild}
            onSetTemporaryPerspective={handleSetTemporaryPerspective}
            onDeletePerson={handleDeletePerson}
            onUnauthorizedEditAttempt={handleUnauthorizedEditAttempt}
          />
        )}
      </main>

      {/* Person Detail Drawer */}
      {selectedPerson && (
        <PersonDetailDrawer
          person={selectedPerson}
          people={state.people}
          meId={state.meId}
          activePerspectiveId={state.activePerspectiveId}
          currentUser={state.currentUser}
          onClose={() => setSelectedPerson(null)}
          onSelectPerson={(p) => setSelectedPerson(p)}
          onEditPerson={handleEditPerson}
          onAddChild={handleAddChild}
          onSetTemporaryPerspective={handleSetTemporaryPerspective}
          onDeletePerson={handleDeletePerson}
          onUnauthorizedEditAttempt={handleUnauthorizedEditAttempt}
        />
      )}

      {/* Edit / Add Child Modal */}
      <EditPersonModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        personToEdit={personToEdit}
        parentForNewChild={parentForNewChild}
        people={state.people}
        onSave={handleSavePerson}
      />

      {/* Kinship Calculator Modal */}
      <RelationCalculatorModal
        isOpen={isCalcModalOpen}
        onClose={() => setIsCalcModalOpen(false)}
        people={state.people}
        initialFromId={state.activePerspectiveId || state.meId}
      />

      {/* Statistics Modal */}
      <StatisticsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        people={state.people}
      />

      {/* Login / Identity Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        people={state.people}
        onLogin={handleLogin}
      />
    </div>
  );
}

