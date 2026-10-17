# UI/UX & Full-Stack Implementation Prompt: SF1 & SF7 Bulk Import System

**Target System:** EnrollPro: DepEd Junior High School System  
**Target Modules:** System Configuration, Personnel Directory, Class Sections  
**Reference Files:** `image_076c02.jpg`, `blank_sf1.xlsx`, `School Form 7 (SF7) School Personnel Assignment List and Basic Profile.xlsx`  

---

**Act as a Senior Full-Stack Engineer and UI/UX Designer.**

Your task is to implement a bulk data import system for official DepEd School Forms (SF1 and SF7). This feature will allow System Administrators to rapidly seed the database at the Beginning of the School Year (BOSY) without manual data entry.

Please implement the interface, data mapping, and routing logic using the following guidelines:

### 1. UI Placement: System Configuration (Primary Hub)
*   **Location:** Navigate to the `System Configuration` page, under the `SCHOOL PROFILE` tab[cite: 49].
*   **New Component:** Below the "Special Curricular Program (SCP) Configuration" card[cite: 49], create a new full-width card titled **"DepEd Forms Bulk Import"**.
*   **Design:** Inside this card, create two distinct drag-and-drop upload zones (side-by-side using CSS Grid/Flexbox):
    *   **Zone A (SF1):** Titled "Upload School Form 1 (Learner Register)". Accept only `.xlsx` and `.xls`.
    *   **Zone B (SF7):** Titled "Upload School Form 7 (Personnel List)". Accept only `.xlsx` and `.xls`.
*   **Feedback:** Add a progress bar component that appears during the upload, transitioning to a green success banner displaying the total rows successfully parsed (e.g., "Success: 40 Learners imported").

### 2. Contextual UI Shortcuts (Module Level)
To improve user experience, add quick-access import triggers in the target modules:
*   **Personnel Directory:** Add a ghost button or dropdown option labeled `Import SF7 Masterlist` immediately to the left of the solid red `+ ADD PERSONNEL` button. Clicking this opens a standard file upload modal.
*   **Class Sections:** Inside each section card (e.g., "BONIFACIO"), add a small upload icon next to the "Open SF1 Masterlist" button. Clicking this opens a modal specifically to upload an SF1 just for that section.

### 3. Backend Data Parsing & Routing Logic (SF7)
When a user uploads `School Form 7 (SF7) School Personnel Assignment List and Basic Profile.xlsx`:
*   **Handling Merged Headers:** DepEd Excel templates contain merged cells in the top 4-5 rows. Configure the backend parser (e.g., Pandas or SheetJS) to skip the visual headers and target the actual data rows.
*   **Data Extraction:** Extract the `Employee No.`, `Name of Personnel`, `Position/Designation`, and `Nature of Appointment/Employment Status`.
*   **Data Insertion:** Insert these records directly into the **Personnel Directory** database table. Ensure `Employee No.` is used as the unique identifier to prevent duplicate profiles if the file is re-uploaded.

### 4. Backend Data Parsing & Routing Logic (SF1)
When a user uploads `blank_sf1.xlsx`:
*   **Header Metadata:** Extract the `Grade Level` and `Section` from the spreadsheet's header block (usually found in rows 2-3).
*   **Data Extraction:** Extract the `LRN (12-digit)`, `Name`, `Sex`, `Birth Date`, and `Mother Tongue` from the data rows.
*   **Dual Insertion (Routing):** 
    1.  Insert all extracted students into the global **Learner Directory** database table using the LRN as the unique primary key.
    2.  Automatically insert these learners into the specific **Class Section** identified in the spreadsheet header, marking their status as "Enrolled."