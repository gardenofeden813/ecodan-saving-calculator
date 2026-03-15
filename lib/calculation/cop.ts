import COP_TABLE from "../data/cop-reference.json";

export function interpolateCOP(t: number): number {
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
