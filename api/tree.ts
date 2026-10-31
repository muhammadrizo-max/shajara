import fs from 'fs';
import path from 'path';

// CORS sarlavhalari
function setCorsHeaders(req: any, res: any) {
  const allowedOrigins = [
    'https://shajarachi.vercel.app',
    'https://shajarachi.uz',
    'https://www.shajarachi.uz',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  const origin = req.headers?.origin;
  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.run.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
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

const DATA_DIR = path.resolve(process.cwd(), '.data', 'trees');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function sanitizeKey(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
}

/**
 * Server-side Family Tree Storage API:
 * GET  /api/tree?userId=...&email=...
 * POST /api/tree { userId, email, state }
 * 
 * Ushbu API telefon va kompyuter o'rtasida shajara ma'lumotlarini 100% to'liq sinxronlashtiradi.
 */
export default async function handler(req: any, res: any) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  ensureDataDir();

  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost:3000');
    const userId = url.searchParams.get('userId');
    const email = url.searchParams.get('email');

    if (!userId && !email) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'userId yoki email ko\'rsatilishi zarur' }));
      return;
    }

    // Fayllarni tekshirish: avval email bo'yicha, keyin userId bo'yicha
    const candidates = [
      email ? path.join(DATA_DIR, `${sanitizeKey(email)}.json`) : null,
      userId ? path.join(DATA_DIR, `${sanitizeKey(userId)}.json`) : null,
    ].filter(Boolean) as string[];

    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const parsed = JSON.parse(content);
          if (parsed && parsed.people && Object.keys(parsed.people).length > 0) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, state: parsed, source: 'server_disk' }));
            return;
          }
        } catch (e) {
          console.error('[API Tree] Faylni o\'qishda xatolik:', e);
        }
      }
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, notFound: true, message: 'Shajara topilmadi' }));
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { userId, email, state } = body;

      if (!state || !state.people) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: 'Noto\'g\'ri state formati' }));
        return;
      }

      const filesToSave: string[] = [];
      if (email) {
        filesToSave.push(path.join(DATA_DIR, `${sanitizeKey(email)}.json`));
      }
      if (userId) {
        filesToSave.push(path.join(DATA_DIR, `${sanitizeKey(userId)}.json`));
      }

      if (filesToSave.length === 0) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: 'userId yoki email berilmagan' }));
        return;
      }

      const dataStr = JSON.stringify(state, null, 2);
      for (const filePath of filesToSave) {
        fs.writeFileSync(filePath, dataStr, 'utf-8');
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, message: 'Shajara serverda muvaffaqiyatli saqlandi' }));
    } catch (err: any) {
      console.error('[API Tree Save Error]:', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: err.message || 'Server xatosi' }));
    }
    return;
  }

  res.statusCode = 405;
  res.end('Method not allowed');
}
