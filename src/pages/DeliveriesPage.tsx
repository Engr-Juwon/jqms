import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { dbService, sortByNewestFirst } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { MaterialDelivery, NonConformanceReport } from "@/types";
import { TradeSubtradeSelect } from "@/components/masterdata/TradeSubtradeSelect";
import { toast } from "react-hot-toast";
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  X,
  Edit2,
  Trash2,
  Copy,
  Download,
  FileCheck,
  Filter,
  Building,
  Calendar,
  Layers,
  FileText,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { ModuleTabNav } from "@/components/common/ModuleTabNav";

interface DeliveryItemInput {
  tempId: string;
  materialName: string;
  quantityVal: string;
  unitVal: string;
  quantityAcceptedVal: string;
  quantityRejectedVal: string;
  batchNumber: string;
  status: string;
  rejectionReason: string;
  qaqcRemarks: string;
  createNCR?: boolean;
}

export const DeliveriesPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";
  const currentProjId = projectId || activeProject?.id || "";

  const [deliveries, setDeliveries] = useState<MaterialDelivery[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<MaterialDelivery | null>(null);

  // Consignment / Header fields
  const [supplier, setSupplier] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState("");
  const [truckNumber, setTruckNumber] = useState("");
  const [trade, setTrade] = useState("");
  const [tradeId, setTradeId] = useState("");
  const [subtrade, setSubtrade] = useState("");

  // Multi-item rows for creation or single row for editing
  const [items, setItems] = useState<DeliveryItemInput[]>([
    {
      tempId: "item-1",
      materialName: "",
      quantityVal: "",
      unitVal: "units",
      quantityAcceptedVal: "",
      quantityRejectedVal: "0",
      batchNumber: "",
      status: "APPROVED",
      rejectionReason: "",
      qaqcRemarks: "",
      createNCR: false,
    },
  ]);

  const loadData = async () => {
    try {
      const list = await dbService.getDeliveries(currentProjId, currentCompId);
      setDeliveries(sortByNewestFirst(list));
    } catch (err) {
      console.error("Failed to load deliveries:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentProjId, currentCompId]);

  // Open modal in Create Mode (supports multi-item batch insert)
  const handleOpenCreate = () => {
    setEditingDelivery(null);
    setSupplier("");
    setDeliveryDate(new Date().toISOString().split("T")[0]);
    setDeliveryNoteNumber("");
    setTruckNumber("");
    setTrade("");
    setTradeId("");
    setSubtrade("");
    setItems([
      {
        tempId: `item-${Date.now()}-1`,
        materialName: "",
        quantityVal: "",
        unitVal: "units",
        quantityAcceptedVal: "",
        quantityRejectedVal: "0",
        batchNumber: "",
        status: "APPROVED",
        rejectionReason: "",
        qaqcRemarks: "",
        createNCR: false,
      },
    ]);
    setShowModal(true);
  };

  // Open modal in Edit Mode
  const handleOpenEdit = (del: MaterialDelivery) => {
    setEditingDelivery(del);
    setSupplier(del.supplier || del.supplierName || "");
    setDeliveryDate(
      del.deliveryDate ||
        (del.createdAt ? new Date(del.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0])
    );
    setDeliveryNoteNumber(del.deliveryNoteNumber || del.deliveryNote || "");
    setTruckNumber(del.vehicleTruckNumber || del.truckNumber || "");
    setTrade(del.trade || "");
    setTradeId(del.tradeId || "");
    setSubtrade(del.subtrade || "");

    // Extract quantity and unit
    let rawQty = "";
    let rawUnit = del.unit || "units";
    if (del.quantity) {
      const parts = String(del.quantity).trim().split(" ");
      if (parts.length > 1 && !isNaN(Number(parts[0]))) {
        rawQty = parts[0];
        rawUnit = parts.slice(1).join(" ");
      } else {
        rawQty = String(del.quantity);
      }
    } else if (del.quantityReceived !== undefined) {
      rawQty = String(del.quantityReceived);
    }

    const acceptedQty =
      del.quantityAccepted !== undefined
        ? String(del.quantityAccepted)
        : del.status === "REJECTED" || del.qaqcStatus === "REJECTED"
        ? "0"
        : rawQty;

    const rejectedQty =
      del.quantityRejected !== undefined
        ? String(del.quantityRejected)
        : del.status === "REJECTED" || del.qaqcStatus === "REJECTED"
        ? rawQty
        : "0";

    setItems([
      {
        tempId: del.id,
        materialName: del.materialName || del.materialDescription || "",
        quantityVal: rawQty,
        unitVal: rawUnit,
        quantityAcceptedVal: acceptedQty,
        quantityRejectedVal: rejectedQty,
        batchNumber: del.batchNumber || "",
        status: del.status || del.qaqcStatus || "APPROVED",
        rejectionReason: del.rejectionReason || "",
        qaqcRemarks: del.qaqcRemarks || del.inspectionNotes || "",
        createNCR: false,
      },
    ]);
    setShowModal(true);
  };

  // Add another material item row to batch
  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        tempId: `item-${Date.now()}-${prev.length + 1}`,
        materialName: "",
        quantityVal: "",
        unitVal: prev[prev.length - 1]?.unitVal || "units",
        quantityAcceptedVal: "",
        quantityRejectedVal: "0",
        batchNumber: "",
        status: "APPROVED",
        rejectionReason: "",
        qaqcRemarks: "",
        createNCR: false,
      },
    ]);
  };

  // Duplicate an item row for rapid logging
  const handleDuplicateItemRow = (idx: number) => {
    const target = items[idx];
    if (!target) return;
    const duplicated: DeliveryItemInput = {
      ...target,
      tempId: `item-${Date.now()}-${items.length + 1}`,
    };
    setItems((prev) => [...prev.slice(0, idx + 1), duplicated, ...prev.slice(idx + 1)]);
    toast.success("Item row duplicated");
  };

  // Remove an item row
  const handleRemoveItemRow = (idx: number) => {
    if (items.length <= 1) {
      toast.error("At least one material item is required");
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Handle Total Quantity Change
  const handleQuantityChange = (idx: number, newTotal: string) => {
    setItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[idx], quantityVal: newTotal };
      const totalNum = Number(newTotal) || 0;
      const rejNum = Number(item.quantityRejectedVal) || 0;

      if (rejNum === 0) {
        item.quantityAcceptedVal = newTotal;
      } else {
        item.quantityAcceptedVal = String(Math.max(0, totalNum - rejNum));
      }
      copy[idx] = item;
      return copy;
    });
  };

  // Handle Rejected Quantity Change with Auto Status Recalculation
  const handleRejectedQuantityChange = (idx: number, newRejected: string) => {
    setItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[idx], quantityRejectedVal: newRejected };
      const totalNum = Number(item.quantityVal) || 0;
      const rejNum = Number(newRejected) || 0;

      if (rejNum <= 0) {
        item.quantityRejectedVal = "0";
        item.quantityAcceptedVal = item.quantityVal;
        if (item.status === "PARTIALLY_ACCEPTED" || item.status === "PARTIALLY ACCEPTED" || item.status === "REJECTED") {
          item.status = "APPROVED";
        }
      } else if (rejNum >= totalNum && totalNum > 0) {
        item.quantityAcceptedVal = "0";
        item.status = "REJECTED";
      } else {
        item.quantityAcceptedVal = String(Math.max(0, totalNum - rejNum));
        item.status = "PARTIALLY ACCEPTED";
      }

      copy[idx] = item;
      return copy;
    });
  };

  // Handle Accepted Quantity Change
  const handleAcceptedQuantityChange = (idx: number, newAccepted: string) => {
    setItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[idx], quantityAcceptedVal: newAccepted };
      const totalNum = Number(item.quantityVal) || 0;
      const accNum = Number(newAccepted) || 0;

      if (totalNum > 0) {
        const rej = Math.max(0, totalNum - accNum);
        item.quantityRejectedVal = String(rej);
        if (rej > 0 && accNum > 0) {
          item.status = "PARTIALLY ACCEPTED";
        } else if (accNum === 0 && rej > 0) {
          item.status = "REJECTED";
        } else if (rej === 0) {
          item.status = "APPROVED";
        }
      }
      copy[idx] = item;
      return copy;
    });
  };

  // Handle Status Selection Change
  const handleStatusChange = (idx: number, newStatus: string) => {
    setItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[idx], status: newStatus };
      const totalNum = Number(item.quantityVal) || 0;

      if (newStatus === "REJECTED") {
        item.quantityRejectedVal = item.quantityVal || "0";
        item.quantityAcceptedVal = "0";
      } else if (newStatus === "APPROVED" || newStatus === "APPROVED AS NOTED") {
        item.quantityAcceptedVal = item.quantityVal || "0";
        item.quantityRejectedVal = "0";
      }
      copy[idx] = item;
      return copy;
    });
  };

  // Update generic item field
  const handleUpdateItemField = (
    idx: number,
    field: keyof DeliveryItemInput,
    value: any
  ) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  // Delete Delivery
  const handleDeleteDelivery = async (delId: string, matName: string) => {
    if (!window.confirm(`Are you sure you want to delete delivery record for "${matName}"?`)) {
      return;
    }
    try {
      await dbService.deleteDelivery(delId, currentProjId);
      if (currentUser) {
        await writeAudit({
          projectId: currentProjId,
          companyId: currentCompId,
          userId: currentUser.uid,
          userName: currentUser.fullName,
          userRole: currentUser.role,
          action: "DELETE_DELIVERY",
          module: "Deliveries",
          details: `Deleted delivery record: ${matName} (${delId})`,
        });
      }
      toast.success("Delivery record deleted successfully");
      loadData();
    } catch (err) {
      console.error("Failed to delete delivery:", err);
      toast.error("Failed to delete delivery record");
    }
  };

  // Submit Handler: Save edited item OR Save multiple batch items
  const handleSubmitDelivery = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplier.trim()) {
      toast.error("Please enter a supplier name");
      return;
    }

    const invalidItem = items.find((it) => !it.materialName.trim());
    if (invalidItem) {
      toast.error("Please fill in the material name for all items");
      return;
    }

    const now = Date.now();
    const isEdit = !!editingDelivery;

    try {
      if (isEdit && editingDelivery) {
        // Single Edit Mode
        const item = items[0];
        const formattedQty = item.quantityVal
          ? `${item.quantityVal} ${item.unitVal}`.trim()
          : item.unitVal || "";

        const totalNum = Number(item.quantityVal) || 0;
        const acceptedNum = item.quantityAcceptedVal !== "" ? Number(item.quantityAcceptedVal) : totalNum;
        const rejectedNum = Number(item.quantityRejectedVal) || 0;

        let ncrNumber = editingDelivery.ncrNumber;
        let ncrId = editingDelivery.ncrId;

        // Auto-raise NCR if requested and rejected quantity > 0
        if (item.createNCR && rejectedNum > 0 && !ncrId) {
          ncrNumber = `NCR-DEL-${Date.now().toString().slice(-6)}`;
          ncrId = `ncr-${Date.now()}`;
          const ncrObj: NonConformanceReport = {
            id: ncrId,
            ncrNumber,
            projectId: currentProjId,
            companyId: currentCompId,
            title: `Material Delivery Rejection: ${item.materialName}`,
            description: `Rejected ${rejectedNum} ${item.unitVal} (out of ${totalNum} delivered) from ${supplier}. Reason: ${item.rejectionReason || item.qaqcRemarks || "Non-conforming gate delivery"}`,
            rootCause: "Substandard/damaged delivery from vendor",
            rootCauseType: "Material Defect",
            correctiveAction: `Quarantine ${rejectedNum} ${item.unitVal} and request immediate vendor replacement / credit note.`,
            correctiveActions: [],
            preventiveAction: "Enforce pre-dispatch inspection certificate from manufacturer.",
            severity: rejectedNum === totalNum ? "CRITICAL" : "HIGH",
            status: "OPEN",
            trade: trade || "Materials QA/QC",
            tradeId: tradeId || undefined,
            location: `Site Receiving Gate`,
            remedialDisposition: "REJECT",
            dispositionType: "REJECT",
            photos: [],
            raisedBy: {
              uid: currentUser?.uid || "qaqc-user",
              name: currentUser?.fullName || "QA/QC Inspector",
              role: currentUser?.role || "QA/QC Engineer",
              date: new Date().toISOString(),
            },
            createdAt: now,
            updatedAt: now,
          };
          await dbService.saveNCR(ncrObj);
          toast.success(`Generated Non-Conformance Report #${ncrNumber}`);
        }

        const updated: MaterialDelivery = {
          ...editingDelivery,
          companyId: currentCompId,
          projectId: currentProjId,
          supplier: supplier.trim(),
          supplierName: supplier.trim(),
          deliveryDate,
          deliveryNoteNumber: deliveryNoteNumber.trim() || undefined,
          deliveryNote: deliveryNoteNumber.trim() || undefined,
          vehicleTruckNumber: truckNumber.trim() || undefined,
          truckNumber: truckNumber.trim() || undefined,
          trade: trade || undefined,
          tradeId: tradeId || undefined,
          subtrade: subtrade || undefined,
          materialName: item.materialName.trim(),
          materialDescription: item.materialName.trim(),
          quantity: formattedQty,
          quantityReceived: totalNum || undefined,
          quantityAccepted: acceptedNum,
          quantityRejected: rejectedNum,
          unit: item.unitVal.trim() || "units",
          batchNumber: item.batchNumber.trim() || undefined,
          status: item.status,
          qaqcStatus: item.status,
          rejectionReason: rejectedNum > 0 ? item.rejectionReason.trim() || undefined : undefined,
          ncrNumber,
          ncrId,
          qaqcRemarks: item.qaqcRemarks.trim() || undefined,
          inspectionNotes: item.qaqcRemarks.trim() || undefined,
          updatedAt: now,
        };

        await dbService.saveDelivery(updated);

        if (currentUser) {
          await writeAudit({
            projectId: currentProjId,
            companyId: currentCompId,
            userId: currentUser.uid,
            userName: currentUser.fullName,
            userRole: currentUser.role,
            action: "EDIT_DELIVERY",
            module: "Deliveries",
            details: `Updated delivery: ${item.materialName} [${item.status} - Accepted: ${acceptedNum}, Rejected: ${rejectedNum}]`,
            newValue: updated,
            previousValue: editingDelivery,
          });
        }

        toast.success("Delivery record updated successfully!");
      } else {
        // Multi-Item Create Mode
        const deliveriesToSave: MaterialDelivery[] = [];

        for (let idx = 0; idx < items.length; idx++) {
          const item = items[idx];
          const formattedQty = item.quantityVal
            ? `${item.quantityVal} ${item.unitVal}`.trim()
            : item.unitVal || "";
          const delId = `del-${now}-${idx + 1}-${Math.random().toString(36).substring(2, 5)}`;
          const totalNum = Number(item.quantityVal) || 0;
          const acceptedNum = item.quantityAcceptedVal !== "" ? Number(item.quantityAcceptedVal) : totalNum;
          const rejectedNum = Number(item.quantityRejectedVal) || 0;

          let ncrNumber: string | undefined = undefined;
          let ncrId: string | undefined = undefined;

          // Auto-raise NCR if requested and rejected quantity > 0
          if (item.createNCR && rejectedNum > 0) {
            ncrNumber = `NCR-DEL-${Date.now().toString().slice(-6)}`;
            ncrId = `ncr-${Date.now()}-${idx}`;
            const ncrObj: NonConformanceReport = {
              id: ncrId,
              ncrNumber,
              projectId: currentProjId,
              companyId: currentCompId,
              title: `Material Delivery Rejection: ${item.materialName}`,
              description: `Rejected ${rejectedNum} ${item.unitVal} (out of ${totalNum} delivered) from ${supplier}. Reason: ${item.rejectionReason || item.qaqcRemarks || "Non-conforming gate delivery"}`,
              rootCause: "Substandard/damaged delivery from vendor",
              rootCauseType: "Material Defect",
              correctiveAction: `Quarantine ${rejectedNum} ${item.unitVal} and request immediate vendor replacement / credit note.`,
              correctiveActions: [],
              preventiveAction: "Enforce pre-dispatch inspection certificate from manufacturer.",
              severity: rejectedNum === totalNum ? "CRITICAL" : "HIGH",
              status: "OPEN",
              trade: trade || "Materials QA/QC",
              tradeId: tradeId || undefined,
              location: `Site Receiving Gate`,
              remedialDisposition: "REJECT",
              dispositionType: "REJECT",
              photos: [],
              raisedBy: {
                uid: currentUser?.uid || "qaqc-user",
                name: currentUser?.fullName || "QA/QC Inspector",
                role: currentUser?.role || "QA/QC Engineer",
                date: new Date().toISOString(),
              },
              createdAt: now + idx,
              updatedAt: now + idx,
            };
            await dbService.saveNCR(ncrObj);
          }

          deliveriesToSave.push({
            id: delId,
            companyId: currentCompId,
            projectId: currentProjId,
            supplier: supplier.trim(),
            supplierName: supplier.trim(),
            deliveryDate,
            deliveryNoteNumber: deliveryNoteNumber.trim() || undefined,
            deliveryNote: deliveryNoteNumber.trim() || undefined,
            vehicleTruckNumber: truckNumber.trim() || undefined,
            truckNumber: truckNumber.trim() || undefined,
            trade: trade || undefined,
            tradeId: tradeId || undefined,
            subtrade: subtrade || undefined,
            materialName: item.materialName.trim(),
            materialDescription: item.materialName.trim(),
            quantity: formattedQty,
            quantityReceived: totalNum || undefined,
            quantityAccepted: acceptedNum,
            quantityRejected: rejectedNum,
            unit: item.unitVal.trim() || "units",
            batchNumber: item.batchNumber.trim() || undefined,
            status: item.status,
            qaqcStatus: item.status,
            rejectionReason: rejectedNum > 0 ? item.rejectionReason.trim() || undefined : undefined,
            ncrNumber,
            ncrId,
            qaqcRemarks: item.qaqcRemarks.trim() || undefined,
            inspectionNotes: item.qaqcRemarks.trim() || undefined,
            createdBy: currentUser?.uid || "QA/QC Lead",
            inspectorName: currentUser?.fullName || "QA/QC Inspector",
            createdAt: now + idx,
            updatedAt: now + idx,
          });
        }

        await Promise.all(deliveriesToSave.map((d) => dbService.saveDelivery(d)));

        if (currentUser) {
          await writeAudit({
            projectId: currentProjId,
            companyId: currentCompId,
            userId: currentUser.uid,
            userName: currentUser.fullName,
            userRole: currentUser.role,
            action: "LOG_DELIVERY",
            module: "Deliveries",
            details: `Logged ${deliveriesToSave.length} delivery item(s) from ${supplier}`,
            newValue: deliveriesToSave,
          });
        }

        toast.success(
          deliveriesToSave.length === 1
            ? "Material delivery logged successfully!"
            : `Successfully logged ${deliveriesToSave.length} delivery items!`
        );
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      console.error("Save delivery error:", err);
      toast.error(`Error saving delivery: ${err?.message || "Unknown error"}`);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (deliveries.length === 0) {
      toast.error("No delivery records to export");
      return;
    }
    const headers = [
      "ID",
      "Delivery Date",
      "Material Name",
      "Supplier",
      "Total Quantity Received",
      "Quantity Accepted",
      "Quantity Rejected",
      "Unit",
      "Batch / Heat #",
      "Delivery Note #",
      "Truck #",
      "Trade",
      "QA/QC Status",
      "Rejection Reason",
      "Linked NCR #",
      "QA/QC Remarks",
    ];

    const rows = filtered.map((d: any) => [
      `"${d.id || ""}"`,
      `"${d.deliveryDate || ""}"`,
      `"${(d.materialName || d.materialDescription || "").replace(/"/g, '""')}"`,
      `"${(d.supplier || d.supplierName || "").replace(/"/g, '""')}"`,
      `"${d.quantityReceived || d.quantity || ""}"`,
      `"${d.quantityAccepted !== undefined ? d.quantityAccepted : ""}"`,
      `"${d.quantityRejected !== undefined ? d.quantityRejected : ""}"`,
      `"${d.unit || ""}"`,
      `"${d.batchNumber || ""}"`,
      `"${d.deliveryNoteNumber || d.deliveryNote || ""}"`,
      `"${d.vehicleTruckNumber || d.truckNumber || ""}"`,
      `"${d.trade || ""}"`,
      `"${d.status || d.qaqcStatus || ""}"`,
      `"${(d.rejectionReason || "").replace(/"/g, '""')}"`,
      `"${d.ncrNumber || ""}"`,
      `"${(d.qaqcRemarks || d.inspectionNotes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `material_deliveries_${currentProjId}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Delivery register exported to CSV");
  };

  // Filtering
  const filtered = sortByNewestFirst(
    deliveries.filter((d: any) => {
      const mat = d.materialName || d.materialDescription || "";
      const supp = d.supplier || d.supplierName || "";
      const id = d.id || "";
      const batch = d.batchNumber || "";
      const note = d.deliveryNoteNumber || d.deliveryNote || "";
      const tr = d.trade || "";
      const st = (d.status || d.qaqcStatus || "").toUpperCase();

      const matchSearch =
        id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mat.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supp.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tr.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (statusFilter === "ALL") return true;
      if (statusFilter === "APPROVED") {
        return st === "APPROVED" || st === "ACCEPTED";
      }
      if (statusFilter === "APPROVED AS NOTED") {
        return st === "APPROVED AS NOTED" || st === "APPROVED_AS_NOTED";
      }
      if (statusFilter === "PARTIALLY ACCEPTED") {
        return st === "PARTIALLY ACCEPTED" || st === "PARTIALLY_ACCEPTED" || ((d.quantityRejected || 0) > 0 && (d.quantityAccepted || 0) > 0);
      }
      if (statusFilter === "PENDING") {
        return st === "PENDING" || st === "UNDER_REVIEW";
      }
      if (statusFilter === "REJECTED") {
        return st === "REJECTED";
      }
      if (statusFilter === "CONDITIONAL") {
        return st === "CONDITIONAL";
      }
      return true;
    })
  );

  // Status breakdown metrics
  const totalCount = deliveries.length;
  const approvedCount = deliveries.filter(
    (d: any) => (d.status === "APPROVED" || d.qaqcStatus === "ACCEPTED") && (!d.quantityRejected || d.quantityRejected === 0)
  ).length;
  const approvedAsNotedCount = deliveries.filter(
    (d: any) => d.status === "APPROVED AS NOTED" || d.status === "APPROVED_AS_NOTED"
  ).length;
  const partiallyAcceptedCount = deliveries.filter(
    (d: any) => d.status === "PARTIALLY ACCEPTED" || d.status === "PARTIALLY_ACCEPTED" || ((d.quantityRejected || 0) > 0 && (d.quantityAccepted || 0) > 0)
  ).length;
  const pendingCount = deliveries.filter(
    (d: any) => (!d.status || d.status === "PENDING" || d.qaqcStatus === "UNDER_REVIEW")
  ).length;
  const rejectedCount = deliveries.filter(
    (d: any) => d.status === "REJECTED" || d.qaqcStatus === "REJECTED" || (d.quantityAccepted === 0 && (d.quantityRejected || 0) > 0)
  ).length;

  const totalRejectedUnitsCount = deliveries.reduce((acc, d: any) => acc + (Number(d.quantityRejected) || 0), 0);

  const renderStatusBadge = (del: any) => {
    const s = (del.status || del.qaqcStatus || "PENDING").toUpperCase();
    const rej = Number(del.quantityRejected) || 0;
    const acc = Number(del.quantityAccepted) || 0;

    if (s === "PARTIALLY ACCEPTED" || s === "PARTIALLY_ACCEPTED" || (rej > 0 && acc > 0)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          <span>Partially Accepted</span>
        </span>
      );
    }
    if (s === "APPROVED" || s === "ACCEPTED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" />
          <span>Approved</span>
        </span>
      );
    }
    if (s === "APPROVED AS NOTED" || s === "APPROVED_AS_NOTED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30">
          <FileCheck className="w-3 h-3" />
          <span>Approved as Noted</span>
        </span>
      );
    }
    if (s === "REJECTED" || (acc === 0 && rej > 0)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
          <XCircle className="w-3 h-3" />
          <span>Rejected</span>
        </span>
      );
    }
    if (s === "CONDITIONAL") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
          <AlertTriangle className="w-3 h-3" />
          <span>Conditional</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        <Clock className="w-3 h-3 text-slate-400" />
        <span>Pending Inspection</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-xs uppercase tracking-wider mb-1 font-bold">
            <Truck className="w-4 h-4" />
            <span>Site Gate Inward Receiving QA/QC</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Raw Material Deliveries Log
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Receiving inspection, accepted vs. rejected quantities, multi-item batch verification, and QA/QC gate acceptance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-sm"
            title="Export to CSV"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Log Inward Delivery</span>
          </button>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <ModuleTabNav
        items={[
          {
            label: "Material Deliveries Log",
            path: "/project/deliveries",
            icon: Truck,
          },
          {
            label: "Material Inspection Reports (MIR)",
            path: "/project/mir",
            icon: ShieldCheck,
          },
        ]}
      />

      {/* KPI Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div
          onClick={() => setStatusFilter("ALL")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === "ALL"
              ? "bg-brand-50 dark:bg-brand-950/40 border-brand-500 shadow-sm"
              : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
            <span>Total Logged</span>
            <Truck className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {totalCount}
          </p>
        </div>

        <div
          onClick={() => setStatusFilter("APPROVED")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === "APPROVED"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-sm"
              : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
            <span>Fully Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {approvedCount}
          </p>
        </div>

        <div
          onClick={() => setStatusFilter("APPROVED AS NOTED")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === "APPROVED AS NOTED"
              ? "bg-sky-50 dark:bg-sky-950/40 border-sky-500 shadow-sm"
              : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-sky-600 dark:text-sky-400 font-semibold mb-1">
            <span>Approved as Noted</span>
            <FileCheck className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400">
            {approvedAsNotedCount}
          </p>
        </div>

        <div
          onClick={() => setStatusFilter("PARTIALLY ACCEPTED")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === "PARTIALLY ACCEPTED"
              ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-sm"
              : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-semibold mb-1">
            <span>Partial Rejections</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
            {partiallyAcceptedCount}
          </p>
        </div>

        <div
          onClick={() => setStatusFilter("REJECTED")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === "REJECTED"
              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-sm"
              : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 font-semibold mb-1">
            <span>Fully Rejected</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
            {rejectedCount}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-rose-300 font-semibold mb-1">
            <span>Rejected Units</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-400">
            {totalRejectedUnitsCount}
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search material, supplier, batch #, delivery note #, trade..."
            className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {[
            { id: "ALL", label: "All" },
            { id: "APPROVED", label: "Approved" },
            { id: "APPROVED AS NOTED", label: "Approved as Noted" },
            { id: "PARTIALLY ACCEPTED", label: "Partially Accepted" },
            { id: "PENDING", label: "Pending" },
            { id: "REJECTED", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition ${
                statusFilter === tab.id
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Truck className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">
              No Material Deliveries Found
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              {searchTerm || statusFilter !== "ALL"
                ? "Try clearing your search query or status filter."
                : "Log inbound raw materials at the site security and QA/QC receiving gate."}
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-4 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Log Inward Delivery</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Material Name & Specification</th>
                  <th className="py-3.5 px-4">Supplier</th>
                  <th className="py-3.5 px-4">Quantity Breakdown (Delivered / Accepted / Rejected)</th>
                  <th className="py-3.5 px-4">Batch / Heat #</th>
                  <th className="py-3.5 px-4">Delivery Note / Truck</th>
                  <th className="py-3.5 px-4">Trade</th>
                  <th className="py-3.5 px-4">QA/QC Status</th>
                  <th className="py-3.5 px-4">Remarks & Defect Notes</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.map((del: any) => {
                  const rejQty = Number(del.quantityRejected) || 0;
                  const accQty =
                    del.quantityAccepted !== undefined
                      ? Number(del.quantityAccepted)
                      : del.status === "REJECTED"
                      ? 0
                      : Number(del.quantityReceived) || 0;
                  const totalQty = del.quantity || `${del.quantityReceived ?? ""} ${del.unit ?? ""}`;

                  return (
                    <tr
                      key={del.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group"
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {del.deliveryDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white max-w-xs">
                          {del.materialName || del.materialDescription}
                        </div>
                        {del.id && (
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            ID: {del.id}
                          </div>
                        )}
                        {del.ncrNumber && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              <ShieldAlert className="w-3 h-3" />
                              <span>Linked NCR: {del.ncrNumber}</span>
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-medium">
                        {del.supplier || del.supplierName || "—"}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                          {totalQty}
                        </div>
                        {/* Breakdown pills */}
                        <div className="flex items-center gap-1.5 mt-1">
                          {accQty > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                              ✓ {accQty} {del.unit || ""} Accepted
                            </span>
                          )}
                          {rejQty > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
                              ✗ {rejQty} {del.unit || ""} Rejected
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {del.batchNumber || "—"}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                        <div>{del.deliveryNoteNumber || del.deliveryNote || "—"}</div>
                        {(del.vehicleTruckNumber || del.truckNumber) && (
                          <div className="text-[10px] text-slate-400">
                            {del.vehicleTruckNumber || del.truckNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {del.trade ? (
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium text-[11px]">
                            {del.trade}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderStatusBadge(del)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 max-w-xs">
                        {del.rejectionReason && (
                          <div className="text-rose-600 dark:text-rose-400 font-semibold text-[11px] mb-0.5">
                            Rejection: {del.rejectionReason}
                          </div>
                        )}
                        <div className="italic text-slate-500 dark:text-slate-400 truncate">
                          {del.qaqcRemarks || del.inspectionNotes || (!del.rejectionReason ? "—" : "")}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(del)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/50 transition"
                            title="Edit Delivery"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteDelivery(
                                del.id,
                                del.materialName || del.materialDescription || "Delivery"
                              )
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                            title="Delete Delivery"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Delivery Modal (Multi-Item Batch & Accepted/Rejected Quantities) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-3xl my-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-5 sm:p-7 space-y-5 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <span>
                    {editingDelivery
                      ? "Edit Material Delivery Log"
                      : "Log Inward Material Delivery (Multi-Item Consignment)"}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Record total delivered, accepted, and rejected quantities with defect details
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleSubmitDelivery} className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
              {/* Consignment / Waybill Header Information */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-brand-500" />
                  <span>Consignment & Receiving Header</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Supplier / Manufacturer *
                    </label>
                    <input
                      type="text"
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      placeholder="e.g. Dangote Cement, Apex Steel Mills"
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Delivery Date *
                    </label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-medium focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Delivery Note / Waybill #
                    </label>
                    <input
                      type="text"
                      value={deliveryNoteNumber}
                      onChange={(e) => setDeliveryNoteNumber(e.target.value)}
                      placeholder="e.g. DN-2026-9814"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Truck / Vehicle License Plate
                    </label>
                    <input
                      type="text"
                      value={truckNumber}
                      onChange={(e) => setTruckNumber(e.target.value)}
                      placeholder="e.g. KCA 124B / Tipper #4"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                {/* Trade & Subtrade Selection */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Applicable Trade & Subtrade
                  </label>
                  <TradeSubtradeSelect
                    companyId={currentCompId}
                    selectedTradeId={tradeId}
                    selectedTradeName={trade}
                    selectedSubtrade={subtrade}
                    onTradeChange={(tId, tName) => {
                      setTradeId(tId);
                      setTrade(tName);
                    }}
                    onSubtradeChange={(stName) => setSubtrade(stName)}
                  />
                </div>
              </div>

              {/* Material Items List (Dynamic Rows) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-brand-500" />
                    <span>
                      Material Items ({items.length} {items.length === 1 ? "Item" : "Items"})
                    </span>
                  </div>

                  {!editingDelivery && (
                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 font-bold hover:bg-brand-100 dark:hover:bg-brand-900/50 transition text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Another Material</span>
                    </button>
                  )}
                </div>

                {items.map((item, idx) => {
                  const hasRejections = Number(item.quantityRejectedVal) > 0;

                  return (
                    <div
                      key={item.tempId || idx}
                      className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition shadow-sm space-y-3 relative group ${
                        hasRejections
                          ? "border-rose-200 dark:border-rose-900/60 ring-1 ring-rose-500/20"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="font-mono font-bold text-brand-600 dark:text-brand-400 flex items-center gap-2">
                          <span>Item #{idx + 1}</span>
                          {hasRejections && (
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                              {item.quantityRejectedVal} {item.unitVal} Rejected
                            </span>
                          )}
                        </span>
                        {!editingDelivery && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicateItemRow(idx)}
                              className="p-1 rounded text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Duplicate this item row"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItemRow(idx)}
                                className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                title="Remove item row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                          Material Name / Specification *
                        </label>
                        <input
                          type="text"
                          value={item.materialName}
                          onChange={(e) => handleUpdateItemField(idx, "materialName", e.target.value)}
                          placeholder="e.g. 16mm High Yield Deformed TMT Rebar (Grade 500)"
                          required
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:border-brand-500 focus:outline-none"
                        />
                      </div>

                      {/* Quantity Breakdown Grid: Total Received, Accepted, Rejected, Unit */}
                      <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/70 space-y-2.5">
                        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Quantity Acceptance & Rejection Breakdown
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div>
                            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                              Total Delivered *
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.quantityVal}
                              onChange={(e) => handleQuantityChange(idx, e.target.value)}
                              placeholder="e.g. 500"
                              required
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold focus:border-brand-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-emerald-700 dark:text-emerald-400 font-bold mb-1">
                              Accepted Qty
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.quantityAcceptedVal}
                              onChange={(e) => handleAcceptedQuantityChange(idx, e.target.value)}
                              placeholder="e.g. 450"
                              className="w-full px-3 py-2 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-rose-700 dark:text-rose-400 font-bold mb-1">
                              Rejected Qty
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.quantityRejectedVal}
                              onChange={(e) => handleRejectedQuantityChange(idx, e.target.value)}
                              placeholder="e.g. 50"
                              className="w-full px-3 py-2 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 text-rose-900 dark:text-rose-200 font-mono font-bold focus:border-rose-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                              Unit of Measure
                            </label>
                            <input
                              type="text"
                              value={item.unitVal}
                              onChange={(e) => handleUpdateItemField(idx, "unitVal", e.target.value)}
                              placeholder="bags, tons, pcs, m3"
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                            QA/QC Status *
                          </label>
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(idx, e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:border-brand-500 focus:outline-none"
                          >
                            <option value="APPROVED">APPROVED (100% Conforming)</option>
                            <option value="APPROVED AS NOTED">APPROVED AS NOTED (Minor observations)</option>
                            <option value="PARTIALLY ACCEPTED">PARTIALLY ACCEPTED (Some accepted, some rejected)</option>
                            <option value="PENDING">PENDING (Under Inspection / Testing)</option>
                            <option value="REJECTED">REJECTED (100% Non-conforming)</option>
                            <option value="CONDITIONAL">CONDITIONAL (Segregated for verification)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                            Batch / Heat / Cast #
                          </label>
                          <input
                            type="text"
                            value={item.batchNumber}
                            onChange={(e) => handleUpdateItemField(idx, "batchNumber", e.target.value)}
                            placeholder="e.g. HEAT-9842"
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                          />
                        </div>
                      </div>

                      {/* Rejection Details Field (shown if rejected > 0) */}
                      {hasRejections && (
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2.5 animate-in fade-in">
                          <div>
                            <label className="block text-rose-800 dark:text-rose-300 font-bold mb-1 flex items-center gap-1.5">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>Reason for Rejection / Non-Conformance Details *</span>
                            </label>
                            <input
                              type="text"
                              value={item.rejectionReason}
                              onChange={(e) => handleUpdateItemField(idx, "rejectionReason", e.target.value)}
                              placeholder="e.g. 50 bags caked by rain during transit; crushed pallets; out-of-spec diameter"
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
                            />
                          </div>

                          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-semibold select-none">
                            <input
                              type="checkbox"
                              checked={!!item.createNCR}
                              onChange={(e) => handleUpdateItemField(idx, "createNCR", e.target.checked)}
                              className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                            />
                            <span>Automatically generate and link a Non-Conformance Report (NCR)</span>
                          </label>
                        </div>
                      )}

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          General QA/QC Remarks
                        </label>
                        <input
                          type="text"
                          value={item.qaqcRemarks}
                          onChange={(e) => handleUpdateItemField(idx, "qaqcRemarks", e.target.value)}
                          placeholder="e.g. Visual check OK, mill test certificate verified"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                {!editingDelivery && (
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-500"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Another Material</span>
                  </button>
                )}
                {editingDelivery && <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-lg shadow-brand-500/20 transition flex items-center gap-2"
                  >
                    <Truck className="w-4 h-4" />
                    <span>
                      {editingDelivery
                        ? "Save Changes"
                        : items.length > 1
                        ? `Save All ${items.length} Items`
                        : "Save Delivery"}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};