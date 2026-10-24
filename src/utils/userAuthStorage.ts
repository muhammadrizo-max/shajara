import { RegisteredAccount, AuthUser, FamilyInvite, TelegramWebUser } from '../types';

const STORAGE_KEY_USERS = 'shajara_clean_registered_users_v2';
const STORAGE_KEY_CURRENT_USER = 'shajara_clean_current_session_v2';
const STORAGE_KEY_INVITES = 'shajara_clean_family_invites_v2';
const STORAGE_KEY_SUPABASE_SESSION = 'shajara_clean_supabase_session_v2';

// Yangi tizimda hech qanday default foydalanuvchi qoldirilmaydi (butunlay toza)
const INITIAL_USERS: RegisteredAccount[] = [];

export function getRegisteredUsers(): RegisteredAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) {
      return INITIAL_USERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_USERS;
  } catch (err) {
    console.error("Error reading registered users:", err);
    return INITIAL_USERS;
  }
}

export function registerNewUser(data: {
  fullName: string;
  email: string;
  phone: string;
  birthDate?: string;
  password?: string;
  personId?: string | null;
  role?: 'owner' | 'editor' | 'viewer';
  telegramId?: string | number;
  telegramUsername?: string;
}): { success: boolean; user?: RegisteredAccount; error?: string } {
  const users = getRegisteredUsers();

  const cleanEmail = data.email.trim().toLowerCase();
  const cleanPhone = data.phone.trim().replace(/\s+/g, '');

  // Tekshirish: bunday email yoki telefon oldin ro'yxatdan o'tganmi?
  const existingEmail = users.find(u => u.email.toLowerCase() === cleanEmail);
  if (existingEmail) {
    return { success: false, error: "Ushbu email manzili allaqachon ro'yxatdan o'tgan!" };
  }

  const existingPhone = users.find(u => u.phone.replace(/\s+/g, '') === cleanPhone);
  if (existingPhone) {
    return { success: false, error: "Ushbu telefon raqami allaqachon ro'yxatdan o'tgan!" };
  }

  const isFirstUser = users.length === 0;

  const newUser: RegisteredAccount = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    fullName: data.fullName.trim(),
    birthDate: data.birthDate || '',
    email: cleanEmail,
    phone: data.phone.trim(),
    passwordHash: data.password || '123456', // Agar kiritilmasa oddiy standart parol
    personId: data.personId || null,
    role: data.role || (isFirstUser ? 'owner' : 'editor'),
    createdAt: Date.now(),
    telegramId: data.telegramId,
    telegramUsername: data.telegramUsername,
    authProvider: 'credentials',
  };

  try {
    const updated = [...users, newUser];
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updated));
    setCurrentSessionUser(newUser);
    return { success: true, user: newUser };
  } catch (err) {
    console.error("Error saving new user:", err);
    return { success: false, error: "Ro'yxatdan o'tishda xatolik yuz berdi" };
  }
}

export function loginUserWithCredentials(
  identifier: string, // Email yoki telefon
  password: string
): { success: boolean; user?: RegisteredAccount; error?: string } {
  const users = getRegisteredUsers();
  const cleanId = identifier.trim().toLowerCase();
  const cleanPhone = identifier.trim().replace(/\s+/g, '');

  const matched = users.find(u => 
    u.email.toLowerCase() === cleanId || 
    u.phone.replace(/\s+/g, '') === cleanPhone
  );

  if (!matched) {
    return { success: false, error: "Bunday email yoki telefon raqamli hisob topilmadi. Avval ro'yxatdan o'ting!" };
  }

  if (matched.passwordHash !== password) {
    return { success: false, error: "Parol noto'g'ri kiritildi!" };
  }

  setCurrentSessionUser(matched);
  return { success: true, user: matched };
}

/**
 * Telegram WebApp yoki Telegram Login orqali kirish
 */
