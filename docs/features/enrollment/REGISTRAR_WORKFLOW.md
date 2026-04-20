# Registrar Workflow - Enriqueta JHS Multi-SCP Framework

> Status: Legacy target-state planning document.
> For implementation-aligned workflow behavior, see [MODULE_2_ENROLLMENT_IMPLEMENTATION_SPEC.md](MODULE_2_ENROLLMENT_IMPLEMENTATION_SPEC.md).

**Document Version:** 5.0.0  
**Primary Actor:** School Registrar and Program Coordinators

---

## 1. Phase 1 Operations (January-May)

### 1.1 Intake and Gate 1 Validation

1. Capture Early Registration submission for Incoming Grade 7.
2. Validate LRN and core learner profile data.
3. If SCP is selected, require prerequisite grades/documents.
4. If no SCP path is pursued, set status to `PRE_REGISTERED_BEC`.

### 1.2 Gate 2 and Gate 3 Processing

1. Coordinate program-specific assessment scheduling.
2. Encode assessment and interview scores.
3. Run weighted computation:
   - `(Assessment * 60%) + (Interview * 20%) + (Q1/Q2 Avg * 20%)`
4. Apply capacity cutoff per program; set outcome status:
   - qualifier: `[SCP]_QUALIFIED`
   - non-qualifier: `PRE_REGISTERED_BEC`

---

## 2. Phase 2 Operations (July-August)

### 2.1 Incoming Grade 7 and Transferees

1. Validate final SF9 and promoted standing where required.
2. Complete BEEF.
3. Confirm Brigada Pagbasa and Brigada Kalusugan encoding.
4. Finalize enrollment and set `ENROLLED`.

### 2.2 Returning Learners (Grades 8-10)

1. Validate SF9 and Confirmation Slip.
2. Update grade level and final average.
3. Apply SCP retention rules when applicable.
4. Finalize enrollment and set `ENROLLED`.

---

## 3. Compliance and Record Continuity

- Missing PSA/SF9 at finalization: set `TEMPORARILY_ENROLLED` and track October 31 compliance deadline.
- Transferee finalization to `ENROLLED` triggers formal SF10 request workflow.

---

_Document v5.0.0_  
_Subject: Registrar operating flow for JHS multi-SCP enrollment lifecycle_
