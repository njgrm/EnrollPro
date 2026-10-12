import { useEffect } from "react";
import { useLocation } from "react-router";
import { useSettingsStore } from "@/store/settings.slice";

const APP_NAME = "EnrollPro";

/**
 * Maps a pathname to a human-readable page title.
 * Returns null for paths that should use the bare app name (e.g. root redirect).
 */
export function resolvePageTitle(pathname: string, search: string): string | null {
  if (pathname === "/settings" || pathname === "/personnel/settings") {
    const tab = new URLSearchParams(search).get("tab");
    if (tab === "requirements") {
      return "Enrollment Requirements";
    }
  }

  // Exact matches first
  const exact: Record<string, string> = {
    "/personnel/dashboard": "Dashboard",
    "/dashboard": "Dashboard",
    "/personnel/login": "Personnel Login",
    "/change-password": "Change Password",
    "/enrollment": "Basic Education Enrollment Form",
    "/applications/enrollment": "Enrollment",
    "/personnel/learner-enrollment": "Learner Enrollment",
    "/learner-enrollment": "Learner Enrollment",
    "/personnel/section-assignment": "Section Assignment",
    "/section-assignment": "Section Assignment",
    "/personnel/section-assignment/walk-in": "Learner Enrollment",
    "/section-assignment/walk-in": "Learner Enrollment",
    "/personnel/early-registration-masterlist": "Early Registration Masterlist",
    "/early-registration-masterlist": "Early Registration Masterlist",
    "/personnel/eosy": "EOSY Updating",
    "/eosy": "EOSY Updating",
    "/personnel/learners": "Learner Directory",
    "/learners": "Learner Directory",
    "/personnel/sections": "Class Sections",
    "/sections": "Class Sections",
    "/personnel/audit-logs": "System Activity Logs",
    "/audit-logs": "System Activity Logs",
    "/personnel/my-activity": "My Activity Log",
    "/my-activity": "My Activity Log",
    "/personnel/help": "Help & Documentation",
    "/help": "Help & Documentation",
    "/personnel/settings": "System Configuration",
    "/settings": "System Configuration",
    "/personnel/directory": "Personnel Directory",
    "/personnel": "Personnel Directory",
    "/personnel/admin/system": "System Health",
    "/admin/system": "System Health",
    "/smart": "SMART",
    "/personnel/section-assignment/requirements": "Documentary Requirements",
    "/section-assignment/requirements": "Documentary Requirements",
    "/personnel/teacher/advisory": "My Advisory Class",
    "/teacher/advisory": "My Advisory Class",
    "/personnel/learner-admission": "SCP Admission",
    "/learner-admission": "SCP Admission",
  };

  if (exact[pathname]) return exact[pathname];

  // Prefix matches for dynamic segments
  if (pathname.startsWith("/personnel/learner/")) return "Learner Profile";
  if (pathname.startsWith("/personnel/sections/view-masterlist/")) return "Class Section Masterlist";
  if (pathname.startsWith("/personnel/dashboard/program-roster/")) return "Program Roster";
  if (pathname.startsWith("/learner/")) return "Learner Profile";
  if (pathname.startsWith("/applications/")) return "Application Detail";
  if (pathname.startsWith("/settings/")) return "Settings";
  if (pathname.startsWith("/admin/")) return "Administration";
  if (pathname.startsWith("/smart")) return "SMART";

  return null;
}

/**
 * Reactively updates document.title on every route change.
 * Format: "Page Name — School Name | EnrollPro"
 *         or "Page Name | EnrollPro" when school name is not yet loaded.
 *         or "EnrollPro" for unknown routes.
 */
export function usePageTitle(customTitle?: string) {
  const { pathname, search } = useLocation();
  const schoolName = useSettingsStore((s) => s.schoolName);

  useEffect(() => {
    const page = customTitle ?? resolvePageTitle(pathname, search);

    let title: string;
    if (page) {
      title = schoolName
        ? `${page} | ${schoolName} | ${APP_NAME}`
        : `${page} | ${APP_NAME}`;
    } else {
      title = schoolName ? `${schoolName} | ${APP_NAME}` : APP_NAME;
    }

    document.title = title.toUpperCase();
  }, [pathname, search, schoolName, customTitle]);
}
