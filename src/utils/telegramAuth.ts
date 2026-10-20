import { TelegramWebUser } from '../types';
import { addHistoryRecord } from './historyStorage';
import { loadUserDataFromSupabase, DbLoadResult } from './supabaseDb';

export interface TelegramAuthStatus {
  isAvailable: boolean;
  isInsideTelegram: boolean;
  user: TelegramWebUser | null;
  startParam?: string;
  themeColorScheme?: 'light' | 'dark';
}

export function getTelegramWebAppStatus(): TelegramAuthStatus {
  if (typeof window === 'undefined') {
    return { isAvailable: false, isInsideTelegram: false, user: null };
  }
  const tg = window.Telegram?.WebApp;
  const isAvailable = Boolean(tg);
  const unsafeData = tg?.initDataUnsafe;
  const user = unsafeData?.user || null;
  return {
    isAvailable,
    isInsideTelegram: Boolean(user?.id),
    user,
    startParam: unsafeData?.start_param,
    themeColorScheme: tg?.colorScheme,
  };
}

/**
 * Telegram WebApp ni ishga tushirish.
 * Agar foydalanuvchi Telegram ichida bo'lsa:
 *   1. Supabase'dan uning persons va family ma'lumotlarini yuklaydi.
 *   2. onDbLoaded callback orqali App.tsx ga uzatadi.
 *   3. Agar bazada topilmasa (hali botda ro'yxatdan o'tmagan),
 *      onNotRegistered callback ishlaydi — foydalanuvchiga bot havolasini ko'rsatish kerak.
 */
export function initTelegramWebApp(
  onAutoLogin?: (user: TelegramWebUser) => void,
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

    const tgUser = tg.initDataUnsafe?.user;
    if (!tgUser?.id) return false;

    // Avval onAutoLogin ni chaqirib, UI ni bloklarsiz ko'rsatamiz
    if (onAutoLogin) onAutoLogin(tgUser);

    // Keyin Supabase'dan ma'lumot yuklaymiz (async)
    loadUserDataFromSupabase(tgUser.id).then((result) => {
      if (result.success && onDbLoaded) {
        addHistoryRecord({
          action: 'telegram_connect',
          actorName: result.authUser?.fullName || '',
          title: 'Telegram orqali tizimga ulanildi',
          description: `Supabase'dan shajara ma'lumotlari yuklandi`,
          details: `Telegram ID: ${tgUser.id}`,
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

export function openTelegramBot(botUsername: string = 'shajarachibot', startParam?: string): void {
  const param = startParam ? `?start=${startParam}` : '';
  const url = `https://t.me/${botUsername}${param}`;
  if (window.Telegram?.WebApp?.openTelegramLink) {
    window.Telegram.WebApp.openTelegramLink(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
