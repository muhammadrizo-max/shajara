import React, { useState, useEffect } from 'react';
import { AuthUser, FamilyTreeState, Gender, Person, ViewMode } from './types';
import { 
  loadFamilyTreeState, 
  saveFamilyTreeState, 
  fetchTreeFromCloud,
  saveTreeToCloud,
  deleteTreeFromCloud,
  exportStateAsJSON, 
  importStateFromJSON,
  clearAllShajaraData
} from './utils/storage';
// App.tsx imports qatoriga qo'shing (mavjud importlar o'rtasiga)
import { getSupabaseCredentials } from './utils/supabaseDb';
import { hydrateAllMediaUrls } from './utils/mediaStorage';
import { addHistoryRecord } from './utils/historyStorage';
import { getCurrentSessionUser, setCurrentSessionUser, getFamilyInvites } from './utils/userAuthStorage';
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
import { syncPersonToSupabase, syncAllPeopleToSupabase, deletePersonFromSupabase, fetchInviteFromSupabase, loadFamilyDataFromSupabase } from './utils/supabaseDb';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { ConfirmLogoutModal } from './components/ConfirmLogoutModal';
import { ContactFeedbackModal } from './components/ContactFeedbackModal';
import { SecurityCenterModal } from './components/SecurityCenterModal';
import { saveAutoBackupSnapshot } from './utils/security';
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
  X,
  RefreshCw
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
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // URL query params for Invite links
  const [inviteCodeFromUrl, setInviteCodeFromUrl] = useState<string | null>(null);
  const [targetPersonFromUrl, setTargetPersonFromUrl] = useState<string | null>(null);
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer' | null>(null);

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
  const [isContactFeedbackModalOpen, setIsContactFeedbackModalOpen] = useState<boolean>(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);

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
  const [siblingForNewPerson, setSiblingForNewPerson] = useState<Person | null>(null);
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

      // Check URL parameters: ?token=<TOKEN> or ?invite= or tgWebAppStartParam
      const token = params.get('token') || (params.get('invite') !== 'tree' && params.get('invite') !== 'slot' ? params.get('invite') : null) || cleanTgStart || params.get('start_param');
      const isGuestMode = params.get('mode') === 'guest';
      const slot = params.get('slot');
      const pId = params.get('personId') || params.get('node');
      const inviterParam = params.get('inviter');

      const roleParam = params.get('role');
      if (roleParam === 'editor' || roleParam === 'viewer') {
        setInviteRole(roleParam);
      }

      if (token) {
        setInviteCodeFromUrl(token);
        if (pId) setTargetPersonFromUrl(pId);

        // Taklif havolasi orqali kirilganda to'g'ridan-to'g'ri shajara daraxti ochiladi (login majburlanmaydi)
        setViewMode('tree');
        setIsLoginModalOpen(false);
        setIsDataLoading(true);

        // 1. Eng tezkor: Serverdagi /api/tree keshidan token bo'yicha to'liq shajarani yuklash (Oq oyna bo'lmasligi uchun)
        fetch(`/api/tree?userId=token:${encodeURIComponent(token)}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((apiData) => {
            if (apiData?.success && apiData.state?.people && Object.keys(apiData.state.people).length > 0) {
              setState((prev) => ({
                ...prev,
                people: apiData.state.people,
                rootId: apiData.state.rootId || prev.rootId,
                meId: (pId && apiData.state.people[pId]) ? pId : (apiData.state.meId || prev.meId),
                familyName: apiData.state.familyName || prev.familyName,
              }));
              if (inviterParam) {
                showToast(`«${decodeURIComponent(inviterParam)}» sizni shajarani ko'rishga taklif qildi! 🌳`, 'success');
              } else {
                showToast("Shajaraga xush kelibsiz! Shajarani erkin ko'rishingiz mumkin. 🌳", 'success');
              }
            }
          })
          .catch((e) => console.warn('[Invite Fetch Tree Error]:', e));

        // 2. Supabase invite_tokens va zaxira manbalardan tekshirish
        fetchInviteFromSupabase(token).then(async (inviteData) => {
          if (inviteData) {
            if (inviteData.targetPersonId) {
              setTargetPersonFromUrl(inviteData.targetPersonId);
            }
            if (inviteData.role) {
              setInviteRole(inviteData.role === 'editor' ? 'editor' : 'viewer');
            }
            if (inviteData.familyId) {
              const famResult = await loadFamilyDataFromSupabase(inviteData.familyId);
              if (famResult.success && famResult.people && Object.keys(famResult.people).length > 0) {
                setState((prev) => ({
                  ...prev,
                  people: famResult.people!,
                  rootId: famResult.rootId || prev.rootId,
                  meId: inviteData.targetPersonId && famResult.people![inviteData.targetPersonId] ? inviteData.targetPersonId : (famResult.meId || prev.meId),
                }));
              }
            }

            if (inviteData.slotName) {
              showToast(`Siz «${inviteData.slotName}» o'rniga taklif qilindingiz!`, 'success');
            }
          } else {
            // 3. Mahalliy taklifnomalar bazasidan zaxira tekshirish (Local fallback)
            const localInvites = getFamilyInvites();
            const localInv = localInvites.find(i => i.code?.toLowerCase() === token.toLowerCase());
            if (localInv?.targetPersonId) {
              setTargetPersonFromUrl(localInv.targetPersonId);
            }
            if (localInv?.role) {
              setInviteRole(localInv.role === 'editor' ? 'editor' : 'viewer');
            }
          }
        }).catch((err) => {
          console.warn("Could not fetch invite_tokens data:", err);
        }).finally(() => {
          setIsDataLoading(false);
        });
      } else if (isGuestMode) {
        setViewMode('guest');
      }
    } catch (e) {
      console.warn("Could not parse URL query parameters:", e);
    }
  }, []);

  // Save to localStorage on state change per user and auto-create backup snapshot
  useEffect(() => {
    if (state.currentUser?.id) {
      saveFamilyTreeState(state, state.currentUser.id);
      if (Object.keys(state.people).length > 0) {
        saveAutoBackupSnapshot(state);
      }
    }
  }, [state]);

    // Ilova ochilganda bulutdan yangi ma'lumotni olish
  useEffect(() => {
    if (state.currentUser?.familyId) {
      refreshFromCloud(true);
    }
  }, [state.currentUser?.familyId]);

  // Avtomatik yangilash: har 60 soniyada va oynaga qaytilganda
  useEffect(() => {
    if (!state.currentUser?.familyId) return;

    const tick = () => {
      if (document.hidden) return;
      if (isEditModalOpen || isLoginModalOpen) return;
      refreshFromCloud(true);
    };

    const interval = window.setInterval(tick, 60_000);
    const onVisible = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [state.currentUser?.familyId, isEditModalOpen, isLoginModalOpen]);

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
    // Bulutdan (persons jadvalidan) to'liq yangilash
  const refreshFromCloud = async (silent: boolean = false) => {
    const familyId = state.currentUser?.familyId;
    if (!familyId) {
      if (!silent) showToast("Oila aniqlanmadi. Iltimos, qayta kiring.", 'warn');
      return;
    }

    setIsRefreshing(true);
    try {
      const res = await loadFamilyDataFromSupabase(familyId);
      if (res.success && res.people && Object.keys(res.people).length > 0) {
        const cloudPeople = res.people;
        setState((prev) => {
          const myPersonId = prev.currentUser?.personId;
          return {
            ...prev,
            people: cloudPeople,
            rootId: res.rootId || prev.rootId,
            meId: myPersonId && cloudPeople[myPersonId]
              ? myPersonId
              : (res.meId || prev.meId),
          };
        });
        setLastSyncedAt(new Date());
        if (!silent) showToast("Shajara bulutdan yangilandi ✅", 'success');
      } else if (!silent) {
        showToast("Bulutda ma'lumot topilmadi.", 'warn');
      }
    } catch (err) {
      console.warn('[Refresh] xatolik:', err);
      if (!silent) showToast("Yangilashda xatolik. Internetni tekshiring.", 'warn');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUnauthorizedEditAttempt = (customMsg?: string) => {
    showToast(
      customMsg || "Xavfsizlik: Siz faqat o'z ma'lumotlaringizni tahrirlashingiz va faqat o'zingiz uchun farzand qo'shishingiz mumkin!",
      "warn"
    );
  };

  // App.tsx — handleLogin funksiyasini shu bilan almashtiring
const handleLogin = async (user: AuthUser, initialPersonData?: { gender: Gender }) => {
  
  // ═══════════════════════════════════════════════════════
  // 1. GOOGLE FOYDALANUVCHISINI SUPABASE BILAN SINXRONLASH
  // ═══════════════════════════════════════════════════════
  if (user.authProvider === 'google' && user.googleId) {
    try {
      const { url, key } = getSupabaseCredentials();
      const h = {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'return=representation',
      };

      // Email bo'yicha mavjudligini tekshir
      const checkRes = await fetch(
        `${url}/rest/v1/users?email=eq.${encodeURIComponent(user.email!)}&select=id,person_id`,
        { headers: h }
      );
      const existing = await checkRes.json();

      let dbUserId: string;
      let isNewUser = false;

      if (Array.isArray(existing) && existing.length > 0) {
        // Mavjud foydalanuvchi — yangilaymiz
        dbUserId = existing[0].id;
        await fetch(`${url}/rest/v1/users?id=eq.${dbUserId}`, {
          method: 'PATCH',
          headers: h,
          body: JSON.stringify({
            google_id: user.googleId,
            photo_url: user.photoUrl || null,
            last_login: new Date().toISOString(),
          }),
        });
        // Agar person_id mavjud bo'lsa, userimizni yangilaymiz
        if (existing[0].person_id) {
          user = { ...user, personId: existing[0].person_id };
        }
      } else {
        // Yangi foydalanuvchi — bazaga yozamiz
        isNewUser = true;
        const createRes = await fetch(`${url}/rest/v1/users`, {
          method: 'POST',
          headers: h,
          body: JSON.stringify({
            google_id: user.googleId,
            full_name: user.fullName || `${user.name} ${user.surname || ''}`.trim(),
            email: user.email,
            photo_url: user.photoUrl || null,
            role: 'owner',
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString(),
          }),
        });
        const created = await createRes.json();
        if (Array.isArray(created) && created.length > 0) {
          dbUserId = created[0].id;
        } else {
          dbUserId = user.id; // fallback
        }
      }

      // Haqiqiy UUID ni user.id ga o'rnatamiz
      user = { ...user, id: dbUserId };

      // Oilani tekshirish
      const memRes = await fetch(
        `${url}/rest/v1/family_members?user_id=eq.${dbUserId}&select=family_id`,
        { headers: h }
      );
      const members = await memRes.json();

      if (Array.isArray(members) && members.length > 0) {
        user = { ...user, familyId: members[0].family_id };
      } else if (isNewUser) {
        // Yangi oila yaratish
        const famRes = await fetch(`${url}/rest/v1/families`, {
          method: 'POST',
          headers: h,
          body: JSON.stringify({
            name: `${user.name}ning Shajarasi`,
            created_by: dbUserId,
            created_at: new Date().toISOString(),
          }),
        });
        const families = await famRes.json();
        if (Array.isArray(families) && families.length > 0) {
          user = { ...user, familyId: families[0].id };
          // Trigger avtomatik qo'shadi, lekin backup:
          await fetch(`${url}/rest/v1/family_members`, {
            method: 'POST',
            headers: { ...h, Prefer: 'resolution=merge-duplicates' },
            body: JSON.stringify({
              family_id: user.familyId,
              user_id: dbUserId,
              role: 'owner',
            }),
          }).catch(() => {});
        }
      }

    } catch (err) {
      console.warn('[handleLogin] Supabase Google upsert xatolik:', err);
      // Xatolikda ham davom etamiz (lokal rejim)
    }
  }

  // ═══════════════════════════════════════════════════════
  // 2. SHAJARA MA'LUMOTLARINI YUKLASH
  // ═══════════════════════════════════════════════════════
  let userTree: FamilyTreeState | null = null;

  if (user.familyId) {
    try {
      const sbRes = await loadFamilyDataFromSupabase(user.familyId);
      if (sbRes.success && sbRes.people && Object.keys(sbRes.people).length > 0) {
        userTree = {
          people: sbRes.people,
          rootId: sbRes.rootId || Object.keys(sbRes.people)[0] || '',
          meId: user.personId && sbRes.people[user.personId]
            ? user.personId
            : (sbRes.meId || Object.keys(sbRes.people)[0] || ''),
          currentUser: user,
          activePerspectiveId: undefined,
        };
      }
    } catch (err) {
      console.warn("Supabase oila yuklanmadi:", err);
    }
  }

  if (!userTree) {
    userTree = loadFamilyTreeState(user.id);
  }

  if (!userTree || Object.keys(userTree.people).length === 0) {
    try {
      const cloudTree = await fetchTreeFromCloud(user.id, user.email);
      if (cloudTree && cloudTree.people && Object.keys(cloudTree.people).length > 0) {
        userTree = cloudTree;
      }
    } catch (cloudErr) {
      console.warn("[Cloud Sync]:", cloudErr);
    }
  }

  // ═══════════════════════════════════════════════════════
  // 3. BIRINCHI KIRISH — YANGI SHAXS YARATISH
  // ═══════════════════════════════════════════════════════
  if (!userTree || Object.keys(userTree.people).length === 0) {
    const newPersonId = crypto.randomUUID();
    const newPerson: Person = {
      id: newPersonId,
      name: user.name,
      surname: user.surname,
      gender: initialPersonData?.gender || 'male',
      parentId: null,
      generation: 1,
      isAlive: true,
      photoUrl: user.photoUrl,
      occupation: "Shajara egasi",
      notes: "Shajara asoschisi",
    };

    const updatedUser: AuthUser = { ...user, personId: newPersonId, role: 'owner' };
    setCurrentSessionUser(updatedUser);

    // Supabase'ga persons jadvaliga yozamiz
    if (user.familyId) {
      syncPersonToSupabase(newPerson, user.familyId, user.id).catch(() => {});
      
      // users.person_id ni yangilaymiz
      try {
        const { url, key } = getSupabaseCredentials();
        await fetch(`${url}/rest/v1/users?id=eq.${user.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({ person_id: newPersonId }),
        });
      } catch (e) {}
    }

    const newState: FamilyTreeState = {
      people: { [newPersonId]: newPerson },
      rootId: newPersonId,
      meId: newPersonId,
      currentUser: updatedUser,
      activePerspectiveId: undefined,
      familyName: `${user.name} shajarasi`,
    };
    setState(newState);
    saveFamilyTreeState(newState, user.id);
    setSelectedPerson(newPerson);
    showToast(`Tabriklaymiz, ${user.name}! Shajarangiz yaratildi. 🌳`);
  } else {
    const updatedUser: AuthUser = {
      ...user,
      personId: user.personId || userTree.meId || undefined,
      role: user.role || 'owner',
    };
    setCurrentSessionUser(updatedUser);
    const newState: FamilyTreeState = { ...userTree, currentUser: updatedUser };
    setState(newState);
    saveFamilyTreeState(newState, user.id);
    showToast(`Xush kelibsiz, ${user.name}! Shajarangiz yuklandi. 🌳`);
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
    const nextPeople = { ...state.people, [person.id]: person };
    syncAllPeopleToSupabase(nextPeople, state.currentUser?.familyId || '').catch(() => {});

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

    const nextPeople = { ...state.people, [newPerson.id]: newPerson };
    if (relatedPerson) nextPeople[relatedPerson.id] = relatedPerson;
    syncAllPeopleToSupabase(nextPeople, state.currentUser?.familyId || '').catch(() => {});

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

  // Ruxsat tekshiruvi: tizimga kirmagan bo'lsa login so'rash; viewer bo'lsa ogohlantirish; editor bo'lsa faqat o'zi, ota-onasi va farzandlari
  const checkEditPermission = (targetPerson?: Person | null): boolean => {
    // 1. Foydalanuvchi tizimga kirmagan bo'lsa login talab qilinadi
    if (!state.currentUser) {
      showToast("Shajarani tahrirlash yoki yangi qarindosh qo'shish uchun avval tizimga kiring.", "warn");
      setIsLoginModalOpen(true);
      return false;
    }

    // 2. Foydalanuvchining huquqi faqat o'qish (viewer) bo'lsa
    const effectiveRole = inviteRole === 'viewer' || state.currentUser.role === 'viewer' ? 'viewer' : (state.currentUser.role || 'owner');
    if (effectiveRole === 'viewer') {
      showToast("Sizga ushbu shajarani faqat o'qish (ko'rish) huquqi berilgan. Tahrirlash uchun shajara egasidan ruxsat so'rang.", "warn");
      return false;
    }

    // 3. Agar 'editor' huquqi bo'lsa: faqat o'zi, ota-onasi va farzandlarini tahrirlay oladi
    if (effectiveRole === 'editor' && state.currentUser.personId && targetPerson) {
      const myId = state.currentUser.personId;
      const mePerson = state.people[myId];
      const isSelf = targetPerson.id === myId;
      const isParent = Boolean(mePerson && (targetPerson.id === mePerson.parentId || targetPerson.id === mePerson.motherId));
      const isChild = Boolean(targetPerson.parentId === myId || targetPerson.motherId === myId);

      if (!isSelf && !isParent && !isChild) {
        showToast("Siz faqat o'zingiz, ota-onangiz va o'z farzandlaringiz ma'lumotlarini tahrirlashingiz mumkin.", "warn");
        return false;
      }
    }

    return true;
  };

  const handleDeletePerson = (personId: string) => {
    const person = state.people[personId];
    if (!checkEditPermission(person)) return;

    const totalCount = Object.keys(state.people).length;
    if (totalCount <= 1) {
      showToast("Shajarada kamida 1 kishi bo'lishi shart! Oxirgi shaxsni o'chira olmaysiz.", "warn");
      return;
    }

    const actorName = state.currentUser?.fullName || state.currentUser?.name || 'Shajara egasi';

    setState((prev) => {
      const newPeople = { ...prev.people };
      delete newPeople[personId];

      // O'chirilgan shaxsga ishora qiluvchi barcha rishtalarni tozalash (parentId, motherId, spouseId)
      Object.keys(newPeople).forEach((k) => {
        const p = newPeople[k];
        let changed = false;
        let updatedP = { ...p };

        if (p.parentId === personId) {
          updatedP.parentId = null;
          changed = true;
        }
        if (p.motherId === personId) {
          updatedP.motherId = null;
          updatedP.motherName = undefined;
          changed = true;
        }
        if (p.spouseId === personId) {
          updatedP.spouseId = undefined;
          updatedP.spouseName = undefined;
          changed = true;
        }
        if (changed) {
          newPeople[k] = updatedP;
        }
      });

      const recomputed = recalculateAllGenerations(newPeople);
      let newMeId = prev.meId;
      if (prev.meId === personId || !recomputed[newMeId]) {
        newMeId = Object.keys(recomputed)[0] || '';
      }
      const newRootId = findRootAncestorId(newMeId, recomputed);

      const newState: FamilyTreeState = {
        ...prev,
        people: recomputed,
        rootId: newRootId,
        meId: newMeId,
      };

      saveFamilyTreeState(newState, prev.currentUser?.id);
      return newState;
    });
      deletePersonFromSupabase(personId).catch(() => {});

    // Audit log
    addHistoryRecord({
      action: 'person_delete',
      actorName,
      personName: person ? `${person.name} ${person.surname || ''}`.trim() : 'Shaxs',
      title: "Shaxs shajaradan o'chirildi",
      description: `${actorName} tomonidan «${person?.name || 'Shaxs'}» shajaradan o'chirildi.`,
    });

    if (selectedPerson?.id === personId) {
      setSelectedPerson(null);
    }
    setIsEditModalOpen(false);
    showToast(`«${person?.name || 'Shaxs'}» shajaradan o'chirildi.`);
  };

  const handleOpenAddRelative = (person: Person) => {
    if (!checkEditPermission(person)) return;
    setTargetPersonForRelativeModal(person);
    setIsAddRelativeModalOpen(true);
  };

  const handleSelectRelation = (type: RelativeRelationType, targetPerson: Person) => {
    if (!checkEditPermission(targetPerson)) return;
    setTargetRelationType(type);
    setPersonToEdit(null);
    if (type === 'father') {
      setChildForNewParent(targetPerson);
      setParentForNewChild(null);
      setSpouseForNewPerson(null);
      setSiblingForNewPerson(null);
      setInitialGenderForModal('male');
    } else if (type === 'mother') {
      setChildForNewParent(targetPerson);
      setParentForNewChild(null);
      setSpouseForNewPerson(null);
      setSiblingForNewPerson(null);
      setInitialGenderForModal('female');
    } else if (type === 'spouse') {
      setSpouseForNewPerson(targetPerson);
      setChildForNewParent(null);
      setParentForNewChild(null);
      setSiblingForNewPerson(null);
      setInitialGenderForModal(targetPerson.gender === 'male' ? 'female' : 'male');
    } else if (type === 'brother' || type === 'sister') {
      setSiblingForNewPerson(targetPerson);
      if (targetPerson.parentId && state.people[targetPerson.parentId]) {
        setParentForNewChild(state.people[targetPerson.parentId]);
      } else {
        setParentForNewChild(null);
      }
      setChildForNewParent(null);
      setSpouseForNewPerson(null);
      setInitialGenderForModal(type === 'brother' ? 'male' : 'female');
    } else if (type === 'son') {
      setParentForNewChild(targetPerson);
      setChildForNewParent(null);
      setSpouseForNewPerson(null);
      setSiblingForNewPerson(null);
      setInitialGenderForModal('male');
    } else if (type === 'daughter') {
      setParentForNewChild(targetPerson);
      setChildForNewParent(null);
      setSpouseForNewPerson(null);
      setSiblingForNewPerson(null);
      setInitialGenderForModal('female');
    }
    setIsEditModalOpen(true);
  };

  const handleAddParent = (child: Person) => {
    if (!checkEditPermission(child)) return;
    setChildForNewParent(child);
    setParentForNewChild(null);
    setSpouseForNewPerson(null);
    setSiblingForNewPerson(null);
    setTargetRelationType('father');
    setInitialGenderForModal('male');
    setPersonToEdit(null);
    setIsEditModalOpen(true);
  };

  const handleAddChild = (parent: Person) => {
    if (!checkEditPermission(parent)) return;
    setParentForNewChild(parent);
    setChildForNewParent(null);
    setSiblingForNewPerson(null);
    setPersonToEdit(null);
    setIsEditModalOpen(true);
  };

  const handleEditPerson = (person: Person) => {
    if (!checkEditPermission(person)) return;
    setPersonToEdit(person);
    setParentForNewChild(null);
    setChildForNewParent(null);
    setSiblingForNewPerson(null);
    setIsEditModalOpen(true);
  };

  const handleOpenAddRoot = () => {
    if (!checkEditPermission(null)) return;
    setPersonToEdit(null);
    setParentForNewChild(null);
    setChildForNewParent(null);
    setSiblingForNewPerson(null);
  };

  const handleUpdateFamilyName = (newName: string) => {
    setState((prev) => {
      const updated = { ...prev, familyName: newName };
      saveFamilyTreeState(updated, prev.currentUser?.id);
      return updated;
    });
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
      const currentUserId = state.currentUser?.id;
      const currentEmail = state.currentUser?.email;

      clearAllShajaraData();
      deleteTreeFromCloud(currentUserId, currentEmail).catch(() => {});

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
      setViewMode('guest');
      showToast("Barcha ma'lumotlar tozalandi. Yangidan boshlashingiz mumkin!");
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
          onOpenPolicy={handleOpenPolicy}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
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
            {/* Tree Canvas */}
            <FamilyTreeCanvas
              people={state.people}
              rootId={state.rootId}
              meId={state.meId}
              activePerspectiveId={state.activePerspectiveId}
              currentUser={state.currentUser}
              isLoading={isDataLoading}
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
          person={state.people[selectedPerson.id] || selectedPerson}
          people={state.people}
          meId={state.meId}
          activePerspectiveId={state.activePerspectiveId}
          currentUser={state.currentUser}
          isLoading={isDataLoading}
          onClose={() => setSelectedPerson(null)}
          onSelectPerson={(p) => setSelectedPerson(p)}
          onEditPerson={handleEditPerson}
          onSavePerson={handleSavePerson}
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
        key={isEditModalOpen ? `${personToEdit?.id || 'new'}_${targetRelationType || ''}_${initialGenderForModal || ''}` : 'closed'}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setChildForNewParent(null);
          setParentForNewChild(null);
          setSpouseForNewPerson(null);
          setSiblingForNewPerson(null);
          setTargetRelationType(null);
          setInitialGenderForModal(undefined);
          setPersonToEdit(null);
        }}
        personToEdit={personToEdit}
        parentForNewChild={parentForNewChild}
        childForNewParent={childForNewParent}
        spouseForPerson={spouseForNewPerson}
        siblingForPerson={siblingForNewPerson}
        targetRelationType={targetRelationType}
        initialGender={initialGenderForModal}
        people={state.people}
        onSave={handleSavePerson}
        onSaveWithRelation={handleSavePersonWithRelation}
        onDelete={handleDeletePerson}
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
        currentUser={state.currentUser}
      />

      {/* Chop etish uchun A4 Landscape Print View / PDF Modal */}
      <PrintTreeModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        people={state.people}
        rootId={state.rootId}
        meId={state.meId}
        currentUser={state.currentUser}
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
        rootId={state.rootId}
        meId={state.meId}
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
        familyName={state.familyName || '7 Ajdod Shajarasi'}
        onUpdateFamilyName={handleUpdateFamilyName}
        viewMode={viewMode}
        onViewModeChange={(m) => {
          setViewMode(m);
          setIsLeftSidebarOpen(false);
        }}
        onOpenAddModal={handleOpenAddRoot}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        onOpenCalcModal={() => setIsCalcModalOpen(true)}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
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
        onEditMyProfile={() => {
          if (state.meId && state.people[state.meId]) {
            handleEditPerson(state.people[state.meId]);
          } else {
            handleOpenAddRoot();
          }
        }}
        onOpenContactModal={() => setIsContactFeedbackModalOpen(true)}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
      />

      {/* Taklif va So'rov Yuborish Modali (In-place modal, sahifadan chiqib ketmasdan) */}
      <ContactFeedbackModal
        isOpen={isContactFeedbackModalOpen}
        onClose={() => setIsContactFeedbackModalOpen(false)}
        currentUser={state.currentUser}
        onSuccessToast={(msg) => showToast(msg, 'success')}
      />

      {/* Xavfsizlik Markazi, 2FA va Zaxira Nusxalar (Backup) Modali */}
      <SecurityCenterModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        currentUser={state.currentUser}
        treeState={state}
        onRestoreBackup={(restoredState) => {
          setState(restoredState);
          if (restoredState.currentUser?.id) {
            saveFamilyTreeState(restoredState, restoredState.currentUser.id);
          }
          showToast("Zaxira nusxa muvaffaqiyatli tiklandi!", "success");
        }}
        showToast={showToast}
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
            {/* Qo'lda yangilash tugmasi */}
      {state.currentUser?.familyId && (
        <button
          onClick={() => refreshFromCloud(false)}
          disabled={isRefreshing}
          title={lastSyncedAt
            ? `Oxirgi yangilanish: ${lastSyncedAt.toLocaleTimeString()}`
            : "Bulutdan yangilash"}
          aria-label="Yangilash"
          className="fixed bottom-36 right-4 sm:bottom-20 sm:right-6 z-40 w-11 h-11 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:scale-110 active:scale-95 transition disabled:opacity-60"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
}
