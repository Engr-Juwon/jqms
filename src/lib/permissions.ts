import { UserRole, ROLE_LEVELS, ROLE_LABELS, ROLE_TITLES } from "@/types";

export { ROLE_LEVELS, ROLE_LABELS, ROLE_TITLES };

export const ROLE_BADGE_COLORS: Record<number, string> = {
  5: "bg-purple-950/80 text-purple-300 border-purple-700/60",
  4: "bg-blue-950/80 text-blue-300 border-blue-700/60",
  3: "bg-teal-950/80 text-teal-300 border-teal-700/60",
  2: "bg-amber-950/80 text-amber-300 border-amber-700/60",
  1: "bg-slate-800/80 text-slate-300 border-slate-600/60",
};

export function getRoleLevel(role?: UserRole): number {
  if (!role) return 0;
  return ROLE_LEVELS[role] || 1;
}

export function hasMinRole(
  userRole: UserRole | undefined,
  minLevel: number,
): boolean {
  return getRoleLevel(userRole) >= minLevel;
}

export function canCreateRecords(userRole: UserRole | undefined): boolean {
  return getRoleLevel(userRole) >= 2;
}

export function canApproveAndClose(userRole: UserRole | undefined): boolean {
  return getRoleLevel(userRole) >= 3;
}

export function canManageProject(userRole: UserRole | undefined): boolean {
  return getRoleLevel(userRole) >= 4;
}

export function canManageCompany(userRole: UserRole | undefined): boolean {
  return getRoleLevel(userRole) >= 5;
}

/**
 * Corporate Executives & Enterprise Governance Managers automatically assigned to all projects.
 * Roles: Super Admin, Quality Director, Executive Management, Project Manager, Operations Manager.
 * NOTE: QA/QC Managers, QA/QC Engineers, and Inspectors are project-specific and NOT automatically added to all projects.
 */
export function isGlobalManagerRole(role?: UserRole): boolean {
  if (!role) return false;
  const globalManagerRoles: UserRole[] = [
    "SUPER_ADMIN",
    "QUALITY_DIRECTOR",
    "EXECUTIVE_MANAGEMENT",
    "PROJECT_MANAGER",
    "OPERATIONS_MANAGER",
  ];
  return globalManagerRoles.includes(role);
}

/**
 * Helper to identify QA/QC engineering roles.
 */
export function isQAQCEngineerRole(role?: UserRole): boolean {
  if (!role) return false;
  return (
    role === "SENIOR_QAQC_ENGINEER" ||
    role === "QAQC_ENGINEER" ||
    role === "QUALITY_MANAGER" ||
    role === "QAQC_MANAGER" ||
    role === "DEPUTY_QUALITY_MANAGER"
  );
}

/**
 * Returns the formal signing / job title to write on signature stamps, reports, and certificates.
 * Principle: "Functionality differs from title" - e.g., role can be QUALITY_MANAGER (giving L5 QA/QC powers)
 * while title is written as "QA/QC Engineer" or "Lead Quality Auditor".
 */
export function getUserSigningTitle(
  user?: { role?: UserRole; title?: string; designation?: string; fullName?: string } | null,
): string {
  if (!user) return "Authorized Signer";
  return (
    user.title?.trim() ||
    user.designation?.trim() ||
    (user.role ? ROLE_TITLES[user.role] || user.role : "Engineer")
  );
}

/**
 * Checks if a user is part of the Quality Assurance / Quality Control chain of command.
 * Strictly checks statutory QA/QC roles (Super Admin, Quality Directors/Managers, QAQC Engineers, QAQC Inspectors, Materials Engineers)
 * or explicit QA/QC title/designation.
 * External roles (Consultant, Client Rep, Subcontractor, etc.) and non-QA/QC trades are strictly excluded.
 */
