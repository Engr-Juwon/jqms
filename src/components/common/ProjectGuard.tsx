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
  isUserSuspended,
} from "@/lib/permissions";
import { ShieldAlert, ArrowLeft, FolderX, FolderPlus, LogOut } from "lucide-react";
import PageLoadingFallback from "./PageLoadingFallback";

interface ProjectGuardProps {
  minRole?: number; // 1 to 5
  children: React.ReactNode;
}

const PROJECT_EXEMPT_SEGMENTS = [
  "/profile",
  "/notifications",
  "/calculators",
  "/chat",
  "/project/new",
  "/projects",
];

export const ProjectGuard: React.FC<ProjectGuardProps> = ({
  minRole = 1,
  children,
}) => {
  const {
    currentUser,
    isAuthenticated,
    isLoading: isAuthLoading,
    logout,
  } = useAuthStore();
  const {
    activeProject,
    projects,
    isLoading: isProjLoading,
    hasHydrated,
    loadProjects,
  } = useProjectStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId?: string }>();

  // Watchdog: Guarantee that the loading spinner never gets stuck indefinitely
  useEffect(() => {
    if (!hasHydrated) {
      const watchdog = setTimeout(() => {
        useProjectStore.setState({ hasHydrated: true, isLoading: false });
      }, 5000);
      return () => clearTimeout(watchdog);
    }
  }, [hasHydrated]);

  useEffect(() => {
    if (!isAuthenticated || isAuthLoading) return;

    if (!hasHydrated) {
      loadProjects(currentUser?.companyId || "", currentUser, projectId);
    } else if (projectId && activeProject?.id !== projectId) {
      loadProjects(currentUser?.companyId || "", currentUser, projectId);
    }
  }, [
    isAuthenticated,
    isAuthLoading,
    currentUser?.companyId,
    currentUser,
    hasHydrated,
    projectId,
    activeProject?.id,
    loadProjects,
  ]);

  if (isAuthLoading || (!hasHydrated && isProjLoading)) {
    return <PageLoadingFallback message="Loading project workspace..." />;
  }

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isUserSuspended(currentUser)) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-slate-900 border border-red-500/30 text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Account Deactivated
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Your workspace account has been suspended or deactivated by your organization administrator.
          </p>
          <div className="pt-2">
            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Return to Sign In</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 1. Role Level Gate (minRole)
  const userLevel = currentUser.role ? getRoleLevel(currentUser.role) : 1;
  if (userLevel < minRole) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-slate-900 border border-red-500/30 text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Access Restricted
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This module requires{" "}
            <span className="font-semibold text-amber-500 dark:text-amber-400">
              Level {minRole}
            </span>{" "}
            governance authority. Your current role is{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-200">
              {ROLE_TITLES[currentUser.role] || currentUser.role}
            </span>{" "}
            (Level {userLevel}).
          </p>
          <div className="pt-2">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Previous Screen</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Project Resolution & Assignment Gate
  const currentTargetProject = projectId
    ? projects.find((p) => p.id === projectId) || null
    : activeProject;

  const targetProjId = projectId || currentTargetProject?.id;
  const isProjectExemptRoute = PROJECT_EXEMPT_SEGMENTS.some((seg) =>
    location.pathname.includes(seg),
  );

  // Block project-dependent routes when no active project exists or URL :projectId wasn't found
  if (!isProjectExemptRoute && !currentTargetProject) {
    if (isProjLoading) {
      return <PageLoadingFallback message="Loading project workspace..." />;
    }
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500">
            {projectId ? (
              <FolderX className="w-8 h-8 text-amber-500" />
            ) : (
              <FolderPlus className="w-8 h-8" />
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {projectId
              ? "Project Not Found or Unassigned"
              : "No Active Project Selected"}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {projectId
              ? "The requested project does not exist in your workspace or has not been assigned to your account."
              : userLevel >= 4
                ? "Create or select a construction project workspace before opening project quality registers."
                : "No projects are currently assigned to your account. Ask your Project Manager or Quality Director to assign you in the Project Team Matrix."}
          </p>
          <div className="pt-3 flex flex-col gap-2">
            <button
              onClick={() => navigate("/projects")}
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow transition"
            >
              Open Project Selector
            </button>
            {userLevel >= 4 && (
              <button
                onClick={() => navigate("/company/projects")}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition"
              >
                Manage / Create Projects
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

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

  // 3. Route Access Gate (always pass currentTargetProject so URL :projectId BIM/feature toggles apply!)
  const hasRouteAccess = canAccessRoute(
    currentUser,
    location.pathname,
    currentTargetProject,
  );
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
            {location.pathname.includes("/qaqc-handbook")
              ? "The QA/QC SOP Field Manual is strictly restricted to QA/QC personnel only."
              : "You do not have permission to access this module or it has been disabled for this project in Project Settings."}
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
