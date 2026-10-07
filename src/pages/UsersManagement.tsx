import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Pencil,
  RefreshCw,
} from "lucide-react";
import { UserRole, UserProfile } from "../types";
import {
  ROLE_LEVELS,
  ROLE_TITLES,
  isGlobalManagerRole,
  isQAQCEngineerRole,
} from "../lib/permissions";
import { hasPermission } from "../lib/rbac";
import { useAuthStore } from "../stores/useAuthStore";
import { dbService } from "../lib/db";
import { writeAudit } from "../lib/audit";
import { RBACMatrixViewer } from "../components/common/RBACMatrixViewer";
import toast from "react-hot-toast";

export const UsersManagement: React.FC = () => {
  const { currentUser, company } = useAuthStore();
  const currentCompId =
    currentUser?.companyId || company?.id || "comp-apex-civil";

  const [activeTab, setActiveTab] = useState<"users" | "matrix">("users");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit Details State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("SITE_ENGINEER");
  const [editDesignation, setEditDesignation] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const canManageUsers =
    hasPermission(currentUser?.role, "MANAGE_USERS") ||
    (currentUser?.role ? (ROLE_LEVELS[currentUser.role] || 1) >= 4 : false);
  const currentUserLevel = currentUser?.role
    ? ROLE_LEVELS[currentUser.role] || 1
    : 1;

  // Level 4+ can manage subordinate accounts (Levels 1-3).
  // Level 5 executives can manage all subordinate accounts.
  // Users can also edit their own personal details/designations.
  const canManageTargetUser = (targetUser: UserProfile): boolean => {
    if (!currentUser) return false;
    if (currentUser.uid === targetUser.uid) return true; // Allow self-editing personal details
    if (!canManageUsers) return false;
    if (currentUser.role === "SUPER_ADMIN") return true;
    const targetLevel = ROLE_LEVELS[targetUser.role] || 1;
    return currentUserLevel > targetLevel;
  };

  // Filter assignable roles for the user provisioning form:
  // Subordinates only for Level 4 (cannot assign Level 4 or Level 5)
  const assignableRoles = useMemo(() => {
    return Object.entries(ROLE_TITLES).filter(([rKey]) => {
      if (currentUser?.role === "SUPER_ADMIN") return true;
      const lvl = ROLE_LEVELS[rKey as UserRole] || 1;
      return lvl < currentUserLevel;
    });
  }, [currentUser, currentUserLevel]);

  const defaultRole = (assignableRoles[0]?.[0] as UserRole) || "SITE_ENGINEER";

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    const list = await dbService.getUsers(currentCompId);
    if (list.length === 0 && currentUser) {
      list.push(currentUser);
    }
    setUsers(list);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, [currentCompId]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageUsers) {
      toast.error(
        "Permission Denied: You do not have authority to provision user accounts.",
      );
      return;
    }
    if (!name || !email) return;

    const roleLevel = ROLE_LEVELS[role] || 1;
    if (currentUser?.role !== "SUPER_ADMIN" && roleLevel >= currentUserLevel) {
      toast.error(
        `Permission Denied: As a Level ${currentUserLevel} authority, you can only assign roles strictly below your governance tier (Level < ${currentUserLevel}).`,
      );
      return;
    }

    // ONLY Corporate Executives / Governance Managers (Super Admin, Quality Director, Exec Mgmt, PM, Ops Mgr) get global project access by default.
    // QA/QC engineers and site inspectors are assigned project-specifically.
    const isAutoProjectAccess = isGlobalManagerRole(role);
    const newUser: UserProfile = {
      uid: `usr-${Date.now()}`,
      email,
      fullName: name,
      role,
      title: designation.trim() || undefined,
      designation: designation.trim() || undefined,
      companyId: currentCompId,
      department: department || "Field Quality & Assurance",
      projectIds: isAutoProjectAccess ? ["*"] : [],
      projectAccess: isAutoProjectAccess ? { "*": true } : {},
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };

    await dbService.saveUser(newUser);

    if (currentUser) {
      await writeAudit({
        companyId: currentCompId,
        projectId: currentUser.lastActiveProjectId || "global",
        userId: currentUser.uid,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: "PROVISION_USER",
        module: "Settings",
        details: `Provisioned user account for ${name} (${email}) with role ${role} (Level ${roleLevel}) and title/designation "${designation}"`,
        newValue: newUser,
      });
    }

    setShowAddModal(false);
    setName("");
    setEmail("");
    setRole(defaultRole);
    setDesignation("");
    setDepartment("");
    toast.success(`User ${name} provisioned successfully`);
    loadUsers();
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!canManageTargetUser(editingUser)) {
      toast.error(
        `Permission Denied: You cannot modify this account.`,
      );
      return;
    }

    const isSelf = currentUser?.uid === editingUser.uid;
    const finalRole = (isSelf && currentUser?.role !== "SUPER_ADMIN") ? editingUser.role : editRole;
    const targetLevel = ROLE_LEVELS[finalRole] || 1;

    if (
      !isSelf &&
      currentUser?.role !== "SUPER_ADMIN" &&
      targetLevel >= currentUserLevel
    ) {
      toast.error(
        `Permission Denied: As a Level ${currentUserLevel} authority, you can only assign roles strictly below your tier (Level < ${currentUserLevel}).`,
      );
      return;
    }

    const isAutoProjectAccess = isGlobalManagerRole(finalRole);
    const updated: UserProfile = {
      ...editingUser,
      fullName: editFullName.trim() || editingUser.fullName,
      role: finalRole,
      title: editDesignation.trim() || undefined,
      designation: editDesignation.trim() || undefined,
      department: editDepartment.trim() || undefined,
      phone: editPhone.trim() || undefined,
      projectIds: isAutoProjectAccess
        ? editingUser.projectIds?.includes("*")
          ? editingUser.projectIds
          : ["*"]
        : editingUser.projectIds?.filter((p) => p !== "*") || [],
      projectAccess: isAutoProjectAccess
        ? { ...(editingUser.projectAccess || {}), "*": true }
        : editingUser.projectAccess || {},
      updatedAt: new Date().toISOString(),
    };

    await dbService.saveUser(updated);
    setUsers((prev) => prev.map((u) => (u.uid === updated.uid ? updated : u)));

    // Immediately reflect changes to current active user session if self-editing
    if (currentUser?.uid === updated.uid) {
      useAuthStore.getState().setUser(updated);
      try {
        await useAuthStore.getState().refreshUserProfile();
      } catch {}
    }

    if (currentUser) {
      await writeAudit({
        companyId: currentCompId,
        projectId: currentUser.lastActiveProjectId || "global",
        userId: currentUser.uid,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: "UPDATE_USER_DETAILS",
        module: "Settings",
        details: `Updated user ${updated.fullName} (${updated.email}) particulars: role=${finalRole}, designation="${editDesignation}"`,
        newValue: updated,
      });
    }

    toast.success(`User ${updated.fullName} updated successfully`);
    setEditingUser(null);
  };

  const toggleStatus = async (user: UserProfile) => {
    if (currentUser?.uid === user.uid) {
      toast.error("You cannot deactivate your own account.");
      return;
    }
    if (!canManageTargetUser(user)) {
      toast.error(
        `Permission Denied: You can only modify personnel strictly below your governance tier (Level < ${currentUserLevel}).`,
      );
      return;
    }
    const nextStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const updated: UserProfile = { ...user, status: nextStatus };
    await dbService.saveUser(updated);
    setUsers(users.map((u) => (u.uid === user.uid ? updated : u)));

    if (currentUser?.uid === updated.uid) {
      useAuthStore.getState().setUser(updated);
    }

    if (currentUser) {
      await writeAudit({
        companyId: currentCompId,
        projectId: currentUser.lastActiveProjectId || "global",
        userId: currentUser.uid,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: "UPDATE_USER_STATUS",
        module: "Settings",
        details: `Set status of user ${user.fullName} (${user.email}) to ${nextStatus}`,
        newValue: updated,
      });
    }
    toast.success(`User ${user.fullName} marked as ${nextStatus}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-1 sm:top-2 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-md dark:shadow-xl transition-colors">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            User Access & 5-Tier Role Governance
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage enterprise team accounts, inspect statutory responsibilities
            (Level 1 to 5), and govern project authorities.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadUsers();
              toast.success("Personnel directory refreshed from live database");
            }}
            title="Refresh Personnel Directory"
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`}
            />
            <span>Sync</span>
          </button>
          {canManageUsers ? (
            <button
              onClick={() => {
                setRole(defaultRole);
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition"
            >
              <UserPlus className="w-4 h-4" />
              Provision New User
            </button>
          ) : (
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              User Provisioning Restricted (Level 4+ Required)
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "users"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Users className="w-4 h-4" />
          Active Personnel ({users.length})
        </button>
        <button
          onClick={() => setActiveTab("matrix")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "matrix"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Statutory RBAC Governance Matrix
        </button>
      </div>

      {activeTab === "matrix" ? (
        <RBACMatrixViewer defaultRole={currentUser?.role} />
      ) : (
        <>
          {/* Role Matrix Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[
              {
                level: "Level 5",
                name: "Executive & Admin",
                roles:
                  "Super Admin, Quality Director, Quality Manager, Exec Mgmt",
                color:
                  "border-purple-500/40 text-purple-600 dark:text-purple-400",
              },
              {
                level: "Level 4",
                name: "Statutory Quality Leads",
                roles:
                  "Project Manager, Sr QA/QC, Deputy QM, QA/QC Eng, Lead Auditor",
                color:
                  "border-indigo-500/40 text-indigo-600 dark:text-indigo-400",
              },
              {
                level: "Level 3",
                name: "Senior Technical / CM",
                roles:
                  "Const Mgr, Materials Eng, Mechanical, Electrical, Plumbing, Lab Mgr, QA Inspector",
                color: "border-blue-500/40 text-blue-600 dark:text-blue-400",
              },
              {
                level: "Level 2",
                name: "Field Production",
                roles: "Site Eng, Technician, Surveyor, Foreman",
                color: "border-amber-500/40 text-amber-600 dark:text-amber-400",
              },
              {
                level: "Level 1",
                name: "Third Party & Vendors",
                roles: "Consultant, Subcontractor, Client Rep, Supplier",
                color:
                  "border-slate-300 dark:border-slate-500/40 text-slate-600 dark:text-slate-400",
              },
            ].map((tier, idx) => (
              <div
                key={idx}
                className={`p-4 bg-white dark:bg-slate-900 rounded-xl border ${tier.color} shadow-sm flex flex-col justify-between`}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {tier.level}
                  </span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                    {tier.name}
                  </div>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {tier.roles}
                </div>
              </div>
            ))}
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Active Personnel & Role Allocations ({users.length})
                </h2>
                {currentUserLevel < 5 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    As Level {currentUserLevel}, you can govern accounts and
                    roles below your tier (Level &lt; {currentUserLevel}).
                  </p>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950/60 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role & Level</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Projects</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((u) => {
                    const roleLevel = ROLE_LEVELS[u.role] || 2;
                    const canManageThis = canManageTargetUser(u);
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
                            <div>
                              <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                {ROLE_TITLES[u.role] || u.role}
                              </div>
                              {u.designation && (
                                <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                                  {u.designation}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                          {u.department || "QA/QC Department"}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-slate-700">
                            {u.projectIds?.includes("*")
                              ? "All Projects"
                              : `${u.projectIds?.length || 1} Projects`}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => toggleStatus(u)}
                            disabled={!canManageThis}
                            title={
                              !canManageThis
                                ? `Cannot modify account at or above your governance tier (Level ${roleLevel} >= Level ${currentUserLevel})`
                                : `Toggle status`
                            }
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition ${
                              u.status === "ACTIVE"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                            } ${!canManageThis ? "opacity-60 cursor-not-allowed" : ""}`}
                          >
                            {u.status || "ACTIVE"}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {canManageThis ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingUser(u);
                                  setEditFullName(u.fullName || "");
                                  setEditRole(u.role);
                                  setEditDesignation(u.designation || u.title || "");
                                  setEditDepartment(u.department || "");
                                  setEditPhone(u.phone || "");
                                }}
                                className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 rounded-lg transition text-xs font-semibold inline-flex items-center gap-1 border border-indigo-200 dark:border-indigo-800"
                                title="Edit Role & Designation"
                              >
                                <Pencil className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => toggleStatus(u)}
                                className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition text-xs font-medium"
                              >
                                {u.status === "ACTIVE"
                                  ? "Deactivate"
                                  : "Activate"}
                              </button>
                            </div>
                          ) : (
                            <span
                              title={`Protected account (Level ${roleLevel} >= Level ${currentUserLevel})`}
                              className="text-[11px] text-slate-400 dark:text-slate-500 font-medium italic inline-flex items-center gap-1"
                            >
                              <Lock className="w-3 h-3" />
                              Protected
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Provision Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Provision Enterprise User
            </h3>

            {currentUserLevel < 5 && currentUser?.role !== "SUPER_ADMIN" && (
              <div className="p-3 mb-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-indigo-500" />
                <span>
                  As a Level {currentUserLevel} manager, you can provision and
                  assign roles to personnel strictly below your tier (Levels 1
                  to {currentUserLevel - 1}).
                </span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Liam Sterling"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. liam.s@apexconstruct.com"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Assigned Role (Allowed Subordinate Tiers)
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none"
                >
                  {assignableRoles.map(([rKey, rLabel]) => (
                    <option key={rKey} value={rKey}>
                      {rLabel} (Level {ROLE_LEVELS[rKey as UserRole]})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Designation / Working Title (Optional)
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Lead Site QA/QC, Structural Engineer, Resident Architect"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  The official working title that will appear on site sign-offs
                  and certificates.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Department / Company
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Structural QA/QC Engineering"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow transition"
                >
                  Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role & Designation Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Pencil className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Edit Role & Designation
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Modify corporate governance role, functional designation, and
              department for <strong>{editingUser.fullName}</strong>.
            </p>

            <form onSubmit={handleSaveUserEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {editingUser.uid === currentUser?.uid && currentUser?.role !== "SUPER_ADMIN" ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Governance Role (Assigned by Corporate)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${ROLE_TITLES[editingUser.role] || editingUser.role} (Level ${ROLE_LEVELS[editingUser.role] || 1})`}
                    className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Statutory governance roles are assigned by Corporate Administration.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Governance Role (Tier Governance)
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    {assignableRoles.map(([rKey, rLabel]) => (
                      <option key={rKey} value={rKey}>
                        {rLabel} (Level {ROLE_LEVELS[rKey as UserRole]})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Designation / Official Title
                </label>
                <input
                  type="text"
                  value={editDesignation}
                  onChange={(e) => setEditDesignation(e.target.value)}
                  placeholder="e.g. Lead Site QA/QC, Senior Structural Engineer"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  The formal designation entered here will appear on site
                  instructions, permits, chat messages, and inspection records.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Department / Organization
                </label>
                <input
                  type="text"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  placeholder="e.g. Quality Assurance & Control"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 234-5678"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
