/**
 * supabaseDb.ts
 * Telegram bot va WebApp o'rtasidagi Supabase integratsiyasi.
 * - public.users
 * - public.families
 * - public.family_members
 * - public.persons
 * - public.relationships
 * - public.invite_tokens (yangi tokenlar jadvali)
 * 
 * Xavfsizlik:
 * - Faqat VITE_SUPABASE_URL va VITE_SUPABASE_ANON_KEY ishlatiladi.
 * - Hech qanday Service Role Key yoki Bot Token frontendga kiritilmaydi.
 * - .env bo'lmaganda sayt xatoliksiz Lokal rejimda ishlaydi.
 */

import { Person, AuthUser } from '../types';

const STORAGE_CUSTOM_URL = 'shajarachi_supabase_url';
const STORAGE_CUSTOM_KEY = 'shajarachi_supabase_anon_key';
const STORAGE_INVITES_FALLBACK = 'shajarachi_supabase_invites_cache';

export function getSupabaseCredentials(): { url: string; key: string } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  const customUrl = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_CUSTOM_URL) || '' : '';
  const customKey = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_CUSTOM_KEY) || '' : '';

  const url = customUrl || envUrl;
  const key = customKey || envKey;
  return { url, key };
}

export function setSupabaseCredentials(url: string, key: string): void {
  if (typeof localStorage === 'undefined') return;
  if (url) localStorage.setItem(STORAGE_CUSTOM_URL, url.trim());
  else localStorage.removeItem(STORAGE_CUSTOM_URL);

  if (key) localStorage.setItem(STORAGE_CUSTOM_KEY, key.trim());
  else localStorage.removeItem(STORAGE_CUSTOM_KEY);
}

function headers(): Record<string, string> {
  const { key } = getSupabaseCredentials();
  return {
    'Content-Type': 'application/json',
    apikey: key,
    Authorization: `Bearer ${key}`,
    Prefer: 'return=representation',
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseCredentials();
  return Boolean(
    url &&
      !url.includes('your-project') &&
      key &&
      !key.includes('your-anon')
  );
}

// ---------------------------------------------------------------------------
// Bazadagi persons yozuvini saytdagi Person formatiga o'tkazish
// ---------------------------------------------------------------------------
function dbPersonToLocal(p: any): Person {
  const firstName = p.first_name || p.name || '';
  const lastName = p.last_name || p.surname || '';
  return {
    id: String(p.id),
    name: firstName,
    surname: lastName || undefined,
    titleOrNickname: p.title_or_nickname || undefined,
    gender: p.gender === 'female' ? 'female' : 'male',
    parentId: p.parent_id ? String(p.parent_id) : null,
    birthDate: p.birth_date || undefined,
    birthYear: p.birth_date ? String(p.birth_date).slice(0, 4) : (p.birth_year ? String(p.birth_year) : undefined),
    deathYear: p.death_date ? String(p.death_date).slice(0, 4) : (p.death_year ? String(p.death_year) : undefined),
    isAlive: p.is_living !== false,
    photoUrl: p.photo_url || undefined,
    occupation: p.occupation || undefined,
    location: p.location || undefined,
    notes: p.notes || p.biography || undefined,
    generation: p.generation || 1,
    linkedUserId: p.linked_user_id || undefined,
  } as Person;
}

export interface DbLoadResult {
  success: boolean;
  authUser?: AuthUser;
  people?: Record<string, Person>;
  rootId?: string;
  meId?: string;
  familyId?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Telegram ID bo'yicha foydalanuvchi va uning shajarasini Supabase'dan yuklash
// ---------------------------------------------------------------------------
export async function loadUserDataFromSupabase(telegramId: number): Promise<DbLoadResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase sozlanmagan (Lokal rejim)' };
  }

  const { url } = getSupabaseCredentials();

  try {
    // 1. Foydalanuvchini tekshirish
    const userRes = await fetch(
      `${url}/rest/v1/users?telegram_id=eq.${telegramId}&select=*`,
      { headers: headers() }
    );
    if (!userRes.ok) {
      return { success: false, error: `users fetch: ${userRes.status}` };
    }
    const users = await userRes.json();
    if (!Array.isArray(users) || users.length === 0) {
      return { success: false, error: 'not_registered' };
    }
    const user = users[0];

    // 2. Oila a'zoligi
    const memRes = await fetch(
      `${url}/rest/v1/family_members?user_id=eq.${user.id}&select=family_id,role`,
      { headers: headers() }
    );
    const members = await memRes.json();
    if (!Array.isArray(members) || members.length === 0) {
      return { success: false, error: 'no_family' };
    }
    const familyId: string = members[0].family_id;
    const role: string = members[0].role || 'editor';

    // 3. Shaxslar
    const personsRes = await fetch(
      `${url}/rest/v1/persons?family_id=eq.${familyId}&select=*&order=created_at.asc`,
      { headers: headers() }
    );
    const dbPersons: any[] = await personsRes.json();
    if (!Array.isArray(dbPersons)) {
      return { success: false, error: 'persons fetch failed' };
    }

    // 4. Qarindoshlik: relationships
    const relRes = await fetch(
      `${url}/rest/v1/relationships?family_id=eq.${familyId}&select=*`,
      { headers: headers() }
    );
    const rels: any[] = await relRes.json();
    const parentOf: Record<string, string> = {};
    if (Array.isArray(rels)) {
      rels.forEach((r) => {
        const childId = r.related_person_id || r.person2_id;
        const parentId = r.person_id || r.person1_id;
        if ((r.relation_type === 'parent' || r.relation_type === 'child' || r.relation_type === 'parent_child') && childId && parentId) {
          parentOf[childId] = parentId;
        }
      });
    }

    // 5. Lokal formatga o'tkazish
    const people: Record<string, Person> = {};
    dbPersons.forEach((p) => {
      const person = dbPersonToLocal(p);
      person.parentId = parentOf[p.id] || p.parent_id || null;
      people[p.id] = person;
    });

    // Avlod raqami: ota-ona zanjiri bo'yicha hisoblash
    Object.values(people).forEach((p) => {
      let g = 1;
      let cur: Person | undefined = p;
      const seen = new Set<string>();
      while (cur && cur.parentId && !seen.has(cur.id)) {
        seen.add(cur.id);
        cur = people[cur.parentId];
        if (cur) g++;
      }
      p.generation = g;
    });

    const root = dbPersons.find((p) => !parentOf[p.id] && !p.parent_id) || dbPersons[0];
    const rootId: string = root?.id || '';
    const meId: string = user.person_id || rootId;

    // 6. Joriy foydalanuvchi
    const nameParts: string[] = (user.full_name || '').split(' ');
    const authUser: AuthUser = {
      id: user.id,
      name: nameParts[0] || '',
      surname: nameParts.slice(1).join(' ') || undefined,
      fullName: user.full_name,
      phone: user.phone || undefined,
      personId: meId,
      role: role as 'owner' | 'editor' | 'viewer',
      telegramId: telegramId,
      telegramUsername: user.username || undefined,
      authProvider: 'telegram',
      isGuest: false,
    };

    return {
      success: true,
      authUser,
      people,
      rootId,
      meId,
      familyId,
    };
  } catch (e: any) {
    return { success: false, error: e?.message || 'unknown error' };
  }
}

