# UI/UX Refactoring Prompt: Mobile-First Learner Profile (SF1 & SF9)

**Target System:** EnrollPro: EMEMHS Learner Information System  
**Target Module:** Learner Profile (Student-facing / Guardian-facing Portal)  
**Reference Images:** `image_015344.png`, `image_015349.png`, `image_015363.png`, `image_015365.png`  
**Context:** Department of Education (DepEd) JHS Public School System  

---

**Act as a Senior Frontend Developer and UI/UX Engineer.**

Your task is to refactor the current Learner Profile interface into a strictly mobile-first, responsive architecture. Public school learners and guardians predominantly access portals via mobile devices, rendering the current rigid two-column desktop layout[cite: 15] and wide data tables[cite: 15, 17] unusable on smaller screens. 

Implement the following architectural and component-level improvements. **Crucial Constraint:** You must strictly reuse existing design system components (e.g., standard tabs, cards, dropdowns, sidepanels). Do not generate custom UI styling code, inline CSS, or bespoke utility class overrides. Focus on component orchestration and state architecture.

### 1. Layout Architecture & Full-Page Routing
*   **Current State:** The interface uses a fixed left sidebar taking up roughly 30% of the screen[cite: 15, 17], forcing the main content into a constrained right-hand container. 
*   **Refactoring:** Dismantle the two-column layout. Implement a stacked, single-column architecture for mobile viewports, scaling to a constrained max-width container on desktop. 
*   **Routing Logic:** The current toggle between "HISTORICAL ACADEMIC RECORDS (SF9)" and "OFFICIAL LEARNER PROFILE (SF1)" relies on massive block buttons[cite: 15, 17]. Replace these with standard design system navigation tabs integrated with full-page routing (e.g., `/learner/profile/sf1` and `/learner/profile/sf9`). This ensures browser back-button compatibility and allows users to bookmark specific tabs.

### 2. Mobile-First Learner Header & Sidepanel Integration
*   **Current State:** The learner's photo, Name, LRN, Grade/Curriculum, and Official Class Adviser are stacked vertically in a massive sidebar[cite: 15, 17]. 
*   **Refactoring:** 
    *   Create a compact `<ProfileHeader />` component at the top of the page. Use a horizontal flex layout on mobile (Avatar on the left, Name and LRN on the right). 
    *   Display only critical identifiers (Name, LRN, Grade - Section) in this header[cite: 15]. 
    *   **Sidepanel Utilization:** Move the secondary administrative data, such as the "OFFICIAL CLASS ADVISER: TO BE ASSIGNED" status[cite: 15, 17], into a slide-out sidepanel or bottom sheet triggered by an "Advisory Details" action button. This reclaims primary screen real estate.

### 3. Refactoring SF9 (Historical Academic Records)
*   **Current State:** Grades are displayed in a wide, traditional table format (Learning Areas, Term Ratings 1-3, Final Rating, Remarks)[cite: 15, 16], nested inside stacked accordions for each school year[cite: 16]. This will force horizontal scrolling on mobile and create a vertical "accordion overload."
*   **Refactoring:**
    *   **Dropdown Component:** Replace the stacked accordion list of school years (e.g., "GRADE 8 - MATAPAT", "GRADE 7 - AGUINALDO")[cite: 16] with a single, prominent Dropdown component labeled "Select Academic Year." Only one year's data should render at a time.
    *   **Responsive Data Display:** Do not use standard `<table>` elements for mobile viewports. Re-architect the data into a list of `<GradeCard />` components. Each card should represent one Learning Area (e.g., "MATHEMATICS")[cite: 15, 16] and contain a responsive grid showing Q1, Q2, Q3, Q4, and the Final Rating. Switch to the traditional table view only at the `md` or `lg` breakpoint.

### 4. Refactoring SF1 (Official Learner Profile)
*   **Current State:** Learner identity, residency, and parent/guardian backgrounds are displayed using rigid, two-column table structures with heavy borders (e.g., "SEX | FEMALE")[cite: 17, 18]. 
*   **Refactoring:**
    *   Strip out the table structures. Utilize standard label-value pair components from the design system.
    *   Group the data logically into distinct `<Card />` containers: "I. Learner Identity", "II. Current Residency", and "III. Parent/Guardian Background"[cite: 17, 18].
    *   Use a responsive CSS grid layout within these cards: 1 column on mobile (label stacked above value) and 2 or 3 columns on desktop to maximize screen space without hardcoding rigid table cells.