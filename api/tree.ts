import { createClient } from '@supabase/supabase-js';

const ALLOWED_ORIGINS = [
  'https://shajarachi.vercel.app',
  'https://shajarachi.uz',
  'https://www.shajarachi.uz',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

function setCorsHeaders(req: any, res: any) {
  const origin = req.headers?.origin;
  if (origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.shajarachi.uz'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

function parseJsonBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    if (req.body && typeof req.body === 'string') {
      try { return resolve(JSON.parse(req.body)); } catch { return resolve({}); }
    }
    let data = '';
    req.on('data', (chunk: any) => { data += chunk; });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY environment variablelari kerak');
  return createClient(url, key);
}

/**
 * GET  /api/tree?userId=...&email=...
 * POST /api/tree { userId, email, state }
 * DELETE /api/tree?userId=...&email=...
 *
 * family_trees jadvaliga ulab: user_id TEXT (UNIQUE), tree_data JSONB, updated_at TIMESTAMPTZ
 */
export default async function handler(req: any, res: any) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const json = (code: number, data: object) => {
    res.statusCode = code;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  };

  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost');
    const userId = url.searchParams.get('userId');
    const email = url.searchParams.get('email');

    if (!userId && !email) return json(400, { success: false, error: 'userId yoki email kerak' });

    try {
      const sb = getSupabase();
      // Email ustuvor, keyin userId
      const candidates = [
        email ? `email:${email}` : null,
        userId ? userId : null,
      ].filter(Boolean) as string[];

      for (const key of candidates) {
        const { data, error } = await sb
          .from('family_trees')
          .select('tree_data, updated_at')
          .eq('user_id', key)
          .maybeSingle();

        if (error) { console.error('[API Tree GET]', error); continue; }
        if (data?.tree_data && Object.keys(data.tree_data.people || {}).length > 0) {
          return json(200, { success: true, state: data.tree_data, updatedAt: data.updated_at, source: 'supabase' });
        }
      }

      return json(200, { success: false, notFound: true, message: 'Shajara topilmadi' });
    } catch (err: any) {
      console.error('[API Tree GET Error]', err);
      return json(500, { success: false, error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { userId, email, state } = body;

      if (!state?.people) return json(400, { success: false, error: "Noto'g'ri state formati" });
      if (!userId && !email) return json(400, { success: false, error: 'userId yoki email kerak' });

      const sb = getSupabase();
      const now = new Date().toISOString();

      // Email ustuvor saqlash
      const keys: string[] = [];
      if (email) keys.push(`email:${email}`);
      if (userId) keys.push(userId);

      for (const key of keys) {
        const { error } = await sb.from('family_trees').upsert(
          { user_id: key, tree_data: state, updated_at: now },
          { onConflict: 'user_id' }
        );
        if (error) console.error(`[API Tree POST] key=${key}`, error);
      }

      return json(200, { success: true, message: 'Shajara Supabasega saqlandi' });
    } catch (err: any) {
      console.error('[API Tree POST Error]', err);
      return json(500, { success: false, error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    const url = new URL(req.url, 'http://localhost');
    const userId = url.searchParams.get('userId');
    const email = url.searchParams.get('email');

    try {
      const sb = getSupabase();
      const keys: string[] = [];
      if (email) keys.push(`email:${email}`);
      if (userId) keys.push(userId);

      for (const key of keys) {
        await sb.from('family_trees').delete().eq('user_id', key);
      }
      return json(200, { success: true, message: "Shajara ma'lumotlari o'chirildi" });
    } catch (err: any) {
      return json(500, { success: false, error: err.message });
    }
  }

  res.statusCode = 405;
  res.end('Method not allowed');
}
