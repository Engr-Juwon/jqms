import { create } from 'zustand';
import { getQueuedActions, removeQueuedAction, OfflineSyncItem } from '@/lib/idbVault';
import { dbService } from '@/lib/db';
import { toast } from 'react-hot-toast';

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

export const useOfflineStore = create<OfflineState>((set, get) => {
  // Setup window event listeners
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      set({ isOnline: true });
      toast.success('Connection restored! Synchronizing data...', {
        id: 'network-status-toast',
        duration: 3500,
      });
      get().checkConnection();
      get().syncNow();
    });

    window.addEventListener('offline', () => {
      set({ isOnline: false, latencyMs: null });
      toast.error('Offline Mode Active: Changes will be saved to your local vault.', {
        id: 'network-status-toast',
        duration: 5000,
      });
    });
  }

  return {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    queuedItems: [],
    isSyncing: false,
    latencyMs: null,
    lastCheckedAt: null,

    checkConnection: async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        set({ isOnline: false, latencyMs: null, lastCheckedAt: new Date() });
        return false;
      }

      const start = performance.now();
      try {
        // Fast ping to verify actual internet connectivity
        const res = await fetch(`/favicon.ico?_t=${Date.now()}`, {
          method: 'HEAD',
          cache: 'no-store',
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
        // Fallback: If local fetch is unavailable but navigator says online, assume online
        const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
        set({
          isOnline: online,
          latencyMs: null,
          lastCheckedAt: new Date(),
        });
        return online;
      }
    },

    checkStatus: async () => {
      const items = await getQueuedActions().catch(() => []);
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      set({
        isOnline,
        queuedItems: items,
      });
    },

    syncNow: async () => {
      const { queuedItems, isSyncing, isOnline } = get();
      if (isSyncing || queuedItems.length === 0 || !isOnline) return;

      set({ isSyncing: true });
      try {
        for (const item of queuedItems) {
          try {
            if (item.type === 'SITE_COMMENT') {
              await dbService.saveSiteComment(item.payload);
            } else if (item.type === 'NCR') {
              await dbService.saveNCR(item.payload);
            } else if (item.type === 'INSPECTION') {
              await dbService.saveInspection(item.payload);
            } else if (item.type === 'POUR_PERMIT') {
              await dbService.savePermitToPour(item.payload);
            } else if (item.type === 'CUBE_TEST') {
              await dbService.saveCubeSample(item.payload);
            }
            await removeQueuedAction(item.id);
          } catch (e) {
            console.error('Failed syncing offline item:', item.id, e);
          }
        }
      } finally {
        const remaining = await getQueuedActions().catch(() => []);
        set({ isSyncing: false, queuedItems: remaining });
      }
    },
  };
});
