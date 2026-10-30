import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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
 * /api/upload/presign
 * Cloudflare R2 uchun 5 daqiqalik Presigned PUT URL generatsiya qiladi
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
    const contentType = body.contentType || 'image/jpeg';
    const rawExt = body.fileExtension || body.extension || '';
    const folder = (body.folder || 'avatars').replace(/[^a-zA-Z0-9_-]/g, '');

    // Kengaytmani aniqlash
    let ext = rawExt.toLowerCase().replace(/^\./, '');
    if (!ext) {
      if (contentType.includes('png')) ext = 'png';
      else if (contentType.includes('webp')) ext = 'webp';
      else if (contentType.includes('gif')) ext = 'gif';
      else if (contentType.includes('svg')) ext = 'svg';
      else ext = 'jpg';
    }

    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME || 'shajarachi';
    const publicUrlBase = 
      process.env.R2_PUBLIC_URL || 
      process.env.R2_CUSTOM_DOMAIN || 
      process.env.VITE_R2_PUBLIC_URL || 
      'https://media.shajarachi.uz';

    // R2 kalitlari kiritilmagan bo'lsa xabar berish
    if (!accountId || !accessKeyId || !secretAccessKey) {
      console.warn("[Cloudflare R2] R2_ACCOUNT_ID, R2_ACCESS_KEY_ID yoki R2_SECRET_ACCESS_KEY topilmadi");
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        isConfigured: false,
        error: "Cloudflare R2 kalitlari (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) muhitda sozlanmagan",
      }));
      return;
    }

    // Unikal fayl kaliti yaratish: masalan: avatars/c873f2...webp
    const objectKey = `${folder}/${generateUuid()}.${ext}`;

    // Cloudflare R2 S3Client
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: contentType,
    });

    // 5 daqiqa (300 soniya) amal qiluvchi presigned PUT URL
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    const cleanPublicBase = publicUrlBase.replace(/\/+$/, '');
    const publicUrl = `${cleanPublicBase}/${objectKey}`;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      presignedUrl,
      objectKey,
      publicUrl,
      bucket: bucketName,
      expiresInSeconds: 300,
    }));
  } catch (error: any) {
    console.error("[Cloudflare R2 Presign Error]:", error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: 'Presigned URL yaratishda server xatoligi: ' + (error?.message || error),
    }));
  }
}
