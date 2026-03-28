import 'dotenv/config';
import { PrismaClient, Sex, LearnerType, ApplicationStatus, ApplicantType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding multiple sample applicants...');

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
  }

  // 2. Ensure Grade Levels exist
  const gradeLevels = await Promise.all([
    prisma.gradeLevel.upsert({
      where: { id: 1007 }, // Using high IDs to avoid collision if needed, but displayOrder is key
      update: {},
      create: { id: 1007, name: 'Grade 7', displayOrder: 7, schoolYearId: schoolYear.id }
    }).catch(() => prisma.gradeLevel.findFirst({ where: { name: 'Grade 7', schoolYearId: schoolYear.id } })),
    prisma.gradeLevel.upsert({
      where: { id: 1011 },
      update: {},
      create: { id: 1011, name: 'Grade 11', displayOrder: 11, schoolYearId: schoolYear.id }
    }).catch(() => prisma.gradeLevel.findFirst({ where: { name: 'Grade 11', schoolYearId: schoolYear.id } }))
  ]);

  const g7 = gradeLevels[0]!;
  const g11 = gradeLevels[1]!;

  // 3. Ensure Strands exist for G11
  const strands = await Promise.all([
    prisma.strand.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, name: 'STEM', schoolYearId: schoolYear.id, applicableGradeLevelIds: [g11.id], track: 'ACADEMIC' }
    }).catch(() => prisma.strand.findFirst({ where: { name: 'STEM', schoolYearId: schoolYear.id } })),
    prisma.strand.upsert({
      where: { id: 2 },
      update: {},
      create: { id: 2, name: 'ABM', schoolYearId: schoolYear.id, applicableGradeLevelIds: [g11.id], track: 'ACADEMIC' }
    }).catch(() => prisma.strand.findFirst({ where: { name: 'ABM', schoolYearId: schoolYear.id } }))
  ]);

  const stem = strands[0]!;

  // 4. Ensure SCP Configs are active
  const scpTypes = [
    'SCIENCE_TECHNOLOGY_AND_ENGINEERING',
    'SPECIAL_PROGRAM_IN_THE_ARTS',
    'SPECIAL_PROGRAM_IN_SPORTS'
  ];

  for (const scp of scpTypes) {
    await prisma.scpConfig.upsert({
      where: {
        uq_scp_configs_school_year_scp_type: {
          schoolYearId: schoolYear.id,
          scpType: scp as ApplicantType
        }
      },
      update: { isOffered: true },
      create: {
        schoolYearId: schoolYear.id,
        scpType: scp as ApplicantType,
        isOffered: true,
        cutoffScore: 85
      }
    });
  }

  const sampleData = [
    { firstName: 'MARIA', lastName: 'SANTOS', sex: Sex.FEMALE, gId: g7.id, type: 'SCIENCE_TECHNOLOGY_AND_ENGINEERING' as ApplicantType, status: ApplicationStatus.SUBMITTED },
    { firstName: 'JOSE', lastName: 'RIZAL', sex: Sex.MALE, gId: g7.id, type: 'REGULAR' as ApplicantType, status: ApplicationStatus.UNDER_REVIEW },
    { firstName: 'ANA', lastName: 'KALAW', sex: Sex.FEMALE, gId: g7.id, type: 'SPECIAL_PROGRAM_IN_THE_ARTS' as ApplicantType, status: ApplicationStatus.ELIGIBLE },
    { firstName: 'PEDRO', lastName: 'PENDUKO', sex: Sex.MALE, gId: g7.id, type: 'SPECIAL_PROGRAM_IN_SPORTS' as ApplicantType, status: ApplicationStatus.EXAM_SCHEDULED },
    { firstName: 'ELENA', lastName: 'GUERRERO', sex: Sex.FEMALE, gId: g11.id, type: 'REGULAR' as ApplicantType, status: ApplicationStatus.SUBMITTED, strandId: stem.id },
    { firstName: 'MANUEL', lastName: 'QUEZON', sex: Sex.MALE, gId: g11.id, type: 'STEM_GRADE_11' as ApplicantType, status: ApplicationStatus.PASSED, strandId: stem.id },
    { firstName: 'CORAZON', lastName: 'AQUINO', sex: Sex.FEMALE, g7: g7.id, type: 'REGULAR' as ApplicantType, status: ApplicationStatus.PRE_REGISTERED },
    { firstName: 'BENIGNO', lastName: 'AQUINO', sex: Sex.MALE, gId: g7.id, type: 'SCIENCE_TECHNOLOGY_AND_ENGINEERING' as ApplicantType, status: ApplicationStatus.PASSED },
    { firstName: 'RAMON', lastName: 'MAGSAYSAY', sex: Sex.MALE, gId: g7.id, type: 'REGULAR' as ApplicantType, status: ApplicationStatus.NOT_QUALIFIED },
    { firstName: 'GLORIA', lastName: 'ARROYO', sex: Sex.FEMALE, gId: g11.id, type: 'REGULAR' as ApplicantType, status: ApplicationStatus.ENROLLED, strandId: stem.id },
  ];

  for (const [i, data] of sampleData.entries()) {
    const trackingNumber = `${data.type === 'REGULAR' ? 'REG' : 'SCP'}-${schoolYear.yearLabel.slice(2, 4)}-${1000 + i}`;
    
    const applicant = await prisma.applicant.upsert({
      where: { trackingNumber },
      update: {},
      create: {
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: new Date('2013-01-01'),
        sex: data.sex,
        lrn: `12345678${1000 + i}`,
        emailAddress: `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}@example.com`,
        currentAddress: { barangay: 'San Jose', cityMunicipality: 'Iloilo City', province: 'Iloilo' },
        motherName: { firstName: 'MOM', lastName: data.lastName },
        fatherName: { firstName: 'DAD', lastName: data.lastName },
        lastSchoolName: 'SAMPLE ELEMENTARY',
        lastGradeCompleted: 'Grade 6',
        schoolYearLastAttended: '2025-2026',
        learnerType: LearnerType.NEW_ENROLLEE,
        isScpApplication: data.type !== 'REGULAR',
        scpType: data.type !== 'REGULAR' ? data.type : null,
        applicantType: data.type,
        trackingNumber,
        status: data.status,
        gradeLevelId: data.gId || g7.id,
        strandId: data.strandId || null,
        schoolYearId: schoolYear.id,
        isPrivacyConsentGiven: true,
        portalPin: '1234',
        checklist: {
          create: {
            isPsaBirthCertPresented: i % 2 === 0,
            isSf9Submitted: i % 3 === 0,
            isGoodMoralPresented: i % 4 === 0
          }
        }
      }
    });
    console.log(`Created applicant: ${applicant.firstName} ${applicant.lastName} (${applicant.trackingNumber})`);
  }

  console.log('✅ Applicant table seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
