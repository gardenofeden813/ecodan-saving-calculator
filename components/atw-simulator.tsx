"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Thermometer,
  DollarSign,
  Calendar,
  Wrench,
  ChevronRight,
  Leaf,
  TrendingUp,
  Clock,
  Award,
  Zap,
  Flame,
  Snowflake,
  Info,
  CheckCircle2,
} from "lucide-react";

// ─── PHYSICAL CONSTANTS ──────────────────────────────────────────────────────
const BTU_PER_THERM = 100_000;
const BTU_PER_KWH = 3_412;
const CO2_LB_PER_THERM = 11.7;
const CO2_LB_PER_KWH = 0.386;
const CO2_LB_PER_TON = 2000;

// COP lookup: [ambientF, cop] — ASHRAE cold-climate HP performance
const COP_TABLE: [number, number][] = [
  [-5, 1.5],
  [5, 1.8],
  [17, 2.5],
  [30, 3.1],
  [40, 3.6],
  [47, 4.0],
  [55, 4.5],
  [65, 5.0],
];

function interpolateCOP(t: number): number {
  if (t <= COP_TABLE[0][0]) return COP_TABLE[0][1];
  if (t >= COP_TABLE[COP_TABLE.length - 1][0])
    return COP_TABLE[COP_TABLE.length - 1][1];
  for (let i = 0; i < COP_TABLE.length - 1; i++) {
    const [t0, c0] = COP_TABLE[i];
    const [t1, c1] = COP_TABLE[i + 1];
    if (t >= t0 && t <= t1) return c0 + ((t - t0) / (t1 - t0)) * (c1 - c0);
  }
  return 3.0;
}

function estimateAFUE(age: number): number {
  if (age <= 5) return 0.96;
  if (age <= 10) return 0.9;
  if (age <= 15) return 0.85;
  if (age <= 20) return 0.8;
  if (age <= 25) return 0.78;
  return 0.75;
}

function estimateDesignTemp(zip: string): number {
  const p = parseInt(zip.substring(0, 3));
  if (p >= 995) return -10;
  if (p >= 967) return 65;
  if (p >= 320 && p <= 349) return 38;
  if (p >= 900 && p <= 961) return 40;
  if (p >= 970 && p <= 979) return 28;
  if (p >= 980 && p <= 994) return 20;
  if (p >= 590 && p <= 599) return -10;
  if (p >= 570 && p <= 577) return -5;
  if (p >= 560 && p <= 567) return -5;
  if (p >= 530 && p <= 549) return 5;
  if (p >= 460 && p <= 479) return 5;
  if (p >= 600 && p <= 629) return 0;
  if (p >= 430 && p <= 458) return 10;
  if (p >= 480 && p <= 499) return 8;
  if (p >= 100 && p <= 149) return 15;
  if (p >= 150 && p <= 196) return 10;
  if (p >= 10 && p <= 27) return 10;
  if (p >= 60 && p <= 69) return 10;
  if (p >= 30 && p <= 38) return -5;
  if (p >= 40 && p <= 49) return -10;
  if (p >= 50 && p <= 59) return -15;
  if (p >= 200 && p <= 219) return 20;
  if (p >= 220 && p <= 246) return 18;
  if (p >= 270 && p <= 289) return 25;
  if (p >= 290 && p <= 299) return 28;
  if (p >= 300 && p <= 319) return 30;
  if (p >= 350 && p <= 369) return 25;
  if (p >= 386 && p <= 397) return 22;
  if (p >= 700 && p <= 714) return 32;
  if (p >= 750 && p <= 799) return 25;
  if (p >= 800 && p <= 816) return 5;
  if (p >= 820 && p <= 831) return -5;
  if (p >= 840 && p <= 847) return 10;
  if (p >= 850 && p <= 865) return 35;
  if (p >= 870 && p <= 884) return 20;
  if (p >= 890 && p <= 898) return 25;
  return 17;
}

