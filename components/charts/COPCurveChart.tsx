"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { CalcResult } from "@/lib/calculation/types";

interface COPCurveChartProps {
  data: CalcResult["copCurve"];
}

const tooltipStyles = {
  contentStyle: {
    backgroundColor: "#1f2937",
    border: "1px solid #374151",
    borderRadius: "8px",
    padding: "8px 12px",
  },
  labelStyle: { color: "#f3f4f6", fontSize: 12 },
  itemStyle: { color: "#00A0E4", fontSize: 12 },
};

export function COPCurveChart({ data }: COPCurveChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="temp"
          label={{ value: "Ambient Temp (°F)", position: "insideBottomRight", offset: -5 }}
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={{ stroke: "#e5e7eb" }}
          tickLine={false}
        />
        <YAxis
          label={{ value: "COP", angle: -90, position: "insideLeft" }}
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={{ stroke: "#e5e7eb" }}
          tickLine={false}
        />
        <Tooltip
          {...tooltipStyles}
          formatter={(v: number) => v.toFixed(2)}
          labelFormatter={(l) => `${l}°F`}
        />
        <Line
          type="monotone"
          dataKey="cop"
          stroke="#00A0E4"
          strokeWidth={2}
          dot={(props) => {
            const { cx, cy, payload } = props;
            if (payload.isDesign) {
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill="#f59e0b"
                  stroke="#fff"
                  strokeWidth={2}
                />
              );
            }
            return <circle cx={cx} cy={cy} r={3} fill="#00A0E4" />;
          }}
        />
        <ReferenceLine
          x={17}
          stroke="#9ca3af"
          strokeDasharray="5 5"
          label={{ value: "Design Temp", position: "top", fill: "#6b7280", fontSize: 11 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
