export interface CalcResult {
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
