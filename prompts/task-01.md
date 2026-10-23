# Full-Stack Architecture & UI/UX Prompt: Global System Optimization for High-Density DepEd Data

**Target System:** EnrollPro: DepEd Junior High School System  
**Target Scope:** Global Frontend Architecture (All Modules handling Learner/Personnel Data)  

---

**Act as a Senior React/Frontend Engineer and System Architect.**

Your task is to optimize the entire EnrollPro system to gracefully handle massive datasets without browser lag, memory leaks, or frame drops. Department of Education (DepEd) public Junior High Schools frequently manage 1,000 to 3,000 learners *per grade level*. Rendering this volume of data dynamically requires strict frontend and backend architectural discipline.

Implement the following system-wide performance mandates and UX improvements across all pages (Learner Directory, Section Assignment, EOSY Updating, Early Registration, and System Logs):

### 1. Strategic Data Delivery: Pagination vs. Virtualization
Do not rely on a single data rendering strategy. Apply the correct technique based on the user's operational intent:
*   **Server-Side Pagination (Directories & Logs):** For the `Learner Directory`, `Personnel Directory`, and `System Activity Logs`, never fetch 1,000+ records at once. Implement server-side pagination fetching 25, 50, or 100 rows per API call. The frontend must only manage the active page state to keep memory consumption near zero.
*   **DOM Virtualization (Workspaces):** For operational workspaces where users must review massive lists simultaneously (e.g., `Section Assignment` queues, `EOSY Updating` grids), implement DOM virtualization using `@tanstack/react-virtual` or `react-window`. This ensures that even if 1,500 records are held in the client's memory, only the 15-20 rows currently visible in the viewport are painted to the DOM, recycling nodes as the user scrolls.

### 2. State Management & Render Isolation (React Optimization)
Coupling heavy lists to global state or parent components will cause catastrophic input lag (e.g., typing in a search bar freezing the page).
*   **Granular Memoization:** Wrap all repeated row components, avatar cards, and status badges in `React.memo()`. Ensure rows only re-render if their specific primitive props change (e.g., a learner's `isSelected` or `enrollmentStatus`), ignoring updates to neighboring rows.
*   **Decoupled Input State:** Never store the `Search` input state in the same component that renders a 1,000-item virtualized list. Extract search bars into their own isolated components so typing does not trigger massive re-renders.
*   **Debounced Interactions:** Wrap all search bars (e.g., "Search LRN, First Name...") in a `useDebounce` hook with a minimum 400ms delay. Prevent the system from filtering large arrays or pinging the database on every single keystroke.

### 3. Asset & Media Throttling
Loading 1,000 student profile pictures simultaneously will exhaust browser connection limits and severely bottleneck the system.
*   **Lazy Loading:** Enforce `loading="lazy"` on every `<img>` tag across the system so the browser only fetches images as they scroll into view.
*   **Pure-CSS Fallbacks:** Implement a lightweight CSS placeholder (e.g., a colored circular div displaying the learner's initials) that renders instantly while the image network request is pending, or serves as the permanent fallback for learners without uploaded photos.

### 4. Headless UI & Portal Optimization
Rendering thousands of hidden dropdown menus or tooltips in the background consumes massive memory.
*   **Conditional Mounting:** Ensure all actionable dropdowns (like the `(...)` menu in EOSY Updating or Action columns in the Directory) are strictly conditionally mounted (`{isOpen && <Menu />}`) rather than hidden via CSS (`display: none`).
*   **React Portals:** When a dropdown or modal is opened from inside a dense table row, use React Portals to append it directly to `document.body`. This prevents complex CSS stacking context calculations and keeps the row components lightweight.

### 5. Offloading Heavy Computation (Web Workers & SSE)
DepEd systems require heavy sorting algorithms (e.g., Homogeneous academic ranking, Heterogeneous gender balancing, or bulk SF1/SF5 grade synchronization).
*   **Backend Processing:** Never run heavy sorting or bulk data mutation algorithms on the frontend main thread. Clicking buttons like `Auto Assign Sections` or `Sync Grades` must trigger asynchronous backend tasks.
*   **Non-Blocking UI:** While the backend processes the data, immediately transition the frontend button to a loading state. Use Server-Sent Events (SSE) or WebSockets to stream a progress bar (e.g., "Processing: 450 / 1500...") to the client. Keep the main UI thread completely free so the user can continue scrolling or viewing other tabs without the browser locking up.