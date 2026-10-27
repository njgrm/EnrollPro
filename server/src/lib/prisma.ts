import { PrismaClient, Prisma } from '../generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import * as pg from 'pg';
import { getAuditContext } from './context.js';
import { formatAuditField } from '../features/audit-logs/field-mapper.js';
import { getSystemDateOverride } from './date-wrapper.js';

const pool = new pg.Pool({
	connectionString: process.env.DATABASE_URL,
	max: 50,
});
const adapter = new PrismaPg(pool);
const basePrisma = new PrismaClient({ adapter });

interface DynamicModelClient {
  findUnique(args: { where: unknown }): Promise<unknown>;
}

const getDynamicModelClient = (model: string): DynamicModelClient =>
  (
    basePrisma as unknown as Record<string, DynamicModelClient>
  )[model];

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;

const stringifySafe = (val: unknown): string => {
  return JSON.stringify(val, (_, v) => typeof v === "bigint" ? v.toString() : v);
};

const toJsonValue = (value: unknown): Prisma.InputJsonValue => {
  if (value === undefined) {
    return JSON.parse("null") as Prisma.InputJsonValue;
  }

  return JSON.parse(stringifySafe(value)) as Prisma.InputJsonValue;
};

const modelFieldsMap = new Map<string, Set<string>>(
  Prisma.dmmf.datamodel.models.map((m) => [m.name, new Set(m.fields.map((f) => f.name))])
);

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async create({ model, operation, args, query }) {
        const ctx = getAuditContext();
        const effectiveDate = ctx?.mockedDate ?? getSystemDateOverride();
        if (effectiveDate && args.data && typeof args.data === 'object') {
          const modelFields = model ? modelFieldsMap.get(model) : undefined;
          const d = args.data as Record<string, unknown>;
          if (modelFields?.has('createdAt') && d.createdAt === undefined) {
            d.createdAt = effectiveDate;
          }
          if (modelFields?.has('updatedAt') && d.updatedAt === undefined) {
            d.updatedAt = effectiveDate;
          }
        }
        return query(args);
      },
      async createMany({ model, operation, args, query }) {
        const ctx = getAuditContext();
        const effectiveDate = ctx?.mockedDate ?? getSystemDateOverride();
        if (effectiveDate && args.data) {
          const modelFields = model ? modelFieldsMap.get(model) : undefined;
          const items = Array.isArray(args.data) ? args.data : [args.data];
          for (const item of items) {
            if (item && typeof item === 'object') {
              const d = item as Record<string, unknown>;
              if (modelFields?.has('createdAt') && d.createdAt === undefined) {
                d.createdAt = effectiveDate;
              }
              if (modelFields?.has('updatedAt') && d.updatedAt === undefined) {
                d.updatedAt = effectiveDate;
              }
            }
          }
        }
        return query(args);
      },
      async update({ model, operation, args, query }) {
        const ctx = getAuditContext();
        const effectiveDate = ctx?.mockedDate ?? getSystemDateOverride();
        if (effectiveDate && args.data && typeof args.data === 'object') {
          const modelFields = model ? modelFieldsMap.get(model) : undefined;
          const d = args.data as Record<string, unknown>;
          if (modelFields?.has('updatedAt') && d.updatedAt === undefined) {
            d.updatedAt = effectiveDate;
          }
        }

        if (model === 'AuditLog') return query(args);
        if (!ctx || ctx.suppressAutomaticAudit) return query(args);

        const oldRecord = await getDynamicModelClient(model).findUnique({
          where: args.where,
        });

        const newRecord = await query(args);
        const oldRecObj = asRecord(oldRecord);
        const newRecObj = asRecord(newRecord);

        if (oldRecObj && newRecObj) {
            const oldData: Record<string, Prisma.InputJsonValue> = {};
            const newData: Record<string, Prisma.InputJsonValue> = {};
            let hasChanges = false;

            for (const key of Object.keys(newRecObj)) {
              const oldVal = oldRecObj[key];
              const newVal = newRecObj[key];
              
              const oldStr = oldVal instanceof Date ? oldVal.toISOString() : stringifySafe(oldVal);
              const newStr = newVal instanceof Date ? newVal.toISOString() : stringifySafe(newVal);

              if (oldStr !== newStr) {
                 const humanKey = formatAuditField(key);
                 oldData[humanKey] = toJsonValue(oldVal);
                 newData[humanKey] = toJsonValue(newVal);
                 hasChanges = true;
              }
            }

            if (hasChanges) {
                const changedFields = Object.keys(newData);
                const descFields = changedFields.length > 3 
                    ? `${changedFields.slice(0, 3).join(", ")} and ${changedFields.length - 3} other(s)` 
                    : changedFields.join(", ");
                const fieldWord = changedFields.length === 1 ? "field" : "fields";
                const recordId = newRecObj.id ? Number(newRecObj.id) : null;
                await basePrisma.auditLog.create({
                    data: {
                        actionType: `UPDATED_${model.toUpperCase()}`,
                        description: `Modified ${changedFields.length} ${fieldWord}: ${descFields}`,
                        subjectType: model,
                        recordId,
                        userId: ctx.userId ?? null,
                        ipAddress: ctx.ipAddress ?? "0.0.0.0",
                        userAgent: ctx.userAgent,
                        createdAt: effectiveDate ?? new Date(),
                        metadata: {
                           previousData: oldData,
                           newData: newData
                        }
                    }
                });
            }
        }
        return newRecord;
      },
      async delete({ model, operation, args, query }) {
        if (model === 'AuditLog') return query(args);

        const ctx = getAuditContext();
        const effectiveDate = ctx?.mockedDate ?? getSystemDateOverride();
        if (!ctx || ctx.suppressAutomaticAudit) return query(args);

        const oldRecord = await getDynamicModelClient(model).findUnique({
          where: args.where,
        });

        const result = await query(args);
        const oldRecObj = asRecord(oldRecord);

        if (oldRecObj) {
            const recordId = oldRecObj.id ? Number(oldRecObj.id) : null;
            const oldData: Record<string, Prisma.InputJsonValue> = {};
            for (const key of Object.keys(oldRecObj)) {
                oldData[formatAuditField(key)] = toJsonValue(oldRecObj[key]);
            }

            await basePrisma.auditLog.create({
                data: {
                    actionType: `DELETED_${model.toUpperCase()}`,
                    description: `Deleted ${model}`,
                    subjectType: model,
                    recordId,
                    userId: ctx.userId ?? null,
                    ipAddress: ctx.ipAddress ?? "0.0.0.0",
                    userAgent: ctx.userAgent,
                    createdAt: effectiveDate ?? new Date(),
                    metadata: {
                       previousData: oldData,
                       newData: null
                    }
                }
            });
        }
        return result;
      },
      async updateMany({ model, operation, args, query }) {
        const ctx = getAuditContext();
        const effectiveDate = ctx?.mockedDate ?? getSystemDateOverride();
        if (effectiveDate && args.data && typeof args.data === 'object') {
          const modelFields = model ? modelFieldsMap.get(model) : undefined;
          const d = args.data as Record<string, unknown>;
          if (modelFields?.has('updatedAt') && d.updatedAt === undefined) {
            d.updatedAt = effectiveDate;
          }
        }
        return query(args);
      },
      async upsert({ model, operation, args, query }) {
        const ctx = getAuditContext();
        const effectiveDate = ctx?.mockedDate ?? getSystemDateOverride();
        if (effectiveDate) {
          const modelFields = model ? modelFieldsMap.get(model) : undefined;
          if (args.create && typeof args.create === 'object') {
            const d = args.create as Record<string, unknown>;
            if (modelFields?.has('createdAt') && d.createdAt === undefined) {
              d.createdAt = effectiveDate;
            }
            if (modelFields?.has('updatedAt') && d.updatedAt === undefined) {
              d.updatedAt = effectiveDate;
            }
          }
          if (args.update && typeof args.update === 'object') {
            const d = args.update as Record<string, unknown>;
            if (modelFields?.has('updatedAt') && d.updatedAt === undefined) {
              d.updatedAt = effectiveDate;
            }
          }
        }
        return query(args);
      }
    }
  }
});

let prismaDisconnected = false;

export async function disconnectPrisma(): Promise<void> {
  if (prismaDisconnected) return;
  prismaDisconnected = true;
  await basePrisma.$disconnect();
  await pool.end();
}
