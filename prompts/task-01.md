# UI/UX Refactoring Prompt: Remove Redundant Page Header

**Target System:** EnrollPro: DepEd Junior High School System  
**Target Module:** System Administration - System Activity Logs  
**Reference Images:** `image_fb4742.jpg`, `image_fb479f.jpg`  

---

**Act as a Frontend Developer and UI/UX Engineer.**

Your task is to optimize the vertical screen space on the "System Activity Logs" page. Public school administrators and IT personnel often view these extensive audit trails on smaller, lower-resolution monitors. Currently, valuable screen real estate is being wasted by a redundant inner page header[cite: 42]. 

Please implement the following layout adjustments:

### 1. Remove the Redundant Inner Header
*   **The Issue:** Inside the main white content container, there is a large text block displaying "SYSTEM ACTIVITY LOGS" followed by a subtitle reading "Forensic audit trail and system activity logs across institutional modules"[cite: 42]. This is completely redundant because the exact same title ("SYSTEM ACTIVITY LOGS") is already permanently visible in the top global navigation bar[cite: 42].
*   **The Fix:** Completely delete this inner header text and its associated container (`div` wrapper). 

### 2. Shift Content and Adjust Padding
*   **The Issue:** Removing the header will leave an awkward empty gap above the filter controls.
*   **The Fix:** Shift the entire "SEARCH FILTERS" block (containing the Action Category, Actor Filter, and Date selectors) up to the top of the main content container[cite: 42, 43]. 
*   **Padding Check:** Ensure that the top padding of the main white container matches the standard spacing of your existing design system so the filter bar doesn't sit uncomfortably flush against the gray background.

### 3. Verify Expanded Row Integrity
*   **The Fix:** After shifting the layout upward, verify that the table's accordion expansion still functions correctly. When an administrator clicks to expand a log, the "DETAILED CHANGES" panel (showing "Modified Field", "Changed From", "Changed To", and the "NETWORK SECURITY FOOTPRINT")[cite: 43] must render smoothly without any layout shifting or overlapping with the newly repositioned filter bar.