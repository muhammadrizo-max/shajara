import { FamilyTreeState, Person } from '../types';
import { DEFAULT_ME_ID, DEFAULT_ROOT_ID, INITIAL_PEOPLE } from '../data/initialData';

const STORAGE_KEY = 'uz_shajara_7ajdod_data_v2';

export function loadFamilyTreeState(): FamilyTreeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.people && Object.keys(parsed.people).length > 0) {
        return {
          people: parsed.people,
          rootId: parsed.rootId || DEFAULT_ROOT_ID,
          meId: parsed.meId || DEFAULT_ME_ID,
          currentUser: parsed.currentUser || null,
          activePerspectiveId: parsed.activePerspectiveId || undefined,
        };
      }
    }
  } catch (err) {
    console.error('Failed to load shajara state from localStorage:', err);
  }

  return {
    people: INITIAL_PEOPLE,
    rootId: DEFAULT_ROOT_ID,
    meId: 'p_muhammadrizo', // Standart Muhammadrizo Xudoberdiyev
    currentUser: {
      name: 'Muhammadrizo',
      surname: 'Xudoberdiyev',
      birthDate: '2005-05-15',
      personId: 'p_muhammadrizo',
      isGuest: false,
    },
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
        if (parsed && parsed.people) {
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
