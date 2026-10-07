import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { dbService } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { hasPermission } from "@/lib/rbac";
import { toast } from "react-hot-toast";
import { MaterialApprovalRequest, SubmittalCategory } from "@/types";
import { DraftBanner } from "@/components/common/DraftBanner";
import { saveFormDraft, getFormDraft, clearFormDraft } from "@/lib/idbVault";
import { useCompany } from "@/lib/companyHelper";
import { TradeSubtradeSelect } from "@/components/sitecomments/TradeSubtradeSelect";
import {
  UniversalPhotoUploader,
  PhotoItem,
} from "@/components/common/UniversalPhotoUploader";
import { FileCheck2, ArrowLeft, Save } from "lucide-react";

export const MARCreate: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentUser, company } = useAuthStore();
  const { activeProject } = useProjectStore();
  const currentProjId = activeProject?.id || projectId || "";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";
  const canCreateMAR = hasPermission(currentUser?.role, "CREATE_MAR");

  const { generateDocNumber, getPrefix } = useCompany();
  const [marNumber, setMarNumber] = useState(() => generateDocNumber("MAR"));

  useEffect(() => {
    if (!rawDraft?.marNumber) {
      setMarNumber(generateDocNumber("MAR"));
    }
  }, [getPrefix]);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<SubmittalCategory>(
    "Technical Data Sheet",
  );
  const [tradeId, setTradeId] = useState("");
  const [tradeName, setTradeName] = useState("Structural Concrete");
  const [subtradeName, setSubtradeName] = useState("");
  const [specSection, setSpecSection] = useState("");
  const [supplierVendor, setSupplierVendor] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [sampleSubmitted, setSampleSubmitted] = useState(false);
  const [technicalDescription, setTechnicalDescription] = useState("");
  const [attachments, setAttachments] = useState<PhotoItem[]>([]);

  // Draft State
  const [hasDraft, setHasDraft] = useState(false);
  const [draftTime, setDraftTime] = useState("");
  const [rawDraft, setRawDraft] = useState<any>(null);
  const [isDraftSaving, setIsDraftSaving] = useState(false);

  useEffect(() => {
    async function checkDraft() {
      if (!currentProjId) return;
      const d = await getFormDraft("MAR", currentProjId);
      if (d && d.data) {
        setHasDraft(true);
        setDraftTime(d.updatedAt);
        setRawDraft(d.data);
      }
    }
    checkDraft();
  }, [currentProjId]);

  const handleRestoreDraft = () => {
    if (!rawDraft) return;
    if (rawDraft.title) setTitle(rawDraft.title);
    if (rawDraft.category) setCategory(rawDraft.category);
    if (rawDraft.tradeId) setTradeId(rawDraft.tradeId);
    if (rawDraft.tradeName) setTradeName(rawDraft.tradeName);
    if (rawDraft.subtradeName) setSubtradeName(rawDraft.subtradeName);
    if (rawDraft.specSection) setSpecSection(rawDraft.specSection);
    if (rawDraft.supplierVendor) setSupplierVendor(rawDraft.supplierVendor);
    if (rawDraft.manufacturer) setManufacturer(rawDraft.manufacturer);
    if (rawDraft.sampleSubmitted !== undefined)
      setSampleSubmitted(rawDraft.sampleSubmitted);
    if (rawDraft.technicalDescription)
      setTechnicalDescription(rawDraft.technicalDescription);
    if (rawDraft.attachments) {
      setAttachments(
        rawDraft.attachments.map((a: any) =>
          typeof a === "string" ? { url: a, caption: "" } : a,
        ),
      );
    }
    setHasDraft(false);
  };

  const handleDiscardDraft = async () => {
    if (currentProjId) {
      await clearFormDraft("MAR", currentProjId);
    }
    setHasDraft(false);
    setRawDraft(null);
  };

  const handleSaveDraft = async () => {
    if (!canCreateMAR) {
      toast.error("You do not have permission to submit MAR submittals");
      return;
    }
    if (!currentProjId) return;
    setIsDraftSaving(true);
    const draftPayload = {
      title,
      category,
      tradeId,
      tradeName,
      subtradeName,
      specSection,
      supplierVendor,
      manufacturer,
      sampleSubmitted,
      technicalDescription,
      attachments: attachments.map((a) => a.url),
    };

    await saveFormDraft("MAR", currentProjId, draftPayload);

    const draftMar: MaterialApprovalRequest = {
      id: `mar-draft-${Date.now()}`,
      projectId: currentProjId,
      companyId: currentCompId,
      marNumber,
      title: title || "Draft Material Submittal",
      category,
      tradeName,
      specSection,
      supplierVendor,
      manufacturer,
      sampleSubmitted,
      technicalDescription,
      status: "DRAFT",
      attachments: attachments.map((a) => a.url),
      createdAt: new Date().toISOString(),
    };

    await dbService.saveMAR(draftMar);

    if (currentUser) {
      await writeAudit({
        projectId: currentProjId,
        companyId: currentCompId,
        userId: currentUser.uid,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: "DRAFT_MAR",
        module: "Submittals",
        details: `Saved draft Material Approval Request ${marNumber}: ${title || "Untitled Draft"}`,
        newValue: draftMar,
      });
    }

    setIsDraftSaving(false);
    navigate("/project/mar");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateMAR) {
      toast.error("You do not have permission to submit MAR submittals");
      return;
    }
    if (!currentProjId) return;

    const newMar: MaterialApprovalRequest = {
      id: `mar-${Date.now()}`,
      projectId: currentProjId,
      companyId: currentCompId,
      marNumber,
      title,
      category,
      tradeName,
      specSection,
      supplierVendor,
      manufacturer,
      sampleSubmitted,
      technicalDescription,
      status: "SUBMITTED",
      attachments: attachments.map((a) => a.url),
      createdAt: new Date().toISOString(),
    };

    await dbService.saveMAR(newMar);
    await clearFormDraft("MAR", currentProjId);

    if (currentUser) {
      await writeAudit({
        projectId: currentProjId,
        companyId: currentCompId,
        userId: currentUser.uid,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: "SUBMIT_MAR",
        module: "Submittals",
        details: `Submitted Material Approval Request ${marNumber}: ${title}`,
        newValue: newMar,
      });
    }

    navigate(`/project/mar/${newMar.id}`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/project/mar")}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-xs uppercase tracking-wider mb-0.5">
              <span>
                Material Submittal Application (ISO 9001:2015 Clause 8.4)
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Create Material Submittal (MAR)
            </h1>
          </div>
        </div>

        <span className="px-3 py-1 rounded-lg bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 font-mono text-xs font-bold border border-brand-200 dark:border-brand-500/30">
          Ref: {marNumber}
        </span>
      </div>

      <DraftBanner
        hasDraft={hasDraft}
        draftTime={draftTime}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
        formName="Material Submittal"
      />

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Material / Submittal Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. C60/75 Self-Consolidating Concrete Mix Design (Mix ID: SCC-60-SF)"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 text-xs placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Submittal Category *
              </label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as SubmittalCategory)
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value="Technical Data Sheet">
                  Technical Data Sheet (TDS)
                </option>
                <option value="Mill Certificate">Mill Test Certificate</option>
                <option value="Material Sample">
                  Physical Material Sample
                </option>
                <option value="Method Statement">Method Statement</option>
                <option value="Shop Drawing">Shop Drawing</option>
                <option value="Test Certificate">
                  Third-Party Test Certificate
                </option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Specification Section Reference
              </label>
              <input
                type="text"
                value={specSection}
                onChange={(e) => setSpecSection(e.target.value)}
                placeholder="e.g. Section 03300 Clause 2.1"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Master Trade & Subtrade from Database */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
            <TradeSubtradeSelect
              companyId={currentCompId}
              selectedTradeId={tradeId}
              selectedTradeName={tradeName}
              selectedSubtrade={subtradeName}
              onTradeChange={(tId, tName) => {
                setTradeId(tId);
                setTradeName(tName);
              }}
              onSubtradeChange={(stName) => setSubtradeName(stName)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Supplier / Vendor Name *
              </label>
              <input
                type="text"
                value={supplierVendor}
                onChange={(e) => setSupplierVendor(e.target.value)}
                placeholder="e.g. ReadyMix Concrete Global Corp."
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Manufacturer / Origin Plant
              </label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. Plant #4 Marine Drive"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={sampleSubmitted}
                onChange={(e) => setSampleSubmitted(e.target.checked)}
                className="rounded text-brand-500 border-slate-300 dark:border-slate-600"
              />
              <span>
                Physical Sample submitted directly to Supervising Consultant
                sample room
              </span>
            </label>
          </div>
        </div>

        {/* Technical Description */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Technical Description & Specification Compliance Data *
            </label>
            <textarea
              rows={5}
              value={technicalDescription}
              onChange={(e) => setTechnicalDescription(e.target.value)}
              placeholder="Detail chemical composition, grade, standard compliance (ASTM/BS EN), test certificates, test reports..."
              required
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 leading-relaxed text-xs placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Material Samples & Mill Test Evidence */}
        <UniversalPhotoUploader
          photos={attachments}
          onChange={(newPhotos) => setAttachments(newPhotos)}
          projectId={currentProjId}
          companyId={currentCompId}
          uploadedBy={currentUser?.fullName || "QA/QC Engineer"}
          uploaderRole={currentUser?.role}
          sourceModule="MAR"
          sourceId={marNumber}
          tradeName={tradeName}
          category="MATERIAL"
          folder={`jqms/mar/${marNumber}/attachments`}
          title="Material Photos, Mill Certificates & Technical Evidence"
          description="Attach physical sample photos, compliance certificates, and manufacturer technical datasheets via Cloudinary or project gallery."
        />

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => navigate("/project/mar")}
            className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isDraftSaving || !canCreateMAR}
            title={
              !canCreateMAR
                ? "You do not have permission to submit MAR submittals"
                : undefined
            }
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-50 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-slate-700 text-amber-800 dark:text-amber-300 font-semibold border border-amber-300 dark:border-amber-500/30 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>{isDraftSaving ? "Saving Draft..." : "Save as Draft"}</span>
          </button>
          <button
            type="submit"
            disabled={!canCreateMAR}
            title={
              !canCreateMAR
                ? "You do not have permission to submit MAR submittals"
                : undefined
            }
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-xl shadow-brand-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>Submit MAR to Consultant</span>
          </button>
        </div>
      </form>
    </div>
  );
};
