import React, { useState, useEffect, useMemo, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useUiStore } from "@/stores/useUiStore";
import { useOnboardingStore } from "@/stores/useOnboardingStore";
import {
  canAccessRoute,
  isBimEnabledForProject,
  canManageProjectFeatures,
} from "@/lib/permissions";
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
  ChevronLeft,
  HardHat,
  CheckCheck,
  Building2,
  Home,
  X,
  BookOpen,
  GraduationCap,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  LayoutGrid,
  Layers,
  Bell,
  User,
  FlaskConical,
  Maximize2,
  ExternalLink,
} from "lucide-react";

export type DomainId =
  | "all-pages"
  | "governance"
  | "quality"
  | "concrete"
  | "bim"
  | "operations"
  | "admin";

export interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  dataTour?: string;
  badge?: string;
}

export interface NavDomain {
  id: DomainId;
  title: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  tagline: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { currentUser } = useAuthStore();
  const { activeProject } = useProjectStore();
  const {
    isMobileSidebarOpen,
    closeMobileSidebar,
    isSecondarySidebarCollapsed,
    toggleSecondarySidebar,
    setSecondarySidebarCollapsed,
    isAllPagesModalOpen,
    openAllPagesModal,
    closeAllPagesModal,
  } = useUiStore();
  const startTour = useOnboardingStore((s) => s.startTour);
  const isTourActive = useOnboardingStore((s) => s.isActive);

  // If tour starts, ensure secondary sidebar is expanded
  useEffect(() => {
    if (isTourActive && isSecondarySidebarCollapsed) {
      setSecondarySidebarCollapsed(false);
    }
  }, [isTourActive, isSecondarySidebarCollapsed, setSecondarySidebarCollapsed]);

  // Search/filter query for items within secondary panel
  const [searchQuery, setSearchQuery] = useState("");
  // Search query inside the Mega Directory Modal
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [modalDomainFilter, setModalDomainFilter] = useState<string>("all");

