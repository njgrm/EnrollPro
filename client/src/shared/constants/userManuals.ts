export interface UserManualData {
  pageTitle: string;
  overview: string;
  keyProcesses: string[];
}

export const DASHBOARD_ENROLLMENT_MANUAL: UserManualData = {
  pageTitle: "Dashboard (Enrollment Phase)",
  overview:
    "During the beginning of the school year, the Dashboard acts as the main control center. It gives the School Head and Registrar a quick, real-time view of the school's enrollment status, class section sizes, and missing SF1 (School Form 1) data.",
  keyProcesses: [
    "**1. Monitor Total Enrollment:** Look at the top red panel and the Grade Level table to track the total number of New, Continuing, Transferee, and Balik-Aral learners from Grade 7 to 10.",
    "**2. Use Quick Actions:** Click the shortcut buttons to immediately start a `Walk-In SCP Admission`, a `Walk-In Enrollment`, or to `Auto Assign Sections` without navigating through the side menu.",
    "**3. Check Class Section Capacity:** Monitor the colored progress bars to see how many learners are assigned to specific sections (like Grade 7 - Luna or Grade 8 - Makabansa) and ensure they do not exceed the DepEd 40-learner limit.",
    "**4. Fix SF1 Data Errors:** Use the \"SF1 Learner Information Check\" panel to easily spot learners with an invalid LRN, missing birthdate, missing mother tongue, or incomplete addresses.",
  ],
};

export const DASHBOARD_EOSY_MANUAL: UserManualData = {
  pageTitle: "Dashboard (EOSY Closing)",
  overview:
    "During the End of School Year (EOSY) Closing phase, enrollment is locked. The Dashboard transforms into a monitoring tool to track the finalization of learner grades, promotion outcomes, and the completion of official DepEd school forms before the system rollover.",
  keyProcesses: [
    "**1. Track Rollover Readiness:** Scroll down to the `Rollover Readiness Checklist`. Monitor the progress bars for Grades 7 to 10 to see how many class sections are fully finalized and if their EOSY grades have been successfully synchronized.",
    "**2. Process Pending Sections:** Check the `Sections Awaiting Final Review` card. Click the `Review Class Sections ->` shortcut to manage classes that have not yet submitted their final general averages or promotion statuses.",
    "**3. Resolve Incomplete Records:** Look at the `Incomplete Learner Results` card. Click `Review Final Grade Records ->` to identify and fix learners who are missing subject grades or lack the required documents for promotion.",
    "**4. Manage Academic Deficiencies:** Check the `Learners Needing Review` card. This helps you quickly identify learners who may need to attend summer remedial classes before they can be officially promoted or retained.",
  ],
};

