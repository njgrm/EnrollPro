import type { Role } from "@enrollpro/shared";

export type AuthResponseUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  employeeId: string | null;
  accountName: string | null;
  roles: Role[];
  ancillaryRoles: string[];
  mustChangePassword?: boolean;
};

export function getHomeRoute(user: AuthResponseUser): string {
  const roles = user.roles || [];
  const anc = user.ancillaryRoles || [];

  const isDashboardUser =
    roles.includes("SYSTEM_ADMIN") ||
    roles.includes("PRINCIPAL") ||
    roles.includes("HEAD_REGISTRAR") ||
    roles.includes("SCHOOL_REGISTRAR") ||
    roles.includes("GRADE_LEVEL_COORDINATOR") ||
    roles.includes("STE_COORDINATOR") ||
    roles.includes("SPA_COORDINATOR") ||
    roles.includes("SPS_COORDINATOR") ||
    anc.some((r) =>
      [
        "GRADE 7 COORDINATOR",
        "GRADE 8 COORDINATOR",
        "GRADE 9 COORDINATOR",
        "GRADE 10 COORDINATOR",
      ].includes(r),
    ) ||
    anc.some((r) =>
      ["STE HEAD TEACHER", "SPA HEAD TEACHER", "SPS HEAD TEACHER"].includes(r),
    );

  if (isDashboardUser) {
    return "/personnel/dashboard";
  }

  if (roles.includes("CLASS_ADVISER")) {
    return "/personnel/teacher/advisory";
  }

  if (roles.includes("TEACHER")) {
    return "/personnel/learners";
  }

  if (roles.includes("MRF")) {
    return "/personnel/my-activity";
  }

  return "/personnel/dashboard";
}
