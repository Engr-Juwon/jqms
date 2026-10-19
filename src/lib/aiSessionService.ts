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
} from "firebase/firestore";
import { AIChatMessage } from "@/lib/aiService";

export interface AICopilotSession {
  id: string;
  userId: string;
  projectId: string;
  projectName?: string;
  title: string;
  messages: AIChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const COLLECTION_NAME = "ai_copilot_sessions";

/**
 * Saves or updates a conversation session in Cloud Firestore
 */
export async function saveAICopilotSession(session: AICopilotSession): Promise<void> {
  if (!session.userId || !session.id) return;
  try {
    const sessionRef = doc(firestore, COLLECTION_NAME, session.id);
    await setDoc(sessionRef, {
      ...session,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (error) {
    console.warn("Failed syncing AI Copilot session to cloud:", error);
  }
}

/**
 * Retrieves all saved conversation sessions for a specific user and project
 */
export async function getAICopilotSessions(
  userId: string,
  projectId?: string
): Promise<AICopilotSession[]> {
  if (!userId) return [];
  try {
    const colRef = collection(firestore, COLLECTION_NAME);
    let q = query(
      colRef,
      where("userId", "==", userId),
      orderBy("updatedAt", "desc"),
      limit(30)
    );

    if (projectId) {
      q = query(
        colRef,
        where("userId", "==", userId),
        where("projectId", "==", projectId),
        orderBy("updatedAt", "desc"),
        limit(30)
      );
    }

    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as AICopilotSession);
  } catch (error) {
    console.warn("Failed fetching AI Copilot sessions from cloud:", error);
    return [];
  }
}

/**
 * Deletes a conversation session from Cloud Firestore
 */
export async function deleteAICopilotSession(sessionId: string): Promise<void> {
  if (!sessionId) return;
  try {
    const sessionRef = doc(firestore, COLLECTION_NAME, sessionId);
    await deleteDoc(sessionRef);
  } catch (error) {
    console.warn("Failed deleting AI Copilot session from cloud:", error);
  }
}