export const USER_MANUAL_REGISTRY: Record<string, UserManualData> = {
  Dashboard: DASHBOARD_ENROLLMENT_MANUAL,
  "Dashboard (Enrollment Phase)": DASHBOARD_ENROLLMENT_MANUAL,
  "Dashboard (EOSY Closing)": DASHBOARD_EOSY_MANUAL,

  "Learner Directory": {
    pageTitle: "Learner Directory",
    overview:
      "The Learner Directory is the main masterlist of all learner records in the Junior High School system. It allows the Registrar, School Head, and Class Advisers to securely search for a learner and view their current enrollment status, program assignment, and official profile in compliance with data privacy standards.",
    keyProcesses: [
      "**Filter by Enrollment Status:** Click the large tabs at the top of the page to switch between the `ACTIVE MASTERLIST` (currently enrolled learners), `COMPLETERS / ALUMNI` (graduated or promoted learners), and `INACTIVE (TRANSFERRED / DROPPED)` learners.",
      "**Search for a Learner:** Use the search bar just above the table to quickly find a specific learner. You can type their 12-digit Learner Reference Number (LRN) or their Full Name.",
      "**View Full Profile:** Locate the learner in the main table, then click the outlined `Profile` button in the Actions column. This will open their comprehensive official record, which includes their SF1 (Learner Profile) and SF9 (Progress Report) data.",
      "**Adjust Pagination:** If you are viewing a large list, use the \"Rows per page\" dropdown at the bottom of the screen to display 10, 20, or 50 learners at a time.",
    ],
  },

  "Section Assignment": {
    pageTitle: "Section Assignment",
    overview:
      "The Section Assignment page is where the Grade Level Coordinator groups officially enrolled learners into their final class sections. It helps efficiently balance male and female learner populations and monitors maximum classroom capacities to ensure compliance with DepEd standards.",
    keyProcesses: [
      "**Select Target Grade Level:** Use the dark red tabs at the very top to switch your workspace between `GRADE 7`, `GRADE 8`, `GRADE 9`, or `GRADE 10`.",
      "**Find Unassigned Learners:** Look at the left panel labeled \"LEARNERS READY FOR SECTIONING\". This is your queue of walk-ins, transferees, and late enrollees. Use the search bar to find a specific learner by Name or LRN.",
      "**Review Available Sections:** Look at the right panel to see active sections (e.g., \"BONIFACIO\") grouped by their curricular program like STE (Science, Technology, and Engineering). You can view the assigned Official Class Adviser and the learners already inside.",
      "**Balance Gender and Capacity:** Before adding a learner to a section, monitor the blue `M` (Male) and pink `F` (Female) counters on the section card to maintain an equal gender ratio. Ensure the total \"Learner Count\" does not exceed the classroom limit.",
      "**Export the Final Masterlist:** Once you have assigned everyone and the left panel displays the checkmark \"No pending unassigned learners,\" click the `EXPORT GRADE LEVEL` button at the top right to download the finalized class rosters.",
    ],
  },

  "Early Registration Masterlist": {
    pageTitle: "Early Registration Masterlist",
    overview:
      "The Early Registration Masterlist tracks learners who participate in DepEd's pre-registration period. It helps the Registrar and School Head organize incoming Grade 7 learners and transferees so the school can prepare class sections ahead of the new school year.",
    keyProcesses: [
      "**Switch Learner Categories:** Use the large buttons at the very top to switch between viewing `INCOMING GRADE 7` learners and `GRADES 8-10 (TRANSFEREES)`.",
      "**Filter by Registration Status:** Click the sub-tabs to organize the list. You can view learners who are still `PENDING REVIEW`, those who are `OFFICIALLY ENROLLED`, those marked as `CANCELLED/NO SHOW`, or see `ALL REGISTRANTS` at the same time.",
      "**Search for a Learner:** Use the main search bar to quickly find a specific learner. You can type their 12-digit Learner Reference Number (LRN), First Name, or Last Name.",
      "**Review Learner Records:** Look at the main table to check each learner's Name, LRN, Previous School, and their Target Grade level. Use the buttons in the `ACTION` column to open their profile or update their early registration status.",
    ],
  },

  "Learner Enrollment": {
    pageTitle: "Learner Enrollment",
    overview:
      "The Learner Enrollment workspace is where the Registrar reviews, verifies, and officially approves applications for the active school year. It manages both returning learners and new transferees, ensuring all documentary requirements are met before a learner is queued for sectioning.",
    keyProcesses: [
      "**Switch Learner Categories:** Use the main tabs at the very top to toggle between `CONTINUING LEARNERS` (learners from the previous grade level) and `INCOMING GRADE 7 AND TRANSFEREES`.",
      "**Filter by Application Status:** In the left panel, click the sub-tabs to view applications that are currently `FOR REVIEW`, successfully `ENROLLED`, or `CANCELLED`.",
      "**Search for a Learner:** Use the search bar in the left panel to quickly find a specific application by typing the learner's 12-digit Learner Reference Number (LRN), First Name, or Last Name.",
      "**Verify and Approve:** Click on a learner's name from the left panel list. Their full details will appear in the right viewing pane. From there, you can verify their submitted credentials (such as their SF9 Report Card and PSA Birth Certificate) and approve their official enrollment.",
      "**Encode Walk-In Enrollees:** If a new learner or transferee submits physical forms instead of applying online, navigate to the \"Incoming Grade 7 and Transferees\" tab and click the red `+ Encode Walk-In` button to manually process their enrollment.",
    ],
  },

  "Class Sections": {
    pageTitle: "Class Advisership & Section Management",
    overview:
      "This module allows the System Admin or School Head to create official class sections, assign teachers as Official Class Advisers, and monitor the enrollment capacity of every section across all Grade Levels.",
    keyProcesses: [
      "**Select a Grade Level:** Use the dark red tabs at the very top of the page to switch between viewing sections for `GRADE 7`, `GRADE 8`, `GRADE 9`, or `GRADE 10`.",
      "**Add a New Section:** Scroll to the bottom of the section list and click the dashed `+ ADD SECTION` card. You can create a new section and assign it to a specific curriculum (like BEC or a Special Program like STE, SPA, or SPS).",
      "**Assign Class Advisers:** On any section card (e.g., \"BONIFACIO\"), click the `ADVISER` dropdown menu to select a teacher from the Personnel Directory. If a teacher is not yet available, you can leave it as `UNASSIGNED`.",
      "**Monitor Section Capacity:** Look at the `ENROLLED` progress bar on each card to see exactly how many learners are in that class (e.g., 10 / 40). This helps you ensure no section exceeds the DepEd maximum classroom limit.",
      "**View the Class Roster:** Click the solid red `Open SF1 Masterlist ->` button at the bottom of a section card to view the official list of learners assigned to that specific class.",
      "**Edit or Delete Sections:** Use the pencil icon at the top right of a section card to rename it, or the trash can icon to delete the section entirely. *(Note: You can only delete empty sections).*",
    ],
  },
  "Class Advisership & Section Management": {
    pageTitle: "Class Advisership & Section Management",
    overview:
      "This module allows the System Admin or School Head to create official class sections, assign teachers as Official Class Advisers, and monitor the enrollment capacity of every section across all Grade Levels.",
    keyProcesses: [
      "**Select a Grade Level:** Use the dark red tabs at the very top of the page to switch between viewing sections for `GRADE 7`, `GRADE 8`, `GRADE 9`, or `GRADE 10`.",
      "**Add a New Section:** Scroll to the bottom of the section list and click the dashed `+ ADD SECTION` card. You can create a new section and assign it to a specific curriculum (like BEC or a Special Program like STE, SPA, or SPS).",
      "**Assign Class Advisers:** On any section card (e.g., \"BONIFACIO\"), click the `ADVISER` dropdown menu to select a teacher from the Personnel Directory. If a teacher is not yet available, you can leave it as `UNASSIGNED`.",
      "**Monitor Section Capacity:** Look at the `ENROLLED` progress bar on each card to see exactly how many learners are in that class (e.g., 10 / 40). This helps you ensure no section exceeds the DepEd maximum classroom limit.",
      "**View the Class Roster:** Click the solid red `Open SF1 Masterlist ->` button at the bottom of a section card to view the official list of learners assigned to that specific class.",
      "**Edit or Delete Sections:** Use the pencil icon at the top right of a section card to rename it, or the trash can icon to delete the section entirely. *(Note: You can only delete empty sections).*",
    ],
  },

  "Personnel Directory": {
    pageTitle: "Personnel Directory",
    overview:
      "The Personnel Directory is the central masterlist of all teaching and non-teaching staff. It allows the System Admin and School Head to track subject departments, advisory class assignments, and active service statuses for the current school year.",
    keyProcesses: [
      "**Monitor Staff Counts:** Check the summary bar at the top to quickly see the number of `TOTAL PERSONNEL`, `ACTIVE PERSONNEL`, staff who are `INACTIVE / ON LEAVE`, and assigned `CLASS ADVISERS`.",
      "**Search for Personnel:** Use the search bar to quickly find a specific staff member. You can search using their Name, Employee ID, Mobile Number, or Subject Area.",
      "**View Full Profile:** Look at the main table to see a teacher's `SUBJECT / DEPARTMENT`, their `ADVISORY CLASS` (e.g., G7 BONIFACIO), and their `SERVICE STATUS`. Click the outlined `Profile` button in the Actions column to view their complete details, credentials, and assigned ancillary roles.",
      "**Add New Personnel:** Click the solid red `+ ADD PERSONNEL` button at the top right to register a new teacher or staff member into the system.",
      "**Generate SF7 Reports:** Click the `SF7 ACTIONS` dropdown button to generate and download official DepEd School Form 7 (School Personnel Assignment List and Basic Profile) documents for the division office.",
    ],
  },

  "Personnel Profile": {
    pageTitle: "Personnel Profile",
    overview:
      "The Personnel Profile displays an official, read-only institutional summary of a faculty or staff member's credentials, appointment history, and advisory loads. It provides quick access to teaching schedules and institutional assignments for supervisory and planning reviews.",
    keyProcesses: [
      "**Review Personal & Employment Details:** Inspect employee ID, nature of appointment (Regular Permanent, Substitute, LGU Hire), and funding source.",
      "**Verify Academic Qualifications:** Check undergraduate degrees, majors, minor specializations, and postgraduate academic attainment.",
      "**Review Assigned Advisory & Schedules:** Check assigned advisory homerooms, teaching department affiliations, and ancillary assignments.",
      "**Return to Directory:** Click the `Back to Previous Page` button to return to the active personnel list.",
    ],
  },

  "EOSY Updating": {
    pageTitle: "EOSY Updating",
    overview:
      "The End of School Year (EOSY) Updating page allows the Registrar and Class Advisers to finalize the academic status of every learner. It ensures all Final General Averages are recorded and validates if a learner is ready to be Promoted, Retained, or Conditionally Promoted before generating the official DepEd School Form 5 (SF5).",
    keyProcesses: [
      "**Select a Grade Level:** Use the dark red tabs at the very top of the page to filter the masterlist by `GRADE 7`, `GRADE 8`, `GRADE 9`, or `GRADE 10`.",
      "**Sync Academic Records:** Click the `SYNC GRADES` button above the table to pull the latest grading data into the system. Check the `FINAL GEN AVE` column to verify that a learner's final grades have been successfully calculated.",
      "**Monitor Finalization Alerts:** Look at the status indicators next to the Sync button. The system will tell you exactly how many learners are `Waiting for Finalization` and will flag any `Blockers Detected` (such as missing grades or incomplete document submissions).",
      "**Resolve EOSY Statuses:** Review the `EOSY STATUS` column in the main table. If a learner is stuck at `WAITING FOR FINALIZATION`, use the three-dot actions menu `(...)` on the far right to review their specific blockers and manually assign their final status.",
      "**Search for a Learner:** Use the search bar to quickly find a specific student by typing their 12-digit Learner Reference Number (LRN), First Name, or Last Name.",
    ],
  },
  EOSY: {
    pageTitle: "EOSY Updating",
    overview:
      "The End of School Year (EOSY) Updating page allows the Registrar and Class Advisers to finalize the academic status of every learner. It ensures all Final General Averages are recorded and validates if a learner is ready to be Promoted, Retained, or Conditionally Promoted before generating the official DepEd School Form 5 (SF5).",
    keyProcesses: [
      "**Select a Grade Level:** Use the dark red tabs at the very top of the page to filter the masterlist by `GRADE 7`, `GRADE 8`, `GRADE 9`, or `GRADE 10`.",
      "**Sync Academic Records:** Click the `SYNC GRADES` button above the table to pull the latest grading data into the system. Check the `FINAL GEN AVE` column to verify that a learner's final grades have been successfully calculated.",
      "**Monitor Finalization Alerts:** Look at the status indicators next to the Sync button. The system will tell you exactly how many learners are `Waiting for Finalization` and will flag any `Blockers Detected` (such as missing grades or incomplete document submissions).",
      "**Resolve EOSY Statuses:** Review the `EOSY STATUS` column in the main table. If a learner is stuck at `WAITING FOR FINALIZATION`, use the three-dot actions menu `(...)` on the far right to review their specific blockers and manually assign their final status.",
      "**Search for a Learner:** Use the search bar to quickly find a specific student by typing their 12-digit Learner Reference Number (LRN), First Name, or Last Name.",
    ],
  },

  "SCP Admission": {
    pageTitle: "SCP Admission",
    overview:
      "The SCP Admission page manages learners applying for Special Curricular Programs. It allows the Coordinator or Registrar to track applicants, encode scores, and determine who qualifies for specialized tracks before official sectioning begins.",
    keyProcesses: [
      "**Select a Special Program:** Use the main tabs at the top to switch between the different program rosters: `STE APPLICANTS` (Science, Technology, and Engineering), `SPA APPLICANTS` (Arts), and `SPS APPLICANTS` (Sports).",
      "**Search for an Applicant:** Use the search bar to quickly find a specific learner by typing their Name or 12-digit Learner Reference Number (LRN).",
      "**Manually Add Applicants:** If a learner did not apply online and submits their requirements in person, click the red `+ Encode Walk-in Applicant` button to manually add them to the system.",
      "**Track Admission Progress:** Use the main table to monitor each applicant's progress. You can verify if they have `PASSED REQUIREMENTS`, input their `WRITTEN EXAM` scores, and check their `FINAL RESULT` to see if they are officially admitted to the program.",
    ],
  },
  "Special Curricular Program Admission": {
    pageTitle: "SCP Admission",
    overview:
      "The SCP Admission page manages learners applying for Special Curricular Programs. It allows the Coordinator or Registrar to track applicants, encode scores, and determine who qualifies for specialized tracks before official sectioning begins.",
    keyProcesses: [
      "**Select a Special Program:** Use the main tabs at the top to switch between the different program rosters: `STE APPLICANTS` (Science, Technology, and Engineering), `SPA APPLICANTS` (Arts), and `SPS APPLICANTS` (Sports).",
      "**Search for an Applicant:** Use the search bar to quickly find a specific learner by typing their Name or 12-digit Learner Reference Number (LRN).",
      "**Manually Add Applicants:** If a learner did not apply online and submits their requirements in person, click the red `+ Encode Walk-in Applicant` button to manually add them to the system.",
      "**Track Admission Progress:** Use the main table to monitor each applicant's progress. You can verify if they have `PASSED REQUIREMENTS`, input their `WRITTEN EXAM` scores, and check their `FINAL RESULT` to see if they are officially admitted to the program.",
    ],
  },

  "System Configuration": {
    pageTitle: "System Configuration",
    overview:
      "The System Configuration page is restricted to the System Administrator and School Head. It acts as the central control panel for managing the school's official identity, setting academic calendars, and defining the automated rules used for learner enrollment and sectioning.",
    keyProcesses: [
      "**Update School Identity & Branding:** Under the `SCHOOL PROFILE` tab, verify official DepEd details like your 6-digit School ID and the School Head's Name. You can also upload the official school logo and define the system's primary color theme.",
      "**Configure Special Programs:** In the `SCHOOL PROFILE` tab, use the toggle switches to activate or deactivate specific Special Curricular Programs (STE, SPA, SPS) for your school, and set the maximum number of learners allowed per section.",
      "**Manage the School Year Phase:** Switch to the `SCHOOL YEAR MANAGEMENT` tab. Use the top cards to manually shift the system's active phase (e.g., from `OFFICIAL ENROLLMENT` to `CLASSES ONGOING`). This automatically locks or unlocks certain enrollment features for registrars.",
      "**Set Academic Calendars:** Define the exact Start and End dates for important DepEd periods. This includes the main Grading Terms (choose between a 3-Term or 4-Quarter System), Early Registration, SCP Admission, and Official Enrollment windows.",
      "**Adjust Automated Sectioning Rules:** Scroll to the bottom of the `SCHOOL YEAR MANAGEMENT` tab to configure how the system automatically distributes learners into classes. Choose `HETEROGENEOUS` for an even balance of academic performance and gender, or `HOMOGENEOUS` for strict academic ranking. You can also enable specific rules for isolating Top BEC Sections.",
    ],
  },
  Settings: {
    pageTitle: "System Configuration",
    overview:
      "The System Configuration page is restricted to the System Administrator and School Head. It acts as the central control panel for managing the school's official identity, setting academic calendars, and defining the automated rules used for learner enrollment and sectioning.",
    keyProcesses: [
      "**Update School Identity & Branding:** Under the `SCHOOL PROFILE` tab, verify official DepEd details like your 6-digit School ID and the School Head's Name. You can also upload the official school logo and define the system's primary color theme.",
      "**Configure Special Programs:** In the `SCHOOL PROFILE` tab, use the toggle switches to activate or deactivate specific Special Curricular Programs (STE, SPA, SPS) for your school, and set the maximum number of learners allowed per section.",
      "**Manage the School Year Phase:** Switch to the `SCHOOL YEAR MANAGEMENT` tab. Use the top cards to manually shift the system's active phase (e.g., from `OFFICIAL ENROLLMENT` to `CLASSES ONGOING`). This automatically locks or unlocks certain enrollment features for registrars.",
      "**Set Academic Calendars:** Define the exact Start and End dates for important DepEd periods. This includes the main Grading Terms (choose between a 3-Term or 4-Quarter System), Early Registration, SCP Admission, and Official Enrollment windows.",
      "**Adjust Automated Sectioning Rules:** Scroll to the bottom of the `SCHOOL YEAR MANAGEMENT` tab to configure how the system automatically distributes learners into classes. Choose `HETEROGENEOUS` for an even balance of academic performance and gender, or `HOMOGENEOUS` for strict academic ranking. You can also enable specific rules for isolating Top BEC Sections.",
    ],
  },

  "Learner Profile": {
    pageTitle: "Learner Profile",
    overview:
      "The Learner Profile centralizes a learner's cumulative scholastic record, enrollment history, and official DepEd personal data. It offers authorized registrars and advisers complete visibility into demographic information, parental/guardian records, and historical academic performance.",
    keyProcesses: [
      "**Inspect Learner Demographics:** Review learner 12-digit LRN, legal name, date of birth, sex, mother tongue, and address.",
      "**Review Academic History:** Track previous school years, attending institutions, general averages, and promotion statuses.",
      "**Verify Documentary Checklists:** Review submitted enrollment credentials (SF9, SF10, PSA Birth Certificate) and outstanding requirements.",
      "**Access Official School Forms:** Navigate to official school forms and learner records for printing or transfer evaluation.",
    ],
  },

  "System Activity Logs": {
    pageTitle: "System Activity Logs",
    overview:
      "The System Activity Logs page records every action taken inside the system. It helps the System Admin and School Head monitor who logged in, what changes were made to learner records or staff profiles, and ensures the school complies with the Data Privacy Act (RA 10173).",
    keyProcesses: [
      "**Monitor Daily Activity:** Check the summary cards at the top to quickly see the number of `TOTAL EVENTS`, `CRITICAL ALERTS`, and `ACTIVE ACTORS` (staff members) currently using the system.",
      "**Filter the Records:** Use the search filters to narrow down the list. You can filter by `ACTION CATEGORY` or `ACTOR FILTER` (a specific teacher or admin), or use the Quick Presets like `Today`, `Last 7 Days`, or `This Month`.",
      "**Identify the User:** Look at the `STAFF MEMBER` column to see who performed an action. Manual actions show the employee's name and ID (e.g., \"RIZAL, JOSE\"), while automated tasks are labeled as `SYSTEM / GUEST`.",
      "**Review Detailed Changes:** The `RECORDED ACTION` column shows exactly what was done (like `USER LOGIN` or `UPDATED STAFF MEMBER`). Click on any modified record to expand it and see the specific details of what information was changed.",
      "**Export for Audits:** Click the `Download Activity Report` button to save a spreadsheet of the filtered logs for official division compliance reviews.",
    ],
  },
  "Activity Logs": {
    pageTitle: "System Activity Logs",
    overview:
      "The System Activity Logs page records every action taken inside the system. It helps the System Admin and School Head monitor who logged in, what changes were made to learner records or staff profiles, and ensures the school complies with the Data Privacy Act (RA 10173).",
    keyProcesses: [
      "**Monitor Daily Activity:** Check the summary cards at the top to quickly see the number of `TOTAL EVENTS`, `CRITICAL ALERTS`, and `ACTIVE ACTORS` (staff members) currently using the system.",
      "**Filter the Records:** Use the search filters to narrow down the list. You can filter by `ACTION CATEGORY` or `ACTOR FILTER` (a specific teacher or admin), or use the Quick Presets like `Today`, `Last 7 Days`, or `This Month`.",
      "**Identify the User:** Look at the `STAFF MEMBER` column to see who performed an action. Manual actions show the employee's name and ID (e.g., \"RIZAL, JOSE\"), while automated tasks are labeled as `SYSTEM / GUEST`.",
      "**Review Detailed Changes:** The `RECORDED ACTION` column shows exactly what was done (like `USER LOGIN` or `UPDATED STAFF MEMBER`). Click on any modified record to expand it and see the specific details of what information was changed.",
      "**Export for Audits:** Click the `Download Activity Report` button to save a spreadsheet of the filtered logs for official division compliance reviews.",
    ],
  },
  "My Activity Log": {
    pageTitle: "System Activity Logs",
    overview:
      "The System Activity Logs page records every action taken inside the system. It helps the System Admin and School Head monitor who logged in, what changes were made to learner records or staff profiles, and ensures the school complies with the Data Privacy Act (RA 10173).",
    keyProcesses: [
      "**Monitor Daily Activity:** Check the summary cards at the top to quickly see the number of `TOTAL EVENTS`, `CRITICAL ALERTS`, and `ACTIVE ACTORS` (staff members) currently using the system.",
      "**Filter the Records:** Use the search filters to narrow down the list. You can filter by `ACTION CATEGORY` or `ACTOR FILTER` (a specific teacher or admin), or use the Quick Presets like `Today`, `Last 7 Days`, or `This Month`.",
      "**Identify the User:** Look at the `STAFF MEMBER` column to see who performed an action. Manual actions show the employee's name and ID (e.g., \"RIZAL, JOSE\"), while automated tasks are labeled as `SYSTEM / GUEST`.",
      "**Review Detailed Changes:** The `RECORDED ACTION` column shows exactly what was done (like `USER LOGIN` or `UPDATED STAFF MEMBER`). Click on any modified record to expand it and see the specific details of what information was changed.",
      "**Export for Audits:** Click the `Download Activity Report` button to save a spreadsheet of the filtered logs for official division compliance reviews.",
    ],
  },
};

