import fuelPricesData from "../data/fuel-price.json";
import electricityPricesData from "../data/electricity-price.json";

// ─── PHYSICAL CONSTANTS ──────────────────────────────────────────────────────
export const BTU_PER_THERM = 100_000;
export const BTU_PER_KWH = 3_412;
export const CO2_LB_PER_THERM = 11.7;
export const CO2_LB_PER_KWH = 0.386;
export const CO2_LB_PER_TON = 2000;

export function estimateAFUE(age: number): number {
  if (age <= 5) return 0.96;
  if (age <= 10) return 0.9;
  if (age <= 15) return 0.85;
  if (age <= 20) return 0.8;
  if (age <= 25) return 0.78;
  return 0.75;
}

export function estimateDesignTemp(zip: string): number {
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

export function zipToState(zip: string): string | null {
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

export function getEnergyPrices(state: string | null): { g: number; e: number } {
  const fuelPrices = fuelPricesData as Record<string, number>;
  const electricityPrices = electricityPricesData as Record<string, number>;

  const gasPrice = state && fuelPrices[state] !== undefined ? fuelPrices[state] : fuelPrices["US_AVG"];
  const electricityPrice = state && electricityPrices[state] !== undefined ? electricityPrices[state] : electricityPrices["US_AVG"];

  return { g: gasPrice, e: electricityPrice };
}
