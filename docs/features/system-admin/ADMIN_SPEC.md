# System Administrator Role Specification (JHS Multi-SCP Governance)

> Status: Legacy target-state planning document.
> For implementation-aligned role and governance baseline, see [../../core/SECURITY_AUDIT_TRAIL_BASELINE.md](../../core/SECURITY_AUDIT_TRAIL_BASELINE.md).

## Enriqueta Montilla de Esteban Memorial High School

**Document Version:** 5.0.0  
**Primary Actor:** System Admin

---

## 1. Form Routing and Timeline Governance

The System Admin configures and safeguards timeline-gated form routing:

- **Jan-May:** Basic Education Early Registration Form (Incoming Grade 7 only)
- **July:** Basic Education Enrollment Form (Incoming Grade 7 and all Transferees)
- **July:** Confirmation Slip route (Returning/Promoted Grades 8-10)

---

## 2. SCP Screening Governance (Phase 1)

The System Admin governs all six SCP pipelines (STE, SPA, SPS, SPJ, SPFL, SPTVE):

- Configure Gate 1 prerequisites (including required documents and grade checks).
- Configure Gate 2 assessment types per program.
- Configure Gate 3 weighted ranking model used by the system:
  - `(Assessment * 60%) + (Interview * 20%) + (Q1/Q2 Avg * 20%)`
- Enforce capacity-based qualification cutoffs per program section configuration.

---

## 3. Enrollment and Sectioning Governance (Phase 2)

- Ensure final enrollment requires SF9 validation, final general average input, and promoted confirmation.
- Enforce sectioning hierarchy after status flips to `ENROLLED`:
  1. SCP qualified placement (hard caps)
  2. BEC homogeneous placement (Sections 1-5 by descending final average)
  3. BEC heterogeneous placement (Section 6+ round-robin balance)

---

## 4. Compliance and Continuity Controls

- Enforce no fee collection workflows (No Collection policy compliance).
- Enable `TEMPORARILY_ENROLLED` documentary grace handling with October 31 monitoring.
- Ensure LIS-ready BOSY export structure for finalized `ENROLLED` records.
- Ensure transferee finalization triggers formal SF10 request workflow.

---

## 5. Role Interaction Matrix

| Role                | Core Responsibility                                 |
| ------------------- | --------------------------------------------------- |
| **SYSTEM_ADMIN**    | Governance, configuration, and compliance oversight |
| **REGISTRAR**       | Intake, validation, and enrollment finalization     |
| **SCP_COORDINATOR** | Program-specific assessment and interview encoding  |
| **BRIGADA_TEACHER** | Pagbasa input in SIMS                               |
| **CLINIC_STAFF**    | Kalusugan input in SIMS                             |

---

_Document v5.0.0_  
_Institution: Enriqueta Montilla de Esteban Memorial High School_  
_Subject: Admin governance for JHS all-SCP enrollment operations_
