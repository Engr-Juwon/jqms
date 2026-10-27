import React, { useEffect, Suspense } from "react";
import { Outlet, useParams, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileBottomNav } from "./MobileBottomNav";
import { FloatingPlannerReminder } from "@/components/planner/FloatingPlannerReminder";
import { Footer } from "./Footer";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigationStore } from "@/stores/useNavigationStore";
import { PageLoadingFallback } from "./PageLoadingFallback";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { useOnboardingStore } from "@/stores/useOnboardingStore";
import { AICopilotDrawer } from "@/components/ai/AICopilotDrawer";
import { resolveEffectiveCompanyId } from "@/lib/db";

export const ProjectLayout: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const isChatPage = location.pathname.includes("/chat");
  const currentUser = useAuthStore((s) => s.currentUser);
  const { selectProjectById, loadProjects, hasHydrated } = useProjectStore();
  const isNavigating = useNavigationStore((s) => s.isNavigating);
  const checkAutoStart = useOnboardingStore((s) => s.checkAutoStart);

  useEffect(() => {
    let cancelled = false;
    async function syncWorkspace() {
      const compId =
        currentUser?.companyId ||
        useAuthStore.getState().company?.id ||
        resolveEffectiveCompanyId();
      if (!compId) return;
      if (!hasHydrated) {
        await loadProjects(compId, currentUser, projectId);
      } else if (projectId) {
        selectProjectById(projectId);
      }
      if (!cancelled && projectId) {
        selectProjectById(projectId);
      }
    }
    syncWorkspace();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.companyId, currentUser?.uid, projectId, hasHydrated, loadProjects, selectProjectById]);

  // Auto-start tour for first-time users (desktop only)
  useEffect(() => {
    if (window.innerWidth >= 768) {
      checkAutoStart();
    }
  }, [checkAutoStart]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-brand-500 selection:text-white transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen min-w-0 max-w-full overflow-hidden">
        <Header className="shrink-0 sticky top-0 z-40" />
        <main
          className={`flex-1 ${
            isChatPage
              ? "p-0 pb-0 overflow-hidden flex flex-col"
              : "p-3 sm:p-4 md:p-6 lg:p-8 pb-16 lg:pb-8 overflow-y-auto overflow-x-hidden flex flex-col scroll-smooth"
          } transition-opacity duration-200 ${
            isNavigating ? "opacity-60" : "opacity-100"
          }`}
        >
          <div
            className={`${
              isChatPage
                ? "w-full h-full min-w-0 flex-1 flex flex-col"
                : "max-w-7xl mx-auto w-full min-w-0 flex-1"
            }`}
          >
            <Suspense fallback={<PageLoadingFallback />}>
              <Outlet />
            </Suspense>
          </div>
          {!isChatPage && <Footer variant="project" />}
        </main>
        {!isChatPage && <FloatingPlannerReminder />}
        {!isChatPage && <AICopilotDrawer />}
        {!isChatPage && <MobileBottomNav />}
      </div>
      {/* Onboarding Tour Overlay — hidden on mobile */}
      <div className="hidden md:block">
        <OnboardingTour />
      </div>
    </div>
  );
};
