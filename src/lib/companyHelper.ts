import { useState, useEffect, useCallback, useMemo } from "react";
import { Company, CompanySettings, Project } from "@/types";
import { dbService } from "@/lib/db";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";

// ==========================================
// DEFAULT COMPANY FALLBACK VALUES
// ==========================================
export const DEFAULT_COMPANY_ID = "-Oubn5JnM98I3QvSzHCB";
export const DEFAULT_COMPANY_NAME = "Collection Developments LTD";
export const DEFAULT_COMPANY_LEGAL_NAME = "Collection Developments Limited";
export const DEFAULT_COMPANY_EMAIL = "quality@collectiondev.com";
export const DEFAULT_COMPANY_PHONE = "+44 (0) 20 7946 0912";
export const DEFAULT_COMPANY_ADDRESS =
  "14 Bankside Boulevard, London SE1 9SG, United Kingdom";
export const DEFAULT_COMPANY_WEBSITE = "https://collectiondevelopments.com";
export const DEFAULT_COMPANY_REG_NO = "CR-2024-8849102";
export const DEFAULT_COMPANY_TAX_NO = "GB 992 819 021";

export const DEFAULT_COMPANY_STANDARDS: string[] = [
  "ISO 9001:2015 Quality Management Systems",
  "BS EN 12390 Testing Hardened Concrete",
  "ASTM A615 / A615M Deformed Steel Bars",
  "ACI 318 Building Code Requirements for Structural Concrete",
  "BS 8110 Structural Use of Concrete",
  "BS 4449 Carbon Steel Bars for the Reinforcement of Concrete",
];

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  ncrPrefix: "NCR",
  rfiPrefix: "RFI",
  marPrefix: "MAR",
  mirPrefix: "MIR",
  siteCommentPrefix: "QC/COM",
  inspectionPrefix: "INSP",
  ptpPrefix: "PTP",
  weeklyReportPrefix: "WQR",
  siteInstructionPrefix: "SI",
  cubeTestStandard: "BS EN 12390",
  rebarStandard: "BS 4449",
  notifications: {
    notifyNCR: true,
    notifyInspection: true,
    notifyCubeFailure: true,
    notifyPTP: true,
  },
};

export type FormModuleType =
  | "INSPECTION"
  | "INSP"
  | "NCR"
  | "RFI"
  | "MAR"
  | "MIR"
  | "POUR_PERMIT"
  | "PTP"
  | "SITE_COMMENT"
  | "WEEKLY_REPORT"
  | "SITE_INSTRUCTION"
  | "SI"
  | "CUBE"
  | "STEEL"
  | "DELIVERY";

// ==========================================
// PURE UTILITY EXTRACTORS (Static Helpers)
// ==========================================

/**
 * Returns the company display name with graceful fallback
 */
export function getCompanyName(
  company?: Partial<Company> | null,
  fallback = DEFAULT_COMPANY_NAME,
): string {
  if (!company) return fallback;
  return company.name?.trim() || company.legalName?.trim() || fallback;
}

/**
 * Returns company logo image URL or base64 data URL
 */
export function getCompanyLogo(
  company?: Partial<Company> | null,
): string | undefined {
  if (!company) return undefined;
  return company.logoUrl || company.logo || undefined;
}

/**
 * Returns official company email
 */
export function getCompanyEmail(
  company?: Partial<Company> | null,
  fallback = DEFAULT_COMPANY_EMAIL,
): string {
  if (!company) return fallback;
  return company.email?.trim() || fallback;
}

/**
 * Returns official company telephone number
 */
export function getCompanyPhone(
  company?: Partial<Company> | null,
  fallback = DEFAULT_COMPANY_PHONE,
): string {
  if (!company) return fallback;
  return company.phone?.trim() || fallback;
}

/**
 * Returns physical head office address
 */
export function getCompanyAddress(
  company?: Partial<Company> | null,
  fallback = DEFAULT_COMPANY_ADDRESS,
): string {
  if (!company) return fallback;
  return company.address?.trim() || fallback;
}

/**
 * Returns official corporate website
 */
export function getCompanyWebsite(
  company?: Partial<Company> | null,
  fallback = DEFAULT_COMPANY_WEBSITE,
): string {
  if (!company) return fallback;
  return company.website?.trim() || fallback;
}

/**
 * Returns commercial registration number
 */
