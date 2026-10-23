'use client';

import React, { useEffect, useState } from 'react';

interface TelegramAuthButtonProps {
  botUsername?: string;
  onSuccess?: (user: any) => void;
  className?: string;
}

/**
 * Next.js va React uchun Telegram orqali kirish (TWA va Web Login) tugmasi
 */
export const TelegramAuthButton: React.FC<TelegramAuthButtonProps> = ({
  botUsername = 'shajarachi_bot',
  onSuccess,
  className = '',
}) => {
  const [isTelegramWeb, setIsTelegramWeb] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. Agar foydalanuvchi Telegram ilovasi ichida bo'lsa (Telegram WebApp):
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.expand();
      const user = tg.initDataUnsafe?.user;
      if (user) {
        setIsTelegramWeb(true);
        // Avtomatik login API ga so'rov yuborish
        handleAutoLogin(tg.initDataUnsafe);
      }
    }
  }, []);

  const handleAutoLogin = async (initDataUnsafe: any) => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...initDataUnsafe.user,
          start_param: initDataUnsafe.start_param,
          auth_date: initDataUnsafe.auth_date,
          hash: initDataUnsafe.hash,
        }),
      });
      const data = await res.json();
      if (data.success && onSuccess) {
        onSuccess(data.user);
      }
    } catch (err) {
      console.error("Auto login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBot = () => {
    window.open(`https://t.me/${botUsername}`, '_blank');
  };

  return (
    <button
      onClick={handleOpenBot}
      disabled={loading}
      className={`flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#24A1DE] hover:bg-[#1E8BC0] text-white font-medium shadow-sm transition active:scale-95 ${className}`}
    >
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.99 1.27-5.61 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.89.03-.25.38-.51 1.05-.78 4.12-1.79 6.87-2.97 8.25-3.54 3.92-1.63 4.74-1.91 5.27-1.92.12 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.19-.04.34z" />
      </svg>
      {loading ? "Kirilmoqda..." : "Telegram orqali kirish"}
    </button>
  );
};
