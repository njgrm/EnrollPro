# Spec-Driven Development Guide - EnrollPro JHS Blueprint

**Document Version:** 5.0.0  
**Institution:** Enriqueta Montilla de Esteban Memorial High School  
**Scope:** Junior High School (Grades 7-10), BEC + STE/SPA/SPS/SPJ/SPFL/SPTVE

---

## 1. Purpose

This guide defines how EnrollPro changes are designed and implemented without drifting from the approved JHS master enrollment blueprint.

---

## 2. Non-Negotiable Baseline

Every approved spec must preserve:
1. Form routing windows (Jan-May Early Registration, July BEEF, July Confirmation Slip)
2. Phase 1 and Phase 2 pathway behavior
3. SCP gate model (Prerequisites -> Assessment -> Interview/Ranking)
4. Sectioning hierarchy (SCP hard caps -> BEC homogeneous -> BEC heterogeneous)
5. Compliance controls (No Collection, documentary grace period, LIS-ready outputs)

---

## 3. Required Spec Sequence

1. Define requirement scope and exclusions.
2. Write/update feature spec with acceptance criteria.
3. Align shared schema/contracts before implementation.
4. Implement backend behavior.
5. Implement frontend behavior.
6. Verify acceptance criteria and policy alignment.
7. Update docs affected by behavior change.

---

## 4. Documentation Alignment Rule

Whenever behavior changes, documentation under `docs/` must be updated in the same change set to keep policy, UX, and technical references synchronized with the active blueprint.

---

## 5. Drift Prevention Checklist

Before closing a change, verify docs do not reintroduce:
- out-of-scope grade-band or curriculum references in JHS-only workflows
- fixed qualifier thresholds that ignore configured section capacities
- status labels outside canonical lifecycle terms
- timeline or form-routing text that conflicts with DepEd-aligned phases

---

_Document v5.0.0_  
_Institution: Enriqueta Montilla de Esteban Memorial High School_  
_Subject: SDD guardrails for JHS blueprint fidelity_
