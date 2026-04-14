# Email System - Enriqueta JHS Enrollment Implementation

**Document Version:** 5.0.0  
**Institution:** Enriqueta Montilla de Esteban Memorial High School  
**Project:** EnrollPro

---

## 1. Transactional Trigger Matrix

| Trigger | Recipient | Required Message Outcome |
| --- | --- | --- |
| **Phase 1 Submission** | Parent/Guardian | Confirms Early Registration receipt and tracking reference |
| **Assessment Schedule Published** | Parent/Guardian | Announces program-specific assessment schedule (STE/SPA/SPS/SPJ/SPFL/SPTVE) |
| **Qualification Result** | Parent/Guardian | Announces `[SCP]_QUALIFIED` result or BEC fallback (`PRE_REGISTERED_BEC`) |
| **Phase 2 Enrollment Finalized** | Parent/Guardian | Confirms `ENROLLED` status and section assignment |
| **Documentary Grace Reminder** | Parent/Guardian | Reminds `TEMPORARILY_ENROLLED` documentary deadline (October 31) |

---

## 2. Template Rules

All templates must include:
- official school identity header
- concise status explanation tied to system lifecycle labels
- no-fee / no-collection compliance language where relevant

---

## 3. Technical Implementation Notes

- Email rendering stack may use React Email + Nodemailer
- Dispatch should be asynchronous to avoid blocking enrollment workflows
- Delivery logs must be persisted for administrative audit visibility

---

_Document v5.0.0_  
_Institution: Enriqueta Montilla de Esteban Memorial High School_  
_Subject: Enrollment communication policy for JHS all-SCP lifecycle events_
