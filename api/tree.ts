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
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY env kerak');
  return { url: url.replace(/\/$/, ''), key };
}

function sbHeaders(key: string) {
  return {
    'Content-Type': 'application/json',
    'apikey': key,
    'Authorization': `Bearer ${key}`,
  };
}

async function sbGet(userId: string): Promise<{ tree_data: any; updated_at: string } | null> {
  const { url, key } = sbBase();
  const res = await fetch(
    `${url}/rest/v1/family_trees?user_id=eq.${encodeURIComponent(userId)}&select=tree_data,updated_at&limit=1`,
    { headers: sbHeaders(key) }
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

async function sbUpsert(userId: string, state: any): Promise<boolean> {
  const { url, key } = sbBase();
  const res = await fetch(`${url}/rest/v1/family_trees`, {
    method: 'POST',
    headers: {
      ...sbHeaders(key),
      'Prefer': 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      user_id: userId,
      tree_data: state,
      updated_at: new Date().toISOString(),
    }),
  });
  return res.ok || res.status === 201;
}

async function sbDelete(userId: string): Promise<boolean> {
  const { url, key } = sbBase();
  const res = await fetch(
    `${url}/rest/v1/family_trees?user_id=eq.${encodeURIComponent(userId)}`,
    { method: 'DELETE', headers: sbHeaders(key) }
  );
  return res.ok;
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
    const userId = url.searchParams.get('userId');
    const email  = url.searchParams.get('email');
    if (!userId && !email) return send(400, { success: false, error: 'userId yoki email kerak' });

    try {
      // Avval UUID, keyin email: prefix bilan qidirish
      const keys = [userId, email ? `email:${email}` : null].filter(Boolean) as string[];
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

      let saved = false;
      // userId (UUID) bilan saqlash
      if (userId) {
        const ok = await sbUpsert(userId, state);
        if (ok) saved = true;
        else console.error('[Tree POST] UUID upsert failed:', userId);
      }
      // email: prefix bilan ham saqlash (boshqa qurilmadan login uchun)
      if (email) {
        const ok = await sbUpsert(`email:${email}`, state);
        if (ok) saved = true;
        else console.error('[Tree POST] email upsert failed:', email);
      }

      if (!saved) return send(500, { success: false, error: 'Supabase upsert muvaffaqiyatsiz' });
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
