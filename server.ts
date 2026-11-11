import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import googleAuthHandler from './api/auth/google';
import sessionHandler from './api/auth/session';
import healthHandler from './api/health';
import presignHandler from './api/upload/presign';
import contactHandler from './api/contact';
import treeHandler from './api/tree';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // ═════════════════════════════════════════════════════════════════════════
  // 1. XAVFSIZLIK SARLAVHALARI (CSP, HSTS, Anti-XSS, Anti-Clickjacking)
  // ═════════════════════════════════════════════════════════════════════════
  app.use((req, res, next) => {
    // HTTPS Enforce (Production)
    const proto = req.headers['x-forwarded-proto'];
    if (process.env.NODE_ENV === 'production' && proto && proto !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }

    // Content Security Policy (CSP)
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://telegram.org https://apis.google.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com data:; " +
      "img-src 'self' data: blob: https:; " +
      "connect-src 'self' https://*.supabase.co https://accounts.google.com https://www.googleapis.com https://*.telegram.org https://api.telegram.org; " +
      "frame-src 'self' https://accounts.google.com; " +
      "object-src 'none'; " +
      "base-uri 'self';"
    );

    // HSTS (Strict-Transport-Security: 1 yil, barcha subdomenlar bilan)
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    // MIME Type himoyasi
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Clickjacking himoyasi
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Keraksiz ruxsatlarni cheklash (Least privilege)
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // Google OAuth popup uchun COOP
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

    next();
  });

  // ═════════════════════════════════════════════════════════════════════════
  // 2. RATE LIMITING (So'rovlar sonini cheklash — Brute-force & DDoS himoyasi)
  // ═════════════════════════════════════════════════════════════════════════
  const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of rateLimitStore.entries()) {
      if (now > val.resetTime) rateLimitStore.delete(key);
    }
  }, 60000);

  const createRateLimiter = (limit: number, windowMs: number) => {
    return (req: any, res: any, next: any) => {
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
      const key = `${ip}:${req.path}`;
      const now = Date.now();

      let record = rateLimitStore.get(key);
      if (!record || now > record.resetTime) {
        record = { count: 1, resetTime: now + windowMs };
        rateLimitStore.set(key, record);
      } else {
        record.count++;
      }

      if (record.count > limit) {
        const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
        res.setHeader('Retry-After', String(retryAfterSec));
        return res.status(429).json({
          success: false,
          error: "Juda ko'p so'rov yuborildi (Rate Limit). Iltimos, birozdan so'ng qayta urinib ko'ring.",
          retryAfter: retryAfterSec,
        });
      }
      next();
    };
  };

  // Middleware
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // ═════════════════════════════════════════════════════════════════════════
  // 3. INPUT VALIDATION & INJECTION INSPECTOR (Server-side Sanitization)
  // ═════════════════════════════════════════════════════════════════════════
  const SQL_INJECTION_REGEX = /(\b(UNION\s+SELECT|DROP\s+TABLE|INSERT\s+INTO|ALTER\s+TABLE|EXEC(\s|\+)+(s|x)p)\b|--|\/\*|\*\/)/i;
  const XSS_SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i;

  app.use('/api', (req, res, next) => {
    // Query string tekshiruvi
    const queryString = JSON.stringify(req.query || {});
    if (SQL_INJECTION_REGEX.test(queryString) || XSS_SCRIPT_REGEX.test(queryString)) {
      console.warn(`[Security Alert] Xavfli parametr aniqlandi: ${req.ip} -> ${req.url}`);
      return res.status(400).json({ success: false, error: "Xavfsizlik qoidabuzarligi: ruxsat etilmagan parametrlar aniqlandi." });
    }

    // Body tekshiruvi (agar mavjud bo'lsa)
    if (req.body && typeof req.body === 'object') {
      const bodyStr = JSON.stringify(req.body);
      if (SQL_INJECTION_REGEX.test(bodyStr) || XSS_SCRIPT_REGEX.test(bodyStr)) {
        console.warn(`[Security Alert] Xavfli tana (body) aniqlandi: ${req.ip} -> ${req.url}`);
        return res.status(400).json({ success: false, error: "Xavfsizlik qoidabuzarligi: ruxsat etilmagan ma'lumot kiritildi." });
      }
    }
    next();
  });

  // API Endpoints bilan Rate Limiting
  app.all('/api/auth/google', createRateLimiter(30, 60000), (req, res) => googleAuthHandler(req, res));
  app.all('/api/auth/session', createRateLimiter(60, 60000), (req, res) => sessionHandler(req, res));
  app.all('/api/health', (req, res) => healthHandler(req, res));
  app.all('/api/upload/presign', createRateLimiter(30, 60000), (req, res) => presignHandler(req, res));
  app.all('/api/upload/presigned-url', createRateLimiter(30, 60000), (req, res) => presignHandler(req, res));
  app.all('/api/contact', createRateLimiter(15, 60000), (req, res) => contactHandler(req, res));
  app.all('/api/tree', createRateLimiter(60, 60000), (req, res) => treeHandler(req, res));

  // Development vs Production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Shajarachi server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
