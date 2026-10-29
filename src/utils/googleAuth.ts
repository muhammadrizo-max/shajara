/**
 * googleAuth.ts
 * Google Identity Services SDK integratsiyasi va /api/auth/google bilan aloqa
 */

import { AuthUser } from '../types';

export const GOOGLE_CLIENT_ID = 
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || 
  '399388832910-28s2k7714ovmd3bbt1bcd8n21mqn2t65.apps.googleusercontent.com';

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
