# Capstone Screenshot Narrative Implementation Pack - JHS Blueprint

## 1. Structural Strategy

Use a hybrid sequence:
1. Public journey screens
2. Registrar workflow screens
3. System administration screens
4. Objective mapping and progress summary

This keeps the report readable while preserving measurable objective traceability.

## 2. Objective Labels

- **OBJ-01:** Early Registration (Incoming Grade 7, Online + F2F)
- **OBJ-02:** Dynamic SCP screening pipeline (STE/SPA/SPS/SPJ/SPFL/SPTVE)
- **OBJ-03:** Official enrollment pathways (Incoming, Returning Grades 8-10, Transferees)
- **OBJ-04:** Sectioning engine and SF1-ready roster output
- **OBJ-05:** Compliance and continuity controls

## 3. Narrative Block Template (Copy Ready)

For each screenshot:

**Page Title:**  
[insert]

**UI Description (1 sentence):**  
[insert concise UI layout summary]

**Functional Discussion (3-4 sentences):**  
[insert behavior-focused explanation tied to objective coverage and current maturity]

**Objective Mapping:**  
[OBJ-xx]

**Progress Status:**  
Implemented / WIP Placeholder

## 4. Recommended Module Order

1. PUB-01 `/apply`
2. PUB-02 `/learner`
3. REG-01 `/dashboard`
4. REG-03 `/early-registration`
5. REG-04 `/early-registration/pipelines`
6. REG-05 `/early-registration/:id`
7. REG-06 `/enrollment`
8. REG-08 `/students`
9. REG-10 `/sections`
10. ADM-03 `/audit-logs`
11. ADM-04 `/admin/email-logs`

## 5. Quality Checks Before Submission

- Remove any out-of-scope grade-band references.
- Keep policy language aligned to the JHS two-phase blueprint.
- Use canonical lifecycle labels where applicable.
- Mark WIP modules explicitly without overstating completion.

_Pack Version: 5.0.0_
