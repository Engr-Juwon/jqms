import React, { useEffect, useState } from "react";
import {
  ClipboardList,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Search,
  RefreshCw,
  Layers,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { dbService } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { InspectionTemplate, InspectionTemplateItem } from "@/types";
import { ELEMENTS } from "@/lib/defaultInspectionTemplates";

export const InspectionManagement: React.FC = () => {
  const { currentUser, company } = useAuthStore();
  const { activeProject } = useProjectStore();
  const currentCompId =
    currentUser?.companyId ||
    company?.id ||
    activeProject?.companyId ||
    "comp-apex-civil";

  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<InspectionTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedElement, setSelectedElement] = useState<string>("ALL");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // New Template Form State
  const [newElement, setNewElement] = useState("Beam");
  const [newStage, setNewStage] = useState("");
  const [newDiscipline, setNewDiscipline] = useState("Structural");
  const [newVersion, setNewVersion] = useState("v1.0");
  const [newItems, setNewItems] = useState<
    { label: string; critical: boolean; acceptanceCriteria?: string }[]
  >([
    {
      label: "",
      critical: true,
      acceptanceCriteria: "Per approved project specifications & IFC drawings",
    },
  ]);

  // Edit Template Form State
  const [editTemplateId, setEditTemplateId] = useState("");
  const [editElement, setEditElement] = useState("Beam");
  const [editStage, setEditStage] = useState("");
  const [editDiscipline, setEditDiscipline] = useState("Structural");
  const [editVersion, setEditVersion] = useState("v1.0");
  const [editItems, setEditItems] = useState<
    { label: string; critical: boolean; acceptanceCriteria?: string }[]
  >([]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const list = await dbService.getInspectionTemplates(currentCompId);
      setTemplates(list);
      if (list.length > 0) {
        setSelectedTemplate((prev) => {
          if (prev && list.find((t) => t.id === prev.id)) {
            return list.find((t) => t.id === prev.id)!;
          }
          return list[0];
        });
      } else {
        setSelectedTemplate(null);
      }
    } catch (e) {
      console.error("Failed loading inspection templates:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentCompId) {
      loadTemplates();
    }
  }, [currentCompId]);

  const handleResyncDefaults = async () => {
    if (
      !window.confirm(
        "Reset/Re-seed all built-in ISO inspection templates for this company workspace?",
      )
    )
      return;
    setSeeding(true);
    try {
      const list = await dbService.seedCompanyInspectionTemplates(
        currentCompId,
        true,
      );
      setTemplates(list);
      if (list.length > 0) setSelectedTemplate(list[0]);
    } catch (e) {
      console.error("Failed to seed templates:", e);
    } finally {
      setSeeding(false);
    }
  };

  const handleAddItem = () => {
    setNewItems([...newItems, { label: "", critical: false }]);
  };

  const handleRemoveItem = (index: number) => {
    setNewItems(newItems.filter((_, idx) => idx !== index));
  };

  const handleSaveTemplate = async () => {
    if (!newStage.trim()) {
      alert("Please provide an inspection stage name.");
      return;
    }
    const validItems: InspectionTemplateItem[] = newItems
      .filter((i) => i.label.trim() !== "")
      .map((item) => ({
        label: item.label.trim(),
        critical: item.critical,
        isHoldPoint: item.critical,
        importanceWeight: item.critical ? 3 : 2,
        acceptanceCriteria:
          "Per approved project specifications & IFC drawings",
        discipline: newDiscipline,
      }));

    if (validItems.length === 0) {
      alert("Please add at least one checkpoint item.");
      return;
    }

    const newTmpl: InspectionTemplate = {
      id: `tmpl-${Date.now()}`,
      companyId: currentCompId,
      element: newElement,
      stage: newStage.trim(),
      discipline: newDiscipline,
      version: newVersion || "v1.0",
      isSystem: false,
      isActive: true,
      name: `${newElement} - ${newStage.trim()}`,
      items: validItems,
      createdAt: Date.now(),
    };

    await dbService.saveInspectionTemplate(newTmpl);
    setTemplates((prev) => [newTmpl, ...prev]);
    setSelectedTemplate(newTmpl);
    setShowAddModal(false);
    setNewStage("");
    setNewItems([
      {
        label: "",
        critical: true,
        acceptanceCriteria:
          "Per approved project specifications & IFC drawings",
      },
    ]);

    if (currentUser) {
      await writeAudit({
        companyId: currentCompId,
        projectId: activeProject?.id || "global",
        userId: currentUser.uid,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: "CREATE_INSPECTION_TEMPLATE",
        module: "Inspections",
        details: `Created custom inspection template: ${newTmpl.name}`,
        newValue: newTmpl,
      });
    }
  };

  const startEditTemplate = (tmpl: InspectionTemplate) => {
    setEditTemplateId(tmpl.id);
    setEditElement(tmpl.element || "Beam");
    setEditStage(tmpl.stage || "");
    setEditDiscipline(tmpl.discipline || "Structural");
    setEditVersion(tmpl.version || "v1.0");
    setEditItems(
      tmpl.items && tmpl.items.length > 0
        ? tmpl.items.map((it) => ({
            label: it.label || "",
            critical: !!it.critical || !!it.isHoldPoint,
            acceptanceCriteria:
              it.acceptanceCriteria ||
              "Per approved project specifications & IFC drawings",
          }))
        : [
            {
              label: "",
              critical: true,
              acceptanceCriteria:
                "Per approved project specifications & IFC drawings",
            },
          ],
    );
    setShowEditModal(true);
  };

  const handleAddEditItem = () => {
    setEditItems([
      ...editItems,
      {
        label: "",
        critical: false,
        acceptanceCriteria:
          "Per approved project specifications & IFC drawings",
      },
    ]);
  };

  const handleRemoveEditItem = (index: number) => {
    setEditItems(editItems.filter((_, idx) => idx !== index));
  };

  const handleSaveEditTemplate = async () => {
    const target = templates.find((t) => t.id === editTemplateId);
    if (!target) return;
    if (!editStage.trim()) {
      alert("Please provide an inspection stage name.");
      return;
    }

    const validItems: InspectionTemplateItem[] = editItems
      .filter((i) => i.label.trim() !== "")
      .map((item) => ({
        label: item.label.trim(),
        critical: item.critical,
        isHoldPoint: item.critical,
        importanceWeight: item.critical ? 3 : 2,
        acceptanceCriteria:
          item.acceptanceCriteria?.trim() ||
          "Per approved project specifications & IFC drawings",
        discipline: editDiscipline,
      }));

    if (validItems.length === 0) {
      alert("Please add at least one checkpoint item.");
      return;
    }

    const updatedTmpl: InspectionTemplate = {
      ...target,
      element: editElement,
      stage: editStage.trim(),
      discipline: editDiscipline,
      version: editVersion.trim() || target.version || "v1.0",
      name: `${editElement} - ${editStage.trim()}`,
      items: validItems,
      createdAt: target.createdAt || Date.now(),
    };

    await dbService.saveInspectionTemplate(updatedTmpl);
    const nextTemplates = templates.map((t) =>
      t.id === editTemplateId ? updatedTmpl : t,
    );
    setTemplates(nextTemplates);
    setSelectedTemplate(updatedTmpl);
    setShowEditModal(false);

    if (currentUser) {
      await writeAudit({
        companyId: currentCompId,
        projectId: activeProject?.id || "global",
        userId: currentUser.uid,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: "UPDATE_INSPECTION_TEMPLATE",
        module: "Inspections",
        details: `Updated inspection template: ${updatedTmpl.name}`,
        newValue: updatedTmpl,
      });
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    const target = templates.find((t) => t.id === id);
    if (
      !window.confirm(
        `Are you sure you want to delete template "${target?.name || id}"?`,
      )
    )
      return;
    await dbService.deleteInspectionTemplate(id, currentCompId);
    const next = templates.filter((t) => t.id !== id);
    setTemplates(next);
    if (selectedTemplate?.id === id) {
      setSelectedTemplate(next[0] || null);
    }

    if (currentUser) {
      await writeAudit({
        companyId: currentCompId,
        projectId: activeProject?.id || "global",
        userId: currentUser.uid,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: "DELETE_INSPECTION_TEMPLATE",
        module: "Inspections",
        details: `Deleted inspection template ${id}`,
      });
    }
  };

  // Filtered list
  const filteredTemplates = templates.filter((t) => {
    const matchesElement =
      selectedElement === "ALL" || t.element === selectedElement;
    const matchesDiscipline =
      selectedDiscipline === "ALL" ||
      (t.discipline || "")
        .toLowerCase()
        .includes(selectedDiscipline.toLowerCase());
    const matchesSearch =
      !searchQuery ||
      (t.element &&
        t.element.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.stage && t.stage.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.name && t.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.discipline &&
        (t.discipline || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      t.items?.some((it) =>
        it.label.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    return matchesElement && matchesDiscipline && matchesSearch;
  });

  const uniqueDisciplines = Array.from(
    new Set(templates.map((t) => t.discipline).filter(Boolean)),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="sticky top-1 sm:top-2 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl transition-colors">
        <div>
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-xs uppercase tracking-wider mb-1 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>ISO 9001:2015 Clause 8.6 Quality Inspection Plan</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <ClipboardList className="w-7 h-7 text-brand-600 dark:text-brand-400" />
            Inspection Checklist Template Library
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Standardized Inspection & Test Plans (ITP), critical hold point
            checklists, and pass criteria loaded live from the database.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResyncDefaults}
            disabled={seeding}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition"
            title="Re-populate built-in templates from standard catalogue"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${seeding ? "animate-spin text-brand-600 dark:text-brand-400" : ""}`}
            />
            <span>{seeding ? "Syncing..." : "Re-sync System Templates"}</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Template</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search element, stage, checkpoint label..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            Element:
          </label>
          <select
            value={selectedElement}
            onChange={(e) => setSelectedElement(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Elements ({templates.length})</option>
            {ELEMENTS.map((el) => (
              <option key={el} value={el}>
                {el}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            Discipline:
          </label>
          <select
            value={selectedDiscipline}
            onChange={(e) => setSelectedDiscipline(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Disciplines</option>
            {uniqueDisciplines.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List Column */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Templates ({filteredTemplates.length})
            </h2>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Company ID: {currentCompId}
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              Loading templates from database...
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              No matching inspection templates found.
            </div>
          ) : (
            <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
              {filteredTemplates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition ${selectedTemplate?.id === tmpl.id ? "bg-brand-50 dark:bg-brand-500/10 border-brand-500 text-slate-900 dark:text-white shadow-lg" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-brand-50 dark:bg-slate-950 text-brand-700 dark:text-brand-300 font-bold border border-brand-200 dark:border-slate-800">
                      {tmpl.element || "General"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-semibold">
                        {tmpl.version || "v1.0"}
                      </span>
                      {tmpl.isSystem && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-500/20">
                          SYSTEM
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-2">
                    {tmpl.stage}
                  </h3>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{tmpl.discipline}</span>
                    <span className="font-mono text-brand-600 dark:text-brand-400 font-bold">
                      {tmpl.items?.length || 0} checkpoints
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Template Detail View */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
              <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 font-bold border border-brand-200 dark:border-brand-500/20">
                      {selectedTemplate.element} • {selectedTemplate.discipline}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold">
                      {selectedTemplate.version || "v1.0"}
                    </span>
                    {selectedTemplate.isSystem && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-500/20">
                        Default Standard Template
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white mt-2">
                    {selectedTemplate.stage}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                    Template ID: {selectedTemplate.id}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => startEditTemplate(selectedTemplate)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition"
                    title="Edit template details and checkpoints"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                    <span>Edit Template</span>
                  </button>

                  <button
                    onClick={() => handleDeleteTemplate(selectedTemplate.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 rounded-xl transition border border-transparent hover:border-red-500/30"
                    title="Delete template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Checklist Points ({selectedTemplate.items?.length || 0})
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {selectedTemplate.items?.filter((i) => i.critical).length ||
                      0}{" "}
                    Critical Hold Points
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {selectedTemplate.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            item.critical
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-xs text-slate-900 dark:text-slate-200 font-medium leading-relaxed">
                            {item.label}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1 font-mono">
                            Criteria:{" "}
                            {item.acceptanceCriteria ||
                              "Per approved structural drawings & technical specs"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {item.critical ? (
                          <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-md text-[10px] font-bold border border-amber-300 dark:border-amber-500/30">
                            CRITICAL
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 rounded-md text-[10px] font-semibold">
                            STANDARD
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                <span>
                  This template is stored in the database{" "}
                  <strong className="text-slate-900 dark:text-white">
                    inspectionTemplates
                  </strong>{" "}
                  collection and is referenced automatically when scheduling or
                  executing inspections under the{" "}
                  <strong className="text-slate-900 dark:text-white">
                    {selectedTemplate.element}
                  </strong>{" "}
                  element.
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-xs shadow-xl">
              Select or create a template to view details
            </div>
          )}
        </div>
      </div>

      {/* Add Template Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl text-slate-900 dark:text-white">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <span>Create Inspection Checklist Template</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Target Element *
                  </label>
                  <select
                    value={newElement}
                    onChange={(e) => setNewElement(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-brand-500"
                  >
                    {ELEMENTS.map((el) => (
                      <option key={el} value={el}>
                        {el}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Discipline *
                  </label>
                  <select
                    value={newDiscipline}
                    onChange={(e) => setNewDiscipline(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
                  >
                    <option value="Structural">Structural</option>
                    <option value="MEP">MEP</option>
                    <option value="Architectural">Architectural</option>
                    <option value="Civil">Civil</option>
                    <option value="Materials">Materials</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Inspection Stage / Name *
                  </label>
                  <input
                    type="text"
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value)}
                    placeholder="e.g. Post-Tensioning Tendon Installation"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Version
                  </label>
                  <input
                    type="text"
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    placeholder="v1.0"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                  <label className="text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
                    Checkpoints & Criteria ({newItems.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {newItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-2 items-center bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800"
                  >
                    <span className="text-[11px] font-mono font-bold text-slate-500 w-5">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      placeholder={`Checkpoint item description...`}
                      value={item.label}
                      onChange={(e) => {
                        const next = [...newItems];
                        next[idx].label = e.target.value;
                        setNewItems(next);
                      }}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={item.critical}
                        onChange={(e) => {
                          const next = [...newItems];
                          next[idx].critical = e.target.checked;
                          setNewItems(next);
                        }}
                        className="rounded border-slate-300 dark:border-slate-700 text-brand-500 focus:ring-0"
                      />
                      <span>Critical</span>
                    </label>
                    {newItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50 dark:bg-slate-950/50">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/20 transition"
              >
                Save Inspection Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl text-slate-900 dark:text-white">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <span>Edit Inspection Checklist Template</span>
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Target Element *
                  </label>
                  <select
                    value={editElement}
                    onChange={(e) => setEditElement(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-brand-500"
                  >
                    {ELEMENTS.map((el) => (
                      <option key={el} value={el}>
                        {el}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Discipline *
                  </label>
                  <select
                    value={editDiscipline}
                    onChange={(e) => setEditDiscipline(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
                  >
                    <option value="Structural">Structural</option>
                    <option value="MEP">MEP</option>
                    <option value="Architectural">Architectural</option>
                    <option value="Civil">Civil</option>
                    <option value="Materials">Materials</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Inspection Stage / Name *
                  </label>
                  <input
                    type="text"
                    value={editStage}
                    onChange={(e) => setEditStage(e.target.value)}
                    placeholder="e.g. Post-Tensioning Tendon Installation"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Version
                  </label>
                  <input
                    type="text"
                    value={editVersion}
                    onChange={(e) => setEditVersion(e.target.value)}
                    placeholder="v1.0"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                  <label className="text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
                    Checkpoints & Criteria ({editItems.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddEditItem}
                    className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {editItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="space-y-2 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex gap-2 items-center">
                      <span className="text-[11px] font-mono font-bold text-slate-500 w-5">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        placeholder="Checkpoint label (e.g. Bar diameter, spacing and lap length compliance)..."
                        value={item.label}
                        onChange={(e) => {
                          const next = [...editItems];
                          next[idx].label = e.target.value;
                          setEditItems(next);
                        }}
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
                      />
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={item.critical}
                          onChange={(e) => {
                            const next = [...editItems];
                            next[idx].critical = e.target.checked;
                            setEditItems(next);
                          }}
                          className="rounded border-slate-300 dark:border-slate-700 text-brand-500 focus:ring-0"
                        />
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          Critical
                        </span>
                      </label>
                      {editItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEditItem(idx)}
                          className="text-slate-400 hover:text-red-500 p-1"
                          title="Remove checkpoint"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="pl-7">
                      <input
                        type="text"
                        placeholder="Acceptance criteria (e.g. Tolerances per BS 8110 / ACI 318 Clause 4.2)..."
                        value={item.acceptanceCriteria || ""}
                        onChange={(e) => {
                          const next = [...editItems];
                          next[idx].acceptanceCriteria = e.target.value;
                          setEditItems(next);
                        }}
                        className="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-800 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 font-mono focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50 dark:bg-slate-950/50">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditTemplate}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/20 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
