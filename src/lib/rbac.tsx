import React from "react";
import { UserRole, ROLE_LEVELS, ROLE_LABELS } from "@/types";
import { useAuthStore } from "@/stores/useAuthStore";

export type PermissionKey =
  // Company & System Administration (Level 5)
  | "MANAGE_USERS"
  | "MANAGE_COMPANY_SETTINGS"
  | "VIEW_AUDIT_LOGS"
  | "DELETE_PROJECT"

  // Project Governance & Team Matrix (Level 4+)
  | "CREATE_PROJECT"
  | "EDIT_PROJECT"
  | "ASSIGN_STAFF"

  // Non-Conformance Reports (NCR)
  | "CREATE_NCR"
  | "EDIT_NCR"
  | "TRANSITION_NCR_STATUS"
  | "APPROVE_CLOSE_NCR"
  | "DELETE_NCR"
  | "ISSUE_SITE_INSTRUCTION"

  // Site Instructions (Warning Documents)
  | "CREATE_SITE_INSTRUCTION"
  | "SIGN_ISSUE_SITE_INSTRUCTION"
  | "ACKNOWLEDGE_SITE_INSTRUCTION"
  | "CANCEL_SITE_INSTRUCTION"
  | "DELETE_SITE_INSTRUCTION"

  // Permit to Pour (PTP)
  | "CREATE_PTP"
  | "EDIT_PTP"
  | "SIGN_PTP_QAQC"
  | "SIGN_PTP_CM"
  | "SIGN_PTP_CONSULTANT"
  | "AUTHORIZE_POUR_FINAL"
  | "RECORD_POUR_EXECUTION"
  | "DELETE_PTP"

  // Inspections & Hold Points
  | "CREATE_INSPECTION"
  | "PERFORM_INSPECTION_CHECKLIST"
  | "SIGN_INSPECTION_QAQC"
  | "SIGN_INSPECTION_CONSULTANT"
  | "APPROVE_INSPECTION"
  | "DELETE_INSPECTION"

  // Concrete & Laboratory Quality Control
  | "CREATE_CONCRETE_SAMPLE"
  | "ENTER_CUBE_CRUSH_TEST"
  | "CERTIFY_28D_STRENGTH"
  | "MODIFY_MIX_DESIGN"
  | "DELETE_CONCRETE_RECORD"

  // Technical Submittals (RFI & MAR)
  | "CREATE_RFI"
  | "RESPOND_RFI"
  | "CLOSE_RFI"
  | "CREATE_MAR"
  | "REVIEW_MAR"
  | "APPROVE_REJECT_MAR"

  // Material Inspection Reports (MIR)
  | "CREATE_MIR"
  | "REVIEW_MIR"
  | "APPROVE_REJECT_MIR"
  | "DELETE_MIR"

  // Site Observations & Snags
  | "CREATE_SITE_COMMENT"
  | "RESOLVE_SITE_COMMENT"
  | "DELETE_SITE_COMMENT"

  // Weekly Reports & Document Control
  | "GENERATE_WEEKLY_REPORT"
  | "SIGN_WEEKLY_REPORT"
  | "UPLOAD_CONTROLLED_DOCUMENT"
  | "DELETE_DOCUMENT"

  // Daily Site Log (Site Diary - Multi-Sphere)
  | "CREATE_DAILY_LOG"
  | "EDIT_DAILY_LOG"
  | "SUBMIT_DAILY_LOG"
  | "SIGN_DAILY_LOG_QAQC"
  | "SIGN_DAILY_LOG_SAFETY"
  | "SIGN_DAILY_LOG_CONSULTANT"
  | "APPROVE_DAILY_LOG"
  | "DELETE_DAILY_LOG"

  // Structural BIM & Element Registry (Strict QA/QC Authority)
  | "VIEW_ELEMENT_REGISTRY"
  | "CREATE_ELEMENT"
  | "EDIT_ELEMENT"
  | "DELETE_ELEMENT"
  | "BULK_MANAGE_ELEMENTS";

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  description: string;
  category: string;
  minLevel: number;
  allowedRoles?: UserRole[];
  disallowedRoles?: UserRole[];
}

export const PERMISSION_DEFINITIONS: Record<
  PermissionKey,
  PermissionDefinition
