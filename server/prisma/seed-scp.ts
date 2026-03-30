import 'dotenv/config';
import { PrismaClient, ApplicantType, Sex, LearnerType, ApplicationStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const lastNames = ["SANTOS", "REYES", "CRUZ", "BAUTISTA", "GARCIA", "MENDOZA", "PASCUAL", "CASTILLO", "VILLANUEVA", "RAMOS", "DELA CRUZ", "SANTIAGO", "AQUINO", "BERNARDO", "TOLENTINO", "SORIANO", "CORTEZ", "LOPEZ", "FERNANDEZ", "GONZALES"];
const firstNamesFemale = ["MARIA", "ANGEL", "JASMINE", "BEA", "NICOLE", "LIZA", "JANINE", "PATRICIA", "SAMANTHA", "ALYSSA", "SOFIA", "ANDREA", "CHLOE", "DANIELLE", "ERIKA", "FRANCESCA", "GISELLE", "HANNAH", "ISABELLA", "JOYCE"];
const firstNamesMale = ["JOSE", "JUAN", "CARLO", "MARK", "ANGELO", "MIGUEL", "PAOLO", "CHRISTIAN", "GABRIEL", "RAFAEL", "JOSHUA", "DANIEL", "NATHAN", "ETHAN", "ALEXANDER", "SEBASTIAN", "ADRIAN", "JUSTIN", "RYAN", "KEVIN"];
const middleNames = ["DE LEON", "SALVADOR", "VALDEZ", "ESPINOSA", "MERCADO", "ROXAS", "QUIMPO", "NAVARRO", "DOMINGO", "AGUILAR"];

function getRandom(arr: string[]) {
	return arr[Math.floor(Math.random() * arr.length)];
}

function generateLRN() {
	// 12 digit LRN starting with 1 or 4 (common for public schools)
	const prefix = Math.random() > 0.5 ? '10' : '40';
	const rest = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
	return prefix + rest;
}

async function seed() {
	try {
		// 1. Get active school year
		let schoolYear = await prisma.schoolYear.findFirst({
			where: { status: 'ACTIVE' },
		});

		if (!schoolYear) {
			console.log('No active school year found. Creating one...');
			schoolYear = await prisma.schoolYear.create({
				data: {
					yearLabel: '2026-2027',
					status: 'ACTIVE',
					isActive: true,
					classOpeningDate: new Date('2026-06-15'),
					classEndDate: new Date('2027-03-31'),
					enrollOpenDate: new Date('2026-01-01'),
					enrollCloseDate: new Date('2026-05-31'),
				},
			});
		}

		console.log(`Using School Year: ${schoolYear.yearLabel}`);

		// 2. Ensure Grade Levels G7-G12 exist for the active school year
		const grades = [
			{ name: '7', displayOrder: 7 },
			{ name: '8', displayOrder: 8 },
			{ name: '9', displayOrder: 9 },
			{ name: '10', displayOrder: 10 },
			{ name: '11', displayOrder: 11 },
			{ name: '12', displayOrder: 12 },
		];

		let grade7Id: number | null = null;

		for (const grade of grades) {
			let g = await prisma.gradeLevel.findFirst({
				where: {
					schoolYearId: schoolYear.id,
					name: grade.name,
				},
			});

			if (!g) {
				g = await prisma.gradeLevel.create({
					data: {
						name: grade.name,
						displayOrder: grade.displayOrder,
						schoolYearId: schoolYear.id,
					},
				});
				console.log(`✅ Created Grade Level: ${grade.name}`);
			}

			if (grade.name === '7') grade7Id = g.id;
		}

		if (!grade7Id) throw new Error("Grade 7 not found/created");

		const scpTypes = [
			ApplicantType.SCIENCE_TECHNOLOGY_AND_ENGINEERING,
			ApplicantType.SPECIAL_PROGRAM_IN_THE_ARTS,
			ApplicantType.SPECIAL_PROGRAM_IN_SPORTS,
			ApplicantType.SPECIAL_PROGRAM_IN_JOURNALISM,
			ApplicantType.SPECIAL_PROGRAM_IN_FOREIGN_LANGUAGE,
			ApplicantType.SPECIAL_PROGRAM_IN_TECHNICAL_VOCATIONAL_EDUCATION,
		];

		console.log('Wiping existing SCP applicants to re-seed with 3 students per type...');
		await prisma.applicant.deleteMany({
			where: {
				schoolYearId: schoolYear.id,
				gradeLevelId: grade7Id,
				applicantType: { in: scpTypes },
			}
		});

		let count = 1;
		for (const type of scpTypes) {
			for (let i = 0; i < 3; i++) {
				const trackingNumber = `APP-2026-${count.toString().padStart(5, '0')}`;
				const isFemale = Math.random() > 0.5;
				const sex = isFemale ? Sex.FEMALE : Sex.MALE;
				const firstName = getRandom(isFemale ? firstNamesFemale : firstNamesMale);
				const lastName = getRandom(lastNames);
				const middleName = getRandom(middleNames);
				const lrn = generateLRN();

				await prisma.applicant.create({
					data: {
						lrn,
						firstName,
						lastName,
						middleName,
						birthDate: new Date('2014-01-01'), 
						sex,
						trackingNumber,
						status: ApplicationStatus.SUBMITTED,
						gradeLevelId: grade7Id,
						schoolYearId: schoolYear.id,
						applicantType: type,
						learnerType: LearnerType.NEW_ENROLLEE,
						isPrivacyConsentGiven: true,
						addresses: {
							create: {
								addressType: 'CURRENT',
								barangay: 'Barangay ' + (Math.floor(Math.random() * 10) + 1),
								cityMunicipality: 'City',
								province: 'Province',
							}
						},
						familyMembers: {
							create: {
								relationship: 'MOTHER',
								firstName: getRandom(firstNamesFemale),
								lastName: lastName,
								contactNumber: '09' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0'),
							}
						}
					},
				});

				console.log(`✅ [${count}] Created Grade 7 applicant for ${type}: ${firstName} ${middleName} ${lastName} (LRN: ${lrn}, Tracking: ${trackingNumber})`);
				count++;
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
