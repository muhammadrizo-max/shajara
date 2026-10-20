import { FamilyTreeState, Person } from '../types';
import { DEFAULT_ME_ID, DEFAULT_ROOT_ID, INITIAL_PEOPLE } from '../data/initialData';

const STORAGE_KEY = 'shajara_clean_user_tree_v3';

export function loadFamilyTreeState(): FamilyTreeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.people && Object.keys(parsed.people).length > 0) {
        return {
          people: parsed.people,
          rootId: parsed.rootId || Object.keys(parsed.people)[0] || '',
          meId: parsed.meId || Object.keys(parsed.people)[0] || '',
          currentUser: parsed.currentUser || null,
          activePerspectiveId: parsed.activePerspectiveId || undefined,
        };
      }
    }
  } catch (err) {
    console.error('Failed to load shajara state from localStorage:', err);
  }

  // Butunlay toza bo'sh shajara (hech qanday default odamlar qolmagan)
  return {
    people: INITIAL_PEOPLE, // {}
    rootId: DEFAULT_ROOT_ID, // ''
    meId: DEFAULT_ME_ID, // ''
    currentUser: null,
    activePerspectiveId: undefined,
  };
}

export function saveFamilyTreeState(state: FamilyTreeState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save shajara state to localStorage:', err);
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
