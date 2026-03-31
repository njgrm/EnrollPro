import 'dotenv/config';
import {
	PrismaClient,
	ApplicantType,
	AssessmentKind,
} from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import * as pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ── Default DepEd SCP Assessment Pipelines ──
const SCP_PIPELINES: Record<
	string,
	Array<{
		stepOrder: number;
		kind: AssessmentKind;
		label: string;
		description: string;
		isRequired: boolean;
	}>
> = {
	SCIENCE_TECHNOLOGY_AND_ENGINEERING: [
		{
			stepOrder: 1,
			kind: 'PRELIMINARY_EXAMINATION',
			label: 'Preliminary Examination (ESM)',
			description:
				'Written screening test: English, Science, Mathematics — determines eligibility for final exam',
			isRequired: true,
		},
		{
			stepOrder: 2,
			kind: 'FINAL_EXAMINATION',
			label: 'Final Examination',
			description:
				'Comprehensive written exam: 21st-century skills, critical thinking, and advanced problem-solving',
			isRequired: true,
		},
		{
			stepOrder: 3,
			kind: 'INTERVIEW',
			label: 'Interview',
			description:
				'Interest, mental alertness, readiness for rigorous curriculum',
			isRequired: true,
		},
	],
	SPECIAL_PROGRAM_IN_THE_ARTS: [
		{
			stepOrder: 1,
			kind: 'GENERAL_ADMISSION_TEST',
			label: 'General Admission Test',
			description: 'Written exam covering general knowledge and aptitude',
			isRequired: true,
		},
		{
			stepOrder: 2,
			kind: 'TALENT_AUDITION',
			label: 'Talent Audition / Performance',
			description: 'Live performance or portfolio per chosen art field',
			isRequired: true,
		},
		{
			stepOrder: 3,
			kind: 'INTERVIEW',
			label: 'Interview',
			description: 'Assess passion for the arts',
			isRequired: true,
		},
	],
	SPECIAL_PROGRAM_IN_SPORTS: [
		{
			stepOrder: 1,
			kind: 'PHYSICAL_FITNESS_TEST',
			label: 'Physical Fitness Test (PFT)',
			description: 'Agility, strength, and endurance tests',
			isRequired: true,
		},
		{
			stepOrder: 2,
			kind: 'SPORTS_SKILLS_TRYOUT',
			label: 'Sports Skills Demonstration (Tryout)',
			description: 'Sport-specific proficiency tryout',
			isRequired: true,
		},
		{
			stepOrder: 3,
			kind: 'INTERVIEW',
			label: 'Interview',
			description: 'Discipline, sportsmanship, and parental support',
			isRequired: true,
		},
	],
	SPECIAL_PROGRAM_IN_JOURNALISM: [
		{
			stepOrder: 1,
			kind: 'QUALIFYING_EXAMINATION',
			label: 'Qualifying Test',
			description:
				'English and Filipino proficiency, grammar, basic news writing',
			isRequired: true,
		},
		{
			stepOrder: 2,
			kind: 'SKILLS_ASSESSMENT',
			label: 'Skills Assessment (Writing Trials)',
			description:
				'On-the-spot writing: news lead, editorial, or feature story',
			isRequired: true,
		},
		{
			stepOrder: 3,
			kind: 'INTERVIEW',
			label: 'Interview',
			description: 'Communication skills and ethical awareness',
			isRequired: true,
		},
	],
	SPECIAL_PROGRAM_IN_FOREIGN_LANGUAGE: [
		{
			stepOrder: 1,
			kind: 'STANDARDIZED_ADMISSION_TOOL',
			label: 'Standardized Admission Tool',
			description: 'Linguistic aptitude and readiness test',
			isRequired: true,
		},
		{
			stepOrder: 2,
			kind: 'INTERVIEW',
			label: 'Interview (with Parent/Guardian)',
			description: 'Validate documents and gauge commitment',
			isRequired: true,
		},
	],
	SPECIAL_PROGRAM_IN_TECHNICAL_VOCATIONAL_EDUCATION: [
		{
			stepOrder: 1,
			kind: 'APTITUDE_TEST',
			label: 'Aptitude Test',
			description:
				'Inclination towards IT, Agriculture, Home Economics, or Industrial Arts',
			isRequired: true,
		},
		{
			stepOrder: 2,
			kind: 'INTEREST_INVENTORY',
			label: 'Interest Inventory / Interview',
			description: 'Align student interests with specific shop offerings',
			isRequired: true,
		},
	],
};

async function seed() {
	try {
		// 1. Get active school year
		const schoolYear = await prisma.schoolYear.findFirst({
			where: { status: 'ACTIVE' },
		});

		if (!schoolYear) {
			throw new Error(
				'No active school year found. Please ensure the school year is seeded and set to ACTIVE before running this script.',
			);
		}

		console.log(`Using School Year: ${schoolYear.yearLabel}`);

		// 2. Seed SCP Configs with pipeline steps
		const scpTypes = [
			ApplicantType.SCIENCE_TECHNOLOGY_AND_ENGINEERING,
			ApplicantType.SPECIAL_PROGRAM_IN_THE_ARTS,
			ApplicantType.SPECIAL_PROGRAM_IN_SPORTS,
			ApplicantType.SPECIAL_PROGRAM_IN_JOURNALISM,
			ApplicantType.SPECIAL_PROGRAM_IN_FOREIGN_LANGUAGE,
			ApplicantType.SPECIAL_PROGRAM_IN_TECHNICAL_VOCATIONAL_EDUCATION,
		];

		for (const scpType of scpTypes) {
			const existing = await prisma.scpProgramConfig.findUnique({
				where: {
					uq_scp_program_configs_type: {
						schoolYearId: schoolYear.id,
						scpType,
					},
				},
			});

			if (!existing) {
				const config = await prisma.scpProgramConfig.create({
					data: {
						schoolYearId: schoolYear.id,
						scpType,
						isOffered: true,
					},
				});

				const pipeline = SCP_PIPELINES[scpType] ?? [];
				if (pipeline.length > 0) {
					await prisma.scpProgramStep.createMany({
						data: pipeline.map((step) => ({
							scpProgramConfigId: config.id,
							stepOrder: step.stepOrder,
							kind: step.kind,
							label: step.label,
							description: step.description,
							isRequired: step.isRequired,
						})),
					});
				}

				console.log(
					`✅ Created SCP Config for ${scpType} with ${pipeline.length} pipeline steps`,
				);
			} else {
				console.log(`ℹ️  SCP Config for ${scpType} already exists, skipping`);
			}
		}

		console.log('Seeding completed!');
	} catch (error) {
		console.error('ERROR during seeding:', error);
	} finally {
		await prisma.$disconnect();
		await pool.end();
	}
}

seed();
