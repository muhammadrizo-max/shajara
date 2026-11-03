// CORS
const ALLOWED = [
  'https://shajarachi.vercel.app',
  'https://shajarachi.uz',
  'https://www.shajarachi.uz',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

function cors(req: any, res: any) {
  const o = req.headers?.origin;
  if (o && (ALLOWED.includes(o) || o.endsWith('.vercel.app') || o.endsWith('.shajarachi.uz'))) {
    res.setHeader('Access-Control-Allow-Origin', o);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
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

// Supabase REST helpers (no SDK needed)
function sbUrl() {
  const u = process.env.SUPABASE_URL;
  if (!u) throw new Error('SUPABASE_URL env yo\'q');
  return u.replace(/\/$/, '');
}
function sbKey() {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) throw new Error('SUPABASE_SERVICE_ROLE_KEY env yo\'q');
  return k;
}
function sbHeaders() {
  return {
    'Content-Type': 'application/json',
    'apikey': sbKey(),
    'Authorization': `Bearer ${sbKey()}`,
  };
}

async function sbGet(userId: string) {
  const res = await fetch(
    `${sbUrl()}/rest/v1/family_trees?user_id=eq.${encodeURIComponent(userId)}&select=tree_data,updated_at&limit=1`,
    { headers: { ...sbHeaders(), 'Prefer': 'return=representation' } }
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

async function sbUpsert(userId: string, state: any) {
  const now = new Date().toISOString();
  const res = await fetch(
    `${sbUrl()}/rest/v1/family_trees`,
    {
      method: 'POST',
      headers: {
        ...sbHeaders(),
        'Prefer': 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({ user_id: userId, tree_data: state, updated_at: now }),
    }
  );
  return res.ok || res.status === 201;
}

async function sbDelete(userId: string) {
  const res = await fetch(
    `${sbUrl()}/rest/v1/family_trees?user_id=eq.${encodeURIComponent(userId)}`,
    { method: 'DELETE', headers: sbHeaders() }
  );
  return res.ok;
}

/**
 * GET  /api/tree?userId=...&email=...
 * POST /api/tree { userId, email, state }
 * DELETE /api/tree?userId=...&email=...
 *
 * Supabase family_trees jadvali:
 *   user_id TEXT PRIMARY KEY,
 *   tree_data JSONB,
 *   updated_at TIMESTAMPTZ
 */
export default async function handler(req: any, res: any) {
  cors(req, res);

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
      // Email ustuvor (email: prefix bilan saqlangan)
      const keys = [
        email  ? `email:${email}` : null,
        userId ? userId           : null,
      ].filter(Boolean) as string[];

      for (const key of keys) {
        const row = await sbGet(key);
        if (row?.tree_data && Object.keys(row.tree_data.people || {}).length > 0) {
          return send(200, { success: true, state: row.tree_data, updatedAt: row.updated_at, source: 'supabase' });
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
      if (!state?.people) return send(400, { success: false, error: "State formati noto'g'ri" });
      if (!userId && !email) return send(400, { success: false, error: 'userId yoki email kerak' });

      const keys = [
        email  ? `email:${email}` : null,
        userId ? userId           : null,
      ].filter(Boolean) as string[];

      for (const key of keys) {
        const ok = await sbUpsert(key, state);
        if (!ok) console.warn('[Tree POST] upsert failed for key:', key);
      }
      return send(200, { success: true, message: 'Supabasega saqlandi' });
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
      const keys = [
        email  ? `email:${email}` : null,
        userId ? userId           : null,
      ].filter(Boolean) as string[];
      for (const key of keys) await sbDelete(key);
      return send(200, { success: true });
    } catch (e: any) {
      return send(500, { success: false, error: e.message });
    }
  }

  res.statusCode = 405;
  res.end('Method not allowed');
}
