import React, { useState, useEffect } from "react";
import { useProjectStore } from "../stores/useProjectStore";
import { useAuthStore } from "../stores/useAuthStore";
import { dbService } from "../lib/db";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Layers,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { ModuleTabNav } from "@/components/common/ModuleTabNav";
import {
  SiteCommentReport,
  NonConformanceReport,
  InspectionRequest,
  ConcreteCubeSample,
} from "../types";

export const Reporting: React.FC = () => {
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";
  const currentProjId = activeProject?.id || "";

  const [comments, setComments] = useState<SiteCommentReport[]>([]);
  const [ncrs, setNcrs] = useState<NonConformanceReport[]>([]);
  const [inspections, setInspections] = useState<InspectionRequest[]>([]);
  const [cubes, setCubes] = useState<ConcreteCubeSample[]>([]);
  const [timeRange, setTimeRange] = useState<"30" | "90" | "365" | "all">("90");

  useEffect(() => {
    const loadData = async () => {
      const [cData, nData, iData, cuData] = await Promise.all([
        dbService.getSiteComments(currentProjId, currentCompId),
        dbService.getNCRs(currentProjId, currentCompId),
        dbService.getInspections(currentProjId, currentCompId),
        dbService.getCubeSamples(currentProjId, currentCompId),
      ]);
      setComments(cData);
      setNcrs(nData);
      setInspections(iData);
      setCubes(cuData);
    };
    loadData();
  }, [currentProjId, currentCompId]);

  // Aggregate Metrics
  const totalInspections = inspections.length;
  const passedInspections = inspections.filter(
    (i) => i.status === "APPROVED",
  ).length;
  const passRate =
    totalInspections > 0
      ? Math.round((passedInspections / totalInspections) * 100)
      : 100;

  const totalNCRs = ncrs.length;
  const openNCRs = ncrs.filter((n) => n.status !== "CLOSED").length;
  const closedNCRs = ncrs.filter((n) => n.status === "CLOSED").length;

  // Flatten observations across comments
  const allObservations = comments.flatMap((c) => c.observations || []);

  // Defect Severity Breakdown (from Observations + NCRs)
  const severityCount = {
    CRITICAL:
      allObservations.filter((o) => o.severity === "CRITICAL").length +
      ncrs.filter((n) => n.severity === "CRITICAL").length,
    HIGH:
      allObservations.filter((o) => o.severity === "HIGH").length +
      ncrs.filter((n) => n.severity === "HIGH").length,
    MEDIUM:
      allObservations.filter((o) => o.severity === "MEDIUM").length +
      ncrs.filter((n) => n.severity === "MEDIUM").length,
    LOW:
      allObservations.filter((o) => o.severity === "LOW").length +
      ncrs.filter((n) => n.severity === "LOW").length,
  };

  const severityData = [
    { name: "Critical", value: severityCount.CRITICAL, color: "#ef4444" },
    { name: "High", value: severityCount.HIGH, color: "#f97316" },
    { name: "Medium", value: severityCount.MEDIUM, color: "#eab308" },
    { name: "Low", value: severityCount.LOW, color: "#3b82f6" },
  ];

  // NCR Root Causes
  const rootCauseMap: Record<string, number> = {};
  ncrs.forEach((n) => {
    const rc = n.rootCauseType || "Workmanship";
    rootCauseMap[rc] = (rootCauseMap[rc] || 0) + 1;
  });
  const rootCauseData = Object.entries(rootCauseMap).map(([key, val]) => ({
    category: key,
    count: val,
  }));

  // Concrete Strength 28-day compliance
  const tested28 = cubes.filter(
    (c) =>
      (c.tests?.day28?.compressiveStrengthNmm2 !== undefined &&
        (c.tests.day28.compressiveStrengthNmm2 || 0) > 0) ||
      (c.tests?.day28?.averageStrengthNmm2 !== undefined &&
        (c.tests.day28.averageStrengthNmm2 || 0) > 0) ||
      (c.day28Results &&
        c.day28Results.length > 0 &&
        (c.day28Results[0].averageStrength || 0) > 0),
  );
  const compliant28 = tested28.filter((c) => {
    const achieved =
      c.day28Results?.[0]?.averageStrength ??
      c.tests?.day28?.compressiveStrengthNmm2 ??
      c.tests?.day28?.averageStrengthNmm2 ??
      0;
    const target =
      c.target28DayStrengthNmm2 ||
      c.tests?.day28?.targetStrengthNmm2 ||
      c.tests?.day28?.requiredStrengthNmm2 ||
      30;
    return achieved >= target;
  }).length;
  const concreteComplianceRate =
    tested28.length > 0
      ? Math.round((compliant28 / tested28.length) * 100)
      : 100;

  // Real Monthly Trend Calculation
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthMap: {
    [m: string]: {
      month: string;
      inspections: number;
      passed: number;
      ncrs: number;
    };
  } = {};

  // Default initialize last 5 months
  for (let i = 4; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mStr = monthNames[d.getMonth()];
    monthMap[mStr] = { month: mStr, inspections: 0, passed: 0, ncrs: 0 };
  }

  inspections.forEach((insp) => {
    const d = new Date(insp.createdAt || insp.scheduledDate || Date.now());
    const mStr = monthNames[d.getMonth()];
    if (monthMap[mStr]) {
      monthMap[mStr].inspections += 1;
      if (insp.status === "APPROVED") monthMap[mStr].passed += 1;
    }
  });

  ncrs.forEach((ncr) => {
    const d = new Date(ncr.createdAt || Date.now());
    const mStr = monthNames[d.getMonth()];
    if (monthMap[mStr]) {
      monthMap[mStr].ncrs += 1;
    }
  });

  const trendData = Object.values(monthMap);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-1 sm:top-2 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-md dark:shadow-xl transition-colors">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <TrendingUp className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Executive QA/QC Analytics & Reporting
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Real-time compliance analytics, defect distribution matrices, and
            quality scorecards.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            {(["30", "90", "365", "all"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  timeRange === r
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {r === "all" ? "All Time" : `${r} Days`}
              </button>
            ))}
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <ModuleTabNav
        items={[
          {
            label: "Quality Analytics & KPIs",
            path: "/project/reporting",
            icon: TrendingUp,
          },
          {
            label: "Weekly Quality Reports",
            path: "/project/weekly-reports",
            icon: FileSpreadsheet,
          },
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Quality Pass Rate
            </span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {passRate}%
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Target: ≥95%
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {passedInspections} passed out of {totalInspections} total
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active NCRs
            </span>
            <span className="p-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              <AlertTriangle className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-red-600 dark:text-red-400">
              {openNCRs}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              / {totalNCRs} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {closedNCRs} resolved and verified
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Concrete Compliance
            </span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Layers className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {concreteComplianceRate}%
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              BS EN 12390
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {tested28.length} cubes tested at 28 days
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Field Observations
            </span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <FileText className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">
              {allObservations.length}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Recorded
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {allObservations.filter((o) => o.status === "OPEN").length}{" "}
            requiring contractor action
          </p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inspection Compliance Trend */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Quality Inspection & Pass Trend
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#94a3b8"
                  strokeOpacity={0.2}
                />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="inspections"
                  stroke="#818cf8"
                  strokeWidth={3}
                  name="Total Inspections"
                />
                <Line
                  type="monotone"
                  dataKey="passed"
                  stroke="#34d399"
                  strokeWidth={3}
                  name="Passed"
                />
                <Line
                  type="monotone"
                  dataKey="ncrs"
                  stroke="#f87171"
                  strokeWidth={2}
                  name="NCRs Raised"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Defect Severity Matrix */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Defect Severity Breakdown
          </h3>
          <div className="h-72 w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NCR Root Cause Analysis */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            NCR Root Cause Distribution
          </h3>
          {rootCauseData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm">
              No root causes logged yet
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rootCauseData} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#94a3b8"
                    strokeOpacity={0.2}
                  />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis
                    dataKey="category"
                    type="category"
                    stroke="#94a3b8"
                    width={140}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#6366f1"
                    radius={[0, 4, 4, 0]}
                    name="Occurrences"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Trade Quality Scorecard */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Trade Performance Scorecard
          </h3>
          <div className="space-y-4 overflow-y-auto max-h-64 pr-2">
            {[
              {
                trade: "Structural Concrete",
                pass: 96,
                ncrs: 1,
                rating: "Excellent",
              },
              {
                trade: "Rebar Reinforcement",
                pass: 92,
                ncrs: 2,
                rating: "Good",
              },
              {
                trade: "MEP Electrical",
                pass: 88,
                ncrs: 3,
                rating: "Requires Focus",
              },
              { trade: "MEP Plumbing", pass: 95, ncrs: 0, rating: "Excellent" },
              {
                trade: "Waterproofing",
                pass: 100,
                ncrs: 0,
                rating: "Outstanding",
              },
            ].map((t, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t.trade}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t.ncrs} active NCRs • Rating:{" "}
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                      {t.rating}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-base font-bold ${
                      t.pass >= 95
                        ? "text-emerald-600 dark:text-emerald-400"
                        : t.pass >= 90
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {t.pass}%
                  </span>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">
                    First-Time Pass
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
