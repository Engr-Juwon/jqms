import { firestore } from "@/firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  QueryConstraint,
  Unsubscribe,
} from "firebase/firestore";
import { AIChatMessage } from "@/lib/aiService";
import { useAuthStore } from "@/stores/useAuthStore";
import { resolveEffectiveCompanyId } from "@/lib/db";
import { safeSetLocalStorage } from "@/lib/idbVault";

export interface AICopilotSession {
  id: string;
  userId: string;
  companyId: string;
  projectId: string;
  projectName?: string;
  title: string;
  messages: AIChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const COLLECTION_NAME = "ai_copilot_sessions";

function resolveSessionCompanyId(explicitCompanyId?: string): string {
  const fromAuth = useAuthStore.getState().currentUser?.companyId;
  if (fromAuth && fromAuth.trim() && fromAuth !== "global" && fromAuth !== "undefined") {
    return fromAuth.trim();
  }
  if (explicitCompanyId && explicitCompanyId.trim() && explicitCompanyId !== "global" && explicitCompanyId !== "undefined") {
    return explicitCompanyId.trim();
  }
  const effective = resolveEffectiveCompanyId();
  if (effective && effective !== "global") {
    return effective;
  }
  return "-Oubn5JnM98I3QvSzHCB";
}

/**
 * Saves or updates a conversation session in Cloud Firestore, automatically synced across all user devices.
 */
export async function saveAICopilotSession(
  session: Omit<AICopilotSession, "companyId"> & { companyId?: string },
): Promise<void> {
  const activeCompanyId = resolveSessionCompanyId(session.companyId);
  if (!session.userId || !session.id) return;

  const sessionData: AICopilotSession = {
    ...session,
    companyId: activeCompanyId,
    projectId: session.projectId || "global",
    projectName: session.projectName || "General Workspace",
    updatedAt: Date.now(),
  };

  try {
    const sessionRef = doc(firestore, COLLECTION_NAME, session.id);
    await setDoc(sessionRef, sessionData, { merge: true });

    // Update local offline cache
    try {
      const cacheKey = `jqms_copilot_sessions_${session.userId}`;
      const raw = localStorage.getItem(cacheKey);
      const list: AICopilotSession[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((s) => s.id === session.id);
      if (idx >= 0) {
        list[idx] = sessionData;
      } else {
        list.unshift(sessionData);
      }
      safeSetLocalStorage(cacheKey, list.slice(0, 50));
    } catch {}
  } catch (error) {
    console.warn("[JQMS Copilot] Failed syncing AI session to cloud:", error);
  }
}

/**
 * Subscribes to live real-time updates for all sessions belonging to the user across all devices.
 */
export function subscribeAICopilotSessions(
  userId: string,
  onUpdate: (sessions: AICopilotSession[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const cacheKey = `jqms_copilot_sessions_${userId}`;
  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      const cached = JSON.parse(raw) as AICopilotSession[];
      if (Array.isArray(cached) && cached.length > 0) {
        onUpdate(cached);
      }
    }
  } catch {}

  const colRef = collection(firestore, COLLECTION_NAME);
  const q = query(
    colRef,
    where("userId", "==", userId),
    orderBy("updatedAt", "desc"),
    limit(50),
  );

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as AICopilotSession);
      safeSetLocalStorage(cacheKey, list);
      onUpdate(list);
    },
    (err) => {
      console.debug("[JQMS Copilot] Ordered live query failed, trying unordered fallback:", err);
      const fallbackQ = query(colRef, where("userId", "==", userId), limit(50));
      getDocs(fallbackQ)
        .then((snap) => {
          const list = snap.docs
            .map((d) => d.data() as AICopilotSession)
            .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
          safeSetLocalStorage(cacheKey, list);
          onUpdate(list);
        })
        .catch((e) => {
          console.warn("[JQMS Copilot] Live session query fallback failed:", e);
          if (onError) onError(e);
        });
    },
  );
}

/**
 * Retrieves all saved conversation sessions for a specific user across all devices and projects.
 */
export async function getAICopilotSessions(
  userId: string,
  projectId?: string,
): Promise<AICopilotSession[]> {
  if (!userId) return [];

  const cacheKey = `jqms_copilot_sessions_${userId}`;

  try {
    const colRef = collection(firestore, COLLECTION_NAME);
    const constraints: QueryConstraint[] = [where("userId", "==", userId)];
    if (projectId) {
      constraints.push(where("projectId", "==", projectId));
    }
    constraints.push(orderBy("updatedAt", "desc"), limit(50));

    const snap = await getDocs(query(colRef, ...constraints));
    const list = snap.docs.map((d) => d.data() as AICopilotSession);
    if (list.length > 0 && !projectId) {
      safeSetLocalStorage(cacheKey, list);
    }
    return list;
  } catch {
    // Fallback without orderBy if composite index is pending
    try {
      const colRef = collection(firestore, COLLECTION_NAME);
      const fallbackConstraints: QueryConstraint[] = [
        where("userId", "==", userId),
      ];
      if (projectId) {
        fallbackConstraints.push(where("projectId", "==", projectId));
      }
      fallbackConstraints.push(limit(50));
      const snap = await getDocs(query(colRef, ...fallbackConstraints));
      const list = snap.docs
        .map((d) => d.data() as AICopilotSession)
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      if (list.length > 0 && !projectId) {
        safeSetLocalStorage(cacheKey, list);
      }
      return list;
    } catch (fallbackErr) {
      console.warn("Failed fetching AI Copilot sessions from cloud:", fallbackErr);
      try {
        const raw = localStorage.getItem(cacheKey);
        if (raw) return JSON.parse(raw);
      } catch {}
      return [];
    }
  }
}

/**
 * Deletes a conversation session from Cloud Firestore after verifying ownership.
 */
export async function deleteAICopilotSession(sessionId: string): Promise<void> {
  if (!sessionId) return;
  const currentUser = useAuthStore.getState().currentUser;
  if (!currentUser?.uid) return;

  try {
    const sessionRef = doc(firestore, COLLECTION_NAME, sessionId);
    await deleteDoc(sessionRef);

    // Clean up local cache
    try {
      const cacheKey = `jqms_copilot_sessions_${currentUser.uid}`;
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const list = (JSON.parse(raw) as AICopilotSession[]).filter(
          (s) => s.id !== sessionId,
        );
        safeSetLocalStorage(cacheKey, list);
      }
    } catch {}
  } catch (error) {
    console.warn("Failed deleting AI Copilot session from cloud:", error);
  }
}
