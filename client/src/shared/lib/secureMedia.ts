import api from "@/shared/api/axiosInstance";

export type MediaEntityType = "learner" | "student" | "teacher" | "personnel" | "evidence" | "general";

/**
 * Computes initials for programmatic fallback avatar (e.g. "CR" for Camille Reyes).
 */
export function computeInitials(
  firstName?: string | null,
  lastName?: string | null,
  name?: string | null,
  providedInitials?: string | null
): string {
  if (providedInitials && providedInitials.trim()) {
    return providedInitials.trim().toUpperCase().slice(0, 3);
  }
  if (firstName || lastName) {
    const f = String(firstName || "").trim().charAt(0).toUpperCase();
    const l = String(lastName || "").trim().charAt(0).toUpperCase();
    return `${f}${l}` || "?";
  }
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return parts[0].charAt(0).toUpperCase();
  }
  return "?";
}

interface CachedSignedUrl {
  signedUrl: string;
  expiresAt: number; // timestamp in ms
}

interface BatchQueueItem {
  id: string | number;
  entityType: MediaEntityType;
  photoPath?: string | null;
  resolve: (url: string | null) => void;
  reject: (err: unknown) => void;
}

// In-memory cache for time-limited signed URLs
const signedUrlCache = new Map<string, CachedSignedUrl>();

// Batch queue for consolidating requests during list rendering (e.g. EOSY, Learner Directory)
let pendingBatch: BatchQueueItem[] = [];
let batchTimeout: ReturnType<typeof setTimeout> | null = null;

function getCacheKey(entityType: string, id: string | number): string {
  return `${entityType}:${String(id)}`;
}

/**
 * Flush the queued avatar requests into a single batch POST request.
 */
async function flushBatchQueue(): Promise<void> {
  const currentBatch = pendingBatch;
  pendingBatch = [];
  batchTimeout = null;

  if (currentBatch.length === 0) return;

  // Deduplicate items in the current batch
  const uniqueItemsMap = new Map<string, { id: string | number; entityType: MediaEntityType; photoPath?: string | null }>();
  for (const item of currentBatch) {
    const key = getCacheKey(item.entityType, item.id);
    if (!uniqueItemsMap.has(key)) {
      uniqueItemsMap.set(key, {
        id: item.id,
        entityType: item.entityType,
        photoPath: item.photoPath,
      });
    }
  }

  const payloadItems = Array.from(uniqueItemsMap.values());

  try {
    const response = await api.post<{
      items: Array<{
        id: string | number;
        entityType: MediaEntityType;
        signedUrl: string | null;
        expiresAt: string | null;
      }>;
    }>("/media/signed-urls", { items: payloadItems });

    const returnedItems = response.data?.items || [];
    const resultMap = new Map<string, string | null>();

    for (const resItem of returnedItems) {
      const key = getCacheKey(resItem.entityType, resItem.id);
      if (resItem.signedUrl && resItem.expiresAt) {
        signedUrlCache.set(key, {
          signedUrl: resItem.signedUrl,
          expiresAt: new Date(resItem.expiresAt).getTime(),
        });
        resultMap.set(key, resItem.signedUrl);
      } else {
        resultMap.set(key, null);
      }
    }

    // Resolve each queued promise
    for (const item of currentBatch) {
      const key = getCacheKey(item.entityType, item.id);
      item.resolve(resultMap.get(key) ?? null);
    }
  } catch (err: unknown) {
    // If batch fails, reject all or fallback to null
    for (const item of currentBatch) {
      item.reject(err);
    }
  }
}

/**
 * Invalidate a cached signed URL (e.g. on 403 expired error).
 */
export function invalidateMediaUrl(entityType: string, id: string | number): void {
  const key = getCacheKey(entityType, id);
  signedUrlCache.delete(key);
}

/**
 * Get a valid time-limited signed URL for an entity, using cache or batch queue.
 */
export async function getSignedMediaUrl(
  entityType: MediaEntityType,
  id: string | number,
  photoPath?: string | null
): Promise<string | null> {
  const cleanPath = photoPath ? photoPath.trim() : null;
  if (
    cleanPath &&
    (cleanPath.startsWith("http://") ||
      cleanPath.startsWith("https://") ||
      cleanPath.startsWith("data:") ||
      cleanPath.startsWith("blob:"))
  ) {
    return cleanPath;
  }

  const key = getCacheKey(entityType, id);
  const cached = signedUrlCache.get(key);

  // Buffer: renew 30 seconds before expiration
  if (cached && cached.expiresAt > Date.now() + 30_000) {
    return cached.signedUrl;
  }

  return new Promise<string | null>((resolve, reject) => {
    pendingBatch.push({
      id,
      entityType,
      photoPath,
      resolve,
      reject,
    });

    if (!batchTimeout) {
      batchTimeout = setTimeout(() => {
        void flushBatchQueue();
      }, 20); // 20ms debounce collects all table row mounts
    }
  });
}
