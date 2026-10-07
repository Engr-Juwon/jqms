import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useUiStore } from "@/stores/useUiStore";
import {
  ROLE_TITLES,
  getRoleLevel,
  isQAQCUser,
  getUserSigningTitle,
} from "@/lib/permissions";
import {
  Building2,
  ChevronDown,
  Bell,
  User,
  Shield,
  LogOut,
  FolderKanban,
  Settings as SettingsIcon,
  Building,
  Menu,
  Edit3,
  BookOpen,
  MessageSquare,
  CheckCheck,
  UserCheck,
} from "lucide-react";
import { useCompany } from "@/lib/companyHelper";

import { ProjectLevelSelector } from "./ProjectLevelSelector";
import { useThemeStore } from "@/stores/useThemeStore";
import { useOfflineStore } from "@/stores/useOfflineStore";
import { Sun, Moon } from "lucide-react";
import { dbService } from "@/lib/db";

export const Header: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { isOnline, queuedItems, isSyncing, latencyMs } = useOfflineStore();
  const { currentUser, logout } = useAuthStore();
  const { name: companyName, logoUrl: companyLogo } = useCompany();
  const { projects, activeProject, setActiveProject } = useProjectStore();
  const { theme, toggleTheme } = useThemeStore();
  const { toggleMobileSidebar } = useUiStore();
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  React.useEffect(() => {
    const refreshCount = () => {
      if (currentUser?.uid) {
        const count = dbService.getAllChannelsUnreadCount(
          currentUser.companyId || "comp-apex-civil",
          currentUser.uid,
        );
        setChatUnreadCount(count);
      }
    };

    // Calculate count initially
    refreshCount();

    const handleUnread = (e: any) => {
      if (typeof e.detail?.unreadCount === "number") {
        setChatUnreadCount(e.detail.unreadCount);
      } else {
        refreshCount();
      }
    };

    window.addEventListener("jqms-chat-unread-updated", handleUnread);
    window.addEventListener("jqms-chat-message-sent", refreshCount);
    window.addEventListener("jqms-chat-messages-read", refreshCount);
    window.addEventListener("jqms-chat-channels-updated", refreshCount);

    return () => {
      window.removeEventListener("jqms-chat-unread-updated", handleUnread);
      window.removeEventListener("jqms-chat-message-sent", refreshCount);
      window.removeEventListener("jqms-chat-messages-read", refreshCount);
      window.removeEventListener("jqms-chat-channels-updated", refreshCount);
    };
  }, [currentUser?.uid, currentUser?.companyId]);

  const roleLevel = currentUser?.role ? getRoleLevel(currentUser.role) : 1;
  const isQAQC = isQAQCUser(currentUser);
  const displayTitle = getUserSigningTitle(currentUser);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header
      className={`h-16 px-3 sm:px-4 md:px-6 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between gap-2 sm:gap-4 transition-colors duration-200 shrink-0 ${className}`}
    >
      {/* Left: Hamburger (Mobile) + Project Selector + Level Selector */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Sidebar Hamburger Button */}
        <button
          onClick={toggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 active:scale-95 transition flex-shrink-0"
          aria-label="Open Navigation Menu"
          title="Open Menu"
        >
          <Menu className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        </button>

        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowProjectMenu(!showProjectMenu)}
            className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-sm transition max-w-[140px] sm:max-w-[220px] md:max-w-[260px]"
          >
            <Building2 className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0" />
            <span className="truncate">
              {activeProject?.name || "Select Project"}
            </span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-brand-500/10 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 font-mono text-[10px] flex-shrink-0 font-bold">
              {activeProject?.code || "PRJ"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          </button>

          {/* Project Switcher Dropdown */}
          {showProjectMenu && (
            <div className="absolute top-full left-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                Switch Project Workspace
              </div>
              {activeProject && roleLevel >= 4 && (
                <div className="p-1 border-b border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setShowProjectMenu(false);
                      navigate(`/company/projects/${activeProject.id}/edit`);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-xs bg-brand-500/10 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 font-semibold hover:bg-brand-500/20 dark:hover:bg-brand-500/30 transition"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Edit3 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        Edit {activeProject.name} &amp; Matrix
                      </span>
                    </div>
                    <span className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-800 dark:text-brand-200 shrink-0">
                      Settings
                    </span>
                  </button>
                </div>
              )}
              <div className="max-h-60 overflow-y-auto py-1 space-y-1">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActiveProject(p);
                      setShowProjectMenu(false);
                      navigate(`/project/dashboard`);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs text-left transition ${
                      activeProject?.id === p.id
                        ? "bg-brand-600 text-white font-semibold shadow-sm"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="truncate">
                      <div className="font-medium truncate">{p.name}</div>
                      <div className="text-[10px] opacity-75">
                        {p.clientName}
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-black/20 font-mono text-[10px]">
                      {p.code}
                    </span>
                  </button>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1">
                <button
                  onClick={() => {
                    setShowProjectMenu(false);
                    navigate("/company/projects");
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition"
                >
                  <FolderKanban className="w-3.5 h-3.5 text-slate-500" />
                  <span>All Projects</span>
                </button>
                {activeProject && roleLevel >= 4 && (
                  <button
                    onClick={() => {
                      setShowProjectMenu(false);
                      navigate(`/company/projects/${activeProject.id}/edit`);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs text-brand-600 dark:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Project</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Global Project Level Selector */}
        {activeProject && (
          <div className="hidden sm:block">
            <ProjectLevelSelector variant="header" />
          </div>
        )}
      </div>

      {/* Right Controls: Streamlined Essential Actions */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* User Active Title / Role Badge (Desktop) */}
        {currentUser && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
            <Shield className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {displayTitle}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-brand-500/10 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 font-bold text-[10px]">
              L{roleLevel}
            </span>
          </div>
        )}

        {/* Approvals Action Center Shortcut */}
        <button
          onClick={() =>
            navigate(projectId ? `/project/${projectId}/approvals` : "/project/approvals")
          }
          className="relative p-2 rounded-xl text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 border border-transparent hover:border-brand-200 dark:hover:border-brand-800/60 transition"
          title="Sign-Off & Approval Action Center"
        >
          <CheckCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
        </button>

        {/* Team Chat Shortcut */}
        <button
          onClick={() =>
            navigate(projectId ? `/project/${projectId}/chat` : "/project/chat")
          }
          className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Team Chat & Project Groups"
        >
          <MessageSquare className="w-4 h-4" />
          {chatUnreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-emerald-600 text-white font-mono text-[9px] font-black flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
              {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
            </span>
          )}
        </button>

        {/* Notifications Shortcut */}
        <button
          onClick={() => navigate("/project/notifications")}
          className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Notification Center"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* Night / Day Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title={
            theme === "dark"
              ? "Switch to Day Mode (Light Theme)"
              : "Switch to Night Mode (Dark Theme)"
          }
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-brand-600" />
          )}
        </button>

        {/* Real-time Network Connectivity Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition select-none ${
            !isOnline
              ? "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
              : isSyncing
              ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
              : queuedItems.length > 0
              ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
              : "bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
          }`}
          title={
            !isOnline
              ? "Offline Mode: Changes saved to local IDB vault"
              : isSyncing
              ? "Syncing queued changes to cloud..."
              : queuedItems.length > 0
              ? `${queuedItems.length} items queued in local vault`
              : latencyMs !== null
              ? `Live Connection (${latencyMs}ms latency)`
              : "Connected to Server"
          }
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                !isOnline ? "bg-red-400" : isSyncing ? "bg-amber-400" : "bg-emerald-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                !isOnline ? "bg-red-500" : isSyncing ? "bg-amber-500" : "bg-emerald-500"
              }`}
            />
          </span>
          <span className="hidden sm:inline font-mono text-[11px]">
            {!isOnline
              ? "Offline"
              : isSyncing
              ? "Syncing"
              : queuedItems.length > 0
              ? `${queuedItems.length} Queued`
              : latencyMs !== null
              ? `${latencyMs}ms`
              : "Online"}
          </span>
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.fullName}
                className="w-7 h-7 rounded-full object-cover border border-brand-400 shadow-sm"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-xs border border-brand-400 shadow-sm">
                {currentUser?.fullName?.charAt(0) || "U"}
              </div>
            )}
            <span className="hidden md:block text-xs font-semibold text-slate-800 dark:text-slate-200">
              {currentUser?.fullName?.split(" ")[0] || "User"}
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute top-full right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-2 z-50">
              <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  {currentUser?.fullName}
                </div>
                <div className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 truncate mt-0.5">
                  {displayTitle}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {currentUser?.email}
                </div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  {companyLogo ? (
                    <img
                      src={companyLogo}
                      alt={companyName}
                      className="w-5 h-5 rounded object-contain bg-slate-100 dark:bg-white/5 p-0.5 border border-slate-200 dark:border-slate-700"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center text-[10px] font-bold border border-brand-500/30">
                      <Building className="w-3 h-3" />
                    </div>
                  )}
                  <span className="text-[11px] text-brand-600 dark:text-brand-300 font-semibold truncate">
                    {companyName}
                  </span>
                </div>
              </div>
              <div className="py-1 space-y-0.5">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate(projectId ? `/project/${projectId}/profile` : "/project/profile");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-brand-950/40 hover:text-brand-600 dark:hover:text-brand-400 transition"
                >
                  <UserCheck className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>My Profile & Details</span>
                </button>
                {roleLevel >= 4 && (
                  <>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate("/company/settings");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <SettingsIcon className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      <span>Company Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate("/company/users");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <User className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      <span>Company Personnel</span>
                    </button>
                  </>
                )}
                <div className="border-t border-slate-100 dark:border-slate-800/80 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
