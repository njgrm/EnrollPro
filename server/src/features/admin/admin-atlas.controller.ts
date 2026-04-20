import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import type { AtlasSyncStatus, Prisma } from "../../generated/prisma/index.js";

function parsePositiveInt(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function parseOptionalPositiveInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = parsePositiveInt(Array.isArray(value) ? value[0] : value);
  return parsed ?? undefined;
}

function parseOptionalText(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const normalized = String(Array.isArray(value) ? value[0] : value).trim();
  return normalized.length > 0 ? normalized : undefined;
}

function parseOptionalAtlasStatus(value: unknown): AtlasSyncStatus | undefined {
  const normalized = parseOptionalText(value);
  if (!normalized) {
    return undefined;
  }

  if (normalized === "PENDING") {
    return "PENDING";
  }
  if (normalized === "SYNCED") {
    return "SYNCED";
  }
  if (normalized === "FAILED") {
    return "FAILED";
  }

  return undefined;
}

function getAtlasWebhookUrl(): string {
  return (
    process.env.ATLAS_TEACHER_WEBHOOK_URL?.trim() ||
    process.env.ATLAS_WEBHOOK_URL?.trim() ||
    ""
  );
}

async function probeAtlasEndpoint(url: string) {
  if (!url) {
    return {
      status: "UNCONFIGURED",
      latencyMs: null,
      httpStatus: null,
      error: "ATLAS webhook URL is not configured",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      method: "OPTIONS",
      signal: controller.signal,
    });

    return {
      status: response.ok ? "UP" : "DEGRADED",
      latencyMs: Date.now() - startedAt,
      httpStatus: response.status,
      error: response.ok ? null : `Probe returned status ${response.status}`,
    };
  } catch (error: any) {
    return {
      status: "DOWN",
      latencyMs: Date.now() - startedAt,
      httpStatus: null,
      error:
        error?.name === "AbortError"
          ? "Probe timed out"
          : error?.message || "Probe failed",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function atlasHealth(req: Request, res: Response) {
  try {
    const webhookUrl = getAtlasWebhookUrl();
    const [probe, statusCounts, oldestPending, recentFailures] =
      await Promise.all([
        probeAtlasEndpoint(webhookUrl),
        prisma.atlasSyncEvent.groupBy({
          by: ["status"],
          _count: { _all: true },
        }),
        prisma.atlasSyncEvent.findFirst({
          where: { status: "PENDING" },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            createdAt: true,
          },
        }),
        prisma.atlasSyncEvent.findMany({
          where: { status: "FAILED" },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            eventId: true,
            eventType: true,
            errorMessage: true,
            attemptCount: true,
            maxAttempts: true,
            nextRetryAt: true,
            createdAt: true,
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        }),
      ]);

    const counts = statusCounts.reduce(
      (acc, item) => {
        acc[item.status] = item._count._all;
        return acc;
      },
      {
        PENDING: 0,
        SYNCED: 0,
        FAILED: 0,
      } as Record<string, number>,
    );

    res.json({
      endpoint: {
        configured: Boolean(webhookUrl),
        url: webhookUrl || null,
        probe,
      },
      queue: {
        pending: counts.PENDING ?? 0,
        synced: counts.SYNCED ?? 0,
        failed: counts.FAILED ?? 0,
        oldestPendingEvent: oldestPending
          ? {
              id: oldestPending.id,
              createdAt: oldestPending.createdAt,
            }
          : null,
      },
      recentFailures: recentFailures.map((event) => ({
        id: event.id,
        eventId: event.eventId,
        eventType: event.eventType,
        errorMessage: event.errorMessage,
        attemptCount: event.attemptCount,
        maxAttempts: event.maxAttempts,
        nextRetryAt: event.nextRetryAt,
        createdAt: event.createdAt,
        teacher: event.teacher
          ? {
              id: event.teacher.id,
              name: `${event.teacher.lastName}, ${event.teacher.firstName}`,
            }
          : null,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function atlasEvents(req: Request, res: Response) {
  try {
    const page = parseOptionalPositiveInt(req.query.page) ?? 1;
    const pageSize = Math.min(
      parseOptionalPositiveInt(req.query.pageSize) ?? 20,
      100,
    );

    const status = parseOptionalAtlasStatus(req.query.status);
    const eventType = parseOptionalText(req.query.eventType);
    const teacherId = parseOptionalPositiveInt(req.query.teacherId);
    const schoolYearId = parseOptionalPositiveInt(req.query.schoolYearId);

    if (parseOptionalText(req.query.status) && !status) {
      return res.status(400).json({
        message: "status must be one of PENDING, SYNCED, or FAILED",
      });
    }

    const where: Prisma.AtlasSyncEventWhereInput = {
      ...(status ? { status } : {}),
      ...(eventType ? { eventType } : {}),
      ...(teacherId ? { teacherId } : {}),
      ...(schoolYearId ? { schoolYearId } : {}),
    };

    const [events, total] = await Promise.all([
      prisma.atlasSyncEvent.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          eventId: true,
          eventType: true,
          status: true,
          httpStatus: true,
          errorMessage: true,
          attemptCount: true,
          maxAttempts: true,
          nextRetryAt: true,
          acknowledgedAt: true,
          createdAt: true,
          updatedAt: true,
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          schoolYear: {
            select: {
              id: true,
              yearLabel: true,
            },
          },
        },
      }),
      prisma.atlasSyncEvent.count({ where }),
    ]);

    res.json({
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      events: events.map((event) => ({
        id: event.id,
        eventId: event.eventId,
        eventType: event.eventType,
        status: event.status,
        httpStatus: event.httpStatus,
        errorMessage: event.errorMessage,
        attemptCount: event.attemptCount,
        maxAttempts: event.maxAttempts,
        nextRetryAt: event.nextRetryAt,
        acknowledgedAt: event.acknowledgedAt,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        teacher: event.teacher
          ? {
              id: event.teacher.id,
              name: `${event.teacher.lastName}, ${event.teacher.firstName}`,
            }
          : null,
        schoolYear: event.schoolYear,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function atlasEventDetail(req: Request, res: Response) {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const event = await prisma.atlasSyncEvent.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            employeeId: true,
          },
        },
        schoolYear: {
          select: {
            id: true,
            yearLabel: true,
            status: true,
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ message: "ATLAS sync event not found" });
    }

    return res.json({ event });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
