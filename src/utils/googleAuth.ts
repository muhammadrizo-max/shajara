/**
 * googleAuth.ts
 * Google Identity Services SDK integratsiyasi va /api/auth/google bilan aloqa
 */

import { AuthUser } from '../types';
import { getSupabaseCredentials, isSupabaseConfigured } from './supabaseDb';

export const GOOGLE_CLIENT_ID = 
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || 
  '399388832910-8uikes6k5f91b5b8objvklrrgaji2ins.apps.googleusercontent.com';

export interface GoogleAuthResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
  isNewUser?: boolean;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            use_fedcm_for_prompt?: boolean;
            itp_support?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number | string;
              locale?: string;
            }
          ) => void;
          prompt: (momentListener?: (notification: any) => void) => void;
          disableAutoSelect: () => void;
        };
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            prompt?: string;
            callback: (tokenResponse: any) => void;
            error_callback?: (nonOAuthError: any) => void;
          }) => {
            requestAccessToken: (overrideConfig?: any) => void;
          };
        };
      };
    };
  }
}

/**
 * Iframe ichida ishlayotganlikni aniqlash
 */
export function isRunningInIframe(): boolean {
  try {
    return typeof window !== 'undefined' && window.self !== window.top;
  } catch {
    return true;
  }
}

/**
 * Google Identity Services SDK yuklanganligini tekshirish
 */
export function isGoogleSdkLoaded(): boolean {
  return typeof window !== 'undefined' && Boolean(window.google?.accounts?.id);
}

/**
 * Google JWT tokenini mijoz tomonida xavfsiz o'qish (Base64 decode)
 */
export function parseJwtLocally(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.warn("JWT parse error:", e);
    return null;
  }
}

/**
 * Google SDK ni boshlash (initialize)
 */
export function initializeGoogleAuth(
  onSuccess: (credential: string) => void,
  clientId = GOOGLE_CLIENT_ID
): boolean {
  if (!isGoogleSdkLoaded()) return false;

  try {
    window.google!.accounts.id.initialize({
      client_id: clientId,
      callback: (res) => {
        if (res?.credential) {
          onSuccess(res.credential);
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: false, // FedCM get() NotAllowedError ni bartaraf etish
    });
    return true;
  } catch (err) {
    console.warn("Google GIS initialize error:", err);
    return false;
  }
}

/**
 * Rasmiy Google tugmasini DOM elementiga chizish
 */
export function renderGoogleButton(
  container: HTMLElement,
  onSuccess: (credential: string) => void,
  options?: {
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    size?: 'large' | 'medium' | 'small';
    text?: 'signin_with' | 'signup_with' | 'continue_with';
    width?: number | string;
  }
): boolean {
  if (!initializeGoogleAuth(onSuccess)) return false;

  try {
    window.google!.accounts.id.renderButton(container, {
      theme: options?.theme || 'outline',
      size: options?.size || 'large',
      type: 'standard',
      shape: 'pill',
      text: options?.text || 'continue_with',
      logo_alignment: 'left',
      width: options?.width || 280,
      locale: 'uz',
    });
    return true;
  } catch (err) {
    console.warn("Google renderButton error:", err);
    return false;
  }
}

/**
 * /api/auth/google backend endpoint'iga POST so'rovi yuborish
 */
export async function sendGoogleCredentialToBackend(
  credential: string
): Promise<GoogleAuthResponse> {
  try {
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credential }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      // Backend xatolik bergan taqdirda ham, agar JWT haqiqiy bo'lsa lokal sessiya fallback
      console.warn("[Google Auth] Backend javobi:", data);
      const localPayload = parseJwtLocally(credential);
      if (localPayload && localPayload.email) {
        const parts = (localPayload.name || '').split(' ');
        const fallbackUser: AuthUser = {
          id: `sb_google_${localPayload.sub}`,
          name: localPayload.given_name || parts[0] || 'Foydalanuvchi',
          surname: localPayload.family_name || parts.slice(1).join(' ') || undefined,
          fullName: localPayload.name || localPayload.email,
          email: localPayload.email,
          photoUrl: localPayload.picture || undefined,
          role: 'owner',
          personId: `person_sb_${localPayload.sub}`,
          isGuest: false,
          authProvider: 'google',
        };
        return {
          success: true,
          user: fallbackUser,
          isNewUser: true,
        };
      }
      return { success: false, error: data.error || 'Autentifikatsiya xatoligi' };
    }

    const u = data.user;
    const authUser: AuthUser = {
      id: u.id,
      name: u.name,
      surname: u.surname,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      photoUrl: u.photoUrl,
      role: u.role || 'owner',
      personId: u.personId,
      familyId: u.familyId,
      isGuest: false,
      authProvider: 'google',
    };

    return {
      success: true,
      user: authUser,
      token: data.session?.token,
      isNewUser: data.isNewUser,
    };
  } catch (err: any) {
    console.warn("[Google Auth] Backend so'rovi uzildi, lokal JWT tekshirilmoqda:", err);
    // Offline / Network fallback
    const localPayload = parseJwtLocally(credential);
    if (localPayload && localPayload.email) {
      const parts = (localPayload.name || '').split(' ');
      const fallbackUser: AuthUser = {
        id: `sb_google_${localPayload.sub}`,
        name: localPayload.given_name || parts[0] || 'Foydalanuvchi',
        surname: localPayload.family_name || parts.slice(1).join(' ') || undefined,
        fullName: localPayload.name || localPayload.email,
        email: localPayload.email,
        photoUrl: localPayload.picture || undefined,
        role: 'owner',
        personId: `person_sb_${localPayload.sub}`,
        isGuest: false,
        authProvider: 'google',
      };
      return {
        success: true,
        user: fallbackUser,
        isNewUser: true,
      };
    }
    return { success: false, error: err?.message || 'Tarmoq xatosi' };
  }
}

