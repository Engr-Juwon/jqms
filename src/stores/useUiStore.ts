import { create } from "zustand";

interface UiState {
  isMobileSidebarOpen: boolean;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  toggleMobileSidebar: () => void;

  // Compound Sidebar State
  isSecondarySidebarCollapsed: boolean;
  toggleSecondarySidebar: () => void;
  setSecondarySidebarCollapsed: (collapsed: boolean) => void;
  activeDomainId: string | null;
  setActiveDomainId: (domainId: string | null) => void;

  // All Pages Directory Modal
  isAllPagesModalOpen: boolean;
  openAllPagesModal: () => void;
  closeAllPagesModal: () => void;
  toggleAllPagesModal: () => void;
}

const getStoredSidebarCollapsed = (): boolean => {
  try {
    return localStorage.getItem("jqms_sidebar_secondary_collapsed") === "true";
  } catch {
    return false;
  }
};

export const useUiStore = create<UiState>((set) => ({
  isMobileSidebarOpen: false,
  openMobileSidebar: () => set({ isMobileSidebarOpen: true }),
  closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),
  toggleMobileSidebar: () =>
    set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),

  isSecondarySidebarCollapsed: getStoredSidebarCollapsed(),
  toggleSecondarySidebar: () =>
    set((state) => {
      const next = !state.isSecondarySidebarCollapsed;
      try {
        localStorage.setItem("jqms_sidebar_secondary_collapsed", String(next));
      } catch {
        // ignore localStorage errors
      }
      return { isSecondarySidebarCollapsed: next };
    }),
  setSecondarySidebarCollapsed: (collapsed: boolean) => {
    try {
      localStorage.setItem("jqms_sidebar_secondary_collapsed", String(collapsed));
    } catch {
      // ignore localStorage errors
    }
    set({ isSecondarySidebarCollapsed: collapsed });
  },
  activeDomainId: null,
  setActiveDomainId: (domainId: string | null) => set({ activeDomainId: domainId }),

  isAllPagesModalOpen: false,
  openAllPagesModal: () => set({ isAllPagesModalOpen: true }),
  closeAllPagesModal: () => set({ isAllPagesModalOpen: false }),
  toggleAllPagesModal: () =>
    set((state) => ({ isAllPagesModalOpen: !state.isAllPagesModalOpen })),
}));
