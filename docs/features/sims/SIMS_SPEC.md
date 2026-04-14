# Student Information Management System (SIMS) Specification - Enriqueta JHS Multi-SCP

> Status: Legacy target-state planning document.
> For implementation-aligned behavior, see [MODULE_3_SIMS_IMPLEMENTATION_SPEC.md](MODULE_3_SIMS_IMPLEMENTATION_SPEC.md).

**Document Version:** 5.0.0  
**Institution:** Enriqueta Montilla de Esteban Memorial High School  
**Module:** SIMS (`/students`)

---

## 1. Multi-Year Learner Record

SIMS is the source of truth for learner continuity across Grades 7-10.  
It stores enrollment lifecycle data, SCP screening outcomes, Brigada results, and section history.

---

## 2. Phase 2 Brigada Data Capture

During July-August enrollment finalization, SIMS captures:

### 2.1 Brigada Pagbasa

- `reading_level_english`
- `reading_level_filipino`

### 2.2 Brigada Kalusugan

- `height_cm`
- `weight_kg`
- computed `bmi`

---

## 3. Enrollment Continuity and SF10 Workflow

For transferees finalized as `ENROLLED`:

- trigger formal SF10 request workflow
- track request status in learner records
- keep parents out of inter-school transmission flow

---

## 4. Sectioning and School Register Integration

After enrollment finalization, SIMS consumes section assignments from the sorting engine and prepares School Form 1-compatible records for registrar and LIS workflows.

---

## 5. Compliance Tracking

SIMS tracks `TEMPORARILY_ENROLLED` cases and surfaces deadline reminders for documentary completion up to October 31.

---

_Document v5.0.0_  
_Institution: Enriqueta Montilla de Esteban Memorial High School_  
_Subject: SIMS baseline for JHS enrollment, continuity, and compliance tracking_
