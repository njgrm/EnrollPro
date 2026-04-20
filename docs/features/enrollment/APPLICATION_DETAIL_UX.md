# Application Detail UI/UX Specification - JHS Multi-SCP Framework

**Document Version:** 5.0.0  
**Institution:** Enriqueta Montilla de Esteban Memorial High School  
**Module:** Enrollment Management

---

## 1. Phase 1 Review Panel (SCP Screening)

For any SCP applicant (STE, SPA, SPS, SPJ, SPFL, SPTVE), the detail page must expose:
- Gate 1 prerequisite and documentary checklist state
- Gate 2 assessment score entry and validation
- Gate 3 interview score entry
- computed weighted score and capacity-aware ranking result

Default ranking model shown to staff:
- `(Assessment * 60%) + (Interview * 20%) + (Q1/Q2 Avg * 20%)`

---

## 2. Phase 2 Review Panel (Official Enrollment)

The finalization panel must require:
- `final_general_average`
- promoted confirmation flag
- Brigada Pagbasa completion state
- Brigada Kalusugan completion state

Finalization action flips learner to `ENROLLED` and triggers sectioning logic.

---

## 3. Lifecycle Status Badge Rules

- `PRE_REGISTERED_BEC`
- `[SCP]_QUALIFIED`
- `TEMPORARILY_ENROLLED`
- `ENROLLED`

Badges must use consistent semantic colors across registrar and SIMS modules.

---

_Document v5.0.0_  
_Institution: Enriqueta Montilla de Esteban Memorial High School_  
_Subject: UI behavior for intake adjudication and enrollment finalization_
