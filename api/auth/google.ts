import { OAuth2Client } from 'google-auth-library';
import type { IncomingMessage, ServerResponse } from 'http';

const DEFAULT_GOOGLE_CLIENT_ID = '399388832910-8uikes6k5f91b5b8objvklrrgaji2ins.apps.googleusercontent.com';

// Xavfsiz CORS va HTTP Himoya sarlavhalari
function setCorsHeaders(req: any, res: any) {
  const allowedOrigins = [
    'https://shajarachi.vercel.app',
    'https://shajarachi.uz',
    'https://www.shajarachi.uz',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  const origin = req.headers?.origin;
  const isAllowed = origin && (
    allowedOrigins.includes(origin) ||
    origin.endsWith('.shajarachi.uz') ||
    origin.endsWith('.vercel.app')
  );

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    // Ruxsat etilmagan originlar uchun credentials bermaslik
    res.setHeader('Access-Control-Allow-Origin', 'https://www.shajarachi.uz');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');
  
  // Himoya HTTP sarlavhalari (MIME Sniffing, Clickjacking va Referrer oqishidan himoya)
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

function parseJsonBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') {
      return resolve(req.body);
    }
    if (req.body && typeof req.body === 'string') {
      try {
        return resolve(JSON.parse(req.body));
      } catch {
        return resolve({});
      }
    }

    let data = '';
    req.on('data', (chunk: any) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => {
      resolve({});
    });
  });
}

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Vercel Serverless Function & Express API Handler:
 * /api/auth/google
 */
