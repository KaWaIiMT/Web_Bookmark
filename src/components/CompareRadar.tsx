"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { RADAR_COLORS } from "@/lib/comparisons";

interface CompareRadarProps {
  data: { dimension: string; [label: string]: string | number }[];
  labels: string[];
}

export function CompareRadar({ data, labels }: CompareRadarProps) {
  if (data.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-sm p-5">
      <h3 className="text-[14px] font-semibold text-[var(--foreground)] mb-4 font-display">
        📊 多维度评分对比
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fontSize: 12, fill: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 5]}
            tick={{ fontSize: 10, fill: "var(--foreground)/20" }}
            axisLine={false}
          />
          {labels.map((label, i) => (
            <Radar
              key={label}
              name={label}
              dataKey={label}
              stroke={RADAR_COLORS[i % RADAR_COLORS.length]}
              fill={RADAR_COLORS[i % RADAR_COLORS.length]}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              fontSize: "13px",
              fontFamily: "var(--font-sans)",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", fontFamily: "var(--font-sans)" }}
            iconType="circle"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
