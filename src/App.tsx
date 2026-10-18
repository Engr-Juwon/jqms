import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { OfflineSyncIndicator } from "./components/common/OfflineSyncIndicator";
import { ProjectGuard } from "./components/common/ProjectGuard";
import { ProjectLayout } from "./components/common/ProjectLayout";
import { CompanyGuard } from "./components/common/CompanyGuard";
import { CompanyLayout } from "./components/common/CompanyLayout";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { PageLoadingFallback } from "./components/common/PageLoadingFallback";
import { NavigationProgressBar } from "./components/common/NavigationProgressBar";

// Helper for robust lazy loading of named or default exported components
const lazyPage = <T extends Record<string, any>>(
  importer: () => Promise<T>,
  exportName?: keyof T,
) =>
  React.lazy(async () => {
    const mod = await importer();
    const Component = (
      exportName
        ? mod[exportName] || mod.default
        : mod.default || Object.values(mod)[0]
    ) as React.ComponentType<any>;
    return { default: Component };
  });

// Public & Landing
const Index = lazyPage(() => import("./pages/Index"), "Index");
const Login = lazyPage(() => import("./pages/Login"), "Login");
const ProjectSelector = lazyPage(
  () => import("./pages/ProjectSelector"),
  "ProjectSelector",
);
const NotFoundPage = lazyPage(
  () => import("./pages/NotFoundPage"),
  "NotFoundPage",
);
const ErrorPage = lazyPage(() => import("./pages/ErrorPage"), "ErrorPage");

// Company Level Management Pages
const ProjectList = lazyPage(
  () => import("./components/projects/ProjectList"),
  "ProjectList",
);
const ProjectCreate = lazyPage(
  () => import("./components/projects/ProjectCreate"),
  "ProjectCreate",
);
const ProjectEdit = lazyPage(
  () => import("./components/projects/ProjectEdit"),
  "ProjectEdit",
);
const UsersManagement = lazyPage(
  () => import("./pages/UsersManagement"),
  "UsersManagement",
);
const ProjectAssignmentsPage = lazyPage(
  () => import("./pages/ProjectAssignmentsPage"),
  "ProjectAssignmentsPage",
);
const TradeManagement = lazyPage(
  () => import("./pages/TradeManagement"),
  "TradeManagement",
);
const InspectionManagement = lazyPage(
  () => import("./pages/InspectionManagement"),
  "InspectionManagement",
);
const AuditTrail = lazyPage(() => import("./pages/AuditTrail"), "AuditTrail");
const Settings = lazyPage(() => import("./pages/Settings"), "Settings");

