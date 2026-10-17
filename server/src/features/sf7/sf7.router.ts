import { Router } from "express";
import multer from "multer";
import { sf7ImportCommitSchema } from "@enrollpro/shared";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import {
  commitImport,
  directImport,
  downloadTemplate,
  previewImport,
  syncAtlas,
} from "./sf7.controller.js";

const router: Router = Router();

const sf7Upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const lowerName = file.originalname.toLowerCase();
    const lowerMime = file.mimetype.toLowerCase();
    const isExcel =
      lowerMime ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      lowerMime === "application/vnd.ms-excel" ||
      lowerName.endsWith(".xlsx") ||
      lowerName.endsWith(".xls");
    const isCsv =
      lowerMime === "text/csv" ||
      lowerMime === "application/csv" ||
      lowerName.endsWith(".csv");
    if (isExcel || isCsv) {
      callback(null, true);
      return;
    }
    callback(new Error("Only .xlsx, .xls, or .csv School Form 7 files are allowed."));
  },
});

router.use(authenticate, authorize("HEAD_REGISTRAR", "SYSTEM_ADMIN"));

router.get("/template", downloadTemplate);
router.post("/import", sf7Upload.single("file"), directImport);
router.post("/import/preview", sf7Upload.single("file"), previewImport);
router.post("/import/commit", validate(sf7ImportCommitSchema), commitImport);
router.post("/sync-atlas", syncAtlas);

export default router;
