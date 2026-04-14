# Product Requirements Document (PRD): Enriqueta Montilla de Esteban Memorial High School

> Status: Legacy target-state planning document.
> For current implemented behavior, use [../README.md](../README.md) and [CODEBASE_AUDIT_IMPLEMENTATION_BASELINE.md](CODEBASE_AUDIT_IMPLEMENTATION_BASELINE.md).

**Project Name:** EnrollPro: Digital Platform for Optimized Early Registration and Enrollment
**Institution:** Enriqueta Montilla de Esteban Memorial High School
**Document Version:** 5.0.0
**Status:** Aligned with JHS All-SCP Master Blueprint (Grades 7-10)
**Policy Basis:** DepEd Order No. 3, s. 2018 & DepEd Memorandum No. 032, s. 2024
**Stack:** PERN (PostgreSQL 18 · Express.js 5.1 · React 19.x · Node.js 22 LTS)

---

## 1. Project Overview

EnrollPro is a specialized enrollment management platform engineered for **Enriqueta Montilla de Esteban Memorial High School**. It handles the end-to-end journey for Junior High School (Grades 7-10), specifically focusing on the transition from Early Registration (Jan-May) to Official Enrollment (July). The system automates strict algorithmic screening for all Special Curricular Programs (SCPs) and implements an autonomous tiered sectioning engine for the Basic Education Curriculum (BEC).

### Core Objectives:

- **Phase 1 Automation:** Dynamic demographic capture and specialized SCP screening pipelines.
- **Phase 2 Validation:** Official academic verification, Brigada assessment integration, and finalized school rosters.
- **Sorting Engine:** Autonomous, priority-based sectioning (SCP Hard Caps, BEC Star Sections, and Heterogeneous distribution).
- **Compliance:** 100% enforcement of DepEd "No Collection Policy" (DO 19, s. 2008) and LIS data synchronization.

---

## 2. Dynamic Form Routing Engine

The system serves the correct digital form based on the learner category and DepEd timeline phase:

| Phase                 | Target Learner                   | Form Served                                 |
| --------------------- | -------------------------------- | ------------------------------------------- |
| **Phase 1 (Jan-May)** | Incoming Grade 7                 | **Basic Education Early Registration Form** |
| **Phase 2 (July)**    | Incoming Grade 7 & Transferees   | **Basic Education Enrollment Form (BEEF)**  |
| **Phase 2 (July)**    | Returning Learners (Grades 8-10) | **Confirmation Slip**                       |

---

## 3. The Two-Phase Enrollment Lifecycle

### Phase 1: Early Registration & Dynamic SCP Screening (January – May)

- **Pathway A (BEC):** Captures predictive demographics; status set to `PRE_REGISTERED_BEC`.
- **Pathway B: The SCP Funnel:**
  - **Programs:** STE, SPA, SPS, SPJ, SPFL, SPTVE.
  - **Prerequisites:** Grade 6 average (usually 85%) and documentary checks (Medical Cert, Good Moral, Portfolios).
  - **Assessment:** Specialized tests per program (Written, Audition, Physical, Writing, Aptitude).
  - **Ranking Algorithm:** `(Assessment * 60%) + (Interview * 20%) + (Q1/Q2 Avg * 20%)`.
  - **Outcome:** Top candidates tagged as `[SCP]_QUALIFIED` (e.g., `SPA_QUALIFIED`). Remainder shifted to `PRE_REGISTERED_BEC`.

### Phase 2: Official DepEd Enrollment (July – August)

- **Incoming G7 / Transferees:** Validate finalized SF9 (Report Card), input `final_general_average`, check "Promoted", complete full BEEF, and capture Brigada Pagbasa & Kalusugan -> `ENROLLED`.
- **Returning Learners:** Fast-track using SF9 and Confirmation Slip. Status flips to `ENROLLED` if retention grades are met.
- **Transferees:** SIMS automatically generates a formal request for SF10 upon hitting `ENROLLED` status.

---

## 4. Autonomous Sorting Engine (Sectioning)

Once status hits `ENROLLED`, the system builds the official School Form 1 (SF1) according to this hierarchy:

1.  **Priority 1: SCP Placement (Hard Caps):** Fills SCP sections strictly using learners tagged as `QUALIFIED` for their respective programs (STE, SPA, SPS, etc.). Class sizes are locked to program maximums.
2.  **Priority 2: BEC Homogeneous (Star Sections):** Fills Sections 1 through 5 by ranking remaining BEC learners by their `final_general_average` (Descending).
3.  **Priority 3: BEC Heterogeneous (Standard):** Distributes all remaining learners evenly (round-robin) across Section 6 and beyond.

---

## 5. Compliance & Exception Protocols

- **The "No Collection" Lock:** No financial modules exist; progression is strictly performance and compliance based.
- **Documentary Grace Period:** Learners missing PSA/SF9 are tagged as `TEMPORARILY_ENROLLED` with an October 31 compliance timer.
- **LIS Synchronization:** Data structured natively to match DepEd LIS Beginning of School Year (BOSY) update schemas.

---

_PRD v5.0.0_
_Scope: Admission (Online + F2F) · Enrollment Management · SIMS · Teacher Management · Sectioning Management_
_Institution: Enriqueta Montilla de Esteban Memorial High School_