> = {
  // ─── Company & System Administration ───
  MANAGE_USERS: {
    key: "MANAGE_USERS",
    label: "User Provisioning & Role Management",
    description:
      "Create user accounts, modify role hierarchy, deactivate personnel, and manage company access (Corporate Executives & Project/Quality Managers only).",
    category: "Company Governance",
    minLevel: 4,
    allowedRoles: [
      "SUPER_ADMIN",
      "QUALITY_DIRECTOR",
      "EXECUTIVE_MANAGEMENT",
      "QUALITY_MANAGER",
      "PROJECT_MANAGER",
      "OPERATIONS_MANAGER",
    ],
  },
  MANAGE_COMPANY_SETTINGS: {
    key: "MANAGE_COMPANY_SETTINGS",
    label: "Company ISO & Quality Settings",
    description:
      "Configure ISO 9001 quality standards, document numbering prefixes, notification webhooks, and branding.",
    category: "Company Governance",
    minLevel: 5,
    allowedRoles: [
      "SUPER_ADMIN",
      "QUALITY_DIRECTOR",
      "EXECUTIVE_MANAGEMENT",
    ],
  },
  VIEW_AUDIT_LOGS: {
    key: "VIEW_AUDIT_LOGS",
    label: "System Audit Trail Inspection",
    description:
      "Inspect comprehensive tamper-evident security logs and user activity across all workspaces.",
    category: "Company Governance",
    minLevel: 4,
  },
  DELETE_PROJECT: {
    key: "DELETE_PROJECT",
    label: "Project Deletion & Archival",
    description:
      "Permanently remove or archive construction project workspaces and all linked data.",
    category: "Company Governance",
    minLevel: 5,
    allowedRoles: [
      "SUPER_ADMIN",
      "QUALITY_DIRECTOR",
      "EXECUTIVE_MANAGEMENT",
    ],
  },

  // ─── Project Specification & Matrix ───
  CREATE_PROJECT: {
    key: "CREATE_PROJECT",
    label: "Provision New Project Workspace",
    description:
      "Initialize multi-tenant construction workspaces, 3D BIM registries, and baseline floor levels (Executive & PM Authority only).",
    category: "Project Management",
    minLevel: 4,
    allowedRoles: [
      "SUPER_ADMIN",
      "QUALITY_DIRECTOR",
      "EXECUTIVE_MANAGEMENT",
      "PROJECT_MANAGER",
      "OPERATIONS_MANAGER",
    ],
  },
  EDIT_PROJECT: {
    key: "EDIT_PROJECT",
    label: "Edit Project Specification",
    description:
      "Update project metadata, client/contractor stakeholders, dates, progress, and cover imagery (Executive & PM Authority only).",
    category: "Project Management",
    minLevel: 4,
    allowedRoles: [
      "SUPER_ADMIN",
      "QUALITY_DIRECTOR",
      "EXECUTIVE_MANAGEMENT",
      "PROJECT_MANAGER",
      "OPERATIONS_MANAGER",
    ],
  },
  ASSIGN_STAFF: {
    key: "ASSIGN_STAFF",
    label: "Configure Team Assignment Matrix",
    description:
      "Assign or remove engineers, inspectors, and site operations staff from project workspaces (Project & Quality Leadership only).",
    category: "Project Management",
    minLevel: 4,
    allowedRoles: [
      "SUPER_ADMIN",
      "QUALITY_DIRECTOR",
      "EXECUTIVE_MANAGEMENT",
      "PROJECT_MANAGER",
      "OPERATIONS_MANAGER",
      "QUALITY_MANAGER",
    ],
  },

  // ─── Non-Conformance Reports (NCR) ───
  CREATE_NCR: {
    key: "CREATE_NCR",
    label: "Raise Defect Non-Conformance (NCR)",
    description:
      "Document structural non-conformances, capture before photos, and define initial defect location.",
    category: "Defects & Quality Control",
    minLevel: 2,
    disallowedRoles: ["SUPPLIER_VENDOR", "SUB_CONTRACTOR"],
  },
  EDIT_NCR: {
    key: "EDIT_NCR",
    label: "Amend NCR Properties & Corrective Actions",
    description:
      "Update root cause analysis, specify standard specification references, and log remedial action items.",
    category: "Defects & Quality Control",
    minLevel: 2,
  },
  TRANSITION_NCR_STATUS: {
    key: "TRANSITION_NCR_STATUS",
    label: "Transition NCR Workflow Lifecycle",
    description:
      "Shift NCR state between OPEN, UNDER_REVIEW, and RESOLVED status with transition audit logs.",
    category: "Defects & Quality Control",
    minLevel: 2,
  },
  APPROVE_CLOSE_NCR: {
    key: "APPROVE_CLOSE_NCR",
    label: "Official NCR Closeout & Statutory Verification",
    description:
      "Verify post-remedial site physical inspection, approve specification compliance, and close NCR.",
    category: "Defects & Quality Control",
    minLevel: 4, // Level 4 QA/QC Authority (QAQC Engineer, Quality Manager, Project Manager, Super Admin)
  },
  DELETE_NCR: {
    key: "DELETE_NCR",
    label: "Permanently Delete NCR Record",
    description:
      "Purge non-conformance records and un-index photographic defect evidence.",
    category: "Defects & Quality Control",
    minLevel: 4,
  },
  ISSUE_SITE_INSTRUCTION: {
    key: "ISSUE_SITE_INSTRUCTION",
    label: "Issue Formal Site Instruction (Warning / Stop-Work)",
    description:
      "Issue unilateral contractual warning document and mandatory directives against overdue NCRs.",
    category: "Defects & Quality Control",
    minLevel: 4, // Level 4 Quality Authority
  },

  // ─── Site Instructions (SI) ───
  CREATE_SITE_INSTRUCTION: {
    key: "CREATE_SITE_INSTRUCTION",
    label: "Draft Site Instruction Notice",
    description:
      "Draft statutory contractual notices, mandatory action items, and compliance deadlines.",
    category: "Site Instructions",
    minLevel: 4,
  },
  SIGN_ISSUE_SITE_INSTRUCTION: {
    key: "SIGN_ISSUE_SITE_INSTRUCTION",
    label: "Digitally Sign & Issue Site Instruction",
    description:
      "Apply unilateral digital signature and formally transmit binding instruction notice to contractor.",
    category: "Site Instructions",
    minLevel: 4,
  },
  ACKNOWLEDGE_SITE_INSTRUCTION: {
    key: "ACKNOWLEDGE_SITE_INSTRUCTION",
    label: "Acknowledge Instruction Compliance",
    description:
      "Log formal acknowledgment of instruction receipt and submit rectification confirmation.",
    category: "Site Instructions",
    minLevel: 2,
  },
  CANCEL_SITE_INSTRUCTION: {
    key: "CANCEL_SITE_INSTRUCTION",
    label: "Cancel or Supersede Site Instruction",
    description:
      "Revoke or supersede an active warning notice once verified satisfactory.",
    category: "Site Instructions",
    minLevel: 4,
  },
  DELETE_SITE_INSTRUCTION: {
    key: "DELETE_SITE_INSTRUCTION",
    label: "Delete Site Instruction Record",
    description: "Permanently delete an instruction document.",
    category: "Site Instructions",
    minLevel: 4,
  },

  // ─── Permit to Pour (PTP) ───
  CREATE_PTP: {
    key: "CREATE_PTP",
    label: "Request Permit to Pour (PTP)",
    description:
      "Initiate a new permit to pour for a structural element, specify target volume, grade, and pour date.",
    category: "Permit to Pour (PTP)",
    minLevel: 2,
  },
  EDIT_PTP: {
    key: "EDIT_PTP",
    label: "Edit PTP Specification & Checklist",
    description:
      "Update formwork, rebar, MEP embedded items, and concrete mix design specifications.",
    category: "Permit to Pour (PTP)",
    minLevel: 2,
  },
  SIGN_PTP_QAQC: {
    key: "SIGN_PTP_QAQC",
    label: "QA/QC Engineer PTP Sign-Off",
    description:
      "Complete QA/QC pre-pour inspection verification and apply digital signature endorsement.",
    category: "Permit to Pour (PTP)",
    minLevel: 3,
    allowedRoles: [
      "QAQC_ENGINEER",
      "SENIOR_QAQC_ENGINEER",
      "QUALITY_MANAGER",
      "DEPUTY_QUALITY_MANAGER",
      "QAQC_INSPECTOR",
      "SUPER_ADMIN",
      "QUALITY_DIRECTOR",
    ],
  },
  SIGN_PTP_CM: {
    key: "SIGN_PTP_CM",
    label: "Construction Manager PTP Sign-Off",
    description:
      "Validate site logistics, pump access, vibrator readiness, and apply CM digital signature.",
    category: "Permit to Pour (PTP)",
    minLevel: 3,
    allowedRoles: [
      "CONSTRUCTION_MANAGER",
      "OPERATIONS_MANAGER",
      "PROJECT_MANAGER",
      "SUPER_ADMIN",
      "QUALITY_DIRECTOR",
      "EXECUTIVE_MANAGEMENT",
    ],
  },
  SIGN_PTP_CONSULTANT: {
    key: "SIGN_PTP_CONSULTANT",
    label: "Consultant / RE Concurrence Sign-Off",
    description:
      "Apply resident engineer / consultant approval stamp on pre-pour permit.",
    category: "Permit to Pour (PTP)",
    minLevel: 1,
    allowedRoles: [
      "CONSULTANT",
      "CLIENT_REPRESENTATIVE",
      "SUPER_ADMIN",
      "QUALITY_MANAGER",
      "QUALITY_DIRECTOR",
    ],
  },
  AUTHORIZE_POUR_FINAL: {
    key: "AUTHORIZE_POUR_FINAL",
    label: "Final Pour Authorization Approval",
    description:
      "Issue final statutory authorization for concrete batching and placement to proceed.",
    category: "Permit to Pour (PTP)",
    minLevel: 4,
  },
  RECORD_POUR_EXECUTION: {
    key: "RECORD_POUR_EXECUTION",
    label: "Record Pour Execution & Cube Batching",
    description:
      "Log actual poured volume, slump test results, batch truck dockets, and cast cube sample IDs.",
    category: "Permit to Pour (PTP)",
    minLevel: 2,
  },
  DELETE_PTP: {
    key: "DELETE_PTP",
    label: "Delete Permit to Pour Record",
    description: "Permanently remove a permit to pour document.",
    category: "Permit to Pour (PTP)",
    minLevel: 4,
  },

  // ─── Inspections & Hold Points ───
  CREATE_INSPECTION: {
    key: "CREATE_INSPECTION",
    label: "Create Inspection Request & Checklist",
    description:
      "Schedule hold points and initialize inspection checklists for structural trades.",
    category: "Inspections & Checklists",
    minLevel: 2,
  },
  PERFORM_INSPECTION_CHECKLIST: {
    key: "PERFORM_INSPECTION_CHECKLIST",
    label: "Execute Checklist Item Evaluation",
    description:
      "Record itemized Pass, Fail, Observation results and attach field inspection photos.",
    category: "Inspections & Checklists",
    minLevel: 2,
  },
  SIGN_INSPECTION_QAQC: {
    key: "SIGN_INSPECTION_QAQC",
    label: "QA/QC Inspection Sign-Off",
    description:
      "Apply QA/QC inspector / engineer digital signature to completed checklist.",
    category: "Inspections & Checklists",
    minLevel: 3,
    allowedRoles: [
      "QAQC_ENGINEER",
      "SENIOR_QAQC_ENGINEER",
      "QUALITY_MANAGER",
      "DEPUTY_QUALITY_MANAGER",
      "QAQC_INSPECTOR",
      "LEAD_QUALITY_AUDITOR",
      "QUALITY_AUDITOR",
      "SUPER_ADMIN",
      "QUALITY_DIRECTOR",
    ],
  },
  SIGN_INSPECTION_CONSULTANT: {
    key: "SIGN_INSPECTION_CONSULTANT",
    label: "Consultant Witness Sign-Off",
    description: "Apply consultant endorsement on hold point verification.",
    category: "Inspections & Checklists",
    minLevel: 1,
    allowedRoles: [
      "CONSULTANT",
      "CLIENT_REPRESENTATIVE",
      "THIRD_PARTY_INSPECTOR",
      "SUPER_ADMIN",
      "QUALITY_DIRECTOR",
    ],
  },
  APPROVE_INSPECTION: {
    key: "APPROVE_INSPECTION",
    label: "Official Inspection Approval & Release",
    description:
      "Formally approve inspection report and clear structural trade hold point.",
    category: "Inspections & Checklists",
    minLevel: 3,
    allowedRoles: [
      "QAQC_ENGINEER",
      "SENIOR_QAQC_ENGINEER",
      "QUALITY_MANAGER",
      "DEPUTY_QUALITY_MANAGER",
      "PROJECT_MANAGER",
      "SUPER_ADMIN",
      "QUALITY_DIRECTOR",
    ],
  },
  DELETE_INSPECTION: {
    key: "DELETE_INSPECTION",
    label: "Delete Inspection Record",
    description: "Permanently delete an inspection checklist record.",
    category: "Inspections & Checklists",
    minLevel: 4,
  },

  // ─── Concrete & Laboratory Quality Control ───
  CREATE_CONCRETE_SAMPLE: {
    key: "CREATE_CONCRETE_SAMPLE",
    label: "Create Concrete Cube Sample Set",
    description:
      "Register cube sample specimens, cast date, mix grade, slump, and pour location.",
    category: "Concrete & Laboratory",
    minLevel: 2,
  },
  ENTER_CUBE_CRUSH_TEST: {
    key: "ENTER_CUBE_CRUSH_TEST",
    label: "Input Crushing Load Test Data",
    description:
      "Record test age (7D, 14D, 28D), crushing load in kN, density, and fracture failure mode.",
    category: "Concrete & Laboratory",
    minLevel: 2,
  },
  CERTIFY_28D_STRENGTH: {
    key: "CERTIFY_28D_STRENGTH",
    label: "Certify 28-Day Concrete Strength Conformity",
    description:
      "Validate compliance with BS EN 12390-3 / ASTM C39 and issue certified laboratory test report.",
    category: "Concrete & Laboratory",
    minLevel: 3,
  },
  MODIFY_MIX_DESIGN: {
    key: "MODIFY_MIX_DESIGN",
    label: "Configure Concrete Mix Designs",
    description:
      "Manage approved batch plant concrete mix codes, target strengths, and aggregate proportions.",
    category: "Concrete & Laboratory",
    minLevel: 3,
  },
  DELETE_CONCRETE_RECORD: {
    key: "DELETE_CONCRETE_RECORD",
    label: "Delete Cube Specimen Record",
    description: "Permanently remove a concrete cube test record.",
    category: "Concrete & Laboratory",
    minLevel: 2,
  },

  // ─── Technical Queries (RFI & MAR) ───
  CREATE_RFI: {
    key: "CREATE_RFI",
    label: "Raise Request for Information (RFI)",
    description:
      "Submit technical clarification requests to consultants and design engineers.",
    category: "Technical Submittals",
    minLevel: 2,
  },
  RESPOND_RFI: {
    key: "RESPOND_RFI",
    label: "Provide Technical Response to RFI",
    description:
      "Supply official engineering response, attach revised drawings, and assign cost/schedule impact.",
    category: "Technical Submittals",
    minLevel: 3,
  },
  CLOSE_RFI: {
    key: "CLOSE_RFI",
    label: "Formally Close RFI Query",
    description: "Verify RFI resolution and close out technical item.",
    category: "Technical Submittals",
    minLevel: 3,
  },
  CREATE_MAR: {
    key: "CREATE_MAR",
    label: "Submit Material Approval (MAR)",
    description:
      "Submit manufacturer technical data sheets, test certificates, and samples for review.",
    category: "Technical Submittals",
    minLevel: 2,
  },
  REVIEW_MAR: {
    key: "REVIEW_MAR",
    label: "Review Material Submittal",
    description:
      "Perform specification compliance audit on submitted materials.",
    category: "Technical Submittals",
    minLevel: 3,
  },
  APPROVE_REJECT_MAR: {
    key: "APPROVE_REJECT_MAR",
    label: "Formally Approve / Reject Material (MAR)",
    description:
      "Issue official Code A (Approved), Code B (Approved with Comments), or Code C (Rejected) verdict.",
    category: "Technical Submittals",
    minLevel: 3,
  },

  // ─── Material Inspection Reports (MIR) ───
  CREATE_MIR: {
    key: "CREATE_MIR",
    label: "Raise Material Inspection Report (MIR)",
    description:
      "Record physical receipt of site materials, verify against approved MAR, log quantities, and check delivery conditions.",
    category: "Material Inspections (MIR)",
    minLevel: 2,
  },
  REVIEW_MIR: {
    key: "REVIEW_MIR",
    label: "Review Material Inspection Report",
    description:
      "Inspect delivered materials on-site, verify mill certificates, dimensions, and lab sampling.",
    category: "Material Inspections (MIR)",
    minLevel: 2,
  },
  APPROVE_REJECT_MIR: {
    key: "APPROVE_REJECT_MIR",
    label: "Formally Sign & Stamp MIR Disposition",
    description:
      "Issue final inspection disposition verdict (Accepted, Accepted as Noted, Rejected, Hold for Testing) with consultant sign-off.",
    category: "Material Inspections (MIR)",
    minLevel: 2,
  },
  DELETE_MIR: {
    key: "DELETE_MIR",
    label: "Delete Material Inspection Record",
    description: "Permanently remove a material inspection report document.",
    category: "Material Inspections (MIR)",
    minLevel: 4,
  },

  // ─── Site Observations & Snags ───
  CREATE_SITE_COMMENT: {
    key: "CREATE_SITE_COMMENT",
    label: "Log Field Observation / Snag",
    description:
      "Capture quick quality notes and preliminary observations before escalating to NCR.",
    category: "Field Observations",
    minLevel: 2,
  },
  RESOLVE_SITE_COMMENT: {
    key: "RESOLVE_SITE_COMMENT",
    label: "Resolve Observation / Snag",
    description:
      "Attach photo of rectified condition and mark observation as closed.",
    category: "Field Observations",
    minLevel: 2,
  },
  DELETE_SITE_COMMENT: {
    key: "DELETE_SITE_COMMENT",
    label: "Delete Site Observation",
    description: "Delete observation record from field register.",
    category: "Field Observations",
    minLevel: 4,
  },

  // ─── Weekly Reports & Document Control ───
  GENERATE_WEEKLY_REPORT: {
    key: "GENERATE_WEEKLY_REPORT",
    label: "Compile Weekly Quality Report",
    description:
      "Generate comprehensive progress, NCR stats, cube test summary, and upcoming pour milestones.",
    category: "Reports & Document Control",
    minLevel: 2,
  },
  SIGN_WEEKLY_REPORT: {
    key: "SIGN_WEEKLY_REPORT",
    label: "Authorize & Publish Weekly Quality Report",
    description:
      "Apply executive quality signature and transmit official weekly dossier to client.",
    category: "Reports & Document Control",
    minLevel: 4,
  },
  UPLOAD_CONTROLLED_DOCUMENT: {
    key: "UPLOAD_CONTROLLED_DOCUMENT",
    label: "Upload Controlled Project Document",
    description:
      "Upload approved inspection test plans (ITP), method statements, and structural drawings.",
    category: "Reports & Document Control",
    minLevel: 3,
  },
  DELETE_DOCUMENT: {
    key: "DELETE_DOCUMENT",
    label: "Delete Controlled Document",
    description: "Delete controlled document from project library.",
    category: "Reports & Document Control",
    minLevel: 4,
  },

  // ─── Daily Site Log (Site Diary - Multi-Sphere) ───
  CREATE_DAILY_LOG: {
    key: "CREATE_DAILY_LOG",
    label: "Create Daily Site Log",
    description:
      "Initialize and log daily construction activities, weather conditions, manpower, and trade logs.",
    category: "Daily Site Log",
    minLevel: 2,
  },
  EDIT_DAILY_LOG: {
    key: "EDIT_DAILY_LOG",
    label: "Edit Daily Site Log",
    description:
      "Update daily site log activities, trade headcounts, equipment, delays, or remarks.",
    category: "Daily Site Log",
    minLevel: 2,
  },
  SUBMIT_DAILY_LOG: {
    key: "SUBMIT_DAILY_LOG",
    label: "Submit Daily Site Log for Review",
    description:
      "Submit completed draft daily site log to project governance and stakeholder sign-off workflow.",
    category: "Daily Site Log",
    minLevel: 2,
  },
  SIGN_DAILY_LOG_QAQC: {
    key: "SIGN_DAILY_LOG_QAQC",
    label: "QA/QC Daily Log Certification",
    description:
      "Apply digital signature and stamp certifying daily quality compliance, inspections, and materials.",
    category: "Daily Site Log",
    minLevel: 3,
    allowedRoles: [
      "QAQC_ENGINEER",
      "SENIOR_QAQC_ENGINEER",
      "QUALITY_MANAGER",
      "DEPUTY_QUALITY_MANAGER",
      "QAQC_INSPECTOR",
      "SUPER_ADMIN",
      "QUALITY_DIRECTOR",
    ],
  },
  SIGN_DAILY_LOG_SAFETY: {
    key: "SIGN_DAILY_LOG_SAFETY",
    label: "HSE / Safety Daily Log Endorsement",
    description:
      "Endorse daily site safety records, toolbox talks, and permits-to-work.",
    category: "Daily Site Log",
    minLevel: 3,
    allowedRoles: [
      "SAFETY_MANAGER",
      "SUPER_ADMIN",
      "QUALITY_DIRECTOR",
      "PROJECT_MANAGER",
    ],
  },
  SIGN_DAILY_LOG_CONSULTANT: {
    key: "SIGN_DAILY_LOG_CONSULTANT",
    label: "Consultant / Client Daily Endorsement",
    description:
      "Record consultant walkthrough observations, instructions, and review endorsement.",
    category: "Daily Site Log",
    minLevel: 1,
    allowedRoles: [
      "CONSULTANT",
      "CLIENT_REPRESENTATIVE",
      "THIRD_PARTY_INSPECTOR",
      "SUPER_ADMIN",
      "QUALITY_DIRECTOR",
    ],
  },
  APPROVE_DAILY_LOG: {
    key: "APPROVE_DAILY_LOG",
    label: "Final Project Manager Approval",
    description:
      "Formally approve and close the daily site log record for contractual and archived reporting.",
    category: "Daily Site Log",
    minLevel: 4,
    allowedRoles: [
      "PROJECT_MANAGER",
      "OPERATIONS_MANAGER",
      "SUPER_ADMIN",
      "QUALITY_DIRECTOR",
      "EXECUTIVE_MANAGEMENT",
    ],
  },
  DELETE_DAILY_LOG: {
    key: "DELETE_DAILY_LOG",
    label: "Delete Daily Site Log",
    description: "Permanently delete an uncertified or draft daily site log.",
    category: "Daily Site Log",
    minLevel: 4,
    allowedRoles: [
      "PROJECT_MANAGER",
      "OPERATIONS_MANAGER",
      "SUPER_ADMIN",
      "QUALITY_DIRECTOR",
      "EXECUTIVE_MANAGEMENT",
    ],
  },

  // ─── Structural BIM & Element Registry (Strict QA/QC Authority) ───
  VIEW_ELEMENT_REGISTRY: {
    key: "VIEW_ELEMENT_REGISTRY",
    label: "View Structural Element Registry & 3D Twin",
    description:
      "Inspect structural asset database, 3D WebGL element models, and volumetric concrete passports (QA/QC Personnel only).",
    category: "Structural BIM & Elements",
    minLevel: 2,
    allowedRoles: [
      "SUPER_ADMIN",
      "QUALITY_DIRECTOR",
      "EXECUTIVE_MANAGEMENT",
      "QUALITY_MANAGER",
      "DEPUTY_QUALITY_MANAGER",
      "LEAD_QUALITY_AUDITOR",
      "QUALITY_AUDITOR",
      "SENIOR_QAQC_ENGINEER",
      "QAQC_ENGINEER",
      "QAQC_INSPECTOR",
      "MATERIALS_ENGINEER",
    ],
  },
  CREATE_ELEMENT: {
    key: "CREATE_ELEMENT",
    label: "Register New Structural Element",
    description:
      "Register structural column, beam, slab, wall, footing, or stair members into spatial BIM twin.",
    category: "Structural BIM & Elements",
    minLevel: 2,
    allowedRoles: [
      "SUPER_ADMIN",
      "QUALITY_DIRECTOR",
      "EXECUTIVE_MANAGEMENT",
      "QUALITY_MANAGER",
      "DEPUTY_QUALITY_MANAGER",
      "SENIOR_QAQC_ENGINEER",
      "QAQC_ENGINEER",
      "QAQC_INSPECTOR",
      "MATERIALS_ENGINEER",
    ],
  },
  EDIT_ELEMENT: {
    key: "EDIT_ELEMENT",
    label: "Edit Structural Element & Dimensions",
    description:
      "Modify geometry dimensions, rebar schedules, design concrete grade, and elevation datums.",
    category: "Structural BIM & Elements",
    minLevel: 2,
    allowedRoles: [
      "SUPER_ADMIN",
      "QUALITY_DIRECTOR",
      "EXECUTIVE_MANAGEMENT",
      "QUALITY_MANAGER",
      "DEPUTY_QUALITY_MANAGER",
      "SENIOR_QAQC_ENGINEER",
      "QAQC_ENGINEER",
      "QAQC_INSPECTOR",
      "MATERIALS_ENGINEER",
    ],
  },
  DELETE_ELEMENT: {
    key: "DELETE_ELEMENT",
    label: "Delete Structural Element",
    description:
      "Permanently delete structural element from registry and unbind linked inspection passports.",
    category: "Structural BIM & Elements",
    minLevel: 4,
    allowedRoles: [
      "SUPER_ADMIN",
      "QUALITY_DIRECTOR",
      "EXECUTIVE_MANAGEMENT",
      "QUALITY_MANAGER",
      "DEPUTY_QUALITY_MANAGER",
    ],
  },
  BULK_MANAGE_ELEMENTS: {
    key: "BULK_MANAGE_ELEMENTS",
    label: "Bulk Generate & Batch Migrate Elements",
    description:
      "Batch generate matrix structural elements and execute bulk level/package reassignments.",
    category: "Structural BIM & Elements",
    minLevel: 3,
    allowedRoles: [
      "SUPER_ADMIN",
      "QUALITY_DIRECTOR",
      "EXECUTIVE_MANAGEMENT",
      "QUALITY_MANAGER",
      "DEPUTY_QUALITY_MANAGER",
      "SENIOR_QAQC_ENGINEER",
      "QAQC_ENGINEER",
    ],
  },
};

