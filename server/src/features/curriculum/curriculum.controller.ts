import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { auditLog } from '../audit-logs/audit-logs.service.js';
import { normalizeDateToUtcNoon } from '../school-year/school-year.service.js';
import {
	SCP_DEFAULT_PIPELINES,
	getSteSteps,
	type ScpType,
} from '@enrollpro/shared';

// ─── Grade Levels ─────────────────────────────────────────

export async function listGradeLevels(
	req: Request,
	res: Response,
): Promise<void> {
	const ayId = parseInt(req.params.ayId as string);
	const gradeLevels = await prisma.gradeLevel.findMany({
		where: { schoolYearId: ayId },
		orderBy: { displayOrder: 'asc' },
		include: {
			sections: {
				include: { _count: { select: { enrollments: true } } },
			},
		},
	});
	res.json({ gradeLevels });
}

export async function createGradeLevel(
	req: Request,
	res: Response,
): Promise<void> {
	const ayId = parseInt(req.params.ayId as string);
	const { name, displayOrder } = req.body;

	if (!name) {
		res.status(400).json({ message: 'Name is required' });
		return;
	}

	const count = await prisma.gradeLevel.count({
		where: { schoolYearId: ayId },
	});

	const gl = await prisma.gradeLevel.create({
		data: {
			name,
			displayOrder: displayOrder ?? count + 1,
			schoolYearId: ayId,
		},
	});

	await auditLog({
		userId: req.user!.userId,
		actionType: 'GRADE_LEVEL_CREATED',
		description: `Created grade level "${name}"`,
		subjectType: 'GradeLevel',
		recordId: gl.id,
		req,
	});

	res.status(201).json({ gradeLevel: gl });
}

export async function updateGradeLevel(
	req: Request,
	res: Response,
): Promise<void> {
	const id = parseInt(req.params.id as string);
	const { name, displayOrder } = req.body;

	const gl = await prisma.gradeLevel.findUnique({ where: { id } });
	if (!gl) {
		res.status(404).json({ message: 'Grade level not found' });
		return;
	}

	const updated = await prisma.gradeLevel.update({
		where: { id },
		data: {
			...(name ? { name } : {}),
			...(displayOrder !== undefined ? { displayOrder } : {}),
		},
	});

	res.json({ gradeLevel: updated });
}

export async function deleteGradeLevel(
	req: Request,
	res: Response,
): Promise<void> {
	const id = parseInt(req.params.id as string);

	const gl = await prisma.gradeLevel.findUnique({
		where: { id },
		include: { _count: { select: { sections: true, applicants: true } } },
	});

	if (!gl) {
		res.status(404).json({ message: 'Grade level not found' });
		return;
	}

	if (gl._count.applicants > 0) {
		res.status(400).json({
			message: 'Cannot delete a grade level with existing applicants',
		});
		return;
	}

	await prisma.gradeLevel.delete({ where: { id } });

	await auditLog({
		userId: req.user!.userId,
		actionType: 'GRADE_LEVEL_DELETED',
		description: `Deleted grade level "${gl.name}"`,
		subjectType: 'GradeLevel',
		recordId: id,
		req,
	});

	res.json({ message: 'Grade level deleted' });
}

// ─── Strands ──────────────────────────────────────────────

export async function listStrands(req: Request, res: Response): Promise<void> {
	const ayId = parseInt(req.params.ayId as string);
	const strands = await prisma.strand.findMany({
		where: { schoolYearId: ayId },
		orderBy: { name: 'asc' },
	});
	res.json({ strands });
}

