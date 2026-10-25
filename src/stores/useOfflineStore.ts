import { create } from "zustand";
import {
  getQueuedActions,
  removeQueuedAction,
  updateQueuedAction,
  OfflineSyncItem,
} from "@/lib/idbVault";
import { dbService } from "@/lib/db";
import { uploadMediaAsset } from "@/lib/cloudinary";
import { registerLogoutCleanup, useAuthStore } from "@/stores/useAuthStore";
import { toast } from "react-hot-toast";

interface OfflineState {
  isOnline: boolean;
  queuedItems: OfflineSyncItem[];
  isSyncing: boolean;
  latencyMs: number | null;
  lastCheckedAt: Date | null;
  checkStatus: () => Promise<void>;
  checkConnection: () => Promise<boolean>;
  syncNow: () => Promise<void>;
}

async function replayOfflineItem(item: OfflineSyncItem): Promise<void> {
  const payload = item.payload;
  switch (item.type) {
    case "SITE_COMMENT":
      await dbService.saveSiteComment(payload);
      return;
    case "NCR":
      await dbService.saveNCR(payload);
      return;
    case "INSPECTION":
      await dbService.saveInspection(payload);
      return;
    case "POUR_PERMIT":
      await dbService.savePermitToPour(payload);
      return;
    case "CUBE_TEST":
      await dbService.saveCubeSample(payload);
      return;
    case "RFI":
      await dbService.saveRFI(payload);
      return;
    case "MAR":
      await dbService.saveMAR(payload);
      return;
    case "MIR":
      await dbService.saveMIR(payload);
      return;
    case "SITE_INSTRUCTION":
      await dbService.saveSiteInstruction(payload);
      return;
    case "DAILY_LOG":
      await dbService.saveDailySiteLog(payload);
      return;
    case "STEEL_TEST":
      await dbService.saveSteelTest(payload);
      return;
    case "BAR_CUTTING":
      await dbService.saveBarCuttingSchedule(payload);
      return;
    case "MATERIAL_DELIVERY":
      await dbService.saveMaterialDelivery(payload);
      return;
    case "WEEKLY_REPORT":
      await dbService.saveWeeklyReport(payload);
      return;
    case "ITP_PLAN":
      await dbService.saveITPPlan(payload);
      return;
    case "PUNCH_ITEM":
      await dbService.saveRoomPunchItem(payload);
      return;
    case "TOC":
      await dbService.saveTakingOverCert(payload);
      return;
    case "METHOD_STATEMENT":
      await dbService.saveMethodStatement(payload);
      return;
    case "PLANNER_EVENT":
      await dbService.savePlannerEvent(payload);
      return;
    case "DOCUMENT":
      await dbService.saveDocument(payload);
      return;
    case "PROJECT_LEVELS":
      if (Array.isArray(payload?.levels) && payload?.projectId) {
        await dbService.saveLevels(payload.projectId, payload.levels, payload.companyId || item.companyId);
      }
      return;
    case "STRUCTURAL_ELEMENTS":
      if (Array.isArray(payload?.elements) && payload?.projectId) {
        await dbService.saveElements(payload.projectId, payload.elements, payload.companyId || item.companyId);
      }
      return;
    case "GRIDLINES":
      if (Array.isArray(payload?.gridlines) && payload?.projectId) {
        await dbService.saveGridlines(payload.projectId, payload.gridlines, payload.companyId || item.companyId);
      }
      return;
    case "WORK_PACKAGE":
      await dbService.saveWorkPackage(payload);
      return;
    case "TRADE":
      await dbService.saveTrade(payload);
      return;
    case "INSPECTION_TEMPLATE":
      await dbService.saveInspectionTemplate(payload);
      return;
    case "PHOTO_UPLOAD": {
      const photo = { ...payload };
      if (typeof photo.url === "string" && photo.url.startsWith("data:")) {
        const uploadedUrl = await uploadMediaAsset(photo.url, {
          category: "photos",
          companyId: photo.companyId || item.companyId,
          projectId: photo.projectId || item.projectId,
          filename: photo.caption ? `${photo.caption.slice(0, 32)}.jpg` : "site-photo.jpg",
        });
        photo.url = uploadedUrl;
      }
      await dbService.savePhoto(photo);
      return;
    }
    default: {
      const exhaustiveCheck: never = item.type;
      throw new Error(`Unsupported offline sync entity type: ${String(exhaustiveCheck)}`);
    }
  }
}

