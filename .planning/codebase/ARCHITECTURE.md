# Architecture

**Analysis Date:** 2026-03-12

## Pattern Overview

**Overall:** Monorepo SPA (Single Page Application) with a RESTful Backend.

**Key Characteristics:**
- **Layered Architecture:** Clear separation between presentation (client) and business logic/data persistence (server).
- **Type-Safe Development:** Shared types or synchronized TypeScript definitions across frontend and backend (via Prisma and Zod).
- **Component-Driven UI:** Modular UI building blocks using Radix UI and Tailwind CSS.

## Layers

**Presentation Layer (Frontend):**
- Purpose: Provides the user interface and handles client-side state and navigation.
- Location: `client/src`
- Contains: React components, hooks, stores, and API clients.
- Depends on: External libraries (React, Zustand, Axios, Tailwind).
- Used by: End users (Registrars, Teachers, System Admins, Applicants).

**API Routing Layer (Backend):**
- Purpose: Defines HTTP endpoints and applies cross-cutting concerns like auth and validation.
- Location: `server/src/routes`
- Contains: Express router definitions and middleware assignments.
- Depends on: Controllers and Middleware.
- Used by: Presentation layer via HTTP/JSON.

**Business Logic Layer (Backend):**
- Purpose: Implements application-specific rules and orchestrates data operations.
- Location: `server/src/controllers` and `server/src/services`
- Contains: Request handlers (Controllers) and business logic modules (Services).
- Depends on: Prisma Client (Data Layer) and Utility libraries.
- Used by: API Routing layer.

**Data Access Layer (Backend):**
- Purpose: Handles database communication and schema management.
- Location: `server/src/lib/prisma.ts` and `server/prisma/`
- Contains: Prisma client instance, database schema, and migrations.
- Depends on: PostgreSQL (external database).
- Used by: Business Logic layer.

## Data Flow

**Standard API Request:**
1. User interacts with a React component in `client/src/pages/`.
2. Component calls a Zustand store or an Axios instance in `client/src/api/`.
3. Axios sends an HTTP request to the backend with a JWT token in the `Authorization` header.
4. Express Router in `server/src/routes/` receives the request.
5. Middleware in `server/src/middleware/` validates the token (authenticate) and the request body (validate with Zod).
6. Controller in `server/src/controllers/` processes the request, potentially calling a Service in `server/src/services/`.
7. Service/Controller interacts with the database via Prisma in `server/src/lib/prisma.ts`.
8. Controller returns a JSON response to the client.
9. Frontend updates local state (Zustand) or UI directly.

**State Management:**
- **Client-Side:** Managed using Zustand (`client/src/stores/`). Persistent state (like auth tokens) is stored in `localStorage` via Zustand's `persist` middleware.
- **Server-Side:** Stateless API using JWT for session management. Persistent data resides in a PostgreSQL database.

## Key Abstractions

**Prisma Client:**
- Purpose: Type-safe ORM for database operations.
- Examples: `server/src/lib/prisma.ts`
- Pattern: Repository/Data Access Object (DAO).

**Zod Schemas:**
- Purpose: Runtime type validation and TypeScript type inference for API requests.
- Examples: `server/src/validators/auth.validator.ts`
- Pattern: Data Transfer Object (DTO) validation.

**Zustand Stores:**
- Purpose: Global state management for the frontend.
- Examples: `client/src/stores/authStore.ts`
- Pattern: Flux-like state management.

## Entry Points

**Frontend Entry:**
- Location: `client/src/main.tsx`
- Triggers: Browser page load.
- Responsibilities: Initializes React, mounts the application, and sets up routing.

**Backend Entry:**
- Location: `server/src/server.ts`
- Triggers: Process startup (Node.js).
- Responsibilities: Bootstraps the Express application and listens on a specified port.

**Backend App Setup:**
- Location: `server/src/app.ts`
- Triggers: Imported by `server.ts`.
- Responsibilities: Configures Express middleware (CORS, Helmet, JSON) and registers all API routes.

## Error Handling

**Strategy:** Centralized error handling on the backend and interceptor-based handling on the frontend.

**Patterns:**
- **Backend Middleware:** `server/src/middleware/errorHandler.ts` catches all unhandled errors and returns a consistent JSON response.
- **Axios Interceptors:** `client/src/api/axiosInstance.ts` handles 401 Unauthorized errors globally by clearing auth state and redirecting to login.

## Cross-Cutting Concerns

**Logging:** Custom audit logging stored in the database via `server/src/services/auditLogger.ts`.
**Validation:** Request body and param validation using Zod schemas and a generic `validate` middleware in `server/src/middleware/validate.ts`.
**Authentication:** JWT-based authentication via `server/src/middleware/authenticate.ts`.
**Authorization:** Role-based access control (RBAC) via `server/src/middleware/authorize.ts`.

---

*Architecture analysis: 2026-03-12*