export async function createStrand(req: Request, res: Response): Promise<void> {
	const ayId = parseInt(req.params.ayId as string);
	const { name, applicableGradeLevelIds, curriculumType, track } = req.body;

	if (!name) {
		res.status(400).json({ message: 'Name is required' });
		return;
	}

	const strand = await prisma.strand.create({
		data: {
			name,
			schoolYearId: ayId,
			curriculumType: curriculumType || 'OLD_STRAND',
			track: track || null,
			gradeLevels: applicableGradeLevelIds?.length
				? {
						createMany: {
							data: applicableGradeLevelIds.map((glId: number) => ({
								gradeLevelId: glId,
							})),
						},
					}
				: undefined,
		},
		include: { gradeLevels: true },
	});

	await auditLog({
		userId: req.user!.userId,
		actionType: 'STRAND_CREATED',
		description: `Created strand "${name}"`,
		subjectType: 'Strand',
		recordId: strand.id,
		req,
	});

	res.status(201).json({ strand });
}

export async function updateStrand(req: Request, res: Response): Promise<void> {
	const id = parseInt(req.params.id as string);
	const { name, applicableGradeLevelIds, curriculumType, track } = req.body;

	const strand = await prisma.strand.findUnique({ where: { id } });
	if (!strand) {
		res.status(404).json({ message: 'Strand not found' });
		return;
	}

	const updated = await prisma.$transaction(async (tx) => {
		const strandUpdate = await tx.strand.update({
			where: { id },
			data: {
				...(name ? { name } : {}),
				...(curriculumType !== undefined ? { curriculumType } : {}),
				...(track !== undefined ? { track } : {}),
			},
		});

		if (applicableGradeLevelIds !== undefined) {
			await tx.strandGradeLevel.deleteMany({ where: { strandId: id } });
			if (applicableGradeLevelIds.length > 0) {
				await tx.strandGradeLevel.createMany({
					data: applicableGradeLevelIds.map((glId: number) => ({
						strandId: id,
						gradeLevelId: glId,
					})),
				});
			}
		}

		return tx.strand.findUnique({
			where: { id },
			include: { gradeLevels: true },
		});
	});

	res.json({ strand: updated });
}

export async function deleteStrand(req: Request, res: Response): Promise<void> {
	const id = parseInt(req.params.id as string);

	const strand = await prisma.strand.findUnique({
		where: { id },
		include: { _count: { select: { applicants: true } } },
	});

	if (!strand) {
		res.status(404).json({ message: 'Strand not found' });
		return;
	}

	if (strand._count.applicants > 0) {
		res
			.status(400)
			.json({ message: 'Cannot delete a strand with existing applicants' });
		return;
	}

	await prisma.strand.delete({ where: { id } });

	await auditLog({
		userId: req.user!.userId,
		actionType: 'STRAND_DELETED',
		description: `Deleted strand "${strand.name}"`,
		subjectType: 'Strand',
		recordId: id,
		req,
	});

	res.json({ message: 'Strand deleted' });
}

export async function syncStrands(req: Request, res: Response): Promise<void> {
	const ayId = parseInt(req.params.ayId as string);
	const { strands: desiredStrands } = req.body; // Array of { name, curriculumType, track }

	if (!Array.isArray(desiredStrands)) {
		res.status(400).json({ message: 'strands must be an array' });
		return;
	}

	try {
		const currentStrands = await prisma.strand.findMany({
			where: { schoolYearId: ayId },
		});

		const toCreate = desiredStrands.filter(
			(ds: any) =>
				!currentStrands.some(
					(cs) =>
						cs.name === ds.name && cs.curriculumType === ds.curriculumType,
				),
		);

		const toDelete = currentStrands.filter(
			(cs) =>
				!desiredStrands.some(
					(ds: any) =>
						ds.name === cs.name && ds.curriculumType === cs.curriculumType,
				),
		);

		// Check for applicants before deleting
		const strandsWithApplicants = await prisma.strand.findMany({
			where: {
				id: { in: toDelete.map((s) => s.id) },
				applicants: { some: {} },
			},
			select: { id: true, name: true },
		});

		if (strandsWithApplicants.length > 0) {
			res.status(400).json({
				message: `Cannot remove strands with existing applicants: ${strandsWithApplicants.map((s) => s.name).join(', ')}`,
			});
			return;
		}

		await prisma.$transaction([
			// Delete old ones
			prisma.strand.deleteMany({
				where: { id: { in: toDelete.map((s) => s.id) } },
			}),
			// Create new ones
			...toCreate.map((ds: any) =>
				prisma.strand.create({
					data: {
						name: ds.name,
						curriculumType: ds.curriculumType,
						track: ds.track || null,
						schoolYearId: ayId,
					},
				}),
			),
		]);

		const updatedStrands = await prisma.strand.findMany({
			where: { schoolYearId: ayId },
			orderBy: { name: 'asc' },
		});

		await auditLog({
			userId: req.user!.userId,
			actionType: 'STRANDS_SYNCED',
			description: `Synchronized SHS curriculum strands for school year ${ayId}`,
			subjectType: 'SchoolYear',
			recordId: ayId,
			req,
		});

		res.json({ strands: updatedStrands });
	} catch (error: any) {
		res
			.status(500)
			.json({ message: 'Failed to sync strands', error: error.message });
	}
}

