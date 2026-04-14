# MASTER JHS ENROLLMENT STORYBOARD (GRADES 7-10)

**Institution:** Enriqueta Montilla de Esteban Memorial High School  
**Alignment:** DepEd Order No. 3, s. 2018 and DepEd Memorandum No. 032, s. 2024  
**Scope:** BEC + STE, SPA, SPS, SPJ, SPFL, SPTVE

---

## PHASE 1: EARLY REGISTRATION AND DYNAMIC SCP SCREENING (JANUARY-MAY)

### Scene 1: Intake Gate
- Parent/guardian submits the Basic Education Early Registration Form for Incoming Grade 7.
- If no SCP is selected, status becomes `PRE_REGISTERED_BEC`.
- If SCP is selected, the learner enters Gate 1 prerequisite checks.

### Scene 2: Assessment Engine
- Program-specific assessment schedules are released by coordinators.
- Raw scores are encoded per SCP assessment type.

### Scene 3: Algorithmic Ranking
- Interview scores are encoded for all SCP applicants.
- Weighted result is computed per program:
  - `(Assessment * 60%) + (Interview * 20%) + (Q1/Q2 Avg * 20%)`
- Capacity-based rank cutoff is applied per program/section configuration.
- Qualifiers receive `[SCP]_QUALIFIED`; non-qualifiers auto-shift to `PRE_REGISTERED_BEC`.

---

## PHASE 2: OFFICIAL DEPED ENROLLMENT (JULY-AUGUST)

### Scene 4: Academic Validation and Form Completion
- Incoming Grade 7 and transferees complete BEEF and SF9 validation.
- Returning Grades 8-10 complete Confirmation Slip and SF9 validation.

### Scene 5: Brigada Assessments
- Brigada Pagbasa and Brigada Kalusugan data are encoded in SIMS.

### Scene 6: Sorting Engine Trigger
- Enrollment finalization flips learner status to `ENROLLED`.
- Sectioning executes with strict priority:
  1. SCP hard-cap placement
  2. BEC homogeneous placement (Sections 1-5)
  3. BEC heterogeneous placement (Section 6+)

### Scene 7: Compliance and LIS Sync
- Missing PSA/SF9 cases are tracked as `TEMPORARILY_ENROLLED` until October 31.
- Finalized records are prepared for LIS BOSY synchronization.

---

_Storyboard Version: 5.0.0_

