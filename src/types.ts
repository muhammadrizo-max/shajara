export type Gender = 'male' | 'female';

export interface Person {
  id: string;
  name: string;
  surname?: string;
  titleOrNickname?: string; // masalan: "Yapaloq", "Polvon", "Qassob", "Xoji", "Rayis"
  gender: Gender;
  parentId: string | null; // Otasining IDsi
  birthDate?: string; // To'liq tug'ilgan sana (YYYY-MM-DD)
  birthYear?: string;
  deathYear?: string;
  isAlive?: boolean;
  photoUrl?: string; // base64 yoki rasm URL
  avatarVideoUrl?: string; // Qisqa avatar video (max 1 daqiqa, 10MB)
  avatarMediaId?: string;
  avatarVideoDuration?: number;
  biographyVideoUrl?: string; // Tarjimai hol videosi (max 10 daqiqa, 300MB)
  biographyMediaId?: string;
  biographyVideoDuration?: number;
  avatarColor?: string;
  occupation?: string; // Kasbi / Mashg'uloti
  location?: string; // Yashagan joyi
  notes?: string; // Qisqacha tarjimai holi / xotiralar
  generation: number; // 1 dan boshlab
  order?: number; // Farzandlar orasidagi tartibi
}

export interface AuthUser {
  name: string;
  surname?: string;
  birthDate?: string;
  personId?: string | null; // agar shajarada topilsa
  isGuest?: boolean;
}

export interface FamilyTreeState {
  people: Record<string, Person>;
  rootId: string;
  meId: string; // Haqiqiy login qilgan shaxs IDsi
  activePerspectiveId?: string; // Vaqtinchalik qarindoshlik tekshirish uchun ko'rish nuqtai nazari
  currentUser?: AuthUser | null;
}

export type ViewMode = 'tree' | 'seven-ancestors' | 'list' | 'analytics';

export interface RelativeRelationInfo {
  relationNameUz: string;
  description: string;
  generationDiff: number;
  path: string[];
  commonAncestorName?: string;
  isDirectAncestor: boolean;
  isDirectDescendant: boolean;
  ancestorTitleUz?: string; // masalan: "Ota", "Bobo", "Katta bobo", "Bobokalon", "Qat bobo", "Avlod/Pusht"
}

