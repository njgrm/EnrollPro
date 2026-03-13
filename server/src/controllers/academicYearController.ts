import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { auditLog } from '../services/auditLogger.js';

export async function listAcademicYears(_req: Request, res: Response): Promise<void> {
  const years = await prisma.academicYear.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { gradeLevels: true, strands: true, applicants: true, enrollments: true } },
    },
  });
  res.json({ years });
}

export async function getAcademicYear(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string);
  const year = await prisma.academicYear.findUnique({
    where: { id },
    include: {
      gradeLevels: { orderBy: { displayOrder: 'asc' }, include: { sections: { include: { _count: { select: { enrollments: true } } } } } },
      strands: true,
      _count: { select: { applicants: true, enrollments: true } },
    },
  });
  if (!year) {
    res.status(404).json({ message: 'School year not found' });
    return;
  }
  res.json({ year });
}

export async function createAcademicYear(req: Request, res: Response): Promise<void> {
  const { yearLabel, startDate, endDate, cloneFromId } = req.body;

  if (!yearLabel || typeof yearLabel !== 'string') {
    res.status(400).json({ message: 'yearLabel is required' });
    return;
  }

  const existing = await prisma.academicYear.findUnique({ where: { yearLabel } });
  if (existing) {
    res.status(400).json({ message: 'A school year with this label already exists' });
    return;
  }

  const year = await prisma.academicYear.create({
    data: {
      yearLabel,
      status: 'DRAFT',
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      clonedFromId: cloneFromId ?? null,
    },
  });

  // Clone structure if requested
  if (cloneFromId) {
    const source = await prisma.academicYear.findUnique({
      where: { id: cloneFromId },
      include: {
        gradeLevels: { include: { sections: true } },
        strands: true,
      },
    });

    if (source) {
      const gradeLevelIdMap = new Map<number, number>();

      for (const gl of source.gradeLevels) {
        const newGl = await prisma.gradeLevel.create({
          data: {
            name: gl.name,
            displayOrder: gl.displayOrder,
            academicYearId: year.id,
          },
        });
        gradeLevelIdMap.set(gl.id, newGl.id);

        for (const sec of gl.sections) {
          await prisma.section.create({
            data: {
              name: sec.name,
              maxCapacity: sec.maxCapacity,
              gradeLevelId: newGl.id,
            },
          });
        }
      }

      for (const strand of source.strands) {
        await prisma.strand.create({
          data: {
            name: strand.name,
            applicableGradeLevelIds: strand.applicableGradeLevelIds
              .map((id) => gradeLevelIdMap.get(id))
              .filter((id): id is number => id !== undefined),
            academicYearId: year.id,
          },
        });
      }
    }
  }

  await auditLog({
    userId: req.user!.userId,
    actionType: 'AY_CREATED',
    description: `Created school year "${yearLabel}"${cloneFromId ? ` (cloned from ID ${cloneFromId})` : ''}`,
    subjectType: 'AcademicYear',
    subjectId: year.id,
    req,
  });

  const full = await prisma.academicYear.findUnique({
    where: { id: year.id },
    include: {
      gradeLevels: { orderBy: { displayOrder: 'asc' } },
      strands: true,
      _count: { select: { applicants: true, enrollments: true } },
    },
  });

  res.status(201).json({ year: full });
}

export async function updateAcademicYear(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string);
  const { yearLabel, startDate, endDate } = req.body;

  const year = await prisma.academicYear.findUnique({ where: { id } });
  if (!year) {
    res.status(404).json({ message: 'School year not found' });
    return;
  }

  if (year.status === 'ARCHIVED') {
    res.status(400).json({ message: 'Cannot edit an archived school year' });
    return;
  }

  const updated = await prisma.academicYear.update({
    where: { id },
    data: {
      ...(yearLabel ? { yearLabel } : {}),
      ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
      ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
    },
  });

  await auditLog({
    userId: req.user!.userId,
    actionType: 'AY_UPDATED',
    description: `Updated school year "${updated.yearLabel}"`,
    subjectType: 'AcademicYear',
    subjectId: id,
    req,
  });

  res.json({ year: updated });
}

export async function transitionAcademicYear(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string);
  const { status } = req.body;

  const validStatuses = ['DRAFT', 'UPCOMING', 'ACTIVE', 'ARCHIVED'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  const year = await prisma.academicYear.findUnique({ where: { id } });
  if (!year) {
    res.status(404).json({ message: 'School year not found' });
    return;
  }

  // If setting to ACTIVE, deactivate all others and update settings
  if (status === 'ACTIVE') {
    await prisma.academicYear.updateMany({
      where: { status: 'ACTIVE', id: { not: id } },
      data: { status: 'ARCHIVED', isActive: false },
    });

    await prisma.academicYear.update({
      where: { id },
      data: { status: 'ACTIVE', isActive: true },
    });

    // Also update SchoolSettings
    const settings = await prisma.schoolSettings.findFirst();
    if (settings) {
      await prisma.schoolSettings.update({
        where: { id: settings.id },
        data: { activeAcademicYearId: id },
      });
    }
  } else {
    await prisma.academicYear.update({
      where: { id },
      data: {
        status,
        isActive: false,
      },
    });

    // If was active, clear settings
    if (year.isActive) {
      const settings = await prisma.schoolSettings.findFirst();
      if (settings && settings.activeAcademicYearId === id) {
        await prisma.schoolSettings.update({
          where: { id: settings.id },
          data: { activeAcademicYearId: null },
        });
      }
    }
  }

  await auditLog({
    userId: req.user!.userId,
    actionType: 'AY_STATUS_CHANGED',
    description: `School year "${year.yearLabel}" status changed to ${status}`,
    subjectType: 'AcademicYear',
    subjectId: id,
    req,
  });

  const updated = await prisma.academicYear.findUnique({ where: { id } });
  res.json({ year: updated });
}

export async function deleteAcademicYear(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string);

  const year = await prisma.academicYear.findUnique({
    where: { id },
    include: { _count: { select: { applicants: true, enrollments: true } } },
  });

  if (!year) {
    res.status(404).json({ message: 'School year not found' });
    return;
  }

  if (year.status === 'ACTIVE') {
    res.status(400).json({ message: 'Cannot delete the active school year' });
    return;
  }

  if (year._count.applicants > 0 || year._count.enrollments > 0) {
    res.status(400).json({ message: 'Cannot delete a school year with existing records' });
    return;
  }

  await prisma.academicYear.delete({ where: { id } });

  await auditLog({
    userId: req.user!.userId,
    actionType: 'AY_DELETED',
    description: `Deleted school year "${year.yearLabel}"`,
    subjectType: 'AcademicYear',
    subjectId: id,
    req,
  });

  res.json({ message: 'School year deleted' });
}
