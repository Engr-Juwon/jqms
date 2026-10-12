import { firestore } from "@/firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  onSnapshot,
  QueryConstraint,
} from "firebase/firestore";
import { BUILTIN_TEMPLATES } from "./defaultInspectionTemplates";
import { DEFAULT_TRADES } from "./defaultTrades";
import {
  Company,
  Project,
  ProjectLevel,
  StructuralElement,
  SiteCommentReport,
  NonConformanceReport,
  RequestForInformation,
  MaterialApprovalRequest,
  InspectionRequest,
  PermitToPour,
  ConcreteCubeSample,
  SteelRebarTest,
  MaterialDelivery,
  SitePhoto,
  PlannerEvent,
  DocumentRecord,
  AuditLog,
  MasterTrade,
  InspectionTemplate,
  UserProfile,
  WeeklyReport,
  Gridline,
  WorkPackage,
  SiteInstruction,
  MaterialInspectionReport,
  DailySiteLog,
  BarCuttingSchedule,
  ITPPlan,
  ChatChannel,
  ChatMessage,
  ChatMember,
  RoomPunchItem,
  TakingOverCertificate,
  MethodStatement,
} from "@/types";
import { generateInitialSchedules } from "./sampleBBSData";
import { generateDefaultITPPlans } from "./defaultITPTemplates";
import {
  getVaultRecord,
  setVaultRecord,
  deleteVaultRecord,
  removeFromAllVaultCaches,
  upsertInVaultCache,
} from "./idbVault";

// High-speed L1 in-memory + L2 IndexedDB record cache (crash-proof with unlimited quota)
function getCache<T>(key: string, defaultVal: T): T {
  return getVaultRecord<T>(key, defaultVal);
}

function setCache<T>(key: string, data: T): void {
  setVaultRecord<T>(key, data);
}

// In-memory runtime cache for WeeklyReports to guarantee zero-loss session persistence
const inMemoryWeeklyReports = new Map<string, WeeklyReport>();

// Helper to recursively strip undefined properties before sending to Firestore
// Firestore strictly rejects writes if ANY property, nested object, or array element contains undefined
export function cleanForFirestore<T>(input: T): T {
  if (input === null || input === undefined) {
    return {} as T;
  }

  function deepSanitize(val: any): any {
    if (val === undefined) return null;
    if (val === null) return null;
    if (typeof val === "function" || typeof val === "symbol") return null;
    if (typeof val === "number") {
      if (isNaN(val) || !isFinite(val)) return 0;
      return val;
    }
    if (typeof val !== "object") return val;
    if (val instanceof Date) {
      return isNaN(val.getTime()) ? null : val.toISOString();
    }
    if (Array.isArray(val)) {
      const arr: any[] = [];
      for (const item of val) {
        if (item !== undefined) {
          const cleanedItem = deepSanitize(item);
          if (cleanedItem !== undefined) {
            arr.push(cleanedItem);
          }
        }
      }
      return arr;
    }
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v === undefined || typeof v === "function" || typeof v === "symbol") {
        continue;
      }
      const cleanedV = deepSanitize(v);
      if (cleanedV !== undefined) {
        res[k] = cleanedV;
      }
    }
    return res;
  }

  const cleaned = deepSanitize(input);
  try {
    return JSON.parse(
      JSON.stringify(cleaned, (_k, v) => (v === undefined ? null : v)),
    ) as T;
  } catch (_) {
    return cleaned as T;
  }
}

function normalizePermitToPour(raw: Record<string, any>): PermitToPour {
  const checklistItems = Array.isArray(raw.checklist) ? raw.checklist : [];
  const checklistStatus = (category: string) =>
    checklistItems
      .filter((item: any) => item.category === category)
      .every((item: any) => item.status === "PASS" || item.status === "N/A");
  const stakeholderByRole = (role: string) => {
    const stakeholder = (raw.stakeholders || []).find(
      (item: any) => item.role === role,
    );
    return stakeholder
      ? { name: stakeholder.name || role, signed: Boolean(stakeholder.signed) }
      : undefined;
  };

  return {
    ...raw,
    ptpNumber: raw.ptpNumber || raw.permitNumber || raw.id,
    levelId: raw.levelId || "lvl-site",
    levelName: raw.levelName || raw.floor || "Site Level",
    elementName:
      raw.elementName || raw.elementId || raw.building || "Pour Zone",
    plannedPourDate: raw.plannedPourDate || raw.pourDate || "",
    plannedPourTime: raw.plannedPourTime || raw.pourTime || "",
    targetVolumeM3: Number(raw.targetVolumeM3 ?? raw.estimatedVolume ?? 0),
    concreteGrade: raw.concreteGrade || "",
    slumpTargetMm: Number(raw.slumpTargetMm ?? 0),
    supplierBatchPlant:
      raw.supplierBatchPlant || raw.supplier || raw.placementMethod,
    checklistItems: Array.isArray(raw.checklist)
      ? raw.checklist
      : raw.checklistItems,
    checklist: Array.isArray(raw.checklist)
      ? {
          rebarInspectionApproved: checklistStatus("Rebar"),
          formworkStabilityChecked: checklistStatus("Formwork"),
          mepEmbedsSleevesClear: checklistStatus("MEPF"),
          jointCleanlinessWaterjet: checklistStatus("Preparation"),
          concreteMixGradeSlumpVerified: checklistStatus("Testing"),
          vibratorsPumpsStandbyReady: checklistStatus("Logistics"),
        }
      : raw.checklist,
    clearanceSignatures: raw.clearanceSignatures || {
      siteEngineer: stakeholderByRole("Site / Construction Manager"),
      rebarInspector: stakeholderByRole("QA/QC Engineer"),
      mepCoordinator: stakeholderByRole("Mechanical Engineer"),
      qaqcLeadEngineer: stakeholderByRole("Structural Consultant / Engineer"),
    },
  } as PermitToPour;
}

export function sanitizeLevelForFirestore(
  level: Partial<ProjectLevel> & {
    id: string;
    projectId: string;
    name: string;
  },
): ProjectLevel {
  const cleanLevel: ProjectLevel = {
    id: level.id,
    projectId: level.projectId,
    companyId: level.companyId || "",
    name: level.name,
    elevation: Number(level.elevation ?? 0),
    order: Number(level.order ?? 0),
  };
  if (level.isCompleted !== undefined)
    cleanLevel.isCompleted = level.isCompleted;
  if (level.completionPercentage !== undefined)
    cleanLevel.completionPercentage = level.completionPercentage;
  if (level.totalElementsCount !== undefined)
    cleanLevel.totalElementsCount = level.totalElementsCount;
  if (level.approvedElementsCount !== undefined)
    cleanLevel.approvedElementsCount = level.approvedElementsCount;
  if (level.isPrecedenceComplete !== undefined)
    cleanLevel.isPrecedenceComplete = level.isPrecedenceComplete;
  if (level.precedenceSourceLevelName)
    cleanLevel.precedenceSourceLevelName = level.precedenceSourceLevelName;

  return cleanForFirestore(cleanLevel);
}

// Helper to safely convert any date, timestamp, or id into an epoch millisecond number for descending sort
export function parseSortTimestamp(item: any): number {
  if (!item || typeof item !== "object") return 0;

  const candidate =
    item.createdAt ??
    item.createdDate ??
    item.uploadedAt ??
    item.deliveryDate ??
    item.castDate ??
    item.samplingDate ??
    item.inspectionDate ??
    item.startDate ??
    item.dateFound ??
    item.updatedAt;
  if (typeof candidate === "number" && !isNaN(candidate) && candidate > 0) {
    return candidate;
  }
  if (typeof candidate === "string" && candidate.trim()) {
    const parsed = Date.parse(candidate);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  if (
    item.raisedBy &&
    typeof item.raisedBy === "object" &&
    item.raisedBy.date
  ) {
    const parsed = Date.parse(item.raisedBy.date);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  if (typeof item.id === "string") {
    const match = item.id.match(/\d{10,13}/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (num > 1000000000) return num < 10000000000 ? num * 1000 : num;
    }
  }

  return 0;
}

export function sortByNewestFirst<T>(list: T[]): T[] {
  if (!Array.isArray(list)) return [];
  return [...list].sort(
    (a, b) => parseSortTimestamp(b) - parseSortTimestamp(a),
  );
}

// Persistent set of deleted cube sample IDs to prevent resurrection by cache-merge or stale queries
const getDeletedCubeIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem("jqms_deleted_cube_ids");
    if (raw) return new Set(JSON.parse(raw));
  } catch (_) {}
  return new Set<string>();
};

const markCubeAsDeleted = (id: string, sampleId?: string): void => {
  try {
    const set = getDeletedCubeIds();
    if (id) set.add(id);
    if (sampleId) set.add(sampleId);
    localStorage.setItem(
      "jqms_deleted_cube_ids",
      JSON.stringify(Array.from(set)),
    );
  } catch (_) {}
};

const isCubeDeleted = (id?: string, sampleId?: string): boolean => {
  const set = getDeletedCubeIds();
  return Boolean((id && set.has(id)) || (sampleId && set.has(sampleId)));
};

