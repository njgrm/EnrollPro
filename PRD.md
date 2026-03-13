# Product Requirements Document (PRD)

**Project Name:** Web-Based Admission Portal and Enrollment Information Management System
**Beneficiary:** Hinigaran National High School
**Document Version:** 2.2.0
**Status:** Ready for Implementation
**Target Actor:** Claude Code (AI Full-Stack Developer)
**Stack:** PERN (PostgreSQL · Express · React · Node.js)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack & Architecture](#2-technology-stack--architecture)
3. [Design System & Visual Identity](#3-design-system--visual-identity)
   - 3.1 [Typography](#31-typography)
   - 3.2 [Dynamic Color Scheme System](#32-dynamic-color-scheme-system)
   - 3.3 [Visual Design Principles](#33-visual-design-principles)
   - 3.4 [Responsive Design Requirements](#34-responsive-design-requirements)
   - 3.5 [Toast Notifications — Sileo](#35-toast-notifications--sileo)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [Database Schema — Prisma](#5-database-schema--prisma)
6. [Core Modules](#6-core-modules)
   - 6.1 [Online Admission Portal](#61-online-admission-portal)
   - 6.2 [Registrar Administration Dashboard](#62-registrar-administration-dashboard)
   - 6.3 [Enrollment Management & Section Setting](#63-enrollment-management--section-setting)
   - 6.4 [Academic Year Configuration](#64-academic-year-configuration)
   - 6.5 [Student Record Search & Filtering](#65-student-record-search--filtering)
   - 6.6 [System Audit Trail & Activity Logging](#66-system-audit-trail--activity-logging)
   - 6.7 [Automated Email Notification System](#67-automated-email-notification-system)
7. [REST API Contracts](#7-rest-api-contracts)
8. [Frontend Routing Structure](#8-frontend-routing-structure)
9. [Security Requirements](#9-security-requirements)
10. [Out-of-Scope Limitations](#10-out-of-scope-limitations)
11. [Acceptance Criteria](#11-acceptance-criteria)

---

## 1. Project Overview

Hinigaran National High School requires a centralized digital platform to replace its paper-based student admission and enrollment workflows. This system provides:

- A **public-facing admission portal** for incoming students to register their demographic profiles online.
- A **secure registrar dashboard** for administrators to review applications, assign sections, manage configurations, and monitor enrollment capacity.
- An **automated communication layer** to notify applicants of their status without manual intervention.

**Primary Goal:** Eliminate administrative bottlenecks, reduce data entry errors, enforce section capacity limits, and provide real-time enrollment analytics.

---

## 2. Technology Stack & Architecture

> **Instruction for Claude Code:** All technology choices below are non-negotiable. Do not substitute or introduce alternative frameworks. This is a PERN stack project — PostgreSQL, Express, React, Node.js.

### Stack Overview

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Package Manager | pnpm | 10.x | Use exclusively — no npm or yarn. Monorepo managed with `pnpm-workspace.yaml` |
| Runtime | Node.js | 22 LTS | Minimum 22.12+ required by Vite 7; use ES modules (`"type": "module"`) |
| Backend Framework | Express.js | 5.1 | RESTful API server; now default on npm |
| ORM | Prisma | 6.x | Type-safe PostgreSQL access; all DB interactions through Prisma Client |
| Database | PostgreSQL | 18 | Hosted locally or via managed service (e.g., Supabase, Railway) |
| Frontend Framework | React | 19.x | Functional components only; no class components |
| Frontend Routing | React Router | v7 | SPA routing; `createBrowserRouter` API |
| UI Component Library | shadcn/ui | Latest | Built on Radix UI + Tailwind CSS v4 |
| Styling | Tailwind CSS | v4.x | Vite-native plugin (`@tailwindcss/vite`); no `tailwind.config.js` — config lives in CSS via `@theme` |
| Authentication | JWT | — | `jsonwebtoken` (BE) + Axios interceptors (FE) for token attachment |
| Form Validation (FE) | React Hook Form + Zod | Latest | All forms must use this combination |
| Input Validation (BE) | Zod | Latest | Validate all request bodies in Express middleware before reaching controllers |
| HTTP Client (FE) | Axios | Latest | All API calls from React; centralized instance with JWT interceptor |
| Toast Notifications | Sileo | Latest | Gooey spring-physics toasts; replaces all `alert()` and inline error banners |
| Email | Nodemailer + Resend SMTP | Latest | Async via `setImmediate()`; never blocks HTTP response |
| Build Tool (FE) | Vite | 7.x | Requires Node.js 22.12+ |
| File Upload | Multer | Latest | Express middleware for logo/image uploads |
| Color Extraction | color-thief-node | Latest | Server-side dominant accent color extraction from uploaded logos |

### Repository Structure

```
/
├── pnpm-workspace.yaml            # Declares server/ and client/ as workspace packages
├── server/                        # Express backend
│   ├── prisma/
│   │   ├── schema.prisma          # Single source of truth for DB schema
│   │   └── migrations/            # Auto-generated by prisma migrate
│   ├── src/
│   │   ├── controllers/           # Route handler logic
│   │   ├── middleware/            # auth, validation, error handler, audit
│   │   ├── routes/                # Express routers grouped by domain
│   │   ├── services/              # Business logic (enrollment, email, color)
│   │   ├── validators/            # Zod schemas for request validation
│   │   └── app.ts                 # Express app setup
│   └── server.ts                  # Entry point
│
└── client/                        # React + Vite frontend (TypeScript)
    ├── src/
    │   ├── api/                   # Axios instance + API call functions
    │   ├── components/            # Shared UI components (.tsx)
    │   ├── hooks/                 # Custom React hooks (.ts)
    │   ├── layouts/               # AppLayout.tsx, GuestLayout.tsx, AuthLayout.tsx
    │   ├── pages/                 # Route-level page components (.tsx)
    │   ├── router/                # React Router v7 config (index.tsx)
    │   └── stores/                # Zustand stores (.ts)
    ├── vite.config.ts
    ├── tsconfig.json
    └── index.html
```

### Architecture Pattern

```
[Browser — React SPA]
        ↕  HTTP / JSON  (Axios + JWT Bearer Token)
[Express.js REST API]
        ↕
[Prisma Client ORM]
        ↕
[PostgreSQL 18 Database]
```

The React frontend is a fully decoupled SPA served by Vite in development and a static file server (or CDN) in production. Express serves exclusively as a JSON REST API — it renders no HTML.

---

## 3. Design System & Visual Identity

> **Instruction for Claude Code:** This section defines the entire visual language of the application. Every UI component, layout, and interaction must comply with these specifications.

### 3.1 Typography

**Font Family:** `Instrument Sans` — loaded exclusively from Bunny Fonts (privacy-friendly Google Fonts alternative).

```html
<!-- client/index.html — inside <head> -->
<link rel="preconnect" href="https://fonts.bunny.net" />
<link
  href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700&display=swap"
  rel="stylesheet"
/>
```

**Tailwind v4 Setup** — no `tailwind.config.js`. Font and theme tokens are declared directly in CSS using the `@theme` directive.

```ts
// client/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

```css
/* client/src/index.css */
@import "tailwindcss";

@theme {
  --font-sans: 'Instrument Sans', ui-sans-serif, system-ui;
}
```

Apply `font-sans` as the base class on `<body>` globally. All text elements inherit this.

| Token | Usage | Tailwind Class |
|---|---|---|
| Display | Page titles, hero headings | `text-3xl font-bold` |
| Heading 1 | Section headings | `text-2xl font-semibold` |
| Heading 2 | Card titles, module labels | `text-xl font-semibold` |
| Body | Paragraphs, form labels | `text-sm font-normal` |
| Caption | Helper text, timestamps | `text-xs font-normal text-muted-foreground` |

---

### 3.2 Dynamic Color Scheme System

#### Design Intent

The application uses a **two-layer color model**:

| Layer | Role | Behavior |
|---|---|---|
| **Main (White)** | Page background, surfaces, cards, dialogs | **Permanent — never changes** |
| **Accent (Blue → Logo-derived)** | Buttons, active states, links, badges, focus rings, sidebar highlights | **Default blue; replaced by the dominant color extracted from the uploaded school logo** |

When an admin uploads a school logo, only the **accent color tokens** are updated to reflect the logo's dominant color. The white main layer, foreground text, borders, and muted surfaces are all preserved exactly as defined below.

---

#### Default Color Tokens

```css
/* client/src/index.css
   ─── PERMANENT MAIN LAYER — never overridden by logo extraction ─── */
:root {
  --background:            0 0% 100%;        /* White — page & card backgrounds */
  --foreground:            222 47% 11%;       /* Near-black — all body text */
  --muted:                 220 14% 96%;       /* Off-white — table rows, input bg */
  --muted-foreground:      215 16% 47%;       /* Mid-grey — placeholder, captions */
  --border:                220 13% 91%;       /* Light grey — dividers, input borders */
  --card:                  0 0% 100%;         /* White — card surface */
  --card-foreground:       222 47% 11%;
  --popover:               0 0% 100%;
  --popover-foreground:    222 47% 11%;

  /* ─── DEFAULT ACCENT LAYER — blue; replaced on logo upload ─── */
  --accent:                221 83% 53%;       /* #2563EB — Tailwind Blue-600 (default) */
  --accent-foreground:     0 0% 100%;         /* White text on accent bg */
  --accent-muted:          213 97% 94%;       /* Light blue tint for hover states */
  --accent-ring:           221 83% 53%;       /* Focus ring color */

  /* shadcn/ui semantic aliases — point to accent tokens */
  --primary:               var(--accent);
  --primary-foreground:    var(--accent-foreground);
  --ring:                  var(--accent-ring);
}
```

> **Instruction for Claude Code:** `--primary` and `--ring` are intentional aliases for `--accent`. All shadcn/ui components that use `bg-primary`, `text-primary`, `ring-primary` etc. will automatically reflect the correct accent color — both the default blue and any logo-extracted replacement — without any component-level changes.

---

#### Logo-Driven Accent Extraction — Implementation Spec

When an admin uploads a school logo, the server extracts the dominant **non-white, non-near-white** color and uses it to replace only the accent tokens.

**Step 1 — Server-Side Extraction (Node.js)**

```bash
# server/
pnpm add color-thief-node
```

```js
// server/src/services/logoColorService.ts
import ColorThief from 'color-thief-node';

/**
 * Extracts the dominant accent color from an uploaded logo.
 * Filters out near-white and near-black colors to ensure a
 * usable, saturated accent is always returned.
 *
 * @param {string} filePath - Absolute path to the uploaded image
 * @returns {string} HSL string, e.g. "221 83% 53%"
 */
export async function extractAccentColor(filePath) {
  const thief = new ColorThief();
  // Extract top 5 colors from the palette
  const palette = await thief.getPaletteFromURL(filePath, 5);

  // Filter out near-whites (lightness > 85%) and near-blacks (lightness < 15%)
  // to avoid setting white or black as the accent
  const usable = palette
    .map(rgbToHslObject)
    .filter(({ s, l }) => l >= 15 && l <= 85 && s >= 20);

  // Use the most dominant usable color; fall back to default blue if none found
  const chosen = usable[0] ?? { h: 221, s: 83, l: 53 };
  return `${chosen.h} ${chosen.s}% ${chosen.l}%`;
}

function rgbToHslObject([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}
```

**Step 2 — Persist Only the Accent HSL**

Store just the extracted accent value in `SchoolSettings.colorScheme`. The main/white layer is never stored because it never changes.

```json
{
  "accent_hsl": "27 95% 53%",
  "extracted_at": "2025-01-15T10:30:00Z"
}
```

**Step 3 — Serve via Public Settings API**

`GET /api/settings/public` (no auth required) returns `colorScheme` so React can apply the accent on first load.

**Step 4 — Apply Only Accent Tokens in React**

```tsx
// client/src/layouts/RootLayout.tsx
import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';

// Default blue accent — used when no logo has been uploaded
const DEFAULT_ACCENT_HSL     = '221 83% 53%';
const DEFAULT_ACCENT_MUTED   = '213 97% 94%';

export default function RootLayout({ children }) {
  const { colorScheme } = useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;
    const accent = colorScheme?.accent_hsl ?? DEFAULT_ACCENT_HSL;

    // Only the accent tokens are updated — the white main layer is untouched
    root.style.setProperty('--accent',           accent);
    root.style.setProperty('--accent-foreground','0 0% 100%');
    root.style.setProperty('--accent-ring',      accent);
    root.style.setProperty('--primary',          accent);
    root.style.setProperty('--primary-foreground','0 0% 100%');
    root.style.setProperty('--ring',             accent);

    // Derive a lightened muted tint from the accent (increase lightness to ~94%)
    // This keeps hover states and subtle tints on-brand
    const [h, s] = accent.split(' ');
    root.style.setProperty('--accent-muted', `${h} ${s} 94%`);
  }, [colorScheme]);

  return (
    <div className="min-h-screen bg-background font-sans">
      {children}
    </div>
  );
}
```

**What changes on logo upload vs. what stays fixed:**

| CSS Token | Default Value | After Logo Upload | Locked? |
|---|---|---|---|
| `--background` | `0 0% 100%` (white) | Unchanged | ✅ Always white |
| `--card` | `0 0% 100%` (white) | Unchanged | ✅ Always white |
| `--foreground` | `222 47% 11%` (near-black) | Unchanged | ✅ Always dark |
| `--border` | `220 13% 91%` (light grey) | Unchanged | ✅ Always grey |
| `--muted` | `220 14% 96%` (off-white) | Unchanged | ✅ Always off-white |
| `--accent` | `221 83% 53%` (blue) | Logo dominant color | 🎨 Changes |
| `--primary` | alias → `--accent` | Follows `--accent` | 🎨 Changes |
| `--ring` | alias → `--accent` | Follows `--accent` | 🎨 Changes |
| `--accent-muted` | `213 97% 94%` (light blue) | Derived tint of new accent | 🎨 Changes |

> **Fallback Rule:** If no logo has been uploaded, if the uploaded file fails extraction, or if all extracted colors are filtered out as near-white/near-black, the default blue accent (`221 83% 53%`) is applied. The white main layer is applied unconditionally at all times. Wrap extraction in a `try/catch` — failures must be silent to the end user and logged server-side only.

---

### 3.3 Visual Design Principles

The UI must be **professional, clean, and institutional** — suitable for a Philippine public high school administrative system.

| Principle | Implementation Requirement |
|---|---|
| **Minimal Chrome** | No decorative gradients; drop shadows only on cards/modals (`shadow-sm`) |
| **High Contrast** | All text must pass WCAG AA (4.5:1 ratio minimum) |
| **Consistent Spacing** | Tailwind spacing scale exclusively: `p-4`, `gap-6`, `space-y-4` etc. |
| **Fully Responsive** | Every page is functional at all screen sizes (≥320px). See §3.4. |
| **shadcn/ui Components** | Use `Card`, `Table`, `Dialog`, `Badge`, `Select`, `Input`, `Button`, `Switch`, `Tabs`. Do not build custom primitives. |
| **Sidebar Navigation** | Dashboard uses a collapsible left sidebar on desktop; collapses to a hamburger `Sheet` drawer on mobile/tablet |
| **Status Badges** | `Pending` → yellow, `Approved` → green, `Rejected` → red. Use `Badge` variant `"outline"` |
| **Empty States** | Every table/list must have a designed empty state (icon + message + optional CTA) |
| **Loading States** | Use `Skeleton` from shadcn/ui during API fetches and page transitions |
| **Toast Notifications** | All user feedback uses Sileo exclusively. Never use `alert()` or inline error banners. See §3.5. |

---

### 3.4 Responsive Design Requirements

> **Instruction for Claude Code:** Every page in the application — public and authenticated — must be fully responsive. No desktop-only layouts are acceptable.

#### Breakpoint Strategy

Use Tailwind responsive prefixes exclusively. No raw CSS media queries.

| Breakpoint | Prefix | Min Width | Target Devices |
|---|---|---|---|
| Mobile | _(default)_ | 320px | Phones (portrait & landscape) |
| Tablet | `md:` | 768px | Tablets, large phones |
| Desktop | `lg:` | 1024px | Laptops, desktops |
| Wide | `xl:` | 1280px | Large monitors |

#### Layout Adaptation Rules

**Public Admission Portal (`/apply`)**
- Mobile: Single-column, full-width form card with `px-4` padding. Compact step progress bar.
- Tablet: Centered card, `max-w-2xl`.
- Desktop: Centered card, `max-w-3xl`, two-column field grid for side-by-side inputs.

**Registrar Dashboard — Sidebar**
- Mobile + Tablet (`< lg`): Sidebar hidden; hamburger opens a full-height `Sheet` drawer from the left.
- Desktop (`lg+`): Sidebar always visible as a fixed left panel (`w-64`), collapsible to icon-only (`w-16`).

```tsx
<div className="flex min-h-screen">
  {/* Desktop sidebar */}
  <aside className="hidden lg:flex lg:w-64 lg:flex-col ...">
    <SidebarContent />
  </aside>
  {/* Mobile drawer */}
  <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
    <SheetContent side="left" className="w-64 p-0">
      <SidebarContent />
    </SheetContent>
  </Sheet>
  <main className="flex-1 overflow-auto">{children}</main>
</div>
```

**Dashboard Stat Cards:** `grid-cols-1` → `md:grid-cols-2` → `lg:grid-cols-4`

**Data Tables:** Horizontally scrollable on mobile inside `overflow-x-auto`. Hide lower-priority columns via `hidden md:table-cell`.

```tsx
<div className="w-full overflow-x-auto rounded-lg border">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>LRN</TableHead>
        <TableHead>Full Name</TableHead>
        <TableHead className="hidden md:table-cell">Grade Level</TableHead>
        <TableHead className="hidden lg:table-cell">Section</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="hidden md:table-cell">Date Applied</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
  </Table>
</div>
```

**Dialogs:** Mobile: `w-full mx-4`. Tablet+: `max-w-md` or `max-w-lg`.

**Charts:** Mobile: full container width, `min-h-[200px]`, legends below. Desktop: natural container width.

#### Responsive Testing Checklist (per page)

- [ ] 375px (iPhone SE)
- [ ] 768px (iPad)
- [ ] 1024px (small laptop)
- [ ] 1440px (standard desktop)

---

### 3.5 Toast Notifications — Sileo

> **Instruction for Claude Code:** All transient user feedback must use **Sileo** exclusively. Reference: https://sileo.aaryan.design/docs

#### Installation

```bash
# client/
pnpm add sileo
```

#### Global Setup

```tsx
// client/src/layouts/AppLayout.tsx
import { Toaster } from 'sileo';

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-background font-sans">
      <Toaster position="top-right" />
      {children}
    </div>
  );
}
```

```tsx
// client/src/layouts/GuestLayout.tsx
import { Toaster } from 'sileo';

export default function GuestLayout({ children }) {
  return (
    <div className="min-h-screen bg-muted/40 font-sans">
      <Toaster position="top-center" />
      {children}
    </div>
  );
}
```

#### Usage Patterns

```tsx
import { sileo } from 'sileo';

sileo.success({ title: 'Application Submitted', description: 'Your tracking number is HNS-2025-00042.' });
sileo.error({ title: 'Enrollment Failed', description: 'This section has reached maximum capacity.' });
sileo.warning({ title: 'Capacity Warning', description: 'Grade 7 - Rizal is at 95% capacity.' });
sileo.info({ title: 'Enrollment Closed', description: 'The admission period is not accepting applications.' });

// Action toast
sileo.success({
  title: 'Application Approved',
  description: 'Student assigned to Grade 7 - Rizal.',
  action: { label: 'View Record', onClick: () => navigate(`/applications/${id}`) },
});

// Promise toast (wraps async API calls)
sileo.promise(apiCall(), {
  loading: 'Submitting application...',
  success: 'Application submitted successfully!',
  error: 'Something went wrong. Please try again.',
});
```

#### Centralized API Error → Toast Hook

```tsx
// client/src/hooks/useApiToast.ts
import { sileo } from 'sileo';
import type { AxiosError } from 'axios';

export function toastApiError(error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) {
  const data = error.response?.data;
  if (data?.errors) {
    const first = Object.values(data.errors).flat()[0];
    sileo.error({ title: 'Validation Error', description: first });
  } else {
    sileo.error({ title: 'Error', description: data?.message ?? 'Something went wrong.' });
  }
}
```

Call `toastApiError(err)` inside every Axios `.catch()` block.

#### Mandatory Toast Events

| Event | Type | Title | Description |
|---|---|---|---|
| Application submitted | `success` | "Application Received" | "Your tracking number is `{tracking_number}`." |
| Application approved | `success` | "Application Approved" | "Student enrolled in `{section_name}`." |
| Application rejected | `info` | "Application Rejected" | "Status updated and notification sent." |
| Section created | `success` | "Section Created" | "`{name}` added to `{grade_level}`." |
| Section at capacity (blocked) | `error` | "Section Full" | "Please select a different section." |
| Settings saved | `success` | "Settings Saved" | "Your changes have been applied." |
| Logo uploaded + colors extracted | `success` | "Accent Color Updated" | "Interactive elements now reflect your logo's color." |
| Color extraction failure | `warning` | "Color Extraction Failed" | "Default blue accent applied instead." |
| Enrollment gate opened | `success` | "Enrollment Now Open" | "The admission portal is publicly accessible." |
| Enrollment gate closed | `info` | "Enrollment Closed" | "The admission portal has been disabled." |
| Backend validation error | `error` | "Validation Error" | First error message from API response. |
| Network / server 500 error | `error` | "Server Error" | "Something went wrong. Please try again." |

---

## 4. User Roles & Permissions

| Role | Access Level | Auth Mechanism |
|---|---|---|
| **Applicant (Guest)** | Public admission portal only | None — unauthenticated |
| **School Registrar** | Full API + dashboard access, all CRUD | JWT — role: `REGISTRAR` |
| **Advising Teacher** | Read-only: assigned sections + enrolled student lists | JWT — role: `TEACHER` |

### JWT Implementation

**Backend — Token Issuance**

```js
// server/src/controllers/authController.ts
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '8h' }
);
res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
```

**Backend — Auth & Authorization Middleware**

```js
// server/src/middleware/authenticate.ts
export function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
  try {
    req.user = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// server/src/middleware/authorize.ts
export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ message: 'Forbidden' });
  next();
};
```

Usage: `router.post('/enroll', authenticate, authorize('REGISTRAR'), enrollController.store)`

**Frontend — Axios Interceptor**

```ts
// client/src/api/axiosInstance.ts
import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

**Frontend — Auth Store (Zustand)**

```ts
// client/src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(persist(
  (set) => ({
    token: null,
    user: null,
    setAuth: (token, user) => set({ token, user }),
    clearAuth: () => set({ token: null, user: null }),
  }),
  { name: 'auth-storage' }
));
```

---

## 5. Database Schema — Prisma

> **Instruction for Claude Code:** Define the entire schema in `server/prisma/schema.prisma`. Run `npx prisma migrate dev` to apply. All database access must go through Prisma Client — never interpolate variables into raw SQL strings.

```prisma
// server/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ────────────────────────────────────────────────

enum Role {
  REGISTRAR
  TEACHER
}

enum Sex {
  MALE
  FEMALE
}

enum ApplicationStatus {
  PENDING
  APPROVED
  REJECTED
}

// ─── Models ───────────────────────────────────────────────

model User {
  id          Int          @id @default(autoincrement())
  name        String
  email       String       @unique
  password    String
  role        Role
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  sections    Section[]
  enrollments Enrollment[]
  auditLogs   AuditLog[]
}

model SchoolSettings {
  id                   Int           @id @default(autoincrement())
  schoolName           String        @default("Hinigaran National High School")
  logoPath             String?
  logoUrl              String?
  colorScheme          Json?         // { primary_hsl, secondary_hsl, extracted_at }
  enrollmentOpen       Boolean       @default(false)
  activeAcademicYearId Int?

  activeAcademicYear   AcademicYear? @relation(fields: [activeAcademicYearId], references: [id])
}

model AcademicYear {
  id             Int              @id @default(autoincrement())
  yearLabel      String           @unique  // e.g. "2025-2026"
  isActive       Boolean          @default(false)
  createdAt      DateTime         @default(now())

  gradeLevels    GradeLevel[]
  strands        Strand[]
  applicants     Applicant[]
  enrollments    Enrollment[]
  SchoolSettings SchoolSettings[]
}

model GradeLevel {
  id             Int          @id @default(autoincrement())
  name           String       // e.g. "Grade 7"
  displayOrder   Int
  academicYearId Int
  createdAt      DateTime     @default(now())

  academicYear   AcademicYear @relation(fields: [academicYearId], references: [id], onDelete: Cascade)
  sections       Section[]
  applicants     Applicant[]
}

model Strand {
  id                      Int          @id @default(autoincrement())
  name                    String       // e.g. "STEM", "ABM"
  applicableGradeLevelIds Int[]        // Array of GradeLevel IDs
  academicYearId          Int
  createdAt               DateTime     @default(now())

  academicYear            AcademicYear @relation(fields: [academicYearId], references: [id], onDelete: Cascade)
  applicants              Applicant[]
}

model Section {
  id                Int          @id @default(autoincrement())
  name              String       // e.g. "Rizal"
  maxCapacity       Int          @default(40)
  gradeLevelId      Int
  advisingTeacherId Int?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  gradeLevel        GradeLevel   @relation(fields: [gradeLevelId], references: [id], onDelete: Cascade)
  advisingTeacher   User?        @relation(fields: [advisingTeacherId], references: [id], onDelete: SetNull)
  enrollments       Enrollment[]
}

model Applicant {
  id                    Int               @id @default(autoincrement())
  lrn                   String            @unique @db.VarChar(12)
  lastName              String
  firstName             String
  middleName            String?
  suffix                String?
  birthDate             DateTime
  sex                   Sex
  address               String
  parentGuardianName    String
  parentGuardianContact String
  emailAddress          String
  trackingNumber        String            @unique
  status                ApplicationStatus @default(PENDING)
  rejectionReason       String?
  gradeLevelId          Int
  strandId              Int?
  academicYearId        Int
  createdAt             DateTime          @default(now())
  updatedAt             DateTime          @updatedAt

  gradeLevel   GradeLevel   @relation(fields: [gradeLevelId], references: [id])
  strand       Strand?      @relation(fields: [strandId], references: [id])
  academicYear AcademicYear @relation(fields: [academicYearId], references: [id])
  enrollment   Enrollment?

  @@index([status, academicYearId])
  @@index([lrn])
}

model Enrollment {
  id             Int          @id @default(autoincrement())
  applicantId    Int          @unique   // one enrollment per applicant
  sectionId      Int
  academicYearId Int
  enrolledAt     DateTime     @default(now())
  enrolledById   Int

  applicant    Applicant    @relation(fields: [applicantId], references: [id], onDelete: Cascade)
  section      Section      @relation(fields: [sectionId], references: [id], onDelete: Restrict)
  academicYear AcademicYear @relation(fields: [academicYearId], references: [id])
  enrolledBy   User         @relation(fields: [enrolledById], references: [id])
}

model AuditLog {
  id          Int      @id @default(autoincrement())
  userId      Int?
  actionType  String
  description String
  subjectType String?
  subjectId   Int?
  ipAddress   String   @db.VarChar(45)
  userAgent   String?
  createdAt   DateTime @default(now())

  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([actionType])
  @@index([createdAt])
}
```

---

## 6. Core Modules

### 6.1 Online Admission Portal

**Frontend Route:** `/apply` — public, unauthenticated. React Router loader redirects to `/closed` if `enrollmentOpen = false`.

**React Page:** `client/src/pages/admission/Apply.tsx`

#### Layout & UX

- Full-page centered form card: school logo, school name, active academic year label.
- Multi-step wizard: ① Personal Information → ② Family & Contact → ③ Enrollment Preferences.
- Step progress indicator at the top.
- On success: form replaced by a **Success Panel** showing the `trackingNumber` in a prominent, copyable display.

#### Fields

| Field | Type | Validation |
|---|---|---|
| Last Name | Text | required, max 100 |
| First Name | Text | required, max 100 |
| Middle Name | Text | optional, max 100 |
| Suffix | Select (Jr./Sr./III/IV/N/A) | optional |
| Birth Date | Date Picker | required, applicant must be ≥10 years old |
| Sex | Radio (Male / Female) | required |
| LRN | Text | required, exactly 12 digits, unique |
| Home Address | Textarea | required, max 300 |
| Parent/Guardian Name | Text | required |
| Parent/Guardian Contact | Text | required, valid PH mobile format |
| Email Address | Email | required |
| Grade Level | Dynamic Select (from API) | required |
| Strand | Dynamic Select (filtered by Grade Level) | required for SHS grade levels only |

#### Backend

- **Route:** `POST /api/applications`
- **Zod Validator:** `server/src/validators/application.validator.ts`
- **Tracking Number:** `HNS-${year}-${String(applicant.id).padStart(5, '0')}` — generated in the service layer after DB insert.

---

### 6.2 Registrar Administration Dashboard

**Frontend Route:** `/dashboard` — requires JWT, role: `REGISTRAR`.

**React Page:** `client/src/pages/dashboard/Index.tsx`

#### Stat Cards

| Card | Data Source |
|---|---|
| Total Pending | `COUNT(applicants WHERE status = 'PENDING')` |
| Total Enrolled | `COUNT(enrollments)` for active academic year |
| Total Approved (Awaiting Enrollment) | `COUNT(applicants WHERE status = 'APPROVED')` |
| Sections at Capacity | `COUNT(sections WHERE enrollment_count >= maxCapacity)` |

Use shadcn/ui `Card` per stat. Include a Lucide React icon per card.

#### Charts (Recharts)

- **Enrollment by Grade Level** — `BarChart` (horizontal).
- **Application Status Distribution** — `PieChart` (donut).

Both consume data from `GET /api/dashboard/stats`.

#### Recent Activity Feed

Last 10 `AuditLog` entries in a timeline-style list inside a `Card`.

---

### 6.3 Enrollment Management & Section Setting

#### 6.3.1 Section Management

**Frontend Route:** `/sections`
**API:** `GET /api/sections`, `POST`, `PUT /api/sections/:id`, `DELETE /api/sections/:id`

- Table: Grade Level, Section Name, Advising Teacher, Max Capacity, Enrolled Count, Available Slots.
- Inline `Badge`: `Full` (red) when `enrolledCount >= maxCapacity`, `Available` (green) with slot count.
- Create/Edit via shadcn/ui `Dialog`.

#### 6.3.2 Application Review & Enrollment Workflow

**Frontend Route:** `/applications`

**Approval Flow:**

1. Registrar opens applicant detail (`Dialog` or side sheet).
2. Clicks **"Approve & Enroll"**.
3. Second `Dialog` renders a `Select` pre-filtered to sections matching the applicant's grade level where `enrolledCount < maxCapacity`.
4. Registrar selects a section and confirms.

**Backend Capacity Validation — Race Condition Safe:**

```js
// server/src/services/enrollmentService.ts
import { prisma } from '../lib/prisma.js';

export async function enrollApplicant({ applicantId, sectionId, enrolledById, academicYearId }) {
  return await prisma.$transaction(async (tx) => {
    // Row-level lock prevents concurrent over-enrollment
    const [section] = await tx.$queryRaw`
      SELECT id, "maxCapacity" FROM "Section"
      WHERE id = ${sectionId}
      FOR UPDATE
    `;

    if (!section) throw Object.assign(new Error('Section not found.'), { statusCode: 404 });

    const enrolledCount = await tx.enrollment.count({ where: { sectionId } });

    if (enrolledCount >= section.maxCapacity) {
      throw Object.assign(
        new Error('This section has reached maximum capacity.'),
        { statusCode: 422 }
      );
    }

    const enrollment = await tx.enrollment.create({
      data: { applicantId, sectionId, enrolledById, academicYearId },
    });

    await tx.applicant.update({
      where: { id: applicantId },
      data: { status: 'APPROVED' },
    });

    return enrollment;
  });
}
```

> **Instruction for Claude Code:** The `FOR UPDATE` row lock inside `prisma.$transaction` is mandatory. This prevents two simultaneous approval requests from both succeeding when only one slot remains.

**Rejection Flow:** Registrar clicks **"Reject"** → `Dialog` prompts for optional reason → `PATCH /api/applications/:id/reject` → status updated → email dispatched.

---

### 6.4 Academic Year Configuration

**Frontend Route:** `/settings`
**React Page:** `client/src/pages/settings/Index.tsx`

Organized into shadcn/ui `Tabs`:

#### Tab 1: School Identity

- **Logo Upload:** `<input type="file" />` accepting `.png`, `.jpg`, `.webp`, max 2MB. Client-side `FileReader` preview. On save: `POST /api/settings/logo` (multipart/form-data via Axios + Multer). Backend runs `logoColorService`, updates `SchoolSettings`, returns new `colorScheme`. React updates Zustand settings store → CSS variables re-applied globally.
- **School Name:** Text input → `PUT /api/settings/identity`.

#### Tab 2: Academic Year

- CRUD table for `AcademicYear` records.
- Only one year can have `isActive = true` — activating one deactivates all others in a single transaction.

#### Tab 3: Grade Levels & Strands

- Two side-by-side CRUD lists.
- Strands have a multi-select for applicable grade levels.

#### Tab 4: Enrollment Gate

- Large shadcn/ui `Switch` labeled **"Enrollment Period"**.
- OFF: `Enrollment is CLOSED` badge (red). ON: `Enrollment is OPEN` badge (green).
- Toggle calls `PATCH /api/settings/enrollment-gate`.
- **Frontend Guard:** React Router v7 `loader` on `/apply` fetches `GET /api/settings/public` and redirects to `/closed` if `enrollmentOpen = false`.

---

### 6.5 Student Record Search & Filtering

**Frontend Route:** `/students`
**API:** `GET /api/students?search=&gradeLevelId=&sectionId=&status=&page=&limit=`

#### Table Columns

| Column | Sortable | Notes |
|---|---|---|
| LRN | Yes | Monospace font |
| Full Name | Yes | Last, First MI |
| Grade Level | Yes | Badge |
| Section | Yes | — |
| Status | Yes | Colored Badge |
| Date Applied | Yes | Formatted date |
| Actions | — | View, Approve, Reject |

#### Filter Toolbar

- **Real-time Search:** 300ms debounce on LRN or Name → triggers GET with `?search=` query param.
- **Filters:** Grade Level, Section (filtered by Grade Level), Status, Academic Year — all bound to URL search params via React Router v7 `useSearchParams()`.
- Server-side pagination, 15 records/page default.

---

### 6.6 System Audit Trail & Activity Logging

**Frontend Route:** `/audit-logs`

#### Logging Service

```js
// server/src/services/auditLogger.ts
import { prisma } from '../lib/prisma.js';

export async function auditLog({ userId, actionType, description, subjectType, subjectId, req }) {
  await prisma.auditLog.create({
    data: {
      userId:      userId ?? null,
      actionType,
      description,
      subjectType: subjectType ?? null,
      subjectId:   subjectId ?? null,
      ipAddress:   req.ip,
      userAgent:   req.headers['user-agent'] ?? null,
    },
  });
}
```

#### Mandatory Logged Events

| Action Type | Description Template |
|---|---|
| `APPLICATION_SUBMITTED` | `"Guest submitted application for {name} (LRN: {lrn}). Tracking: {tracking}"` |
| `APPLICATION_APPROVED` | `"Registrar {user} approved application #{id} — assigned to {section}"` |
| `APPLICATION_REJECTED` | `"Registrar {user} rejected application #{id}. Reason: {reason}"` |
| `SECTION_CREATED` | `"Admin created section {name} under {grade_level} with capacity {n}"` |
| `SECTION_UPDATED` | `"Admin updated capacity for {grade_level} - {section} to {n}"` |
| `ENROLLMENT_GATE_TOGGLED` | `"Admin {user} set enrollment to {OPEN/CLOSED}"` |
| `SETTINGS_UPDATED` | `"Admin updated school identity settings"` |
| `USER_LOGIN` | `"User {email} logged in from {ip}"` |

#### Audit Log UI

- shadcn/ui `Table`: Timestamp, User, Action Type (Badge), Description, IP Address.
- Filters: Action Type, Date Range.
- Non-destructive: no delete endpoint or UI exists for audit logs.

---

### 6.7 Automated Email Notification System

**Stack:** Nodemailer + Resend SMTP.

```bash
# server/
pnpm add nodemailer
```

```js
// server/src/services/mailer.ts
import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host:   'smtp.resend.com',
  port:   465,
  secure: true,
  auth: { user: 'resend', pass: process.env.RESEND_API_KEY },
});
```

#### Email Template Requirements

All HTML email templates must:
- Display the school logo (`logoUrl` from `SchoolSettings`).
- Use the active `primary_hsl` color for the header band.
- Include `Instrument Sans` via the Bunny Fonts CDN `<link>` in `<head>`.
- Include the school name and address in the footer.

#### Trigger Map

| Trigger | Subject |
|---|---|
| Application submitted | `Your Application Has Been Received — Tracking #HNS-XXXX` |
| Application approved | `Congratulations! Your Enrollment is Confirmed` |
| Application rejected | `Update on Your Application to Hinigaran NHS` |

#### Async Dispatch — Critical

```js
// server/src/controllers/applicationController.ts
export async function store(req, res) {
  const applicant = await applicationService.create(req.body);

  // Send response immediately — do NOT await the email
  res.status(201).json({ trackingNumber: applicant.trackingNumber });

  // Fire-and-forget after the HTTP response is fully sent
  setImmediate(async () => {
    try {
      await mailer.sendApplicationReceived(applicant);
    } catch (err) {
      console.error('[Email Error]', err.message);
    }
  });
}
```

> **Instruction for Claude Code:** Never `await` a mail-sending function before calling `res.json()`. Use `setImmediate()` to dispatch emails after the HTTP response is sent. This prevents the React frontend from stalling during form submission.

---

## 7. REST API Contracts

All endpoints prefixed with `/api`. All responses are `Content-Type: application/json`.

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/login` | None | Returns JWT token + user object |
| `GET` | `/auth/me` | JWT | Returns current authenticated user |

### Public (No Auth Required)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/settings/public` | Returns `schoolName`, `logoUrl`, `colorScheme`, `enrollmentOpen`, `activeAcademicYear` |
| `GET` | `/grade-levels` | Grade levels for the active academic year |
| `GET` | `/strands?gradeLevelId=` | Strands filtered by grade level |
| `POST` | `/applications` | Submit admission application |
| `GET` | `/applications/track/:trackingNumber` | Look up status by tracking number |

### Registrar (JWT + role: REGISTRAR)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/dashboard/stats` | Stat cards + chart data |
| `GET` | `/applications` | Paginated list with filters |
| `GET` | `/applications/:id` | Single application detail |
| `PATCH` | `/applications/:id/approve` | Approve + enroll into section |
| `PATCH` | `/applications/:id/reject` | Reject with optional reason |
| `GET` | `/students` | Paginated student list with search + filters |
| `GET` | `/sections` | All sections with enrolled count |
| `POST` | `/sections` | Create section |
| `PUT` | `/sections/:id` | Update section |
| `DELETE` | `/sections/:id` | Delete section (blocked if enrollments exist) |
| `GET` | `/academic-years` | List all academic years |
| `POST` | `/academic-years` | Create academic year |
| `PUT` | `/academic-years/:id` | Update academic year |
| `DELETE` | `/academic-years/:id` | Delete academic year |
| `GET` | `/grade-levels/all` | All grade levels |
| `POST` | `/grade-levels` | Create grade level |
| `PUT` | `/grade-levels/:id` | Update grade level |
| `DELETE` | `/grade-levels/:id` | Delete grade level |
| `POST` | `/strands` | Create strand |
| `PUT` | `/strands/:id` | Update strand |
| `DELETE` | `/strands/:id` | Delete strand |
| `PUT` | `/settings/identity` | Update school name |
| `POST` | `/settings/logo` | Upload logo + trigger color extraction |
| `PATCH` | `/settings/enrollment-gate` | Toggle enrollment open/closed |
| `GET` | `/audit-logs` | Paginated audit logs with filters |

### Teacher (JWT + role: TEACHER)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/teacher/sections` | Sections assigned to logged-in teacher |
| `GET` | `/teacher/sections/:id` | Students enrolled in a specific section |

### Standard Error Response

```json
{
  "message": "Human-readable error description",
  "errors": {
    "fieldName": ["Validation message"]
  }
}
```

HTTP status codes: `200` OK, `201` Created, `400` Bad Request, `401` Unauthorized, `403` Forbidden, `404` Not Found, `422` Unprocessable Entity, `500` Internal Server Error.

---

## 8. Frontend Routing Structure

```tsx
// client/src/router/index.tsx

export const router = createBrowserRouter([
  // ── Public ──────────────────────────────────────────────
  {
    path: '/',
    loader: async () => {
      const { enrollmentOpen } = await fetchPublicSettings();
      return redirect(enrollmentOpen ? '/apply' : '/closed');
    },
  },
  {
    path: '/apply',
    element: <GuestLayout><Apply /></GuestLayout>,
    loader: async () => {
      const settings = await fetchPublicSettings();
      if (!settings.enrollmentOpen) return redirect('/closed');
      return settings;
    },
  },
  { path: '/closed',                element: <GuestLayout><EnrollmentClosed /></GuestLayout> },
  { path: '/track/:trackingNumber', element: <GuestLayout><TrackApplication /></GuestLayout> },
  { path: '/login',                 element: <AuthLayout><Login /></AuthLayout> },

  // ── Protected (Registrar + Teacher) ─────────────────────
  {
    element: <ProtectedRoute allowedRoles={['REGISTRAR', 'TEACHER']} />,
    children: [
      { path: '/dashboard',        element: <AppLayout><Dashboard /></AppLayout> },
      { path: '/applications',     element: <AppLayout><Applications /></AppLayout> },
      { path: '/applications/:id', element: <AppLayout><ApplicationDetail /></AppLayout> },
      { path: '/students',         element: <AppLayout><Students /></AppLayout> },
      { path: '/sections',         element: <AppLayout><Sections /></AppLayout> },
      { path: '/audit-logs',       element: <AppLayout><AuditLogs /></AppLayout> },
      { path: '/settings',         element: <AppLayout><Settings /></AppLayout> },
      { path: '/my-sections',      element: <AppLayout><MySections /></AppLayout> },
    ],
  },

  // ── Fallback ─────────────────────────────────────────────
  { path: '*', element: <NotFound /> },
]);
```

`<ProtectedRoute>` reads the JWT from the Zustand auth store, decodes the role, and redirects unauthenticated users to `/login`.

---

## 9. Security Requirements

| Requirement | Implementation |
|---|---|
| SQL Injection Prevention | Prisma parameterized queries exclusively; no string-interpolated raw SQL |
| XSS Prevention | React JSX escaping by default; never use `dangerouslySetInnerHTML` |
| CORS | `cors` middleware with explicit `origin` allowlist; no wildcard `*` in production |
| Rate Limiting | `express-rate-limit`: 10 req/min on `POST /api/applications`; 20 req/min on `POST /api/auth/login` |
| File Upload Safety | Multer validates MIME type + max 2MB; files stored in `server/uploads/` with path traversal protection |
| JWT Secret | Stored in `.env` as `JWT_SECRET`; minimum 32-character random string; never committed to version control |
| Password Hashing | `bcryptjs`, salt rounds: 12 |
| Input Validation | Zod schema validation on every Express route before the controller is called |
| Mass Assignment Prevention | All Prisma `create`/`update` calls use explicitly destructured fields — never spread `req.body` directly |
| PII Handling | LRN treated as PII; never logged in plaintext in audit log descriptions beyond initial submission |
| Environment Variables | Provide `.env.example` with all required keys; never commit `.env` |

---

## 10. Out-of-Scope Limitations

| Feature | Reason for Exclusion |
|---|---|
| Grading System | Does not compute or store academic grades |
| Class Scheduling / Timetables | No subject or teacher scheduling engine |
| DepEd Official Form Generation (SF1, SF4) | No automated printing of official DepEd forms |
| Cashiering / School Fee Payments | No financial or billing module |
| SMS Notifications | Email only; no SMS gateway integration |
| Student / Parent Portal Login | Applicants interact only via the public form |
| Multi-School / Multi-Branch Support | Single-school installation only |
| WebSocket / Real-time Push | No live updates; standard API polling/refetch is acceptable |

---

## 11. Acceptance Criteria

| # | Acceptance Test |
|---|---|
| AC-01 | A guest can submit an admission form and receive a tracking number on-screen and via email. |
| AC-02 | The admission portal (`/apply`) redirects to `/closed` when the enrollment gate is OFF. |
| AC-03 | The registrar can log in with email + password and receive a valid JWT returned in the response. |
| AC-04 | A request to any protected route without a valid JWT returns HTTP 401. |
| AC-05 | A teacher JWT cannot access registrar-only endpoints — returns HTTP 403. |
| AC-06 | The registrar can approve an applicant and assign them to a section with available capacity. |
| AC-07 | The system blocks enrollment into a section at `maxCapacity` with HTTP 422 and a clear error message. |
| AC-08 | Concurrent enrollment attempts on the same last-slot section do not result in over-enrollment (race condition validated by `FOR UPDATE` lock). |
| AC-09 | Uploading any logo changes only the `--accent` (and aliased `--primary`, `--ring`) CSS tokens to the extracted dominant color. The `--background`, `--card`, `--foreground`, `--border`, and `--muted` tokens remain white/grey at all times. |
| AC-10 | Uploading a logo with an orange-dominant color sets the accent to an orange HSL value across all interactive elements (buttons, links, focus rings, sidebar highlights). The page background remains white. |
| AC-11 | Removing a logo (or a failed extraction) resets `--accent` to the default blue (`221 83% 53%`). All other main tokens remain unchanged. |
| AC-12 | All text in the application renders in `Instrument Sans`. |
| AC-13 | The registrar can search students by LRN or name in real-time (300ms debounce, no full page reload). |
| AC-14 | Every critical action (approve, reject, toggle enrollment, update settings) appears in the audit log with correct user, IP, and timestamp. |
| AC-15 | Email notifications are sent asynchronously — the API `201` response returns before the email is dispatched. |
| AC-16 | An advising teacher can view only their assigned sections; all other dashboard routes return 403. |
| AC-17 | The admission portal is fully usable at 375px (iPhone SE) with no horizontal overflow or broken layout. |
| AC-18 | The dashboard sidebar collapses to a hamburger `Sheet` drawer on viewports below 1024px. |
| AC-19 | All dashboard pages are fully usable at 768px (tablet) viewport. |
| AC-20 | Data tables on mobile are horizontally scrollable with no layout breakage. |
| AC-21 | Every successful form submission triggers a Sileo `success` toast. |
| AC-22 | Every server-side validation error triggers a Sileo `error` toast displaying the first error message. |
| AC-23 | A capacity-blocking enrollment attempt shows a Sileo `error` toast with a section-full message. |
| AC-24 | No native `alert()`, `confirm()`, or inline dismissible error banners appear anywhere in the application. |

---

*End of Document — PRD v2.2.0*
*Stack: PERN (PostgreSQL 18 · Express.js 5.1 · React 19.x · Node.js 22 LTS)*
*ORM: Prisma 6 · Auth: JWT · Routing: React Router v7 · Build: Vite 7 · Styles: Tailwind CSS v4*
*Package Manager: pnpm 10.x · All components: .tsx*
*Prepared for: Claude Code Implementation*
*School: Hinigaran National High School*