"use client";

import { useState, useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { runCalc } from "@/lib/calculation/cost";
import { estimateDesignTemp, estimateAFUE, zipToState, getEnergyPrices } from "@/lib/calculation/energy";
import { interpolateCOP } from "@/lib/calculation/cop";
import { CalcResult } from "@/lib/calculation/types";
import { InputForm } from "./inputs/InputForm";
import { KPICards } from "./results/KPICards";
import { CostComparison } from "./results/CostComparison";
import { SavingsChart } from "./charts/SavingsChart";
import { AnnualCostChart } from "./charts/AnnualCostChart";
import { COPCurveChart } from "./charts/COPCurveChart";

const TABS = [
  { id: "savings", label: "10-Year Savings" },
  { id: "annual", label: "Annual Cost" },
  { id: "cop", label: "COP Curve" },
] as const;

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
    const pr = state ? getEnergyPrices(state) : null;
    const afue = estimateAFUE(parseInt(age) || 15);
    return { dt, cop, state, pr, afue };
  }, [zip, age]);

  const run = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      const result = runCalc(
        zip,
        parseFloat(bill),
        parseInt(age) || 15,
        parseInt(cost) || 12000
      );
      setRes(result);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center sm:mb-12">
          <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">
            Ecodan Savings Calculator
          </h1>
          <p className="text-sm text-gray-300 sm:text-base">
            Estimate your energy savings and ROI with Mitsubishi Ecodan heat pump
          </p>
        </div>

        {/* Main Container */}
        <div className="space-y-6 sm:space-y-8">
          {/* Input Section */}
          <section className="rounded-2xl bg-white p-4 shadow-lg sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-secondary sm:mb-5 sm:text-xl">
              Your Details
            </h2>
            <InputForm
              zip={zip}
              setZip={setZip}
              bill={bill}
              setBill={setBill}
              age={age}
              setAge={setAge}
              cost={cost}
              setCost={setCost}
              preview={preview}
            />

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
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 sm:space-y-8">
              {/* KPI Cards */}
              <KPICards res={res} />

              {/* Cost Comparison */}
              <CostComparison res={res} />

              {/* Chart Section */}
              <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
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
                  {tab === "savings" && <SavingsChart data={res.yd} />}
                  {tab === "annual" && <AnnualCostChart data={res.yd} />}
                  {tab === "cop" && <COPCurveChart data={res.copCurve} />}
                </div>
              </div>

              {/* Technical Breakdown */}
              <div
                style={{
                  background: "rgba(8,18,38,.88)",
                  border: "1px solid rgba(56,189,248,.08)",
                  borderRadius: 14,
                  padding: "16px 20px",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Space Mono',monospace",
                    fontSize: 9,
                    color: "#2e5070",
                    letterSpacing: ".1em",
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  Technical Breakdown
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
                    gap: "6px 24px",
                  }}
                >
                  {[
                    ["Monthly gas use", `${res.moTherms} therms`],
                    ["Monthly HP electricity", `${res.moKwhHP} kWh`],
                    ["Monthly gas cost", `$${res.moGasCost}`],
                    ["Monthly HP cost", `$${res.moHPCost}`],
                    ["Monthly savings", `$${res.moSave}`],
                    ["State / region", res.state || "US Avg"],
                    ["Gas price (EIA 2024)", `$${res.pr.g}/therm`],
                    ["Electricity price", `$${res.pr.e}/kWh`],
                    ["Gross system cost", `$${parseInt(cost).toLocaleString()}`],
                    ["IRA 25C (30%)", `-$${res.credit.toLocaleString()}`],
                    ["Net install cost", `$${res.netCost.toLocaleString()}`],
                    ["Annual CO₂ — gas", `${res.yrCO2gas} t`],
                    ["Annual CO₂ — HP", `${res.yrCO2hp} t`],
                    ["CO₂ reduction", `${res.yrCO2save} t/yr`],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        borderBottom: "1px solid rgba(56,189,248,.045)",
                        paddingBottom: 5,
                        paddingTop: 2,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Space Mono',monospace",
                          fontSize: 10,
                          color: "#1e3a5a",
                        }}
                      >
                        {k}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Space Mono',monospace",
                          fontSize: 10,
                          color: "#7dd3fc",
                          fontWeight: 700,
                        }}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
                <p
                  style={{
                    marginTop: 13,
                    fontFamily: "'Space Mono',monospace",
                    fontSize: 9,
                    color: "#1a3050",
                    lineHeight: 1.75,
                  }}
                >
                  Prices: EIA 2024 residential by state · AFUE: ENERGY STAR age table ·
                  COP: ASHRAE cold-climate interpolation · CO₂: 11.7 lb/therm (EPA), 0.386 lb/kWh (eGRID 2023) ·
                  IRA §25C: 30% credit, max $2,000/yr.
                </p>
              </div>
            </section>
          )}

          {!res && !busy && (
            <p
              style={{
                textAlign: "center",
                fontFamily: "'Space Mono',monospace",
                fontSize: 11,
                color: "#1a3050",
                padding: "52px 0",
              }}
            >
              Enter your ZIP code and monthly gas bill to begin.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
