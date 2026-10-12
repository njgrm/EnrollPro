import { prisma } from "../../lib/prisma.js"

export const FALLBACK_DEFAULT_PASSWORD = "DepEd2026!"

export async function getDefaultLearnerPassword(
  customClient?: {
    schoolYear?: { findFirst: typeof prisma.schoolYear.findFirst };
    schoolSetting?: { findFirst: typeof prisma.schoolSetting.findFirst };
  },
): Promise<string> {
  const client = (customClient ?? prisma) as typeof prisma;

  try {
    const activeSy = await client.schoolYear.findFirst({
      where: { status: "ACTIVE" },
      select: { yearLabel: true },
    });

    if (activeSy?.yearLabel) {
      const year = activeSy.yearLabel.split("-")[0];
      if (year) {
        return `DepEd${year}!`;
      }
    }

    const setting = await client.schoolSetting.findFirst({
      select: { globalDefaultPassword: true },
    });

    return setting?.globalDefaultPassword || FALLBACK_DEFAULT_PASSWORD;
  } catch {
    return FALLBACK_DEFAULT_PASSWORD;
  }
}

export async function isConfiguredDefaultPassword(
  candidate: string,
): Promise<boolean> {
  if (candidate === FALLBACK_DEFAULT_PASSWORD) {
    return true;
  }

  try {
    const [settings, schoolYears] = await Promise.all([
      prisma.schoolSetting.findMany({
        take: 2,
        orderBy: { id: "asc" },
        select: { globalDefaultPassword: true },
      }),
      prisma.schoolYear.findMany({
        select: { yearLabel: true },
      }),
    ]);

    if (settings.some((s) => s.globalDefaultPassword === candidate)) {
      return true;
    }

    for (const sy of schoolYears) {
      if (sy.yearLabel) {
        const year = sy.yearLabel.split("-")[0];
        if (year && candidate === `DepEd${year}!`) {
          return true;
        }
      }
    }

    return false;
  } catch {
    return candidate === FALLBACK_DEFAULT_PASSWORD;
  }
}

