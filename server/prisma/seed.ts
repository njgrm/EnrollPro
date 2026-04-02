import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
	const teacherSeeds = [
		{ employeeId: 'T-0001', firstName: 'Maria', lastName: 'Santos', specialization: 'Filipino' },
		{ employeeId: 'T-0002', firstName: 'Jose', lastName: 'Reyes', specialization: 'English' },
		{ employeeId: 'T-0003', firstName: 'Ana', lastName: 'Dela Cruz', specialization: 'Mathematics' },
		{ employeeId: 'T-0004', firstName: 'Mark', lastName: 'Villanueva', specialization: 'Science' },
		{ employeeId: 'T-0005', firstName: 'Liza', lastName: 'Garcia', specialization: 'Araling Panlipunan' },
		{ employeeId: 'T-0006', firstName: 'Paolo', lastName: 'Castro', specialization: 'MAPEH' },
		{ employeeId: 'T-0007', firstName: 'Rica', lastName: 'Mendoza', specialization: 'Edukasyon sa Pagpapakatao' },
		{ employeeId: 'T-0008', firstName: 'Neil', lastName: 'Torres', specialization: 'TLE' },
		{ employeeId: 'T-0009', firstName: 'Grace', lastName: 'Aquino', specialization: 'Homeroom Guidance' },
		{ employeeId: 'T-0010', firstName: 'Ivy', lastName: 'Flores', specialization: 'Mathematics' },
		{ employeeId: 'T-0011', firstName: 'Jomar', lastName: 'Navarro', specialization: 'Science' },
		{ employeeId: 'T-0012', firstName: 'Celia', lastName: 'Pascual', specialization: 'English' },
		{ employeeId: 'T-0013', firstName: 'Ramon', lastName: 'Lopez', specialization: 'Filipino' },
		{ employeeId: 'T-0014', firstName: 'Katrina', lastName: 'Salazar', specialization: 'Araling Panlipunan' },
		{ employeeId: 'T-0015', firstName: 'Lourdes', lastName: 'Valdez', specialization: 'MAPEH' },
		{ employeeId: 'T-0016', firstName: 'Harold', lastName: 'Bautista', specialization: 'Edukasyon sa Pagpapakatao' },
		{ employeeId: 'T-0017', firstName: 'Mika', lastName: 'Ramos', specialization: 'TLE' },
		{ employeeId: 'T-0018', firstName: 'Jonas', lastName: 'Domingo', specialization: 'Mathematics' },
		{ employeeId: 'T-0019', firstName: 'Ella', lastName: 'Rivera', specialization: 'Science' },
		{ employeeId: 'T-0020', firstName: 'Darren', lastName: 'Serrano', specialization: 'English' },
	];

	// 1. Ensure school settings row exists
	let settings = await prisma.schoolSettings.findFirst();
	if (!settings) {
		settings = await prisma.schoolSettings.create({ data: { schoolName: 'EnrollPro High School' } });
		console.log('Created default SchoolSettings row.');
	} else {
		console.log('SchoolSettings already exists.');
	}

	// 2. Ensure an active School Year exists
	let activeYear = await prisma.schoolYear.findFirst({
		where: { status: 'ACTIVE' },
	});

	if (!activeYear) {
		activeYear = await prisma.schoolYear.create({
			data: {
				yearLabel: '2026-2027',
				status: 'ACTIVE',
				isActive: true,
				classOpeningDate: new Date('2026-06-15'),
				classEndDate: new Date('2027-03-31'),
				earlyRegOpenDate: new Date('2026-01-01'),
				earlyRegCloseDate: new Date('2026-05-31'),
				enrollOpenDate: new Date('2026-05-01'),
				enrollCloseDate: new Date('2026-06-30'),
			},
		});
		console.log(`✅ Created Active School Year: ${activeYear.yearLabel}`);
		
		// Update settings to point to this active year
		await prisma.schoolSettings.update({
			where: { id: settings.id },
			data: { activeSchoolYearId: activeYear.id }
		});
	}

	// 3. Ensure Grade Levels G7-G12 exist for the active school year
	const grades = [
		{ name: '7', displayOrder: 7 },
		{ name: '8', displayOrder: 8 },
		{ name: '9', displayOrder: 9 },
		{ name: '10', displayOrder: 10 },
		{ name: '11', displayOrder: 11 },
		{ name: '12', displayOrder: 12 },
	];

	for (const grade of grades) {
		const existingGrade = await prisma.gradeLevel.findFirst({
			where: {
				schoolYearId: activeYear.id,
				name: grade.name,
			},
		});

		if (!existingGrade) {
			await prisma.gradeLevel.create({
				data: {
					name: grade.name,
					displayOrder: grade.displayOrder,
					schoolYearId: activeYear.id,
				},
			});
			console.log(`✅ Created Grade Level: ${grade.name}`);
		}
	}

	// 4. Seed faculty list used for section adviser assignment and ATLAS bridge demos.
	for (const teacher of teacherSeeds) {
		await prisma.teacher.upsert({
			where: { employeeId: teacher.employeeId },
			update: {
				firstName: teacher.firstName,
				lastName: teacher.lastName,
				specialization: teacher.specialization,
				isActive: true,
			},
			create: {
				employeeId: teacher.employeeId,
				firstName: teacher.firstName,
				lastName: teacher.lastName,
				email: `${teacher.employeeId.toLowerCase()}@deped.local`,
				specialization: teacher.specialization,
				isActive: true,
			},
		});
	}
	console.log(`✅ Seeded ${teacherSeeds.length} teachers.`);

	// 5. Create first SYSTEM_ADMIN account
	const email = process.env.ADMIN_EMAIL ?? 'admin@deped.edu.ph';
	const password = process.env.ADMIN_PASSWORD ?? 'Admin2026!';

	// Refactored to granular names
	const firstName = process.env.ADMIN_FIRST_NAME ?? 'System';
	const lastName = process.env.ADMIN_LAST_NAME ?? 'Administrator';

	const existingAdmin = await prisma.user.findUnique({ where: { email } });
	if (existingAdmin) {
		console.log(`Admin account already exists: ${email}`);
	} else {
		const hashed = await bcrypt.hash(password, 12);

		await prisma.user.create({
			data: {
				firstName,
				lastName,
				email,
				password: hashed,
				role: 'SYSTEM_ADMIN',
				isActive: true,
				mustChangePassword: true,
			},
		});

		console.log(`✅ System Admin created: ${email}`);
		console.log(`   Temporary password:   ${password}`);
		console.log(`   ⚠  Change this password immediately after first login.`);
	}

	// 6. Seed JHS sections (Grades 7-10) with Filipino hero names and optional advisers
	const sectionSeeds: { gradeName: string; sectionName: string; adviserEmployeeId: string | null }[] = [
		{ gradeName: '7', sectionName: '7-Rizal', adviserEmployeeId: 'T-0001' },
		{ gradeName: '7', sectionName: '7-Bonifacio', adviserEmployeeId: 'T-0002' },
		{ gradeName: '7', sectionName: '7-Mabini', adviserEmployeeId: 'T-0003' },
		{ gradeName: '8', sectionName: '8-Aquino', adviserEmployeeId: 'T-0004' },
		{ gradeName: '8', sectionName: '8-Quezon', adviserEmployeeId: 'T-0005' },
		{ gradeName: '8', sectionName: '8-Osmena', adviserEmployeeId: 'T-0006' },
		{ gradeName: '9', sectionName: '9-Luna', adviserEmployeeId: 'T-0007' },
		{ gradeName: '9', sectionName: '9-Del Pilar', adviserEmployeeId: 'T-0008' },
		{ gradeName: '9', sectionName: '9-Silang', adviserEmployeeId: 'T-0009' },
		{ gradeName: '10', sectionName: '10-Recto', adviserEmployeeId: 'T-0010' },
		{ gradeName: '10', sectionName: '10-Palma', adviserEmployeeId: 'T-0011' },
		{ gradeName: '10', sectionName: '10-Laurel', adviserEmployeeId: 'T-0012' },
	];

	// Fetch grade levels for the active year
	const jhsGrades = await prisma.gradeLevel.findMany({
		where: { schoolYearId: activeYear.id, displayOrder: { lte: 10 } },
	});
	const gradeMap = new Map(jhsGrades.map((g) => [g.name, g.id]));

	// Fetch teachers by employeeId for adviser assignment
	const teachers = await prisma.teacher.findMany({
		where: { employeeId: { in: sectionSeeds.map((s) => s.adviserEmployeeId).filter(Boolean) as string[] } },
	});
	const teacherMap = new Map(teachers.map((t) => [t.employeeId, t.id]));

	let sectionsCreated = 0;
	for (const seed of sectionSeeds) {
		const gradeLevelId = gradeMap.get(seed.gradeName);
		if (!gradeLevelId) continue;

		const existing = await prisma.section.findFirst({
			where: { name: seed.sectionName, gradeLevelId },
		});
		if (existing) continue;

		await prisma.section.create({
			data: {
				name: seed.sectionName,
				maxCapacity: 40,
				gradeLevelId,
				advisingTeacherId: seed.adviserEmployeeId ? teacherMap.get(seed.adviserEmployeeId) ?? null : null,
			},
		});
		sectionsCreated++;
	}
	console.log(`✅ Seeded ${sectionsCreated} JHS sections (${sectionSeeds.length - sectionsCreated} already existed).`);

	// 7. Seed enrolled students (applicants + enrollments) for each JHS section
	// Check if we already have enrollments to avoid duplicate seeding
	const existingEnrollments = await prisma.enrollment.count({ where: { schoolYearId: activeYear.id } });
	if (existingEnrollments > 0) {
		console.log(`Enrollments already exist (${existingEnrollments} total). Skipping student seeding.`);
	} else {
		// Get admin user for enrolledById
		const adminUser = await prisma.user.findFirst({ where: { role: 'SYSTEM_ADMIN', isActive: true } });
		if (!adminUser) {
			console.log('⚠ No admin user found — skipping student seeding.');
		} else {
			// Get all seeded sections
			const allSections = await prisma.section.findMany({
				where: { gradeLevel: { schoolYearId: activeYear.id, displayOrder: { lte: 10 } } },
				include: { gradeLevel: true },
			});

			// Filipino first/last name pools for realistic data
			const firstNamesMale = ['Juan', 'Carlos', 'Miguel', 'Rafael', 'Antonio', 'Gabriel', 'Marco', 'Daniel', 'Paolo', 'Angelo', 'Jericho', 'Kenneth', 'Bryan', 'Renz', 'Jayson', 'Mark', 'Leo', 'Francis', 'Nico', 'Elijah'];
			const firstNamesFemale = ['Maria', 'Ana', 'Sofia', 'Isabella', 'Gabriela', 'Camille', 'Nicole', 'Patricia', 'Jasmine', 'Katrina', 'Bianca', 'Andrea', 'Samantha', 'Angelica', 'Rhea', 'Alyssa', 'Czarina', 'Princess', 'Denise', 'Kyla'];
			const lastNames = ['Santos', 'Reyes', 'Cruz', 'Garcia', 'Mendoza', 'Torres', 'Flores', 'Ramos', 'Diaz', 'Navarro', 'Villanueva', 'Castillo', 'Bautista', 'Aquino', 'Rivera', 'Pascual', 'Salazar', 'Valdez', 'Fernandez', 'Lopez', 'Hernandez', 'Santiago', 'Del Rosario', 'Morales', 'Aguilar'];

			// Vary enrollment count per section (25-38 of 40 capacity)
			const enrollmentCounts = [35, 32, 38, 30, 36, 33, 28, 37, 34, 31, 29, 25];
			let totalStudents = 0;
			let trackingSeq = 1;

			for (let si = 0; si < allSections.length; si++) {
				const section = allSections[si];
				const count = enrollmentCounts[si % enrollmentCounts.length];

				for (let i = 0; i < count; i++) {
					const isMale = Math.random() > 0.5;
					const firstNames = isMale ? firstNamesMale : firstNamesFemale;
					const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
					const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
					const trackingNumber = `TN-${activeYear.yearLabel.replace('-', '')}-${String(trackingSeq++).padStart(5, '0')}`;

					// Randomize birth date for age-appropriate JHS students (11-16 years old)
					const birthYear = 2026 - 11 - parseInt(section.gradeLevel.name); // e.g., Grade 7 → ~2008
					const birthMonth = Math.floor(Math.random() * 12);
					const birthDay = Math.floor(Math.random() * 28) + 1;

					const applicant = await prisma.applicant.create({
						data: {
							firstName,
							lastName,
							sex: isMale ? 'MALE' : 'FEMALE',
							birthDate: new Date(birthYear, birthMonth, birthDay),
							trackingNumber,
							status: 'ENROLLED',
							gradeLevelId: section.gradeLevelId,
							schoolYearId: activeYear.id,
							learnerType: 'NEW_ENROLLEE',
							applicantType: 'REGULAR',
							admissionChannel: 'F2F',
							lrn: String(100000000000 + trackingSeq).slice(0, 12),
						},
					});

					await prisma.enrollment.create({
						data: {
							applicantId: applicant.id,
							sectionId: section.id,
							schoolYearId: activeYear.id,
							enrolledById: adminUser.id,
						},
					});
					totalStudents++;
				}
			}
			console.log(`✅ Seeded ${totalStudents} enrolled students across ${allSections.length} sections.`);
		}
	}
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
