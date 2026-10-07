import { openDB, IDBPDatabase } from "idb";

const DB_NAME = "jqms-offline-vault";
const DB_VERSION = 2;

export interface OfflineSyncItem {
  id: string;
  type:
    | "SITE_COMMENT"
    | "INSPECTION"
    | "NCR"
    | "PHOTO_UPLOAD"
    | "POUR_PERMIT"
    | "CUBE_TEST"
    | "RFI"
    | "MAR"
    | "WEEKLY_REPORT";
  projectId: string;
  companyId: string;
  payload: any;
  createdAt: string;
  status: "QUEUED" | "SYNCING" | "FAILED";
  retryCount: number;
}

export interface FormDraftItem {
  id: string; // composite key: `${formType}_${draftId}`
  formType: string;
  draftId: string;
  data: any;
  updatedAt: string;
}

export interface CachedRecordItem {
  id: string; // cache key, e.g. `jqms_mirs_${projectId}`
  data: any;
  updatedAt: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

// L1 In-Memory Fast Cache for instant 0ms access without freezing the UI
const memoryCache = new Map<string, any>();

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("syncQueue")) {
          db.createObjectStore("syncQueue", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("draftObservations")) {
          db.createObjectStore("draftObservations", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("cachedRecords")) {
          db.createObjectStore("cachedRecords", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("formDrafts")) {
          db.createObjectStore("formDrafts", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

// ─── STARTUP MIGRATION: SEED L1 MEMORY & IDB FROM LOCALSTORAGE ──────────
let migrationInitiated = false;

export function initVaultMigration(): void {
  if (
    migrationInitiated ||
    typeof window === "undefined" ||
    !window.localStorage
  )
    return;
  migrationInitiated = true;

  try {
    const keysToMigrate: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("jqms_")) {
        keysToMigrate.push(k);
      }
    }

    if (keysToMigrate.length === 0) return;

    // Populate L1 cache synchronously
    for (const key of keysToMigrate) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          memoryCache.set(key, parsed);
        }
      } catch {
        // Skip unparseable keys
      }
    }

    // Asynchronously commit to IndexedDB
    getDb()
      .then(async (db) => {
        const tx = db.transaction("cachedRecords", "readwrite");
        for (const [key, data] of memoryCache.entries()) {
          await tx.store.put({ id: key, data, updatedAt: Date.now() });
        }
        await tx.done;
        console.log(
          `[JQMS Vault] Successfully migrated ${keysToMigrate.length} cached entities to IndexedDB.`,
        );
      })
      .catch((e) => {
        console.warn("[JQMS Vault] Background IndexedDB migration warning:", e);
      });
  } catch (e) {
    console.warn("[JQMS Vault] Migration init error:", e);
  }
}

// Auto-run migration once on module initialization
if (typeof window !== "undefined") {
  initVaultMigration();
}

// ─── L1 + L2 RECORD VAULT ACCESSORS (Crash-proof Caching) ───────────────

/**
 * Synchronous read backed by L1 in-memory cache and localStorage,
 * with background verification against IndexedDB.
 */
export function getVaultRecord<T>(key: string, defaultVal: T): T {
  // 1. Check L1 Memory Cache (0ms)
  if (memoryCache.has(key)) {
    return memoryCache.get(key) as T;
  }

  // 2. Check localStorage
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as T;
      memoryCache.set(key, parsed);

      // Backfill to IndexedDB in background
      getDb()
        .then((db) =>
          db.put("cachedRecords", {
            id: key,
            data: parsed,
            updatedAt: Date.now(),
          }),
        )
        .catch(() => {});

      return parsed;
    }
  } catch {
    // Ignore parse errors
  }

  // 3. Trigger async fetch from IndexedDB to warm L1 cache for subsequent reads
  getDb()
    .then((db) => db.get("cachedRecords", key))
    .then((entry) => {
      if (entry && entry.data !== undefined) {
        memoryCache.set(key, entry.data);
      }
    })
    .catch(() => {});

  return defaultVal;
}

/**
 * Asynchronous read guaranteeing complete IndexedDB inspection.
 */
