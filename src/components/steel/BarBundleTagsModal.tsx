import React, { useRef } from "react";
import { X, Printer, Tag, QrCode } from "lucide-react";
import { BarCuttingSchedule, BBSItem } from "@/types";

interface BarBundleTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: BarCuttingSchedule;
  projectName?: string;
}

export const BarBundleTagsModal: React.FC<BarBundleTagsModalProps> = ({
  isOpen,
  onClose,
  schedule,
  projectName = "Skyline Construction Project",
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Rebar Bundle Tags (Fabrication Yard)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Printable weather-resistant bundle tags for cut rebar bundles
                before bending & fixing
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print All Tags
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tags Container */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100 dark:bg-slate-950">
          <div
            ref={printRef}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3"
          >
            {schedule.bbsItems.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border-2 border-slate-900 p-4 rounded-xl shadow-sm space-y-3 relative print:border-black print:shadow-none break-inside-avoid"
              >
                {/* Tag Top Band */}
                <div className="border-b-2 border-slate-900 pb-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">
                      {projectName || "JAY-QMS PROJECT"}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                      {schedule.title}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                      {schedule.scheduleNumber}
                    </span>
                  </div>
                </div>

                {/* Big Bar Mark & Diameter Callout */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">
                      Bar Mark
                    </span>
                    <span className="text-2xl font-black text-slate-900 font-mono">
                      {item.barMark}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">
                      Diameter
                    </span>
                    <span className="text-2xl font-black text-amber-600 font-mono">
                      Y{item.diameter}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">
                      Cut Length
                    </span>
                    <span className="text-lg font-black text-slate-900 font-mono leading-tight block mt-0.5">
                      {item.cutLengthM.toFixed(3)}m
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-800">
                  <div>
                    <span className="text-slate-500 font-medium block">
                      Member:
                    </span>
                    <strong className="font-bold truncate block">
                      {item.member}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">
                      Quantity in Bundle:
                    </span>
                    <strong className="font-bold text-slate-900">
                      {item.totalBars} Pieces
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">
                      Steel Grade:
                    </span>
                    <span className="font-semibold">
                      {item.steelGrade || "Grade 500B"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">
                      Shape Code:
                    </span>
                    <span className="font-mono font-bold">
                      {item.shapeCode || "00 (Straight)"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">
                      Heat / MTC No:
                    </span>
                    <span className="font-mono font-bold text-blue-700">
                      {schedule.heatNumber || "HT-VERIFIED"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">
                      Bundle Total Wt:
                    </span>
                    <span className="font-bold">
                      {item.totalWeightKg.toFixed(1)} kg
                    </span>
                  </div>
                </div>

                {/* Footer Stamp & Barcode simulation */}
                <div className="pt-2 border-t border-slate-300 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-8 h-8 text-slate-800" />
                    <div>
                      <span className="font-mono font-bold block text-slate-700">
                        TAG-{schedule.scheduleNumber}-{item.barMark}
                      </span>
                      <span className="text-slate-400">QA/QC Passed</span>
                    </div>
                  </div>
                  <div className="border-2 border-emerald-600 text-emerald-800 font-black px-2 py-1 rounded rotate-[-4deg] text-[9px] uppercase tracking-wider">
                    QA Inspected
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Total {schedule.bbsItems.length} bundle tags ready for printing
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
