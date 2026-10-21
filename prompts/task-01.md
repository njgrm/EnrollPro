# UI/UX Refactoring Prompt: Account Activation Screen

**Target System:** EnrollPro: DepEd Junior High School System  
**Target Module:** First-Time Login / Account Activation Screen  
**Reference Image:** `image_14a4cd.jpg` (or the provided reference)

---

**Act as a Senior UI/UX Engineer and Frontend Developer.**

Your task is to refactor the "Activate Official Account" screen. While the layout is clean, it currently suffers from a brand mismatch and a few significant UX flaws regarding form validation. We need to elevate this to a professional, enterprise-grade interface that strictly follows the established EnrollPro design system.

Implement the following UI/UX improvements:

### 1. Align with the EnrollPro Brand Identity
*   **The Problem:** The current screen uses a generic blue grid background and a bright blue button[cite: 52]. This breaks consistency with the rest of the EnrollPro system, which uses a distinct maroon/dark red primary color palette (representing typical DepEd institutional colors).
*   **The Fix:** 
    *   Change the primary button color from blue to the established EnrollPro dark red/maroon.
    *   Replace the generic blue grid background with a softer, more professional institutional background (e.g., an off-white or very subtle gray geometric pattern, similar to the main dashboard background).
    *   Change the shield icon at the top to match the brand colors.

### 2. Fix the Password Requirements UX (Interactive Checkboxes)
*   **The Problem:** The "SECURITY REQUIREMENTS" box uses actual HTML checkbox inputs (`<input type="checkbox">`)[cite: 52]. This is a severe UX anti-pattern because checkboxes imply user interaction. Users might try to click them, causing confusion.
*   **The Fix:** Replace the interactive checkboxes with passive, dynamic status icons (e.g., a small gray dot or a red "x"). As the user types their password, use JavaScript to evaluate the string. When a requirement is met, smoothly transition the corresponding icon to a green checkmark (`✓`) and change the text color from gray to a darker, success-indicating shade.

### 3. Enhance Input Field Usability
*   **The Problem:** The "New Password" field has an eye icon to toggle visibility, but the "Confirm New Password" field is missing it[cite: 52]. Users frequently make typos in the confirmation field and need to see what they typed.
*   **The Fix:** 
    *   Add the password visibility toggle (eye icon) to the "Confirm New Password" field.
    *   Ensure both input fields have a distinct `:focus` ring (using the primary maroon brand color) so users know exactly which field is active.

### 4. Implement Error Prevention (Button State)
*   **The Problem:** The "Activate Account & Enter System" button appears fully active by default[cite: 52].
*   **The Fix:** Apply a disabled state (`opacity-50`, `cursor-not-allowed`) to the primary button. The button must remain disabled until the JavaScript validation confirms that all five security requirements (8 characters, uppercase, number, special character, and matching passwords) are successfully met.