import { BTU_PER_THERM, BTU_PER_KWH, CO2_LB_PER_THERM, CO2_LB_PER_KWH, CO2_LB_PER_TON, estimateAFUE, estimateDesignTemp, zipToState, getEnergyPrices } from "./energy";
import { interpolateCOP } from "./cop";
import { CalcResult } from "./types";

export function calcTaxCredit(cost: number): number {
  return Math.min(cost * 0.3, 2000);
}

export function runCalc(
  zip: string,
  bill: number,
  age: number,
  cost: number
): CalcResult {
  const afue = estimateAFUE(age);
  const dt = estimateDesignTemp(zip);
  const cop = interpolateCOP(dt);
  const state = zipToState(zip);
  const pr = getEnergyPrices(state);

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
    // COP_TABLEはcop.tsから直接インポートせず、interpolateCOP関数を通して利用する
    // ここでは表示用にCOP_TABLEのデータポイントを再構築する
    ...([[-5, 1.5], [5, 1.8], [17, 2.5], [30, 3.1], [40, 3.6], [47, 4.0], [55, 4.5], [65, 5.0]] as [number, number][]).map(([t, c]) => ({ temp: t, cop: parseFloat(c.toFixed(2)) })),
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
