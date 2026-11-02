import React, { useState } from 'react';
import { X, Send, Mail, MessageSquare, CheckCircle2, AlertCircle, Sparkles, Bot, Phone } from 'lucide-react';
import { sendContactMessage } from '../utils/contactService';
import { AuthUser } from '../types';

interface ContactFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: AuthUser | null;
  onSuccessToast?: (msg: string) => void;
}

export const ContactFeedbackModal: React.FC<ContactFeedbackModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccessToast,
}) => {
  const [category, setCategory] = useState<'suggestion' | 'bug' | 'question' | 'collaboration'>('suggestion');
  const [contactInfo, setContactInfo] = useState<string>(
    currentUser?.phone || currentUser?.email || (currentUser?.telegramUsername ? `@${currentUser.telegramUsername}` : '')
  );
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!contactInfo.trim()) {
      setError("Iltimos, Telegram yoki telefon raqamingizni kiriting");
      return;
    }
    if (!message.trim() || message.trim().length < 5) {
      setError("Iltimos, xabaringizni to'liqroq yozing (kamida 5 ta belgi)");
      return;
    }

    setIsSubmitting(true);
    try {
      const categoryTitles = {
        suggestion: "💡 Taklif / Yangi g'oya",
        bug: "🐞 Xatolik haqida xabar",
        question: "❓ Savol / Yordam",
        collaboration: "🤝 Hamkorlik / Loyiha",
      };

      const fullMessage = `[Mavzu: ${categoryTitles[category]}]\n\n${message.trim()}`;

      const res = await sendContactMessage({
        contactInfo: contactInfo.trim(),
        email: contactInfo.includes('@') ? contactInfo.trim() : undefined,
        message: fullMessage,
        senderName: currentUser?.fullName || currentUser?.name || 'Foydalanuvchi',
      });

      if (res.success) {
        setIsSuccess(true);
        if (onSuccessToast) {
          onSuccessToast("Taklifingiz admin@shajarachi.uz va Telegram bot adminga yetkazildi!");
        }
      } else {
        setError(res.message || "Xabarni yuborishda xatolik yuz berdi");
      }
    } catch (err: any) {
      setError(err?.message || "Tarmoq xatosi, qayta urinib ko'ring");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setMessage('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="fixed inset-0"
        onClick={handleResetAndClose}
      />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Send className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black leading-tight text-white">
                Taklif va So'rov Yuborish
              </h3>
              <p className="text-[11px] text-emerald-100">
                To'g'ridan-to'g'ri admin@shajarachi.uz va Telegram adminga boradi
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-xl bg-black/20 hover:bg-black/40 text-white transition cursor-pointer"
            title="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[85vh]">
          {isSuccess ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Murojaatingiz qabul qilindi!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Taklifingiz rasmiy <strong>admin@shajarachi.uz</strong> pochta qutisiga va Telegram adminimizga muvaffaqiyatli yetkazildi. Rahmat!
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition cursor-pointer"
                >
                  Oynani yopish
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Category selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Murojaat turi:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setCategory('suggestion')}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition cursor-pointer flex items-center gap-2 ${
                      category === 'suggestion'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>💡</span>
                    <span>Taklif / Fikr</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory('bug')}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition cursor-pointer flex items-center gap-2 ${
                      category === 'bug'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>🐞</span>
                    <span>Xatolik haqida</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory('question')}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition cursor-pointer flex items-center gap-2 ${
                      category === 'question'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>❓</span>
                    <span>Savol / Yordam</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory('collaboration')}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition cursor-pointer flex items-center gap-2 ${
                      category === 'collaboration'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>🤝</span>
                    <span>Hamkorlik</span>
                  </button>
                </div>
              </div>

              {/* Contact info input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Telegram username yoki Telefon raqam</span>
                  <span className="text-[10px] text-slate-400 font-normal">Javob qaytarishimiz uchun</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="@username yoki +998 90 123 45 67"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Xabaringiz / Fikringiz:
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Shajara bo'yicha taklifingiz, savolingiz yoki xatolik haqida batafsil yozing..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                />
              </div>

              {/* Destination badge */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Qabul qiluvchi:</span>
                  <strong className="text-slate-700 dark:text-slate-200">admin@shajarachi.uz</strong>
                </div>
                <div className="flex items-center gap-1 text-[#24A1DE]">
                  <Bot className="w-3.5 h-3.5" />
                  <span>@shajarachi_bot</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Yuborilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Xabarni yuborish</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
