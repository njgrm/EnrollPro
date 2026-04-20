# SCP Storyboard - Dynamic Screening Funnel (JHS)

> Status: Legacy target-state planning document.
> For implementation-aligned module behavior, see [MODULE_1_EARLY_REGISTRATION_IMPLEMENTATION_SPEC.md](MODULE_1_EARLY_REGISTRATION_IMPLEMENTATION_SPEC.md).

**Document Version:** 5.0.0  
**Scope:** STE, SPA, SPS, SPJ, SPFL, SPTVE  
**Primary Actor:** Registrar and SCP Coordinators

---

## 1. Scenario: Multi-SCP Qualification Flow

1. Incoming Grade 7 learner selects an SCP during Early Registration.
2. Gate 1 validates `grade_6_q1_q2_average` and required program documents.
3. Gate 2 captures program-specific assessment score.
4. Gate 3 captures interview score.
5. System computes weighted result:
   - `(Assessment * 60%) + (Interview * 20%) + (Q1/Q2 Avg * 20%)`
6. System applies configured capacity cutoff.
7. Learner is tagged as `[SCP]_QUALIFIED` or redirected to `PRE_REGISTERED_BEC`.

---

## 2. Scenario: SPS Documentary Barrier

1. Learner selects SPS.
2. System requires medical certificate and sports evidence upload.
3. If required evidence is missing, workflow remains blocked until completion.
4. Only complete records proceed to assessment scheduling.

---

## 3. Scenario: Capacity-Based BEC Redirection

1. Learner passes Gate 1 and Gate 2 but does not rank within configured section capacity.
2. System auto-updates status from screening state to `PRE_REGISTERED_BEC`.
3. Learner remains eligible for July official enrollment through BEC pathway.

---

_Document v5.0.0_  
_Subject: Scenario-based reference for the JHS SCP intake and ranking flow_
