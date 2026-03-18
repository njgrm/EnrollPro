# Codebase Structure

**Analysis Date:** 2026-03-18

## Directory Layout

```
enrollpro/
├── client/             # Frontend React application
│   ├── src/            # Source code
│   │   ├── api/        # Axios instances and API services
│   │   ├── components/ # Shared UI components (Radix UI)
│   │   ├── hooks/      # Custom React hooks
│   │   ├── layouts/    # Page layout wrappers
│   │   ├── lib/        # Shared utilities
│   │   ├── pages/      # Route-level components
│   │   ├── router/     # React Router configuration
│   │   └── stores/     # Zustand state management
│   └── public/         # Static assets
├── server/             # Backend Express application
│   ├── prisma/         # Database schema and migrations
│   ├── src/            # Source code
│   │   ├── controllers/# Request handlers
│   │   ├── lib/        # Core library instances (Prisma)
│   │   ├── middleware/ # Express middleware (auth, validation)
│   │   ├── routes/     # API endpoint definitions
│   │   ├── services/   # Business logic and external services
│   │   ├── tests/      # Backend tests
│   │   └── validators/ # Zod validation schemas
│   └── uploads/        # File upload storage
└── docs/               # Project documentation and specifications
```

## Directory Purposes

**client/src/pages:**
- Purpose: Contains the main views of the application organized by feature.
- Key files: `client/src/pages/apply/Index.tsx`, `client/src/pages/dashboard/Index.tsx`

**server/src/controllers:**
- Purpose: Logic for handling incoming requests and returning responses.
- Key files: `server/src/controllers/authController.ts`, `server/src/controllers/applicationController.ts`

**server/src/routes:**
- Purpose: Maps URL paths to controller methods.
- Key files: `server/src/routes/auth.routes.ts`, `server/src/app.ts`

## Key File Locations

**Entry Points:**
- `client/src/main.tsx`: Frontend React entry point.
- `server/src/server.ts`: Backend server startup.

**Configuration:**
- `server/prisma/schema.prisma`: Database schema definition.
- `client/vite.config.ts`: Vite build configuration.

## Naming Conventions

**Files:**
- React Components: PascalCase (`AppLayout.tsx`)
- Logic/Utilities: camelCase (`axiosInstance.ts`)
- Routes/Validators: kebab-case/dot-notation (`auth.routes.ts`, `auth.validator.ts`)

## Where to Add New Code

**New Feature:**
- Frontend Page: `client/src/pages/[feature]/`
- Backend Controller: `server/src/controllers/[feature]Controller.ts`
- Backend Route: `server/src/routes/[feature].routes.ts`

**New Component:**
- UI Library: `client/src/components/ui/`
- Shared Component: `client/src/components/`

**Utilities:**
- Client side: `client/src/lib/`
- Server side: `server/src/lib/` or `server/src/services/`
