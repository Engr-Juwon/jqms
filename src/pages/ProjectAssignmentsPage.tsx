import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  Users,
  Building2,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  XCircle,
  FolderKanban,
  UserCheck,
  UserX,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Project, UserProfile } from "@/types";
import { dbService } from "@/lib/db";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { writeAudit } from "@/lib/audit";
import {
  ROLE_LABELS,
  ROLE_LEVELS,
  getRoleLevel,
  isGlobalManagerRole,
  isQAQCEngineerRole,
} from "@/lib/permissions";
import { ProjectAssignmentMatrix } from "@/components/projects/ProjectAssignmentMatrix";

export const ProjectAssignmentsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, company } = useAuthStore();
  const { loadProjects } = useProjectStore();
  const currentCompId =
    currentUser?.companyId || company?.id || "comp-apex-civil";

  const [projects, setProjects] = useState<Project[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"by-project" | "by-user">(
    "by-project",
  );

  // User assignment modal state (for "by-user" mode)
  const [assigningUser, setAssigningUser] = useState<UserProfile | null>(null);
  const [userSelectedProjectIds, setUserSelectedProjectIds] = useState<
    string[]
  >([]);
  const [userIsGlobal, setUserIsGlobal] = useState<boolean>(false);

  // Search in "by-user" mode
  const [userSearchTerm, setUserSearchTerm] = useState<string>("");

  const currentUserLevel = currentUser?.role
    ? getRoleLevel(currentUser.role)
    : 1;
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const canManage = currentUserLevel >= 4 || isSuperAdmin;

  // Load projects and users
  const loadData = async () => {
    setLoading(true);
    try {
      const [projList, userList] = await Promise.all([
        dbService.getProjects(currentCompId),
        dbService.getUsers(currentCompId),
      ]);

      setProjects(projList);
      setAllUsers(userList);

      // Determine active project from URL param or first project
      const urlPid = searchParams.get("projectId");
      if (urlPid && projList.some((p) => p.id === urlPid)) {
        setSelectedProjectId(urlPid);
      } else if (projList.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projList[0].id);
      }
    } catch (err) {
      console.error("Failed to load assignment data:", err);
      toast.error("Failed to load project assignments data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentCompId]);

  // Selected project object
  const currentProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // Staff arrays for current project
  const currentAssignedStaff = useMemo(() => {
    if (!currentProject) return [];
    const staff =
      currentProject.assignedStaff || currentProject.assignedStaffIds || [];
    return Array.isArray(staff) ? staff : [];
  }, [currentProject]);

  const currentExcludedStaff = useMemo(() => {
    if (!currentProject) return [];
    const excluded = currentProject.excludedStaffIds || [];
    return Array.isArray(excluded) ? excluded : [];
  }, [currentProject]);

  // Project selector change handler
  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSearchParams({ projectId });
  };

  // Matrix change handler
  const handleMatrixChange = async (updatedStaff: string[]) => {
    if (!currentProject || !canManage) return;

    try {
      const updatedProj = await dbService.assignStaffToProject(
        currentProject.id,
        updatedStaff,
        currentExcludedStaff,
        currentCompId,
      );

      // Update local state
      setProjects((prev) =>
        prev.map((p) => (p.id === updatedProj.id ? updatedProj : p)),
      );
      loadProjects();

      // Audit log
      if (currentUser) {
        await writeAudit({
          companyId: currentCompId,
          projectId: currentProject.id,
          userId: currentUser.uid,
          userName: currentUser.fullName,
          userRole: currentUser.role,
          action: "UPDATE_PROJECT_STAFF_ASSIGNMENTS",
          module: "Projects",
          details: `Updated project staff roster for ${currentProject.name} (${currentProject.code}): ${updatedStaff.length} personnel assigned`,
          newValue: { assignedStaff: updatedStaff },
        });
      }
    } catch (err) {
      console.error("Failed to save project staff assignment:", err);
      toast.error("Failed to update staff assignments");
    }
  };

  // Matrix excluded change handler
  const handleMatrixExcludedChange = async (updatedExcluded: string[]) => {
    if (!currentProject || !canManage) return;
    try {
      const updatedProj = await dbService.assignStaffToProject(
        currentProject.id,
        currentAssignedStaff,
        updatedExcluded,
        currentCompId,
      );
      setProjects((prev) =>
        prev.map((p) => (p.id === updatedProj.id ? updatedProj : p)),
      );
      loadProjects();
    } catch (err) {
      console.error("Failed to update excluded staff:", err);
    }
  };

  // Open modal to assign a single user across projects
  const openUserAssignmentModal = (user: UserProfile) => {
    setAssigningUser(user);
    const pids = user.projectIds || [];
    const hasGlobal = pids.includes("*") || isGlobalManagerRole(user.role);
    setUserIsGlobal(hasGlobal);
    setUserSelectedProjectIds(
      hasGlobal ? projects.map((p) => p.id) : pids.filter((p) => p !== "*"),
    );
  };

  // Save single user assignments
  const handleSaveUserAssignments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningUser || !canManage) return;

    setSaving(true);
    try {
      const finalProjectIds = userIsGlobal ? ["*"] : userSelectedProjectIds;
      const { user: updatedUser } = await dbService.assignUserToProjects(
        assigningUser.uid,
        finalProjectIds,
        currentCompId,
      );

      // Refresh local users & projects list
      setAllUsers((prev) =>
        prev.map((u) => (u.uid === updatedUser.uid ? updatedUser : u)),
      );
      const refreshedProjects = await dbService.getProjects(currentCompId);
      setProjects(refreshedProjects);
      loadProjects();

      // Audit log
      if (currentUser) {
        await writeAudit({
          companyId: currentCompId,
          projectId: "global",
          userId: currentUser.uid,
          userName: currentUser.fullName,
          userRole: currentUser.role,
          action: "UPDATE_USER_PROJECT_ASSIGNMENT",
          module: "Users",
          details: `Updated project access for ${assigningUser.fullName} (${assigningUser.email}): ${
            userIsGlobal
              ? "All Projects (Global Access)"
              : `${userSelectedProjectIds.length} projects assigned`
          }`,
          newValue: { projectIds: finalProjectIds },
        });
      }

      toast.success(
        `Project assignments for ${assigningUser.fullName} updated successfully`,
      );
      setAssigningUser(null);
    } catch (err) {
      console.error("Failed to update user project assignment:", err);
      toast.error("Failed to save project assignments");
    } finally {
      setSaving(false);
    }
  };

  // Filtered users for "by-user" mode
  const filteredUsers = useMemo(() => {
    const q = userSearchTerm.toLowerCase().trim();
    if (!q) return allUsers;
    return allUsers.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (ROLE_LABELS[u.role] &&
          ROLE_LABELS[u.role].toLowerCase().includes(q)) ||
        (u.department && u.department.toLowerCase().includes(q)),
    );
  }, [allUsers, userSearchTerm]);

  return (
    <div className="space-y-6 select-none">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
            <FolderKanban className="w-3.5 h-3.5" />
            <span>ISO 9001 Project Governance</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Project Staff Assignment Matrix
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Assign QA/QC Engineers, Site Inspectors, and Consultants to project
            workspaces with instant two-way synchronization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh sync button */}
          <button
            onClick={() => {
              loadData();
              toast.success("Rosters refreshed from database");
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin text-brand-600" : ""}`}
            />
            <span>Refresh</span>
          </button>

          {/* Jump to personnel directory */}
          <Link
            to="/company/users"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition"
          >
            <Users className="w-4 h-4" />
            <span>Personnel Directory</span>
          </Link>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("by-project")}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === "by-project"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Assignment by Project</span>
          </button>
          <button
            onClick={() => setViewMode("by-user")}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === "by-user"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Assignment by Personnel ({allUsers.length})</span>
          </button>
        </div>

        {/* Global info pill */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Executives & Directors auto-assigned across all projects</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODE A: ASSIGNMENT BY PROJECT
          ───────────────────────────────────────────────────────────── */}
      {viewMode === "by-project" && (
        <div className="space-y-6">
          {/* Project Selection Bar */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/30 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Target Project Workspace
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {currentProject?.name || "Select a Project"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                Switch Project:
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => handleSelectProject(e.target.value)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-brand-500 transition cursor-pointer max-w-[260px]"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Project Details Strip */}
          {currentProject && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="text-[10px] font-mono text-slate-400 uppercase">
                  Project Code
                </div>
                <div className="text-sm font-bold text-brand-600 dark:text-brand-400 font-mono mt-0.5">
                  {currentProject.code}
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="text-[10px] font-mono text-slate-400 uppercase">
                  Contractor
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                  {currentProject.contractorName || "Apex Construction JV"}
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="text-[10px] font-mono text-slate-400 uppercase">
                  Assigned Staff
                </div>
                <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {currentAssignedStaff.length} Roster Members
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="text-[10px] font-mono text-slate-400 uppercase">
                  Status
                </div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {currentProject.status || "ACTIVE"}
                </div>
              </div>
            </div>
          )}

          {/* The Embedded Project Assignment Matrix */}
          {currentProject ? (
            <ProjectAssignmentMatrix
              assignedStaff={currentAssignedStaff}
              onChange={handleMatrixChange}
              excludedStaffIds={currentExcludedStaff}
              onExcludedChange={handleMatrixExcludedChange}
              readOnly={!canManage}
              companyId={currentCompId}
              projectName={currentProject.name}
              projectCode={currentProject.code}
            />
          ) : (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-sm">
              No projects found in this company workspace.
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODE B: ASSIGNMENT BY PERSONNEL (DIRECTORY)
          ───────────────────────────────────────────────────────────── */}
      {viewMode === "by-user" && (
        <div className="space-y-4">
          {/* User Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Search personnel by name, email, role, or department..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-brand-500 text-slate-900 dark:text-white outline-none transition"
              />
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing {filteredUsers.length} of {allUsers.length} enterprise
              personnel
            </div>
          </div>

          {/* Personnel Table with Project Chips and Assign Button */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950/60 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role & Level</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Assigned Projects</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.map((u) => {
                    const roleLevel = ROLE_LEVELS[u.role] || 1;
                    const isGlobalMgr = isGlobalManagerRole(u.role);
                    const userProjIds = u.projectIds || [];
                    const hasGlobal =
                      isGlobalMgr ||
                      userProjIds.includes("*") ||
                      u.role === "SUPER_ADMIN";

                    return (
                      <tr
                        key={u.uid}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {u.fullName}
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500">
                            {u.email}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold ${
                                roleLevel >= 5
                                  ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                                  : roleLevel === 4
                                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                                    : roleLevel === 3
                                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              L{roleLevel}
                            </span>
                            <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                              {ROLE_LABELS[u.role] || u.role}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                          {u.department || "Field Engineering"}
                        </td>
                        <td className="py-3.5 px-4">
                          {hasGlobal ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <Sparkles className="w-3 h-3" />
                              All Projects (Global)
                            </span>
                          ) : userProjIds.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {userProjIds.map((pid) => {
                                const pObj = projects.find((p) => p.id === pid);
                                return (
                                  <span
                                    key={pid}
                                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] border border-slate-200 dark:border-slate-700"
                                    title={pObj?.name || pid}
                                  >
                                    {pObj?.code || pid}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-amber-500 font-medium">
                              Unassigned (0 Projects)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => openUserAssignmentModal(u)}
                            disabled={!canManage}
                            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 rounded-xl transition text-xs font-semibold inline-flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800 cursor-pointer disabled:opacity-50"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Assign Projects</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          USER ASSIGNMENT MODAL
          ───────────────────────────────────────────────────────────── */}
      {assigningUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Assign Projects: {assigningUser.fullName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {ROLE_LABELS[assigningUser.role] || assigningUser.role} •{" "}
                  {assigningUser.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssigningUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveUserAssignments}
              className="flex-1 overflow-y-auto py-4 space-y-4"
            >
              {/* Global Corporate Access Toggle */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    Global Access (All Projects)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Grant this user automatic access across all current and
                    future company projects.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={userIsGlobal}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setUserIsGlobal(checked);
                    if (checked) {
                      setUserSelectedProjectIds(projects.map((p) => p.id));
                    }
                  }}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Specific Project Checkboxes */}
              {!userIsGlobal && (
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                    Select Specific Project Assignments ({projects.length})
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {projects.map((proj) => {
                      const isSelected = userSelectedProjectIds.includes(
                        proj.id,
                      );
                      return (
                        <label
                          key={proj.id}
                          className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                            isSelected
                              ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setUserSelectedProjectIds((prev) => [
                                    ...prev,
                                    proj.id,
                                  ]);
                                } else {
                                  setUserSelectedProjectIds((prev) =>
                                    prev.filter((id) => id !== proj.id),
                                  );
                                }
                              }}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold flex items-center gap-1.5 truncate">
                                <span className="font-mono text-brand-600 dark:text-brand-400">
                                  [{proj.code}]
                                </span>
                                <span>{proj.name}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {proj.contractorName || "Contractor"} •{" "}
                                {proj.address || "Site Location"}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                            {proj.status}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAssigningUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Project Assignments"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
