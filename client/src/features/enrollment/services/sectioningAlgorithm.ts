import { getAutoDraftProgramType } from "@enrollpro/shared";
import type {
  SectionSummary,
  PoolLearner,
  DraftLearnerPlacement,
  DraftGenderCounts,
  DraftSectionRoster,
  DraftPlacement,
  SectioningAlgorithmInput,
} from "../types/sectioning.types";

export const formatLearnerName = (
  learner: Pick<PoolLearner, "lastName" | "firstName" | "middleName">,
): string => {
  const middleInitial = learner.middleName?.charAt(0)
    ? ` ${learner.middleName.charAt(0)}.`
    : "";
  return `${learner.lastName}, ${learner.firstName}${middleInitial}`;
};

export const sortLearnersByAverage = (first: PoolLearner, second: PoolLearner): number => {
  const firstAverage = first.genAve ?? -1;
  const secondAverage = second.genAve ?? -1;
  return (
    secondAverage - firstAverage || first.applicationId - second.applicationId
  );
};

export const calculateGenderCounts = (
  learners: DraftLearnerPlacement[],
): DraftGenderCounts => {
  return {
    boys: learners.filter((learner) => learner.sex === "MALE").length,
    girls: learners.filter((learner) => learner.sex === "FEMALE").length,
  };
};

export const buildRoster = (
  section: SectionSummary,
  learners: DraftLearnerPlacement[],
): DraftSectionRoster => {
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

export const rebuildDraftPlacement = (draft: DraftPlacement): DraftPlacement => ({
  ...draft,
  rosters: draft.rosters.map((roster) =>
    buildRoster(
      roster.section,
      roster.learners.map((learner) => ({
        ...learner,
        isNew:
          learner.isFinalized && !learner.isOverridden
            ? false
            : learner.isNew !== undefined
            ? learner.isNew
            : Boolean(learner.isOverridden || !learner.isFinalized),
      })),
    ),
  ),
});

export const snakeDraftLearners = (
  sections: SectionSummary[],
  males: PoolLearner[],
  females: PoolLearner[],
  rostersBySectionId: Map<number, DraftLearnerPlacement[]>,
  remainingCapacity: Map<number, number>,
): PoolLearner[] => {
  const unplaced: PoolLearner[] = [];
  let sectionIndex = 0;
  let forward = true;

  const getNextValidSection = (): SectionSummary | null => {
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

export const loadDraftPlacementFromServer = (
  gradeLevelId: number,
  learners: PoolLearner[],
  sections: SectionSummary[],
  schoolYearId?: number,
): DraftPlacement => {
  const rostersBySectionId = new Map<number, DraftLearnerPlacement[]>(
    sections.map((section) => [section.id, []]),
  );
  const unplacedLearners: PoolLearner[] = [];

  for (const learner of learners) {
    if (String(learner.gradeLevelId) !== String(gradeLevelId)) continue;
    const targetSectionId = learner.draftSectionId ?? learner.finalizedSectionId;
    if (targetSectionId) {
      if (!rostersBySectionId.has(targetSectionId)) {
        rostersBySectionId.set(targetSectionId, []);
      }
      rostersBySectionId.get(targetSectionId)!.push({
        ...learner,
        sectionId: targetSectionId,
        isOverridden: false,
        isNew: !learner.isFinalized,
      });
    } else if (!learner.isFinalized) {
      unplacedLearners.push(learner);
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

export const createDraftPlacement = (
  input: SectioningAlgorithmInput,
): DraftPlacement => {
  const {
    gradeLevelId,
    learners,
    sections,
    enableHomogeneousSections,
    homogeneousSectionCount,
    heterogeneousRoundRobin,
    topBecHeterogeneousRoundRobin,
    schoolYearId,
    academicYearId,
  } = input;

  const rostersBySectionId = new Map<number, DraftLearnerPlacement[]>(
    sections.map((section) => [section.id, []]),
  );
  const unplacedLearners: PoolLearner[] = [];
  const unassignedLearners: PoolLearner[] = [];

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

    // Phase 1: Global Sorting & Preparation
    // Strict Descending Sort: Highest Gen Ave first. Tie-breaker: Last Name, First Name.
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

    // Phase 2: Homogeneous Allocation (Pilot/Top Sections)
    let topSections: SectionSummary[] = [];
    let regularSections: SectionSummary[] = orderedSections;

    if (programType === "REGULAR" && enableHomogeneousSections) {
      topSections = orderedSections.filter((s) => s.isHomogeneous).slice(0, homogeneousSectionCount);
      const topSectionIds = new Set(topSections.map((s) => s.id));
      regularSections = orderedSections.filter((s) => !topSectionIds.has(s.id));
    }

    if (topSections.length > 0) {
      // Calculate Balanced Total Top Capacity
      const totalSections = topSections.length + regularSections.length;
      const targetPerSection = Math.ceil(remainingLearners.length / totalSections);
      const maxAvailableTopCapacity = topSections.reduce((acc, sec) => acc + (sec.maxCapacity || 40), 0);
      const balancedTopCapacity = targetPerSection * topSections.length;
      const totalTopCapacity = Math.min(balancedTopCapacity, maxAvailableTopCapacity);

      // Filter out conditionally promoted learners
      const eligibleForTop = remainingLearners.filter(
        (l) => l.academicStatus !== "CONDITIONALLY_PROMOTED",
      );

      // The Slice: Extract top N learners
      const topLearners = eligibleForTop.slice(0, totalTopCapacity);

      const unplacedTop: PoolLearner[] = topBecHeterogeneousRoundRobin
        ? (() => {
            const topRemainingCapacity = new Map(
              topSections.map((s) => [s.id, s.maxCapacity || 40]),
            );
            const topMales = topLearners.filter((l) => l.sex === "MALE");
            const topFemales = topLearners.filter((l) => l.sex === "FEMALE");
            return snakeDraftLearners(topSections, topMales, topFemales, rostersBySectionId, topRemainingCapacity);
          })()
        : (() => {
            // STRICT HOMOGENEOUS / STRICT ACADEMIC RANKING FOR TOP BEC
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

      // Remove assigned top learners from the master pool
      const unplacedTopIds = new Set(unplacedTop.map((l) => l.applicationId));
      const assignedTopIds = new Set(
        topLearners.filter((l) => !unplacedTopIds.has(l.applicationId)).map((l) => l.applicationId),
      );
      remainingLearners = remainingLearners.filter((l) => !assignedTopIds.has(l.applicationId));
    }

    // Phase 3: Allocation (Regular Sections)
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
        // STRICT HOMOGENEOUS: Fill each section up to target capacity sequentially.
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

    // Any leftovers become unplaced
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
    schoolYearId: academicYearId ?? schoolYearId,
    gradeLevelId,
    generatedAt: new Date().toISOString(),
    rosters: sections.map((section) =>
      buildRoster(section, rostersBySectionId.get(section.id) ?? []),
    ),
    unplacedLearners,
  };
};
