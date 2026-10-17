import { Router } from 'express';
import multer from "multer";
import {
  listSections,
  listEligibleAdvisers,
  createSection,
  updateSection,
  deleteSection,
  getSectionMasterlist,
  bulkImportSf1,
  exportSectionSf1,
  previewSectionSf1Import,
  commitSectionSf1Import,
  downloadSectionSf1Template,
  getUnsectionedPool,
  inlineSlotLearner,
  handoverAdviser,
  transferLearner,
  forfeitSlot,
  exportGradeLevelMasterlistXlsx,
  exportGradeLevelMasterlistPdf,
} from "./sections.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import { staffIntakePhaseGuard } from "../../middleware/staff-intake-phase.guard.js";
import {
  createSectionSchema,
  updateSectionSchema,
  advisoryHandoverSchema,
  sf1ImportCommitSchema,
} from "@enrollpro/shared";

const router: Router = Router();

const gradeCoordinatorRoles = [
  "GRADE_LEVEL_COORDINATOR",
  "GRADE 7 COORDINATOR",
  "GRADE 8 COORDINATOR",
  "GRADE 9 COORDINATOR",
  "GRADE 10 COORDINATOR",
] as const;

const sectionManagerRoles = [
  "HEAD_REGISTRAR",
  "SYSTEM_ADMIN",
  ...gradeCoordinatorRoles,
] as const;

const sf1Upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const lowerName = file.originalname.toLowerCase();
    const lowerMime = file.mimetype.toLowerCase();
    const isXlsx =
      lowerMime ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      lowerMime === "application/vnd.ms-excel" ||
      lowerName.endsWith(".xlsx") ||
      lowerName.endsWith(".xls");

    if (isXlsx) {
      callback(null, true);
      return;
    }

    callback(new Error("Only .xlsx School Form 1 roster files are allowed."));
  },
});

router.get(
  "/teachers",
  authenticate,
  authorize(...sectionManagerRoles),
  listEligibleAdvisers,
);

router.get(
  "/",
  authenticate,
  authorize(
    "HEAD_REGISTRAR",
    "SYSTEM_ADMIN",
    "CLASS_ADVISER",
    "TEACHER",
    ...gradeCoordinatorRoles,
  ),
  listSections,
);
router.get(
  "/:ayId",
  authenticate,
  authorize(
    "HEAD_REGISTRAR",
    "SYSTEM_ADMIN",
    "CLASS_ADVISER",
    "TEACHER",
    ...gradeCoordinatorRoles,
  ),
  listSections,
);
router.post(
  "/",
  authenticate,
  authorize(...sectionManagerRoles),
  validate(createSectionSchema),
  createSection,
);

router.post(
  "/:id/handover-adviser",
  authenticate,
  authorize(...sectionManagerRoles),
  validate(advisoryHandoverSchema),
  handoverAdviser,
);

router.put(
  "/:id",
  authenticate,
  authorize(...sectionManagerRoles),
  validate(updateSectionSchema),
  updateSection,
);
router.delete(
	'/:id',
	authenticate,
	authorize(...sectionManagerRoles),
	deleteSection,
);

router.get(
	'/:id/masterlist',
	authenticate,
	authorize('HEAD_REGISTRAR', 'SYSTEM_ADMIN', 'CLASS_ADVISER', 'TEACHER'),
	getSectionMasterlist,
);

router.get(
	'/:id/masterlist/sf1',
	authenticate,
	authorize('HEAD_REGISTRAR', 'SYSTEM_ADMIN', 'CLASS_ADVISER', 'TEACHER'),
	exportSectionSf1,
);

router.get(
  "/:id/masterlist/sf1/template",
  authenticate,
  authorize("HEAD_REGISTRAR", "SYSTEM_ADMIN", "CLASS_ADVISER", "TEACHER"),
  downloadSectionSf1Template,
);

router.post(
  "/:id/masterlist/sf1/import/preview",
  authenticate,
  authorize("HEAD_REGISTRAR", "SYSTEM_ADMIN", "CLASS_ADVISER", "TEACHER"),
  sf1Upload.single("file"),
  previewSectionSf1Import,
);

router.post(
  "/:id/masterlist/sf1/import/commit",
  authenticate,
  authorize("HEAD_REGISTRAR", "SYSTEM_ADMIN", "CLASS_ADVISER", "TEACHER"),
  validate(sf1ImportCommitSchema),
  staffIntakePhaseGuard,
  commitSectionSf1Import,
);

router.post(
  "/sf1/import",
  authenticate,
  authorize("HEAD_REGISTRAR", "SYSTEM_ADMIN", ...gradeCoordinatorRoles),
  sf1Upload.single("file"),
  bulkImportSf1,
);

router.post(
  "/:id/sf1/import",
  authenticate,
  authorize("HEAD_REGISTRAR", "SYSTEM_ADMIN", "CLASS_ADVISER", "TEACHER", ...gradeCoordinatorRoles),
  sf1Upload.single("file"),
  bulkImportSf1,
);

router.get(
	'/unsectioned-pool/:gradeLevelId',
	authenticate,
	authorize(...sectionManagerRoles),
	getUnsectionedPool,
);

router.post(
	'/:id/inline-slot',
	authenticate,
	authorize(...sectionManagerRoles),
	staffIntakePhaseGuard,
	inlineSlotLearner,
);

router.post(
  "/transfer-learner",
  authenticate,
  authorize(...sectionManagerRoles),
  transferLearner,
  forfeitSlot,
);

router.post(
  "/forfeit-slot",
  authenticate,
  authorize(...sectionManagerRoles),
  forfeitSlot,
);

router.get(
  "/grade-level/:gradeLevelId/export/xlsx",
  authenticate,
  authorize(...sectionManagerRoles),
  exportGradeLevelMasterlistXlsx,
);

router.get(
  "/grade-level/:gradeLevelId/export/pdf",
  authenticate,
  authorize(...sectionManagerRoles),
  exportGradeLevelMasterlistPdf,
);

export default router;
