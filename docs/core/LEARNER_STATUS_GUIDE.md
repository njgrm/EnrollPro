# Learner Status Guide (Implementation-Aligned)

Last updated: 2026-04-14

## 1. Quick reference

| Label                | System status        | Meaning                                                |
| -------------------- | -------------------- | ------------------------------------------------------ |
| Submitted            | SUBMITTED            | Intake received, waiting for review                    |
| Under Review         | UNDER_REVIEW         | Staff validation in progress                           |
| For Revision         | FOR_REVISION         | Needs applicant record correction                      |
| Eligible             | ELIGIBLE             | Cleared for next screening/enrollment action           |
| Assessment Scheduled | ASSESSMENT_SCHEDULED | Assessment event scheduled                             |
| Assessment Taken     | ASSESSMENT_TAKEN     | Assessment completed and pending decision              |
| Passed               | PASSED               | Passed current assessment stage                        |
| Interview Scheduled  | INTERVIEW_SCHEDULED  | Interview stage active                                 |
| Pre-Registered       | PRE_REGISTERED       | Approved for enrollment finalization                   |
| Temporarily Enrolled | TEMPORARILY_ENROLLED | Enrolled with pending mandatory documentary completion |
| Not Qualified        | NOT_QUALIFIED        | Did not qualify for current screening path             |
| Enrolled             | ENROLLED             | Finalized official enrollment                          |
| Rejected             | REJECTED             | Application rejected by staff decision                 |
| Withdrawn            | WITHDRAWN            | Application withdrawn                                  |

## 2. Typical path examples

Regular pathway:

SUBMITTED -> UNDER_REVIEW -> PRE_REGISTERED -> ENROLLED

Screening pathway:

SUBMITTED -> UNDER_REVIEW -> ELIGIBLE -> ASSESSMENT_SCHEDULED -> ASSESSMENT_TAKEN -> PASSED -> PRE_REGISTERED -> ENROLLED

Compliance pathway:

PRE_REGISTERED -> TEMPORARILY_ENROLLED -> ENROLLED

## 3. Legacy terminology note

Some previous docs use PRE_REGISTERED_BEC and [SCP]\_QUALIFIED terms.

Current code and UI use PRE_REGISTERED and NOT_QUALIFIED/PASSED stage semantics.
