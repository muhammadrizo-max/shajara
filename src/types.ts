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
  spouseId?: string; // Turmush o'rtog'ining IDsi
  spouseName?: string; // Turmush o'rtog'ining ismi
  motherId?: string; // Onasining IDsi
  motherName?: string; // Onasining ismi
  linkedUserId?: string; // Supabase users.id bilan bog'lanish
}

export interface AuthUser {
  id?: string;
  name: string;
  surname?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  personId?: string | null; // agar shajarada topilsa
  familyId?: string; // Supabase families.id
  isGuest?: boolean;
  role?: 'owner' | 'editor' | 'viewer';
  // Google va Telegram integratsiya parametrlari
  googleId?: string;
  photoUrl?: string;
  telegramId?: string | number;
  telegramUsername?: string;
  telegramPhotoUrl?: string;
  authProvider?: 'credentials' | 'telegram' | 'google' | 'guest';
}

export interface RegisteredAccount {
  id: string;
  fullName: string;
  birthDate: string;
  email: string;
  phone: string;
  passwordHash: string;
  personId?: string | null;
  role: 'owner' | 'editor' | 'viewer';
  createdAt: number;
  telegramId?: string | number;
  telegramUsername?: string;
  telegramPhotoUrl?: string;
  authProvider?: 'credentials' | 'telegram';
}

export interface FamilyInvite {
  id: string;
  code: string;
  invitedByName: string;
  invitedByEmail?: string;
  targetPersonId?: string;
  targetPersonName?: string;
  role: 'editor' | 'viewer';
  createdAt: number;
  acceptedCount: number;
  familyTreeName?: string;
  telegramBotInviteLink?: string;
}

export type HistoryActionType = 
  | 'person_add' 
  | 'person_edit' 
  | 'person_delete' 
  | 'relation_change' 
  | 'tree_reset' 
  | 'tree_import' 
  | 'member_invited'
  | 'user_registered'
  | 'telegram_connect';

export interface HistoryRecord {
  id: string;
  timestamp: number;
  action: HistoryActionType;
  actorName: string;
  personName?: string;
  personId?: string;
  title: string;
  description: string;
  details?: string;
}

export interface FamilyTreeState {
  people: Record<string, Person>;
  rootId: string;
  meId: string; // Haqiqiy login qilgan shaxs IDsi
  activePerspectiveId?: string; // Vaqtinchalik qarindoshlik tekshirish uchun ko'rish nuqtai nazari
  currentUser?: AuthUser | null;
  familyName?: string;
}

export type ViewMode = 'tree' | 'seven-ancestors' | 'list' | 'analytics' | 'guest' | 'album';

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

// Telegram WebApp (TWA) global tiplari
export interface TelegramWebUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface TelegramWebAppObject {
  initData: string;
  initDataUnsafe?: {
    query_id?: string;
    user?: TelegramWebUser;
    auth_date?: string;
    hash?: string;
    start_param?: string;
  };
  version?: string;
  platform?: string;
  colorScheme?: 'light' | 'dark';
  themeParams?: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  isExpanded?: boolean;
  viewportHeight?: number;
  ready: () => void;
  expand: () => void;
  close: () => void;
  openLink?: (url: string) => void;
  openTelegramLink?: (url: string) => void;
  showAlert?: (message: string, callback?: () => void) => void;
  showConfirm?: (message: string, callback?: (confirmed: boolean) => void) => void;
  MainButton?: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebAppObject;
    };
  }
}
