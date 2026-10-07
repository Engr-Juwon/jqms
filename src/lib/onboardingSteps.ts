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
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    targetSelector: null,
    placement: "center",
    icon: "🎉",
    title: "Welcome to JQMS Enterprise",
    body: "This is your ISO 9001-aligned QA/QC management platform for civil engineering projects. In the next 60 seconds we'll show you everything you need to get started.",
  },
  {
    id: "sidebar",
    targetSelector: "[data-tour='sidebar']",
    placement: "right",
    icon: "🗺️",
    title: "Your Navigation Hub",
    body: "The left sidebar is your gateway to every module — quality control, inspections, materials, reporting, and more. It's organised by workflow stage.",
  },
  {
    id: "dashboard",
    targetSelector: "[data-tour='nav-dashboard']",
    placement: "right",
    icon: "📊",
    title: "Executive Dashboard",
    body: "Start here every morning. Live KPIs: open NCRs, pending hold points, concrete cube results, and weekly quality trend charts for your active project.",
  },
  {
    id: "mar",
    targetSelector: "[data-tour='nav-mar']",
    placement: "right",
    icon: "📦",
    title: "Material Approvals (MAR)",
    body: "Before any material arrives on site, submit a Material Approval Request. Attach TDS, Mill Test Certificates, and manufacturer data sheets for consultant review.",
  },
  {
    id: "mir",
    targetSelector: "[data-tour='nav-mir']",
    placement: "right",
    icon: "🚚",
    title: "Material Receiving (MIR)",
    body: "When a delivery arrives, raise a Material Inspection Report. Link it to the approved MAR, verify quantities, flag rejects, and trigger lab sampling if needed.",
  },
  {
    id: "itp",
    targetSelector: "[data-tour='nav-itp']",
    placement: "right",
    icon: "📋",
    title: "Inspection & Test Plan (ITP)",
    body: "Your quality gate framework. Each row defines a control gate: Hold Point (H) stops work until sign-off, Witness (W) notifies the consultant, Surveillance (S) is a random audit, and Review (R) checks certificates.",
  },
  {
    id: "inspections",
    targetSelector: "[data-tour='nav-inspections']",
    placement: "right",
    icon: "🔍",
    title: "Inspections & Hold Points",
    body: "Raise a Work Inspection Request (WIR) before any critical activity. The system enforces ITP hold points — no concrete can be poured until the required gates are signed off.",
  },
  {
    id: "permit",
    targetSelector: "[data-tour='nav-permit']",
    placement: "right",
    icon: "✅",
    title: "Permit to Pour",
    body: "The final clearance document before concrete placement. It confirms reinforcement, formwork, MEP services, and mix design are all approved. Generates a signed PDF instantly.",
  },
  {
    id: "ncr",
    targetSelector: "[data-tour='nav-ncr']",
    placement: "right",
    icon: "⚠️",
    title: "Non-Conformance Reports (NCR)",
    body: "When work falls short of spec, raise an NCR. Classify severity, propose corrective action, and track it to close-out. Every NCR is audit-trailed and visible on the dashboard.",
  },
  {
    id: "rfi",
    targetSelector: "[data-tour='nav-rfi']",
    placement: "right",
    icon: "❓",
    title: "Requests for Information (RFI)",
    body: "Need a design clarification before proceeding? Raise an RFI to the consultant, attach sketches or drawings, and track their response time — all documented for your QMS record.",
  },
  {
    id: "bar-cutting",
    targetSelector: "[data-tour='nav-bar-cutting']",
    placement: "right",
    icon: "✂️",
    title: "Bar Cutting Schedule",
    body: "Optimise rebar cutting against 12m stock lengths. T10, T12, T16, T20, T25, and T32 bars are kept strictly separate. Offcuts ≥ 300mm are flagged reusable. Export to PDF or CSV in one click.",
  },
  {
    id: "settings",
    targetSelector: "[data-tour='nav-settings']",
    placement: "right",
    icon: "⚙️",
    title: "Company Settings",
    body: "Set your company logo, address, document prefixes, and engineering standards here. This data auto-populates every PDF report, ITP, NCR, and permit you generate. Set it once, forget it.",
    actionLabel: "🎊 All Done!",
  },
];
