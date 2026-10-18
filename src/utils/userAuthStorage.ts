import { RegisteredAccount, AuthUser, FamilyInvite } from '../types';

const STORAGE_KEY_USERS = 'shajara_registered_users_v1';
const STORAGE_KEY_CURRENT_USER = 'shajara_current_session_v1';
const STORAGE_KEY_INVITES = 'shajara_family_invites_v1';

// Boshlang'ich tizim admini / oila boshlig'i (namuna sifatida)
const INITIAL_USERS: RegisteredAccount[] = [
  {
    id: 'user_muhammadrizo',
    fullName: 'Muhammadrizo Xudoberdiyev',
    birthDate: '2005-05-15',
    email: 'muhammadrizoxudoberdiyev834@gmail.com',
    phone: '+998901234567',
    passwordHash: 'admin123',
    personId: 'p_me',
    role: 'owner',
    createdAt: Date.now() - 86400000 * 10,
  }
];

export function getRegisteredUsers(): RegisteredAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(INITIAL_USERS));
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
  birthDate: string;
  email: string;
  phone: string;
  password: string;
  personId?: string | null;
  role?: 'owner' | 'editor' | 'viewer';
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

  const newUser: RegisteredAccount = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    fullName: data.fullName.trim(),
    birthDate: data.birthDate,
    email: cleanEmail,
    phone: data.phone.trim(),
    passwordHash: data.password, // Frontend SPA xotirasi
    personId: data.personId || null,
    role: data.role || (users.length === 0 ? 'owner' : 'editor'),
    createdAt: Date.now(),
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
    return { success: false, error: "Bunday email yoki telefon raqamli foydalanuvchi topilmadi!" };
  }

  if (matched.passwordHash !== password) {
    return { success: false, error: "Parol noto'g'ri kiritildi!" };
  }

  setCurrentSessionUser(matched);
  return { success: true, user: matched };
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
    familyTreeName: data.familyTreeName || "7 Ajdod Shajarasi"
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
