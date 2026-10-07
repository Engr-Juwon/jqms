import React, { useState } from "react";
import { Calculator, CheckCircle, Layers } from "lucide-react";

export const MixCalc: React.FC = () => {
  // Inputs
  const [grade, setGrade] = useState<
    "M20" | "M25" | "M30" | "M35" | "M40" | "M45" | "M50"
  >("M35");
  const [fck, setFck] = useState<number>(35); // Characteristic compressive strength (MPa)
  const [sd, setSd] = useState<number>(5.0); // Standard Deviation (s)
  const [maxAggSize, setMaxAggSize] = useState<number>(20); // mm
  const [slump, setSlump] = useState<number>(120); // mm
  const [waterCementRatio, setWaterCementRatio] = useState<number>(0.42);
  const [airContent, setAirContent] = useState<number>(1.0); // % entrapped air
  const [specificGravityCement, setSpecificGravityCement] =
    useState<number>(3.15);
  const [specificGravityCA, setSpecificGravityCA] = useState<number>(2.7);
  const [specificGravityFA, setSpecificGravityFA] = useState<number>(2.65);
  const [zoneFA, setZoneFA] = useState<"Zone I" | "Zone II" | "Zone III">(
    "Zone II",
  );

  // Handle grade change
  const handleGradeChange = (g: typeof grade) => {
    setGrade(g);
    const num = parseInt(g.substring(1));
    setFck(num);
    if (num <= 25) setSd(4.0);
    else if (num <= 50) setSd(5.0);
    else setSd(6.0);

    // Suggest w/c ratio
    if (num <= 25) setWaterCementRatio(0.5);
    else if (num <= 35) setWaterCementRatio(0.45);
    else if (num <= 45) setWaterCementRatio(0.4);
    else setWaterCementRatio(0.35);
  };

  // Calculations per IS 10262 / ACI 211.1
  // 1. Target Mean Strength: f'ck = fck + 1.65 * s
  const targetMeanStrength = fck + 1.65 * sd;

  // 2. Water content estimation (for 20mm aggregate & 100-125mm slump ~ 186-195 kg/m³)
  const baseWater = maxAggSize === 10 ? 208 : maxAggSize === 20 ? 186 : 165;
  const slumpAdjustment =
    slump - 50 > 0 ? ((slump - 50) / 25) * 0.03 * baseWater : 0;
  const waterContent = Math.round(baseWater + slumpAdjustment);

  // 3. Cementitious Material Content
  const cementContent = Math.round(waterContent / waterCementRatio);

  // 4. Volume calculations (m³)
  const volWater = waterContent / 1000;
  const volCement = cementContent / (specificGravityCement * 1000);
  const volAir = airContent / 100;
  const volAggregate = 1 - (volWater + volCement + volAir);

  // Fraction of CA based on zone & agg size
  const caRatio =
    maxAggSize === 20
      ? zoneFA === "Zone I"
        ? 0.6
        : zoneFA === "Zone II"
          ? 0.62
          : 0.64
      : 0.68;
  const volCA = volAggregate * caRatio;
  const volFA = volAggregate * (1 - caRatio);

  const massCA = Math.round(volCA * specificGravityCA * 1000);
  const massFA = Math.round(volFA * specificGravityFA * 1000);

  // Proportions normalized to 1 part cement
  const cementPart = 1;
  const faPart = (massFA / cementContent).toFixed(2);
  const caPart = (massCA / cementContent).toFixed(2);
  const waterPart = (waterContent / cementContent).toFixed(2);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Concrete Mix Design Proportioning
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              IS 10262 / ACI 211.1 Standard Mix Calculation (Target fcr = fck +
              1.65s)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          {/* Left: Input Parameters */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Design Parameters
            </h3>

            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                Concrete Grade
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(
                  ["M20", "M25", "M30", "M35", "M40", "M45", "M50"] as const
                ).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleGradeChange(g)}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition ${
                      grade === g
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  fck (MPa)
                </label>
                <input
                  type="number"
                  value={fck}
                  onChange={(e) => setFck(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Std Deviation s (MPa)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={sd}
                  onChange={(e) => setSd(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Water/Cement (w/c)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={waterCementRatio}
                  onChange={(e) => setWaterCementRatio(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Slump (mm)
                </label>
                <input
                  type="number"
                  step="10"
                  value={slump}
                  onChange={(e) => setSlump(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Max Agg Size (mm)
                </label>
                <select
                  value={maxAggSize}
                  onChange={(e) => setMaxAggSize(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value={10}>10 mm</option>
                  <option value={20}>20 mm</option>
                  <option value={40}>40 mm</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Sand Grading
                </label>
                <select
                  value={zoneFA}
                  onChange={(e) => setZoneFA(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Zone I">Zone I (Coarse)</option>
                  <option value="Zone II">Zone II (Medium)</option>
                  <option value="Zone III">Zone III (Fine)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Middle: Calculated Mix Quantities per 1 m³ */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Target Mean Strength (fcr)
              </span>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                {targetMeanStrength.toFixed(2)}{" "}
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                  N/mm²
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                fcr = {fck} + 1.65 × {sd}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Proportion Ratio (C : FA : CA)
              </span>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                1 : {faPart} : {caPart}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                w/c ratio: {waterPart}
              </p>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Material Quantities per 1.0 m³ of Concrete
          </h3>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-xl text-center">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Cement
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {cementContent}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              kg/m³
            </span>
            <div className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
              {(cementContent / 50).toFixed(1)} Bags
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-xl text-center">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Water
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {waterContent}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Liters/m³
            </span>
            <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 font-mono">
              {waterCementRatio} w/c
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-xl text-center">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Fine Agg (Sand)
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {massFA}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              kg/m³
            </span>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
              {(massFA / 1000).toFixed(2)} Tons
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-xl text-center">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Coarse Agg
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {massCA}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              kg/m³
            </span>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-mono">
              {(massCA / 1000).toFixed(2)} Tons
            </div>
          </div>
        </div>

        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-500/20 rounded-xl flex items-start gap-3 text-xs text-indigo-800 dark:text-indigo-300">
          <CheckCircle className="w-5 h-5 flex-shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900 dark:text-white">
              {cementContent + waterContent + massFA + massCA} kg/m³
            </span>
            . Always verify trial batch slump retention and 7-day/28-day
            compressive strengths in the JQMS Cube Testing module before
            batching for structural elements.
          </div>
        </div>
      </div>
    </div>
  );
};