export function isQAQCUser(
  user?: { role?: UserRole; designation?: string; title?: string; department?: string } | null,
): boolean {
  if (!user) return false;

  // 1. Explicit Exclusions: Non-QA/QC and external roles MUST NEVER have QA/QC registry authority
  const nonQAQCRoles: UserRole[] = [
    "CONSULTANT",
    "CLIENT_REPRESENTATIVE",
    "THIRD_PARTY_INSPECTOR",
    "SUB_CONTRACTOR",
    "SUPPLIER_VENDOR",
    "SITE_ENGINEER",
    "CONSTRUCTION_MANAGER",
    "PROJECT_ENGINEER",
    "PROJECT_MANAGER",
    "OPERATIONS_MANAGER",
    "FOREMAN",
    "SURVEYOR",
    "DOCUMENT_CONTROLLER",
    "SAFETY_MANAGER",
    "MEP_COORDINATOR",
    "MECHANICAL_ENGINEER",
    "ELECTRICAL_ENGINEER",
    "PLUMBING_ENGINEER",
    "LAB_MANAGER",
    "MATERIALS_TECHNICIAN",
  ];
  if (user.role && nonQAQCRoles.includes(user.role)) {
    return false;
  }

  // 2. Explicit Statutory QA/QC Roles
  const qaqcRoles: UserRole[] = [
    "SUPER_ADMIN",
    "QUALITY_DIRECTOR",
    "EXECUTIVE_MANAGEMENT",
    "QUALITY_MANAGER",
    "QAQC_MANAGER",
    "DEPUTY_QUALITY_MANAGER",
    "LEAD_QUALITY_AUDITOR",
    "QUALITY_AUDITOR",
    "SENIOR_QAQC_ENGINEER",
    "QAQC_ENGINEER",
    "QAQC_INSPECTOR",
    "MATERIALS_ENGINEER",
  ];
  if (user.role && qaqcRoles.includes(user.role)) return true;

  // 3. Explicit Title / Designation Match (Excluding Department to prevent accidental privilege escalation)
  const titleText = `${user.title || ""} ${user.designation || ""}`.toLowerCase().trim();
  if (
    titleText.includes("consultant") ||
    titleText.includes("client rep") ||
    titleText.includes("subcontractor") ||
    titleText.includes("supplier") ||
    titleText.includes("safety")
  ) {
    return false;
  }

  return (
    titleText.includes("qa/qc") ||
    titleText.includes("qaqc") ||
    titleText.includes("quality assurance") ||
    titleText.includes("quality control") ||
    titleText.includes("quality manager") ||
    titleText.includes("quality director") ||
    titleText.includes("quality engineer") ||
    titleText.includes("quality inspector")
  );
}

/**
 * Check if a user has access/assignment to a project according to matrix rules.
 *
 * Rules:
 * 1. Global Governance Managers (Level 5 Executives / Directors) have automatic statutory access across all company projects.
 * 2. QA/QC Engineers, Inspectors, CMs, and Site Staff MUST be explicitly assigned to the project roster.
 * 3. If the project document defines an explicit `assignedStaff` or `assignedStaffIds` array:
 *    THAT ROSTER IS THE DEFINITIVE SOURCE OF TRUTH.
 *    If the user's UID is present -> Access GRANTED.
 *    If the user's UID is absent  -> Access STRICTLY DENIED.
 * 4. Fallback if project has no assignedStaff roster configured:
 *    Check user.projectAccess / user.projectIds.
 */
export function isStaffAssignedToProject(
  project:
    | {
        id?: string;
        assignedStaff?: string[];
        assignedStaffIds?: string[];
        excludedStaffIds?: string[];
      }
    | null
    | undefined,
  user:
    | {
        uid: string;
        role?: UserRole;
        projectAccess?: Record<string, boolean>;
        projectIds?: string[];
      }
    | null
    | undefined,
  projectId?: string,
): boolean {
  if (!user) return false;
  // 1. Corporate Executive Managers have automatic company-wide access
  if (isGlobalManagerRole(user.role)) return true;

  const targetProjId = project?.id || projectId;
  if (!targetProjId) return false;

  // 2. Check explicit exclusion
  if (
    project?.excludedStaffIds &&
    Array.isArray(project.excludedStaffIds) &&
    project.excludedStaffIds.includes(user.uid)
  ) {
    return false;
  }

  // 3. Project Roster Check
  const inProjectRoster =
    Boolean(project?.assignedStaff?.includes(user.uid)) ||
    Boolean(project?.assignedStaffIds?.includes(user.uid));

  if (inProjectRoster) {
    return true;
  }

  // 4. User Profile Project Access / ProjectIds Check
  if (
    user.projectAccess &&
    typeof user.projectAccess === "object" &&
    (user.projectAccess[targetProjId] === true || user.projectAccess["*"] === true)
  ) {
    return true;
  }
  if (user.projectIds && Array.isArray(user.projectIds)) {
    if (user.projectIds.includes("*") || user.projectIds.includes(targetProjId)) {
      return true;
    }
  }

  return false;
}

