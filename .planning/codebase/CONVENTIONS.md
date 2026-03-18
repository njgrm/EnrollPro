# Coding Conventions

**Analysis Date:** 2026-03-18

## Naming Patterns
- **Files:** PascalCase for React components (`AdmissionForm.tsx`), camelCase for hooks (`useApiToast.ts`) and utilities (`utils.ts`).
- **Functions:** camelCase for helper functions and hooks.
- **Variables:** camelCase.
- **Types:** PascalCase for interfaces and types (`AdmissionFormData`).

## Code Style
- **Formatting:** Prettier/ESLint (configured in `client/eslint.config.js`).
- **Linting:** ESLint with TypeScript and React hooks plugins.

## Import Organization
- **Order:** External libraries, internal components/hooks (using `@/` alias), local relative imports.
- **Path Aliases:** `@/` points to `src/` in the client.

## Error Handling
- **Client:** React Hook Form validation using Zod schemas (`client/src/pages/apply/types.ts`). Global toast notifications via `useApiToast.ts`.
- **Server:** Try/catch in controllers (observed in `authController.ts`), returning JSON error messages.

## Logging
- **Framework:** Custom audit logger (`server/src/services/auditLogger.ts`).
- **Patterns:** Critical actions (login, registration) are logged to the database.
