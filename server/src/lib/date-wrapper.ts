import type { Request } from "express"

interface SystemDateOverride {
  mockedTimestamp: number
  anchoredAt: number
}

let systemDateOverride: SystemDateOverride | null = null

export function setSystemDateOverride(mockedDate: Date, anchor?: number): void {
  systemDateOverride = {
    mockedTimestamp: mockedDate.getTime(),
    anchoredAt: anchor ?? Date.now(),
  }
}

export async function initializeSystemDateOverride(): Promise<void> {
  const { prisma } = await import("./prisma.js")
  const setting = await prisma.schoolSetting.findFirst({
    select: { mockedSystemDate: true, mockedSystemDateAnchor: true },
  })

  if (setting?.mockedSystemDate && setting.mockedSystemDateAnchor) {
    systemDateOverride = {
      mockedTimestamp: setting.mockedSystemDate.getTime(),
      anchoredAt: Number(setting.mockedSystemDateAnchor),
    }
  } else {
    systemDateOverride = null
  }
}

export function clearSystemDateOverride(): void {
  systemDateOverride = null
}

export function getSystemDateOverride(): Date | null {
  if (!systemDateOverride) return null

  const elapsedMilliseconds = Math.max(0, Date.now() - systemDateOverride.anchoredAt)
  return new Date(systemDateOverride.mockedTimestamp + elapsedMilliseconds)
}

export function getSystemDateOverrideRaw(): SystemDateOverride | null {
  return systemDateOverride
}

/**
 * Returns the effective system date, considering active mock date overrides (header or settings).
 * Security tokens (JWT) should still use standard Date.now() / real clock.
 */
export function getSystemDate(req?: Request): Date {
  if (req?.headers) {
    const mockDateHeader = req.headers["x-mock-date"]

    if (mockDateHeader && typeof mockDateHeader === "string") {
      const parsed = new Date(mockDateHeader)
      if (!Number.isNaN(parsed.getTime())) {
        return parsed
      }
    }
  }

  return getSystemDateOverride() ?? new Date()
}
