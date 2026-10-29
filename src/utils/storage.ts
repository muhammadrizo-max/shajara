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
  };
}

export function saveFamilyTreeState(state: FamilyTreeState, userId?: string | null): void {
  try {
    const targetUserId = userId || state.currentUser?.id;
    const key = getUserTreeStorageKey(targetUserId);
    localStorage.setItem(key, JSON.stringify(state));
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
