import { create } from "zustand";
import { Project, UserProfile } from "@/types";
import { dbService } from "@/lib/db";
import { isStaffAssignedToProject } from "@/lib/permissions";
import { useAuthStore, registerLogoutCleanup } from "./useAuthStore";
import { safeSetLocalStorage, safeRemoveLocalStorage } from "@/lib/idbVault";

interface ProjectState {
  activeProject: Project | null;
  projects: Project[];
  isLoading: boolean;
  hasHydrated: boolean;
  setActiveProject: (project: Project | null) => void;
  setCurrentLevel: (levelId: string, levelName?: string) => Promise<void>;
  updateCostRates: (costRates: any) => Promise<void>;
  updateCarbonFactors: (carbonFactors: any) => Promise<void>;
  loadProjects: (
    companyId?: string,
    user?: UserProfile | null,
    preferredProjectId?: string,
  ) => Promise<void>;
  selectProjectById: (projectId: string) => void;
  resetProjectStore: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => {
  return {
    activeProject: null,
    projects: [],
    isLoading: false,
    hasHydrated: false,

    setCurrentLevel: async (levelId: string, levelName?: string) => {
      const { activeProject, projects } = get();
      if (!activeProject) return;

      const updatedProject: Project = {
        ...activeProject,
        currentLevelId: levelId,
        currentLevelName: levelName || activeProject.currentLevelName,
        updatedAt: new Date().toISOString(),
      };

      set({
        activeProject: updatedProject,
        projects: projects.map((p) =>
          p.id === activeProject.id ? updatedProject : p,
        ),
      });

      await dbService.updateProjectCurrentLevel(
        activeProject.id,
        levelId,
        levelName,
        activeProject.companyId,
      );
    },

    updateCostRates: async (costRates: any) => {
      const { activeProject, projects } = get();
      if (!activeProject) return;

      const updatedProject: Project = {
        ...activeProject,
        costRates,
        currency: costRates?.currencySymbol || activeProject.currency || "$",
        updatedAt: new Date().toISOString(),
      };

      set({
        activeProject: updatedProject,
        projects: projects.map((p) =>
          p.id === activeProject.id ? updatedProject : p,
        ),
      });

      await dbService.updateProjectCostRates(
        activeProject.id,
        costRates,
        activeProject.companyId,
      );
    },

    updateCarbonFactors: async (carbonFactors: any) => {
      const { activeProject, projects } = get();
      if (!activeProject) return;

      const updatedProject: Project = {
        ...activeProject,
        carbonFactors,
        updatedAt: new Date().toISOString(),
      };

      set({
        activeProject: updatedProject,
        projects: projects.map((p) =>
          p.id === activeProject.id ? updatedProject : p,
        ),
      });

      await dbService.updateProjectCarbonFactors(
        activeProject.id,
        carbonFactors,
        activeProject.companyId,
      );
    },

    setActiveProject: (project) => {
      if (project) {
        safeSetLocalStorage("jqms_active_project_id", project.id);
        const authUser = useAuthStore.getState().currentUser;
        if (authUser?.uid && authUser.lastActiveProjectId !== project.id) {
          dbService
            .saveUser({
              ...authUser,
              lastActiveProjectId: project.id,
              updatedAt: Date.now(),
            })
            .catch((err) =>
              console.warn("Could not update user lastActiveProjectId:", err),
            );
        }
      } else {
        safeRemoveLocalStorage("jqms_active_project_id");
      }
      set({ activeProject: project });
    },

    loadProjects: async (
      companyId?: string,
      user?: UserProfile | null,
      preferredProjectId?: string,
    ) => {
      set({ isLoading: true });
      try {
        const authState = useAuthStore.getState();
        const authUser = user ?? authState.currentUser;
        const targetCompanyId = (
          companyId ||
          authUser?.companyId ||
          authState.company?.id ||
          ""
        ).trim();

        if (!targetCompanyId) {
          if (authState.isLoading) {
            set({ isLoading: false });
            return;
          }
          set({
            projects: [],
            activeProject: null,
            isLoading: false,
            hasHydrated: true,
          });
          return;
        }

        let list = await dbService.getProjects(targetCompanyId);

        if (authUser) {
          list = list.filter((p) =>
            isStaffAssignedToProject(p, authUser, p.id),
          );
        }

        let savedProjectId: string | null = null;
        try {
          savedProjectId =
            localStorage.getItem("jqms_active_project_id") ||
            authUser?.lastActiveProjectId ||
            null;
        } catch {
          savedProjectId = authUser?.lastActiveProjectId || null;
        }

        const currentActive = get().activeProject;
        let nextActive: Project | null = null;

        if (
          preferredProjectId &&
          list.some((p) => p.id === preferredProjectId)
        ) {
          nextActive = list.find((p) => p.id === preferredProjectId) || null;
        } else if (
          currentActive &&
          list.some((p) => p.id === currentActive.id)
        ) {
          nextActive = list.find((p) => p.id === currentActive.id) || null;
        } else if (
          savedProjectId &&
          list.some((p) => p.id === savedProjectId)
        ) {
          nextActive = list.find((p) => p.id === savedProjectId) || null;
        } else if (list.length > 0) {
          nextActive = list[0];
        }

        if (nextActive) {
          safeSetLocalStorage("jqms_active_project_id", nextActive.id);
        } else {
          safeRemoveLocalStorage("jqms_active_project_id");
        }

        set({
          projects: list,
          activeProject: nextActive,
          isLoading: false,
          hasHydrated: true,
        });
      } catch (err) {
        console.error("Error loading projects:", err);
        set({ isLoading: false, hasHydrated: true });
      }
    },

    selectProjectById: (projectId: string) => {
      if (!projectId) return;
      const { projects, activeProject } = get();
      if (activeProject?.id === projectId) return;
      const match = projects.find((p) => p.id === projectId);
      if (match) {
        get().setActiveProject(match);
      }
    },

    resetProjectStore: () => {
      safeRemoveLocalStorage("jqms_active_project_id");
      set({
        activeProject: null,
        projects: [],
        isLoading: true,
        hasHydrated: false,
      });
    },
  };
});

registerLogoutCleanup(() => {
  useProjectStore.getState().resetProjectStore();
});

if (typeof window !== "undefined") {
  (window as any).__JQMS_PROJECT_STORE__ = useProjectStore;
}
