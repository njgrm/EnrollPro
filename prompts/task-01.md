# UI/UX & Feature Implementation Prompt: Grade Level Masterlist Export

**Target System:** EnrollPro: Academic Institution's Digital Platform  
**Target Module:** Section Assignment (Grade Level Tab)  
**Reference Image:** `image_35fafe.jpg`  
**Context:** Department of Education (DepEd) JHS Public School System  

---

Copy and paste the prompt below to instruct your AI agent or frontend/backend development team on how to execute this feature.

***

**Act as a Senior UI/UX Engineer and Full-Stack Developer specializing in EdTech systems.**

Your task is to implement a batch export feature (PDF and XLSX) for the finalized Grade Level Masterlist in the Section Assignment module. In a public DepEd high school environment, once the Grade Level Coordinator finishes allocating all learners to their respective sections, they need a consolidated master report of the entire grade level for distribution to Class Advisers and the Registrar.

Please implement the interface and data export logic using the following comprehensive guidelines:

### 1. UI Layout & Component Positioning
*   **Location:** In the right-hand panel of the Section Assignment module, locate the "AVAILABLE SECTIONS" header[cite: 19]. Place a button group aligned to the right of this header (or immediately below it, replacing the placeholder text seen in the red box area)[cite: 19].
*   **Component:** Use the existing design system's outlined button component with a trailing download icon (e.g., `<Button variant="outline" icon={<DownloadIcon />}>`). 
*   **Buttons:** Create two separate buttons or a single "Export Grade Level" dropdown button containing two actions:
    *   `Download Masterlist (PDF)`
    *   `Download Masterlist (XLSX)`
*   **Conditional Rendering (State Guard):** These export buttons must be **disabled** or hidden if there are still learners listed in the left-hand "LEARNERS READY FOR SECTIONING" panel[cite: 19]. They should only become active when the unassigned pool is empty (displaying "No pending unassigned learners")[cite: 19], indicating that the grade level's sectioning is finalized.

### 2. Export Data Mapping & DepEd Formatting Standards
When generating the exported document, the backend/client-side generator must map the data according to standard DepEd sorting rules. 

**Critical Scope Constraint:** Do *not* attempt to format this export as an official DepEd School Form 1 (SF1). This is an internal system masterlist. SF1 generation involves complex margins, biometric data, and specific DepEd boilerplate that is strictly outside the current system boundaries.

**Data Sorting Rules (Must Apply to Both PDF & XLSX):**
1.  **Group By:** Program Type (e.g., STE, BEC)[cite: 19], then by Section Name (e.g., BONIFACIO)[cite: 19] alphabetically.
2.  **Sort By Sex:** Within each section, list all Male learners first, followed by Female learners (DepEd standard).
3.  **Sort By Name:** Alphabetical order by Last Name within each sex grouping.

### 3. XLSX (Excel) Structure Requirements
Use a library like `xlsx` or `exceljs`.
*   **Worksheets:** Create a single worksheet for the entire grade level.
*   **Headers:** Include columns: `No.`, `LRN`, `Last Name`, `First Name`, `Middle Initial`, `Sex`, `Section`, `Program`, `Adviser`. Freeze the top header row.
*   **Data Type Protection:** The `LRN` column must explicitly be formatted as `Text` (or pre-pended with a single quote ` ' ` during generation). LRNs are 12 digits long; standard Excel number formatting will convert them to scientific notation or truncate them, corrupting the data.

### 4. PDF Structure Requirements
Use a library like `jspdf` with `jspdf-autotable` or generate via backend HTML-to-PDF.
*   **Document Header:** Include the school name (Enriqueta Montilla de Esteban Memorial High School), the module name (Grade [X] Section Assignment Masterlist), and the Academic Year[cite: 19].
*   **Layout:** Use a clean, banded-row table format. 
*   **Section Breaks:** Render a sub-header row spanning all columns every time the list transitions to a new section (e.g., a dark gray row reading: **SECTION: BONIFACIO | ADVISER: AGUILAR, CARLO MIGUEL**)[cite: 19].
*   **Summary Footer:** At the absolute bottom of the document, generate a summary block displaying the total number of enrolled learners broken down by Program Type and Sex.