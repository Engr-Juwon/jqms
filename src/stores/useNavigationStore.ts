import { create } from "zustand";

interface NavigationState {
  isNavigating: boolean;
  progress: number;
  targetPath: string | null;
  startNavigation: (targetPath?: string) => void;
  setNavProgress: (p: number) => void;
  finishNavigation: () => void;
}

let progressInterval: any = null;

export const useNavigationStore = create<NavigationState>((set, get) => ({
  isNavigating: false,
  progress: 0,
  targetPath: null,

  startNavigation: (targetPath?: string) => {
    // Clear any existing timer
    if (progressInterval) clearInterval(progressInterval);

    // If targetPath is same as current window location, don't trigger
    if (targetPath) {
      const current = window.location.pathname + window.location.search;
      if (current === targetPath) return;
    }

    set({
      isNavigating: true,
      progress: 25,
      targetPath: targetPath || null,
    });

    // Incrementally crawl towards 85% until route finishes mounting
    progressInterval = setInterval(() => {
      const cur = get().progress;
      if (cur < 50) {
        set({ progress: cur + 15 });
      } else if (cur < 75) {
        set({ progress: cur + 8 });
      } else if (cur < 88) {
        set({ progress: cur + 3 });
      }
    }, 120);
  },

  setNavProgress: (progress: number) => {
    set({ progress });
  },

  finishNavigation: () => {
    if (progressInterval) clearInterval(progressInterval);
    progressInterval = null;

    if (!get().isNavigating) return;

    // Jump to 100%
    set({ progress: 100 });

    // Smoothly hide after completion
    setTimeout(() => {
      set({ isNavigating: false, progress: 0, targetPath: null });
    }, 250);
  },
}));

// ─── GLOBAL 0ms CLICK & HISTORY INTERCEPTOR ─────────────────────────────
if (typeof window !== "undefined") {
  // 1. Intercept pointer clicks at the window level during the capture phase (0ms!)
  window.addEventListener(
    "click",
    (event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      // Find the nearest link anchor
      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Ignore external links, downloads, new tabs, and anchor hashes
      if (
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }

      // Check if internal origin
      try {
        const url = new URL(anchor.href, window.location.origin);
        if (url.origin === window.location.origin) {
          const currentUrl = window.location.pathname + window.location.search;
          const targetUrl = url.pathname + url.search;
          if (currentUrl !== targetUrl) {
            // INSTANT 0ms trigger!
            useNavigationStore.getState().startNavigation(targetUrl);
          }
        }
      } catch {
        // Ignore URL parse error
      }
    },
    true, // Capture phase ensures we run before React Router or anything else!
  );

  // 2. Intercept programmatic history navigation (navigate() calls)
  const originalPushState = window.history.pushState;
  window.history.pushState = function (...args) {
    const targetUrl = args[2] ? String(args[2]) : "";
    if (targetUrl) {
      useNavigationStore.getState().startNavigation(targetUrl);
    }
    return originalPushState.apply(this, args);
  };

  const originalReplaceState = window.history.replaceState;
  window.history.replaceState = function (...args) {
    const targetUrl = args[2] ? String(args[2]) : "";
    if (targetUrl) {
      useNavigationStore.getState().startNavigation(targetUrl);
    }
    return originalReplaceState.apply(this, args);
  };

  // 3. Listen to browser Back/Forward navigation
  window.addEventListener("popstate", () => {
    useNavigationStore
      .getState()
      .startNavigation(window.location.pathname + window.location.search);
  });
}
