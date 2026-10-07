import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { dbService, sortByNewestFirst } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { SteelRebarTest } from "@/types";
import {
  Award,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  FileDown,
  X,
  Scissors,
} from "lucide-react";

export const SteelPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();
  const currentCompId =
    currentUser?.companyId || company?.id || "comp-apex-civil";
  const currentProjId = projectId || activeProject?.id || "proj-skyline-tower";

  const [tests, setTests] = useState<SteelRebarTest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // New Steel Test Form state
  const [heatNumber, setHeatNumber] = useState("HT-99830-C");
  const [supplier, setSupplier] = useState("Emirates Steel Industries");
  const [millName, setMillName] = useState("Rolling Mill #2");
  const [barDiameterMm, setBarDiameterMm] = useState<any>(25);
  const [steelGrade, setSteelGrade] = useState<any>("Grade 500B");
  const [yieldStrength, setYieldStrength] = useState<number>(540);
  const [uts, setUts] = useState<number>(635);
  const [elongation, setElongation] = useState<number>(16.2);
  const [bendResult, setBendResult] = useState<"PASS" | "FAIL">("PASS");
  const [rebendResult, setRebendResult] = useState<"PASS" | "FAIL">("PASS");

  const loadData = async () => {
    const list = await dbService.getSteelTests(currentProjId, currentCompId);
    setTests(sortByNewestFirst(list));
  };

  useEffect(() => {
    loadData();
  }, [currentProjId, currentCompId]);

  const filtered = sortByNewestFirst(
    tests.filter((t) => {
      return (
        t.testNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.heatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.supplier.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }),
  );

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const d = Number(barDiameterMm);
    const nominalArea = Number(((Math.PI * d * d) / 4).toFixed(1));
    const yieldRatio = Number((uts / yieldStrength).toFixed(2));
    const isPassing =
      yieldStrength >= 500 &&
      yieldRatio >= 1.08 &&
      elongation >= 12 &&
      bendResult === "PASS";

    const newTest: SteelRebarTest = {
      id: `stl-${Date.now()}`,
      projectId: currentProjId,
      companyId: company?.id || "comp-apex-civil",
      testNumber: `STL-2026-${String(Math.floor(Math.random() * 800 + 100)).padStart(3, "0")}`,
      heatNumber,
      supplier,
      millName,
      barDiameterMm: d as any,
      steelGrade,
      samplingDate: new Date().toISOString().split("T")[0],
      testDate: new Date().toISOString().split("T")[0],
      nominalAreaMm2: nominalArea,
      yieldStrengthNmm2: Number(yieldStrength),
      ultimateTensileStrengthNmm2: Number(uts),
      yieldRatio,
      elongationPercentage: Number(elongation),
      bendTestResult: bendResult,
      rebendTestResult: rebendResult,
      overallStatus: isPassing ? "PASS" : "FAIL",
      labName: "Central Materials Testing Laboratory",
      testedBy: currentUser?.fullName || "Eng. Vikram Rao",
      createdAt: new Date().toISOString(),
    };

    await dbService.saveSteelTest(newTest);

    if (currentUser) {
      await writeAudit({
        projectId: currentProjId,
        companyId: company?.id || "comp-apex-civil",
        userId: currentUser.uid,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: "LOG_STEEL_TEST",
        module: "Steel",
        details: `Logged rebar tensile test ${newTest.testNumber} for Heat #${heatNumber} (${d}mm Grade 500B) — Result: ${isPassing ? "PASS" : "FAIL"}`,
        newValue: newTest,
      });
    }

    setShowAddModal(false);
    loadData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Module Segmented Tab Switcher */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-fit">
        <button className="px-4 py-2 rounded-xl text-xs font-black bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm flex items-center gap-2">
          <Award className="w-4 h-4 text-red-500" />
          <span>Tensile & Bend Lab Tests ({tests.length})</span>
        </button>
        <Link
          to={`/project/${currentProjId}/bar-cutting`}
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-2"
        >
          <Scissors className="w-4 h-4 text-amber-500" />
          <span>Bar Cutting Schedule & 12m Stock Optimization</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-400 uppercase">
            QA/QC
          </span>
        </Link>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>Metallurgical Quality Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Steel Rebar Tensile & Bend Test Log
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Heat number traceability, Yield Strength ($R_e$), Ultimate Tensile
            Strength ($R_m$), $R_m/R_e$ ratio, % elongation, and bend test
            verification (BS 4449 / ASTM A615)
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Log Rebar Mill Sample</span>
        </button>
      </div>

      {/* Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl">
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search test #, heat number, supplier..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-red-500 transition"
          />
        </div>
      </div>

      {/* Rebar Tests Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Award className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">
              No Steel Rebar Tests Recorded
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              Log tensile strength and bend test certificates from certified
              testing mills.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Log Rebar Mill Sample</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Test Number</th>
                  <th className="py-3 px-4">Heat # & Mill</th>
                  <th className="py-3 px-4">Diameter & Grade</th>
                  <th className="py-3 px-4">Yield ($R_e$)</th>
                  <th className="py-3 px-4">UTS ($R_m$)</th>
                  <th className="py-3 px-4">Ratio ($R_m/R_e$)</th>
                  <th className="py-3 px-4">Elongation (%)</th>
                  <th className="py-3 px-4">Bend / Rebend</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.map((st) => (
                  <tr
                    key={st.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-red-600 dark:text-red-400">
                      {st.testNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {st.heatNumber}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {st.supplier} ({st.millName})
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {st.barDiameterMm}mm
                      </span>{" "}
                      ({st.steelGrade})
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {st.yieldStrengthNmm2} MPa
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {st.ultimateTensileStrengthNmm2} MPa
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {st.yieldRatio}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {st.elongationPercentage}%
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      Bend: {st.bendTestResult} • Rebend: {st.rebendTestResult}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          st.overallStatus === "PASS"
                            ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30"
                            : "bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30"
                        }`}
                      >
                        {st.overallStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Steel Test Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Award className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span>Log Rebar Tensile & Bend Test</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTest} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Heat Number *
                  </label>
                  <input
                    type="text"
                    value={heatNumber}
                    onChange={(e) => setHeatNumber(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Steel Supplier *
                  </label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Bar Diameter (mm) *
                  </label>
                  <select
                    value={barDiameterMm}
                    onChange={(e) => setBarDiameterMm(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  >
                    {[8, 10, 12, 16, 20, 25, 32, 40].map((dia) => (
                      <option key={dia} value={dia}>
                        {dia} mm
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Steel Grade *
                  </label>
                  <select
                    value={steelGrade}
                    onChange={(e) => setSteelGrade(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  >
                    <option value="Grade 500B">Grade 500B (BS 4449)</option>
                    <option value="Grade 500C">Grade 500C (Seismic)</option>
                    <option value="Grade 460">Grade 460</option>
                    <option value="Fe 500D">Fe 500D (IS 1786)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Yield ($R_e$) MPa
                  </label>
                  <input
                    type="number"
                    value={yieldStrength}
                    onChange={(e) => setYieldStrength(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    UTS ($R_m$) MPa
                  </label>
                  <input
                    type="number"
                    value={uts}
                    onChange={(e) => setUts(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Elongation (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={elongation}
                    onChange={(e) => setElongation(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    180° Bend Test
                  </label>
                  <select
                    value={bendResult}
                    onChange={(e) => setBendResult(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="PASS">PASS (No Cracking)</option>
                    <option value="FAIL">FAIL (Fracture/Crack)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Re-Bend Test
                  </label>
                  <select
                    value={rebendResult}
                    onChange={(e) => setRebendResult(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="PASS">PASS (No Cracking)</option>
                    <option value="FAIL">FAIL (Fracture/Crack)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg transition"
                >
                  Save Test Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