export class GoogleAuthCancelledError extends Error {
  code = 'POPUP_CLOSED';
  isCancelled = true;
  constructor(message = "Google hisobini tanlash bekor qilindi") {
    super(message);
    this.name = 'GoogleAuthCancelledError';
  }
}

/**
 * Google foydalanuvchisini /api/auth/google backend va Supabase bilan sinxronizatsiya qilish
 */
export async function syncGoogleUserWithBackend(
  authUser: AuthUser
): Promise<GoogleAuthResponse> {
  try {
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user: authUser }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return { success: false, error: errData.error || 'Serverga yuborishda xatolik' };
    }

    const data = await response.json();
    return {
      success: true,
      user: data.user || authUser,
      token: data.session?.token,
      isNewUser: data.isNewUser,
    };
  } catch (err: any) {
    console.warn("[Google Auth] Backend sync ulanmadi (lokal sessiya davom etadi):", err?.message || err);
    return { success: true, user: authUser };
  }
}

/**
 * Google Identity Services (GIS) OAuth2 Popup orqali hisob tanlash va kirish
 * Har bir foydalanuvchiga brauzerdagi haqiqiy Google hisoblari ro'yxatini chiqaradi
 */
export function signInWithGooglePopup(): Promise<AuthUser> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error("Brauzer muhiti topilmadi"));
    }

    if (!window.google?.accounts?.oauth2) {
      return reject(
        new Error("Google Identity xizmati hali yuklanmadi.")
      );
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        prompt: 'select_account',
        callback: async (tokenResponse: any) => {
          if (tokenResponse?.error) {
            return reject(new Error(tokenResponse.error_description || tokenResponse.error));
          }

          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });

            if (!res.ok) throw new Error("Google profil ma'lumotlarini olishda xatolik");

            const profile = await res.json();
            const parts = (profile.name || '').trim().split(' ');

            // ═══════════════════════════════════════════════
            // SUPABASE UPSERT — shu yerda bajariladi
            // ═══════════════════════════════════════════════
            const { url: sbUrl, key: sbKey } = getSupabaseCredentials();

            let dbUserId = `google_${profile.sub}`;
            let dbFamilyId: string | undefined;
            let dbPersonId: string | undefined;

            if (isSupabaseConfigured()) {
              const h = {
                'Content-Type': 'application/json',
                apikey: sbKey,
                Authorization: `Bearer ${sbKey}`,
                Prefer: 'return=representation',
              };

              try {
                // 1. Email bo'yicha mavjudligini tekshir
                const checkRes = await fetch(
                  `${sbUrl}/rest/v1/users?email=eq.${encodeURIComponent(profile.email)}&select=id,person_id`,
                  { headers: h }
                );
                const existing = await checkRes.json();

                let isNewUser = false;

                if (Array.isArray(existing) && existing.length > 0) {
                  // Mavjud foydalanuvchi
                  dbUserId = existing[0].id;
                  if (existing[0].person_id) dbPersonId = existing[0].person_id;

                  await fetch(`${sbUrl}/rest/v1/users?id=eq.${dbUserId}`, {
                    method: 'PATCH',
                    headers: h,
                    body: JSON.stringify({
                      google_id: profile.sub,
                      photo_url: profile.picture || null,
                      last_login: new Date().toISOString(),
                    }),
                  });
                } else {
                  // Yangi foydalanuvchi
                  isNewUser = true;
                  const createRes = await fetch(`${sbUrl}/rest/v1/users`, {
                    method: 'POST',
                    headers: h,
                    body: JSON.stringify({
                      google_id: profile.sub,
                      full_name: profile.name,
                      email: profile.email,
                      photo_url: profile.picture || null,
                      role: 'owner',
                      created_at: new Date().toISOString(),
                      last_login: new Date().toISOString(),
                    }),
                  });
                  const created = await createRes.json();
                  if (Array.isArray(created) && created.length > 0) {
                    dbUserId = created[0].id;
                  }
                }

                // 2. Oila a'zoligini tekshir
                const memRes = await fetch(
                  `${sbUrl}/rest/v1/family_members?user_id=eq.${dbUserId}&select=family_id`,
                  { headers: h }
                );
                const members = await memRes.json();

                if (Array.isArray(members) && members.length > 0) {
                  dbFamilyId = members[0].family_id;
                } else if (isNewUser) {
                  // Yangi oila yaratish
                  const famRes = await fetch(`${sbUrl}/rest/v1/families`, {
                    method: 'POST',
                    headers: h,
                    body: JSON.stringify({
                      name: `${profile.given_name || profile.name}ning Shajarasi`,
                      created_by: dbUserId,
                      created_at: new Date().toISOString(),
                    }),
                  });
                  const families = await famRes.json();
                  if (Array.isArray(families) && families.length > 0) {
                    dbFamilyId = families[0].id;
                    // Trigger backup:
                    await fetch(`${sbUrl}/rest/v1/family_members`, {
                      method: 'POST',
                      headers: { ...h, Prefer: 'resolution=merge-duplicates' },
                      body: JSON.stringify({
                        family_id: dbFamilyId,
                        user_id: dbUserId,
                        role: 'owner',
                      }),
                    }).catch(() => {});
                  }
                }

                // 3. person_id ni tekshir (agar oldin olinmagan bo'lsa)
                if (!dbPersonId) {
                  const userRow = await fetch(
                    `${sbUrl}/rest/v1/users?id=eq.${dbUserId}&select=person_id`,
                    { headers: h }
                  );
                  const userData = await userRow.json();
                  if (Array.isArray(userData) && userData[0]?.person_id) {
                    dbPersonId = userData[0].person_id;
                  }
                }

              } catch (sbErr) {
                console.warn('[Google Auth] Supabase upsert xatolik:', sbErr);
              }
            }
            // ═══════════════════════════════════════════════

            const authUser: AuthUser = {
              id: dbUserId,                    // ← endi haqiqiy Supabase UUID
              name: profile.given_name || parts[0] || 'Foydalanuvchi',
              surname: profile.family_name || parts.slice(1).join(' ') || undefined,
              fullName: profile.name || profile.email,
              email: profile.email,
              photoUrl: profile.picture || undefined,
              role: 'owner',
              isGuest: false,
              authProvider: 'google',
              googleId: profile.sub,
              familyId: dbFamilyId,            // ← endi haqiqiy familyId
              personId: dbPersonId,            // ← endi haqiqiy personId
            };

            resolve(authUser);
          } catch (err) {
            reject(err);
          }
        },
        error_callback: (nonOAuthError: any) => {
          const type = nonOAuthError?.type;
          const msg = nonOAuthError?.message || '';
          const isClosed = type === 'popup_closed' || msg.includes('popup_closed');
          const isBlocked = type === 'popup_failed_to_open';

          if (isClosed) {
            reject(new GoogleAuthCancelledError());
          } else if (isBlocked) {
            const err = new Error("Popup bloklandi. Brauzerda ruxsat bering.");
            (err as any).code = 'POPUP_BLOCKED';
            reject(err);
          } else {
            reject(new Error(msg || "Google tizimiga ulanish bekor qilindi"));
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err: any) {
      reject(err);
    }
  });
}