  // Hovered domain on rail when collapsed (for flyout preview)
  const [hoveredDomainId, setHoveredDomainId] = useState<DomainId | null>(null);
  const flyoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Master domain definitions with ALL pages across JQMS
  const NAV_DOMAINS: NavDomain[] = useMemo(
    () => [
      {
        id: "governance",
        title: "Command & Governance",
        shortLabel: "Gov",
        icon: LayoutDashboard,
        tagline: "Executive KPIs, Approvals & Reporting",
        items: [
          {
            label: "Executive Dashboard",
            path: "/project/dashboard",
            icon: LayoutDashboard,
            description: "Live KPIs, active alerts & project status",
            dataTour: "nav-dashboard",
          },
          {
            label: "Approvals & Action Center",
            path: "/project/approvals",
            icon: CheckCheck,
            description: "Pending hold points & consultant submittals",
            dataTour: "nav-approvals",
          },
          {
            label: "Quality Analytics & Reports",
            path: "/project/reporting",
            icon: TrendingUp,
            description: "ISO 9001 compliance trends, graphs & analytics",
          },
          {
            label: "Weekly Quality Reports",
            path: "/project/weekly-reports",
            icon: FileText,
            description: "Multi-section site inspection & progress reports",
          },
          {
            label: "System Notifications",
            path: "/project/notifications",
            icon: Bell,
            description: "Alerts, review mentions & activity notices",
          },
          {
            label: "User Profile & Signature",
            path: "/project/profile",
            icon: User,
            description: "Digital signature, qualifications & credentials",
          },
        ],
      },
      {
        id: "quality",
        title: "Site Quality & Compliance",
        shortLabel: "Quality",
        icon: ClipboardCheck,
        tagline: "Inspections, NCRs, ITPs & Daily Logs",
        items: [
          {
            label: "Inspections & Hold Points",
            path: "/project/inspections",
            icon: ClipboardCheck,
            description: "Work inspection requests (WIR) & approvals",
            dataTour: "nav-inspections",
          },
          {
            label: "Inspection Schedule & Timetable",
            path: "/project/inspections/schedule",
            icon: CalendarClock,
            description: "Upcoming hold point bookings & calendar",
          },
          {
            label: "Non-Conformance (NCR)",
            path: "/project/ncrs",
            icon: AlertOctagon,
            description: "Defect notices, root cause analysis & CAR workflow",
            dataTour: "nav-ncr",
          },
          {
            label: "Site Instructions & Directives",
            path: "/project/site-instructions",
            icon: FileText,
            description: "Architect/engineer instructions & warnings",
          },
          {
            label: "Site Comments & Snags",
            path: "/project/site-comments",
            icon: MessageSquare,
            description: "Daily field snagging walk notes & observations",
          },
          {
            label: "QA/QC Submittals & ITP",
            path: "/project/itp",
            icon: ClipboardList,
            description: "Inspection & Test Plans and quality gate matrix",
            dataTour: "nav-itp",
          },
          {
            label: "Requests for Information (RFI)",
            path: "/project/rfi",
            icon: BookOpen,
            description: "Technical queries & design clarifications",
          },
          {
            label: "QA/QC SOP Handbook",
            path: "/project/qaqc-handbook",
            icon: GraduationCap,
            description: "Standard operating procedures & ISO field guide",
          },
          {
            label: "Daily Site Log & Diary",
            path: "/project/daily-logs",
            icon: BookOpen,
            description: "Weather, site activities, labour & plant diary",
          },
        ],
      },
      {
        id: "concrete",
        title: "Concrete & Materials Lab",
        shortLabel: "Lab",
        icon: HardHat,
        tagline: "Pour Permits, Cubes & Reinforcement",
        items: [
          {
            label: "Permit to Pour (PTP)",
            path: "/project/permit-to-pour",
            icon: HardHat,
            description: "Pre-pour verification & consultant sign-off",
            dataTour: "nav-permit",
          },
          {
            label: "Concrete Batching & Cube Tests",
            path: "/project/concrete",
            icon: FlaskConical,
            description: "Slump tests, batching tickets & 7d/28d compression",
          },
          {
            label: "Steel Reinforcement & BBS",
            path: "/project/steel",
            icon: Wrench,
            description: "Rebar mill certs, heat numbers & inventory",
          },
          {
            label: "Bar Cutting Schedule & Registry",
            path: "/project/bar-cutting",
            icon: FileText,
            description: "Bar bending schedules & cutting optimization",
          },
          {
            label: "Material Deliveries & Inbound",
            path: "/project/deliveries",
            icon: Truck,
            description: "Delivery tickets, receiving log & quarantine",
            dataTour: "nav-mir",
          },
          {
            label: "Material Approval Requests (MAR)",
            path: "/project/mar",
            icon: ClipboardList,
            description: "TDS approvals, samples & manufacturer specs",
          },
          {
            label: "Material Inspection Reports (MIR)",
            path: "/project/mir",
            icon: Truck,
            description: "Receiving verification against approved MAR",
          },
        ],
      },
      {
        id: "bim",
        title: "BIM & Spatial Twin",
        shortLabel: "BIM",
        icon: Box,
        tagline: "3D Digital Twin & 2D-7D Asset Models",
        items: [
          {
            label: "BIM & Asset Register (2D-7D)",
            path: "/project/elements",
            icon: Box,
            description: "Master structural elements directory & passports",
          },
          {
            label: "Interactive Grid Plan",
            path: "/project/grid-plan",
            icon: Layers,
            description: "Architectural floor plans with element pins",
          },
          {
            label: "3D Digital Twin Viewer",
            path: "/project/bim-3d",
            icon: Box,
            description: "Interactive Three.js 3D model with QA overlays",
          },
          {
            label: "5D Cost & Quantity Takeoff",
            path: "/project/5d-cost",
            icon: Calculator,
            description: "Bill of quantities, unit rates & cost analysis",
          },
          {
            label: "6D Carbon & Sustainability",
            path: "/project/6d-carbon",
            icon: TrendingUp,
            description: "Embodied carbon calculation & CO2 metrics",
          },
          {
            label: "Floor Levels & Vertical Zones",
            path: "/project/levels",
            icon: Layers,
            description: "Foundation, basement & floor-by-floor management",
          },
          {
            label: "Work Packages & Disciplines",
            path: "/project/packages",
            icon: Wrench,
            description: "Structural, architectural, MEP work packages",
          },
          {
            label: "Gridlines & Axis Matrix",
            path: "/project/gridlines",
            icon: Layers,
            description: "Structural gridlines, axes coordinates & plans",
          },
          {
            label: "Material Takeoff (MTO)",
            path: "/project/mto",
            icon: FileText,
            description: "Concrete volume schedules & rebar tonnage totals",
          },
        ],
      },
      {
        id: "operations",
        title: "Site Utilities & Operations",
        shortLabel: "Ops",
        icon: FolderLock,
        tagline: "Vault, RAMS, Photos, Punch List & Chat",
        items: [
          {
            label: "Document Control & Vault",
            path: "/project/documents",
            icon: FolderLock,
            description: "Approved drawings, specs, transmittals & files",
          },
          {
            label: "Method Statements & RAMS",
            path: "/project/method-statements",
            icon: FileText,
            description: "Risk assessments & safe systems of work",
          },
          {
            label: "Site Photos Gallery",
            path: "/project/photos",
            icon: Camera,
            description: "Geotagged site progress photos & photo markup",
          },
          {
            label: "Punch List & Handover",
            path: "/project/punch-list",
            icon: Home,
            description: "Snagging items, closeout items & handover",
            dataTour: "nav-punch-list",
          },
          {
            label: "4D Construction Planner",
            path: "/project/planner",
            icon: CalendarClock,
            description: "Interactive Gantt timeline & milestones",
          },
          {
            label: "Team Chat & Messages",
            path: "/project/chat",
            icon: MessageSquare,
            description: "Project communications & trade channels",
          },
          {
            label: "Engineering Calculators",
            path: "/project/calculators",
            icon: Calculator,
            description: "Concrete mix, rebar weight & unit converters",
          },
          {
            label: "Project Settings",
            path: activeProject
              ? `/company/projects/${activeProject.id}/edit`
              : "/company/projects",
            icon: Settings,
            description: "Active project parameters, metadata & tolerances",
            dataTour: "nav-settings",
          },
        ],
      },
      {
        id: "admin",
        title: "Company Administration",
        shortLabel: "Admin",
        icon: Building2,
        tagline: "Portfolio, Users, Trades & Governance",
        items: [
          {
            label: "All Projects Switcher",
            path: "/projects",
            icon: Building2,
            description: "Switch active project or browse company sites",
          },
          {
            label: "Company Project Portfolio",
            path: "/company/projects",
            icon: Building2,
            description: "Multi-project dashboard & creation wizard",
          },
          {
            label: "Company Personnel",
            path: "/company/users",
            icon: Users,
            description: "Team members, roles, permissions & signatures",
          },
          {
            label: "Project Staff Assignments",
            path: "/company/assignments",
            icon: CheckCheck,
            description: "Assign staff & inspectors to project rosters & matrix",
          },
          {
            label: "Master Trades & Subtrades",
            path: "/company/trades",
            icon: Wrench,
            description: "Global trade directory & contractor assignments",
          },
          {
            label: "Inspection Templates",
            path: "/company/inspections",
            icon: FileText,
            description: "Master checklist templates & inspection standards",
          },
          {
            label: "System Audit Trail",
            path: "/company/audit",
            icon: History,
            description: "Immutable security audit log & user action records",
          },
          {
            label: "Company Settings",
            path: "/company/settings",
            icon: Settings,
            description: "Organization branding, ISO 9001 policies & headers",
            dataTour: "nav-settings",
          },
          ...(activeProject && canManageProjectFeatures(currentUser, activeProject)
            ? [
                {
                  label: "BIM (2D-7D) Feature Controls",
                  path: `/company/projects/${activeProject.id}/edit?tab=bim`,
                  icon: Box,
                  description: "Toggle & configure 2D-7D BIM access for this project",
                },
              ]
            : []),
        ],
      },
    ],
    [activeProject, currentUser],
  );

