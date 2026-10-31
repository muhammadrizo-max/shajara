import { FamilyTreeState, Person } from '../types';
import { DEFAULT_ME_ID, DEFAULT_ROOT_ID, INITIAL_PEOPLE } from '../data/initialData';

export function getUserTreeStorageKey(userId?: string | null): string {
  if (!userId) return 'shajara_guest_tree_v3';
  return `shajara_tree_user_${userId}`;
}

export function loadFamilyTreeState(userId?: string | null): FamilyTreeState {
  try {
    const key = getUserTreeStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.people) {
        return {
          people: parsed.people,
          rootId: parsed.rootId || '',
          meId: parsed.meId || '',
          currentUser: parsed.currentUser || null,
          activePerspectiveId: parsed.activePerspectiveId || undefined,
          familyName: parsed.familyName || '7 Ajdod Shajarasi',
        };
      }
    }
  } catch (err) {
    console.error('Failed to load user shajara state:', err);
  }

  return {
    people: {},
    rootId: '',
    meId: '',
    currentUser: null,
    activePerspectiveId: undefined,
    familyName: '7 Ajdod Shajarasi',
  };
}

export async function fetchTreeFromCloud(userId?: string | null, email?: string | null): Promise<FamilyTreeState | null> {
  if (!userId && !email) return null;
  try {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (email) params.append('email', email);
    const res = await fetch(`/api/tree?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.state && data.state.people && Object.keys(data.state.people).length > 0) {
        return data.state as FamilyTreeState;
      }
    }
  } catch (e) {
    console.warn('[Cloud Sync] fetchTreeFromCloud xatolik:', e);
  }
  return null;
}

export async function saveTreeToCloud(state: FamilyTreeState, userId?: string | null, email?: string | null): Promise<boolean> {
  const targetUserId = userId || state.currentUser?.id;
  const targetEmail = email || state.currentUser?.email;
  if (!targetUserId && !targetEmail) return false;

  try {
    const res = await fetch('/api/tree', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: targetUserId,
        email: targetEmail,
        state,
      }),
    });
    return res.ok;
  } catch (e) {
    console.warn('[Cloud Sync] saveTreeToCloud xatolik:', e);
    return false;
  }
}

export function saveFamilyTreeState(state: FamilyTreeState, userId?: string | null): void {
  try {
    const targetUserId = userId || state.currentUser?.id;
    const key = getUserTreeStorageKey(targetUserId);
    localStorage.setItem(key, JSON.stringify(state));

    // Cloudga ham fon rejimida saqlash (Phone <-> PC sinxronlash)
    if (targetUserId || state.currentUser?.email) {
      saveTreeToCloud(state, targetUserId, state.currentUser?.email).catch(() => {});
    }
  } catch (err) {
    console.error('Failed to save user shajara state:', err);
  }
}

/**
 * Saytdagi barcha ma'lumotlarni butunlay tozalash (LocalStorage tozalash)
 */
export function clearAllShajaraData(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('shajara_') || key.startsWith('uz_shajara_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.error('Failed to clear shajara data:', e);
  }
}

export function exportStateAsJSON(state: FamilyTreeState): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `shajara_7ajdod_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importStateFromJSON(file: File): Promise<FamilyTreeState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === 'object' && parsed.people) {
          resolve(parsed as FamilyTreeState);
        } else {
          reject(new Error("Fayl formati noto'g'ri"));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Faylni o'qishda xatolik yuz berdi"));
    reader.readAsText(file);
  });
}

// Convert uploaded image file to Base64 data URL
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
