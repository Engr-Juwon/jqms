import React, { useState } from "react";
import {
  Calculator as CalcIcon,
  Layers,
  Maximize,
  Box,
  Grid,
  Shield,
  Paintbrush,
  ArrowRightLeft,
} from "lucide-react";
import { MixCalc } from "../components/MixCalc";

export const CalculatorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("mix");

  // Calculator states
  // 1. Rebar Weight
  const [rebarDia, setRebarDia] = useState<number>(16);
  const [rebarLength, setRebarLength] = useState<number>(12);
  const [rebarQty, setRebarQty] = useState<number>(100);

  // 2. Concrete Volume
  const [concType, setConcType] = useState<
    "slab" | "column" | "beam" | "footing"
  >("slab");
  const [concL, setConcL] = useState<number>(10);
  const [concW, setConcW] = useState<number>(8);
  const [concH, setConcH] = useState<number>(0.2);
  const [concCount, setConcCount] = useState<number>(1);

  // 3. Blockwork
  const [wallL, setWallL] = useState<number>(10);
  const [wallH, setWallH] = useState<number>(3);
  const [blockL, setBlockL] = useState<number>(0.4); // 400mm
  const [blockH, setBlockH] = useState<number>(0.2); // 200mm
  const [openingsArea, setOpeningsArea] = useState<number>(4); // Doors/windows

  // 4. Tiles
  const [floorL, setFloorL] = useState<number>(6);
  const [floorW, setFloorW] = useState<number>(5);
  const [tileL, setTileL] = useState<number>(0.6); // 600mm
  const [tileW, setTileW] = useState<number>(0.6); // 600mm
  const [tileWaste, setTileWaste] = useState<number>(10); // %

  // 5. Paint
  const [paintArea, setPaintArea] = useState<number>(120);
  const [paintCoats, setPaintCoats] = useState<number>(2);
  const [paintCoverage, setPaintCoverage] = useState<number>(10); // m² per liter

  // 6. Area
  const [shape, setShape] = useState<
    "rect" | "circle" | "triangle" | "trapezoid"
  >("rect");
  const [dim1, setDim1] = useState<number>(10);
  const [dim2, setDim2] = useState<number>(5);
  const [dim3, setDim3] = useState<number>(4);

  // 7. Unit Converter
  const [unitCategory, setUnitCategory] = useState<
    "pressure" | "length" | "volume" | "weight"
  >("pressure");
  const [convVal, setConvVal] = useState<number>(35);

  // Calculations
  // Rebar: W = (d^2 / 162.2) * L * Qty
  const unitWeightPerMeter = (rebarDia * rebarDia) / 162.2;
  const totalRebarWeight = unitWeightPerMeter * rebarLength * rebarQty;

  // Concrete
  const singleVol = concL * concW * concH;
  const totalConcVol = singleVol * concCount;

  // Blockwork
  const netWallArea = Math.max(0, wallL * wallH - openingsArea);
  const blockArea = (blockL + 0.01) * (blockH + 0.01); // 10mm mortar joint
  const totalBlocks = Math.ceil((netWallArea / blockArea) * 1.05); // 5% waste

  // Tiles
  const roomArea = floorL * floorW;
  const singleTileArea = tileL * tileW;
  const netTiles =
    singleTileArea > 0
      ? Math.ceil((roomArea / singleTileArea) * (1 + tileWaste / 100))
      : 0;
  const boxesNeeded = Math.ceil(netTiles / 4); // assume 4 tiles per box

  // Paint
  const totalPaintNeeded = Math.ceil((paintArea * paintCoats) / paintCoverage);

  // Area
  const calcArea = () => {
    if (shape === "rect") return dim1 * dim2;
    if (shape === "circle") return Math.PI * Math.pow(dim1, 2);
    if (shape === "triangle") return 0.5 * dim1 * dim2;
    if (shape === "trapezoid") return 0.5 * (dim1 + dim2) * dim3;
    return 0;
  };

  const tabs = [
    { id: "mix", name: "Mix Proportioning (fcr)", icon: Layers },
    { id: "rebar", name: "Rebar Weight (d²/162.2)", icon: Shield },
    { id: "concrete", name: "Concrete Volume", icon: Box },
    { id: "blocks", name: "Block & Masonry", icon: Grid },
    { id: "tiles", name: "Tile Estimator", icon: Grid },
    { id: "paint", name: "Paint & Coating", icon: Paintbrush },
    { id: "area", name: "Geometry & Area", icon: Maximize },
    { id: "convert", name: "Unit Converter", icon: ArrowRightLeft },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
            <CalcIcon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Civil Engineering & QA/QC Calculators
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Precision site calculation tools for concrete mix design,
              reinforcement weight, masonry, and geometric quantification.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                    : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "mix" && <MixCalc />}

      {activeTab === "rebar" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Steel Reinforcement Weight Estimator (W = d²/162.2 × L)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Standard unit weight formula based on steel density 7850 kg/m³.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Bar Diameter (mm)
                </label>
                <select
                  value={rebarDia}
                  onChange={(e) => setRebarDia(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {[8, 10, 12, 16, 20, 25, 32, 40].map((d) => (
                    <option key={d} value={d}>
                      T{d} ({d} mm)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Length of Single Bar (m)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={rebarLength}
                  onChange={(e) => setRebarLength(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Quantity of Bars
                </label>
                <input
                  type="number"
                  value={rebarQty}
                  onChange={(e) => setRebarQty(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  Unit Weight per Meter
                </span>
                <span className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  {unitWeightPerMeter.toFixed(3)}{" "}
                  <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                    kg/m
                  </span>
                </span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-mono">
                  T{rebarDia} bar
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  Total Batch Weight
                </span>
                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {totalRebarWeight.toFixed(1)}{" "}
                  <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                    kg
                  </span>
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
                  {(totalRebarWeight / 1000).toFixed(3)} Metric Tonnes
                </span>
              </div>

              <div className="sm:col-span-2 bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 p-4 rounded-xl text-xs text-slate-700 dark:text-slate-300">
                Total Length:{" "}
                <strong className="text-slate-900 dark:text-white">
                  {(rebarLength * rebarQty).toLocaleString()} m
                </strong>{" "}
                • Standard Bundle Weight (approx 2 Tonnes):{" "}
                <strong className="text-slate-900 dark:text-white">
                  {(totalRebarWeight / 1000 / 2).toFixed(1)} Bundles
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "concrete" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Box className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Structural Concrete Volume Estimator
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Calculate wet mix volume, batch truck trips (7 m³ per truck), and
            cement bag requirements.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Element Geometry
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["slab", "column", "beam", "footing"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setConcType(t)}
                      className={`py-1.5 text-xs font-semibold rounded-lg capitalize border transition ${
                        concType === t
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Length (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={concL}
                    onChange={(e) => setConcL(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Width (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={concW}
                    onChange={(e) => setConcW(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Depth (m)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={concH}
                    onChange={(e) => setConcH(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Number of Identical Units
                </label>
                <input
                  type="number"
                  value={concCount}
                  onChange={(e) => setConcCount(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  Total Wet Volume
                </span>
                <span className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  {totalConcVol.toFixed(2)}{" "}
                  <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                    m³
                  </span>
                </span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-mono">
                  {(totalConcVol * 35.3147).toFixed(1)} Cubic Feet (cft)
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  Transit Mixer Capacity
                </span>
                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {Math.ceil(totalConcVol / 7)}{" "}
                  <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                    Trucks
                  </span>
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
                  Assumes standard 7 m³ drum
                </span>
              </div>

              <div className="sm:col-span-2 bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 p-4 rounded-xl text-xs text-slate-700 dark:text-slate-300">
                Dry Volume Factor (x1.54):{" "}
                <strong className="text-slate-900 dark:text-white">
                  {(totalConcVol * 1.54).toFixed(2)} m³
                </strong>{" "}
                • Order with 5% pump waste allowance:{" "}
                <strong className="text-indigo-600 dark:text-indigo-400">
                  {(totalConcVol * 1.05).toFixed(2)} m³
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "blocks" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Grid className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Blockwork & Masonry Estimator
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Calculates number of AAC/Concrete blocks including mortar joint
            factor (10mm) and 5% standard breakage.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Wall Length (m)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={wallL}
                    onChange={(e) => setWallL(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Wall Height (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={wallH}
                    onChange={(e) => setWallH(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Openings Area (Doors/Windows m²)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={openingsArea}
                  onChange={(e) => setOpeningsArea(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Block Length (m)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={blockL}
                    onChange={(e) => setBlockL(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Block Height (m)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={blockH}
                    onChange={(e) => setBlockH(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  Net Masonry Area
                </span>
                <span className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  {netWallArea.toFixed(2)}{" "}
                  <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                    m²
                  </span>
                </span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-mono">
                  Gross: {(wallL * wallH).toFixed(1)} m²
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  Total Blocks Required
                </span>
                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {totalBlocks}{" "}
                  <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                    Nos
                  </span>
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
                  Includes 5% breakage allowance
                </span>
              </div>

              <div className="sm:col-span-2 bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 p-4 rounded-xl text-xs text-slate-700 dark:text-slate-300">
                Mortar Joint Allowance:{" "}
                <strong className="text-slate-900 dark:text-white">
                  10 mm
                </strong>{" "}
                • Blocks per m²:{" "}
                <strong className="text-slate-900 dark:text-white">
                  {(1 / blockArea).toFixed(1)} Units/m²
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "tiles" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Grid className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Tile & Flooring Surface Estimator
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Calculate exact tiles, boxed packages, and cutting waste allowances
            for room layouts.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Room Length (m)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={floorL}
                    onChange={(e) => setFloorL(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Room Width (m)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={floorW}
                    onChange={(e) => setFloorW(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Tile Length (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={tileL}
                    onChange={(e) => setTileL(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Tile Width (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={tileW}
                    onChange={(e) => setTileW(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Waste Allowance (%)
                </label>
                <input
                  type="number"
                  value={tileWaste}
                  onChange={(e) => setTileWaste(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  Total Floor Area
                </span>
                <span className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  {roomArea.toFixed(2)}{" "}
                  <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                    m²
                  </span>
                </span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-mono">
                  Tile size: {tileL * 1000}×{tileW * 1000} mm
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  Total Tiles Required
                </span>
                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {netTiles}{" "}
                  <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                    Pieces
                  </span>
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
                  Approx. {boxesNeeded} boxes (4/box)
                </span>
              </div>

              <div className="sm:col-span-2 bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 p-4 rounded-xl text-xs text-slate-700 dark:text-slate-300">
                Single Tile Surface:{" "}
                <strong className="text-slate-900 dark:text-white">
                  {singleTileArea.toFixed(3)} m²
                </strong>{" "}
                • Cutting Waste Added:{" "}
                <strong className="text-slate-900 dark:text-white">
                  {tileWaste}%
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "paint" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Paintbrush className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Paint & Surface Coating Estimator
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Estimate primer and topcoat volume requirements in liters and
            standard 20L drums.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Surface Area (m²)
                </label>
                <input
                  type="number"
                  value={paintArea}
                  onChange={(e) => setPaintArea(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Number of Coats
                </label>
                <select
                  value={paintCoats}
                  onChange={(e) => setPaintCoats(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value={1}>1 Coat (Touch-up / Primer)</option>
                  <option value={2}>2 Coats (Standard Finish)</option>
                  <option value={3}>3 Coats (High Opacity / Exterior)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Coverage Rate (m²/Liter)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={paintCoverage}
                  onChange={(e) => setPaintCoverage(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  Total Paint Required
                </span>
                <span className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  {totalPaintNeeded}{" "}
                  <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                    Liters
                  </span>
                </span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-mono">
                  {paintCoats} coat(s) on {paintArea} m²
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  Standard Packaging
                </span>
                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {Math.ceil(totalPaintNeeded / 20)}{" "}
                  <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                    Drums
                  </span>
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
                  Assumes 20L commercial drums
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "area" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Maximize className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            2D Geometry & Plan Surface Calculator
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Calculate surface areas and perimeters for rectangular, circular,
            triangular, and trapezoidal shapes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Shape
                </label>
                <select
                  value={shape}
                  onChange={(e) => setShape(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="rect">Rectangle / Square</option>
                  <option value="circle">Circle</option>
                  <option value="triangle">Triangle</option>
                  <option value="trapezoid">Trapezoid</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {shape === "circle"
                    ? "Radius (m)"
                    : shape === "trapezoid"
                      ? "Base A (m)"
                      : "Dimension 1 (m)"}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={dim1}
                  onChange={(e) => setDim1(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {shape !== "circle" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {shape === "trapezoid" ? "Base B (m)" : "Dimension 2 (m)"}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={dim2}
                    onChange={(e) => setDim2(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {shape === "trapezoid" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Height (m)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={dim3}
                    onChange={(e) => setDim3(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  Computed Surface Area
                </span>
                <span className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  {calcArea().toFixed(2)}{" "}
                  <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                    m²
                  </span>
                </span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-mono">
                  {(calcArea() * 10.7639).toFixed(1)} sq. ft.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "convert" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Civil Engineering Unit Converter
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Convert between standard metric and imperial construction units.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Category
                </label>
                <select
                  value={unitCategory}
                  onChange={(e) => setUnitCategory(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="pressure">
                    Pressure / Compressive Strength (MPa ↔ psi)
                  </option>
                  <option value="length">Length (Meters ↔ Feet)</option>
                  <option value="volume">Volume (m³ ↔ cft)</option>
                  <option value="weight">Weight (Tonnes ↔ lbs)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Input Metric Value
                </label>
                <input
                  type="number"
                  value={convVal}
                  onChange={(e) => setConvVal(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {unitCategory === "pressure" && (
                <>
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                      Pounds per Square Inch
                    </span>
                    <span className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                      {(convVal * 145.038).toFixed(1)}{" "}
                      <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                        psi
                      </span>
                    </span>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-mono">
                      1 MPa = 145.038 psi
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                      Kilograms per cm²
                    </span>
                    <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      {(convVal * 10.1972).toFixed(1)}{" "}
                      <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                        kg/cm²
                      </span>
                    </span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
                      1 MPa = 10.197 kg/cm²
                    </span>
                  </div>
                </>
              )}

              {unitCategory === "length" && (
                <>
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                      Feet (ft)
                    </span>
                    <span className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                      {(convVal * 3.28084).toFixed(2)}{" "}
                      <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                        ft
                      </span>
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                      Inches (in)
                    </span>
                    <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      {(convVal * 39.3701).toFixed(1)}{" "}
                      <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                        in
                      </span>
                    </span>
                  </div>
                </>
              )}

              {unitCategory === "volume" && (
                <>
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                      Cubic Feet (cft)
                    </span>
                    <span className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                      {(convVal * 35.3147).toFixed(2)}{" "}
                      <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                        cft
                      </span>
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                      Gallons (US)
                    </span>
                    <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      {(convVal * 264.172).toFixed(1)}{" "}
                      <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                        gal
                      </span>
                    </span>
                  </div>
                </>
              )}

              {unitCategory === "weight" && (
                <>
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                      Pounds (lbs)
                    </span>
                    <span className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                      {(convVal * 2204.62).toFixed(1)}{" "}
                      <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                        lbs
                      </span>
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                      Hundredweight (cwt)
                    </span>
                    <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      {(convVal * 19.6841).toFixed(1)}{" "}
                      <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                        cwt
                      </span>
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
