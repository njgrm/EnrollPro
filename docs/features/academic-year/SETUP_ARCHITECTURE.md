# Academic Year Setup Architecture - Junior High School (Grades 7-10)

**Document Version:** 5.0.0  
**Institution:** Enriqueta Montilla de Esteban Memorial High School  
**System:** EnrollPro

---

## 1. Operational Timeline Configuration

| Phase | Timeline | Primary Objective |
| --- | --- | --- |
| **Phase 1** | January-May | Early registration intake and SCP screening for Incoming Grade 7 |
| **Phase 2** | July-August | Official enrollment validation, Brigada inputs, and sectioning finalization |

---

## 2. Program Setup Matrix

Each academic year must activate:
- **BEC** (regular pathway)
- **STE**
- **SPA**
- **SPS**
- **SPJ**
- **SPFL**
- **SPTVE**

Required controls:
- Gate 1 prerequisites and documentary requirements
- Gate 2 assessment type per program
- Gate 3 ranking weights and capacity limits per section/program

---

## 3. Sectioning Logic Configuration

Sectioning triggers only when learner status is finalized to `ENROLLED`.

Execution order:
1. **Priority 1 - SCP Placement:** Fill SCP sections from `[SCP]_QUALIFIED` learners within configured hard caps.
2. **Priority 2 - BEC Homogeneous Placement:** Sort remaining BEC pool by descending `final_general_average` into Sections 1-5.
3. **Priority 3 - BEC Heterogeneous Placement:** Distribute remaining learners across Section 6+ using round-robin balancing.

---

## 4. Compliance Controls

- **No Collection Lock:** no fee-tagging or collection logic in enrollment workflows.
- **Documentary Grace Period:** allow `TEMPORARILY_ENROLLED` for missing PSA/SF9 with deadline monitoring until October 31.
- **LIS Synchronization:** ensure all finalized records remain BOSY-compatible.

---

_Document v5.0.0_  
_Institution: Enriqueta Montilla de Esteban Memorial High School_  
_Subject: Academic year configuration for JHS all-SCP enrollment flow_
