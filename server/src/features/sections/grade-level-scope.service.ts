import type { Request } from "express"
import { prisma } from "../../lib/prisma.js"

export const gradeCoordinatorRoleToOrder = {
  "GRADE 7 COORDINATOR": 7,
  "GRADE 8 COORDINATOR": 8,
  "GRADE 9 COORDINATOR": 9,
  "GRADE 10 COORDINATOR": 10,
} as const

const unrestrictedRoles = new Set([
  "SYSTEM_ADMIN",
  "HEAD_REGISTRAR",
  "PRINCIPAL",
  "SCHOOL_REGISTRAR",
])

export function isGradeLevelCoordinator(req: Request): boolean {
  if ((req.user?.roles ?? []).includes("GRADE_LEVEL_COORDINATOR")) return true

  const allRoles = [
    ...(req.user?.roles ?? []),
    ...(req.user?.ancillaryRoles ?? []),
  ]
  return Object.keys(gradeCoordinatorRoleToOrder).some((role) =>
    allRoles.includes(role),
  )
}

export async function getGradeCoordinatorGradeLevelIds(
  req: Request,
): Promise<number[]> {
  const allRoles = [
    ...(req.user?.roles ?? []),
    ...(req.user?.ancillaryRoles ?? []),
  ]
  const displayOrders = Object.entries(gradeCoordinatorRoleToOrder)
    .filter(([role]) => allRoles.includes(role))
    .map(([, displayOrder]) => displayOrder)

  if (displayOrders.length === 0) return []

  const gradeLevels = await prisma.gradeLevel.findMany({
    where: { displayOrder: { in: displayOrders } },
    select: { id: true },
  })
  return gradeLevels.map((gradeLevel) => gradeLevel.id)
}

export async function getSectionManagementGradeScope(
  req: Request,
): Promise<number[] | null> {
  const roles = req.user?.roles ?? []
  if (roles.some((role) => unrestrictedRoles.has(role))) {
    return null
  }
  return getGradeCoordinatorGradeLevelIds(req)
}

export async function getLearnerDirectoryGradeScope(
  req: Request,
): Promise<number[] | null> {
  const roles = req.user?.roles ?? []
  if (roles.some((role) => unrestrictedRoles.has(role))) {
    return null
  }
  if (isGradeLevelCoordinator(req)) {
    return getGradeCoordinatorGradeLevelIds(req)
  }
  return null
}

export function isGradeLevelWithinScope(
  scopedGradeLevelIds: number[] | null,
  gradeLevelId: number,
): boolean {
  return scopedGradeLevelIds === null || scopedGradeLevelIds.includes(gradeLevelId)
}

export async function getLearnerGradeLevelId(
  learnerId: number,
  schoolYearId?: number,
): Promise<number | null> {
  if (schoolYearId) {
    const app = await prisma.enrollmentApplication.findFirst({
      where: { learnerId, schoolYearId },
      select: { gradeLevelId: true },
    });
    if (app?.gradeLevelId) return app.gradeLevelId;

    const hist = await prisma.enrollmentHistory.findFirst({
      where: { learnerId, schoolYearId },
      select: { gradeLevelId: true },
    });
    if (hist?.gradeLevelId) return hist.gradeLevelId;
  }

  const latestApp = await prisma.enrollmentApplication.findFirst({
    where: { learnerId },
    orderBy: { createdAt: "desc" },
    select: { gradeLevelId: true },
  });
  if (latestApp?.gradeLevelId) return latestApp.gradeLevelId;

  const latestHist = await prisma.enrollmentHistory.findFirst({
    where: { learnerId },
    orderBy: { createdAt: "desc" },
    select: { gradeLevelId: true },
  });
  return latestHist?.gradeLevelId ?? null;
}

export async function canCoordinatorAccessLearner(
  req: Request,
  learnerId: number,
  schoolYearId?: number,
): Promise<{ allowed: boolean; exists: boolean }> {
  const scope = await getLearnerDirectoryGradeScope(req);
  if (scope === null) return { allowed: true, exists: true };

  const learner = await prisma.learner.findUnique({
    where: { id: learnerId },
    select: { id: true },
  });
  if (!learner) {
    return { allowed: true, exists: false };
  }

  const learnerGradeId = await getLearnerGradeLevelId(learnerId, schoolYearId);
  if (!learnerGradeId || !scope.includes(learnerGradeId)) {
    return { allowed: false, exists: true };
  }

  return { allowed: true, exists: true };
}
