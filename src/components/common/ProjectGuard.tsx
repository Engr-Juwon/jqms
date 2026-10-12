import React, { useEffect } from "react";
import {
  Navigate,
  useLocation,
  useParams,
  useNavigate,
} from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import {
  getRoleLevel,
  ROLE_TITLES,
  isStaffAssignedToProject,
  canAccessRoute,
} from "@/lib/permissions";
import { ShieldAlert, ArrowLeft, Loader2, FolderX } from "lucide-react";
import PageLoadingFallback from "./PageLoadingFallback";

interface ProjectGuardProps {
  minRole?: number; // 1 to 5
  children: React.ReactNode;
}

export const ProjectGuard: React.FC<ProjectGuardProps> = ({
  minRole = 1,
  children,
}) => {
  const {
    currentUser,
    isAuthenticated,
    isLoading: isAuthLoading,
  } = useAuthStore();
  const {
    activeProject,
    projects,
    isLoading: isProjLoading,
    loadProjects,
  } = useProjectStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId?: string }>();

  useEffect(() => {
    if (
      isAuthenticated &&
      currentUser &&
      projects.length === 0 &&
      !isProjLoading
    ) {
      loadProjects(currentUser.companyId, currentUser);
    }
  }, [isAuthenticated, currentUser, projects.length, isProjLoading]);

  if (isAuthLoading || (isProjLoading && projects.length === 0)) {
    return (
      <PageLoadingFallback message="Loading project workspace..." />
    );
  }

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 1. Role Level Gate (minRole)
  const userLevel = currentUser.role ? getRoleLevel(currentUser.role) : 1;
  if (userLevel < minRole) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900 border border-red-500/30 text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Access Restricted
          </h2>
          <p className="text-sm text-slate-400">
            This module requires{" "}
            <span className="font-semibold text-amber-400">
              Level {minRole}
            </span>{" "}
            governance authority. Your current role is{" "}
            <span className="font-semibold text-slate-200">
              {ROLE_TITLES[currentUser.role] || currentUser.role}
            </span>{" "}
            (Level {userLevel}).
          </p>
          <div className="pt-2">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Previous Screen</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Project Assignment Gate
  // Determine which project is being accessed
  const currentTargetProject =
    (projectId ? projects.find((p) => p.id === projectId) : null) ||
    activeProject;

  const targetProjId = projectId || currentTargetProject?.id;

  if (currentTargetProject || targetProjId) {
    const isAssigned = isStaffAssignedToProject(
      currentTargetProject,
      currentUser,
      targetProjId,
    );

    if (!isAssigned) {
      return (
        <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/30 text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <FolderX className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Project Assignment Required
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              You are not assigned to{" "}
              <span className="font-bold text-slate-900 dark:text-slate-200">
                {currentTargetProject?.name || "this project"}
              </span>
              {currentTargetProject?.code && ` (${currentTargetProject.code})`}.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Your role is{" "}
              <span className="font-semibold">
                {ROLE_TITLES[currentUser.role] || currentUser.role}
              </span>
              . Site execution personnel must be explicitly assigned to a
              project in the Project Team Matrix by a Project Manager or Quality
              Director.
            </p>
            <div className="pt-3 flex flex-col gap-2">
              <button
                onClick={() => navigate("/projects")}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition"
              >
                View My Assigned Projects
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // 3. Route Access Gate
  const hasRouteAccess = canAccessRoute(currentUser, location.pathname);
  if (!hasRouteAccess) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-slate-900 border border-red-500/30 text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Access Restricted
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {location.pathname.includes("/elements")
              ? "The Element Registry and 3D BIM Twin is strictly restricted to QA/QC personnel only."
              : location.pathname.includes("/qaqc-handbook")
              ? "The QA/QC SOP Field Manual is strictly restricted to QA/QC personnel only."
              : "You do not have permission to access this module."}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            Your role is{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {ROLE_TITLES[currentUser.role] || currentUser.role}
            </span>{" "}
            (Level {userLevel}).
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => navigate("/project/dashboard")}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Executive Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
