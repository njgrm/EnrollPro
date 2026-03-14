import 'dotenv/config';
import { PrismaClient, Sex, ApplicationStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// DepEd-based Filipino names
const lastNames = [
  'Dela Cruz', 'Garcia', 'Reyes', 'Santos', 'Ramos', 'Mendoza', 'Torres', 'Gonzales',
  'Fernandez', 'Lopez', 'Villanueva', 'Cruz', 'Bautista', 'Aquino', 'Flores', 'Castro',
  'Rivera', 'Martinez', 'Perez', 'Sanchez', 'Ramirez', 'Morales', 'Diaz', 'Pascual'
];

const firstNamesMale = [
  'Juan', 'Jose', 'Miguel', 'Carlos', 'Pedro', 'Antonio', 'Luis', 'Rafael',
  'Manuel', 'Ricardo', 'Roberto', 'Fernando', 'Eduardo', 'Andres', 'Gabriel'
];

const firstNamesFemale = [
  'Maria', 'Ana', 'Rosa', 'Carmen', 'Elena', 'Sofia', 'Isabel', 'Lucia',
  'Teresa', 'Patricia', 'Angela', 'Clara', 'Beatriz', 'Cristina', 'Diana'
];

const middleNames = [
  'Santos', 'Reyes', 'Cruz', 'Ramos', 'Torres', 'Lopez', 'Garcia', 'Mendoza',
  'Flores', 'Castro', 'Rivera', 'Perez', 'Morales', 'Diaz', 'Pascual'
];

const barangays = [
  'San Antonio', 'San Jose', 'Poblacion', 'Barangay 1', 'Barangay 2', 'Barangay 3',
  'San Miguel', 'Santa Cruz', 'San Pedro', 'San Juan', 'Santo Niño', 'San Isidro'
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateLRN(): string {
  const year = '10';
  const region = '06';
  const division = '34';
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `${year}${region}${division}${random}`;
}

function generateBirthDate(gradeLevel: string): Date {
  const currentYear = 2026;
  let age: number;
  
  switch (gradeLevel) {
    case 'Grade 7': age = 12 + Math.floor(Math.random() * 2); break;
    case 'Grade 8': age = 13 + Math.floor(Math.random() * 2); break;
    case 'Grade 9': age = 14 + Math.floor(Math.random() * 2); break;
    case 'Grade 10': age = 15 + Math.floor(Math.random() * 2); break;
    case 'Grade 11': age = 16 + Math.floor(Math.random() * 2); break;
    case 'Grade 12': age = 17 + Math.floor(Math.random() * 2); break;
    default: age = 12;
  }
  
  const birthYear = currentYear - age;
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1;
  
  return new Date(birthYear, month, day);
}

function generatePhoneNumber(): string {
  const prefixes = ['0917', '0918', '0919', '0920', '0921', '0922', '0923', '0925', '0926', '0927'];
  const prefix = randomItem(prefixes);
  const suffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `${prefix}-${suffix.slice(0, 3)}-${suffix.slice(3)}`;
}

async function main() {
  console.log('🌱 Starting student data seeding...\n');

  // Create registrar user if not exists
  const registrarEmail = 'registrar@hnhs.edu.ph';
  let registrar = await prisma.user.findUnique({ where: { email: registrarEmail } });
  
  if (!registrar) {
    const hashedPassword = await bcrypt.hash('registrar123', 12);
    registrar = await prisma.user.create({
      data: {
        name: 'Regina Cruz',
        email: registrarEmail,
        password: hashedPassword,
        role: 'REGISTRAR',
      },
    });
    console.log('✓ Created registrar user');
  }

  // Get or create active academic year
  let academicYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
  });

  if (!academicYear) {
    academicYear = await prisma.academicYear.create({
      data: {
        yearLabel: '2026-2027',
        status: 'ACTIVE',
        isActive: true,
        classOpeningDate: new Date('2026-06-16'),
        classEndDate: new Date('2027-03-31'),
        earlyRegOpenDate: new Date('2026-01-31'),
        earlyRegCloseDate: new Date('2026-02-27'),
        enrollOpenDate: new Date('2026-06-09'),
        enrollCloseDate: new Date('2026-06-14'),
      },
    });
    console.log('✓ Created academic year 2026-2027');
  }

  // Create grade levels
  const gradeLevelNames = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
  const gradeLevels = [];

  for (let i = 0; i < gradeLevelNames.length; i++) {
    let gradeLevel = await prisma.gradeLevel.findFirst({
      where: {
        name: gradeLevelNames[i],
        academicYearId: academicYear.id,
      },
    });

    if (!gradeLevel) {
      gradeLevel = await prisma.gradeLevel.create({
        data: {
          name: gradeLevelNames[i],
          displayOrder: i + 1,
          academicYearId: academicYear.id,
        },
      });
    }
    gradeLevels.push(gradeLevel);
  }
  console.log('✓ Created/verified grade levels');

  // Create strands for SHS
  const strandData = [
    { name: 'STEM', grades: [4, 5] },
    { name: 'ABM', grades: [4, 5] },
    { name: 'HUMSS', grades: [4, 5] },
    { name: 'GAS', grades: [4, 5] },
  ];

  const strands = [];
  for (const strandInfo of strandData) {
    let strand = await prisma.strand.findFirst({
      where: {
        name: strandInfo.name,
        academicYearId: academicYear.id,
      },
    });

    if (!strand) {
      const applicableIds = strandInfo.grades.map(idx => gradeLevels[idx].id);
      strand = await prisma.strand.create({
        data: {
          name: strandInfo.name,
          applicableGradeLevelIds: applicableIds,
          academicYearId: academicYear.id,
        },
      });
    }
    strands.push(strand);
  }
  console.log('✓ Created/verified strands');

  // Create sections
  const sectionNames = ['Rizal', 'Bonifacio'];
  const sections = [];

  for (const gradeLevel of gradeLevels) {
    const isJHS = gradeLevel.displayOrder <= 4;
    const namesToUse = isJHS ? sectionNames : ['STEM-A', 'HUMSS-A'];

    for (const sectionName of namesToUse) {
      let section = await prisma.section.findFirst({
        where: {
          name: sectionName,
          gradeLevelId: gradeLevel.id,
        },
      });

      if (!section) {
        section = await prisma.section.create({
          data: {
            name: sectionName,
            maxCapacity: 45,
            gradeLevelId: gradeLevel.id,
          },
        });
      }
      sections.push(section);
    }
  }
  console.log('✓ Created/verified sections');

  // Generate students
  const studentsPerGrade = 3;
  let totalCreated = await prisma.applicant.count();
  const usedLRNs = new Set<string>();

  for (const gradeLevel of gradeLevels) {
    const gradeSections = sections.filter(s => s.gradeLevelId === gradeLevel.id);
    
    for (let i = 0; i < studentsPerGrade; i++) {
      const section = gradeSections[i % gradeSections.length];
      const sex = Math.random() > 0.5 ? Sex.MALE : Sex.FEMALE;
        const firstName = sex === Sex.MALE ? randomItem(firstNamesMale) : randomItem(firstNamesFemale);
        const lastName = randomItem(lastNames);
        const middleName = Math.random() > 0.2 ? randomItem(middleNames) : null;
        const suffix = Math.random() > 0.9 ? randomItem(['Jr.', 'Sr.', 'III']) : null;

        let lrn = generateLRN();
        while (usedLRNs.has(lrn)) {
          lrn = generateLRN();
        }
        usedLRNs.add(lrn);

        const birthDate = generateBirthDate(gradeLevel.name);
        const barangay = randomItem(barangays);
        const address = `${Math.floor(Math.random() * 500) + 1} Brgy. ${barangay}, Hinigaran, Negros Occidental`;
        const parentName = `${randomItem(firstNamesFemale)} ${lastName}`;
        const phoneNumber = generatePhoneNumber();
        const email = `${lastName.toLowerCase().replace(' ', '')}${Math.floor(Math.random() * 1000)}@gmail.com`;

        const trackingYear = academicYear.yearLabel.split('-')[0];
        const trackingSeq = (totalCreated + 1).toString().padStart(5, '0');
        const trackingNumber = `HNS-${trackingYear}-${trackingSeq}`;

        // Determine strand for SHS
        let strandId = null;
        if (gradeLevel.displayOrder >= 5) {
          const sectionStrand = section.name.split('-')[0];
          const strand = strands.find(s => s.name === sectionStrand);
          if (strand) strandId = strand.id;
        }

        try {
          const applicant = await prisma.applicant.create({
            data: {
              lrn,
              lastName,
              firstName,
              middleName,
              suffix,
              birthDate,
              sex,
              address,
              parentGuardianName: parentName,
              parentGuardianContact: phoneNumber,
              emailAddress: email,
              trackingNumber,
              status: ApplicationStatus.APPROVED,
              gradeLevelId: gradeLevel.id,
              strandId,
              academicYearId: academicYear.id,
            },
          });

          await prisma.enrollment.create({
            data: {
              applicantId: applicant.id,
              sectionId: section.id,
              academicYearId: academicYear.id,
              enrolledById: registrar.id,
            },
          });

          totalCreated++;
        } catch (error) {
          console.error(`Error creating student: ${error}`);
        }
      }
    }

  console.log(`\n✅ Successfully seeded ${totalCreated} students across all grade levels`);
  console.log(`📊 Distribution: ~${studentsPerGrade} students per grade level`);
  console.log(`🏫 Sections: ${sections.length} total sections`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
