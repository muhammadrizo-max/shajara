import { TelegramWebUser } from '../types';
import { loginWithTelegram } from './userAuthStorage';
import { addHistoryRecord } from './historyStorage';

export interface TelegramAuthStatus {
  isAvailable: boolean;
  isInsideTelegram: boolean;
  user: TelegramWebUser | null;
  startParam?: string;
  themeColorScheme?: 'light' | 'dark';
}

/**
 * Brauzerda yoki Telegram WebApp ichida ekanligini aniqlash
 */
export function getTelegramWebAppStatus(): TelegramAuthStatus {
  if (typeof window === 'undefined') {
    return {
      isAvailable: false,
      isInsideTelegram: false,
      user: null,
    };
  }

  const tg = window.Telegram?.WebApp;
  const isAvailable = Boolean(tg);
  const unsafeData = tg?.initDataUnsafe;
  const user = unsafeData?.user || null;
  const isInsideTelegram = Boolean(user && user.id);
  const startParam = unsafeData?.start_param;

  return {
    isAvailable,
    isInsideTelegram,
    user,
    startParam,
    themeColorScheme: tg?.colorScheme,
  };
}

/**
 * Telegram WebApp'ni ishga tushirish (ready & expand)
 */
export function initTelegramWebApp(onAutoLogin?: (user: TelegramWebUser) => void): boolean {
  if (typeof window === 'undefined') return false;

  const tg = window.Telegram?.WebApp;
  if (!tg) return false;

  try {
    tg.ready();
    tg.expand();

    // Telegram rang mavzusini qo'llash
    if (tg.themeParams?.bg_color) {
      document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color);
    }

    const tgUser = tg.initDataUnsafe?.user;
    if (tgUser && tgUser.id) {
      // Telegram ichida ochilgan! Avtomatik tizimga kiritamiz
      const startParam = tg.initDataUnsafe?.start_param;
      const result = loginWithTelegram(tgUser, startParam);

      if (result.success) {
        addHistoryRecord({
          action: 'telegram_connect',
          actorName: result.user.fullName,
          title: "Telegram orqali tizimga ulanildi",
          description: `Telegram WebApp orqali ${result.isNew ? "ro'yxatdan o'tdi" : "tizimga kirdi"} (@${tgUser.username || tgUser.id})`,
          details: `Telegram ID: ${tgUser.id}`
        });
        if (onAutoLogin) {
          onAutoLogin(tgUser);
        }
      }
      return true;
    }
  } catch (err) {
    console.error("Telegram WebApp initialization error:", err);
  }

  return false;
}

/**
 * Telegram Bot havolasini ochish
 */
export function openTelegramBot(botUsername: string = 'shajarachi_bot', startParam?: string): void {
  const param = startParam ? `?start=${startParam}` : '';
  const url = `https://t.me/${botUsername}${param}`;

  if (window.Telegram?.WebApp?.openTelegramLink) {
    window.Telegram.WebApp.openTelegramLink(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