export const useOfflineStore = create<OfflineState>((set, get) => {
  if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
      void (async () => {
        set({ isOnline: true });
        const reachable = await get().checkConnection();
        await get().checkStatus();
        if (reachable && get().queuedItems.length > 0) {
          toast.success("Connection restored! Synchronizing queued site records...", {
            id: "network-status-toast",
            duration: 3500,
          });
          await get().syncNow();
        }
      })();
    });

    window.addEventListener("offline", () => {
      set({ isOnline: false, latencyMs: null });
      toast.error("Offline Mode Active: Changes will be saved to your local vault.", {
        id: "network-status-toast",
        duration: 5000,
      });
    });

    window.addEventListener("jqms:offline-queue-changed", () => {
      getQueuedActions()
        .then((items) => set({ queuedItems: items }))
        .catch(() => {});
    });
  }

  return {
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    queuedItems: [],
    isSyncing: false,
    latencyMs: null,
    lastCheckedAt: null,

    checkConnection: async () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        set({ isOnline: false, latencyMs: null, lastCheckedAt: new Date() });
        return false;
      }

      const start = performance.now();
      try {
        // Probe static PWA manifest (never SPA-rewritten with heavy HTML and always present)
        const res = await fetch(`/manifest.json?_t=${Date.now()}`, {
          method: "GET",
          cache: "no-store",
        });
        const latency = Math.round(performance.now() - start);
        const online = res.ok || res.status < 500;
        set({
          isOnline: online,
          latencyMs: online ? latency : null,
          lastCheckedAt: new Date(),
        });
        return online;
      } catch {
        set({
          isOnline: false,
          latencyMs: null,
          lastCheckedAt: new Date(),
        });
        return false;
      }
    },

    checkStatus: async () => {
      const items = await getQueuedActions().catch(() => []);
      const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
      set({
        isOnline,
        queuedItems: items,
      });
    },

    syncNow: async () => {
      if (get().isSyncing) return;

      const reachable = await get().checkConnection();
      if (!reachable) return;

      const currentUser = useAuthStore.getState().currentUser;
      if (!currentUser || !currentUser.companyId) return;

      const executeSyncPass = async () => {
        const freshQueue = await getQueuedActions().catch(() => []);
        if (freshQueue.length === 0) {
          set({ queuedItems: [], isSyncing: false });
          return;
        }

        set({ isSyncing: true, queuedItems: freshQueue });
        let syncedCount = 0;
        let failedCount = 0;

        try {
          for (const item of freshQueue) {
            // Respect tenant boundary: only replay items belonging to the signed-in user's company
            if (item.companyId && item.companyId !== currentUser.companyId) {
              continue;
            }
            if (item.status === "SYNCING") {
              continue;
            }

            const syncingState: OfflineSyncItem = {
              ...item,
              status: "SYNCING",
            };
            await updateQueuedAction(syncingState).catch(() => {});

            try {
              await replayOfflineItem(syncingState);
              await removeQueuedAction(item.id);
              syncedCount++;
            } catch (e: any) {
              failedCount++;
              const errMessage = e?.message || String(e);
              console.error("[OfflineSync] Failed syncing queued item:", item.id, errMessage);
              await updateQueuedAction({
                ...item,
                status: "FAILED",
                retryCount: (item.retryCount || 0) + 1,
                lastError: errMessage,
              }).catch(() => {});
            }
          }
        } finally {
          const remaining = await getQueuedActions().catch(() => []);
          set({ isSyncing: false, queuedItems: remaining });
          if (syncedCount > 0 && failedCount === 0) {
            toast.success(
              `Synchronized ${syncedCount} offline record${syncedCount === 1 ? "" : "s"} to cloud.`,
              { id: "offline-sync-complete" },
            );
          } else if (failedCount > 0) {
            toast.error(
              `${failedCount} offline record${failedCount === 1 ? "" : "s"} could not sync yet and remain safely queued.`,
              { id: "offline-sync-failed" },
            );
          }
        }
      };

      // Coordinate across multiple browser tabs via Web Locks API when available
      if (typeof navigator !== "undefined" && navigator.locks?.request) {
        await navigator.locks.request(
          "jqms-offline-sync-lock",
          { ifAvailable: true },
          async (lock) => {
            if (!lock) return;
            await executeSyncPass();
          },
        );
      } else {
        await executeSyncPass();
      }
    },
  };
});

registerLogoutCleanup(() => {
  useOfflineStore.setState({
    queuedItems: [],
    isSyncing: false,
    latencyMs: null,
  });
});