export function getCompanyRegistration(
  company?: Partial<Company> | null,
  fallback = DEFAULT_COMPANY_REG_NO,
): string {
  if (!company) return fallback;
  return company.registrationNo?.trim() || fallback;
}

/**
 * Returns corporate technical standards
 */
export function getCompanyStandards(
  company?: Partial<Company> | null,
): string[] {
  if (!company?.standards || company.standards.length === 0) {
    return DEFAULT_COMPANY_STANDARDS;
  }
  return company.standards;
}

/**
 * Returns company settings with defaults merged
 */
export function getCompanySettings(
  company?: Partial<Company> | null,
): CompanySettings {
  return {
    ...DEFAULT_COMPANY_SETTINGS,
    ...(company?.settings || {}),
    notifications: {
      ...DEFAULT_COMPANY_SETTINGS.notifications,
      ...(company?.settings?.notifications || {}),
    },
    smtpServer: company?.settings?.smtpServer || undefined,
  };
}

/**
 * Fetches the prefix configured for a specific QA/QC module
 */
export function getModulePrefix(
  formType: FormModuleType,
  companyOrSettings?: Partial<Company> | CompanySettings | null,
): string {
  const settings: CompanySettings =
    companyOrSettings && "settings" in companyOrSettings
      ? getCompanySettings(companyOrSettings as Partial<Company>)
      : (companyOrSettings as CompanySettings) || DEFAULT_COMPANY_SETTINGS;

  switch (formType) {
    case "INSPECTION":
    case "INSP":
      return (
        settings.inspectionPrefix ||
        DEFAULT_COMPANY_SETTINGS.inspectionPrefix ||
        "INSP"
      );
    case "NCR":
      return settings.ncrPrefix || DEFAULT_COMPANY_SETTINGS.ncrPrefix || "NCR";
    case "RFI":
      return settings.rfiPrefix || DEFAULT_COMPANY_SETTINGS.rfiPrefix || "RFI";
    case "MAR":
      return settings.marPrefix || DEFAULT_COMPANY_SETTINGS.marPrefix || "MAR";
    case "MIR":
      return settings.mirPrefix || DEFAULT_COMPANY_SETTINGS.mirPrefix || "MIR";
    case "POUR_PERMIT":
    case "PTP":
      return settings.ptpPrefix || DEFAULT_COMPANY_SETTINGS.ptpPrefix || "PTP";
    case "SITE_COMMENT":
      return (
        settings.siteCommentPrefix ||
        DEFAULT_COMPANY_SETTINGS.siteCommentPrefix ||
        "QC/COM"
      );
    case "WEEKLY_REPORT":
      return (
        settings.weeklyReportPrefix ||
        DEFAULT_COMPANY_SETTINGS.weeklyReportPrefix ||
        "WQR"
      );
    case "SITE_INSTRUCTION":
    case "SI":
      return (
        settings.siteInstructionPrefix ||
        DEFAULT_COMPANY_SETTINGS.siteInstructionPrefix ||
        "SI"
      );
    case "CUBE":
      return "CUBE";
    case "STEEL":
      return "STL";
    case "DELIVERY":
      return "DEL";
    default:
      return "QC";
  }
}

/**
 * Generates an official standardized document number using the company's live prefix
 */
export function generateModuleDocNumber(
  formType: FormModuleType,
  companyOrSettings?: Partial<Company> | CompanySettings | null,
  options?: {
    year?: number;
    count?: number;
    customSuffix?: string;
    projectCode?: string;
  },
): string {
  const prefix = getModulePrefix(formType, companyOrSettings);
  const year = options?.year || new Date().getFullYear();
  const seq =
    options?.count !== undefined
      ? String(options.count).padStart(3, "0")
      : String(Math.floor(Math.random() * 800 + 100)).padStart(3, "0");

  if (formType === "SITE_COMMENT") {
    return `${prefix}/${year}/${seq}`;
  }

  if (formType === "WEEKLY_REPORT") {
    const weekNumber = Math.ceil(
      (new Date().getTime() -
        new Date(new Date().getFullYear(), 0, 1).getTime()) /
        (7 * 24 * 60 * 60 * 1000),
    );
    return `${prefix}-${year}-W${String(weekNumber).padStart(2, "0")}`;
  }

  if (formType === "SITE_INSTRUCTION" || formType === "SI") {
    const pCode = (options?.projectCode || "").trim().toUpperCase();
    return pCode
      ? `${pCode}-${prefix}-${year}-${seq}`
      : `${prefix}-${year}-${seq}`;
  }

  return `${prefix}-${year}-${seq}`;
}

