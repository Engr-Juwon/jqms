import React, { useState } from "react";
import {
  X,
  Sparkles,
  Layers,
  Building2,
  FileSpreadsheet,
  Check,
  AlertCircle,
  Home,
  Store,
  Briefcase,
  Sliders,
  RefreshCw,
  Castle,
  TowerControl,
} from "lucide-react";
import { dbService } from "@/lib/db";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { ProjectUnit, UnitUsageType, UnitStageStatus, ProjectLevel } from "@/types";
import { toast } from "react-hot-toast";

interface BulkUnitGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  levels: ProjectLevel[];
  onSuccess?: () => void;
  existingCount: number;
}

type GeneratorMode = "mixed-use" | "sequential" | "csv";

const DEFAULT_RESIDENTIAL_ROOMS = [
  "Living & Dining Area",
  "Master Bedroom",
  "Master Bathroom",
  "Kitchen",
  "Balcony",
  "Utility / Laundry",
];

const DEFAULT_RETAIL_ROOMS = [
  "Main Trading Area / Sales Floor",
  "Back of House / Stock Room",
  "Staff Restroom",
  "MEP & Electrical Intake",
];

const DEFAULT_OFFICE_ROOMS = [
  "Open Plan Work Area",
  "Executive Office",
  "Meeting Room",
  "Kitchenette",
  "Server / IT Closet",
];