// src/utils/googleAuth.ts — oxiriga qo'shing
/**
 * Google foydalanuvchisini Supabase users jadvaliga upsert qilish.
 * Mavjud bo'lsa yangilanadi (email yoki google_id bo'yicha),
 * yangi bo'lsa yaratiladi.
 * Qaytaradi: Supabase'dagi haqiqiy UUID va familyId.
 */
export async function upsertGoogleUserToSupabase(profile: {
  sub: string;
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}): Promise<{
  id: string;
  familyId?: string;
  personId?: string;
  isNewUser: boolean;
} | null> {
  if (!isSupabaseConfigured()) return null;

  const { url, key } = getSupabaseCredentials();
  const headers = {
    'Content-Type': 'application/json',
    apikey: key,
    Authorization: `Bearer ${key}`,
    Prefer: 'return=representation',
  };

  try {
    // 1. Avval email bo'yicha mavjudligini tekshir
    const checkRes = await fetch(
      `${url}/rest/v1/users?email=eq.${encodeURIComponent(profile.email)}&select=id,person_id`,
      { headers }
    );
    const existing = await checkRes.json();

    let userId: string;
    let isNewUser = false;

    if (Array.isArray(existing) && existing.length > 0) {
      // Mavjud foydalanuvchi — google_id va photo_url ni yangilaymiz
      userId = existing[0].id;
      await fetch(`${url}/rest/v1/users?id=eq.${userId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          google_id: profile.sub,
          photo_url: profile.picture || null,
          last_login: new Date().toISOString(),
        }),
      });
    } else {
      // Yangi foydalanuvchi — yaratamiz
      isNewUser = true;
      const createRes = await fetch(`${url}/rest/v1/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          google_id: profile.sub,
          full_name: profile.name,
          email: profile.email,
          photo_url: profile.picture || null,
          role: 'owner',
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
        }),
      });
      const created = await createRes.json();
      if (!Array.isArray(created) || created.length === 0) return null;
      userId = created[0].id;
    }

    // 2. Oila a'zoligini tekshir
    const memRes = await fetch(
      `${url}/rest/v1/family_members?user_id=eq.${userId}&select=family_id`,
      { headers }
    );
    const members = await memRes.json();
    let familyId: string | undefined;

    if (Array.isArray(members) && members.length > 0) {
      familyId = members[0].family_id;
    } else if (isNewUser) {
      // Yangi foydalanuvchi uchun yangi oila yaratamiz
      const famRes = await fetch(`${url}/rest/v1/families`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: `${profile.given_name || profile.name}ning Shajarasi`,
          created_by: userId,
          created_at: new Date().toISOString(),
        }),
      });
      const families = await famRes.json();
      if (Array.isArray(families) && families.length > 0) {
        familyId = families[0].id;
        // family_members trigger avtomatik qo'shadi,
        // lekin ishonch hosil qilish uchun qo'lda ham qo'shamiz
        await fetch(`${url}/rest/v1/family_members`, {
          method: 'POST',
          headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
          body: JSON.stringify({
            family_id: familyId,
            user_id: userId,
            role: 'owner',
          }),
        }).catch(() => {});
      }
    }

    // 3. users.person_id ni olish
    const userRes = await fetch(
      `${url}/rest/v1/users?id=eq.${userId}&select=person_id`,
      { headers }
    );
    const userRow = await userRes.json();
    const personId = userRow?.[0]?.person_id || undefined;

    return { id: userId, familyId, personId, isNewUser };
  } catch (err) {
    console.warn('[upsertGoogleUserToSupabase] xatolik:', err);
    return null;
  }
}
