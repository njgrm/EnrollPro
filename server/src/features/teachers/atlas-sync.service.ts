import { prisma } from "../../lib/prisma.js";
import { Prisma } from "../../generated/prisma/index.js";

const DEFAULT_TIMEOUT_MS = 10_000;
const RETRY_BASE_MS = 30_000;
const RETRY_MAX_MS = 15 * 60_000;
const DEFAULT_MAX_ATTEMPTS = 5;

type AtlasEventStatus = "PENDING" | "SYNCED" | "FAILED";

export interface AtlasSyncResult {
  status: AtlasEventStatus | "SKIPPED";
  eventRecordId: number | null;
  eventId: string | null;
  attemptCount: number;
  maxAttempts: number;
  httpStatus: number | null;
  errorMessage: string | null;
  nextRetryAt: string | null;
  acknowledgedAt: string | null;
}

interface QueueTeacherAtlasSyncInput {
  teacherId: number;
  schoolYearId?: number | null;
  eventType: string;
  triggerUserId?: number | null;
  triggerSource?: string;
  force?: boolean;
  reason?: string | null;
  immediate?: boolean;
}

interface QueueBulkTeacherAtlasSyncInput {
  teacherIds: number[];
  schoolYearId?: number | null;
  eventType: string;
  triggerUserId?: number | null;
  triggerSource?: string;
  force?: boolean;
  reason?: string | null;
  immediate?: boolean;
}

function getAtlasWebhookUrl(): string {
  return (
    process.env.ATLAS_TEACHER_WEBHOOK_URL?.trim() ||
    process.env.ATLAS_WEBHOOK_URL?.trim() ||
    ""
  );
}

function toIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function toDateOnlyString(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

function formatTeacherName(teacher: {
  firstName: string;
  lastName: string;
  middleName: string | null;
}): string {
  return `${teacher.lastName}, ${teacher.firstName}${teacher.middleName ? ` ${teacher.middleName.charAt(0)}.` : ""}`;
}

function toAtlasSyncResult(event: {
  id: number;
  eventId: string;
  status: AtlasEventStatus;
  attemptCount: number;
  maxAttempts: number;
  httpStatus: number | null;
  errorMessage: string | null;
  nextRetryAt: Date | null;
  acknowledgedAt: Date | null;
}): AtlasSyncResult {
  return {
    status: event.status,
    eventRecordId: event.id,
    eventId: event.eventId,
    attemptCount: event.attemptCount,
    maxAttempts: event.maxAttempts,
    httpStatus: event.httpStatus,
    errorMessage: event.errorMessage,
    nextRetryAt: toIsoString(event.nextRetryAt),
    acknowledgedAt: toIsoString(event.acknowledgedAt),
  };
}

function buildNextRetryAt(attemptCount: number): Date {
  const delayMs = Math.min(
    RETRY_BASE_MS * Math.pow(2, Math.max(0, attemptCount - 1)),
    RETRY_MAX_MS,
  );
  return new Date(Date.now() + delayMs);
}

function parseResponseBody(
  contentType: string | null,
  rawBody: string,
): unknown {
  if (!rawBody) {
    return null;
  }

  if (contentType?.toLowerCase().includes("application/json")) {
    try {
      return JSON.parse(rawBody);
    } catch {
      return { rawBody };
    }
  }

  return { rawBody };
}

function toPrismaJsonValue(
  value: unknown,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

async function resolveSchoolScope(schoolYearId?: number | null): Promise<{
  schoolId: number | null;
  schoolName: string | null;
  schoolYearId: number | null;
  schoolYearLabel: string | null;
}> {
  const schoolSetting = await prisma.schoolSetting.findFirst({
    select: {
      id: true,
      schoolName: true,
      activeSchoolYearId: true,
    },
  });

  const resolvedSchoolYearId =
    schoolYearId ?? schoolSetting?.activeSchoolYearId ?? null;

  if (!resolvedSchoolYearId) {
    return {
      schoolId: schoolSetting?.id ?? null,
      schoolName: schoolSetting?.schoolName ?? null,
      schoolYearId: null,
      schoolYearLabel: null,
    };
  }

  const schoolYear = await prisma.schoolYear.findUnique({
    where: { id: resolvedSchoolYearId },
    select: {
      id: true,
      yearLabel: true,
    },
  });

  if (!schoolYear) {
    return {
      schoolId: schoolSetting?.id ?? null,
      schoolName: schoolSetting?.schoolName ?? null,
      schoolYearId: null,
      schoolYearLabel: null,
    };
  }

  return {
    schoolId: schoolSetting?.id ?? null,
    schoolName: schoolSetting?.schoolName ?? null,
    schoolYearId: schoolYear.id,
    schoolYearLabel: schoolYear.yearLabel,
  };
}

async function buildTeacherPayload(
  teacherId: number,
  schoolYearId?: number | null,
) {
  const scope = await resolveSchoolScope(schoolYearId);
  if (!scope.schoolYearId) {
    return {
      scope,
      payload: null,
    };
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: {
      subjects: true,
      _count: { select: { sections: true } },
      teacherDesignations: {
        where: { schoolYearId: scope.schoolYearId },
        include: {
          updatedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          advisorySection: {
            select: {
              id: true,
              name: true,
              gradeLevelId: true,
              gradeLevel: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        take: 1,
      },
    },
  });

  if (!teacher) {
    return {
      scope,
      payload: null,
    };
  }

  const designation = teacher.teacherDesignations[0] ?? null;

  return {
    scope,
    payload: {
      sourceSystem: "enrollpro",
      generatedAt: new Date().toISOString(),
      scope: {
        schoolId: scope.schoolId,
        schoolName: scope.schoolName,
        schoolYearId: scope.schoolYearId,
        schoolYearLabel: scope.schoolYearLabel,
      },
      teacher: {
        teacherId: teacher.id,
        employeeId: teacher.employeeId,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        middleName: teacher.middleName,
        fullName: formatTeacherName(teacher),
        email: teacher.email,
        contactNumber: teacher.contactNumber,
        specialization: teacher.specialization,
        isActive: teacher.isActive,
        subjects: teacher.subjects.map((subject) => subject.subject),
        sectionCount: teacher._count.sections,
        designation: {
          isClassAdviser: designation?.isClassAdviser ?? false,
          advisorySectionId: designation?.advisorySectionId ?? null,
          advisorySectionName: designation?.advisorySection?.name ?? null,
          advisorySectionGradeLevelId:
            designation?.advisorySection?.gradeLevelId ?? null,
          advisorySectionGradeLevelName:
            designation?.advisorySection?.gradeLevel?.name ?? null,
          advisoryEquivalentHoursPerWeek:
            designation?.advisoryEquivalentHoursPerWeek ?? 0,
          isTic: designation?.isTic ?? false,
          isTIC: designation?.isTic ?? false,
          isTeachingExempt: designation?.isTeachingExempt ?? false,
          customTargetTeachingHoursPerWeek:
            designation?.customTargetTeachingHoursPerWeek ?? null,
          designationNotes: designation?.designationNotes ?? null,
          effectiveFrom: toDateOnlyString(designation?.effectiveFrom ?? null),
          effectiveTo: toDateOnlyString(designation?.effectiveTo ?? null),
          updateReason: designation?.updateReason ?? null,
          updatedById: designation?.updatedById ?? null,
          updatedByName: designation?.updatedBy
            ? `${designation.updatedBy.lastName}, ${designation.updatedBy.firstName}`
            : null,
          updatedAt: toIsoString(designation?.updatedAt ?? null),
        },
      },
    },
  };
}

async function markEventFailed(
  eventId: number,
  data: {
    attemptCount: number;
    maxAttempts: number;
    errorMessage: string;
    httpStatus?: number | null;
    responseBody?: unknown;
    durationMs?: number | null;
    retryable: boolean;
  },
) {
  return prisma.atlasSyncEvent.update({
    where: { id: eventId },
    data: {
      status: "FAILED",
      httpStatus: data.httpStatus ?? null,
      responseBody:
        data.responseBody === undefined
          ? Prisma.DbNull
          : toPrismaJsonValue(data.responseBody),
      errorMessage: data.errorMessage,
      durationMs: data.durationMs ?? null,
      lastAttemptAt: new Date(),
      attemptCount: data.attemptCount,
      nextRetryAt:
        data.retryable && data.attemptCount < data.maxAttempts
          ? buildNextRetryAt(data.attemptCount)
          : null,
      acknowledgedAt: null,
    },
    select: {
      id: true,
      eventId: true,
      status: true,
      attemptCount: true,
      maxAttempts: true,
      httpStatus: true,
      errorMessage: true,
      nextRetryAt: true,
      acknowledgedAt: true,
    },
  });
}

async function deliverAtlasSyncEvent(event: {
  id: number;
  eventId: string;
  requestUrl: string;
  payload: unknown;
  attemptCount: number;
  maxAttempts: number;
}): Promise<AtlasSyncResult> {
  const webhookUrl = event.requestUrl.trim();
  const nextAttemptCount = event.attemptCount + 1;

  if (!webhookUrl) {
    const failed = await markEventFailed(event.id, {
      attemptCount: nextAttemptCount,
      maxAttempts: event.maxAttempts,
      errorMessage: "ATLAS webhook URL is not configured",
      retryable: false,
    });

    return toAtlasSyncResult(failed);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event.payload),
      signal: controller.signal,
    });

    const rawBody = await response.text();
    const parsedBody = parseResponseBody(
      response.headers.get("content-type"),
      rawBody,
    );
    const durationMs = Date.now() - startedAt;

    if (response.ok) {
      const synced = await prisma.atlasSyncEvent.update({
        where: { id: event.id },
        data: {
          status: "SYNCED",
          httpStatus: response.status,
          responseBody: toPrismaJsonValue(parsedBody),
          errorMessage: null,
          attemptCount: nextAttemptCount,
          durationMs,
          lastAttemptAt: new Date(),
          nextRetryAt: null,
          acknowledgedAt: new Date(),
        },
        select: {
          id: true,
          eventId: true,
          status: true,
          attemptCount: true,
          maxAttempts: true,
          httpStatus: true,
          errorMessage: true,
          nextRetryAt: true,
          acknowledgedAt: true,
        },
      });

      return toAtlasSyncResult(synced);
    }

    const failed = await markEventFailed(event.id, {
      attemptCount: nextAttemptCount,
      maxAttempts: event.maxAttempts,
      httpStatus: response.status,
      responseBody: parsedBody,
      durationMs,
      errorMessage: `ATLAS endpoint responded with status ${response.status}`,
      retryable: true,
    });

    return toAtlasSyncResult(failed);
  } catch (error: any) {
    const durationMs = Date.now() - startedAt;
    const failed = await markEventFailed(event.id, {
      attemptCount: nextAttemptCount,
      maxAttempts: event.maxAttempts,
      durationMs,
      errorMessage:
        error?.name === "AbortError"
          ? "ATLAS request timed out"
          : error?.message || "ATLAS sync request failed",
      retryable: true,
    });

    return toAtlasSyncResult(failed);
  } finally {
    clearTimeout(timeout);
  }
}

export async function queueTeacherAtlasSync(
  input: QueueTeacherAtlasSyncInput,
): Promise<AtlasSyncResult> {
  const { scope, payload } = await buildTeacherPayload(
    input.teacherId,
    input.schoolYearId,
  );

  if (!payload || !scope.schoolYearId) {
    return {
      status: "SKIPPED",
      eventRecordId: null,
      eventId: null,
      attemptCount: 0,
      maxAttempts: DEFAULT_MAX_ATTEMPTS,
      httpStatus: null,
      errorMessage: "No active or selected school year for ATLAS payload",
      nextRetryAt: null,
      acknowledgedAt: null,
    };
  }

  const event = await prisma.atlasSyncEvent.create({
    data: {
      eventId: crypto.randomUUID(),
      eventType: input.eventType,
      teacherId: input.teacherId,
      schoolYearId: scope.schoolYearId,
      payload: {
        ...payload,
        metadata: {
          triggerUserId: input.triggerUserId ?? null,
          triggerSource: input.triggerSource ?? "system",
          force: input.force ?? false,
          reason: input.reason ?? null,
        },
      },
      requestUrl: getAtlasWebhookUrl(),
      status: "PENDING",
      maxAttempts: DEFAULT_MAX_ATTEMPTS,
    },
    select: {
      id: true,
      eventId: true,
      requestUrl: true,
      payload: true,
      attemptCount: true,
      maxAttempts: true,
    },
  });

  if (input.immediate === false) {
    return {
      status: "PENDING",
      eventRecordId: event.id,
      eventId: event.eventId,
      attemptCount: event.attemptCount,
      maxAttempts: event.maxAttempts,
      httpStatus: null,
      errorMessage: null,
      nextRetryAt: null,
      acknowledgedAt: null,
    };
  }

  return deliverAtlasSyncEvent(event);
}

export async function queueBulkTeacherAtlasSync(
  input: QueueBulkTeacherAtlasSyncInput,
): Promise<{
  total: number;
  queued: number;
  synced: number;
  failed: number;
  skipped: number;
  results: Array<{ teacherId: number; sync: AtlasSyncResult }>;
}> {
  const uniqueTeacherIds = Array.from(new Set(input.teacherIds));

  const results: Array<{ teacherId: number; sync: AtlasSyncResult }> = [];

  for (const teacherId of uniqueTeacherIds) {
    const sync = await queueTeacherAtlasSync({
      teacherId,
      schoolYearId: input.schoolYearId,
      eventType: input.eventType,
      triggerUserId: input.triggerUserId,
      triggerSource: input.triggerSource,
      force: input.force,
      reason: input.reason,
      immediate: input.immediate,
    });

    results.push({ teacherId, sync });
  }

  const summary = results.reduce(
    (acc, result) => {
      if (result.sync.status === "SYNCED") {
        acc.synced += 1;
      } else if (result.sync.status === "FAILED") {
        acc.failed += 1;
      } else if (result.sync.status === "SKIPPED") {
        acc.skipped += 1;
      } else {
        acc.queued += 1;
      }
      return acc;
    },
    {
      total: uniqueTeacherIds.length,
      queued: 0,
      synced: 0,
      failed: 0,
      skipped: 0,
    },
  );

  return {
    ...summary,
    results,
  };
}

export async function processPendingAtlasSyncEvents(
  batchSize = 25,
): Promise<number> {
  const now = new Date();

  const candidateEvents = await prisma.atlasSyncEvent.findMany({
    where: {
      status: {
        in: ["PENDING", "FAILED"],
      },
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
    },
    orderBy: [{ createdAt: "asc" }],
    take: Math.max(batchSize * 2, batchSize),
    select: {
      id: true,
      eventId: true,
      requestUrl: true,
      payload: true,
      attemptCount: true,
      maxAttempts: true,
    },
  });

  const pendingEvents = candidateEvents
    .filter((event) => event.attemptCount < event.maxAttempts)
    .slice(0, batchSize);

  for (const event of pendingEvents) {
    await deliverAtlasSyncEvent(event);
  }

  return pendingEvents.length;
}

export async function getTeacherLatestAtlasSync(
  teacherId: number,
  schoolYearId?: number | null,
): Promise<AtlasSyncResult | null> {
  const latest = await prisma.atlasSyncEvent.findFirst({
    where: {
      teacherId,
      ...(schoolYearId ? { schoolYearId } : {}),
    },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      eventId: true,
      status: true,
      attemptCount: true,
      maxAttempts: true,
      httpStatus: true,
      errorMessage: true,
      nextRetryAt: true,
      acknowledgedAt: true,
    },
  });

  return latest ? toAtlasSyncResult(latest) : null;
}