/**
 * Generates two-letter initials from company name for logo avatars
 */
export function getCompanyInitials(name?: string): string {
  const compName = name || DEFAULT_COMPANY_NAME;
  const parts = compName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// ==========================================
// REACT HOOK: useCompany()
// ==========================================

export interface UseCompanyReturn {
  company: Company | null;
  companyId: string;
  name: string;
  legalName: string;
  logo: string | undefined;
  logoUrl: string | undefined;
  email: string;
  phone: string;
  address: string;
  website: string;
  registrationNo: string;
  taxNumber: string;
  standards: string[];
  settings: CompanySettings;
  isLoading: boolean;
  error: string | null;
  refreshCompany: () => Promise<void>;
  updateCompany: (updates: Partial<Company>) => Promise<void>;
  getPrefix: (formType: FormModuleType) => string;
  generateDocNumber: (
    formType: FormModuleType,
    options?: { count?: number; customSuffix?: string },
  ) => string;
}

export function useCompany(): UseCompanyReturn {
  const { currentUser, company: authCompany, setCompany } = useAuthStore();
  const { activeProject } = useProjectStore();

  const [activeCompanyId, setActiveCompanyId] = useState<string>(
    currentUser?.companyId ||
      authCompany?.id ||
      activeProject?.companyId ||
      DEFAULT_COMPANY_ID,
  );

  const [liveCompany, setLiveCompany] = useState<Company | null>(authCompany);
  const [isLoading, setIsLoading] = useState<boolean>(!authCompany);
  const [error, setError] = useState<string | null>(null);

  // Load and subscribe live to Firestore
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadCompany() {
      try {
        let targetId =
          currentUser?.companyId ||
          authCompany?.id ||
          activeProject?.companyId ||
          DEFAULT_COMPANY_ID;

        // 1. Try to fetch directly with targetId
        let comp = await dbService.getCompany(targetId);

        // 2. If not found, look up all companies in DB and pick the existing active one
        if (!comp) {
          const allComps = await dbService.getCompanies();
          if (allComps.length > 0) {
            comp = allComps[0];
            targetId = comp.id;
          }
        }

        if (!isMounted) return;

        if (comp) {
          setActiveCompanyId(comp.id);
          setLiveCompany(comp);
          setCompany(comp);
        } else {
          // If no company exists in DB at all, construct default
          const defaultComp: Company = {
            id: targetId,
            name: DEFAULT_COMPANY_NAME,
            legalName: DEFAULT_COMPANY_LEGAL_NAME,
            ownerId: currentUser?.uid || "admin",
            email: DEFAULT_COMPANY_EMAIL,
            phone: DEFAULT_COMPANY_PHONE,
            address: DEFAULT_COMPANY_ADDRESS,
            website: DEFAULT_COMPANY_WEBSITE,
            registrationNo: DEFAULT_COMPANY_REG_NO,
            taxNumber: DEFAULT_COMPANY_TAX_NO,
            standards: DEFAULT_COMPANY_STANDARDS,
            settings: DEFAULT_COMPANY_SETTINGS,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          setActiveCompanyId(targetId);
          setLiveCompany(defaultComp);
          setCompany(defaultComp);
        }
        setIsLoading(false);
      } catch (err: any) {
        if (!isMounted) return;
        console.warn("Error fetching company details:", err);
        setError("Failed to fetch live company details.");
        setIsLoading(false);
      }
    }

    loadCompany();

    // Real-time subscription
    const unsubscribe = dbService.subscribeCompany(activeCompanyId, (comp) => {
      if (!isMounted) return;
      if (comp) {
        setLiveCompany(comp);
        setCompany(comp);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [
    currentUser?.companyId,
    authCompany?.id,
    activeProject?.companyId,
    activeCompanyId,
    setCompany,
  ]);

  const refreshCompany = useCallback(async () => {
    setIsLoading(true);
    try {
      const comp = await dbService.getCompany(activeCompanyId);
      if (comp) {
        setLiveCompany(comp);
        setCompany(comp);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to refresh company.");
    } finally {
      setIsLoading(false);
    }
  }, [activeCompanyId, setCompany]);

  const updateCompany = useCallback(
    async (updates: Partial<Company>) => {
      try {
        const targetId =
          liveCompany?.id || activeCompanyId || DEFAULT_COMPANY_ID;
        const currentSettings = getCompanySettings(liveCompany);
        const incomingSettings = updates.settings || {};

        const mergedSettings: CompanySettings = {
          ncrPrefix:
            incomingSettings.ncrPrefix ||
            currentSettings.ncrPrefix ||
            DEFAULT_COMPANY_SETTINGS.ncrPrefix,
          rfiPrefix:
            incomingSettings.rfiPrefix ||
            currentSettings.rfiPrefix ||
            DEFAULT_COMPANY_SETTINGS.rfiPrefix,
          marPrefix:
            incomingSettings.marPrefix ||
            currentSettings.marPrefix ||
            DEFAULT_COMPANY_SETTINGS.marPrefix,
          siteCommentPrefix:
            incomingSettings.siteCommentPrefix ||
            currentSettings.siteCommentPrefix ||
            DEFAULT_COMPANY_SETTINGS.siteCommentPrefix,
          inspectionPrefix:
            incomingSettings.inspectionPrefix ||
            currentSettings.inspectionPrefix ||
            DEFAULT_COMPANY_SETTINGS.inspectionPrefix,
          ptpPrefix:
            incomingSettings.ptpPrefix ||
            currentSettings.ptpPrefix ||
            DEFAULT_COMPANY_SETTINGS.ptpPrefix,
          weeklyReportPrefix:
            incomingSettings.weeklyReportPrefix ||
            currentSettings.weeklyReportPrefix ||
            DEFAULT_COMPANY_SETTINGS.weeklyReportPrefix,
          siteInstructionPrefix:
            incomingSettings.siteInstructionPrefix ||
            currentSettings.siteInstructionPrefix ||
            DEFAULT_COMPANY_SETTINGS.siteInstructionPrefix,
          cubeTestStandard:
            incomingSettings.cubeTestStandard ||
            currentSettings.cubeTestStandard ||
            DEFAULT_COMPANY_SETTINGS.cubeTestStandard,
          rebarStandard:
            incomingSettings.rebarStandard ||
            currentSettings.rebarStandard ||
            DEFAULT_COMPANY_SETTINGS.rebarStandard,
          notifications: {
            ...DEFAULT_COMPANY_SETTINGS.notifications,
            ...(currentSettings.notifications || {}),
            ...(incomingSettings.notifications || {}),
          },
          smtpServer:
            incomingSettings.smtpServer !== undefined
              ? incomingSettings.smtpServer
              : currentSettings.smtpServer,
        };

        const merged: Company = {
          id: targetId,
          name: updates.name || liveCompany?.name || DEFAULT_COMPANY_NAME,
          legalName:
            updates.legalName ||
            liveCompany?.legalName ||
            DEFAULT_COMPANY_LEGAL_NAME,
          ownerId: liveCompany?.ownerId || currentUser?.uid || "admin",
          logo: updates.logo !== undefined ? updates.logo : liveCompany?.logo,
          logoUrl:
            updates.logoUrl !== undefined
              ? updates.logoUrl
              : liveCompany?.logoUrl,
          email:
            updates.email !== undefined ? updates.email : liveCompany?.email,
          phone:
            updates.phone !== undefined ? updates.phone : liveCompany?.phone,
          address:
            updates.address !== undefined
              ? updates.address
              : liveCompany?.address,
          website:
            updates.website !== undefined
              ? updates.website
              : liveCompany?.website,
          registrationNo:
            updates.registrationNo !== undefined
              ? updates.registrationNo
              : liveCompany?.registrationNo,
          taxNumber:
            updates.taxNumber !== undefined
              ? updates.taxNumber
              : liveCompany?.taxNumber,
          standards:
            updates.standards ||
            liveCompany?.standards ||
            DEFAULT_COMPANY_STANDARDS,
          settings: mergedSettings,
          createdAt: liveCompany?.createdAt || Date.now(),
          updatedAt: Date.now(),
        };

        await dbService.saveCompany(merged);
        setLiveCompany(merged);
        setCompany(merged);
      } catch (err: any) {
        console.error("Failed to update company in DB:", err);
        throw err;
      }
    },
    [activeCompanyId, liveCompany, setCompany, currentUser?.uid],
  );

  const effectiveCompany = liveCompany || authCompany;

  const getPrefix = useCallback(
    (formType: FormModuleType) => getModulePrefix(formType, effectiveCompany),
    [effectiveCompany],
  );

  const generateDocNumber = useCallback(
    (
      formType: FormModuleType,
      options?: { count?: number; customSuffix?: string },
    ) => generateModuleDocNumber(formType, effectiveCompany, options),
    [effectiveCompany],
  );

  return {
    company: effectiveCompany,
    companyId: activeCompanyId,
    name: getCompanyName(effectiveCompany),
    legalName: effectiveCompany?.legalName || getCompanyName(effectiveCompany),
    logo: getCompanyLogo(effectiveCompany),
    logoUrl: getCompanyLogo(effectiveCompany),
    email: getCompanyEmail(effectiveCompany),
    phone: getCompanyPhone(effectiveCompany),
    address: getCompanyAddress(effectiveCompany),
    website: getCompanyWebsite(effectiveCompany),
    registrationNo: getCompanyRegistration(effectiveCompany),
    taxNumber: effectiveCompany?.taxNumber || DEFAULT_COMPANY_TAX_NO,
    standards: getCompanyStandards(effectiveCompany),
    settings: getCompanySettings(effectiveCompany),
    isLoading,
    error,
    refreshCompany,
    updateCompany,
    getPrefix,
    generateDocNumber,
  };
}

/**
 * Standard dynamic company brand cell renderer for reports, printouts, and PDFs.
 * Resolves logo and company details dynamically from active Company or Project without hardcoding.
 * Matches the official NCR brand cell standard: Logo, Company Name, Address, Email & Phone.
 */
export function renderCompanyBrandCell(
  company: Partial<Company> = {},
  project: Partial<Project> = {},
): string {
  let backendCompany: Partial<Company> | null = null;
  try {
    backendCompany = useAuthStore.getState().company;
  } catch (e) {}

  if (!backendCompany && typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("jqms_current_company");
      if (stored) backendCompany = JSON.parse(stored);
    } catch (e) {}
  }

  const logo =
    company.logoUrl ||
    company.logo ||
    backendCompany?.logoUrl ||
    backendCompany?.logo ||
    (project as any)?.logoUrl ||
    (project as any)?.logo;

  const compName =
    company.name?.trim() ||
    company.legalName?.trim() ||
    backendCompany?.name?.trim() ||
    backendCompany?.legalName?.trim() ||
    DEFAULT_COMPANY_NAME;

  const compAddress =
    company.address?.trim() ||
    backendCompany?.address?.trim() ||
    DEFAULT_COMPANY_ADDRESS;

  const compEmail =
    company.email?.trim() ||
    backendCompany?.email?.trim() ||
    DEFAULT_COMPANY_EMAIL;

  const compPhone =
    company.phone?.trim() ||
    backendCompany?.phone?.trim() ||
    DEFAULT_COMPANY_PHONE;

  const contactItems = [compEmail, compPhone].filter(Boolean);
  const contactHtml =
    contactItems.length > 0
      ? `<div style="font-size: 7px; color: #64748b; font-weight: 500; margin-top: 1px; line-height: 1.15;">${contactItems.join(" &bull; ")}</div>`
      : "";

  const addressHtml = compAddress
    ? `<div style="font-size: 7.2px; color: #475569; font-weight: 500; margin-top: 1.5px; line-height: 1.15; max-width: 175px; margin-left: auto; margin-right: auto;">${compAddress}</div>`
    : "";

  if (logo) {
    return `
      <div style="line-height: 1.2; padding: 2px 4px; text-align: center; font-family: 'Segoe UI', Arial, sans-serif;">
        <img src="${logo}" style="max-height: 38px; max-width: 125px; object-fit: contain; margin-bottom: 2.5px; display: inline-block;" alt="${compName}" />
        <div style="font-weight: 800; font-size: 9.5px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.15;">
          ${compName}
        </div>
        ${addressHtml}
        ${contactHtml}
      </div>
    `;
  }

  const initial = (compName || "J")[0].toUpperCase();

  return `
    <div style="line-height: 1.2; padding: 2px 4px; text-align: center; font-family: 'Segoe UI', Arial, sans-serif;">
      <div style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; background: #0f172a; color: #38bdf8; font-weight: 800; font-size: 14px; border: 1px solid #334155; margin-bottom: 2px;">
        ${initial}
      </div>
      <div style="font-weight: 800; font-size: 9.5px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.15;">
        ${compName}
      </div>
      ${addressHtml}
      ${contactHtml}
    </div>
  `;
}
