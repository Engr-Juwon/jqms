import React, { useState, useMemo } from "react";
import { NavLink, useParams, useLocation } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { canAccessRoute, isBimEnabledForProject } from "@/lib/permissions";
import {
  LayoutDashboard,
  FlaskConical,
  AlertOctagon,
  CalendarClock,
  Grid,
  X,
  ClipboardCheck,
  HardHat,
  Award,
  Truck,
  MessageSquareWarning,
  FileWarning,
  FileCheck2,
  FileQuestion,
  Box,
  Building2,
  Compass,
  Layers,
  TrendingUp,
  FileSpreadsheet,
  Camera,
  Calculator,
  History,
  Settings,
  ChevronRight,
  ShieldCheck,
  FolderLock,
  MessageSquare,
  CheckCheck,
  FileText,
  ClipboardList,
  Scissors,
  Home,
  BookOpen,
  Wrench,
  Users,
  Briefcase,
  Calendar,
} from "lucide-react";

export const MobileBottomNav: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const { activeProject } = useProjectStore();
  const { currentUser } = useAuthStore();
  const currentProjId = projectId || activeProject?.id || "";

  const [showMoreDrawer, setShowMoreDrawer] = useState(false);

  // Do not render bottom nav bar when inside real-time chat so the composer is fully accessible
  if (location.pathname.includes("/chat")) {
    return null;
  }

  const getPath = (subpath: string) => {
    return currentProjId
      ? `/project/${currentProjId}${subpath}`
      : `/project${subpath}`;
  };

  const allPrimaryNavItems = [
    { to: getPath("/dashboard"), label: "Dashboard", icon: LayoutDashboard },
    { to: getPath("/approvals"), label: "Approvals", icon: CheckCheck },
    { to: getPath("/concrete"), label: "Concrete", icon: FlaskConical },
    { to: getPath("/ncrs"), label: "NCRs", icon: AlertOctagon },
  ];

  const primaryNavItems = useMemo(() => {
    return allPrimaryNavItems.filter((item) =>
      canAccessRoute(currentUser, item.to, activeProject),
    );
  }, [allPrimaryNavItems, currentUser, activeProject]);

  const drawerSections = [
    {
      title: "Command & Governance",
      items: [
        {
          to: getPath("/dashboard"),
          label: "Executive Dashboard",
          icon: LayoutDashboard,
          desc: "Executive project health metrics",
        },
        {
          to: getPath("/approvals"),
          label: "Approvals & Action Center",
          icon: CheckCheck,
          desc: "Pending signature & stamping queue",
        },
        {
          to: getPath("/reporting"),
          label: "Quality Analytics & KPIs",
          icon: TrendingUp,
          desc: "Compliance & defect analytics",
        },
        {
          to: getPath("/weekly-reports"),
          label: "Weekly Quality Reports",
          icon: FileSpreadsheet,
          desc: "ISO formal weekly dossiers",
        },
      ],
    },
    {
      title: "Technical & Submittals",
      items: [
        {
          to: getPath("/method-statements"),
          label: "Method Statements (RAMS)",
          icon: FileText,
          desc: "Work method & hazard matrix",
        },
        {
          to: getPath("/itp"),
          label: "Inspection & Test Plans (ITP)",
          icon: ClipboardList,
          desc: "Quality intervention matrices",
        },
        {
          to: getPath("/mar"),
          label: "Material Submittals (MAR)",
          icon: FileCheck2,
          desc: "Specification review & approvals",
        },
        {
          to: getPath("/rfi"),
          label: "Requests for Info (RFI)",
          icon: FileQuestion,
          desc: "Technical clarification queries",
        },
        {
          to: getPath("/documents"),
          label: "Document Control & Drawings",
          icon: FolderLock,
          desc: "Specifications & approved drawings",
        },
      ],
    },
    {
      title: "BIM & Spatial Assets",
      items: [
        {
          to: getPath("/elements"),
          label: "Element Register & 3D BIM",
          icon: Box,
          desc: "WebGL 3D model & asset QR tags",
        },
        {
          to: getPath("/grid-plan"),
          label: "2D Spatial Grid Plan",
          icon: Grid,
          desc: "Interactive level plans",
        },
        {
          to: getPath("/mto"),
          label: "Material Take-Off & MTO",
          icon: Layers,
          desc: "BIM component take-offs",
        },
        {
          to: getPath("/levels"),
          label: "Floor Level Hierarchy",
          icon: Building2,
          desc: "Building elevation storeys",
        },
        {
          to: getPath("/packages"),
          label: "Work Packages",
          icon: Briefcase,
          desc: "Contractor discipline scopes",
        },
        {
          to: getPath("/gridlines"),
          label: "Gridline Management",
          icon: Compass,
          desc: "Structural coordinate axis",
        },
      ],
    },
    {
      title: "Site Quality & Inspections",
      items: [
        {
          to: getPath("/inspections"),
          label: "Inspections & Hold Points",
          icon: ClipboardCheck,
          desc: "ISO 8.6 Quality inspection requests",
        },
        {
          to: getPath("/inspections/schedule"),
          label: "Inspection Scheduler",
          icon: Calendar,
          desc: "Witness & hold-point agenda",
        },
        {
          to: getPath("/ncrs"),
          label: "Non-Conformance (NCR)",
          icon: AlertOctagon,
          desc: "Defect rectification & CAPA logs",
        },
        {
          to: getPath("/site-instructions"),
          label: "Site Instructions (SI)",
          icon: FileWarning,
          desc: "Formal engineering instructions",
        },
        {
          to: getPath("/site-comments"),
          label: "Site Observations",
          icon: MessageSquareWarning,
          desc: "Field observations & snag notes",
        },
        {
          to: getPath("/qaqc-handbook"),
          label: "QA/QC SOP Field Manual",
          icon: BookOpen,
          desc: "Standard operating procedures",
        },
      ],
    },
    {
      title: "Concrete & Materials Lab",
      items: [
        {
          to: getPath("/permit-to-pour"),
          label: "Permit to Pour (PTP)",
          icon: HardHat,
          desc: "Pre-pour QA clearance gating",
        },
        {
          to: getPath("/concrete"),
          label: "Concrete Cube Tests",
          icon: FlaskConical,
          desc: "Compressive strength register",
        },
        {
          to: getPath("/steel"),
          label: "Steel Rebar Testing",
          icon: Award,
          desc: "Tensile & yield strength mill tests",
        },
        {
          to: getPath("/bar-cutting"),
          label: "Bar Bending Schedule (BBS)",
          icon: Scissors,
          desc: "Rebar cutting & bending schedules",
        },
        {
          to: getPath("/deliveries"),
          label: "Material Deliveries",
          icon: Truck,
          desc: "Site delivery ticketing",
        },
        {
          to: getPath("/mir"),
          label: "Material Inspections (MIR)",
          icon: ShieldCheck,
          desc: "Receiving & quality inspection",
        },
      ],
    },
    {
      title: "Field Diary & Handover",
      items: [
        {
          to: getPath("/daily-logs"),
          label: "Daily Site Log (Diary)",
          icon: BookOpen,
          desc: "Daily construction site diary",
        },
        {
          to: getPath("/punch-list"),
          label: "Punch List & Handover (TOC)",
          icon: Home,
          desc: "Room-by-room snags & TOC handover",
        },
        {
          to: getPath("/photos"),
          label: "Site Photo Gallery",
          icon: Camera,
          desc: "Progress & evidence photo library",
        },
        {
          to: getPath("/planner"),
          label: "4D Quality Planner",
          icon: CalendarClock,
          desc: "Milestone & lookahead calendar",
        },
        {
          to: getPath("/chat"),
          label: "Team Chat & Groups",
          icon: MessageSquare,
          desc: "Direct & project channel messaging",
        },
        {
          to: getPath("/calculators"),
          label: "Engineering Calculators",
          icon: Calculator,
          desc: "Volume, w/c ratio & curing calculators",
        },
      ],
    },
    {
      title: "Company Administration",
      items: [
        {
          to: activeProject
            ? `/company/projects/${activeProject.id}/edit`
            : "/company/projects",
          label: "Project Settings & Matrix",
          icon: Settings,
          desc: "Specification & personnel matrix",
        },
        {
          to: "/company/users",
          label: "Company Personnel",
          icon: Users,
          desc: "Staff accounts & access levels",
        },
        {
          to: "/company/trades",
          label: "Master Trades & Subtrades",
          icon: Wrench,
          desc: "Construction discipline catalogue",
        },
        {
          to: "/company/inspections",
          label: "Inspection Templates",
          icon: FileText,
          desc: "Standard checklist templates",
        },
        {
          to: "/company/audit",
          label: "System Audit Trail",
          icon: History,
          desc: "Traceable change history log",
        },
        {
          to: "/company/settings",
          label: "Company Settings",
          icon: Settings,
          desc: "Organization branding & policies",
        },
      ],
    },
  ];

  const visibleDrawerSections = useMemo(() => {
    return drawerSections
      .map((sec) => ({
        ...sec,
        items: sec.items.filter((item) =>
          canAccessRoute(currentUser, item.to, activeProject),
        ),
      }))
      .filter((sec) => sec.items.length > 0);
  }, [drawerSections, currentUser, activeProject]);

  return (
    <>
      {/* Slide-up "More Modules" Full Mobile Drawer */}
      {showMoreDrawer && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setShowMoreDrawer(false)}
          />
          <div className="relative z-10 w-full max-h-[85vh] bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Drawer Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center shadow shrink-0">
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
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>JQMS Enterprise</span>
                    <span className="px-1.5 py-0.2 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 font-mono text-[9px] font-bold">
                      ISO 9001
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                    {activeProject?.name || "All Quality Modules"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMoreDrawer(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="overflow-y-auto p-4 space-y-5 divide-y divide-slate-100 dark:divide-slate-800/60 pb-8">
              {visibleDrawerSections.map((sec, idx) => (
                <div key={sec.title} className={idx > 0 ? "pt-4" : ""}>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5 px-1">
                    {sec.title}
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {sec.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => setShowMoreDrawer(false)}
                          className={({ isActive }) =>
                            `p-2.5 rounded-2xl flex items-center justify-between transition ${
                              isActive
                                ? "bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300"
                                : "hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-transparent"
                            }`
                          }
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex-shrink-0">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold truncate">
                                {item.label}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {item.desc}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Drawer Brand Footer */}
              <div className="pt-6 pb-2 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <img
                    src="/assets/jqms-icon.png"
                    alt="JQMS"
                    className="w-5 h-5 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/jqms-icon.png";
                    }}
                  />
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                    JQMS Enterprise
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  ISO 9001:2015 Civil Infrastructure Quality System
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 backdrop-blur-md px-2 py-1 flex items-center justify-around shadow-2xl">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-semibold transition flex-1 ${
                  isActive
                    ? "text-brand-600 dark:text-brand-400 font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`
              }
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* More / All Modules Button */}
        <button
          onClick={() => setShowMoreDrawer(!showMoreDrawer)}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-semibold transition flex-1 ${
            showMoreDrawer
              ? "text-brand-600 dark:text-brand-400 font-bold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Grid className="w-4 h-4 mb-0.5" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
};
