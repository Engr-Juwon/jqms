import { useState, useEffect, useCallback } from "react";
import { Company, CompanySettings, Project } from "@/types";
import { dbService } from "@/lib/db";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { DEFAULT_THEME_PALETTE, applyCompanyTheme } from "@/lib/theme";
import { generateUniversalName } from "@/lib/naming";

// ==========================================
// NEUTRAL ENTERPRISE DEFAULTS (Zero Tenant Leakage)
// ==========================================
export const DEFAULT_COMPANY_NAME = "Organization Workspace";
export const DEFAULT_COMPANY_LEGAL_NAME = "";
export const DEFAULT_COMPANY_EMAIL = "";
export const DEFAULT_COMPANY_PHONE = "";
export const DEFAULT_COMPANY_ADDRESS = "";
export const DEFAULT_COMPANY_WEBSITE = "";
export const DEFAULT_COMPANY_REG_NO = "";
export const DEFAULT_COMPANY_TAX_NO = "";

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
  themePalette: DEFAULT_THEME_PALETTE,
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

function escapeBrandHtml(input: unknown): string {
  return String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeBrandLogoSrc(src?: string): string | undefined {
  if (!src) return undefined;
  const trimmed = src.trim();
  if (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("/") ||
    /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(trimmed)
  ) {
    return trimmed;
  }
  return undefined;
}

// ==========================================
// PURE UTILITY EXTRACTORS (Static Helpers)
// ==========================================

export function getCompanyName(
  company?: Partial<Company> | null,
  fallback = DEFAULT_COMPANY_NAME,
): string {
  if (!company) return fallback;
  return company.name?.trim() || company.legalName?.trim() || fallback;
}

export function getCompanyLogo(
  company?: Partial<Company> | null,
): string | undefined {
  if (!company) return undefined;
  return sanitizeBrandLogoSrc(company.logoUrl || company.logo);
}

export function getCompanyEmail(
  company?: Partial<Company> | null,
  fallback = DEFAULT_COMPANY_EMAIL,
): string {
  if (!company) return fallback;
  return company.email?.trim() || fallback;
}

export function getCompanyPhone(
  company?: Partial<Company> | null,
  fallback = DEFAULT_COMPANY_PHONE,
): string {
  if (!company) return fallback;
  return company.phone?.trim() || fallback;
}

export function getCompanyAddress(
  company?: Partial<Company> | null,
  fallback = DEFAULT_COMPANY_ADDRESS,
): string {
  if (!company) return fallback;
  return company.address?.trim() || fallback;
}

export function getCompanyWebsite(
  company?: Partial<Company> | null,
  fallback = DEFAULT_COMPANY_WEBSITE,
): string {
  if (!company) return fallback;
  return company.website?.trim() || fallback;
}

export function getCompanyRegistration(
  company?: Partial<Company> | null,
  fallback = DEFAULT_COMPANY_REG_NO,
): string {
  if (!company) return fallback;
  return company.registrationNo?.trim() || fallback;
}

export function getCompanyStandards(
  company?: Partial<Company> | null,
): string[] {
  if (!company?.standards || company.standards.length === 0) {
    return DEFAULT_COMPANY_STANDARDS;
  }
  return company.standards;
}

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
    themePalette: company?.settings?.themePalette || DEFAULT_THEME_PALETTE,
  };
}

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
 * Generates an official standardized document number adhering to the universal naming system:
 * {projectcode}_{prefix}_{random()}_{ddmmyy}
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
  let prefix = getModulePrefix(formType, companyOrSettings);
  if (formType === "SITE_COMMENT") {
    prefix = "COM";
  } else if (formType === "POUR_PERMIT" || formType === "PTP") {
    prefix = "PTP";
  } else if (formType === "WEEKLY_REPORT") {
    prefix = "WQR";
  } else if (formType === "SITE_INSTRUCTION" || formType === "SI") {
    prefix = "SI";
  }

  return generateUniversalName(options?.projectCode, prefix);
}

