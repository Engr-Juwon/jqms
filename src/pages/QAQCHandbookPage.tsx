import React, { useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { isQAQCUser, ROLE_TITLES } from "@/lib/permissions";
import { useCompany } from "@/lib/companyHelper";
import { printQAQCHandbook } from "@/services/pdf/qaqcHandbookReport";
import {
  BookOpen,
  Search,
  Printer,
  ShieldCheck,
  AlertOctagon,
  FileCheck2,
  HardHat,
  FlaskConical,
  Scissors,
  ClipboardList,
  Layers,
  Box,
  Truck,
  MessageSquareWarning,
  FileWarning,
  FileQuestion,
  Calendar,
  Building2,
  Compass,
  FileSpreadsheet,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Award,
  Clock,
  ExternalLink,
  ShieldAlert,
  ArrowLeft,
  Camera,
  Calculator,
  RefreshCw,
  FolderLock,
  Lock,
  FileText,
} from "lucide-react";
import { ModuleTabNav } from "@/components/common/ModuleTabNav";

interface Chapter {
  id: string;
  category: "Preamble" | "Governance" | "BIM & Elements" | "Quality & Defect" | "Materials & Testing" | "Field Operations" | "Standards & Formulas";
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  summary: string;
  quickLink?: string;
  quickLinkLabel?: string;
  steps?: { title: string; desc: string; tip?: string }[];
  acceptanceCriteria?: { item: string; standard: string; tolerance: string; actionOnFail: string }[];
  content: React.ReactNode;
}

export const QAQCHandbookPage: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { currentUser } = useAuthStore();
  const { activeProject } = useProjectStore();
  const { company } = useCompany();

  const compName = company?.name || company?.legalName || "JQMS Enterprise";
  const compAddress =
    company?.address || "3B, Taofik Lawal, Off Awolowo Road, Ikoyi, Lagos";
  const compPhone = company?.phone || "+234 (0) 16328782";
  const compEmail = company?.email || "info@collection.gp";
  const qaqcEngineer =
    (activeProject as any)?.qaqcEngineerName || currentUser?.fullName || "Lead QA/QC Engineer";
  const prefix = company?.settings?.inspectionPrefix || "CD";
  const docRef = `${prefix}-QP-001 REV. 01`;

  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({
    "ch-0": true,
    "ch-1": true,
  });

  const isAuthorized = isQAQCUser(currentUser);

  const toggleChapter = (id: string) => {
    setExpandedChapters((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    chapters.forEach((c) => (all[c.id] = true));
    setExpandedChapters(all);
  };

  const collapseAll = () => {
    setExpandedChapters({});
  };

  const handlePrint = () => {
    printQAQCHandbook(
      company || undefined,
      activeProject || undefined,
      currentUser || undefined,
    );
  };

  const chapters: Chapter[] = useMemo(
    () => [
      {
        id: "ch-0",
        category: "Preamble",
        title: "0. Corporate Quality Architecture & 9-Stage QA/QC Flow",
        icon: ShieldCheck,
        badge: docRef,
        summary: `Governing Quality Plan for ${compName}. Mandates the sequential 9-step quality lifecycle for all construction activities.`,
        content: (
          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                  Company Standards & Document Control
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  Ref: {docRef}
                </span>
              </div>
              <p className="text-slate-300">
                <strong>Company:</strong> {compName} |{" "}
                <strong>Headquarters:</strong> {compAddress} |{" "}
                <strong>Lead QA/QC Authority:</strong> {qaqcEngineer} (QA/QC Engineer).
              </p>
              <p className="text-slate-400 text-[11px]">
                This Quality Management Plan enforces the zero-compromise standard across all structural, civil, and architectural trades. No element may be cast or covered without formal multi-stakeholder clearance.
              </p>
            </div>

            <h4 className="font-bold text-slate-100 text-sm mt-4">
              The 9 Sequential Stages of Quality Progression:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  step: "Stage 1",
                  title: "Pre-Construction Documentation",
                  desc: "Approved Project Quality Plan (PQP), Quality Assurance Plan (QAP), Inspection & Test Plan (ITP), Method Statements, Project Specifications, Construction Drawings.",
                },
                {
                  step: "Stage 2",
                  title: "Material Approval (MAR)",
                  desc: "Technical Data Sheets (TDS), Mill Test Certificates (MTC), Source Approvals, and Sample Approvals before procurement.",
                },
                {
                  step: "Stage 3",
                  title: "Material Receiving & MIR",
                  desc: "Delivery Waybill verification, physical damage inspection, quantity tally, and Material Inspection Report (MIR) before site unloading.",
                },
                {
                  step: "Stage 4",
                  title: "Laboratory Testing",
                  desc: "Test requests, sampling logs, concrete batch tickets, cube registers, and equipment calibration certificates.",
                },
                {
                  step: "Stage 5",
                  title: "Work Inspection & Hold Points",
                  desc: "Work Inspection Requests (WIR / RFI), setting out, formwork, rebar cover, and joint consultant inspections.",
                },
                {
                  step: "Stage 6",
                  title: "Permit to Pour (PTP)",
                  desc: "Mandatory statutory pre-pour clearance signed off by Site Engineer, QA/QC Engineer, and Structural Consultant.",
                },
                {
                  step: "Stage 7",
                  title: "Non-Conformance Control (NCR)",
                  desc: "Root-cause 5-Whys, containment, proposed disposition, corrective & preventive action, ISO 8.7 closure sign-off.",
                },
                {
                  step: "Stage 8",
                  title: "Site Instructions (SI)",
                  desc: "Formal contractual warning notices issued to subcontractors for overdue NCRs or recurring defects.",
                },
                {
                  step: "Stage 9",
                  title: "Records, Logs & Weekly Audits",
                  desc: "Daily Site Log diary, Weekly Quality Progress Reports, Executive KPI dashboards, and immutable audit trail.",
                },
              ].map((s, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono text-[10px] font-bold">
                      {s.step}
                    </span>
                    <span className="font-semibold text-slate-200 text-xs truncate">
                      {s.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: "ch-1",
        category: "Quality & Defect",
        title: "1. Inspection & Test Plan (ITP) Matrix Architecture",
        icon: ClipboardList,
        badge: "Section 5.3 & Appendix B",
        summary:
          "How to navigate, filter, append, and export the standard 6-column ITP matrix and utilize 1-click WIR generation for Hold Points.",
        quickLink: "/project/itp",
        quickLinkLabel: "Open ITP Matrix Registry",
        content: (
          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <p>
              The ITP Matrix is the definitive roadmap for site inspection gating. It coordinates what to inspect, to what standard, by whom, and under which control gate.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-red-950/30 border border-red-800/50">
                <div className="flex items-center gap-2 text-red-400 font-bold mb-1">
                  <span className="w-5 h-5 rounded-full bg-red-500 text-slate-950 flex items-center justify-center text-xs font-black">
                    H
                  </span>
                  Hold Point
                </div>
                <p className="text-[11px] text-slate-300">
                  <strong>Mandatory inspection stop.</strong> Work cannot proceed past this stage without formal written sign-off from the QA/QC Engineer and Resident Engineer.
                </p>
                <div className="mt-2 text-[10px] text-red-300 font-mono">
                  &rarr; Click &quot;WIR&quot; button in matrix to raise inspection notice.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/50">
                <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black">
                    W
                  </span>
                  Witness Point
                </div>
                <p className="text-[11px] text-slate-300">
                  Notified checkpoint. Contractor provides min. 24h notice. If QA/QC or consultant is not present at designated time, work may proceed if pre-authorized.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-700">
                <div className="flex items-center gap-2 text-slate-300 font-bold mb-1">
                  <span className="w-5 h-5 rounded-full bg-slate-400 text-slate-950 flex items-center justify-center text-xs font-black">
                    R
                  </span>
                  Review Point
                </div>
                <p className="text-[11px] text-slate-300">
                  Documentary examination point. Verification of Mill Test Certificates (MTC), concrete crushing results, batching records, or independent lab certificates.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/50">
                <div className="flex items-center gap-2 text-blue-400 font-bold mb-1">
                  <span className="w-5 h-5 rounded-full bg-blue-500 text-slate-950 flex items-center justify-center text-xs font-black">
                    S
                  </span>
                  Surveillance
                </div>
                <p className="text-[11px] text-slate-300">
                  Continuous or random visual monitoring of ongoing site execution (e.g. wall plumbness, concrete curing duration, rebar bending yard checks).
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <h5 className="font-bold text-slate-200 mb-2">Standard Appendix B Matrix Columns:</h5>
              <ol className="list-decimal pl-5 space-y-1 text-slate-400 text-[11px]">
                <li><strong>Activity / Stage:</strong> The specific construction package (e.g. Masonry, In-situ Concrete, Substructure).</li>
                <li><strong>Inspection Item / Parameter:</strong> The exact physical or chemical attribute to be checked.</li>
                <li><strong>Reference Standard / Spec:</strong> Code clause (BS 6073, NIS 87, BS EN 12390, ASTM C39, BS 8110).</li>
                <li><strong>Acceptance Criteria:</strong> Objective numerical tolerance or boundary (e.g. Min 5 blocks crushing, ≥ 2.5 N/mm²).</li>
                <li><strong>Control Gate:</strong> H, W, R, or S classification.</li>
                <li><strong>Responsible / Verifying Party:</strong> Assigned inspection entity (QA/QC Engineer, RE, Lab).</li>
              </ol>
            </div>
          </div>
        ),
      },
      {
        id: "ch-2",
        category: "Materials & Testing",
        title: "2. Permit to Pour (PTP) & Pre-Pour Checklist Protocol",
        icon: HardHat,
        badge: "Mandatory Gating",
        summary:
          "Protocol for issuing concrete permits, conducting the 5-point verification, and securing statutory sign-offs.",
        quickLink: "/project/permit-to-pour",
        quickLinkLabel: "Open Permit to Pour Register",
        content: (
          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
              <strong>MANDATORY GATING RULE:</strong> Under no circumstances may ready-mix concrete or site-batched concrete be placed into formwork without an APPROVED, digitally or physically signed Permit to Pour (PTP). Concrete batch plants must not dispatch trucks without PTP confirmation.
            </div>

            <h5 className="font-bold text-slate-100 text-sm">The 5 Pre-Pour Inspection Gates:</h5>
            <div className="space-y-2">
              {[
                {
                  gate: "1. Formwork & Falsework",
                  checks: "Prop spacing, bracing stability, shutter plumbness, tightness of joints (grout-loss prevention), release agent applied sparingly without pooling, kicker alignment.",
                },
                {
                  gate: "2. Reinforcement & Spacers",
                  checks: "Rebar size, quantity, spacing, lap lengths (min 40D / 50D), chair spacers for top steel, concrete cover blocks (min 25mm slabs, 40mm beams/columns, 50mm earth-retaining elements).",
                },
                {
                  gate: "3. MEP Concealed Services",
                  checks: "Electrical conduits tied securely, plumbing sleeves sleeved with pipe insulation, box positions verified against MEP coordinated drawings, no rebar cut for pipes.",
                },
                {
                  gate: "4. Cleanliness & Debris Blowout",
                  checks: "Cleanout windows open at column bases, all sawdust, binding wire clippings, and debris blown out with compressed air / high-pressure water, cleanout doors sealed tight.",
                },
                {
                  gate: "5. Setting Out & Level Verification",
                  checks: "Slab top finish level pegs set with optical level/laser, vertical axis alignment verified against cadastral gridlines.",
                },
              ].map((g, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-bold text-amber-400">{g.gate}: </span>
                  <span className="text-slate-300">{g.checks}</span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="font-bold text-slate-200">Statutory 3-Party Sign-Off Sequence:</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-[11px]">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="font-bold text-slate-300">1. Site Engineer:</span>
                  <p className="text-slate-400">Verifies readiness, dimensions, and subcontractor execution.</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="font-bold text-amber-400">2. QA/QC Engineer:</span>
                  <p className="text-slate-400">Verifies cover, cleanliness, MEP sign-off, and slump criteria.</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="font-bold text-blue-400">3. Structural Consultant / RE:</span>
                  <p className="text-slate-400">Final statutory clearance authorizing batch plant discharge.</p>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "ch-3",
        category: "Materials & Testing",
        title: "3. Concrete Cube Testing & Acceptance Criteria (BS EN 12390)",
        icon: FlaskConical,
        badge: "BS EN 12390 / ASTM C39",
        summary:
          "Sampling procedures, curing water tank conditions, crushing machine entry, and compliance evaluation rules.",
        quickLink: "/project/concrete",
        quickLinkLabel: "Open Concrete Cube Testing",
        content: (
          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <h5 className="font-bold text-slate-100 text-sm">Sampling & Casting Procedure:</h5>
            <ol className="list-decimal pl-5 space-y-1.5 text-slate-300 text-[11px]">
              <li>
                <strong>Sampling Point:</strong> Collect fresh concrete from ready-mix truck chute after discharging the initial 0.2 m³ (never from the very first or last discharge).
              </li>
              <li>
                <strong>Slump Testing (BS EN 12350-2):</strong> Fill slump cone in 3 equal layers, tamping each 25 times. Measure true subsidence. Tolerance: 100 ± 25 mm (Class S3). Reject batch if slump &gt; 150 mm (excess water/segregation) or &lt; 50 mm (stiff batch).
              </li>
              <li>
                <strong>Temperature Check:</strong> Fresh concrete temperature must not exceed 32°C in tropical ambient conditions.
              </li>
              <li>
                <strong>Cube Casting:</strong> Standard 150 × 150 × 150 mm steel moulds. Apply thin mineral oil release. Fill in 3 layers, compacting each layer with 35 tamps using standard 1.8 kg tamping bar or vibrating table.
              </li>
              <li>
                <strong>Initial Setting:</strong> Store in shaded, humid area at 20 ± 5°C covered with damp hessian or polythene for 24 ± 4 hours.
              </li>
              <li>
                <strong>Curing Tank:</strong> Demould after 24h, mark indelibly with Element ID &amp; Date, and submerge in water curing tank maintained at 20 ± 2°C.
              </li>
            </ol>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <h5 className="font-bold text-amber-400 mb-2">Compressive Strength Acceptance Rules:</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="font-bold text-slate-200 mb-1">7-Day Interim Check</div>
                  <p className="text-slate-400">
                    Concrete should typically attain 65% to 75% of specified characteristic strength (fcu). Used as early warning indicator; low 7-day strength warrants propping retention.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="font-bold text-slate-200 mb-1">28-Day Final Statutory Acceptance</div>
                  <p className="text-slate-400">
                    BS EN 206 / BS 8110 Compliance Rule:
                    <br />
                    1. Mean strength of 3 test cubes ≥ fcu + 3 N/mm²
                    <br />
                    2. No individual test cube &lt; fcu - 3 N/mm²
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-red-950/30 border border-red-800/40 text-red-200 text-[11px]">
              <strong>FAIL PROTOCOL:</strong> If 28-day strength fails, immediately: 1. Raise formal NCR; 2. Stop stripping back-props; 3. Perform Schmidt Rebound Hammer &amp; UPV testing; 4. If inconclusive, extract 100 mm diameter core samples (BS EN 12504-1) under Structural Engineer supervision.
            </div>
          </div>
        ),
      },
      {
        id: "ch-4",
        category: "Materials & Testing",
        title: "4. Rebar Cutting Schedule (BBS) & Commercial Stock Optimization",
        icon: Scissors,
        badge: "12m Stock & Offcut QA",
        summary:
          "Managing cutting patterns, enforcing scrap wastage limits (<= 3.5%), tagging reusable offcuts (>= 300mm), and mill test verification.",
        quickLink: "/project/steel/bar-cutting",
        quickLinkLabel: "Open Bar Cutting Schedule",
        content: (
          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <p>
              Reinforcement steel represents up to 40% of structural cost. The Bar Cutting module enforces mathematical 1D cutting stock optimization from standard 12.00m commercial bars to minimize scrap wastage while maintaining 100% barmark traceability.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="font-bold text-amber-400">Target Scrap Limit</span>
                <p className="text-slate-400 text-[11px] mt-1">
                  Contractual scrap threshold is ≤ 3.5%. Any cutting schedule with scrap &gt; 4.0% must be re-combined with other schedules to utilize offcuts.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="font-bold text-red-400">Offcut Reusability Rule</span>
                <p className="text-slate-400 text-[11px] mt-1">
                  Any offcut ≥ 300 mm is designated as <strong>REUSABLE STOCK</strong> (highlighted in red/pink badge). Tag and return to rebar yard for starters/stirrups.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="font-bold text-blue-400">MTC Heat Traceability</span>
                <p className="text-slate-400 text-[11px] mt-1">
                  Every fabricated batch must record Mill Heat Number and yield strength (fy ≥ 500 N/mm², elongation ≥ 12%).
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px]">
              <div className="text-slate-200 font-bold mb-1">Standard Rebar Unit Weights (w = D² / 162 kg/m):</div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-slate-400">
                <div>Y10: 0.617 kg/m</div>
                <div>Y12: 0.888 kg/m</div>
                <div>Y16: 1.578 kg/m</div>
                <div>Y20: 2.466 kg/m</div>
                <div>Y25: 3.853 kg/m</div>
                <div>Y32: 6.313 kg/m</div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "ch-5",
        category: "Quality & Defect",
        title: "5. Non-Conformance Reports (NCR) & Corrective Action Lifecycle",
        icon: AlertOctagon,
        badge: "ISO 9001 Clause 8.7",
        summary:
          "Procedure for defect classification, containment, root cause analysis (5-Whys), disposition, and statutory closure.",
        quickLink: "/project/ncrs",
        quickLinkLabel: "Open NCR Module",
        content: (
          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <h5 className="font-bold text-slate-100 text-sm">NCR Step-by-Step Resolution Workflow:</h5>
            <div className="space-y-2">
              {[
                {
                  phase: "1. Identification & Containment",
                  detail: "Document defect with high-resolution photo markup. Immediately stop ongoing work on the affected element. Tag element with Red Caution Tape or digital Lock in BIM register.",
                },
                {
                  phase: "2. Root Cause Analysis (RCA)",
                  detail: "Apply 5-Whys methodology. Distinguish between Human Error, Material Failure, Equipment Malfunction, Inadequate Method Statement, or Environmental Factor.",
                },
                {
                  phase: "3. Proposed Disposition",
                  detail: "Subcontractor proposes one of 4 statutory dispositions: 1. Scrap / Reconstruct; 2. Repair / Remedial Work; 3. Concession / Use-as-is (requires Consultant approval); 4. Re-classify.",
                },
                {
                  phase: "4. Corrective & Preventive Action (CAPA)",
                  detail: "Formulate actions to eliminate the underlying root cause across remaining floors (e.g. retraining rebar fixers, replacing defective formwork plywood).",
                },
                {
                  phase: "5. Physical Verification & Final Sign-Off",
                  detail: "QA/QC Engineer conducts physical reinspection of repaired element. When compliant, digitally signs off with closure date and attaches verification photos.",
                },
              ].map((p, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-bold text-amber-400">{p.phase}: </span>
                  <span className="text-slate-300">{p.detail}</span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-200">Overdue NCR Escalation:</span>
                <p className="text-slate-400 text-[11px]">
                  If an NCR is not addressed within its target completion SLA (e.g. 7 days), the system generates an alert to issue a formal <strong>Site Instruction (SI)</strong> with financial withholding.
                </p>
              </div>
              <Link
                to="/project/site-instructions"
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-semibold text-xs transition shrink-0 ml-3"
              >
                Site Instructions
              </Link>
            </div>
          </div>
        ),
      },
      {
        id: "ch-6",
        category: "BIM & Elements",
        title: "6. 3D BIM Elements & Digital Element Passports",
        icon: Box,
        badge: "WebGL & QR Code",
        summary:
          "Visualizing structural elements in 3D, tracing lifecycle statuses, and scanning QR element passports on site.",
        quickLink: "/project/elements",
        quickLinkLabel: "Open BIM Element Registry",
        content: (
          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <p>
              Every structural component (Foundation, Column, Shear Wall, Beam, Slab) has a unique digital identity and barcode/QR passport.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="font-bold text-slate-200 text-xs">Standard Element Lifecycle Statuses:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-400">
                  <span className="font-bold text-slate-300">1. Planned / Pending:</span> Modeled in BIM, awaiting kickoff.
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-amber-400">
                  <span className="font-bold">2. Rebar Fixed:</span> Steel tied, awaiting WIR inspection.
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-blue-400">
                  <span className="font-bold">3. Formwork Boxed:</span> Shutters closed, PTP checklist open.
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-purple-400">
                  <span className="font-bold">4. Poured:</span> Concrete cast, batch ticket & cube tied.
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-teal-400">
                  <span className="font-bold">5. Curing (7-28d):</span> Water ponding or curing compound active.
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-emerald-400">
                  <span className="font-bold">6. Accepted & Closed:</span> 28d crushing passed, QA signed.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
              <strong>Digital Passport Scanning:</strong> Field engineers scan the QR sticker on the cast element using any mobile camera or tablet to immediately inspect attached concrete cube crushing results, PTP history, inspection sign-offs, and open comments.
            </div>
          </div>
        ),
      },
      {
        id: "ch-7",
        category: "Field Operations",
        title: "7. Field Observations, Photo Markup & Daily Diary",
        icon: Camera,
        badge: "Site Reality",
        summary:
          "Capturing field defects, marking up site photos with arrows/clouds, and compiling the daily site diary.",
        quickLink: "/project/site-comments",
        quickLinkLabel: "Open Site Comments",
        content: (
          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <h5 className="font-bold text-slate-100 text-sm">Site Observations & Mobile Photo Markup:</h5>
            <p>
              When a defect or deviation is noticed on site that does not yet warrant a full contractual NCR, raise a <strong>Site Comment / Observation</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300 text-[11px]">
              <li><strong>Snap Photo:</strong> Use the camera or upload directly from phone gallery.</li>
              <li><strong>Interactive Markup:</strong> Use the built-in canvas markup tool to circle honeycombing, draw arrows to displaced rebar, or highlight missing cover blocks.</li>
              <li><strong>Categorize:</strong> Assign severity (Low, Medium, High) and trade (Concreting, Steel Fixing, Carpentry, Masonry, Plumbing, Electrical).</li>
              <li><strong>Status Tracking:</strong> Track from <em>Open</em> &rarr; <em>In Progress</em> &rarr; <em>Resolved</em> with after-repair verification photo.</li>
            </ul>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="font-bold text-slate-200">Daily Site Log (Diary):</span>
              <p className="text-slate-400 text-[11px] mt-1">
                Records weather (temperature, morning/afternoon rainfall, wind), operational workforce headcount by trade, heavy plant utilization (tower cranes, concrete pumps, generators), and key pour volumes.
              </p>
              <div className="mt-2">
                <Link
                  to="/project/daily-logs"
                  className="text-amber-400 hover:text-amber-300 font-semibold text-xs underline"
                >
                  &rarr; Go to Daily Site Logs
                </Link>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "ch-8",
        category: "Governance",
        title: "8. Executive Reporting, Staff Matrix & Audit Trail",
        icon: FileSpreadsheet,
        badge: "ISO 9001 Management Review",
        summary:
          "Weekly quality report generation, role-based access control (RBAC), and immutable tamper-evident audit logging.",
        quickLink: "/project/weekly-reports",
        quickLinkLabel: "Open Weekly Reports",
        content: (
          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="font-bold text-amber-400">Weekly Quality Reports</span>
                <p className="text-slate-400 text-[11px] mt-1">
                  Aggregates active PTPs, concrete test statistics, open vs closed NCR count, subcontractor quality scorecards, and executive narrative summaries for client/investor circulation.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="font-bold text-blue-400">Immutable Audit Trail</span>
                <p className="text-slate-400 text-[11px] mt-1">
                  Every permit approval, cube crush entry, NCR closure, and document revision is stamped with UID, exact server timestamp, user role, and hash to guarantee tamper prevention.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="font-bold text-slate-200">5-Tier Role Access Architecture:</span>
              <div className="space-y-1 text-slate-400 text-[11px] mt-1.5">
                <div>&bull; <strong>Level 5:</strong> Quality Director, Super Admin, Executive Management (Company-wide governance).</div>
                <div>&bull; <strong>Level 4:</strong> Senior QA/QC Engineer, QA/QC Engineer, Quality Manager, Project Manager (Authorizes PTP, Closes NCR, Signs ITP).</div>
                <div>&bull; <strong>Level 3:</strong> Construction Manager, Project Engineer, Materials Engineer, Lab Manager (Reviews & Prepares).</div>
                <div>&bull; <strong>Level 2:</strong> Site Engineer, QA/QC Inspector, Surveyor (Raises WIR, inputs field tests).</div>
                <div>&bull; <strong>Level 1:</strong> Subcontractor, Third-Party Lab, Consultant (Viewer / Reviewer).</div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "ch-9",
        category: "Standards & Formulas",
        title: "9. Quick Reference Engineering Formulas & Tolerances",
        icon: Calculator,
        badge: "Field Pocket Cheatsheet",
        summary:
          "Essential mathematical formulas, concrete slump classes, cover tolerances, and brickwork testing standards.",
        quickLink: "/project/calculators",
        quickLinkLabel: "Open Calculators",
        content: (
          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                <div className="font-bold text-amber-400 font-sans text-xs">Structural Engineering Formulas:</div>
                <div>&bull; <strong>Rebar Weight:</strong> w = D² / 162 (kg/m)</div>
                <div>&bull; <strong>Tension Lap Length:</strong> L_lap = 40 × D (Grade 500)</div>
                <div>&bull; <strong>Compression Lap:</strong> L_lap = 50 × D</div>
                <div>&bull; <strong>Concrete Volume:</strong> V = L × W × H × 1.05 (5% waste allowance)</div>
                <div>&bull; <strong>Cube Strength:</strong> f = (P [kN] × 1000) / 22,500 (N/mm²)</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                <div className="font-bold text-blue-400 font-sans text-xs">Slump Classes (BS EN 206):</div>
                <div>&bull; <strong>S1:</strong> 10 – 40 mm (Kerbs, mass foundations)</div>
                <div>&bull; <strong>S2:</strong> 50 – 90 mm (Normal reinforced slabs, strips)</div>
                <div>&bull; <strong>S3:</strong> 100 – 150 mm (Pumpable mix, beams, columns)</div>
                <div>&bull; <strong>S4:</strong> 160 – 210 mm (Tremie, congested rebar)</div>
                <div>&bull; <strong>S5:</strong> ≥ 220 mm (Self-compacting concrete)</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px]">
              <div className="font-bold text-emerald-400 font-sans text-xs mb-1">Minimum Concrete Cover Tolerances:</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
                <div>Slabs / Walls: 25 mm</div>
                <div>Beams: 35 – 40 mm</div>
                <div>Columns: 40 mm</div>
                <div>Foundations / Soil: 50 – 75 mm</div>
              </div>
            </div>
          </div>
        ),
      },
    ],
    []
  );

  const categories = ["ALL", "Preamble", "Governance", "BIM & Elements", "Quality & Defect", "Materials & Testing", "Field Operations", "Standards & Formulas"];

  const filteredChapters = useMemo(() => {
    return chapters.filter((c) => {
      const matchCat = activeCategory === "ALL" || c.category === activeCategory;
      const term = searchTerm.toLowerCase().trim();
      if (!term) return matchCat;
      const matchText =
        c.title.toLowerCase().includes(term) ||
        c.summary.toLowerCase().includes(term) ||
        c.category.toLowerCase().includes(term) ||
        (c.badge && c.badge.toLowerCase().includes(term));
      return matchCat && matchText;
    });
  }, [chapters, activeCategory, searchTerm]);

  // If user is NOT a QA/QC authorized role, show restricted access gate
  if (!isAuthorized) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-red-800/40 text-center shadow-2xl space-y-4 animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto shadow-lg shadow-red-500/10">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-mono text-[11px] font-extrabold uppercase tracking-wider">
              Restricted Area
            </span>
            <h2 className="text-xl font-black text-white">QA/QC Personnel Only</h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The <strong>QA/QC Field Manual & System Instruction Booklet</strong> contains proprietary testing standards, statutory audit procedures, and inspection gating controls reserved strictly for Quality Assurance & Quality Control engineers.
          </p>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 text-left">
            <div><strong>Logged in as:</strong> {currentUser?.fullName || "Guest"}</div>
            <div><strong>Active Role:</strong> {currentUser?.role ? ROLE_TITLES[currentUser.role] : "Standard User"}</div>
          </div>
          <div className="pt-2">
            <button
              onClick={() => navigate("/project/dashboard")}
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition shadow-md"
            >
              Return to Project Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 space-y-6 text-slate-100">
      {/* Top Banner & Header */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <BookOpen className="w-64 h-64 text-amber-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" />
                QA/QC EXCLUSIVE FIELD MANUAL
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">
                {docRef}
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold">
                ISO 9001:2015 Compliant
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
              QA/QC System Instruction Booklet & SOP Manual
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Standard Operating Procedures (SOP), statutory inspection gating, concrete & steel testing protocols, and complete operational guidelines covering every module in the Jay-QMS platform.
            </p>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2 shrink-0 no-print">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition shadow-sm"
              title="Print entire manual or Save as PDF"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Print Manual</span>
            </button>
            <div className="hidden sm:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-[11px]">
              <button
                onClick={expandAll}
                className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 font-semibold transition"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 font-semibold transition"
              >
                Collapse All
              </button>
            </div>
          </div>
        </div>

        {/* Company Quick Credentials */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Entity:</span> {compName}
            <span className="text-slate-600">|</span>
            <span className="font-semibold text-slate-300">HQ:</span> {compAddress}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">QA/QC Engineer:</span> {qaqcEngineer}
            <span className="text-slate-600">|</span>
            <span className="font-semibold text-slate-300">Project:</span> {activeProject?.name || "Global"}
          </div>
        </div>
      </div>

      {/* QA/QC Engineering Submittals Navigation Tabs */}
      <ModuleTabNav
        items={[
          {
            label: "Inspection & Test Plans (ITP)",
            path: "/project/itp",
            icon: ClipboardList,
          },
          {
            label: "Material Approvals (MAR)",
            path: "/project/mar",
            icon: FileCheck2,
          },
          {
            label: "Requests for Information (RFI)",
            path: "/project/rfi",
            icon: FileQuestion,
          },
          {
            label: "Method Statements (RAMS)",
            path: "/project/method-statements",
            icon: FileText,
          },
          {
            label: "QA/QC SOP Manual",
            path: "/project/qaqc-handbook",
            icon: BookOpen,
          },
        ]}
      />

      {/* Filter & Search Bar */}
      <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md no-print">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search chapters, standards, slump, PTP..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                activeCategory === cat
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Chapters Accordion List */}
      <div className="space-y-4">
        {filteredChapters.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
            <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No matching handbook chapters found</p>
            <p className="text-xs text-slate-500">Try adjusting your search query or switching category filter.</p>
          </div>
        ) : (
          filteredChapters.map((chapter) => {
            const Icon = chapter.icon;
            const isExpanded = Boolean(expandedChapters[chapter.id]);

            return (
              <div
                key={chapter.id}
                className="rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg overflow-hidden transition hover:border-slate-700/80"
              >
                {/* Chapter Header */}
                <div
                  onClick={() => toggleChapter(chapter.id)}
                  className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 cursor-pointer select-none bg-slate-900 hover:bg-slate-850 transition"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono font-bold uppercase">
                          {chapter.category}
                        </span>
                        {chapter.badge && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                            {chapter.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-white text-sm sm:text-base tracking-tight truncate">
                        {chapter.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {chapter.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 no-print">
                    {chapter.quickLink && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(chapter.quickLink!);
                        }}
                        className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-xs font-bold transition border border-slate-700 hover:border-amber-400"
                        title={chapter.quickLinkLabel}
                      >
                        <span>{chapter.quickLinkLabel || "Open Module"}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      className="p-1 rounded-xl text-slate-400 hover:text-white transition"
                      aria-label={isExpanded ? "Collapse chapter" : "Expand chapter"}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-amber-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Chapter Content */}
                {isExpanded && (
                  <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950/60 animate-in fade-in duration-200">
                    {chapter.content}

                    {chapter.quickLink && (
                      <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between no-print">
                        <span className="text-[11px] text-slate-400">
                          Direct system module shortcut:
                        </span>
                        <button
                          onClick={() => navigate(chapter.quickLink!)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow-md shadow-amber-500/20"
                        >
                          <span>{chapter.quickLinkLabel || "Launch Module"}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Emergency Helpdesk */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Need updates to QA/QC specifications or new ITP templates added to the manual?</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-300 font-mono text-[11px]">QA/QC Desk: {compPhone}</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 font-mono text-[11px]">{compEmail}</span>
        </div>
      </div>

      {/* Print-specific style block fallback */}
      <style>{`
        @page {
          margin: 0;
        }
        @media print {
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .no-print, header, nav, aside {
            display: none !important;
          }
          body, html {
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 8mm !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default QAQCHandbookPage;
