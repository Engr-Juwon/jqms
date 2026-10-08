import React from "react";
import { NavLink } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useUiStore } from "@/stores/useUiStore";
import { useOnboardingStore } from "@/stores/useOnboardingStore";
import { hasMinRole, isQAQCUser, canAccessRoute } from "@/lib/permissions";
import {
  LayoutDashboard,
  Box,
  AlertOctagon,
  ClipboardCheck,
  ClipboardList,
  MessageSquare,
  Truck,
  CalendarClock,
  Camera,
  FolderLock,
  Calculator,
  History,
  Settings,
  Users,
  Wrench,
  TrendingUp,
  FileText,
  ChevronRight,
  HardHat,
  CheckCheck,
  Building2,
  Home,
  X,
  BookOpen,
  GraduationCap,
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { activeProject } = useProjectStore();
  const { isMobileSidebarOpen, closeMobileSidebar } = useUiStore();
  const startTour = useOnboardingStore((s) => s.startTour);

  const isLvl3 = hasMinRole(currentUser?.role, 3);
  const isLvl4 = hasMinRole(currentUser?.role, 4);
  const isQAQC = isQAQCUser(currentUser);

  const NAV_SECTIONS = [
    {
      title: "Command & Governance",
      items: [
        {
          label: "Executive Dashboard",
          path: "/project/dashboard",
          icon: LayoutDashboard,
          dataTour: "nav-dashboard",
        },
        {
          label: "Approvals & Action Center",
          path: "/project/approvals",
          icon: CheckCheck,
          dataTour: "nav-approvals",
        },
        {
          label: "Quality Analytics & Reports",
          path: "/project/reporting",
          icon: TrendingUp,
        },
      ],
    },
    {
      title: "Site Quality & Compliance",
      items: [
        {
          label: "Inspections & Hold Points",
          path: "/project/inspections",
          icon: ClipboardCheck,
          dataTour: "nav-inspections",
        },
        {
          label: "Non-Conformance (NCR)",
          path: "/project/ncrs",
          icon: AlertOctagon,
          dataTour: "nav-ncr",
        },
        {
          label: "QA/QC Submittals & ITP",
          path: "/project/itp",
          icon: ClipboardList,
          dataTour: "nav-itp",
        },
        {
          label: "Daily Site Log & Diary",
          path: "/project/daily-logs",
          icon: BookOpen,
        },
      ],
    },
    {
      title: "Concrete & Materials Lab",
      items: [
        {
          label: "Permit to Pour (PTP)",
          path: "/project/permit-to-pour",
          icon: HardHat,
          dataTour: "nav-permit",
        },
        {
          label: "Material Deliveries & MIR",
          path: "/project/deliveries",
          icon: Truck,
        },
      ],
    },
    {
      title: "BIM & Spatial Twin",
      items: [
        {
          label: "BIM & Asset Register (2D-7D)",
          path: "/project/elements",
          icon: Box,
        },
      ],
    },
    {
      title: "Site Utilities & Operations",
      items: [
        {
          label: "Document Control & Vault",
          path: "/project/documents",
          icon: FolderLock,
        },
        {
          label: "Site Photos Gallery",
          path: "/project/photos",
          icon: Camera,
        },
        {
          label: "Punch List & Handover",
          path: "/project/punch-list",
          icon: Home,
          dataTour: "nav-punch-list",
        },
        {
          label: "4D Quality Planner",
          path: "/project/planner",
          icon: CalendarClock,
        },
        {
          label: "Team Chat & Messages",
          path: "/project/chat",
          icon: MessageSquare,
        },
        {
          label: "Engineering Calculators",
          path: "/project/calculators",
          icon: Calculator,
        },
        {
          label: "Project Settings",
          path: activeProject
            ? `/company/projects/${activeProject.id}/edit`
            : "/company/projects",
          icon: Settings,
          dataTour: "nav-settings",
        },
      ],
    },
    {
      title: "Company Administration",
      items: [
        {
          label: "Company Personnel",
          path: "/company/users",
          icon: Users,
        },
        {
          label: "Master Trades & Subtrades",
          path: "/company/trades",
          icon: Wrench,
        },
        {
          label: "Inspection Templates",
          path: "/company/inspections",
          icon: FileText,
        },
        {
          label: "System Audit Trail",
          path: "/company/audit",
          icon: History,
        },
        {
          label: "Company Settings",
          path: "/company/settings",
          icon: Settings,
          dataTour: "nav-settings",
        },
      ],
    },
  ];

  // Dynamically filter navigation sections and items based on role-based route permissions
  const visibleSections = React.useMemo(() => {
    return NAV_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        canAccessRoute(currentUser, item.path),
      ),
    })).filter((section) => section.items.length > 0);
  }, [NAV_SECTIONS, currentUser]);

  const renderSidebarContent = (isMobile = false) => (
    <>
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 shrink-0 transition-colors duration-200">
        <NavLink
          to="/project/dashboard"
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center shadow-md group-hover:scale-105 transition shrink-0">
            <img
              src="/assets/jqms-icon.png"
              alt="JQMS"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/jqms-icon.png";
              }}
            />
          </div>
          <div>
            <div className="font-black text-sm tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>JQMS</span>
              <span className="px-1.5 py-0.2 rounded bg-brand-500/10 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400 font-mono text-[10px] border border-brand-500/30 font-bold">
                ISO 9001
              </span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide truncate max-w-[130px]">
              Civil Quality Platform
            </div>
          </div>
        </NavLink>

        {isMobile && (
          <button
            onClick={closeMobileSidebar}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Project Selector Mini Context */}
      <NavLink
        to="/projects"
        onClick={() => isMobile && closeMobileSidebar()}
        className="mx-3 mt-3 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 transition flex items-center justify-between group shrink-0"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Context
            </div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-300 truncate">
              {activeProject?.name || "Select Project"}
            </div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition shrink-0" />
      </NavLink>

      {/* Nav Menu Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {visibleSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1.5">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {section.title}
            </div>
            {section.items.map((item, iIdx) => (
              <NavLink
                key={iIdx}
                to={item.path}
                onClick={() => isMobile && closeMobileSidebar()}
                data-tour={(item as any).dataTour}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition group ${
                    isActive
                      ? "bg-brand-600 text-white font-semibold shadow-md shadow-brand-600/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/80"
                  }`
                }
              >
                <div className="flex items-center gap-2.5 truncate">
                  <item.icon className="w-4 h-4 shrink-0 transition group-hover:text-brand-600 dark:group-hover:text-brand-400" />
                  <span className="truncate">{item.label}</span>
                </div>
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* Take a Tour button */}
      {!isMobile && (
        <div className="px-3 pb-1">
          <button
            onClick={startTour}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition cursor-pointer"
          >
            <GraduationCap className="w-4 h-4 shrink-0" />
            <span>🎓 Take a Tour</span>
          </button>
        </div>
      )}

      {/* Offline Status indicator hint at bottom */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/60 text-[11px] text-slate-500 flex items-center justify-between shrink-0">
        <span className="truncate">Vault: jqms-offline-vault</span>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>
    </>
  );

  return (
    <>
      {/* ─── DESKTOP SIDEBAR (Large screens >= 1024px) ─── */}
      <aside
        data-tour="sidebar"
        className="hidden lg:flex w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex-col h-screen sticky top-0 overflow-hidden shrink-0 select-none transition-colors duration-200"
      >
        {renderSidebarContent(false)}
      </aside>

      {/* ─── MOBILE DRAWER (Small & Medium screens < 1024px) ─── */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop overlay */}
          <div
            onClick={closeMobileSidebar}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          />

          {/* Off-canvas panel */}
          <aside className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 z-10 flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-300 select-none transition-colors duration-200">
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