/**
 * Check whether a user role possesses a specific permission.
 */
export function hasPermission(
  role: UserRole | undefined,
  permission: PermissionKey,
): boolean {
  if (!role) return false;

  // Super Admin, Quality Director, and Executive Management have top-tier executive governance
  if (
    role === "SUPER_ADMIN" ||
    role === "QUALITY_DIRECTOR" ||
    role === "EXECUTIVE_MANAGEMENT"
  ) {
    return true;
  }

  const def = PERMISSION_DEFINITIONS[permission];
  if (!def) return false;

  // Check disallowed roles explicitly
  if (def.disallowedRoles && def.disallowedRoles.includes(role)) {
    return false;
  }

  // If explicitly allowed roles are defined, restrict strictly to those roles
  if (def.allowedRoles && def.allowedRoles.length > 0) {
    return def.allowedRoles.includes(role);
  }

  const roleLevel = ROLE_LEVELS[role] || 1;
  return roleLevel >= def.minLevel;
}

/**
 * Get all permissions permitted for a given user role.
 */
export function getRolePermissions(role: UserRole): PermissionKey[] {
  const allKeys = Object.keys(PERMISSION_DEFINITIONS) as PermissionKey[];
  return allKeys.filter((key) => hasPermission(role, key));
}

/**
 * React Hook for easy RBAC evaluations in components.
 */
