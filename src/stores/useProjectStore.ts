import { create } from "zustand";
import { Project, UserProfile } from "@/types";
import { dbService } from "@/lib/db";
import { isStaffAssignedToProject } from "@/lib/permissions";
import { useAuthStore } from "./useAuthStore";

interface ProjectState {
  activeProject: Project | null;
  projects: Project[];
  isLoading: boolean;
  setActiveProject: (project: Project | null) => void;
  setCurrentLevel: (levelId: string, levelName?: string) => Promise<void>;
  updateCostRates: (costRates: any) => Promise<void>;
  updateCarbonFactors: (carbonFactors: any) => Promise<void>;
  loadProjects: (
    companyId?: string,
    user?: UserProfile | null,
  ) => Promise<void>;
  selectProjectById: (projectId: string) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => {
  return {
    activeProject: null,
    projects: [],
    isLoading: false,

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
        localStorage.setItem("jqms_active_project_id", project.id);
        const authUser = useAuthStore.getState().currentUser;
        if (authUser?.uid) {
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
        localStorage.removeItem("jqms_active_project_id");
      }
      set({ activeProject: project });
    },

    loadProjects: async (companyId?: string, user?: UserProfile | null) => {
      set({ isLoading: true });
      try {
        const authUser = user || useAuthStore.getState().currentUser;
        const targetCompanyId = companyId || authUser?.companyId;
        let list = await dbService.getProjects(targetCompanyId);

        // Filter by user's assigned project access according to matrix rules
        if (authUser) {
          list = list.filter((p) =>
            isStaffAssignedToProject(p, authUser, p.id),
          );
        }

        set({ projects: list });

        // Resolve active project
        const savedProjectId =
          localStorage.getItem("jqms_active_project_id") ||
          authUser?.lastActiveProjectId;
        const currentActive = get().activeProject;

        if (savedProjectId && list.some((p) => p.id === savedProjectId)) {
          set({
            activeProject: list.find((p) => p.id === savedProjectId) || null,
          });
        } else if (
          currentActive &&
          list.some((p) => p.id === currentActive.id)
        ) {
          // Keep current active
        } else if (list.length > 0) {
          set({ activeProject: list[0] });
          localStorage.setItem("jqms_active_project_id", list[0].id);
        } else {
          set({ activeProject: null });
        }
      } catch (err) {
        console.error("Error loading projects:", err);
      } finally {
        set({ isLoading: false });
      }
    },

    selectProjectById: (projectId: string) => {
      const { projects } = get();
      const match = projects.find((p) => p.id === projectId);
      if (match) {
        get().setActiveProject(match);
      }
    },
  };
});
