import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding sample G7 STE student...');

  // 1. Ensure Active School Year exists
  let schoolYear = await prisma.schoolYear.findUnique({
    where: { yearLabel: '2026-2027' }
  });

  if (!schoolYear) {
    schoolYear = await prisma.schoolYear.create({
      data: {
        yearLabel: '2026-2027',
        status: 'ACTIVE',
        isActive: true,
      }
    });
    console.log('Created School Year: 2026-2027');
  }

  // 2. Ensure Grade 7 exists for this school year
  let grade7 = await prisma.gradeLevel.findFirst({
    where: { 
      name: 'Grade 7',
      schoolYearId: schoolYear.id
    }
  });

  if (!grade7) {
    grade7 = await prisma.gradeLevel.create({
      data: {
        name: 'Grade 7',
        displayOrder: 7,
        schoolYearId: schoolYear.id
      }
    });
    console.log('Created Grade Level: Grade 7');
  }

  // 3. Ensure STE Config exists
  const steConfig = await prisma.scpConfig.upsert({
    where: {
      uq_scp_configs_school_year_scp_type: {
        schoolYearId: schoolYear.id,
        scpType: 'SCIENCE_TECHNOLOGY_AND_ENGINEERING'
      }
    },
    update: { isOffered: true },
    create: {
      schoolYearId: schoolYear.id,
      scpType: 'SCIENCE_TECHNOLOGY_AND_ENGINEERING',
      isOffered: true,
      cutoffScore: 85,
      notes: 'Sample STE Program'
    }
  });
  console.log('Ensured STE Config is Active');

  // 4. Create Sample Applicant
  const trackingNumber = `STE-${schoolYear.yearLabel.slice(2, 4)}-${Math.floor(1000 + Math.random() * 9000)}`;
  
  const applicant = await prisma.applicant.create({
    data: {
      firstName: 'JUAN',
      lastName: 'DELA CRUZ',
      middleName: 'PROVEN',
      birthDate: new Date('2013-05-15'),
      sex: 'MALE',
      lrn: '123456789012',
      emailAddress: 'juan.delacruz@example.com',
      currentAddress: {
        houseNumber: '123',
        street: 'Sample St',
        barangay: 'San Jose',
        cityMunicipality: 'Iloilo City',
        province: 'Iloilo'
      },
      motherName: {
        firstName: 'MARIA',
        lastName: 'DELA CRUZ'
      },
      fatherName: {
        firstName: 'PEDRO',
        lastName: 'DELA CRUZ'
      },
      lastSchoolName: 'SAN JOSE ELEMENTARY SCHOOL',
      lastGradeCompleted: 'Grade 6',
      schoolYearLastAttended: '2025-2026',
      learnerType: 'NEW_ENROLLEE',
      isScpApplication: true,
      scpType: 'SCIENCE_TECHNOLOGY_AND_ENGINEERING',
      applicantType: 'SCIENCE_TECHNOLOGY_AND_ENGINEERING',
      trackingNumber,
      status: 'SUBMITTED',
      gradeLevelId: grade7.id,
      schoolYearId: schoolYear.id,
      admissionChannel: 'ONLINE',
      isPrivacyConsentGiven: true,
      portalPin: '1234'
    }
  });

  console.log(`✅ Sample STE Applicant Created!`);
  console.log(`   Name: ${applicant.firstName} ${applicant.lastName}`);
  console.log(`   Tracking Number: ${applicant.trackingNumber}`);
  console.log(`   Grade Level: Grade 7`);
  console.log(`   Program: STE`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
