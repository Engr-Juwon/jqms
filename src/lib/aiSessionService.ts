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
  QueryConstraint,
} from "firebase/firestore";
import { AIChatMessage } from "@/lib/aiService";
import { useAuthStore } from "@/stores/useAuthStore";

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

/**
 * Saves or updates a conversation session in Cloud Firestore, strictly scoped by userId & companyId.
 */
export async function saveAICopilotSession(
  session: Omit<AICopilotSession, "companyId"> & { companyId?: string },
): Promise<void> {
  const activeCompanyId =
    session.companyId || useAuthStore.getState().currentUser?.companyId || "";
  if (!session.userId || !session.id || !activeCompanyId) return;

  try {
    const sessionRef = doc(firestore, COLLECTION_NAME, session.id);
    await setDoc(
      sessionRef,
      {
        ...session,
        companyId: activeCompanyId,
        updatedAt: Date.now(),
      },
      { merge: true },
    );
  } catch (error) {
    console.warn("Failed syncing AI Copilot session to cloud:", error);
  }
}

/**
 * Retrieves saved conversation sessions for a specific user, tenant, and optional project.
 */
export async function getAICopilotSessions(
  userId: string,
  projectId?: string,
  companyId?: string,
): Promise<AICopilotSession[]> {
  const activeCompanyId =
    companyId || useAuthStore.getState().currentUser?.companyId || "";
  if (!userId || !activeCompanyId) return [];

  try {
    const colRef = collection(firestore, COLLECTION_NAME);
    const constraints: QueryConstraint[] = [
      where("userId", "==", userId),
      where("companyId", "==", activeCompanyId),
    ];
    if (projectId) {
      constraints.push(where("projectId", "==", projectId));
    }
    constraints.push(orderBy("updatedAt", "desc"), limit(30));

    const snap = await getDocs(query(colRef, ...constraints));
    return snap.docs.map((d) => d.data() as AICopilotSession);
  } catch {
    // Fallback without orderBy if composite index is still building in Firestore
    try {
      const colRef = collection(firestore, COLLECTION_NAME);
      const fallbackConstraints: QueryConstraint[] = [
        where("userId", "==", userId),
        where("companyId", "==", activeCompanyId),
      ];
      if (projectId) {
        fallbackConstraints.push(where("projectId", "==", projectId));
      }
      fallbackConstraints.push(limit(50));
      const snap = await getDocs(query(colRef, ...fallbackConstraints));
      return snap.docs
        .map((d) => d.data() as AICopilotSession)
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        .slice(0, 30);
    } catch (fallbackErr) {
      console.warn("Failed fetching AI Copilot sessions from cloud:", fallbackErr);
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
    const snap = await getDoc(sessionRef);
    if (!snap.exists()) return;
    const data = snap.data() as Partial<AICopilotSession>;
    if (data.userId && data.userId !== currentUser.uid) {
      throw new Error("Unauthorized session deletion attempt.");
    }
    await deleteDoc(sessionRef);
  } catch (error) {
    console.warn("Failed deleting AI Copilot session from cloud:", error);
  }
}
