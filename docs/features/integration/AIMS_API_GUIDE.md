# AIMS API Guide (Fetch from EnrollPro)

This guide shows how AIMS can fetch learner context from EnrollPro.

It also shows how to fetch sample learner data for testing.

## What AIMS Should Fetch

AIMS should fetch these feeds:

1. Default feed (public main source):

- `GET /api/integration/v1/default/aims/context`

2. Keyless sample feed (testing source):

- `GET /api/integration/v1/sample/students`

## API-First Rule for AIMS Startup

AIMS must not start learner sync until EnrollPro API is healthy.

Even if teammate starts AIMS using:

- `pnpm dev`
- `npm run dev`
- `npm run serve`

AIMS should run health checks first, then fetch.

See [Subsystem API Quick Start](./SUBSYSTEM_API_QUICK_START.md) for shared startup flow.

## Connection Model (Host and Team)

- Host machine only: Node connects to PostgreSQL at `localhost:5432`.
- Team machines: fetch API from host at `http://100.120.169.123:5000`.

API endpoint bases for this system:

- Main API base: `http://100.120.169.123:5000/api`
- Integration API base: `http://100.120.169.123:5000/api/integration/v1`

## 1. Environment Values

```env
ENROLLPRO_BASE_URL="http://100.120.169.123:5000"
ENROLLPRO_API_BASE_URL="http://100.120.169.123:5000/api"
ENROLLPRO_INTEGRATION_BASE_URL="http://100.120.169.123:5000/api/integration/v1"
```

## 2. Health Checks Before Fetch

### Public health

```bash
curl http://100.120.169.123:5000/api/health
```

### Integration health

```bash
curl http://100.120.169.123:5000/api/integration/v1/health
```

## 3. Fetch AIMS Default Feed

```bash
curl http://100.120.169.123:5000/api/integration/v1/default/aims/context
```

Optional school year override:

```bash
curl "http://100.120.169.123:5000/api/integration/v1/default/aims/context?schoolYearId=12"
```

If `schoolYearId` is not provided, EnrollPro uses active school year.

## 4. Fetch Sample Students Feed (No Key)

```bash
curl http://100.120.169.123:5000/api/integration/v1/sample/students
```

Use sample feed for:

- local testing
- model pipeline dry run
- integration demo

## 5. Minimal Field Mapping for AIMS

Map these fields into AIMS learner context records:

- `enrollmentApplicationId` -> `sourceEnrollmentId`
- `learner.externalId` -> `learnerExternalId`
- `learner.lrn` -> `learnerLrn`
- `learner.fullName` -> `learnerName`
- `applicantType` -> `intakeType`
- `learnerType` -> `learnerType`
- `learningModalities` -> `modalities`
- `context.gradeLevel.name` -> `gradeName`
- `context.section.name` -> `sectionName`
- `context.schoolYear.yearLabel` -> `schoolYearLabel`

Meta fields to keep for logging:

- `meta.sourceSystem`
- `meta.generatedAt`
- `meta.scopeSchoolYearId`
- `meta.totalRows`

## 6. Simple JS Fetch Example

```js
async function fetchAimsContext() {
  const integrationBase =
    process.env.ENROLLPRO_INTEGRATION_BASE_URL ||
    "http://100.120.169.123:5000/api/integration/v1";

  const defaultRes = await fetch(`${integrationBase}/default/aims/context`);

  if (defaultRes.ok) {
    return defaultRes.json();
  }

  // Optional testing fallback
  const sampleRes = await fetch(`${integrationBase}/sample/students`);
  if (!sampleRes.ok) {
    throw new Error("Both default and sample AIMS feeds failed");
  }

  return sampleRes.json();
}
```

## 7. Suggested Sync Flow in AIMS

1. Wait for API health checks.
2. Pull default context feed.
3. Validate learner identity fields.
4. Upsert context records into AIMS store.
5. Save sync metadata (`generatedAt`, school year, total rows).
6. Use sample feed in test mode only.

## 8. Common Errors

- `503`: Service degraded.

## 9. Done Checklist

- AIMS can pass both health checks.
- AIMS can fetch default context feed.
- AIMS can fetch sample students feed.
- AIMS waits for API readiness before first sync.