// ─── Strand-to-Grade Matrix ───────────────────────────────

export async function updateStrandMatrix(
	req: Request,
	res: Response,
): Promise<void> {
	const ayId = parseInt(req.params.ayId as string);
	const { matrix } = req.body;

	if (!Array.isArray(matrix)) {
		res.status(400).json({ message: 'Matrix must be an array' });
		return;
	}

	try {
		// Update all strands in a transaction via junction table
		await prisma.$transaction(async (tx) => {
			for (const item of matrix as {
				strandId: number;
				gradeLevelIds: number[];
			}[]) {
				await tx.strandGradeLevel.deleteMany({
					where: { strandId: item.strandId },
				});
				if (item.gradeLevelIds.length > 0) {
					await tx.strandGradeLevel.createMany({
						data: item.gradeLevelIds.map((glId) => ({
							strandId: item.strandId,
							gradeLevelId: glId,
						})),
					});
				}
			}
		});

		// Fetch updated strands with grade levels
		const strands = await prisma.strand.findMany({
			where: { schoolYearId: ayId },
			include: { gradeLevels: true },
			orderBy: { name: 'asc' },
		});

		await auditLog({
			userId: req.user!.userId,
			actionType: 'STRAND_MATRIX_UPDATED',
			description: `Updated strand-to-grade matrix for school year ${ayId}`,
			subjectType: 'SchoolYear',
			recordId: ayId,
			req,
		});

		res.json({ strands });
	} catch (error) {
		res.status(500).json({ message: 'Failed to update strand matrix' });
	}
}

// ─── SCP Configs ──────────────────────────────────────────

export async function listScpConfigs(
	req: Request,
	res: Response,
): Promise<void> {
	const ayId = parseInt(req.params.ayId as string);
	const scpProgramConfigs = await prisma.scpProgramConfig.findMany({
		where: { schoolYearId: ayId },
		include: {
			options: true,
			steps: { orderBy: { stepOrder: 'asc' } },
		},
	});

	// Transform options back to the flat array shape the client expects
	const transformed = scpProgramConfigs.map((cfg) => ({
		...cfg,
		isTwoPhase: cfg.isTwoPhase ?? false,
		artFields: cfg.options
			.filter((o) => o.optionType === 'ART_FIELD')
			.map((o) => o.value),
		languages: cfg.options
			.filter((o) => o.optionType === 'LANGUAGE')
			.map((o) => o.value),
		sportsList: cfg.options
			.filter((o) => o.optionType === 'SPORT')
			.map((o) => o.value),
		options: undefined,
	}));

	res.json({ scpProgramConfigs: transformed });
}

