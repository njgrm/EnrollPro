import type { Request, Response } from "express";

import { AppError } from "../../../lib/AppError.js";
import { prisma } from "../../../lib/prisma.js";
import { fetchSmartBackSubjectsForLearner } from "../../integration/smart-back-subjects.service.js";
import { canCoordinatorAccessLearner } from "../../sections/grade-level-scope.service.js";

export async function getStudentBackSubjects(
  req: Request,
  res: Response,
): Promise<void> {
  const learnerIdentifier = String(req.params.id ?? "").trim();
  const isLrn = /^\d{12}$/.test(learnerIdentifier);
  const learnerId = isLrn
    ? null
    : Number.parseInt(learnerIdentifier, 10);
  const requestedSchoolYearId = Number.parseInt(
    String(req.query.schoolYearId ?? req.schoolYearId ?? ""),
    10,
  );

  if (
    !isLrn &&
    (learnerId === null ||
      !Number.isSafeInteger(learnerId) ||
      learnerId <= 0)
  ) {
    throw new AppError(
      400,
      "Invalid learner identifier.",
      "LEARNER_ID_INVALID",
    );
  }
  if (!Number.isInteger(requestedSchoolYearId) || requestedSchoolYearId <= 0) {
    throw new AppError(
      400,
      "A valid school year is required.",
      "SCHOOL_YEAR_REQUIRED",
    );
  }

  const learnerPromise = isLrn
    ? prisma.learner.findUnique({
        where: { lrn: learnerIdentifier },
        select: { id: true, lrn: true },
      })
    : prisma.learner.findUnique({
        where: { id: learnerId ?? -1 },
        select: { id: true, lrn: true },
      });

  const [learner, schoolYear] = await Promise.all([
    learnerPromise,
    prisma.schoolYear.findUnique({
      where: { id: requestedSchoolYearId },
      select: { yearLabel: true },
    }),
  ]);

  if (!learner) {
    throw new AppError(404, "Learner not found.", "LEARNER_NOT_FOUND");
  }
  if (!schoolYear) {
    throw new AppError(404, "School year not found.", "SCHOOL_YEAR_NOT_FOUND");
  }

  const accessCheck = await canCoordinatorAccessLearner(
    req,
    learner.id,
    requestedSchoolYearId,
  );
  if (!accessCheck.allowed) {
    throw new AppError(
      403,
      "Access denied: You can only view student records in your assigned grade level.",
      "GRADE_LEVEL_FORBIDDEN",
    );
  }
  if (!learner.lrn || !/^\d{12}$/.test(learner.lrn)) {
    throw new AppError(
      409,
      "The learner requires a valid 12-digit LRN before SMART records can be fetched.",
      "LEARNER_LRN_REQUIRED",
    );
  }

  res.json(
    await fetchSmartBackSubjectsForLearner({
      lrn: learner.lrn,
      schoolYear: schoolYear.yearLabel,
    }),
  );
}
