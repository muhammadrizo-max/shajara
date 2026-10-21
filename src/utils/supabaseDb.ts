/**
 * supabaseDb.ts
 * Supabase REST API orqali bot bilan bir xil bazadan ma'lumot olish.
 * Bot yozgan persons/families/family_members jadvallarini o'qiydi.
 */

import { Person, AuthUser } from '../types';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

function headers() {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  };
}

function isConfigured(): boolean {
  return Boolean(
    SUPABASE_URL &&
    !SUPABASE_URL.includes('your-project') &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_ANON_KEY.includes('your-anon')
  );
}

// ---- Supabase person yozuvini sayt Person formatiga o'tkazish ----
function dbPersonToLocal(p: any, familyId: string): Person {
  return {
    id: p.id,
    name: p.first_name || '',
    surname: p.last_name || '',
    gender: p.gender === 'female' ? 'female' : 'male',
    parentId: p.parent_id || null,
    birthDate: p.birth_date || undefined,
    birthYear: p.birth_date ? String(p.birth_date).slice(0, 4) : undefined,
    deathYear: p.death_date ? String(p.death_date).slice(0, 4) : undefined,
    isAlive: p.is_living !== false,
    photoUrl: p.photo_url || undefined,
    occupation: p.occupation || undefined,
    location: p.location || undefined,
    notes: p.biography || undefined,
    generation: p.generation || 1,
  };
}

// ---- Sayt Person ni Supabase formatiga o'tkazish ----
export function localPersonToDb(p: Person, familyId: string, createdBy: string): any {
  return {
    id: p.id,
    family_id: familyId,
    created_by: createdBy,
    first_name: p.name,
    last_name: p.surname || null,
    gender: p.gender,
    birth_date: p.birthDate || null,
    death_date: p.deathYear ? `${p.deathYear}-01-01` : null,
    is_living: p.isAlive !== false,
    photo_url: p.photoUrl || null,
    biography: p.notes || null,
    occupation: p.occupation || null,
    location: p.location || null,
    generation: p.generation || 1,
    display_order: p.order || 0,
    parent_id: p.parentId || null,
  };
}

// ---- Telegram ID bo'yicha foydalanuvchi va oila ma'lumotlarini yuklash ----
export interface DbLoadResult {
  success: boolean;
  authUser?: AuthUser;
  people?: Record<string, Person>;
  rootId?: string;
  meId?: string;
  familyId?: string;
  error?: string;
}

export async function loadUserDataFromSupabase(telegramId: number): Promise<DbLoadResult> {
  if (!isConfigured()) {
    return { success: false, error: 'Supabase sozlanmagan' };
  }

  try {
    // 1. Foydalanuvchini olish
    const userRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${telegramId}&select=*`,
      { headers: headers() }
    );
    if (!userRes.ok) {
      return { success: false, error: `users fetch: ${userRes.status}` };
    }
    const users = await userRes.json();
    if (!users.length) {
      // Foydalanuvchi botda ro'yxatdan o'tmagan
      return { success: false, error: 'not_registered' };
    }
    const user = users[0];

    // 2. Oila a'zoligini olish
    const memRes = await fetch(
      `${SUPABASE_URL}/rest/v1/family_members?user_id=eq.${user.id}&select=family_id,role`,
      { headers: headers() }
    );
    const members = await memRes.json();
    if (!members.length) {
      return { success: false, error: 'no_family' };
    }
    const familyId = members[0].family_id;
    const role = members[0].role || 'viewer';

    // 3. Persons ni olish
    const personsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/persons?family_id=eq.${familyId}&select=*&order=generation.asc,display_order.asc`,
      { headers: headers() }
    );
    const dbPersons: any[] = await personsRes.json();

    // 4. Lokal formatga o'tkazish
    const people: Record<string, Person> = {};
    dbPersons.forEach((p) => {
      people[p.id] = dbPersonToLocal(p, familyId);
    });

    // rootId: parent_id yo'q birinchi shaxs
    const root = dbPersons.find((p) => !p.parent_id) || dbPersons[0];
    const rootId = root?.id || '';

    // meId: users.person_id ustunidan
    const meId = user.person_id || rootId;

    // AuthUser
    const nameParts = (user.full_name || '').split(' ');
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
    return { success: false, error: e.message };
  }
}

// ---- Persons ni Supabase'ga saqlash (upsert) ----
export async function upsertPersonToSupabase(
  person: Person,
  familyId: string,
  createdBy: string
): Promise<boolean> {
  if (!isConfigured()) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/persons`, {
      method: 'POST',
      headers: {
        ...headers(),
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(localPersonToDb(person, familyId, createdBy)),
    });
    return res.ok || res.status === 201;
  } catch {
    return false;
  }
}

// ---- Person ni Supabase'dan o'chirish ----
export async function deletePersonFromSupabase(personId: string): Promise<boolean> {
  if (!isConfigured()) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/persons?id=eq.${personId}`, {
      method: 'DELETE',
      headers: headers(),
    });
    return res.ok;
  } catch {
    return false;
  }
}
