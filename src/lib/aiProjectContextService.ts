import { dbService } from "@/lib/db";
import { UserProfile, Project, UserRole } from "@/types";
import { canAccessRoute, isQAQCUser } from "@/lib/permissions";
import { hasPermission } from "@/lib/rbac";

export interface ProjectContextOptions {
  projectId: string;
  companyId?: string;
  user?: UserProfile | null;
  activeProject?: Project | null;
  userPrompt?: string;
}

// In-memory cache for project context snapshots: key = `${projectId}_${role}_${companyId}`
const contextCache = new Map<string, { summary: string; timestamp: number }>();
const CACHE_TTL_MS = 25000; // 25 seconds TTL for fast multi-turn conversations

/**
 * Builds an authorized, live database snapshot for the active project,
 * filtered strictly according to the user's role and RBAC permissions.
 */
export async function buildProjectDatabaseContext(
  options: ProjectContextOptions,
): Promise<string> {
  const { projectId, companyId, user, activeProject } = options;
  if (!projectId) {
    return "No active project selected in Jay-QMS. The user is currently in global or company view.";
  }

  const role: UserRole | undefined = user?.role;
  const isQAQC = isQAQCUser(user);
  const userRoleStr = role || "ENGINEER";

  // Check cache to prevent redundant Firestore roundtrips during rapid conversation turns
  const cacheKey = `${projectId}_${userRoleStr}_${companyId || ""}`;
  const cached = contextCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.summary;
  }

  // 1. Evaluate Domain Permissions for User's Role
  const canNCR = canAccessRoute(user, "/project/ncr");
  const canPTP = canAccessRoute(user, "/project/permit-to-pour");
  const canInspections = canAccessRoute(user, "/project/inspections");
  const canConcrete = canAccessRoute(user, "/project/concrete");
  const canSteel = canAccessRoute(user, "/project/steel");
  const canDailyLogs = canAccessRoute(user, "/project/daily-logs");
  const canSI = canAccessRoute(user, "/project/site-instructions");
  const canComments = canAccessRoute(user, "/project/site-comments");
  const canSubmittals = canAccessRoute(user, "/project/mar");
  const canElements = isQAQC || hasPermission(role, "VIEW_ELEMENT_REGISTRY");
  const canPunch = canAccessRoute(user, "/project/punch-list");
  const canWeekly = canAccessRoute(user, "/project/weekly-reports");
  const canMethodStatements = canAccessRoute(user, "/project/method-statements");
  const canITP = canAccessRoute(user, "/project/itp");

  // 2. Fetch Project Data in Parallel with Fallback Tolerance
  const [
    ncrsRes,
    ptpsRes,
    inspectionsRes,
    cubesRes,
    steelsRes,
    logsRes,
    instructionsRes,
    commentsRes,
    rfisRes,
    marsRes,
    mirsRes,
    elementsRes,
    levelsRes,
    gridlinesRes,
    workPackagesRes,
    punchesRes,
    weeklyRes,
    methodRes,
    itpRes,
    schedulesRes,
  ] = await Promise.allSettled([
    canNCR ? dbService.getNCRs(projectId, companyId) : Promise.resolve([]),
    canPTP ? dbService.getPermitsToPour(projectId, companyId) : Promise.resolve([]),
    canInspections ? dbService.getInspections(projectId, companyId) : Promise.resolve([]),
    canConcrete ? dbService.getCubeSamples(projectId, companyId) : Promise.resolve([]),
    canSteel ? dbService.getSteelTests(projectId, companyId) : Promise.resolve([]),
    canDailyLogs ? dbService.getDailySiteLogs(projectId, companyId) : Promise.resolve([]),
    canSI ? dbService.getSiteInstructions(projectId, companyId) : Promise.resolve([]),
    canComments ? dbService.getSiteComments(projectId, companyId) : Promise.resolve([]),
    canSubmittals ? dbService.getRFIs(projectId, companyId) : Promise.resolve([]),
    canSubmittals ? dbService.getMARs(projectId, companyId) : Promise.resolve([]),
    canSubmittals ? dbService.getMIRs(projectId, companyId) : Promise.resolve([]),
    canElements ? dbService.getElements(projectId, companyId) : Promise.resolve([]),
    dbService.getLevels(projectId, companyId),
    dbService.getGridlines(projectId, companyId),
    dbService.getWorkPackages(projectId, companyId),
    canPunch ? dbService.getRoomPunchItems(projectId, companyId) : Promise.resolve([]),
    canWeekly ? dbService.getWeeklyReports(projectId, companyId) : Promise.resolve([]),
    canMethodStatements ? dbService.getMethodStatements(projectId, companyId) : Promise.resolve([]),
    canITP ? dbService.getITPPlans(projectId, companyId) : Promise.resolve([]),
    canSteel ? dbService.getBarCuttingSchedules(projectId, companyId) : Promise.resolve([]),
  ]);

  const ncrs = ncrsRes.status === "fulfilled" ? ncrsRes.value || [] : [];
  const ptps = ptpsRes.status === "fulfilled" ? ptpsRes.value || [] : [];
  const inspections = inspectionsRes.status === "fulfilled" ? inspectionsRes.value || [] : [];
  const cubes = cubesRes.status === "fulfilled" ? cubesRes.value || [] : [];
  const steels = steelsRes.status === "fulfilled" ? steelsRes.value || [] : [];
  const logs = logsRes.status === "fulfilled" ? logsRes.value || [] : [];
  const instructions = instructionsRes.status === "fulfilled" ? instructionsRes.value || [] : [];
  const comments = commentsRes.status === "fulfilled" ? commentsRes.value || [] : [];
  const rfis = rfisRes.status === "fulfilled" ? rfisRes.value || [] : [];
  const mars = marsRes.status === "fulfilled" ? marsRes.value || [] : [];
  const mirs = mirsRes.status === "fulfilled" ? mirsRes.value || [] : [];
  const elements = elementsRes.status === "fulfilled" ? elementsRes.value || [] : [];
  const levels = levelsRes.status === "fulfilled" ? levelsRes.value || [] : [];
  const gridlines = gridlinesRes.status === "fulfilled" ? gridlinesRes.value || [] : [];
  const workPackages = workPackagesRes.status === "fulfilled" ? workPackagesRes.value || [] : [];
  const punches = punchesRes.status === "fulfilled" ? punchesRes.value || [] : [];
  const weekly = weeklyRes.status === "fulfilled" ? weeklyRes.value || [] : [];
  const methods = methodRes.status === "fulfilled" ? methodRes.value || [] : [];
  const itps = itpRes.status === "fulfilled" ? itpRes.value || [] : [];
  const schedules = schedulesRes.status === "fulfilled" ? schedulesRes.value || [] : [];

  // 3. Assemble Structured Knowledge Snapshot
  const sections: string[] = [];

  // Header & Project Metadata
  sections.push(`=== LIVE DATABASE SNAPSHOT FOR PROJECT: "${activeProject?.name || "Civil Project"}" (${activeProject?.code || "PRJ"}) ===`);
  sections.push(`Authorized User Role: ${user?.title || user?.designation || userRoleStr} | Access Level: ${role || "ENGINEER"}`);
  if (activeProject) {
    sections.push(`Project Details: Status=${activeProject.status || "ACTIVE"}, Client=${activeProject.clientName || "N/A"}, Main Contractor=${activeProject.contractorName || "N/A"}, Location=${activeProject.location || "Site"}`);
  }

  // Summary Metrics Bar
  const openNCRCount = ncrs.filter((n) => n.status === "OPEN" || n.status === "UNDER_REVIEW").length;
  const activePTPCount = ptps.filter((p) => p.status === "APPROVED" || p.status === "PENDING_APPROVAL" || p.status === "ISSUED").length;
  const pendingInspCount = inspections.filter((i) => i.status === "SCHEDULED" || i.status === "SUBMITTED" || i.status === "PENDING_REVIEW").length;
  const failedCubeCount = cubes.filter((c) => c.status === "FAIL" || c.overallStatus === "FAIL").length;
  const openPunchCount = punches.filter((p) => p.stageStatus === "DRAFT" || p.stageStatus === "ISSUED" || p.stageStatus === "RECTIFIED").length;

  sections.push(`
DATABASE ENTITY COUNTS FOR ACTIVE PROJECT:
- Non-Conformance Reports (NCR): ${ncrs.length} (${openNCRCount} open/under-review)
- Permits to Pour (PTP): ${ptps.length} (${activePTPCount} active/pending)
- Work Inspections (WIR): ${inspections.length} (${pendingInspCount} pending/scheduled)
- Concrete Cube Samples: ${cubes.length} (${failedCubeCount} failed)
- Steel Rebar Tests: ${steels.length} | Bar Schedules: ${schedules.length}
- Daily Site Logs: ${logs.length}
- Site Instructions: ${instructions.length}
- Site Observations / Comments: ${comments.length}
- Submittals: RFIs=${rfis.length}, MARs=${mars.length}, MIRs=${mirs.length}
- Structural Elements (BIM): ${elements.length}
- Levels: ${levels.length} | Gridlines: ${gridlines.length} | Work Packages: ${workPackages.length}
- Punch List Items: ${punches.length} (${openPunchCount} open)
- Method Statements: ${methods.length} | ITPs: ${itps.length} | Weekly Reports: ${weekly.length}
`);

  // Section: Non-Conformance Reports (NCR)
  if (!canNCR) {
    sections.push(`[NON-CONFORMANCE REPORTS (NCR)]: Access restricted for your role (${userRoleStr}).`);
  } else if (ncrs.length === 0) {
    sections.push(`[NON-CONFORMANCE REPORTS (NCR)]: Zero non-conformance reports logged in this project.`);
  } else {
    const ncrLines = ncrs.slice(0, 25).map((n) => {
      const el = n.elementName || n.gridAxis || n.locationLevel || "General Site";
      const raisedDate = n.raisedBy?.date || (typeof n.createdAt === "string" ? n.createdAt : new Date(n.createdAt || Date.now()).toLocaleDateString());
      return `• [${n.ncrNumber || n.id}] Status: ${n.status} | Severity: ${n.severity} | Title: "${n.title}" | Location: ${el} | Root Cause: "${n.rootCause || "Under Investigation"}" | Corrective Action: "${n.correctiveAction || "Pending"}" | Raised: ${raisedDate}`;
    });
    sections.push(`[NON-CONFORMANCE REPORTS (NCR) - ${ncrs.length} Records]:\n${ncrLines.join("\n")}`);
  }

  // Section: Permits to Pour (PTP)
  if (!canPTP) {
    sections.push(`[PERMITS TO POUR (PTP)]: Access restricted for your role (${userRoleStr}).`);
  } else if (ptps.length === 0) {
    sections.push(`[PERMITS TO POUR (PTP)]: Zero permits to pour logged.`);
  } else {
    const ptpLines = ptps.slice(0, 25).map((p) => {
      const signs = Object.entries(p.clearanceSignatures || {})
        .map(([k, v]) => `${k}:${v?.signed ? "SIGNED" : "PENDING"}`)
        .join(", ");
      return `• [${p.ptpNumber || p.id}] Status: ${p.status} | Element: ${p.elementName || "Structural Pour"} (${p.levelName || "Site"}) | Planned Date: ${p.plannedPourDate || "TBD"} ${p.plannedPourTime || ""} | Grade: ${p.concreteGrade || "C30/37"} | Volume: ${p.targetVolumeM3 || 0} m³ | Slump: ${p.slumpTargetMm || 0} mm | Signatures: [${signs || "None"}]`;
    });
    sections.push(`[PERMITS TO POUR (PTP) - ${ptps.length} Records]:\n${ptpLines.join("\n")}`);
  }

  // Section: Concrete Cube Testing
  if (!canConcrete) {
    sections.push(`[CONCRETE CUBE TESTING]: Access restricted for your role (${userRoleStr}).`);
  } else if (cubes.length === 0) {
    sections.push(`[CONCRETE CUBE TESTING]: Zero cube samples recorded.`);
  } else {
    const cubeLines = cubes.slice(0, 25).map((c) => {
      const d7 = c.tests?.day7?.averageStrength ?? c.day7Results?.[0]?.averageStrength ?? "N/A";
      const d28 = c.tests?.day28?.averageStrength ?? c.day28Results?.[0]?.averageStrength ?? "N/A";
      const gradeStr = c.concreteGrade || c.targetStrength || `${c.target28DayStrengthNmm2 || ""}`;
      return `• [${c.sampleId || c.sampleNumber || c.id}] Element: ${c.elementName || "Pour"} (${c.levelName || ""}) | Cast: ${c.castDate || "N/A"} | Grade: ${gradeStr} | Slump: ${c.slumpMm || "N/A"}mm | 7d: ${d7} MPa | 28d: ${d28} MPa | Status: ${c.status || c.overallStatus || "PENDING"} | PTP Ref: ${c.pourReference || "N/A"}`;
    });
    sections.push(`[CONCRETE CUBE SAMPLES & CRUSH TESTS - ${cubes.length} Records]:\n${cubeLines.join("\n")}`);
  }

  // Section: Steel Rebar Tests & Bar Cutting Schedules
  if (!canSteel) {
    sections.push(`[STEEL & BAR CUTTING SCHEDULES]: Access restricted for your role (${userRoleStr}).`);
  } else {
    const steelLines = steels.slice(0, 15).map((s) => {
      const dia = s.barDiameterMm || s.diameter || "N/A";
      const yieldStr = s.testResults?.tensileYield || "N/A";
      const tenStr = s.testResults?.tensileUltimate || "N/A";
      const res = s.testResults?.overallResult || "PASS";
      return `• [${s.testNumber || s.id}] Bar Dia: Ø${dia}mm | Grade: ${s.steelGrade || "Grade 500B"} | Heat #: ${s.heatNumber || "N/A"} | Yield: ${yieldStr} MPa | Tensile: ${tenStr} MPa | Result: ${res}`;
    });
    const bbsLines = schedules.slice(0, 10).map((b) => {
      return `• [${b.scheduleNumber || b.id}] "${b.title}" | Level: ${b.levelName || "Site"} | Weight: ${b.summary?.totalCutWeightKg || 0} kg | Status: ${b.status || "DRAFT"}`;
    });
    sections.push(`[STEEL REBAR TESTS & BBS]:\nTests (${steels.length}):\n${steelLines.join("\n") || "No steel mill tests logged."}\nBar Cutting Schedules (${schedules.length}):\n${bbsLines.join("\n") || "No BBS logged."}`);
  }

  // Section: Inspections & Hold Points (WIR)
  if (!canInspections) {
    sections.push(`[INSPECTIONS & HOLD POINTS]: Access restricted for your role (${userRoleStr}).`);
  } else if (inspections.length === 0) {
    sections.push(`[INSPECTIONS & HOLD POINTS]: Zero inspection requests logged.`);
  } else {
    const inspLines = inspections.slice(0, 25).map((i) => {
      return `• [${i.inspectionNumber || i.id}] Type: ${i.templateName || i.stage || "Inspection"} | Status: ${i.status} | Element/Location: ${i.elementName || i.zone || i.levelName || "Site"} | Scheduled: ${i.scheduledDate || "N/A"} ${i.scheduledTime || ""} | Pass Score: ${i.passScore || i.qualityScore || 0}% | Inspector: ${i.inspector?.name || i.inspectorName || "Assigned"}`;
    });
    sections.push(`[INSPECTIONS & HOLD POINTS - ${inspections.length} Records]:\n${inspLines.join("\n")}`);
  }

  // Section: Daily Site Logs
  if (!canDailyLogs) {
    sections.push(`[DAILY SITE LOGS]: Access restricted for your role (${userRoleStr}).`);
  } else if (logs.length === 0) {
    sections.push(`[DAILY SITE LOGS]: Zero daily site logs recorded.`);
  } else {
    const logLines = logs.slice(0, 10).map((l) => {
      const logDate = l.generalConditions?.date || "N/A";
      const weather = l.generalConditions?.weather || "Clear";
      const totalWorkers = (l.manpower || []).reduce((acc, m) => acc + (m.headCount || 0), 0);
      const actSummary = (l.activities || []).map((a) => `${a.trade}: ${a.description}`).slice(0, 3).join("; ");
      const delaySummary = (l.delays || []).map((d) => `${d.category} (${d.impactHours}h): ${d.description}`).join("; ");
      return `• [${l.logNumber || l.id}] Date: ${logDate} | Weather: ${weather} | Manpower: ${totalWorkers} men | Status: ${l.status || "DRAFT"} | Activities: "${actSummary || "Scheduled site works"}" | Delays: "${delaySummary || "None"}"`;
    });
    sections.push(`[DAILY SITE LOGS - ${logs.length} Records (Showing Recent)]:\n${logLines.join("\n")}`);
  }

  // Section: Site Instructions (SI)
  if (!canSI) {
    sections.push(`[SITE INSTRUCTIONS (SI)]: Access restricted for your role (${userRoleStr}).`);
  } else if (instructions.length === 0) {
    sections.push(`[SITE INSTRUCTIONS (SI)]: Zero site instructions issued.`);
  } else {
    const siLines = instructions.slice(0, 15).map((s) => {
      return `• [${s.instructionNumber || s.id}] Status: ${s.status} | Title: "${s.title || s.subject}" | Severity: ${s.severity || "MODERATE"} | Contractor: ${s.contractorName || s.recipientName || "Main Contractor"} | Deadline: ${s.complianceDeadline || "Immediate"} | Directive: "${(s.instructionText || s.issueSummary || "").slice(0, 120)}"`;
    });
    sections.push(`[SITE INSTRUCTIONS (SI) - ${instructions.length} Records]:\n${siLines.join("\n")}`);
  }

  // Section: Site Comments & Snag Observations
  if (!canComments) {
    sections.push(`[SITE COMMENTS / OBSERVATIONS]: Access restricted for your role (${userRoleStr}).`);
  } else if (comments.length === 0) {
    sections.push(`[SITE COMMENTS / OBSERVATIONS]: Zero site comments recorded.`);
  } else {
    const commentLines = comments.slice(0, 15).map((c) => {
      const obsText = (c.observations || []).map((o) => o.observationText).slice(0, 2).join("; ");
      return `• [${c.reportNumber || c.id}] Status: ${c.status || "OPEN"} | Title: "${c.title || c.locationDescription || "Site Observation"}" | Inspection Date: ${c.inspectionDate || "N/A"} | Observations: "${obsText.slice(0, 120)}"`;
    });
    sections.push(`[SITE OBSERVATIONS & FIELD COMMENTS - ${comments.length} Records]:\n${commentLines.join("\n")}`);
  }

  // Section: Engineering Submittals (RFI, MAR, MIR)
  if (!canSubmittals) {
    sections.push(`[ENGINEERING SUBMITTALS (RFI, MAR, MIR)]: Access restricted for your role (${userRoleStr}).`);
  } else {
    const rfiLines = rfis.slice(0, 10).map((r) => `• RFI [${r.rfiNumber || r.id}] Status: ${r.status} | Title: "${r.title}" | Discipline: ${r.discipline || "General"}`);
    const marLines = mars.slice(0, 10).map((m) => `• MAR [${m.marNumber || m.id}] Status: ${m.status} | Title: "${m.title}" | Vendor: ${m.supplierVendor || "N/A"}`);
    const mirLines = mirs.slice(0, 10).map((i) => `• MIR [${i.mirNumber || i.id}] Status: ${i.status} | Title: "${i.title}" | Delivery Ref: ${i.deliveryNumber || "N/A"}`);
    sections.push(`[SUBMITTALS & MATERIAL APPROVALS]:
RFIs (${rfis.length}):\n${rfiLines.join("\n") || "No RFIs logged."}
MARs (${mars.length}):\n${marLines.join("\n") || "No MARs logged."}
MIRs (${mirs.length}):\n${mirLines.join("\n") || "No MIRs logged."}`);
  }

  // Section: Structural BIM Elements & Spatial Hierarchy
  if (!canElements) {
    sections.push(`[STRUCTURAL BIM ELEMENTS]: Access restricted by RBAC (Strict QA/QC Authority required).`);
  } else if (elements.length === 0) {
    sections.push(`[STRUCTURAL BIM ELEMENTS]: Zero structural elements registered in project BIM database.`);
  } else {
    const elementLines = elements.slice(0, 30).map((e) => {
      const vol = e.calculatedVolume || e.volume || 0;
      return `• [${e.elementName || e.name || e.id}] Type: ${e.elementType} | Level: ${e.levelName || "Site"} | Grid: ${e.grid || e.gridAxis || "N/A"} | Volume: ${vol} m³ | Status: ${e.status}`;
    });
    sections.push(`[STRUCTURAL BIM ELEMENTS - Total Registered: ${elements.length}]:\n${elementLines.join("\n")}`);
  }

  // Section: Floor Levels, Gridlines & Work Packages
  const levelNames = levels.map((l) => `${l.name} (Elev: ${l.elevation}m)`).join(", ") || "None defined";
  const gridlineNames = gridlines.map((g) => `${g.label} (${g.axis})`).join(", ") || "None defined";
  const packageNames = workPackages.map((w) => `${w.name} (${w.code || "WP"})`).join(", ") || "None defined";
  sections.push(`[SPATIAL STRUCTURE & WORK PACKAGES]:
Levels: ${levelNames}
Gridlines: ${gridlineNames}
Work Packages: ${packageNames}`);

  // Section: Punch List Items
  if (!canPunch) {
    sections.push(`[PUNCH LIST ITEMS]: Access restricted for your role (${userRoleStr}).`);
  } else if (punches.length === 0) {
    sections.push(`[PUNCH LIST ITEMS]: Zero punch list snag items recorded.`);
  } else {
    const punchLines = punches.slice(0, 15).map((p) => {
      return `• [${p.punchNumber || p.id}] Stage: ${p.stageStatus} | Severity: ${p.severity} | Location: ${p.building || ""} - ${p.levelName || ""} - ${p.roomName || ""} | Snag: "${p.title || p.description.slice(0, 80)}"`;
    });
    sections.push(`[PUNCH LIST & HANDOVER SNAGS - ${punches.length} Items]:\n${punchLines.join("\n")}`);
  }

  // Section: Method Statements & ITPs
  if (canMethodStatements || canITP) {
    const methodSummary = methods.slice(0, 10).map((m) => `• [${m.msNumber || m.id}] "${m.title}" (${m.discipline}) - Status: ${m.status}`).join("\n");
    const itpSummary = itps.slice(0, 10).map((i) => `• [${i.itpNumber || i.id}] "${i.title}" (${i.discipline}) - Status: ${i.status}`).join("\n");
    sections.push(`[APPROVED METHOD STATEMENTS & ITP PLANS]:
Method Statements (${methods.length}):\n${methodSummary || "None registered."}
ITP Plans (${itps.length}):\n${itpSummary || "None registered."}`);
  }

  // Section: Weekly Quality Reports
  if (canWeekly && weekly.length > 0) {
    const weeklySummary = weekly.slice(0, 5).map((w) => `• [${w.reportNumber || w.id}] Week Starting: ${w.weekStarting || "N/A"} | Status: ${w.status || "FINAL"} | Summary: "${(w.executiveSummary || "").slice(0, 120)}"`).join("\n");
    sections.push(`[WEEKLY QUALITY REPORTS - ${weekly.length} Records]:\n${weeklySummary}`);
  }

  const finalSummary = sections.join("\n\n");
  contextCache.set(cacheKey, { summary: finalSummary, timestamp: Date.now() });
  return finalSummary;
}
