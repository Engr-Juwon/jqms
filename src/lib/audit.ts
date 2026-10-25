import { AuditLog } from "@/types";
import { firestore } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { getVaultRecord, setVaultRecord } from "./idbVault";

function compactAuditValue(val: any, depth = 0): any {
  if (val === null || val === undefined) return null;
  if (typeof val === "string") {
    if (val.startsWith("data:") && val.length > 200) {
      return `[data-url: ${val.substring(0, 30)}... (${val.length} bytes)]`;
    }
    if (val.length > 2048) {
      return val.substring(0, 2048) + "... [truncated]";
    }
    return val;
  }
  if (typeof val !== "object") return val;

  if (Array.isArray(val)) {
    if (val.length > 20) {
      return `[Array of ${val.length} items; showing first 10]: ${JSON.stringify(val.slice(0, 10).map((v) => compactAuditValue(v, depth + 1)))}`;
    }
    return val.map((v) => compactAuditValue(v, depth + 1));
  }

  if (depth > 2) return "[Nested Object]";

  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(val)) {
    if (k.toLowerCase().includes("password") || k.toLowerCase().includes("secret") || k.toLowerCase().includes("token")) {
      result[k] = "******";
    } else {
      result[k] = compactAuditValue(v, depth + 1);
    }
  }
  return result;
}

export async function writeAudit(params: {
  projectId?: string;
  companyId: string;
  userId: string;
  userName: string;
  userRole?: string;
  action: string;
  module: AuditLog["module"];
  details: string;
  previousValue?: any;
  newValue?: any;
  targetId?: string;
}): Promise<void> {
  const auditEntry: AuditLog = {
    id: `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    projectId: params.projectId,
    companyId: params.companyId,
    userId: params.userId,
    userName: params.userName,
    userRole: params.userRole,
    action: params.action,
    module: params.module,
    details: params.details,
    targetId: params.targetId,
    timestamp: new Date().toISOString(),
    previousValue: compactAuditValue(params.previousValue),
    newValue: compactAuditValue(params.newValue),
  };

  try {
    // Write directly to Cloud Firestore collection
    const auditDocRef = doc(firestore, "auditLogs", auditEntry.id);
    const cleanAudit = JSON.parse(JSON.stringify(auditEntry));
    await setDoc(auditDocRef, cleanAudit);
  } catch (error) {
    console.warn(
      "Firestore audit write failed, falling back to local audit cache:",
      error,
    );
  }

  // Also save to high-capacity IndexedDB vault for instant 0ms retrieval and offline resilience
  try {
    const cacheKey = params.companyId
      ? `jqms_audit_logs_${params.companyId}`
      : "jqms_audit_logs";
    const existing = getVaultRecord<AuditLog[]>(cacheKey, []);
    existing.unshift(auditEntry);
    if (existing.length > 300) existing.pop(); // keep last 300 in IndexedDB
    setVaultRecord(cacheKey, existing);
  } catch (err) {
    console.warn("Local audit log cache warning (non-blocking):", err);
  }
}

