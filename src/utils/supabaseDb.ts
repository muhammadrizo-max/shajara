/**
 * supabaseDb.ts
 * Telegram bot yozgan Supabase ma'lumotlarini (users, families,
 * family_members, persons, relationships) saytga yuklaydi.
 *
 * Bot sxemasi bo'yicha:
 *   persons:       first_name, last_name, gender, birth_date, death_date,
 *                  is_living, photo_url, biography, family_id, created_by, linked_user_id
 *   relationships: person_id (ota-ona), related_person_id (farzand), relation_type
 *
 * Eslatma: parent_id, generation, display_order ustunlari bot sxemasida YO'Q.
 *          Ota-ona bog'lanishi relationships jadvalidan hisoblanadi.
 */

import { Person, AuthUser } from '../types';

const SUPABASE_URL: string = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY: string = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

function headers(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
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

// ---------------------------------------------------------------------------
// Bazadagi persons yozuvini saytdagi Person formatiga o'tkazish
// ---------------------------------------------------------------------------
function dbPersonToLocal(p: any): Person {
  return {
    id: p.id,
    name: p.first_name || '',
    surname: p.last_name || '',
    gender: p.gender === 'female' ? 'female' : 'male',
    parentId: null, // loadUserDataFromSupabase ichida to'ldiriladi
    birthDate: p.birth_date || undefined,
    birthYear: p.birth_date ? String(p.birth_date).slice(0, 4) : undefined,
    deathYear: p.death_date ? String(p.death_date).slice(0, 4) : undefined,
    isAlive: p.is_living !== false,
    photoUrl: p.photo_url || undefined,
    notes: p.biography || undefined,
    generation: 1, // loadUserDataFromSupabase ichida hisoblanadi
  } as Person;
}

// ---------------------------------------------------------------------------
// Telegram ID bo'yicha foydalanuvchi va uning oilasini yuklash
// ---------------------------------------------------------------------------
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
    // 1. Foydalanuvchi
    const userRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${telegramId}&select=*`,
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
      `${SUPABASE_URL}/rest/v1/family_members?user_id=eq.${user.id}&select=family_id,role`,
      { headers: headers() }
    );
    const members = await memRes.json();
    if (!Array.isArray(members) || members.length === 0) {
      return { success: false, error: 'no_family' };
    }
    const familyId: string = members[0].family_id;
    const role: string = members[0].role || 'viewer';

    // 3. Shaxslar
    const personsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/persons?family_id=eq.${familyId}&select=*&order=created_at.asc`,
      { headers: headers() }
    );
    const dbPersons: any[] = await personsRes.json();
    if (!Array.isArray(dbPersons)) {
      return { success: false, error: 'persons fetch failed' };
    }

    // 4. Qarindoshlik: bot yozuvida person_id = ota-ona, related_person_id = farzand
    const relRes = await fetch(
      `${SUPABASE_URL}/rest/v1/relationships?family_id=eq.${familyId}&select=person_id,related_person_id,relation_type`,
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
      person.parentId = parentOf[p.id] || null;
      people[p.id] = person;
    });

    // Avlod raqami: ota-ona zanjiri bo'yicha (tsikldan himoyalangan)
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

    const root = dbPersons.find((p) => !parentOf[p.id]) || dbPersons[0];
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
    } as AuthUser;

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
