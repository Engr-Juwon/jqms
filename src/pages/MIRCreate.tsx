import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { dbService } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { hasPermission } from "@/lib/rbac";
import { toast } from "react-hot-toast";
import {
  MaterialInspectionReport,
  MaterialDiscipline,
  MIRItem,
  MaterialApprovalRequest,
  MIRStatus,
  MIRInspectionDisposition,
} from "@/types";
import { StakeholderSignoff } from "@/lib/pdfGenerators";
import { ROLE_TITLES } from "@/lib/permissions";
import { useCompany } from "@/lib/companyHelper";
import {
  UniversalPhotoUploader,
  PhotoItem,
} from "@/components/common/UniversalPhotoUploader";
import {
  ClipboardCheck,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  FileCheck2,
  Package,
  Layers,
  Calendar,
  Truck,
  Building,
  ShieldCheck,
  UserCheck,
  X,
} from "lucide-react";

export const MIRCreate: React.FC = () => {
  const { projectId, id } = useParams<{ projectId?: string; id?: string }>();
  const navigate = useNavigate();
  const { currentUser, company } = useAuthStore();
  const { activeProject } = useProjectStore();
  const currentProjId = activeProject?.id || projectId || "";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";
  const canCreateMIR = hasPermission(currentUser?.role, "CREATE_MIR");

  const { generateDocNumber } = useCompany();
  const [mirNumber, setMirNumber] = useState(() => generateDocNumber("MIR"));
  const [existingMir, setExistingMir] =
    useState<MaterialInspectionReport | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(Boolean(id));
  const isEditMode = Boolean(id);

  // Form State
  const [title, setTitle] = useState("");
  const [discipline, setDiscipline] =
    useState<MaterialDiscipline>("Civil & Structural");
  const [supplierVendor, setSupplierVendor] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [inspectionDate, setInspectionDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [deliveryNumber, setDeliveryNumber] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [status, setStatus] = useState<MIRStatus>("SUBMITTED");
  const [disposition, setDisposition] = useState<MIRInspectionDisposition | "">(
    "ACCEPTED",
  );

  // Linked MAR
  const [mars, setMars] = useState<MaterialApprovalRequest[]>([]);
  const [selectedMarId, setSelectedMarId] = useState("");

  // Verification Checkpoints
  const [packagingCondition, setPackagingCondition] = useState<
    "SATISFACTORY" | "DAMAGED" | "COMPROMISED"
  >("SATISFACTORY");
  const [millCertificateProvided, setMillCertificateProvided] = useState(true);
  const [physicalDimensionsCheck, setPhysicalDimensionsCheck] = useState<
    "PASS" | "FAIL" | "NOT_APPLICABLE"
  >("PASS");
  const [samplingRequired, setSamplingRequired] = useState(false);
  const [sampleTagNumber, setSampleTagNumber] = useState("");

  // Line Items
  const [items, setItems] = useState<MIRItem[]>([
    {
      id: `item-${Date.now()}-1`,
      description: "",
      specificationRef: "",
      quantityDelivered: 1,
      quantityInspected: 1,
      quantityAccepted: 1,
      quantityRejected: 0,
      unit: "pcs",
      remarks: "",
    },
  ]);

  // Notes & Attachments
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [rejectionReasons, setRejectionReasons] = useState("");
  const [actionRequired, setActionRequired] = useState("");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Stakeholders Configuration
  const DEFAULT_MIR_STAKEHOLDERS: StakeholderSignoff[] = [
    {
      role: "QA/QC Engineer",
      name: "",
      designation: "QA/QC Engineer",
      required: true,
      signed: false,
    },
    {
      role: "Contractor Quality Representative",
      name: currentUser?.fullName || "",
      designation: "Site QA/QC Inspector",
      required: true,
      signed: false,
    },
    {
      role: "Supervising Consultant / RE",
      name: "",
      designation: "Resident Engineer",
      required: false,
      signed: false,
    },
    {
      role: "Storekeeper / Warehouseman",
      name: "",
      designation: "Materials Storekeeper",
      required: false,
      signed: false,
    },
  ];

  const [stakeholders, setStakeholders] = useState<StakeholderSignoff[]>(
    DEFAULT_MIR_STAKEHOLDERS,
  );
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [customRoleInput, setCustomRoleInput] = useState("");

  // Load project MARs for auto-completion
  useEffect(() => {
    async function loadMARs() {
      if (!currentProjId) return;
      try {
        const list = await dbService.getMARs(currentProjId, currentCompId);
        setMars(
          list.filter(
            (m) =>
              m.status === "APPROVED" ||
              m.approvalCode === "CODE_A" ||
              m.approvalCode === "CODE_B" ||
              m.reviewCode === "Code A" ||
              m.reviewCode === "Code B",
          ),
        );
      } catch (err) {
        console.warn("Error loading approved MARs:", err);
      }
    }
    loadMARs();
  }, [currentProjId, currentCompId]);

  // Load existing MIR if editing
  useEffect(() => {
    async function loadExisting() {
      if (!id || !currentProjId) {
        setLoadingExisting(false);
        return;
      }
      try {
        setLoadingExisting(true);
        const record = await dbService.getMIR(id, currentProjId, currentCompId);
        if (record) {
          setExistingMir(record);
          setMirNumber(record.mirNumber);
          setTitle(record.title || "");
          setDiscipline(record.discipline || "Civil & Structural");
          if (record.status) setStatus(record.status);
          if (record.disposition) setDisposition(record.disposition);
          setSupplierVendor(record.supplierVendor || "");
          setManufacturer(record.manufacturer || "");
          if (record.deliveryDate) setDeliveryDate(record.deliveryDate);
          if (record.inspectionDate) setInspectionDate(record.inspectionDate);
          setDeliveryNumber(record.deliveryNumber || "");
          setPoNumber(record.poNumber || "");
          setStorageLocation(record.storageLocation || "");
          setSelectedMarId(record.marId || "");
          setPackagingCondition(record.packagingCondition || "SATISFACTORY");
          setMillCertificateProvided(record.millCertificateProvided ?? true);
          setPhysicalDimensionsCheck(record.physicalDimensionsCheck || "PASS");
          setSamplingRequired(record.samplingRequired ?? false);
          setSampleTagNumber(record.sampleTagNumber || "");
          if (record.items && record.items.length > 0) {
            setItems(record.items);
          }
          setInspectionNotes(record.inspectionNotes || "");
          setRejectionReasons(record.rejectionReasons || "");
          setActionRequired(record.actionRequired || "");
          if (record.photos && record.photos.length > 0) {
            setPhotos(
              record.photos.map((p: any) =>
                typeof p === "string" ? { url: p, caption: "" } : p,
              ),
            );
          }

          if (record.stakeholders && record.stakeholders.length > 0) {
            setStakeholders(record.stakeholders);
          } else {
            const initial = DEFAULT_MIR_STAKEHOLDERS.map((s) => {
              if (
                s.role === "QA/QC Engineer" &&
                (record.qaqcSignOff || record.consultantSignOff)
              ) {
                const sign = record.qaqcSignOff || record.consultantSignOff;
                return {
                  ...s,
                  name: sign?.name || "",
                  designation: (sign as any)?.designation || "QA/QC Engineer",
                  signed: Boolean(sign?.signed),
                  signedAt: sign?.date,
                };
              }
              if (
                s.role === "Contractor Quality Representative" &&
                (record.contractorSignOff || record.inspectedBy)
              ) {
                return {
                  ...s,
                  name:
                    record.contractorSignOff?.name ||
                    record.inspectedBy?.name ||
                    "",
                  designation: "Site QA/QC Inspector",
                  signed: Boolean(record.contractorSignOff?.signed),
                  signedAt: record.contractorSignOff?.date,
                };
              }
              return s;
            });
            setStakeholders(initial);
          }
        } else {
          toast.error("Material Inspection Report not found");
          navigate("/project/mir");
        }
      } catch (err) {
        console.error("Failed to load MIR:", err);
        toast.error("Failed to load existing inspection report");
      } finally {
        setLoadingExisting(false);
      }
    }
    loadExisting();
  }, [id, currentProjId, currentCompId, navigate]);

  // When user selects an approved MAR, auto-fill fields
  const handleMARSelect = (marId: string) => {
    setSelectedMarId(marId);
    if (!marId) return;
    const match = mars.find((m) => m.id === marId);
    if (match) {
      setTitle(match.title || title);
      setSupplierVendor(match.supplierVendor || supplierVendor);
      setManufacturer(match.manufacturer || manufacturer);
      if (
        match.tradeName?.includes("Civil") ||
        match.tradeName?.includes("Concrete") ||
        match.tradeName?.includes("Steel")
      ) {
        setDiscipline("Civil & Structural");
      } else if (
        match.tradeName?.includes("Arch") ||
        match.tradeName?.includes("Tile") ||
        match.tradeName?.includes("Paint")
      ) {
        setDiscipline("Architectural");
      } else if (match.tradeName?.includes("Elec")) {
        setDiscipline("MEP - Electrical");
      } else if (
        match.tradeName?.includes("Plumb") ||
        match.tradeName?.includes("Drain")
      ) {
        setDiscipline("Plumbing & Drainage");
      }

      // Pre-fill first item if empty
      if (items.length === 1 && !items[0].description) {
        setItems([
          {
            ...items[0],
            description: match.title,
            specificationRef: match.specSection || match.specificationRef || "",
          },
        ]);
      }
    }
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length + 1}`,
        description: "",
        specificationRef: "",
        quantityDelivered: 1,
        quantityInspected: 1,
        quantityAccepted: 1,
        quantityRejected: 0,
        unit: "pcs",
        remarks: "",
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof MIRItem, value: any) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const updated = { ...i, [field]: value };
        // Auto-recalculate accepted when delivered/inspected/rejected changes
        if (field === "quantityDelivered" || field === "quantityRejected") {
          const del =
            Number(
              field === "quantityDelivered" ? value : updated.quantityDelivered,
            ) || 0;
          const rej =
            Number(
              field === "quantityRejected" ? value : updated.quantityRejected,
            ) || 0;
          updated.quantityAccepted = Math.max(0, del - rej);
          updated.quantityInspected = del;
        }
        return updated;
      }),
    );
  };

  const toggleStakeholderRequired = (index: number) => {
    const isQAQC =
      stakeholders[index].role.toLowerCase().includes("qa/qc") &&
      stakeholders[index].role.toLowerCase().includes("engineer");
    if (isQAQC) return;

    setStakeholders((prev) =>
      prev.map((s, idx) =>
        idx === index ? { ...s, required: !s.required } : s,
      ),
    );
  };

  const updateStakeholder = (
    index: number,
    updates: Partial<StakeholderSignoff>,
  ) => {
    setStakeholders((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, ...updates } : s)),
    );
  };

  const handleAddStakeholder = (roleName: string) => {
    if (!roleName.trim()) return;
    if (
      stakeholders.some(
        (s) => s.role.toLowerCase() === roleName.trim().toLowerCase(),
      )
    ) {
      toast.error(`Sign-off role "${roleName}" already exists`);
      return;
    }
    const newSh: StakeholderSignoff = {
      role: roleName.trim(),
      name: "",
      designation: roleName.trim(),
      required: true,
      signed: false,
    };
    setStakeholders((prev) => [...prev, newSh]);
    setShowAddRoleModal(false);
    setCustomRoleInput("");
    toast.success(`Added ${roleName} sign-off requirement`);
  };

  const handleRemoveStakeholder = (index: number) => {
    const removedRole = stakeholders[index].role;
    setStakeholders((prev) => prev.filter((_, idx) => idx !== index));
    toast.success(`Removed ${removedRole} sign-off`);
  };

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    if (!canCreateMIR) {
      toast.error(
        "You do not have permission to issue Material Inspection Reports (Level 2+ required)",
      );
      return;
    }
    if (!title.trim()) {
      toast.error("Please provide a material title or description");
      return;
    }

    setSubmitting(true);
    try {
      const selectedMAR = mars.find((m) => m.id === selectedMarId);
      const totalDelivered = items.reduce(
        (acc, i) => acc + (Number(i.quantityDelivered) || 0),
        0,
      );
      const totalRejected = items.reduce(
        (acc, i) => acc + (Number(i.quantityRejected) || 0),
        0,
      );

      let initialDisposition:
        | "ACCEPTED"
        | "ACCEPTED_AS_NOTED"
        | "REJECTED"
        | "HOLD_FOR_TESTING"
        | undefined = undefined;
      if (!isDraft) {
        if (totalRejected > 0 && totalRejected === totalDelivered) {
          initialDisposition = "REJECTED";
        } else if (samplingRequired) {
          initialDisposition = "HOLD_FOR_TESTING";
        } else if (totalRejected > 0) {
          initialDisposition = "ACCEPTED_AS_NOTED";
        } else {
          initialDisposition = "ACCEPTED";
        }
      }

      const mirRecord: MaterialInspectionReport = {
        id: existingMir ? existingMir.id : `mir-${Date.now()}`,
        mirNumber: existingMir ? existingMir.mirNumber : mirNumber,
        projectId: currentProjId,
        projectName:
          activeProject?.name ||
          existingMir?.projectName ||
          "Construction Project",
        companyId: currentCompId,
        companyName: company?.name || existingMir?.companyName || "Company",
        title,
        discipline,
        status: isDraft ? "DRAFT" : status || "SUBMITTED",
        disposition: disposition || initialDisposition || "ACCEPTED",

        marId: selectedMarId || undefined,
        marNumber: selectedMAR ? selectedMAR.marNumber : existingMir?.marNumber,
        deliveryNumber: deliveryNumber.trim() || undefined,
        poNumber: poNumber.trim() || undefined,
        supplierVendor: supplierVendor.trim() || "Site Delivery",
        manufacturer: manufacturer.trim() || undefined,
        deliveryDate,
        inspectionDate,
        storageLocation: storageLocation.trim() || "Site Laydown Yard",

        packagingCondition,
        millCertificateProvided,
        physicalDimensionsCheck,
        samplingRequired,
        sampleTagNumber: samplingRequired ? sampleTagNumber.trim() : undefined,
        quarantineActionTaken: totalRejected > 0,

        items,
        inspectionNotes: inspectionNotes.trim() || undefined,
        rejectionReasons: rejectionReasons.trim() || undefined,
        actionRequired: actionRequired.trim() || undefined,

        photos: photos.map((p) => p.url),

        inspectedBy: existingMir?.inspectedBy || {
          name: currentUser?.fullName || "Site QA/QC Inspector",
          role: currentUser?.role || "FIELD_INSPECTOR",
          date: inspectionDate,
        },
        contractorSignOff: existingMir?.contractorSignOff || {
          name: currentUser?.fullName || "Contractor Quality Representative",
          company: company?.name || "Main Contractor",
          date: inspectionDate,
          signed: true,
        },
        consultantSignOff: existingMir?.consultantSignOff,
        qaqcSignOff: existingMir?.qaqcSignOff,
        stakeholders,

        createdAt: existingMir?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: existingMir?.createdBy || currentUser?.uid,
      };

      await dbService.saveMIR(mirRecord);

      if (currentUser) {
        await writeAudit({
          projectId: currentProjId,
          companyId: currentCompId,
          userId: currentUser.uid,
          userName: currentUser.fullName,
          userRole: currentUser.role,
          action: isEditMode ? "UPDATE_MIR" : "CREATE_MIR",
          module: "Material Inspection",
          details: `${isEditMode ? "Updated" : "Raised"} Material Inspection Report ${mirRecord.mirNumber}: ${title} (${discipline})`,
          newValue: mirRecord,
        });
      }

      toast.success(
        isDraft
          ? "MIR saved as draft"
          : isEditMode
            ? "Material Inspection Report updated!"
            : "Material Inspection Report successfully issued!",
      );
      navigate(`/project/mir/${mirRecord.id}`);
    } catch (err) {
      console.error("Error saving MIR:", err);
      toast.error("Failed to save Material Inspection Report");
    } finally {
      setSubmitting(false);
    }
  };

  const disciplines: MaterialDiscipline[] = [
    "Civil & Structural",
    "Architectural",
    "MEP - Electrical",
    "MEP - Mechanical",
    "Plumbing & Drainage",
    "Geotechnical",
    "General",
  ];

  if (loadingExisting) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">
        Loading material inspection report...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300 pb-16">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/project/mir")}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-xs uppercase tracking-wider mb-0.5 font-bold">
              <span>{mirNumber} • ISO 9001:2015 Clause 8.4</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isEditMode
                ? existingMir?.status === "DRAFT"
                  ? "Continue Editing MIR Draft"
                  : "Amend Material Inspection Report"
                : "Issue Material Inspection Report (MIR)"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={submitting}
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition shadow-sm"
          >
            {isEditMode ? "Save Draft Changes" : "Save Draft"}
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, false)}
            disabled={submitting || !canCreateMIR}
            className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/20 transition active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>
              {submitting
                ? "Saving..."
                : isEditMode && existingMir?.status !== "DRAFT"
                  ? "Update MIR"
                  : "Submit MIR"}
            </span>
          </button>
        </div>
      </div>

      <form
        onSubmit={(e) => handleSubmit(e, false)}
        className="space-y-6 text-xs"
      >
        {/* Section 1: Overview & MAR Cross Reference */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-white text-sm">
            <FileCheck2 className="w-4 h-4 text-brand-600" />
            <span>1. Material Identification & Submittal Cross-Reference</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Approved MAR Link (Material Approval Request)
              </label>
              <select
                value={selectedMarId}
                onChange={(e) => handleMARSelect(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              >
                <option value="">
                  -- Direct Site Receiving (No MAR Link) --
                </option>
                {mars.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.marNumber}: {m.title} ({m.supplierVendor})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Selecting an approved MAR pre-fills material details, supplier,
                and discipline.
              </span>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Engineering Discipline *
              </label>
              <select
                value={discipline}
                onChange={(e) =>
                  setDiscipline(e.target.value as MaterialDiscipline)
                }
                required
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-semibold"
              >
                {disciplines.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Material Name / Inspection Subject *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. High Yield Deformed Steel Rebar Grade B500B (16mm & 20mm)"
                required
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Document Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MIRStatus)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-bold"
              >
                <option value="DRAFT">
                  DRAFT (Work in Progress / Unsubmitted)
                </option>
                <option value="SUBMITTED">
                  SUBMITTED (Issued & Awaiting Field Review)
                </option>
                <option value="INSPECTED">
                  INSPECTED (Site Inspection Carried Out)
                </option>
                <option value="ACCEPTED">
                  ACCEPTED (Approved & Conforming)
                </option>
                <option value="ACCEPTED_AS_NOTED">
                  ACCEPTED AS NOTED (Conditional Acceptance)
                </option>
                <option value="REJECTED">
                  REJECTED (Non-Compliant / Rejected)
                </option>
                <option value="QUARANTINED">
                  QUARANTINED (Hold for Testing)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Material Inspection Verdict (Disposition)
              </label>
              <select
                value={disposition}
                onChange={(e) =>
                  setDisposition(e.target.value as MIRInspectionDisposition)
                }
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-bold"
              >
                <option value="ACCEPTED">
                  ACCEPTED (Approved / Full Conformance)
                </option>
                <option value="ACCEPTED_AS_NOTED">
                  ACCEPTED AS NOTED (Minor Non-Conformance)
                </option>
                <option value="REJECTED">
                  REJECTED (Failed Receiving Checkpoints)
                </option>
                <option value="HOLD_FOR_TESTING">
                  HOLD FOR TESTING (Quarantined for Lab Testing)
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Delivery & Waybill Traceability */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-white text-sm">
            <Truck className="w-4 h-4 text-brand-600" />
            <span>2. Delivery Waybill & Storage Laydown Details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Supplier / Vendor *
              </label>
              <input
                type="text"
                value={supplierVendor}
                onChange={(e) => setSupplierVendor(e.target.value)}
                placeholder="e.g. Apex Steel Mills Ltd."
                required
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Manufacturer / Mill
              </label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. Qatar Steel Mill #4"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Delivery Waybill / Gate Ticket #
              </label>
              <input
                type="text"
                value={deliveryNumber}
                onChange={(e) => setDeliveryNumber(e.target.value)}
                placeholder="e.g. WB-884920"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Purchase Order (PO) #
              </label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="e.g. PO-2026-0492"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Delivery Arrival Date *
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Physical Inspection Date *
              </label>
              <input
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                On-Site Storage / Laydown Area
              </label>
              <input
                type="text"
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                placeholder="e.g. Rebar Laydown Yard B, Staged on Timber Dunnage and Weatherproof Tarps"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Compliance Checkpoints Matrix */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-white text-sm">
            <ClipboardCheck className="w-4 h-4 text-brand-600" />
            <span>3. Physical Verification Checkpoints</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Packaging & Physical Integrity:
              </span>
              <div className="flex gap-2">
                {(["SATISFACTORY", "COMPROMISED", "DAMAGED"] as const).map(
                  (cond) => (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => setPackagingCondition(cond)}
                      className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] border transition ${
                        packagingCondition === cond
                          ? cond === "SATISFACTORY"
                            ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                            : "bg-red-500 text-white border-red-600 shadow-sm"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {cond}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Mill Test Certificate (MTC) Attached:
              </span>
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={millCertificateProvided}
                  onChange={(e) => setMillCertificateProvided(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                />
                <span className="text-slate-700 dark:text-slate-300 font-semibold">
                  Original / Verified MTC Provided With Delivery
                </span>
              </label>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Dimensional & Gauge Verification:
              </span>
              <div className="flex gap-2">
                {(["PASS", "FAIL", "NOT_APPLICABLE"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setPhysicalDimensionsCheck(v)}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] border transition ${
                      physicalDimensionsCheck === v
                        ? v === "PASS"
                          ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                          : v === "FAIL"
                            ? "bg-red-500 text-white border-red-600 shadow-sm"
                            : "bg-slate-600 text-white border-slate-700 shadow-sm"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {v === "NOT_APPLICABLE" ? "N/A" : v}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Independent QA Laboratory Testing Required:
              </span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={samplingRequired}
                    onChange={(e) => setSamplingRequired(e.target.checked)}
                    className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">
                    Sample Couplets / Specimens Taken
                  </span>
                </label>
                {samplingRequired && (
                  <input
                    type="text"
                    value={sampleTagNumber}
                    onChange={(e) => setSampleTagNumber(e.target.value)}
                    placeholder="Sample Tag # (e.g. LAB-049)"
                    className="flex-1 p-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Line Items Table */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
              <Package className="w-4 h-4 text-brand-600" />
              <span>4. Delivered Line Items Breakdown</span>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  <th className="py-2.5 px-3">Description *</th>
                  <th className="py-2.5 px-3 w-28">Spec Ref</th>
                  <th className="py-2.5 px-3 w-20 text-right">Delivered</th>
                  <th className="py-2.5 px-3 w-20 text-right">Rejected</th>
                  <th className="py-2.5 px-3 w-20 text-right">Accepted</th>
                  <th className="py-2.5 px-3 w-24">Unit</th>
                  <th className="py-2.5 px-3">Remarks</th>
                  <th className="py-2.5 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {items.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                  >
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          updateItem(item.id, "description", e.target.value)
                        }
                        placeholder={`Item ${idx + 1} Description...`}
                        required
                        className="w-full p-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-medium"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={item.specificationRef || ""}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "specificationRef",
                            e.target.value,
                          )
                        }
                        placeholder="e.g. BS 4449"
                        className="w-full p-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.quantityDelivered}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "quantityDelivered",
                            e.target.value,
                          )
                        }
                        className="w-full p-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-right font-bold"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.quantityRejected}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "quantityRejected",
                            e.target.value,
                          )
                        }
                        className={`w-full p-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border text-right font-bold ${
                          item.quantityRejected > 0
                            ? "border-red-500 text-red-600"
                            : "border-slate-200 dark:border-slate-700"
                        }`}
                      />
                    </td>
                    <td className="py-2 px-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {item.quantityAccepted}
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) =>
                          updateItem(item.id, "unit", e.target.value)
                        }
                        placeholder="tons, pcs..."
                        className="w-full p-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={item.remarks || ""}
                        onChange={(e) =>
                          updateItem(item.id, "remarks", e.target.value)
                        }
                        placeholder="Batch #, heat #..."
                        className="w-full p-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length <= 1}
                        className="p-1 rounded text-slate-400 hover:text-red-600 disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5: Observations, Rejection Notes & Photos */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-white text-sm">
            <Layers className="w-4 h-4 text-brand-600" />
            <span>5. Inspection Notes & Photo Documentation</span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                Inspection Observations & General Notes
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                Supports paragraph breaks &amp; clauses
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">
                Insert Clause:
              </span>
              {[
                "Observation: ",
                "Dimensional Non-Conformance: ",
                "Operational Impact: ",
                "Management Directive: ",
                "Liability Disclaimer: ",
                "Special Condition: ",
              ].map((prefix) => (
                <button
                  key={prefix}
                  type="button"
                  onClick={() => {
                    setInspectionNotes((prev) => {
                      const trimmed = prev.trim();
                      return trimmed ? `${trimmed}\n\n${prefix}` : prefix;
                    });
                  }}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-950/40 dark:hover:text-brand-300 border border-slate-200 dark:border-slate-700 text-[10px] font-medium transition"
                >
                  + {prefix.replace(": ", "")}
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              value={inspectionNotes}
              onChange={(e) => setInspectionNotes(e.target.value)}
              placeholder="Record notes on heat numbers, packaging state, surface conditions, dunnage (e.g. Dimensional Non-Conformance: ..., Operational Impact: ...)..."
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 leading-relaxed"
            />
          </div>

          {(items.some((i) => i.quantityRejected > 0) || rejectionReasons.length > 0) && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 space-y-3">
              <div className="flex items-center gap-2 font-bold text-red-800 dark:text-red-300">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>Rejection Reason & Non-Conformance Actions</span>
              </div>
              <div>
                <label className="block text-red-800 dark:text-red-300 font-semibold mb-1">
                  Specific Rejection Defect / Technical Non-Conformance:
                </label>
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <span className="text-[10px] uppercase font-bold text-red-600/80 mr-1">
                    Insert:
                  </span>
                  {[
                    "Dimensional Non-Conformance: ",
                    "Operational Impact: ",
                    "Management Directive: ",
                    "Liability Disclaimer: ",
                    "Root Cause: ",
                    "Corrective Action: ",
                  ].map((prefix) => (
                    <button
                      key={prefix}
                      type="button"
                      onClick={() => {
                        setRejectionReasons((prev) => {
                          const trimmed = prev.trim();
                          return trimmed ? `${trimmed}\n\n${prefix}` : prefix;
                        });
                      }}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800 text-[10px] font-medium transition"
                    >
                      + {prefix.replace(": ", "")}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={3}
                  value={rejectionReasons}
                  onChange={(e) => setRejectionReasons(e.target.value)}
                  placeholder="Detail why materials were rejected or accepted under special directives (e.g. Dimensional Non-Conformance: ..., Operational Impact: ..., Management Directive: ..., Liability Disclaimer: ...)..."
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800 text-slate-900 dark:text-white leading-relaxed"
                />
              </div>
              <div>
                <label className="block text-red-800 dark:text-red-300 font-semibold mb-1">
                  Required Quarantine or Return Action:
                </label>
                <input
                  type="text"
                  value={actionRequired}
                  onChange={(e) => setActionRequired(e.target.value)}
                  placeholder="e.g. Tagged with RED REJECT TAPE, quarantined in Laydown Zone C, supplier notified for replacement"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">
              Attach Inspection Photos & Mill Test Certificates
            </label>
            <UniversalPhotoUploader
              photos={photos}
              onChange={setPhotos}
              projectId={currentProjId}
              companyId={currentCompId}
              sourceModule="MIR"
              sourceId={mirNumber}
              folder={`projects/${currentProjId}/mirs`}
              maxPhotos={12}
            />
          </div>
        </div>

        {/* Section 6: Statutory Stakeholder Sign-Off Authorizations */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>6. Statutory Stakeholder Sign-Off Authorizations</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure required quality signatories, toggle optional/required
                roles, or add custom stakeholder roles.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddRoleModal(true)}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Sign-off Role</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {stakeholders.map((sh, idx) => {
              const isQAQC =
                sh.role.toLowerCase().includes("qa/qc") &&
                sh.role.toLowerCase().includes("engineer");
              return (
                <div
                  key={idx}
                  className={`p-3.5 border rounded-2xl transition flex flex-col justify-between ${
                    sh.signed
                      ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800"
                      : sh.required
                        ? "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                        : "bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/60 opacity-70"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                      <span>{sh.role}</span>
                      {sh.signed && (
                        <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                          SIGNED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isQAQC}
                        onClick={() => toggleStakeholderRequired(idx)}
                        className={`text-[9px] font-black px-2 py-0.5 rounded-lg border transition ${
                          isQAQC
                            ? "bg-amber-100 text-amber-800 border-amber-300 cursor-not-allowed"
                            : sh.required
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300"
                        }`}
                        title={
                          isQAQC
                            ? "QA/QC Engineer endorsement is statutory & mandatory"
                            : "Click to toggle Required / Optional"
                        }
                      >
                        {isQAQC
                          ? "MANDATORY"
                          : sh.required
                            ? "REQUIRED"
                            : "OPTIONAL"}
                      </button>
                      {!isQAQC && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStakeholder(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition"
                          title="Remove this signoff role"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    {sh.signed ? (
                      <div className="space-y-1 py-0.5">
                        <div className="font-bold text-emerald-950 dark:text-emerald-200 flex items-center justify-between text-xs">
                          <span>{sh.name}</span>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                            {sh.signedAt
                              ? new Date(sh.signedAt).toLocaleDateString()
                              : "Signed"}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {sh.designation || sh.role}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            updateStakeholder(idx, {
                              name: "",
                              designation: "",
                              signed: false,
                              signedAt: undefined,
                            })
                          }
                          className="text-[10px] text-rose-600 hover:underline font-bold mt-1 inline-block"
                        >
                          Clear Signature
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Signatory Full Name
                          </label>
                          <input
                            type="text"
                            value={sh.name || ""}
                            onChange={(e) =>
                              updateStakeholder(idx, { name: e.target.value })
                            }
                            placeholder={`Enter ${sh.role} name`}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Designation / Title
                          </label>
                          <input
                            type="text"
                            value={sh.designation || ""}
                            onChange={(e) =>
                              updateStakeholder(idx, {
                                designation: e.target.value,
                              })
                            }
                            placeholder={`e.g. ${sh.role}`}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                          />
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              updateStakeholder(idx, {
                                name: currentUser?.fullName || "",
                                designation:
                                  currentUser?.designation ||
                                  (currentUser?.role
                                    ? ROLE_TITLES[currentUser.role]
                                    : sh.role),
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-bold text-[10px] transition"
                          >
                            <UserCheck className="w-3 h-3 text-brand-600" />
                            <span>Use My Details</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate("/project/mir")}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition"
          >
            Cancel
          </button>
          {(!existingMir || existingMir.status === "DRAFT") && (
            <button
              type="button"
              disabled={submitting || !canCreateMIR}
              onClick={(e) => handleSubmit(e, true)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save as Draft</span>
            </button>
          )}
          <button
            type="submit"
            disabled={submitting || !canCreateMIR}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-xl shadow-brand-500/20 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>
              {submitting
                ? "Saving..."
                : isEditMode && existingMir?.status !== "DRAFT"
                  ? "Update Material Inspection Report"
                  : "Issue Material Inspection Report"}
            </span>
          </button>
        </div>
      </form>

      {/* Add Custom Stakeholder Role Modal */}
      {showAddRoleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                <span>Add Statutory Sign-Off Role</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddRoleModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select from standard industry roles or type a custom role name:
            </p>

            <div className="flex flex-wrap gap-1.5">
              {[
                "Client Representative",
                "Supervising Consultant / RE",
                "Chief Resident Engineer",
                "Third-Party Testing Agency",
                "Safety Officer (HSE)",
                "Commercial / Procurement Manager",
                "Subcontractor Quality Manager",
              ].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleAddStakeholder(role)}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  + {role}
                </button>
              ))}
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Or Type Custom Role Name:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customRoleInput}
                  onChange={(e) => setCustomRoleInput(e.target.value)}
                  placeholder="e.g. Lead MEP Engineer"
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddStakeholder(customRoleInput);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAddStakeholder(customRoleInput)}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MIRCreate;