  // Filter items by user role permissions and granular project-level feature flags
  const visibleDomains = useMemo(() => {
    return NAV_DOMAINS.map((domain) => ({
      ...domain,
      items: domain.items.filter((item) =>
        canAccessRoute(currentUser, item.path, activeProject),
      ),
    })).filter((domain) => domain.items.length > 0);
  }, [NAV_DOMAINS, currentUser, activeProject]);

  // Total count of accessible pages
  const totalAccessiblePages = useMemo(() => {
    return visibleDomains.reduce((acc, d) => acc + d.items.length, 0);
  }, [visibleDomains]);

  // Determine which domain corresponds to current URL path
  const currentPathDomainId = useMemo<DomainId>(() => {
    for (const domain of visibleDomains) {
      if (
        domain.items.some(
          (item) =>
            location.pathname === item.path ||
            (item.path !== "/" &&
              location.pathname.startsWith(item.path) &&
              item.path !== "/company/projects"),
        )
      ) {
        return domain.id;
      }
    }
    return visibleDomains[0]?.id || "governance";
  }, [visibleDomains, location.pathname]);

  // Selected domain state for the secondary drawer
  const [selectedDomainId, setSelectedDomainId] =
    useState<DomainId>(currentPathDomainId);

  // Sync selected domain when user navigates to a route from another domain
  useEffect(() => {
    if (selectedDomainId !== "all-pages") {
      setSelectedDomainId(currentPathDomainId);
    }
  }, [currentPathDomainId]);

