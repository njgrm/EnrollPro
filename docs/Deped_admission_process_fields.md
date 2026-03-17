# DepEd Admission Process — Complete Reference
## Grade 7 JHS & Grade 11 SHS | Input Fields & Required Student Information

**Governing Policies:**
- DepEd Order No. 017, s. 2025 — Revised Basic Education Enrollment Policy
- DepEd Memorandum No. 012, s. 2026 — Strengthened SHS Curriculum (Grade 11, SY 2026–2027)
- DepEd Memorandum No. 149, s. 2011 — Special Curricular Programs (SCPs)
- Division Memorandum No. 157, s. 2025 — STE Admission Test Guidelines
- RA 10173 — Data Privacy Act of 2012

**Effective:** SY 2025–2026 and all subsequent school years
**Scope:** All public secondary schools offering Grades 7 to 12

---

## Table of Contents

0. [RA 10173 — Data Privacy Notice (Displayed at Top of Admission Form)](#0-ra-10173--data-privacy-notice-displayed-at-top-of-admission-form)
1. [Overview — Two Admission Pathways](#1-overview--two-admission-pathways)
2. [The Basic Education Enrollment Form (BEEF)](#2-the-basic-education-enrollment-form-beef)
   - 2.1 [Form Header & Instructions](#21-form-header--instructions)
   - 2.2 [Section 1 — School Year & Reference Numbers](#22-section-1--school-year--reference-numbers)
   - 2.3 [Section 2 — Grade Level & Program](#23-section-2--grade-level--program)
   - 2.4 [Section 3 — Personal Information](#24-section-3--personal-information)
   - 2.5 [Section 4 — Special Classifications](#25-section-4--special-classifications)
   - 2.6 [Section 5 — Address Information](#26-section-5--address-information)
   - 2.7 [Section 6 — Parent / Guardian Information](#27-section-6--parent--guardian-information)
   - 2.8 [Section 7 — Previous School Information](#28-section-7--previous-school-information)
   - 2.9 [Section 8 — SHS Track & Elective Cluster (Grade 11 Only)](#29-section-8--shs-track--elective-cluster-grade-11-only)
   - 2.10 [Section 9 — Learner Type & Modality](#210-section-9--learner-type--modality)
   - 2.11 [Section 10 — Certification & Consent](#211-section-10--certification--consent)
3. [Complete Field Reference — All BEEF Fields](#3-complete-field-reference--all-beef-fields)
4. [Confirmation Slip (Annex C) — Continuing Learners](#4-confirmation-slip-annex-c--continuing-learners)
5. [Documentary Requirements by Learner Type](#5-documentary-requirements-by-learner-type)
6. [SCP Admission — Additional Requirements & Input Fields](#6-scp-admission--additional-requirements--input-fields)
7. [Data Privacy Compliance (RA 10173)](#7-data-privacy-compliance-ra-10173)
8. [Field-by-Field Mapping to LIS](#8-field-by-field-mapping-to-lis)
9. [Validation Rules for Each Field](#9-validation-rules-for-each-field)
10. [System Design Notes for the Admission Portal](#10-system-design-notes-for-the-admission-portal)

---

## 0. RA 10173 — Data Privacy Notice (Displayed at Top of Admission Form)

> **Design Instruction for Claude Code:** This section must render as the **very first visible element** on the `/apply` admission portal page — above the school logo, above Step 1 of the wizard, above every form field. It is a full-width, non-collapsible notice banner. The applicant must scroll through it, check a consent checkbox, and click a confirmation button before the form fields become interactive. This mirrors the RA 10173 requirement for informed, specific, and freely given consent before collection of personal data.

---

### 0.1 What RA 10173 Is

**Republic Act No. 10173**, known as the **Data Privacy Act of 2012**, is the Philippine law that protects the privacy of individuals by regulating how personal and sensitive personal information is collected, stored, processed, used, and disposed of. It is administered by the **National Privacy Commission (NPC)**.

DepEd is a personal information controller (PIC) under RA 10173. Every piece of information collected on the Basic Education Enrollment Form (BEEF) — including the learner's name, birthdate, address, disability status, and family contact details — is subject to this law.

---

### 0.2 The Privacy Notice — Full Text

The following is the exact privacy notice that must appear at the top of the online admission form. This is to be rendered as a styled notice card, not a tooltip or fine-print footnote.

---

```
┌──────────────────────────────────────────────────────────────────────────┐
│  🔒  DATA PRIVACY NOTICE                                                 │
│  Republic Act No. 10173 — Data Privacy Act of 2012                      │
│  National Privacy Commission Advisory Opinions                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  [School Name]                                          │
│  Schools Division of Negros Occidental                                   │
│  Department of Education — Region VI (Western Visayas)                  │
│                                                                          │
│  Why we collect your information                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│  The Department of Education (DepEd) and [School Name]                    │
│  collect the personal information on this form for the            │
│  following specific and legitimate purposes only:                        │
│                                                                          │
│    1. To process your child's admission and enrollment application.      │
│    2. To assign the learner to a grade level, section, and program.      │
│    3. To encode the learner's profile into the DepEd Learner             │
│       Information System (LIS) as required by national policy.           │
│    4. To communicate with you regarding your child's application         │
│       status, exam schedules, and enrollment confirmation.               │
│    5. To comply with DepEd reporting requirements to the Schools         │
│       Division Office (SDO) and DepEd Central Office.                    │
│    6. To tag equity program beneficiaries (4Ps, IP learners, Learners    │
│       with Disabilities) for appropriate support services.               │
│                                                                          │
│  What information we collect                                             │
│  ─────────────────────────────────────────────────────────────────────  │
│  Personal Information:                                                   │
│    • Full name, date of birth, sex, place of birth, age                  │
│    • Home address (current and permanent)                                │
│    • Mother tongue and religion                                          │
│    • Learner Reference Number (LRN)                                      │
│    • PSA Birth Certificate number                                        │
│                                                                          │
│  Sensitive Personal Information:                                         │
│    • Disability status and type (if applicable)                          │
│    • Indigenous Peoples (IP) cultural community affiliation              │
│    • 4Ps Pantawid Pamilyang Pilipino Program beneficiary status          │
│      and Household ID number                                             │
│    • Grade 10 subject grades (for Grade 11 STEM applicants)             │
│                                                                          │
│  Contact Information:                                                    │
│    • Parent/guardian name, contact number, and email address             │
│                                                                          │
│  Your rights under RA 10173                                              │
│  ─────────────────────────────────────────────────────────────────────  │
│  As a data subject (or as the parent/guardian of a minor data            │
│  subject), you have the right to:                                        │
│                                                                          │
│    ✓ Be informed — you have the right to know what data is collected     │
│      and why (this notice fulfills that obligation).                     │
│    ✓ Access — you may request a copy of your child's personal data       │
│      held by the school at any time.                                     │
│    ✓ Rectification — you may request corrections to inaccurate or        │
│      incomplete data by visiting the Registrar's Office.                 │
│    ✓ Object — you may object to the processing of your personal data     │
│      in certain circumstances, subject to DepEd's legal mandate.        │
│    ✓ Erasure or Blocking — you may request that your data be deleted     │
│      or blocked if it is no longer necessary for the stated purposes,    │
│      subject to DepEd's legal record-keeping requirements.               │
│    ✓ Damages — you have the right to be indemnified for damages          │
│      sustained due to inaccurate, incomplete, outdated, false,           │
│      unlawfully obtained, or unauthorized use of personal data.          │
│    ✓ File a complaint — you may file a complaint with the National       │
│      Privacy Commission (NPC) at privacy.gov.ph if you believe          │
│      your data privacy rights have been violated.                        │
│                                                                          │
│  How we protect your information                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│    • All data collected on this form is stored in the DepEd Learner     │
│      Information System (LIS), which is protected by DepEd's            │
│      information security standards.                                     │
│    • Your contact number and email address will be used exclusively      │
│      for school-related communications. They will never be shared        │
│      with third parties or used for marketing.                           │
│    • Physical BEEF forms collected during enrollment shall be retained   │
│      for no longer than one (1) year, after which they shall be          │
│      properly disposed of in accordance with DepEd Records               │
│      Management Regulations.                                             │
│    • The PSA Birth Certificate Number and LRN are treated as            │
│      personally identifiable information and will not be displayed       │
│      in any publicly accessible record.                                  │
│    • Disability and 4Ps data are classified as sensitive personal        │
│      information and access is restricted to the registrar, class        │
│      adviser, and school head only.                                      │
│                                                                          │
│  Data Privacy Officer Contact                                            │
│  ─────────────────────────────────────────────────────────────────────  │
│  For questions, requests to access or correct your data, or to file      │
│  a complaint, contact:                                                   │
│                                                                          │
│    [School Name]                                                         │
│    Registrar's Office                                                    │
│    [City/Municipality], [Province]                                          │
│    Email: [school official email]                                        │
│    Telephone: [school telephone number]                                  │
│                                                                          │
│  National Privacy Commission (NPC)                                       │
│    Website: https://www.privacy.gov.ph                                   │
│    Email: info@privacy.gov.ph                                            │
│    Hotline: +63 2 8234-2228                                              │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│  By checking the box below and proceeding with this form, I confirm     │
│  that I have read and understood this Data Privacy Notice, and I        │
│  freely and voluntarily consent to the collection and processing of     │
│  my child's personal information by [School Name]                       │
│  and the Department of Education for the purposes stated above,         │
│  in accordance with RA 10173 and its Implementing Rules and             │
│  Regulations.                                                            │
│                                                                          │
│  ☐  I have read and I agree to the Data Privacy Notice above.  *        │
│     (This field is required to proceed.)                                 │
│                                                                          │
│                        [ Proceed to Application Form → ]                │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### 0.3 Consent Checkbox Field Specification

| # | Field | Type | Required | Behavior |
|---|---|---|---|---|
| 0.1 | **Data Privacy Consent** | Checkbox | ✅ Required | Must be checked `true` before the "Proceed" button becomes active. Unchecked = disabled proceed button. |
| 0.2 | **Timestamp of Consent** | System-generated | Auto | Recorded invisibly when checkbox is checked. Stored as `consentTimestamp` in the `Applicant` record. Used as an audit trail for consent. |
| 0.3 | **Consent Version** | System-generated | Auto | Stores the version of the privacy notice the user consented to (e.g., `"RA10173-v2025-DO017"`). If the notice is updated, all future submissions are tagged with the new version. |

**Implementation note — backend:**

```ts
// The Applicant model must store consent metadata
// server/prisma/schema.prisma — add to Applicant model

model Applicant {
  // ... all existing fields ...

  // ── RA 10173 Consent fields ───────────────────────────────────
  privacyConsentGiven     Boolean   @default(false)
  privacyConsentTimestamp DateTime?
  privacyConsentVersion   String?   // e.g. "RA10173-v2025-DO017"
  // ─────────────────────────────────────────────────────────────
}
```

**Implementation note — Zod validator:**

```ts
// server/src/validators/application.validator.ts
// Add to the root application schema

privacyConsentGiven: z.literal(true, {
  errorMap: () => ({
    message: 'You must read and agree to the Data Privacy Notice to proceed.'
  })
}),
```

---

### 0.4 Legal Basis for Each Data Category Collected

Under RA 10173, every category of personal data collected must have a lawful basis. The table below documents the legal basis for each data category on the BEEF:

| Data Category | Examples | Legal Basis (RA 10173 §12 / §13) |
|---|---|---|
| Learner identity | Name, birthdate, sex, LRN | Fulfillment of DepEd's constitutional mandate to provide basic education (RA 10533); lawful processing for government function |
| Address | Current and permanent address | Necessary for school district assignment and emergency contact — lawful government function |
| Family contact | Parent/guardian name, phone, email | Necessary for communication regarding enrollment, assessment results, and emergency notifications |
| Mother tongue | Language spoken at home | Required by DepEd's Mother Tongue-Based Multilingual Education (MTB-MLE) program — lawful government function |
| Religion | Professed religion | Used for religion class scheduling (MAPEH); optional; no adverse effect if not provided |
| **PSA Birth Certificate Number** | Document reference number | Identity verification for LIS registration — sensitive PII; strict access control required |
| **Disability status and type** | Visual, hearing, physical, intellectual, autism | **Sensitive personal information** under §3(l) RA 10173 — requires explicit consent; collected for SNEd/SPED program referral and accommodation planning |
| **IP affiliation** | Ethnolinguistic group | **Sensitive personal information** — collected for Indigenous Peoples Education (IPEd) program tagging; school must implement additional safeguards |
| **4Ps status and Household ID** | DSWD-issued ID | **Sensitive personal information** — collected for conditional cash transfer program coordination; shared only with DepEd LIS |
| Grade 10 subject grades | Science grade, Math grade | Collected only for STEM eligibility screening; not collected for non-STEM applicants — data minimization principle |
| SCP assessment scores | Exam score, audition result | Collected only for SCP applicants — data minimization; retained in learner's permanent record after enrollment |

> **Data Minimization Principle (RA 10173 §11(c)):** Only data that is adequate, relevant, and not excessive in relation to the purpose of processing may be collected. The system must not ask for Grade 10 grades from non-STEM applicants. It must not ask for disability information and then leave it unused. Every field on the form must serve a stated purpose.

---

### 0.5 Sensitive Personal Information — Special Handling Rules

The following fields are classified as **Sensitive Personal Information (SPI)** under §3(l) of RA 10173 and require stricter handling than ordinary personal data:

| SPI Field | Who May Access It | Storage Rule | Prohibited Actions |
|---|---|---|---|
| Disability status and type | Registrar, Class Adviser, School Head, Guidance Counselor | Stored in LIS with restricted access flag; never displayed in general student lists | Cannot be disclosed to other students, parents of other students, or non-DepEd entities |
| IP cultural community | Registrar, School Head, IPEd Coordinator | Stored in LIS; used for IPEd program tagging only | Cannot be used to discriminate or deny services |
| 4Ps Household ID | Registrar, School Head | Stored in LIS; shared only with DSWD for program coordination via official DepEd channels | Cannot be shared with commercial entities or third parties |
| PSA BC Number | Registrar only | Recorded in physical enrollment logbook and LIS; never displayed in public-facing system views | Cannot appear in audit log plaintext descriptions; cannot be included in bulk exports |
| Grade 10 subject grades | Registrar, School Head, Guidance Counselor | Used only for STEM eligibility determination; not retained beyond the admission decision | Cannot be used to rank, shame, or publicly compare applicants |

---

### 0.6 Privacy Notice Placement on the Digital Form

The privacy notice defined in §0.2 must be implemented with the following UX rules on the `/apply` portal:

```
PAGE LOAD → /apply
    │
    ▼
┌─────────────────────────────────────────────────────┐
│  [School Logo]  [School Name]  SY 2026–2027         │
│  Online Admission Application                        │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │  🔒  DATA PRIVACY NOTICE (RA 10173)             │ │
│  │  [Full notice text — scrollable box, 300px h]  │ │
│  │                                                 │ │
│  │  ☐  I have read and agree to the Data Privacy  │ │
│  │     Notice.  *                                  │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  [ Proceed to Application Form → ]  ← disabled      │
│    (button activates only when checkbox is ✓)        │
└─────────────────────────────────────────────────────┘
    │
    │  (only after consent checkbox is checked and
    │   Proceed is clicked)
    ▼
STEP 1: Personal Information
STEP 2: Family & Contact
STEP 3: Enrollment Preferences
```

**Styling requirements:**
- Notice card: white background, `border border-border rounded-lg p-6 shadow-sm`
- Notice heading: accent color, `text-lg font-semibold` with a lock icon (`🔒`)
- Notice body: `text-sm text-muted-foreground`, scrollable with `max-h-72 overflow-y-auto`
- Checkbox: standard shadcn/ui `Checkbox` component with a red asterisk label
- Proceed button: `variant="default"` (accent color) — disabled state (`opacity-50 cursor-not-allowed`) when checkbox is unchecked
- The notice must NOT be dismissible, collapsible, or hideable — it must be fully visible on page load

---

### 0.7 Re-consent Requirement

If the Privacy Notice text is materially updated (e.g., new data categories added, new processing purposes), all **new** submissions after the update are tagged with the new consent version. **Existing** applicant records retain their original consent version tag — they do not need to re-consent retroactively. However, the school's Data Privacy Officer must assess whether existing applicants should be notified of material changes.

---

## 1. Overview — Two Admission Pathways

Under the revised guidelines, parents or guardians must submit the original or a certified true copy of the learner's PSA/NSO-issued birth certificate only once. Beyond that one-time document, the full admission workflow depends on which of the two pathways the learner is entering:

```
INCOMING LEARNER (Grade 7 or Grade 11)
          │
          ▼
  Is the learner applying for a
  Special Curricular Program (SCP)?
          │
    YES ──┤              NO ──────────────────────────────────┐
          │                                                   │
          ▼                                                   ▼
   SCP ADMISSION PATH                           OPEN ADMISSION PATH
   (competitive assessment)                    (document verification only)
          │                                                   │
   Submit BEEF +                               Submit BEEF +
   SCP-specific documents                      PSA BC + SF9
          │                                                   │
   Wait for exam /                             Registrar verifies
   audition schedule                           documents
          │                                                   │
   Take exam / audition                        APPROVED →
          │                                    Assign section
   PASSED → Enroll
   FAILED → Offer regular section
          or reject
```

**Pathway A — Open Admission** applies to: all regular Grade 7 applicants and all Grade 11 applicants for non-competitive tracks (HUMSS, ABM, GAS, TechPro non-STEM).

**Pathway B — SCP Admission** applies to: Grade 7 applicants to STE, SPA, SPS, SPJ, SPFL, SPTVE, and Grade 11 STEM aspirants.

Both pathways use the **same BEEF form** as their primary admission document. The difference lies in additional documents and the post-submission workflow.

---

## 2. The Basic Education Enrollment Form (BEEF)

**Form title:** Basic Education Enrollment Form (BEEF)
**Official source:** DepEd Central Office; available on the LIS Support page, Regional Office websites, SDO websites, and individual school websites
**Legal notice on form:** *"THIS FORM IS NOT FOR SALE"*
**Instructions on form:** *"Print legibly all information required in CAPITAL LETTERS and check all appropriate boxes. Submit accomplished form to the Adviser. Use black or blue pen only."*
**Availability:** Physical copies at any public school, barangay hall, or SDO; digital/printable version on DepEd official websites
**Latest version:** Updated under DO 017, s. 2025 (SY 2025–2026 and onwards); further updated January 15, 2026 with the SHS Track/Cluster fields reflecting DM 012, s. 2026

---

### 2.1 Form Header & Instructions

**On the physical paper BEEF**, the form header contains:
- Republic of the Philippines wordmark
- Department of Education seal
- Text: "BASIC EDUCATION ENROLLMENT FORM"
- Legal notice: "THIS FORM IS NOT FOR SALE"
- Instruction block: print in capital letters, black or blue pen only, submit to adviser
- A brief data privacy clause near the bottom of the form (Section 10 — Certification)

**On the digital online portal (`/apply`)**, the form header is preceded by the full **RA 10173 Data Privacy Notice** (see §0) which must be the first element the applicant interacts with. The privacy notice replaces the brief clause on the paper form with a comprehensive, scrollable, consent-gated notice.

This section contains **no fillable fields** — it is informational only. The only interactive element at this stage is the Privacy Consent Checkbox (§0.3).

---

### 2.2 Section 1 — School Year & Reference Numbers

| # | Field Label | Field Type | Required? | Format / Validation |
|---|---|---|---|---|
| 1.1 | **School Year** | Text / Select | Required | Format: `YYYY–YYYY` (e.g., `2026–2027`) — auto-filled if digital |
| 1.2 | **Learner Reference Number (LRN)** | Text | Optional at early registration; required if learner already has one | Exactly 12 numeric digits; no spaces; no dashes. Leave blank if learner has never been enrolled in a DepEd-accredited school. |
| 1.3 | **PSA Birth Certificate Number** | Text | Optional at early registration; required for official enrollment | Format: varies — typically 9 to 15 digits or alphanumeric depending on PSA issuance year |

**Notes on LRN:**
- If the learner was previously enrolled in a DepEd-accredited school, they should already have an LRN visible on their SF9 (Report Card) or SF10 (Form 137)
- Submitting an LRN that already exists in the LIS will link the application to the existing learner record — prevents duplicate profiles
- If the learner has no LRN (e.g., transferee from a non-DepEd school, returning learner with a long gap, or first-time enrollee from a non-recognized private school), LRN is left blank and the registrar will request LRN generation from the SDO after enrollment in LIS

---

### 2.3 Section 2 — Grade Level & Program

| # | Field Label | Field Type | Required? | Options |
|---|---|---|---|---|
| 2.1 | **Grade Level to Enroll** | Select (radio or dropdown) | Required | Kindergarten · Grade 1 · Grade 2 · Grade 3 · Grade 4 · Grade 5 · Grade 6 · Grade 7 · Grade 8 · Grade 9 · Grade 10 · Grade 11 · Grade 12 |
| 2.2 | **For Special Needs Education (SNEd) Only** | Conditional text | Required only if learner has SNEd needs | Specify the SNEd grade level or program type |
| 2.3 | **SHS Track** | Select (radio) | Required if Grade 11 | Academic · Technical-Professional (TechPro) — per DM 012, s. 2026 |
| 2.4 | **Preferred Elective Cluster** | Select (dropdown) | Required if Grade 11 | Filtered by selected Track (see Section 2.9 for full list) |
| 2.5 | **SCP Application (JHS)** | Select (radio) | Required if Grade 7 SCP applicant | Regular Section · STE · SPA · SPS · SPJ · SPFL · SPTVE |

**Note on Grade 12 (Continuing learners):** Grade 12 applicants in SY 2026–2027 do NOT use the new Track/Cluster fields — they continue under the old strand system (STEM, ABM, HUMSS, GAS). The BEEF for a Grade 12 transferee still shows the old Strand field, not the new Track/Cluster fields.

---

### 2.4 Section 3 — Personal Information

This is the most data-dense section of the BEEF. Every field here maps directly to the learner's profile in the DepEd Learner Information System (LIS).

| # | Field Label | Field Type | Required? | Format / Validation |
|---|---|---|---|---|
| 3.1 | **Last Name** | Text | Required | All caps; max 50 chars; no numbers; consistent with PSA Birth Certificate |
| 3.2 | **First Name** | Text | Required | All caps; max 50 chars; no numbers |
| 3.3 | **Middle Name** | Text | Optional | All caps; write `N/A` if none (e.g., for learners with only one surname) |
| 3.4 | **Extension Name** | Text | Optional | Jr. · Sr. · II · III · IV · V — write `N/A` if not applicable |
| 3.5 | **Birthdate** | Date | Required | Format: `MM/DD/YYYY`; must match PSA Birth Certificate exactly |
| 3.6 | **Age** | Number | Required | Auto-computed from birthdate in digital forms; must match as of enrollment date |
| 3.7 | **Sex** | Radio | Required | Male · Female (DepEd uses binary sex classification as recorded on PSA Birth Certificate; not self-identified gender) |
| 3.8 | **Place of Birth** | Text | Required | City / Municipality, Province — consistent with PSA Birth Certificate |
| 3.9 | **PSA Birth Certificate Number** | Text | Conditional | Required if not previously submitted to this school; optional if already on file from prior enrollment |
| 3.10 | **Religion** | Text | Optional | Free text — write the learner's professed religion (e.g., Roman Catholic, Islam, Iglesia ni Cristo) |
| 3.11 | **Mother Tongue** | Text | Required | The first language learned at home (e.g., Hiligaynon, Filipino, Cebuano, Waray, English) — used for MTB-MLE program assignment in lower grades; still collected for profiling at JHS level |

---

### 2.5 Section 4 — Special Classifications

These fields are used for equity program tagging, inclusion services, and national statistics. They are **not used to deny or restrict enrollment** — a "Yes" answer in any of these fields should trigger additional support services, not disqualification.

| # | Field Label | Field Type | Required? | Options & Follow-up Fields |
|---|---|---|---|---|
| 4.1 | **Belonging to any Indigenous Peoples (IP) Cultural Community?** | Yes / No | Required | If Yes → specify the name of the ethnolinguistic group (e.g., Ati, Mangyan, Lumad, Igorot, B'laan) |
| 4.2 | **Is your family a beneficiary of the 4Ps (Pantawid Pamilyang Pilipino Program)?** | Yes / No | Required | If Yes → write the **4Ps Household ID Number** (format: numeric, typically 9–12 digits) |
| 4.3 | **Is the learner a returning learner (Balik-Aral)?** | Yes / No | Optional (collected for LIS monitoring) | If Yes → provide the last year enrolled and the last grade level attended |
| 4.4 | **Learner with Disability (LWD)?** | Yes / No | Required | If Yes → specify the type of disability: |
| | ↳ Type of Disability | Select (multiple allowed) | Conditional | Visual Impairment · Hearing Impairment · Physical/Motor Disability · Intellectual Disability · Learning Disability · Speech/Language Disorder · Emotional/Behavioral Disorder · Autism Spectrum Disorder · Multiple Disabilities · Other (specify) |
| 4.5 | **Special Needs Education (SNEd) Program** | Yes / No | Required if LWD | If Yes → indicate preferred SNEd placement: Inclusive Education (integrated in regular class) · Special Education Center (separate SPED class) |

---

### 2.6 Section 5 — Address Information

The BEEF collects **two** addresses — current and permanent — because families in agricultural areas or with migratory work patterns may have a seasonal current address different from their legal permanent address.

**Current Address (where the learner lives now):**

| # | Field Label | Field Type | Required? | Format |
|---|---|---|---|---|
| 5.1 | **House No.** | Text | Optional | Unit/House number |
| 5.2 | **Street Name** | Text | Optional | Name of street/road |
| 5.3 | **Barangay** | Text | Required | Name of barangay |
| 5.4 | **City / Municipality** | Text | Required | Name of city or municipality |
| 5.5 | **Province** | Text | Required | Name of province |
| 5.6 | **Country** | Text | Required | Default: Philippines; specify if overseas (rare case for returning OFW families) |
| 5.7 | **Zip Code** | Text | Optional | 4-digit Philippine zip code |

**Permanent Address:**

| # | Field Label | Field Type | Required? |
|---|---|---|---|
| 5.8 | **Same as Current Address?** | Yes / No checkbox | Required |
| 5.9–5.15 | **Permanent Address fields** (House No., Street, Barangay, Municipality, Province, Country, Zip) | Same as above | Required only if "No" is checked in 5.8 |

---

### 2.7 Section 6 — Parent / Guardian Information

The BEEF collects contact information for up to **three** adult contacts: Mother, Father, and Legal Guardian (if different from parents). This covers cases where learners are in the custody of a grandparent, aunt/uncle, older sibling, or legal guardian.

**Mother's Information:**

| # | Field Label | Field Type | Required? | Notes |
|---|---|---|---|---|
| 6.1 | **Mother's Last Name** | Text | Required | Maiden name or current legal surname |
| 6.2 | **Mother's First Name** | Text | Required | |
| 6.3 | **Mother's Middle Name** | Text | Optional | |
| 6.4 | **Mother's Contact Number** | Text | Required if mother is primary contact | Format: 11-digit PH mobile (e.g., 09171234567) or landline with area code |
| 6.5 | **Mother's Maiden Name** (separate sub-field) | Text | Optional | Last name, First name, Middle name — used for identity verification |

**Father's Information:**

| # | Field Label | Field Type | Required? |
|---|---|---|---|
| 6.6 | **Father's Last Name** | Text | Required |
| 6.7 | **Father's First Name** | Text | Required |
| 6.8 | **Father's Middle Name** | Text | Optional |
| 6.9 | **Father's Contact Number** | Text | Required if father is primary contact |

**Legal Guardian's Information** (if different from parents):

| # | Field Label | Field Type | Required? | Notes |
|---|---|---|---|---|
| 6.10 | **Guardian's Last Name** | Text | Conditional | Required if neither parent is available or if custody is with a guardian |
| 6.11 | **Guardian's First Name** | Text | Conditional | |
| 6.12 | **Guardian's Middle Name** | Text | Optional | |
| 6.13 | **Guardian's Contact Number** | Text | Conditional | |
| 6.14 | **Relationship to Learner** | Text | Conditional | Grandparent · Aunt/Uncle · Older Sibling · Foster Parent · Other |

**Email Address:**

| # | Field Label | Field Type | Required? | Notes |
|---|---|---|---|---|
| 6.15 | **Email Address** | Email | Strongly recommended | Parent/guardian email for school communication and notification; required for remote enrollment |

> **Data Privacy Note (RA 10173):** Contact numbers and email addresses collected here may only be used for school-related communications. They must not be shared, sold, or used for any other purpose. These fields are subject to the Data Privacy Act and the National Privacy Commission's guidelines.

---

### 2.8 Section 7 — Previous School Information

This section establishes the learner's educational history and is used by the registrar to request SF10 (Form 137) from the sending school.

| # | Field Label | Field Type | Required? | Notes |
|---|---|---|---|---|
| 7.1 | **Name of Last School Attended** | Text | Required | Full official school name |
| 7.2 | **School ID (DepEd School ID)** | Text | Optional | 6-digit DepEd school ID if known; helps LIS match records |
| 7.3 | **Last Grade Level Completed** | Select | Required | Grade 6 (for Grade 7 entrants) · Grade 10 (for Grade 11 entrants) · other grade (for transferees) |
| 7.4 | **School Year Last Attended** | Text | Required | Format: `YYYY–YYYY` |
| 7.5 | **School Address / Division** | Text | Optional | City/municipality and SDO of the sending school — helps locate school records |
| 7.6 | **Type of Last School** | Radio | Required | Public · Private · International · ALS / Non-formal |

---

### 2.9 Section 8 — SHS Track & Elective Cluster (Grade 11 Only)

This section only appears on the BEEF when **Grade 11** is selected. Under DM 012, s. 2026 (effective SY 2026–2027), the old "Strand" field is replaced by "Track" and "Preferred Elective Cluster."

**For Grade 11 incoming learners (SY 2026–2027 onward):**

| # | Field Label | Field Type | Required? | Options |
|---|---|---|---|---|
| 8.1 | **SHS Track** | Radio | Required | ● Academic ● Technical-Professional (TechPro) |
| 8.2 | **Preferred Elective Cluster** | Select | Required | Filtered by Track selection (see full list below) |
| 8.3 | **Grade 10 Science Final Grade** | Number | Required if STEM cluster | Must be ≥ 85 per DepEd minimum criteria |
| 8.4 | **Grade 10 Mathematics Final Grade** | Number | Required if STEM cluster | Must be ≥ 85 per DepEd minimum criteria |

**Academic Track — Elective Cluster Options:**

| Cluster Code | Cluster Name |
|---|---|
| AC-STEM | Science, Technology, Engineering, and Mathematics (STEM) |
| AC-ARTSOC | Arts, Social Sciences, and Humanities |
| AC-SPORTS | Sports, Health, and Wellness |
| AC-BUSENT | Business and Entrepreneurship |
| AC-FIELDEXP | Field Experience |

**Technical-Professional (TechPro) Track — Elective Cluster Options:**

| Cluster Code | Cluster Name |
|---|---|
| TP-AESTWH | Aesthetic, Wellness, and Human Care |
| TP-AGRIFOOD | Agri-Fishery Business and Food Innovation |
| TP-ARTISAN | Artisanry and Creative Enterprise |
| TP-AUTO | Automotive and Small Engine Technologies |
| TP-CONST | Construction and Building Technologies |
| TP-CREATIVE | Creative Arts and Design Technologies |
| TP-HOSPTOUR | Hospitality and Tourism |
| TP-INDTECH | Industrial Technologies |
| TP-ICT | ICT Support and Computer Programming Technologies |
| TP-MARITIME | Maritime Transport |

> **Note:** Not all clusters are available at every school. The admission portal should display only the clusters offered by the school as configured in Settings. An applicant selecting a cluster not offered should receive a clear message.

**For Grade 12 transferees in SY 2026–2027 (old strand system):**

| # | Field Label | Field Type | Required? | Options |
|---|---|---|---|---|
| 8.5 | **SHS Strand (OLD SYSTEM — Grade 12 only)** | Select | Required | STEM · ABM · HUMSS · GAS · HE · ICT · Agri-Fishery · Industrial Arts |

---

### 2.10 Section 9 — Learner Type & Modality

| # | Field Label | Field Type | Required? | Options |
|---|---|---|---|---|
| 9.1 | **Type of Learner** | Radio | Required | Regular · Transferee · Returning Learner (Balik-Aral) · Out-of-School Children Youth & Adults (OSCYA) · ALS Learner |
| 9.2 | **Preferred Learning Modality** | Select | Required | Face-to-Face · Blended Learning · Distance Modular · Online Learning · Home Schooling |
| 9.3 | **SCP Application (Grade 7)** | Radio | Required if Grade 7 | Regular Section · Special Curricular Program (SCP) |
| 9.4 | **Which SCP?** | Select | Conditional | Science, Technology & Engineering (STE) · Special Program in the Arts (SPA) · Special Program in Sports (SPS) · Special Program in Journalism (SPJ) · Special Program in Foreign Language (SPFL) · Special Program in Tech-Voc Education (SPTVE) |
| 9.5 | **SPA Art Field** | Select | Conditional (SPA only) | Visual Arts · Music (Vocal) · Music (Instrumental) · Theatre Arts · Dance Arts · Media Arts · Creative Writing (English) · Creative Writing (Filipino) |
| 9.6 | **SPS Sport/s** | Multi-select | Conditional (SPS only) | Basketball · Volleyball · Football · Badminton · Table Tennis · Swimming · Arnis · Taekwondo · Athletics · Chess · Other (specify) |
| 9.7 | **SPFL Preferred Language** | Select | Conditional (SPFL only) | Japanese (Nihongo) · Spanish · French · German · Chinese (Mandarin) · Korean |

---

### 2.11 Section 10 — Certification & Consent

This is the final section of the paper BEEF. It must be signed by the parent/guardian (or by the learner themselves if 18 years old or older).

> **On the digital portal:** The equivalent of this section is split into two parts. The **Data Privacy Consent** is captured at the very beginning of the form (§0 — before any fields are shown). The **Certification of accuracy** is captured at the end of Step 3 before the final Submit button. This mirrors best practice UX for informed consent — the privacy notice comes first (before data is collected), and the accuracy certification comes last (after data is entered).

| # | Field Label | Field Type | Required? | Notes |
|---|---|---|---|---|
| 10.1 | **Certification statement** | Pre-printed text | — | *"I certify that the above information is true and correct to the best of my knowledge and belief."* |
| 10.2 | **Data Privacy Consent statement** | Pre-printed text | — | *"I consent to the collection and use of this information by the Department of Education for enrollment and other educational purposes in accordance with RA 10173."* — On the digital portal, this consent is captured at §0 (top of form), not here. This field on the digital form shows: *"I confirm that the Data Privacy Notice was read and consented to at the start of this form."* (read-only, auto-checked) |
| 10.3 | **Signature of Parent/Guardian** | Signature | Required | Physical signature on printed form; for digital forms, a typed full name confirmation acts as e-signature |
| 10.4 | **Printed Name of Parent/Guardian** | Text | Required | Full name of signatory |
| 10.5 | **Date Accomplished** | Date | Required | Format: `Month DD, YYYY` |
| 10.6 | **Relationship to Learner** | Text | Required if not parent | Mother · Father · Guardian (specify relationship) |

**For learners 18 years old or older:**
- The learner themselves may sign the certification without a parent/guardian
- The learner's own signature replaces the parent/guardian signature
- Field label changes to: *"Signature of Learner (if of legal age)"*

**On the digital portal — final step before Submit:**

```
┌──────────────────────────────────────────────────────────────┐
│  ✓ Accuracy Certification                                    │
│                                                              │
│  ☐  I certify that all information I have provided on        │
│     this form is true, correct, and complete to the best    │
│     of my knowledge and belief.  *                          │
│                                                              │
│  Full Name of Parent/Guardian (or Learner if 18+) *          │
│  [ _________________________________ ]                       │
│                                                              │
│  Date  *                                                     │
│  [ March 5, 2027            📅 ]                            │
│                                                              │
│  (Your Data Privacy consent was recorded at the start        │
│   of this form on [timestamp]. ✓)                           │
│                                                              │
│              [ ← Back ]    [ Submit Application → ]         │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Complete Field Reference — All BEEF Fields

Summary master table of every BEEF field organized by section:

| Section | # | Field | Type | Required | Grade 7 | Grade 11 | All Grades |
|---|---|---|---|---|---|---|---|
| **Header** | — | Form instructions | Static | — | — | — | ✓ |
| **1: Reference** | 1.1 | School Year | Text | ✅ | ✓ | ✓ | ✓ |
| | 1.2 | LRN | Number (12 digits) | If available | ✓ | ✓ | ✓ |
| | 1.3 | PSA BC Number | Text | If available | ✓ | ✓ | ✓ |
| **2: Grade/Program** | 2.1 | Grade Level | Select | ✅ | ✓ | ✓ | ✓ |
| | 2.3 | SHS Track | Radio | Grade 11 | — | ✓ | — |
| | 2.4 | Elective Cluster | Select | Grade 11 | — | ✓ | — |
| | 2.5 | SCP Application | Radio | Grade 7 SCP | ✓ (SCP) | — | — |
| **3: Personal** | 3.1 | Last Name | Text | ✅ | ✓ | ✓ | ✓ |
| | 3.2 | First Name | Text | ✅ | ✓ | ✓ | ✓ |
| | 3.3 | Middle Name | Text | Optional | ✓ | ✓ | ✓ |
| | 3.4 | Extension Name | Text | Optional | ✓ | ✓ | ✓ |
| | 3.5 | Birthdate | Date | ✅ | ✓ | ✓ | ✓ |
| | 3.6 | Age | Number | ✅ | ✓ | ✓ | ✓ |
| | 3.7 | Sex | Radio | ✅ | ✓ | ✓ | ✓ |
| | 3.8 | Place of Birth | Text | ✅ | ✓ | ✓ | ✓ |
| | 3.9 | PSA BC Number | Text | Once-only | ✓ | ✓ | ✓ |
| | 3.10 | Religion | Text | Optional | ✓ | ✓ | ✓ |
| | 3.11 | Mother Tongue | Text | ✅ | ✓ | ✓ | ✓ |
| **4: Special** | 4.1 | IP Community | Yes/No | ✅ | ✓ | ✓ | ✓ |
| | 4.1a | IP Group Name | Text | If IP=Yes | ✓ | ✓ | ✓ |
| | 4.2 | 4Ps Beneficiary | Yes/No | ✅ | ✓ | ✓ | ✓ |
| | 4.2a | 4Ps Household ID | Number | If 4Ps=Yes | ✓ | ✓ | ✓ |
| | 4.3 | Balik-Aral | Yes/No | Optional | ✓ | ✓ | ✓ |
| | 4.4 | Learner with Disability | Yes/No | ✅ | ✓ | ✓ | ✓ |
| | 4.4a | Disability Type | Multi-select | If LWD=Yes | ✓ | ✓ | ✓ |
| | 4.5 | SNEd Placement | Select | If LWD=Yes | ✓ | ✓ | ✓ |
| **5: Address** | 5.1–5.7 | Current Address (7 sub-fields) | Text | ✅ (Barangay, Municipality, Province) | ✓ | ✓ | ✓ |
| | 5.8 | Same as Current? | Checkbox | ✅ | ✓ | ✓ | ✓ |
| | 5.9–5.15 | Permanent Address (7 sub-fields) | Text | If 5.8=No | ✓ | ✓ | ✓ |
| **6: Guardian** | 6.1–6.4 | Mother info (4 sub-fields) | Text | ✅ | ✓ | ✓ | ✓ |
| | 6.5 | Mother's Maiden Name | Text | Optional | ✓ | ✓ | ✓ |
| | 6.6–6.9 | Father info (4 sub-fields) | Text | ✅ | ✓ | ✓ | ✓ |
| | 6.10–6.14 | Guardian info (5 sub-fields) | Text | If applicable | ✓ | ✓ | ✓ |
| | 6.15 | Email Address | Email | Recommended | ✓ | ✓ | ✓ |
| **7: Prev School** | 7.1 | Last School Name | Text | ✅ | ✓ | ✓ | ✓ |
| | 7.2 | School ID | Number | Optional | ✓ | ✓ | ✓ |
| | 7.3 | Last Grade Completed | Select | ✅ | Grade 6 | Grade 10 | ✓ |
| | 7.4 | SY Last Attended | Text | ✅ | ✓ | ✓ | ✓ |
| | 7.5 | School Address / Division | Text | Optional | ✓ | ✓ | ✓ |
| | 7.6 | Type of Last School | Radio | ✅ | ✓ | ✓ | ✓ |
| **8: SHS** | 8.1 | SHS Track | Radio | G11 only | — | ✅ | — |
| | 8.2 | Elective Cluster | Select | G11 only | — | ✅ | — |
| | 8.3 | G10 Science Grade | Number | If STEM | — | ✅ (STEM) | — |
| | 8.4 | G10 Math Grade | Number | If STEM | — | ✅ (STEM) | — |
| | 8.5 | Old Strand (G12) | Select | G12 only | — | — | — |
| **9: Learner Type** | 9.1 | Learner Type | Radio | ✅ | ✓ | ✓ | ✓ |
| | 9.2 | Learning Modality | Select | ✅ | ✓ | ✓ | ✓ |
| | 9.3 | SCP Application | Radio | G7 SCP | ✓ | — | — |
| | 9.4 | SCP Type | Select | If SCP=Yes | ✓ | — | — |
| | 9.5 | SPA Art Field | Select | SPA only | ✓ | — | — |
| | 9.6 | SPS Sports | Multi-select | SPS only | ✓ | — | — |
| | 9.7 | SPFL Language | Select | SPFL only | ✓ | — | — |
| **10: Certification** | 10.1 | Certification text | Static | — | ✓ | ✓ | ✓ |
| | 10.2 | Privacy consent | Static | — | ✓ | ✓ | ✓ |
| | 10.3 | Signature | Signature | ✅ | ✓ | ✓ | ✓ |
| | 10.4 | Printed Name | Text | ✅ | ✓ | ✓ | ✓ |
| | 10.5 | Date Accomplished | Date | ✅ | ✓ | ✓ | ✓ |
| | 10.6 | Relationship to Learner | Text | If guardian | ✓ | ✓ | ✓ |

**Total Fields:** Approximately 55–65 fields (varies depending on conditional branches activated)

---

## 4. Confirmation Slip (Annex C) — Continuing Learners

Grades 8–10 and Grade 12 pre-registered learners do **not** fill out the full BEEF. They submit a **Confirmation Slip** (Annex C of DO 017, s. 2025). This is a much shorter document confirming their intent to continue at the same school.

### Confirmation Slip Fields

| # | Field | Type | Required? |
|---|---|---|---|
| 1 | School Year | Text | ✅ |
| 2 | Learner Reference Number (LRN) | Number (12 digits) | ✅ |
| 3 | Learner's Full Name (Last, First, Middle) | Text | ✅ |
| 4 | Grade Level for Upcoming School Year | Select | ✅ |
| 5 | Current Section | Text | Optional |
| 6 | Has there been a gap in schooling? | Yes/No | ✅ |
| 7 | Contact Number (Parent/Guardian) | Text | Recommended |
| 8 | Email Address | Email | Recommended |
| 9 | Signature of Parent/Guardian (or learner if 18+) | Signature | ✅ |
| 10 | Date | Date | ✅ |

**Rule:** If a continuing learner has a gap of **one year or more** (Balik-Aral), they cannot use the Confirmation Slip — they must submit the full BEEF with their last SF9.

---

## 5. Documentary Requirements by Learner Type

### Required Documents at Enrollment — Complete Matrix

| Learner Type | PSA Birth Certificate | SF9 / Report Card | BEEF | Confirmation Slip | PEPT/A&E Result | Notes |
|---|---|---|---|---|---|---|
| **Grade 7 — New Entrant** | ✅ Once-only | ✅ Grade 6 SF9 | ✅ | — | Only if no SF9 | |
| **Grade 7 — SCP Applicant** | ✅ Once-only | ✅ Grade 6 SF9 | ✅ | — | Only if no SF9 | + SCP-specific docs (see §6) |
| **Grade 8 — Continuing** | Already on file | — | — | ✅ | — | |
| **Grade 9 — Continuing** | Already on file | — | — | ✅ | — | |
| **Grade 10 — Continuing** | Already on file | — | — | ✅ | — | |
| **Grade 11 — New Entrant** | ✅ Once-only | ✅ Grade 10 SF9 | ✅ | — | Only if no SF9 | +G10 grades if STEM |
| **Grade 12 — Continuing** | Already on file | — | — | ✅ | — | |
| **Transferee (any grade)** | ✅ If not on file | ✅ Latest SF9 | ✅ | — | — | + Affidavit of Undertaking if from private school with unpaid fees |
| **Balik-Aral (any grade)** | ✅ If not on file | ✅ Last SF9 (physical) | ✅ | — | If SF9 unavailable | |
| **OSCYA** | ✅ | Alternative docs accepted | ✅ | — | Often required | Flexible documentation per DO 017 |

### What "Once-Only" Means for PSA Birth Certificate

Under the revised guidelines, parents or guardians must submit the original or a certified true copy of the learner's PSA/NSO-issued birth certificate only once. The school records the PSA certificate number in the learner's permanent record in LIS. From that point forward, the family is not required to re-submit or bring the document again — not in subsequent school years, not during Regular Enrollment, not when moving to JHS or SHS.

### What SF10 (Form 137) is NOT

A common misunderstanding: SF10 is the Learner's Permanent Academic Record and is NOT an initial requirement for enrollment. The registrar requests it from the sending school through the LIS Portal Transfer/Tracking facility after the learner is enrolled. The learner and parent never carry this document themselves.

---

## 6. SCP Admission — Additional Requirements & Input Fields

Each SCP has unique additional documents and assessment inputs beyond the standard BEEF.

### STE (Science, Technology, Engineering)

| Requirement | Type | Notes |
|---|---|---|
| BEEF | Form | Standard |
| Grade 6 SF9 | Document | Must show grades in Science and Mathematics |
| Entrance Exam Score | Assessed in school | Written exam administered by SDO on a designated Saturday; no pre-registration required |
| Division-set Cut-off Score | System field | Registrar inputs after SDO releases the threshold |

**Additional system fields for STE applicants:**
- `examDate` — Date the STE entrance exam was taken
- `examScore` — Numerical score out of 100
- `cutoffScore` — Division-set qualifying score
- `examResult` — PASSED / FAILED / ABSENT

---

### SPA (Special Program in the Arts)

| Requirement | Type | Notes |
|---|---|---|
| BEEF | Form | Must specify Art Field (field 9.5) |
| Grade 6 SF9 | Document | |
| Portfolio (optional) | Document | Sample works in the declared art field; some schools require prior to audition day |
| Qualifying Exam Score | Assessed in school | Written test |
| Audition Result | Assessed in school | Per art field; assessed by subject teachers / judges |
| Interview Result | Assessed in school | |

**Additional system fields:**
- `artField` — Declared art specialization
- `qualifyingExamScore` — Score from written qualifying exam
- `auditionResult` — CLEARED / NOT CLEARED
- `interviewResult` — CLEARED / NOT CLEARED
- `overallResult` — PASSED / FAILED

---

### SPS (Special Program in Sports)

| Requirement | Type | Notes |
|---|---|---|
| BEEF | Form | Must list sports (field 9.6) |
| Grade 6 SF9 | Document | |
| Good Moral Character Certificate | Document | From Grade 6 principal or school head |
| Sports Achievement Records | Document | Certificates of participation in school-level or higher competitions |
| Medical Clearance | Document | Certificate from school physician or barangay health center |
| Physical Tryout Result | Assessed | Conducted by sports coaches |

**Additional system fields:**
- `sportsDisciplines` — Array of sports (e.g., ["Basketball", "Badminton"])
- `sportsAchievements` — Text notes on competition history
- `medicalClearance` — YES / NO / PENDING
- `tryoutResult` — PASSED / FAILED / NEEDS REASSESSMENT

---

### SPJ (Special Program in Journalism)

| Requirement | Type | Notes |
|---|---|---|
| BEEF | Form | Standard |
| Grade 6 SF9 | Document | |
| Recommendation Letter | Document | From Grade 6 school paper adviser or English teacher — must specify the student's writing ability and communication skills |
| SPJQE Exam Score | Assessed | Written qualifying examination covering journalism, English, news writing |
| Interview Result | Assessed | Assesses communication skills, current events awareness, reading habits |

**Additional system fields:**
- `recommendationLetter` — Confirmed received (YES / NO)
- `spjqeScore` — Numerical score
- `interviewResult` — CLEARED / NOT CLEARED
- `admissionRank` — Numerical rank among all SPJ applicants (top 35 admitted)

---

### SPFL (Special Program in Foreign Language)

| Requirement | Type | Notes |
|---|---|---|
| BEEF | Form | Must specify preferred language (field 9.7) |
| Grade 6 SF9 | Document | |
| NAT Result (if available) | Document | English subtest score used as screening basis |
| Grade 6 English Grade | System field | From SF9 — used if NAT result is unavailable |

**Additional system fields:**
- `preferredLanguage` — Japanese / Spanish / French / German / Mandarin / Korean
- `natEnglishScore` — NAT English subtest score (if available)
- `grade6EnglishGrade` — Final English grade from Grade 6 SF9

---

### SPTVE (Special Program in Technical-Vocational Education)

| Requirement | Type | Notes |
|---|---|---|
| BEEF | Form | Standard |
| Grade 6 SF9 | Document | |
| Aptitude Test Result | Assessed in school | School-determined; may be written or practical demonstration |
| Manual Dexterity Test | Assessed (some schools) | Practical skills test |

**Additional system fields:**
- `aptitudeScore` — Test score
- `aptitudeType` — WRITTEN / PRACTICAL / COMBINED
- `aptitudeResult` — PASSED / FAILED

---

### Grade 11 STEM (Academic Track — Placement Exam + Interview)

| Requirement | Type | Notes |
|---|---|---|
| BEEF | Form | Must show Track: Academic and Cluster: STEM |
| Grade 10 SF9 | Document | Must show Science ≥ 85 and Math ≥ 85 |
| Grade 10 Certificate of Completion | Document | Recommended |
| Placement Exam Score | Assessed | school-administered; Science and Mathematics |
| Interview Result | Assessed | Panel interview by school faculty |

**Minimum Grade 10 Grade Requirements for STEM (DepEd national standard):**
- Final Grade in Science: **85 and above**
- Final Grade in Mathematics: **85 and above**

**Additional system fields:**
- `grade10ScienceGrade` — Numeric (0–100)
- `grade10MathGrade` — Numeric (0–100)
- `grade10ScienceEligible` — Computed: true if ≥ 85
- `grade10MathEligible` — Computed: true if ≥ 85
- `placementExamScore` — Numeric
- `interviewDate` — Date
- `interviewResult` — CLEARED / NOT_CLEARED
- `overallResult` — PASSED / FAILED

---

## 7. Data Privacy Compliance (RA 10173)

> **See §0 for the full RA 10173 Privacy Notice** — including the complete notice text, consent field specification, legal basis for each data category, sensitive personal information handling rules, and the UX placement specification for the digital form.

This section summarizes the ongoing compliance obligations for the school after the form is submitted — covering how collected data must be handled throughout the learner's enrollment lifecycle, not just at the point of collection.

### 7.1 — RA 10173 Compliance Obligations Summary

| Obligation | Requirement | Section 0 Reference |
|---|---|---|
| **Informed consent before collection** | Full Privacy Notice must be displayed and consented to before any form field is filled | §0.2, §0.3 |
| **Collection limitation** | Collect only the fields listed in the official BEEF — no additional fields may be added by individual schools without DepEd authorization | §0.4 |
| **Purpose limitation** | Data collected on the BEEF may only be used for enrollment, LIS encoding, school communications, and DepEd program administration | §0.2 |
| **Data minimization** | Grade 10 grades collected only for STEM applicants; disability data collected only when LWD = Yes; SCP scores collected only for SCP applicants | §0.4 |
| **Retention limit** | All physical BEEF forms retained no longer than one (1) year; properly disposed of per DepEd Records Management Regulations | §0.2 |
| **Contact data restriction** | Phone numbers and email addresses used exclusively for school-to-parent communication — never shared with third parties | §0.2 |
| **PSA BC Number** | Sensitive PII — stored in LIS only; never written in public-facing system views; never included in audit log plaintext descriptions | §0.5 |
| **LRN** | PII — never exposed in public-facing URLs; never logged in plaintext in system audit logs beyond initial submission entry | §0.5 |
| **Disability data** | Sensitive Personal Information — access strictly restricted to Registrar, Class Adviser, School Head, and Guidance Counselor only | §0.5 |
| **IP and 4Ps data** | Sensitive Personal Information — used only for equity program tagging; never shared with non-DepEd entities | §0.5 |
| **Consent versioning** | Every submitted form records the privacy notice version consented to (`privacyConsentVersion` field) | §0.3 |
| **Data subject rights** | Applicants and parents may request access, rectification, or erasure by visiting the Registrar's Office or contacting the school's Data Privacy Officer | §0.2 |

### 7.2 — System-Level Enforcement

The admission system enforces RA 10173 compliance through the following technical controls:

| Control | Implementation |
|---|---|
| Consent gate | `privacyConsentGiven: z.literal(true)` Zod validation — API rejects any submission where consent is false |
| Consent audit trail | `privacyConsentTimestamp` and `privacyConsentVersion` stored in the `Applicant` record |
| SPI access restriction | Disability, IP, and 4Ps fields are not returned by default in the `GET /api/students` paginated list — only fetched on single-record `GET /api/applications/:id` by authenticated REGISTRAR or SYSTEM_ADMIN |
| PSA BC in audit logs | `auditLogger.ts` must never include the PSA BC number in the `description` field — use `PSA BC on file` as the log entry instead of the actual number |
| LRN in audit logs | LRN may be included in the initial `APPLICATION_SUBMITTED` log entry only; all subsequent logs reference the applicant by name and tracking number, not LRN |
| URL privacy | Applicant tracking uses `trackingNumber` (APP-YYYY-NNNNN) in public-facing URLs — never the applicant's `id`, `lrn`, or any PII |

---

## 8. Field-by-Field Mapping to LIS

When the registrar encodes the BEEF into the DepEd Learner Information System (LIS), each BEEF field maps to a corresponding LIS data field:

| BEEF Field | LIS Field Name | LIS Section |
|---|---|---|
| School Year | SY | Enrollment Record |
| LRN | Learner Reference Number | Learner Profile |
| Last Name | Last Name | Basic Profile |
| First Name | First Name | Basic Profile |
| Middle Name | Middle Name | Basic Profile |
| Extension Name | Extension | Basic Profile |
| Birthdate | Date of Birth | Basic Profile |
| Sex | Sex | Basic Profile |
| Place of Birth | Place of Birth | Basic Profile |
| Religion | Religion | Other Info |
| Mother Tongue | Mother Tongue | Other Info |
| IP Status | IP Tag | Equity Tags |
| 4Ps Status | 4Ps Tag + Household ID | Equity Tags |
| Disability | Disability Tag + Type | SPED Tags |
| Current Address | Current Address | Address |
| Permanent Address | Home Address | Address |
| Mother/Father/Guardian | Parent/Guardian Info | Family Info |
| Last School | Previous School | Enrollment History |
| Grade Level | Grade Level | Enrollment Record |
| SHS Track | Track | SHS Record |
| Elective Cluster | Strand/Program | SHS Record |

Note: For Senior High Schools participating in the Pilot Implementation of the Strengthened SHS Curriculum, encode Academic learners to General Academic Strand (GAS) and TechPro learners to Technical-Vocational-Livelihood (TVL) Track in LIS for the transition period.

---

## 9. Validation Rules for Each Field

These rules apply to both the paper BEEF (registrar-enforced) and the digital online admission portal (system-enforced):

| Field | Validation Rule |
|---|---|
| LRN | Exactly 12 numeric digits; no letters; no spaces; must not already exist in system under a different learner name (duplicate check) |
| Birthdate | Must be a valid calendar date; for Grade 7: learner must be at least 10 years old as of enrollment date; for Grade 11: learner must be at least 14 years old |
| First/Last Name | Letters only (including accented Filipino characters: ñ, á, é, í, ó, ú); no numbers; no special characters except hyphen for hyphenated names |
| Middle Name | Same as name; "N/A" accepted if learner has no middle name |
| Extension Name | Only: Jr. / Sr. / II / III / IV / V / N/A |
| Sex | Required; binary (Male / Female); must match PSA Birth Certificate |
| Email Address | Standard email format (user@domain.tld); validated as a real email format |
| Contact Number | Philippine mobile: `09XXXXXXXXX` (11 digits starting with 09); OR landline: `(0XX) XXXX-XXXX` |
| PSA BC Number | Alphanumeric; validated as non-empty if submitted |
| 4Ps Household ID | Numeric; required only if 4Ps = Yes |
| G10 Science/Math Grade | Numeric 0–100; must be ≥ 85 for STEM eligibility; system warns (not blocks) if below 85 |
| Exam Score | Numeric 0–100; required after exam is taken |
| Grade Level | Must be one of: Grade 7–12; system checks against the active academic year's configured grade levels |
| SHS Track | Required when Grade Level = Grade 11; must be one of: Academic / TechPro |
| Elective Cluster | Required when Grade Level = Grade 11; must be from the school's configured offered clusters |

---

## 10. System Design Notes for the Admission Portal

Based on the complete BEEF field analysis, the following design decisions apply to the school's online admission portal (`/apply`):

### Fields to Include in the Digital Portal

The portal should capture all BEEF fields. However, some fields that apply to lower grade levels (Kindergarten, Grades 1–6) are not relevant to the school (which starts at Grade 7) and should be omitted:

**Include (school-specific):**
- All of Section 1 (school year, LRN, PSA BC number)
- Section 2: Grade Level (7–12 only), SHS Track, Elective Cluster (conditional), SCP selection (conditional)
- All of Section 3 (personal information — all 11 fields)
- All of Section 4 (IP, 4Ps, disability, Balik-Aral)
- All of Section 5 (address — both current and permanent)
- All of Section 6 (parent/guardian — all three persons + email)
- Section 7 (previous school — all fields)
- Section 8 (SHS track/cluster fields — conditional on Grade 11)
- Section 9 (learner type, modality, SCP type)
- Section 10 (certification checkbox + date)

**Omit (not applicable to the school):**
- SNEd grade level specification (the school handles this offline)
- ALS-specific fields (the school does not offer ALS)
- Kindergarten age validation fields

### Step-by-Step Wizard Mapping

| Step | Fields Covered |
|---|---|
| **Step 1: Personal Information** | Sections 1 (Reference #s) + 3 (Personal info — all 11 fields) |
| **Step 2: Family & Contact** | Sections 4 (Special classifications) + 5 (Address) + 6 (Parent/Guardian info) |
| **Step 3: School & Enrollment Preferences** | Sections 2 (Grade/Program) + 7 (Previous school) + 8 (SHS-specific) + 9 (Learner type) + 10 (Certification) |

### Conditional Field Logic Summary

```
IF Grade Level = Grade 11
  → SHOW: SHS Track (Academic / TechPro)
  → SHOW: Elective Cluster (filtered by track and school config)
  → IF Cluster = STEM
      → SHOW: G10 Science Grade + G10 Math Grade
      → VALIDATE: both must be ≥ 85

IF Grade Level = Grade 7
  → SHOW: Application Type (Regular / SCP)
  → IF SCP selected
      → SHOW: SCP Type dropdown
      → IF SCP = SPA → SHOW: Art Field
      → IF SCP = SPS → SHOW: Sports multi-select
      → IF SCP = SPFL → SHOW: Preferred Language

IF Grade Level = Grade 12 (transferee only)
  → SHOW: Old Strand selector (STEM / ABM / HUMSS / GAS / TVL variants)
  → HIDE: SHS Track / Elective Cluster (new system)

IF IP = Yes → SHOW: IP Group Name field
IF 4Ps = Yes → SHOW: 4Ps Household ID field
IF LWD = Yes → SHOW: Disability Type multi-select + SNEd Placement
IF Balik-Aral = Yes → SHOW: Last Year Enrolled + Last Grade Level
IF Permanent Address ≠ Current → SHOW: Full Permanent Address fields
```

---

*Document compiled from:*
- *DepEd Order No. 017, s. 2025 — Revised Basic Education Enrollment Policy*
- *DepEd Memorandum No. 032, s. 2024 — BEEF form (Enclosure 1, latest template)*
- *DepEd Memorandum No. 012, s. 2026 — Strengthened SHS Curriculum (Grade 11 Track/Cluster fields)*
- *DepEd Memorandum No. 149, s. 2011 — Special Curricular Programs*
- *DepEd LIS Help Portal — lis.deped.gov.ph*
- *RA 10173 — Data Privacy Act of 2012*
- *RA 11909 — Permanent Validity of Civil Registry Documents Act*
- *DepEd CALABARZON Official Release, June 14, 2025*
- *Studocu — BEEF SY 2024–2025 form transcription (Father Saturnino Urios University)*