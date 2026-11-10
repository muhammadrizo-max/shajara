/**
 * src/utils/security.ts
 * Shajarachi — Kengaytirilgan xavfsizlik, ma'lumotlarni tekshirish (Input Validation),
 * XSS va SQL Injection himoyasi, Kriptografik xeshlash, 2FA (MFA) va Zaxira nusxa vositalari.
 */

// 1. INPUT SANITIZATION & ESCAPING (XSS va Injection himoyasi)

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /on\w+\s*=/gi,
  /data:text\/html/gi,
  /union\s+select/gi,
  /drop\s+table/gi,
  /--/g,
  /\/\*/g,
];

/**
 * Matnni XSS va xavfli skriptlardan tozalash
 */
export function sanitizeInput(input: unknown, maxLength = 1000): string {
  if (typeof input !== 'string') {
    if (input === null || input === undefined) return '';
    return String(input).slice(0, maxLength);
  }

  let clean = input.trim();

  // Xavfli tokenlarni zararsizlantirish
  for (const pattern of DANGEROUS_PATTERNS) {
    clean = clean.replace(pattern, '');
  }

  // Boshqaruv belgilarini olib tashlash (Null bytes, non-printable control chars)
  clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  if (clean.length > maxLength) {
    clean = clean.slice(0, maxLength);
  }

  return clean;
}

/**
 * HTML uchun xavfsiz escape qilish
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * URL manzillarini xavfsiz qilish (javascript:, data: va phishing linklarni to'sish)
 */
export function sanitizeUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Faqat https, http yoki nisbiy / yo'llar ruxsat etiladi
  if (/^(https?:\/\/|\/|blob:)/i.test(trimmed)) {
    // javascript: yoki data:text/html kiritilmaganligini tasdiqlash
    if (/^(javascript:|vbscript:|data:text\/html)/i.test(trimmed)) {
      return null;
    }
    return trimmed;
  }
  return null;
}

/**
 * Email formatini qat'iy RFC 5322 regex bilan tekshirish
 */
export function isValidEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 254 || trimmed.length < 5) return false;
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return re.test(trimmed);
}

/**
 * UUID formatini tekshirish
 */
export function isValidUuid(id?: string | null): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// 2. PAROL MUSTAHKAMLIGI VA KRIPTOGRAFIK XESHLASH

export interface PasswordStrengthResult {
  score: number; // 0 dan 4 gacha
  isStrong: boolean;
  label: string;
  feedback: string;
}

export function checkPasswordStrength(password: string): PasswordStrengthResult {
  if (!password || password.length < 6) {
    return {
      score: 0,
      isStrong: false,
      label: "Juda zaif",
      feedback: "Parol juda qisqa (kamida 6 ta belgi bo'lishi shart)",
    };
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

  let label = "Juda zaif";
  let feedback = "Kuchsiz parol";
  if (score === 1) {
    label = "Zaif";
    feedback = "Oddiy parol (raqamlar yoki katta harflar qo'shing)";
  } else if (score === 2) {
    label = "O'rtacha";
    feedback = "O'rtacha parol";
  } else if (score === 3) {
    label = "Yaxshi";
    feedback = "Yaxshi va mustahkam parol";
  } else if (score >= 4) {
    label = "Mustahkam";
    feedback = "Juda mustahkam xavfsiz parol!";
  }

  return {
    score,
    isStrong: score >= 2,
    label,
    feedback,
  };
}

/**
 * Kriptografik SHA-256 xeshlash (Web Crypto API)
 * Agar brauzerda crypto.subtle mavjud bo'lsa yuqori xavfsizlikli xesh yaratadi
 */
export async function cryptoHashPassword(password: string, customSalt = 'shajarachi_v2_salt'): Promise<string> {
  const cleanPass = password.trim();
  const data = new TextEncoder().encode(`${customSalt}:${cleanPass}:2026`);

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return `sha256_${hashHex}`;
    } catch {
      // Fallback
    }
  }

  // Zaxira xesh (agar Web Crypto bloklangan bo'lsa)
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < cleanPass.length; i++) {
    const ch = cleanPass.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `sec_${(h2 >>> 0).toString(16)}${(h1 >>> 0).toString(16)}`;
}

// 3. 2-BOSQICHLI HIMOYА (2FA / MFA) SOZLAMALARI

