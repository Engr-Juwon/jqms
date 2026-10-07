import React, { useState } from "react";
import { StructuralElement, Company, Project } from "@/types";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { renderCompanyBrandCell } from "@/lib/companyHelper";
import { X, Printer, QrCode, Tag, CheckCircle2, ShieldCheck, Box, Layers } from "lucide-react";

interface ElementQRTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: StructuralElement[];
  projectName?: string;
  projectCode?: string;
  levelNameMap?: Map<string, string>;
}

export const ElementQRTagsModal: React.FC<ElementQRTagsModalProps> = ({
  isOpen,
  onClose,
  elements,
  projectName,
  projectCode,
  levelNameMap,
}) => {
  const { company } = useAuthStore();
  const { activeProject } = useProjectStore();

  const [stickerDensity, setStickerDensity] = useState<"standard" | "compact">("standard");

  if (!isOpen) return null;

  const currentProjectName = projectName || activeProject?.name || "Structural Construction";
  const currentProjectCode = projectCode || activeProject?.code || "PRJ-001";
  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const handlePrint = () => {
    window.print();
  };

  const getPassportUrl = (el: StructuralElement) => {
    const origin = window.location.origin;
    return `${origin}/project/elements/${el.id}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      {/* Modal Dialog Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header - Hidden in Print */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950 no-print shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Structural Asset QR Tags &amp; Sticker Sheets
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Print adhesive site labels ({elements.length} {elements.length === 1 ? "element" : "elements"} ready)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Density switch */}
            <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-bold">
              <button
                onClick={() => setStickerDensity("standard")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  stickerDensity === "standard"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Standard (8 / page)
              </button>
              <button
                onClick={() => setStickerDensity("compact")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  stickerDensity === "compact"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Compact (12 / page)
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition"
              title="Print Sticker Sheet"
            >
              <Printer className="w-4 h-4" />
              <span>Print Sticker Sheet</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sheet Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950/60 print:p-0 print:bg-white">
          <div className="max-w-4xl mx-auto space-y-4 print:max-w-none print:m-0">
            {/* Instruction Tip */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  Standard Avery/A4 sticker layout: attach these weatherproof labels directly to formwork or cured concrete. Any phone camera scans to inspect 28-day cube strength and sign-offs.
                </span>
              </div>
              <span className="font-mono text-[11px] font-bold shrink-0 ml-2">
                {currentProjectCode}
              </span>
            </div>

            {/* Sticker Grid Container */}
            <div
              className={`grid gap-4 print:gap-3 ${
                stickerDensity === "standard"
                  ? "grid-cols-1 md:grid-cols-2 print:grid-cols-2"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3"
              }`}
            >
              {elements.map((el) => {
                const levelName =
                  levelNameMap?.get(el.levelId || "") ||
                  el.level ||
                  el.levelName ||
                  "Level";
                const gridAxis = el.grid || el.gridAxis || "N/A";
                const dimL = el.length || el.dimensions?.length || 0;
                const dimW = el.width || el.dimensions?.width || 0;
                const dimH = el.height || el.dimensions?.height || 0;
                const dimDia = el.diameter || (el.dimensions as any)?.diameter || 0;
                const netVol = el.calculatedVolume || el.volume || 0;
                const formArea = el.calculatedFormworkArea || 0;
                const passportUrl = getPassportUrl(el);
                const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=2&data=${encodeURIComponent(
                  passportUrl,
                )}`;

                return (
                  <div
                    key={el.id}
                    className="qr-sticker-card bg-white text-slate-900 border-2 border-slate-900 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between print:border-slate-800 print:rounded-xl print:p-3"
                    style={{ pageBreakInside: "avoid" }}
                  >
                    {/* Header Bar */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-300 pb-2 mb-2.5">
                      <div>
                        <div className="text-[8.5px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-slate-700" />
                          <span>QA/QC STRUCTURAL ASSET TAG</span>
                        </div>
                        <div className="text-[10px] font-extrabold text-slate-800 truncate max-w-[200px]">
                          {currentProjectName}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-[9px] font-black bg-slate-900 text-white px-2 py-0.5 rounded">
                          {currentProjectCode}
                        </span>
                        <div className="text-[7.5px] font-mono text-slate-500 mt-0.5">
                          {currentDate}
                        </div>
                      </div>
                    </div>

                    {/* Body: QR Code & Key Specs */}
                    <div className="flex items-center gap-3.5 my-1">
                      {/* Scannable QR Code */}
                      <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 bg-white p-1 rounded-xl border border-slate-300 flex items-center justify-center">
                        <img
                          src={qrImgSrc}
                          alt={`QR Passport: ${el.elementName}`}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </div>

                      {/* Element Identity & Specs */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-tight truncate">
                          {el.elementName}
                        </div>
                        <div className="flex flex-wrap items-center gap-1 text-[9.5px]">
                          <span className="font-mono font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-300">
                            {el.elementType}
                          </span>
                          <span className="font-bold text-slate-700">
                            {levelName}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-600">
                          Grid: <strong>{gridAxis}</strong>
                        </div>
                        <div className="text-[10px] text-slate-700">
                          Mix: <strong>{el.concreteGrade || "C35/45"}</strong>
                        </div>
                        <div className="text-[9px] font-mono text-slate-500">
                          {dimDia > 0 ? (
                            <span>Ø {dimDia}m × H {dimH}m</span>
                          ) : dimL || dimW || dimH ? (
                            <span>{dimL}×{dimW}×{dimH} mm</span>
                          ) : (
                            <span>Standard Dim</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Metadata & QA Verification Stamp */}
                    <div className="pt-2 border-t border-slate-300 flex items-center justify-between gap-2 text-[9px]">
                      <div className="font-mono text-slate-600">
                        Vol: <strong>{netVol.toFixed(2)} m³</strong> | Fmwk: <strong>{formArea.toFixed(1)} m²</strong>
                      </div>
                      <div className="border border-emerald-600 bg-emerald-50 text-emerald-800 font-extrabold px-2 py-0.5 rounded text-[8px] uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
                        <span>{el.status || "REGISTERED"}</span>
                      </div>
                    </div>

                    {/* Scan Callout */}
                    <div className="mt-1 text-center font-mono text-[7px] text-slate-400 uppercase tracking-wider">
                      Scan QR code to open live element passport &amp; cube test history
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Print Stylesheet */}
        <style>{`
          @page {
            size: A4 portrait;
            margin: 8mm 8mm 8mm 8mm;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background: #ffffff !important;
              color: #0f172a !important;
            }
            .no-print, header, nav, aside {
              display: none !important;
            }
            .qr-sticker-card {
              page-break-inside: avoid;
              border: 1.5px solid #0f172a !important;
              box-shadow: none !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default ElementQRTagsModal;