export function useRBAC() {
  const { currentUser } = useAuthStore();
  const role = currentUser?.role;
  const roleLevel = role ? ROLE_LEVELS[role] || 1 : 1;
  const roleTitle = role ? ROLE_LABELS[role] || role : "Unauthenticated";

  const check = (permission: PermissionKey): boolean => {
    return hasPermission(role, permission);
  };

  const isLevel = (minLevel: number): boolean => {
    return roleLevel >= minLevel;
  };

  return {
    currentUser,
    role,
    roleLevel,
    roleTitle,
    check,
    isLevel,
    hasPermission: check,
    canManageUsers: check("MANAGE_USERS"),
    canManageCompany: check("MANAGE_COMPANY_SETTINGS"),
    canEditProject: check("EDIT_PROJECT"),
    canCloseNCR: check("APPROVE_CLOSE_NCR"),
    canIssueSiteInstruction: check("ISSUE_SITE_INSTRUCTION"),
    canAuthorizePour: check("AUTHORIZE_POUR_FINAL"),
    canSignQAQC: check("SIGN_PTP_QAQC"),
    canSignCM: check("SIGN_PTP_CM"),
    canSignConsultant: check("SIGN_PTP_CONSULTANT"),
    canViewElements: check("VIEW_ELEMENT_REGISTRY"),
    canCreateElement: check("CREATE_ELEMENT"),
    canEditElement: check("EDIT_ELEMENT"),
    canDeleteElement: check("DELETE_ELEMENT"),
    canBulkManageElements: check("BULK_MANAGE_ELEMENTS"),
  };
}

/**
 * PermissionGate Component
 * Conditionally renders children if the logged-in user possesses the specified permission.
 */
interface PermissionGateProps {
  permission: PermissionKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  children,
  fallback = null,
}) => {
  const { check } = useRBAC();
  if (check(permission)) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
};
