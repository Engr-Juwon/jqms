import { dbService } from "@/lib/db";
import { UserProfile, Project, UserRole } from "@/types";

export interface ProjectContextOptions {
  projectId?: string;
  companyId?: string;
  user?: UserProfile | null;
  activeProject?: Project | null;
  userPrompt?: string;
  currentRoute?: string;
  currentDocumentId?: string;
}

// In-memory cache for project context snapshots: key = `${projectId}_${companyId}`
const contextCache = new Map<string, { summary: string; timestamp: number }>();
const CACHE_TTL_MS = 15000; // 15 seconds TTL for fast, responsive multi-turn chats

/**
 * Builds a comprehensive, live database snapshot for the active project,
 * giving the AI assistant complete, unrestricted visibility into all engineering entities.
 */
export async function buildProjectDatabaseContext(
  options: ProjectContextOptions,
): Promise<string> {
  const effectiveProjectId =
    options.projectId ||
    options.activeProject?.id ||
    (typeof localStorage !== "undefined"
      ? localStorage.getItem("jqms_active_project_id") ||
        localStorage.getItem("currentProjectId")
      : "") ||
    "";

  const { companyId, user, activeProject, currentRoute, currentDocumentId } =
    options;

  if (!effectiveProjectId) {
    return "No active project selected in Jay-QMS. The user is currently in global or company view.";
  }

  const role: UserRole | undefined = user?.role;
  const userRoleStr = role || "ENGINEER";

  // Check cache to prevent redundant Firestore roundtrips during rapid conversation turns
  const cacheKey = `${effectiveProjectId}_${companyId || ""}`;
  const cached = contextCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.summary;
  }

  // Fetch ALL Project Data Entities in Parallel (Unrestricted Access for AI Intelligence)
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
    deliveriesRes,
    photosRes,
    plannerEventsRes,
    documentsRes,
  ] = await Promise.allSettled([
    dbService.getNCRs(effectiveProjectId, companyId),
    dbService.getPermitsToPour(effectiveProjectId, companyId),
    dbService.getInspections(effectiveProjectId, companyId),
    dbService.getCubeSamples(effectiveProjectId, companyId),
    dbService.getSteelTests(effectiveProjectId, companyId),
    dbService.getDailySiteLogs(effectiveProjectId, companyId),
    dbService.getSiteInstructions(effectiveProjectId, companyId),
    dbService.getSiteComments(effectiveProjectId, companyId),
    dbService.getRFIs(effectiveProjectId, companyId),
    dbService.getMARs(effectiveProjectId, companyId),
    dbService.getMIRs(effectiveProjectId, companyId),
    dbService.getElements(effectiveProjectId, companyId),
    dbService.getLevels(effectiveProjectId, companyId),
    dbService.getGridlines(effectiveProjectId, companyId),
    dbService.getWorkPackages(effectiveProjectId, companyId),
    dbService.getRoomPunchItems(effectiveProjectId, companyId),
    dbService.getWeeklyReports(effectiveProjectId, companyId),
    dbService.getMethodStatements(effectiveProjectId, companyId),
    dbService.getITPPlans(effectiveProjectId, companyId),
    dbService.getBarCuttingSchedules(effectiveProjectId, companyId),
    dbService.getDeliveries(effectiveProjectId, companyId),
    dbService.getSitePhotos(effectiveProjectId, companyId),
    dbService.getPlannerEvents(effectiveProjectId, companyId),
    dbService.getDocuments(effectiveProjectId, companyId),
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
  const deliveries = deliveriesRes.status === "fulfilled" ? deliveriesRes.value || [] : [];
  const photos = photosRes.status === "fulfilled" ? photosRes.value || [] : [];
  const plannerEvents = plannerEventsRes.status === "fulfilled" ? plannerEventsRes.value || [] : [];
  const documents = documentsRes.status === "fulfilled" ? documentsRes.value || [] : [];

  // 3. Assemble Structured Knowledge Snapshot
  const sections: string[] = [];

  // Header & Project Metadata
  const projName = activeProject?.name || "First Floor Bankside";
  sections.push(`=== COMPLETE LIVE DATABASE INTELLIGENCE SNAPSHOT: "${projName}" (${activeProject?.code || "CDL-BS"}) ===`);
  sections.push(`User: ${user?.fullName || "Engineer"} | Professional Title: ${user?.title || user?.designation || userRoleStr} | Role: ${role || "ENGINEER"}`);
  if (currentRoute) {
    sections.push(`Active User Screen / Route: ${currentRoute}${currentDocumentId ? ` | Active Document ID: ${currentDocumentId}` : ""}`);
  }
  if (activeProject) {
    sections.push(`Project Details: Status=${activeProject.status || "ACTIVE"}, Client=${activeProject.clientName || "N/A"}, Main Contractor=${activeProject.contractorName || "N/A"}, Location=${activeProject.location || "Site"}`);
  }

  // Summary Metrics Bar
  const openNCRCount = ncrs.filter((n) => n.status === "OPEN" || n.status === "UNDER_REVIEW").length;
  const activePTPCount = ptps.filter((p) => p.status === "APPROVED" || p.status === "PENDING_APPROVAL" || p.status === "ISSUED").length;
  const pendingInspCount = inspections.filter((i) => i.status === "SCHEDULED" || i.status === "SUBMITTED" || i.status === "PENDING_REVIEW").length;
  const failedCubeCount = cubes.filter((c) => c.status === "FAIL" || c.overallStatus === "FAIL").length;
  const openPunchCount = punches.filter((p) => p.stageStatus === "DRAFT" || p.stageStatus === "ISSUED" || p.stageStatus === "RECTIFIED").length;

  // Active On-Screen Document Deep Inspection (if user is currently viewing a specific record)
  if (currentDocumentId) {
    const activeWeekly = weekly.find((w) => w.id === currentDocumentId || w.reportNumber === currentDocumentId);
    if (activeWeekly) {
      sections.push(`
=== CURRENTLY VIEWED DOCUMENT ON USER SCREEN: WEEKLY QUALITY REPORT ===
• Document ID: ${activeWeekly.id}
• Report Number: ${activeWeekly.reportNumber || activeWeekly.id}
• Exact Title: "${activeWeekly.title || "QAQC WEEKLY REPORT - 01 - FIRST FLOOR BANKSIDE"}"
• Database Storage: Stored in Cloud Firestore under collection 'weeklyReports' (doc ID: '${activeWeekly.id}', Project ID: '${effectiveProjectId}')
• Level: ${activeWeekly.selectedLevel || activeWeekly.selectedLevelName || "All Structural Levels"}
• Period: ${activeWeekly.startDate || activeWeekly.weekStart || "N/A"} to ${activeWeekly.endDate || activeWeekly.weekEnd || "N/A"}
• Quality Compliance Rate: ${activeWeekly.overallQualityCompliance ?? 95}%
• Total Placed Concrete Volume: ${activeWeekly.totalVolumeCalculated ?? 0} m³
• Status: ${activeWeekly.status || "FINAL"}
• Executive Summary:
  "${activeWeekly.executiveSummary || "No summary provided."}"
• Key Achievements:
  ${(activeWeekly.keyAchievements || []).map((a: string) => `- ${a}`).join("\n  ") || "None specified"}
• Critical Quality Issues:
  ${(activeWeekly.criticalQualityIssues || []).map((q: string) => `- ${q}`).join("\n  ") || "Zero critical quality defects flagged"}
========================================================================`);
    } else {
      const activeNcr = ncrs.find((n) => n.id === currentDocumentId || n.ncrNumber === currentDocumentId);
      if (activeNcr) {
        sections.push(`
=== CURRENTLY VIEWED DOCUMENT ON USER SCREEN: NON-CONFORMANCE REPORT (NCR) ===
• Document ID: ${activeNcr.id} | NCR Number: ${activeNcr.ncrNumber || activeNcr.id}
• Title: "${activeNcr.title}" | Status: ${activeNcr.status} | Severity: ${activeNcr.severity}
• Location: ${activeNcr.elementName || activeNcr.locationLevel || "Site"} (Grid: ${activeNcr.gridAxis || activeNcr.gridLine || "N/A"})
• Root Cause: "${activeNcr.rootCause || "Under Investigation"}"
• Corrective Action: "${activeNcr.correctiveAction || "Pending"}"
• Database Storage: Cloud Firestore collection 'ncrs' (doc ID: '${activeNcr.id}')
==============================================================================`);
      } else {
        const activePtp = ptps.find((p) => p.id === currentDocumentId || p.ptpNumber === currentDocumentId);
        if (activePtp) {
          sections.push(`
=== CURRENTLY VIEWED DOCUMENT ON USER SCREEN: PERMIT TO POUR (PTP) ===
• Document ID: ${activePtp.id} | PTP Number: ${activePtp.ptpNumber || activePtp.id}
• Element: ${activePtp.elementName} (${activePtp.levelName}) | Status: ${activePtp.status}
• Planned Pour: ${activePtp.plannedPourDate} ${activePtp.plannedPourTime || ""}
• Volume: ${activePtp.targetVolumeM3} m³ | Concrete Grade: ${activePtp.concreteGrade}
• Database Storage: Cloud Firestore collection 'permitsToPour' (doc ID: '${activePtp.id}')
=====================================================================`);
        }
      }
    }
  }

  sections.push(`
DATABASE ENTITY COUNTS FOR ACTIVE PROJECT:
- Weekly QA/QC Reports: ${weekly.length}
- Material Deliveries & Inspections: ${deliveries.length}
- Non-Conformance Reports (NCR): ${ncrs.length} (${openNCRCount} open/under-review)
- Permits to Pour (PTP): ${ptps.length} (${activePTPCount} active/pending)
- Work Inspections (WIR): ${inspections.length} (${pendingInspCount} pending/scheduled)
- Concrete Cube Samples: ${cubes.length} (${failedCubeCount} failed)
- Steel Rebar Tests: ${steels.length} | Bar Schedules (BBS): ${schedules.length}
- Daily Site Logs: ${logs.length}
- Site Instructions (SI): ${instructions.length}
- Site Observations / Comments: ${comments.length}
- Submittals: RFIs=${rfis.length}, MARs=${mars.length}, MIRs=${mirs.length}
- Structural Elements (BIM): ${elements.length}
- Spatial: Levels=${levels.length}, Gridlines=${gridlines.length}, Work Packages=${workPackages.length}
- Punch List Snags: ${punches.length} (${openPunchCount} open)
- Method Statements: ${methods.length} | ITP Quality Plans: ${itps.length}
- Site Photos: ${photos.length} | Planner Milestones: ${plannerEvents.length} | Project Documents: ${documents.length}
`);

  // Section: Weekly QA/QC Executive Reports (Full Transparency)
  if (weekly.length === 0) {
    sections.push(`[WEEKLY QA/QC QUALITY REPORTS]: Zero weekly reports logged in this project database.`);
  } else {
    const weeklyLines = weekly.slice(0, 20).map((w) => {
      const title = w.title || "Weekly Quality Report";
      const no = w.reportNumber || w.id;
      const lvl = w.selectedLevel || w.selectedLevelName || "All Levels";
      const compliance = w.overallQualityCompliance ?? 95;
      const vol = w.totalVolumeCalculated ?? 0;
      const exec = (w.executiveSummary || "").replace(/\n+/g, " ").slice(0, 250);
      const start = w.startDate || w.weekStart || "N/A";
      const end = w.endDate || w.weekEnd || "N/A";
      return `• [Report: ${no} | Doc ID: ${w.id}]
  ├── Title: "${title}"
  ├── Storage Location: Cloud Firestore collection 'weeklyReports', doc ID: '${w.id}'
  ├── Level: ${lvl} | Period: ${start} to ${end} | Status: ${w.status || "FINAL"}
  ├── Quality Compliance: ${compliance}% | Total Concrete Placed: ${vol} m³
  └── Executive Summary: "${exec || "Weekly QA/QC summary logged."}"`;
    });
    sections.push(`[WEEKLY QA/QC QUALITY REPORTS - ${weekly.length} Records in Firestore collection 'weeklyReports']:\n${weeklyLines.join("\n\n")}`);
  }

  // Section: Material Deliveries
  if (deliveries.length === 0) {
    sections.push(`[MATERIAL DELIVERIES]: Zero material delivery tickets logged.`);
  } else {
    const deliveryLines = deliveries.slice(0, 25).map((d) => {
      const mat = d.materialName || (d as any).material || "Material";
      const supp = d.supplier || d.supplierName || "Supplier";
      const date = d.deliveryDate || (d as any).date || "N/A";
      const qtyRec = d.quantityReceived ?? d.quantity ?? 0;
      const qtyAcc = d.quantityAccepted ?? qtyRec;
      const qtyRej = d.quantityRejected ?? 0;
      const unit = d.unit || "units";
      const note = d.deliveryNoteNumber || d.deliveryNote || "N/A";
      const st = d.qaqcStatus || d.status || "ACCEPTED";
      return `• [Delivery Note: ${note}] Material: ${mat} | Supplier: ${supp} | Date: ${date} | Received: ${qtyRec} ${unit} (Accepted: ${qtyAcc}, Rejected: ${qtyRej}) | QA/QC Status: ${st} | Batch: ${d.batchNumber || "N/A"}`;
    });
    sections.push(`[MATERIAL DELIVERIES & RECEIVING INSPECTIONS - ${deliveries.length} Records]:\n${deliveryLines.join("\n")}`);
  }

  // Section: Non-Conformance Reports (NCR)
  if (ncrs.length === 0) {
    sections.push(`[NON-CONFORMANCE REPORTS (NCR)]: Zero non-conformance reports logged.`);
  } else {
    const ncrLines = ncrs.slice(0, 30).map((n) => {
      const el = n.elementName || n.gridAxis || n.locationLevel || "Site Location";
      const raisedDate = n.raisedBy?.date || (typeof n.createdAt === "string" ? n.createdAt : new Date(n.createdAt || Date.now()).toLocaleDateString());
      return `• [${n.ncrNumber || n.id}] Status: ${n.status} | Severity: ${n.severity} | Category: ${n.category || "General"} | Title: "${n.title}" | Location: ${el} | Root Cause: "${n.rootCause || "Under Investigation"}" | Corrective Action: "${n.correctiveAction || "Pending"}" | Raised: ${raisedDate}`;
    });
    sections.push(`[NON-CONFORMANCE REPORTS (NCR) - ${ncrs.length} Records]:\n${ncrLines.join("\n")}`);
  }

  // Section: Permits to Pour (PTP)
  if (ptps.length === 0) {
    sections.push(`[PERMITS TO POUR (PTP)]: Zero permits to pour logged.`);
  } else {
    const ptpLines = ptps.slice(0, 25).map((p) => {
      const signs = Object.entries(p.clearanceSignatures || {})
        .map(([k, v]) => `${k}:${v?.signed ? "SIGNED" : "PENDING"}`)
        .join(", ");
      return `• [${p.ptpNumber || p.id}] Status: ${p.status} | Element: ${p.elementName || "Structural Member"} (${p.levelName || "Site"}) | Planned Date: ${p.plannedPourDate || "TBD"} ${p.plannedPourTime || ""} | Grade: ${p.concreteGrade || "C30/37"} | Volume: ${p.targetVolumeM3 || 0} m³ | Slump: ${p.slumpTargetMm || 0} mm | Clearances: [${signs || "None"}]`;
    });
    sections.push(`[PERMITS TO POUR (PTP) - ${ptps.length} Records]:\n${ptpLines.join("\n")}`);
  }

  // Section: Concrete Cube Testing
  if (cubes.length === 0) {
    sections.push(`[CONCRETE CUBE TESTING]: Zero cube samples recorded.`);
  } else {
    const cubeLines = cubes.slice(0, 35).map((c) => {
      const d7 = c.tests?.day7?.averageStrength ?? c.day7Results?.[0]?.averageStrength ?? "N/A";
      const d28 = c.tests?.day28?.averageStrength ?? c.day28Results?.[0]?.averageStrength ?? "N/A";
      const gradeStr = c.concreteGrade || c.targetStrength || `${c.target28DayStrengthNmm2 || ""}`;
      return `• [${c.sampleId || c.sampleNumber || c.id}] Element: ${c.elementName || c.structureElement || "Pour"} (${c.levelName || c.level || ""}) | Cast Date: ${c.castDate || (c as any).dateCast || "N/A"} | Grade: ${gradeStr} | Slump: ${c.slumpMm || "N/A"}mm | 7d: ${d7} MPa | 28d: ${d28} MPa | Status: ${c.status || c.overallStatus || "PENDING"} | Pour Ref: ${c.pourReference || "N/A"}`;
    });
    sections.push(`[CONCRETE CUBE SAMPLES & CRUSH TESTS - ${cubes.length} Records]:\n${cubeLines.join("\n")}`);
  }

  // Section: Structural BIM Elements
  if (elements.length === 0) {
    sections.push(`[STRUCTURAL BIM ELEMENTS]: Zero structural elements registered.`);
  } else {
    const elementLines = elements.slice(0, 50).map((e) => {
      const vol = e.calculatedVolume || e.volume || 0;
      const ach = e.achievedVolume ?? 0;
      const comp = (e as any).completionPercentage || (vol > 0 ? Math.round((ach / vol) * 100) : 0);
      return `• [${e.elementName || e.name || e.id}] Type: ${e.elementType || (e as any).type} | Level: ${e.levelName || e.level || "Site"} | Grid: ${e.grid || (e as any).gridLocation || "N/A"} | Volume: ${vol} m³ (Achieved: ${ach} m³, ${comp}%) | Status: ${e.status}`;
    });
    sections.push(`[STRUCTURAL BIM ELEMENTS - Total Registered: ${elements.length}]:\n${elementLines.join("\n")}`);
  }

  // Section: Inspections & Hold Points (WIR)
  if (inspections.length === 0) {
    sections.push(`[INSPECTIONS & HOLD POINTS]: Zero inspection requests logged.`);
  } else {
    const inspLines = inspections.slice(0, 25).map((i) => {
      return `• [${i.inspectionNumber || i.id}] Type: ${i.templateName || (i as any).title || "Inspection"} | Status: ${i.status} | Location: ${i.elementName || (i as any).level || "Site"} | Scheduled: ${i.scheduledDate || "N/A"} ${i.scheduledTime || ""} | Inspector: ${i.inspector?.name || i.inspectorName || "Assigned"}`;
    });
    sections.push(`[INSPECTIONS & HOLD POINTS - ${inspections.length} Records]:\n${inspLines.join("\n")}`);
  }

  // Section: Daily Site Logs
  if (logs.length === 0) {
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
    sections.push(`[DAILY SITE LOGS - ${logs.length} Records]:\n${logLines.join("\n")}`);
  }

  // Section: Site Instructions (SI)
  if (instructions.length === 0) {
    sections.push(`[SITE INSTRUCTIONS (SI)]: Zero site instructions issued.`);
  } else {
    const siLines = instructions.slice(0, 15).map((s) => {
      return `• [${s.instructionNumber || s.id}] Status: ${s.status} | Title: "${s.title || s.subject}" | Severity: ${s.severity || "MODERATE"} | Contractor: ${s.contractorName || s.recipientName || "Main Contractor"} | Deadline: ${s.complianceDeadline || (s as any).dueDate || "Immediate"} | Directive: "${(s.instructionText || s.issueSummary || "").slice(0, 120)}"`;
    });
    sections.push(`[SITE INSTRUCTIONS (SI) - ${instructions.length} Records]:\n${siLines.join("\n")}`);
  }

  // Section: Site Comments & Snag Observations
  if (comments.length === 0) {
    sections.push(`[SITE COMMENTS / OBSERVATIONS]: Zero site comments recorded.`);
  } else {
    const commentLines = comments.slice(0, 15).map((c) => {
      const obsText = (c.observations || []).map((o) => o.observationText).slice(0, 2).join("; ");
      return `• [${c.reportNumber || c.id}] Status: ${c.status || "OPEN"} | Title: "${c.title || c.locationDescription || "Site Observation"}" | Inspection Date: ${c.inspectionDate || "N/A"} | Observations: "${obsText.slice(0, 120)}"`;
    });
    sections.push(`[SITE OBSERVATIONS & FIELD COMMENTS - ${comments.length} Records]:\n${commentLines.join("\n")}`);
  }

  // Section: Engineering Submittals (RFI, MAR, MIR)
  const rfiLines = rfis.slice(0, 10).map((r) => `• RFI [${r.rfiNumber || r.id}] Status: ${r.status} | Title: "${r.title}" | Discipline: ${r.discipline || "General"}`);
  const marLines = mars.slice(0, 10).map((m) => `• MAR [${m.marNumber || m.id}] Status: ${m.status} | Title: "${m.title}" | Vendor: ${m.supplierVendor || "N/A"}`);
  const mirLines = mirs.slice(0, 10).map((i) => `• MIR [${i.mirNumber || i.id}] Status: ${i.status} | Title: "${i.title}" | Delivery Ref: ${i.deliveryNumber || "N/A"}`);
  sections.push(`[SUBMITTALS & MATERIAL APPROVALS]:
RFIs (${rfis.length}):\n${rfiLines.join("\n") || "No RFIs logged."}
MARs (${mars.length}):\n${marLines.join("\n") || "No MARs logged."}
MIRs (${mirs.length}):\n${mirLines.join("\n") || "No MIRs logged."}`);

  // Section: Steel Rebar Tests & Bar Cutting Schedules (BBS)
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
  sections.push(`[STEEL REBAR TESTS & BBS]:
Tests (${steels.length}):\n${steelLines.join("\n") || "No steel mill tests logged."}
Bar Cutting Schedules (${schedules.length}):\n${bbsLines.join("\n") || "No BBS logged."}`);

  // Section: Spatial Hierarchy (Levels, Gridlines, Work Packages)
  const levelNames = levels.map((l) => `${l.name} (Elev: ${l.elevation}m)`).join(", ") || "None defined";
  const gridlineNames = gridlines.map((g) => `${g.label} (${g.axis})`).join(", ") || "None defined";
  const packageNames = workPackages.map((w) => `${w.name} (${w.code || "WP"})`).join(", ") || "None defined";
  sections.push(`[SPATIAL STRUCTURE & WORK PACKAGES]:
Levels: ${levelNames}
Gridlines: ${gridlineNames}
Work Packages: ${packageNames}`);

  // Section: Construction Planner Events & Milestones
  if (plannerEvents.length > 0) {
    const eventLines = plannerEvents.slice(0, 15).map((ev) => {
      return `• [${ev.title || "Milestone"}] Date: ${(ev as any).start || (ev as any).date || "TBD"} | Category: ${(ev as any).category || "General"} | Status: ${ev.status || "SCHEDULED"}`;
    });
    sections.push(`[CONSTRUCTION PLANNER & MILESTONES - ${plannerEvents.length} Events]:\n${eventLines.join("\n")}`);
  }

  // Section: Method Statements & ITP Quality Plans
  const methodSummary = methods.slice(0, 10).map((m) => `• [${m.msNumber || m.id}] "${m.title}" (${m.discipline}) - Status: ${m.status}`).join("\n");
  const itpSummary = itps.slice(0, 10).map((i) => `• [${i.itpNumber || i.id}] "${i.title}" (${i.discipline}) - Status: ${i.status}`).join("\n");
  sections.push(`[APPROVED METHOD STATEMENTS & ITP PLANS]:
Method Statements (${methods.length}):\n${methodSummary || "None registered."}
ITP Plans (${itps.length}):\n${itpSummary || "None registered."}`);

  // ═══════════════════════════════════════════════════════════════════════
  // Section: RELATIONAL TRACEABILITY & CROSS-ENTITY CORRELATIONS
  // Explicitly binds Foreign Keys across structural assets, pours, tests & defects
  // ═══════════════════════════════════════════════════════════════════════
  const relationalSections: string[] = [];

  // 1. Permit to Pour (PTP) -> Concrete Cube Samples Linkage
  if (ptps.length > 0) {
    const ptpLinks = ptps.slice(0, 15).map((p) => {
      const pRef = (p.ptpNumber || p.id).toLowerCase();
      const pEl = (p.elementName || "").toLowerCase();
      const linkedCubes = cubes.filter((c) => {
        const cPourRef = (c.pourReference || "").toLowerCase();
        const cEl = (c.elementName || "").toLowerCase();
        return (cPourRef && (cPourRef === pRef || pRef.includes(cPourRef))) || (pEl && cEl && pEl === cEl);
      });

      const cubeInfo = linkedCubes.length > 0
        ? linkedCubes.map((c) => {
            const d28 = c.tests?.day28?.averageStrength ?? c.day28Results?.[0]?.averageStrength ?? "Pending";
            return `${c.sampleId || c.sampleNumber || c.id} (28d: ${d28} MPa, ${c.status || "PENDING"})`;
          }).join(", ")
        : "No cube samples cast/recorded for this pour";

      return `• PTP [${p.ptpNumber || p.id}] -> Member: "${p.elementName}" (${p.levelName}) | Status: ${p.status}\n  └─ Cast Cube Specimens (${linkedCubes.length}): ${cubeInfo}`;
    });
    relationalSections.push(`[RELATIONAL LINKAGE: PERMIT-TO-POUR -> CONCRETE CUBES]:\n${ptpLinks.join("\n")}`);
  }

  // 2. Non-Conformance Reports (NCR) -> Escalated Site Instructions (SI) & Structural Assets
  if (ncrs.length > 0) {
    const ncrLinks = ncrs.slice(0, 15).map((n) => {
      const ncrId = n.id;
      const ncrNo = (n.ncrNumber || "").toLowerCase();
      const linkedSIs = instructions.filter((s) => {
        const sNcrId = s.ncrId;
        const sNcrNo = (s.ncrNumber || "").toLowerCase();
        const sDirective = (s.instructionText || s.issueSummary || "").toLowerCase();
        return (sNcrId && sNcrId === ncrId) || (sNcrNo && ncrNo && sNcrNo === ncrNo) || (ncrNo && sDirective.includes(ncrNo));
      });

      const siInfo = linkedSIs.length > 0
        ? linkedSIs.map((s) => `${s.instructionNumber || s.id} ("${s.title || s.subject}", Recipient: ${s.contractorName || "Contractor"}, Status: ${s.status}, Deadline: ${s.complianceDeadline})`).join(", ")
        : "None (Resolved within NCR cycle, not escalated to formal contractual SI)";

      return `• NCR [${n.ncrNumber || n.id}] "${n.title}" [Severity: ${n.severity} | Status: ${n.status}]\n  ├── Affected Asset: ${n.elementName || "Site Member"} (Level: ${n.locationLevel || n.levelName || "Site"}, Grid: ${n.gridAxis || n.gridLine || "N/A"})\n  └── Escalated Site Instruction (SI): ${siInfo}`;
    });
    relationalSections.push(`[RELATIONAL LINKAGE: NCR -> SITE INSTRUCTIONS & AFFECTED ASSETS]:\n${ncrLinks.join("\n")}`);
  }

  // 3. Structural Elements -> Full QA/QC Lifecycle Dossier (PTPs + Cubes + NCRs + Deliveries)
  if (elements.length > 0) {
    const memberDossiers = elements.slice(0, 20).map((e) => {
      const eName = (e.elementName || e.name || "").toLowerCase();
      const relPTPs = ptps.filter((p) => p.elementName && p.elementName.toLowerCase() === eName);
      const relCubes = cubes.filter((c) => c.elementName && c.elementName.toLowerCase() === eName);
      const relNCRs = ncrs.filter((n) => n.elementName && n.elementName.toLowerCase() === eName);
      const relInsps = inspections.filter((i) => i.elementName && i.elementName.toLowerCase() === eName);

      const ptpStr = relPTPs.map((p) => `${p.ptpNumber} (${p.status})`).join(", ") || "None issued";
      const cubeStr = relCubes.map((c) => {
        const d28 = c.tests?.day28?.averageStrength ?? c.day28Results?.[0]?.averageStrength ?? "Pending";
        return `${c.sampleId || c.id} [28d: ${d28} MPa, ${c.status}]`;
      }).join(", ") || "None cast";
      const ncrStr = relNCRs.map((n) => `${n.ncrNumber} [${n.severity}: ${n.status}]`).join(", ") || "CLEAN (Zero non-conformances)";
      const inspStr = relInsps.map((i) => `${i.inspectionNumber} (${i.status})`).join(", ") || "None scheduled";

      return `• Structural Member "${e.elementName || e.name || e.id}" [Type: ${e.elementType || (e as any).type} | Level: ${e.levelName || e.level || "Site"} | Grid: ${e.grid || "N/A"} | Vol: ${e.calculatedVolume || e.volume || 0} m³ | Status: ${e.status}]
  ├── Pre-Pour Clearance: ${ptpStr}
  ├── Work Inspections (WIR): ${inspStr}
  ├── Concrete Compressive Tests: ${cubeStr}
  └── Defect Ledger (NCRs): ${ncrStr}`;
    });
    relationalSections.push(`[RELATIONAL DOSSIER: STRUCTURAL ASSETS LIFECYCLE]:\n${memberDossiers.join("\n")}`);
  }

  if (relationalSections.length > 0) {
    sections.push(`=== CROSS-ENTITY RELATIONAL INTELLIGENCE & CORRELATIONS ===\n\n${relationalSections.join("\n\n")}`);
  }

  const finalSummary = sections.join("\n\n");
  contextCache.set(cacheKey, { summary: finalSummary, timestamp: Date.now() });
  return finalSummary;
}