// ---------------------------------------------------------------------------
// Oila ID bo'yicha barcha shaxslarni Supabase'dan yuklash (Mehmon / Guest uchun)
// ---------------------------------------------------------------------------
export async function loadFamilyDataFromSupabase(familyId: string): Promise<DbLoadResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase sozlanmagan' };
  }

  const { url } = getSupabaseCredentials();

  try {
    const personsRes = await fetch(
      `${url}/rest/v1/persons?family_id=eq.${familyId}&select=*&order=created_at.asc`,
      { headers: headers() }
    );
    if (!personsRes.ok) {
      return { success: false, error: `persons fetch error: ${personsRes.status}` };
    }
    const dbPersons: any[] = await personsRes.json();
    if (!Array.isArray(dbPersons) || dbPersons.length === 0) {
      return { success: false, error: 'Oila ma\'lumotlari topilmadi' };
    }

    const relRes = await fetch(
      `${url}/rest/v1/relationships?family_id=eq.${familyId}&select=*`,
      { headers: headers() }
    );
    const rels: any[] = await relRes.json();
    const parentOf: Record<string, string> = {};
    if (Array.isArray(rels)) {
      rels.forEach((r) => {
        const childId = r.related_person_id || r.person2_id;
        const parentId = r.person_id || r.person1_id;
        if (childId && parentId) {
          parentOf[childId] = parentId;
        }
      });
    }

    const people: Record<string, Person> = {};
    dbPersons.forEach((p) => {
      const person = dbPersonToLocal(p);
      person.parentId = parentOf[p.id] || p.parent_id || null;
      people[p.id] = person;
    });

    // Avlod raqamini hisoblash
    Object.values(people).forEach((p) => {
      let g = 1;
      let cur: Person | undefined = p;
      const seen = new Set<string>();
      while (cur && cur.parentId && !seen.has(cur.id)) {
        seen.add(cur.id);
        cur = people[cur.parentId];
        if (cur) g++;
      }
      p.generation = g;
    });

    const root = dbPersons.find((p) => !parentOf[p.id] && !p.parent_id) || dbPersons[0];
    const rootId: string = root?.id || '';

    return {
      success: true,
      people,
      rootId,
      meId: rootId,
      familyId,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Yuklashda xatolik' };
  }
}

// ---------------------------------------------------------------------------
// 1. TAKLIFNOMA (INVITE_TOKENS) TIZIMI — Bot bilan 100% uyg'un
// Jadval: public.invite_tokens
// Ustunlar:
// - id (UUID)
// - token (TEXT)
// - family_id (UUID)
// - created_by (UUID)
// - role ('viewer' | 'editor' | 'admin')
// - invite_type ('family' | 'person')
// - target_person_id (UUID, ixtiyoriy)
// - is_used (BOOLEAN, default: false)
// - created_at (TIMESTAMP)
// ---------------------------------------------------------------------------

