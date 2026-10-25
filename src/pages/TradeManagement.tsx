import React, { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ShieldAlert,
  RefreshCw,
  Palette,
  Tag,
  CheckCircle2,
} from "lucide-react";
import { useAuthStore } from "../stores/useAuthStore";
import { useProjectStore } from "../stores/useProjectStore";
import { dbService } from "../lib/db";
import { writeAudit } from "../lib/audit";
import { MasterTrade } from "../types";

export const TradeManagement: React.FC = () => {
  const { currentUser, company } = useAuthStore();
  const { activeProject } = useProjectStore();
  const currentCompId =
    currentUser?.companyId ||
    company?.id ||
    activeProject?.companyId ||
    "";

  const [trades, setTrades] = useState<MasterTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editColor, setEditColor] = useState("#3b82f6");
  const [editDescription, setEditDescription] = useState("");
  const [newSubtradeInput, setNewSubtradeInput] = useState<{
    [tradeId: string]: string;
  }>({});

  // Add new trade modal
  const [newTradeName, setNewTradeName] = useState("");
  const [newTradeCode, setNewTradeCode] = useState("");
  const [newTradeColor, setNewTradeColor] = useState("#3b82f6");
  const [newTradeDescription, setNewTradeDescription] = useState("");
  const [showAddTrade, setShowAddTrade] = useState(false);

  const loadTrades = async () => {
    setLoading(true);
    try {
      const list = await dbService.getTrades(currentCompId);
      setTrades(list);
    } catch (e) {
      console.error("Failed to load trades:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentCompId) {
      loadTrades();
    }
  }, [currentCompId]);

  const handleResyncDefaultTrades = async () => {
    if (
      !window.confirm(
        "Reset/Re-seed standard default master trades (Structural, Architectural, Mechanical, Electrical, Infrastructure, Specialized Works) and all subtrades for this company workspace?",
      )
    )
      return;
    setSeeding(true);
    try {
      const list = await dbService.seedCompanyTrades(currentCompId, true);
      setTrades(list);
    } catch (e) {
      console.error("Failed to reset trades:", e);
    } finally {
      setSeeding(false);
    }
  };

  const handleAddTrade = async () => {
    if (!newTradeName.trim() || !newTradeCode.trim()) {
      alert("Please fill out trade name and code prefix.");
      return;
    }
    const newT: MasterTrade = {
      id: `tr-${newTradeCode.trim().toLowerCase()}-${Date.now()}`,
      companyId: currentCompId,
      name: newTradeName.trim(),
      codePrefix: newTradeCode.trim().toUpperCase(),
      colorHex: newTradeColor || "#3b82f6",
      description: newTradeDescription.trim() || undefined,
      status: "Active",
      subtrades: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await dbService.saveTrade(newT);
    setTrades((prev) => [...prev, newT]);

    if (currentUser) {
      await writeAudit({
        companyId: currentCompId,
        projectId: activeProject?.id || "global",
        userId: currentUser.uid,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: "CREATE_TRADE",
        module: "Settings",
        details: `Added new engineering trade ${newT.name} (${newT.codePrefix})`,
        newValue: newT,
      });
    }

    setNewTradeName("");
    setNewTradeCode("");
    setNewTradeDescription("");
    setShowAddTrade(false);
  };

  const startEditTrade = (trade: MasterTrade) => {
    setEditingId(trade.id);
    setEditName(trade.name);
    setEditCode(trade.codePrefix);
    setEditColor(trade.colorHex || "#3b82f6");
    setEditDescription(trade.description || "");
  };

  const saveEditTrade = async (tradeId: string) => {
    const target = trades.find((t) => t.id === tradeId);
    if (!target) return;

    const updated: MasterTrade = {
      ...target,
      name: editName.trim() || target.name,
      codePrefix: editCode.trim().toUpperCase() || target.codePrefix,
      colorHex: editColor || target.colorHex,
      description: editDescription.trim() || target.description,
      updatedAt: Date.now(),
    };

    await dbService.saveTrade(updated);
    setTrades(trades.map((t) => (t.id === tradeId ? updated : t)));
    setEditingId(null);
  };

  const handleAddSubtrade = async (tradeId: string) => {
    const val = newSubtradeInput[tradeId]?.trim();
    if (!val) return;
    const target = trades.find((t) => t.id === tradeId);
    if (!target) return;

    if (target.subtrades.includes(val)) {
      alert("This subtrade already exists under this trade.");
      return;
    }

    const updatedTrade: MasterTrade = {
      ...target,
      subtrades: [...target.subtrades, val],
    };
    await dbService.saveTrade(updatedTrade);
    setTrades(trades.map((t) => (t.id === tradeId ? updatedTrade : t)));
    setNewSubtradeInput({ ...newSubtradeInput, [tradeId]: "" });
  };

  const handleDeleteSubtrade = async (tradeId: string, subIndex: number) => {
    const target = trades.find((t) => t.id === tradeId);
    if (!target) return;
    const nextSubtrades = [...target.subtrades];
    nextSubtrades.splice(subIndex, 1);
    const updatedTrade: MasterTrade = { ...target, subtrades: nextSubtrades };
    await dbService.saveTrade(updatedTrade);
    setTrades(trades.map((t) => (t.id === tradeId ? updatedTrade : t)));
  };

  const handleDeleteTrade = async (tradeId: string) => {
    if (!window.confirm("Are you sure you want to delete this master trade?"))
      return;
    await dbService.deleteTrade(tradeId, currentCompId);
    setTrades(trades.filter((t) => t.id !== tradeId));
  };

  const totalSubtrades = trades.reduce(
    (acc, t) => acc + (t.subtrades?.length || 0),
    0,
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="sticky top-1 sm:top-2 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl transition-colors">
        <div>
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>
              ISO 9001:2015 Clause 8.1 Operational Planning & Work Packages
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Master Trade & Sub-Activity Register
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Configure multidisciplinary work packages, trade codes, and
            sub-activity taxonomy referenced across all NCRs, MARs, inspections,
            and snags.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResyncDefaultTrades}
            disabled={seeding}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition shadow-sm"
            title="Reset to 8 standard ISO engineering trades"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${seeding ? "animate-spin text-brand-600 dark:text-brand-400" : ""}`}
            />
            <span>{seeding ? "Syncing..." : "Reset Default Trades"}</span>
          </button>
          <button
            onClick={() => setShowAddTrade(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Master Trade</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Master Trades
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {trades.length}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Sub-Activity Tags
            </div>
            <div className="text-2xl font-black text-brand-600 dark:text-brand-400 font-mono mt-0.5">
              {totalSubtrades}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Active Company Workspace
            </div>
            <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mt-1 truncate max-w-[180px]">
              {currentCompId}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Trades Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">
          Loading trades from database...
        </div>
      ) : trades.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
          No master trades registered for this company. Click "Reset Default
          Trades" to initialize.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {trades.map((trade) => {
            const isEditing = editingId === trade.id;
            return (
              <div
                key={trade.id}
                className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm dark:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between space-y-4"
              >
                {/* Trade Top Bar */}
                <div>
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    {isEditing ? (
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                            placeholder="Trade Name"
                          />
                          <input
                            type="text"
                            value={editCode}
                            onChange={(e) => setEditCode(e.target.value)}
                            className="w-20 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 text-xs text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:border-brand-500"
                            placeholder="Prefix"
                          />
                          <input
                            type="color"
                            value={editColor}
                            onChange={(e) => setEditColor(e.target.value)}
                            className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-brand-500"
                            placeholder="Brief description of trade scope..."
                          />
                        </div>
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2.5 py-1 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveEditTrade(trade.id)}
                            className="px-2.5 py-1 text-[11px] bg-brand-600 text-white rounded-lg font-bold shadow-sm"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start gap-2.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow mt-1"
                            style={{
                              backgroundColor: trade.colorHex || "#3b82f6",
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-brand-600 dark:text-brand-400 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                                {trade.codePrefix}
                              </span>
                              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                                {trade.name}
                              </h2>
                            </div>
                            {trade.description && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                {trade.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEditTrade(trade)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Edit Trade"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTrade(trade.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Delete Trade"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Subtrades list */}
                  <div className="mt-3.5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                      <span>
                        Sub-Activity Scope ({trade.subtrades?.length || 0})
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 min-h-[48px]">
                      {trade.subtrades?.map((sub, sIdx) => (
                        <span
                          key={sIdx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-medium group hover:border-slate-300 dark:hover:border-slate-700 transition"
                        >
                          <span>{sub}</span>
                          <button
                            onClick={() => handleDeleteSubtrade(trade.id, sIdx)}
                            className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"
                            title="Remove subtrade"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {(!trade.subtrades || trade.subtrades.length === 0) && (
                        <span className="text-[11px] text-slate-400 dark:text-slate-600 italic">
                          No sub-activities added yet.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Add Subtrade input */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add sub-activity (e.g. Hydrostatic Testing)..."
                      value={newSubtradeInput[trade.id] || ""}
                      onChange={(e) =>
                        setNewSubtradeInput({
                          ...newSubtradeInput,
                          [trade.id]: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSubtrade(trade.id);
                        }
                      }}
                      className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-brand-500"
                    />
                    <button
                      onClick={() => handleAddSubtrade(trade.id)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Master Trade Modal */}
      {showAddTrade && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <span>Register New Master Trade</span>
              </h3>
              <button
                onClick={() => setShowAddTrade(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Trade Title / Work Package *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Geotechnical Instrumentation & Monitoring"
                  value={newTradeName}
                  onChange={(e) => setNewTradeName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Code Prefix *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GEOT"
                    value={newTradeCode}
                    onChange={(e) =>
                      setNewTradeCode(e.target.value.toUpperCase())
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-mono uppercase focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Color Marker
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newTradeColor}
                      onChange={(e) => setNewTradeColor(e.target.value)}
                      className="w-9 h-9 rounded-xl bg-transparent border-0 cursor-pointer"
                    />
                    <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                      {newTradeColor}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Deep foundation instrumentation, piezometer and settlement monitoring"
                  value={newTradeDescription}
                  onChange={(e) => setNewTradeDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
              This master trade will be instantly available in the dropdowns for
              NCRs, MARs, inspections, and site observations.
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowAddTrade(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTrade}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/20"
              >
                Create Master Trade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
