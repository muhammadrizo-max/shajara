/**
 * supabaseDb.ts
 * Telegram bot yozgan Supabase ma'lumotlarini (users, families,
 * family_members, persons, relationships, invites) saytga yuklaydi va 
 * saytdagi o'zgarishlarni Supabase bilan real sinxronlashtiradi.
 */

import { Person, AuthUser } from '../types';

const STORAGE_CUSTOM_URL = 'shajarachi_supabase_url';
const STORAGE_CUSTOM_KEY = 'shajarachi_supabase_anon_key';
const STORAGE_INVITES_FALLBACK = 'shajarachi_supabase_invites_cache';

export function getSupabaseCredentials(): { url: string; key: string } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  const customUrl = localStorage.getItem(STORAGE_CUSTOM_URL) || '';
  const customKey = localStorage.getItem(STORAGE_CUSTOM_KEY) || '';

  const url = customUrl || envUrl;
  const key = customKey || envKey;
  return { url, key };
}

export function setSupabaseCredentials(url: string, key: string): void {
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
  return {
    id: p.id,
    name: p.first_name || p.name || '',
    surname: p.last_name || p.surname || '',
    titleOrNickname: p.title_or_nickname || undefined,
    gender: p.gender === 'female' ? 'female' : 'male',
    parentId: p.parent_id || null,
    birthDate: p.birth_date || undefined,
    birthYear: p.birth_date ? String(p.birth_date).slice(0, 4) : (p.birth_year ? String(p.birth_year) : undefined),
    deathYear: p.death_date ? String(p.death_date).slice(0, 4) : (p.death_year ? String(p.death_year) : undefined),
    isAlive: p.is_living !== false,
    photoUrl: p.photo_url || undefined,
    occupation: p.occupation || undefined,
    location: p.location || undefined,
    notes: p.biography || p.notes || undefined,
    generation: p.generation || 1,
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
    return { success: false, error: 'Supabase sozlanmagan' };
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

    // 4. Qarindoshlik: person_id = ota-ona, related_person_id = farzand
    const relRes = await fetch(
      `${url}/rest/v1/relationships?family_id=eq.${familyId}&select=person_id,related_person_id,relation_type`,
      { headers: headers() }
    );
    const rels: any[] = await relRes.json();
    const parentOf: Record<string, string> = {};
    if (Array.isArray(rels)) {
      rels.forEach((r) => {
        if (r.relation_type === 'parent' || r.relation_type === 'child') {
          parentOf[r.related_person_id] = r.person_id;
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

    // Avlod raqami: ota-ona zanjiri bo'yicha
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
// Real Supabase Taklifnomalarini Saqlash va O'qish (Invites)
// ---------------------------------------------------------------------------
export interface SupabaseInviteData {
  code: string;
  inviterId: string | number;
  inviterName?: string;
  inviteType: 'general' | 'slot';
  slotName?: string;
  slotPersonId?: string;
  familyId?: string;
  createdAt: number;
}

export async function saveInviteToSupabase(invite: SupabaseInviteData): Promise<boolean> {
  // Har doim lokal keshga yozib qo'yamiz (offline va zaxira uchun)
  try {
    const raw = localStorage.getItem(STORAGE_INVITES_FALLBACK);
    const cached: Record<string, SupabaseInviteData> = raw ? JSON.parse(raw) : {};
    cached[invite.code] = invite;
    localStorage.setItem(STORAGE_INVITES_FALLBACK, JSON.stringify(cached));
  } catch (e) {
    console.warn("Could not cache invite locally:", e);
  }

  if (!isSupabaseConfigured()) {
    return true;
  }

  const { url } = getSupabaseCredentials();

  try {
    const payload = {
      code: invite.code,
      inviter_id: String(invite.inviterId),
      inviter_name: invite.inviterName || 'Foydalanuvchi',
      invite_type: invite.inviteType,
      slot_name: invite.slotName || null,
      slot_person_id: invite.slotPersonId || null,
      family_id: invite.familyId || null,
      metadata: { createdAt: invite.createdAt },
      created_at: new Date().toISOString(),
    };

    const res = await fetch(`${url}/rest/v1/invites`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch (err) {
    console.warn("Supabase invites sync warning (falling back to cache):", err);
    return true;
  }
}

export async function fetchInviteFromSupabase(code: string): Promise<SupabaseInviteData | null> {
  // 1. Lokal keshdan tekshirish
  try {
    const raw = localStorage.getItem(STORAGE_INVITES_FALLBACK);
    if (raw) {
      const cached = JSON.parse(raw);
      if (cached[code]) return cached[code];
    }
  } catch (e) {}

  if (!isSupabaseConfigured()) return null;

  const { url } = getSupabaseCredentials();

  try {
    const res = await fetch(`${url}/rest/v1/invites?code=eq.${code}&select=*`, {
      headers: headers(),
    });
    if (!res.ok) return null;
    const items = await res.json();
    if (Array.isArray(items) && items.length > 0) {
      const item = items[0];
      return {
        code: item.code,
        inviterId: item.inviter_id,
        inviterName: item.inviter_name,
        inviteType: item.invite_type || 'general',
        slotName: item.slot_name || undefined,
        slotPersonId: item.slot_person_id || undefined,
        familyId: item.family_id || undefined,
        createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
      };
    }
  } catch (err) {
    console.warn("Could not fetch invite from Supabase:", err);
  }

  return null;
}

// ---------------------------------------------------------------------------
// Shaxsni (Person) va Ota-Ona bog'lanishini Supabase bilan sinxronlash
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
      title_or_nickname: person.titleOrNickname || null,
      gender: person.gender,
      parent_id: person.parentId || null,
      birth_date: person.birthDate || null,
      is_living: person.isAlive !== false,
      photo_url: person.photoUrl || null,
      biography: person.notes || null,
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

    // Agar ota-onasi bo'lsa, relationships jadvalini ham yangilaymiz
    if (person.parentId) {
      await fetch(`${url}/rest/v1/relationships`, {
        method: 'POST',
        headers: {
          ...headers(),
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          person_id: person.parentId, // ota
          related_person_id: person.id, // farzand
          relation_type: 'child',
          family_id: familyId || null,
        }),
      }).catch(() => {});
    }

    return res.ok;
  } catch (e) {
    console.warn("Sync person to Supabase warning:", e);
    return false;
  }
}
