import React, { useState, useEffect } from "react";
import { X, Save, Trash2, Home, Store, Briefcase } from "lucide-react";
import { ProjectUnit, UnitUsageType, UnitStageStatus, ProjectLevel } from "@/types";
import { dbService } from "@/lib/db";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { toast } from "react-hot-toast";

interface UnitEditModalProps {
  unit: ProjectUnit | null;
  isOpen: boolean;
  onClose: () => void;
  levels: ProjectLevel[];
  onSuccess: () => void;
}

export const UnitEditModal: React.FC<UnitEditModalProps> = ({
  unit,
  isOpen,
  onClose,
  levels,
  onSuccess,
}) => {
  const { company } = useAuthStore();
  const { activeProject } = useProjectStore();

  const isEditing = Boolean(unit);

  const [unitNumber, setUnitNumber] = useState("");
  const [name, setName] = useState("");
  const [building, setBuilding] = useState("Main Building");
  const [levelName, setLevelName] = useState(levels[0]?.name || "Level 01");
  const [unitType, setUnitType] = useState<UnitUsageType>("RESIDENTIAL");
  const [subType, setSubType] = useState("2-Bedroom Apartment");
  const [stageStatus, setStageStatus] = useState<UnitStageStatus>("FIRST_FIX");
  const [grossFloorArea, setGrossFloorArea] = useState(85);
  const [roomsText, setRoomsText] = useState("Living Room, Master Bedroom, Kitchen, Bathroom, Balcony");
  const [assignedContractor, setAssignedContractor] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (unit) {
      setUnitNumber(unit.unitNumber || "");
      setName(unit.name || "");
      setBuilding(unit.building || "Main Building");
      setLevelName(unit.levelName || levels[0]?.name || "Level 01");
      setUnitType(unit.unitType || "RESIDENTIAL");
      setSubType(unit.subType || "");
      setStageStatus(unit.stageStatus || "FIRST_FIX");
      setGrossFloorArea(unit.grossFloorArea || 85);
      setRoomsText(unit.rooms ? unit.rooms.join(", ") : "");
      setAssignedContractor(unit.assignedContractor || "");
      setNotes(unit.notes || "");
    } else {
      setUnitNumber("");
      setName("");
      setBuilding("Main Building");
      setLevelName(levels[0]?.name || "Level 01");
      setUnitType("RESIDENTIAL");
      setSubType("2-Bedroom Apartment");
      setStageStatus("FIRST_FIX");
      setGrossFloorArea(85);
      setRoomsText("Living Room, Master Bedroom, Kitchen, Bathroom, Balcony");
      setAssignedContractor("");
      setNotes("");
    }
  }, [unit, levels]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject?.id) {
      toast.error("Active project not found.");
      return;
    }
    if (!unitNumber.trim()) {
      toast.error("Unit number is required.");
      return;
    }

    setIsSaving(true);
    try {
      const companyId = activeProject.companyId || company?.id || "";
      const timestamp = Date.now();
      const rooms = roomsText
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);

      const unitId = unit?.id || `unit_${activeProject.id}_${building.replace(/\s+/g, "_")}_${unitNumber.trim()}`;

      const payload: ProjectUnit = {
        id: unitId,
        projectId: activeProject.id,
        companyId,
        unitNumber: unitNumber.trim(),
        name: name.trim() || `Unit ${unitNumber.trim()}`,
        code: `${building}-${unitNumber.trim()}`,
        building: building.trim(),
        levelName: levelName.trim(),
        unitType,
        subType: subType.trim(),
        stageStatus,
        grossFloorArea: Number(grossFloorArea) || 0,
        rooms,
        assignedContractor: assignedContractor.trim() || undefined,
        notes: notes.trim() || undefined,
        snagStats: unit?.snagStats || { total: 0, open: 0, rectified: 0, verified: 0 },
        createdAt: unit?.createdAt || timestamp,
        updatedAt: timestamp,
      };

      await dbService.saveProjectUnit(payload);
      toast.success(isEditing ? "Unit updated successfully!" : "New unit created!");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Save unit error:", err);
      toast.error(err.message || "Failed to save unit.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!unit || !window.confirm(`Are you sure you want to delete ${unit.name}?`)) return;
    try {
      await dbService.deleteProjectUnit(unit.id, unit.projectId, unit.companyId);
      toast.success("Unit deleted.");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Delete unit error:", err);
      toast.error("Failed to delete unit.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {isEditing ? `Edit Unit: ${unit?.name}` : "Create New Unit"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit Number *
              </label>
              <input
                type="text"
                required
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="e.g. 101, RET-G01"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="e.g. Apt 101 (2BR Deluxe)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Building / Block / Tower
              </label>
              <input
                type="text"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Floor Level
              </label>
              <input
                type="text"
                value={levelName}
                onChange={(e) => setLevelName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Usage Type
              </label>
              <select
                value={unitType}
                onChange={(e) => setUnitType(e.target.value as UnitUsageType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="RESIDENTIAL">Residential</option>
                <option value="COMMERCIAL_RETAIL">Retail / Shop</option>
                <option value="OFFICE">Office</option>
                <option value="HOSPITALITY">Hospitality / Hotel</option>
                <option value="AMENITY_FACILITY">Amenity</option>
                <option value="UTILITY_MEP">Utility / MEP</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sub-Type / Layout
              </label>
              <input
                type="text"
                value={subType}
                onChange={(e) => setSubType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="e.g. 2BR, Penthouse"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Gross Area (m²)
              </label>
              <input
                type="number"
                value={grossFloorArea}
                onChange={(e) => setGrossFloorArea(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lifecycle Stage
              </label>
              <select
                value={stageStatus}
                onChange={(e) => setStageStatus(e.target.value as UnitStageStatus)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              >
                <option value="NOT_STARTED">Not Started</option>
                <option value="SUBSTRUCTURE">Substructure</option>
                <option value="SUPERSTRUCTURE">Superstructure</option>
                <option value="FIRST_FIX">First Fix</option>
                <option value="SECOND_FIX">Second Fix</option>
                <option value="FINISHES">Finishes</option>
                <option value="PRE_SNAG">Pre-Snagging</option>
                <option value="CLIENT_SNAG">Client Snagging</option>
                <option value="READY_FOR_HANDOVER">Ready for Handover</option>
                <option value="HANDED_OVER">Handed Over</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Main Trade / Contractor
              </label>
              <input
                type="text"
                value={assignedContractor}
                onChange={(e) => setAssignedContractor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="e.g. Apex Finishes Ltd"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Rooms & Sub-Spaces (comma separated)
            </label>
            <input
              type="text"
              value={roomsText}
              onChange={(e) => setRoomsText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Internal Notes / Handover Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition font-medium"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Unit</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Saving..." : "Save Unit"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