export function getCompanyInitials(name?: string): string {
  const compName = (name || DEFAULT_COMPANY_NAME).trim();
  if (!compName) return "JQ";
  const parts = compName.split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// ==========================================
// REACT HOOK: useCompany()
// Consumes the single shared company subscription in useAuthStore
// (zero duplicate onSnapshot listeners, zero cross-tenant fallback queries)
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
    options?: { count?: number; customSuffix?: string; projectCode?: string },
  ) => string;
}

export function useCompany(): UseCompanyReturn {
  const {
    currentUser,
    company: authCompany,
    isLoading: isAuthLoading,
    setCompany,
  } = useAuthStore();
  const { activeProject } = useProjectStore();

  const resolvedCompanyId =
    currentUser?.companyId ||
    authCompany?.id ||
    activeProject?.companyId ||
    "";

  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!resolvedCompanyId || authCompany?.id === resolvedCompanyId) {
      return;
    }

    setIsFetching(true);
    dbService
      .getCompany(resolvedCompanyId)
      .then((comp) => {
        if (!isMounted) return;
        if (comp) {
          setCompany(comp);
          if (comp.settings?.themePalette) {
            applyCompanyTheme(comp.settings.themePalette);
          }
        }
      })
      .catch((err: any) => {
        if (!isMounted) return;
        console.warn("Error fetching company details:", err);
        setError("Failed to fetch company details.");
      })
      .finally(() => {
        if (isMounted) setIsFetching(false);
      });

    return () => {
      isMounted = false;
    };
  }, [resolvedCompanyId, authCompany?.id, setCompany]);

  const refreshCompany = useCallback(async () => {
    if (!resolvedCompanyId) return;
    setIsFetching(true);
    try {
      const comp = await dbService.getCompany(resolvedCompanyId);
      if (comp) {
        setCompany(comp);
        if (comp.settings?.themePalette) {
          applyCompanyTheme(comp.settings.themePalette);
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to refresh company.");
    } finally {
      setIsFetching(false);
    }
  }, [resolvedCompanyId, setCompany]);

  const updateCompany = useCallback(
    async (updates: Partial<Company>) => {
      const targetId = authCompany?.id || resolvedCompanyId;
      if (!targetId) {
        throw new Error("Cannot update company: no active company workspace is bound to your account.");
      }

      const currentSettings = getCompanySettings(authCompany);
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
        mirPrefix:
          incomingSettings.mirPrefix ||
          currentSettings.mirPrefix ||
          DEFAULT_COMPANY_SETTINGS.mirPrefix,
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
        themePalette:
          incomingSettings.themePalette !== undefined
            ? incomingSettings.themePalette
            : currentSettings.themePalette || DEFAULT_THEME_PALETTE,
      };

      if (mergedSettings.themePalette) {
        applyCompanyTheme(mergedSettings.themePalette);
      }

      const merged: Company = {
        id: targetId,
        name:
          updates.name ||
          authCompany?.name ||
          currentUser?.companyName ||
          DEFAULT_COMPANY_NAME,
        legalName:
          updates.legalName !== undefined
            ? updates.legalName
            : authCompany?.legalName || authCompany?.name || "",
        ownerId: authCompany?.ownerId || currentUser?.uid || "",
        logo: updates.logo !== undefined ? updates.logo : authCompany?.logo,
        logoUrl:
          updates.logoUrl !== undefined
            ? updates.logoUrl
            : authCompany?.logoUrl,
        email:
          updates.email !== undefined ? updates.email : authCompany?.email,
        phone:
          updates.phone !== undefined ? updates.phone : authCompany?.phone,
        address:
          updates.address !== undefined
            ? updates.address
            : authCompany?.address,
        website:
          updates.website !== undefined
            ? updates.website
            : authCompany?.website,
        registrationNo:
          updates.registrationNo !== undefined
            ? updates.registrationNo
            : authCompany?.registrationNo,
        taxNumber:
          updates.taxNumber !== undefined
            ? updates.taxNumber
            : authCompany?.taxNumber,
        standards:
          updates.standards ||
          authCompany?.standards ||
          DEFAULT_COMPANY_STANDARDS,
        settings: mergedSettings,
        createdAt: authCompany?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      await dbService.saveCompany(merged);
      setCompany(merged);
    },
    [authCompany, resolvedCompanyId, setCompany, currentUser?.uid, currentUser?.companyName],
  );

  const getPrefix = useCallback(
    (formType: FormModuleType) => getModulePrefix(formType, authCompany),
    [authCompany],
  );

  const generateDocNumber = useCallback(
    (
      formType: FormModuleType,
      options?: { count?: number; customSuffix?: string; projectCode?: string },
    ) =>
      generateModuleDocNumber(formType, authCompany, {
        ...options,
        projectCode: options?.projectCode || activeProject?.code,
      }),
    [authCompany, activeProject],
  );

  return {
    company: authCompany,
    companyId: resolvedCompanyId,
    name: getCompanyName(
      authCompany,
      currentUser?.companyName || DEFAULT_COMPANY_NAME,
    ),
    legalName:
      authCompany?.legalName ||
      getCompanyName(
        authCompany,
        currentUser?.companyName || DEFAULT_COMPANY_NAME,
      ),
    logo: getCompanyLogo(authCompany),
    logoUrl: getCompanyLogo(authCompany),
    email: getCompanyEmail(authCompany),
    phone: getCompanyPhone(authCompany),
    address: getCompanyAddress(authCompany),
    website: getCompanyWebsite(authCompany),
    registrationNo: getCompanyRegistration(authCompany),
    taxNumber: authCompany?.taxNumber || DEFAULT_COMPANY_TAX_NO,
    standards: getCompanyStandards(authCompany),
    settings: getCompanySettings(authCompany),
    isLoading: isAuthLoading || isFetching,
    error,
    refreshCompany,
    updateCompany,
    getPrefix,
    generateDocNumber,
  };
}

/**
 * Standard XSS-escaped company brand cell renderer for reports, printouts, and PDFs.
 */
export function renderCompanyBrandCell(
  company: Partial<Company> = {},
  project: Partial<Project> = {},
): string {
  let backendCompany: Partial<Company> | null = null;
  let fallbackUserCompanyName = "";
  try {
    const authState = useAuthStore.getState();
    backendCompany = authState.company;
    fallbackUserCompanyName = authState.currentUser?.companyName || "";
  } catch {
    // Ignore store access outside React lifecycle
  }

  const rawLogo =
    company.logoUrl ||
    company.logo ||
    backendCompany?.logoUrl ||
    backendCompany?.logo ||
    (project as any)?.logoUrl ||
    (project as any)?.logo;
  const logo = sanitizeBrandLogoSrc(rawLogo);

  const compName = escapeBrandHtml(
    company.name?.trim() ||
      company.legalName?.trim() ||
      backendCompany?.name?.trim() ||
      backendCompany?.legalName?.trim() ||
      fallbackUserCompanyName.trim() ||
      (project as any)?.contractor?.trim() ||
      project.contractorName?.trim() ||
      DEFAULT_COMPANY_NAME,
  );

  const compAddress = escapeBrandHtml(
    company.address?.trim() || backendCompany?.address?.trim() || "",
  );

  const compEmail = escapeBrandHtml(
    company.email?.trim() || backendCompany?.email?.trim() || "",
  );

  const compPhone = escapeBrandHtml(
    company.phone?.trim() || backendCompany?.phone?.trim() || "",
  );

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
        <img src="${escapeBrandHtml(logo)}" crossorigin="anonymous" style="max-height: 38px; max-width: 125px; object-fit: contain; margin-bottom: 2.5px; display: inline-block;" alt="${compName}" />
        <div style="font-weight: 800; font-size: 9.5px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.15;">
          ${compName}
        </div>
        ${addressHtml}
        ${contactHtml}
      </div>
    `;
  }

  const rawFirstChar = (
    company.name?.trim() ||
    backendCompany?.name?.trim() ||
    fallbackUserCompanyName.trim() ||
    "J"
  )[0];
  const initial = escapeBrandHtml((rawFirstChar || "J").toUpperCase());

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
