# UI/UX Redesign Prompt: DepEd Junior High School Learner Portal Login

**Target System:** EnrollPro: Academic Institution's Digital Platform  
**Target Module:** Learner Authentication Portal  
**Target School:** Enriqueta Montilla de Esteban Memorial High School (EMEMHS)  
**Target Audience:** Junior High School Students (Grades 7–10), Parents/Guardians  
**Device Context:** Mobile-first (Android smartphones, shared household tablets, DepEd Computer Laboratory terminals)  

---

Copy and paste the prompt below to instruct your AI agent or frontend development team on how to execute the redesign.

***

**Act as a Senior UI/UX Engineer and Frontend Developer specializing in accessible EdTech interfaces.**

Your task is to redesign and implement the official login screen for the EMEMHS Learner Portal in EnrollPro. You must replace the current wireframe-style checkerboard interface with a professional, production-ready design that adheres to modern UI standards and Philippine Department of Education (DepEd) public school requirements[cite: 17]. 

Please build the interface using the following comprehensive UI/UX guidelines:

### 1. Visual Layout & Structure

Implement a responsive split-screen layout for desktop displays that gracefully collapses into an elevated, centered single-column layout on mobile devices.

**Left Pane: Brand Hero Section**
*   **Background:** Use high-quality, subtle school campus imagery or clean institutional vector graphics overlaid with a deep maroon/burgundy gradient to match the school's branding.
*   **Institutional Badging:** Display the official seals at the top (Republic of the Philippines / Department of Education Seal alongside the official EMEMHS emblem). Ensure the hierarchy clearly states "Region VI – Western Visayas", "Schools Division of Negros Occidental", and the school name with its DepEd School ID.
*   **Welcome Messaging:** Include a clear headline (e.g., "Welcome to Your Academic Journey") and a subtitle explaining the portal's value (e.g., accessing grades, enrollment records, class schedules, and SF9 progress).
*   **Academic Context:** Add a distinct visual badge or pill that displays the current school year and the active system phase (e.g., "School Year 2026–2027 • Official Enrollment Active").

**Right Pane: Form Container**
*   **Surface:** Use a clean, off-white or neutral background for the right pane, featuring an elevated, centrally aligned white card with soft drop shadows and rounded corners to house the login form.
*   **Header:** Include a clean school seal thumbnail specifically visible only on mobile views. Below it, place the main title ("Learner Portal") and a descriptive subtitle ("Sign in with your 12-digit Learner Reference Number").

### 2. Form Controls & Ergonomics

**A. Learner Reference Number (LRN) Input**
*   **Label & Icon:** Label the field clearly and include a required asterisk. Add an academic cap icon inside the input field for visual context[cite: 17].
*   **Interaction Rules:** The LRN is a strict 12-digit identifier. The input must force the numeric virtual keyboard on mobile devices, prevent alphabetic or special character typing, and restrict the maximum length to exactly 12 characters.
*   **UX Helpers:** Include a dynamic character counter on the right side of the label (e.g., "0 / 12 digits") that turns green when the required 12 digits are met. Include placeholder text showing an example format.

**B. Password / Portal PIN Input**
*   **Label & Icon:** Label the field clearly with a required asterisk and include a lock icon inside the input field[cite: 17].
*   **Show/Hide Toggle:** Transform the current static eye icon into a functional, accessible toggle button allowing the user to unmask their password/PIN[cite: 17]. Include proper accessibility labels for screen readers.

**C. Session Options & Security**
*   **Checkbox UI:** Replace the current radio-style circle for "Remember me" with a standard, recognizable square checkbox[cite: 17].
*   **Privacy Context:** Because public school learners frequently use shared computer laboratories or internet cafes, add a helper tooltip or subtle subtext warning users not to check this option on shared devices.

**D. Primary Call-to-Action (Sign In Button)**
*   **Styling:** Design a full-width, prominent button utilizing the school's deep maroon brand color[cite: 17]. Include hover, focus, and active states for better tactile feedback. Add a standard "log-in" or right-arrow icon next to the text[cite: 17].
*   **Interactive States:** The button should visibly transition to a loading state (e.g., an animated spinner with the text "Authenticating learner...") upon submission. It should be disabled if the LRN field contains fewer than 12 digits.

### 3. Support, Self-Service & Regulatory Compliance

**Adviser & Password Reset Card**
*   Instead of a passive text link at the bottom[cite: 17], design a dedicated, softly colored alert or info banner below the sign-in button. 
*   This banner should use a help icon and clearly state instructions for account recovery (e.g., "Need help accessing your account? For first-time login, use your default portal PIN provided during enrollment. For password resets, contact your Class Adviser or the School ICT Coordinator.").

**Portal Footer & Compliance**
*   At the very bottom of the form container, center-align subtle footer text ensuring regulatory compliance.
*   It must mention that the system is protected by DepEd Data Privacy Policies and Republic Act 10173 (Data Privacy Act of 2012), alongside the platform's name.