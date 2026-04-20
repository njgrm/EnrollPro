import { prisma } from "../../lib/prisma.js";
import type {
  Prisma,
  ApplicationStatus,
} from "../../generated/prisma/index.js";

export async function findStudents(query: {
  search?: string;
  gradeLevelId?: number;
  sectionId?: number;
  status?: ApplicationStatus;
  page?: number;
  limit?: number;
}) {
  const {
    search,
    gradeLevelId,
    sectionId,
    status,
    page = 1,
    limit = 15,
  } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.EnrollmentApplicationWhereInput = {
    // Usually only show enrolled students in the student list
    status: status || "ENROLLED",
  };

  if (search) {
    const s = String(search);
    where.OR = [
      { learner: { lrn: { contains: s, mode: "insensitive" } } },
      { learner: { firstName: { contains: s, mode: "insensitive" } } },
      { learner: { lastName: { contains: s, mode: "insensitive" } } },
      { trackingNumber: { contains: s, mode: "insensitive" } },
    ];
  }

  if (gradeLevelId) where.gradeLevelId = gradeLevelId;
  if (sectionId) where.enrollmentRecord = { sectionId };

  const total = await prisma.enrollmentApplication.count({ where });
  const applications = await prisma.enrollmentApplication.findMany({
    where,
    include: {
      learner: true,
      gradeLevel: true,
      enrollmentRecord: {
        include: {
          section: true,
        },
      },
      addresses: true,
      familyMembers: true,
    },
    orderBy: { updatedAt: "desc" },
    skip,
    take: limit,
  });

  return {
    applications,
    total,
    page,
    limit,
  };
}