// Project Level Modules
const Dashboard = lazyPage(() => import("./pages/Dashboard"), "Dashboard");
const ElementRegistry = lazyPage(
  () => import("./pages/ElementRegistry"),
  "ElementRegistry",
);
const ElementDetail = lazyPage(
  () => import("./pages/ElementDetail"),
  "ElementDetail",
);
const MaterialTakeoff = lazyPage(
  () => import("./pages/MaterialTakeoff"),
  "MaterialTakeoff",
);
const GridPlanPage = lazyPage(
  () => import("./pages/GridPlanPage"),
  "GridPlanPage",
);
const BIM3DViewerPage = lazyPage(
  () => import("./pages/BIM3DViewerPage"),
  "BIM3DViewerPage",
);
const BIM5DCostPage = lazyPage(
  () => import("./pages/BIM5DCostPage"),
  "BIM5DCostPage",
);
const BIM6DCarbonPage = lazyPage(
  () => import("./pages/BIM6DCarbonPage"),
  "BIM6DCarbonPage",
);
const FloorLevelsPage = lazyPage(
  () => import("./pages/FloorLevelsPage"),
  "FloorLevelsPage",
);
const WorkPackagesPage = lazyPage(
  () => import("./pages/WorkPackagesPage"),
  "WorkPackagesPage",
);
const GridlinesPage = lazyPage(
  () => import("./pages/GridlinesPage"),
  "GridlinesPage",
);
const SiteCommentsRegistry = lazyPage(
  () => import("./pages/SiteCommentsRegistry"),
  "SiteCommentsRegistry",
);
const SiteCommentsCreate = lazyPage(
  () => import("./pages/SiteCommentsCreate"),
  "SiteCommentsCreate",
);
const SiteCommentsEdit = lazyPage(
  () => import("./pages/SiteCommentsEdit"),
  "SiteCommentsEdit",
);
const NCRModule = lazyPage(() => import("./pages/NCRModule"), "NCRModule");
const NCRCreate = lazyPage(() => import("./pages/NCRCreate"), "NCRCreate");
const NCRDetail = lazyPage(() => import("./pages/NCRDetail"), "NCRDetail");
const SiteInstructionsModule = lazyPage(
  () => import("./pages/SiteInstructionsModule"),
  "SiteInstructionsModule",
);
const SiteInstructionCreate = lazyPage(
  () => import("./pages/SiteInstructionCreate"),
  "SiteInstructionCreate",
);
const SiteInstructionDetail = lazyPage(
  () => import("./pages/SiteInstructionDetail"),
  "SiteInstructionDetail",
);
const RFIRegistry = lazyPage(
  () => import("./pages/RFIRegistry"),
  "RFIRegistry",
);
const RFICreate = lazyPage(() => import("./pages/RFICreate"), "RFICreate");
const RFIDetail = lazyPage(() => import("./pages/RFIDetail"), "RFIDetail");
const MARRegistry = lazyPage(
  () => import("./pages/MARRegistry"),
  "MARRegistry",
);
const MARCreate = lazyPage(() => import("./pages/MARCreate"), "MARCreate");
const MARDetail = lazyPage(() => import("./pages/MARDetail"), "MARDetail");
const MIRRegistry = lazyPage(
  () => import("./pages/MIRRegistry"),
  "MIRRegistry",
);
const MIRCreate = lazyPage(() => import("./pages/MIRCreate"), "MIRCreate");
const MIRDetail = lazyPage(() => import("./pages/MIRDetail"), "MIRDetail");
const Inspections = lazyPage(
  () => import("./pages/Inspections"),
  "Inspections",
);
const InspectionCreate = lazyPage(
  () => import("./pages/InspectionCreate"),
  "InspectionCreate",
);
const InspectionSchedule = lazyPage(
  () => import("./pages/InspectionSchedule"),
  "InspectionSchedule",
);
const InspectionDetail = lazyPage(
  () => import("./pages/InspectionDetail"),
  "InspectionDetail",
);
const PermitToPourList = lazyPage(
  () => import("./pages/PermitToPourList"),
  "PermitToPourList",
);
const PermitToPourCreate = lazyPage(
  () => import("./pages/PermitToPourCreate"),
  "PermitToPourCreate",
);
const PermitToPourDetail = lazyPage(
  () => import("./pages/PermitToPourDetail"),
  "PermitToPourDetail",
);
const ITPRegistryPage = lazyPage(
  () => import("./pages/ITPRegistryPage"),
  "ITPRegistryPage",
);
const ITPDetailPage = lazyPage(
  () => import("./pages/ITPDetailPage"),
  "ITPDetailPage",
);
const QAQCHandbookPage = lazyPage(
  () => import("./pages/QAQCHandbookPage"),
  "QAQCHandbookPage",
);
const Concrete = lazyPage(() => import("./pages/Concrete"), "Concrete");
const CubeForm = lazyPage(() => import("./pages/CubeForm"), "CubeForm");
const CubeDetails = lazyPage(
  () => import("./pages/CubeDetails"),
  "CubeDetails",
);
const SteelPage = lazyPage(() => import("./pages/SteelPage"), "SteelPage");
const BarCuttingSchedulePage = lazyPage(
  () => import("./pages/BarCuttingSchedulePage"),
  "BarCuttingSchedulePage",
);
const BarCuttingRegistryPage = lazyPage(
  () => import("./pages/BarCuttingRegistryPage"),
  "BarCuttingRegistryPage",
);
const BarCuttingDetailPage = lazyPage(
  () => import("./pages/BarCuttingDetailPage"),
  "BarCuttingDetailPage",
);
const DeliveriesPage = lazyPage(
  () => import("./pages/DeliveriesPage"),
  "DeliveriesPage",
);
const ConstructionPlanner = lazyPage(
  () => import("./pages/ConstructionPlanner"),
  "ConstructionPlanner",
);
const Photos = lazyPage(() => import("./pages/Photos"), "Photos");
const Documents = lazyPage(() => import("./pages/Documents"), "Documents");
const WeeklyReports = lazyPage(
  () => import("./pages/WeeklyReports"),
  "WeeklyReports",
);
const WeeklyReportCreate = lazyPage(
  () => import("./pages/WeeklyReportCreate"),
  "WeeklyReportCreate",
);
const WeeklyReportDetail = lazyPage(
  () => import("./pages/WeeklyReportDetail"),
  "WeeklyReportDetail",
);
const DailySiteLogRegistry = lazyPage(
  () => import("./pages/DailySiteLogRegistry"),
  "DailySiteLogRegistry",
);
const DailySiteLogCreate = lazyPage(
  () => import("./pages/DailySiteLogCreate"),
  "DailySiteLogCreate",
);
const DailySiteLogDetail = lazyPage(
  () => import("./pages/DailySiteLogDetail"),
  "DailySiteLogDetail",
);
const Reporting = lazyPage(() => import("./pages/Reporting"), "Reporting");
const CalculatorPage = lazyPage(
  () => import("./pages/Calculator"),
  "CalculatorPage",
);
const Notifications = lazyPage(
  () => import("./pages/Notifications"),
  "Notifications",
);
const ChatPage = lazyPage(() => import("./pages/ChatPage"), "ChatPage");
const ActionCenterPage = lazyPage(
  () => import("./pages/ActionCenterPage"),
  "ActionCenterPage",
);
const PunchListHandoverPage = lazyPage(
  () => import("./pages/PunchListHandoverPage"),
  "PunchListHandoverPage",
);
const MethodStatementsPage = lazyPage(
  () => import("./pages/MethodStatementsPage"),
  "MethodStatementsPage",
);
const ProfilePage = lazyPage(
  () => import("./pages/ProfilePage"),
  "ProfilePage",
);