function zipToState(zip: string): string | null {
  const p = parseInt(zip.substring(0, 3));
  const m: [number[], string][] = [
    [[995, 999], "AK"],
    [[967, 968], "HI"],
    [[988, 994], "WA"],
    [[970, 979], "OR"],
    [[900, 961], "CA"],
    [[800, 816], "CO"],
    [[820, 831], "WY"],
    [[590, 599], "MT"],
    [[830, 838], "ID"],
    [[840, 847], "UT"],
    [[850, 865], "AZ"],
    [[870, 884], "NM"],
    [[890, 898], "NV"],
    [[750, 799], "TX"],
    [[700, 714], "LA"],
    [[716, 729], "AR"],
    [[730, 749], "OK"],
    [[660, 679], "KS"],
    [[680, 693], "NE"],
    [[570, 577], "SD"],
    [[580, 588], "ND"],
    [[560, 567], "MN"],
    [[530, 549], "WI"],
    [[600, 629], "IL"],
    [[460, 479], "IN"],
    [[480, 499], "MI"],
    [[430, 458], "OH"],
    [[400, 427], "KY"],
    [[370, 385], "TN"],
    [[386, 397], "MS"],
    [[350, 369], "AL"],
    [[300, 319], "GA"],
    [[320, 349], "FL"],
    [[290, 299], "SC"],
    [[270, 289], "NC"],
    [[240, 268], "WV"],
    [[200, 219], "MD"],
    [[220, 246], "VA"],
    [[150, 196], "PA"],
    [[197, 199], "DE"],
    [[70, 89], "NJ"],
    [[100, 149], "NY"],
    [[10, 27], "MA"],
    [[28, 29], "RI"],
    [[60, 69], "CT"],
    [[30, 38], "NH"],
    [[40, 49], "ME"],
    [[50, 59], "VT"],
    [[500, 528], "IA"],
    [[630, 658], "MO"],
  ];
  for (const [[lo, hi], st] of m) if (p >= lo && p <= hi) return st;
  return null;
}

// EIA 2024 residential prices
const SP: Record<string, { g: number; e: number }> = {
  AK: { g: 14.2, e: 0.228 },
  AL: { g: 15.1, e: 0.138 },
  AR: { g: 13.4, e: 0.112 },
  AZ: { g: 15.6, e: 0.142 },
  CA: { g: 22.8, e: 0.298 },
  CO: { g: 10.9, e: 0.148 },
  CT: { g: 24.2, e: 0.312 },
  DC: { g: 18.4, e: 0.188 },
  DE: { g: 16.2, e: 0.162 },
  FL: { g: 17.8, e: 0.148 },
  GA: { g: 16.2, e: 0.132 },
  HI: { g: 38.2, e: 0.438 },
  IA: { g: 10.8, e: 0.118 },
  ID: { g: 12.4, e: 0.098 },
  IL: { g: 12.2, e: 0.138 },
  IN: { g: 11.8, e: 0.142 },
  KS: { g: 10.6, e: 0.128 },
  KY: { g: 12.2, e: 0.118 },
  LA: { g: 14.8, e: 0.108 },
  MA: { g: 22.4, e: 0.288 },
  MD: { g: 16.8, e: 0.178 },
  ME: { g: 21.8, e: 0.258 },
  MI: { g: 12.8, e: 0.198 },
  MN: { g: 10.2, e: 0.148 },
  MO: { g: 11.4, e: 0.118 },
  MS: { g: 14.6, e: 0.122 },
  MT: { g: 12.8, e: 0.112 },
  NC: { g: 16.4, e: 0.128 },
  ND: { g: 9.8, e: 0.118 },
  NE: { g: 10.4, e: 0.128 },
  NH: { g: 20.8, e: 0.268 },
  NJ: { g: 17.6, e: 0.218 },
  NM: { g: 12.6, e: 0.138 },
  NV: { g: 13.4, e: 0.128 },
  NY: { g: 18.2, e: 0.228 },
  OH: { g: 11.8, e: 0.158 },
  OK: { g: 10.2, e: 0.118 },
  OR: { g: 14.8, e: 0.118 },
  PA: { g: 13.8, e: 0.168 },
  RI: { g: 22.0, e: 0.298 },
  SC: { g: 16.8, e: 0.138 },
  SD: { g: 10.8, e: 0.128 },
  TN: { g: 14.2, e: 0.118 },
  TX: { g: 13.8, e: 0.128 },
  UT: { g: 10.2, e: 0.108 },
  VA: { g: 16.2, e: 0.148 },
  VT: { g: 20.6, e: 0.218 },
  WA: { g: 12.8, e: 0.108 },
  WI: { g: 11.8, e: 0.158 },
  WV: { g: 13.2, e: 0.128 },
  WY: { g: 9.6, e: 0.098 },
};
const US_AVG = { g: 14.2, e: 0.168 };

