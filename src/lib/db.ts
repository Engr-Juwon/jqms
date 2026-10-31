import { firestore, auth } from "@/firebase";
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
  orderBy,
  limit,
  onSnapshot,
  runTransaction,
  arrayUnion,
  QueryConstraint,
  WriteBatch,
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
import {
  getVaultRecord,
  setVaultRecord,
  removeFromAllVaultCaches,
  hydrateVaultFromIDB,
  queueOfflineAction,
  OfflineSyncEntityType,
} from "./idbVault";
import { registerLogoutCleanup, useAuthStore } from "@/stores/useAuthStore";

export interface AppNotification {
  id: string;
  companyId: string;
  projectId?: string;
  userId?: string; // target user or undefined for tenant broadcast
  targetRoles?: string[];
  type:
    | "ACTION_REQUIRED"
    | "NCR_RAISED"
    | "PERMIT_PENDING"
    | "INSPECTION_SCHEDULED"
    | "SYSTEM"
    | "CHAT";
  title: string;
  message: string;
  linkUrl?: string;
  readBy?: string[];
  isRead?: boolean;
  createdAt: number;
  metadata?: Record<string, any>;
}

// ─── HIGH-SPEED MEMORY & VAULT CACHING ──────────────────────────────────

function getCache<T>(key: string, defaultVal: T): T {
  return getVaultRecord<T>(key, defaultVal);
}

function setCache<T>(key: string, data: T): void {
  setVaultRecord<T>(key, data);
}

// In-memory runtime cache for WeeklyReports to guarantee zero-loss session persistence
const inMemoryWeeklyReports = new Map<string, WeeklyReport>();

export function clearInMemoryCaches(): void {
  inMemoryWeeklyReports.clear();
}

// Hook into auth store logout cleanup
if (typeof queueMicrotask === "function") {
  queueMicrotask(() => {
    try {
      registerLogoutCleanup(() => clearInMemoryCaches());
    } catch {
      // Ignore if store not yet bound
    }
  });
}

// ─── TENANT IDENTITY RESOLUTION ─────────────────────────────────────────

const GHOST_COMPANY_IDS = new Set(["all", "undefined", "null", "none", ""]);

export function resolveEffectiveCompanyId(explicitCompanyId?: string): string {
  if (explicitCompanyId && !GHOST_COMPANY_IDS.has(explicitCompanyId.trim())) {
    return explicitCompanyId.trim();
  }
  try {
    const authState = useAuthStore.getState();
    const userCompId = authState.currentUser?.companyId?.trim();
    if (userCompId && !GHOST_COMPANY_IDS.has(userCompId)) {
      return userCompId;
    }
    const storeCompId = authState.company?.id?.trim();
    if (storeCompId && !GHOST_COMPANY_IDS.has(storeCompId)) {
      return storeCompId;
    }
  } catch {
    // Auth store not yet mounted
  }
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const rawUser = localStorage.getItem("jqms_current_user");
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u?.companyId && !GHOST_COMPANY_IDS.has(u.companyId.trim())) {
          return u.companyId.trim();
        }
      }
      const rawComp = localStorage.getItem("jqms_current_company");
      if (rawComp) {
        const c = JSON.parse(rawComp);
        if (c?.id && !GHOST_COMPANY_IDS.has(c.id.trim())) {
          return c.id.trim();
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  }
  return "";
}

function scopedCacheKey(
  entity: string,
  projectId?: string,
  companyId?: string,
): string {
  const comp = companyId || "default";
  const proj = projectId || "global";
  return `jqms_${entity}_${comp}_${proj}`;
}

// ─── TRANSIENT NETWORK DETECTOR ─────────────────────────────────────────

export function isTransientNetworkError(err: any): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return true;
  }
  if (!err) return false;
  const code = String(err.code || "").toLowerCase();
  const msg = String(err.message || "").toLowerCase();

  // Definite security/validation/quota errors MUST NOT be treated as offline network loss
  if (
    code.includes("permission-denied") ||
    code.includes("unauthenticated") ||
    code.includes("invalid-argument") ||
    code.includes("resource-exhausted") ||
    code.includes("failed-precondition") ||
    code.includes("not-found") ||
    code.includes("already-exists")
  ) {
    return false;
  }

  return (
    code === "unavailable" ||
    code === "deadline-exceeded" ||
    code === "cancelled" ||
    code.includes("network") ||
    msg.includes("network") ||
    msg.includes("failed to fetch") ||
    msg.includes("offline") ||
    msg.includes("internet") ||
    msg.includes("client is offline")
  );
}

// ─── CHUNKED BATCH COMMITTER (<= 450 OPS PER BATCH) ────────────────────

export async function commitInChunks<T>(
  items: T[],
  applyOp: (batch: WriteBatch, item: T) => void,
  chunkSize = 450,
): Promise<void> {
  if (!items || items.length === 0) return;
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const batch = writeBatch(firestore);
    for (const item of chunk) {
      applyOp(batch, item);
    }
    await batch.commit();
  }
}

