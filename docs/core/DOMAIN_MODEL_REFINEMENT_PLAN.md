# Domain Model Refinement Plan (Prisma + DepEd Workflow Alignment)

Last updated: 2026-04-14

## 1. Goal

Refine existing data model while preserving current runtime behavior and minimizing migration risk.

Primary alignment targets:

- DepEd hybrid workflows (online + F2F)
- school-year scoped operations
- registrar-heavy processing with strict auditability
- future readiness for sectioning automation and role expansion

## 2. Current model strengths

Source: [server/prisma/schema.prisma](../../server/prisma/schema.prisma)

1. Strong per-school-year relationships for Applicant, Enrollment, GradeLevel, and ScpProgramConfig.
2. Explicit health records model with period uniqueness.
3. Separate DO 017 model lane (EarlyRegistrant, EarlyRegistration).
4. Detailed checklist and document entities tied to applicant lifecycle.

## 3. Current model limitations

1. Role enum is narrower than some route guard behavior (TEACHER appears in guards but not enum).
2. Applicant lifecycle and early-registration lifecycle are separate with limited bridge metadata.
3. No first-class learner identity table for cross-year LRN continuity analytics.
4. No explicit compliance-deadline column for temporary enrollment follow-up.
5. No explicit workflow event table beyond audit logs for status history snapshots.

## 4. Proposed incremental schema enhancements

## 4.1 Role alignment enhancement (safe optional)

```prisma
enum Role {
  REGISTRAR
  SYSTEM_ADMIN
  TEACHER

  @@map("user_role")
}
```

Rollout guidance:

1. add enum value in migration,
2. update admin-user validation schema,
3. update auth payload typing,
4. gate TEACHER write actions behind explicit route policy.

## 4.2 Learner identity spine (optional but high-value)

```prisma
model LearnerIdentity {
  id          Int      @id @default(autoincrement())
  lrn         String   @unique(map: "uq_learner_identities_lrn") @db.VarChar(12)
  firstSeenAt DateTime @default(now()) @db.Timestamptz @map("first_seen_at")
  lastSeenAt  DateTime @default(now()) @db.Timestamptz @map("last_seen_at")

  applicants  Applicant[]

  @@map("learner_identities")
}
```

Add optional foreign key to Applicant:

```prisma
model Applicant {
  // existing fields...
  learnerIdentityId Int?             @map("learner_identity_id")
  learnerIdentity   LearnerIdentity? @relation(fields: [learnerIdentityId], references: [id])

  @@index([learnerIdentityId], name: "idx_applicants_learner_identity_id")
}
```

## 4.3 Temporary enrollment compliance tracking

```prisma
model Applicant {
  // existing fields...
  documentaryDeadlineAt DateTime? @db.Date @map("documentary_deadline_at")
  complianceStatus      String?   @map("compliance_status") // PENDING | COMPLIED | OVERDUE
}
```

## 4.4 Optional status event ledger

```prisma
model ApplicantStatusEvent {
  id          Int      @id @default(autoincrement())
  applicantId Int      @map("applicant_id")
  fromStatus  String?  @map("from_status")
  toStatus    String   @map("to_status")
  reason      String?
  actorUserId Int?     @map("actor_user_id")
  createdAt   DateTime @default(now()) @db.Timestamptz @map("created_at")

  applicant   Applicant @relation(fields: [applicantId], references: [id], onDelete: Cascade)

  @@index([applicantId, createdAt], name: "idx_app_status_events_applicant_created")
  @@map("applicant_status_events")
}
```

## 5. Relationship adjustments (non-breaking)

1. Keep Applicant as operational workflow entity.
2. Keep EarlyRegistration as pre-admission intake entity.
3. Add optional linking metadata between EarlyRegistration and Applicant where created from early-reg conversion.

## 6. DepEd workflow mapping after refinement

| Workflow need                            | Current support          | Refinement                                            |
| ---------------------------------------- | ------------------------ | ----------------------------------------------------- |
| Hybrid intake online/F2F                 | Yes                      | Keep current channels and add clearer bridge metadata |
| Temporary enrollment deadline monitoring | Partial flag only        | Add documentaryDeadlineAt and complianceStatus        |
| Cross-year learner continuity by LRN     | Partial (indexed LRN)    | Add LearnerIdentity spine                             |
| Role-specific teacher access             | Partial (runtime guards) | Add TEACHER enum and capability policy docs           |
| Status history auditing                  | Audit logs only          | Add status event ledger (optional)                    |

## 7. Migration strategy

1. Migration 1: add role enum value and optional new tables/columns as nullable.
2. Migration 2: backfill documentary deadlines for existing TEMPORARILY_ENROLLED records.
3. Migration 3: backfill LearnerIdentity from existing applicant LRN values.
4. Migration 4: application-layer adoption (read/write paths).
5. Migration 5: enforce stronger constraints only after data quality checks.

## 8. Validation alignment tasks

After schema refinement, update:

- shared/src/constants/index.ts enums
- shared/src/schemas/\*.schema.ts role/status constraints
- route authorize allow-lists
- frontend role checks and protected route logic