/**
 * Determines whether a user is authorized/eligible to sign for a specific stakeholder role
 * (e.g. in Permit to Pour, Inspection, Site Instructions, or other statutory signoffs).
 *
 * Strict Principle: "Your role signs for your role."
 * - QA/QC cards require QA/QC roles/designations.
 * - Site / Construction Manager cards require Site Engineer / Construction Manager roles.
 * - Structural Consultant cards require Consultant roles.
 * - Discipline engineers (Mechanical, Electrical, Plumbing) require their respective roles.
 */
export function isUserEligibleForStakeholderRole(
  user:
    | { role?: UserRole; designation?: string; fullName?: string }
    | null
    | undefined,
  targetRole: string,
): boolean {
  if (!user || !targetRole) return false;

  const target = targetRole.toLowerCase().trim();
  const userRole = user.role || ("" as UserRole);
  const userRoleTitle = (ROLE_TITLES[userRole] || "").toLowerCase();
  const userDesignation = (user.designation || "").toLowerCase().trim();

  // Helper matcher
  const matchesText = (keywords: string[]) =>
    keywords.some(
      (k) =>
        userRoleTitle.includes(k) ||
        userDesignation.includes(k) ||
        userRole.toLowerCase().includes(k),
    );

  // 1. QA/QC & Quality Authority
  if (
    target.includes("qa/qc") ||
    target.includes("qaqc") ||
    target.includes("quality")
  ) {
    const qaqcRoles: UserRole[] = [
      "QAQC_ENGINEER",
      "SENIOR_QAQC_ENGINEER",
      "QAQC_MANAGER",
      "QAQC_INSPECTOR",
      "QUALITY_MANAGER",
      "QUALITY_DIRECTOR",
      "DEPUTY_QUALITY_MANAGER",
      "LEAD_QUALITY_AUDITOR",
      "QUALITY_AUDITOR",
    ];
    if (qaqcRoles.includes(userRole)) return true;
    if (userRole === "SUPER_ADMIN") {
      // If super_admin has set an explicit non-quality trade designation, enforce that role
      if (
        userDesignation &&
        (userDesignation.includes("site") ||
          userDesignation.includes("consultant") ||
          userDesignation.includes("structural") ||
          userDesignation.includes("electrical") ||
          userDesignation.includes("mechanical") ||
          userDesignation.includes("plumbing") ||
          userDesignation.includes("survey") ||
          userDesignation.includes("safety")) &&
        !matchesText(["qa/qc", "qaqc", "quality"])
      ) {
        return false;
      }
      return true;
    }
    return matchesText(["qa/qc", "qaqc", "quality"]);
  }

  // 2. Site / Construction Management & Site Engineers
  if (
    target.includes("site / construction manager") ||
    target.includes("construction manager") ||
    target.includes("site manager") ||
    target.includes("site engineer") ||
    target.includes("production")
  ) {
    const siteRoles: UserRole[] = [
      "SITE_ENGINEER",
      "CONSTRUCTION_MANAGER",
      "PROJECT_ENGINEER",
      "PROJECT_MANAGER",
      "OPERATIONS_MANAGER",
      "FOREMAN",
    ];
    if (siteRoles.includes(userRole)) return true;
    return matchesText([
      "site engineer",
      "construction manager",
      "site manager",
      "project engineer",
      "production",
    ]);
  }

  // 3. Structural Consultant / Supervising Consultant
  if (
    target.includes("consultant") ||
    target.includes("structural") ||
    target.includes("supervising")
  ) {
    const consultantRoles: UserRole[] = [
      "CONSULTANT",
      "THIRD_PARTY_INSPECTOR",
      "CLIENT_REPRESENTATIVE",
    ];
    if (consultantRoles.includes(userRole)) return true;
    return matchesText(["consultant", "structural", "supervising"]);
  }

  // 4. Mechanical Engineer
  if (target.includes("mechanical")) {
    if (userRole === "MECHANICAL_ENGINEER" || userRole === "MEP_COORDINATOR")
      return true;
    return matchesText(["mechanical", "mep"]);
  }

  // 5. Electrical Engineer
  if (target.includes("electrical")) {
    if (userRole === "ELECTRICAL_ENGINEER" || userRole === "MEP_COORDINATOR")
      return true;
    return matchesText(["electrical", "mep"]);
  }

  // 6. Plumbing Engineer
  if (target.includes("plumbing")) {
    if (userRole === "PLUMBING_ENGINEER" || userRole === "MEP_COORDINATOR")
      return true;
    return matchesText(["plumbing", "mep"]);
  }

  // 7. MEP Coordinator
  if (target.includes("mep")) {
    const mepRoles: UserRole[] = [
      "MEP_COORDINATOR",
      "MECHANICAL_ENGINEER",
      "ELECTRICAL_ENGINEER",
      "PLUMBING_ENGINEER",
    ];
    if (mepRoles.includes(userRole)) return true;
    return matchesText(["mep", "mechanical", "electrical", "plumbing"]);
  }

  // 8. Safety Manager / Officer
  if (target.includes("safety") || target.includes("hse")) {
    if (userRole === "SAFETY_MANAGER") return true;
    return matchesText(["safety", "hse"]);
  }

  // 9. Materials Engineer / Laboratory
  if (target.includes("material") || target.includes("lab")) {
    const matRoles: UserRole[] = [
      "MATERIALS_ENGINEER",
      "MATERIALS_TECHNICIAN",
      "LAB_MANAGER",
    ];
    if (matRoles.includes(userRole)) return true;
    return matchesText(["material", "lab"]);
  }

  // 10. Surveyor
  if (target.includes("survey")) {
    if (userRole === "SURVEYOR") return true;
    return matchesText(["survey"]);
  }

  // 11. Direct matching fallback
  if (
    userRoleTitle === target ||
    userDesignation === target ||
    target.includes(userRoleTitle) ||
    userRoleTitle.includes(target)
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if a user is permitted to view or edit the Element Registry.
 * Strict Project Requirement: "Element Registry should be visible, editable only to the QAQC persons"
 */
export function canEditElementRegistry(
  user?: { role?: UserRole; designation?: string; department?: string } | null,
): boolean {
  return isQAQCUser(user);
}

/**
 * Determines whether a given page/route path is accessible and visible
 * to the currently logged-in user based on RBAC hierarchy and role specialization.
 *
 * Used dynamically by Sidebar navigation, mobile menus, header shortcuts,
 * and Route Access Guards.
 */
export function canAccessRoute(
  user: { role?: UserRole; designation?: string; department?: string } | null | undefined,
  path: string,
): boolean {
  if (!user) return false;
  const role = user.role;
  const isQAQC = isQAQCUser(user);
  const lvl = getRoleLevel(role);

  // Normalize path removing project-id variables: /projects/123/elements -> /project/elements
  const cleanPath = path.toLowerCase().trim();
  const normalized = cleanPath
    .replace(/^\/project\/[^\/]+/, "/project")
    .replace(/^\/projects\/[^\/]+/, "/project");

  // Profile & Personal Settings (Accessible to all logged in users)
  if (
    normalized === "/profile" ||
    normalized.startsWith("/project/profile") ||
    normalized.startsWith("/company/profile")
  ) {
    return true;
  }

  // 1. Element Registry & 3D BIM (STRICT QA/QC ONLY)
  if (
    normalized.startsWith("/project/elements") ||
    normalized.startsWith("/project/registry/element") ||
    normalized === "/project/elements"
  ) {
    return isQAQC;
  }

  // 2. QA/QC Field SOP Handbook (STRICT QA/QC ONLY)
  if (normalized.startsWith("/project/qaqc-handbook")) {
    return isQAQC;
  }

  // 3. Project Settings, Matrix & Company Administration (Level 4+ Managers & Directors)
  if (
    (normalized.startsWith("/company/projects") && normalized.includes("/edit")) ||
    normalized.startsWith("/project/settings") ||
    normalized.startsWith("/project/edit")
  ) {
    return lvl >= 4;
  }

  if (normalized.startsWith("/company/projects")) {
    return lvl >= 4;
  }

  if (normalized.startsWith("/company/users")) {
    return lvl >= 3 || isQAQC;
  }

  if (
    normalized.startsWith("/company/assignments") ||
    normalized.startsWith("/company/assign")
  ) {
    return lvl >= 3 || isQAQC;
  }

  if (normalized.startsWith("/company/settings")) {
    return lvl >= 4;
  }

  if (normalized.startsWith("/company/inspections")) {
    return lvl >= 3 || isQAQC;
  }

  if (normalized.startsWith("/company/audit")) {
    return lvl >= 4 || isQAQC;
  }

  if (normalized.startsWith("/company/trades")) {
    return lvl >= 3 || isQAQC;
  }

  // 4. BIM & Spatial Hierarchy (Levels, Packages)
  if (
    normalized.startsWith("/project/levels") ||
    normalized.startsWith("/project/packages")
  ) {
    return isQAQC || lvl >= 3;
  }

  // 5. Grid Plan, Gridlines & Material Take-Off
  if (
    normalized.startsWith("/project/grid-plan") ||
    normalized.startsWith("/project/gridlines") ||
    normalized.startsWith("/project/mto") ||
    normalized.startsWith("/project/size-schedule")
  ) {
    return isQAQC || lvl >= 2 || isUserEligibleForStakeholderRole(user, "Consultant");
  }

  // 6. Engineering Submittals, Method Statements & ITP
  if (
    normalized.startsWith("/project/mar") ||
    normalized.startsWith("/project/method-statements") ||
    normalized.startsWith("/project/rams") ||
    normalized.startsWith("/project/itp")
  ) {
    return isQAQC || lvl >= 2 || isUserEligibleForStakeholderRole(user, "Consultant");
  }

  // 7. Concrete, Steel, Deliveries & MIR Testing Controls
  if (
    normalized.startsWith("/project/permit-to-pour") ||
    normalized.startsWith("/project/concrete") ||
    normalized.startsWith("/project/steel") ||
    normalized.startsWith("/project/bar-cutting") ||
    normalized.startsWith("/project/deliveries") ||
    normalized.startsWith("/project/mir")
  ) {
    return isQAQC || lvl >= 2 || isUserEligibleForStakeholderRole(user, "Consultant");
  }

  // 8. Daily Site Diary, 4D Quality Planner
  if (
    normalized.startsWith("/project/daily-logs") ||
    normalized.startsWith("/project/daily-log") ||
    normalized.startsWith("/project/planner")
  ) {
    return isQAQC || lvl >= 2 || isUserEligibleForStakeholderRole(user, "Consultant");
  }

  // 9. Analytics & Weekly Reports
  if (
    normalized.startsWith("/project/reporting") ||
    normalized.startsWith("/project/weekly-reports")
  ) {
    return (
      isQAQC ||
      lvl >= 2 ||
      isUserEligibleForStakeholderRole(user, "Consultant") ||
      isUserEligibleForStakeholderRole(user, "Client Representative")
    );
  }

  // 10. General Collaboration & Quality Suites (Accessible to all project members: Level 1+)
  // Dashboard, Approvals / Action Center, Site Comments, NCRs, Site Instructions, RFIs,
  // Inspections, Punch List / Handover (TOC), Photos, Documents, Calculators, Notifications, Chat.
  return true;
}