export interface SupabaseInviteTokenData {
  id?: string;
  token: string;
  familyId?: string;
  createdBy?: string;
  role: 'viewer' | 'editor' | 'admin';
  inviteType: 'family' | 'person';
  targetPersonId?: string;
  isUsed?: boolean;
  createdAt?: string | number;
  // Mijoz uchun qo'shimcha meta ma'lumotlar
  slotName?: string;
  inviterName?: string;
}

export async function saveInviteToSupabase(invite: SupabaseInviteTokenData): Promise<boolean> {
  // Har doim lokal keshga zaxira qilib qo'yamiz (offline va tezkor tiklash uchun)
  try {
    const raw = localStorage.getItem(STORAGE_INVITES_FALLBACK);
    const cached: Record<string, SupabaseInviteTokenData> = raw ? JSON.parse(raw) : {};
    cached[invite.token] = invite;
    localStorage.setItem(STORAGE_INVITES_FALLBACK, JSON.stringify(cached));
  } catch (e) {
    console.warn("Could not cache invite token locally:", e);
  }

  if (!isSupabaseConfigured()) {
    console.info("[Supabase] Sozlanmagan — taklifnoma lokal keshda saqlandi.");
    return true;
  }

  const { url } = getSupabaseCredentials();

  try {
    const payload = {
      token: invite.token,
      family_id: invite.familyId || null,
      created_by: invite.createdBy || null,
      role: invite.role || 'editor',
      invite_type: invite.inviteType || 'family',
      target_person_id: invite.targetPersonId || null,
      is_used: false,
      created_at: new Date().toISOString(),
    };

    const res = await fetch(`${url}/rest/v1/invite_tokens`, {
      method: 'POST',
      headers: {
        ...headers(),
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn("[invite_tokens] Supabase saqlash xatosi:", errText);
      return false;
    }

    return true;
  } catch (err) {
    console.warn("[invite_tokens] Supabase ulanish xatosi (lokal kesh ishlatiladi):", err);
    return true;
  }
}

export async function fetchInviteFromSupabase(token: string): Promise<SupabaseInviteTokenData | null> {
  // 1. Lokal keshdan tekshirish
  try {
    const raw = localStorage.getItem(STORAGE_INVITES_FALLBACK);
    if (raw) {
      const cached = JSON.parse(raw);
      if (cached[token]) return cached[token];
    }
  } catch (e) {}

  if (!isSupabaseConfigured()) return null;

  const { url } = getSupabaseCredentials();

  try {
    const res = await fetch(
      `${url}/rest/v1/invite_tokens?token=eq.${encodeURIComponent(token)}&select=*`,
      { headers: headers() }
    );
    if (!res.ok) return null;
    const items = await res.json();
    if (Array.isArray(items) && items.length > 0) {
      const item = items[0];
      return {
        id: item.id,
        token: item.token,
        familyId: item.family_id || undefined,
        createdBy: item.created_by || undefined,
        role: item.role || 'editor',
        inviteType: item.invite_type || 'family',
        targetPersonId: item.target_person_id || undefined,
        isUsed: item.is_used || false,
        createdAt: item.created_at || Date.now(),
      };
    }
  } catch (err) {
    console.warn("Could not fetch invite_tokens from Supabase:", err);
  }

  return null;
}

// ---------------------------------------------------------------------------
// Shaxsni (Person) va Ota-Ona bog'lanishini Supabase bilan sinxronlash
// Baza sxemasi:
// persons: id, family_id, first_name, last_name, gender, parent_id, birth_date, is_living, photo_url, notes, linked_user_id
// ---------------------------------------------------------------------------
export async function syncPersonToSupabase(
  person: Person,
  familyId?: string,
  userId?: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { url } = getSupabaseCredentials();

  try {
    const personPayload = {
      id: person.id,
      family_id: familyId || null,
      first_name: person.name,
      last_name: person.surname || null,
      name: person.name, // orqaga moslik uchun
      gender: person.gender,
      parent_id: person.parentId || null,
      birth_date: person.birthDate || null,
      birth_year: person.birthYear || null,
      death_year: person.deathYear || null,
      is_living: person.isAlive !== false,
      photo_url: person.photoUrl || null,
      notes: person.notes || null,
      biography: person.notes || null,
      linked_user_id: person.linkedUserId || null,
      created_by: userId || null,
    };

    const res = await fetch(`${url}/rest/v1/persons`, {
      method: 'POST',
      headers: {
        ...headers(),
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(personPayload),
    });

    // Agar otasi/onasi ko'rsatilgan bo'lsa, relationships jadvalini ham yangilaymiz
    if (person.parentId) {
      await fetch(`${url}/rest/v1/relationships`, {
        method: 'POST',
        headers: {
          ...headers(),
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          family_id: familyId || null,
          person_id: person.parentId, // ota
          related_person_id: person.id, // farzand
          person1_id: person.parentId,
          person2_id: person.id,
          relation_type: 'child',
        }),
      }).catch(() => {});
    }

    return res.ok;
  } catch (e) {
    console.warn("Sync person to Supabase warning:", e);
    return false;
  }
}