/**
 * Resolves the user manual data for a given page title, route, and active school year phase.
 * Dynamically switches content for the Dashboard based on the active SCHOOL YEAR PHASE STATUS.
 * Falls back to an extensible DepEd-compliant manual if the specific page is not in the registry.
 */
export function resolveUserManual(
  pageTitle: string | null | undefined,
  pathname?: string,
  systemPhase?: string | null,
): UserManualData {
  const normalizedTitle = pageTitle?.trim() || "EnrollPro";
  const lower = normalizedTitle.toLowerCase();
  const cleanPath = pathname?.split("?")[0] || "";

  const isDashboard =
    lower === "dashboard" ||
    lower.startsWith("dashboard (") ||
    lower.includes("dashboard") ||
    cleanPath === "/" ||
    cleanPath === "/dashboard" ||
    cleanPath === "/personnel/dashboard";

  // Dynamic Dashboard Manual based on active SCHOOL YEAR PHASE STATUS
  if (isDashboard) {
    if (systemPhase === "EOSY_CLOSING") {
      return DASHBOARD_EOSY_MANUAL;
    }
    // "OFFICIAL_ENROLLMENT", "CLASSES_ONGOING", or other enrollment phases
    return DASHBOARD_ENROLLMENT_MANUAL;
  }

  // Check direct lookup in the registry
  if (USER_MANUAL_REGISTRY[normalizedTitle]) {
    return USER_MANUAL_REGISTRY[normalizedTitle];
  }

  // Check case-insensitive match
  for (const [key, value] of Object.entries(USER_MANUAL_REGISTRY)) {
    if (key.toLowerCase() === lower) {
      return value;
    }
  }

  // Fallback for custom or unlisted pages
  return {
    pageTitle: normalizedTitle,
    overview: `This module provides authorized school personnel with standard operational tools to review, update, and manage records in compliance with Department of Education (DepEd) standards for public Junior High Schools.`,
    keyProcesses: [
      "**Search & Filter Records:** Use on-screen search controls and filter dropdowns to narrow down specific entries.",
      "**Inspect Detail Views:** Click on actionable table items, profile cards, or actions to inspect comprehensive institutional data.",
      "**Perform Role-Based Actions:** Execute updates, downloads, or status changes authorized for your assigned DepEd user role.",
      "**Verify Changes:** Ensure all records align with DepEd guidelines and institutional compliance requirements before navigating away.",
    ],
  };
}