// ─── SANITIZATION & SORT HELPERS ────────────────────────────────────────

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
  } catch {
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

export function parseSortTimestamp(item: any): number {
  if (!item || typeof item !== "object") return 0;

  const candidate =
    item.timestamp ??
    item.createdAt ??
    item.createdDate ??
    item.uploadedAt ??
    item.deliveryDate ??
    item.castDate ??
    item.castingDate ??
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

// ─── PERSISTENCE HELPER WITH OFFLINE FALLBACK ───────────────────────────

async function persistRecord<
  T extends { id: string; projectId?: string; companyId?: string },
>(
  collectionName: string,
  entityType: OfflineSyncEntityType,
  item: T,
  cacheKey: string,
  sortFn?: (a: T, b: T) => number,
): Promise<void> {
  const effectiveCompId = resolveEffectiveCompanyId(item.companyId);
  const targetDoc = cleanForFirestore({
    ...item,
    companyId: effectiveCompId || item.companyId || "",
  });

  const previousCache = getCache<T[]>(cacheKey, []);
  const nextCache = [...previousCache];
  const idx = nextCache.findIndex((x) => x.id === item.id);
  if (idx >= 0) nextCache[idx] = targetDoc;
  else nextCache.unshift(targetDoc);
  if (sortFn) nextCache.sort(sortFn);
  else nextCache.sort((a, b) => parseSortTimestamp(b) - parseSortTimestamp(a));
  setCache(cacheKey, nextCache);

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    await queueOfflineAction({
      type: entityType,
      projectId: item.projectId || "global",
      companyId: effectiveCompId,
      payload: targetDoc,
    });
    return;
  }

  try {
    await setDoc(doc(firestore, collectionName, targetDoc.id), targetDoc, {
      merge: true,
    });
  } catch (err: any) {
    if (isTransientNetworkError(err)) {
      console.warn(
        `[dbService] Transient network error while saving ${collectionName}/${targetDoc.id}. Queueing offline.`,
        err,
      );
      await queueOfflineAction({
        type: entityType,
        projectId: item.projectId || "global",
        companyId: effectiveCompId,
        payload: targetDoc,
      });
      return;
    }
    // Revert optimistic cache on hard rejection (e.g. permission-denied) and rethrow
    setCache(cacheKey, previousCache);
    console.error(
      `[dbService] Cloud write rejected for ${collectionName}/${targetDoc.id}:`,
      err,
    );
    throw err;
  }
}

// ─── DBSERVICE IMPLEMENTATION ───────────────────────────────────────────

export const dbService = {
  // Initialization - ensures no fake dummy records are seeded and pre-warms IDB cache
  async initDefaults() {
    try {
      await hydrateVaultFromIDB();
    } catch (_) {}
    console.log("[JQMS Enterprise] Connected to Live Cloud Firestore Database");
  },

  clearInMemoryCaches() {
    clearInMemoryCaches();
  },

  // ─── MONOTONIC SEQUENCE NUMBER GENERATOR ──────────────────────────────
  async getNextSequenceNumber(
    companyId: string,
    projectId: string,
    prefix: string,
    padLength = 3,
  ): Promise<{ sequence: number; formattedCode: string }> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!effectiveCompId) {
      throw new Error(
        "Active company workspace is required to generate sequential numbering.",
      );
    }
    const cleanPrefix = (prefix || "DOC").trim().toUpperCase();
    const counterDocId = `${effectiveCompId}_${projectId || "global"}_${cleanPrefix}`;
    const counterRef = doc(firestore, "documentCounters", counterDocId);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const fallbackSeq = Date.now() % 10000;
      return {
        sequence: fallbackSeq,
        formattedCode: `${cleanPrefix}-OFF-${fallbackSeq}`,
      };
    }

    try {
      const nextSeq = await runTransaction(firestore, async (transaction) => {
        const snap = await transaction.get(counterRef);
        const current = snap.exists() ? Number(snap.data()?.current ?? 0) : 0;
        const next = current + 1;
        transaction.set(
          counterRef,
          {
            id: counterDocId,
            companyId: effectiveCompId,
            projectId: projectId || "global",
            prefix: cleanPrefix,
            current: next,
            updatedAt: Date.now(),
          },
          { merge: true },
        );
        return next;
      });

      return {
        sequence: nextSeq,
        formattedCode: `${cleanPrefix}-${String(nextSeq).padStart(padLength, "0")}`,
      };
    } catch (e) {
      if (isTransientNetworkError(e)) {
        const fallbackSeq = Date.now() % 10000;
        return {
          sequence: fallbackSeq,
          formattedCode: `${cleanPrefix}-OFF-${fallbackSeq}`,
        };
      }
      throw e;
    }
  },

  // --- Companies ---
  async getCompany(companyId: string): Promise<Company | null> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!effectiveCompId) return null;
    const cacheKey = `jqms_company_${effectiveCompId}`;
    try {
      const snap = await getDoc(doc(firestore, "companies", effectiveCompId));
      if (snap.exists()) {
        const comp = { ...snap.data(), id: snap.id } as Company;
        setCache(cacheKey, comp);
        return comp;
      }
      return getCache<Company | null>(cacheKey, null);
    } catch (e) {
      console.warn(`Firestore getCompany warning for ${effectiveCompId}:`, e);
      return getCache<Company | null>(cacheKey, null);
    }
  },

  async saveCompany(company: Partial<Company> & { id: string }): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(company.id);
    if (!effectiveCompId) {
      throw new Error("Cannot save company without a valid workspace ID.");
    }
    const cleaned = cleanForFirestore({
      ...company,
      id: effectiveCompId,
      updatedAt: Date.now(),
    });
    setCache(`jqms_company_${effectiveCompId}`, cleaned as Company);

    try {
      await setDoc(doc(firestore, "companies", effectiveCompId), cleaned, {
        merge: true,
      });
    } catch (e: any) {
      console.error("Firestore saveCompany error:", e);
      throw e;
    }
  },

  async getCompanies(companyId?: string): Promise<Company[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!effectiveCompId) return [];
    try {
      const single = await this.getCompany(effectiveCompId);
      return single ? [single] : [];
    } catch {
      return [];
    }
  },

  subscribeCompany(
    companyId: string,
    callback: (company: Company | null) => void,
  ): () => void {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!effectiveCompId) {
      callback(null);
      return () => {};
    }
    try {
      const unsub = onSnapshot(
        doc(firestore, "companies", effectiveCompId),
        (snap) => {
          if (snap.exists()) {
            const comp = { ...snap.data(), id: snap.id } as Company;
            setCache(`jqms_company_${effectiveCompId}`, comp);
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
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!effectiveCompId) return [];
    const cacheKey = `jqms_projects_${effectiveCompId}`;
    try {
      const q = query(
        collection(firestore, "projects"),
        where("companyId", "==", effectiveCompId),
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Project);
      if (list.length > 0) {
        setCache(cacheKey, list);
        return list;
      }
      // If Firestore query returned 0 docs, check local vault cache in case offline/offline-synced
      const cached = getCache<Project[]>(cacheKey, []);
      if (cached.length > 0) return cached;
      return list;
    } catch (e) {
      console.warn("Firestore getProjects warning, reading local cache:", e);
      const cached = getCache<Project[]>(cacheKey, []);
      if (cached.length > 0) return cached;
      return getCache<Project[]>("jqms_projects_all", []);
    }
  },

  async saveProject(project: Project): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(project.companyId);
    if (!effectiveCompId) {
      throw new Error("Project must belong to an active company workspace.");
    }
    const cleaned = cleanForFirestore({
      ...project,
      companyId: effectiveCompId,
      updatedAt: new Date().toISOString(),
    });
    const cacheKey = `jqms_projects_${effectiveCompId}`;
    const previous = getCache<Project[]>(cacheKey, []);
    const next = [...previous];
    const idx = next.findIndex((p) => p.id === cleaned.id);
    if (idx >= 0) next[idx] = cleaned;
    else next.unshift(cleaned);
    setCache(cacheKey, next);

    try {
      await setDoc(doc(firestore, "projects", cleaned.id), cleaned, {
        merge: true,
      });
    } catch (e: any) {
      setCache(cacheKey, previous);
      console.error("Firestore saveProject error:", e);
      throw new Error(
        e?.message || "Failed to persist project changes to cloud database.",
      );
    }
  },

  async deleteProject(projectId: string, companyId?: string): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (effectiveCompId) {
      const cacheKey = `jqms_projects_${effectiveCompId}`;
      const list = getCache<Project[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((p) => p.id !== projectId),
      );
    }
    removeFromAllVaultCaches("jqms_projects_", projectId);
    await deleteDoc(doc(firestore, "projects", projectId));
  },

  async updateProjectCurrentLevel(
    projectId: string,
    levelId: string,
    levelName?: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    const payload = cleanForFirestore({
      currentLevelId: levelId,
      currentLevelName: levelName || "",
      updatedAt: new Date().toISOString(),
    });
    if (effectiveCompId) {
      const cacheKey = `jqms_projects_${effectiveCompId}`;
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
    }

    try {
      await setDoc(doc(firestore, "projects", projectId), payload, {
        merge: true,
      });
    } catch (e) {
      console.error("Firestore updateProjectCurrentLevel error:", e);
    }
  },

  async updateProjectCostRates(
    projectId: string,
    costRates: any,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    const payload = cleanForFirestore({
      costRates,
      currency: costRates?.currencySymbol || "$",
      updatedAt: new Date().toISOString(),
    });
    if (effectiveCompId) {
      const cacheKey = `jqms_projects_${effectiveCompId}`;
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
    }

    try {
      await setDoc(doc(firestore, "projects", projectId), payload, {
        merge: true,
      });
    } catch (e) {
      console.error("Firestore updateProjectCostRates error:", e);
    }
  },

  async updateProjectCarbonFactors(
    projectId: string,
    carbonFactors: any,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    const payload = cleanForFirestore({
      carbonFactors,
      updatedAt: new Date().toISOString(),
    });
    if (effectiveCompId) {
      const cacheKey = `jqms_projects_${effectiveCompId}`;
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
    }

    try {
      await setDoc(doc(firestore, "projects", projectId), payload, {
        merge: true,
      });
    } catch (e) {
      console.error("Firestore updateProjectCarbonFactors error:", e);
    }
  },

  // --- Project Levels ---
  async getLevels(
    projectId: string,
    companyId?: string,
  ): Promise<ProjectLevel[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!projectId || !effectiveCompId) return [];
    const cacheKey = scopedCacheKey("levels", projectId, effectiveCompId);
    try {
      const q = query(
        collection(firestore, "projectLevels"),
        where("projectId", "==", projectId),
        where("companyId", "==", effectiveCompId),
      );
      const snap = await getDocs(q);
      const list = snap.docs
        .map((d) => ({ ...d.data(), id: d.id }) as ProjectLevel)
        .sort(
          (a, b) =>
            (a.order ?? 0) - (b.order ?? 0) ||
            (a.elevation ?? 0) - (b.elevation ?? 0),
        );
      setCache(cacheKey, list);
      return list;
    } catch (e) {
      console.warn("Firestore getLevels warning, reading local cache:", e);
      return getCache<ProjectLevel[]>(cacheKey, []);
    }
  },

  async saveLevel(level: ProjectLevel): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(level.companyId);
    const cleaned = sanitizeLevelForFirestore({
      ...level,
      companyId: effectiveCompId,
    });
    const cacheKey = scopedCacheKey(
      "levels",
      cleaned.projectId,
      effectiveCompId,
    );
    await persistRecord(
      "projectLevels",
      "PROJECT_LEVELS",
      cleaned,
      cacheKey,
      (a, b) =>
        (a.order ?? 0) - (b.order ?? 0) ||
        (a.elevation ?? 0) - (b.elevation ?? 0),
    );
  },

  async saveLevels(
    levelsOrProjectId: ProjectLevel[] | string,
    maybeLevels?: ProjectLevel[] | string,
    maybeCompanyId?: string,
  ): Promise<void> {
    let levels: ProjectLevel[] = [];
    let projectId = "";
    let companyId = "";

    if (Array.isArray(levelsOrProjectId)) {
      levels = levelsOrProjectId;
      projectId = levels[0]?.projectId || "";
      companyId =
        (typeof maybeLevels === "string" ? maybeLevels : "") ||
        levels[0]?.companyId ||
        "";
    } else {
      projectId = levelsOrProjectId;
      levels = Array.isArray(maybeLevels) ? maybeLevels : [];
      companyId = maybeCompanyId || levels[0]?.companyId || "";
    }

    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    const cleanedLevels = levels.map((l) =>
      sanitizeLevelForFirestore({
        ...l,
        projectId,
        companyId: effectiveCompId,
      }),
    );

    if (projectId && effectiveCompId) {
      const cacheKey = scopedCacheKey("levels", projectId, effectiveCompId);
      const sorted = [...cleanedLevels].sort(
        (a, b) =>
          (a.order ?? 0) - (b.order ?? 0) ||
          (a.elevation ?? 0) - (b.elevation ?? 0),
      );
      setCache(cacheKey, sorted);
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await queueOfflineAction({
        type: "PROJECT_LEVELS",
        projectId,
        companyId: effectiveCompId,
        payload: {
          projectId,
          companyId: effectiveCompId,
          levels: cleanedLevels,
        },
      });
      return;
    }

    try {
      await commitInChunks(cleanedLevels, (batch, lvl) => {
        batch.set(doc(firestore, "projectLevels", lvl.id), lvl, {
          merge: true,
        });
      });
    } catch (err: any) {
      if (isTransientNetworkError(err)) {
        await queueOfflineAction({
          type: "PROJECT_LEVELS",
          projectId,
          companyId: effectiveCompId,
          payload: {
            projectId,
            companyId: effectiveCompId,
            levels: cleanedLevels,
          },
        });
        return;
      }
      throw err;
    }
  },

  async deleteLevel(
    levelId: string,
    projectId?: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    removeFromAllVaultCaches("jqms_levels_", levelId);
    if (projectId && effectiveCompId) {
      const cacheKey = scopedCacheKey("levels", projectId, effectiveCompId);
      const list = getCache<ProjectLevel[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((l) => l.id !== levelId),
      );
    }
    await deleteDoc(doc(firestore, "projectLevels", levelId));
  },

  // --- Structural Elements & 3D BIM ---
  async getElements(
    projectId: string,
    companyId?: string,
  ): Promise<StructuralElement[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!projectId || !effectiveCompId) return [];
    const cacheKey = scopedCacheKey("elements", projectId, effectiveCompId);
    try {
      const q = query(
        collection(firestore, "structuralElements"),
        where("projectId", "==", projectId),
        where("companyId", "==", effectiveCompId),
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as StructuralElement,
      );
      setCache(cacheKey, list);
      return list;
    } catch (e) {
      console.warn("Firestore getElements warning, reading local cache:", e);
      return getCache<StructuralElement[]>(cacheKey, []);
    }
  },

  subscribeElements(
    projectId: string,
    callback: (elements: StructuralElement[]) => void,
    companyId?: string,
  ): () => void {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!projectId || !effectiveCompId) {
      callback([]);
      return () => {};
    }
    const cacheKey = scopedCacheKey("elements", projectId, effectiveCompId);
    try {
      const q = query(
        collection(firestore, "structuralElements"),
        where("projectId", "==", projectId),
        where("companyId", "==", effectiveCompId),
      );

      const unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map(
            (d) => ({ ...d.data(), id: d.id }) as StructuralElement,
          );
          setCache(cacheKey, list);
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
    const effectiveCompId = resolveEffectiveCompanyId(element.companyId);
    const cleaned = cleanForFirestore({
      ...element,
      companyId: effectiveCompId,
    });
    const cacheKey = scopedCacheKey(
      "elements",
      cleaned.projectId,
      effectiveCompId,
    );
    await persistRecord(
      "structuralElements",
      "STRUCTURAL_ELEMENTS",
      cleaned,
      cacheKey,
    );
  },

  async saveElements(
    elementsOrProjectId: StructuralElement[] | string,
    maybeElements?: StructuralElement[] | string,
    maybeCompanyId?: string,
  ): Promise<void> {
    let elements: StructuralElement[] = [];
    let projectId = "";
    let companyId = "";

    if (Array.isArray(elementsOrProjectId)) {
      elements = elementsOrProjectId;
      projectId = elements[0]?.projectId || "";
      companyId =
        (typeof maybeElements === "string"
          ? maybeLevelsToComp(maybeElements)
          : "") ||
        elements[0]?.companyId ||
        "";
    } else {
      projectId = elementsOrProjectId;
      elements = Array.isArray(maybeElements) ? maybeElements : [];
      companyId = maybeCompanyId || elements[0]?.companyId || "";
    }

    function maybeLevelsToComp(val: string): string {
      return val;
    }

    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    const cleanedList = elements.map((e) =>
      cleanForFirestore({ ...e, projectId, companyId: effectiveCompId }),
    );

    if (projectId && effectiveCompId) {
      const cacheKey = scopedCacheKey("elements", projectId, effectiveCompId);
      const list = getCache<StructuralElement[]>(cacheKey, []);
      const map = new Map(list.map((e) => [e.id, e]));
      cleanedList.forEach((e) => map.set(e.id, e));
      setCache(cacheKey, Array.from(map.values()));
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await queueOfflineAction({
        type: "STRUCTURAL_ELEMENTS",
        projectId,
        companyId: effectiveCompId,
        payload: {
          projectId,
          companyId: effectiveCompId,
          elements: cleanedList,
        },
      });
      return;
    }

    try {
      await commitInChunks(cleanedList, (batch, el) => {
        batch.set(doc(firestore, "structuralElements", el.id), el, {
          merge: true,
        });
      });
    } catch (err: any) {
      if (isTransientNetworkError(err)) {
        await queueOfflineAction({
          type: "STRUCTURAL_ELEMENTS",
          projectId,
          companyId: effectiveCompId,
          payload: {
            projectId,
            companyId: effectiveCompId,
            elements: cleanedList,
          },
        });
        return;
      }
      throw err;
    }
  },

  async deleteElement(
    elementId: string,
    projectId?: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    removeFromAllVaultCaches("jqms_elements_", elementId);
    if (projectId && effectiveCompId) {
      const cacheKey = scopedCacheKey("elements", projectId, effectiveCompId);
      const list = getCache<StructuralElement[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((e) => e.id !== elementId),
      );
    }
    await deleteDoc(doc(firestore, "structuralElements", elementId));
  },

  async bulkUpdateElements(
    elementIds: string[],
    updates: Partial<StructuralElement>,
    projectId: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    const cleanedUpdates = cleanForFirestore(updates);
    const cacheKey = scopedCacheKey("elements", projectId, effectiveCompId);
    const list = getCache<StructuralElement[]>(cacheKey, []);
    const updatedList = list.map((e) =>
      elementIds.includes(e.id) ? { ...e, ...cleanedUpdates } : e,
    );
    setCache(cacheKey, updatedList);

    await commitInChunks(elementIds, (batch, id) => {
      batch.set(doc(firestore, "structuralElements", id), cleanedUpdates, {
        merge: true,
      });
    });
  },

  async bulkDeleteElements(
    elementIds: string[],
    projectId: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    elementIds.forEach((id) => removeFromAllVaultCaches("jqms_elements_", id));
    const cacheKey = scopedCacheKey("elements", projectId, effectiveCompId);
    const list = getCache<StructuralElement[]>(cacheKey, []);
    setCache(
      cacheKey,
      list.filter((e) => !elementIds.includes(e.id)),
    );

    await commitInChunks(elementIds, (batch, id) => {
      batch.delete(doc(firestore, "structuralElements", id));
    });
  },

  // --- Gridlines ---
  async getGridlines(
    projectId: string,
    companyId?: string,
  ): Promise<Gridline[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!projectId || !effectiveCompId) return [];
    const cacheKey = scopedCacheKey("gridlines", projectId, effectiveCompId);
    try {
      const q = query(
        collection(firestore, "gridlines"),
        where("projectId", "==", projectId),
        where("companyId", "==", effectiveCompId),
      );
      const snap = await getDocs(q);
      const list = snap.docs
        .map((d) => ({ ...d.data(), id: d.id }) as Gridline)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setCache(cacheKey, list);
      return list;
    } catch (e) {
      console.warn("Firestore getGridlines warning, reading local cache:", e);
      return getCache<Gridline[]>(cacheKey, []);
    }
  },

  async saveGridline(gridline: Gridline): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(gridline.companyId);
    const cleaned = cleanForFirestore({
      ...gridline,
      companyId: effectiveCompId,
    });
    const cacheKey = scopedCacheKey(
      "gridlines",
      cleaned.projectId,
      effectiveCompId,
    );
    await persistRecord(
      "gridlines",
      "GRIDLINES",
      cleaned,
      cacheKey,
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );
  },

  async saveGridlines(
    gridlinesOrProjectId: Gridline[] | string,
    maybeGridlines?: Gridline[] | string,
    maybeCompanyId?: string,
  ): Promise<void> {
    let gridlines: Gridline[] = [];
    let projectId = "";
    let companyId = "";

    if (Array.isArray(gridlinesOrProjectId)) {
      gridlines = gridlinesOrProjectId;
      projectId = gridlines[0]?.projectId || "";
      companyId =
        (typeof maybeGridlines === "string" ? maybeGridlines : "") ||
        gridlines[0]?.companyId ||
        "";
    } else {
      projectId = gridlinesOrProjectId;
      gridlines = Array.isArray(maybeGridlines) ? maybeGridlines : [];
      companyId = maybeCompanyId || gridlines[0]?.companyId || "";
    }

    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    const cleaned = gridlines.map((g) =>
      cleanForFirestore({ ...g, projectId, companyId: effectiveCompId }),
    );

    if (projectId && effectiveCompId) {
      const cacheKey = scopedCacheKey("gridlines", projectId, effectiveCompId);
      const sorted = [...cleaned].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
      );
      setCache(cacheKey, sorted);
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await queueOfflineAction({
        type: "GRIDLINES",
        projectId,
        companyId: effectiveCompId,
        payload: { projectId, companyId: effectiveCompId, gridlines: cleaned },
      });
      return;
    }

    try {
      await commitInChunks(cleaned, (batch, g) => {
        batch.set(doc(firestore, "gridlines", g.id), g, { merge: true });
      });
    } catch (err: any) {
      if (isTransientNetworkError(err)) {
        await queueOfflineAction({
          type: "GRIDLINES",
          projectId,
          companyId: effectiveCompId,
          payload: {
            projectId,
            companyId: effectiveCompId,
            gridlines: cleaned,
          },
        });
        return;
      }
      throw err;
    }
  },

  async deleteGridline(
    gridlineId: string,
    projectId?: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    removeFromAllVaultCaches("jqms_gridlines_", gridlineId);
    if (projectId && effectiveCompId) {
      const cacheKey = scopedCacheKey("gridlines", projectId, effectiveCompId);
      const list = getCache<Gridline[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((g) => g.id !== gridlineId),
      );
    }
    await deleteDoc(doc(firestore, "gridlines", gridlineId));
  },

  // --- Work Packages ---
  async getWorkPackages(
    projectId: string,
    companyId?: string,
  ): Promise<WorkPackage[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!projectId || !effectiveCompId) return [];
    const cacheKey = scopedCacheKey(
      "work_packages",
      projectId,
      effectiveCompId,
    );
    try {
      const q = query(
        collection(firestore, "workPackages"),
        where("projectId", "==", projectId),
        where("companyId", "==", effectiveCompId),
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as WorkPackage,
      );
      setCache(cacheKey, list);
      return list;
    } catch (e) {
      console.warn(
        "Firestore getWorkPackages warning, reading local cache:",
        e,
      );
      return getCache<WorkPackage[]>(cacheKey, []);
    }
  },

  async saveWorkPackage(pkg: WorkPackage): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(pkg.companyId);
    const cleaned = cleanForFirestore({ ...pkg, companyId: effectiveCompId });
    const cacheKey = scopedCacheKey(
      "work_packages",
      cleaned.projectId,
      effectiveCompId,
    );
    await persistRecord("workPackages", "WORK_PACKAGE", cleaned, cacheKey);
  },

  async deleteWorkPackage(
    pkgId: string,
    projectId?: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    removeFromAllVaultCaches("jqms_work_packages_", pkgId);
    if (projectId && effectiveCompId) {
      const cacheKey = scopedCacheKey(
        "work_packages",
        projectId,
        effectiveCompId,
      );
      const list = getCache<WorkPackage[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((p) => p.id !== pkgId),
      );
    }
    await deleteDoc(doc(firestore, "workPackages", pkgId));
  },

  // --- Site Comments / Observations ---
  async getSiteComments(
    projectId: string,
    companyId?: string,
  ): Promise<SiteCommentReport[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!projectId || !effectiveCompId) return [];
    const cacheKey = scopedCacheKey(
      "site_comments",
      projectId,
      effectiveCompId,
    );
    try {
      const q = query(
        collection(firestore, "site_comments"),
        where("projectId", "==", projectId),
        where("companyId", "==", effectiveCompId),
      );
      const snap = await getDocs(q);
      const rawList = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as SiteCommentReport,
      );
      const list = sortByNewestFirst(rawList);
      setCache(cacheKey, list);
      return list;
    } catch (e) {
      console.warn(
        "Firestore getSiteComments warning, reading local cache:",
        e,
      );
      return getCache<SiteCommentReport[]>(cacheKey, []);
    }
  },

  async saveSiteComment(report: SiteCommentReport): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(report.companyId);
    const cleaned = cleanForFirestore({
      ...report,
      companyId: effectiveCompId,
    });
    const cacheKey = scopedCacheKey(
      "site_comments",
      cleaned.projectId,
      effectiveCompId,
    );
    await persistRecord("site_comments", "SITE_COMMENT", cleaned, cacheKey);
  },

  async deleteSiteComment(
    id: string,
    projectId?: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    removeFromAllVaultCaches("jqms_site_comments_", id);
    if (projectId && effectiveCompId) {
      const cacheKey = scopedCacheKey(
        "site_comments",
        projectId,
        effectiveCompId,
      );
      const list = getCache<SiteCommentReport[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((c) => c.id !== id),
      );
    }
    await deleteDoc(doc(firestore, "site_comments", id));
    await deleteDoc(doc(firestore, "siteComments", id)).catch(() => {});
  },

  subscribeSiteComments(
    projectId: string,
    callback: (reports: SiteCommentReport[]) => void,
    companyId?: string,
  ): () => void {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!projectId || !effectiveCompId) {
      callback([]);
      return () => {};
    }
    const cacheKey = scopedCacheKey(
      "site_comments",
      projectId,
      effectiveCompId,
    );
    try {
      const q = query(
        collection(firestore, "site_comments"),
        where("projectId", "==", projectId),
        where("companyId", "==", effectiveCompId),
      );
      const unsub = onSnapshot(
        q,
        (snap) => {
          const rawList = snap.docs.map(
            (d) => ({ ...d.data(), id: d.id }) as SiteCommentReport,
          );
          const list = sortByNewestFirst(rawList);
          setCache(cacheKey, list);
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
  async getNCR(
    id: string,
    companyId?: string,
  ): Promise<NonConformanceReport | null> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    try {
      const snap = await getDoc(doc(firestore, "ncrs", id));
      if (snap.exists()) {
        const item = { ...snap.data(), id: snap.id } as NonConformanceReport;
        if (!effectiveCompId || item.companyId === effectiveCompId) return item;
      }
    } catch (e) {
      console.warn("Firestore getNCR error:", e);
    }
    return null;
  },

  async getNCRs(
    projectId: string,
    companyId?: string,
  ): Promise<NonConformanceReport[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!projectId || !effectiveCompId) return [];
    const cacheKey = scopedCacheKey("ncrs", projectId, effectiveCompId);
    try {
      const q = query(
        collection(firestore, "ncrs"),
        where("projectId", "==", projectId),
        where("companyId", "==", effectiveCompId),
      );
      const snap = await getDocs(q);
      const rawList = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as NonConformanceReport,
      );
      const list = sortByNewestFirst(rawList);
      setCache(cacheKey, list);
      return list;
    } catch (e) {
      console.warn("Firestore getNCRs warning, reading local cache:", e);
      return getCache<NonConformanceReport[]>(cacheKey, []);
    }
  },

  async saveNCR(ncr: NonConformanceReport): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(ncr.companyId);
    const cleaned = cleanForFirestore({ ...ncr, companyId: effectiveCompId });
    const cacheKey = scopedCacheKey("ncrs", cleaned.projectId, effectiveCompId);
    await persistRecord("ncrs", "NCR", cleaned, cacheKey);
  },

  async deleteNCR(
    id: string,
    projectId?: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    removeFromAllVaultCaches("jqms_ncrs_", id);
    if (projectId && effectiveCompId) {
      const cacheKey = scopedCacheKey("ncrs", projectId, effectiveCompId);
      const list = getCache<NonConformanceReport[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((n) => n.id !== id),
      );
    }
    await deleteDoc(doc(firestore, "ncrs", id));
  },

  subscribeNCRs(
    projectId: string,
    callback: (ncrs: NonConformanceReport[]) => void,
    companyId?: string,
  ): () => void {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!projectId || !effectiveCompId) {
      callback([]);
      return () => {};
    }
    const cacheKey = scopedCacheKey("ncrs", projectId, effectiveCompId);
    try {
      const q = query(
        collection(firestore, "ncrs"),
        where("projectId", "==", projectId),
        where("companyId", "==", effectiveCompId),
      );
      const unsub = onSnapshot(
        q,
        (snap) => {
          const rawList = snap.docs.map(
            (d) => ({ ...d.data(), id: d.id }) as NonConformanceReport,
          );
          const list = sortByNewestFirst(rawList);
          setCache(cacheKey, list);
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

  // --- Site Instructions ---
  async getSiteInstructions(
    projectId: string,
    companyId?: string,
  ): Promise<SiteInstruction[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!projectId || !effectiveCompId) return [];
    const cacheKey = scopedCacheKey(
      "site_instructions",
      projectId,
      effectiveCompId,
    );
    try {
      const q = query(
        collection(firestore, "siteInstructions"),
        where("projectId", "==", projectId),
        where("companyId", "==", effectiveCompId),
      );
      const snap = await getDocs(q);
      const rawList = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as SiteInstruction,
      );
      const list = sortByNewestFirst(rawList);
      setCache(cacheKey, list);
      return list;
    } catch (e) {
      console.warn(
        "Firestore getSiteInstructions warning, reading local cache:",
        e,
      );
      return getCache<SiteInstruction[]>(cacheKey, []);
    }
  },

  async getSiteInstruction(
    id: string,
    companyId?: string,
  ): Promise<SiteInstruction | null> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    try {
      const snap = await getDoc(doc(firestore, "siteInstructions", id));
      if (snap.exists()) {
        const item = { ...snap.data(), id: snap.id } as SiteInstruction;
        if (!effectiveCompId || item.companyId === effectiveCompId) return item;
      }
    } catch (e) {
      console.warn("Firestore getSiteInstruction error:", e);
    }
    return null;
  },

  async saveSiteInstruction(si: SiteInstruction): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(si.companyId);
    const cleaned = cleanForFirestore({ ...si, companyId: effectiveCompId });
    const cacheKey = scopedCacheKey(
      "site_instructions",
      cleaned.projectId,
      effectiveCompId,
    );
    await persistRecord(
      "siteInstructions",
      "SITE_INSTRUCTION",
      cleaned,
      cacheKey,
    );
  },

  async deleteSiteInstruction(
    id: string,
    projectId?: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    removeFromAllVaultCaches("jqms_site_instructions_", id);
    if (projectId && effectiveCompId) {
      const cacheKey = scopedCacheKey(
        "site_instructions",
        projectId,
        effectiveCompId,
      );
      const list = getCache<SiteInstruction[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((s) => s.id !== id),
      );
    }
    await deleteDoc(doc(firestore, "siteInstructions", id));
  },

  // --- Daily Site Logs ---
  async getDailySiteLogs(
    projectId: string,
    companyId?: string,
  ): Promise<DailySiteLog[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!projectId || !effectiveCompId) return [];
    const cacheKey = scopedCacheKey(
      "daily_site_logs",
      projectId,
      effectiveCompId,
    );
    try {
      const q = query(
        collection(firestore, "dailySiteLogs"),
        where("projectId", "==", projectId),
        where("companyId", "==", effectiveCompId),
      );
      const snap = await getDocs(q);
      const rawList = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as DailySiteLog,
      );
      const list = sortByNewestFirst(rawList);
      setCache(cacheKey, list);
      return list;
    } catch (e) {
      console.warn(
        "Firestore getDailySiteLogs warning, reading local cache:",
        e,
      );
      return getCache<DailySiteLog[]>(cacheKey, []);
    }
  },

  async getDailySiteLog(
    id: string,
    companyId?: string,
  ): Promise<DailySiteLog | null> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    try {
      const snap = await getDoc(doc(firestore, "dailySiteLogs", id));
      if (snap.exists()) {
        const item = { ...snap.data(), id: snap.id } as DailySiteLog;
        if (!effectiveCompId || item.companyId === effectiveCompId) return item;
      }
    } catch (e) {
      console.warn("Firestore getDailySiteLog error:", e);
    }
    return null;
  },

  async saveDailySiteLog(log: DailySiteLog): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(log.companyId);
    const cleaned = cleanForFirestore({ ...log, companyId: effectiveCompId });
    const cacheKey = scopedCacheKey(
      "daily_site_logs",
      cleaned.projectId,
      effectiveCompId,
    );
    await persistRecord("dailySiteLogs", "DAILY_LOG", cleaned, cacheKey);
  },

  async deleteDailySiteLog(
    id: string,
    projectId?: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    removeFromAllVaultCaches("jqms_daily_site_logs_", id);
    if (projectId && effectiveCompId) {
      const cacheKey = scopedCacheKey(
        "daily_site_logs",
        projectId,
        effectiveCompId,
      );
      const list = getCache<DailySiteLog[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((l) => l.id !== id),
      );
    }
    await deleteDoc(doc(firestore, "dailySiteLogs", id));
  },

  // --- Requests for Information (RFI) ---
  async getRFIs(
    projectId: string,
    companyId?: string,
  ): Promise<RequestForInformation[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!projectId || !effectiveCompId) return [];
    const cacheKey = scopedCacheKey("rfis", projectId, effectiveCompId);
    try {
      const q = query(
        collection(firestore, "rfis"),
        where("projectId", "==", projectId),
        where("companyId", "==", effectiveCompId),
      );
      const snap = await getDocs(q);
      const rawList = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as RequestForInformation,
      );
      const list = sortByNewestFirst(rawList);
      setCache(cacheKey, list);
      return list;
    } catch (e) {
      console.warn("Firestore getRFIs warning, reading local cache:", e);
      return getCache<RequestForInformation[]>(cacheKey, []);
    }
  },

  async saveRFI(rfi: RequestForInformation): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(rfi.companyId);
    const cleaned = cleanForFirestore({ ...rfi, companyId: effectiveCompId });
    const cacheKey = scopedCacheKey("rfis", cleaned.projectId, effectiveCompId);
    await persistRecord("rfis", "RFI", cleaned, cacheKey);
  },

  async deleteRFI(
    id: string,
    projectId?: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    removeFromAllVaultCaches("jqms_rfis_", id);
    if (projectId && effectiveCompId) {
      const cacheKey = scopedCacheKey("rfis", projectId, effectiveCompId);
      const list = getCache<RequestForInformation[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((r) => r.id !== id),
      );
    }
    await deleteDoc(doc(firestore, "rfis", id));
  },

  // --- Material Approval Requests (MAR / Submittals) ---
  async getMARs(
    projectId: string,
    companyId?: string,
  ): Promise<MaterialApprovalRequest[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!projectId || !effectiveCompId) return [];
    const cacheKey = scopedCacheKey("mars", projectId, effectiveCompId);
    try {
      const q = query(
        collection(firestore, "submittals"),
        where("projectId", "==", projectId),
        where("companyId", "==", effectiveCompId),
      );
      const snap = await getDocs(q);
      const rawList = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as MaterialApprovalRequest,
      );
      const list = sortByNewestFirst(rawList);
      setCache(cacheKey, list);
      return list;
    } catch (e) {
      console.warn("Firestore getMARs warning, reading local cache:", e);
      return getCache<MaterialApprovalRequest[]>(cacheKey, []);
    }
  },

  async saveMAR(mar: MaterialApprovalRequest): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(mar.companyId);
    const cleaned = cleanForFirestore({ ...mar, companyId: effectiveCompId });
    const cacheKey = scopedCacheKey("mars", cleaned.projectId, effectiveCompId);
    await persistRecord("submittals", "MAR", cleaned, cacheKey);
  },

  async deleteMAR(
    id: string,
    projectId?: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    removeFromAllVaultCaches("jqms_mars_", id);
    if (projectId && effectiveCompId) {
      const cacheKey = scopedCacheKey("mars", projectId, effectiveCompId);
      const list = getCache<MaterialApprovalRequest[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((m) => m.id !== id),
      );
    }
    await deleteDoc(doc(firestore, "submittals", id));
    await deleteDoc(doc(firestore, "mars", id)).catch(() => {});
  },

  // --- Material Inspection Reports (MIR) ---
  async getMIRs(
    projectId: string,
    companyId?: string,
  ): Promise<MaterialInspectionReport[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!projectId || !effectiveCompId) return [];
    const cacheKey = scopedCacheKey("mirs", projectId, effectiveCompId);
    try {
      const q = query(
        collection(firestore, "mirs"),
        where("projectId", "==", projectId),
        where("companyId", "==", effectiveCompId),
      );
      const snap = await getDocs(q);
      const rawList = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as MaterialInspectionReport,
      );
      const list = sortByNewestFirst(rawList);
      setCache(cacheKey, list);
      return list;
    } catch (e) {
      console.warn("Firestore getMIRs warning, reading local cache:", e);
      return getCache<MaterialInspectionReport[]>(cacheKey, []);
    }
  },

  async getMIR(
    id: string,
    projectId?: string,
    companyId?: string,
  ): Promise<MaterialInspectionReport | null> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    try {
      const snap = await getDoc(doc(firestore, "mirs", id));
      if (snap.exists()) {
        const item = {
          ...snap.data(),
          id: snap.id,
        } as MaterialInspectionReport;
        if (!effectiveCompId || item.companyId === effectiveCompId) return item;
      }
    } catch (e) {
      console.warn("Firestore getMIR warning:", e);
    }
    return null;
  },

  async saveMIR(mir: MaterialInspectionReport): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(mir.companyId);
    const cleaned = cleanForFirestore({ ...mir, companyId: effectiveCompId });
    const cacheKey = scopedCacheKey("mirs", cleaned.projectId, effectiveCompId);
    await persistRecord("mirs", "MIR", cleaned, cacheKey);
  },

  async deleteMIR(
    id: string,
    projectId?: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    removeFromAllVaultCaches("jqms_mirs_", id);
    if (projectId && effectiveCompId) {
      const cacheKey = scopedCacheKey("mirs", projectId, effectiveCompId);
      const list = getCache<MaterialInspectionReport[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((m) => m.id !== id),
      );
    }
    await deleteDoc(doc(firestore, "mirs", id));
  },

  // --- Quality Inspections ---
  async getInspection(
    id: string,
    companyId?: string,
  ): Promise<InspectionRequest | null> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    try {
      const snap = await getDoc(doc(firestore, "inspections", id));
      if (snap.exists()) {
        const item = { ...snap.data(), id: snap.id } as InspectionRequest;
        if (!effectiveCompId || item.companyId === effectiveCompId) return item;
      }
    } catch (e) {
      console.warn("Firestore getInspection error:", e);
    }
    return null;
  },

  async getInspections(
    projectId: string,
    companyId?: string,
  ): Promise<InspectionRequest[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!projectId || !effectiveCompId) return [];
    const cacheKey = scopedCacheKey("inspections", projectId, effectiveCompId);
    try {
      const q = query(
        collection(firestore, "inspections"),
        where("projectId", "==", projectId),
        where("companyId", "==", effectiveCompId),
      );
      const snap = await getDocs(q);
      const rawList = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as InspectionRequest,
      );
      const list = sortByNewestFirst(rawList);
      setCache(cacheKey, list);
      return list;
    } catch (e) {
      console.warn("Firestore getInspections warning, reading local cache:", e);
      return getCache<InspectionRequest[]>(cacheKey, []);
    }
  },

  async saveInspection(insp: InspectionRequest): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(insp.companyId);
    const cleaned = cleanForFirestore({ ...insp, companyId: effectiveCompId });
    const cacheKey = scopedCacheKey(
      "inspections",
      cleaned.projectId,
      effectiveCompId,
    );
    await persistRecord("inspections", "INSPECTION", cleaned, cacheKey);
  },

  async deleteInspection(
    id: string,
    projectId?: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    removeFromAllVaultCaches("jqms_inspections_", id);
    if (projectId && effectiveCompId) {
      const cacheKey = scopedCacheKey(
        "inspections",
        projectId,
        effectiveCompId,
      );
      const list = getCache<InspectionRequest[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((i) => i.id !== id),
      );
    }
    await deleteDoc(doc(firestore, "inspections", id));
  },

  subscribeInspections(
    projectId: string,
    callback: (inspections: InspectionRequest[]) => void,
    companyId?: string,
  ): () => void {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!projectId || !effectiveCompId) {
      callback([]);
      return () => {};
    }
    const cacheKey = scopedCacheKey("inspections", projectId, effectiveCompId);
    try {
      const q = query(
        collection(firestore, "inspections"),
        where("projectId", "==", projectId),
        where("companyId", "==", effectiveCompId),
      );
      const unsub = onSnapshot(
        q,
        (snap) => {
          const rawList = snap.docs.map(
            (d) => ({ ...d.data(), id: d.id }) as InspectionRequest,
          );
          const list = sortByNewestFirst(rawList);
          setCache(cacheKey, list);
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
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!projectId || !effectiveCompId) return [];
    const cacheKey = scopedCacheKey("ptps", projectId, effectiveCompId);
    try {
      const q = query(
        collection(firestore, "permitsToPour"),
        where("projectId", "==", projectId),
        where("companyId", "==", effectiveCompId),
      );
      const snap = await getDocs(q);
      const rawList = snap.docs.map((d) =>
        normalizePermitToPour({ ...d.data(), id: d.id }),
      );
      const list = sortByNewestFirst(rawList);
      setCache(cacheKey, list);
      return list;
    } catch (e) {
      console.warn(
        "Firestore getPermitsToPour warning, reading local cache:",
        e,
      );
      return getCache<PermitToPour[]>(cacheKey, []);
    }
  },

  async getPermitToPours(
    projectId: string,
    companyId?: string,
  ): Promise<PermitToPour[]> {
    return this.getPermitsToPour(projectId, companyId);
  },

  async savePermitToPour(ptp: PermitToPour): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(ptp.companyId);
    const cleaned = cleanForFirestore({ ...ptp, companyId: effectiveCompId });
    const cacheKey = scopedCacheKey("ptps", cleaned.projectId, effectiveCompId);
    await persistRecord("permitsToPour", "POUR_PERMIT", cleaned, cacheKey);
  },

  async deletePermitToPour(
    id: string,
    projectId?: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    removeFromAllVaultCaches("jqms_ptps_", id);
    if (projectId && effectiveCompId) {
      const cacheKey = scopedCacheKey("ptps", projectId, effectiveCompId);
      const list = getCache<PermitToPour[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((p) => p.id !== id),
      );
    }
    await deleteDoc(doc(firestore, "permitsToPour", id));
    await deleteDoc(doc(firestore, "permitToPour", id)).catch(() => {});
  },

  // --- Concrete Cube Samples ---
  async getCubeSamples(
    projectId: string,
    companyId?: string,
  ): Promise<ConcreteCubeSample[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!projectId || !effectiveCompId) return [];
    const cacheKey = scopedCacheKey("cubes", projectId, effectiveCompId);
    try {
      const q = query(
        collection(firestore, "cubeSamples"),
        where("projectId", "==", projectId),
        where("companyId", "==", effectiveCompId),
      );
      const snap = await getDocs(q);
      const rawList = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as ConcreteCubeSample,
      );
      const list = sortByNewestFirst(rawList);
      setCache(cacheKey, list);
      return list;
    } catch (e) {
      console.warn("Firestore getCubeSamples warning, reading local cache:", e);
      return getCache<ConcreteCubeSample[]>(cacheKey, []);
    }
  },

  async getCubeSample(
    id: string,
    projectId?: string,
    companyId?: string,
  ): Promise<ConcreteCubeSample | null> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    try {
      const snap = await getDoc(doc(firestore, "cubeSamples", id));
      if (snap.exists()) {
        const item = { ...snap.data(), id: snap.id } as ConcreteCubeSample;
        if (!effectiveCompId || item.companyId === effectiveCompId) return item;
      }
    } catch (e) {
      console.warn("Firestore getCubeSample warning:", e);
    }
    return null;
  },

  async saveCubeSample(cube: ConcreteCubeSample): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(cube.companyId);
    const cleaned = cleanForFirestore({
      ...cube,
      companyId: effectiveCompId,
      updatedAt: Date.now(),
    });
    const cacheKey = scopedCacheKey(
      "cubes",
      cleaned.projectId,
      effectiveCompId,
    );
    await persistRecord("cubeSamples", "CUBE_TEST", cleaned, cacheKey);
  },

  async deleteCubeSample(
    id: string,
    projectId?: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    removeFromAllVaultCaches("jqms_cubes_", id);
    if (projectId && effectiveCompId) {
      const cacheKey = scopedCacheKey("cubes", projectId, effectiveCompId);
      const list = getCache<ConcreteCubeSample[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((c) => c.id !== id && c.sampleId !== id),
      );
    }
    await deleteDoc(doc(firestore, "cubeSamples", id));

    if (effectiveCompId) {
      try {
        const q = query(
          collection(firestore, "cubeSamples"),
          where("companyId", "==", effectiveCompId),
          where("sampleId", "==", id),
        );
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          await deleteDoc(d.ref).catch(() => {});
        }
      } catch (_) {}
    }
  },

  // --- Steel Rebar Tests ---
  async getSteelTests(
    projectId: string,
    companyId?: string,
  ): Promise<SteelRebarTest[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!projectId || !effectiveCompId) return [];
    const cacheKey = scopedCacheKey("steel", projectId, effectiveCompId);
    try {
      const q = query(
        collection(firestore, "steelTests"),
        where("projectId", "==", projectId),
        where("companyId", "==", effectiveCompId),
      );
      const snap = await getDocs(q);
      const rawList = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as SteelRebarTest,
      );
      const list = sortByNewestFirst(rawList);
      setCache(cacheKey, list);
      return list;
    } catch (e) {
      console.warn("Firestore getSteelTests warning, reading local cache:", e);
      return getCache<SteelRebarTest[]>(cacheKey, []);
    }
  },

  async saveSteelTest(test: SteelRebarTest): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(test.companyId);
    const cleaned = cleanForFirestore({ ...test, companyId: effectiveCompId });
    const cacheKey = scopedCacheKey(
      "steel",
      cleaned.projectId,
      effectiveCompId,
    );
    await persistRecord("steelTests", "STEEL_TEST", cleaned, cacheKey);
  },

  async deleteSteelTest(
    id: string,
    projectId?: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    removeFromAllVaultCaches("jqms_steel_", id);
    if (projectId && effectiveCompId) {
      const cacheKey = scopedCacheKey("steel", projectId, effectiveCompId);
      const list = getCache<SteelRebarTest[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((s) => s.id !== id),
      );
    }
    await deleteDoc(doc(firestore, "steelTests", id));
  },

  // --- Bar Cutting Schedules ---
  async getBarCuttingSchedules(
    projectId: string,
    companyId?: string,
  ): Promise<BarCuttingSchedule[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!projectId || !effectiveCompId) return [];
    const cacheKey = scopedCacheKey("bcs", projectId, effectiveCompId);
    try {
      const q = query(
        collection(firestore, "barCuttingSchedules"),
        where("projectId", "==", projectId),
        where("companyId", "==", effectiveCompId),
      );
      const snap = await getDocs(q);
      const rawList = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as BarCuttingSchedule,
      );
      const list = sortByNewestFirst(rawList);
      setCache(cacheKey, list);
      return list;
    } catch (e) {
      console.warn(
        "Firestore getBarCuttingSchedules warning, reading local cache:",
        e,
      );
      return getCache<BarCuttingSchedule[]>(cacheKey, []);
    }
  },

  async getBarCuttingSchedule(
    id: string,
    projectId?: string,
    companyId?: string,
  ): Promise<BarCuttingSchedule | null> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    try {
      const snap = await getDoc(doc(firestore, "barCuttingSchedules", id));
      if (snap.exists()) {
        const item = { ...snap.data(), id: snap.id } as BarCuttingSchedule;
        if (!effectiveCompId || item.companyId === effectiveCompId) return item;
      }
    } catch (e) {
      console.warn("Firestore getBarCuttingSchedule warning:", e);
    }
    return null;
  },

  async saveBarCuttingSchedule(schedule: BarCuttingSchedule): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(schedule.companyId);
    const cleaned = cleanForFirestore({
      ...schedule,
      companyId: effectiveCompId,
      updatedAt: new Date().toISOString(),
    });
    const cacheKey = scopedCacheKey("bcs", cleaned.projectId, effectiveCompId);
    await persistRecord(
      "barCuttingSchedules",
      "BAR_CUTTING",
      cleaned,
      cacheKey,
    );
  },

  async deleteBarCuttingSchedule(
    id: string,
    projectId: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    removeFromAllVaultCaches("jqms_bcs_", id);
    if (projectId && effectiveCompId) {
      const cacheKey = scopedCacheKey("bcs", projectId, effectiveCompId);
      const list = getCache<BarCuttingSchedule[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((b) => b.id !== id),
      );
    }
    await deleteDoc(doc(firestore, "barCuttingSchedules", id));
  },

  // --- Material Deliveries ---
  async getDeliveries(
    projectId: string,
    companyId?: string,
  ): Promise<MaterialDelivery[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!projectId || !effectiveCompId) return [];
    const cacheKey = scopedCacheKey("deliveries", projectId, effectiveCompId);
    try {
      const q = query(
        collection(firestore, "materialDeliveries"),
        where("projectId", "==", projectId),
        where("companyId", "==", effectiveCompId),
      );
      const snap = await getDocs(q);
      const rawList = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as MaterialDelivery,
      );
      const list = sortByNewestFirst(rawList);
      setCache(cacheKey, list);
      return list;
    } catch (e) {
      console.warn("Firestore getDeliveries warning, reading local cache:", e);
      return getCache<MaterialDelivery[]>(cacheKey, []);
    }
  },

  async saveDelivery(delivery: MaterialDelivery): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(delivery.companyId);
    const cleaned = cleanForFirestore({
      ...delivery,
      companyId: effectiveCompId,
    });
    const cacheKey = scopedCacheKey(
      "deliveries",
      cleaned.projectId,
      effectiveCompId,
    );
    await persistRecord(
      "materialDeliveries",
      "MATERIAL_DELIVERY",
      cleaned,
      cacheKey,
    );
  },

  async saveMaterialDelivery(delivery: MaterialDelivery): Promise<void> {
    return this.saveDelivery(delivery);
  },

  async deleteDelivery(
    id: string,
    projectId?: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    removeFromAllVaultCaches("jqms_deliveries_", id);
    if (projectId && effectiveCompId) {
      const cacheKey = scopedCacheKey("deliveries", projectId, effectiveCompId);
      const list = getCache<MaterialDelivery[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((d) => d.id !== id),
      );
    }
    await deleteDoc(doc(firestore, "materialDeliveries", id));
  },

  // --- Universal Site Photo Gallery ---
  async getPhotos(projectId: string, companyId?: string): Promise<SitePhoto[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!projectId || !effectiveCompId) return [];
    const cacheKey = scopedCacheKey("photos", projectId, effectiveCompId);
    try {
      const q = query(
        collection(firestore, "sitePhotos"),
        where("projectId", "==", projectId),
        where("companyId", "==", effectiveCompId),
      );
      const snap = await getDocs(q);
      const rawList = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as SitePhoto,
      );
      const list = sortByNewestFirst(rawList);
      setCache(cacheKey, list);
      return list;
    } catch (e) {
      console.warn("Firestore getPhotos warning, reading local cache:", e);
      return getCache<SitePhoto[]>(cacheKey, []);
    }
  },

  async getSitePhotos(
    projectId: string,
    companyId?: string,
  ): Promise<SitePhoto[]> {
    return this.getPhotos(projectId, companyId);
  },

  async savePhoto(photo: SitePhoto): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(photo.companyId);
    const cleaned = cleanForFirestore({ ...photo, companyId: effectiveCompId });
    const cacheKey = scopedCacheKey(
      "photos",
      cleaned.projectId,
      effectiveCompId,
    );
    await persistRecord("sitePhotos", "PHOTO_UPLOAD", cleaned, cacheKey);
  },

  async deletePhoto(
    id: string,
    projectId?: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    removeFromAllVaultCaches("jqms_photos_", id);
    if (projectId && effectiveCompId) {
      const cacheKey = scopedCacheKey("photos", projectId, effectiveCompId);
      const list = getCache<SitePhoto[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((p) => p.id !== id),
      );
    }
    await deleteDoc(doc(firestore, "sitePhotos", id));
    await deleteDoc(doc(firestore, "photos", id)).catch(() => {});
  },

  // --- 4D Planner Events ---
  async getPlannerEvents(
    projectId: string,
    companyId?: string,
  ): Promise<PlannerEvent[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!projectId || !effectiveCompId) return [];
    const cacheKey = scopedCacheKey("planner", projectId, effectiveCompId);
    try {
      const q = query(
        collection(firestore, "calendarEvents"),
        where("projectId", "==", projectId),
        where("companyId", "==", effectiveCompId),
      );
      const snap = await getDocs(q);
      const rawList = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as PlannerEvent,
      );
      const list = sortByNewestFirst(rawList);
      setCache(cacheKey, list);
      return list;
    } catch (e) {
      console.warn(
        "Firestore getPlannerEvents warning, reading local cache:",
        e,
      );
      return getCache<PlannerEvent[]>(cacheKey, []);
    }
  },

  async savePlannerEvent(event: PlannerEvent): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(event.companyId);
    const cleaned = cleanForFirestore({ ...event, companyId: effectiveCompId });
    const cacheKey = scopedCacheKey(
      "planner",
      cleaned.projectId,
      effectiveCompId,
    );
    await persistRecord("calendarEvents", "PLANNER_EVENT", cleaned, cacheKey);

    try {
      window.dispatchEvent(
        new CustomEvent("jqms-planner-updated", { detail: cleaned }),
      );
    } catch {}
  },

  async deletePlannerEvent(
    id: string,
    projectId?: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    removeFromAllVaultCaches("jqms_planner_", id);
    if (projectId && effectiveCompId) {
      const cacheKey = scopedCacheKey("planner", projectId, effectiveCompId);
      const list = getCache<PlannerEvent[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((p) => p.id !== id),
      );
    }
    await deleteDoc(doc(firestore, "calendarEvents", id));
    await deleteDoc(doc(firestore, "plannerEvents", id)).catch(() => {});
  },

  // --- Document Control ---
  async getDocuments(
    projectId: string,
    companyId?: string,
  ): Promise<DocumentRecord[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!projectId || !effectiveCompId) return [];
    const cacheKey = scopedCacheKey("documents", projectId, effectiveCompId);
    try {
      const q = query(
        collection(firestore, "documents"),
        where("projectId", "==", projectId),
        where("companyId", "==", effectiveCompId),
      );
      const snap = await getDocs(q);
      const rawList = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as DocumentRecord,
      );
      const list = sortByNewestFirst(rawList);
      setCache(cacheKey, list);
      return list;
    } catch (e) {
      console.warn("Firestore getDocuments warning, reading local cache:", e);
      return getCache<DocumentRecord[]>(cacheKey, []);
    }
  },

  async saveDocument(docRecord: DocumentRecord): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(docRecord.companyId);
    const cleaned = cleanForFirestore({
      ...docRecord,
      companyId: effectiveCompId,
    });
    const cacheKey = scopedCacheKey(
      "documents",
      cleaned.projectId,
      effectiveCompId,
    );
    await persistRecord("documents", "DOCUMENT", cleaned, cacheKey);
  },

  async deleteDocument(
    id: string,
    projectId?: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    removeFromAllVaultCaches("jqms_documents_", id);
    if (projectId && effectiveCompId) {
      const cacheKey = scopedCacheKey("documents", projectId, effectiveCompId);
      const list = getCache<DocumentRecord[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((d) => d.id !== id),
      );
    }
    await deleteDoc(doc(firestore, "documents", id));
  },

  // --- Immutable Enterprise Audit Logs ---
  async getAuditLogs(companyId: string, maxItems = 200): Promise<AuditLog[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!effectiveCompId) return [];
    const cacheKey = `jqms_audit_logs_${effectiveCompId}`;
    try {
      const q = query(
        collection(firestore, "auditLogs"),
        where("companyId", "==", effectiveCompId),
        orderBy("timestamp", "desc"),
        limit(maxItems),
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as AuditLog,
      );
      setCache(cacheKey, list);
      return list;
    } catch (e) {
      console.warn(
        "Firestore getAuditLogs warning, fallback without orderBy:",
        e,
      );
      try {
        const qFallback = query(
          collection(firestore, "auditLogs"),
          where("companyId", "==", effectiveCompId),
          limit(maxItems),
        );
        const snap = await getDocs(qFallback);
        const list = sortByNewestFirst(
          snap.docs.map((d) => ({ ...d.data(), id: d.id }) as AuditLog),
        );
        setCache(cacheKey, list);
        return list;
      } catch {
        return getCache<AuditLog[]>(cacheKey, []);
      }
    }
  },

  async saveAuditLog(log: AuditLog): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(log.companyId);
    if (!effectiveCompId) return;
    const cleaned = cleanForFirestore({
      ...log,
      companyId: effectiveCompId,
      timestamp: typeof log.timestamp === "number" ? log.timestamp : Date.now(),
    });
    const cacheKey = `jqms_audit_logs_${effectiveCompId}`;
    const list = getCache<AuditLog[]>(cacheKey, []);
    list.unshift(cleaned);
    setCache(cacheKey, list.slice(0, 300));

    try {
      await setDoc(doc(firestore, "auditLogs", cleaned.id), cleaned);
    } catch (e) {
      console.warn("Firestore saveAuditLog error:", e);
    }
  },

  // --- Default Engineering Master Trades ---
  async seedCompanyTrades(
    companyId: string,
    forceReset = false,
  ): Promise<MasterTrade[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!effectiveCompId) return [];

    try {
      if (!forceReset) {
        const q = query(
          collection(firestore, "trades"),
          where("companyId", "==", effectiveCompId),
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const existing = snap.docs.map(
            (d) => ({ ...d.data(), id: d.id }) as MasterTrade,
          );
          setCache(`jqms_trades_${effectiveCompId}`, existing);
          return existing;
        }
      }

      const now = Date.now();
      const seeded: MasterTrade[] = DEFAULT_TRADES.map((dt) => ({
        id: `tr-${dt.code.toLowerCase()}-${effectiveCompId}`,
        companyId: effectiveCompId,
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

      await commitInChunks(seeded, (batch, trade) => {
        batch.set(doc(firestore, "trades", trade.id), trade, { merge: true });
      });

      setCache(`jqms_trades_${effectiveCompId}`, seeded);
      return seeded;
    } catch (e) {
      console.warn("Firestore seedCompanyTrades fallback:", e);
      return [];
    }
  },

  async getTrades(companyId: string): Promise<MasterTrade[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!effectiveCompId) return [];
    const cacheKey = `jqms_trades_${effectiveCompId}`;
    try {
      const q = query(
        collection(firestore, "trades"),
        where("companyId", "==", effectiveCompId),
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        return await this.seedCompanyTrades(effectiveCompId);
      }
      const list = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as MasterTrade,
      );
      setCache(cacheKey, list);
      return list;
    } catch (e) {
      console.warn("Firestore getTrades warning, checking cache/seed:", e);
      const cached = getCache<MasterTrade[]>(cacheKey, []);
      if (cached.length > 0) return cached;
      return await this.seedCompanyTrades(effectiveCompId);
    }
  },

  async saveTrade(trade: MasterTrade): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(trade.companyId);
    const cleaned = cleanForFirestore({ ...trade, companyId: effectiveCompId });
    const cacheKey = `jqms_trades_${effectiveCompId}`;
    await persistRecord("trades", "TRADE", cleaned, cacheKey);
  },

  async deleteTrade(id: string, companyId: string): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (effectiveCompId) {
      const cacheKey = `jqms_trades_${effectiveCompId}`;
      const list = getCache<MasterTrade[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((t) => t.id !== id),
      );
    }
    await deleteDoc(doc(firestore, "trades", id));
  },

  // --- Seed Built-in Inspection Templates for a Company ---
  async seedCompanyInspectionTemplates(
    companyId: string,
    forceReset = false,
  ): Promise<InspectionTemplate[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!effectiveCompId) return [];

    try {
      if (!forceReset) {
        const q = query(
          collection(firestore, "inspectionTemplates"),
          where("companyId", "==", effectiveCompId),
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const existing = snap.docs.map(
            (d) => ({ ...d.data(), id: d.id }) as InspectionTemplate,
          );
          setCache(`jqms_inspection_templates_${effectiveCompId}`, existing);
          return existing;
        }
      }

      const now = Date.now();
      const templatesToCreate: InspectionTemplate[] = BUILTIN_TEMPLATES.map(
        (t, idx) => ({
          id: `tmpl-${effectiveCompId}-${idx + 1}`,
          companyId: effectiveCompId,
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
        }),
      );

      await commitInChunks(templatesToCreate, (batch, tmpl) => {
        batch.set(doc(firestore, "inspectionTemplates", tmpl.id), tmpl, {
          merge: true,
        });
      });

      setCache(
        `jqms_inspection_templates_${effectiveCompId}`,
        templatesToCreate,
      );
      return templatesToCreate;
    } catch (e) {
      console.warn(
        "Firestore seedCompanyInspectionTemplates error/fallback:",
        e,
      );
      return [];
    }
  },

  async getInspectionTemplates(
    companyId: string,
  ): Promise<InspectionTemplate[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!effectiveCompId) return [];
    const cacheKey = `jqms_inspection_templates_${effectiveCompId}`;
    try {
      const q = query(
        collection(firestore, "inspectionTemplates"),
        where("companyId", "==", effectiveCompId),
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        return await this.seedCompanyInspectionTemplates(effectiveCompId);
      }
      const list = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as InspectionTemplate,
      );
      setCache(cacheKey, list);
      return list;
    } catch (e) {
      console.warn(
        "Firestore getInspectionTemplates warning, checking cache/seed:",
        e,
      );
      const cached = getCache<InspectionTemplate[]>(cacheKey, []);
      if (cached.length > 0) return cached;
      return await this.seedCompanyInspectionTemplates(effectiveCompId);
    }
  },

  async saveInspectionTemplate(template: InspectionTemplate): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(template.companyId);
    const cleaned = cleanForFirestore({
      ...template,
      companyId: effectiveCompId,
    });
    const cacheKey = `jqms_inspection_templates_${effectiveCompId}`;
    await persistRecord(
      "inspectionTemplates",
      "INSPECTION_TEMPLATE",
      cleaned,
      cacheKey,
    );
  },

  async deleteInspectionTemplate(id: string, companyId: string): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (effectiveCompId) {
      const cacheKey = `jqms_inspection_templates_${effectiveCompId}`;
      const list = getCache<InspectionTemplate[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((t) => t.id !== id),
      );
    }
    await deleteDoc(doc(firestore, "inspectionTemplates", id));
  },

  // --- Users Directory ---
  async getUsers(companyId?: string): Promise<UserProfile[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!effectiveCompId) return [];
    const cacheKey = `jqms_users_${effectiveCompId}`;

    const isDemoUser = (u: any): boolean => {
      if (!u) return true;
      const demoUids = [
        "usr-superadmin",
        "usr-qdir",
        "usr-qm",
        "usr-pm",
        "usr-sqa",
        "usr-mat",
        "usr-insp-1",
        "usr-insp-2",
        "usr-consultant",
        "usr-contractor",
      ];
      if (demoUids.includes(u.uid) || demoUids.includes(u.id)) return true;

      // Case-insensitive email domain check for demo accounts
      if (typeof u.email === "string") {
        const lowerEmail = u.email.trim().toLowerCase();
        if (
          lowerEmail.endsWith("@apexinfra.com") ||
          lowerEmail.endsWith("@demo.com")
        ) {
          return true;
        }
      }
      return false;
    };

    try {
      const q = query(
        collection(firestore, "users"),
        where("companyId", "==", effectiveCompId),
      );
      const snap = await getDocs(q);
      const firestoreUsers = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            ...data,
            uid: data.uid || d.id,
            id: d.id,
          } as unknown as UserProfile;
        })
        .filter((u) => !isDemoUser(u));

      // Deduplicate by normalized email
      const emailMap = new Map<string, UserProfile>();
      const nonEmailUsers: UserProfile[] = [];

      for (const u of firestoreUsers) {
        const normEmail = (u.email || "").trim().toLowerCase();
        if (!normEmail) {
          nonEmailUsers.push(u);
          continue;
        }
        const existing = emailMap.get(normEmail);
        if (!existing) {
          emailMap.set(normEmail, u);
        } else {
          const isUAuth = u.uid && !u.uid.startsWith("usr-");
          const isExistingAuth =
            existing.uid && !existing.uid.startsWith("usr-");
          if (isUAuth && !isExistingAuth) {
            emailMap.set(normEmail, { ...existing, ...u });
          } else {
            emailMap.set(normEmail, { ...u, ...existing });
          }
        }
      }

      const consolidated = [...Array.from(emailMap.values()), ...nonEmailUsers];
      setCache(cacheKey, consolidated);
      return consolidated;
    } catch (e) {
      console.warn("Firestore getUsers warning, reading local cache:", e);
      return getCache<UserProfile[]>(cacheKey, []).filter(
        (u) => !isDemoUser(u),
      );
    }
  },

  async saveUser(user: UserProfile): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(user.companyId);
    if (!effectiveCompId) {
      throw new Error(
        "User must be associated with an active company workspace.",
      );
    }
    const cleaned = cleanForFirestore({
      ...user,
      companyId: effectiveCompId,
      updatedAt:
        typeof user.updatedAt === "number" ? user.updatedAt : Date.now(),
    });

    const cacheKey = `jqms_users_${effectiveCompId}`;
    const previous = getCache<UserProfile[]>(cacheKey, []);
    const next = [...previous];
    const idx = next.findIndex((u) => u.uid === cleaned.uid);
    if (idx >= 0) next[idx] = cleaned;
    else next.push(cleaned);
    setCache(cacheKey, next);

    try {
      await setDoc(doc(firestore, "users", cleaned.uid), cleaned, {
        merge: true,
      });

      // If manager created or updated an invited/subordinate account, synchronize userInvites/{emailLower}
      const normEmail = (cleaned.email || "").trim().toLowerCase();
      if (
        normEmail &&
        (cleaned.uid.startsWith("usr-") ||
          auth.currentUser?.uid !== cleaned.uid)
      ) {
        try {
          const inviteRef = doc(firestore, "userInvites", normEmail);
          const invitePayload = cleanForFirestore({
            email: normEmail,
            fullName: cleaned.fullName || "",
            role: cleaned.role,
            companyId: effectiveCompId,
            companyName: cleaned.companyName || "",
            title: cleaned.title || "",
            designation: cleaned.designation || "",
            department: cleaned.department || "",
            projectIds: cleaned.projectIds || [],
            projectAccess: cleaned.projectAccess || {},
            status: cleaned.status || "ACTIVE",
            isActive:
              cleaned.isActive !== false &&
              cleaned.status !== "SUSPENDED" &&
              cleaned.status !== "INACTIVE",
            legacyUserDocId: cleaned.uid.startsWith("usr-")
              ? cleaned.uid
              : undefined,
            updatedAt: Date.now(),
          });
          await setDoc(inviteRef, invitePayload, { merge: true });
        } catch (inviteErr) {
          // Non-manager self updates won't have permission to write userInvites, safe to ignore
          console.debug(
            "[dbService] Optional userInvites sync skipped:",
            inviteErr,
          );
        }
      }
    } catch (e: any) {
      setCache(cacheKey, previous);
      console.error("Firestore saveUser critical error:", e);
      throw new Error(
        e?.message ||
          "Cloud database write failed. Unable to persist user profile.",
      );
    }
  },

  async deleteUser(userId: string, companyId?: string): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (effectiveCompId) {
      const cacheKey = `jqms_users_${effectiveCompId}`;
      const list = getCache<UserProfile[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((u) => u.uid !== userId),
      );
    }
    await deleteDoc(doc(firestore, "users", userId));
  },

  async assignUserToProjects(
    userId: string,
    targetProjectIds: string[],
    companyId?: string,
  ): Promise<{ user: UserProfile; updatedProjects: Project[] }> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!effectiveCompId)
      throw new Error("Active company is required for project assignment.");

    const allUsers = await this.getUsers(effectiveCompId);
    const user = allUsers.find((u) => u.uid === userId);
    if (!user) throw new Error(`User with ID ${userId} not found`);

    const isGlobal = targetProjectIds.includes("*");
    const updatedProjectIds = isGlobal ? ["*"] : targetProjectIds;
    const updatedProjectAccess: Record<string, boolean> = {};
    if (isGlobal) {
      updatedProjectAccess["*"] = true;
    } else {
      targetProjectIds.forEach((pid) => {
        updatedProjectAccess[pid] = true;
      });
    }

    const updatedUser: UserProfile = {
      ...user,
      projectIds: updatedProjectIds,
      projectAccess: updatedProjectAccess,
      updatedAt: Date.now(),
    };

    await this.saveUser(updatedUser);

    const allProjects = await this.getProjects(effectiveCompId);
    const updatedProjects: Project[] = [];

    for (const proj of allProjects) {
      let staff = proj.assignedStaff || proj.assignedStaffIds || [];
      if (!Array.isArray(staff)) staff = [];

      const shouldBeAssigned = isGlobal || targetProjectIds.includes(proj.id);
      const currentlyAssigned = staff.includes(userId);

      if (shouldBeAssigned && !currentlyAssigned) {
        const nextStaff = [...staff, userId];
        const updatedProj: Project = {
          ...proj,
          assignedStaff: nextStaff,
          assignedStaffIds: nextStaff,
        };
        await this.saveProject(updatedProj);
        updatedProjects.push(updatedProj);
      } else if (!shouldBeAssigned && currentlyAssigned) {
        const nextStaff = staff.filter((uid) => uid !== userId);
        const updatedProj: Project = {
          ...proj,
          assignedStaff: nextStaff,
          assignedStaffIds: nextStaff,
        };
        await this.saveProject(updatedProj);
        updatedProjects.push(updatedProj);
      }
    }

    return { user: updatedUser, updatedProjects };
  },

  async assignStaffToProject(
    projectId: string,
    staffUids: string[],
    excludedStaffIds: string[] = [],
    companyId?: string,
  ): Promise<Project> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!effectiveCompId)
      throw new Error("Active company is required for project assignment.");

    const allProjects = await this.getProjects(effectiveCompId);
    const proj = allProjects.find((p) => p.id === projectId);
    if (!proj) throw new Error(`Project ${projectId} not found`);

    const updatedProj: Project = {
      ...proj,
      assignedStaff: staffUids,
      assignedStaffIds: staffUids,
      excludedStaffIds,
    };
    await this.saveProject(updatedProj);

    const allUsers = await this.getUsers(effectiveCompId);
    for (const u of allUsers) {
      if (u.role === "SUPER_ADMIN" || u.projectIds?.includes("*")) continue;
      const shouldHaveAccess = staffUids.includes(u.uid);
      const currentProjects = u.projectIds || [];
      const hasCurrent = currentProjects.includes(projectId);

      if (shouldHaveAccess && !hasCurrent) {
        const nextPids = [...currentProjects, projectId];
        await this.saveUser({
          ...u,
          projectIds: nextPids,
          projectAccess: { ...(u.projectAccess || {}), [projectId]: true },
        });
      } else if (!shouldHaveAccess && hasCurrent) {
        const nextPids = currentProjects.filter((id) => id !== projectId);
        const nextAccess = { ...(u.projectAccess || {}) };
        delete nextAccess[projectId];
        await this.saveUser({
          ...u,
          projectIds: nextPids,
          projectAccess: nextAccess,
        });
      }
    }

    return updatedProj;
  },

  // --- Weekly QA/QC Executive Reports ---
  async getWeeklyReports(
    projectId: string,
    companyId?: string,
  ): Promise<WeeklyReport[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!projectId || !effectiveCompId) return [];
    const cacheKey = scopedCacheKey(
      "weekly_reports",
      projectId,
      effectiveCompId,
    );

    try {
      const q = query(
        collection(firestore, "weeklyReports"),
        where("projectId", "==", projectId),
        where("companyId", "==", effectiveCompId),
      );
      const snap = await getDocs(q);
      const rawList = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as WeeklyReport,
      );
      const list = sortByNewestFirst(rawList);
      setCache(cacheKey, list);
      return list;
    } catch (e) {
      console.warn(
        "Firestore getWeeklyReports warning, reading local cache:",
        e,
      );
      return getCache<WeeklyReport[]>(cacheKey, []);
    }
  },

  async getWeeklyReport(
    id: string,
    projectId?: string,
    companyId?: string,
  ): Promise<WeeklyReport | null> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (inMemoryWeeklyReports.has(id)) {
      const rep = inMemoryWeeklyReports.get(id)!;
      if (!effectiveCompId || rep.companyId === effectiveCompId) return rep;
    }

    try {
      const snap = await getDoc(doc(firestore, "weeklyReports", id));
      if (snap.exists()) {
        let report = { ...snap.data(), id: snap.id } as WeeklyReport;
        if ((report as any).hasOverflow) {
          try {
            const overflowSnap = await getDoc(
              doc(firestore, "weeklyReports", id, "overflow", "details"),
            );
            if (overflowSnap.exists()) {
              const overflowData = overflowSnap.data();
              report = {
                ...report,
                ...overflowData,
              };
            }
          } catch (overflowErr) {
            console.warn(
              "Failed reading weekly report overflow subcollection:",
              overflowErr,
            );
          }
        }
        if (!effectiveCompId || report.companyId === effectiveCompId) {
          inMemoryWeeklyReports.set(report.id, report);
          return report;
        }
      }
    } catch (e) {
      console.warn("Firestore getWeeklyReport warning:", e);
    }
    return null;
  },

  async deleteWeeklyReport(
    id: string,
    projectId?: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    inMemoryWeeklyReports.delete(id);
    removeFromAllVaultCaches("jqms_weekly_reports_", id);

    if (projectId && effectiveCompId) {
      const cacheKey = scopedCacheKey(
        "weekly_reports",
        projectId,
        effectiveCompId,
      );
      const list = getCache<WeeklyReport[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((w) => w.id !== id),
      );
    }
    try {
      await deleteDoc(
        doc(firestore, "weeklyReports", id, "overflow", "details"),
      );
    } catch (_) {}
    await deleteDoc(doc(firestore, "weeklyReports", id));
  },

  async saveWeeklyReport(report: WeeklyReport): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(report.companyId);
    if (!effectiveCompId) {
      throw new Error(
        "Weekly report must be associated with an active company workspace.",
      );
    }
    // 1. Maintain in-memory and full local IDB copy with zero loss of original data
    inMemoryWeeklyReports.set(report.id, report);
    setCache(`jqms_weekly_report_full_${report.id}`, report);

    const calcBytes = (obj: any): number => {
      try {
        return new Blob([JSON.stringify(obj)]).size;
      } catch {
        return JSON.stringify(obj).length;
      }
    };

    const sanitizeSafeUrl = (url: any): string => {
      if (!url || typeof url !== "string") return "";
      const trimmed = url.trim();
      if (trimmed.startsWith("data:") && trimmed.length > 4096) return "";
      return trimmed;
    };

    // Helper to sanitize photo arrays by stripping heavy base64 strings
    const sanitizePhotoArray = (photos: any): string[] => {
      if (!Array.isArray(photos)) return [];
      return photos
        .map((p) => {
          if (typeof p === "string") {
            if (p.startsWith("data:") && p.length > 2048) {
              return "field_photo_recorded";
            }
            return p;
          }
          if (p && typeof p === "object" && typeof p.url === "string") {
            if (p.url.startsWith("data:") && p.url.length > 2048) {
              return "field_photo_recorded";
            }
            return p.url;
          }
          return "";
        })
        .filter(Boolean);
    };

    // Sanitize site comments
    const sanitizeSiteComments = (comments: any[]): any[] => {
      if (!Array.isArray(comments)) return [];
      return comments.map((c) => {
        const cleanedPhotos = sanitizePhotoArray(c.photos || c.images);
        const { images, ...rest } = c;
        return {
          ...rest,
          photos: cleanedPhotos,
        };
      });
    };

    // Sanitize NCRs
    const sanitizeNcrLog = (ncrs: any[]): any[] => {
      if (!Array.isArray(ncrs)) return [];
      return ncrs.map((n) => ({
        ...n,
        photos: sanitizePhotoArray(n.photos),
        beforePhotos: sanitizePhotoArray(n.beforePhotos),
        afterPhotos: sanitizePhotoArray(n.afterPhotos),
        evidencePhotos: sanitizePhotoArray(n.evidencePhotos),
      }));
    };

    const cleaned = cleanForFirestore({
      ...report,
      companyId: effectiveCompId,
      updatedAt: new Date().toISOString(),
    });

    let payload: any = {
      ...cleaned,
      coverImageUrl: sanitizeSafeUrl((cleaned as any).coverImageUrl),
      logoUrl: sanitizeSafeUrl((cleaned as any).logoUrl),
      projectImage: sanitizeSafeUrl((cleaned as any).projectImage),
      beamLayoutImg: sanitizeSafeUrl((cleaned as any).beamLayoutImg),
      columnLayoutImg: sanitizeSafeUrl((cleaned as any).columnLayoutImg),
      slabImg: sanitizeSafeUrl((cleaned as any).slabImg),
      coverImageBase64: "",
      logoBase64: "",
      siteComments: sanitizeSiteComments((cleaned as any).siteComments),
      ncrRemediationLog: sanitizeNcrLog((cleaned as any).ncrRemediationLog),
    };

    // Remove redundant arrays that duplicate the primary collections
    delete payload.filteredNcrs;
    delete payload.filteredInspections;
    delete payload.filteredFindings;
    delete payload.filteredMaterialDeliveries;
    delete payload.filteredCubeTests;
    delete payload.filteredSiteComments;
    delete payload.filteredSiteInstructions;
    delete payload.filteredStructuralElements;

    let payloadSize = calcBytes(payload);

    // If still large (> 850 KB), offload verbose details to subcollection doc
    if (payloadSize > 850_000) {
      console.info(
        `[WeeklyReport] Auto-optimizing large report payload (${Math.round(payloadSize / 1024)} KB) for Firestore...`,
      );
      try {
        const overflowDoc: any = {
          siteComments: payload.siteComments,
          structuralElements: payload.structuralElements,
          materialDeliveries: payload.materialDeliveries,
          cubeTests: payload.cubeTests,
          siteInstructions: payload.siteInstructions,
          updatedAt: new Date().toISOString(),
        };

        await setDoc(
          doc(firestore, "weeklyReports", report.id, "overflow", "details"),
          cleanForFirestore(overflowDoc),
          { merge: true },
        );

        payload.hasOverflow = true;
        // Keep top records in parent document so listing and metrics remain instantaneous
        if (Array.isArray(payload.siteComments))
          payload.siteComments = payload.siteComments.slice(0, 30);
        if (Array.isArray(payload.structuralElements))
          payload.structuralElements = payload.structuralElements.slice(0, 30);
        if (Array.isArray(payload.materialDeliveries))
          payload.materialDeliveries = payload.materialDeliveries.slice(0, 30);
        if (Array.isArray(payload.cubeTests))
          payload.cubeTests = payload.cubeTests.slice(0, 30);
        if (Array.isArray(payload.siteInstructions))
          payload.siteInstructions = payload.siteInstructions.slice(0, 30);
      } catch (subErr) {
        console.warn(
          "Failed saving overflow subcollection, applying inline prune:",
          subErr,
        );
        // Fallback: prune non-essential verbose fields
        if (Array.isArray(payload.siteComments)) {
          payload.siteComments = payload.siteComments.map((c: any) => ({
            id: c.id,
            reportNumber: c.reportNumber,
            date: c.date,
            inspector: c.inspector,
            location: c.location,
            element: c.element,
            trade: c.trade,
            status: c.status,
            comments:
              typeof c.comments === "string" ? c.comments.slice(0, 200) : "",
          }));
        }
        if (Array.isArray(payload.structuralElements)) {
          payload.structuralElements = payload.structuralElements.slice(0, 50);
        }
      }
    }

    const cacheKey = scopedCacheKey(
      "weekly_reports",
      report.projectId,
      effectiveCompId,
    );
    await persistRecord("weeklyReports", "WEEKLY_REPORT", payload, cacheKey);
  },

  // --- Inspection & Test Plans (ITP Matrix) ---
  async getITPPlans(projectId: string, companyId?: string): Promise<ITPPlan[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!projectId || !effectiveCompId) return [];
    const cacheKey = scopedCacheKey("itp_plans", projectId, effectiveCompId);
    try {
      const q = query(
        collection(firestore, "itpPlans"),
        where("projectId", "==", projectId),
        where("companyId", "==", effectiveCompId),
      );
      const snap = await getDocs(q);
      const rawList = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as ITPPlan,
      );
      const sorted = sortByNewestFirst(rawList);
      setCache(cacheKey, sorted);
      return sorted;
    } catch (e) {
      console.warn("Firestore getITPPlans warning, reading local cache:", e);
      return getCache<ITPPlan[]>(cacheKey, []);
    }
  },

  async getITPPlanById(
    id: string,
    companyId?: string,
  ): Promise<ITPPlan | null> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    try {
      const snap = await getDoc(doc(firestore, "itpPlans", id));
      if (snap.exists()) {
        const item = { ...snap.data(), id: snap.id } as ITPPlan;
        if (!effectiveCompId || item.companyId === effectiveCompId) return item;
      }
    } catch (e) {
      console.warn("Firestore getITPPlanById warning:", e);
    }
    return null;
  },

  async saveITPPlan(plan: ITPPlan): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(plan.companyId);
    const cleaned = cleanForFirestore({ ...plan, companyId: effectiveCompId });
    const cacheKey = scopedCacheKey(
      "itp_plans",
      cleaned.projectId,
      effectiveCompId,
    );
    await persistRecord("itpPlans", "ITP_PLAN", cleaned, cacheKey);
  },

  async deleteITPPlan(
    id: string,
    projectId: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    removeFromAllVaultCaches("jqms_itp_plans_", id);
    if (projectId && effectiveCompId) {
      const cacheKey = scopedCacheKey("itp_plans", projectId, effectiveCompId);
      const list = getCache<ITPPlan[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((p) => p.id !== id),
      );
    }
    await deleteDoc(doc(firestore, "itpPlans", id));
  },

  // ─── TEAM CHAT & GROUP MESSAGING SYSTEM ───
  async getChatChannels(
    companyId?: string,
    projectId?: string,
    userId?: string,
  ): Promise<ChatChannel[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!effectiveCompId) return [];
    const currentUid = userId || auth.currentUser?.uid || "";
    const cacheKey = `jqms_chat_channels_${effectiveCompId}`;

    try {
      // Dual query pattern strictly conforming to Firestore security rules
      const publicQ = query(
        collection(firestore, "chatChannels"),
        where("companyId", "==", effectiveCompId),
        where("isPrivate", "==", false),
      );

      const queries = [getDocs(publicQ)];
      if (currentUid) {
        const memberQ = query(
          collection(firestore, "chatChannels"),
          where("companyId", "==", effectiveCompId),
          where("memberIds", "array-contains", currentUid),
        );
        queries.push(getDocs(memberQ));
      }

      const results = await Promise.all(queries);
      const channelMap = new Map<string, ChatChannel>();

      for (const snap of results) {
        for (const d of snap.docs) {
          channelMap.set(d.id, { ...d.data(), id: d.id } as ChatChannel);
        }
      }

      const allChannels = Array.from(channelMap.values());
      const filtered = projectId
        ? allChannels.filter((c) => !c.projectId || c.projectId === projectId)
        : allChannels;

      const sorted = sortByNewestFirst(filtered);
      setCache(cacheKey, sorted);
      return sorted;
    } catch (e) {
      console.warn(
        "Firestore getChatChannels warning, falling back to cache:",
        e,
      );
      return getCache<ChatChannel[]>(cacheKey, []);
    }
  },

  async getChatChannelById(
    id: string,
    companyId?: string,
  ): Promise<ChatChannel | null> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    try {
      const snap = await getDoc(doc(firestore, "chatChannels", id));
      if (snap.exists()) {
        const channel = { ...snap.data(), id: snap.id } as ChatChannel;
        if (!effectiveCompId || channel.companyId === effectiveCompId)
          return channel;
      }
    } catch (e) {
      console.warn("Firestore getChatChannelById error:", e);
    }
    return null;
  },

  async saveChatChannel(channel: ChatChannel): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(channel.companyId);
    if (!effectiveCompId)
      throw new Error("Chat channel must belong to an active company.");

    const isPriv = Boolean(
      channel.isPrivate ||
      channel.type === "DIRECT" ||
      (channel.type as string) === "PRIVATE",
    );

    // Strip any oversized data: URLs from members array
    const safeMembers = (channel.members || []).map((m) => ({
      ...m,
      avatarUrl:
        m.avatarUrl && m.avatarUrl.startsWith("data:")
          ? undefined
          : m.avatarUrl,
    }));

    const cleaned = cleanForFirestore({
      ...channel,
      companyId: effectiveCompId,
      isPrivate: isPriv,
      members: safeMembers,
      updatedAt: Date.now(),
    });

    const cacheKey = `jqms_chat_channels_${effectiveCompId}`;
    const list = getCache<ChatChannel[]>(cacheKey, []);
    const idx = list.findIndex((c) => c.id === channel.id);
    if (idx >= 0) list[idx] = cleaned;
    else list.unshift(cleaned);
    setCache(cacheKey, list);

    try {
      await setDoc(doc(firestore, "chatChannels", channel.id), cleaned, {
        merge: true,
      });
      window.dispatchEvent(
        new CustomEvent("jqms-chat-channels-updated", { detail: cleaned }),
      );
    } catch (e) {
      console.warn("Firestore saveChatChannel error:", e);
      throw e;
    }
  },

  async deleteChatChannel(
    channelId: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    removeFromAllVaultCaches("jqms_chat_channels_", channelId);
    removeFromAllVaultCaches("jqms_chat_messages_", channelId);

    // Batch-delete child messages in chunks of 450
    try {
      const msgsSnap = await getDocs(
        collection(firestore, "chatChannels", channelId, "messages"),
      );
      await commitInChunks(msgsSnap.docs, (batch, d) => {
        batch.delete(d.ref);
      });
      await deleteDoc(doc(firestore, "chatChannels", channelId));
      window.dispatchEvent(new CustomEvent("jqms-chat-channels-updated"));
    } catch (e) {
      console.error("Firestore deleteChatChannel error:", e);
      throw e;
    }
  },

  async getChatMessages(
    channelId: string,
    maxMessages = 100,
  ): Promise<ChatMessage[]> {
    const cacheKey = `jqms_chat_messages_${channelId}`;
    try {
      const q = query(
        collection(firestore, "chatChannels", channelId, "messages"),
        orderBy("timestamp", "desc"),
        limit(maxMessages),
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as ChatMessage,
      );
      list.sort((a, b) => a.timestamp - b.timestamp);
      setCache(cacheKey, list);
      return list;
    } catch (e) {
      console.warn(
        "Firestore getChatMessages warning, reading local cache:",
        e,
      );
      const cached = getCache<ChatMessage[]>(cacheKey, []);
      cached.sort((a, b) => a.timestamp - b.timestamp);
      return cached;
    }
  },

  async loadOlderChatMessages(
    channelId: string,
    beforeTimestamp: number,
    pageSize = 50,
  ): Promise<ChatMessage[]> {
    try {
      const q = query(
        collection(firestore, "chatChannels", channelId, "messages"),
        where("timestamp", "<", beforeTimestamp),
        orderBy("timestamp", "desc"),
        limit(pageSize),
      );
      const snap = await getDocs(q);
      const older = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as ChatMessage,
      );
      older.sort((a, b) => a.timestamp - b.timestamp);

      const cacheKey = `jqms_chat_messages_${channelId}`;
      const existing = getCache<ChatMessage[]>(cacheKey, []);
      const mergedMap = new Map<string, ChatMessage>();
      older.forEach((m) => mergedMap.set(m.id, m));
      existing.forEach((m) => mergedMap.set(m.id, m));
      const mergedList = Array.from(mergedMap.values()).sort(
        (a, b) => a.timestamp - b.timestamp,
      );
      setCache(cacheKey, mergedList);
      return older;
    } catch (e) {
      console.warn("Firestore loadOlderChatMessages warning:", e);
      return [];
    }
  },

  async saveChatMessage(message: ChatMessage): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(message.companyId);
    const cleaned = cleanForFirestore({
      ...message,
      companyId: effectiveCompId || message.companyId || "",
    });

    const cacheKey = `jqms_chat_messages_${message.channelId}`;
    const list = getCache<ChatMessage[]>(cacheKey, []);
    const idx = list.findIndex((m) => m.id === message.id);
    if (idx >= 0) list[idx] = cleaned;
    else list.push(cleaned);
    list.sort((a, b) => a.timestamp - b.timestamp);
    setCache(cacheKey, list);

    const channelRef = doc(firestore, "chatChannels", message.channelId);
    const lastMsgData = {
      text:
        message.content ||
        (message.attachments && message.attachments.length > 0
          ? "📎 Attachment"
          : ""),
      senderId: message.senderId,
      senderName: message.senderName,
      timestamp: message.timestamp,
      hasAttachment: Boolean(
        message.attachments && message.attachments.length > 0,
      ),
    };

    try {
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
      throw e;
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
      throw e;
    }
  },

  async toggleMessageReaction(
    channelId: string,
    messageId: string,
    emoji: string,
    userId: string,
  ): Promise<void> {
    const msgRef = doc(
      firestore,
      "chatChannels",
      channelId,
      "messages",
      messageId,
    );
    try {
      await runTransaction(firestore, async (transaction) => {
        const snap = await transaction.get(msgRef);
        if (!snap.exists()) return;
        const msg = snap.data() as ChatMessage;
        const reactions = { ...(msg.reactions || {}) };
        const currentUsers = reactions[emoji] || [];

        if (currentUsers.includes(userId)) {
          reactions[emoji] = currentUsers.filter((u) => u !== userId);
          if (reactions[emoji].length === 0) delete reactions[emoji];
        } else {
          reactions[emoji] = [...currentUsers, userId];
        }

        transaction.set(
          msgRef,
          { reactions, updatedAt: Date.now() },
          { merge: true },
        );
      });

      window.dispatchEvent(
        new CustomEvent("jqms-chat-reaction-updated", {
          detail: { channelId, messageId },
        }),
      );
    } catch (e) {
      console.warn("Firestore toggleMessageReaction error:", e);
    }
  },

  async toggleMessagePin(channelId: string, messageId: string): Promise<void> {
    const msgRef = doc(
      firestore,
      "chatChannels",
      channelId,
      "messages",
      messageId,
    );
    try {
      await runTransaction(firestore, async (transaction) => {
        const snap = await transaction.get(msgRef);
        if (!snap.exists()) return;
        const isPinned = Boolean(snap.data()?.pinned);
        transaction.set(
          msgRef,
          { pinned: !isPinned, updatedAt: Date.now() },
          { merge: true },
        );
      });
    } catch (e) {
      console.warn("Firestore toggleMessagePin error:", e);
    }
  },

  async markMessagesAsRead(channelId: string, userId: string): Promise<void> {
    if (!channelId || !userId) return;
    const cacheKey = `jqms_chat_messages_${channelId}`;
    const list = getCache<ChatMessage[]>(cacheKey, []);
    const unreadIds: string[] = [];

    list.forEach((msg) => {
      if (
        msg.senderId !== userId &&
        (!msg.readBy || !msg.readBy.includes(userId))
      ) {
        msg.readBy = [...(msg.readBy || []), userId];
        msg.status = "read";
        unreadIds.push(msg.id);
      }
    });

    if (unreadIds.length > 0) {
      setCache(cacheKey, list);
      window.dispatchEvent(
        new CustomEvent("jqms-chat-messages-read", {
          detail: { channelId, userId },
        }),
      );

      // Persist arrayUnion asynchronously in batch chunks
      commitInChunks(unreadIds, (batch, mid) => {
        batch.set(
          doc(firestore, "chatChannels", channelId, "messages", mid),
          { readBy: arrayUnion(userId), status: "read", updatedAt: Date.now() },
          { merge: true },
        );
      }).catch(() => {});
    }
  },

  getCachedChannels(companyId?: string, projectId?: string): ChatChannel[] {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    const cacheKey = `jqms_chat_channels_${effectiveCompId || "default"}`;
    const cached = getCache<ChatChannel[]>(cacheKey, []);
    return projectId
      ? cached.filter((c) => !c.projectId || c.projectId === projectId)
      : cached;
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
      return list.filter((m) => {
        if (m.senderId === userId) return false;
        if (m.readBy && m.readBy.includes(userId)) return false;
        if (lastReadAt && m.timestamp <= lastReadAt) return false;
        return true;
      }).length;
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
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    const channels =
      channelsList && channelsList.length > 0
        ? channelsList
        : this.getCachedChannels(effectiveCompId);

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
    maxMessages = 100,
  ): () => void {
    const cacheKey = `jqms_chat_messages_${channelId}`;
    const cached = getCache<ChatMessage[]>(cacheKey, []);
    if (cached.length > 0) callback(cached);

    try {
      const q = query(
        collection(firestore, "chatChannels", channelId, "messages"),
        orderBy("timestamp", "desc"),
        limit(maxMessages),
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
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!effectiveCompId) {
      callback([]);
      return () => {};
    }

    const currentUid = auth.currentUser?.uid || "";
    const cacheKey = `jqms_chat_channels_${effectiveCompId}`;
    const cached = getCache<ChatChannel[]>(cacheKey, []);
    if (cached.length > 0) {
      const filtered = projectId
        ? cached.filter((c) => !c.projectId || c.projectId === projectId)
        : cached;
      callback(sortByNewestFirst(filtered));
    }

    const publicMap = new Map<string, ChatChannel>();
    const memberMap = new Map<string, ChatChannel>();

    const emitMerged = () => {
      const merged = new Map<string, ChatChannel>();
      publicMap.forEach((c, id) => merged.set(id, c));
      memberMap.forEach((c, id) => merged.set(id, c));
      const all = Array.from(merged.values());
      const filtered = projectId
        ? all.filter((c) => !c.projectId || c.projectId === projectId)
        : all;
      const sorted = sortByNewestFirst(filtered);
      setCache(cacheKey, sorted);
      callback(sorted);
    };

    try {
      const publicQ = query(
        collection(firestore, "chatChannels"),
        where("companyId", "==", effectiveCompId),
        where("isPrivate", "==", false),
      );

      const unsubPublic = onSnapshot(
        publicQ,
        (snap) => {
          publicMap.clear();
          snap.docs.forEach((d) =>
            publicMap.set(d.id, { ...d.data(), id: d.id } as ChatChannel),
          );
          emitMerged();
        },
        (err) => console.warn("listenToChatChannels (public) warning:", err),
      );

      let unsubMember = () => {};
      if (currentUid) {
        const memberQ = query(
          collection(firestore, "chatChannels"),
          where("companyId", "==", effectiveCompId),
          where("memberIds", "array-contains", currentUid),
        );
        unsubMember = onSnapshot(
          memberQ,
          (snap) => {
            memberMap.clear();
            snap.docs.forEach((d) =>
              memberMap.set(d.id, { ...d.data(), id: d.id } as ChatChannel),
            );
            emitMerged();
          },
          (err) => console.warn("listenToChatChannels (member) warning:", err),
        );
      }

      return () => {
        unsubPublic();
        unsubMember();
      };
    } catch (e) {
      console.warn("listenToChatChannels setup error:", e);
      return () => {};
    }
  },

  async ensureDefaultChannels(
    companyId: string,
    projectId?: string,
    projectName?: string,
    currentUser?: any,
  ): Promise<ChatChannel[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!effectiveCompId) return [];
    const existing = await this.getChatChannels(effectiveCompId, projectId);
    if (existing.length > 0) return existing;

    const creatorId = currentUser?.uid || "system";
    const creatorName = currentUser?.fullName || "System Admin";
    const now = Date.now();

    const userList = await this.getUsers(effectiveCompId).catch(() => []);
    const initialMembers: ChatMember[] = userList.map((u) => ({
      uid: u.uid,
      name: u.fullName || u.email || "Member",
      role: u.role,
      email: u.email,
      isAdmin:
        u.uid === creatorId ||
        [
          "SUPER_ADMIN",
          "QUALITY_DIRECTOR",
          "PROJECT_MANAGER",
          "QUALITY_MANAGER",
          "QAQC_MANAGER",
        ].includes(u.role),
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
        id: `chan-general-${effectiveCompId}`,
        companyId: effectiveCompId,
        name: "General Announcements",
        description:
          "Company-wide general channel for quality notifications, announcements & updates.",
        type: "GROUP",
        isPrivate: false,
        color: "bg-emerald-600",
        createdBy: creatorId,
        createdByName: creatorName,
        createdAt: now,
        updatedAt: now,
        memberIds,
        members: initialMembers,
        isDefaultProjectGroup: false,
        permissions: { onlyAdminsCanEditGroupInfo: true },
        lastMessage: {
          text: "Welcome to JayQMS Connect! Collaborate with your team in real time.",
          senderId: creatorId,
          senderName: creatorName,
          timestamp: now,
        },
      },
      {
        id: `chan-qaqc-team-${effectiveCompId}`,
        companyId: effectiveCompId,
        name: "QA/QC Field Operations",
        description:
          "Coordination for site inspections, test verifications, ITP checkpoints & NCR follow-ups.",
        type: "QAQC_ALERTS",
        isPrivate: false,
        color: "bg-sky-600",
        createdBy: creatorId,
        createdByName: creatorName,
        createdAt: now,
        updatedAt: now,
        memberIds,
        members: initialMembers,
        permissions: { onlyAdminsCanEditGroupInfo: true },
        lastMessage: {
          text: "Channel created for live QA/QC snagging and field inspection tracking.",
          senderId: creatorId,
          senderName: creatorName,
          timestamp: now,
        },
      },
    ];

    if (projectId) {
      defaultChannels.unshift({
        id: `chan-proj-${projectId}`,
        companyId: effectiveCompId,
        projectId,
        projectName: projectName || "Active Project",
        name: `${projectName || "Project"} Team`,
        description: `Official default quality and field communication group for ${projectName || "this project"}.`,
        type: "PROJECT_GENERAL",
        isPrivate: false,
        color: "bg-indigo-600",
        createdBy: creatorId,
        createdByName: creatorName,
        createdAt: now,
        updatedAt: now,
        memberIds,
        members: initialMembers,
        isDefaultProjectGroup: true,
        permissions: { onlyAdminsCanEditGroupInfo: true },
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
    const chanRef = doc(firestore, "chatChannels", channelId);
    await runTransaction(firestore, async (transaction) => {
      const snap = await transaction.get(chanRef);
      if (!snap.exists()) return;
      const chan = snap.data() as ChatChannel;
      const updatedMembers = (chan.members || []).map((m) =>
        m.uid === memberUid ? { ...m, isAdmin } : m,
      );
      transaction.set(
        chanRef,
        { members: updatedMembers, updatedAt: Date.now() },
        { merge: true },
      );
    });
  },

  async removeMemberFromChannel(
    channelId: string,
    memberUid: string,
  ): Promise<void> {
    const chanRef = doc(firestore, "chatChannels", channelId);
    await runTransaction(firestore, async (transaction) => {
      const snap = await transaction.get(chanRef);
      if (!snap.exists()) return;
      const chan = snap.data() as ChatChannel;
      const updatedMemberIds = chan.memberIds.filter((id) => id !== memberUid);
      const updatedMembers = (chan.members || []).filter(
        (m) => m.uid !== memberUid,
      );
      transaction.set(
        chanRef,
        {
          memberIds: updatedMemberIds,
          members: updatedMembers,
          updatedAt: Date.now(),
        },
        { merge: true },
      );
    });
  },

  async updateChannelSettings(
    channelId: string,
    updates: Partial<ChatChannel>,
  ): Promise<void> {
    const cleaned = cleanForFirestore({ ...updates, updatedAt: Date.now() });
    await setDoc(doc(firestore, "chatChannels", channelId), cleaned, {
      merge: true,
    });
  },

  // ─── Room-by-Room Punch List & Snag Register ───
  async getRoomPunchItems(
    projectId: string,
    companyId?: string,
  ): Promise<RoomPunchItem[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!projectId || !effectiveCompId) return [];
    const cacheKey = scopedCacheKey("room_punch", projectId, effectiveCompId);
    try {
      const q = query(
        collection(firestore, "roomPunchItems"),
        where("projectId", "==", projectId),
        where("companyId", "==", effectiveCompId),
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as RoomPunchItem,
      );
      const sorted = sortByNewestFirst(list);
      setCache(cacheKey, sorted);
      return sorted;
    } catch (e) {
      console.warn("Firestore getRoomPunchItems warning, reading cache:", e);
      return getCache<RoomPunchItem[]>(cacheKey, []);
    }
  },

  async saveRoomPunchItem(item: RoomPunchItem): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(item.companyId);
    const cleaned = cleanForFirestore({ ...item, companyId: effectiveCompId });
    const cacheKey = scopedCacheKey(
      "room_punch",
      cleaned.projectId,
      effectiveCompId,
    );
    await persistRecord("roomPunchItems", "PUNCH_ITEM", cleaned, cacheKey);
  },

  async deleteRoomPunchItem(
    id: string,
    projectId: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (projectId && effectiveCompId) {
      const cacheKey = scopedCacheKey("room_punch", projectId, effectiveCompId);
      const list = getCache<RoomPunchItem[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((p) => p.id !== id),
      );
    }
    await deleteDoc(doc(firestore, "roomPunchItems", id));
  },

  // ─── Taking Over Certificates (TOC) & Handover Dossiers ───
  async getTakingOverCertificates(
    projectId: string,
    companyId?: string,
  ): Promise<TakingOverCertificate[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!projectId || !effectiveCompId) return [];
    const cacheKey = scopedCacheKey("tocs", projectId, effectiveCompId);
    try {
      const q = query(
        collection(firestore, "takingOverCertificates"),
        where("projectId", "==", projectId),
        where("companyId", "==", effectiveCompId),
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as TakingOverCertificate,
      );
      const sorted = sortByNewestFirst(list);
      setCache(cacheKey, sorted);
      return sorted;
    } catch (e) {
      console.warn(
        "Firestore getTakingOverCertificates warning, reading cache:",
        e,
      );
      return getCache<TakingOverCertificate[]>(cacheKey, []);
    }
  },

  async saveTakingOverCertificate(cert: TakingOverCertificate): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(cert.companyId);
    const cleaned = cleanForFirestore({ ...cert, companyId: effectiveCompId });
    const cacheKey = scopedCacheKey("tocs", cleaned.projectId, effectiveCompId);
    await persistRecord("takingOverCertificates", "TOC", cleaned, cacheKey);
  },

  async saveTakingOverCert(cert: TakingOverCertificate): Promise<void> {
    return this.saveTakingOverCertificate(cert);
  },

  async deleteTakingOverCertificate(
    id: string,
    projectId?: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (projectId && effectiveCompId) {
      const cacheKey = scopedCacheKey("tocs", projectId, effectiveCompId);
      const list = getCache<TakingOverCertificate[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((c) => c.id !== id),
      );
    }
    await deleteDoc(doc(firestore, "takingOverCertificates", id));
  },

  // ─── Method Statements & RAMS Review Workflow ───
  async getMethodStatements(
    projectId: string,
    companyId?: string,
  ): Promise<MethodStatement[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!projectId || !effectiveCompId) return [];
    const cacheKey = scopedCacheKey(
      "method_statements",
      projectId,
      effectiveCompId,
    );
    try {
      const q = query(
        collection(firestore, "methodStatements"),
        where("projectId", "==", projectId),
        where("companyId", "==", effectiveCompId),
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as MethodStatement,
      );
      const sorted = sortByNewestFirst(list);
      setCache(cacheKey, sorted);
      return sorted;
    } catch (e) {
      console.warn("Firestore getMethodStatements warning, reading cache:", e);
      return getCache<MethodStatement[]>(cacheKey, []);
    }
  },

  async saveMethodStatement(ms: MethodStatement): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(ms.companyId);
    const cleaned = cleanForFirestore({ ...ms, companyId: effectiveCompId });
    const cacheKey = scopedCacheKey(
      "method_statements",
      cleaned.projectId,
      effectiveCompId,
    );
    await persistRecord(
      "methodStatements",
      "METHOD_STATEMENT",
      cleaned,
      cacheKey,
    );
  },

  async deleteMethodStatement(
    id: string,
    projectId: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (projectId && effectiveCompId) {
      const cacheKey = scopedCacheKey(
        "method_statements",
        projectId,
        effectiveCompId,
      );
      const list = getCache<MethodStatement[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((m) => m.id !== id),
      );
    }
    await deleteDoc(doc(firestore, "methodStatements", id));
  },

  // ─── REAL-TIME NOTIFICATIONS API ──────────────────────────────────────
  async getNotifications(
    companyId?: string,
    userId?: string,
    projectId?: string,
  ): Promise<AppNotification[]> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!effectiveCompId) return [];
    const cacheKey = `jqms_notifications_${effectiveCompId}`;
    try {
      const constraints: QueryConstraint[] = [
        where("companyId", "==", effectiveCompId),
        orderBy("createdAt", "desc"),
        limit(50),
      ];
      if (projectId) constraints.unshift(where("projectId", "==", projectId));

      const q = query(collection(firestore, "notifications"), ...constraints);
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => {
        const data = d.data();
        const readBy: string[] = Array.isArray(data.readBy) ? data.readBy : [];
        const isRead = userId ? readBy.includes(userId) : Boolean(data.isRead);
        return {
          ...data,
          id: d.id,
          readBy,
          isRead,
        } as AppNotification;
      });
      setCache(cacheKey, list);
      return list;
    } catch (e) {
      console.warn("Firestore getNotifications warning, reading cache:", e);
      return getCache<AppNotification[]>(cacheKey, []);
    }
  },

  subscribeNotifications(
    companyId: string,
    userId: string | undefined,
    callback: (notifications: AppNotification[]) => void,
  ): () => void {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!effectiveCompId) {
      callback([]);
      return () => {};
    }
    const cacheKey = `jqms_notifications_${effectiveCompId}`;
    try {
      const q = query(
        collection(firestore, "notifications"),
        where("companyId", "==", effectiveCompId),
        orderBy("createdAt", "desc"),
        limit(50),
      );

      const unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => {
            const data = d.data();
            const readBy: string[] = Array.isArray(data.readBy)
              ? data.readBy
              : [];
            const isRead = userId
              ? readBy.includes(userId)
              : Boolean(data.isRead);
            return {
              ...data,
              id: d.id,
              readBy,
              isRead,
            } as AppNotification;
          });
          setCache(cacheKey, list);
          callback(list);
        },
        (err) => console.warn("subscribeNotifications listener warning:", err),
      );
      return unsub;
    } catch (e) {
      console.warn("subscribeNotifications setup error:", e);
      return () => {};
    }
  },

  async saveNotification(notification: AppNotification): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(notification.companyId);
    if (!effectiveCompId) return;
    const cleaned = cleanForFirestore({
      ...notification,
      companyId: effectiveCompId,
      createdAt:
        typeof notification.createdAt === "number"
          ? notification.createdAt
          : Date.now(),
    });

    const cacheKey = `jqms_notifications_${effectiveCompId}`;
    const list = getCache<AppNotification[]>(cacheKey, []);
    list.unshift(cleaned);
    setCache(cacheKey, list.slice(0, 50));

    try {
      await setDoc(doc(firestore, "notifications", cleaned.id), cleaned, {
        merge: true,
      });
    } catch (e) {
      console.warn("Firestore saveNotification error:", e);
    }
  },

  async markNotificationRead(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    if (!notificationId || !userId) return;
    try {
      const notifRef = doc(firestore, "notifications", notificationId);
      await setDoc(
        notifRef,
        {
          readBy: arrayUnion(userId),
          isRead: true,
          updatedAt: Date.now(),
        },
        { merge: true },
      );
    } catch (e) {
      console.warn("Firestore markNotificationRead error:", e);
    }
  },

  async markAllNotificationsRead(
    companyId: string,
    userId: string,
  ): Promise<void> {
    if (!userId) return;
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (!effectiveCompId) return;

    try {
      const items = await this.getNotifications(effectiveCompId, userId);
      const unread = items.filter((n) => !n.readBy?.includes(userId));
      await commitInChunks(unread, (batch, n) => {
        batch.set(
          doc(firestore, "notifications", n.id),
          { readBy: arrayUnion(userId), isRead: true, updatedAt: Date.now() },
          { merge: true },
        );
      });
    } catch (e) {
      console.warn("Firestore markAllNotificationsRead error:", e);
    }
  },

  async deleteNotification(
    notificationId: string,
    companyId?: string,
  ): Promise<void> {
    const effectiveCompId = resolveEffectiveCompanyId(companyId);
    if (effectiveCompId) {
      const cacheKey = `jqms_notifications_${effectiveCompId}`;
      const list = getCache<AppNotification[]>(cacheKey, []);
      setCache(
        cacheKey,
        list.filter((n) => n.id !== notificationId),
      );
    }
    await deleteDoc(doc(firestore, "notifications", notificationId));
  },
};

export const db = dbService;
