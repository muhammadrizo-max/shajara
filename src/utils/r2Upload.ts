/**
 * r2Upload.ts
 * Cloudflare R2 xotirasiga Presigned URL mexanizmi orqali
 * to'g'ridan-to'g'ri brauzerdan rasmlar va fotosuratlarni yuklash moduli
 */

import { fileToBase64 } from './storage';

export interface PresignedResponse {
  success: boolean;
  presignedUrl?: string;
  objectKey?: string;
  publicUrl?: string;
  bucket?: string;
  expiresInSeconds?: number;
  isConfigured?: boolean;
  error?: string;
}

export interface UploadResult {
  success: boolean;
  url: string;
  objectKey?: string;
  isR2: boolean;
  error?: string;
}

/**
 * Backend API'dan Cloudflare R2 Presigned PUT URL olish
 */
export async function getPresignedUploadUrl(params: {
  contentType: string;
  fileExtension: string;
  folder?: string;
}): Promise<PresignedResponse> {
  try {
    const response = await fetch('/api/upload/presign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contentType: params.contentType,
        fileExtension: params.fileExtension,
        folder: params.folder || 'avatars',
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error || `Server xatoligi (${response.status})`,
      };
    }

    const data: PresignedResponse = await response.json();
    return data;
  } catch (err: any) {
    console.warn("[Cloudflare R2] Presigned URL olishda xatolik:", err);
    return {
      success: false,
      error: err?.message || 'Tarmoq xatosi',
    };
  }
}

/**
 * Rasmni to'g'ridan-to'g'ri Cloudflare R2 ga Presigned PUT URL orqali yuklash
 * Progress foizini (0 - 100%) kuzatib boradi
 */
export async function uploadImageToR2(
  file: File,
  options?: {
    folder?: string;
    onProgress?: (percent: number) => void;
    maxSizeMB?: number;
  }
): Promise<UploadResult> {
  const maxSizeMB = options?.maxSizeMB || 20;
  if (file.size > maxSizeMB * 1024 * 1024) {
    return {
      success: false,
      url: '',
      isR2: false,
      error: `Fayl hajmi ${maxSizeMB}MB dan oshmasligi kerak`,
    };
  }

  // Fayl kengaytmasini ajratib olish
  const nameParts = file.name.split('.');
  const rawExt = nameParts.length > 1 ? nameParts.pop() || 'jpg' : 'jpg';
  const fileExtension = rawExt.toLowerCase();
  const contentType = file.type || 'image/jpeg';
  const folder = options?.folder || 'avatars';

  options?.onProgress?.(5);

  // 1-qadam: Backend API dan Presigned URL olish
  const presignResult = await getPresignedUploadUrl({
    contentType,
    fileExtension,
    folder,
  });

  // Agar Cloudflare R2 to'liq sozlangan bo'lsa va Presigned URL olingan bo'lsa
  if (presignResult.success && presignResult.presignedUrl && presignResult.publicUrl) {
    try {
      options?.onProgress?.(15);

      // 2-qadam: XMLHttpRequest orqali to'g'ridan-to'g'ri R2 ga PUT qilish (progress foizi bilan)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', presignResult.presignedUrl!, true);
        xhr.setRequestHeader('Content-Type', contentType);

        if (xhr.upload && options?.onProgress) {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              // 15% dan 95% gacha progress
              const percent = Math.min(
                95,
                Math.round(15 + (event.loaded / event.total) * 80)
              );
              options.onProgress?.(percent);
            }
          };
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            options?.onProgress?.(100);
            resolve();
          } else {
            reject(
              new Error(`Cloudflare R2 yuklash xatosi: HTTP ${xhr.status}`)
            );
          }
        };

        xhr.onerror = () => {
          reject(new Error("Cloudflare R2 ga ulanishda xatolik yuz berdi"));
        };

        xhr.ontimeout = () => {
          reject(new Error("Cloudflare R2 ga yuklash vaqti tugadi"));
        };

        xhr.send(file);
      });

      console.info("[Cloudflare R2] Rasm muvaffaqiyatli yuklandi:", presignResult.publicUrl);

      return {
        success: true,
        url: presignResult.publicUrl,
        objectKey: presignResult.objectKey,
        isR2: true,
      };
    } catch (uploadErr: any) {
      console.warn("[Cloudflare R2] To'g'ridan-to'g'ri yuklash uzildi, lokal zaxiraga o'tilmoqda:", uploadErr);
      // Agar R2 ga yuklashda xatolik bo'lsa, foydalanuvchini to'xtatib qo'ymaslik uchun fallback base64
      const base64 = await fileToBase64(file);
      return {
        success: true,
        url: base64,
        isR2: false,
        error: uploadErr?.message,
      };
    }
  }

  // Agar R2 kalitlari hali `.env` ga kiritilmagan bo'lsa, zaxira sifatida base64 saqlash
  console.info("[Cloudflare R2] R2 kalitlari topilmadi, zaxira (Base64) usulidan foydalanildi");
  options?.onProgress?.(50);
  const fallbackBase64 = await fileToBase64(file);
  options?.onProgress?.(100);

  return {
    success: true,
    url: fallbackBase64,
    isR2: false,
    error: presignResult.error,
  };
}