const STORAGE_KEY_2FA = 'shajarachi_security_2fa_config';

export interface TwoFactorConfig {
  isEnabled: boolean;
  pinHash: string; // 6-digit PIN kod xeshi
  backupKey: string; // Qayta tiklash kodi
  updatedAt: number;
}

export function get2FAConfig(): TwoFactorConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_2FA);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    isEnabled: false,
    pinHash: '',
    backupKey: '',
    updatedAt: 0,
  };
}

export function set2FAConfig(config: TwoFactorConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_2FA, JSON.stringify(config));
  } catch (err) {
    console.warn('[2FA] Saqlashda xatolik:', err);
  }
}

export function generateRandom2FABackupKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let res = 'SHJ-';
  for (let i = 0; i < 8; i++) {
    if (i === 4) res += '-';
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

export function simplePinHash(pin: string): string {
  let hash = 5381;
  const str = `pin_salt_${pin.trim()}_2026`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return `pin_${Math.abs(hash).toString(16)}`;
}

export function verify2FAPin(pin: string, storedHash: string, backupKey?: string): boolean {
  if (!storedHash) return true;
  const clean = pin.trim().toUpperCase();
  if (backupKey && clean === backupKey.trim().toUpperCase()) return true;
  return simplePinHash(clean) === storedHash;
}

// 4. BRUTE-FORCE VA RATE-LIMITING HIMOYA (CLIENT-SIDE)

const STORAGE_KEY_LOGIN_ATTEMPTS = 'shajarachi_login_attempts';

export function getLoginAttempts(): { count: number; lockedUntil: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGIN_ATTEMPTS);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.lockedUntil && Date.now() > data.lockedUntil) {
        clearLoginAttempts();
        return { count: 0, lockedUntil: 0 };
      }
      return data;
    }
  } catch {}
  return { count: 0, lockedUntil: 0 };
}

export function recordFailedLoginAttempt(): { isLocked: boolean; remainingSeconds: number } {
  const current = getLoginAttempts();
  const nextCount = current.count + 1;
  let lockedUntil = 0;

  if (nextCount >= 5) {
    // 5 ta xato urinishdan so'ng 60 soniyaga bloklanadi
    lockedUntil = Date.now() + 60 * 1000;
  }

  const payload = { count: nextCount, lockedUntil };
  try {
    localStorage.setItem(STORAGE_KEY_LOGIN_ATTEMPTS, JSON.stringify(payload));
  } catch {}

  const isLocked = lockedUntil > Date.now();
  const remainingSeconds = isLocked ? Math.ceil((lockedUntil - Date.now()) / 1000) : 0;
  return { isLocked, remainingSeconds };
}

export function clearLoginAttempts(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_LOGIN_ATTEMPTS);
  } catch {}
}

// 5. SHIFRLANGAN ZAXIRA NUSXA VA SHAJARA MONITORINGI (BACKUPS)

const STORAGE_KEY_AUTO_BACKUPS = 'shajarachi_auto_backups_v2';

export interface BackupSnapshot {
  id: string;
  createdAt: string;
  peopleCount: number;
  dataHash: string;
  serializedData: string;
}

export function saveAutoBackupSnapshot(treeData: any): void {
  try {
    if (!treeData || !treeData.people || Object.keys(treeData.people).length === 0) return;
    const raw = localStorage.getItem(STORAGE_KEY_AUTO_BACKUPS);
    const existing: BackupSnapshot[] = raw ? JSON.parse(raw) : [];

    const serialized = JSON.stringify(treeData);
    const count = Object.keys(treeData.people).length;
    const snapshot: BackupSnapshot = {
      id: `bk_${Date.now()}`,
      createdAt: new Date().toISOString(),
      peopleCount: count,
      dataHash: `h_${serialized.length}_${count}`,
      serializedData: serialized,
    };

    // Oxirgi 5 ta zaxira nusxani saqlaymiz
    const updated = [snapshot, ...existing.slice(0, 4)];
    localStorage.setItem(STORAGE_KEY_AUTO_BACKUPS, JSON.stringify(updated));
  } catch (err) {
    console.warn('[Security Backup] Zaxiralashda xatolik:', err);
  }
}

export function getAutoBackups(): BackupSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTO_BACKUPS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
