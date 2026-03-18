# External Integrations

**Analysis Date:** 2026-03-18

## APIs & External Services
- **Email Service:** Nodemailer (configured in `server/package.json`, managed via `EmailLog` model in Prisma).
- **API Interaction:** Axios instance at `client/src/api/axiosInstance.ts` targeting `VITE_API_URL`.

## Data Storage
- **Database:** PostgreSQL (Connection via `DATABASE_URL` env var).
- **Client:** Prisma ORM (`server/prisma/schema.prisma`).
- **File Storage:** Local filesystem using Multer (`server/package.json`).

## Authentication
- **Provider:** Custom JWT-based implementation.
- **Storage:** Tokens handled in `client/src/stores/authStore.ts` and attached via Axios interceptors.

## Logging
- **Audit Logs:** Database-driven audit logging (`server/src/services/auditLogger.ts`).
