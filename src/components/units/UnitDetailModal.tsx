import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  Layers,
  Home,
  Store,
  Briefcase,
  AlertOctagon,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Edit,
  ExternalLink,
  PlusCircle,
  FileCheck,
} from "lucide-react";
import { ProjectUnit, RoomPunchItem } from "@/types";
import { dbService } from "@/lib/db";
import { useNavigate } from "react-router-dom";

interface UnitDetailModalProps {
  unit: ProjectUnit | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (unit: ProjectUnit) => void;
  onRefresh?: () => void;
}

export const UnitDetailModal: React.FC<UnitDetailModalProps> = ({
  unit,
  isOpen,
  onClose,
  onEdit,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const [snags, setSnags] = useState<RoomPunchItem[]>([]);
  const [loadingSnags, setLoadingSnags] = useState(false);

  useEffect(() => {
    if (unit && isOpen) {
      loadUnitSnags();
    }
  }, [unit, isOpen]);

  const loadUnitSnags = async () => {
    if (!unit) return;
    setLoadingSnags(true);
    try {
      const allPunch = await dbService.getRoomPunchItems(
        unit.projectId,
        unit.companyId,
      );
      // Filter snags matching this unit
      const unitSnags = allPunch.filter(
        (p) =>
          p.unitName === unit.unitNumber ||
          p.unitName === unit.name ||
          (unit.code && p.unitName === unit.code),
      );
      setSnags(unitSnags);
    } catch (e) {
      console.error("Failed to load unit snags:", e);
    } finally {
      setLoadingSnags(false);
    }
  };

  if (!isOpen || !unit) return null;

  const getTypeIcon = () => {
    switch (unit.unitType) {
      case "COMMERCIAL_RETAIL":
        return <Store className="w-5 h-5 text-amber-500" />;
      case "OFFICE":
        return <Briefcase className="w-5 h-5 text-blue-500" />;
      default:
        return <Home className="w-5 h-5 text-emerald-500" />;
    }
  };

  const getStageBadgeColor = (status: string) => {
    switch (status) {
      case "HANDED_OVER":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
      case "READY_FOR_HANDOVER":
        return "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20";
      case "CLIENT_SNAG":
      case "PRE_SNAG":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
      case "FINISHES":
      case "SECOND_FIX":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      default:
        return "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              {getTypeIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {unit.name}
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {unit.unitNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {unit.building} • {unit.levelName} • {unit.subType || unit.unitType}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(unit)}
              className="p-2 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Edit Unit"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Status & GIA Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Stage</span>
              <div className="mt-1">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${getStageBadgeColor(
                    unit.stageStatus,
                  )}`}
                >
                  {unit.stageStatus.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Gross Area</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {unit.grossFloorArea ? `${unit.grossFloorArea} m²` : "Not specified"}
              </p>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Snags</span>
              <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1">
                {snags.filter((s) => s.stageStatus !== "HANDED_OVER" && s.stageStatus !== "CONSULTANT_APPROVED").length} open
              </p>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Handover TOC</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {unit.stageStatus === "HANDED_OVER" ? "Signed & Closed" : "Pending"}
              </p>
            </div>
          </div>

          {/* Rooms List */}
          <div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Spatial Rooms / Inspection Zones ({unit.rooms?.length || 0})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {unit.rooms && unit.rooms.length > 0 ? (
                unit.rooms.map((r, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700"
                  >
                    {r}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 italic">No specific rooms configured.</span>
              )}
            </div>
          </div>

          {/* Snag List Register */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-amber-500" />
                <span>Defects & Snag Register ({snags.length})</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/project/punch-list?unit=${encodeURIComponent(unit.unitNumber)}`);
                }}
                className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-semibold text-[11px]"
              >
                <span>Log New Snag</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {loadingSnags ? (
              <div className="p-4 text-center text-slate-400">Loading snags...</div>
            ) : snags.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400">
                No active defects reported for this unit.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {snags.map((snag) => (
                  <div
                    key={snag.id}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {snag.punchNumber}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">• {snag.roomName}</span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 line-clamp-1 mt-0.5">
                        {snag.title}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        snag.severity === "CRITICAL"
                          ? "bg-red-500/10 text-red-600"
                          : snag.severity === "MAJOR"
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {snag.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions Footer */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/project/punch-list?unit=${encodeURIComponent(unit.unitNumber)}&tab=handover`);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 font-bold hover:bg-brand-100 transition"
            >
              <FileCheck className="w-4 h-4" />
              <span>Issue Handover Certificate (TOC)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