export async function updateScpConfigs(
	req: Request,
	res: Response,
): Promise<void> {
	const ayId = parseInt(req.params.ayId as string);
	const { scpProgramConfigs } = req.body;

	if (!Array.isArray(scpProgramConfigs)) {
		res.status(400).json({ message: 'scpProgramConfigs must be an array' });
		return;
	}

	try {
		const updatedConfigs = await prisma.$transaction(async (tx) => {
			const results = [];

			for (const config of scpProgramConfigs) {
				const {
					id,
					scpType,
					isOffered,
					isTwoPhase,
					cutoffScore,
					artFields,
					languages,
					sportsList,
					steps,
				} = config;

				const scpData = {
					isOffered: isOffered ?? false,
					isTwoPhase: isTwoPhase ?? false,
					cutoffScore: cutoffScore ?? null,
				};

				let scpProgramConfig;
				if (id) {
					scpProgramConfig = await tx.scpProgramConfig.update({
						where: { id },
						data: scpData,
					});
					// Delete existing options for this config and re-create
					await tx.scpProgramOption.deleteMany({
						where: { scpProgramConfigId: id },
					});
					// Delete existing steps and re-create
					await tx.scpProgramStep.deleteMany({
						where: { scpProgramConfigId: id },
					});
				} else {
					scpProgramConfig = await tx.scpProgramConfig.create({
						data: { schoolYearId: ayId, scpType, ...scpData },
					});
				}

				// Build option records
				const optionData: any[] = [];
				for (const v of artFields ?? []) {
					optionData.push({
						scpProgramConfigId: scpProgramConfig.id,
						optionType: 'ART_FIELD',
						value: v,
					});
				}
				for (const v of languages ?? []) {
					optionData.push({
						scpProgramConfigId: scpProgramConfig.id,
						optionType: 'LANGUAGE',
						value: v,
					});
				}
				for (const v of sportsList ?? []) {
					optionData.push({
						scpProgramConfigId: scpProgramConfig.id,
						optionType: 'SPORT',
						value: v,
					});
				}
				if (optionData.length > 0) {
					await tx.scpProgramOption.createMany({ data: optionData });
				}

				// Build assessment step records from DepEd pipeline (immutable)
				// Only scheduledDate, scheduledTime, venue, and notes come from the client
				// For STE, select the 1-phase or 2-phase pipeline based on the toggle
				const pipeline =
					scpType === 'SCIENCE_TECHNOLOGY_AND_ENGINEERING'
						? getSteSteps(isTwoPhase ?? false)
						: (SCP_DEFAULT_PIPELINES[scpType as ScpType] ?? []);

				if (isOffered && pipeline.length > 0) {
					// Build a lookup map for client-provided schedule overrides keyed by stepOrder
					const clientSteps = Array.isArray(steps) ? steps : [];
					const scheduleMap = new Map<
						number,
						{
							scheduledDate?: string;
							scheduledTime?: string;
							venue?: string;
							notes?: string;
							cutoffScore?: number;
						}
					>();
					for (const s of clientSteps) {
						if (s.stepOrder) {
							scheduleMap.set(s.stepOrder, s);
						}
					}

					const stepData = pipeline.map((pipelineStep) => {
						const override = scheduleMap.get(pipelineStep.stepOrder);
						return {
							scpProgramConfigId: scpProgramConfig.id,
							stepOrder: pipelineStep.stepOrder,
							kind: pipelineStep.kind as any,
							label: pipelineStep.label,
							description: pipelineStep.description,
							isRequired: pipelineStep.isRequired,
							scheduledDate: override?.scheduledDate
								? normalizeDateToUtcNoon(new Date(override.scheduledDate))
								: null,
							scheduledTime: override?.scheduledTime ?? null,
							venue: override?.venue ?? null,
							notes: override?.notes ?? null,
							cutoffScore: override?.cutoffScore ?? null,
						};
					});
					await tx.scpProgramStep.createMany({ data: stepData });
				}

				results.push(scpProgramConfig);
			}

			return results;
		});

		await auditLog({
			userId: req.user!.userId,
			actionType: 'SCP_CONFIG_UPDATED',
			description: `Updated SCP configurations for school year ${ayId}`,
			subjectType: 'SchoolYear',
			recordId: ayId,
			req,
		});

		res.json({ scpProgramConfigs: updatedConfigs });
	} catch (error: any) {
		res
			.status(500)
			.json({ message: 'Failed to update SCP configs', error: error.message });
	}
}
