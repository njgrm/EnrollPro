import type { ApplicantType, LearnerType } from "@enrollpro/shared";

export interface SectionSummary {
  id: number;
  name: string;
  gradeLevel: string;
  gradeLevelOrder: number;
  gradeLevelId: number;
  sortOrder: number;
  maxCapacity: number;
  currentCount: number;
  boys: number;
  girls: number;
  adviser: string;
  programType: ApplicantType;
  isHomogeneous?: boolean;
  sectionRank?: number | null;
  draftCount?: number;
  draftBoys?: number;
  draftGirls?: number;
}

export interface PoolLearner {
  applicationId: number;
  lrn: string | null;
  firstName: string;
  lastName: string;
  middleName: string | null;
  sex: "MALE" | "FEMALE";
  genAve: number | null;
  status: string;
  gradeLevel: string;
  gradeLevelId: number;
  duplicateFlag?: boolean;
  learnerType: LearnerType;
  isBalikAral: boolean;
  applicantType: ApplicantType;
  assignedProgram: ApplicantType | null;
  programType: ApplicantType;
  academicStatus: string;
  studentPhoto?: string | null;
  draftSectionId?: number;
  isFinalized?: boolean;
  finalizedSectionId?: number;
}

export interface DraftGenderCounts {
  boys: number;
  girls: number;
}

export interface DraftLearnerPlacement extends PoolLearner {
  sectionId: number;
  isOverridden: boolean;
  isNew?: boolean;
}

export interface DraftSectionRoster {
  section: SectionSummary;
  learners: DraftLearnerPlacement[];
  genderCounts: DraftGenderCounts;
  totalCount: number;
  newCount?: number;
  isOverCapacity: boolean;
}

export interface DraftPlacement {
  schoolYearId?: number;
  gradeLevelId: number;
  generatedAt: string;
  rosters: DraftSectionRoster[];
  unplacedLearners: PoolLearner[];
}

export interface SectioningAlgorithmInput {
  gradeLevelId: number;
  learners: PoolLearner[];
  sections: SectionSummary[];
  enableHomogeneousSections: boolean;
  homogeneousSectionCount: number;
  heterogeneousRoundRobin: boolean;
  topBecHeterogeneousRoundRobin: boolean;
  previousRosters?: DraftSectionRoster[];
  schoolYearId?: number;
  academicYearId?: number;
}
