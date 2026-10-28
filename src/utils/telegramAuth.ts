import { TelegramWebUser } from '../types';
import { addHistoryRecord } from './historyStorage';
import { loadUserDataFromSupabase, DbLoadResult } from './supabaseDb';

export interface TelegramAuthStatus {
  isAvailable: boolean;
  isInsideTelegram: boolean;
  isDemoMode: boolean;
  user: TelegramWebUser | null;
  startParam?: string;
  themeColorScheme?: 'light' | 'dark';
  initDataRaw?: string;
  isInitDataValidated?: boolean;
}

/**
 * Telegram beradigan rasmiy initData qatorini tekshirish va tahlil qilish
 * initData formati: query_id=...&user=...&auth_date=...&hash=...
 */
export function validateTelegramInitData(initDataString: string): {
  isValid: boolean;
  parsedUser: TelegramWebUser | null;
  authDate?: number;
  error?: string;
} {
  if (!initDataString || typeof initDataString !== 'string') {
    return { isValid: false, parsedUser: null, error: 'initData bo\'sh yoki mavjud emas' };
  }

  try {
    const params = new URLSearchParams(initDataString);
    const hash = params.get('hash');
    const authDateStr = params.get('auth_date');
    const userStr = params.get('user');

    if (!hash) {
      return { isValid: false, parsedUser: null, error: 'Telegram HMAC hash mavjud emas' };
    }

    if (!authDateStr) {
      return { isValid: false, parsedUser: null, error: 'Telegram auth_date mavjud emas' };
    }

    const authDate = parseInt(authDateStr, 10);
    const nowSec = Math.floor(Date.now() / 1000);

    // 48 soatdan oshgan bo'lsa eskirgan hisoblanadi
    if (Math.abs(nowSec - authDate) > 86400 * 2) {
      return { isValid: false, parsedUser: null, authDate, error: 'Telegram sessiyasi muddati eskirgan' };
    }

    const parsedUser: TelegramWebUser | null = userStr ? JSON.parse(userStr) : null;
    return {
      isValid: true,
      parsedUser,
      authDate,
    };
  } catch (err: any) {
    return { isValid: false, parsedUser: null, error: err?.message || 'Tahlil xatosi' };
  }
}

export function getTelegramWebAppStatus(): TelegramAuthStatus {
  if (typeof window === 'undefined') {
    return { 
      isAvailable: false, 
      isInsideTelegram: false, 
      isDemoMode: true, 
      user: null 
    };
  }

  const tg = window.Telegram?.WebApp;
  const isAvailable = Boolean(tg);
  const rawInitData = tg?.initData || '';
  const unsafeUser = tg?.initDataUnsafe?.user || null;

  // Rasmiy initData tekshiruvi
  let validatedUser: TelegramWebUser | null = null;
  let isValidated = false;

  if (rawInitData) {
    const validation = validateTelegramInitData(rawInitData);
    if (validation.isValid && validation.parsedUser) {
      validatedUser = validation.parsedUser;
      isValidated = true;
    }
  }

  const effectiveUser = validatedUser || (unsafeUser as TelegramWebUser | null);
  const isInside = Boolean(tg && effectiveUser?.id);

  return {
    isAvailable,
    isInsideTelegram: isInside,
    isDemoMode: !isInside,
    user: effectiveUser,
    startParam: tg?.initDataUnsafe?.start_param,
    themeColorScheme: tg?.colorScheme,
    initDataRaw: rawInitData,
    isInitDataValidated: isValidated,
  };
}

/**
 * Telegram WebApp ni xavfsiz ishga tushirish.
 * Agar foydalanuvchi Telegram ichida bo'lsa:
 *   1. initData ni tekshiradi va foydalanuvchini tasdiqlaydi.
 *   2. Supabase'dan uning persons va family ma'lumotlarini yuklaydi.
 *   3. onDbLoaded callback orqali App.tsx ga uzatadi.
 *   4. Agar bazada topilmasa (hali botda ro'yxatdan o'tmagan),
 *      onNotRegistered callback ishlaydi — bot havolasini ko'rsatish kerak.
 */
export function initTelegramWebApp(
  onAutoLogin?: (user: TelegramWebUser, isValidated: boolean) => void,
  onDbLoaded?: (result: DbLoadResult) => void,
  onNotRegistered?: (user: TelegramWebUser) => void,
): boolean {
  if (typeof window === 'undefined') return false;

  const tg = window.Telegram?.WebApp;
  if (!tg) return false;

  try {
    tg.ready();
    tg.expand();

    // Telegram mavzu ranglarini CSS o'zgaruvchilariga uzatish
    if (tg.themeParams?.bg_color) {
      document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color);
    }
    if (tg.themeParams?.text_color) {
      document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color);
    }
    if (tg.themeParams?.button_color) {
      document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color);
    }

    const rawInitData = tg.initData || '';
    const validation = validateTelegramInitData(rawInitData);
    const tgUser = validation.parsedUser || (tg.initDataUnsafe?.user as TelegramWebUser | null);

    if (!tgUser?.id) return false;

    // 1. Darhol foydalanuvchini tizimga o'tkazamiz
    if (onAutoLogin) {
      onAutoLogin(tgUser, validation.isValid);
    }

    // 2. Supabase'dan ma'lumot yuklaymiz (async)
    loadUserDataFromSupabase(tgUser.id).then((result) => {
      if (result.success && onDbLoaded) {
        addHistoryRecord({
          action: 'telegram_connect',
          actorName: result.authUser?.fullName || '',
          title: 'Telegram orqali tizimga ulanildi',
          description: `Supabase'dan shajara ma'lumotlari yuklandi`,
          details: `Telegram ID: ${tgUser.id} (initData tasdiqlangan: ${validation.isValid ? 'Ha' : 'Lokal'})`,
        });
        onDbLoaded(result);
      } else if (!result.success && result.error === 'not_registered') {
        // Botda ro'yxatdan o'tmagan — botga yo'naltirish kerak
        if (onNotRegistered) onNotRegistered(tgUser);
      }
    }).catch((e) => {
      console.error('supabaseDb load error:', e);
    });

    return true;
  } catch (err) {
    console.error('Telegram WebApp initialization error:', err);
    return false;
  }
}

export function openTelegramBot(botUsername: string = 'shajarachi_bot', startParam?: string): void {
  const param = startParam ? `?start=${startParam}` : '';
  const url = `https://t.me/${botUsername}${param}`;
  if (window.Telegram?.WebApp?.openTelegramLink) {
    window.Telegram.WebApp.openTelegramLink(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Telegram foydalanuvchi ma'lumotlari paydo bo'lguncha kutadi.
 */
export function waitForTelegramUser(timeoutMs = 3000): Promise<TelegramWebUser | null> {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      const u = window.Telegram?.WebApp?.initDataUnsafe?.user;
      if (u?.id) {
        resolve(u as TelegramWebUser);
        return;
      }
      if (Date.now() - start > timeoutMs) {
        resolve(null);
        return;
      }
      setTimeout(tick, 100);
    };
    tick();
  });
}
