import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export async function getStats(req: Request, res: Response): Promise<void> {
  const settings = await prisma.schoolSettings.findFirst();
  const academicYearId = settings?.activeAcademicYearId;

  const [totalPending, totalEnrolled, totalPreRegistered, sectionsAtCapacity] = await Promise.all([
    prisma.applicant.count({
      where: { 
        status: { in: ['SUBMITTED', 'UNDER_REVIEW'] }, 
        ...(academicYearId ? { academicYearId } : {}) 
      },
    }),
    prisma.applicant.count({
      where: { 
        status: 'ENROLLED', 
        ...(academicYearId ? { academicYearId } : {}) 
      },
    }),
    prisma.applicant.count({
      where: {
        status: 'PRE_REGISTERED',
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
      totalPreRegistered,
      sectionsAtCapacity: Number(sectionsAtCapacity[0]?.count ?? 0),
    },
  });
}
