"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CalcResult } from "@/lib/calculation/types";

interface AnnualCostChartProps {
  data: CalcResult["yd"];
}

const tooltipStyles = {
  contentStyle: {
    backgroundColor: "#1f2937",
    border: "1px solid #374151",
    borderRadius: "8px",
    padding: "8px 12px",
  },
  labelStyle: { color: "#f3f4f6", fontSize: 12 },
  itemStyle: { fontSize: 12 },
};

export function AnnualCostChart({ data }: AnnualCostChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
      >
        <defs>
          <linearGradient id="gasGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="hpGrad" x1="0" y1="0" x2="0" y2="1">
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
          formatter={(v: number) => `$${v.toLocaleString()}`}
          labelFormatter={(l) => `Year ${l}`}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="gasCost"
          stackId="1"
          stroke="#f97316"
          fill="url(#gasGrad)"
          name="Gas Cost"
        />
        <Area
          type="monotone"
          dataKey="hpCost"
          stackId="1"
          stroke="#00A0E4"
          fill="url(#hpGrad)"
          name="HP Cost"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
