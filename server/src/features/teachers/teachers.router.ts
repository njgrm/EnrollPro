import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import * as teachersCtrl from "./teachers.controller.js";
import { validate } from "../../middleware/validate.js";
import { secureUpload } from "../../lib/multer.js";
import {
  teacherSchema,
  updateTeacherSchema,
  teacherDesignationSchema,
  deactivateTeacherSchema,
  updateServiceStatusSchema,
} from "@enrollpro/shared";

const router: Router = Router();

// Authentication required for all teacher endpoints
router.use(authenticate);

// Profile endpoint accessible to any authenticated personnel user for their own profile
router.get("/profile", teachersCtrl.getProfile);

// Show endpoint allows SYSTEM_ADMIN, PRINCIPAL, or the teacher themselves
router.get("/:id", teachersCtrl.show);

// All management and mutation routes require SYSTEM_ADMIN or PRINCIPAL role
router.use(authorize("SYSTEM_ADMIN", "PRINCIPAL"));

router.get("/", teachersCtrl.index);
router.get("/:id/designation", teachersCtrl.showDesignation);
router.get("/:id/schedule-periods", teachersCtrl.listSchedulePeriods);

router.post(
  "/:id/designation/validate",
  validate(teacherDesignationSchema),
  teachersCtrl.validateDesignation,
);
router.put(
  "/:id/designation",
  validate(teacherDesignationSchema),
  teachersCtrl.upsertDesignation,
);
router.post("/", validate(teacherSchema), teachersCtrl.store);
router.patch("/:id", validate(updateTeacherSchema), teachersCtrl.update);
router.post("/:id/photo", secureUpload.single("photo"), teachersCtrl.uploadPhoto);
router.delete("/:id/photo", teachersCtrl.removePhoto);
router.patch("/:id/portal-access", teachersCtrl.togglePortalAccess);
router.post("/:id/reset-password", teachersCtrl.resetPassword);
router.patch(
  "/:id/deactivate",
  validate(deactivateTeacherSchema),
  teachersCtrl.deactivate,
);
router.patch("/:id/reactivate", teachersCtrl.reactivate);
router.patch(
  "/:id/service-status",
  validate(updateServiceStatusSchema),
  teachersCtrl.updateServiceStatus,
);

export default router;
