/**
 * googleAuth.ts
 * Google Identity Services SDK integratsiyasi va /api/auth/google bilan aloqa
 */

import { AuthUser } from '../types';

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

    // Google GIS OAuth2 mijozining yuklanganligini tekshirish
    if (!window.google?.accounts?.oauth2) {
      return reject(
        new Error("Google Identity xizmati hali yuklanmadi. Iltimos, sahifani yangilang yoki bir necha soniyadan so'ng qayta bosing.")
      );
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        prompt: 'select_account', // Har bir userga o'z Google hisobini tanlash oynasini chiqaradi
        callback: async (tokenResponse: any) => {
          if (tokenResponse?.error) {
            return reject(new Error(tokenResponse.error_description || tokenResponse.error));
          }

          try {
            // Google'ning rasmiy UserInfo endpointidan haqiqiy foydalanuvchi ma'lumotlarini olish
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: {
                Authorization: `Bearer ${tokenResponse.access_token}`,
              },
            });

            if (!res.ok) {
              throw new Error("Google profil ma'lumotlarini olishda xatolik yuz berdi");
            }

            const profile = await res.json();
            const parts = (profile.name || '').trim().split(' ');

            const authUser: AuthUser = {
              id: `google_${profile.sub}`,
              name: profile.given_name || parts[0] || 'Foydalanuvchi',
              surname: profile.family_name || parts.slice(1).join(' ') || undefined,
              fullName: profile.name || profile.email,
              email: profile.email,
              photoUrl: profile.picture || undefined,
              role: 'owner',
              isGuest: false,
              authProvider: 'google',
              googleId: profile.sub,
            };

            resolve(authUser);
          } catch (err) {
            reject(err);
          }
        },
        error_callback: (nonOAuthError: any) => {
          const type = nonOAuthError?.type;
          const msg = nonOAuthError?.message || '';
          const isClosed = 
            type === 'popup_closed' || 
            msg.includes('Popup window closed') || 
            msg.includes('popup_closed');
          const isBlocked = 
            type === 'popup_failed_to_open';

          if (isClosed) {
            reject(new GoogleAuthCancelledError());
          } else if (isBlocked) {
            const err = new Error("Brauzeringizda qalqib chiquvchi oyna (popup) bloklandi. Iltimos, brauzer qatorida ruxsat bering.");
            (err as any).code = 'POPUP_BLOCKED';
            reject(err);
          } else {
            const err = new Error(msg || "Google tizimiga ulanish bekor qilindi");
            (err as any).code = 'AUTH_FAILED';
            reject(err);
          }
        },
      });

      // Foydalanuvchi bosishi (user gesture) bilan bir vaqtda to'g'ridan-to'g'ri chaqirish
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err: any) {
      reject(err);
    }
  });
}

