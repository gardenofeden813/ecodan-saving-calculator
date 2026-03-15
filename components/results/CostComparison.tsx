"use client";

import { Flame, Snowflake } from "lucide-react";
import { CalcResult } from "@/lib/calculation/types";

interface CostComparisonProps {
  res: CalcResult;
}

export function CostComparison({ res }: CostComparisonProps) {
  return (
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
  );
}
