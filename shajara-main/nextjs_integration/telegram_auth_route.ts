/**
 * Next.js (App Router) uchun Telegram Auth API Marshruti
 * Joylashuvi: app/api/auth/telegram/route.ts
 * 
 * Ushbu API:
 * 1. Telegram orqali yuborilgan ma'lumotlarni (hash, id, first_name, username) Bot Token orqali HMAC-SHA256 bilan tekshiradi.
 * 2. Supabase bazasidagi `users` jadvaliga telegram_id orqali yozadi (Upsert).
 * 3. Foydalanuvchiga xavfsiz JWT sessiya Cookieni o'rnatadi.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Telegram ma'lumotlarining haqiqiyligini tekshirish (Telegram rasmiy kriptografik tekshiruvi)
 */
function verifyTelegramAuthData(data: Record<string, any>, botToken: string): boolean {
  const { hash, ...dataToCheck } = data;
  if (!hash) return false;

  // Kalitlarni alifbo tartibida saralash
  const checkString = Object.keys(dataToCheck)
    .sort()
    .map(key => `${key}=${dataToCheck[key]}`)
    .join('\n');

  // SHA256(botToken)
  const secretKey = crypto.createHash('sha256').update(botToken).digest();

  // HMAC-SHA256(checkString, secretKey)
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex');

  return calculatedHash === hash;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, first_name, last_name, username, photo_url, auth_date, hash, start_param } = body;

    // 1. Kriptografik xavfsizlik tekshiruvi
    if (BOT_TOKEN) {
      const isValid = verifyTelegramAuthData(body, BOT_TOKEN);
      if (!isValid) {
        return NextResponse.json({ error: "Telegram ma'lumotlari haqiqiy emas (Hash mismatch)" }, { status: 401 });
      }
    }

    const fullName = [first_name, last_name].filter(Boolean).join(' ') || `Telegram User (${id})`;

    // 2. Supabase `users` jadvaliga yozish / yangilash (Upsert)
    const { data: user, error: dbError } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          telegram_id: id,
          full_name: fullName,
          username: username || null,
          photo_url: photo_url || null,
          last_login: new Date().toISOString(),
        },
        { onConflict: 'telegram_id' }
      )
      .select()
      .single();

    if (dbError) {
      console.error("Supabase user upsert error:", dbError);
      return NextResponse.json({ error: "Bazaga yozishda xatolik" }, { status: 500 });
    }

    // 3. Agar invite_ bilan kelgan bo'lsa, oilaga bog'lash
    if (start_param && start_param.startsWith('invite_')) {
      const inviterId = start_param.replace('invite_', '');
      const { data: inviter } = await supabaseAdmin
        .from('family_members')
        .select('family_id')
        .eq('user_id', inviterId)
        .single();

      if (inviter && inviter.family_id) {
        await supabaseAdmin.from('family_members').upsert({
          family_id: inviter.family_id,
          user_id: user.id,
          role: 'editor',
        });
      }
    }

    // 4. JWT yoki Sessiya Cookie o'rnatish
    const sessionToken = Buffer.from(JSON.stringify({ userId: user.id, telegramId: id, fullName })).toString('base64');

    const res = NextResponse.json({
      success: true,
      user,
      message: "Telegram orqali muvaffaqiyatli tizimga kirildi",
    });

    res.cookies.set('shajara_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 kun
      path: '/',
    });

    return res;
  } catch (error: any) {
    console.error("Auth route error:", error);
    return NextResponse.json({ error: error.message || "Ichki xatolik" }, { status: 500 });
  }
}