function calcTaxCredit(cost: number): number {
  return Math.min(cost * 0.3, 2000);
}

interface CalcResult {
  afue: number;
  cop: number;
  dt: number;
  state: string | null;
  pr: { g: number; e: number };
  moTherms: string;
  moKwhHP: string;
  moGasCost: string;
  moHPCost: string;
  moSave: string;
  yrSave: number;
  mbtuGas: string;
  mbtuHP: string;
  yrCO2gas: string;
  yrCO2hp: string;
  yrCO2save: string;
  credit: number;
  netCost: number;
  payback: string;
  yd: Array<{
    year: number;
    cumulative: number;
    annual: number;
    gasCost: number;
    hpCost: number;
  }>;
  copCurve: Array<{ temp: number; cop: number; isDesign?: boolean }>;
  tenYr: number;
}

function runCalc(
  zip: string,
  bill: number,
  age: number,
  cost: number
): CalcResult {
  const afue = estimateAFUE(age);
  const dt = estimateDesignTemp(zip);
  const cop = interpolateCOP(dt);
  const state = zipToState(zip);
  const pr = SP[state || ""] || US_AVG;

  const moTherms = bill / pr.g;
  const moBtuGas = moTherms * BTU_PER_THERM * afue;
  const moKwhHP = moBtuGas / (BTU_PER_KWH * cop);
  const moGasCost = bill;
  const moHPCost = moKwhHP * pr.e;
  const moSave = moGasCost - moHPCost;
  const yrSave = moSave * 12;

  const mbtuGas = ((pr.g / BTU_PER_THERM) * 1e6) / afue;
  const mbtuHP = ((pr.e / BTU_PER_KWH) * 1e6) / cop;

  const yrCO2gas = (moTherms * 12 * CO2_LB_PER_THERM) / CO2_LB_PER_TON;
  const yrCO2hp = (moKwhHP * 12 * CO2_LB_PER_KWH) / CO2_LB_PER_TON;
  const yrCO2save = yrCO2gas - yrCO2hp;

  const credit = calcTaxCredit(cost);
  const netCost = cost - credit;
  const payback = yrSave > 0 ? netCost / yrSave : Infinity;

  let cum = -netCost;
  const yd = [
    { year: 0, cumulative: Math.round(-netCost), annual: 0, gasCost: 0, hpCost: 0 },
  ];
  for (let i = 1; i <= 10; i++) {
    const f = Math.pow(1.02, i - 1);
    const s = yrSave * f;
    cum += s;
    yd.push({
      year: i,
      cumulative: Math.round(cum),
      annual: Math.round(s),
      gasCost: Math.round(moGasCost * 12 * f),
      hpCost: Math.round(moHPCost * 12 * f),
    });
  }

  const copCurve = [
    ...COP_TABLE.map(([t, c]) => ({ temp: t, cop: parseFloat(c.toFixed(2)) })),
    { temp: dt, cop: parseFloat(cop.toFixed(2)), isDesign: true },
  ].sort((a, b) => a.temp - b.temp);

  return {
    afue,
    cop,
    dt,
    state,
    pr,
    moTherms: moTherms.toFixed(1),
    moKwhHP: moKwhHP.toFixed(1),
    moGasCost: moGasCost.toFixed(2),
    moHPCost: moHPCost.toFixed(2),
    moSave: moSave.toFixed(2),
    yrSave: Math.round(yrSave),
    mbtuGas: mbtuGas.toFixed(2),
    mbtuHP: mbtuHP.toFixed(2),
    yrCO2gas: yrCO2gas.toFixed(2),
    yrCO2hp: yrCO2hp.toFixed(2),
    yrCO2save: yrCO2save.toFixed(2),
    credit: Math.round(credit),
    netCost: Math.round(netCost),
    payback: isFinite(payback) ? payback.toFixed(1) : "N/A",
    yd,
    copCurve,
    tenYr: yd[10].cumulative,
  };
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function ATWSimulator() {
  const [zip, setZip] = useState("");
  const [bill, setBill] = useState("");
  const [age, setAge] = useState("15");
  const [cost, setCost] = useState("12000");
  const [res, setRes] = useState<CalcResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"savings" | "annual" | "cop">("savings");

  const valid = /^\d{5}$/.test(zip) && parseFloat(bill) > 0 && parseFloat(cost) > 0;

  const preview = useMemo(() => {
    if (zip.length !== 5) return null;
    const dt = estimateDesignTemp(zip);
    const cop = interpolateCOP(dt);
    const state = zipToState(zip);
    const pr = state ? SP[state] : null;
    const afue = estimateAFUE(parseInt(age) || 15);
    return { dt, cop, state, pr, afue };
  }, [zip, age]);

  const run = () => {
    if (!valid) return;
    setBusy(true);
    setTimeout(() => {
      setRes(runCalc(zip, parseFloat(bill), parseInt(age), parseFloat(cost)));
      setBusy(false);
    }, 600);
  };

  const TABS = [
    { id: "savings" as const, label: "10-Year Savings" },
    { id: "annual" as const, label: "Annual Costs" },
    { id: "cop" as const, label: "COP Curve" },
  ];

  const tooltipStyles = {
    contentStyle: {
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 8,
      fontSize: 12,
      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    },
  };

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="bg-secondary text-white">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary sm:h-12 sm:w-12">
              <Thermometer className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight sm:text-xl">
                Ecodan Savings Calculator
              </h1>
              <p className="text-xs text-gray-400 sm:text-sm">
                Air-to-Water Heat Pump Cost Analysis
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        {/* Input Section */}
        <section className="mb-6 rounded-xl bg-white p-4 shadow-sm sm:mb-8 sm:p-6">
          <div className="mb-4 flex items-center gap-2 sm:mb-6">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white sm:h-8 sm:w-8 sm:text-sm">
              1
            </div>
            <h2 className="text-base font-semibold text-secondary sm:text-lg">
              Enter Your Information
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* ZIP Code */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-muted">
                <Thermometer className="h-4 w-4" />
                ZIP Code
              </label>
              <input
                type="text"
                value={zip}
                maxLength={5}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 02134"
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 sm:text-base"
              />
            </div>

            {/* Monthly Gas Bill */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-muted">
                <DollarSign className="h-4 w-4" />
                Monthly Gas Bill
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                  $
                </span>
                <input
                  type="number"
                  value={bill}
                  onChange={(e) => setBill(e.target.value)}
                  placeholder="175"
                  className="w-full rounded-lg border border-border bg-white py-2.5 pl-7 pr-3 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 sm:text-base"
                />
              </div>
            </div>

            {/* Boiler Age */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-muted">
                <Calendar className="h-4 w-4" />
                Boiler Age
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="15"
                  className="w-full rounded-lg border border-border bg-white py-2.5 pl-3 pr-12 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 sm:text-base"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
                  years
                </span>
              </div>
            </div>

            {/* Install Cost */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-muted">
                <Wrench className="h-4 w-4" />
                Install Cost
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                  $
                </span>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="12000"
                  className="w-full rounded-lg border border-border bg-white py-2.5 pl-7 pr-3 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 sm:text-base"
                />
              </div>
            </div>
          </div>

          {/* Live Preview */}
          {preview && (
            <div className="mt-4 rounded-lg bg-surface-50 p-3 sm:mt-5 sm:p-4">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted">
                <Info className="h-3.5 w-3.5" />
                Location-Based Estimates
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs sm:gap-x-6 sm:text-sm">
                <span>
                  <span className="text-muted">State:</span>{" "}
                  <span className="font-semibold text-secondary">
                    {preview.state || "N/A"}
                  </span>
                </span>
                <span>
                  <span className="text-muted">Design Temp:</span>{" "}
                  <span className="font-semibold text-secondary">
                    {preview.dt}°F
                  </span>
                </span>
                <span>
                  <span className="text-muted">Seasonal COP:</span>{" "}
                  <span className="font-semibold text-accent">
                    {preview.cop.toFixed(2)}
                  </span>
                </span>
                <span>
                  <span className="text-muted">Boiler AFUE:</span>{" "}
                  <span className="font-semibold text-secondary">
                    {(preview.afue * 100).toFixed(0)}%
                  </span>
                </span>
                {preview.pr && (
                  <>
                    <span>
                      <span className="text-muted">Gas:</span>{" "}
                      <span className="font-semibold text-secondary">
                        ${preview.pr.g}/therm
                      </span>
                    </span>
                    <span>
                      <span className="text-muted">Electric:</span>{" "}
                      <span className="font-semibold text-secondary">
                        ${preview.pr.e}/kWh
                      </span>
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Calculate Button */}
          <button
            onClick={run}
            disabled={!valid || busy}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 sm:mt-6 sm:py-3.5 sm:text-base"
          >
            {busy ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Calculating...
              </>
            ) : (
              <>
                Calculate Savings
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </section>

        {/* Results Section */}
        {res && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-3">
              {[
                {
                  icon: DollarSign,
                  label: "Annual Savings",
                  value: `$${res.yrSave.toLocaleString()}`,
                  sub: "First year",
                  color: "text-success",
                  bg: "bg-success/10",
                },
                {
                  icon: TrendingUp,
                  label: "10-Year Net",
                  value: `$${Math.max(0, res.tenYr).toLocaleString()}`,
                  sub: "After install cost",
                  color: "text-accent",
                  bg: "bg-accent/10",
                },
                {
                  icon: Clock,
                  label: "Payback Period",
                  value: `${res.payback} yr`,
                  sub: "Incl. tax credit",
                  color: "text-warning",
                  bg: "bg-warning/10",
                },
                {
                  icon: Leaf,
                  label: "CO₂ Avoided",
                  value: `${res.yrCO2save} t`,
                  sub: "Tons per year",
                  color: "text-success",
                  bg: "bg-success/10",
                },
                {
                  icon: Award,
                  label: "IRA Tax Credit",
                  value: `$${res.credit.toLocaleString()}`,
                  sub: "30%, max $2,000",
                  color: "text-primary",
                  bg: "bg-primary/10",
                },
                {
                  icon: Zap,
                  label: "Seasonal COP",
                  value: res.cop.toFixed(2),
                  sub: `At ${res.dt}°F`,
                  color: "text-accent",
                  bg: "bg-accent/10",
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-xl bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:p-4"
                >
                  <div
                    className={`mb-2 inline-flex rounded-lg p-1.5 sm:mb-3 sm:p-2 ${kpi.bg}`}
                  >
                    <kpi.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${kpi.color}`} />
                  </div>
                  <div className="mb-0.5 text-xs text-muted sm:text-sm">
                    {kpi.label}
                  </div>
                  <div
                    className={`text-lg font-bold sm:text-2xl ${kpi.color}`}
                  >
                    {kpi.value}
                  </div>
                  <div className="text-[10px] text-muted-foreground sm:text-xs">
                    {kpi.sub}
                  </div>
                </div>
              ))}
            </div>

            {/* Cost Comparison */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:grid-cols-2">
              <div className="rounded-xl border-2 border-orange-200 bg-white p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="rounded-lg bg-orange-100 p-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-secondary">
                      Gas Boiler
                    </div>
                    <div className="text-xs text-muted">
                      AFUE {(res.afue * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-orange-500 sm:text-3xl">
                  ${res.mbtuGas}
                </div>
                <div className="text-xs text-muted">per million BTU delivered</div>
              </div>

              <div className="rounded-xl border-2 border-accent/30 bg-white p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="rounded-lg bg-accent/10 p-2">
                    <Snowflake className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-secondary">
                      ATW Heat Pump
                    </div>
                    <div className="text-xs text-muted">
                      COP {res.cop.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-accent sm:text-3xl">
                  ${res.mbtuHP}
                </div>
                <div className="text-xs text-muted">per million BTU delivered</div>
              </div>
            </div>

            {/* Chart Section */}
            <div className="mb-6 rounded-xl bg-white p-4 shadow-sm sm:mb-8 sm:p-6">
              {/* Tabs */}
              <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg bg-surface-100 p-1 sm:mb-6">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex-1 whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-all sm:text-sm ${
                      tab === t.id
                        ? "bg-white text-secondary shadow-sm"
                        : "text-muted hover:text-secondary"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Charts */}
              <div className="h-64 sm:h-80">
                {tab === "savings" && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={res.yd}
                      margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
                    >
                      <defs>
                        <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00A0E4" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00A0E4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="year"
                        tick={{ fill: "#6b7280", fontSize: 11 }}
                        axisLine={{ stroke: "#e5e7eb" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#6b7280", fontSize: 11 }}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                        axisLine={{ stroke: "#e5e7eb" }}
                        tickLine={false}
                      />
                      <Tooltip
                        {...tooltipStyles}
                        formatter={(v: number) => [`$${v.toLocaleString()}`, "Net Savings"]}
                        labelFormatter={(l) => `Year ${l}`}
                      />
                      <ReferenceLine
                        y={0}
                        stroke="#f59e0b"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="cumulative"
                        stroke="#00A0E4"
                        strokeWidth={2}
                        fill="url(#savingsGrad)"
                        dot={{ fill: "#00A0E4", r: 3, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}

                {tab === "annual" && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={res.yd.slice(1)}
                      margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="year"
                        tick={{ fill: "#6b7280", fontSize: 11 }}
                        axisLine={{ stroke: "#e5e7eb" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#6b7280", fontSize: 11 }}
                        tickFormatter={(v) => `$${v.toLocaleString()}`}
                        axisLine={{ stroke: "#e5e7eb" }}
                        tickLine={false}
                      />
                      <Tooltip
                        {...tooltipStyles}
                        formatter={(v: number, n: string) => [
                          `$${v.toLocaleString()}`,
                          n === "gasCost" ? "Gas Boiler" : "Heat Pump",
                        ]}
                      />
                      <Legend
                        formatter={(v) => (v === "gasCost" ? "Gas Boiler" : "Heat Pump")}
                        wrapperStyle={{ fontSize: 12 }}
                      />
                      <Bar dataKey="gasCost" fill="#f97316" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="hpCost" fill="#00A0E4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {tab === "cop" && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={res.copCurve}
                      margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="temp"
                        tick={{ fill: "#6b7280", fontSize: 11 }}
                        axisLine={{ stroke: "#e5e7eb" }}
                        tickLine={false}
                        label={{
                          value: "Ambient °F",
                          position: "insideBottom",
                          offset: -5,
                          fill: "#6b7280",
                          fontSize: 11,
                        }}
                      />
                      <YAxis
                        domain={[1, 5.5]}
                        tick={{ fill: "#6b7280", fontSize: 11 }}
                        axisLine={{ stroke: "#e5e7eb" }}
                        tickLine={false}
                      />
                      <Tooltip
                        {...tooltipStyles}
                        formatter={(v: number) => [v.toFixed(2), "COP"]}
                        labelFormatter={(l) => `${l}°F`}
                      />
                      <ReferenceLine
                        x={res.dt}
                        stroke="#f59e0b"
                        strokeDasharray="5 5"
                      />
                      <Line
                        type="monotone"
                        dataKey="cop"
                        stroke="#00A0E4"
                        strokeWidth={2}
                        dot={(props) => {
                          const d = props.payload;
                          return d.isDesign ? (
                            <circle
                              key={props.index}
                              cx={props.cx}
                              cy={props.cy}
                              r={8}
                              fill="#f59e0b"
                              stroke="#fff"
                              strokeWidth={2}
                            />
                          ) : (
                            <circle
                              key={props.index}
                              cx={props.cx}
                              cy={props.cy}
                              r={4}
                              fill="#00A0E4"
                              strokeWidth={0}
                            />
                          );
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {tab === "cop" && (
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted sm:text-sm">
                  <span className="inline-block h-3 w-3 rounded-full bg-warning" />
                  Design temp: {res.dt}°F → COP {res.cop.toFixed(2)}
                </div>
              )}
            </div>

            {/* Technical Breakdown */}
            <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <h3 className="font-semibold text-secondary">Technical Breakdown</h3>
              </div>

              <div className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ["Monthly gas use", `${res.moTherms} therms`],
                  ["Monthly HP electricity", `${res.moKwhHP} kWh`],
                  ["Monthly gas cost", `$${res.moGasCost}`],
                  ["Monthly HP cost", `$${res.moHPCost}`],
                  ["Monthly savings", `$${res.moSave}`],
                  ["State / region", res.state || "US Avg"],
                  ["Gas price (EIA 2024)", `$${res.pr.g}/therm`],
                  ["Electricity price", `$${res.pr.e}/kWh`],
                  ["Gross system cost", `$${parseFloat(cost).toLocaleString()}`],
                  ["IRA 25C (30%)", `-$${res.credit.toLocaleString()}`],
                  ["Net install cost", `$${res.netCost.toLocaleString()}`],
                  ["Annual CO₂ — gas", `${res.yrCO2gas} t`],
                  ["Annual CO₂ — HP", `${res.yrCO2hp} t`],
                  ["CO₂ reduction", `${res.yrCO2save} t/yr`],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between border-b border-border py-2"
                  >
                    <span className="text-muted">{k}</span>
                    <span className="font-medium text-secondary">{v}</span>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                Prices: EIA 2024 residential by state. AFUE: ENERGY STAR age table.
                COP: ASHRAE cold-climate interpolation. CO₂: 11.7 lb/therm (EPA),
                0.386 lb/kWh (eGRID 2023). IRA §25C: 30% credit, max $2,000/yr.
              </p>
            </div>
          </section>
        )}

        {/* Empty State */}
        {!res && !busy && (
          <div className="py-12 text-center sm:py-16">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100">
              <Thermometer className="h-8 w-8 text-muted" />
            </div>
            <p className="text-muted">
              Enter your ZIP code and monthly gas bill to see your potential savings.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white py-4 sm:py-6">
        <div className="mx-auto max-w-5xl px-4 text-center text-xs text-muted">
          <p>
            Ecodan Heat Pump Savings Calculator. Estimates based on EIA 2024
            residential energy prices and ASHRAE performance data.
          </p>
        </div>
      </footer>
    </div>
  );
}
