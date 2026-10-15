import type { AcademicHistory, SubjectGrades } from "@/shared/components/AcademicHistoryAccordion";

export type { AcademicHistory, SubjectGrades };

export interface LearnerAddress {
  houseNoStreet: string | null;
  barangay: string | null;
  cityMunicipality: string | null;
  province: string | null;
}

export interface LearnerFamilyMember {
  firstName: string;
  lastName: string;
  contactNumber: string | null;
  relationship: string;
}

export interface LearnerDashboardResponse {
  identity: {
    lrn: string;
    firstName: string;
    lastName: string;
    middleName: string | null;
    extensionName: string | null;
  };
  enrollment: {
    status: string;
    gradeLevel: string | null;
    section: string | null;
    academicStatus: string | null;
    curriculumProgram: string | null;
    advisingTeacher: string | null;
  };
  sf1: {
    birthdate: string;
    sex: string;
    placeOfBirth: string | null;
    religion: string | null;
    motherTongue: string | null;
    psaBirthCertNumber: string | null;
    studentPhoto: string | null;
    isIpCommunity: boolean;
    ipGroupName: string | null;
    is4PsBeneficiary: boolean;
    householdId4Ps: string | null;
    email: string | null;
    mobileNumber: string | null;
    permanentAddress: LearnerAddress | null;
    currentAddress: LearnerAddress | null;
    mother: LearnerFamilyMember | null;
    father: LearnerFamilyMember | null;
    guardian: LearnerFamilyMember | null;
  };
  academicHistory: AcademicHistory[];
  isEnrollmentActive: boolean;
  activeSchoolYear: string;
  activeTermFormat?: string;
  schoolName: string;
  schoolAcronym: string;
  schoolLogoUrl: string | null;
}
