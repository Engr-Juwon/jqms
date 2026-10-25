import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Shield,
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Lock,
  UserCheck,
  UserX,
  Sparkles,
  HardHat,
  Filter,
  CheckSquare,
  Square,
  Building2,
  Info,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { UserProfile, UserRole } from "@/types";
import { dbService } from "@/lib/db";
import {
  ROLE_LABELS,
  ROLE_BADGE_COLORS,
  getRoleLevel,
  isGlobalManagerRole,
  isQAQCEngineerRole,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/useAuthStore";

interface ProjectAssignmentMatrixProps {
  assignedStaff: string[];
  onChange: (updatedStaff: string[]) => void;
  excludedStaffIds?: string[];
  onExcludedChange?: (updatedExcluded: string[]) => void;
  readOnly?: boolean;
  companyId?: string;
  projectName?: string;
  projectCode?: string;
}

export const ProjectAssignmentMatrix: React.FC<
  ProjectAssignmentMatrixProps
> = ({
  assignedStaff = [],
  onChange,
  excludedStaffIds = [],
  onExcludedChange,
  readOnly = false,
  companyId,
  projectName = "Project Workspace",
  projectCode = "PRJ",
}) => {
  const { currentUser, company } = useAuthStore();
  const currentCompId =
    companyId || currentUser?.companyId || company?.id || "";

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");

  useEffect(() => {
    const loadStaff = async () => {
      setLoading(true);
      try {
        const rawStaff = await dbService.getUsers(currentCompId);
        const superAdminUids = new Set(
          rawStaff.filter((u) => u.role === "SUPER_ADMIN").map((u) => u.uid),
        );
        // Exclude SUPER_ADMIN from assignment matrix
        const staffList = rawStaff.filter((u) => u.role !== "SUPER_ADMIN");
        // If logged-in user is not in the list, ensure they are represented (except SUPER_ADMIN)
        if (
          currentUser &&
          currentUser.role !== "SUPER_ADMIN" &&
          !staffList.some((u) => u.uid === currentUser.uid)
        ) {
          staffList.unshift(currentUser);
        }
        setUsers(staffList);

        // Cleanse legacy assignedStaff array if it contains SUPER_ADMIN uids
        let cleanAssigned = assignedStaff;
        if (assignedStaff.some((uid) => superAdminUids.has(uid))) {
          cleanAssigned = assignedStaff.filter(
            (uid) => !superAdminUids.has(uid),
          );
          onChange(cleanAssigned);
        }
      } catch (err) {
        console.error(
          "Failed to load company users for assignment matrix:",
          err,
        );
      } finally {
        setLoading(false);
      }
    };
    loadStaff();
  }, [currentCompId, currentUser]);

  // Categorize users
  const categorizedUsers = useMemo(() => {
    const managers: UserProfile[] = [];
    const qaqcEngineers: UserProfile[] = [];
    const siteOperations: UserProfile[] = [];
    const externalParties: UserProfile[] = [];

    users.forEach((user) => {
      if (user.role === "SUPER_ADMIN") return;
      if (isGlobalManagerRole(user.role)) {
        managers.push(user);
      } else if (isQAQCEngineerRole(user.role)) {
        qaqcEngineers.push(user);
      } else if (
        [
          "CLIENT_REPRESENTATIVE",
          "CONSULTANT",
          "THIRD_PARTY_INSPECTOR",
          "SUB_CONTRACTOR",
          "SUPPLIER_VENDOR",
        ].includes(user.role)
      ) {
        externalParties.push(user);
      } else {
        siteOperations.push(user);
      }
    });

    return {
      managers,
      qaqcEngineers,
      siteOperations,
      externalParties,
    };
  }, [users]);

  const currentUserLevel = currentUser?.role
    ? getRoleLevel(currentUser.role)
    : 1;
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  // Check if a user is assigned
  const isAssigned = (user: UserProfile): boolean => {
    if (user.role === "SUPER_ADMIN") return false;
    // Corporate Executive Managers are automatically assigned across all projects
    if (isGlobalManagerRole(user.role)) return true;
    // QA/QC & Site Personnel must be explicitly assigned to project roster
    return assignedStaff.includes(user.uid);
  };

  // Toggle single user assignment
  const handleToggleUser = (user: UserProfile) => {
    if (readOnly) return;
    if (user.role === "SUPER_ADMIN") return;
    // Executive Managers are locked to all projects
    if (isGlobalManagerRole(user.role)) return;

    let updated: string[];
    if (assignedStaff.includes(user.uid)) {
      updated = assignedStaff.filter((uid) => uid !== user.uid);
      toast.success(`${user.fullName} unassigned from project`);
    } else {
      updated = [...assignedStaff, user.uid];
      toast.success(`${user.fullName} assigned to project`);
    }
    onChange(updated);
  };

  // Bulk actions
  const handleAssignAllQAQC = () => {
    if (readOnly) return;
    if (currentUserLevel < 5 && !isSuperAdmin) {
      toast.error(
        "Permission Denied: Only Level 5 can modify QA/QC Engineer assignments.",
      );
      return;
    }
    const qaqcUids = categorizedUsers.qaqcEngineers.map((u) => u.uid);
    const nextExcluded = excludedStaffIds.filter(
      (uid) => !qaqcUids.includes(uid),
    );
    const nextAssigned = Array.from(new Set([...assignedStaff, ...qaqcUids]));
    if (onExcludedChange) onExcludedChange(nextExcluded);
    onChange(nextAssigned);
    toast.success("All QA/QC Engineers assigned to project");
  };

  const handleRemoveAllQAQC = () => {
    if (readOnly) return;
    if (currentUserLevel < 5 && !isSuperAdmin) {
      toast.error(
        "Permission Denied: Only Level 5 can modify QA/QC Engineer assignments.",
      );
      return;
    }
    const qaqcUids = categorizedUsers.qaqcEngineers.map((u) => u.uid);
    const nextExcluded = Array.from(
      new Set([...excludedStaffIds, ...qaqcUids]),
    );
    const nextAssigned = assignedStaff.filter((uid) => !qaqcUids.includes(uid));
    if (onExcludedChange) onExcludedChange(nextExcluded);
    onChange(nextAssigned);
    toast.success("All non-manager QA/QC Engineers removed from project");
  };

  const handleAssignAllSiteOps = () => {
    if (readOnly) return;
    const siteUids = categorizedUsers.siteOperations.map((u) => u.uid);
    const updated = Array.from(new Set([...assignedStaff, ...siteUids]));
    onChange(updated);
    toast.success("All site operations staff assigned to project");
  };

  const handleResetToDefaults = () => {
    if (readOnly) return;
    if (currentUserLevel < 5 && !isSuperAdmin) {
      toast.error(
        "Permission Denied: Only Level 5 can reset matrix assignments.",
      );
      return;
    }
    // Defaults = All Global Managers (automatic) + All QAQC Engineers (none excluded)
    if (onExcludedChange) onExcludedChange([]);
    const defaultUids = [
      ...categorizedUsers.managers.map((u) => u.uid),
      ...categorizedUsers.qaqcEngineers.map((u) => u.uid),
    ];
    onChange(Array.from(new Set(defaultUids)));
    toast.success("Matrix reset to ISO defaults: All QA/QC Engineers included");
  };

  // Filtered users for display
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (user.role === "SUPER_ADMIN") return false;
      const matchSearch =
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ROLE_LABELS[user.role] &&
          ROLE_LABELS[user.role]
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (user.department &&
          user.department.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      if (selectedGroup === "MANAGERS") return isGlobalManagerRole(user.role);
      if (selectedGroup === "QAQC") return isQAQCEngineerRole(user.role);
      if (selectedGroup === "SITE_OPS") {
        return (
          !isGlobalManagerRole(user.role) &&
          !isQAQCEngineerRole(user.role) &&
          ![
            "CLIENT_REPRESENTATIVE",
            "CONSULTANT",
            "THIRD_PARTY_INSPECTOR",
            "SUB_CONTRACTOR",
            "SUPPLIER_VENDOR",
          ].includes(user.role)
        );
      }
      if (selectedGroup === "EXTERNAL") {
        return [
          "CLIENT_REPRESENTATIVE",
          "CONSULTANT",
          "THIRD_PARTY_INSPECTOR",
          "SUB_CONTRACTOR",
          "SUPPLIER_VENDOR",
        ].includes(user.role);
      }
      if (selectedGroup === "ASSIGNED") return isAssigned(user);
      if (selectedGroup === "UNASSIGNED") return !isAssigned(user);

      return true;
    });
  }, [users, searchTerm, selectedGroup, assignedStaff, excludedStaffIds]);

  // Statistics
  const totalAssignedCount = useMemo(() => {
    return users.filter((u) => isAssigned(u)).length;
  }, [users, assignedStaff, excludedStaffIds]);

  const assignedQAQCCount = useMemo(() => {
    return categorizedUsers.qaqcEngineers.filter((u) => isAssigned(u)).length;
  }, [categorizedUsers.qaqcEngineers, assignedStaff, excludedStaffIds]);

  const assignedSiteOpsCount = useMemo(() => {
    return categorizedUsers.siteOperations.filter((u) => isAssigned(u)).length;
  }, [categorizedUsers.siteOperations, assignedStaff]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <div className="w-8 h-8 border-4 border-[#ea580c] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold">
          Loading Personnel Assignment Matrix...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ═══ Header Notice & Rules Banner ═══ */}
      <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-white rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                ISO 9001:2015 Governance &amp; Security Matrix
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Project Personnel Assignment Matrix
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Define staff authorized to access and issue QA/QC dossiers,
              inspection checklists, and testing reports for{" "}
              <strong className="text-amber-600 dark:text-amber-300">
                {projectName}
              </strong>{" "}
              ({projectCode}).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!readOnly && (
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 dark:border-white/10"
                title="Reset to ISO Default Matrix: All Governance Managers + All QA/QC Engineers"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />
                <span>Reset to ISO Defaults</span>
              </button>
            )}
          </div>
        </div>

        {/* Matrix Rules Checklist */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
          <div className="flex items-start gap-2 bg-slate-50/80 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-purple-900 dark:text-purple-300 block">
                Managers (Except CM):
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                Automatically assigned to all company projects for executive
                oversight.
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-slate-50/80 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-900 dark:text-emerald-300 block">
                QA/QC Engineers:
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                Automatically added to all projects. Can only be removed or
                re-added by Level 5 (Directors &amp; Executives).
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-slate-50/80 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <HardHat className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-900 dark:text-amber-300 block">
                CM &amp; Field Staff:
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                Construction Manager (CM), site engineers, and foremen are
                assigned per project.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ KPI Summary Cards ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Assigned
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {totalAssignedCount}
            </span>
            <span className="text-xs text-slate-400">
              / {users.length} staff
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
            Governance Managers
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-purple-700 dark:text-purple-300">
              {categorizedUsers.managers.length}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
              Global Auto
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            QA/QC Engineers
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
              {assignedQAQCCount}
            </span>
            <span className="text-xs text-slate-400">
              / {categorizedUsers.qaqcEngineers.length}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            Site Ops &amp; CM
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-700 dark:text-amber-300">
              {assignedSiteOpsCount}
            </span>
            <span className="text-xs text-slate-400">
              / {categorizedUsers.siteOperations.length}
            </span>
          </div>
        </div>
      </div>

      {/* ═══ Filter & Search Toolbar ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter staff by name, role, email, or department..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        {/* Group Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: "ALL", label: `All (${users.length})` },
            { id: "ASSIGNED", label: `Assigned (${totalAssignedCount})` },
            {
              id: "MANAGERS",
              label: `Managers (${categorizedUsers.managers.length})`,
            },
            {
              id: "QAQC",
              label: `QA/QC (${categorizedUsers.qaqcEngineers.length})`,
            },
            {
              id: "SITE_OPS",
              label: `Site Ops & CM (${categorizedUsers.siteOperations.length})`,
            },
            {
              id: "EXTERNAL",
              label: `External (${categorizedUsers.externalParties.length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedGroup(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedGroup === tab.id
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Bulk Action Helpers (When viewing QA/QC or Site Ops) ═══ */}
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
          <div className="flex items-center gap-2">
            {(currentUserLevel >= 5 || isSuperAdmin) && (
              <>
                <button
                  type="button"
                  onClick={handleAssignAllQAQC}
                  className="text-[#ea580c] hover:underline font-semibold flex items-center gap-1"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Assign All QA/QC (Level 5)</span>
                </button>
                <span className="text-slate-300 dark:text-slate-700">•</span>
              </>
            )}
            <button
              type="button"
              onClick={handleAssignAllSiteOps}
              className="text-slate-600 dark:text-slate-400 hover:underline font-semibold flex items-center gap-1"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Assign All Site Staff</span>
            </button>
          </div>

          {(currentUserLevel >= 5 || isSuperAdmin) && (
            <button
              type="button"
              onClick={handleRemoveAllQAQC}
              className="text-slate-500 hover:text-red-500 hover:underline font-medium flex items-center gap-1"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Unassign QA/QC (Level 5)</span>
            </button>
          )}
        </div>
      )}

      {/* ═══ Personnel Matrix Table / Cards ═══ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => {
              const assigned = isAssigned(user);
              const isManager = isGlobalManagerRole(user.role);
              const isQAQC = isQAQCEngineerRole(user.role);
              const roleLevel = getRoleLevel(user.role);
              const canModifyQAQC = currentUserLevel >= 5 || isSuperAdmin;
              const isProtectedFromUser = isManager
                ? true
                : isQAQC
                  ? !canModifyQAQC
                  : !isSuperAdmin &&
                    currentUserLevel < 5 &&
                    roleLevel >= currentUserLevel;

              return (
                <div
                  key={user.uid}
                  onClick={() =>
                    !isManager && !isProtectedFromUser && handleToggleUser(user)
                  }
                  className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                    isManager
                      ? "bg-purple-50/40 dark:bg-purple-950/10"
                      : isProtectedFromUser
                        ? "bg-slate-50/50 dark:bg-slate-800/30 cursor-not-allowed opacity-80"
                        : assigned
                          ? "bg-emerald-50/30 dark:bg-emerald-950/10 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 cursor-pointer"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer opacity-75 hover:opacity-100"
                  }`}
                >
                  {/* Left: User Identity */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                        isManager
                          ? "bg-purple-600 text-white border-purple-400 shadow-sm"
                          : isQAQC
                            ? "bg-emerald-600 text-white border-emerald-400"
                            : "bg-slate-800 text-slate-200 border-slate-700"
                      }`}
                    >
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.fullName}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        user.fullName.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {user.fullName}
                        </span>
                        {isManager && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Global Manager</span>
                          </span>
                        )}
                        {isQAQC && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                            <span>QA/QC Staff</span>
                            {!canModifyQAQC && (
                              <Lock className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                            )}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                            ROLE_BADGE_COLORS[roleLevel] || ROLE_BADGE_COLORS[1]
                          }`}
                        >
                          L{roleLevel} • {ROLE_LABELS[user.role] || user.role}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                        <span>{user.email}</span>
                        {user.department && (
                          <>
                            <span>•</span>
                            <span className="hidden md:inline truncate">
                              {user.department}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Assignment Status & Toggle */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-right hidden sm:block">
                      {isManager ? (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-purple-700 dark:text-purple-300">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                          <span>All Projects (Governance)</span>
                        </div>
                      ) : assigned ? (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            {isQAQC ? "Assigned (Auto)" : "Assigned to Project"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-500 dark:text-rose-400">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>
                            {isQAQC ? "Excluded by L5" : "Not Assigned"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Interactive Toggle Switch */}
                    {isManager ? (
                      <div
                        className="px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 border border-purple-200 dark:border-purple-800 cursor-not-allowed"
                        title="Managers are automatically assigned across all projects for statutory ISO 9001 governance"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Locked</span>
                      </div>
                    ) : isProtectedFromUser ? (
                      <div
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-not-allowed"
                        title={
                          isQAQC
                            ? "Only Level 5 (Quality Director / Executive Management) can add or remove QA/QC Engineers"
                            : `Cannot manage personnel at or above your governance tier (Level ${roleLevel} >= Level ${currentUserLevel})`
                        }
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{isQAQC ? "L5 Required" : "Protected"}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleUser(user);
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                          assigned
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                            : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {assigned ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Assigned</span>
                          </>
                        ) : (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            <span>Assign +</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              No staff members matching "{searchTerm}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
