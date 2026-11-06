export const SUPABASE_URL: string =
  (import.meta as any).env?.VITE_SUPABASE_URL ?? '';

export const SUPABASE_ANON_KEY: string =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ?? '';

export function hasRealSupabaseCredentials(): boolean {
  return (
    SUPABASE_URL.startsWith('https://') &&
    SUPABASE_URL.includes('.supabase.co') &&
    SUPABASE_ANON_KEY.length > 20
  );
}

if (typeof window !== 'undefined') {
  console.log('[Supabase] URL:', SUPABASE_URL || '❌ YOQ');
  console.log('[Supabase] KEY:', SUPABASE_ANON_KEY ? `✅ (${SUPABASE_ANON_KEY.slice(0,30)}...)` : '❌ YOQ');
  console.log('[Supabase] Ready:', hasRealSupabaseCredentials());
}

export interface SupabaseUserRecord {
  id?: string;
  telegram_id: number | string;
  full_name: string;
  username?: string;
  phone?: string;
  photo_url?: string;
  role?: string;
  family_id?: string;
  created_at?: string;
  last_login?: string;
}

export interface SupabaseAuthSession {
  accessToken: string;
  user: SupabaseUserRecord;
  expiresAt: number;
}

const STORAGE_SESSION_KEY = 'shajara_supabase_session_jwt';

export async function syncTelegramUserWithSupabase(userData: {
  telegram_id: number | string;
  full_name: string;
  username?: string;
  phone?: string;
  photo_url?: string;
  invited_by_family_id?: string;
}): Promise<{ success: boolean; session?: SupabaseAuthSession; error?: string }> {
  try {
    if (hasRealSupabaseCredentials()) {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify({
          telegram_id: userData.telegram_id,
          full_name: userData.full_name,
          username: userData.username || null,
          phone: userData.phone || null,
          photo_url: userData.photo_url || null,
          last_login: new Date().toISOString(),
        }),
      });
      if (!response.ok) {
        console.warn('[Supabase] syncUser xatolik:', response.status, await response.text());
      } else {
        console.log('[Supabase] ✅ User sinxronlandi:', await response.json());
      }
    } else {
      console.warn('[Supabase] ⚠️ Credentials yoq — lokal rejim');
    }

    const session: SupabaseAuthSession = {
      accessToken: `jwt_tg_${userData.telegram_id}_${Date.now()}`,
      user: {
        id: `sb_usr_${userData.telegram_id}`,
        telegram_id: userData.telegram_id,
        full_name: userData.full_name,
        username: userData.username,
        phone: userData.phone,
        photo_url: userData.photo_url,
        family_id: userData.invited_by_family_id || 'default_family_1',
        role: 'editor',
        last_login: new Date().toISOString(),
      },
      expiresAt: Date.now() + 86400000 * 30,
    };

    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
    return { success: true, session };
  } catch (err: any) {
    console.error('[Supabase] syncUser error:', err);
    return { success: false, error: err?.message || 'Supabase ulanish xatosi' };
  }
}

export function getSavedSupabaseSession(): SupabaseAuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_SESSION_KEY);
    if (!raw) return null;
    const session: SupabaseAuthSession = JSON.parse(raw);
    if (session.expiresAt && session.expiresAt < Date.now()) {
      localStorage.removeItem(STORAGE_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearSupabaseSession(): void {
  localStorage.removeItem(STORAGE_SESSION_KEY);
}

export async function sendContactMessageToSupabase(payload: {
  id: string;
  email: string;
  message: string;
  created_at: string;
}): Promise<boolean> {
  if (!hasRealSupabaseCredentials()) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/contact_messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Supabase] contact_messages error:', err);
    return false;
  }
}

export const supabase = {
  from: (table: string) => ({
    insert: async (data: any[]) => {
      if (!hasRealSupabaseCredentials()) return { data: null, error: 'not_configured' };
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(data),
        });
        const result = await res.json().catch(() => null);
        return { data: result, error: res.ok ? null : result };
      } catch (e) {
        console.warn(`[Supabase] ${table} insert error:`, e);
        return { data: null, error: e };
      }
    },
  }),
};