  // Get active domain object (if not in "all-pages" mode)
  const activeDomain = useMemo(() => {
    return (
      visibleDomains.find((d) => d.id === selectedDomainId) ||
      visibleDomains[0] ||
      NAV_DOMAINS[0]
    );
  }, [visibleDomains, selectedDomainId, NAV_DOMAINS]);

  // Search filtering logic for active domain items
  const filteredActiveItems = useMemo(() => {
    if (!searchQuery.trim()) return activeDomain.items;
    const q = searchQuery.toLowerCase().trim();
    return activeDomain.items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)),
    );
  }, [activeDomain, searchQuery]);

  // All pages grouped for "All Pages" view, filtered by searchQuery
  const filteredAllPagesGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return visibleDomains
      .map((domain) => ({
        ...domain,
        items: q
          ? domain.items.filter(
              (item) =>
                item.label.toLowerCase().includes(q) ||
                (item.description &&
                  item.description.toLowerCase().includes(q)),
            )
          : domain.items,
      }))
      .filter((group) => group.items.length > 0);
  }, [visibleDomains, searchQuery]);

  // Modal filtered groups
  const modalFilteredGroups = useMemo(() => {
    const q = modalSearchQuery.toLowerCase().trim();
    return visibleDomains
      .filter((d) =>
        modalDomainFilter === "all" ? true : d.id === modalDomainFilter,
      )
      .map((domain) => ({
        ...domain,
        items: q
          ? domain.items.filter(
              (item) =>
                item.label.toLowerCase().includes(q) ||
                (item.description &&
                  item.description.toLowerCase().includes(q)),
            )
          : domain.items,
      }))
      .filter((group) => group.items.length > 0);
  }, [visibleDomains, modalSearchQuery, modalDomainFilter]);

  // Cross-domain matches when searching inside a specific domain
  const crossDomainMatches = useMemo(() => {
    if (!searchQuery.trim() || selectedDomainId === "all-pages") return [];
    const q = searchQuery.toLowerCase().trim();
    return visibleDomains
      .filter((d) => d.id !== activeDomain.id)
      .map((d) => ({
        domain: d,
        items: d.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            (item.description && item.description.toLowerCase().includes(q)),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [visibleDomains, activeDomain.id, searchQuery, selectedDomainId]);

  // Domain hover handlers for collapsed rail flyout
  const handleDomainMouseEnter = (domainId: DomainId) => {
    if (flyoutTimeoutRef.current) clearTimeout(flyoutTimeoutRef.current);
    setHoveredDomainId(domainId);
  };

  const handleDomainMouseLeave = () => {
    flyoutTimeoutRef.current = setTimeout(() => {
      setHoveredDomainId(null);
    }, 200);
  };

  const handleDomainClick = (domainId: DomainId) => {
    setSelectedDomainId(domainId);
    if (isSecondarySidebarCollapsed) {
      setSecondarySidebarCollapsed(false);
    }
    setHoveredDomainId(null);
  };

  useEffect(() => {
    const handleTourDomain = (e: Event) => {
      const custom = e as CustomEvent<{ domainId: DomainId }>;
      if (custom.detail?.domainId) {
        handleDomainClick(custom.detail.domainId);
      }
    };
    window.addEventListener("jqms-tour-select-domain", handleTourDomain);
    return () =>
      window.removeEventListener("jqms-tour-select-domain", handleTourDomain);
  }, [isSecondarySidebarCollapsed]);

  // Hovered domain object for flyout menu
  const hoveredDomain = useMemo(() => {
    if (!hoveredDomainId) return null;
    return visibleDomains.find((d) => d.id === hoveredDomainId) || null;
  }, [visibleDomains, hoveredDomainId]);

  // ─────────────────────────────────────────────────────────────
  // PRIMARY RAIL COMPONENT (w-16, 64px)
  // ─────────────────────────────────────────────────────────────
  const renderPrimaryRail = (isMobile = false) => (
    <div
      data-tour="primary-rail"
      className={`w-16 bg-slate-900 dark:bg-slate-950 text-slate-400 border-r border-slate-800 flex flex-col items-center justify-between h-full py-3 shrink-0 select-none relative z-30 transition-colors duration-200`}
    >
      {/* Top: Brand Logo Icon */}
      <div className="flex flex-col items-center w-full shrink-0">
        <NavLink
          to="/project/dashboard"
          onClick={() => isMobile && closeMobileSidebar()}
          data-tour="rail-brand"
          className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 p-1 flex items-center justify-center shadow-lg transition-all group relative"
          title="JQMS Civil Quality Platform (ISO 9001)"
        >
          <img
            src="/assets/jqms-icon.png"
            alt="JQMS"
            className="w-full h-full object-contain group-hover:scale-105 transition"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/jqms-icon.png";
            }}
          />
          {/* Subtle online dot */}
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
        </NavLink>
        <div className="w-8 h-px bg-slate-800/80 my-2.5" />
      </div>

      {/* Middle: All Pages Launcher + Domain Icons */}
      <div className="flex-1 flex flex-col items-center gap-1.5 w-full px-1.5 overflow-y-auto overflow-x-hidden scrollbar-none py-1">
        {/* ALL PAGES DIRECTORY LAUNCHER BUTTON */}
        <div className="relative w-full flex justify-center group mb-1">
          {selectedDomainId === "all-pages" && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-brand-500 rounded-r-full shadow-sm shadow-brand-500/50" />
          )}
          <button
            type="button"
            onClick={() => handleDomainClick("all-pages")}
            data-tour="all-pages-launcher"
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all duration-150 relative cursor-pointer ${
              selectedDomainId === "all-pages"
                ? "bg-brand-600 text-white shadow-lg shadow-brand-600/30 ring-1 ring-brand-400/50 font-semibold scale-102"
                : "text-slate-400 hover:text-white hover:bg-slate-800/80"
            }`}
            title="All Pages Directory & Site Map"
          >
            <LayoutGrid className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="text-[9px] font-bold tracking-tight mt-0.5">
              All
            </span>
          </button>

          {/* Tooltip on hover */}
          {!isSecondarySidebarCollapsed && (
            <div className="hidden lg:group-hover:flex absolute left-full ml-2.5 top-1/2 -translate-y-1/2 z-50 pointer-events-none items-center">
              <div className="bg-slate-900 border border-slate-700/80 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5">
                  <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
                  All Pages Directory
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  View all {totalAccessiblePages} modules & tools
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="w-6 h-px bg-slate-800/60 my-0.5" />

        {/* Regular Domains */}
        {visibleDomains.map((domain) => {
          const isSelected = selectedDomainId === domain.id;
          const isRouteInDomain = currentPathDomainId === domain.id;
          const DomainIcon = domain.icon;

          return (
            <div
              key={domain.id}
              className="relative w-full flex justify-center group"
              onMouseEnter={() =>
                !isMobile &&
                isSecondarySidebarCollapsed &&
                handleDomainMouseEnter(domain.id)
              }
              onMouseLeave={() =>
                !isMobile &&
                isSecondarySidebarCollapsed &&
                handleDomainMouseLeave()
              }
            >
              {/* Active edge pill indicator */}
              {(isSelected || isRouteInDomain) && (
                <div
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all ${
                    isSelected
                      ? "h-7 bg-brand-500 shadow-sm shadow-brand-500/50"
                      : "h-3 bg-slate-600"
                  }`}
                />
              )}

              <button
                type="button"
                onClick={() => handleDomainClick(domain.id)}
                data-tour={`domain-${domain.id}`}
                className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all duration-150 relative cursor-pointer ${
                  isSelected
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-600/30 ring-1 ring-brand-400/50 font-semibold scale-102"
                    : isRouteInDomain
                    ? "bg-slate-800/90 text-brand-400 hover:bg-slate-800 hover:text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/70"
                }`}
                title={domain.title}
              >
                <DomainIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span className="text-[9px] font-bold tracking-tight mt-0.5 truncate max-w-[44px]">
                  {domain.shortLabel}
                </span>

                {/* Micro-dot if current route is inside this domain */}
                {isRouteInDomain && !isSelected && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-400" />
                )}
              </button>

              {/* Tooltip on hover when secondary sidebar is open */}
              {!isSecondarySidebarCollapsed && (
                <div className="hidden lg:group-hover:flex absolute left-full ml-2.5 top-1/2 -translate-y-1/2 z-50 pointer-events-none items-center">
                  <div className="bg-slate-900 border border-slate-700/80 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap flex flex-col gap-0.5">
                    <span>{domain.title}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {domain.tagline}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom: Utility Controls */}
      <div className="flex flex-col items-center gap-2 w-full pt-2 shrink-0 border-t border-slate-800/80">
        {/* Interactive Tour Button */}
        {!isMobile && (
          <button
            type="button"
            onClick={startTour}
            data-tour="tour-launcher-btn"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 border border-amber-500/20 hover:border-amber-500/40 transition group cursor-pointer"
            title="Take Interactive Tour"
          >
            <GraduationCap className="w-5 h-5 group-hover:rotate-6 transition-transform" />
          </button>
        )}

        {/* Desktop Collapse / Expand Secondary Panel Toggle */}
        {!isMobile && (
          <button
            type="button"
            onClick={toggleSecondarySidebar}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title={
              isSecondarySidebarCollapsed
                ? "Expand navigation panel"
                : "Collapse navigation panel"
            }
          >
            {isSecondarySidebarCollapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-brand-400" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Vault Status Indicator */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500"
          title="Vault: jqms-offline-vault (Synced)"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // SECONDARY DRAWER / CONTEXTUAL PANEL (~240px)
  // ─────────────────────────────────────────────────────────────
  const renderSecondaryPanel = (isMobile = false) => {
    const isAllPagesMode = selectedDomainId === "all-pages";

    return (
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none overflow-hidden transition-colors duration-200">
        {/* Panel Header */}
        <div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                isAllPagesMode
                  ? "bg-indigo-500/10 dark:bg-indigo-500/20 border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
                  : "bg-brand-500/10 dark:bg-brand-500/20 border-brand-500/30 text-brand-600 dark:text-brand-400"
              }`}
            >
              {isAllPagesMode ? (
                <LayoutGrid className="w-4 h-4" />
              ) : (
                <activeDomain.icon className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {isAllPagesMode ? "All Pages Directory" : activeDomain.title}
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {isAllPagesMode
                  ? `${totalAccessiblePages} total pages`
                  : `${activeDomain.items.length} ${
                      activeDomain.items.length === 1 ? "module" : "modules"
                    }`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Open Mega Directory Modal Button */}
            <button
              type="button"
              onClick={openAllPagesModal}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition"
              title="Open Full Mega Directory Site Map"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Mobile close button or Desktop collapse button */}
            {isMobile ? (
              <button
                type="button"
                onClick={closeMobileSidebar}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={toggleSecondarySidebar}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
                title="Collapse secondary panel"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Active Project Switcher Context Card */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-950/40 shrink-0">
          <NavLink
            to="/projects"
            onClick={() => isMobile && closeMobileSidebar()}
            className="p-2 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 hover:border-brand-500/50 hover:shadow-sm transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                  Active Project
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-300 truncate">
                  {activeProject?.name || "Select Project"}
                </div>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition shrink-0" />
          </NavLink>
        </div>

        {/* Real-time Sub-Item Search Bar */}
        <div className="px-3 pt-3 pb-1 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isAllPagesMode ? "Search all pages..." : "Filter modules..."
              }
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-800/70 border border-transparent focus:border-brand-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Nav Menu Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin">
          {/* MODE 1: ALL PAGES DIRECTORY VIEW */}
          {isAllPagesMode ? (
            <div className="space-y-4 pt-1 pb-4">
              {filteredAllPagesGroups.map((group) => {
                const GroupIcon = group.icon;
                return (
                  <div key={group.id} className="space-y-1">
                    <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-100/60 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 truncate">
                        <GroupIcon className="w-3 h-3 text-brand-600 dark:text-brand-400" />
                        <span className="truncate">{group.title}</span>
                      </div>
                      <span className="text-[9px] font-mono opacity-70">
                        {group.items.length}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      {group.items.map((item, idx) => {
                        const ItemIcon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                          <NavLink
                            key={idx}
                            to={item.path}
                            onClick={() => isMobile && closeMobileSidebar()}
                            data-tour={item.dataTour}
                            className={`flex flex-col px-2.5 py-1.5 rounded-lg text-xs transition group ${
                              isActive
                                ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold border-l-2 border-brand-600 dark:border-brand-500"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <ItemIcon className="w-3.5 h-3.5 shrink-0 transition group-hover:text-brand-600 dark:group-hover:text-brand-400" />
                              <span className="truncate">{item.label}</span>
                            </div>
                            {item.description && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate pl-5">
                                {item.description}
                              </span>
                            )}
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {filteredAllPagesGroups.length === 0 && (
                <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                  No pages match "{searchQuery}"
                </div>
              )}
            </div>
          ) : (
            /* MODE 2: SPECIFIC DOMAIN VIEW */
            <>
              {filteredActiveItems.map((item, idx) => {
                const ItemIcon = item.icon;
                return (
                  <NavLink
                    key={idx}
                    to={item.path}
                    onClick={() => isMobile && closeMobileSidebar()}
                    data-tour={item.dataTour}
                    className={({ isActive }) =>
                      `flex flex-col px-3 py-2 rounded-xl text-xs font-medium transition group ${
                        isActive
                          ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold border-l-2 border-brand-600 dark:border-brand-500 shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <ItemIcon className="w-4 h-4 shrink-0 transition group-hover:text-brand-600 dark:group-hover:text-brand-400" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.description && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate pl-6.5 mt-0.5">
                        {item.description}
                      </span>
                    )}
                  </NavLink>
                );
              })}

              {/* Empty state within domain */}
              {filteredActiveItems.length === 0 && (
                <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs">
                  No modules match "{searchQuery}" in {activeDomain.shortLabel}
                </div>
              )}

              {/* Cross-domain search results */}
              {crossDomainMatches.length > 0 && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-brand-500" />
                    <span>Other Domains</span>
                  </div>
                  {crossDomainMatches.map((group) => (
                    <div key={group.domain.id} className="space-y-1">
                      <div className="px-2 text-[10px] text-slate-400 font-medium">
                        {group.domain.title}:
                      </div>
                      {group.items.map((item, iIdx) => {
                        const ItemIcon = item.icon;
                        return (
                          <NavLink
                            key={iIdx}
                            to={item.path}
                            onClick={() => {
                              setSelectedDomainId(group.domain.id);
                              if (isMobile) closeMobileSidebar();
                            }}
                            data-tour={item.dataTour}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-brand-600 dark:hover:text-brand-400 transition"
                          >
                            <ItemIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/60 text-[11px] text-slate-500 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={openAllPagesModal}
            className="flex items-center gap-1.5 text-[10px] font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
          >
            <LayoutGrid className="w-3 h-3" />
            <span>Site Map Catalog</span>
          </button>
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ─── DESKTOP COMPOUND SIDEBAR (Large screens >= 1024px) ─── */}
      <aside
        data-tour="sidebar"
        className="hidden lg:flex flex-row h-screen sticky top-0 overflow-visible shrink-0 select-none z-30 transition-all duration-200"
      >
        {/* Tier 1: Primary Icon Rail */}
        {renderPrimaryRail(false)}

        {/* Tier 2: Secondary Contextual Panel */}
        <div
          className={`h-full transition-all duration-200 ease-in-out overflow-hidden ${
            isSecondarySidebarCollapsed
              ? "w-0 opacity-0 pointer-events-none"
              : "w-64 opacity-100"
          }`}
        >
          {renderSecondaryPanel(false)}
        </div>

        {/* Collapsed Hover Flyout Menu */}
        {isSecondarySidebarCollapsed && hoveredDomain && (
          <div
            className="absolute left-16 top-12 z-50 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-left-2 duration-150 p-2"
            onMouseEnter={() => {
              if (flyoutTimeoutRef.current)
                clearTimeout(flyoutTimeoutRef.current);
            }}
            onMouseLeave={handleDomainMouseLeave}
          >
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {hoveredDomain.title}
                </div>
                <div className="text-[10px] text-slate-400">
                  {hoveredDomain.tagline}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDomainClick(hoveredDomain.id)}
                className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                Pin Open
              </button>
            </div>
            <div className="py-1 space-y-0.5 max-h-80 overflow-y-auto scrollbar-thin">
              {hoveredDomain.items.map((item, idx) => {
                const ItemIcon = item.icon;
                return (
                  <NavLink
                    key={idx}
                    to={item.path}
                    onClick={() => {
                      setSelectedDomainId(hoveredDomain.id);
                      setHoveredDomainId(null);
                    }}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                        isActive
                          ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                      }`
                    }
                  >
                    <ItemIcon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}
      </aside>

      {/* ─── MOBILE COMPOUND DRAWER (Small & Medium screens < 1024px) ─── */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop overlay */}
          <div
            onClick={closeMobileSidebar}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          />

          {/* Off-canvas compound container */}
          <aside className="relative w-[340px] max-w-[92vw] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 z-10 flex flex-row h-full shadow-2xl animate-in slide-in-from-left duration-250 select-none overflow-hidden">
            {/* Primary Rail */}
            {renderPrimaryRail(true)}

            {/* Secondary Panel */}
            {renderSecondaryPanel(true)}
          </aside>
        </div>
      )}

      {/* ─── ALL PAGES MEGA DIRECTORY MODAL / SITE MAP ─── */}
      {isAllPagesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200">
          {/* Backdrop overlay */}
          <div
            onClick={closeAllPagesModal}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-6xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>JQMS Pages & Services Directory</span>
                    <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-700 dark:text-brand-300 text-xs font-mono font-bold border border-brand-500/20">
                      {totalAccessiblePages} Modules
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Complete navigation index across all engineering and quality
                    domains
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeAllPagesModal}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              {/* Search Box */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  placeholder="Search pages, tools, reports..."
                  autoFocus
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-brand-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none transition"
                />
                {modalSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setModalSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Domain Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setModalDomainFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    modalDomainFilter === "all"
                      ? "bg-brand-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  All Domains
                </button>
                {visibleDomains.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setModalDomainFilter(d.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                      modalDomainFilter === d.id
                        ? "bg-brand-600 text-white shadow-sm font-semibold"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {d.shortLabel}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body: Multi-Column Catalog Grid */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modalFilteredGroups.map((group) => {
                  const GroupIcon = group.icon;
                  return (
                    <div
                      key={group.id}
                      className="flex flex-col bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm"
                    >
                      {/* Section Card Header */}
                      <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-slate-200 dark:border-slate-800/80">
                        <div className="w-8 h-8 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/20 flex items-center justify-center shrink-0">
                          <GroupIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {group.title}
                          </h3>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {group.tagline}
                          </p>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-1.5 flex-1">
                        {group.items.map((item, iIdx) => {
                          const ItemIcon = item.icon;
                          const isCurrent = location.pathname === item.path;

                          return (
                            <NavLink
                              key={iIdx}
                              to={item.path}
                              onClick={() => {
                                closeAllPagesModal();
                                if (isMobileSidebarOpen) closeMobileSidebar();
                              }}
                              className={`flex items-start gap-2.5 p-2 rounded-xl transition group ${
                                isCurrent
                                  ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold ring-1 ring-brand-500/30"
                                  : "hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                              }`}
                            >
                              <div className="p-1 rounded-lg bg-slate-200/50 dark:bg-slate-800 text-slate-500 group-hover:text-brand-600 dark:group-hover:text-brand-400 shrink-0 mt-0.5">
                                <ItemIcon className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-medium group-hover:font-semibold flex items-center justify-between">
                                  <span className="truncate">{item.label}</span>
                                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition shrink-0 ml-1 text-slate-400" />
                                </div>
                                {item.description && (
                                  <div className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                                    {item.description}
                                  </div>
                                )}
                              </div>
                            </NavLink>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {modalFilteredGroups.length === 0 && (
                <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-sm">
                  No pages match "{modalSearchQuery}"
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between shrink-0 text-xs text-slate-500">
              <span className="font-mono text-[11px]">
                Active Project: {activeProject?.name || "General Workspace"}
              </span>
              <button
                type="button"
                onClick={closeAllPagesModal}
                className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium transition cursor-pointer"
              >
                Close (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