export function loginWithTelegram(
  tgUser: TelegramWebUser,
  startParam?: string
): { success: boolean; user: RegisteredAccount; isNew: boolean } {
  const users = getRegisteredUsers();
  const tgIdStr = String(tgUser.id);
  const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || `Telegram User (${tgUser.id})`;

  // Mavjud foydalanuvchini telegram_id orqali qidiramiz
  let matched = users.find(u => String(u.telegramId) === tgIdStr);
  let isNew = false;

  if (matched) {
    matched.fullName = fullName;
    matched.telegramUsername = tgUser.username || matched.telegramUsername;
    matched.telegramPhotoUrl = tgUser.photo_url || matched.telegramPhotoUrl;

    const updated = users.map(u => u.id === matched!.id ? matched! : u);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updated));
  } else {
    isNew = true;
    const isFirstUser = users.length === 0;
    const newUser: RegisteredAccount = {
      id: `usr_tg_${tgUser.id}`,
      fullName,
      birthDate: '2000-01-01',
      email: tgUser.username ? `${tgUser.username}@telegram.org` : `tg_${tgUser.id}@shajara.uz`,
      phone: `+998(TG)${tgUser.id}`,
      passwordHash: `tg_oauth_${tgUser.id}`,
      personId: null,
      role: isFirstUser ? 'owner' : 'editor',
      createdAt: Date.now(),
      telegramId: tgUser.id,
      telegramUsername: tgUser.username,
      telegramPhotoUrl: tgUser.photo_url,
      authProvider: 'telegram',
    };

    users.push(newUser);
    matched = newUser;
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }

  // Supabase Auth sessiyasi (JWT mock/token) saqlash
  const mockJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tg_${tgUser.id}_${Date.now()}`;
  localStorage.setItem(STORAGE_KEY_SUPABASE_SESSION, JSON.stringify({
    access_token: mockJwt,
    token_type: 'bearer',
    user: {
      id: matched.id,
      telegram_id: tgUser.id,
      full_name: matched.fullName,
      role: matched.role,
    },
    expires_at: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 kun
  }));

  setCurrentSessionUser(matched);

  if (startParam && startParam.startsWith('invite_')) {
    const inviterId = startParam.replace('invite_', '');
    console.log(`[Telegram Auth] Foydalanuvchi ${matched.fullName} (${matched.id}) taklif bilan kirdi: ${inviterId}`);
  }

  return { success: true, user: matched, isNew };
}

export function getCurrentSessionUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentSessionUser(account: RegisteredAccount | AuthUser): void {
  try {
    let authUser: AuthUser;
    if ('passwordHash' in account) {
      const parts = account.fullName.split(' ');
      authUser = {
        id: account.id,
        fullName: account.fullName,
        name: parts[0] || account.fullName,
        surname: parts.slice(1).join(' ') || undefined,
        birthDate: account.birthDate,
        email: account.email,
        phone: account.phone,
        personId: account.personId,
        role: account.role,
        isGuest: false,
        telegramId: account.telegramId,
        telegramUsername: account.telegramUsername,
        telegramPhotoUrl: account.telegramPhotoUrl,
        authProvider: account.authProvider || 'credentials',
      };
    } else {
      authUser = account;
    }
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(authUser));
  } catch (err) {
    console.error("Error setting session user:", err);
  }
}

export function logoutCurrentSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    localStorage.removeItem(STORAGE_KEY_SUPABASE_SESSION);
  } catch (err) {
    console.error("Error logging out:", err);
  }
}

/* ================== TAKLIFNOMALAR (INVITES) ================== */

export function getFamilyInvites(): FamilyInvite[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INVITES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function generateTelegramBotInviteLink(userIdOrCode: string): string {
  return `https://t.me/shajarachi_bot?start=invite_${userIdOrCode}`;
}

export function createFamilyInvite(data: {
  invitedByName: string;
  invitedByEmail?: string;
  targetPersonId?: string;
  targetPersonName?: string;
  role: 'editor' | 'viewer';
  familyTreeName?: string;
}): FamilyInvite {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const newInvite: FamilyInvite = {
    id: `inv_${Date.now()}`,
    code,
    invitedByName: data.invitedByName,
    invitedByEmail: data.invitedByEmail,
    targetPersonId: data.targetPersonId,
    targetPersonName: data.targetPersonName,
    role: data.role,
    createdAt: Date.now(),
    acceptedCount: 0,
    familyTreeName: data.familyTreeName || "7 Ajdod Shajarasi",
    telegramBotInviteLink: generateTelegramBotInviteLink(code),
  };

  try {
    const invites = getFamilyInvites();
    const updated = [newInvite, ...invites];
    localStorage.setItem(STORAGE_KEY_INVITES, JSON.stringify(updated));
  } catch (err) {
    console.error("Error creating invite:", err);
  }

  return newInvite;
}
