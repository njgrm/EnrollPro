# UI/UX Refactoring Prompt: Cascading Section Filters for Learner Enrollment

**Target System:** EnrollPro: Academic Institution's Digital Platform  
**Target Module:** Learner Enrollment (Continuing Learners Tab)  
**Reference Image:** `image_20cbbd.jpg`  
**Context:** Department of Education (DepEd) JHS Public School System  

---

Copy and paste the prompt below to instruct your AI agent or frontend development team on how to execute this UI refactoring.

***

**Act as a Senior UI/UX Engineer and Frontend Developer specializing in data-heavy EdTech interfaces.**

Your task is to refactor the filter popover in the Learner Enrollment module (Continuing Learners tab). Currently, the system uses a single, flat dropdown labeled "ALL PREVIOUS SECTIONS" that dumps every section across all grade levels and programs into one long, unmanageable list[cite: 14]. 

In a public DepEd high school environment, registrars manage thousands of students across different curricula. To optimize their workflow, you must replace this single dropdown with a **Cascading 3-Tier Filter System**.

Please implement the interface using the following comprehensive UI/UX guidelines:

### 1. UI Layout & Architecture
Inside the existing filter popover[cite: 14], remove the single "ALL PREVIOUS SECTIONS" select input. Replace it with three vertically stacked dropdowns (or searchable comboboxes), each with a clear label. 

Ensure the spacing is comfortable (e.g., `gap-4`) and use the system's standard styling (rounded borders, neutral gray outlines, and deep maroon accents for focus states).

*   **Dropdown 1: Previous Grade Level**
*   **Dropdown 2: Previous Program Type**
*   **Dropdown 3: Previous Section**

### 2. Cascading Logic & Interaction Rules
The dropdowns must be reactive and dependent on one another to prevent users from selecting impossible combinations (e.g., selecting Grade 7, but seeing Grade 10 sections).

**Step 1: Previous Grade Level**
*   **Default State:** "All Grade Levels"
*   **Options:** Grade 7, Grade 8, Grade 9, Grade 10.
*   **Behavior:** Selecting a grade level dynamically filters the available options in the Program Type dropdown.

**Step 2: Previous Program Type**
*   **Default State:** Disabled and displays "Select Grade Level first" (unless Grade Level is selected).
*   **Options (DepEd Standard):** Regular Basic Education Curriculum (BEC), Science Technology and Engineering (STE), Special Program in the Arts (SPA), Special Program in Sports (SPS), Special Program in Journalism (SPJ).
*   **Behavior:** Once a Grade and Program are selected, it triggers the fetch/filter for the exact sections that belong to that intersection.

**Step 3: Previous Section**
*   **Default State:** Disabled and displays "Select Program Type first".
*   **Options:** Dynamically populated based on Dropdown 1 and Dropdown 2. (e.g., If Dropdown 1 = "Grade 8" and Dropdown 2 = "SPA", this dropdown only shows sections like "Grade 8 - SPA Section A").
*   **Behavior:** This serves as the final, granular filter. 

### 3. Action Buttons & Filter Reset
*   Retain the existing **"Clear All"** text button and **"Apply Filters"** solid maroon button at the bottom of the popover[cite: 14].
*   Clicking **"Clear All"** must instantly reset all three dropdowns to their default empty/disabled states and remove any active filters on the master list[cite: 14].

### 4. EdTech UX Rationale
By grouping the data hierarchically (Grade $\rightarrow$ Program $\rightarrow$ Section), you eliminate cognitive overload for the School Registrar. When processing continuing learners, a registrar typically works batch-by-batch (e.g., enrolling all of last year's Grade 8 SPA students into Grade 9 SPA). This cascading filter exactly mirrors their physical administrative workflow.