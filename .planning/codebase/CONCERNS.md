# Codebase Concerns

**Analysis Date:** 2026-03-18

## Tech Debt

**Fat Controllers:**
- Issue: Business logic is heavily concentrated in controller files rather than being abstracted into services or domain models.
- Files: `server/src/controllers/applicationController.ts`, `server/src/controllers/academicYearController.ts`
- Impact: Difficult to test, maintain, and reuse logic across different entry points (e.g., CLI tools or background jobs).
- Fix approach: Refactor business logic into dedicated service classes in `server/src/services/`.

**JSON Fields for Core Data:**
- Issue: Extensive use of `Json` types in Prisma for structured data like addresses and parent information.
- Files: `server/prisma/schema.prisma` (Applicant model)
- Impact: Lack of database-level schema enforcement and difficulty in performing complex queries or aggregations on these fields.
- Fix approach: Normalize these fields into separate tables or use strict Zod validation at the application layer to ensure consistency.

**Incomplete Email Implementation:**
- Issue: Email logging exists but the actual sending mechanism is missing.
- Files: `server/src/controllers/adminEmailLogController.ts` (L103: `// TODO: Actually send the email via mailer service`)
- Impact: System cannot notify applicants of status changes despite having the UI and database structure for it.
- Fix approach: Implement a `MailerService` using `nodemailer` (already in package.json) and integrate it with the `EmailLog` workflow.

## Known Bugs

**Frontend Placeholder Actions:**
- Symptoms: Clicking "View full details" in the application list does nothing.
- Files: `client/src/pages/applications/Index.tsx` (L367)
- Trigger: Clicking the ghost button in the applications table.
- Workaround: None, feature is currently a stub.

## Security Considerations

**JWT Secret Handling:**
- Risk: Hardcoded fallback or lack of validation for `JWT_SECRET`.
- Files: `server/src/middleware/authenticate.ts`
- Current mitigation: Uses `process.env.JWT_SECRET!`.
- Recommendations: Ensure strict check on startup that `JWT_SECRET` is defined and has sufficient entropy.

**Public Submission Rate Limiting:**
- Risk: While rate-limiting is present, 15 submissions per 15 minutes might still allow for significant spam if not paired with CAPTCHA.
- Files: `server/src/routes/application.routes.ts`
- Current mitigation: `express-rate-limit` configured.
- Recommendations: Consider adding Turnstile or reCAPTCHA for the public enrollment form.

## Performance Bottlenecks

**Recursive String Processing:**
- Problem: `toUpperCaseRecursive` is called on large application objects during submission.
- Files: `server/src/controllers/applicationController.ts`
- Cause: Deep traversal of complex objects.
- Improvement path: Optimize by only targeting specific fields that require normalization.

## Fragile Areas

**Academic Year Transitions:**
- Files: `server/src/controllers/academicYearController.ts`, `server/src/services/enrollmentGateService.ts`
- Why fragile: Logic for "active" academic year and enrollment gates depends on multiple date checks and manual overrides.
- Safe modification: Add comprehensive unit tests for `isEnrollmentOpen` logic.
- Test coverage: Minimal.

## Test Coverage Gaps

**Application Lifecycle:**
- What's not tested: Complex state transitions in the application workflow (SUBMITTED -> UNDER_REVIEW -> ... -> ENROLLED).
- Files: `server/src/controllers/applicationController.ts`
- Risk: Regression in enrollment logic could block students from registering or allow invalid status jumps.
- Priority: High

**Authentication & Authorization:**
- What's not tested: Role-based access control (RBAC) across various administrative routes.
- Files: `server/src/middleware/authorize.ts`, `server/src/routes/*.routes.ts`
- Risk: Unauthorized users might access sensitive student data.
- Priority: High

---

*Concerns audit: 2026-03-18*
