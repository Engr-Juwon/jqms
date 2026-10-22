import { StructuralElement, ProjectLevel, WorkPackage, NonConformanceReport } from "@/types";
import { getOrCalculateVolume } from "./elementCalculations";

export type ElementIssueSeverity = "CRITICAL" | "WARNING" | "INFO";

export type ElementIssueType =
  | "ZERO_VOLUME"
  | "VOLUME_MISMATCH"
  | "ACHIEVED_VOLUME_MISMATCH"
  | "ORPHAN_LEVEL"
  | "DUPLICATE_NAME"
  | "MISSING_GRID"
  | "MISSING_GRADE"
  | "INVALID_DIMENSIONS"
  | "ACTIVE_NCR_HOLD"
  | "ELEVATION_MISMATCH";

export interface ElementDiagnosticIssue {
  id: string;
  elementId: string;
  elementName: string;
  levelName?: string;
  issueType: ElementIssueType;
  severity: ElementIssueSeverity;
  title: string;
  description: string;
  currentValue?: any;
  suggestedValue?: any;
  autoFixable: boolean;
}

export interface ElementHealthSummary {
  totalElements: number;
  healthyElements: number;
  healthScore: number; // 0 to 100
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  issues: ElementDiagnosticIssue[];
  issuesByType: Record<ElementIssueType, ElementDiagnosticIssue[]>;
}

/**
 * Calculates raw geometric volume purely based on element dimensions
 * without using the stored calculatedVolume fallback.
 */
export function calculatePureGeometricVolume(el: Partial<StructuralElement>): number {
  const dummyEl = {
    ...el,
    calculatedVolume: undefined,
    volume: undefined,
  };
  return getOrCalculateVolume(dummyEl);
}

/**
 * Runs comprehensive QA/QC diagnostics across structural elements to detect
 * calculation drift, orphaned records, status discrepancies, and missing metadata.
 */
