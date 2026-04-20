# DepEd Enrollment Process: Policy Reference (JHS Blueprint)

**Document Version:** 5.0.0
**Institution:** Enriqueta Montilla de Esteban Memorial High School
**Policy Basis:** DepEd Order No. 3, s. 2018 · DepEd Memorandum No. 032, s. 2024
**Scope:** Grades 7-10 (BEC, STE, SPA, SPS, SPJ, SPFL, SPTVE)

---

## 1. Timeline & Form Routing

The system enforces DepEd compliance by dynamically serving forms based on the school calendar:

| Timeline | Process Stage | Mandatory Form |
|---|---|---|
| **Jan – May** | Early Registration | **Early Registration Form** (Predictive Demographics). |
| **July – Aug** | Official Enrollment | **BEEF** (SF1 Data) or **Confirmation Slip** (Promoted). |

---

## 2. Compliance Protocols

### 2.1 No Collection Policy (DO 19, s. 2008)
The system is explicitly engineered without payment gateways or fee-tagging modules. No learner can be blocked from status progression due to financial reasons.

### 2.2 Documentary Grace Period
Per DepEd guidelines, learners lacking PSA/SF9 in July are allowed to attend classes.
- **Status:** `TEMPORARILY_ENROLLED`.
- **Compliance Lock:** System timer flags missing documents for October 31 finalization.

### 2.3 Record Continuity
For JHS Transferees, the system automates the **SF10 Request** process, ensuring record continuity between origin and receiving schools without placing the burden on parents.

---

## 3. Autonomous Sorting Engine (Sectioning)

Once enrollment is finalized, the system builds the **School Form 1 (School Register)**:
1.  **Priority 1: Hard Caps (SCP):** STE, SPA, SPS, etc., filled strictly by qualifiers.
2.  **Priority 2: BEC Homogeneous (Star Sections):** Top 5 sections filled by academic rank.
3.  **Priority 3: BEC Heterogeneous (Standard):** Remaining sections balanced via round-robin.

---

_Document v5.0.0_
_Institution: Enriqueta Montilla de Esteban Memorial High School_
_Subject: Policy Alignment Reference for JHS Operations_
