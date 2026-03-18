# Testing Patterns

**Analysis Date:** 2026-03-18

## Test Framework
- **Runner:** Manual execution via `tsx` (e.g., `tsx server/src/tests/academicYear.test.ts`). No formal framework like Vitest/Jest detected in `package.json`.
- **Assertion Library:** Native `console.assert`.

## Test File Organization
- **Location:** `server/src/tests/`.
- **Naming:** `*.test.ts`.

## Test Structure
- **Suite Organization:** Grouped by `console.log` headers with manual assertion blocks.
- **Mocking:** Manual mock objects (e.g., `createMockAcademicYear` in `academicYear.test.ts`).

## Test Types
- **Unit/Logic Tests:** Focused on complex business logic like date computations and enrollment gates.
