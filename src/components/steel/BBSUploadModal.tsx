import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Copy,
} from "lucide-react";
import {
  parseBBSContent,
  generateSampleBBSCSV,
  BBSParseResult,
} from "@/lib/bbsParser";
import { extractTextFromPDF } from "@/lib/pdfTextExtractor";
import { BBSItem } from "@/types";
import { toast } from "react-hot-toast";

interface BBSUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (
    items: BBSItem[],
    fileName?: string,
    mode?: "NEW" | "APPEND",
  ) => void;
  activeSchedule?: {
    id: string;
    scheduleNumber: string;
    title: string;
  } | null;
  defaultMode?: "NEW" | "APPEND";
}

export const BBSUploadModal: React.FC<BBSUploadModalProps> = ({
  isOpen,
  onClose,
  onImport,
  activeSchedule,
  defaultMode,
}) => {
  const [activeTab, setActiveTab] = useState<"FILE" | "PASTE">("FILE");
  const [pastedText, setPastedText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<BBSParseResult | null>(null);
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);
  const [importDestination, setImportDestination] = useState<"NEW" | "APPEND">(
    defaultMode || (activeSchedule ? "APPEND" : "NEW"),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    setSelectedFile(file);

    // Handle PDF files
    if (
      file.name.toLowerCase().endsWith(".pdf") ||
      file.type === "application/pdf"
    ) {
      setIsProcessingPDF(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        if (buffer) {
          try {
            toast.loading("Extracting rebar text from PDF schedule...", {
              id: "pdf-load",
            });
            const extractedText = await extractTextFromPDF(buffer);
            toast.dismiss("pdf-load");
            setIsProcessingPDF(false);

            if (extractedText && extractedText.trim()) {
              const res = parseBBSContent(extractedText);
              setParseResult(res);
              if (res.items.length > 0) {
                toast.success(
                  `Extracted ${res.items.length} rebar marks from PDF!`,
                );
              } else {
                toast.error(
                  "Extracted text from PDF, but no standard rebar rows were recognized. You can copy the table text from your PDF reader and paste into the 'Paste Schedule Rows' tab!",
                  { duration: 6000 },
                );
              }
            } else {
              toast.error(
                "Could not extract digital text from this PDF (it may be a scanned drawing). You can copy the table text from your PDF reader and paste into 'Paste Schedule Rows'!",
                { duration: 6000 },
              );
            }
          } catch {
            toast.dismiss("pdf-load");
            setIsProcessingPDF(false);
            toast.error("Failed to parse PDF streams.");
          }
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    // Handle text / CSV / TSV files
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const res = parseBBSContent(text);
        setParseResult(res);
        if (res.items.length > 0) {
          toast.success(`Parsed ${res.items.length} rebar marks successfully!`);
        } else {
          toast.error("Could not find valid rebar entries. Check file format.");
        }
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read file.");
    };
    reader.readAsText(file);
  };

  const handlePasteChange = (text: string) => {
    setPastedText(text);
    if (text.trim()) {
      const res = parseBBSContent(text);
      setParseResult(res);
    } else {
      setParseResult(null);
    }
  };

  const handleDownloadTemplate = () => {
    const csv = generateSampleBBSCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Sample_BBS_Schedule_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Sample BBS Template downloaded!");
  };

  const handleConfirmImport = () => {
    if (!parseResult || parseResult.items.length === 0) {
      toast.error("No valid rebar lines to import.");
      return;
    }
    onImport(
      parseResult.items,
      selectedFile?.name || "Manual_BBS_Intake.csv",
      importDestination,
    );
    toast.success(
      importDestination === "APPEND" && activeSchedule
        ? `Appended ${parseResult.items.length} BBS line items to ${activeSchedule.scheduleNumber}!`
        : `Imported ${parseResult.items.length} BBS line items as a new schedule!`,
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Import Bar Bending Schedule (BBS)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload PDF / CSV / Excel schedules or paste schedule rows to
                produce the Bar Cutting Order
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Import Destination Selector (If an active schedule exists) */}
        {activeSchedule && (
          <div className="px-6 pt-3 pb-1 bg-amber-500/5 dark:bg-amber-500/10 border-b border-amber-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Import Destination:
            </span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 dark:text-slate-200">
                <input
                  type="radio"
                  name="importDestination"
                  checked={importDestination === "APPEND"}
                  onChange={() => setImportDestination("APPEND")}
                  className="text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
                <span>
                  Append to Current Schedule (
                  <strong className="text-amber-600 dark:text-amber-400">
                    {activeSchedule.scheduleNumber}
                  </strong>
                  )
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 dark:text-slate-200">
                <input
                  type="radio"
                  name="importDestination"
                  checked={importDestination === "NEW"}
                  onChange={() => setImportDestination("NEW")}
                  className="text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
                <span>Create as Brand-New Schedule</span>
              </label>
            </div>
          </div>
        )}

        {/* Tab Selection */}
        <div className="px-6 pt-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("FILE")}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "FILE"
                  ? "border-amber-500 text-amber-600 dark:text-amber-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload PDF / CSV File
              </span>
            </button>
            <button
              onClick={() => setActiveTab("PASTE")}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "PASTE"
                  ? "border-amber-500 text-amber-600 dark:text-amber-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <span className="flex items-center gap-2">
                <Copy className="w-4 h-4" />
                Paste Schedule Rows (from PDF / Excel)
              </span>
            </button>
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline px-2 py-1"
          >
            <Download className="w-3.5 h-3.5" />
            Download Sample BBS Template
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === "FILE" ? (
            <div>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 scale-[0.99]"
                    : "border-slate-200 dark:border-slate-700 hover:border-amber-400 bg-slate-50/50 dark:bg-slate-800/20"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                  accept=".pdf,.csv,.txt,.tsv"
                  className="hidden"
                />
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {selectedFile
                    ? selectedFile.name
                    : "Click to select or drag & drop PDF / CSV BBS schedule"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Supports digital PDF Bar Bending Schedules, CSV, TSV, or
                  exported text schedules from RebarCAD, CADS RC, Tekla, Prokon
                  & AutoCAD
                </p>
              </div>

              {/* PDF Extraction Guidance */}
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 rounded-xl flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
                <FileSpreadsheet className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                <div>
                  <strong className="block font-bold">
                    Have your BBS in PDF format?
                  </strong>
                  <span>
                    Upload your PDF directly above to automatically parse rebar
                    lines. If your PDF is a scanned drawing or has complex
                    framing, you can also select the table in your PDF reader
                    (Chrome, Acrobat, Edge), press <strong>Ctrl+C</strong>, and
                    paste it into the <strong>"Paste Schedule Rows"</strong>{" "}
                    tab!
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Paste BBS Table Rows (Tab or Comma Delimited)
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => handlePasteChange(e.target.value)}
                placeholder={`Member\tBar Mark\tDiameter\tCut Length\tTotal Bars\tShape Code\n1B-01\t01\t20\t5.45\t8\t00\n1B-01\t02\t20\t4.80\t6\t00\n1B-01\t03\t10\t1.75\t56\t51`}
                rows={6}
                className="w-full text-xs font-mono p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Tip: Copy cells directly from your engineer's Excel spreadsheet
                and paste them above.
              </p>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parseResult && parseResult.items.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Parsed Rebar Entries ({parseResult.items.length} items ·{" "}
                    {parseResult.totalBars} total bars)
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                    Total Weight:{" "}
                    <strong>
                      {(parseResult.totalWeightKg / 1000).toFixed(3)} t
                    </strong>{" "}
                    ({parseResult.totalWeightKg.toLocaleString()} kg)
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold">
                    Diameters:{" "}
                    {parseResult.diametersFound.map((d) => `Y${d}`).join(", ")}
                  </span>
                </div>
              </div>

              {parseResult.errors.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>
                      {parseResult.errors.length} rows skipped due to invalid
                      values:
                    </span>
                  </div>
                  <ul className="text-[11px] text-amber-700 dark:text-amber-400 list-disc list-inside space-y-0.5 max-h-20 overflow-y-auto">
                    {parseResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5">Member</th>
                      <th className="p-2.5">Mark</th>
                      <th className="p-2.5">Dia</th>
                      <th className="p-2.5">Cut Length (m)</th>
                      <th className="p-2.5">Qty</th>
                      <th className="p-2.5">Total Length</th>
                      <th className="p-2.5">Shape</th>
                      <th className="p-2.5 text-right">Total Wt (kg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {parseResult.items.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <td className="p-2.5 font-semibold text-slate-900 dark:text-white">
                          {item.member}
                        </td>
                        <td className="p-2.5 font-mono font-bold text-amber-600 dark:text-amber-400">
                          {item.barMark}
                        </td>
                        <td className="p-2.5">
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                            Y{item.diameter}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono">
                          {item.cutLengthM.toFixed(3)} m
                        </td>
                        <td className="p-2.5 font-bold">{item.totalBars}</td>
                        <td className="p-2.5 font-mono">
                          {item.totalLengthM.toFixed(2)} m
                        </td>
                        <td className="p-2.5 font-mono">
                          {item.shapeCode || "00"}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold">
                          {item.totalWeightKg.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {parseResult?.items.length
              ? `${parseResult.items.length} items ready to optimize into 12m stock bars`
              : "Upload a file or paste text to preview schedule"}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={!parseResult || parseResult.items.length === 0}
              className="px-5 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Import BBS Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
