import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import googleAuthHandler from './api/auth/google';
import sessionHandler from './api/auth/session';
import healthHandler from './api/health';
import presignHandler from './api/upload/presign';
import contactHandler from './api/contact';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API Endpoints
  app.all('/api/auth/google', (req, res) => googleAuthHandler(req, res));
  app.all('/api/auth/session', (req, res) => sessionHandler(req, res));
  app.all('/api/health', (req, res) => healthHandler(req, res));
  app.all('/api/upload/presign', (req, res) => presignHandler(req, res));
  app.all('/api/upload/presigned-url', (req, res) => presignHandler(req, res));
  app.all('/api/contact', (req, res) => contactHandler(req, res));

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