export const dbService = {
  // Initialization - ensures no fake dummy records are seeded
  async initDefaults() {
    console.log("[JQMS Enterprise] Connected to Live Cloud Firestore Database");
  },

  // --- Companies ---
  async getCompany(companyId: string): Promise<Company | null> {
    if (!companyId) return null;
    try {
      const snap = await getDoc(doc(firestore, "companies", companyId));
      if (snap.exists()) {
        const comp = { ...snap.data(), id: snap.id } as Company;
        setCache(`jqms_company_${companyId}`, comp);
        return comp;
      }
      return getCache<Company | null>(`jqms_company_${companyId}`, null);
    } catch (e) {
      console.warn(`Firestore getCompany warning for ${companyId}:`, e);
      return getCache<Company | null>(`jqms_company_${companyId}`, null);
    }
  },

  async saveCompany(company: Partial<Company> & { id: string }): Promise<void> {
    const cleaned = cleanForFirestore({
      ...company,
      updatedAt: Date.now(),
    });
    setCache(`jqms_company_${cleaned.id}`, cleaned);
    try {
      localStorage.setItem("jqms_current_company", JSON.stringify(cleaned));
    } catch (_) {}
    try {
      await setDoc(doc(firestore, "companies", cleaned.id), cleaned, {
        merge: true,
      });
    } catch (e) {
      console.error("Firestore saveCompany error:", e);
    }
  },

  async getCompanies(): Promise<Company[]> {
    try {
      const snap = await getDocs(collection(firestore, "companies"));
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Company);
      if (list.length > 0) {
        setCache("jqms_all_companies", list);
      }
      return list;
    } catch (e) {
      console.warn("Firestore getCompanies warning:", e);
      return getCache<Company[]>("jqms_all_companies", []);
    }
  },

  subscribeCompany(
    companyId: string,
    callback: (company: Company | null) => void,
  ): () => void {
    if (!companyId) {
      callback(null);
      return () => {};
    }
    try {
      const unsub = onSnapshot(
        doc(firestore, "companies", companyId),
        (snap) => {
          if (snap.exists()) {
            const comp = { ...snap.data(), id: snap.id } as Company;
            setCache(`jqms_company_${companyId}`, comp);
            callback(comp);
          } else {
            callback(null);
          }
        },
        (err) => {
          console.warn("subscribeCompany snapshot listener error:", err);
        },
      );
      return unsub;
    } catch (e) {
      console.warn("subscribeCompany error:", e);
      return () => {};
    }
  },

  // --- Projects (Queried by companyId) ---
  async getProjects(companyId?: string): Promise<Project[]> {
    try {
      const constraints: QueryConstraint[] = [];
      if (companyId) {
        constraints.push(where("companyId", "==", companyId));
      }
      const q =
        constraints.length > 0
          ? query(collection(firestore, "projects"), ...constraints)
          : collection(firestore, "projects");
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Project);
      if (list.length > 0) {
        setCache(`jqms_projects_${companyId || "all"}`, list);
      }
      return list;
    } catch (e) {
      console.warn("Firestore getProjects warning, reading local cache:", e);
      return getCache<Project[]>(`jqms_projects_${companyId || "all"}`, []);
    }
  },

  async saveProject(project: Project): Promise<void> {
    const cleaned = cleanForFirestore(project);
    const cacheKey = `jqms_projects_${cleaned.companyId || "all"}`;
    const list = getCache<Project[]>(cacheKey, []);
    const idx = list.findIndex((p) => p.id === cleaned.id);
    if (idx >= 0) list[idx] = cleaned;
    else list.unshift(cleaned);
    setCache(cacheKey, list);

    try {
      await setDoc(doc(firestore, "projects", cleaned.id), cleaned, {
        merge: true,
      });
    } catch (e) {
      console.error("Firestore saveProject error:", e);
    }
  },

  async updateProjectCurrentLevel(
    projectId: string,
    levelId: string,
    levelName?: string,
    companyId?: string,
  ): Promise<void> {
    const payload = cleanForFirestore({
      currentLevelId: levelId,
      currentLevelName: levelName || "",
      updatedAt: new Date().toISOString(),
    });
    const cacheKey = `jqms_projects_${companyId || "all"}`;
    const list = getCache<Project[]>(cacheKey, []);
    const idx = list.findIndex((p) => p.id === projectId);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        currentLevelId: levelId,
        currentLevelName: levelName || list[idx].currentLevelName,
        updatedAt: new Date().toISOString(),
      };
      setCache(cacheKey, list);
    }

    try {
      await setDoc(
        doc(firestore, "projects", projectId),
        payload,
        { merge: true },
      );
    } catch (e) {
      console.error("Firestore updateProjectCurrentLevel error:", e);
    }
  },

  async updateProjectCostRates(
    projectId: string,
    costRates: any,
    companyId?: string,
  ): Promise<void> {
    const payload = cleanForFirestore({
      costRates,
      currency: costRates?.currencySymbol || "$",
      updatedAt: new Date().toISOString(),
    });
    const cacheKey = `jqms_projects_${companyId || "all"}`;
    const list = getCache<Project[]>(cacheKey, []);
    const idx = list.findIndex((p) => p.id === projectId);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        costRates,
        currency: costRates?.currencySymbol || list[idx].currency || "$",
        updatedAt: new Date().toISOString(),
      };
      setCache(cacheKey, list);
    }

    try {
      await setDoc(
        doc(firestore, "projects", projectId),
        payload,
        { merge: true },
      );
    } catch (e) {
      console.error("Firestore updateProjectCostRates error:", e);
    }
  },

  async updateProjectCarbonFactors(
    projectId: string,
    carbonFactors: any,
    companyId?: string,
  ): Promise<void> {
    const payload = cleanForFirestore({
      carbonFactors,
      updatedAt: new Date().toISOString(),
    });
    const cacheKey = `jqms_projects_${companyId || "all"}`;
    const list = getCache<Project[]>(cacheKey, []);
    const idx = list.findIndex((p) => p.id === projectId);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        carbonFactors,
        updatedAt: new Date().toISOString(),
      };
      setCache(cacheKey, list);
    }

    try {
      await setDoc(
        doc(firestore, "projects", projectId),
        payload,
        { merge: true },
      );
    } catch (e) {
      console.error("Firestore updateProjectCarbonFactors error:", e);
    }
  },

  // --- Project Levels (Dual Scoped: projectId AND companyId) ---
  async getLevels(
    projectId: string,
    companyId?: string,
  ): Promise<ProjectLevel[]> {
    try {
      const constraints: QueryConstraint[] = [
        where("projectId", "==", projectId),
      ];
      if (companyId) constraints.push(where("companyId", "==", companyId));

      const q = query(collection(firestore, "projectLevels"), ...constraints);
      const snap = await getDocs(q);
      const list = snap.docs
        .map((d) => ({ ...d.data(), id: d.id }) as ProjectLevel)
        .sort(
          (a, b) =>
            (a.order ?? 0) - (b.order ?? 0) ||
            (a.elevation ?? 0) - (b.elevation ?? 0),
        );
      if (list.length > 0) {
        setCache(`jqms_levels_${projectId}`, list);
      }
      return list;
    } catch (e) {
      console.warn("Firestore getLevels warning, reading local cache:", e);
      return getCache<ProjectLevel[]>(`jqms_levels_${projectId}`, []);
    }
  },

  async saveLevel(level: ProjectLevel): Promise<void> {
    const cleaned = sanitizeLevelForFirestore(level);
    const cacheKey = `jqms_levels_${cleaned.projectId}`;
    const list = getCache<ProjectLevel[]>(cacheKey, []);
    const idx = list.findIndex((l) => l.id === cleaned.id);
    if (idx >= 0) list[idx] = cleaned;
    else list.push(cleaned);
    list.sort(
      (a, b) =>
        (a.order ?? 0) - (b.order ?? 0) ||
        (a.elevation ?? 0) - (b.elevation ?? 0),
    );
    setCache(cacheKey, list);

    try {
      await setDoc(doc(firestore, "projectLevels", cleaned.id), cleaned, {
        merge: true,
      });
    } catch (e) {
      console.error("Firestore saveLevel error:", e);
    }
  },

  async saveLevels(levels: ProjectLevel[]): Promise<void> {
    const cleanedLevels = levels.map((l) => sanitizeLevelForFirestore(l));
    if (cleanedLevels.length > 0) {
      const projectId = cleanedLevels[0].projectId;
      const cacheKey = `jqms_levels_${projectId}`;
      const sorted = [...cleanedLevels].sort(
        (a, b) =>
          (a.order ?? 0) - (b.order ?? 0) ||
          (a.elevation ?? 0) - (b.elevation ?? 0),
      );
      setCache(cacheKey, sorted);
    }

    try {
      const batch = writeBatch(firestore);
      cleanedLevels.forEach((lvl) => {
        batch.set(doc(firestore, "projectLevels", lvl.id), lvl, {
          merge: true,
        });
      });
      await batch.commit();
    } catch (e) {
      console.error(
        "Firestore saveLevels batch error, trying sequential write:",
        e,
      );
      await Promise.all(
        cleanedLevels.map((lvl) =>
          setDoc(doc(firestore, "projectLevels", lvl.id), lvl, { merge: true }),
        ),
      );
    }
  },

  async deleteLevel(levelId: string, projectId?: string): Promise<void> {
    removeFromAllVaultCaches("jqms_levels_", levelId);
    if (projectId) {
      const cacheKey = `jqms_levels_${projectId}`;
      const list = getCache<ProjectLevel[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((l) => l.id !== levelId),
      );
    }
    try {
      await deleteDoc(doc(firestore, "projectLevels", levelId));
    } catch (e) {
      console.error("Firestore deleteLevel error:", e);
    }
  },

  // --- Structural Elements & 3D BIM (Dual Scoped: projectId AND companyId) ---
  async getElements(
    projectId: string,
    companyId?: string,
  ): Promise<StructuralElement[]> {
    try {
      const constraints: QueryConstraint[] = [
        where("projectId", "==", projectId),
      ];
      if (companyId) constraints.push(where("companyId", "==", companyId));

      const q = query(
        collection(firestore, "structuralElements"),
        ...constraints,
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as StructuralElement,
      );
      if (list.length > 0) {
        setCache(`jqms_elements_${projectId}`, list);
      }
      return list;
    } catch (e) {
      console.warn("Firestore getElements warning, reading local cache:", e);
      return getCache<StructuralElement[]>(`jqms_elements_${projectId}`, []);
    }
  },

  subscribeElements(
    projectId: string,
    callback: (elements: StructuralElement[]) => void,
    companyId?: string,
  ): () => void {
    if (!projectId) {
      callback([]);
      return () => {};
    }
    try {
      const constraints: QueryConstraint[] = [
        where("projectId", "==", projectId),
      ];
      if (companyId) constraints.push(where("companyId", "==", companyId));

      const q = query(
        collection(firestore, "structuralElements"),
        ...constraints,
      );

      const unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map(
            (d) => ({ ...d.data(), id: d.id }) as StructuralElement,
          );
          if (list.length > 0) {
            setCache(`jqms_elements_${projectId}`, list);
          }
          callback(list);
        },
        (err) => {
          console.warn("subscribeElements snapshot listener warning:", err);
        },
      );
      return unsub;
    } catch (e) {
      console.warn("subscribeElements error:", e);
      return () => {};
    }
  },

  async saveElement(element: StructuralElement): Promise<void> {
    const cleaned = cleanForFirestore(element);
    const cacheKey = `jqms_elements_${cleaned.projectId}`;
    const list = getCache<StructuralElement[]>(cacheKey, []);
    const idx = list.findIndex((e) => e.id === cleaned.id);
    if (idx >= 0) list[idx] = cleaned;
    else list.push(cleaned);
    setCache(cacheKey, list);

    try {
      await setDoc(doc(firestore, "structuralElements", cleaned.id), cleaned, {
        merge: true,
      });
    } catch (e) {
      console.error("Firestore saveElement error:", e);
    }
  },

  async saveElements(elements: StructuralElement[]): Promise<void> {
    const cleanedList = elements.map((e) => cleanForFirestore(e));
    if (cleanedList.length > 0) {
      const projectId = cleanedList[0].projectId;
      const cacheKey = `jqms_elements_${projectId}`;
      const list = getCache<StructuralElement[]>(cacheKey, []);
      const map = new Map(list.map((e) => [e.id, e]));
      cleanedList.forEach((e) => map.set(e.id, e));
      setCache(cacheKey, Array.from(map.values()));
    }

    try {
      const batch = writeBatch(firestore);
      cleanedList.forEach((e) => {
        batch.set(doc(firestore, "structuralElements", e.id), e, {
          merge: true,
        });
      });
      await batch.commit();
    } catch (e) {
      console.error(
        "Firestore saveElements batch error, trying sequential:",
        e,
      );
      await Promise.all(
        cleanedList.map((e) =>
          setDoc(doc(firestore, "structuralElements", e.id), e, {
            merge: true,
          }),
        ),
      );
    }
  },

  async deleteElement(elementId: string, projectId?: string): Promise<void> {
    removeFromAllVaultCaches("jqms_elements_", elementId);
    if (projectId) {
      const cacheKey = `jqms_elements_${projectId}`;
      const list = getCache<StructuralElement[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((e) => e.id !== elementId),
      );
    }
    try {
      await deleteDoc(doc(firestore, "structuralElements", elementId));
    } catch (e) {
      console.error("Firestore deleteElement error:", e);
    }
  },

  async bulkUpdateElements(
    elementIds: string[],
    updates: Partial<StructuralElement>,
    projectId: string,
  ): Promise<void> {
    const cleanedUpdates = cleanForFirestore(updates);
    const cacheKey = `jqms_elements_${projectId}`;
    const list = getCache<StructuralElement[]>(cacheKey, []);
    const updatedList = list.map((e) =>
      elementIds.includes(e.id) ? { ...e, ...cleanedUpdates } : e,
    );
    setCache(cacheKey, updatedList);

    try {
      const batch = writeBatch(firestore);
      elementIds.forEach((id) => {
        batch.set(doc(firestore, "structuralElements", id), cleanedUpdates, {
          merge: true,
        });
      });
      await batch.commit();
    } catch (e) {
      console.error(
        "Firestore bulkUpdateElements error, fallback to sequential:",
        e,
      );
      await Promise.all(
        elementIds.map((id) =>
          setDoc(doc(firestore, "structuralElements", id), cleanedUpdates, {
            merge: true,
          }),
        ),
      );
    }
  },

  async bulkDeleteElements(
    elementIds: string[],
    projectId: string,
  ): Promise<void> {
    elementIds.forEach((id) => removeFromAllVaultCaches("jqms_elements_", id));
    const cacheKey = `jqms_elements_${projectId}`;
    const list = getCache<StructuralElement[]>(cacheKey, []);
    setCache(
      cacheKey,
      list.filter((e) => !elementIds.includes(e.id)),
    );

    try {
      const batch = writeBatch(firestore);
      elementIds.forEach((id) => {
        batch.delete(doc(firestore, "structuralElements", id));
      });
      await batch.commit();
    } catch (e) {
      console.error(
        "Firestore bulkDeleteElements error, fallback to sequential:",
        e,
      );
      await Promise.all(
        elementIds.map((id) =>
          deleteDoc(doc(firestore, "structuralElements", id)),
        ),
      );
    }
  },

  // --- Gridlines (Dual Scoped: projectId AND companyId) ---
  async getGridlines(
    projectId: string,
    companyId?: string,
  ): Promise<Gridline[]> {
    try {
      const constraints: QueryConstraint[] = [
        where("projectId", "==", projectId),
      ];
      if (companyId) constraints.push(where("companyId", "==", companyId));

      const q = query(collection(firestore, "gridlines"), ...constraints);
      const snap = await getDocs(q);
      const list = snap.docs
        .map((d) => ({ ...d.data(), id: d.id }) as Gridline)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      if (list.length > 0) {
        setCache(`jqms_gridlines_${projectId}`, list);
      }
      return list;
    } catch (e) {
      console.warn("Firestore getGridlines warning, reading local cache:", e);
      return getCache<Gridline[]>(`jqms_gridlines_${projectId}`, []);
    }
  },

  async saveGridline(gridline: Gridline): Promise<void> {
    const cleaned = cleanForFirestore(gridline);
    const cacheKey = `jqms_gridlines_${cleaned.projectId}`;
    const list = getCache<Gridline[]>(cacheKey, []);
    const idx = list.findIndex((g) => g.id === cleaned.id);
    if (idx >= 0) list[idx] = cleaned;
    else list.push(cleaned);
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    setCache(cacheKey, list);

    try {
      await setDoc(doc(firestore, "gridlines", cleaned.id), cleaned, {
        merge: true,
      });
    } catch (e) {
      console.error("Firestore saveGridline error:", e);
    }
  },

  async saveGridlines(gridlines: Gridline[]): Promise<void> {
    const cleaned = gridlines.map((g) => cleanForFirestore(g));
    if (cleaned.length > 0) {
      const projectId = cleaned[0].projectId;
      const cacheKey = `jqms_gridlines_${projectId}`;
      const sorted = [...cleaned].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
      );
      setCache(cacheKey, sorted);
    }

    try {
      const batch = writeBatch(firestore);
      cleaned.forEach((g) => {
        batch.set(doc(firestore, "gridlines", g.id), g, { merge: true });
      });
      await batch.commit();
    } catch (e) {
      console.error("Firestore saveGridlines error:", e);
      await Promise.all(
        cleaned.map((g) =>
          setDoc(doc(firestore, "gridlines", g.id), g, { merge: true }),
        ),
      );
    }
  },

  async deleteGridline(gridlineId: string, projectId?: string): Promise<void> {
    removeFromAllVaultCaches("jqms_gridlines_", gridlineId);
    if (projectId) {
      const cacheKey = `jqms_gridlines_${projectId}`;
      const list = getCache<Gridline[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((g) => g.id !== gridlineId),
      );
    }
    try {
      await deleteDoc(doc(firestore, "gridlines", gridlineId));
    } catch (e) {
      console.error("Firestore deleteGridline error:", e);
    }
  },

  // --- Work Packages (Dual Scoped: projectId AND companyId) ---
  async getWorkPackages(
    projectId: string,
    companyId?: string,
  ): Promise<WorkPackage[]> {
    try {
      const constraints: QueryConstraint[] = [
        where("projectId", "==", projectId),
      ];
      if (companyId) constraints.push(where("companyId", "==", companyId));

      const q = query(collection(firestore, "workPackages"), ...constraints);
      const snap = await getDocs(q);
      const list = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as WorkPackage,
      );
      if (list.length > 0) {
        setCache(`jqms_work_packages_${projectId}`, list);
      }
      return list;
    } catch (e) {
      console.warn(
        "Firestore getWorkPackages warning, reading local cache:",
        e,
      );
      return getCache<WorkPackage[]>(`jqms_work_packages_${projectId}`, []);
    }
  },

  async saveWorkPackage(pkg: WorkPackage): Promise<void> {
    const cleaned = cleanForFirestore(pkg);
    const cacheKey = `jqms_work_packages_${cleaned.projectId}`;
    const list = getCache<WorkPackage[]>(cacheKey, []);
    const idx = list.findIndex((p) => p.id === cleaned.id);
    if (idx >= 0) list[idx] = cleaned;
    else list.push(cleaned);
    setCache(cacheKey, list);

    try {
      await setDoc(doc(firestore, "workPackages", cleaned.id), cleaned, {
        merge: true,
      });
    } catch (e) {
      console.error("Firestore saveWorkPackage error:", e);
    }
  },

  async deleteWorkPackage(pkgId: string, projectId?: string): Promise<void> {
    removeFromAllVaultCaches("jqms_work_packages_", pkgId);
    if (projectId) {
      const cacheKey = `jqms_work_packages_${projectId}`;
      const list = getCache<WorkPackage[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((p) => p.id !== pkgId),
      );
    }
    try {
      await deleteDoc(doc(firestore, "workPackages", pkgId));
    } catch (e) {
      console.error("Firestore deleteWorkPackage error:", e);
    }
  },

  // --- Site Observations / Comments (Dual Scoped: projectId AND companyId) ---
  async getSiteComments(
    projectId: string,
    companyId?: string,
  ): Promise<SiteCommentReport[]> {
    try {
      const constraints: QueryConstraint[] = [
        where("projectId", "==", projectId),
      ];
      if (companyId) constraints.push(where("companyId", "==", companyId));

      const q = query(collection(firestore, "site_comments"), ...constraints);
      const snap = await getDocs(q);
      if (!snap.empty) {
        const rawList = snap.docs.map(
          (d) => ({ ...d.data(), id: d.id }) as SiteCommentReport,
        );
        const list = sortByNewestFirst(rawList);
        setCache(`jqms_site_comments_${projectId}`, list);
        return list;
      }

      const qAlt = query(collection(firestore, "siteComments"), ...constraints);
      const snapAlt = await getDocs(qAlt);
      const rawListAlt = snapAlt.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as SiteCommentReport,
      );
      const listAlt = sortByNewestFirst(rawListAlt);
      if (listAlt.length > 0) {
        setCache(`jqms_site_comments_${projectId}`, listAlt);
      }
      return listAlt;
    } catch (e) {
      console.warn(
        "Firestore getSiteComments warning, reading local cache:",
        e,
      );
      const cached = getCache<SiteCommentReport[]>(
        `jqms_site_comments_${projectId}`,
        [],
      );
      return sortByNewestFirst(cached);
    }
  },

  async saveSiteComment(report: SiteCommentReport): Promise<void> {
    const cleaned = cleanForFirestore(report);
    const cacheKey = `jqms_site_comments_${cleaned.projectId}`;
    const list = getCache<SiteCommentReport[]>(cacheKey, []);
    const idx = list.findIndex((c) => c.id === cleaned.id);
    if (idx >= 0) list[idx] = cleaned;
    else list.unshift(cleaned);
    setCache(cacheKey, sortByNewestFirst(list));

    try {
      await setDoc(doc(firestore, "site_comments", cleaned.id), cleaned, {
        merge: true,
      });
      await setDoc(doc(firestore, "siteComments", cleaned.id), cleaned, {
        merge: true,
      });
    } catch (e) {
      console.error("Firestore saveSiteComment error:", e);
    }
  },

  async deleteSiteComment(id: string, projectId?: string): Promise<void> {
    removeFromAllVaultCaches("jqms_site_comments_", id);
    if (projectId) {
      const cacheKey = `jqms_site_comments_${projectId}`;
      const list = getCache<SiteCommentReport[]>(cacheKey, []).filter(
        (c) => c.id !== id,
      );
      setCache(cacheKey, list);
    }
    try {
      await deleteDoc(doc(firestore, "site_comments", id));
      await deleteDoc(doc(firestore, "siteComments", id));
    } catch (e) {
      console.warn("Firestore deleteSiteComment warning:", e);
    }
  },

  subscribeSiteComments(
    projectId: string,
    callback: (reports: SiteCommentReport[]) => void,
    companyId?: string,
  ): () => void {
    if (!projectId) {
      callback([]);
      return () => {};
    }
    try {
      const constraints: QueryConstraint[] = [
        where("projectId", "==", projectId),
      ];
      if (companyId) constraints.push(where("companyId", "==", companyId));

      const q = query(collection(firestore, "site_comments"), ...constraints);
      const unsub = onSnapshot(
        q,
        (snap) => {
          const rawList = snap.docs.map(
            (d) => ({ ...d.data(), id: d.id }) as SiteCommentReport,
          );
          const list = sortByNewestFirst(rawList);
          if (list.length > 0) {
            setCache(`jqms_site_comments_${projectId}`, list);
          }
          callback(list);
        },
        (err) => {
          console.warn("subscribeSiteComments snapshot listener warning:", err);
        },
      );
      return unsub;
    } catch (e) {
      console.warn("subscribeSiteComments error:", e);
      return () => {};
    }
  },

  // --- Non-Conformance Reports (NCR) ---
  async getNCR(id: string): Promise<NonConformanceReport | null> {
    try {
      const snap = await getDoc(doc(firestore, "ncrs", id));
      if (snap.exists())
        return { ...snap.data(), id: snap.id } as NonConformanceReport;
    } catch (e) {
      console.warn("Firestore getNCR error:", e);
    }
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("jqms_ncrs_")) {
        const list = getCache<NonConformanceReport[]>(k, []);
        const item = list.find((n) => n.id === id);
        if (item) return item;
      }
    }
    return null;
  },

  async deleteNCR(id: string, projectId?: string): Promise<void> {
    removeFromAllVaultCaches("jqms_ncrs_", id);
    if (projectId) {
      const cacheKey = `jqms_ncrs_${projectId}`;
      const list = getCache<NonConformanceReport[]>(cacheKey, []).filter(
        (n) => n.id !== id,
      );
      setCache(cacheKey, list);
    }
    try {
      await deleteDoc(doc(firestore, "ncrs", id));
    } catch (e) {
      console.warn("Firestore deleteNCR warning:", e);
    }
  },

  async getNCRs(
    projectId: string,
    companyId?: string,
  ): Promise<NonConformanceReport[]> {
    try {
      const constraints: QueryConstraint[] = [
        where("projectId", "==", projectId),
      ];
      if (companyId) constraints.push(where("companyId", "==", companyId));

      const q = query(collection(firestore, "ncrs"), ...constraints);
      const snap = await getDocs(q);
      const rawList = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as NonConformanceReport,
      );
      const list = sortByNewestFirst(rawList);
      if (list.length > 0) {
        setCache(`jqms_ncrs_${projectId}`, list);
      }
      return list;
    } catch (e) {
      console.warn("Firestore getNCRs warning, reading local cache:", e);
      const cached = getCache<NonConformanceReport[]>(
        `jqms_ncrs_${projectId}`,
        [],
      );
      return sortByNewestFirst(cached);
    }
  },

  async saveNCR(ncr: NonConformanceReport): Promise<void> {
    const cleaned = cleanForFirestore(ncr);
    const cacheKey = `jqms_ncrs_${cleaned.projectId}`;
    const list = getCache<NonConformanceReport[]>(cacheKey, []);
    const idx = list.findIndex((n) => n.id === cleaned.id);
    if (idx >= 0) list[idx] = cleaned;
    else list.unshift(cleaned);
    setCache(cacheKey, sortByNewestFirst(list));

    try {
      await setDoc(doc(firestore, "ncrs", cleaned.id), cleaned, { merge: true });
    } catch (e) {
      console.warn("Firestore saveNCR error:", e);
    }
  },

  subscribeNCRs(
    projectId: string,
    callback: (ncrs: NonConformanceReport[]) => void,
    companyId?: string,
  ): () => void {
    if (!projectId) {
      callback([]);
      return () => {};
    }
    try {
      const constraints: QueryConstraint[] = [
        where("projectId", "==", projectId),
      ];
      if (companyId) constraints.push(where("companyId", "==", companyId));

      const q = query(collection(firestore, "ncrs"), ...constraints);
      const unsub = onSnapshot(
        q,
        (snap) => {
          const rawList = snap.docs.map(
            (d) => ({ ...d.data(), id: d.id }) as NonConformanceReport,
          );
          const list = sortByNewestFirst(rawList);
          if (list.length > 0) {
            setCache(`jqms_ncrs_${projectId}`, list);
          }
          callback(list);
        },
        (err) => {
          console.warn("subscribeNCRs snapshot listener warning:", err);
        },
      );
      return unsub;
    } catch (e) {
      console.warn("subscribeNCRs error:", e);
      return () => {};
    }
  },

  // --- Site Instructions / Directives ---
  async getSiteInstructions(
    projectId: string,
    companyId?: string,
  ): Promise<SiteInstruction[]> {
    try {
      const constraints: QueryConstraint[] = [
        where("projectId", "==", projectId),
      ];
      if (companyId) constraints.push(where("companyId", "==", companyId));

      const q = query(
        collection(firestore, "siteInstructions"),
        ...constraints,
      );
      const snap = await getDocs(q);
      const rawList = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as SiteInstruction,
      );
      const list = sortByNewestFirst(rawList);
      if (list.length > 0) {
        setCache(`jqms_site_instructions_${projectId}`, list);
      }
      return list;
    } catch (e) {
      console.warn(
        "Firestore getSiteInstructions warning, reading local cache:",
        e,
      );
      const cached = getCache<SiteInstruction[]>(
        `jqms_site_instructions_${projectId}`,
        [],
      );
      return sortByNewestFirst(cached);
    }
  },

  async getSiteInstruction(id: string): Promise<SiteInstruction | null> {
    try {
      const snap = await getDoc(doc(firestore, "siteInstructions", id));
      if (snap.exists()) {
        return { ...snap.data(), id: snap.id } as SiteInstruction;
      }
    } catch (e) {
      console.warn("Firestore getSiteInstruction error:", e);
    }
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("jqms_site_instructions_")) {
        const list = getCache<SiteInstruction[]>(k, []);
        const item = list.find((si) => si.id === id);
        if (item) return item;
      }
    }
    return null;
  },

  async saveSiteInstruction(si: SiteInstruction): Promise<void> {
    const cleaned = cleanForFirestore(si);
    const cacheKey = `jqms_site_instructions_${cleaned.projectId}`;
    const list = getCache<SiteInstruction[]>(cacheKey, []);
    const idx = list.findIndex((item) => item.id === cleaned.id);
    if (idx >= 0) list[idx] = cleaned;
    else list.unshift(cleaned);
    setCache(cacheKey, sortByNewestFirst(list));

    try {
      await setDoc(doc(firestore, "siteInstructions", cleaned.id), cleaned, {
        merge: true,
      });
    } catch (e) {
      console.error("Firestore saveSiteInstruction error:", e);
    }
  },

  async deleteSiteInstruction(id: string, projectId?: string): Promise<void> {
    removeFromAllVaultCaches("jqms_site_instructions_", id);
    if (projectId) {
      const cacheKey = `jqms_site_instructions_${projectId}`;
      const list = getCache<SiteInstruction[]>(cacheKey, []).filter(
        (si) => si.id !== id,
      );
      setCache(cacheKey, list);
    }
    try {
      await deleteDoc(doc(firestore, "siteInstructions", id));
    } catch (e) {
      console.warn("Firestore deleteSiteInstruction error:", e);
    }
  },

  // --- Daily Site Logs ---
  async getDailySiteLogs(
    projectId: string,
    companyId?: string,
  ): Promise<DailySiteLog[]> {
    try {
      const constraints: QueryConstraint[] = [
        where("projectId", "==", projectId),
      ];
      if (companyId) constraints.push(where("companyId", "==", companyId));

      const q = query(collection(firestore, "dailySiteLogs"), ...constraints);
      const snap = await getDocs(q);
      const rawList = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as DailySiteLog,
      );
      const list = sortByNewestFirst(rawList);
      if (list.length > 0) {
        setCache(`jqms_daily_site_logs_${projectId}`, list);
      }
      return list;
    } catch (e) {
      console.warn(
        "Firestore getDailySiteLogs warning, reading local cache:",
        e,
      );
      const cached = getCache<DailySiteLog[]>(
        `jqms_daily_site_logs_${projectId}`,
        [],
      );
      return sortByNewestFirst(cached);
    }
  },

  async getDailySiteLog(id: string): Promise<DailySiteLog | null> {
    try {
      const snap = await getDoc(doc(firestore, "dailySiteLogs", id));
      if (snap.exists()) {
        return { ...snap.data(), id: snap.id } as DailySiteLog;
      }
    } catch (e) {
      console.warn("Firestore getDailySiteLog error:", e);
    }
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("jqms_daily_site_logs_")) {
        const list = getCache<DailySiteLog[]>(k, []);
        const item = list.find((log) => log.id === id);
        if (item) return item;
      }
    }
    return null;
  },

  async saveDailySiteLog(log: DailySiteLog): Promise<void> {
    const cleaned = cleanForFirestore(log);
    const cacheKey = `jqms_daily_site_logs_${cleaned.projectId}`;
    const list = getCache<DailySiteLog[]>(cacheKey, []);
    const idx = list.findIndex((item) => item.id === cleaned.id);
    if (idx >= 0) list[idx] = cleaned;
    else list.unshift(cleaned);
    setCache(cacheKey, sortByNewestFirst(list));

    try {
      await setDoc(doc(firestore, "dailySiteLogs", cleaned.id), cleaned, {
        merge: true,
      });
    } catch (e) {
      console.error("Firestore saveDailySiteLog error:", e);
    }
  },

  async deleteDailySiteLog(id: string, projectId?: string): Promise<void> {
    removeFromAllVaultCaches("jqms_daily_site_logs_", id);
    if (projectId) {
      const cacheKey = `jqms_daily_site_logs_${projectId}`;
      const list = getCache<DailySiteLog[]>(cacheKey, []).filter(
        (log) => log.id !== id,
      );
      setCache(cacheKey, list);
    }
    try {
      await deleteDoc(doc(firestore, "dailySiteLogs", id));
    } catch (e) {
      console.warn("Firestore deleteDailySiteLog error:", e);
    }
  },

  // --- Requests for Information (RFI) ---
  async getRFIs(
    projectId: string,
    companyId?: string,
  ): Promise<RequestForInformation[]> {
    try {
      const constraints: QueryConstraint[] = [
        where("projectId", "==", projectId),
      ];
      if (companyId) constraints.push(where("companyId", "==", companyId));

      const q = query(collection(firestore, "rfis"), ...constraints);
      const snap = await getDocs(q);
      const rawList = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as RequestForInformation,
      );
      const list = sortByNewestFirst(rawList);
      if (list.length > 0) {
        setCache(`jqms_rfis_${projectId}`, list);
      }
      return list;
    } catch (e) {
      console.warn("Firestore getRFIs warning, reading local cache:", e);
      const cached = getCache<RequestForInformation[]>(
        `jqms_rfis_${projectId}`,
        [],
      );
      return sortByNewestFirst(cached);
    }
  },

  async saveRFI(rfi: RequestForInformation): Promise<void> {
    const cleaned = cleanForFirestore(rfi);
    const cacheKey = `jqms_rfis_${cleaned.projectId}`;
    const list = getCache<RequestForInformation[]>(cacheKey, []);
    const idx = list.findIndex((r) => r.id === cleaned.id);
    if (idx >= 0) list[idx] = cleaned;
    else list.unshift(cleaned);
    setCache(cacheKey, sortByNewestFirst(list));

    try {
      await setDoc(doc(firestore, "rfis", cleaned.id), cleaned, { merge: true });
    } catch (e) {
      console.warn("Firestore saveRFI error:", e);
    }
  },

  async deleteRFI(id: string, projectId?: string): Promise<void> {
    removeFromAllVaultCaches("jqms_rfis_", id);
    if (projectId) {
      const cacheKey = `jqms_rfis_${projectId}`;
      const list = getCache<RequestForInformation[]>(cacheKey, []).filter(
        (r) => r.id !== id,
      );
      setCache(cacheKey, list);
    }
    try {
      await deleteDoc(doc(firestore, "rfis", id));
    } catch (e) {
      console.warn("Firestore deleteRFI error:", e);
    }
  },

  // --- Material Approval Requests (MAR / Submittals) ---
  async getMARs(
    projectId: string,
    companyId?: string,
  ): Promise<MaterialApprovalRequest[]> {
    try {
      const constraints: QueryConstraint[] = [
        where("projectId", "==", projectId),
      ];
      if (companyId) constraints.push(where("companyId", "==", companyId));

      const q = query(collection(firestore, "submittals"), ...constraints);
      const snap = await getDocs(q);
      if (!snap.empty) {
        const rawList = snap.docs.map(
          (d) => ({ ...d.data(), id: d.id }) as MaterialApprovalRequest,
        );
        const list = sortByNewestFirst(rawList);
        setCache(`jqms_mars_${projectId}`, list);
        return list;
      }
      const qAlt = query(collection(firestore, "mars"), ...constraints);
      const snapAlt = await getDocs(qAlt);
      const rawListAlt = snapAlt.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as MaterialApprovalRequest,
      );
      const listAlt = sortByNewestFirst(rawListAlt);
      if (listAlt.length > 0) {
        setCache(`jqms_mars_${projectId}`, listAlt);
      }
      return listAlt;
    } catch (e) {
      console.warn("Firestore getMARs warning, reading local cache:", e);
      const cached = getCache<MaterialApprovalRequest[]>(
        `jqms_mars_${projectId}`,
        [],
      );
      return sortByNewestFirst(cached);
    }
  },

  async saveMAR(mar: MaterialApprovalRequest): Promise<void> {
    const cleaned = cleanForFirestore(mar);
    const cacheKey = `jqms_mars_${cleaned.projectId}`;
    const list = getCache<MaterialApprovalRequest[]>(cacheKey, []);
    const idx = list.findIndex((m) => m.id === cleaned.id);
    if (idx >= 0) list[idx] = cleaned;
    else list.unshift(cleaned);
    setCache(cacheKey, sortByNewestFirst(list));

    try {
      await setDoc(doc(firestore, "submittals", cleaned.id), cleaned, { merge: true });
      await setDoc(doc(firestore, "mars", cleaned.id), cleaned, { merge: true });
    } catch (e) {
      console.warn("Firestore saveMAR error:", e);
    }
  },

  async deleteMAR(id: string, projectId?: string): Promise<void> {
    removeFromAllVaultCaches("jqms_mars_", id);
    if (projectId) {
      const cacheKey = `jqms_mars_${projectId}`;
      const list = getCache<MaterialApprovalRequest[]>(cacheKey, []).filter(
        (m) => m.id !== id,
      );
      setCache(cacheKey, list);
    }
    try {
      await deleteDoc(doc(firestore, "submittals", id));
      await deleteDoc(doc(firestore, "mars", id));
    } catch (e) {
      console.warn("Firestore deleteMAR error:", e);
    }
  },

  // --- Material Inspection Reports (MIR) ---
  async getMIRs(
    projectId: string,
    companyId?: string,
  ): Promise<MaterialInspectionReport[]> {
    try {
      const constraints: QueryConstraint[] = [
        where("projectId", "==", projectId),
      ];
      if (companyId) constraints.push(where("companyId", "==", companyId));

      const q = query(collection(firestore, "mirs"), ...constraints);
      const snap = await getDocs(q);
      if (!snap.empty) {
        const rawList = snap.docs.map(
          (d) => ({ ...d.data(), id: d.id }) as MaterialInspectionReport,
        );
        const list = sortByNewestFirst(rawList);
        setCache(`jqms_mirs_${projectId}`, list);
        return list;
      }

      const cached = getCache<MaterialInspectionReport[]>(
        `jqms_mirs_${projectId}`,
        [],
      );
      return sortByNewestFirst(cached);
    } catch (e) {
      console.warn("Firestore getMIRs warning, reading local cache:", e);
      const cached = getCache<MaterialInspectionReport[]>(
        `jqms_mirs_${projectId}`,
        [],
      );
      return sortByNewestFirst(cached);
    }
  },

  async getMIR(
    id: string,
    projectId: string,
    companyId?: string,
  ): Promise<MaterialInspectionReport | null> {
    try {
      const docRef = doc(firestore, "mirs", id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { ...snap.data(), id: snap.id } as MaterialInspectionReport;
      }
    } catch (e) {
      console.warn("Firestore getMIR warning:", e);
    }
    const list = getCache<MaterialInspectionReport[]>(
      `jqms_mirs_${projectId}`,
      [],
    );
    return list.find((m) => m.id === id || m.mirNumber === id) || null;
  },

  async saveMIR(mir: MaterialInspectionReport): Promise<void> {
    const cleaned = cleanForFirestore(mir);
    const cacheKey = `jqms_mirs_${cleaned.projectId}`;
    const list = getCache<MaterialInspectionReport[]>(cacheKey, []);
    const idx = list.findIndex((m) => m.id === cleaned.id);
    if (idx >= 0) list[idx] = cleaned;
    else list.unshift(cleaned);
    setCache(cacheKey, sortByNewestFirst(list));

    try {
      await setDoc(doc(firestore, "mirs", cleaned.id), cleaned, { merge: true });
    } catch (e) {
      console.warn("Firestore saveMIR error:", e);
    }
  },

  async deleteMIR(id: string, projectId: string): Promise<void> {
    removeFromAllVaultCaches("jqms_mirs_", id);
    const cacheKey = `jqms_mirs_${projectId}`;
    const list = getCache<MaterialInspectionReport[]>(cacheKey, []);
    const filtered = list.filter((m) => m.id !== id);
    setCache(cacheKey, filtered);

    try {
      await deleteDoc(doc(firestore, "mirs", id));
    } catch (e) {
      console.error("Firestore deleteMIR error:", e);
    }
  },

  // --- Quality Inspections ---
  async getInspection(id: string): Promise<InspectionRequest | null> {
    try {
      const snap = await getDoc(doc(firestore, "inspections", id));
      if (snap.exists())
        return { ...snap.data(), id: snap.id } as InspectionRequest;
    } catch (e) {
      console.warn("Firestore getInspection error:", e);
    }
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("jqms_inspections_")) {
        const list = getCache<InspectionRequest[]>(k, []);
        const item = list.find((ins) => ins.id === id);
        if (item) return item;
      }
    }
    return null;
  },

  async deleteInspection(id: string, projectId?: string): Promise<void> {
    removeFromAllVaultCaches("jqms_inspections_", id);
    if (projectId) {
      const cacheKey = `jqms_inspections_${projectId}`;
      const list = getCache<InspectionRequest[]>(cacheKey, []).filter(
        (ins) => ins.id !== id,
      );
      setCache(cacheKey, list);
    }
    try {
      await deleteDoc(doc(firestore, "inspections", id));
    } catch (e) {}
  },

  async getInspections(
    projectId: string,
    companyId?: string,
  ): Promise<InspectionRequest[]> {
    try {
      const constraints: QueryConstraint[] = [
        where("projectId", "==", projectId),
      ];
      if (companyId) constraints.push(where("companyId", "==", companyId));

      const q = query(collection(firestore, "inspections"), ...constraints);
      const snap = await getDocs(q);
      const rawList = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as InspectionRequest,
      );
      const list = sortByNewestFirst(rawList);
      if (list.length > 0) {
        setCache(`jqms_inspections_${projectId}`, list);
      }
      return list;
    } catch (e) {
      console.warn("Firestore getInspections warning, reading local cache:", e);
      const cached = getCache<InspectionRequest[]>(
        `jqms_inspections_${projectId}`,
        [],
      );
      return sortByNewestFirst(cached);
    }
  },

  async saveInspection(insp: InspectionRequest): Promise<void> {
    const cleaned = cleanForFirestore(insp);
    const cacheKey = `jqms_inspections_${cleaned.projectId}`;
    const list = getCache<InspectionRequest[]>(cacheKey, []);
    const idx = list.findIndex((i) => i.id === cleaned.id);
    if (idx >= 0) list[idx] = cleaned;
    else list.unshift(cleaned);
    setCache(cacheKey, sortByNewestFirst(list));

    try {
      await setDoc(doc(firestore, "inspections", cleaned.id), cleaned, {
        merge: true,
      });
    } catch (e) {
      console.warn("Firestore saveInspection error:", e);
    }
  },

  subscribeInspections(
    projectId: string,
    callback: (inspections: InspectionRequest[]) => void,
    companyId?: string,
  ): () => void {
    if (!projectId) {
      callback([]);
      return () => {};
    }
    try {
      const constraints: QueryConstraint[] = [
        where("projectId", "==", projectId),
      ];
      if (companyId) constraints.push(where("companyId", "==", companyId));

      const q = query(collection(firestore, "inspections"), ...constraints);
      const unsub = onSnapshot(
        q,
        (snap) => {
          const rawList = snap.docs.map(
            (d) => ({ ...d.data(), id: d.id }) as InspectionRequest,
          );
          const list = sortByNewestFirst(rawList);
          if (list.length > 0) {
            setCache(`jqms_inspections_${projectId}`, list);
          }
          callback(list);
        },
        (err) => {
          console.warn("subscribeInspections snapshot listener warning:", err);
        },
      );
      return unsub;
    } catch (e) {
      console.warn("subscribeInspections error:", e);
      return () => {};
    }
  },

  // --- Permit to Pour (PTP) ---
  async getPermitsToPour(
    projectId: string,
    companyId?: string,
  ): Promise<PermitToPour[]> {
    try {
      const constraints: QueryConstraint[] = [
        where("projectId", "==", projectId),
      ];
      if (companyId) constraints.push(where("companyId", "==", companyId));

      const q = query(collection(firestore, "permitsToPour"), ...constraints);
      const snap = await getDocs(q);
      if (!snap.empty) {
        const rawList = snap.docs.map((d) =>
          normalizePermitToPour({ ...d.data(), id: d.id }),
        );
        const list = sortByNewestFirst(rawList);
        setCache(`jqms_ptps_${projectId}`, list);
        return list;
      }

      const qAlt = query(collection(firestore, "permitToPour"), ...constraints);
      const snapAlt = await getDocs(qAlt);
      const rawListAlt = snapAlt.docs.map((d) =>
        normalizePermitToPour({ ...d.data(), id: d.id }),
      );
      const listAlt = sortByNewestFirst(rawListAlt);
      if (listAlt.length > 0) {
        setCache(`jqms_ptps_${projectId}`, listAlt);
      }
      return listAlt;
    } catch (e) {
      console.warn(
        "Firestore getPermitsToPour warning, reading local cache:",
        e,
      );
      const cached = getCache<PermitToPour[]>(`jqms_ptps_${projectId}`, []);
      return sortByNewestFirst(cached);
    }
  },

  async getPermitToPours(
    projectId: string,
    companyId?: string,
  ): Promise<PermitToPour[]> {
    return this.getPermitsToPour(projectId, companyId);
  },

  async savePermitToPour(ptp: PermitToPour): Promise<void> {
    const cleaned = cleanForFirestore(ptp);
    const cacheKey = `jqms_ptps_${cleaned.projectId}`;
    const list = getCache<PermitToPour[]>(cacheKey, []);
    const idx = list.findIndex((p) => p.id === cleaned.id);
    if (idx >= 0) list[idx] = cleaned;
    else list.unshift(cleaned);
    setCache(cacheKey, sortByNewestFirst(list));

    try {
      await setDoc(doc(firestore, "permitsToPour", cleaned.id), cleaned, {
        merge: true,
      });
      await setDoc(doc(firestore, "permitToPour", cleaned.id), cleaned, {
        merge: true,
      });
    } catch (e) {
      console.warn("Firestore savePermitToPour error:", e);
    }
  },

  async deletePermitToPour(id: string, projectId?: string): Promise<void> {
    removeFromAllVaultCaches("jqms_ptps_", id);
    if (projectId) {
      const cacheKey = `jqms_ptps_${projectId}`;
      const list = getCache<PermitToPour[]>(cacheKey, []).filter(
        (p) => p.id !== id,
      );
      setCache(cacheKey, list);
    }
    try {
      await deleteDoc(doc(firestore, "permitsToPour", id));
      await deleteDoc(doc(firestore, "permitToPour", id));
    } catch (e) {
      console.warn("Firestore deletePermitToPour error:", e);
    }
  },

  // --- Concrete Cube Samples ---
  async getCubeSamples(
    projectId: string,
    companyId?: string,
  ): Promise<ConcreteCubeSample[]> {
    const cacheKey = `jqms_cubes_${projectId}`;
    const cached = getCache<ConcreteCubeSample[]>(cacheKey, []).filter(
      (c) => !isCubeDeleted(c.id, c.sampleId),
    );
    try {
      let rawList: ConcreteCubeSample[] = [];
      try {
        const constraints: QueryConstraint[] = [
          where("projectId", "==", projectId),
        ];
        if (companyId) constraints.push(where("companyId", "==", companyId));

        const q = query(collection(firestore, "cubeSamples"), ...constraints);
        const snap = await getDocs(q);
        rawList = snap.docs.map(
          (d) => ({ ...d.data(), id: d.id }) as ConcreteCubeSample,
        );
      } catch (innerErr) {
        if (companyId) {
          const fallbackQ = query(
            collection(firestore, "cubeSamples"),
            where("projectId", "==", projectId),
          );
          const fallbackSnap = await getDocs(fallbackQ);
          rawList = fallbackSnap.docs
            .map((d) => ({ ...d.data(), id: d.id }) as ConcreteCubeSample)
            .filter((c) => !c.companyId || c.companyId === companyId);
        } else {
          throw innerErr;
        }
      }

      const firestoreList = rawList.filter(
        (c) => !isCubeDeleted(c.id, c.sampleId),
      );

      const map = new Map<string, ConcreteCubeSample>();
      firestoreList.forEach((item) => map.set(item.id, item));
      cached.forEach((item) => {
        if (isCubeDeleted(item.id, item.sampleId)) return;
        const existing = map.get(item.id);
        if (
          !existing ||
          (item.updatedAt &&
            (!existing.updatedAt || item.updatedAt > existing.updatedAt))
        ) {
          map.set(item.id, item);
        }
      });

      const list = sortByNewestFirst(Array.from(map.values()));
      setCache(cacheKey, list);
      return list;
    } catch (e) {
      console.warn("Firestore getCubeSamples warning, reading local cache:", e);
      return sortByNewestFirst(cached);
    }
  },

  async getCubeSample(
    id: string,
    projectId?: string,
  ): Promise<ConcreteCubeSample | null> {
    if (isCubeDeleted(id)) return null;
    try {
      const snap = await getDoc(doc(firestore, "cubeSamples", id));
      if (snap.exists()) {
        const item = { ...snap.data(), id: snap.id } as ConcreteCubeSample;
        if (!isCubeDeleted(item.id, item.sampleId)) return item;
      }
    } catch (e) {
      console.warn("Firestore getCubeSample warning:", e);
    }
    if (projectId) {
      const cached = getCache<ConcreteCubeSample[]>(
        `jqms_cubes_${projectId}`,
        [],
      );
      const match = cached.find(
        (c) =>
          (c.id === id || c.sampleId === id) &&
          !isCubeDeleted(c.id, c.sampleId),
      );
      if (match) return match;
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("jqms_cubes_")) {
        const cached = getCache<ConcreteCubeSample[]>(key, []);
        const match = cached.find(
          (c) =>
            (c.id === id || c.sampleId === id) &&
            !isCubeDeleted(c.id, c.sampleId),
        );
        if (match) return match;
      }
    }
    return null;
  },

  async saveCubeSample(cube: ConcreteCubeSample): Promise<void> {
    try {
      const set = getDeletedCubeIds();
      set.delete(cube.id);
      if (cube.sampleId) set.delete(cube.sampleId);
      localStorage.setItem(
        "jqms_deleted_cube_ids",
        JSON.stringify(Array.from(set)),
      );
    } catch (_) {}

    const cleaned = cleanForFirestore({
      ...cube,
      updatedAt: Date.now(),
    });
    const cacheKey = `jqms_cubes_${cleaned.projectId}`;
    const list = getCache<ConcreteCubeSample[]>(cacheKey, []);
    const idx = list.findIndex((c) => c.id === cleaned.id);
    if (idx >= 0) list[idx] = cleaned as ConcreteCubeSample;
    else list.unshift(cleaned as ConcreteCubeSample);
    setCache(cacheKey, sortByNewestFirst(list));

    try {
      await setDoc(doc(firestore, "cubeSamples", cleaned.id), cleaned, {
        merge: true,
      });
    } catch (e) {
      console.error("Firestore saveCubeSample error:", e);
    }
  },

  async deleteCubeSample(id: string, projectId?: string): Promise<void> {
    markCubeAsDeleted(id);
    removeFromAllVaultCaches("jqms_cubes_", id);

    try {
      await deleteDoc(doc(firestore, "cubeSamples", id));
    } catch (e) {
      console.warn("Firestore deleteCubeSample warning:", e);
    }

    try {
      const q = query(
        collection(firestore, "cubeSamples"),
        where("sampleId", "==", id),
      );
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        markCubeAsDeleted(d.id);
        await deleteDoc(d.ref).catch(() => {});
      }
    } catch (_) {}

    try {
      if (projectId) {
        const cacheKey = `jqms_cubes_${projectId}`;
        const list = getCache<ConcreteCubeSample[]>(cacheKey, []);
        setCache(
          cacheKey,
          list.filter((c) => c.id !== id && c.sampleId !== id),
        );
      }
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith("jqms_cubes_") || key === "jqms_cubes_all")
        ) {
          const list = getCache<ConcreteCubeSample[]>(key, []);
          setCache(
            key,
            list.filter((c) => c.id !== id && c.sampleId !== id),
          );
        }
      }
    } catch (_) {}
  },

  // --- Steel Rebar Tests ---
  async getSteelTests(
    projectId: string,
    companyId?: string,
  ): Promise<SteelRebarTest[]> {
    try {
      const constraints: QueryConstraint[] = [
        where("projectId", "==", projectId),
      ];
      if (companyId) constraints.push(where("companyId", "==", companyId));

      const q = query(collection(firestore, "steelTests"), ...constraints);
      const snap = await getDocs(q);
      const rawList = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as SteelRebarTest,
      );
      const list = sortByNewestFirst(rawList);
      if (list.length > 0) {
        setCache(`jqms_steel_${projectId}`, list);
      }
      return list;
    } catch (e) {
      console.warn("Firestore getSteelTests warning, reading local cache:", e);
      const cached = getCache<SteelRebarTest[]>(`jqms_steel_${projectId}`, []);
      return sortByNewestFirst(cached);
    }
  },

  async saveSteelTest(test: SteelRebarTest): Promise<void> {
    const cleaned = cleanForFirestore(test);
    const cacheKey = `jqms_steel_${cleaned.projectId}`;
    const list = getCache<SteelRebarTest[]>(cacheKey, []);
    const idx = list.findIndex((s) => s.id === cleaned.id);
    if (idx >= 0) list[idx] = cleaned;
    else list.unshift(cleaned);
    setCache(cacheKey, sortByNewestFirst(list));

    try {
      await setDoc(doc(firestore, "steelTests", cleaned.id), cleaned, {
        merge: true,
      });
    } catch (e) {
      console.warn("Firestore saveSteelTest error:", e);
    }
  },

  async deleteSteelTest(id: string, projectId?: string): Promise<void> {
    removeFromAllVaultCaches("jqms_steel_", id);
    if (projectId) {
      const cacheKey = `jqms_steel_${projectId}`;
      const list = getCache<SteelRebarTest[]>(cacheKey, []).filter(
        (s) => s.id !== id,
      );
      setCache(cacheKey, list);
    }
    try {
      await deleteDoc(doc(firestore, "steelTests", id));
    } catch (e) {
      console.warn("Firestore deleteSteelTest error:", e);
    }
  },

  // --- Bar Cutting Schedules (QA/QC & Rebar Fabrication Control) ---
  async getBarCuttingSchedules(
    projectId: string,
    companyId?: string,
  ): Promise<BarCuttingSchedule[]> {
    try {
      const constraints: QueryConstraint[] = [
        where("projectId", "==", projectId),
      ];
      if (companyId) constraints.push(where("companyId", "==", companyId));

      const q = query(
        collection(firestore, "barCuttingSchedules"),
        ...constraints,
      );
      const snap = await getDocs(q);
      const rawList = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as BarCuttingSchedule,
      );
      const list = sortByNewestFirst(rawList);
      if (list.length > 0) {
        setCache(`jqms_bcs_${projectId}`, list);
        return list;
      }

      const cached = getCache<BarCuttingSchedule[]>(
        `jqms_bcs_${projectId}`,
        [],
      );
      if (cached && cached.length > 0) {
        return sortByNewestFirst(cached);
      }

      const initial = generateInitialSchedules(
        projectId,
        companyId || "comp-apex-civil",
      );
      setCache(`jqms_bcs_${projectId}`, initial);
      return initial;
    } catch (e) {
      console.warn(
        "Firestore getBarCuttingSchedules warning, reading local cache:",
        e,
      );
      const cached = getCache<BarCuttingSchedule[]>(
        `jqms_bcs_${projectId}`,
        [],
      );
      if (cached && cached.length > 0) {
        return sortByNewestFirst(cached);
      }

      const initial = generateInitialSchedules(
        projectId,
        companyId || "comp-apex-civil",
      );
      setCache(`jqms_bcs_${projectId}`, initial);
      return initial;
    }
  },

  async getBarCuttingSchedule(
    id: string,
    projectId?: string,
  ): Promise<BarCuttingSchedule | null> {
    try {
      const snap = await getDoc(doc(firestore, "barCuttingSchedules", id));
      if (snap.exists()) {
        return { ...snap.data(), id: snap.id } as BarCuttingSchedule;
      }
    } catch (e) {
      console.warn("Firestore getBarCuttingSchedule warning:", e);
    }
    if (projectId) {
      const cached = getCache<BarCuttingSchedule[]>(
        `jqms_bcs_${projectId}`,
        [],
      );
      const match = cached.find((b) => b.id === id);
      if (match) return match;
    }
    return null;
  },

  async saveBarCuttingSchedule(schedule: BarCuttingSchedule): Promise<void> {
    const cleaned = cleanForFirestore({
      ...schedule,
      updatedAt: new Date().toISOString(),
    });
    const cacheKey = `jqms_bcs_${cleaned.projectId}`;
    const list = getCache<BarCuttingSchedule[]>(cacheKey, []);
    const idx = list.findIndex((b) => b.id === cleaned.id);
    if (idx >= 0) list[idx] = cleaned as BarCuttingSchedule;
    else list.unshift(cleaned as BarCuttingSchedule);
    setCache(cacheKey, sortByNewestFirst(list));

    try {
      await setDoc(doc(firestore, "barCuttingSchedules", cleaned.id), cleaned, {
        merge: true,
      });
    } catch (e) {
      console.error("Firestore saveBarCuttingSchedule error:", e);
    }
  },

  async deleteBarCuttingSchedule(id: string, projectId: string): Promise<void> {
    removeFromAllVaultCaches("jqms_bcs_", id);
    const cacheKey = `jqms_bcs_${projectId}`;
    const list = getCache<BarCuttingSchedule[]>(cacheKey, []);
    const filtered = list.filter((b) => b.id !== id);
    setCache(cacheKey, filtered);

    try {
      await deleteDoc(doc(firestore, "barCuttingSchedules", id));
    } catch (e) {
      console.error("Firestore deleteBarCuttingSchedule error:", e);
    }
  },

  // --- Material Deliveries ---
  async getDeliveries(
    projectId: string,
    companyId?: string,
  ): Promise<MaterialDelivery[]> {
    try {
      const constraints: QueryConstraint[] = [
        where("projectId", "==", projectId),
      ];
      if (companyId) constraints.push(where("companyId", "==", companyId));

      const q = query(
        collection(firestore, "materialDeliveries"),
        ...constraints,
      );
      const snap = await getDocs(q);
      const rawList = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as MaterialDelivery,
      );
      const list = sortByNewestFirst(rawList);
      if (list.length > 0) {
        setCache(`jqms_deliveries_${projectId}`, list);
      }
      return list;
    } catch (e) {
      console.warn("Firestore getDeliveries warning, reading local cache:", e);
      const cached = getCache<MaterialDelivery[]>(
        `jqms_deliveries_${projectId}`,
        [],
      );
      return sortByNewestFirst(cached);
    }
  },

  async saveDelivery(delivery: MaterialDelivery): Promise<void> {
    const cleaned = cleanForFirestore(delivery);
    const cacheKey = `jqms_deliveries_${cleaned.projectId}`;
    const list = getCache<MaterialDelivery[]>(cacheKey, []);
    const idx = list.findIndex((d) => d.id === cleaned.id);
    if (idx >= 0) list[idx] = cleaned;
    else list.unshift(cleaned);
    setCache(cacheKey, sortByNewestFirst(list));

    try {
      await setDoc(
        doc(firestore, "materialDeliveries", cleaned.id),
        cleaned,
        { merge: true },
      );
    } catch (e) {
      console.warn("Firestore saveDelivery error:", e);
    }
  },

  async deleteDelivery(id: string, projectId?: string): Promise<void> {
    removeFromAllVaultCaches("jqms_deliveries_", id);
    if (projectId) {
      const cacheKey = `jqms_deliveries_${projectId}`;
      const list = getCache<MaterialDelivery[]>(cacheKey, []).filter(
        (d) => d.id !== id,
      );
      setCache(cacheKey, list);
    }
    try {
      await deleteDoc(doc(firestore, "materialDeliveries", id));
    } catch (e) {
      console.warn("Firestore deleteDelivery error:", e);
    }
  },

  // --- Universal Site Photo Gallery ---
  async getPhotos(projectId: string, companyId?: string): Promise<SitePhoto[]> {
    try {
      const constraints: QueryConstraint[] = [
        where("projectId", "==", projectId),
      ];
      if (companyId) constraints.push(where("companyId", "==", companyId));

      const q = query(collection(firestore, "sitePhotos"), ...constraints);
      const snap = await getDocs(q);
      if (!snap.empty) {
        const rawList = snap.docs.map(
          (d) => ({ ...d.data(), id: d.id }) as SitePhoto,
        );
        const list = sortByNewestFirst(rawList);
        setCache(`jqms_photos_${projectId}`, list);
        return list;
      }

      const qAlt = query(collection(firestore, "photos"), ...constraints);
      const snapAlt = await getDocs(qAlt);
      const rawListAlt = snapAlt.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as SitePhoto,
      );
      const listAlt = sortByNewestFirst(rawListAlt);
      if (listAlt.length > 0) {
        setCache(`jqms_photos_${projectId}`, listAlt);
      }
      return listAlt;
    } catch (e) {
      console.warn("Firestore getPhotos warning, reading local cache:", e);
      const cached = getCache<SitePhoto[]>(`jqms_photos_${projectId}`, []);
      return sortByNewestFirst(cached);
    }
  },

  async getSitePhotos(
    projectId: string,
    companyId?: string,
  ): Promise<SitePhoto[]> {
    return this.getPhotos(projectId, companyId);
  },

  async savePhoto(photo: SitePhoto): Promise<void> {
    const cleaned = cleanForFirestore(photo);
    const cacheKey = `jqms_photos_${cleaned.projectId}`;
    const list = getCache<SitePhoto[]>(cacheKey, []);
    const idx = list.findIndex((p) => p.id === cleaned.id);
    if (idx >= 0) list[idx] = cleaned;
    else list.unshift(cleaned);
    setCache(cacheKey, sortByNewestFirst(list));

    try {
      await setDoc(doc(firestore, "sitePhotos", cleaned.id), cleaned, {
        merge: true,
      });
      await setDoc(doc(firestore, "photos", cleaned.id), cleaned, {
        merge: true,
      });
    } catch (e) {
      console.warn("Firestore savePhoto error:", e);
    }
  },

  async deletePhoto(id: string, projectId?: string): Promise<void> {
    removeFromAllVaultCaches("jqms_photos_", id);
    if (projectId) {
      const cacheKey = `jqms_photos_${projectId}`;
      const list = getCache<SitePhoto[]>(cacheKey, []).filter(
        (p) => p.id !== id,
      );
      setCache(cacheKey, list);
    }
    try {
      await deleteDoc(doc(firestore, "sitePhotos", id));
      await deleteDoc(doc(firestore, "photos", id));
    } catch (e) {
      console.warn("Firestore deletePhoto error:", e);
    }
  },

  // --- 4D Planner Events ---
  async getPlannerEvents(
    projectId: string,
    companyId?: string,
  ): Promise<PlannerEvent[]> {
    try {
      const constraints: QueryConstraint[] = [
        where("projectId", "==", projectId),
      ];

      const q = query(collection(firestore, "calendarEvents"), ...constraints);
      const snap = await getDocs(q);
      const rawList = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as PlannerEvent,
      );

      const qAlt = query(
        collection(firestore, "plannerEvents"),
        ...constraints,
      );
      const snapAlt = await getDocs(qAlt);
      const rawListAlt = snapAlt.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as PlannerEvent,
      );

      const cached = getCache<PlannerEvent[]>(`jqms_planner_${projectId}`, []);
      const map = new Map<string, PlannerEvent>();
      cached.forEach((e) => map.set(e.id, e));
      rawList.forEach((e) => map.set(e.id, e));
      rawListAlt.forEach((e) => map.set(e.id, e));

      const merged = Array.from(map.values());
      setCache(`jqms_planner_${projectId}`, merged);
      return sortByNewestFirst(merged);
    } catch (e) {
      console.warn(
        "Firestore getPlannerEvents warning, reading local cache:",
        e,
      );
      const cached = getCache<PlannerEvent[]>(`jqms_planner_${projectId}`, []);
      return sortByNewestFirst(cached);
    }
  },

  async savePlannerEvent(event: PlannerEvent): Promise<void> {
    const cleaned = cleanForFirestore(event);
    const cacheKey = `jqms_planner_${cleaned.projectId}`;
    const list = getCache<PlannerEvent[]>(cacheKey, []);
    const idx = list.findIndex((p) => p.id === cleaned.id);
    if (idx >= 0) list[idx] = cleaned;
    else list.push(cleaned);
    setCache(cacheKey, list);

    try {
      await setDoc(doc(firestore, "calendarEvents", cleaned.id), cleaned, {
        merge: true,
      });
      await setDoc(doc(firestore, "plannerEvents", cleaned.id), cleaned, {
        merge: true,
      });
    } catch (e) {
      console.error("Firestore savePlannerEvent error:", e);
    }

    try {
      window.dispatchEvent(
        new CustomEvent("jqms-planner-updated", { detail: cleaned }),
      );
    } catch {
      // ignore
    }
  },

  async deletePlannerEvent(id: string, projectId?: string): Promise<void> {
    removeFromAllVaultCaches("jqms_planner_", id);
    if (projectId) {
      const cacheKey = `jqms_planner_${projectId}`;
      const list = getCache<PlannerEvent[]>(cacheKey, []).filter(
        (p) => p.id !== id,
      );
      setCache(cacheKey, list);
    }
    try {
      await deleteDoc(doc(firestore, "calendarEvents", id));
      await deleteDoc(doc(firestore, "plannerEvents", id));
    } catch (e) {
      console.warn("Firestore deletePlannerEvent error:", e);
    }
  },

  // --- Document Control ---
  async getDocuments(
    projectId: string,
    companyId?: string,
  ): Promise<DocumentRecord[]> {
    try {
      const constraints: QueryConstraint[] = [
        where("projectId", "==", projectId),
      ];
      if (companyId) constraints.push(where("companyId", "==", companyId));

      const q = query(collection(firestore, "documents"), ...constraints);
      const snap = await getDocs(q);
      const rawList = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as DocumentRecord,
      );
      const list = sortByNewestFirst(rawList);
      if (list.length > 0) {
        setCache(`jqms_documents_${projectId}`, list);
      }
      return list;
    } catch (e) {
      console.warn("Firestore getDocuments warning, reading local cache:", e);
      const cached = getCache<DocumentRecord[]>(
        `jqms_documents_${projectId}`,
        [],
      );
      return sortByNewestFirst(cached);
    }
  },

  async saveDocument(docRecord: DocumentRecord): Promise<void> {
    const cleaned = cleanForFirestore(docRecord);
    const cacheKey = `jqms_documents_${cleaned.projectId}`;
    const list = getCache<DocumentRecord[]>(cacheKey, []);
    const idx = list.findIndex((d) => d.id === cleaned.id);
    if (idx >= 0) list[idx] = cleaned;
    else list.unshift(cleaned);
    setCache(cacheKey, sortByNewestFirst(list));

    try {
      await setDoc(doc(firestore, "documents", cleaned.id), cleaned, {
        merge: true,
      });
    } catch (e) {
      console.warn("Firestore saveDocument error:", e);
    }
  },

  async deleteDocument(id: string, projectId?: string): Promise<void> {
    removeFromAllVaultCaches("jqms_documents_", id);
    if (projectId) {
      const cacheKey = `jqms_documents_${projectId}`;
      const list = getCache<DocumentRecord[]>(cacheKey, []).filter(
        (d) => d.id !== id,
      );
      setCache(cacheKey, list);
    }
    try {
      await deleteDoc(doc(firestore, "documents", id));
    } catch (e) {
      console.warn("Firestore deleteDocument error:", e);
    }
  },

  // --- Immutable Enterprise Audit Logs ---
  async getAuditLogs(companyId: string): Promise<AuditLog[]> {
    try {
      const q = query(
        collection(firestore, "auditLogs"),
        where("companyId", "==", companyId),
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as AuditLog,
      );
      if (list.length > 0) {
        setCache(`jqms_audit_logs_${companyId}`, list);
      }
      return list;
    } catch (e) {
      console.warn("Firestore getAuditLogs warning, reading local cache:", e);
      return getCache<AuditLog[]>(`jqms_audit_logs_${companyId}`, []);
    }
  },

  async saveAuditLog(log: AuditLog): Promise<void> {
    const cleaned = cleanForFirestore(log);
    const cacheKey = `jqms_audit_logs_${cleaned.companyId}`;
    const list = getCache<AuditLog[]>(cacheKey, []);
    list.unshift(cleaned);
    setCache(cacheKey, list.slice(0, 500));

    try {
      await setDoc(doc(firestore, "auditLogs", cleaned.id), cleaned, { merge: true });
    } catch (e) {
      console.warn("Firestore saveAuditLog error:", e);
    }
  },

  // --- Default Engineering Master Trades ---
  async seedCompanyTrades(
    companyId: string,
    forceReset = false,
  ): Promise<MasterTrade[]> {
    if (!companyId) return [];

    try {
      if (!forceReset) {
        const q = query(
          collection(firestore, "trades"),
          where("companyId", "==", companyId),
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const existing = snap.docs.map(
            (d) => ({ ...d.data(), id: d.id }) as MasterTrade,
          );
          setCache(`jqms_trades_${companyId}`, existing);
          return existing;
        }
      }

      const batch = writeBatch(firestore);
      const seeded: MasterTrade[] = [];
      const now = Date.now();

      for (let i = 0; i < DEFAULT_TRADES.length; i++) {
        const dt = DEFAULT_TRADES[i];
        const tradeDocId = `tr-${dt.code.toLowerCase()}-${companyId}`;
        const docRef = doc(firestore, "trades", tradeDocId);
        const tradeData: MasterTrade = {
          id: tradeDocId,
          companyId,
          name: dt.name,
          codePrefix: dt.code,
          colorHex: dt.color,
          icon: dt.icon,
          description: dt.description,
          status: "Active",
          subtrades: dt.subtrades.map((s) => s.name),
          createdAt: now,
          updatedAt: now,
        };
        batch.set(docRef, tradeData);
        seeded.push(tradeData);
      }

      await batch.commit();
      console.log(
        `[JQMS Enterprise] Successfully seeded ${seeded.length} master trades for company ${companyId}`,
      );
      setCache(`jqms_trades_${companyId}`, seeded);
      return seeded;
    } catch (e) {
      console.warn("Firestore seedCompanyTrades fallback:", e);
      const now = Date.now();
      const localList: MasterTrade[] = DEFAULT_TRADES.map((dt) => ({
        id: `tr-${dt.code.toLowerCase()}-${companyId}`,
        companyId,
        name: dt.name,
        codePrefix: dt.code,
        colorHex: dt.color,
        icon: dt.icon,
        description: dt.description,
        status: "Active",
        subtrades: dt.subtrades.map((s) => s.name),
        createdAt: now,
        updatedAt: now,
      }));
      setCache(`jqms_trades_${companyId}`, localList);
      return localList;
    }
  },

  // --- Master Trades & Subtrades (Queried from DB by companyId) ---
  async getTrades(companyId: string): Promise<MasterTrade[]> {
    if (!companyId) return [];
    try {
      const q = query(
        collection(firestore, "trades"),
        where("companyId", "==", companyId),
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        return await this.seedCompanyTrades(companyId);
      }
      const list = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as MasterTrade,
      );
      setCache(`jqms_trades_${companyId}`, list);
      return list;
    } catch (e) {
      console.warn("Firestore getTrades warning, checking cache/seed:", e);
      const cached = getCache<MasterTrade[]>(`jqms_trades_${companyId}`, []);
      if (cached.length > 0) return cached;
      return await this.seedCompanyTrades(companyId);
    }
  },

  async saveTrade(trade: MasterTrade): Promise<void> {
    const cleaned = cleanForFirestore(trade);
    const cacheKey = `jqms_trades_${cleaned.companyId}`;
    const list = getCache<MasterTrade[]>(cacheKey, []);
    const idx = list.findIndex((t) => t.id === cleaned.id);
    if (idx >= 0) list[idx] = cleaned;
    else list.push(cleaned);
    setCache(cacheKey, list);

    try {
      await setDoc(doc(firestore, "trades", cleaned.id), cleaned, { merge: true });
    } catch (e) {
      console.warn("Firestore saveTrade error:", e);
    }
  },

  async deleteTrade(id: string, companyId: string): Promise<void> {
    const cacheKey = `jqms_trades_${companyId}`;
    const list = getCache<MasterTrade[]>(cacheKey, []).filter(
      (t) => t.id !== id,
    );
    setCache(cacheKey, list);

    try {
      await deleteDoc(doc(firestore, "trades", id));
    } catch (e) {
      console.error("Firestore deleteTrade error:", e);
    }
  },

  // --- Seed Built-in Inspection Templates for a Company ---
  async seedCompanyInspectionTemplates(
    companyId: string,
    forceReset = false,
  ): Promise<InspectionTemplate[]> {
    if (!companyId) return [];
    try {
      if (!forceReset) {
        const q = query(
          collection(firestore, "inspectionTemplates"),
          where("companyId", "==", companyId),
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const existing = snap.docs.map(
            (d) => ({ ...d.data(), id: d.id }) as InspectionTemplate,
          );
          setCache(`jqms_inspection_templates_${companyId}`, existing);
          return existing;
        }
      }

      const templatesToCreate: InspectionTemplate[] = [];
      const now = Date.now();
      const chunkSize = 400;
      for (let i = 0; i < BUILTIN_TEMPLATES.length; i += chunkSize) {
        const chunk = BUILTIN_TEMPLATES.slice(i, i + chunkSize);
        const batch = writeBatch(firestore);

        for (const t of chunk) {
          const newDocRef = doc(collection(firestore, "inspectionTemplates"));
          const tmplData: InspectionTemplate = {
            id: newDocRef.id,
            companyId,
            element: t.element,
            stage: t.stage,
            discipline: t.discipline,
            version: t.version,
            isSystem: true,
            isActive: true,
            name: `${t.element} - ${t.stage}`,
            items: t.items.map((it) => ({
              critical: !!it.critical,
              label: it.label,
              isHoldPoint: !!it.critical,
              importanceWeight: it.critical ? 3 : 2,
              acceptanceCriteria:
                "Per approved project specifications & IFC drawings",
              discipline: t.discipline,
            })),
            createdAt: now,
          };
          batch.set(newDocRef, tmplData);
          templatesToCreate.push(tmplData);
        }

        await batch.commit();
      }

      console.log(
        `[JQMS Enterprise] Successfully auto-seeded ${templatesToCreate.length} inspection templates for company ${companyId}`,
      );
      setCache(`jqms_inspection_templates_${companyId}`, templatesToCreate);
      return templatesToCreate;
    } catch (e) {
      console.warn(
        "Firestore seedCompanyInspectionTemplates error/fallback:",
        e,
      );
      const localList: InspectionTemplate[] = BUILTIN_TEMPLATES.map(
        (t, idx) => ({
          id: `tmpl-sys-${companyId}-${idx + 1}`,
          companyId,
          element: t.element,
          stage: t.stage,
          discipline: t.discipline,
          version: t.version,
          isSystem: true,
          isActive: true,
          name: `${t.element} - ${t.stage}`,
          items: t.items.map((it) => ({
            critical: !!it.critical,
            label: it.label,
            isHoldPoint: !!it.critical,
            importanceWeight: it.critical ? 3 : 2,
            acceptanceCriteria:
              "Per approved project specifications & IFC drawings",
            discipline: t.discipline,
          })),
          createdAt: Date.now(),
        }),
      );
      setCache(`jqms_inspection_templates_${companyId}`, localList);
      return localList;
    }
  },

  // --- Inspection Checklist Templates ---
  async getInspectionTemplates(
    companyId: string,
  ): Promise<InspectionTemplate[]> {
    if (!companyId) return [];
    try {
      const q = query(
        collection(firestore, "inspectionTemplates"),
        where("companyId", "==", companyId),
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        return await this.seedCompanyInspectionTemplates(companyId);
      }
      const list = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as InspectionTemplate,
      );
      setCache(`jqms_inspection_templates_${companyId}`, list);
      return list;
    } catch (e) {
      console.warn(
        "Firestore getInspectionTemplates warning, checking cache/seed:",
        e,
      );
      const cached = getCache<InspectionTemplate[]>(
        `jqms_inspection_templates_${companyId}`,
        [],
      );
      if (cached.length > 0) return cached;
      return await this.seedCompanyInspectionTemplates(companyId);
    }
  },

  async saveInspectionTemplate(template: InspectionTemplate): Promise<void> {
    const cleaned = cleanForFirestore(template);
    const cacheKey = `jqms_inspection_templates_${cleaned.companyId}`;
    const list = getCache<InspectionTemplate[]>(cacheKey, []);
    const idx = list.findIndex((t) => t.id === cleaned.id);
    if (idx >= 0) list[idx] = cleaned;
    else list.push(cleaned);
    setCache(cacheKey, list);

    try {
      await setDoc(
        doc(firestore, "inspectionTemplates", cleaned.id),
        cleaned,
        { merge: true },
      );
    } catch (e) {
      console.warn("Firestore saveInspectionTemplate error:", e);
    }
  },

  async deleteInspectionTemplate(id: string, companyId: string): Promise<void> {
    const cacheKey = `jqms_inspection_templates_${companyId}`;
    const list = getCache<InspectionTemplate[]>(cacheKey, []).filter(
      (t) => t.id !== id,
    );
    setCache(cacheKey, list);

    try {
      await deleteDoc(doc(firestore, "inspectionTemplates", id));
    } catch (e) {
      console.error("Firestore deleteInspectionTemplate error:", e);
    }
  },

  // --- Users Directory ---
  async getUsers(companyId?: string): Promise<UserProfile[]> {
    try {
      const constraints: QueryConstraint[] = [];
      if (companyId) constraints.push(where("companyId", "==", companyId));

      const q =
        constraints.length > 0
          ? query(collection(firestore, "users"), ...constraints)
          : collection(firestore, "users");

      const snap = await getDocs(q);
      const list = snap.docs.map(
        (d) => ({ ...d.data(), uid: d.id }) as UserProfile,
      );
      if (list.length > 0) {
        setCache(`jqms_users_${companyId || "all"}`, list);
      }
      return list;
    } catch (e) {
      console.warn("Firestore getUsers warning, reading local cache:", e);
      return getCache<UserProfile[]>(`jqms_users_${companyId || "all"}`, []);
    }
  },

  async saveUser(user: UserProfile): Promise<void> {
    const cleaned = cleanForFirestore(user);
    const cacheKey = `jqms_users_${cleaned.companyId || "all"}`;
    const list = getCache<UserProfile[]>(cacheKey, []);
    const idx = list.findIndex((u) => u.uid === cleaned.uid);
    if (idx >= 0) list[idx] = cleaned;
    else list.push(cleaned);
    setCache(cacheKey, list);

    try {
      await setDoc(doc(firestore, "users", cleaned.uid), cleaned, { merge: true });
    } catch (e) {
      console.warn("Firestore saveUser error:", e);
    }
  },

  // --- Weekly QA/QC Executive Reports (Multi-Tier Redundant Store) ---
  async getWeeklyReports(
    projectId: string,
    companyId?: string,
  ): Promise<WeeklyReport[]> {
    const mergedMap = new Map<string, WeeklyReport>();

    for (const [id, r] of inMemoryWeeklyReports.entries()) {
      if (!projectId || r.projectId === projectId) {
        if (!companyId || !r.companyId || r.companyId === companyId) {
          mergedMap.set(id, r);
        }
      }
    }

    try {
      const cached = getCache<WeeklyReport[]>(
        `jqms_weekly_reports_${projectId}`,
        [],
      );
      for (const r of cached) {
        if (!companyId || !r.companyId || r.companyId === companyId) {
          if (!mergedMap.has(r.id)) mergedMap.set(r.id, r);
        }
      }
      const allCached = getCache<WeeklyReport[]>("jqms_weekly_reports_all", []);
      for (const r of allCached) {
        if (!projectId || r.projectId === projectId) {
          if (!companyId || !r.companyId || r.companyId === companyId) {
            if (!mergedMap.has(r.id)) mergedMap.set(r.id, r);
          }
        }
      }
    } catch (_) {}

    try {
      let rawList: WeeklyReport[] = [];
      try {
        const constraints: QueryConstraint[] = [
          where("projectId", "==", projectId),
        ];
        if (companyId) constraints.push(where("companyId", "==", companyId));

        const q = query(collection(firestore, "weeklyReports"), ...constraints);
        const snap = await getDocs(q);
        rawList = snap.docs.map(
          (d) => ({ ...d.data(), id: d.id }) as WeeklyReport,
        );
      } catch (innerErr) {
        if (companyId) {
          const fallbackQ = query(
            collection(firestore, "weeklyReports"),
            where("projectId", "==", projectId),
          );
          const fallbackSnap = await getDocs(fallbackQ);
          rawList = fallbackSnap.docs
            .map((d) => ({ ...d.data(), id: d.id }) as WeeklyReport)
            .filter((r) => !r.companyId || r.companyId === companyId);
        } else {
          throw innerErr;
        }
      }

      for (const r of rawList) {
        mergedMap.set(r.id, r);
        inMemoryWeeklyReports.set(r.id, r);
      }

      const list = sortByNewestFirst(Array.from(mergedMap.values()));
      if (list.length > 0) {
        try {
          setCache(`jqms_weekly_reports_${projectId}`, list);
        } catch (_) {}
      }
      return list;
    } catch (e) {
      console.warn(
        "Firestore getWeeklyReports warning, serving merged local reports:",
        e,
      );
      return sortByNewestFirst(Array.from(mergedMap.values()));
    }
  },

  async getWeeklyReport(
    id: string,
    projectId?: string,
  ): Promise<WeeklyReport | null> {
    if (inMemoryWeeklyReports.has(id)) {
      return inMemoryWeeklyReports.get(id)!;
    }

    if (projectId) {
      const cached = getCache<WeeklyReport[]>(
        `jqms_weekly_reports_${projectId}`,
        [],
      );
      const found = cached.find((w) => w.id === id);
      if (found) {
        inMemoryWeeklyReports.set(found.id, found);
        return found;
      }
    }
    const allCached = getCache<WeeklyReport[]>("jqms_weekly_reports_all", []);
    const foundAll = allCached.find((w) => w.id === id);
    if (foundAll) {
      inMemoryWeeklyReports.set(foundAll.id, foundAll);
      return foundAll;
    }

    try {
      const snap = await getDoc(doc(firestore, "weeklyReports", id));
      if (snap.exists()) {
        const report = { ...snap.data(), id: snap.id } as WeeklyReport;
        inMemoryWeeklyReports.set(report.id, report);
        return report;
      }
    } catch (e) {
      console.warn(
        "Firestore getWeeklyReport warning, checking all localStorage keys:",
        e,
      );
    }

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("jqms_weekly_reports_")) {
          const list = getCache<WeeklyReport[]>(key, []);
          const found = list.find((w) => w.id === id);
          if (found) {
            inMemoryWeeklyReports.set(found.id, found);
            return found;
          }
        }
      }
    } catch (_) {}
    return null;
  },

  async deleteWeeklyReport(id: string, projectId?: string): Promise<void> {
    inMemoryWeeklyReports.delete(id);
    removeFromAllVaultCaches("jqms_weekly_reports_", id);

    if (projectId) {
      const cacheKey = `jqms_weekly_reports_${projectId}`;
      const list = getCache<WeeklyReport[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((w) => w.id !== id),
      );
    }
    const allList = getCache<WeeklyReport[]>("jqms_weekly_reports_all", []);
    setCache(
      "jqms_weekly_reports_all",
      allList.filter((w) => w.id !== id),
    );
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("jqms_weekly_reports_")) {
          const list = getCache<WeeklyReport[]>(key, []);
          setCache(
            key,
            list.filter((w) => w.id !== id),
          );
        }
      }
    } catch (_) {}

    try {
      await deleteDoc(doc(firestore, "weeklyReports", id));
    } catch (e) {
      console.error("Firestore deleteWeeklyReport error:", e);
    }
  },

  async saveWeeklyReport(report: WeeklyReport): Promise<void> {
    inMemoryWeeklyReports.set(report.id, report);
    const cleaned = cleanForFirestore(report);

    const MAX_ITEMS = 100;

    const slimNcr = (arr: any[] = []) =>
      arr.slice(0, MAX_ITEMS).map((n: any) => ({
        id: n.id || "",
        ncrNumber: n.ncrNumber || "",
        title: n.title || "",
        trade: n.trade || "",
        severity: n.severity || "",
        status: n.status || "",
        location: n.location || "",
        createdAt: n.createdAt || 0,
      }));

    const slimInspection = (arr: any[] = []) =>
      arr.slice(0, MAX_ITEMS).map((i: any) => ({
        id: i.id || "",
        inspectionNumber: i.inspectionNumber || "",
        title: i.title || i.name || "",
        trade: i.trade || "",
        status: i.status || "",
        level: i.level || i.levelName || "",
        result: i.result || "",
        createdAt: i.createdAt || 0,
      }));

    const slimFinding = (arr: any[] = []) =>
      arr.slice(0, MAX_ITEMS).map((f: any) => ({
        id: f.id || "",
        findingNumber: f.findingNumber || "",
        title: f.title || "",
        trade: f.trade || "",
        severity: f.severity || "",
        status: f.status || "",
        createdAt: f.createdAt || 0,
      }));

    const slimMaterial = (arr: any[] = []) =>
      arr.slice(0, MAX_ITEMS).map((m: any) => ({
        id: m.id || "",
        materialName: m.materialName || m.material || m.materialDescription || "",
        materialDescription: m.materialDescription || m.materialName || "",
        supplier: m.supplier || m.supplierName || "",
        supplierName: m.supplierName || m.supplier || "",
        status: m.status || m.qaqcStatus || "",
        qaqcStatus: m.qaqcStatus || m.status || "",
        deliveryDate: m.deliveryDate || m.date || "",
        quantity: m.quantity || 0,
        quantityReceived: m.quantityReceived,
        quantityAccepted: m.quantityAccepted,
        quantityRejected: m.quantityRejected,
        unit: m.unit || "",
        qaqcRemarks: m.qaqcRemarks || m.inspectionNotes || m.remarks || "",
        remarks: m.remarks || m.qaqcRemarks || m.inspectionNotes || "",
        rejectionReason: m.rejectionReason || "",
        batchNumber: m.batchNumber || "",
        deliveryNoteNumber: m.deliveryNoteNumber || m.deliveryNote || "",
        ncrNumber: m.ncrNumber || "",
      }));

    const slimCubeTest = (arr: any[] = []) =>
      arr.slice(0, MAX_ITEMS).map((c: any) => ({
        id: c.id || c.sampleId || "",
        sampleId: c.sampleId || c.id || "",
        dateCast: c.dateCast || c.castDate || c.date || "",
        castDate: c.dateCast || c.castDate || c.date || "",
        inscribedName:
          c.inscribedName ||
          c.elementLevel ||
          c.structureElement ||
          c.level ||
          "",
        elementLevel:
          c.elementLevel ||
          c.inscribedName ||
          c.structureElement ||
          c.level ||
          "",
        strength7Days:
          c.strength7Days !== undefined &&
          c.strength7Days !== null &&
          c.strength7Days !== ""
            ? c.strength7Days
            : (c.day7Results?.[0]?.averageStrength ??
              c.compressiveStrength ??
              ""),
        status7Days:
          c.status7Days ||
          c.result7Days ||
          c.day7Results?.[0]?.status ||
          c.result ||
          "",
        strength28Days:
          c.strength28Days !== undefined &&
          c.strength28Days !== null &&
          c.strength28Days !== ""
            ? c.strength28Days
            : (c.day28Results?.[0]?.averageStrength ?? ""),
        status28Days:
          c.status28Days || c.result28Days || c.day28Results?.[0]?.status || "",
        mixId: c.mixId || c.mix || "",
        grade: c.grade || "",
      }));

    const slimComment = (arr: any[] = []) =>
      arr.slice(0, MAX_ITEMS).map((s: any, idx: number) => ({
        id: s.id || `COMM-${idx + 1}`,
        commentNumber: s.commentNumber || s.refNo || `COMM-${String(idx + 1).padStart(3, "0")}`,
        title: s.title || s.subject || s.comments || s.text || "",
        trade: s.trade || "",
        status: s.status || "PENDING",
        date: s.date || (s.createdAt ? (typeof s.createdAt === "number" ? new Date(s.createdAt).toISOString().split("T")[0] : String(s.createdAt)) : ""),
        createdAt: s.createdAt || 0,
        inspector: s.inspector || s.vendorCheck || "QC Inspector",
        vendorCheck: s.vendorCheck || s.inspector || "",
        location: s.location || "",
        level: s.level || "",
        element: s.element || "",
        comments: s.comments || s.text || s.title || "",
        text: s.text || s.comments || s.title || "",
        photos: Array.isArray(s.photos) ? s.photos.slice(0, 10) : [],
        images: Array.isArray(s.images) ? s.images.slice(0, 10) : [],
      }));

    const slimInstruction = (arr: any[] = []) =>
      arr.slice(0, MAX_ITEMS).map((si: any, idx: number) => ({
        id: si.id || `SI-${idx + 1}`,
        instructionNumber: si.instructionNumber || si.refNo || `SI-${String(idx + 1).padStart(3, "0")}`,
        subject: si.subject || si.title || "Directive",
        title: si.title || si.subject || "Directive",
        instructionText: si.instructionText || si.issueSummary || "",
        issueSummary: si.issueSummary || si.instructionText || "",
        status: si.status || "ISSUED",
        contractorName: si.contractorName || si.recipientName || si.recipient || "Main Contractor",
        recipientName: si.recipientName || si.contractorName || si.recipient || "Main Contractor",
        recipientRole: si.recipientRole || "",
        location: si.location || "",
        elementName: si.elementName || "",
        issuedDate: si.issuedDate || (si.createdAt ? (typeof si.createdAt === "number" ? new Date(si.createdAt).toISOString().split("T")[0] : String(si.createdAt)) : ""),
        complianceDeadline: si.complianceDeadline || si.dueDate || si.targetDate || "",
        dueDate: si.dueDate || si.complianceDeadline || "",
        stopWorkOrdered: Boolean(si.stopWorkOrdered),
      }));

    const slimRemediation = (arr: any[] = []) =>
      arr.slice(0, MAX_ITEMS).map((r: any, idx: number) => ({
        id: r.id || `NCR-REM-${idx + 1}`,
        refNo: r.refNo || r.ncrNumber || r.ncrNo || `NCR-${String(idx + 1).padStart(3, "0")}`,
        ncrNumber: r.ncrNumber || r.refNo || r.ncrNo || `NCR-${String(idx + 1).padStart(3, "0")}`,
        description: r.description || r.issueSummary || r.title || "",
        status: r.status || "OPEN",
        trade: r.trade || r.assignedTo || "",
        assignedTo: r.assignedTo || r.trade || "",
        location: r.location || r.elementLevel || "",
        elementLevel: r.elementLevel || r.location || "",
        dateIdentified: r.dateIdentified || r.dateFound || r.dateRaised || "",
        dateFound: r.dateFound || r.dateIdentified || r.dateRaised || "",
        targetFixDate: r.targetFixDate || r.dueDate || r.signDate || "",
        signDate: r.signDate || r.targetFixDate || "",
      }));

    const slimQuantity = (arr: any[] = []) =>
      arr.slice(0, MAX_ITEMS).map((q: any) => ({
        element: q.element || q.elementName || q.name || "",
        scope:
          q.scope ||
          (q.calculatedVolume !== undefined
            ? `${q.calculatedVolume} CUM`
            : `${q.volume || 0} CUM`),
        completion:
          typeof q.completion === "string"
            ? q.completion
            : `${q.completion || 0}%`,
        calculatedVolume: Number(q.calculatedVolume ?? q.volume ?? 0),
        achievedVolume: Number(q.achievedVolume ?? q.total ?? 0),
        total: Number(q.achievedVolume ?? q.total ?? 0),
        percentageTotal: Number(q.percentageTotal ?? 0),
      }));

    const slimStructuralElement = (arr: any[] = []) =>
      arr.slice(0, 500).map((el: any) => ({
        id: el.id || "",
        elementName: el.elementName || el.name || el.element || "Structural Element",
        elementType: el.elementType || el.type || "Component",
        status: el.status || "PENDING",
        volume: Number(el.calculatedVolume || el.volume || 0),
        calculatedVolume: Number(el.calculatedVolume || el.volume || 0),
        achievedVolume: Number(el.achievedVolume ?? el.arcvievedVolume ?? el.achieved ?? el.completedVolume ?? 0),
        completionPercentage: Number(el.completionPercentage || el.completion || 0),
        grid: el.grid || el.gridLocation || "",
        gridLocation: el.gridLocation || el.grid || "",
        levelName: el.levelName || el.level || "",
        level: el.level || el.levelName || "",
      }));

    let payload: any = {
      ...cleaned,
      coverImageBase64: "",
      logoBase64: "",
      beamLayoutImg: cleaned.beamLayoutImg?.startsWith?.("data:")
        ? ""
        : cleaned.beamLayoutImg || "",
      columnLayoutImg: cleaned.columnLayoutImg?.startsWith?.("data:")
        ? ""
        : cleaned.columnLayoutImg || "",
      slabImg: cleaned.slabImg?.startsWith?.("data:")
        ? ""
        : cleaned.slabImg || "",
      ncr: slimNcr(cleaned.ncr),
      ncrRemediationLog: slimRemediation(cleaned.ncrRemediationLog),
      materialDeliveries: slimMaterial(cleaned.materialDeliveries),
      cubeTests: slimCubeTest(cleaned.cubeTests),
      siteComments: slimComment(cleaned.siteComments),
      siteInstructions: slimInstruction(cleaned.siteInstructions),
      quantitySummary: slimQuantity(cleaned.quantitySummary),
      structuralElements: slimStructuralElement(cleaned.structuralElements),
      filteredNcrs: undefined,
      filteredInspections: undefined,
      filteredFindings: undefined,
      filteredMaterialDeliveries: undefined,
      filteredCubeTests: undefined,
      filteredSiteComments: undefined,
      filteredSiteInstructions: undefined,
    };

    (Object.keys(payload) as string[]).forEach((k: string) => {
      if (payload[k] === undefined) delete payload[k];
    });

    try {
      const cacheKey = `jqms_weekly_reports_${report.projectId}`;
      const list = getCache<WeeklyReport[]>(cacheKey, []);
      const idx = list.findIndex((w) => w.id === report.id);
      if (idx >= 0) list[idx] = cleaned;
      else list.unshift(cleaned);
      setCache(cacheKey, sortByNewestFirst(list));

      const allList = getCache<WeeklyReport[]>("jqms_weekly_reports_all", []);
      const allIdx = allList.findIndex((w) => w.id === report.id);
      if (allIdx >= 0) allList[allIdx] = cleaned;
      else allList.unshift(cleaned);
      setCache("jqms_weekly_reports_all", sortByNewestFirst(allList));
    } catch (cacheErr) {
      console.warn("LocalStorage caching warning:", cacheErr);
    }

    try {
      await setDoc(doc(firestore, "weeklyReports", report.id), payload, {
        merge: true,
      });
    } catch (e) {
      console.error(
        "Firestore saveWeeklyReport warning (saved to in-memory & local caches):",
        e,
      );
    }
  },

  // --- Inspection & Test Plans (ITP Matrix) ---
  async getITPPlans(projectId: string, companyId?: string): Promise<ITPPlan[]> {
    const cacheKey = `jqms_itp_plans_${projectId}`;
    try {
      const constraints: QueryConstraint[] = [
        where("projectId", "==", projectId),
      ];
      if (companyId) constraints.push(where("companyId", "==", companyId));

      const q = query(collection(firestore, "itpPlans"), ...constraints);
      const snap = await getDocs(q);
      if (!snap.empty) {
        const rawList = snap.docs.map(
          (d) => ({ ...d.data(), id: d.id }) as ITPPlan,
        );
        const sorted = sortByNewestFirst(rawList);
        setCache(cacheKey, sorted);
        return sorted;
      }

      const cached = getCache<ITPPlan[]>(cacheKey, []);
      if (cached && cached.length > 0) {
        return sortByNewestFirst(cached);
      }

      const initial = generateDefaultITPPlans(projectId, companyId || "");
      setCache(cacheKey, initial);
      for (const p of initial) {
        try {
          await setDoc(doc(firestore, "itpPlans", p.id), cleanForFirestore(p), {
            merge: true,
          });
        } catch (_) {}
      }
      return initial;
    } catch (e) {
      console.warn(
        "Firestore getITPPlans warning, falling back to local cache:",
        e,
      );
      const cached = getCache<ITPPlan[]>(cacheKey, []);
      if (cached && cached.length > 0) {
        return sortByNewestFirst(cached);
      }
      const initial = generateDefaultITPPlans(projectId, companyId || "");
      setCache(cacheKey, initial);
      return initial;
    }
  },

  async getITPPlanById(id: string): Promise<ITPPlan | null> {
    try {
      const snap = await getDoc(doc(firestore, "itpPlans", id));
      if (snap.exists()) {
        return { ...snap.data(), id: snap.id } as ITPPlan;
      }
    } catch (e) {
      console.warn("Firestore getITPPlanById warning:", e);
    }
    return null;
  },

  async saveITPPlan(plan: ITPPlan): Promise<void> {
    const cleaned = cleanForFirestore(plan);
    const cacheKey = `jqms_itp_plans_${plan.projectId}`;
    const list = getCache<ITPPlan[]>(cacheKey, []);
    const idx = list.findIndex((p) => p.id === plan.id);
    if (idx >= 0) list[idx] = cleaned;
    else list.unshift(cleaned);
    setCache(cacheKey, sortByNewestFirst(list));

    try {
      await setDoc(doc(firestore, "itpPlans", plan.id), cleaned, {
        merge: true,
      });
    } catch (e) {
      console.error("Firestore saveITPPlan error:", e);
    }
  },

  async deleteITPPlan(id: string, projectId: string): Promise<void> {
    removeFromAllVaultCaches("jqms_itp_plans_", id);
    const cacheKey = `jqms_itp_plans_${projectId}`;
    const list = getCache<ITPPlan[]>(cacheKey, []);
    setCache(
      cacheKey,
      list.filter((p) => p.id !== id),
    );

    try {
      await deleteDoc(doc(firestore, "itpPlans", id));
    } catch (e) {
      console.error("Firestore deleteITPPlan error:", e);
    }
  },

  // ─── TEAM CHAT & GROUP MESSAGING SYSTEM ───
  async getChatChannels(
    companyId?: string,
    projectId?: string,
    userId?: string,
  ): Promise<ChatChannel[]> {
    const cacheKey = `jqms_chat_channels_${companyId || "all"}_${projectId || "all"}`;
    try {
      const constraints: QueryConstraint[] = [];
      if (companyId) constraints.push(where("companyId", "==", companyId));

      const q =
        constraints.length > 0
          ? query(collection(firestore, "chatChannels"), ...constraints)
          : collection(firestore, "chatChannels");

      const snap = await getDocs(q);
      const list = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as ChatChannel,
      );

      if (list.length > 0) {
        setCache(cacheKey, list);
        return sortByNewestFirst(list);
      }
    } catch (e) {
      console.warn("Firestore getChatChannels warning, falling back to cache:", e);
    }

    const cached = getCache<ChatChannel[]>(cacheKey, []);
    return sortByNewestFirst(cached);
  },

  async getChatChannelById(id: string): Promise<ChatChannel | null> {
    try {
      const snap = await getDoc(doc(firestore, "chatChannels", id));
      if (snap.exists()) {
        return { ...snap.data(), id: snap.id } as ChatChannel;
      }
    } catch (e) {
      console.warn("Firestore getChatChannelById error:", e);
    }
    return null;
  },

  async saveChatChannel(channel: ChatChannel): Promise<void> {
    const cleaned = cleanForFirestore(channel);
    const cacheKey = `jqms_chat_channels_${channel.companyId || "all"}_${channel.projectId || "all"}`;
    const list = getCache<ChatChannel[]>(cacheKey, []);
    const idx = list.findIndex((c) => c.id === channel.id);
    if (idx >= 0) list[idx] = cleaned;
    else list.unshift(cleaned);
    setCache(cacheKey, list);

    try {
      await setDoc(doc(firestore, "chatChannels", channel.id), cleaned, {
        merge: true,
      });
      window.dispatchEvent(new CustomEvent("jqms-chat-channels-updated", { detail: channel }));
    } catch (e) {
      console.warn("Firestore saveChatChannel error:", e);
    }
  },

  async deleteChatChannel(channelId: string, companyId?: string): Promise<void> {
    removeFromAllVaultCaches("jqms_chat_channels_", channelId);
    removeFromAllVaultCaches("jqms_chat_messages_", channelId);

    try {
      await deleteDoc(doc(firestore, "chatChannels", channelId));
      window.dispatchEvent(new CustomEvent("jqms-chat-channels-updated"));
    } catch (e) {
      console.error("Firestore deleteChatChannel error:", e);
    }
  },

  async getChatMessages(channelId: string): Promise<ChatMessage[]> {
    const cacheKey = `jqms_chat_messages_${channelId}`;
    try {
      const q = query(
        collection(firestore, "chatChannels", channelId, "messages"),
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as ChatMessage,
      );

      list.sort((a, b) => a.timestamp - b.timestamp);

      if (list.length > 0) {
        setCache(cacheKey, list);
        return list;
      }
    } catch (e) {
      console.warn("Firestore getChatMessages warning, reading local cache:", e);
    }

    const cached = getCache<ChatMessage[]>(cacheKey, []);
    cached.sort((a, b) => a.timestamp - b.timestamp);
    return cached;
  },

  async saveChatMessage(message: ChatMessage): Promise<void> {
    const cleaned = cleanForFirestore(message);
    const cacheKey = `jqms_chat_messages_${message.channelId}`;
    const list = getCache<ChatMessage[]>(cacheKey, []);
    const idx = list.findIndex((m) => m.id === message.id);
    if (idx >= 0) list[idx] = cleaned;
    else list.push(cleaned);
    list.sort((a, b) => a.timestamp - b.timestamp);
    setCache(cacheKey, list);

    // Also update channel lastMessage
    try {
      const channelRef = doc(firestore, "chatChannels", message.channelId);
      const lastMsgData = {
        text: message.content || (message.attachments && message.attachments.length > 0 ? "📎 Attachment" : ""),
        senderId: message.senderId,
        senderName: message.senderName,
        timestamp: message.timestamp,
        hasAttachment: Boolean(message.attachments && message.attachments.length > 0),
      };

      await Promise.all([
        setDoc(
          doc(
            firestore,
            "chatChannels",
            message.channelId,
            "messages",
            message.id,
          ),
          cleaned,
          { merge: true },
        ),
        setDoc(
          channelRef,
          {
            lastMessage: lastMsgData,
            updatedAt: message.timestamp,
          },
          { merge: true },
        ),
      ]);

      window.dispatchEvent(
        new CustomEvent("jqms-chat-message-sent", {
          detail: { channelId: message.channelId, message },
        }),
      );
    } catch (e) {
      console.warn("Firestore saveChatMessage error:", e);
    }
  },

  async deleteChatMessage(messageId: string, channelId: string): Promise<void> {
    const cacheKey = `jqms_chat_messages_${channelId}`;
    const list = getCache<ChatMessage[]>(cacheKey, []);
    setCache(
      cacheKey,
      list.filter((m) => m.id !== messageId),
    );

    try {
      await deleteDoc(
        doc(firestore, "chatChannels", channelId, "messages", messageId),
      );
      window.dispatchEvent(
        new CustomEvent("jqms-chat-message-deleted", {
          detail: { channelId, messageId },
        }),
      );
    } catch (e) {
      console.error("Firestore deleteChatMessage error:", e);
    }
  },

  async toggleMessageReaction(
    channelId: string,
    messageId: string,
    emoji: string,
    userId: string,
  ): Promise<void> {
    const cacheKey = `jqms_chat_messages_${channelId}`;
    const list = getCache<ChatMessage[]>(cacheKey, []);
    const targetMsg = list.find((m) => m.id === messageId);
    if (!targetMsg) return;

    const reactions = { ...(targetMsg.reactions || {}) };
    const currentUsers = reactions[emoji] || [];

    if (currentUsers.includes(userId)) {
      reactions[emoji] = currentUsers.filter((u) => u !== userId);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      reactions[emoji] = [...currentUsers, userId];
    }

    targetMsg.reactions = reactions;
    setCache(cacheKey, list);

    try {
      await setDoc(
        doc(firestore, "chatChannels", channelId, "messages", messageId),
        { reactions },
        { merge: true },
      );
      window.dispatchEvent(
        new CustomEvent("jqms-chat-reaction-updated", {
          detail: { channelId, messageId, reactions },
        }),
      );
    } catch (e) {
      console.warn("Firestore toggleMessageReaction error:", e);
    }
  },

  async toggleMessagePin(
    channelId: string,
    messageId: string,
  ): Promise<void> {
    const cacheKey = `jqms_chat_messages_${channelId}`;
    const list = getCache<ChatMessage[]>(cacheKey, []);
    const targetMsg = list.find((m) => m.id === messageId);
    if (!targetMsg) return;

    targetMsg.pinned = !targetMsg.pinned;
    setCache(cacheKey, list);

    try {
      await setDoc(
        doc(firestore, "chatChannels", channelId, "messages", messageId),
        { pinned: targetMsg.pinned },
        { merge: true },
      );
    } catch (e) {
      console.warn("Firestore toggleMessagePin error:", e);
    }
  },

  async markMessagesAsRead(
    channelId: string,
    userId: string,
  ): Promise<void> {
    if (!channelId || !userId) return;
    const cacheKey = `jqms_chat_messages_${channelId}`;
    const list = getCache<ChatMessage[]>(cacheKey, []);
    let modified = false;

    list.forEach((msg) => {
      if (msg.senderId !== userId && (!msg.readBy || !msg.readBy.includes(userId))) {
        msg.readBy = [...(msg.readBy || []), userId];
        msg.status = "read";
        modified = true;
      }
    });

    if (modified) {
      setCache(cacheKey, list);
      window.dispatchEvent(
        new CustomEvent("jqms-chat-messages-read", {
          detail: { channelId, userId },
        }),
      );
    }
  },

  getCachedChannels(companyId?: string, projectId?: string): ChatChannel[] {
    const cacheKey = `jqms_chat_channels_${companyId || "all"}_${projectId || "all"}`;
    const cached = getCache<ChatChannel[]>(cacheKey, []);
    if (cached.length > 0) return cached;
    return getCache<ChatChannel[]>("jqms_chat_channels_all_all", []);
  },

  getChannelUnreadCount(
    channelId: string,
    userId: string,
    lastReadAt?: number,
    channelLastMessage?: ChatChannel["lastMessage"],
  ): number {
    if (!channelId || !userId) return 0;
    const cacheKey = `jqms_chat_messages_${channelId}`;
    const list = getCache<ChatMessage[]>(cacheKey, []);

    if (list.length > 0) {
      const count = list.filter((m) => {
        if (m.senderId === userId) return false;
        if (m.readBy && m.readBy.includes(userId)) return false;
        if (lastReadAt && m.timestamp <= lastReadAt) return false;
        return true;
      }).length;
      return count;
    }

    if (channelLastMessage && channelLastMessage.senderId !== userId) {
      if (!lastReadAt || channelLastMessage.timestamp > lastReadAt) {
        return 1;
      }
    }

    return 0;
  },

  getAllChannelsUnreadCount(
    companyId: string,
    userId: string,
    channelsList?: ChatChannel[],
  ): number {
    if (!userId) return 0;
    const channels =
      channelsList && channelsList.length > 0
        ? channelsList
        : this.getCachedChannels(companyId);
    let lastReadMap: Record<string, number> = {};
    try {
      const saved = localStorage.getItem("jqms_chat_last_read_map");
      if (saved) lastReadMap = JSON.parse(saved);
    } catch {}

    let total = 0;
    channels.forEach((chan) => {
      if (
        chan.memberIds &&
        chan.memberIds.length > 0 &&
        !chan.memberIds.includes(userId)
      ) {
        return;
      }
      const lastRead = lastReadMap[chan.id] || 0;
      total += this.getChannelUnreadCount(
        chan.id,
        userId,
        lastRead,
        chan.lastMessage,
      );
    });
    return total;
  },

  listenToChatMessages(
    channelId: string,
    callback: (messages: ChatMessage[]) => void,
  ): () => void {
    const cacheKey = `jqms_chat_messages_${channelId}`;
    const cached = getCache<ChatMessage[]>(cacheKey, []);
    if (cached.length > 0) callback(cached);

    try {
      const q = query(
        collection(firestore, "chatChannels", channelId, "messages"),
      );
      const unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map(
            (d) => ({ ...d.data(), id: d.id }) as ChatMessage,
          );
          list.sort((a, b) => a.timestamp - b.timestamp);
          setCache(cacheKey, list);
          callback(list);
        },
        (err) => {
          console.warn("listenToChatMessages snapshot error:", err);
        },
      );
      return unsub;
    } catch (e) {
      console.warn("listenToChatMessages setup error:", e);
      return () => {};
    }
  },

  listenToChatChannels(
    companyId: string,
    projectId: string | undefined,
    callback: (channels: ChatChannel[]) => void,
  ): () => void {
    const cacheKey = `jqms_chat_channels_${companyId || "all"}_${projectId || "all"}`;
    const cached = getCache<ChatChannel[]>(cacheKey, []);
    if (cached.length > 0) callback(sortByNewestFirst(cached));

    try {
      const constraints: QueryConstraint[] = [];
      if (companyId) constraints.push(where("companyId", "==", companyId));

      const q =
        constraints.length > 0
          ? query(collection(firestore, "chatChannels"), ...constraints)
          : collection(firestore, "chatChannels");

      const unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map(
            (d) => ({ ...d.data(), id: d.id }) as ChatChannel,
          );
          const sorted = sortByNewestFirst(list);
          setCache(cacheKey, sorted);
          callback(sorted);
        },
        (err) => {
          console.warn("listenToChatChannels snapshot error:", err);
        },
      );
      return unsub;
    } catch (e) {
      console.warn("listenToChatChannels setup error:", e);
      return () => {};
    }
  },

  /**
   * Generates default organization / project channels if none exist.
   */
  async ensureDefaultChannels(
    companyId: string,
    projectId?: string,
    projectName?: string,
    currentUser?: any,
  ): Promise<ChatChannel[]> {
    const existing = await this.getChatChannels(companyId, projectId);
    if (existing.length > 0) return existing;

    const creatorId = currentUser?.uid || "system";
    const creatorName = currentUser?.fullName || "System Admin";
    const now = Date.now();

    const userList = await this.getUsers(companyId).catch(() => []);
    const initialMembers: ChatMember[] = userList.map((u) => ({
      uid: u.uid,
      name: u.fullName || u.email || "Member",
      role: u.role,
      email: u.email,
      isAdmin:
        u.uid === creatorId ||
        ["SUPER_ADMIN", "QUALITY_DIRECTOR", "PROJECT_MANAGER", "QUALITY_MANAGER"].includes(
          u.role,
        ),
      joinedAt: now,
    }));

    if (initialMembers.length === 0) {
      initialMembers.push({
        uid: creatorId,
        name: creatorName,
        role: currentUser?.role || "QUALITY_DIRECTOR",
        isAdmin: true,
        joinedAt: now,
      });
    }

    const memberIds = initialMembers.map((m) => m.uid);

    const defaultChannels: ChatChannel[] = [
      {
        id: `chan-general-${companyId || "org"}`,
        companyId: companyId || "comp-apex-civil",
        name: "General Announcements",
        description: "Company-wide general channel for quality notifications, announcements & updates.",
        type: "GROUP",
        color: "bg-emerald-600",
        createdBy: creatorId,
        createdByName: creatorName,
        createdAt: now,
        updatedAt: now,
        memberIds,
        members: initialMembers,
        isDefaultProjectGroup: false,
        permissions: {
          onlyAdminsCanEditGroupInfo: true,
        },
        lastMessage: {
          text: "Welcome to JayQMS Connect! Collaborate with your team in real time.",
          senderId: creatorId,
          senderName: creatorName,
          timestamp: now,
        },
      },
      {
        id: `chan-qaqc-team-${companyId || "org"}`,
        companyId: companyId || "comp-apex-civil",
        name: "QA/QC Field Operations",
        description: "Coordination for site inspections, test verifications, ITP checkpoints & NCR follow-ups.",
        type: "QAQC_ALERTS",
        color: "bg-sky-600",
        createdBy: creatorId,
        createdByName: creatorName,
        createdAt: now,
        updatedAt: now,
        memberIds,
        members: initialMembers,
        permissions: {
          onlyAdminsCanEditGroupInfo: true,
        },
        lastMessage: {
          text: "Channel created for live QA/QC snagging and field inspection tracking.",
          senderId: creatorId,
          senderName: creatorName,
          timestamp: now,
        },
      },
      {
        id: `chan-concrete-materials-${companyId || "org"}`,
        companyId: companyId || "comp-apex-civil",
        name: "Concrete & Material Lab",
        description: "Pour permits (PTP), cube crushing results, slump verifications & laboratory logs.",
        type: "GROUP",
        color: "bg-amber-600",
        createdBy: creatorId,
        createdByName: creatorName,
        createdAt: now,
        updatedAt: now,
        memberIds,
        members: initialMembers,
        permissions: {
          onlyAdminsCanEditGroupInfo: false,
        },
        lastMessage: {
          text: "Live updates for concrete pour schedules and laboratory cube tests.",
          senderId: creatorId,
          senderName: creatorName,
          timestamp: now,
        },
      },
    ];

    if (projectId) {
      defaultChannels.unshift({
        id: `chan-proj-${projectId}`,
        companyId: companyId || "comp-apex-civil",
        projectId,
        projectName: projectName || "Active Project",
        name: `${projectName || "Project"} Team`,
        description: `Official default quality and field communication group for ${projectName || "this project"}.`,
        type: "PROJECT_GENERAL",
        color: "bg-indigo-600",
        createdBy: creatorId,
        createdByName: creatorName,
        createdAt: now,
        updatedAt: now,
        memberIds,
        members: initialMembers,
        isDefaultProjectGroup: true,
        permissions: {
          onlyAdminsCanEditGroupInfo: true,
        },
        lastMessage: {
          text: `Welcome to the ${projectName || "Project"} team coordination group.`,
          senderId: creatorId,
          senderName: creatorName,
          timestamp: now,
        },
      });
    }

    for (const chan of defaultChannels) {
      await this.saveChatChannel(chan);
      await this.saveChatMessage({
        id: `msg-welcome-${chan.id}`,
        channelId: chan.id,
        companyId: chan.companyId,
        projectId: chan.projectId,
        senderId: creatorId,
        senderName: creatorName,
        senderRole: currentUser?.role || "ADMIN",
        content: chan.lastMessage?.text || "Welcome to this channel!",
        timestamp: now,
        createdAt: now,
        isSystemMessage: true,
      });
    }

    return defaultChannels;
  },

  async setMemberAdminStatus(
    channelId: string,
    memberUid: string,
    isAdmin: boolean,
  ): Promise<void> {
    const cacheKey = `jqms_chat_channels_`;
    const chan = await this.getChatChannelById(channelId);
    if (!chan) return;

    const updatedMembers = (chan.members || []).map((m) =>
      m.uid === memberUid ? { ...m, isAdmin } : m,
    );

    const updatedChannel: ChatChannel = {
      ...chan,
      members: updatedMembers,
      updatedAt: Date.now(),
    };

    await this.saveChatChannel(updatedChannel);
  },

  async removeMemberFromChannel(
    channelId: string,
    memberUid: string,
  ): Promise<void> {
    const chan = await this.getChatChannelById(channelId);
    if (!chan) return;

    const updatedMemberIds = chan.memberIds.filter((id) => id !== memberUid);
    const updatedMembers = (chan.members || []).filter((m) => m.uid !== memberUid);

    const updatedChannel: ChatChannel = {
      ...chan,
      memberIds: updatedMemberIds,
      members: updatedMembers,
      updatedAt: Date.now(),
    };

    await this.saveChatChannel(updatedChannel);
  },

  async updateChannelSettings(
    channelId: string,
    updates: Partial<ChatChannel>,
  ): Promise<void> {
    const chan = await this.getChatChannelById(channelId);
    if (!chan) return;

    const updatedChannel: ChatChannel = {
      ...chan,
      ...updates,
      updatedAt: Date.now(),
    };

    await this.saveChatChannel(updatedChannel);
  },

  // ─── Room-by-Room Punch List & Snag Register ───
  async getRoomPunchItems(
    projectId: string,
    companyId?: string,
  ): Promise<RoomPunchItem[]> {
    try {
      const constraints: QueryConstraint[] = [
        where("projectId", "==", projectId),
      ];
      if (companyId) constraints.push(where("companyId", "==", companyId));

      const q = query(
        collection(firestore, "roomPunchItems"),
        ...constraints,
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as RoomPunchItem);

      if (list.length > 0) {
        setCache(`jqms_room_punch_${projectId}`, list);
        return list;
      }
    } catch (e) {
      console.warn("Firestore getRoomPunchItems warning, reading cache:", e);
    }

    const cached = getCache<RoomPunchItem[]>(`jqms_room_punch_${projectId}`, []);
    if (cached.length > 0) return cached;

    // Default Initial Demo Punch Items for seamless testing
    const demoItems: RoomPunchItem[] = [
      {
        id: `punch-demo-1`,
        punchNumber: "PUNCH-BLD1-L04-402-001",
        projectId,
        projectName: "Apex Commercial & Residential Tower",
        companyId: companyId || "comp-default",
        building: "Tower 1",
        levelName: "Level 04",
        unitName: "Apt 402",
        roomName: "Master Bedroom",
        elementRef: "North Wall / Skirting",
        trade: "Joinery & Doors",
        tradeId: "trade-joinery",
        severity: "MINOR",
        stageStatus: "RECTIFIED",
        title: "Wardrobe sliding track misaligned and skirting gap",
        description: "Gap exceeding 3mm between skirting board and engineered timber flooring behind door swing.",
        beforePhotos: [
          "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80",
        ],
        rectificationPhotos: [
          "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=600&auto=format&fit=crop&q=80",
        ],
        rectificationRemarks: "Track realigned and perimeter acrylic gap-filler applied and color-matched.",
        rectificationDate: new Date(Date.now() - 86400000).toISOString(),
        contractorName: "Prime Finishes & Joinery Ltd",
        assignedToName: "K. O'Connor (Joinery Foreman)",
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
        raisedBy: {
          uid: "user-qaqc",
          name: "Engr. David Okon",
          role: "QAQC_ENGINEER",
          date: new Date(Date.now() - 86400000 * 4).toISOString(),
        },
        rectifiedBy: {
          name: "K. O'Connor",
          date: new Date(Date.now() - 86400000).toISOString(),
          notes: "Rectification complete and vacuumed.",
        },
        createdAt: Date.now() - 86400000 * 4,
        updatedAt: Date.now() - 86400000,
      },
      {
        id: `punch-demo-2`,
        punchNumber: "PUNCH-BLD1-L04-402-002",
        projectId,
        projectName: "Apex Commercial & Residential Tower",
        companyId: companyId || "comp-default",
        building: "Tower 1",
        levelName: "Level 04",
        unitName: "Apt 402",
        roomName: "Ensuite Bathroom",
        elementRef: "Vanity Basin & Plumbing Trap",
        trade: "Sanitary & Plumbing",
        tradeId: "trade-plumbing",
        severity: "MAJOR",
        stageStatus: "QAQC_VERIFIED",
        title: "Slow drainage & chrome bottle trap weeping under vanity",
        description: "Minor seepage detected at bottle trap compression joint during 10-minute continuous flow test.",
        beforePhotos: [
          "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80",
        ],
        rectificationPhotos: [
          "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=600&auto=format&fit=crop&q=80",
        ],
        rectificationRemarks: "Rubber seal gasket replaced and retightened. Re-tested with 15-min hydro flow.",
        rectificationDate: new Date(Date.now() - 43200000).toISOString(),
        contractorName: "AquaFlow MEP Engineering",
        assignedToName: "M. Adeleke",
        dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        raisedBy: {
          uid: "user-qaqc",
          name: "Engr. David Okon",
          role: "QAQC_ENGINEER",
          date: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
        rectifiedBy: {
          name: "M. Adeleke",
          date: new Date(Date.now() - 43200000).toISOString(),
        },
        verifiedBy: {
          uid: "user-qaqc",
          name: "Engr. David Okon",
          role: "QAQC_ENGINEER",
          date: new Date(Date.now() - 21600000).toISOString(),
          notes: "Hydro test re-witnessed on site. Dry joint confirmed.",
        },
        createdAt: Date.now() - 86400000 * 3,
        updatedAt: Date.now() - 21600000,
      },
      {
        id: `punch-demo-3`,
        punchNumber: "PUNCH-BLD1-L04-402-003",
        projectId,
        projectName: "Apex Commercial & Residential Tower",
        companyId: companyId || "comp-default",
        building: "Tower 1",
        levelName: "Level 04",
        unitName: "Apt 402",
        roomName: "Kitchen & Dining",
        elementRef: "Quartz Countertop Splashback",
        trade: "Tiling & Flooring",
        tradeId: "trade-tiling",
        severity: "COSMETIC",
        stageStatus: "ISSUED",
        title: "Silicone seal bead irregular along kitchen countertop edge",
        description: "Antimicrobial silicone bead uneven and smudged across 400mm section behind induction hob.",
        beforePhotos: [
          "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80",
        ],
        rectificationPhotos: [],
        contractorName: "Apex Stone & Surface Specialists",
        assignedToName: "S. Ibrahim",
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
        raisedBy: {
          uid: "user-insp",
          name: "Sarah Jenkins",
          role: "QAQC_INSPECTOR",
          date: new Date().toISOString(),
        },
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 86400000,
      },
      {
        id: `punch-demo-4`,
        punchNumber: "PUNCH-BLD1-L04-401-001",
        projectId,
        projectName: "Apex Commercial & Residential Tower",
        companyId: companyId || "comp-default",
        building: "Tower 1",
        levelName: "Level 04",
        unitName: "Apt 401",
        roomName: "Living Room & Balcony",
        elementRef: "Sliding Glass Door Threshold",
        trade: "Glazing & Windows",
        severity: "MINOR",
        stageStatus: "HANDED_OVER",
        title: "Weatherstrip brush seal missing on left sliding panel",
        description: "Draft seal strip installed and tested for acoustic and wind tightness.",
        beforePhotos: [
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80",
        ],
        rectificationPhotos: [
          "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=600&auto=format&fit=crop&q=80",
        ],
        rectificationRemarks: "EPDM weatherstrip installed.",
        rectificationDate: new Date(Date.now() - 86400000 * 6).toISOString(),
        contractorName: "Skyline Façades & Glazing",
        assignedToName: "P. Weber",
        dueDate: new Date(Date.now() - 86400000 * 5).toISOString().split("T")[0],
        raisedBy: {
          uid: "user-qaqc",
          name: "Engr. David Okon",
          role: "QAQC_ENGINEER",
          date: new Date(Date.now() - 86400000 * 10).toISOString(),
        },
        rectifiedBy: {
          name: "P. Weber",
          date: new Date(Date.now() - 86400000 * 6).toISOString(),
        },
        verifiedBy: {
          uid: "user-qaqc",
          name: "Engr. David Okon",
          role: "QAQC_ENGINEER",
          date: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
        consultantApprovedBy: {
          uid: "user-consultant",
          name: "Arch. Marcus Sterling",
          firm: "Sterling & Partners Consulting",
          date: new Date(Date.now() - 86400000 * 4).toISOString(),
        },
        handedOverBy: {
          uid: "user-pm",
          name: "Engr. B. Adeyemi",
          role: "PROJECT_MANAGER",
          date: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        createdAt: Date.now() - 86400000 * 10,
        updatedAt: Date.now() - 86400000 * 2,
        closedAt: Date.now() - 86400000 * 2,
      },
    ];

    setCache(`jqms_room_punch_${projectId}`, demoItems);
    return demoItems;
  },

  async saveRoomPunchItem(item: RoomPunchItem): Promise<void> {
    const cleaned = cleanForFirestore(item);
    const cacheKey = `jqms_room_punch_${cleaned.projectId}`;
    const list = getCache<RoomPunchItem[]>(cacheKey, []);
    const idx = list.findIndex((p) => p.id === cleaned.id);
    if (idx >= 0) list[idx] = cleaned;
    else list.unshift(cleaned);
    setCache(cacheKey, list);

    try {
      await setDoc(doc(firestore, "roomPunchItems", cleaned.id), cleaned, {
        merge: true,
      });
    } catch (e) {
      console.warn("Firestore saveRoomPunchItem error:", e);
    }
  },

  async deleteRoomPunchItem(id: string, projectId: string): Promise<void> {
    const cacheKey = `jqms_room_punch_${projectId}`;
    const list = getCache<RoomPunchItem[]>(cacheKey, []).filter(
      (p) => p.id !== id,
    );
    setCache(cacheKey, list);

    try {
      await deleteDoc(doc(firestore, "roomPunchItems", id));
    } catch (e) {
      console.warn("Firestore deleteRoomPunchItem error:", e);
    }
  },

  // ─── Taking Over Certificates (TOC) & Handover Dossiers ───
  async getTakingOverCertificates(
    projectId: string,
    companyId?: string,
  ): Promise<TakingOverCertificate[]> {
    try {
      const constraints: QueryConstraint[] = [
        where("projectId", "==", projectId),
      ];
      if (companyId) constraints.push(where("companyId", "==", companyId));

      const q = query(
        collection(firestore, "takingOverCertificates"),
        ...constraints,
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as TakingOverCertificate);

      if (list.length > 0) {
        setCache(`jqms_tocs_${projectId}`, list);
        return list;
      }
    } catch (e) {
      console.warn("Firestore getTakingOverCertificates warning, reading cache:", e);
    }

    const cached = getCache<TakingOverCertificate[]>(`jqms_tocs_${projectId}`, []);
    if (cached.length > 0) return cached;

    const demoCert: TakingOverCertificate = {
      id: `toc-demo-401`,
      tocNumber: "TOC-2026-APT-401",
      projectId,
      projectName: "Apex Commercial & Residential Tower",
      companyId: companyId || "comp-default",
      building: "Tower 1",
      levelName: "Level 04",
      unitName: "Apt 401",
      roomNames: ["Living Room", "Master Bedroom", "Kitchen", "Guest Bathroom", "Balcony"],
      scopeOfHandover: "Practical Completion & Quality Clearance of Apartment 401 (3-Bedroom Luxury Suite)",
      status: "FULLY_HANDED_OVER",
      inspectionDate: new Date(Date.now() - 86400000 * 5).toISOString().split("T")[0],
      handoverDate: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0],
      warrantyStartDate: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0],
      defectsLiabilityPeriodMonths: 12,
      totalSnagsCount: 14,
      openSnagsCount: 0,
      rectifiedSnagsCount: 14,
      verifiedSnagsCount: 14,
      readinessPercentage: 100,
      signOffs: {
        contractorRep: {
          name: "Engr. T. Balogun",
          designation: "Project Director",
          company: "Main Contractor Consortium",
          signed: true,
          date: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
        qaqcManager: {
          name: "Engr. David Okon",
          designation: "Lead QA/QC Manager",
          company: "QA/QC Authority",
          signed: true,
          date: new Date(Date.now() - 86400000 * 4).toISOString(),
        },
        consultantRep: {
          name: "Arch. Marcus Sterling",
          designation: "Supervising Consultant",
          firm: "Sterling & Partners Consulting",
          signed: true,
          date: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
        clientRep: {
          name: "Chief O. Adeleke",
          designation: "Client Project Sponsor",
          organization: "Apex Real Estate Holdings",
          signed: true,
          date: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
      },
      notes: "All 14 snag items rectified and verified. Architectural finish score 98.4%. Keys and warranty manual handed over.",
      createdAt: Date.now() - 86400000 * 5,
      updatedAt: Date.now() - 86400000 * 2,
    };

    setCache(`jqms_tocs_${projectId}`, [demoCert]);
    return [demoCert];
  },

  async saveTakingOverCertificate(cert: TakingOverCertificate): Promise<void> {
    const cleaned = cleanForFirestore(cert);
    const cacheKey = `jqms_tocs_${cleaned.projectId}`;
    const list = getCache<TakingOverCertificate[]>(cacheKey, []);
    const idx = list.findIndex((c) => c.id === cleaned.id);
    if (idx >= 0) list[idx] = cleaned;
    else list.unshift(cleaned);
    setCache(cacheKey, list);

    try {
      await setDoc(doc(firestore, "takingOverCertificates", cleaned.id), cleaned, {
        merge: true,
      });
    } catch (e) {
      console.warn("Firestore saveTakingOverCertificate error:", e);
    }
  },

  // ─── Method Statements & RAMS Review Workflow ───
  async getMethodStatements(
    projectId: string,
    companyId?: string,
  ): Promise<MethodStatement[]> {
    try {
      const constraints: QueryConstraint[] = [
        where("projectId", "==", projectId),
      ];
      if (companyId) constraints.push(where("companyId", "==", companyId));

      const q = query(
        collection(firestore, "methodStatements"),
        ...constraints,
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as MethodStatement);

      if (list.length > 0) {
        setCache(`jqms_method_statements_${projectId}`, list);
        return list;
      }
    } catch (e) {
      console.warn("Firestore getMethodStatements warning, reading cache:", e);
    }

    const cached = getCache<MethodStatement[]>(`jqms_method_statements_${projectId}`, []);
    if (cached.length > 0) return cached;

    // Default Seed Method Statements
    const demoMS: MethodStatement[] = [
      {
        id: "ms-demo-001",
        msNumber: "MS-STR-001",
        title: "Method Statement for Reinforced Concrete Suspended Slabs & Post-Tensioning Works",
        projectId,
        projectName: "Apex Commercial & Residential Tower",
        companyId: companyId || "comp-default",
        discipline: "Civil & Structural",
        trade: "Reinforced Concrete & Post-Tensioning",
        revision: "Rev 01",
        status: "CODE_A",
        reviewCode: "Code A",
        isoClause: "ISO 9001:2015 Clause 8.1 & ISO 45001",
        scopeOfWork: "Detailed execution methodology for formwork erection, rebar fixing, post-tensioned tendon profiling, concrete placement, slump verification, curing, and multi-stage tendon stressing for typical floor slabs L02 to L24.",
        sequenceOfOperations: "1. Formwork falsework erection and surveyor level confirmation.\n2. Bottom rebar mat installation and MEP conduit embedment.\n3. PT duct layout, tendon pushing, dead-end anchor lock, and live-end trumpet placement.\n4. Top rebar grid layout and bar chair fixing.\n5. Pre-pour QA/QC & Consultant hold-point inspection.\n6. Concrete placement via stationary boom pump at 35m3/hr.\n7. Initial curing via wet burlap and polythene sheeting for 7 days.\n8. Stage 1 stressing at 70% cube strength (25 MPa) and final stressing at 28 days.",
        plantAndEquipment: [
          "Stationary Concrete Boom Pump (Schwing 36m)",
          "Hydraulic Multi-Strand Mono-Jack (YDC-240QX)",
          "High-Frequency Concrete Poker Vibrators (50mm)",
          "Total Station Theodolite (Leica TS07)",
          "Digital Calibrated Pressure Gauge (0-60 MPa)",
        ],
        materialsUsed: [
          "Ready-Mix Concrete Grade C35/45 (Fly-Ash Blended)",
          "High-Yield Deformed Steel Rebar Grade 500B",
          "Low-Relaxation 7-Wire Prestressing Steel Strands (ASTM A416 Grade 270, 12.7mm)",
          "HDPE Flat Corrugated Ducts & Trumpets",
          "High-Strength Non-Shrink Grout (SikaGrout 214)",
        ],
        qualityHoldPoints: [
          "HP-01: Formwork alignment, propping stability, and clear cover spacer audit.",
          "HP-02: PT strand elongation calculation sheet and tendon profile parabolic curve sign-off.",
          "HP-03: Pre-Pour Joint Inspection (Permit to Pour Sign-off).",
          "HP-04: 7-Day & 28-Day Concrete Cube Compressive Strength Verification.",
          "HP-05: Post-Tensioning Stressing & Grouting Witness Clearance.",
        ],
        emergencyProcedures: "In case of pump pipe burst or hydraulic jack rupture, immediately activate Emergency Stop, evacuate 10m perimeter radius, apply high-pressure hydraulic lockout, and notify Site Safety Officer.",
        environmentalControls: "Concrete washout containment pits equipped with pH neutralization filters. Silt barriers installed around perimeter storm drains.",
        ramsHazardsAndControls: [
          {
            id: "rams-1",
            activityStep: "High-Pressure Concrete Pumping",
            hazardDescription: "Whip hose failure, concrete splashing, line blockage blowout",
            initialRisk: "HIGH",
            controlMeasures: "Safety whip-checks on all pipe couplings. Full face shield PPE for nozzle operators. Pipe thickness ultrasonic testing prior to pour.",
            residualRisk: "LOW",
            responsiblePerson: "Concrete Foreman & HSE Officer",
          },
          {
            id: "rams-2",
            activityStep: "Hydraulic PT Tendon Stressing",
            hazardDescription: "Strand snapping, jack back-plate blowout under 200kN tension",
            initialRisk: "CRITICAL",
            controlMeasures: "Strict barricaded exclusion zone behind stressing pocket. Heavy-duty ballistic steel shield placed behind operator. Jack calibrated within 30 days.",
            residualRisk: "LOW",
            responsiblePerson: "PT Specialist Lead & Consultant Witness",
          },
        ],
        linkedItpIds: ["itp-conc-001", "itp-rebar-001"],
        linkedItpTitles: [
          "ITP-CONC-001: Concrete Placement & Testing",
          "ITP-REBAR-001: Steel Reinforcement Fabrication & Placement",
        ],
        linkedPtpIds: ["ptp-demo-1"],
        linkedDrawingNumbers: ["STR-SLAB-401-REV-C", "PT-LAYOUT-L04-REV-B"],
        crsItems: [
          {
            id: "crs-1",
            itemNumber: 1,
            sectionReference: "Section 3.2 - Concrete Curing",
            consultantComment: "Specify minimum curing duration for vertical soffits when forms are stripped at 72 hours.",
            commentBy: "Arch. Marcus Sterling (Consultant)",
            commentDate: new Date(Date.now() - 86400000 * 8).toISOString(),
            contractorResponse: "Added Section 3.2.4: Membrane-forming curing compound (ASTM C309 Type 1-D) shall be spray-applied immediately upon formwork stripping.",
            responseBy: "Engr. K. Vance (Project Engineer)",
            responseDate: new Date(Date.now() - 86400000 * 7).toISOString(),
            status: "CLOSED",
          },
        ],
        preparedBy: {
          name: "Engr. Kevin Vance",
          role: "PROJECT_ENGINEER",
          designation: "Senior Project Engineer",
          date: new Date(Date.now() - 86400000 * 10).toISOString(),
          signed: true,
        },
        qaqcReviewer: {
          name: "Engr. David Okon",
          role: "QAQC_ENGINEER",
          designation: "Lead Quality Manager",
          date: new Date(Date.now() - 86400000 * 9).toISOString(),
          signed: true,
          comments: "Reviewed and compliant with BS EN 13670 and project specifications.",
        },
        hseReviewer: {
          name: "Babajide Martins",
          role: "SAFETY_OFFICER",
          designation: "HSE Director",
          date: new Date(Date.now() - 86400000 * 9).toISOString(),
          signed: true,
          comments: "RAMS risk assessment matrix verified. Exclusion zones approved.",
        },
        consultantSignOff: {
          name: "Arch. Marcus Sterling",
          firm: "Sterling & Partners Consulting Engineers",
          date: new Date(Date.now() - 86400000 * 6).toISOString(),
          reviewCode: "Code A",
          signed: true,
          stampNumber: "SPCE-QA-STAMP-4402",
          comments: "Approved without comments. Complies with ISO 9001 Clause 8.1.",
        },
        revisionHistory: [
          {
            revision: "Rev 00",
            date: new Date(Date.now() - 86400000 * 14).toISOString().split("T")[0],
            author: "Engr. K. Vance",
            changeSummary: "Initial submittal for Consultant review.",
            reviewCode: "Code B",
          },
          {
            revision: "Rev 01",
            date: new Date(Date.now() - 86400000 * 7).toISOString().split("T")[0],
            author: "Engr. K. Vance",
            changeSummary: "Incorporated CRS comments on vertical soffit membrane curing.",
            reviewCode: "Code A",
          },
        ],
        createdAt: Date.now() - 86400000 * 14,
        updatedAt: Date.now() - 86400000 * 6,
      },
      {
        id: "ms-demo-002",
        msNumber: "MS-WPF-002",
        title: "Method Statement for Below-Grade Basement Waterproofing & Bentonite Membrane Installation",
        projectId,
        projectName: "Apex Commercial & Residential Tower",
        companyId: companyId || "comp-default",
        discipline: "Façade & Waterproofing",
        trade: "Bentonite & Liquid Applied Waterproofing",
        revision: "Rev 00",
        status: "UNDER_REVIEW",
        reviewCode: "Code B",
        isoClause: "ISO 9001:2015 Clause 8.1",
        scopeOfWork: "Surface preparation, hydrophilic waterstop installation at construction joints, dual-layer bentonite geotextile membrane application, and 48-hour flood ponding test on retaining raft slab.",
        sequenceOfOperations: "1. High-pressure waterjet cleaning of blinding concrete substrate.\n2. Application of expanding sodium-bentonite waterstop swelling bars at all cold joints.\n3. Placement of Voltex bentonite geotextile sheets with 100mm minimum overlap.\n4. Mechanical stapling and seam sealing.\n5. Protection screed (50mm unreinforced M15) cast within 24 hours of membrane installation.",
        plantAndEquipment: [
          "High Pressure Hydro-Washer (250 Bar)",
          "Pneumatic Geotextile Stapler & Seamer",
          "Submersible Sump Pumps (for dewatering)",
        ],
        materialsUsed: [
          "Voltex Sodium Bentonite Geotextile Membrane",
          "Bentoseal Trowel-Grade Mastic",
          "Hydrotite Hydrophilic Waterstop Swelling Profile",
        ],
        qualityHoldPoints: [
          "HP-01: Substrate dryness and surface roughness inspection.",
          "HP-02: Waterstop installation and continuity witness at all pour kickers.",
          "HP-03: Full membrane overlap and corner termination audit before protective screed.",
        ],
        ramsHazardsAndControls: [
          {
            id: "rams-wpf-1",
            activityStep: "Confined Space Basement Application",
            hazardDescription: "Toxic vapor build-up from primers, oxygen deficiency",
            initialRisk: "HIGH",
            controlMeasures: "Forced mechanical air extraction ventilation (minimum 10 air changes/hr). Continuous 4-gas atmospheric monitors.",
            residualRisk: "LOW",
            responsiblePerson: "Confined Space Entry Controller",
          },
        ],
        linkedItpIds: ["itp-waterproofing-001"],
        linkedItpTitles: ["ITP-WPF-001: Sub-Structure Waterproofing Inspection"],
        crsItems: [
          {
            id: "crs-wpf-1",
            itemNumber: 1,
            sectionReference: "Section 4.1 - Overlap Detailing",
            consultantComment: "Please provide manufacturer-backed detail for bentonite penetrations around dewatering sump well-points.",
            commentBy: "Arch. Marcus Sterling (Consultant)",
            commentDate: new Date(Date.now() - 86400000 * 2).toISOString(),
            status: "OPEN",
          },
        ],
        preparedBy: {
          name: "Engr. Kevin Vance",
          role: "PROJECT_ENGINEER",
          date: new Date(Date.now() - 86400000 * 4).toISOString(),
          signed: true,
        },
        qaqcReviewer: {
          name: "Engr. David Okon",
          role: "QAQC_ENGINEER",
          date: new Date(Date.now() - 86400000 * 3).toISOString(),
          signed: true,
        },
        revisionHistory: [
          {
            revision: "Rev 00",
            date: new Date(Date.now() - 86400000 * 4).toISOString().split("T")[0],
            author: "Engr. K. Vance",
            changeSummary: "First submittal for Consultant review.",
          },
        ],
        createdAt: Date.now() - 86400000 * 4,
        updatedAt: Date.now() - 86400000 * 2,
      },
    ];

    setCache(`jqms_method_statements_${projectId}`, demoMS);
    return demoMS;
  },

  async saveMethodStatement(ms: MethodStatement): Promise<void> {
    const cleaned = cleanForFirestore(ms);
    const cacheKey = `jqms_method_statements_${cleaned.projectId}`;
    const list = getCache<MethodStatement[]>(cacheKey, []);
    const idx = list.findIndex((m) => m.id === cleaned.id);
    if (idx >= 0) list[idx] = cleaned;
    else list.unshift(cleaned);
    setCache(cacheKey, list);

    try {
      await setDoc(doc(firestore, "methodStatements", cleaned.id), cleaned, {
        merge: true,
      });
    } catch (e) {
      console.warn("Firestore saveMethodStatement error:", e);
    }
  },

  async deleteMethodStatement(id: string, projectId: string): Promise<void> {
    const cacheKey = `jqms_method_statements_${projectId}`;
    const list = getCache<MethodStatement[]>(cacheKey, []).filter(
      (m) => m.id !== id,
    );
    setCache(cacheKey, list);

    try {
      await deleteDoc(doc(firestore, "methodStatements", id));
    } catch (e) {
      console.warn("Firestore deleteMethodStatement error:", e);
    }
  },
};

export const db = dbService;


