import React, { useState, useEffect } from 'react';
import { AuthUser, FamilyTreeState, Gender, Person, ViewMode } from './types';
import { 
  loadFamilyTreeState, 
  saveFamilyTreeState, 
  exportStateAsJSON, 
  importStateFromJSON,
  clearAllShajaraData
} from './utils/storage';
import { hydrateAllMediaUrls } from './utils/mediaStorage';
import { addHistoryRecord } from './utils/historyStorage';
import { getCurrentSessionUser, setCurrentSessionUser } from './utils/userAuthStorage';
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
import { PrintTreeModal } from './components/PrintTreeModal';
import { HistoryModal } from './components/HistoryModal';
import { InviteFamilyModal } from './components/InviteFamilyModal';
import { TelegramBotModal } from './components/TelegramBotModal';
import { GuestLandingView } from './components/GuestLandingView';
import { FamilyAlbumView } from './components/FamilyAlbumView';
import { LegalPolicyModal, PolicyType } from './components/LegalPolicyModal';
import { AddRelativeModal, RelativeRelationType } from './components/AddRelativeModal';
import { ThemeMode, getInitialTheme, applyTheme } from './utils/theme';
import { initTelegramWebApp, waitForTelegramUser} from './utils/telegramAuth';
import { findRootAncestorId, recalculateAllGenerations } from './utils/kinship';
import { syncPersonToSupabase, fetchInviteFromSupabase, loadFamilyDataFromSupabase } from './utils/supabaseDb';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { ConfirmLogoutModal } from './components/ConfirmLogoutModal';
import { clearSupabaseSession } from './utils/supabaseClient';
import { 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  Lock,
  Compass,
  Sparkles,
  Info,
  Bot,
  X
} from 'lucide-react';

