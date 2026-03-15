"use client";

import {
  DollarSign,
  TrendingUp,
  Clock,
  Leaf,
  Award,
  Zap,
} from "lucide-react";
import { CalcResult } from "@/lib/calculation/types";

interface KPICardsProps {
  res: CalcResult;
}

export function KPICards({ res }: KPICardsProps) {
  const kpis = [
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
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-3">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="rounded-xl bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:p-4"
        >
          <div className={`mb-2 inline-flex rounded-lg p-1.5 sm:mb-3 sm:p-2 ${kpi.bg}`}>
            <kpi.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${kpi.color}`} />
          </div>
          <div className="mb-0.5 text-xs text-muted sm:text-sm">
            {kpi.label}
          </div>
          <div className={`text-lg font-bold sm:text-2xl ${kpi.color}`}>
            {kpi.value}
          </div>
          <div className="text-[10px] text-muted-foreground sm:text-xs">
            {kpi.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
