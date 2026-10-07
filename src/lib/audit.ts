import { AuditLog } from "@/types";
import { firestore } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { getVaultRecord, setVaultRecord } from "./idbVault";

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
    previousValue: params.previousValue ?? null,
    newValue: params.newValue ?? null,
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

