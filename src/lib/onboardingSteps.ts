export interface TourStep {
  id: string;
  /** CSS selector for the element to spotlight. null = centred modal (no spotlight) */
  targetSelector: string | null;
  /** Where to place the tooltip relative to the target */
  placement: "right" | "left" | "top" | "bottom" | "center";
  title: string;
  body: string;
  icon: string;
  /** Optional label override for the primary CTA on this step */
  actionLabel?: string;
  /** Optional domain ID to automatically activate in the compound sidebar */
  domainId?: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    targetSelector: null,
    placement: "center",
    icon: "🏛️",
    title: "Welcome to JQMS Enterprise",
    body: "Your ISO 9001:2015-aligned civil engineering QA/QC management platform. Let's take a quick 60-second guided walkthrough of your modern workspace.",
  },
  {
    id: "project-scope",
    targetSelector: "[data-tour='header-project-select']",
    placement: "bottom",
    icon: "🏗️",
    title: "Active Project Scope",
    body: "Every inspection register, 3D BIM model, and statutory approval is scoped to your active project workspace. Click here anytime to switch projects or adjust project parameters.",
  },
  {
    id: "primary-rail",
    targetSelector: "[data-tour='primary-rail']",
    placement: "right",
    icon: "🧭",
    title: "Two-Tier Navigation Rail",
    body: "The primary left rail organizes your workspace into specialized engineering domains: Governance, Site Quality, Concrete Lab, BIM Spatial Twin, Site Operations, and Company Administration.",
  },
  {
    id: "all-pages",
    targetSelector: "[data-tour='all-pages-launcher']",
    placement: "right",
    icon: "🗺️",
    title: "All Pages Directory & Site Map",
    body: "Need to jump anywhere instantly? The All Pages catalog gives you a searchable, searchable sitemap of all 30+ modules, civil calculators, and registries in one unified view.",
    domainId: "all-pages",
  },
  {
    id: "governance",
    targetSelector: "[data-tour='domain-governance']",
    placement: "right",
    icon: "📊",
    title: "Command & Governance",
    body: "Executive Dashboard with live QA/QC KPIs, open defects, concrete strength trends, weekly progress reports, and the Approvals Action Center for consultant hold points.",
    domainId: "governance",
  },
  {
    id: "quality",
    targetSelector: "[data-tour='domain-quality']",
    placement: "right",
    icon: "📋",
    title: "Site Quality & Compliance",
    body: "Manage Work Inspection Requests (WIR), Non-Conformance Reports (NCR), Requests for Information (RFI), Site Instructions (SI), and statutory Inspection & Test Plans (ITP).",
    domainId: "quality",
  },
  {
    id: "concrete",
    targetSelector: "[data-tour='domain-concrete']",
    placement: "right",
    icon: "🧪",
    title: "Concrete & Materials Lab",
    body: "Pre-pour verification with digital Permits to Pour (PTP), concrete batching slump and 7d/28d cube crush strength tests, bar bending schedules (BBS), and material receiving (MIR).",
    domainId: "concrete",
  },
  {
    id: "bim",
    targetSelector: "[data-tour='domain-bim']",
    placement: "right",
    icon: "🧊",
    title: "BIM & Spatial Digital Twin",
    body: "Interactive Three.js 3D structural model viewer, 2D floor grid plans with element inspection pins, 5D quantity takeoff, and 6D embodied carbon sustainability metrics.",
    domainId: "bim",
  },
  {
    id: "operations",
    targetSelector: "[data-tour='domain-operations']",
    placement: "right",
    icon: "📅",
    title: "Site Operations & 4D Planner",
    body: "Geotagged site photo galleries with markup, method statements (RAMS), punch list room handover, trade team chat, document vault, and the 4D construction schedule planner.",
    domainId: "operations",
  },
  {
    id: "ai-copilot",
    targetSelector: "[data-tour='ai-copilot-pill']",
    placement: "left",
    icon: "⚡",
    title: "Autonomous AI Copilot",
    body: "Your ISO 9001 civil assistant with live access to all 24 project databases. Ask it to query open NCRs, draft daily logs, check mix design tolerances, or compose contractual site instructions.",
  },
  {
    id: "offline-vault",
    targetSelector: "[data-tour='header-network-badge']",
    placement: "bottom",
    icon: "🛡️",
    title: "Offline Vault & Sync Engine",
    body: "Working in basement levels or remote sites with zero connectivity? JQMS runs 100% offline. Actions queue safely in IndexedDB and synchronize automatically when reconnected.",
  },
  {
    id: "admin",
    targetSelector: "[data-tour='domain-admin']",
    placement: "right",
    icon: "⚙️",
    title: "Company Administration",
    body: "Manage organization branding, digital signature credentials, ISO 9001 policies, document numbering prefixes (NCR, RFI, PTP, MIR), and staff project rosters.",
    domainId: "admin",
    actionLabel: "🚀 Get Started!",
  },
];
