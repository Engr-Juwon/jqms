import { dbService } from "@/lib/db";
import {
  PlannerEvent,
  NonConformanceReport,
  InspectionRequest,
  PermitToPour,
  ConcreteCubeSample,
  RequestForInformation,
  MaterialApprovalRequest,
} from "@/types";

export const plannerSync = {
  async syncEvent(event: Partial<PlannerEvent> & { relatedId?: string; relatedModule?: string }): Promise<void> {
    try {
      const planEvent: PlannerEvent = {
        id: event.id || `plan-${event.relatedModule || "event"}-${event.relatedId || Date.now()}`,
        title: event.title || "Scheduled Quality Event",
        description: event.description || "",
        eventType: (event.eventType as any) || "INSPECTION",
        date: event.startDate || event.date || new Date().toISOString().split("T")[0],
        startDate: event.startDate || event.date || new Date().toISOString().split("T")[0],
        endDate: event.endDate || event.startDate || new Date().toISOString().split("T")[0],
        startTime: event.startTime || "09:00",
        endTime: event.endTime || "17:00",
        location: event.location || "Site",
        levelId: event.levelId,
        elementId: event.elementId,
        tradeId: event.tradeId,
        tradeName: event.tradeName,
        subtradeName: event.subtradeName,
        priority: (event.priority as any) || "MEDIUM",
        status: (event.status as any) === "APPROVED" || (event.status as any) === "CLOSED" ? "COMPLETED" : "SCHEDULED",
        assigneeUid: event.assigneeUid,
        assigneeName: event.assigneeName,
        linkedRecordType: (event.relatedModule === "inspections" ? "INSPECTION" : event.relatedModule === "ncrs" ? "NCR" : "OTHER") as any,
        linkedRecordId: event.relatedId || event.linkedRecordId,
        isQualityHoldPoint: true,
        projectId: event.projectId || "",
        companyId: event.companyId || "",
        createdBy: event.createdBy || "system",
        createdAt: event.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      await dbService.savePlannerEvent(planEvent);
    } catch (e) {
      console.warn("plannerSync.syncEvent warning:", e);
    }
  },

  async syncNCR(ncr: NonConformanceReport): Promise<void> {
    if (!ncr.projectId || !ncr.deadline) return;
    try {
      const existing = await dbService.getPlannerEvents(ncr.projectId);
      const match = existing.find(
        (e: PlannerEvent) => e.linkedRecordId === ncr.id && e.linkedRecordType === "NCR",
      );

      const event: PlannerEvent = {
        id: match?.id || `plan-ncr-${ncr.id}`,
        title: `NCR Deadline: ${ncr.ncrNumber || ncr.title}`,
        description: ncr.description || `Rectification required for ${ncr.elementName || "element"}`,
        eventType: "NCR_DEADLINE",
        date: ncr.deadline,
        startDate: ncr.deadline,
        endDate: ncr.deadline,
        startTime: "09:00",
        endTime: "17:00",
        location: [ncr.locationLevel, ncr.elementName, ncr.gridLine].filter(Boolean).join(" • ") || "Site",
        levelId: ncr.levelId,
        elementId: ncr.elementId,
        tradeId: ncr.tradeId,
        tradeName: ncr.trade,
        subtradeName: ncr.subtrade,
        priority: ncr.severity === "CRITICAL" ? "CRITICAL" : (ncr.severity as any) === "MAJOR" || ncr.severity === "HIGH" ? "HIGH" : "MEDIUM",
        status: ncr.status === "CLOSED" ? "COMPLETED" : "SCHEDULED",
        assigneeUid: ncr.assignedTo,
        assigneeName: ncr.assignedToName,
        linkedRecordType: "NCR",
        linkedRecordId: ncr.id,
        isQualityHoldPoint: true,
        projectId: ncr.projectId,
        companyId: ncr.companyId,
        createdBy: typeof ncr.raisedBy === "object" ? ncr.raisedBy?.uid || "system" : "system",
        createdAt: ncr.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      await dbService.savePlannerEvent(event);
    } catch (err) {
      console.warn("plannerSync.syncNCR warning:", err);
    }
  },

  async syncInspection(insp: InspectionRequest): Promise<void> {
    if (!insp.projectId || !insp.scheduledDate) return;
    try {
      const existing = await dbService.getPlannerEvents(insp.projectId);
      const match = existing.find(
        (e: PlannerEvent) => e.linkedRecordId === insp.id && e.linkedRecordType === "INSPECTION",
      );

      const event: PlannerEvent = {
        id: match?.id || `plan-insp-${insp.id}`,
        title: `Hold Point: ${insp.inspectionNumber} - ${insp.templateName || insp.stage}`,
        description: insp.description || `Inspection for ${insp.elementName || "element"}`,
        eventType: "INSPECTION",
        date: insp.scheduledDate,
        startDate: insp.scheduledDate,
        endDate: insp.scheduledDate,
        startTime: insp.scheduledTime || "10:00",
        endTime: "12:00",
        location: [insp.levelName || insp.floor, insp.elementName, insp.gridAxis].filter(Boolean).join(" • ") || "Site",
        levelId: insp.levelId,
        elementId: insp.elementId,
        tradeId: insp.tradeId,
        tradeName: insp.trade,
        subtradeName: insp.subtrade,
        priority: insp.riskLevel === "CRITICAL" ? "CRITICAL" : insp.riskLevel === "HIGH" ? "HIGH" : "MEDIUM",
        status: insp.status === "APPROVED" || insp.status === "CLOSED" ? "COMPLETED" : "SCHEDULED",
        assigneeUid: insp.inspector?.uid,
        assigneeName: insp.inspector?.name || insp.inspectorName,
        linkedRecordType: "INSPECTION",
        linkedRecordId: insp.id,
        isQualityHoldPoint: true,
        projectId: insp.projectId,
        companyId: insp.companyId,
        createdBy: insp.inspector?.uid || "system",
        createdAt: insp.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      await dbService.savePlannerEvent(event);
    } catch (err) {
      console.warn("plannerSync.syncInspection warning:", err);
    }
  },
};
