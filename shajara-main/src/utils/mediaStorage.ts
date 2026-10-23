// IndexedDB media storage for Avatar Videos & Biography Videos up to 300MB

const DB_NAME = 'UzShajaraMediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'mediaFiles';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface MediaRecord {
  id: string;
  blob: Blob;
  type: 'avatar-video' | 'bio-video' | 'photo';
  name: string;
  duration?: number;
  updatedAt: number;
}

// In-memory cache for ObjectURLs so components can play them instantly
const urlCache = new Map<string, string>();

export async function saveMediaFile(
  id: string,
  file: File | Blob,
  type: 'avatar-video' | 'bio-video' | 'photo',
  duration?: number
): Promise<string> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const record: MediaRecord = {
      id,
      blob: file,
      type,
      name: (file as File).name || id,
      duration,
      updatedAt: Date.now(),
    };

    await new Promise<void>((resolve, reject) => {
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Revoke old URL if existing
    if (urlCache.has(id)) {
      URL.revokeObjectURL(urlCache.get(id)!);
    }
    const newUrl = URL.createObjectURL(file);
    urlCache.set(id, newUrl);
    return newUrl;
  } catch (err) {
    console.error('Failed to store media in IndexedDB, fallback to BlobURL:', err);
    const newUrl = URL.createObjectURL(file);
    urlCache.set(id, newUrl);
    return newUrl;
  }
}

export async function getMediaUrl(id: string): Promise<string | null> {
  if (urlCache.has(id)) {
    return urlCache.get(id)!;
  }

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const record = await new Promise<MediaRecord | undefined>((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (record && record.blob) {
      const url = URL.createObjectURL(record.blob);
      urlCache.set(id, url);
      return url;
    }
  } catch (err) {
    console.error('Failed to load media from IndexedDB:', err);
  }

  return null;
}

// Load and restore all saved media URLs into memory on app startup
export async function hydrateAllMediaUrls(): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const records = await new Promise<MediaRecord[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    records.forEach((rec) => {
      if (rec.id && rec.blob) {
        if (!urlCache.has(rec.id)) {
          const url = URL.createObjectURL(rec.blob);
          urlCache.set(rec.id, url);
        }
        result[rec.id] = urlCache.get(rec.id)!;
      }
    });
  } catch (err) {
    console.warn('Hydrating media from IndexedDB skipped or failed:', err);
  }
  return result;
}

export async function deleteMediaFile(id: string): Promise<void> {
  if (urlCache.has(id)) {
    URL.revokeObjectURL(urlCache.get(id)!);
    urlCache.delete(id);
  }

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    await new Promise<void>((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to delete media from IndexedDB:', err);
  }
}

// Utility to inspect video duration before saving
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const tempUrl = URL.createObjectURL(file);
    video.src = tempUrl;

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(tempUrl);
      resolve(video.duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(tempUrl);
      reject(new Error("Video faylni o'qib bo'lmadi yoki formati mos emas"));
    };
  });
}