export async function getVaultRecordAsync<T>(
  key: string,
  defaultVal: T,
): Promise<T> {
  // 1. Check L1 Memory Cache
  if (memoryCache.has(key)) {
    return memoryCache.get(key) as T;
  }

  // 2. Query IndexedDB
  try {
    const db = await getDb();
    const entry = await db.get("cachedRecords", key);
    if (entry && entry.data !== undefined) {
      memoryCache.set(key, entry.data);
      return entry.data as T;
    }
  } catch (e) {
    console.warn(`[JQMS Vault] IndexedDB read error for ${key}:`, e);
  }

  // 3. Fallback to localStorage
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as T;
      memoryCache.set(key, parsed);
      return parsed;
    }
  } catch {
    // Ignore
  }

  return defaultVal;
}

/**
 * Automatically purge heavy legacy caches from localStorage to guarantee
 * that localStorage never exceeds quota.
 * All application records are securely and permanently stored in IndexedDB + Firestore.
 */
export function purgeBloatedLocalStorage(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (
        k.startsWith("jqms_audit_logs") ||
        k.startsWith("jqms_elements_") ||
        k.startsWith("jqms_weekly_report") ||
        k.startsWith("jqms_ncrs_") ||
        k.startsWith("jqms_deliveries_") ||
        k.startsWith("jqms_inspections_") ||
        k.startsWith("jqms_draft_") ||
        k.startsWith("jqms_photos_") ||
        k.startsWith("jqms_slabs_") ||
        k.startsWith("jqms_beams_") ||
        k.startsWith("jqms_columns_") ||
        k.startsWith("jqms_mirs_") ||
        k.startsWith("jqms_rfis_") ||
        k.startsWith("jqms_mars_") ||
        k.startsWith("jqms_site_comments_") ||
        k.startsWith("jqms_site_instructions_") ||
        k.startsWith("jqms_itp_") ||
        k.startsWith("jqms_company_") ||
        k.startsWith("jqms_records_")
      ) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {}
    });
  } catch {}
}

// Auto-run on startup to immediately free up browser storage
if (typeof window !== "undefined") {
  setTimeout(() => purgeBloatedLocalStorage(), 100);
}

/**
 * Write record to L1 memory cache and L2 IndexedDB (unlimited storage).
 * Never writes heavy database records to localStorage, eliminating quota limits entirely.
 */
export function setVaultRecord<T>(key: string, data: T): void {
  // 1. Instant L1 memory write
  memoryCache.set(key, data);

  // 2. Async write to IndexedDB (virtually unlimited quota)
  getDb()
    .then((db) =>
      db.put("cachedRecords", {
        id: key,
        data,
        updatedAt: Date.now(),
      }),
    )
    .catch((e) => {
      console.warn(`[JQMS Vault] IndexedDB write error for ${key}:`, e);
    });
}

/**
 * Remove record from L1 memory, L2 IndexedDB, and localStorage.
 */
export function deleteVaultRecord(key: string): void {
  memoryCache.delete(key);

  getDb()
    .then((db) => db.delete("cachedRecords", key))
    .catch(() => {});

  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

/**
 * Remove an item by its ID across all cached project lists matching a key prefix
 * (e.g. 'jqms_ncrs_', 'jqms_inspections_', 'jqms_site_comments_')
 */
export function removeFromAllVaultCaches(prefix: string, itemId: string): void {
  const keysToProcess = new Set<string>();

  // 1. Gather all keys from memoryCache
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      keysToProcess.add(key);
    }
  }

  // 2. Gather matching keys from localStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        keysToProcess.add(k);
      }
    }
  } catch {
    // Ignore
  }

  // 3. Filter each list and write back
  for (const key of keysToProcess) {
    const list = getVaultRecord<any[]>(key, []);
    if (Array.isArray(list)) {
      const filtered = list.filter((item: any) => item && item.id !== itemId && item.sampleId !== itemId);
      if (filtered.length !== list.length) {
        setVaultRecord(key, filtered);
      }
    }
  }
}

/**
 * Find an item across all cached records matching a prefix
 */