export const BulkUnitGeneratorModal: React.FC<BulkUnitGeneratorModalProps> = ({
  isOpen,
  onClose,
  levels,
  onSuccess,
  existingCount,
}) => {
  const { company } = useAuthStore();
  const { activeProject } = useProjectStore();

  const [mode, setMode] = useState<GeneratorMode>("mixed-use");
  const [isGenerating, setIsGenerating] = useState(false);

  // Mixed-Use Preset Parameters
  const [mixedBuilding, setMixedBuilding] = useState("Tower 1 & Podium");
  const [retailCount, setRetailCount] = useState(25);
  const [officeCount, setOfficeCount] = useState(75);
  const [residentialCount, setResidentialCount] = useState(450); // 25 + 75 + 450 = 550 Units!
  const [residentialFloors, setResidentialFloors] = useState(15);
  const [mixedInitialStage, setMixedInitialStage] = useState<UnitStageStatus>("FIRST_FIX");

  // Sequential Generator Parameters
  const [seqBuilding, setSeqBuilding] = useState("Main Block");
  const [seqPrefix, setSeqPrefix] = useState("U-");
  const [seqStartNumber, setSeqStartNumber] = useState(1);
  const [seqCount, setSeqCount] = useState(50);
  const [seqType, setSeqType] = useState<UnitUsageType>("RESIDENTIAL");
  const [seqLevelName, setSeqLevelName] = useState(levels[0]?.name || "Level 01");
  const [seqRoomsText, setSeqRoomsText] = useState(DEFAULT_RESIDENTIAL_ROOMS.join(", "));
  const [seqGia, setSeqGia] = useState(85);
  const [seqStage, setSeqStage] = useState<UnitStageStatus>("NOT_STARTED");

  // CSV Paste Parameters
  const [csvText, setCsvText] = useState("");

  if (!isOpen) return null;

  const totalMixedSum = retailCount + officeCount + residentialCount;

  // ─── 1. HANDLE MIXED-USE 550 GENERATION ───
  const handleGenerateMixedUse = async () => {
    if (!activeProject?.id) {
      toast.error("Active project not found.");
      return;
    }
    if (totalMixedSum <= 0) {
      toast.error("Please configure at least 1 unit to generate.");
      return;
    }

    setIsGenerating(true);
    try {
      const companyId = activeProject.companyId || company?.id || "";
      const timestamp = Date.now();
      const generatedUnits: ProjectUnit[] = [];

      // A. Generate Retail Units (Ground Floor)
      for (let i = 1; i <= retailCount; i++) {
        const uNum = `RET-G${String(i).padStart(2, "0")}`;
        const unitId = `unit_${activeProject.id}_${mixedBuilding.replace(/\s+/g, "_")}_${uNum}`;
        generatedUnits.push({
          id: unitId,
          projectId: activeProject.id,
          companyId,
          unitNumber: uNum,
          name: `Retail Unit ${i} (Podium Ground)`,
          code: `${mixedBuilding}-G-${uNum}`,
          building: mixedBuilding,
          levelName: "Ground Floor",
          unitType: "COMMERCIAL_RETAIL",
          subType: i <= 3 ? "Anchor Retail" : i <= 10 ? "F&B / Cafe" : "Boutique / Services",
          stageStatus: mixedInitialStage,
          grossFloorArea: i <= 3 ? 240 : 85,
          rooms: [...DEFAULT_RETAIL_ROOMS],
          snagStats: { total: 0, open: 0, rectified: 0, verified: 0 },
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }

      // B. Generate Office Units (Podium Levels 1-3)
      const officeFloors = 3;
      const officesPerFloor = Math.ceil(officeCount / officeFloors);
      let currentOfficeNum = 1;
      for (let f = 1; f <= officeFloors; f++) {
        const floorName = `Podium Level 0${f}`;
        for (let o = 1; o <= officesPerFloor && currentOfficeNum <= officeCount; o++) {
          const uNum = `OFF-${f}${String(o).padStart(2, "0")}`;
          const unitId = `unit_${activeProject.id}_${mixedBuilding.replace(/\s+/g, "_")}_${uNum}`;
          generatedUnits.push({
            id: unitId,
            projectId: activeProject.id,
            companyId,
            unitNumber: uNum,
            name: `Office Suite ${uNum} (${floorName})`,
            code: `${mixedBuilding}-P${f}-${uNum}`,
            building: mixedBuilding,
            levelName: floorName,
            unitType: "OFFICE",
            subType: o % 3 === 0 ? "Executive Corner Suite" : "Standard Corporate Suite",
            stageStatus: mixedInitialStage,
            grossFloorArea: o % 3 === 0 ? 180 : 110,
            rooms: [...DEFAULT_OFFICE_ROOMS],
            snagStats: { total: 0, open: 0, rectified: 0, verified: 0 },
            createdAt: timestamp,
            updatedAt: timestamp,
          });
          currentOfficeNum++;
        }
      }

      // C. Generate Residential Apartments (Tower Levels 4 onwards)
      const unitsPerResiFloor = Math.ceil(residentialCount / Math.max(1, residentialFloors));
      let currentResiNum = 1;
      for (let f = 1; f <= residentialFloors; f++) {
        const actualFloorNum = f + 3; // Starts at Level 4
        const floorName = `Level ${String(actualFloorNum).padStart(2, "0")}`;
        for (let r = 1; r <= unitsPerResiFloor && currentResiNum <= residentialCount; r++) {
          const uNum = `${actualFloorNum}${String(r).padStart(2, "0")}`;
          const unitId = `unit_${activeProject.id}_${mixedBuilding.replace(/\s+/g, "_")}_${uNum}`;
          
          let subType = "2-Bedroom Apartment";
          let area = 95;
          let rooms = [...DEFAULT_RESIDENTIAL_ROOMS];
          if (r === 1) {
            subType = "Studio Apartment";
            area = 48;
            rooms = ["Studio Living/Bed", "Bathroom", "Open Kitchenette", "Balcony"];
          } else if (r === 2 || r === 3) {
            subType = "1-Bedroom Apartment";
            area = 68;
            rooms = ["Living Room", "Bedroom", "Bathroom", "Kitchen", "Balcony"];
          } else if (f === residentialFloors) {
            subType = "Penthouse Suite";
            area = 260;
            rooms = ["Grand Salon", "Master Penthouse Suite", "Bedroom 2", "Bedroom 3", "Ensuite Baths", "Chef Kitchen", "Sky Terrace"];
          }

          generatedUnits.push({
            id: unitId,
            projectId: activeProject.id,
            companyId,
            unitNumber: uNum,
            name: `Apt ${uNum} (${subType})`,
            code: `${mixedBuilding}-L${actualFloorNum}-${uNum}`,
            building: mixedBuilding,
            levelName: floorName,
            unitType: "RESIDENTIAL",
            subType,
            stageStatus: mixedInitialStage,
            grossFloorArea: area,
            rooms,
            snagStats: { total: 0, open: 0, rectified: 0, verified: 0 },
            createdAt: timestamp,
            updatedAt: timestamp,
          });
          currentResiNum++;
        }
      }

      await dbService.saveProjectUnits(generatedUnits, activeProject.id, companyId);
      toast.success(
        `Successfully generated ${generatedUnits.length} mixed-use units (${retailCount} Retail, ${officeCount} Office, ${residentialCount} Residential)!`,
      );
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error("Bulk generate error:", err);
      toast.error(err.message || "Failed to generate mixed-use units.");
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── 2. HANDLE SEQUENTIAL GENERATION ───
  const handleGenerateSequential = async () => {
    if (!activeProject?.id) {
      toast.error("Active project not found.");
      return;
    }
    if (seqCount <= 0 || seqCount > 600) {
      toast.error("Count must be between 1 and 600 units.");
      return;
    }

    setIsGenerating(true);
    try {
      const companyId = activeProject.companyId || company?.id || "";
      const timestamp = Date.now();
      const rooms = seqRoomsText
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);

      const generatedUnits: ProjectUnit[] = [];
      for (let i = 0; i < seqCount; i++) {
        const num = seqStartNumber + i;
        const uNum = `${seqPrefix}${String(num).padStart(3, "0")}`;
        const unitId = `unit_${activeProject.id}_${seqBuilding.replace(/\s+/g, "_")}_${uNum}`;

        generatedUnits.push({
          id: unitId,
          projectId: activeProject.id,
          companyId,
          unitNumber: uNum,
          name: `${uNum} (${seqType})`,
          code: `${seqBuilding}-${uNum}`,
          building: seqBuilding,
          levelName: seqLevelName,
          unitType: seqType,
          stageStatus: seqStage,
          grossFloorArea: seqGia,
          rooms: rooms.length > 0 ? rooms : [...DEFAULT_RESIDENTIAL_ROOMS],
          snagStats: { total: 0, open: 0, rectified: 0, verified: 0 },
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }

      await dbService.saveProjectUnits(generatedUnits, activeProject.id, companyId);
      toast.success(`Successfully generated ${generatedUnits.length} units!`);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error("Sequential generator error:", err);
      toast.error(err.message || "Failed to generate units.");
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── 3. HANDLE CSV / TAB PASTE IMPORT ───
  const handleImportCsv = async () => {
    if (!activeProject?.id) {
      toast.error("Active project not found.");
      return;
    }
    if (!csvText.trim()) {
      toast.error("Please paste CSV or Tab-separated rows.");
      return;
    }

    setIsGenerating(true);
    try {
      const lines = csvText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const companyId = activeProject.companyId || company?.id || "";
      const timestamp = Date.now();
      const parsedUnits: ProjectUnit[] = [];

      for (let idx = 0; idx < lines.length; idx++) {
        const line = lines[idx];
        // Skip header if present
        if (
          idx === 0 &&
          (line.toLowerCase().includes("unit") ||
            line.toLowerCase().includes("building"))
        ) {
          continue;
        }

        // Support both comma and tab delimiters
        const delimiter = line.includes("\t") ? "\t" : ",";
        const parts = line.split(delimiter).map((p) => p.trim());

        // Expected format: Building, Level, UnitNumber, Name, Type, Area, Rooms
        const building = parts[0] || "Main Building";
        const levelName = parts[1] || "Level 01";
        const unitNumber = parts[2] || `U-${idx + 1}`;
        const name = parts[3] || unitNumber;
        const rawType = (parts[4] || "RESIDENTIAL").toUpperCase();
        const area = parseFloat(parts[5]) || 80;
        const rooms = parts[6]
          ? parts[6].split(";").map((r) => r.trim()).filter(Boolean)
          : [...DEFAULT_RESIDENTIAL_ROOMS];

        let unitType: UnitUsageType = "RESIDENTIAL";
        if (rawType.includes("RETAIL") || rawType.includes("COMMERCIAL") || rawType.includes("SHOP")) {
          unitType = "COMMERCIAL_RETAIL";
        } else if (rawType.includes("OFFICE")) {
          unitType = "OFFICE";
        } else if (rawType.includes("HOSPITALITY") || rawType.includes("HOTEL")) {
          unitType = "HOSPITALITY";
        } else if (rawType.includes("AMENITY")) {
          unitType = "AMENITY_FACILITY";
        }

        const unitId = `unit_${activeProject.id}_${building.replace(/\s+/g, "_")}_${unitNumber}`;
        parsedUnits.push({
          id: unitId,
          projectId: activeProject.id,
          companyId,
          unitNumber,
          name,
          code: `${building}-${unitNumber}`,
          building,
          levelName,
          unitType,
          stageStatus: "FIRST_FIX",
          grossFloorArea: area,
          rooms,
          snagStats: { total: 0, open: 0, rectified: 0, verified: 0 },
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }

      if (parsedUnits.length === 0) {
        toast.error("Could not parse any valid unit rows.");
        return;
      }

      await dbService.saveProjectUnits(parsedUnits, activeProject.id, companyId);
      toast.success(`Successfully imported ${parsedUnits.length} units from data!`);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error("CSV import error:", err);
      toast.error(err.message || "Failed to import units from text.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Multi-Unit Bulk Generator & Importer
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Instantly provision hundreds of units for mixed-use developments, towers, or estates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 p-2 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode("mixed-use")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition ${
              mode === "mixed-use"
                ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Mixed-Use Preset (550 Units)</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("sequential")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition ${
              mode === "sequential"
                ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Floor / Range Pattern</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("csv")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition ${
              mode === "csv"
                ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel / CSV Paste</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* TAB 1: MIXED-USE PRESET (550 UNITS) */}
          {mode === "mixed-use" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-800 dark:text-brand-300 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-sm">Automated 550 Mixed-Use Distribution</p>
                  <p>
                    Configures your development across Ground Floor Retail, Podium Corporate Offices, and Multi-Storey Residential Towers with individual room breakdowns and lifecycle stages.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Building / Tower Name
                  </label>
                  <input
                    type="text"
                    value={mixedBuilding}
                    onChange={(e) => setMixedBuilding(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-xs"
                    placeholder="e.g. Tower 1 & Podium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Initial Lifecycle Stage
                  </label>
                  <select
                    value={mixedInitialStage}
                    onChange={(e) => setMixedInitialStage(e.target.value as UnitStageStatus)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-xs"
                  >
                    <option value="NOT_STARTED">Not Started / Pre-construction</option>
                    <option value="SUBSTRUCTURE">Substructure & Foundations</option>
                    <option value="SUPERSTRUCTURE">Superstructure Framing</option>
                    <option value="FIRST_FIX">First Fix (Blockwork, Conduits, Pipework)</option>
                    <option value="SECOND_FIX">Second Fix (Drywall, Wiring, Plaster)</option>
                    <option value="FINISHES">Finishes (Tiling, Paint, Joinery)</option>
                    <option value="PRE_SNAG">Pre-Snagging & Internal QAQC</option>
                    <option value="CLIENT_SNAG">Client / Consultant Inspection</option>
                    <option value="READY_FOR_HANDOVER">Ready for Handover</option>
                    <option value="HANDED_OVER">Handed Over (TOC Signed)</option>
                  </select>
                </div>
              </div>

              {/* Three Disciplinary Blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Retail */}
                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-500/5 space-y-2">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase">
                    <Store className="w-4 h-4" />
                    <span>Ground Retail</span>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 dark:text-slate-400">Unit Count</label>
                    <input
                      type="number"
                      min={0}
                      max={200}
                      value={retailCount}
                      onChange={(e) => setRetailCount(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Codes: <code className="text-amber-700 dark:text-amber-300">RET-G01..G{retailCount}</code>
                  </p>
                </div>

                {/* Office */}
                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-500/5 space-y-2">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase">
                    <Briefcase className="w-4 h-4" />
                    <span>Podium Offices</span>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 dark:text-slate-400">Unit Count</label>
                    <input
                      type="number"
                      min={0}
                      max={300}
                      value={officeCount}
                      onChange={(e) => setOfficeCount(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Spanned across Podium L1–L3
                  </p>
                </div>

                {/* Residential */}
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-500/5 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase">
                    <Home className="w-4 h-4" />
                    <span>Residential Tower</span>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 dark:text-slate-400">Unit Count</label>
                    <input
                      type="number"
                      min={0}
                      max={1000}
                      value={residentialCount}
                      onChange={(e) => setResidentialCount(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 dark:text-slate-400">Tower Floors (L4+)</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={residentialFloors}
                      onChange={(e) => setResidentialFloors(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Total Summary Pill */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <Layers className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      Target Batch Total: {totalMixedSum} Units
                    </span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      Currently registered in project: {existingCount} units
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateMixedUse}
                  disabled={isGenerating || totalMixedSum === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating {totalMixedSum} Units...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate {totalMixedSum} Units Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SEQUENTIAL / RANGE PATTERN GENERATOR */}
          {mode === "sequential" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Building / Block
                  </label>
                  <input
                    type="text"
                    value={seqBuilding}
                    onChange={(e) => setSeqBuilding(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    placeholder="e.g. Block A"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Floor Level
                  </label>
                  <input
                    type="text"
                    value={seqLevelName}
                    onChange={(e) => setSeqLevelName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    placeholder="e.g. Level 04"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unit Prefix
                  </label>
                  <input
                    type="text"
                    value={seqPrefix}
                    onChange={(e) => setSeqPrefix(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    placeholder="e.g. U- or Apt "
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Number
                  </label>
                  <input
                    type="number"
                    value={seqStartNumber}
                    onChange={(e) => setSeqStartNumber(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Count to Generate
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={600}
                    value={seqCount}
                    onChange={(e) => setSeqCount(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold text-brand-600 dark:text-brand-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unit Type
                  </label>
                  <select
                    value={seqType}
                    onChange={(e) => setSeqType(e.target.value as UnitUsageType)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  >
                    <option value="RESIDENTIAL">Residential Apartment / House</option>
                    <option value="COMMERCIAL_RETAIL">Commercial / Retail Shop</option>
                    <option value="OFFICE">Office / Workspace</option>
                    <option value="HOSPITALITY">Hospitality / Hotel</option>
                    <option value="AMENITY_FACILITY">Amenity / Facility</option>
                    <option value="UTILITY_MEP">Utility / MEP Space</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Avg GIA (m²)
                  </label>
                  <input
                    type="number"
                    value={seqGia}
                    onChange={(e) => setSeqGia(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Stage
                  </label>
                  <select
                    value={seqStage}
                    onChange={(e) => setSeqStage(e.target.value as UnitStageStatus)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="FIRST_FIX">First Fix</option>
                    <option value="SECOND_FIX">Second Fix</option>
                    <option value="FINISHES">Finishes</option>
                    <option value="PRE_SNAG">Pre-Snagging</option>
                    <option value="HANDED_OVER">Handed Over</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Default Rooms List (comma separated)
                </label>
                <input
                  type="text"
                  value={seqRoomsText}
                  onChange={(e) => setSeqRoomsText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  placeholder="Living Room, Bedroom, Kitchen, Bathroom"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleGenerateSequential}
                  disabled={isGenerating || seqCount <= 0}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {isGenerating ? "Generating..." : `Generate ${seqCount} Units`}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: CSV / EXCEL PASTE IMPORTER */}
          {mode === "csv" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <p className="font-semibold text-slate-900 dark:text-white">
                  Paste rows directly from Microsoft Excel or Google Sheets:
                </p>
                <p className="font-mono text-[11px] text-brand-600 dark:text-brand-400">
                  Building | FloorLevel | UnitNumber | UnitName | Type (Residential/Retail/Office) | Area_m2 | Rooms(semicolon-separated)
                </p>
                <p className="text-[10px]">
                  Example: <code>Tower A, Level 01, 101, Apt 101, Residential, 85, Living;Master Bed;Kitchen</code>
                </p>
              </div>

              <textarea
                rows={10}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Tower 1	Level 01	101	Unit 101	RESIDENTIAL	90	Living Room;Bedroom;Bath&#10;Tower 1	Level 01	102	Unit 102	RESIDENTIAL	90	Living Room;Bedroom;Bath"
                className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-brand-500"
              />

              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {csvText.trim().split("\n").filter(Boolean).length} rows ready to process
                </span>
                <button
                  type="button"
                  onClick={handleImportCsv}
                  disabled={isGenerating || !csvText.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {isGenerating ? "Importing..." : "Import Units from Data"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