export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        {/* Instant Top Navigation Progress Bar */}
        <NavigationProgressBar />

        {/* Offline Sync Banner Vault */}
        <OfflineSyncIndicator />

        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            {/* Public Landing & Login */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/projects" element={<ProjectSelector />} />
            <Route path="/error" element={<ErrorPage />} />

            {/* Top-level Profile Redirect */}
            <Route path="/profile" element={<Navigate to="/project/profile" replace />} />

            {/* Company Level Routes (Protected by CompanyGuard — auth + Level 4 minimum) */}
            <Route
              path="/company"
              element={
                <CompanyGuard>
                  <CompanyLayout />
                </CompanyGuard>
              }
            >
              <Route
                index
                element={<Navigate to="/company/projects" replace />}
              />
              <Route path="projects" element={<ProjectList />} />
              <Route path="projects/create" element={<ProjectCreate />} />
              <Route path="projects/:id/edit" element={<ProjectEdit />} />
              <Route path="users" element={<UsersManagement />} />
              <Route path="assignments" element={<ProjectAssignmentsPage />} />
              <Route path="users/assignments" element={<ProjectAssignmentsPage />} />
              <Route path="projects/assignments" element={<ProjectAssignmentsPage />} />
              <Route path="projects/assign" element={<ProjectAssignmentsPage />} />
              <Route path="assign" element={<ProjectAssignmentsPage />} />
              <Route path="assign-users" element={<ProjectAssignmentsPage />} />
              <Route path="trades" element={<TradeManagement />} />
              <Route path="inspections" element={<InspectionManagement />} />
              <Route path="audit" element={<AuditTrail />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="chat" element={<ChatPage />} />
            </Route>

            {/* Project Level Routes (Protected by ProjectGuard + ProjectLayout) */}
            <Route
              path="/project"
              element={
                <ProjectGuard>
                  <ProjectLayout />
                </ProjectGuard>
              }
            >
              <Route
                index
                element={<Navigate to="/project/dashboard" replace />}
              />
              <Route path="dashboard" element={<Dashboard />} />

              {/* Elements & BIM Dimensions (2D to 7D) */}
              <Route path="elements" element={<ElementRegistry />} />
              <Route path="elements/:id" element={<ElementDetail />} />
              <Route path="registry/element/:id" element={<ElementDetail />} />
              <Route path="elements/:id/passport" element={<ElementDetail />} />
              <Route path="grid-plan" element={<GridPlanPage />} />
              <Route path="bim-3d" element={<BIM3DViewerPage />} />
              <Route path="3d-twin" element={<BIM3DViewerPage />} />
              <Route path="5d-cost" element={<BIM5DCostPage />} />
              <Route path="cost-takeoff" element={<BIM5DCostPage />} />
              <Route path="6d-carbon" element={<BIM6DCarbonPage />} />
              <Route path="sustainability" element={<BIM6DCarbonPage />} />
              <Route path="levels" element={<FloorLevelsPage />} />
              <Route path="packages" element={<WorkPackagesPage />} />
              <Route path="gridlines" element={<GridlinesPage />} />
              <Route path="mto" element={<MaterialTakeoff />} />
              <Route path="size-schedule" element={<MaterialTakeoff />} />

              {/* Site Comments & Observations */}
              <Route path="site-comments" element={<SiteCommentsRegistry />} />
              <Route
                path="site-comments/create"
                element={<SiteCommentsCreate />}
              />
              <Route
                path="site-comments/edit/:id"
                element={<SiteCommentsEdit />}
              />
              <Route
                path="site-comments/:id/edit"
                element={<SiteCommentsEdit />}
              />

              {/* Non-Conformance Reports (NCR) */}
              <Route path="ncrs" element={<NCRModule />} />
              <Route path="ncrs/create" element={<NCRCreate />} />
              <Route path="ncrs/:id" element={<NCRDetail />} />
              <Route path="ncr" element={<NCRModule />} />
              <Route path="ncr/create" element={<NCRCreate />} />
              <Route path="ncr/:id" element={<NCRDetail />} />

              {/* Site Instructions (Overdue NCR Warnings) */}
              <Route
                path="site-instructions"
                element={<SiteInstructionsModule />}
              />
              <Route
                path="site-instructions/create"
                element={<SiteInstructionCreate />}
              />
              <Route
                path="site-instructions/:id"
                element={<SiteInstructionDetail />}
              />
              <Route
                path="site-instruction"
                element={<SiteInstructionsModule />}
              />
              <Route
                path="site-instruction/create"
                element={<SiteInstructionCreate />}
              />
              <Route
                path="site-instruction/:id"
                element={<SiteInstructionDetail />}
              />

              {/* RFI */}
              <Route path="rfi" element={<RFIRegistry />} />
              <Route path="rfi/create" element={<RFICreate />} />
              <Route path="rfi/:id" element={<RFIDetail />} />

              {/* Submittals / MAR */}
              <Route path="mar" element={<MARRegistry />} />
              <Route path="mar/create" element={<MARCreate />} />
              <Route path="mar/:id" element={<MARDetail />} />

              {/* Material Inspection Reports / MIR */}
              <Route path="mir" element={<MIRRegistry />} />
              <Route path="mir/create" element={<MIRCreate />} />
              <Route path="mir/:id/edit" element={<MIRCreate />} />
              <Route path="mir/:id" element={<MIRDetail />} />

              {/* Inspections */}
              <Route path="inspections" element={<Inspections />} />
              <Route path="inspections/create" element={<InspectionCreate />} />
              <Route
                path="inspections/schedule"
                element={<InspectionSchedule />}
              />
              <Route path="inspections/:id" element={<InspectionDetail />} />

              {/* Permit to Pour */}
              <Route path="permit-to-pour" element={<PermitToPourList />} />
              <Route
                path="permit-to-pour/create"
                element={<PermitToPourCreate />}
              />
              <Route
                path="permit-to-pour/:id"
                element={<PermitToPourDetail />}
              />

              {/* Inspection & Test Plans (ITP) */}
              <Route path="itp" element={<ITPRegistryPage />} />
              <Route path="itp/:id" element={<ITPDetailPage />} />

              {/* QA/QC Exclusive SOP Handbook & Instruction Booklet */}
              <Route path="qaqc-handbook" element={<QAQCHandbookPage />} />

              {/* Concrete & Materials Testing */}
              <Route path="concrete" element={<Concrete />} />
              <Route path="concrete/sample" element={<CubeForm />} />
              <Route path="concrete/:id" element={<CubeDetails />} />
              <Route path="steel" element={<SteelPage />} />
              <Route
                path="steel/bar-cutting"
                element={<BarCuttingRegistryPage />}
              />
              <Route
                path="steel/bar-cutting/:scheduleId"
                element={<BarCuttingDetailPage />}
              />
              <Route path="bar-cutting" element={<BarCuttingRegistryPage />} />
              <Route
                path="bar-cutting/:scheduleId"
                element={<BarCuttingDetailPage />}
              />
              <Route path="deliveries" element={<DeliveriesPage />} />

              {/* 4D Planning & Docs */}
              <Route path="daily-logs" element={<DailySiteLogRegistry />} />
              <Route
                path="daily-logs/create"
                element={<DailySiteLogCreate />}
              />
              <Route
                path="daily-logs/create"
                element={<DailySiteLogCreate />}
              />
              <Route path="daily-logs/:id" element={<DailySiteLogDetail />} />
              <Route
                path="daily-logs/:id/edit"
                element={<DailySiteLogCreate />}
              />
              <Route
                path="daily-logs/:id/edit"
                element={<DailySiteLogCreate />}
              />
              <Route path="daily-log" element={<DailySiteLogRegistry />} />
              <Route path="daily-log/create" element={<DailySiteLogCreate />} />
              <Route path="daily-log/:id" element={<DailySiteLogDetail />} />
              <Route path="planner" element={<ConstructionPlanner />} />
              <Route path="photos" element={<Photos />} />
              <Route path="documents" element={<Documents />} />
              <Route path="weekly-reports" element={<WeeklyReports />} />
              <Route
                path="weekly-reports/create"
                element={<WeeklyReportCreate />}
              />
              <Route
                path="weekly-reports/:id"
                element={<WeeklyReportDetail />}
              />
              <Route path="reporting" element={<Reporting />} />
              <Route path="calculators" element={<CalculatorPage />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="approvals" element={<ActionCenterPage />} />
              <Route path="action-center" element={<ActionCenterPage />} />
              <Route path="punch-list" element={<PunchListHandoverPage />} />
              <Route path="handover" element={<PunchListHandoverPage />} />
              <Route path="method-statements" element={<MethodStatementsPage />} />
              <Route path="rams" element={<MethodStatementsPage />} />
              <Route path="settings" element={<ProjectEdit />} />
              <Route path="edit" element={<ProjectEdit />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Project Level Routes with explicit :projectId parameter */}
            <Route
              path="/project/:projectId"
              element={
                <ProjectGuard>
                  <ProjectLayout />
                </ProjectGuard>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />

              {/* Elements & BIM */}
              <Route path="elements" element={<ElementRegistry />} />
              <Route path="elements/:id" element={<ElementDetail />} />
              <Route path="registry/element/:id" element={<ElementDetail />} />
              <Route path="elements/:id/passport" element={<ElementDetail />} />
              <Route path="grid-plan" element={<GridPlanPage />} />
              <Route path="levels" element={<FloorLevelsPage />} />
              <Route path="packages" element={<WorkPackagesPage />} />
              <Route path="gridlines" element={<GridlinesPage />} />
              <Route path="mto" element={<MaterialTakeoff />} />
              <Route path="size-schedule" element={<MaterialTakeoff />} />

              {/* Site Comments & Observations */}
              <Route path="site-comments" element={<SiteCommentsRegistry />} />
              <Route
                path="site-comments/create"
                element={<SiteCommentsCreate />}
              />
              <Route
                path="site-comments/edit/:id"
                element={<SiteCommentsEdit />}
              />
              <Route
                path="site-comments/:id/edit"
                element={<SiteCommentsEdit />}
              />

              {/* Non-Conformance Reports (NCR) */}
              <Route path="ncrs" element={<NCRModule />} />
              <Route path="ncrs/create" element={<NCRCreate />} />
              <Route path="ncrs/:id" element={<NCRDetail />} />
              <Route path="ncr" element={<NCRModule />} />
              <Route path="ncr/create" element={<NCRCreate />} />
              <Route path="ncr/:id" element={<NCRDetail />} />

              {/* Site Instructions (Overdue NCR Warnings) */}
              <Route
                path="site-instructions"
                element={<SiteInstructionsModule />}
              />
              <Route
                path="site-instructions/create"
                element={<SiteInstructionCreate />}
              />
              <Route
                path="site-instructions/:id"
                element={<SiteInstructionDetail />}
              />
              <Route
                path="site-instruction"
                element={<SiteInstructionsModule />}
              />
              <Route
                path="site-instruction/create"
                element={<SiteInstructionCreate />}
              />
              <Route
                path="site-instruction/:id"
                element={<SiteInstructionDetail />}
              />

              {/* RFI */}
              <Route path="rfi" element={<RFIRegistry />} />
              <Route path="rfi/create" element={<RFICreate />} />
              <Route path="rfi/:id" element={<RFIDetail />} />

              {/* Submittals / MAR */}
              <Route path="mar" element={<MARRegistry />} />
              <Route path="mar/create" element={<MARCreate />} />
              <Route path="mar/:id" element={<MARDetail />} />

              {/* Material Inspection Reports / MIR */}
              <Route path="mir" element={<MIRRegistry />} />
              <Route path="mir/create" element={<MIRCreate />} />
              <Route path="mir/:id/edit" element={<MIRCreate />} />
              <Route path="mir/:id" element={<MIRDetail />} />

              {/* Inspections */}
              <Route path="inspections" element={<Inspections />} />
              <Route path="inspections/create" element={<InspectionCreate />} />
              <Route
                path="inspections/schedule"
                element={<InspectionSchedule />}
              />
              <Route path="inspections/:id" element={<InspectionDetail />} />

              {/* Permit to Pour */}
              <Route path="permit-to-pour" element={<PermitToPourList />} />
              <Route
                path="permit-to-pour/create"
                element={<PermitToPourCreate />}
              />
              <Route
                path="permit-to-pour/:id"
                element={<PermitToPourDetail />}
              />

              {/* Inspection & Test Plans (ITP) */}
              <Route path="itp" element={<ITPRegistryPage />} />
              <Route path="itp/:id" element={<ITPDetailPage />} />

              {/* QA/QC Exclusive SOP Handbook & Instruction Booklet */}
              <Route path="qaqc-handbook" element={<QAQCHandbookPage />} />

              {/* Concrete & Materials Testing */}
              <Route path="concrete" element={<Concrete />} />
              <Route path="concrete/sample" element={<CubeForm />} />
              <Route path="concrete/:id" element={<CubeDetails />} />
              <Route path="steel" element={<SteelPage />} />
              <Route
                path="steel/bar-cutting"
                element={<BarCuttingRegistryPage />}
              />
              <Route
                path="steel/bar-cutting/:scheduleId"
                element={<BarCuttingDetailPage />}
              />
              <Route path="bar-cutting" element={<BarCuttingRegistryPage />} />
              <Route
                path="bar-cutting/:scheduleId"
                element={<BarCuttingDetailPage />}
              />
              <Route path="deliveries" element={<DeliveriesPage />} />

              {/* 4D Planning & Docs */}
              <Route path="daily-logs" element={<DailySiteLogRegistry />} />
              <Route
                path="daily-logs/create"
                element={<DailySiteLogCreate />}
              />
              <Route
                path="daily-logs/create"
                element={<DailySiteLogCreate />}
              />
              <Route path="daily-logs/:id" element={<DailySiteLogDetail />} />
              <Route
                path="daily-logs/:id/edit"
                element={<DailySiteLogCreate />}
              />
              <Route
                path="daily-logs/:id/edit"
                element={<DailySiteLogCreate />}
              />
              <Route path="daily-log" element={<DailySiteLogRegistry />} />
              <Route path="daily-log/create" element={<DailySiteLogCreate />} />
              <Route path="daily-log/:id" element={<DailySiteLogDetail />} />
              <Route path="planner" element={<ConstructionPlanner />} />
              <Route path="photos" element={<Photos />} />
              <Route path="documents" element={<Documents />} />
              <Route path="weekly-reports" element={<WeeklyReports />} />
              <Route
                path="weekly-reports/create"
                element={<WeeklyReportCreate />}
              />
              <Route
                path="weekly-reports/:id"
                element={<WeeklyReportDetail />}
              />
              <Route path="reporting" element={<Reporting />} />
              <Route path="calculators" element={<CalculatorPage />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="approvals" element={<ActionCenterPage />} />
              <Route path="action-center" element={<ActionCenterPage />} />
              <Route path="punch-list" element={<PunchListHandoverPage />} />
              <Route path="handover" element={<PunchListHandoverPage />} />
              <Route path="method-statements" element={<MethodStatementsPage />} />
              <Route path="rams" element={<MethodStatementsPage />} />
              <Route path="settings" element={<ProjectEdit />} />
              <Route path="edit" element={<ProjectEdit />} />
              <Route path="assignments" element={<ProjectAssignmentsPage />} />
              <Route path="team" element={<ProjectAssignmentsPage />} />
              <Route path="staff" element={<ProjectAssignmentsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#0f172a",
                color: "#f8fafc",
                borderRadius: "1rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                border: "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
              },
              success: {
                iconTheme: {
                  primary: "#10b981",
                  secondary: "#0f172a",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#0f172a",
                },
              },
            }}
          />
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
