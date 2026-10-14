import type { Request, Response } from "express";
import {
  createSignedUrlForEntity,
  createBatchSignedUrls,
  verifyMediaSignature,
  getSafeFilePath,
  type MediaEntityType,
  type BatchMediaItem,
} from "./media.service.js";

const VALID_ENTITY_TYPES: MediaEntityType[] = [
  "learner",
  "student",
  "teacher",
  "personnel",
  "evidence",
  "general",
];

export async function getSignedUrl(req: Request, res: Response): Promise<void> {
  const entityType = req.params.entityType as MediaEntityType;
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!VALID_ENTITY_TYPES.includes(entityType) || !id) {
    res.status(400).json({
      code: "BAD_REQUEST",
      message: "Invalid entityType or id provided for media signed URL.",
    });
    return;
  }

  // Learner self-service authorization check: if user is logged in as a learner, they can only view their own photo
  if (req.learner && (entityType === "learner" || entityType === "student")) {
    if (String(req.learner.learnerId) !== String(id)) {
      res.status(403).json({
        code: "FORBIDDEN",
        message: "Learners may only access their own media assets.",
      });
      return;
    }
  }

  try {
    const result = await createSignedUrlForEntity(entityType, id);
    if (!result) {
      res.status(404).json({
        code: "NOT_FOUND",
        message: "No media photo found for the specified entity.",
      });
      return;
    }

    res.setHeader("Cache-Control", "private, no-store, max-age=0, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.json(result);
  } catch (error: unknown) {
    console.error("Error generating signed media URL:", error);
    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to generate signed URL.",
    });
  }
}

export async function getBatchSignedUrls(req: Request, res: Response): Promise<void> {
  const bodyItems = (req.body?.items as BatchMediaItem[] | undefined) || [];

  if (!Array.isArray(bodyItems) || bodyItems.length === 0) {
    res.status(400).json({
      code: "BAD_REQUEST",
      message: "Expected an array of items with { id, entityType }.",
    });
    return;
  }

  // Filter and limit to 200 items per batch to avoid excessive processing
  const sanitizedItems = bodyItems.slice(0, 200).filter((item) => {
    return item && item.id && VALID_ENTITY_TYPES.includes(item.entityType);
  });

  try {
    const results = await createBatchSignedUrls(sanitizedItems);

    res.setHeader("Cache-Control", "private, no-store, max-age=0, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.json({ items: results });
  } catch (error: unknown) {
    console.error("Error batch generating signed media URLs:", error);
    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to generate batch signed URLs.",
    });
  }
}

export async function serveSecureFile(req: Request, res: Response): Promise<void> {
  const entityType = req.params.entityType as MediaEntityType;
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const expires = parseInt(req.query.expires as string, 10);
  const signature = req.query.sig as string;
  const filename = req.query.fn as string;

  if (!entityType || !id || !expires || !signature || !filename) {
    res.status(400).json({
      code: "BAD_REQUEST",
      message: "Missing required signed URL parameters (expires, sig, fn).",
    });
    return;
  }

  if (Date.now() > expires) {
    res.status(403).json({
      code: "MEDIA_URL_EXPIRED",
      message: "The signed URL for this media asset has expired. Please refresh the asset.",
    });
    return;
  }

  const isValid = verifyMediaSignature(entityType, id, expires, filename, signature);
  if (!isValid) {
    res.status(403).json({
      code: "INVALID_MEDIA_SIGNATURE",
      message: "Invalid or forged media signature.",
    });
    return;
  }

  const safeFilePath = getSafeFilePath(filename);
  if (!safeFilePath) {
    res.status(404).json({
      code: "MEDIA_NOT_FOUND",
      message: "Media file not found on server.",
    });
    return;
  }

  // Set RA 10173 compliance caching and security headers
  res.setHeader("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("X-Content-Type-Options", "nosniff");

  res.sendFile(safeFilePath);
}