export default function App() {
  const [state, setState] = useState<FamilyTreeState>(() => {
    const session = getCurrentSessionUser();
    if (session?.id) {
      const loaded = loadFamilyTreeState(session.id);
      return {
        ...loaded,
        currentUser: session,
        meId: session.personId && loaded.people[session.personId] ? session.personId : loaded.meId
      };
    }
    return loadFamilyTreeState(null);
  });

  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // URL query params for Invite links
  const [inviteCodeFromUrl, setInviteCodeFromUrl] = useState<string | null>(null);
  const [targetPersonFromUrl, setTargetPersonFromUrl] = useState<string | null>(null);

  // Modals & Drawers
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState<boolean>(false);
  const [currentPolicyType, setCurrentPolicyType] = useState<PolicyType>('privacy');

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(() => !state.currentUser);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [isTelegramBotModalOpen, setIsTelegramBotModalOpen] = useState<boolean>(false);

  // Sidebars and Logout Dialog states
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState<boolean>(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState<boolean>(false);

  // Relative addition modal state (+ Ota, Ona, Turmush o'rtoq, O'g'il, Qiz)
  const [isAddRelativeModalOpen, setIsAddRelativeModalOpen] = useState<boolean>(false);
  const [targetPersonForRelativeModal, setTargetPersonForRelativeModal] = useState<Person | null>(null);
  const [spouseForNewPerson, setSpouseForNewPerson] = useState<Person | null>(null);
  const [targetRelationType, setTargetRelationType] = useState<RelativeRelationType | null>(null);
  const [initialGenderForModal, setInitialGenderForModal] = useState<Gender | undefined>(undefined);

  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);
  const [parentForNewChild, setParentForNewChild] = useState<Person | null>(null);
  const [childForNewParent, setChildForNewParent] = useState<Person | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isCalcModalOpen, setIsCalcModalOpen] = useState<boolean>(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type?: 'success' | 'warn' } | null>(null);

  // Apply theme class to document
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    showToast(next === 'dark' ? "Qorong'i rejim (Dark mode) yoqildi 🌙" : "Yorug' rejim (Light mode) yoqildi ☀️");
  };

  const handleOpenPolicy = (type: PolicyType) => {
    setCurrentPolicyType(type);
    setIsPolicyModalOpen(true);
  };

  const handleConfirmLogout = () => {
    setCurrentSessionUser(null);
    clearSupabaseSession();
    setState({
      people: {},
      rootId: '',
      meId: '',
      currentUser: null,
      activePerspectiveId: undefined,
    });
    setViewMode('guest');
    showToast("Hisobdan chiqildi.");
  };

  // Telegram WebApp — avval foydalanuvchi ma'lumotini kutamiz, keyin ishga tushiramiz
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const tgUser = await waitForTelegramUser(3000);
      if (cancelled || !tgUser) return; // Telegram ichida bo'lmasa login formasi qoladi

      initTelegramWebApp(
        // 1. Darhol — login formasini yopamiz
        (u) => {
          const parts = [u.first_name, u.last_name].filter(Boolean);
          const authUser: AuthUser = {
            name: parts[0] || 'Telegram',
            surname: parts.slice(1).join(' ') || undefined,
            fullName: parts.join(' '),
            telegramId: u.id,
            telegramUsername: u.username,
            role: 'editor',
            isGuest: false,
            authProvider: 'telegram',
          };
          setState((prev) => ({ ...prev, currentUser: authUser }));
          setIsLoginModalOpen(false);
        },
        // 2. Supabase'dan ma'lumot kelgach
        (result) => {
          if (!result.success || !result.people) return;
          setState((prev) => ({
            ...prev,
            people: result.people!,
            rootId: result.rootId || prev.rootId,
            meId: result.meId || prev.meId,
            currentUser: result.authUser
              ? { ...prev.currentUser, ...result.authUser }
              : prev.currentUser,
          }));
          setIsLoginModalOpen(false);
          showToast('Shajarangiz yuklandi! 🌳', 'success');
        },
        // 3. Botda ro'yxatdan o'tmagan
        (u) => {
          showToast(`Salom ${u.first_name}! Avval @shajarachi_bot da ro'yxatdan o'ting.`, 'warn');
        }
      );
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Check URL parameters: ?token=<TOKEN>&mode=guest or ?invite= or ?slot= or tgWebAppStartParam
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tgStart = (window as any).Telegram?.WebApp?.initDataUnsafe?.start_param;
      const cleanTgStart = tgStart ? tgStart.replace('invite_', '').replace('slot_', '') : null;

      // 5-band talabi: token va mode=guest
      const token = params.get('token') || params.get('invite') || cleanTgStart || params.get('start_param');
      const isGuestMode = params.get('mode') === 'guest';
      const slot = params.get('slot');
      const pId = params.get('personId');

      if (isGuestMode) {
        setViewMode('guest');
      }

      if (token) {
        setInviteCodeFromUrl(token);
        if (pId) setTargetPersonFromUrl(pId);

        fetchInviteFromSupabase(token).then(async (inviteData) => {
          if (inviteData) {
            if (inviteData.targetPersonId) {
              setTargetPersonFromUrl(inviteData.targetPersonId);
            }
            if (inviteData.familyId) {
              const famResult = await loadFamilyDataFromSupabase(inviteData.familyId);
              if (famResult.success && famResult.people) {
                setState((prev) => ({
                  ...prev,
                  people: famResult.people!,
                  rootId: famResult.rootId || prev.rootId,
                  meId: inviteData.targetPersonId && famResult.people![inviteData.targetPersonId] ? inviteData.targetPersonId : (famResult.meId || prev.meId),
                }));
              }
            }

            if (isGuestMode) {
              showToast("Xush kelibsiz! Shajara ko'rish rejimida ochildi. 🌳", 'success');
            } else {
              setIsLoginModalOpen(true);
              if (inviteData.slotName) {
                showToast(`Siz «${inviteData.slotName}» o'rniga taklif qilindingiz!`, 'success');
              } else {
                showToast("Shajaraga xush kelibsiz! Taklif kodi tasdiqlandi.", 'success');
              }
            }
          }
        }).catch((err) => {
          console.warn("Could not fetch invite_tokens data:", err);
        });
      }
    } catch (e) {
      console.warn("Could not parse URL query parameters:", e);
    }
  }, []);

  // Save to localStorage on state change per user
  useEffect(() => {
    if (state.currentUser?.id) {
      saveFamilyTreeState(state, state.currentUser.id);
    }
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
  const handleLogin = async (user: AuthUser, initialPersonData?: { gender: Gender }) => {
    let userTree: FamilyTreeState | null = null;

    // 1. Agar Supabase ulangan bo'lsa va foydalanuvchida familyId bo'lsa: loadFamilyDataFromSupabase(user.familyId) orqali yuklang
    if (user.familyId) {
      try {
        const sbRes = await loadFamilyDataFromSupabase(user.familyId);
        if (sbRes.success && sbRes.people && Object.keys(sbRes.people).length > 0) {
          userTree = {
            people: sbRes.people,
            rootId: sbRes.rootId || Object.keys(sbRes.people)[0] || '',
            meId: sbRes.meId || (user.personId && sbRes.people[user.personId] ? user.personId : Object.keys(sbRes.people)[0] || ''),
            currentUser: user,
            activePerspectiveId: undefined,
          };
        }
      } catch (err) {
        console.warn("Supabase oila yuklanmadi, lokal yuklanadi:", err);
      }
    }

    // 2. Aks holda lokal xotiradan: loadFamilyTreeState(user.id) orqali yuklang
    if (!userTree) {
      userTree = loadFamilyTreeState(user.id);
    }

    // 3. Agar foydalanuvchining shajarasi bo'sh bo'lsa (Object.keys(loadedTree.people).length === 0), foydalanuvchining o'zini birinchi tugun (Root Person - Shajara Egasi) qilib yarating va saqlang:
    if (Object.keys(userTree.people).length === 0) {
      const newPersonId = `p_${Date.now()}`;
      const newPerson: Person = {
        id: newPersonId,
        name: user.name,
        surname: user.surname,
        gender: initialPersonData?.gender || 'male',
        parentId: null,
        generation: 1,
        isAlive: true,
        occupation: "Oila boshlig'i (Shajara egasi)",
        avatarColor: initialPersonData?.gender === 'female' ? 'from-rose-500 to-pink-700' : 'from-emerald-600 to-teal-800',
        notes: "Shajara asoschisi",
      };

      const updatedUser: AuthUser = { ...user, personId: newPersonId, role: 'owner' as const };
      setCurrentSessionUser(updatedUser);

      const newState: FamilyTreeState = {
        people: { [newPersonId]: newPerson },
        rootId: newPersonId,
        meId: newPersonId,
        currentUser: updatedUser,
        activePerspectiveId: undefined,
      };
      setState(newState);
      saveFamilyTreeState(newState, user.id);

      addHistoryRecord({
        action: 'person_add',
        actorName: user.fullName || user.name,
        personName: user.fullName || user.name,
        personId: newPersonId,
        title: "Yangi shajaraga asos solindi",
        description: `${user.fullName || user.name} tomonidan shajara yaratildi va birinchi a'zo kiritildi.`,
      });

      setSelectedPerson(newPerson);
      showToast(`Tabriklaymiz, ${user.name}! Shajarangiz yaratildi.`);
    } else {
      const updatedUser: AuthUser = {
        ...user,
        personId: user.personId || userTree.meId || undefined,
      };
      setCurrentSessionUser(updatedUser);

      const newState: FamilyTreeState = {
        ...userTree,
        currentUser: updatedUser,
      };
      setState(newState);
      saveFamilyTreeState(newState, user.id);
      showToast(`Xush kelibsiz, ${user.name}!`);
    }

    setViewMode('tree');
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
    const isNew = !state.people[person.id];
    const actorName = state.currentUser?.fullName || state.currentUser?.name || 'Oila a\'zosi';

    setState((prev) => {
      let updatedPeople = { ...prev.people, [person.id]: person };
      updatedPeople = recalculateAllGenerations(updatedPeople);
      const isFirst = Object.keys(prev.people).length === 0;
      const targetMe = isFirst || !prev.meId ? person.id : prev.meId;
      const newRootId = findRootAncestorId(targetMe, updatedPeople);

      return {
        ...prev,
        people: updatedPeople,
        rootId: newRootId,
        meId: targetMe,
      };
    });

    // Supabase bilan real sinxronlashtirish
    syncPersonToSupabase(person).catch(() => {});

    // Audit log / Shajara tarixiga yozish
    addHistoryRecord({
      action: isNew ? 'person_add' : 'person_edit',
      actorName,
      personName: `${person.name} ${person.surname || ''}`.trim(),
      personId: person.id,
      title: isNew ? "Yangi shaxs qo'shildi" : "Shaxs ma'lumotlari yangilandi",
      description: `${actorName} tomonidan «${person.name} ${person.surname || ''}» shajaraga ${isNew ? 'kiritildi' : 'tahrirlandi'}.`,
      details: `${person.generation}-pusht. Tug'ilgan: ${person.birthDate || person.birthYear || 'Noma\'lum'}. Kasbi: ${person.occupation || 'Ko\'rsatilmagan'}`
    });

    // Update selected person if currently open
    if (selectedPerson && selectedPerson.id === person.id) {
      setSelectedPerson(person);
    }
    showToast(`«${person.name}» ma'lumotlari muvaffaqiyatli saqlandi!`);
  };

  const handleSavePersonWithRelation = (newPerson: Person, relatedPerson?: Person) => {
    const isNew = !state.people[newPerson.id];
    const actorName = state.currentUser?.fullName || state.currentUser?.name || 'Oila a\'zosi';

    setState((prev) => {
      let updatedPeople = { ...prev.people, [newPerson.id]: newPerson };
      if (relatedPerson) {
        updatedPeople[relatedPerson.id] = relatedPerson;
      }
      updatedPeople = recalculateAllGenerations(updatedPeople);
      const targetMe = prev.meId || (relatedPerson ? relatedPerson.id : newPerson.id);
      const newRootId = findRootAncestorId(targetMe, updatedPeople);

      return {
        ...prev,
        people: updatedPeople,
        rootId: newRootId,
        meId: targetMe,
      };
    });

    syncPersonToSupabase(newPerson).catch(() => {});
    if (relatedPerson) {
      syncPersonToSupabase(relatedPerson).catch(() => {});
    }

    addHistoryRecord({
      action: isNew ? 'person_add' : 'person_edit',
      actorName,
      personName: `${newPerson.name} ${newPerson.surname || ''}`.trim(),
      personId: newPerson.id,
      title: isNew ? "Yangi ota / ajdod qo'shildi" : "Shaxs ma'lumotlari yangilandi",
      description: `${actorName} tomonidan «${newPerson.name}» shajaraga kiritildi.`,
    });

    if (selectedPerson) {
      if (selectedPerson.id === newPerson.id) setSelectedPerson(newPerson);
      else if (relatedPerson && selectedPerson.id === relatedPerson.id) setSelectedPerson(relatedPerson);
    }

    showToast(`«${newPerson.name}» muvaffaqiyatli shajaraga qo'shildi! 🌳`);
  };

  const handleDeletePerson = (personId: string) => {
    const person = state.people[personId];
    // Cannot delete own profile
    if (state.currentUser?.personId === personId) {
      showToast("O'z profilingizni shajaradan o'chira olmaysiz!", "warn");
      return;
    }

    const actorName = state.currentUser?.fullName || state.currentUser?.name || 'Oila a\'zosi';

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

    // Audit log
    addHistoryRecord({
      action: 'person_delete',
      actorName,
      personName: person?.name || 'Shaxs',
      title: "Shaxs shajaradan o'chirildi",
      description: `${actorName} tomonidan «${person?.name || 'Shaxs'}» va uning shoxlari o'chirildi.`,
    });

    showToast("Shaxs va uning shoxlari shajaradan o'chirildi.");
  };

  const handleOpenAddRelative = (person: Person) => {
    setTargetPersonForRelativeModal(person);
    setIsAddRelativeModalOpen(true);
  };

  const handleSelectRelation = (type: RelativeRelationType, targetPerson: Person) => {
    setTargetRelationType(type);
    setPersonToEdit(null);
    if (type === 'father') {
      setChildForNewParent(targetPerson);
      setParentForNewChild(null);
      setSpouseForNewPerson(null);
      setInitialGenderForModal('male');
    } else if (type === 'mother') {
      setChildForNewParent(targetPerson);
      setParentForNewChild(null);
      setSpouseForNewPerson(null);
      setInitialGenderForModal('female');
    } else if (type === 'spouse') {
      setSpouseForNewPerson(targetPerson);
      setChildForNewParent(null);
      setParentForNewChild(null);
      setInitialGenderForModal(targetPerson.gender === 'male' ? 'female' : 'male');
    } else if (type === 'son') {
      setParentForNewChild(targetPerson);
      setChildForNewParent(null);
      setSpouseForNewPerson(null);
      setInitialGenderForModal('male');
    } else if (type === 'daughter') {
      setParentForNewChild(targetPerson);
      setChildForNewParent(null);
      setSpouseForNewPerson(null);
      setInitialGenderForModal('female');
    }
    setIsEditModalOpen(true);
  };

  const handleAddParent = (child: Person) => {
    setChildForNewParent(child);
    setParentForNewChild(null);
    setSpouseForNewPerson(null);
    setTargetRelationType('father');
    setInitialGenderForModal('male');
    setPersonToEdit(null);
    setIsEditModalOpen(true);
  };

  const handleAddChild = (parent: Person) => {
    setParentForNewChild(parent);
    setChildForNewParent(null);
    setPersonToEdit(null);
    setIsEditModalOpen(true);
  };

  const handleEditPerson = (person: Person) => {
    setPersonToEdit(person);
    setParentForNewChild(null);
    setChildForNewParent(null);
    setIsEditModalOpen(true);
  };

  const handleOpenAddRoot = () => {
    setPersonToEdit(null);
    setParentForNewChild(null);
    setChildForNewParent(null);
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
      const actorName = state.currentUser?.fullName || state.currentUser?.name || 'Oila a\'zosi';
      addHistoryRecord({
        action: 'tree_import',
        actorName,
        title: "Tashqi fayldan shajara tiklandi",
        description: `${actorName} tomonidan JSON fayldan ${Object.keys(importedState.people).length} nafar shaxs import qilindi.`,
      });
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
    if (confirm("Shajaradagi barcha ma'lumotlarni tozalab, yangidan noldan boshlamoqchimisiz?")) {
      clearAllShajaraData();
      const freshState: FamilyTreeState = {
        people: {},
        rootId: '',
        meId: '',
        currentUser: null,
        activePerspectiveId: undefined,
      };
      setState(freshState);
      addHistoryRecord({
        action: 'tree_reset',
        actorName: 'Foydalanuvchi',
        title: "Barcha ma'lumotlar tozalandi",
        description: "Shajara to'liq tozalanib, noldan boshlash holatiga keltirildi.",
      });
      setIsLoginModalOpen(true);
      showToast("Barcha ma'lumotlar tozalandi. Yangi ro'yxatdan o'tishingiz mumkin!");
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

      {/* Top Navbar — Only rendered in internal app view modes, NOT on guest landing page */}
      {viewMode !== 'guest' && (
        <Navbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          people={state.people}
          meId={state.meId}
          currentUser={state.currentUser}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onToggleLeftSidebar={() => setIsLeftSidebarOpen((prev) => !prev)}
          onToggleRightSidebar={() => setIsRightSidebarOpen((prev) => !prev)}
          onOpenAddModal={handleOpenAddRoot}
          onOpenCalcModal={() => setIsCalcModalOpen(true)}
          onOpenPrintModal={() => setIsPrintModalOpen(true)}
          onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
          onExport={handleExport}
          onImport={handleImport}
          onRequestLogout={() => setIsLogoutConfirmOpen(true)}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
        />
      )}

      {/* Main Content Area */}
      <main className={`flex-1 w-full min-h-0 ${
        viewMode === 'tree' 
          ? 'overflow-hidden flex flex-col relative max-w-full p-0' 
          : viewMode === 'guest'
            ? 'overflow-y-auto w-full p-0 m-0'
            : 'overflow-y-auto max-w-7xl mx-auto p-2 sm:p-6 pb-24 md:pb-6'
      }`}>
        {/* Tree View */}
        {viewMode === 'tree' && (
          <div className="relative w-full h-full min-h-0 flex-1 overflow-hidden">
            {/* Floating Search Bar on Canvas — moves when left sidebar opens */}
            <div 
              className={`absolute top-3.5 z-20 transition-all duration-300 pointer-events-auto ${
                isLeftSidebarOpen ? 'left-[21rem] sm:left-[23rem]' : 'left-3 sm:left-4'
              } w-60 sm:w-72`}
            >
              <div className="relative flex items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  id="search-tree-floating-input"
                  type="text"
                  placeholder="Shajaradan qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-2xl bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full"
                    title="Tozalash"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
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
              onAddParent={handleAddParent}
              onOpenAddRelative={handleOpenAddRelative}
              onSetTemporaryPerspective={handleSetTemporaryPerspective}
              onClearTemporaryPerspective={handleClearTemporaryPerspective}
              onUnauthorizedEditAttempt={handleUnauthorizedEditAttempt}
              onOpenAddRoot={handleOpenAddRoot}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              onOpenTelegramBotModal={() => setIsTelegramBotModalOpen(true)}
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
            onOpenStatsModal={() => setIsStatsModalOpen(true)}
            onViewSevenAncestorsForPerson={(personId) => {
              setState((prev) => ({ ...prev, activePerspectiveId: personId }));
              setViewMode('seven-ancestors');
              showToast(`«${state.people[personId]?.name || 'Shaxs'}»ning 7 ajdodi ko'rsatildi.`);
            }}
          />
        )}

        {/* Family Album View */}
        {viewMode === 'album' && (
          <FamilyAlbumView
            people={state.people}
            onSelectPerson={(p) => setSelectedPerson(p)}
            onOpenEditModal={(p) => handleEditPerson(p)}
            onViewInTree={(p) => {
              setSelectedPerson(p);
              setViewMode('tree');
            }}
          />
        )}

        {/* Guest Landing / Information View */}
        {viewMode === 'guest' && (
          <GuestLandingView
            people={state.people}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
            onOpenTelegramBotModal={() => setIsTelegramBotModalOpen(true)}
            onViewTree={() => setViewMode('tree')}
            onOpenCalcModal={() => setIsCalcModalOpen(true)}
            onOpenPolicy={handleOpenPolicy}
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
          onAddParent={handleAddParent}
          onOpenAddRelative={handleOpenAddRelative}
          onSetTemporaryPerspective={handleSetTemporaryPerspective}
          onDeletePerson={handleDeletePerson}
          onUnauthorizedEditAttempt={handleUnauthorizedEditAttempt}
        />
      )}

      {/* Edit / Add Relative Modal */}
      <EditPersonModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setChildForNewParent(null);
          setParentForNewChild(null);
          setSpouseForNewPerson(null);
          setTargetRelationType(null);
          setInitialGenderForModal(undefined);
          setPersonToEdit(null);
        }}
        personToEdit={personToEdit}
        parentForNewChild={parentForNewChild}
        childForNewParent={childForNewParent}
        spouseForPerson={spouseForNewPerson}
        targetRelationType={targetRelationType}
        initialGender={initialGenderForModal}
        people={state.people}
        onSave={handleSavePerson}
        onSaveWithRelation={handleSavePersonWithRelation}
      />

      {/* Qarindosh tanlash modali (+ Ota, Ona, Turmush o'rtoq, O'g'il, Qiz farzand) */}
      <AddRelativeModal
        isOpen={isAddRelativeModalOpen}
        onClose={() => setIsAddRelativeModalOpen(false)}
        targetPerson={targetPersonForRelativeModal}
        onSelectRelation={handleSelectRelation}
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

      {/* Chop etish uchun A4 Landscape Print View / PDF Modal */}
      <PrintTreeModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        people={state.people}
        rootId={state.rootId}
        meId={state.meId}
      />

      {/* Shajara Tarixi / Audit Log Modal */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />

      {/* Qarindoshlarni taklif qilish Modal */}
      <InviteFamilyModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        people={state.people}
        currentUser={state.currentUser}
        onShowToast={showToast}
      />

      {/* Telegram Bot va WebApp integratsiya boshqaruvi */}
      <TelegramBotModal
        isOpen={isTelegramBotModalOpen}
        onClose={() => setIsTelegramBotModalOpen(false)}
        currentUser={state.currentUser}
        people={state.people}
      />

      {/* Login & Register Modal */}
      <LoginModal
        isOpen={isLoginModalOpen && !window.Telegram?.WebApp?.initDataUnsafe?.user?.id}
        onClose={() => {
          setIsLoginModalOpen(false);
          if (!state.currentUser || state.currentUser.isGuest) {
            setViewMode('guest');
          }
        }}
        people={state.people}
        onLogin={handleLogin}
        inviteCode={inviteCodeFromUrl}
        targetPersonId={targetPersonFromUrl}
        onOpenTelegramModal={() => setIsTelegramBotModalOpen(true)}
        onOpenPolicy={handleOpenPolicy}
      />

      {/* Huquqiy hujjatlar va siyosatlar modal */}
      <LegalPolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        initialPolicy={currentPolicyType}
      />

      {/* Chap Sidebar (Shajaraga oid vositalar va boshqaruv) */}
      <LeftSidebar
        isOpen={isLeftSidebarOpen}
        onClose={() => setIsLeftSidebarOpen(false)}
        people={state.people}
        meId={state.meId}
        rootId={state.rootId}
        viewMode={viewMode}
        onViewModeChange={(m) => {
          setViewMode(m);
          setIsLeftSidebarOpen(false);
        }}
        onOpenAddModal={handleOpenAddRoot}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        onOpenCalcModal={() => setIsCalcModalOpen(true)}
        onExport={handleExport}
        onImport={handleImport}
        onReset={handleResetToDefault}
      />

      {/* O'ng Sidebar (Foydalanuvchi profili, taklif, statistika, tarix, chiqish) */}
      <RightSidebar
        isOpen={isRightSidebarOpen}
        onClose={() => setIsRightSidebarOpen(false)}
        currentUser={state.currentUser}
        me={state.people[state.meId]}
        peopleCount={Object.keys(state.people).length}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenInviteModal={() => setIsInviteModalOpen(true)}
        onOpenTelegramBotModal={() => setIsTelegramBotModalOpen(true)}
        onOpenStatsModal={() => setIsStatsModalOpen(true)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        onOpenPolicy={handleOpenPolicy}
        onRequestLogout={() => setIsLogoutConfirmOpen(true)}
      />

      {/* Real Hisobdan Chiqishni Tasdiqlash Modali */}
      <ConfirmLogoutModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
        userName={state.currentUser?.fullName || state.currentUser?.name}
      />

      {/* Suzuvchi dumaloq Telegram Bot tugmasi (ekranning chap pastki burchagida - AI chat uslubida) */}
      <div className="fixed bottom-20 left-3.5 sm:bottom-6 sm:left-6 z-40">
        <button
          id="btn-floating-telegram-bot"
          onClick={() => setIsTelegramBotModalOpen(true)}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#24A1DE] hover:bg-[#1a92ca] text-white shadow-xl hover:shadow-2xl flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95 group focus:outline-none focus:ring-4 focus:ring-[#24A1DE]/40 relative"
          title="Telegram Bot (@shajarachi_bot)"
          aria-label="Telegram Bot"
        >
          <Bot className="w-6 h-6 sm:w-7 sm:h-7 transition-transform group-hover:rotate-12" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
          </span>
        </button>
      </div>
    </div>
  );
}
