/**
 * /api/tree — Shajara ma'lumotlarini Supabase'ga saqlash/yuklash
 *
 * GET    /api/tree?userId=...&email=...   → { success, state, updatedAt }
 * POST   /api/tree  body: { userId, email, state } → { success }
 * DELETE /api/tree?userId=...&email=...  → { success }
 *
 * Supabase family_trees jadvali:
 *   user_id    TEXT UNIQUE  (UUID yoki "email:user@mail.com")
 *   tree_data  JSONB
 *   updated_at TIMESTAMPTZ
 */

const ALLOWED = [
  'https://shajarachi.vercel.app',
  'https://shajarachi.uz',
  'https://www.shajarachi.uz',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

function setCors(req: any, res: any) {
  const o = req.headers?.origin;
  const allow = o && (ALLOWED.includes(o) || o.endsWith('.vercel.app') || o.endsWith('.shajarachi.uz'));
  res.setHeader('Access-Control-Allow-Origin', allow ? o : '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

function parseBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    if (req.body && typeof req.body === 'string') {
      try { return resolve(JSON.parse(req.body)); } catch { return resolve({}); }
    }
    let d = '';
    req.on('data', (c: any) => { d += c; });
    req.on('end', () => { try { resolve(d ? JSON.parse(d) : {}); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

// Supabase REST (SDK kerak emas)
function sbBase() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    'https://lhjpefccusfurhjcjmbx.supabase.co';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoanBlZmNjdXNmdXJoamNqbWJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTkzMTIsImV4cCI6MjEwNzk3NTMxMn0.x2SevWlkq-DKOI287ddHMwYWvMkx_3pPk709xNuwjR4';
  return { url: url.replace(/\/$/, ''), key };
}

function sbHeaders(key: string) {
  return {
    'Content-Type': 'application/json',
    'apikey': key,
    'Authorization': `Bearer ${key}`,
  };
}

// In-memory fallback cache (agar Supabase bo'sh yoki vaqtincha javob bermasa ham taklifnomalar va shajara darhol ochilishi uchun)
const memTreeStore = new Map<string, { tree_data: any; updated_at: string }>();

async function sbGet(userId: string): Promise<{ tree_data: any; updated_at: string } | null> {
  // Avval xotiradagi keshni tekshirish
  if (memTreeStore.has(userId)) {
    return memTreeStore.get(userId)!;
  }
  try {
    const { url, key } = sbBase();
    const res = await fetch(
      `${url}/rest/v1/family_trees?user_id=eq.${encodeURIComponent(userId)}&select=tree_data,updated_at&limit=1`,
      { headers: sbHeaders(key) }
    );
    if (!res.ok) return memTreeStore.get(userId) || null;
    const rows = await res.json();
    if (Array.isArray(rows) && rows.length > 0) {
      memTreeStore.set(userId, rows[0]);
      return rows[0];
    }
  } catch (err) {
    console.warn('[sbGet Supabase Error, fallback to memory]:', err);
  }
  return memTreeStore.get(userId) || null;
}

async function sbUpsert(userId: string, state: any): Promise<boolean> {
  const record = {
    tree_data: state,
    updated_at: new Date().toISOString(),
  };
  memTreeStore.set(userId, record);

  try {
    const { url, key } = sbBase();
    const res = await fetch(`${url}/rest/v1/family_trees?on_conflict=user_id`, {
      method: 'POST',
      headers: {
        ...sbHeaders(key),
        'Prefer': 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({
        user_id: userId,
        tree_data: state,
        updated_at: record.updated_at,
      }),
    });
    if (!res.ok && res.status !== 201) {
      const errText = await res.text().catch(() => '');
      console.warn(`[sbUpsert Supabase Info: ${res.status}] ${errText} (Cached in memory for ${userId})`);
    }
    return true;
  } catch (err) {
    console.warn('[sbUpsert Supabase Error, saved in memory]:', err);
    return true; // Xotirada saqlandi
  }
}

async function sbDelete(userId: string): Promise<boolean> {
  memTreeStore.delete(userId);
  try {
    const { url, key } = sbBase();
    const res = await fetch(
      `${url}/rest/v1/family_trees?user_id=eq.${encodeURIComponent(userId)}`,
      { method: 'DELETE', headers: sbHeaders(key) }
    );
    return res.ok;
  } catch {
    return true;
  }
}

export default async function handler(req: any, res: any) {
  setCors(req, res);
  if (req.method === 'OPTIONS') { res.statusCode = 200; res.end(); return; }

  const send = (code: number, data: object) => {
    res.statusCode = code;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  };

  // ── GET ──────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost');
    const rawUserId = url.searchParams.get('userId');
    const rawEmail  = url.searchParams.get('email');
    if (!rawUserId && !rawEmail) return send(400, { success: false, error: 'userId yoki email kerak' });

    // Parametr tekshiruvi (SQL Injection & Path Traversal oldini olish)
    const SAFE_ID_RE = /^[a-zA-Z0-9_\-.:@]{3,120}$/;
    if (rawUserId && !SAFE_ID_RE.test(rawUserId)) {
      return send(400, { success: false, error: "userId noto'g'ri formatda" });
    }
    if (rawEmail && !SAFE_ID_RE.test(rawEmail)) {
      return send(400, { success: false, error: "email noto'g'ri formatda" });
    }

    try {
      // Avval UUID, keyin email: prefix bilan qidirish
      const keys = [rawUserId, rawEmail ? `email:${rawEmail}` : null].filter(Boolean) as string[];
      for (const key of keys) {
        const row = await sbGet(key);
        if (row?.tree_data && Object.keys(row.tree_data.people || {}).length > 0) {
          return send(200, { success: true, state: row.tree_data, updatedAt: row.updated_at });
        }
      }
      return send(200, { success: false, notFound: true });
    } catch (e: any) {
      console.error('[Tree GET]', e.message);
      return send(500, { success: false, error: e.message });
    }
  }

  // ── POST ─────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { userId, email, state } = body;

      if (!state || typeof state !== 'object' || !state.people) {
        return send(400, { success: false, error: "state.people mavjud emas" });
      }
      if (!userId && !email) {
        return send(400, { success: false, error: 'userId yoki email kerak' });
      }

      const SAFE_ID_RE = /^[a-zA-Z0-9_\-.:@]{3,120}$/;
      if (userId && !SAFE_ID_RE.test(userId)) {
        return send(400, { success: false, error: "userId noto'g'ri formatda" });
      }
      if (email && !SAFE_ID_RE.test(email)) {
        return send(400, { success: false, error: "email noto'g'ri formatda" });
      }

      let saved = false;
      // userId (UUID) bilan saqlash
      if (userId) {
        const ok = await sbUpsert(userId, state);
        if (ok) saved = true;
      }
      // email: prefix bilan ham saqlash (boshqa qurilmadan login uchun)
      if (email) {
        const ok = await sbUpsert(`email:${email}`, state);
        if (ok) saved = true;
      }

      if (!saved) return send(500, { success: false, error: 'Saqlash muvaffaqiyatsiz' });
      return send(200, { success: true });
    } catch (e: any) {
      console.error('[Tree POST]', e.message);
      return send(500, { success: false, error: e.message });
    }
  }

  // ── DELETE ───────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const url = new URL(req.url, 'http://localhost');
    const userId = url.searchParams.get('userId');
    const email  = url.searchParams.get('email');
    try {
      if (userId) await sbDelete(userId);
      if (email)  await sbDelete(`email:${email}`);
      return send(200, { success: true });
    } catch (e: any) {
      return send(500, { success: false, error: e.message });
    }
  }

  res.statusCode = 405;
  res.end('Method not allowed');
}