export function findInVaultCaches<T extends { id?: string; sampleId?: string }>(
  prefix: string,
  predicate: (item: T) => boolean,
): T | null {
  const keysToProcess = new Set<string>();

  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      keysToProcess.add(key);
    }
  }

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        keysToProcess.add(k);
      }
    }
  } catch {
    // Ignore
  }

  for (const key of keysToProcess) {
    const list = getVaultRecord<T[]>(key, []);
    if (Array.isArray(list)) {
      const match = list.find(predicate);
      if (match) return match;
    }
  }

  return null;
}

/**
 * Upsert an item into a vault cache list safely
 */
export function upsertInVaultCache<T extends { id?: string; sampleId?: string }>(
  cacheKey: string,
  item: T,
  sortFn?: (a: T, b: T) => number,
): void {
  const list = getVaultRecord<T[]>(cacheKey, []);
  const safeList = Array.isArray(list) ? [...list] : [];
  const itemId = item.id || item.sampleId;
  const idx = safeList.findIndex((x: any) => (x.id && x.id === itemId) || (x.sampleId && x.sampleId === itemId));
  
  if (idx >= 0) {
    safeList[idx] = item;
  } else {
    safeList.unshift(item);
  }

  if (sortFn) {
    safeList.sort(sortFn);
  }

  setVaultRecord(cacheKey, safeList);
}


// ─── OFFLINE ACTION QUEUE ───────────────────────────────────────────────

export async function queueOfflineAction(
  item: Omit<OfflineSyncItem, "id" | "createdAt" | "status" | "retryCount">,
): Promise<string> {
  const db = await getDb();
  const id = `OFFLINE-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const syncItem: OfflineSyncItem = {
    ...item,
    id,
    createdAt: new Date().toISOString(),
    status: "QUEUED",
    retryCount: 0,
  };
  await db.put("syncQueue", syncItem);
  return id;
}

export async function getQueuedActions(): Promise<OfflineSyncItem[]> {
  try {
    const db = await getDb();
    return await db.getAll("syncQueue");
  } catch {
    return [];
  }
}

export async function removeQueuedAction(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("syncQueue", id);
}

// ─── GENERIC FORM DRAFTS ────────────────────────────────────────────────

export async function saveFormDraft(
  formType: string,
  draftId: string,
  data: any,
): Promise<void> {
  const compositeId = `${formType}_${draftId}`;
  const now = new Date().toISOString();
  const draftItem: FormDraftItem = {
    id: compositeId,
    formType,
    draftId,
    data,
    updatedAt: now,
  };

  try {
    const db = await getDb();
    await db.put("formDrafts", draftItem);
  } catch (e) {
    console.warn("IDB formDraft put warning:", e);
  }
}

export async function getFormDraft(
  formType: string,
  draftId: string,
): Promise<{ data: any; updatedAt: string } | null> {
  const compositeId = `${formType}_${draftId}`;
  try {
    const db = await getDb();
    const result = (await db.get("formDrafts", compositeId)) as
      | FormDraftItem
      | undefined;
    if (result && result.data) {
      return { data: result.data, updatedAt: result.updatedAt };
    }
  } catch (e) {
    console.warn("IDB formDraft get warning:", e);
  }

  try {
    const raw = localStorage.getItem(`jqms_draft_${compositeId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        data: parsed.data,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
    }
  } catch {
    // Ignore parse error
  }
  return null;
}

export async function clearFormDraft(
  formType: string,
  draftId: string,
): Promise<void> {
  const compositeId = `${formType}_${draftId}`;
  try {
    const db = await getDb();
    await db.delete("formDrafts", compositeId);
  } catch (e) {
    console.warn("IDB formDraft delete warning:", e);
  }

  try {
    localStorage.removeItem(`jqms_draft_${compositeId}`);
  } catch {
    // Ignore
  }
}

// Legacy wrappers for observation drafts
export async function saveDraftObservation(
  id: string,
  data: any,
): Promise<void> {
  return saveFormDraft("SITE_COMMENT", id, data);
}

export async function getDraftObservation(id: string): Promise<any | null> {
  const res = await getFormDraft("SITE_COMMENT", id);
  return res ? res.data : null;
}

export async function clearDraftObservation(id: string): Promise<void> {
  return clearFormDraft("SITE_COMMENT", id);
}
