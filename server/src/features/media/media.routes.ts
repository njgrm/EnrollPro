import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import {
  getSignedUrl,
  getBatchSignedUrls,
  serveSecureFile,
} from "./media.controller.js";

const router: Router = Router();

const STAFF_ROLES = [
  "SYSTEM_ADMIN",
  "HEAD_REGISTRAR",
  "REGISTRAR",
  "CLASS_ADVISER",
  "TEACHER",
  "GRADE_LEVEL_COORDINATOR",
  "STUDENT_AFFAIRS",
  "FINANCE",
];

// Single signed URL endpoint: GET /api/media/signed-url/:entityType/:id
router.get(
  "/signed-url/:entityType/:id",
  authenticate,
  authorize(...STAFF_ROLES),
  getSignedUrl
);

// Batch signed URLs endpoint: POST /api/media/signed-urls
router.post(
  "/signed-urls",
  authenticate,
  authorize(...STAFF_ROLES),
  getBatchSignedUrls
);

// Secure time-limited media delivery endpoint: GET /api/media/file/:entityType/:id
// Validates HMAC signature and expiration timestamp in query params
router.get(
  "/file/:entityType/:id",
  serveSecureFile
);

export default router;
