import crypto from "crypto";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { prisma } from "../../lib/prisma.js";

export type MediaEntityType = "learner" | "student" | "teacher" | "personnel" | "evidence" | "general";

interface SignedUrlResult {
  signedUrl: string;
  expiresAt: string;
  expiresInSeconds: number;
}

export interface BatchMediaItem {
  id: number | string;
  entityType: MediaEntityType;
  photoPath?: string | null;
}

export interface BatchMediaSignedUrlResult {
  id: number | string;
  entityType: MediaEntityType;
  signedUrl: string | null;
  expiresAt: string | null;
}

const DEFAULT_EXPIRATION_SECONDS = 10 * 60; // 10 minutes (between 5 and 15 mins)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getUploadsDir(): string {
  // 1. Try relative to module file (covers server/src/features/media and server/dist/features/media)
  const moduleUploads = path.resolve(__dirname, "../../..", "uploads");
  if (fs.existsSync(moduleUploads)) {
    return moduleUploads;
  }
  // 2. Try server/uploads when running from repository root
  const serverUploads = path.resolve(process.cwd(), "server", "uploads");
  if (fs.existsSync(serverUploads)) {
    return serverUploads;
  }
  // 3. Try uploads when running from server package directory
  const cwdUploads = path.resolve(process.cwd(), "uploads");
  if (fs.existsSync(cwdUploads)) {
    return cwdUploads;
  }
  return moduleUploads;
}

function getSigningSecret(): string {
  return process.env.MEDIA_SIGNING_SECRET || process.env.JWT_SECRET || "enrollpro_ra10173_media_secret_key";
}

/**
 * Generate HMAC-SHA256 signature for a specific media item and expiration timestamp.
 */
export function generateMediaSignature(entityType: string, id: string | number, expires: number, filename: string): string {
  const secret = getSigningSecret();
  const payload = `${entityType}:${id}:${expires}:${filename}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Verify HMAC-SHA256 signature using timing-safe comparison.
 */
export function verifyMediaSignature(
  entityType: string,
  id: string | number,
  expires: number,
  filename: string,
  providedSignature: string
): boolean {
  if (Date.now() > expires) {
    return false;
  }
  const expectedSignature = generateMediaSignature(entityType, id, expires, filename);
  try {
    const expectedBuf = Buffer.from(expectedSignature, "utf8");
    const providedBuf = Buffer.from(providedSignature, "utf8");
    if (expectedBuf.length !== providedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  } catch {
    return false;
  }
}

/**
 * Resolve the stored relative path / filename for an entity.
 */
export async function resolveEntityPhotoPath(entityType: MediaEntityType, id: string | number): Promise<string | null> {
  const idStr = String(id).trim();

  // If id is directly a file path or filename
  if (idStr.includes("/") || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(idStr)) {
    return idStr.startsWith("/") ? idStr : `/${idStr}`;
  }

  const numericId = typeof id === "number" ? id : parseInt(idStr, 10);

  if (entityType === "learner" || entityType === "student") {
    if (!Number.isNaN(numericId)) {
      const learner = await prisma.learner.findUnique({
        where: { id: numericId },
        select: { studentPhoto: true },
      });
      if (learner?.studentPhoto) {
        return learner.studentPhoto;
      }
    }
    return null;
  }

  if (entityType === "teacher" || entityType === "personnel") {
    if (!Number.isNaN(numericId)) {
      const teacher = await prisma.teacher.findUnique({
        where: { id: numericId },
        select: { photoPath: true },
      });
      if (teacher?.photoPath) {
        return teacher.photoPath;
      }
    }
    return null;
  }

  return null;
}

/**
 * Create a time-limited Pre-Signed URL for accessing a media asset.
 */
export async function createSignedUrlForEntity(
  entityType: MediaEntityType,
  id: string | number,
  explicitPath?: string | null,
  expirationSeconds = DEFAULT_EXPIRATION_SECONDS
): Promise<SignedUrlResult | null> {
  const photoPath = explicitPath || (await resolveEntityPhotoPath(entityType, id));
  if (!photoPath) {
    return null;
  }

  // If already an absolute external web URL (e.g. seeded mock portraits or remote CDN)
  if (photoPath.startsWith("http://") || photoPath.startsWith("https://")) {
    return {
      signedUrl: photoPath,
      expiresAt: new Date(Date.now() + expirationSeconds * 1000).toISOString(),
      expiresInSeconds: expirationSeconds,
    };
  }

  // Extract pure filename
  const filename = path.basename(photoPath);
  const expiresAtMs = Date.now() + expirationSeconds * 1000;
  const signature = generateMediaSignature(entityType, id, expiresAtMs, filename);

  const signedUrl = `/api/v1/media/file/${entityType}/${encodeURIComponent(String(id))}?expires=${expiresAtMs}&sig=${signature}&fn=${encodeURIComponent(filename)}`;

  return {
    signedUrl,
    expiresAt: new Date(expiresAtMs).toISOString(),
    expiresInSeconds: expirationSeconds,
  };
}

/**
 * Batch generate signed URLs for a collection of entities (used for list views like EOSY / Learner Directory).
 */
export async function createBatchSignedUrls(
  items: BatchMediaItem[],
  expirationSeconds = DEFAULT_EXPIRATION_SECONDS
): Promise<BatchMediaSignedUrlResult[]> {
  const results: BatchMediaSignedUrlResult[] = [];

  for (const item of items) {
    const res = await createSignedUrlForEntity(item.entityType, item.id, item.photoPath, expirationSeconds);
    results.push({
      id: item.id,
      entityType: item.entityType,
      signedUrl: res ? res.signedUrl : null,
      expiresAt: res ? res.expiresAt : null,
    });
  }

  return results;
}

/**
 * Resolve the real disk path of a file in the uploads directory, ensuring no path traversal.
 */
export function getSafeFilePath(filename: string): string | null {
  const safeBase = path.basename(filename);
  const uploadsDir = getUploadsDir();
  const resolved = path.resolve(uploadsDir, safeBase);
  if (!resolved.startsWith(uploadsDir)) {
    return null;
  }
  if (!fs.existsSync(resolved)) {
    return null;
  }
  return resolved;
}
