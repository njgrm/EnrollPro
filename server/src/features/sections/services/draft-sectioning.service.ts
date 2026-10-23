import { getAutoDraftProgramType, type ApplicantType, type LearnerType } from "@enrollpro/shared";

export interface BackendSectionSummary {
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

export interface BackendPoolLearner {
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

export interface BackendDraftGenderCounts {
  boys: number;
  girls: number;
}

export interface BackendDraftLearnerPlacement extends BackendPoolLearner {
  sectionId: number;
  isOverridden: boolean;
  isNew?: boolean;
}

export interface BackendDraftSectionRoster {
  section: BackendSectionSummary;
  learners: BackendDraftLearnerPlacement[];
  genderCounts: BackendDraftGenderCounts;
  totalCount: number;
  newCount?: number;
  isOverCapacity: boolean;
}

export interface BackendDraftPlacement {
  schoolYearId?: number;
  gradeLevelId: number;
  generatedAt: string;
  rosters: BackendDraftSectionRoster[];
  unplacedLearners: BackendPoolLearner[];
}

export interface BackendSectioningAlgorithmInput {
  gradeLevelId: number;
  learners: BackendPoolLearner[];
  sections: BackendSectionSummary[];
  enableHomogeneousSections: boolean;
  homogeneousSectionCount: number;
  heterogeneousRoundRobin: boolean;
  topBecHeterogeneousRoundRobin: boolean;
  schoolYearId?: number;
}

const sortLearnersByAverage = (first: BackendPoolLearner, second: BackendPoolLearner): number => {
  const firstAverage = first.genAve ?? -1;
  const secondAverage = second.genAve ?? -1;
  return (
    secondAverage - firstAverage || first.applicationId - second.applicationId
  );
};

const calculateGenderCounts = (
  learners: BackendDraftLearnerPlacement[],
): BackendDraftGenderCounts => ({
  boys: learners.filter((learner) => learner.sex === "MALE").length,
  girls: learners.filter((learner) => learner.sex === "FEMALE").length,
});

const buildRoster = (
  section: BackendSectionSummary,
  learners: BackendDraftLearnerPlacement[],
): BackendDraftSectionRoster => {
  const sortedLearners = [...learners].sort(sortLearnersByAverage);
  const totalCount = sortedLearners.length;
  const newCount = sortedLearners.filter((learner) => Boolean(learner.isNew)).length;
  return {
    section,
    learners: sortedLearners,
    genderCounts: calculateGenderCounts(sortedLearners),
    totalCount,
    newCount,
    isOverCapacity: totalCount > section.maxCapacity,
  };
};

const snakeDraftLearners = (
  sections: BackendSectionSummary[],
  males: BackendPoolLearner[],
  females: BackendPoolLearner[],
  rostersBySectionId: Map<number, BackendDraftLearnerPlacement[]>,
  remainingCapacity: Map<number, number>,
): BackendPoolLearner[] => {
  const unplaced: BackendPoolLearner[] = [];
  let sectionIndex = 0;
  let forward = true;

  const getNextValidSection = (): BackendSectionSummary | null => {
    const totalRemaining = Array.from(remainingCapacity.values()).reduce((sum, c) => sum + c, 0);
    if (totalRemaining <= 0) return null;

    const startState = { idx: sectionIndex, fwd: forward };
    let looped = false;

    while (true) {
      const current = sectionIndex;
      const section = sections[current];

      if (forward) {
        if (sectionIndex >= sections.length - 1) forward = false;
        else sectionIndex++;
      } else {
        if (sectionIndex <= 0) forward = true;
        else sectionIndex--;
      }

      if ((remainingCapacity.get(section.id) ?? 0) > 0) return section;

      if (sectionIndex === startState.idx && forward === startState.fwd) {
        if (looped) return null;
        looped = true;
      }
    }
  };

  for (const learner of males) {
    const targetSection = getNextValidSection();
    if (targetSection) {
      const currentRoster = rostersBySectionId.get(targetSection.id);
      if (currentRoster) {
        currentRoster.push({ ...learner, sectionId: targetSection.id, isOverridden: false });
      }
      remainingCapacity.set(targetSection.id, (remainingCapacity.get(targetSection.id) ?? 0) - 1);
    } else {
      unplaced.push(learner);
    }
  }

  // Reset pointer for females to ensure perfectly symmetric academic parity
  sectionIndex = 0;
  forward = true;

  for (const learner of females) {
    const targetSection = getNextValidSection();
    if (targetSection) {
      const currentRoster = rostersBySectionId.get(targetSection.id);
      if (currentRoster) {
        currentRoster.push({ ...learner, sectionId: targetSection.id, isOverridden: false });
      }
      remainingCapacity.set(targetSection.id, (remainingCapacity.get(targetSection.id) ?? 0) - 1);
    } else {
      unplaced.push(learner);
    }
  }

  return unplaced;
};

export const createBackendDraftPlacement = (
  input: BackendSectioningAlgorithmInput,
): BackendDraftPlacement => {
  const {
    gradeLevelId,
    learners,
    sections,
    enableHomogeneousSections,
    homogeneousSectionCount,
    heterogeneousRoundRobin,
    topBecHeterogeneousRoundRobin,
    schoolYearId,
  } = input;

  const rostersBySectionId = new Map<number, BackendDraftLearnerPlacement[]>(
    sections.map((section) => [section.id, []]),
  );
  const unplacedLearners: BackendPoolLearner[] = [];
  const unassignedLearners: BackendPoolLearner[] = [];

  for (const learner of learners) {
    if (String(learner.gradeLevelId) === String(gradeLevelId)) {
      unassignedLearners.push(learner);
    }
  }

  const programTypes = Array.from(
    new Set(unassignedLearners.map((learner) => getAutoDraftProgramType(learner))),
  );

  for (const programType of programTypes) {
    const rawProgramLearners = unassignedLearners.filter(
      (learner) => getAutoDraftProgramType(learner) === programType,
    );
    const programSections = sections.filter(
      (section) => section.programType === programType,
    );

    const sortedLearners = [...rawProgramLearners].sort((a, b) => {
      const aAve = a.genAve ?? -1;
      const bAve = b.genAve ?? -1;
      if (aAve !== bAve) return bAve - aAve;

      const nameA = `${a.lastName}, ${a.firstName}`;
      const nameB = `${b.lastName}, ${b.firstName}`;
      return nameA.localeCompare(nameB);
    });

    const orderedSections = [...programSections].sort(
      (first, second) =>
        first.sortOrder - second.sortOrder ||
        first.name.localeCompare(second.name) ||
        first.id - second.id,
    );

    if (sortedLearners.length === 0 || orderedSections.length === 0) {
      unplacedLearners.push(...sortedLearners);
      continue;
    }

    let remainingLearners = [...sortedLearners];

    let topSections: BackendSectionSummary[] = [];
    let regularSections: BackendSectionSummary[] = orderedSections;

    if (programType === "REGULAR" && enableHomogeneousSections) {
      topSections = orderedSections.filter((s) => s.isHomogeneous).slice(0, homogeneousSectionCount);
      const topSectionIds = new Set(topSections.map((s) => s.id));
      regularSections = orderedSections.filter((s) => !topSectionIds.has(s.id));
    }

    if (topSections.length > 0) {
      const totalSections = topSections.length + regularSections.length;
      const targetPerSection = Math.ceil(remainingLearners.length / totalSections);
      const maxAvailableTopCapacity = topSections.reduce((acc, sec) => acc + (sec.maxCapacity || 40), 0);
      const balancedTopCapacity = targetPerSection * topSections.length;
      const totalTopCapacity = Math.min(balancedTopCapacity, maxAvailableTopCapacity);

      const eligibleForTop = remainingLearners.filter(
        (l) => l.academicStatus !== "CONDITIONALLY_PROMOTED",
      );

      const topLearners = eligibleForTop.slice(0, totalTopCapacity);

      const unplacedTop: BackendPoolLearner[] = topBecHeterogeneousRoundRobin
        ? (() => {
            const topRemainingCapacity = new Map(
              topSections.map((s) => [s.id, s.maxCapacity || 40]),
            );
            const topMales = topLearners.filter((l) => l.sex === "MALE");
            const topFemales = topLearners.filter((l) => l.sex === "FEMALE");
            return snakeDraftLearners(topSections, topMales, topFemales, rostersBySectionId, topRemainingCapacity);
          })()
        : (() => {
            let unassignedTop = [...topLearners];
            const targetPerTopSection = Math.ceil(topLearners.length / topSections.length);
            for (const section of topSections) {
              const maxAvail = section.maxCapacity || 40;
              const capacity = Math.min(targetPerTopSection, maxAvail);
              const assigned = unassignedTop.slice(0, capacity);
              unassignedTop = unassignedTop.slice(capacity);

              const roster = rostersBySectionId.get(section.id);
              if (roster) {
                assigned.forEach((l) =>
                  roster.push({
                    ...l,
                    sectionId: section.id,
                    draftSectionId: section.id,
                    isOverridden: false,
                  }),
                );
              }
            }
            return unassignedTop;
          })();

      const unplacedTopIds = new Set(unplacedTop.map((l) => l.applicationId));
      const assignedTopIds = new Set(
        topLearners.filter((l) => !unplacedTopIds.has(l.applicationId)).map((l) => l.applicationId),
      );
      remainingLearners = remainingLearners.filter((l) => !assignedTopIds.has(l.applicationId));
    }

    if (remainingLearners.length > 0 && regularSections.length > 0) {
      if (heterogeneousRoundRobin) {
        const remainingCapacity = new Map(
          regularSections.map((s) => [s.id, s.maxCapacity || 40]),
        );

        const males = remainingLearners.filter((l) => l.sex === "MALE");
        const females = remainingLearners.filter((l) => l.sex === "FEMALE");

        const unplaced = snakeDraftLearners(regularSections, males, females, rostersBySectionId, remainingCapacity);
        remainingLearners = unplaced;
      } else {
        const totalSections = regularSections.length;
        const targetPerSection = Math.ceil(remainingLearners.length / totalSections);
        for (const section of regularSections) {
          const maxAvail = section.maxCapacity || 40;
          const capacity = Math.min(targetPerSection, maxAvail);
          const assigned = remainingLearners.slice(0, capacity);
          remainingLearners = remainingLearners.slice(capacity);

          const roster = rostersBySectionId.get(section.id);
          if (roster) {
            assigned.forEach((l) =>
              roster.push({
                ...l,
                sectionId: section.id,
                draftSectionId: section.id,
                isOverridden: false,
              }),
            );
          }
        }
      }
    }

    if (remainingLearners.length > 0) {
      unplacedLearners.push(...remainingLearners);
    }
  }

  for (const section of sections) {
    const sectionLearners = rostersBySectionId.get(section.id) ?? [];
    for (const learner of sectionLearners) {
      learner.isNew = !learner.isFinalized;
    }
  }

  return {
    schoolYearId,
    gradeLevelId,
    generatedAt: new Date().toISOString(),
    rosters: sections.map((section) =>
      buildRoster(section, rostersBySectionId.get(section.id) ?? []),
    ),
    unplacedLearners,
  };
};