export function auditStructuralElements(
  elements: StructuralElement[],
  levels: ProjectLevel[] = [],
  _packages: WorkPackage[] = [],
  ncrs: NonConformanceReport[] = [],
): ElementHealthSummary {
  const issues: ElementDiagnosticIssue[] = [];
  const levelIdMap = new Map<string, ProjectLevel>();
  levels.forEach((lvl) => {
    levelIdMap.set(lvl.id, lvl);
    if ((lvl as any)._id) levelIdMap.set((lvl as any)._id, lvl);
  });

  // NCR lookup for active holds
  const activeNcrMap = new Map<string, NonConformanceReport[]>();
  ncrs.forEach((ncr) => {
    const isClosed = ncr.status === "CLOSED" || ncr.status === "RESOLVED" || ncr.status === "CANCELLED";
    if (!isClosed) {
      const elId = ncr.elementId || (ncr as any).structuralElementId;
      if (elId) {
        if (!activeNcrMap.has(elId)) activeNcrMap.set(elId, []);
        activeNcrMap.get(elId)!.push(ncr);
      }
    }
  });

  // Level + Name lookup to detect duplicate element names
  const levelNameCount = new Map<string, StructuralElement[]>();

  elements.forEach((el) => {
    const lvlKey = `${el.levelId || "NO_LEVEL"}::${(el.elementName || "").trim().toUpperCase()}`;
    if (!levelNameCount.has(lvlKey)) levelNameCount.set(lvlKey, []);
    levelNameCount.get(lvlKey)!.push(el);

    const levelObj = el.levelId ? levelIdMap.get(el.levelId) : undefined;
    const levelDisplay = levelObj?.name || el.levelName || el.level || "Unassigned Level";

    const savedVol = parseFloat(String(el.calculatedVolume || el.volume || 0)) || 0;
    const achVol = parseFloat(String(el.achievedVolume ?? (el as any).completedVolume ?? 0)) || 0;
    const pureGeoVol = calculatePureGeometricVolume(el);
    const status = String(el.status || "PENDING").toUpperCase();

    // 1. Zero or Missing Volume
    if (savedVol <= 0) {
      issues.push({
        id: `${el.id}-zero-vol`,
        elementId: el.id,
        elementName: el.elementName || "Unnamed Element",
        levelName: levelDisplay,
        issueType: "ZERO_VOLUME",
        severity: "CRITICAL",
        title: "Zero Concrete Volume",
        description: `Element has 0.00 m³ volume recorded. Calculated geometric estimate is ${pureGeoVol.toFixed(3)} m³.`,
        currentValue: savedVol,
        suggestedValue: pureGeoVol,
        autoFixable: pureGeoVol > 0,
      });
    } else if (pureGeoVol > 0 && Math.abs(savedVol - pureGeoVol) / Math.max(savedVol, pureGeoVol) > 0.15) {
      // 2. Volume Mismatch (>15% variance from current dimensions)
      issues.push({
        id: `${el.id}-vol-mismatch`,
        elementId: el.id,
        elementName: el.elementName || "Unnamed Element",
        levelName: levelDisplay,
        issueType: "VOLUME_MISMATCH",
        severity: "WARNING",
        title: "Volume Mismatch with Dimensions",
        description: `Saved volume is ${savedVol.toFixed(3)} m³, but geometry indicates ${pureGeoVol.toFixed(3)} m³ (${Math.round(Math.abs(savedVol - pureGeoVol) / savedVol * 100)}% variance).`,
        currentValue: savedVol,
        suggestedValue: pureGeoVol,
        autoFixable: true,
      });
    }

    // 3. Achieved Volume & Status Inconsistency
    const isCompleted = status === "POURED" || status === "APPROVED" || status === "COMPLETED";
    if (isCompleted && achVol <= 0 && savedVol > 0) {
      issues.push({
        id: `${el.id}-ach-zero`,
        elementId: el.id,
        elementName: el.elementName || "Unnamed Element",
        levelName: levelDisplay,
        issueType: "ACHIEVED_VOLUME_MISMATCH",
        severity: "CRITICAL",
        title: "Poured/Approved with 0 m³ Achieved",
        description: `Status is "${status}", but achieved volume is 0.00 m³ instead of ${savedVol.toFixed(3)} m³.`,
        currentValue: achVol,
        suggestedValue: savedVol,
        autoFixable: true,
      });
    } else if (!isCompleted && achVol > 0 && status === "PENDING") {
      issues.push({
        id: `${el.id}-ach-pending`,
        elementId: el.id,
        elementName: el.elementName || "Unnamed Element",
        levelName: levelDisplay,
        issueType: "ACHIEVED_VOLUME_MISMATCH",
        severity: "WARNING",
        title: "Pending Element with Achieved Volume",
        description: `Element is marked "PENDING" but records ${achVol.toFixed(3)} m³ achieved volume.`,
        currentValue: achVol,
        suggestedValue: 0,
        autoFixable: true,
      });
    }

    // 4. Orphaned Level Check
    if (levels.length > 0) {
      if (!el.levelId || !levelIdMap.has(el.levelId)) {
        issues.push({
          id: `${el.id}-orphan-lvl`,
          elementId: el.id,
          elementName: el.elementName || "Unnamed Element",
          levelName: el.levelName || "Missing Level",
          issueType: "ORPHAN_LEVEL",
          severity: "CRITICAL",
          title: "Orphaned Level Link",
          description: el.levelId ? `Level ID "${el.levelId}" no longer exists in project levels.` : "Element has no level assigned.",
          currentValue: el.levelId,
          suggestedValue: levels[0]?.id,
          autoFixable: levels.length > 0,
        });
      }
    }

    // 5. Missing Grid Coordinate
    if (!el.grid || !String(el.grid).trim()) {
      issues.push({
        id: `${el.id}-missing-grid`,
        elementId: el.id,
        elementName: el.elementName || "Unnamed Element",
        levelName: levelDisplay,
        issueType: "MISSING_GRID",
        severity: "INFO",
        title: "Missing Grid Location",
        description: "Grid coordinate is blank, hindering site orientation.",
        currentValue: "",
        suggestedValue: "e.g. 1-2/A-B",
        autoFixable: false,
      });
    }

    // 6. Missing Concrete Grade
    if (!el.concreteGrade || !String(el.concreteGrade).trim()) {
      issues.push({
        id: `${el.id}-missing-grade`,
        elementId: el.id,
        elementName: el.elementName || "Unnamed Element",
        levelName: levelDisplay,
        issueType: "MISSING_GRADE",
        severity: "INFO",
        title: "Unspecified Concrete Grade",
        description: "Concrete specification (e.g. C35/45) is not recorded.",
        currentValue: "",
        suggestedValue: "C35/45",
        autoFixable: true,
      });
    }

    // 7. Active NCR Hold
    const activeNcrsForEl = activeNcrMap.get(el.id) || [];
    if (isCompleted && activeNcrsForEl.length > 0) {
      issues.push({
        id: `${el.id}-ncr-hold`,
        elementId: el.id,
        elementName: el.elementName || "Unnamed Element",
        levelName: levelDisplay,
        issueType: "ACTIVE_NCR_HOLD",
        severity: "CRITICAL",
        title: "QA/QC Statutory Hold: Unresolved NCR",
        description: `Element is "${status}" but has ${activeNcrsForEl.length} active Non-Conformance Report(s) (${activeNcrsForEl[0].ncrNumber || "NCR"}).`,
        currentValue: activeNcrsForEl[0].ncrNumber,
        suggestedValue: "Requires QA/QC Sign-off",
        autoFixable: false,
      });
    }

    // 8. Elevation Datum Mismatch
    if (levelObj && levelObj.elevation !== undefined && levelObj.elevation !== null) {
      const offset = Number(el.elevationOffset) || 0;
      const expectedElev = Number((levelObj.elevation + offset).toFixed(3));
      const currentElev = el.elevation !== undefined && el.elevation !== null ? Number(Number(el.elevation).toFixed(3)) : null;
      if (currentElev !== null && Math.abs(currentElev - expectedElev) > 0.05) {
        issues.push({
          id: `${el.id}-elev-mismatch`,
          elementId: el.id,
          elementName: el.elementName || "Unnamed Element",
          levelName: levelDisplay,
          issueType: "ELEVATION_MISMATCH",
          severity: "WARNING",
          title: "Elevation Datum Mismatch",
          description: `Element elevation is ${currentElev >= 0 ? `+${currentElev}` : currentElev}m, but ${levelDisplay} datum is ${levelObj.elevation >= 0 ? `+${levelObj.elevation}` : levelObj.elevation}m (offset: ${offset >= 0 ? `+${offset}` : offset}m). Expected base elevation: ${expectedElev >= 0 ? `+${expectedElev}` : expectedElev}m.`,
          currentValue: currentElev,
          suggestedValue: expectedElev,
          autoFixable: true,
        });
      }
    }
  });

  // Duplicate Element Name Check
  levelNameCount.forEach((list, key) => {
    if (list.length > 1) {
      const [lvlId, name] = key.split("::");
      const lvlObj = lvlId !== "NO_LEVEL" ? levelIdMap.get(lvlId) : undefined;
      const lvlName = lvlObj?.name || "Floor";
      list.forEach((el, index) => {
        issues.push({
          id: `${el.id}-dup-name`,
          elementId: el.id,
          elementName: el.elementName,
          levelName: lvlName,
          issueType: "DUPLICATE_NAME",
          severity: "WARNING",
          title: "Duplicate Element Identifier",
          description: `${list.length} elements share the name "${name}" on ${lvlName}.`,
          currentValue: el.elementName,
          suggestedValue: index > 0 ? `${el.elementName}-${String.fromCharCode(65 + index)}` : el.elementName,
          autoFixable: true,
        });
      });
    }
  });

  // Compute Summary Statistics
  const issuesByType: Record<ElementIssueType, ElementDiagnosticIssue[]> = {
    ZERO_VOLUME: [],
    VOLUME_MISMATCH: [],
    ACHIEVED_VOLUME_MISMATCH: [],
    ORPHAN_LEVEL: [],
    DUPLICATE_NAME: [],
    MISSING_GRID: [],
    MISSING_GRADE: [],
    INVALID_DIMENSIONS: [],
    ACTIVE_NCR_HOLD: [],
    ELEVATION_MISMATCH: [],
  };

  let criticalCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  issues.forEach((iss) => {
    issuesByType[iss.issueType].push(iss);
    if (iss.severity === "CRITICAL") criticalCount++;
    else if (iss.severity === "WARNING") warningCount++;
    else infoCount++;
  });

  const elementsWithIssues = new Set(issues.map((i) => i.elementId));
  const healthyElements = Math.max(0, elements.length - elementsWithIssues.size);
  const healthScore = elements.length > 0 ? Math.round((healthyElements / elements.length) * 100) : 100;

  return {
    totalElements: elements.length,
    healthyElements,
    healthScore,
    criticalCount,
    warningCount,
    infoCount,
    issues,
    issuesByType,
  };
}
