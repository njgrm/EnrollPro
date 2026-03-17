# Online Admission Form — UX/UI Technological Requirements
## Admission & Enrollment Information Management System

**Document Type:** UX/UI Engineering Specification
**Author Role:** UX/UI Engineer
**Route:** `/apply` — public, unauthenticated
**Component:** `client/src/pages/admission/Apply.tsx`
**Design System:** Instrument Sans · shadcn/ui · Tailwind CSS v4 · Sileo Toasts · Dynamic Accent Color
**Policy Basis:** RA 10173 · DO 017, s. 2025 · DM 012, s. 2026
**PRD Reference:** v2.4.0

---

## Table of Contents

1. [Design Principles for This Form](#1-design-principles-for-this-form)
2. [Page Architecture & Layout](#2-page-architecture--layout)
3. [Wizard Step Structure](#3-wizard-step-structure)
4. [Phase 0 — Privacy Notice Gate](#4-phase-0--privacy-notice-gate)
5. [Step 1 — Personal Information](#5-step-1--personal-information)
6. [Step 2 — Family & Contact](#6-step-2--family--contact)
7. [Step 3 — Background & Classification](#7-step-3--background--classification)
8. [Step 4 — Previous School](#8-step-4--previous-school)
9. [Step 5 — Enrollment Preferences](#9-step-5--enrollment-preferences)
10. [Step 6 — Review & Submit](#10-step-6--review--submit)
11. [Success Screen](#11-success-screen)
12. [Closed State (`/closed`)](#12-closed-state-closed)
13. [Component Specifications](#13-component-specifications)
14. [Validation Behavior & Error States](#14-validation-behavior--error-states)
15. [Responsive Behavior](#15-responsive-behavior)
16. [Accessibility Requirements](#16-accessibility-requirements)
17. [Performance Requirements](#17-performance-requirements)
18. [State Management](#18-state-management)
19. [Full File & Component Structure](#19-full-file--component-structure)
20. [Acceptance Criteria](#20-acceptance-criteria)

---

## 1. Design Principles for This Form

The admission form is the **first touchpoint** a student or parent has with the school's digital system. It must be trustworthy, clear, and forgiving. The following principles govern every decision in this spec.

| Principle | What It Means in This Form |
|---|---|
| **One thing at a time** | Each wizard step covers one logical topic. Never put unrelated fields on the same step. |
| **Progressive disclosure** | Conditional fields appear only when triggered — never show fields that don't apply to the current user's situation. |
| **Forgive first, validate second** | Inline validation fires on `onBlur`, not on every keystroke. The user completes their thought before being corrected. |
| **Never lose data** | All form state persists across step navigation. Going back to Step 1 does not clear Step 3. `sessionStorage` backs the form state. |
| **Mobile is primary** | Every layout decision starts at 375px and scales up, not the reverse. |
| **Speak the user's language** | Labels use plain Filipino/English, not bureaucratic field names. "Pangalan ng Ina" or "Mother's Full Name" — never "Parent_Guardian_Type: MOTHER". |
| **The accent color is the school** | Every interactive element — buttons, focus rings, step indicators, progress bars — uses `var(--accent)`. When the school uploads their logo, the form instantly becomes on-brand. |
| **Trust but verify** | The form never blocks a user from proceeding due to optional fields. Required fields are clearly marked with `*`. |

---

## 2. Page Architecture & Layout

### 2.1 Overall Page Structure

The `/apply` page uses `GuestLayout` — no sidebar, no dashboard header. The entire viewport is the form.

```
VIEWPORT (any screen size)
│
├── GuestLayout wrapper
│   └── <Toaster position="top-center" />   ← Sileo, top-center for guest pages
│
└── Apply.tsx (the form page)
    │
    ├── PAGE HEADER (sticky, not scrolling)
    │   ├── School logo thumbnail (40×40px, rounded-full)
    │   ├── School name (font-semibold text-base)
    │   └── Academic year badge ("SY 2026–2027")
    │
    ├── FORM CARD (scrollable, centered)
    │   ├── Phase 0: Privacy Notice Gate  ← pre-step, blocks all fields
    │   ├── Step Progress Bar             ← Steps 1–6
    │   ├── Step Content                  ← active step's fields
    │   └── Navigation Footer             ← Back / Next / Submit
    │
    └── PAGE FOOTER (minimal)
        └── "[School Name] · Powered by EnrollPro"
```

### 2.2 Form Card Sizing

| Breakpoint | Card Width | Padding | Field Layout |
|---|---|---|---|
| Mobile (≤ 767px) | `w-full` | `px-4 py-6` | Single column, full-width fields |
| Tablet (768px–1023px) | `max-w-2xl mx-auto` | `px-8 py-8` | Single column |
| Desktop (≥ 1024px) | `max-w-3xl mx-auto` | `px-10 py-10` | Two-column grid for side-by-side fields |
| Wide (≥ 1440px) | `max-w-3xl mx-auto` | Same as desktop | Same as desktop |

### 2.3 Page Background

```css
/* GuestLayout applies this to the full viewport */
bg-muted/40   /* Off-white tinted background behind the form card */
```

The form card itself: `bg-white rounded-2xl shadow-sm border border-border`

---

## 3. Wizard Step Structure

The admission form is organized into **6 steps** (expanded from the original 3-step PRD spec to accommodate all BEEF fields fully and cleanly). A **Privacy Notice Gate** precedes all steps.

```
┌─────────────────────────────────────────────────────────────────┐
│  PRIVACY NOTICE GATE (Phase 0)                                  │
│  Must consent before any field becomes interactive              │
└─────────────────┬───────────────────────────────────────────────┘
                  │ (after consent is given)
                  ▼
  ●─────────○─────────○─────────○─────────○─────────○
  1         2         3         4         5         6
Personal  Family &  Background  Previous  Enrollment Review &
 Info     Contact    & Class.    School   Preferences Submit
```

### Step Overview Table

| Step | Title | Tagline Shown to User | BEEF Sections Covered | Est. Time |
|---|---|---|---|---|
| **Phase 0** | Data Privacy Notice | — | §0 (RA 10173) | 1 min |
| **Step 1** | Personal Information | *"Tell us about the learner"* | §1 (Reference#s) + §3 (Personal info) | 2 min |
| **Step 2** | Family & Contact | *"Who do we contact?"* | §5 (Address) + §6 (Parent/Guardian) | 2 min |
| **Step 3** | Background & Classification | *"A few more details"* | §4 (IP, 4Ps, Disability, Balik-Aral) | 1 min |
| **Step 4** | Previous School | *"Where did the learner study last?"* | §7 (Previous school info) | 1 min |
| **Step 5** | Enrollment Preferences | *"What is the learner applying for?"* | §2 + §8 + §9 (Grade, SCP, Track, Modality) | 2 min |
| **Step 6** | Review & Submit | *"Check everything before submitting"* | Summary of all steps | 1 min |

**Total estimated completion time: 8–10 minutes**

### Step Progress Bar Component

```tsx
// client/src/pages/admission/components/StepProgressBar.tsx

interface StepProgressBarProps {
  currentStep: number; // 1–6
  totalSteps:  number; // 6
}
```

**Rendering:**

```
Mobile (< 768px): numbered dots with connecting line + "Step 2 of 6" text label
Tablet+ (≥ 768px): numbered dots + step title labels

  ●━━━━●━━━━○━━━━○━━━━○━━━━○
  1    2    3    4    5    6
 Done Done  Active ───────────
       ↑
  "Step 3 of 6 — Background & Classification"
```

**Dot states:**

| State | Visual | Tailwind |
|---|---|---|
| Completed | Solid filled circle with checkmark `✓` | `bg-[var(--accent)] text-white` |
| Active (current) | Solid filled circle with step number | `bg-[var(--accent)] text-white ring-2 ring-[var(--accent)] ring-offset-2` |
| Upcoming | Empty circle with step number | `bg-white border-2 border-border text-muted-foreground` |

**Connecting line:** `h-0.5 flex-1 bg-border` — turns `bg-[var(--accent)]` for completed segments.

---

## 4. Phase 0 — Privacy Notice Gate

> The Privacy Notice is the first thing rendered on the page. No form field is visible or interactive until consent is given.

### 4.1 Visual Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  [School Logo]  [School Name]                                   │
│  Online Admission Application · SY 2026–2027                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🔒  Data Privacy Notice                                         │
│      Republic Act No. 10173                                      │
│  ────────────────────────────────────────────────────────────── │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  [Full notice text — scrollable box]                     │   │
│  │                                                          │   │
│  │  Why we collect your information...                      │   │
│  │  What information we collect...                          │   │
│  │  Your rights under RA 10173...                           │   │
│  │  How we protect your information...                      │   │
│  │  Data Privacy Officer contact...                         │   │
│  │                                                          │   │
│  │  ↓ Scroll to read the full notice                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ☐  I have read and I agree to the Data Privacy Notice above. * │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  [ Proceed to Application Form → ]    (disabled/grey)    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 Behavior Specification

**Scroll-to-read enforcement:**
The notice text box has `max-h-72 overflow-y-auto` on mobile and `max-h-80` on desktop. The consent checkbox is initially disabled and grayed out. It becomes enabled only after the user has **scrolled to the bottom** of the notice text. This ensures actual reading, not just clicking through.

```tsx
// Detect when user has scrolled to the bottom of the notice
const handleNoticeScroll = (e: React.UIEvent<HTMLDivElement>) => {
  const el = e.currentTarget;
  const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 10;
  if (atBottom) setHasScrolledNotice(true);
};
```

**State machine:**

```
hasScrolledNotice = false → checkbox disabled (opacity-50, cursor-not-allowed)
hasScrolledNotice = true  → checkbox enabled
consentChecked    = false → "Proceed" button disabled
consentChecked    = true  → "Proceed" button active (accent color)
```

**"Proceed" button:**
```tsx
<Button
  disabled={!consentChecked}
  className="w-full"
  onClick={handleProceed}
>
  Proceed to Application Form →
</Button>
```

**On proceed:**
- `consentTimestamp` recorded as `new Date().toISOString()`
- `consentVersion` recorded as `"RA10173-v2025-DO017"`
- Form steps become visible and Step 1 mounts
- Privacy gate unmounts (replaced by the step wizard)
- Sileo `info` toast: *"Privacy notice accepted. You may now fill out the form."*

### 4.3 shadcn/ui Components Used

- `Card`, `CardHeader`, `CardContent` — outer wrapper
- `ScrollArea` — the scrollable notice box (ensures cross-browser consistent scrollbar)
- `Checkbox` — consent checkbox
- `Label` — checkbox label with `*` required asterisk
- `Button` — Proceed button

---

## 5. Step 1 — Personal Information

**Tagline:** *"Tell us about the learner"*

### 5.1 Field Layout (Desktop — 2-column grid)

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 1 of 6 — Personal Information                             │
│  Tell us about the learner.                                      │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐   │
│  │  Last Name *             │  │  First Name *               │   │
│  │  [ Dela Cruz           ] │  │  [ Juan                   ] │   │
│  └─────────────────────────┘  └─────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐   │
│  │  Middle Name             │  │  Suffix (Extension)         │   │
│  │  [ Reyes               ] │  │  [ N/A ▾ ]                  │   │
│  │  (Write N/A if none)     │  │                             │   │
│  └─────────────────────────┘  └─────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐   │
│  │  Date of Birth *         │  │  Age                        │   │
│  │  [ March 12, 2014  📅 ] │  │  [ 12       ] (auto-filled) │   │
│  └─────────────────────────┘  └─────────────────────────────┘   │
│                                                                  │
│  Sex *                                                           │
│  ○  Male      ○  Female                                          │
│  (As recorded on PSA Birth Certificate)                          │
│                                                                  │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐   │
│  │  Place of Birth *        │  │  Religion                   │   │
│  │  [ [City/Municipality]  ]│  │  [ Roman Catholic          ]│   │
│  └─────────────────────────┘  └─────────────────────────────┘   │
│                                                                  │
│  Mother Tongue *                                                 │
│  [ Hiligaynon                                              ▾ ]   │
│  (The language first learned at home)                            │
│                                                                  │
│  ────────── Reference Numbers ──────────────────────────────     │
│                                                                  │
│  Learner Reference Number (LRN)                                  │
│  [ 123456789012                                              ]    │
│  12 digits — found on your Grade 6 Report Card (SF9).            │
│  Leave blank if the learner has never enrolled in a DepEd school.│
│                                                                  │
│  PSA Birth Certificate Number                                    │
│  [ ________________________                                  ]    │
│  Found on the birth certificate (optional — submit by Oct 31).   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Field Specifications

| Field | Component | Placeholder | Helper Text | Validation |
|---|---|---|---|---|
| Last Name | `Input` | — | — | Required; letters + hyphens only; max 50 |
| First Name | `Input` | — | — | Required; letters + hyphens only; max 50 |
| Middle Name | `Input` | "Write N/A if none" | — | Optional; "N/A" accepted |
| Suffix | `Select` | "N/A" | — | Optional; options: N/A · Jr. · Sr. · II · III · IV · V |
| Date of Birth | `DatePicker` | "MM/DD/YYYY" | — | Required; age ≥ 10 yrs for G7; ≥ 14 yrs for G11 |
| Age | `Input` (read-only) | — | "Auto-computed" | Computed from DoB; not editable |
| Sex | `RadioGroup` | — | "As recorded on PSA BC" | Required; Male / Female |
| Place of Birth | `Input` | "City/Municipality, Province" | — | Required; max 100 |
| Religion | `Input` | "e.g., Roman Catholic" | — | Optional; free text |
| Mother Tongue | `Select` (searchable) | "Select language" | "The language first learned at home" | Required; options: Hiligaynon · Cebuano · Filipino · English · Waray · Kinaray-a · Other (specify) |
| LRN | `Input` | "000000000000" | "12 digits, found on Grade 6 SF9" | Optional; if filled: exactly 12 numeric digits; unique check on submit |
| PSA BC Number | `Input` | — | "Optional — submit by October 31" | Optional; alphanumeric |

### 5.3 UX Details

**Age auto-computation:**
When the user finishes entering the date of birth, the `Age` field auto-fills with the computed age. The field is read-only (visually distinct: `bg-muted text-muted-foreground cursor-not-allowed`). This prevents common errors where the age does not match the birthdate.

**LRN helper expansion:**
A small `(?)` info icon sits next to the LRN label. Clicking it opens a `Popover` with an annotated sample SF9 image (or illustration) showing exactly where the LRN appears on the report card. This reduces confusion for parents who have never seen the form.

**Mother Tongue — searchable select:**
The `Select` component is enhanced with a search input. A parent can type "Hil" and see "Hiligaynon" appear immediately. For a school in Negros Occidental, Hiligaynon should be the **default pre-selected value** (overrideable).

---

## 6. Step 2 — Family & Contact

**Tagline:** *"Who do we contact?"*

### 6.1 Field Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 2 of 6 — Family & Contact                                 │
│  Who do we contact about this application?                       │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  ────── Mother's Information ───────────────────────────────     │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐   │
│  │  Mother's Last Name *    │  │  Mother's First Name *      │   │
│  │  [                     ] │  │  [                        ] │   │
│  └─────────────────────────┘  └─────────────────────────────┘   │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐   │
│  │  Mother's Middle Name    │  │  Mother's Contact No. *     │   │
│  │  [                     ] │  │  [ 09XX-XXX-XXXX          ] │   │
│  └─────────────────────────┘  └─────────────────────────────┘   │
│                                                                  │
│  ────── Father's Information ───────────────────────────────     │
│  (same 4-field layout as above)                                  │
│                                                                  │
│  ────── Legal Guardian (if different from parents) ─────────     │
│  ☐  Add Guardian / Primary Contact                               │
│  (Expands if checked — same field layout + Relationship field)   │
│                                                                  │
│  ────── Contact & Communication ────────────────────────────     │
│  Email Address *                                                 │
│  [ parent@email.com                                         ]    │
│  Application updates, exam schedules, and enrollment            │
│  confirmation will be sent to this email.                        │
│                                                                  │
│  ────── Current Address ────────────────────────────────────     │
│  ┌────────────────┐  ┌──────────────────┐  ┌──────────────┐     │
│  │ House No.      │  │  Street          │  │  Barangay *  │     │
│  │ [             ]│  │  [             ] │  │  [          ]│     │
│  └────────────────┘  └──────────────────┘  └──────────────┘     │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐   │
│  │  Municipality/City *     │  │  Province *                 │   │
│  │  [ [City/Municipality]  ] │  │  [ Negros Occidental      ] │   │
│  └─────────────────────────┘  └─────────────────────────────┘   │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐   │
│  │  Country                 │  │  ZIP Code                   │   │
│  │  [ Philippines         ] │  │  [ 6107                   ] │   │
│  └─────────────────────────┘  └─────────────────────────────┘   │
│                                                                  │
│  Permanent Address                                               │
│  ☑  Same as Current Address                                      │
│  (Unchecking expands the permanent address fields below)         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 UX Details

**Guardian toggle:**
The guardian section is hidden behind a `Checkbox` labeled "The primary contact is someone other than the parents (guardian, grandparent, sibling)." When checked, an `Animated Collapsible` (`shadcn/ui Collapsible` with Tailwind transition) smoothly expands the guardian fields. This keeps the form clean for the common case while making the edge case accessible.

**Same address toggle:**
The "Same as Current Address" checkbox is **checked by default**, collapsing the permanent address fields. When unchecked, the permanent address fields expand with a smooth height transition.

**Email importance indicator:**
The email field has a subtle amber info banner below it:

```
ⓘ  Important: All application updates and exam schedules will be sent
   to this email. Make sure it is correct and accessible.
```

This is an inline `Alert` component (not a toast) — it persists as long as the user is on this step.

**Phone number formatting:**
The contact number field auto-formats as the user types:
- Input: `09171234567`
- Display: `0917-123-4567`
- Validated as: `/^09\d{9}$/`

---

## 7. Step 3 — Background & Classification

**Tagline:** *"A few more details"*

This step handles the equity and classification fields from BEEF §4. These are sensitive fields — the UX must be non-stigmatizing and purely informational.

### 7.1 Field Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 3 of 6 — Background & Classification                      │
│  These details help the school provide the right support.       │
│  All information is kept strictly confidential.                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Is the learner a member of an Indigenous Peoples (IP)          │
│  cultural community? *                                           │
│  ○  No      ○  Yes → specify: [ _____________________ ]         │
│                                                                  │
│  Is your family a beneficiary of the 4Ps (Pantawid              │
│  Pamilyang Pilipino Program)? *                                  │
│  ○  No      ○  Yes → 4Ps Household ID: [ _______________ ]      │
│                                                                  │
│  Is this learner returning to school after a gap of             │
│  1 year or more? (Balik-Aral) *                                  │
│  ○  No      ○  Yes                                               │
│                                                                  │
│  Does the learner have a disability? *                           │
│  ○  No                                                           │
│  ○  Yes — please describe (check all that apply):               │
│     ☐  Visual Impairment                                         │
│     ☐  Hearing Impairment                                        │
│     ☐  Physical / Motor Disability                               │
│     ☐  Intellectual Disability                                   │
│     ☐  Learning Disability                                       │
│     ☐  Speech / Language Disorder                                │
│     ☐  Emotional / Behavioral Disorder                           │
│     ☐  Autism Spectrum Disorder                                  │
│     ☐  Multiple Disabilities                                     │
│     ☐  Other: [ ___________________ ]                            │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  ⓘ  This information is used exclusively to connect the learner │
│     to appropriate support services. It will not affect their   │
│     eligibility for enrollment in any way.                       │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 UX Details

**Non-stigmatizing framing:**
The step tagline explicitly says "All information is kept strictly confidential." The info banner at the bottom says "This will not affect eligibility for enrollment in any way." These are not legal disclaimers — they are reassurances that reduce abandonment.

**Disability multi-select:**
The disability options are hidden until "Yes" is selected for the disability question. They expand smoothly via `Collapsible`. The "Other" option has an inline text input that appears when its checkbox is checked.

**All questions use `RadioGroup`, not `Switch`:**
Binary Yes/No questions use `RadioGroup` with `RadioGroupItem` components. `Switch` components imply ON/OFF states — not appropriate for these sensitive classification questions.

**Confidentiality badge:**
Each sensitive section (IP, 4Ps, Disability) has a small `🔒 Confidential` badge next to its label, rendered as a `Badge variant="outline"` with a lock icon. This reinforces RA 10173 compliance and builds trust.

---

## 8. Step 4 — Previous School

**Tagline:** *"Where did the learner study last?"*

### 8.1 Field Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 4 of 6 — Previous School                                  │
│  Where did the learner study last?                               │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Name of Last School Attended *                                  │
│  [ [Previous School Name]                     ]     │
│                                                                  │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐   │
│  │  DepEd School ID         │  │  School Year Last Attended * │   │
│  │  [ 123456  ]             │  │  [ 2025–2026 ▾ ]            │   │
│  │  (6 digits, if known)    │  │                             │   │
│  └─────────────────────────┘  └─────────────────────────────┘   │
│                                                                  │
│  Last Grade Level Completed *                                    │
│  ○  Grade 6    ○  Grade 10    ○  Other: [ _______ ]              │
│                                                                  │
│  Type of Last School *                                           │
│  ○  Public (DepEd)    ○  Private    ○  International    ○  ALS   │
│                                                                  │
│  School Address / Division (optional)                            │
│  [ [City], [Province] — [SDO]            ]     │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  ⓘ  If the learner does not have a Report Card (SF9), they may │
│     still enroll. The school will accept a certification letter │
│     from the previous school principal as an alternative.       │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 UX Details

**School Year dropdown:**
Offers the last 10 school years as options (e.g., `2025–2026`, `2024–2025`, ...). Sorted newest first. This is sufficient for the vast majority of cases including Balik-Aral learners.

**SF9 reassurance banner:**
An `Alert` (shadcn/ui, `variant="default"`) at the bottom of the step explains that a missing report card is not a barrier. This directly addresses one of the most common reasons parents hesitate to apply.

**Smart default for Grade 7 applicants:**
When the user selected Grade 7 in Step 5 (enrollment preference — see note below), the "Last Grade Level Completed" field pre-selects "Grade 6". This reduces clicks. The user can still change it.

> **Step ordering note:** Step 5 (Enrollment Preferences) contains the grade level selector. In the form's internal state, the grade level is captured in Step 5 but the component for Step 4 reads the current grade level value from state to show smart defaults. This does not require the user to complete Step 5 first — it simply means if they do Step 5 before Step 4 (not possible in linear wizard), or if they go back, the defaults apply.

---

## 9. Step 5 — Enrollment Preferences

**Tagline:** *"What is the learner applying for?"*

This is the most complex step due to conditional branching. It determines the applicant's type, SCP program (if any), SHS track, and modality.

### 9.1 Field Layout — Base State (Grade 7, Regular)

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 5 of 6 — Enrollment Preferences                           │
│  What is the learner applying for?                               │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Grade Level to Enroll *                                         │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐   │
│  │  G7  │  │  G8  │  │  G9  │  │ G10  │  │ G11  │  │ G12  │   │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘   │
│  (Card-style selector — one selected = accent border + fill)     │
│                                                                  │
│  ────────────────────────────────────────────────────────────── │
│  ── SHOWS WHEN GRADE 7 IS SELECTED: ─────────────────────────── │
│                                                                  │
│  Application Type *                                              │
│  ○  Regular Section                                              │
│     (Open admission — no entrance exam required)                 │
│  ○  Special Curricular Program (SCP)                             │
│     (Requires a qualifying assessment or audition)               │
│                                                                  │
│  ── SHOWS WHEN SCP IS SELECTED (still Grade 7): ─────────────── │
│                                                                  │
│  Which SCP are you applying for? *                               │
│  ○  Science, Technology & Engineering (STE)                      │
│     Written entrance exam · Administered by the SDO              │
│  ○  Special Program in the Arts (SPA)                            │
│     Written qualifying exam + Audition + Interview               │
│     └─ Art Field: [ Visual Arts ▾ ]  (shows when SPA selected)  │
│  ○  Special Program in Sports (SPS)                              │
│     Physical tryout · Sports background required                 │
│     └─ Sport/s: [ Basketball ▾ ]  (multi-select, shows for SPS) │
│  ○  Special Program in Journalism (SPJ)                          │
│     Written exam (SPJQE) + Interview + Recommendation letter     │
│  ○  Special Program in Foreign Language (SPFL)                   │
│     Based on NAT English score · No separate exam                │
│     └─ Language: [ Japanese ▾ ]  (shows when SPFL selected)     │
│  ○  Special Program in Tech-Voc (SPTVE)                          │
│     Aptitude assessment · School-administered                    │
│                                                                  │
│  ── SHOWS WHEN GRADE 11 IS SELECTED: ─────────────────────────  │
│                                                                  │
│  SHS Track *                                                     │
│  ○  Academic             ○  Technical-Professional (TechPro)     │
│                                                                  │
│  Preferred Elective Cluster *  (filtered by track)              │
│  [ STEM (Science, Technology, Engineering & Mathematics) ▾ ]     │
│                                                                  │
│  ── SHOWS WHEN STEM CLUSTER IS SELECTED: ─────────────────────  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ⚠  STEM Eligibility Check                                 │  │
│  │  STEM requires a Grade 10 Science and Math grade of 85+.  │  │
│  │                                                            │  │
│  │  Grade 10 Science Final Grade *   [ ______ ]              │  │
│  │  Grade 10 Math Final Grade *      [ ______ ]              │  │
│  │                                                            │  │
│  │  ⓘ  You will also be required to take a placement exam    │  │
│  │     and interview before final enrollment is confirmed.   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ────────── General Fields (all applicants) ───────────────────  │
│                                                                  │
│  Type of Learner *                                               │
│  ○  New Enrollee           ○  Transferee                         │
│  ○  Returning (Balik-Aral) ○  Out-of-School Youth (OSCYA)        │
│                                                                  │
│  Preferred Learning Modality *                                   │
│  ○  Face-to-Face (F2F) — most common                             │
│  ○  Blended Learning                                             │
│  ○  Distance / Modular                                           │
│  ○  Online Learning                                              │
│  ○  Home Schooling                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Grade Level Selector — Card Style

```tsx
// Grade level cards — pill/card style instead of a dropdown
// This makes selection visual and tactile, especially on mobile

<div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
  {gradeLevels.map((gl) => (
    <button
      key={gl.id}
      type="button"
      onClick={() => setValue('gradeLevelId', gl.id)}
      className={cn(
        "rounded-lg border-2 py-3 text-sm font-medium transition-all",
        selectedGradeId === gl.id
          ? "border-(--accent) bg-(--accent) text-white"
          : "border-border bg-white text-foreground hover:border-(--accent)"
      )}
    >
      {gl.name}
    </button>
  ))}
</div>
```

### 9.3 SCP Info Cards

Each SCP radio option includes a brief description of the admission requirement. This saves parents from having to research separately. The description renders in `text-xs text-muted-foreground` below the SCP name label.

### 9.4 STEM Eligibility Panel

When STEM is selected as the cluster, a distinct amber-bordered panel appears with a warning icon and two number input fields. If the user enters a grade below 85 in either field, an inline warning appears:

```
⚠  This grade is below the minimum required for STEM (85).
   You may still submit your application — the registrar will
   review your documents and contact you.
```

Critically: the system shows a **warning**, not a hard block. Per DO 017, the school cannot deny enrollment due to grades — the registrar makes the final decision.

### 9.5 Conditional Field Animations

All conditional field groups (SCP type, art field, SHS track, STEM grades) use `shadcn/ui Collapsible` with CSS height transitions:

```tsx
<Collapsible open={showSCPFields}>
  <CollapsibleContent className="overflow-hidden transition-all duration-300 ease-in-out">
    {/* SCP-specific fields */}
  </CollapsibleContent>
</Collapsible>
```

---

## 10. Step 6 — Review & Submit

**Tagline:** *"Check everything before submitting"*

### 10.1 Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 6 of 6 — Review & Submit                                  │
│  Please review all information before submitting.               │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  PERSONAL INFORMATION                               [Edit Step 1]│
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Name       :  DELA CRUZ, Juan Reyes                     │   │
│  │  Birthdate  :  March 12, 2014 (Age: 12)                  │   │
│  │  Sex        :  Male                                      │   │
│  │  Place of   :  [City/Municipality], [Province]              │   │
│  │  Birth                                                   │   │
│  │  LRN        :  123456789012                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  FAMILY & CONTACT                                   [Edit Step 2]│
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Mother     :  Maria Dela Cruz · 0917-123-4567           │   │
│  │  Father     :  Roberto Dela Cruz · 0918-234-5678         │   │
│  │  Email      :  delacruz.maria@gmail.com                  │   │
│  │  Address    :  123 Brgy. San Antonio, [City/Municipality]           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  BACKGROUND                                         [Edit Step 3]│
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  IP Community  :  No                                     │   │
│  │  4Ps           :  No                                     │   │
│  │  Disability    :  No                                     │   │
│  │  Balik-Aral    :  No                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  PREVIOUS SCHOOL                                    [Edit Step 4]│
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Last School   :  [Previous School Name]    │   │
│  │  Grade Completed: Grade 6  ·  SY 2025–2026  ·  Public   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ENROLLMENT PREFERENCES                             [Edit Step 5]│
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Grade Level   :  Grade 7                                │   │
│  │  Program       :  Regular Section                        │   │
│  │  Learner Type  :  New Enrollee                           │   │
│  │  Modality      :  Face-to-Face (F2F)                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  ✓ Accuracy Certification *                                      │
│  ☐  I certify that all information is true and correct to the   │
│     best of my knowledge and belief.                             │
│                                                                  │
│  Full Name of Parent/Guardian (or Learner if 18+) *             │
│  [ Maria Dela Cruz                                          ]    │
│                                                                  │
│  Date *                                                          │
│  [ March 5, 2027                📅 ]   (auto-filled with today) │
│                                                                  │
│  (Privacy consent was accepted at the start of this form ✓)     │
│                                                                  │
│       ← Back            [ Submit Application ]                   │
│                          (disabled until checkbox checked)       │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 UX Details

**Edit shortcuts:**
Each section card has a small `[Edit]` link in the top-right corner that jumps directly back to that step. This is a `Button variant="ghost" size="sm"` labeled "Edit Step N" in `text-primary`. Clicking it navigates back to that step without losing any data.

**Read-only display:**
All review data is displayed in `text-sm text-foreground` with `text-xs text-muted-foreground` labels. This is not an editable form — it is a clean summary.

**Submit button state:**
```
Accuracy checkbox unchecked → Submit button: disabled, opacity-50
Accuracy checkbox checked   → Submit button: enabled, accent color
```

**Loading state on submit:**
When the Submit button is clicked:
1. Button shows a spinner: `<Loader2 className="animate-spin mr-2" />  Submitting...`
2. Button is disabled (prevents double-submit)
3. Sileo `promise` toast wraps the API call:
   ```tsx
   sileo.promise(submitApplication(formData), {
     loading: 'Submitting your application...',
     success: 'Application received!',
     error:   'Something went wrong. Please try again.',
   });
   ```

---

## 11. Success Screen

On successful API response, the entire wizard is replaced by the Success Screen. This is not a new page — it is an in-place replacement via conditional rendering within `Apply.tsx`.

### 11.1 Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  [School Logo]  [School Name]                  │
│  Online Admission Application · SY 2026–2027                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│               ✅  Application Submitted!                         │
│                                                                  │
│  Your application has been received by [School Name].            │
│  The school registrar will review your documents and             │
│  contact you regarding the next steps.                           │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Your Tracking Number                                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │                  APP-2027-00042                          │   │
│  │             (large, monospace, accent color)             │   │
│  │                                                          │   │
│  │  [ 📋 Copy Tracking Number ]                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  📧  A confirmation email has been sent to:                      │
│      delacruz.maria@gmail.com                                    │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  What happens next?                                              │
│                                                                  │
│  1️⃣  The registrar will review your submitted information.       │
│  2️⃣  You will be contacted by email or phone regarding          │
│      document verification and any required assessments.         │
│  3️⃣  Once approved, you will receive a section assignment        │
│      confirmation before the first day of classes.               │
│                                                                  │
│  Track your application status anytime:                          │
│  [ 🔍 Track My Application ]  → /track/APP-2027-00042           │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  [ Submit Another Application ]   (ghost button, small)         │
│  (For families with multiple children applying)                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 Copy Tracking Number

```tsx
const handleCopy = async () => {
  await navigator.clipboard.writeText(trackingNumber);
  sileo.success({ title: 'Copied!', description: 'Tracking number copied to clipboard.' });
};
```

The Copy button label changes to "✓ Copied!" for 2 seconds after clicking, then reverts.

### 11.3 SCP-Specific Next Steps

For SCP applicants, the "What happens next?" section is customized:

```
For STE applicants:
  2️⃣  You will be notified of the STE entrance exam schedule.
       The exam is administered by the Schools Division Office.

For SPA applicants:
  2️⃣  You will be notified of the qualifying exam and audition date.
       Bring your portfolio (if applicable) on the assessment day.

For Grade 11 STEM applicants:
  2️⃣  The school will contact you regarding the STEM placement exam
       and interview schedule (March–April).
```

---

## 12. Closed State (`/closed`)

When the enrollment gate is OFF, the `/apply` loader redirects all visitors to `/closed`.

```
┌─────────────────────────────────────────────────────────────────┐
│  [School Logo]  [School Name]                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│              🔒  Enrollment is Currently Closed                  │
│                                                                  │
│  The online admission portal is not accepting applications       │
│  at this time.                                                   │
│                                                                  │
│  Next enrollment period:                                         │
│  Early Registration for SY 2027–2028 will open on               │
│  the last Saturday of January 2027.                              │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  Already submitted an application?                               │
│                                                                  │
│  [ APP-2027-_____ ]  [ 🔍 Track My Application ]                │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  For inquiries, contact the Registrar's Office:                  │
│  📞  [school phone]     📧  [school email]                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 13. Component Specifications

### 13.1 Full Component Map

| Section | shadcn/ui Component | Notes |
|---|---|---|
| Form card wrapper | `Card`, `CardHeader`, `CardContent` | `rounded-2xl shadow-sm` |
| Privacy notice scroll area | `ScrollArea` | Fixed height, custom scrollbar |
| Privacy consent | `Checkbox` + `Label` | Disabled until scrolled |
| Step progress | Custom `StepProgressBar` | Built from divs + CSS vars |
| Text inputs | `Input` | Full width, `h-10` |
| Date picker | `Input type="date"` or `DatePicker` from shadcn | Custom calendar popover |
| Select dropdowns | `Select`, `SelectTrigger`, `SelectContent`, `SelectItem` | Searchable for long lists |
| Searchable select | `Command` + `Popover` (shadcn Combobox pattern) | Mother tongue, school name |
| Radio groups | `RadioGroup`, `RadioGroupItem` | Vertical stack on mobile |
| Checkboxes | `Checkbox` + `Label` | Used for multi-select disability types |
| Grade level cards | Custom card-buttons | Accent border when selected |
| Collapsible fields | `Collapsible`, `CollapsibleContent` | Smooth height transitions |
| Navigation buttons | `Button` | Back = `variant="outline"`, Next/Submit = `variant="default"` |
| Info banners | `Alert`, `AlertDescription` | `variant="default"` for info, no `variant="destructive"` |
| Field errors | Inline `<p>` with `text-xs text-destructive` | Below each field |
| Toast notifications | `sileo` | `position="top-center"` (GuestLayout) |
| Loading spinner | `Loader2` from Lucide React | Inside submit button |
| Success checkmark | `CheckCircle2` from Lucide React | Large, accent colored |
| Copy button | `Button variant="outline"` + `Copy` icon | Changes to `Check` on success |
| Skeleton loading | `Skeleton` | During API data fetch (grade levels, strands) |

### 13.2 Form State Libraries

```
React Hook Form    — form state, validation triggering, field registration
Zod                — schema validation (client-side mirrors server-side schemas)
@hookform/resolvers/zod — bridge between RHF and Zod
```

```ts
// client/src/pages/admission/Apply.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { applicationSchema } from './schemas/application.schema.ts';

const form = useForm({
  resolver: zodResolver(applicationSchema),
  defaultValues: {
    privacyConsentGiven: false,
    lastName:            '',
    firstName:           '',
    middleName:          '',
    suffix:              'N/A',
    // ... all fields with safe defaults
  },
  mode: 'onBlur',   // validate on field exit, not on every keystroke
});
```

---

## 14. Validation Behavior & Error States

### 14.1 Validation Timing Strategy

| Event | Behavior |
|---|---|
| User typing | No validation — let them finish their thought |
| Field loses focus (`onBlur`) | Validate that field immediately; show error if invalid |
| "Next" button clicked | Validate all fields on current step; scroll to first error |
| "Submit" clicked | Full form validation; scroll to first error across all steps |
| Server returns 422 | Show server-side errors mapped to their fields; toast for first error |

### 14.2 Error Display Pattern

```tsx
// Each field + its error message = one unit

<div className="space-y-1.5">
  <Label htmlFor="lastName">
    Last Name <span className="text-destructive">*</span>
  </Label>
  <Input
    id="lastName"
    {...form.register('lastName')}
    className={cn(errors.lastName && "border-destructive focus-visible:ring-destructive")}
  />
  {errors.lastName && (
    <p className="text-xs text-destructive flex items-center gap-1">
      <AlertCircle className="h-3 w-3" />
      {errors.lastName.message}
    </p>
  )}
</div>
```

**Error border:** `border-destructive` (shadcn/ui red token)
**Error ring on focus:** `focus-visible:ring-destructive`
**Error message:** `text-xs text-destructive` with a small `AlertCircle` icon

### 14.3 Step-Level Validation Before Advancing

```tsx
const handleNext = async () => {
  const fieldsOnThisStep = getFieldsForStep(currentStep);
  const valid = await form.trigger(fieldsOnThisStep);

  if (!valid) {
    // Scroll to the first error field on this step
    const firstError = Object.keys(form.formState.errors)[0];
    document.getElementById(firstError)?.scrollIntoView({
      behavior: 'smooth', block: 'center',
    });
    sileo.error({
      title: 'Please fix the errors below',
      description: 'Some required fields are incomplete or incorrect.',
    });
    return;
  }

  setCurrentStep((s) => s + 1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
```

### 14.4 LRN Duplicate Check (Real-Time)

```tsx
// When LRN field blurs, check against existing records
const handleLrnBlur = async (lrn: string) => {
  if (lrn.length !== 12) return;

  const { data } = await api.get(`/applications/check-lrn?lrn=${lrn}`);
  if (data.exists) {
    form.setError('lrn', {
      message: 'This LRN already has an application for this school year.',
    });
  }
};
```

---

## 15. Responsive Behavior

### 15.1 Layout at Each Breakpoint

| Breakpoint | Form Card | Field Grid | Step Progress | Navigation |
|---|---|---|---|---|
| 375px (iPhone SE) | Full width, no margin | 1 column | Dots only + "Step N of 6" text | Back + Next stack vertically |
| 768px (iPad) | `max-w-2xl`, centered | 1 column | Dots + step titles (abbreviated) | Back + Next side by side |
| 1024px+ (Desktop) | `max-w-3xl`, centered | 2 columns for paired fields | Dots + full step titles | Back left, Next right |

### 15.2 Touch Targets

All interactive elements meet a **minimum 44×44px touch target** per WCAG 2.5.5:
- Radio buttons: `RadioGroupItem` uses `h-5 w-5` with `p-3` label wrapping
- Checkboxes: `h-5 w-5` with full-row clickable label
- Buttons: minimum `h-10` (40px) with `px-4` horizontal padding; Submit button is `h-12 w-full`
- Grade level cards: minimum `h-14 w-full`

### 15.3 Mobile-Specific Adjustments

- **Date picker:** Uses native `<input type="date">` on mobile (opens the OS date picker — fastest UX). Custom calendar popover on desktop.
- **Select dropdowns:** Use native `<select>` on mobile via `useIsMobile()` hook. Custom shadcn/ui `Select` on desktop.
- **Step progress bar:** On mobile, the step titles are hidden. Only numbered dots + "Step N of 6 — [Step Name]" text below the dots.
- **Two-column fields (Last/First Name):** Collapse to single column on mobile.

---

## 16. Accessibility Requirements

All requirements follow **WCAG 2.1 Level AA**.

| Requirement | Implementation |
|---|---|
| Color contrast | All text meets 4.5:1 ratio against background. Accent color checked against white — default blue (`#2563EB` on white = 5.9:1 ✓). Logo-extracted colors must be validated at extraction time; if ratio < 4.5:1, fall back to default blue. |
| Focus indicators | Every interactive element has a visible focus ring via `ring-2 ring-[var(--accent)] ring-offset-2`. Never use `outline: none` without a replacement. |
| Keyboard navigation | All form fields, buttons, and interactive elements are fully keyboard-navigable. Tab order follows visual reading order. |
| Screen reader labels | Every input has an associated `<Label>` via `htmlFor`/`id`. Error messages use `aria-describedby` pointing to the error `<p>`. |
| Required field indication | `*` asterisk after the label text + `aria-required="true"` on the input element. |
| Error announcements | Error messages use `role="alert"` so screen readers announce them immediately on appearance. |
| Step progress | Step progress bar includes `aria-label="Step 3 of 6 — Background and Classification"` |
| Disabled state | Disabled elements use `aria-disabled="true"` in addition to the visual `opacity-50` treatment |
| Language | `<html lang="en">` in `index.html`. If future bilingual support is needed, individual sections can use `lang="fil"`. |

---

## 17. Performance Requirements

### 17.1 Initial Load

| Metric | Target | Implementation |
|---|---|---|
| First Contentful Paint | < 1.5s | Bunny Fonts `display=swap`; CSS-only skeleton for form card before JS loads |
| Largest Contentful Paint | < 2.5s | Form card + privacy notice is the LCP element; no large images above fold |
| Cumulative Layout Shift | < 0.1 | All conditional sections use `min-h` to prevent layout shift; Skeleton components for API-loaded content |
| Time to Interactive | < 3.5s | React lazy-loads step content; only Step 1 renders on mount |

### 17.2 API Calls

| Call | Timing | Notes |
|---|---|---|
| `GET /api/settings/public` | On page load (React Router loader) | Fetches school name, logo, active year, enrollment status. Blocks render only if enrollment is closed (redirect). |
| `GET /api/grade-levels` | On mount of Step 5 | Lazy — only when the user reaches Step 5 |
| `GET /api/strands?gradeLevelId=` | On grade level selection in Step 5 | Only when grade = 11 |
| `GET /api/settings/scp-config` | On mount of Step 5 | Fetches which SCPs the school offers |
| `GET /api/applications/check-lrn?lrn=` | On LRN field blur in Step 1 | Debounced 500ms |
| `POST /api/applications` | On Submit button click | Wrapped in `sileo.promise()` |

### 17.3 Form State Persistence

All form data is saved to `sessionStorage` after every step transition. If the browser is accidentally refreshed mid-form, the user picks up where they left off:

```ts
// Save on every step transition
sessionStorage.setItem('enrollpro_apply_draft', JSON.stringify(form.getValues()));

// Restore on mount
const draft = sessionStorage.getItem('enrollpro_apply_draft');
if (draft) form.reset(JSON.parse(draft));
```

On successful submission or deliberate "Start Over," the draft is cleared:
```ts
sessionStorage.removeItem('enrollpro_apply_draft');
```

---

## 18. State Management

The admission form is entirely **local state** — no Zustand store, no global state. All form data lives in React Hook Form's internal state.

```
Apply.tsx
├── useForm()                    — all 65+ BEEF fields
├── useState(currentStep)        — active step 0–6
├── useState(consentGiven)       — privacy gate
├── useState(hasScrolledNotice)  — scroll-to-enable logic
├── useState(submitSuccess)      — toggles wizard → success screen
└── useState(trackingNumber)     — from API response
```

**No Zustand for the form.** The admission portal is a guest-facing, single-session interaction. Data does not need to persist between sessions (beyond `sessionStorage` draft). Using a global store would add unnecessary complexity.

---

## 19. Full File & Component Structure

```
client/src/pages/admission/
├── Apply.tsx                        ← main page component; routing gate, step orchestrator
├── ApplyClosed.tsx                  ← /closed route page
│
├── components/
│   ├── PrivacyNoticeGate.tsx        ← Phase 0: RA 10173 notice + consent
│   ├── StepProgressBar.tsx          ← numbered step progress indicator
│   ├── NavigationFooter.tsx         ← Back / Next / Submit buttons
│   ├── SuccessScreen.tsx            ← post-submit tracking number display
│   │
│   ├── steps/
│   │   ├── Step1PersonalInfo.tsx    ← name, DoB, sex, LRN, PSA BC, mother tongue
│   │   ├── Step2FamilyContact.tsx   ← parents, guardian, address
│   │   ├── Step3Background.tsx      ← IP, 4Ps, disability, Balik-Aral
│   │   ├── Step4PreviousSchool.tsx  ← last school, grade completed, type
│   │   ├── Step5Enrollment.tsx      ← grade, SCP/regular, SHS track, modality
│   │   └── Step6Review.tsx          ← read-only summary + certification
│   │
│   └── fields/
│       ├── GradeLevelSelector.tsx   ← card-style grade picker
│       ├── SCPSelector.tsx          ← SCP radio group with descriptions
│       ├── SHSTrackSelector.tsx     ← Academic / TechPro + cluster dropdown
│       ├── STEMGradePanel.tsx       ← STEM eligibility grade inputs + warning
│       ├── DisabilitySelector.tsx   ← yes/no + multi-checkbox expansion
│       ├── AddressFields.tsx        ← reusable address block (used in Step 2 twice)
│       └── GuardianFields.tsx       ← reusable guardian block (used in Step 2 × 3)
│
└── schemas/
    └── application.schema.ts        ← Zod schema matching server-side validator
```

---

## 20. Acceptance Criteria

| # | Acceptance Test |
|---|---|
| UX-01 | The Privacy Notice is the first element visible on `/apply`. No form field is accessible or interactive until the consent checkbox is checked. |
| UX-02 | The consent checkbox is disabled until the user scrolls to the bottom of the notice text box. |
| UX-03 | The "Proceed" button is disabled (visually greyed, `cursor-not-allowed`) until the consent checkbox is checked. |
| UX-04 | All 6 wizard steps are accessible only after the Privacy Notice is consented to. |
| UX-05 | The step progress bar correctly highlights the active step with the school's accent color. |
| UX-06 | Clicking "Edit Step N" on the Review screen navigates back to that step without clearing any field data. |
| UX-07 | The Age field auto-fills when a valid Date of Birth is entered. It is not manually editable. |
| UX-08 | The LRN field shows a real-time duplicate warning after a 500ms debounce if the LRN already exists. |
| UX-09 | The Grade Level selector renders as clickable cards, not a dropdown. The selected card shows an accent-colored border and background. |
| UX-10 | Selecting "Grade 7" shows the Application Type radio (Regular / SCP). Selecting any other grade hides it. |
| UX-11 | Selecting "SCP" shows the SCP type radio group. Selecting "Regular" hides it. |
| UX-12 | Selecting "SPA" shows the Art Field dropdown. Selecting "SPS" shows the Sports multi-select. Selecting "SPFL" shows the Language dropdown. All other SCP types show no sub-field. |
| UX-13 | Selecting "Grade 11" shows the SHS Track selector. Selecting STEM as the cluster shows the Grade 10 grade fields. |
| UX-14 | Entering a Grade 10 grade below 85 for STEM shows an amber warning, but does NOT block form submission. |
| UX-15 | Clicking "Next" on any step validates only the fields on that step, not the entire form. |
| UX-16 | If a step has validation errors when "Next" is clicked, the page scrolls to the first error field and a Sileo error toast appears. |
| UX-17 | All conditional field sections (disability checkboxes, guardian fields, permanent address, SCP fields) animate in/out smoothly using CSS height transitions, not instant show/hide. |
| UX-18 | Refreshing the browser mid-form restores all previously entered data from `sessionStorage`. |
| UX-19 | The Submit button shows a spinner and is disabled during the API call. Double-submit is not possible. |
| UX-20 | On successful submission, the wizard is replaced by the Success Screen showing the tracking number in large monospace accent-colored text. |
| UX-21 | The "Copy Tracking Number" button copies to clipboard and shows a `✓ Copied!` confirmation for 2 seconds. |
| UX-22 | SCP applicants see customized "What happens next?" messaging relevant to their SCP type on the Success Screen. |
| UX-23 | The form is fully usable at 375px viewport width with no horizontal overflow. |
| UX-24 | All interactive elements have a minimum touch target of 44×44px. |
| UX-25 | All form fields have visible focus rings using the school's accent color. |
| UX-26 | The form passes WCAG 2.1 AA color contrast checks even when a custom logo-extracted accent color is applied. |
| UX-27 | The `/closed` page shows the school's contact details and a tracking number lookup field. |
| UX-28 | Grade level options and SCP configurations shown in the form exactly match what the school has configured in Settings. |

---

*Document prepared by: UX/UI Engineering*
*System: Admission & Enrollment Information Management System*
*Design System: Instrument Sans · shadcn/ui · Tailwind CSS v4 · Sileo · Dynamic Accent Color*
*Policy: RA 10173 · DO 017, s. 2025 · DM 012, s. 2026 · WCAG 2.1 AA*
*PRD Reference: v2.4.0*