import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../../lib/AppError.js";
import type { ApplicationStatus, Prisma } from "../../../generated/prisma";
import type { AdmissionControllerDeps } from "../services/admission-controller.deps.js";
import { createAdmissionControllerDeps } from "../services/admission-controller.deps.js";
import {
  VALID_TRANSITIONS,
  createEarlyRegistrationSharedService,
} from "../services/early-registration-shared.service.js";

export function createEarlyRegistrationOperationsController(
  deps: AdmissionControllerDeps = createAdmissionControllerDeps(),
) {
  const { prisma, auditLog, normalizeDateToUtcNoon } = deps;
  const {
    findApplicantOrThrow,
    assertTransition,
    queueEmail,
    flattenAssessmentData,
  } = createEarlyRegistrationSharedService(deps);
  async function pass(req: Request, res: Response, next: NextFunction) {
    try {
      const applicantId = parseInt(String(req.params.id));
      const applicant = await findApplicantOrThrow(applicantId);

      assertTransition(
        applicant,
        "PASSED",
        `Cannot mark as passed. Current status: "${applicant.status}". Only ASSESSMENT_TAKEN applications can be marked as passed.`,
      );

      const updated = await prisma.enrollmentApplication.update({
        where: { id: applicantId },
        data: { status: "PASSED" },
      });

      await auditLog({
        userId: req.user!.userId,
        actionType: "APPLICATION_PASSED",
        description: `Marked ${applicant.learner.firstName} ${applicant.learner.lastName} (#${applicantId}) as PASSED - ready for section assignment`,
        subjectType: "EnrollmentApplication",
        recordId: applicantId,
        req,
      });

      await queueEmail(
        applicantId,
        applicant.earlyRegistration?.email ?? null,
        `Assessment Passed - ${applicant.trackingNumber}`,
        "ASSESSMENT_PASSED",
      );

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  // â"€â"€ Mark as not qualified â"€â"€
  async function fail(req: Request, res: Response, next: NextFunction) {
    try {
      const { examNotes } = req.body;
      const applicantId = parseInt(String(req.params.id));
      const applicant = await findApplicantOrThrow(applicantId);

      assertTransition(
        applicant,
        "NOT_QUALIFIED",
        `Cannot mark as not qualified. Current status: "${applicant.status}". Only ASSESSMENT_TAKEN applications can be marked as not qualified.`,
      );

      // Store failure notes on the latest assessment and update status
      const updated = await prisma.$transaction(async (tx) => {
        if (examNotes) {
          const earlyRegId = applicant.earlyRegistrationId;
          if (earlyRegId) {
            const latestAssessment =
              await tx.earlyRegistrationAssessment.findFirst({
                where: { applicationId: earlyRegId },
                orderBy: { createdAt: "desc" },
              });
            if (latestAssessment) {
              await tx.earlyRegistrationAssessment.update({
                where: { id: latestAssessment.id },
                data: { notes: examNotes },
              });
            }
          }
        }

        return tx.enrollmentApplication.update({
          where: { id: applicantId },
          data: { status: "NOT_QUALIFIED" },
        });
      });

      await auditLog({
        userId: req.user!.userId,
        actionType: "APPLICATION_FAILED",
        description: `Marked ${applicant.learner.firstName} ${applicant.learner.lastName} (#${applicantId}) as NOT_QUALIFIED. Notes: ${examNotes || "N/A"}`,
        subjectType: "EnrollmentApplication",
        recordId: applicantId,
        req,
      });

      await queueEmail(
        applicantId,
        applicant.earlyRegistration?.email ?? null,
        `Assessment Result — ${applicant.trackingNumber}`,
        "ASSESSMENT_FAILED",
      );

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  // — Get application timeline (audit history) —
  async function getTimeline(req: Request, res: Response, next: NextFunction) {
    try {
      const applicantId = parseInt(String(req.params.id));
      await findApplicantOrThrow(applicantId);

      const timeline = await prisma.auditLog.findMany({
        where: {
          subjectType: { in: ["Applicant", "EnrollmentApplication"] },
          recordId: applicantId,
        },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({ timeline });
    } catch (error) {
      next(error);
    }
  }

  // — Offer regular section (for failed SCP applicants) —
  async function offerRegular(req: Request, res: Response, next: NextFunction) {
    try {
      const { sectionId } = req.body;
      const applicantId = parseInt(String(req.params.id));
      const applicant = await findApplicantOrThrow(applicantId);

      // Only allow offering regular section to NOT_QUALIFIED SCP applicants
      if (applicant.status !== "NOT_QUALIFIED") {
        throw new AppError(
          422,
          `Cannot offer regular section. Current status: "${applicant.status}". Only NOT_QUALIFIED applications can be offered a regular section.`,
        );
      }

      if (applicant.applicantType === "REGULAR") {
        throw new AppError(
          422,
          "This applicant is already in the regular program.",
        );
      }

      const originalType = applicant.applicantType;

      const result = await prisma.$transaction(async (tx) => {
        // Lock section for capacity check
        const [section] = await tx.$queryRaw<
          { id: number; maxCapacity: number }[]
        >`
        SELECT id, "max_capacity" as "maxCapacity" FROM "sections" WHERE id = ${sectionId} FOR UPDATE
      `;

        if (!section) throw new AppError(404, "Section not found");

        const enrolledCount = await tx.enrollmentRecord.count({
          where: { sectionId },
        });
        if (enrolledCount >= section.maxCapacity) {
          throw new AppError(422, "This section has reached maximum capacity");
        }

        // Update applicant to REGULAR type and create enrollment
        await tx.enrollmentApplication.update({
          where: { id: applicantId },
          data: {
            applicantType: "REGULAR",
            status: "PRE_REGISTERED",
          },
        });

        const enrollment = await tx.enrollmentRecord.create({
          data: {
            enrollmentApplicationId: applicantId,
            sectionId,
            schoolYearId: applicant.schoolYearId,
            enrolledById: req.user!.userId,
          },
        });

        return enrollment;
      });

      await auditLog({
        userId: req.user!.userId,
        actionType: "OFFER_REGULAR_SECTION",
        description: `Converted ${applicant.learner.firstName} ${applicant.learner.lastName} (#${applicantId}) from ${originalType} to REGULAR and assigned to section ${sectionId}`,
        subjectType: "EnrollmentApplication",
        recordId: applicantId,
        req,
      });

      await queueEmail(
        applicantId,
        applicant.earlyRegistration?.email ?? null,
        `Regular Section Placement — ${applicant.trackingNumber}`,
        "APPLICATION_APPROVED",
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // — Navigate to prev/next application —
  async function navigate(req: Request, res: Response, next: NextFunction) {
    try {
      const currentId = parseInt(String(req.params.id));
      const direction = req.query.direction as "prev" | "next";
      const { status, gradeLevelId, applicantType, search } = req.query;

      if (!direction || !["prev", "next"].includes(direction)) {
        throw new AppError(400, 'Direction must be "prev" or "next"');
      }

      // Build the same filter as the list
      const where: Prisma.EnrollmentApplicationWhereInput = {};

      // Scope to active School Year by default
      const settings = await prisma.schoolSetting.findFirst({
        select: { activeSchoolYearId: true },
      });
      if (settings?.activeSchoolYearId) {
        where.schoolYearId = settings.activeSchoolYearId;
      }

      if (search) {
        const s = String(search);
        where.OR = [
          { learner: { lrn: { contains: s, mode: "insensitive" } } },
          { learner: { firstName: { contains: s, mode: "insensitive" } } },
          { learner: { lastName: { contains: s, mode: "insensitive" } } },
          { trackingNumber: { contains: s, mode: "insensitive" } },
        ];
      }
      if (gradeLevelId) where.gradeLevelId = parseInt(String(gradeLevelId));
      if (status && status !== "ALL")
        where.status = status as Prisma.EnumApplicationStatusFilter;
      if (applicantType && applicantType !== "ALL")
        where.applicantType = applicantType as Prisma.EnumApplicantTypeFilter;

      // Get ordered list of IDs
      const applications = await prisma.enrollmentApplication.findMany({
        where,
        select: { id: true },
        orderBy: { createdAt: "desc" },
      });

      const ids = applications.map((a) => a.id);
      const currentIndex = ids.indexOf(currentId);

      if (currentIndex === -1) {
        throw new AppError(404, "Current application not found in list");
      }

      let targetId: number | null = null;
      if (direction === "prev" && currentIndex > 0) {
        targetId = ids[currentIndex - 1];
      } else if (direction === "next" && currentIndex < ids.length - 1) {
        targetId = ids[currentIndex + 1];
      }

      res.json({
        currentIndex,
        totalCount: ids.length,
        previousId: currentIndex > 0 ? ids[currentIndex - 1] : null,
        nextId: currentIndex < ids.length - 1 ? ids[currentIndex + 1] : null,
        targetId,
      });
    } catch (error) {
      next(error);
    }
  }

  // — Get sections for section assignment dialog —
  async function getSectionsForAssignment(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const applicantId = parseInt(String(req.params.id));

      const applicant = await prisma.enrollmentApplication.findUnique({
        where: { id: applicantId },
        include: { gradeLevel: true, learner: true },
      });
      if (!applicant)
        throw new AppError(404, "Enrollment application not found");

      const sections = await prisma.section.findMany({
        where: { gradeLevelId: applicant.gradeLevelId },
        include: {
          advisingTeacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              middleName: true,
            },
          },
          _count: { select: { enrollmentRecords: true } },
        },
        orderBy: { name: "asc" },
      });

      const formatted = sections.map((s) => ({
        id: s.id,
        name: s.name,
        maxCapacity: s.maxCapacity,
        enrolledCount: s._count.enrollmentRecords,
        availableSlots: s.maxCapacity - s._count.enrollmentRecords,
        fillPercent:
          s.maxCapacity > 0
            ? Math.round((s._count.enrollmentRecords / s.maxCapacity) * 100)
            : 0,
        isFull: s._count.enrollmentRecords >= s.maxCapacity,
        isNearFull: s._count.enrollmentRecords >= s.maxCapacity * 0.8,
        advisingTeacher: s.advisingTeacher
          ? {
              id: s.advisingTeacher.id,
              name: `${s.advisingTeacher.lastName}, ${s.advisingTeacher.firstName}${s.advisingTeacher.middleName ? ` ${s.advisingTeacher.middleName.charAt(0)}.` : ""}`,
            }
          : null,
      }));

      res.json({
        applicant: {
          id: applicant.id,
          firstName: applicant.learner.firstName,
          lastName: applicant.learner.lastName,
          gradeLevelId: applicant.gradeLevelId,
          gradeLevelName: applicant.gradeLevel.name,
        },
        sections: formatted,
      });
    } catch (error) {
      next(error);
    }
  }

  // — Update application info —
  async function update(req: Request, res: Response, next: NextFunction) {
    try {
      const applicantId = parseInt(String(req.params.id));

      // Whitelist editable fields to prevent status/tracking/schoolYear tampering
      const {
        firstName,
        middleName,
        lastName,
        suffix,
        lrn,
        sex,
        birthDate,
        placeOfBirth,
        motherTongue,
        religion,
        isIpCommunity,
        ipGroupName,
        is4PsBeneficiary,
        householdId4Ps,
        gradeLevelId,
        applicantType,
        studentPhoto,
        learnerType,
      } = req.body;

      // Get the current application to find the learnerId
      const currentApp = await prisma.enrollmentApplication.findUnique({
        where: { id: applicantId },
        select: { learnerId: true },
      });
      if (!currentApp)
        throw new AppError(404, "Enrollment application not found");

      // Fields that belong to Learner model
      const learnerData: Record<string, any> = {};
      if (firstName !== undefined) learnerData.firstName = firstName;
      if (middleName !== undefined) learnerData.middleName = middleName;
      if (lastName !== undefined) learnerData.lastName = lastName;
      if (suffix !== undefined) learnerData.extensionName = suffix;
      if (lrn !== undefined) learnerData.lrn = lrn;
      if (sex !== undefined) learnerData.sex = sex;
      if (birthDate !== undefined)
        learnerData.birthdate = normalizeDateToUtcNoon(new Date(birthDate));
      if (placeOfBirth !== undefined) learnerData.placeOfBirth = placeOfBirth;
      if (motherTongue !== undefined) learnerData.motherTongue = motherTongue;
      if (religion !== undefined) learnerData.religion = religion;
      if (isIpCommunity !== undefined)
        learnerData.isIpCommunity = isIpCommunity;
      if (ipGroupName !== undefined) learnerData.ipGroupName = ipGroupName;
      if (is4PsBeneficiary !== undefined)
        learnerData.is4PsBeneficiary = is4PsBeneficiary;
      if (householdId4Ps !== undefined)
        learnerData.householdId4Ps = householdId4Ps;

      // Fields that belong to EnrollmentApplication model
      const appData: Record<string, any> = {};
      if (applicantType !== undefined) appData.applicantType = applicantType;
      if (studentPhoto !== undefined) appData.studentPhoto = studentPhoto;
      if (learnerType !== undefined) appData.learnerType = learnerType;
      if (gradeLevelId !== undefined)
        appData.gradeLevel = { connect: { id: gradeLevelId } };

      const updated = await prisma.$transaction(async (tx) => {
        if (Object.keys(learnerData).length > 0) {
          await tx.learner.update({
            where: { id: currentApp.learnerId },
            data: learnerData,
          });
        }

        return tx.enrollmentApplication.update({
          where: { id: applicantId },
          data: appData,
          include: { learner: true },
        });
      });

      await auditLog({
        userId: req.user!.userId,
        actionType: "APPLICATION_UPDATED",
        description: `Updated application info for ${updated.learner.firstName} ${updated.learner.lastName} (#${applicantId})`,
        subjectType: "EnrollmentApplication",
        recordId: applicantId,
        req,
      });

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  // — Show detailed application info —
  async function showDetailed(req: Request, res: Response, next: NextFunction) {
    try {
      const application = await prisma.enrollmentApplication.findUnique({
        where: { id: parseInt(String(req.params.id)) },
        include: {
          learner: true,
          gradeLevel: true,
          schoolYear: true,
          addresses: true,
          familyMembers: true,
          previousSchool: true,
          earlyRegistration: {
            include: {
              assessments: { orderBy: { createdAt: "desc" } },
            },
          },
          programDetail: true,
          documents: {
            include: {
              uploadedBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
          },
          checklist: {
            include: {
              updatedBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
          },
          encodedBy: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
          enrollmentRecord: {
            include: {
              section: {
                include: {
                  advisingTeacher: {
                    select: { id: true, firstName: true, lastName: true },
                  },
                },
              },
              enrolledBy: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
          emailLogs: {
            orderBy: { attemptedAt: "desc" },
            take: 10,
          },
        },
      });

      if (!application) throw new AppError(404, "Application not found");

      // Fetch audit logs for the application
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          subjectType: { in: ["Applicant", "EnrollmentApplication"] },
          recordId: application.id,
        },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(await flattenAssessmentData({ ...application, auditLogs }));
    } catch (error) {
      next(error);
    }
  }

  // — Reschedule assessment —
  async function rescheduleAssessmentStep(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { stepOrder, kind, scheduledDate, scheduledTime, venue } = req.body;
      const applicantId = parseInt(String(req.params.id));
      const applicant = await findApplicantOrThrow(applicantId);

      const earlyRegId = applicant.earlyRegistrationId;
      if (!earlyRegId) throw new AppError(400, "No early registration linked");

      // Create a new assessment record for the reschedule
      const updated = await prisma.$transaction(async (tx) => {
        await tx.earlyRegistrationAssessment.create({
          data: {
            applicationId: earlyRegId,
            type: (kind || "QUALIFYING_EXAMINATION") as any,
            scheduledDate: normalizeDateToUtcNoon(new Date(scheduledDate)),
            scheduledTime: scheduledTime || null,
            venue: venue || null,
            notes: "Rescheduled",
          },
        });

        return tx.enrollmentApplication.update({
          where: { id: applicantId },
          data: { status: "ASSESSMENT_SCHEDULED" },
        });
      });

      await auditLog({
        userId: req.user!.userId,
        actionType: "ASSESSMENT_RESCHEDULED",
        description: `Rescheduled step ${stepOrder ?? "?"} (${kind || "WRITTEN_EXAM"}) for ${applicant.learner.firstName} ${applicant.learner.lastName} (#${applicantId}) to ${scheduledDate}`,
        subjectType: "EnrollmentApplication",
        recordId: applicantId,
        req,
      });

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  // Legacy alias
  const rescheduleExam = rescheduleAssessmentStep;

  // ── Batch Process Registration ──

  async function batchProcess(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids, targetStatus } = req.body as {
        ids: number[];
        targetStatus: ApplicationStatus;
      };

      // Fetch all applications in a single query
      const applicants = await prisma.enrollmentApplication.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          status: true,
          learner: { select: { firstName: true, lastName: true } },
          trackingNumber: true,
        },
      });

      const foundIds = new Set(applicants.map((a) => a.id));

      const succeeded: Array<{
        id: number;
        name: string;
        trackingNumber: string;
        previousStatus: string;
      }> = [];
      const failed: Array<{
        id: number;
        name: string;
        trackingNumber: string;
        reason: string;
      }> = [];

      // Categorize: valid transitions vs invalid
      const validApplicants: typeof applicants = [];

      for (const id of ids) {
        if (!foundIds.has(id)) {
          failed.push({
            id,
            name: "Unknown",
            trackingNumber: "",
            reason: "Applicant not found",
          });
          continue;
        }

        const applicant = applicants.find((a) => a.id === id)!;
        const allowedTransitions = VALID_TRANSITIONS[applicant.status] ?? [];

        if (!allowedTransitions.includes(targetStatus)) {
          failed.push({
            id: applicant.id,
            name: `${applicant.learner.lastName}, ${applicant.learner.firstName}`,
            trackingNumber: applicant.trackingNumber ?? "",
            reason: `Cannot transition from "${applicant.status}" to "${targetStatus}"`,
          });
          continue;
        }

        validApplicants.push(applicant);
      }

      // Execute all valid transitions in a single atomic transaction
      if (validApplicants.length > 0) {
        await prisma.$transaction(async (tx) => {
          for (const applicant of validApplicants) {
            await tx.enrollmentApplication.update({
              where: { id: applicant.id },
              data: { status: targetStatus },
            });
          }
        });

        // Record successes
        for (const applicant of validApplicants) {
          succeeded.push({
            id: applicant.id,
            name: `${applicant.learner.lastName}, ${applicant.learner.firstName}`,
            trackingNumber: applicant.trackingNumber ?? "",
            previousStatus: applicant.status,
          });
        }

        // Audit log each successful transition (non-critical, outside transaction)
        for (const applicant of validApplicants) {
          auditLog({
            userId: req.user!.userId,
            actionType: "STATUS_CHANGED",
            description: `Batch: ${applicant.learner.firstName} ${applicant.learner.lastName} (#${applicant.id}) status changed from ${applicant.status} to ${targetStatus}`,
            subjectType: "EnrollmentApplication",
            recordId: applicant.id,
            req,
          }).catch(() => {});
        }
      }

      res.json({
        processed: ids.length,
        succeeded,
        failed,
      });
    } catch (error) {
      next(error);
    }
  }
  return {
    pass,
    fail,
    getTimeline,
    offerRegular,
    navigate,
    getSectionsForAssignment,
    update,
    showDetailed,
    rescheduleAssessmentStep,
    rescheduleExam,
    batchProcess,
  };
}

const operationsController = createEarlyRegistrationOperationsController();

export const pass = operationsController.pass;
export const fail = operationsController.fail;
export const getTimeline = operationsController.getTimeline;
export const offerRegular = operationsController.offerRegular;
export const navigate = operationsController.navigate;
export const getSectionsForAssignment =
  operationsController.getSectionsForAssignment;
export const update = operationsController.update;
export const showDetailed = operationsController.showDetailed;
export const rescheduleAssessmentStep =
  operationsController.rescheduleAssessmentStep;
export const rescheduleExam = operationsController.rescheduleExam;
export const batchProcess = operationsController.batchProcess;