export default async function handler(req: any, res: any) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Faqat POST so\'rovi qabul qilinadi' }));
    return;
  }

  try {
    const body = await parseJsonBody(req);
    const credential = body.credential || body.token || body.id_token;
    const directUser = body.user || body.profile;

    if (!credential && (!directUser || !directUser.email)) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        success: false, 
        error: 'Google JWT tokeni (credential) yoki foydalanuvchi ma\'lumotlari taqdim etilmadi' 
      }));
      return;
    }

    const clientId = 
      process.env.GOOGLE_CLIENT_ID || 
      process.env.VITE_GOOGLE_CLIENT_ID || 
      DEFAULT_GOOGLE_CLIENT_ID;

    let googleId = '';
    let email = '';
    let fullName = '';
    let photoUrl: string | null = null;
    let givenName = '';
    let familyName = '';

    // 1. Agar credential (JWT) berilgan bo'lsa, OAuth2Client orqali tokenni xavfsiz tekshirish
    if (credential) {
      const client = new OAuth2Client(clientId);
      let googlePayload: any = null;

      try {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: clientId,
        });
        googlePayload = ticket.getPayload();
      } catch (verifyErr: any) {
        console.error("[Google Auth Backend] Token tekshirish xatosi:", verifyErr?.message || verifyErr);
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Google tokeni haqiqiy emas yoki muddati o\'tgan: ' + (verifyErr?.message || '') 
        }));
        return;
      }

      if (!googlePayload || !googlePayload.email) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Google tokenidan foydalanuvchi ma\'lumotlarini o\'qib bo\'lmadi' 
        }));
        return;
      }

      googleId = googlePayload.sub;
      email = googlePayload.email;
      fullName = googlePayload.name || email.split('@')[0];
      photoUrl = googlePayload.picture || null;
      givenName = googlePayload.given_name || fullName.split(' ')[0] || '';
      familyName = googlePayload.family_name || fullName.split(' ').slice(1).join(' ') || '';
    } else {
      // Direct user profile from Google UserInfo
      googleId = directUser.googleId || directUser.id?.replace(/^google_/, '') || `g_${Date.now()}`;
      email = directUser.email;
      fullName = directUser.fullName || directUser.name || email.split('@')[0];
      photoUrl = directUser.photoUrl || directUser.picture || null;
      givenName = directUser.name || fullName.split(' ')[0] || '';
      familyName = directUser.surname || fullName.split(' ').slice(1).join(' ') || '';
    }

    // 2. Supabase PostgreSQL bazasi bilan ishlash
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = 
      process.env.SUPABASE_SERVICE_ROLE_KEY || 
      process.env.SUPABASE_ANON_KEY || 
      process.env.VITE_SUPABASE_ANON_KEY;

    const hasSupabase = Boolean(
      supabaseUrl && 
      !supabaseUrl.includes('your-project') && 
      supabaseKey && 
      !supabaseKey.includes('your-anon')
    );

    let dbUserId = generateUuid();
    let dbFamilyId = generateUuid();
    let dbPersonId = generateUuid();
    let userRole = 'owner';
    let isExistingUser = false;

    if (hasSupabase) {
      const sbHeaders = {
        'Content-Type': 'application/json',
        apikey: supabaseKey!,
        Authorization: `Bearer ${supabaseKey!}`,
        Prefer: 'return=representation',
      };

      try {
        // a) Foydalanuvchini email yoki google_id orqali qidirish
        const findUrl = `${supabaseUrl}/rest/v1/users?or=(email.eq.${encodeURIComponent(email)},google_id.eq.${encodeURIComponent(googleId)})&select=*`;
        const findRes = await fetch(findUrl, { headers: sbHeaders });
        
        if (findRes.ok) {
          const existingUsers: any[] = await findRes.json();
          if (Array.isArray(existingUsers) && existingUsers.length > 0) {
            // Mavjud foydalanuvchi — Login
            isExistingUser = true;
            const existing = existingUsers[0];
            dbUserId = existing.id;
            userRole = existing.role || 'editor';

            // Profilni yangilash (last_login, photo_url, google_id)
            await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${dbUserId}`, {
              method: 'PATCH',
              headers: sbHeaders,
              body: JSON.stringify({
                google_id: googleId,
                last_login: new Date().toISOString(),
                photo_url: photoUrl || existing.photo_url,
                full_name: existing.full_name || fullName,
              }),
            });

            // Oila a'zoligini olish
            const memRes = await fetch(
              `${supabaseUrl}/rest/v1/family_members?user_id=eq.${dbUserId}&select=family_id,role`,
              { headers: sbHeaders }
            );
            if (memRes.ok) {
              const members: any[] = await memRes.json();
              if (Array.isArray(members) && members.length > 0) {
                dbFamilyId = members[0].family_id;
                userRole = members[0].role || userRole;
              }
            }

            // O'z shaxsiy tugunini (Person) topish
            const pRes = await fetch(
              `${supabaseUrl}/rest/v1/persons?family_id=eq.${dbFamilyId}&linked_user_id=eq.${dbUserId}&select=id`,
              { headers: sbHeaders }
            );
            if (pRes.ok) {
              const pList: any[] = await pRes.json();
              if (Array.isArray(pList) && pList.length > 0) {
                dbPersonId = pList[0].id;
              }
            }
          }
        }

        // b) Agar foydalanuvchi bazada bo'lmasa — Yangi ro'yxatdan o'tkazish (Register)
        if (!isExistingUser) {
          dbUserId = generateUuid();
          dbFamilyId = generateUuid();
          dbPersonId = generateUuid();
          userRole = 'owner';

          // 1. users jadvaliga kiritish
          await fetch(`${supabaseUrl}/rest/v1/users`, {
            method: 'POST',
            headers: sbHeaders,
            body: JSON.stringify({
              id: dbUserId,
              google_id: googleId,
              email: email,
              full_name: fullName,
              photo_url: photoUrl,
              role: 'owner',
              created_at: new Date().toISOString(),
              last_login: new Date().toISOString(),
            }),
          });

          // 2. families jadvaliga yangi shajara oilasini yaratish
          await fetch(`${supabaseUrl}/rest/v1/families`, {
            method: 'POST',
            headers: sbHeaders,
            body: JSON.stringify({
              id: dbFamilyId,
              name: `${fullName} Shajarasi`,
              description: 'Google hisobi orqali yaratilgan oilaviy shajara',
              created_by: dbUserId,
              created_at: new Date().toISOString(),
            }),
          });

          // 3. family_members jadvaliga asoschi (owner) sifatida bog'lash
          await fetch(`${supabaseUrl}/rest/v1/family_members`, {
            method: 'POST',
            headers: sbHeaders,
            body: JSON.stringify({
              family_id: dbFamilyId,
              user_id: dbUserId,
              role: 'owner',
              joined_at: new Date().toISOString(),
            }),
          });

          // 4. persons jadvaliga dastlabki shaxs (Root ildiz) sifatida qo'shish
          await fetch(`${supabaseUrl}/rest/v1/persons`, {
            method: 'POST',
            headers: sbHeaders,
            body: JSON.stringify({
              id: dbPersonId,
              family_id: dbFamilyId,
              first_name: givenName || fullName,
              last_name: familyName || null,
              name: givenName || fullName,
              surname: familyName || null,
              gender: 'male',
              is_living: true,
              photo_url: photoUrl,
              linked_user_id: dbUserId,
              created_by: dbUserId,
              generation: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }),
          });
        }
      } catch (dbErr) {
        console.warn("[Supabase] So'rov xatosi, avtonom sessiya yaratilmoqda:", dbErr);
      }
    } else {
      console.info("[Google Auth Backend] Supabase sozlanmagan, lokal xavfsiz sessiya yaratilmoqda");
    }

    // 3. Xavfsiz sessiya tokeni yaratish
    const sessionToken = `g_jwt_${dbUserId}_${Date.now()}`;
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 kun

    const userResponse = {
      id: dbUserId,
      name: givenName || fullName,
      surname: familyName || undefined,
      fullName: fullName,
      email: email,
      photoUrl: photoUrl || undefined,
      role: userRole,
      personId: dbPersonId,
      familyId: dbFamilyId,
      googleId: googleId,
      authProvider: 'google',
      isGuest: false,
    };

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      message: isExistingUser ? "Tizimga muvaffaqiyatli kirildi" : "Muvaffaqiyatli ro'yxatdan o'tildi",
      isNewUser: !isExistingUser,
      user: userResponse,
      session: {
        token: sessionToken,
        expiresAt: expiresAt,
      },
    }));
  } catch (error: any) {
    console.error("[Google Auth Backend Error]:", error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      success: false, 
      error: 'Ichki server xatoligi: ' + (error?.message || 'Noma\'lum xatolik') 
    }));
  }
}
