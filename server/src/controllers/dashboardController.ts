import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export async function getStats(req: Request, res: Response): Promise<void> {
  const settings = await prisma.schoolSettings.findFirst();
  const academicYearId = settings?.activeAcademicYearId;

  const [totalPending, totalEnrolled, totalApproved, sectionsAtCapacity] = await Promise.all([
    prisma.applicant.count({
      where: { status: 'PENDING', ...(academicYearId ? { academicYearId } : {}) },
    }),
    prisma.enrollment.count({
      where: academicYearId ? { academicYearId } : {},
    }),
    prisma.applicant.count({
      where: {
        status: 'APPROVED',
        enrollment: null,
        ...(academicYearId ? { academicYearId } : {}),
      },
    }),
    // Count sections at capacity
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count FROM "Section" s
      WHERE (SELECT COUNT(*) FROM "Enrollment" e WHERE e."sectionId" = s.id) >= s."maxCapacity"
    `,
  ]);

  res.json({
    stats: {
      totalPending,
      totalEnrolled,
      totalApproved,
      sectionsAtCapacity: Number(sectionsAtCapacity[0]?.count ?? 0),
    },
  });
}
