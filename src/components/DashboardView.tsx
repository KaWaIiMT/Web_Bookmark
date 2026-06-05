"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { PieChart as PieChartIcon, BarChart3, Tags } from "lucide-react";
import { WordCloud } from "@/components/WordCloud";
import type { StatsResponse } from "@/app/api/stats/route";

const STATUS_COLORS: Record<string, string> = {
  unread: "#d4a853",
  reading: "#b76e4b",
  read: "#7a9e7e",
  archived: "#9e9e9e",
};

const STATUS_LABELS: Record<string, string> = {
  unread: "待读",
  reading: "在读",
  read: "已读",
  archived: "归档",
};

const TYPE_COLORS: Record<string, string> = {
  video: "#b76e4b",
  article: "#d4a853",
  repository: "#7a9e7e",
  image: "#c9866b",
  social: "#a08bbd",
  webpage: "#9e9e9e",
};

const TYPE_LABELS: Record<string, string> = {
  video: "视频",
  article: "文章",
  repository: "仓库",
  image: "图片",
  social: "社交",
  webpage: "网页",
};

export function DashboardView() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)] animate-spin" />
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <p className="text-[15px] font-semibold text-[var(--foreground)] font-display">
          还没有数据
        </p>
        <p className="text-[13px] text-[var(--muted-foreground)] mt-1.5 font-sans">
          添加书签后，这里将展示数据可视化仪表板
        </p>
      </div>
    );
  }

  const statusData = [
    { name: "待读", value: data.unread, color: STATUS_COLORS.unread },
    { name: "在读", value: data.reading, color: STATUS_COLORS.reading },
    { name: "已读", value: data.read, color: STATUS_COLORS.read },
    { name: "归档", value: data.archived, color: STATUS_COLORS.archived },
  ].filter((d) => d.value > 0);

  const typeData = (data.byContentType || []).map((c) => ({
    name: TYPE_LABELS[c.type] || c.type,
    value: c.count,
    color: TYPE_COLORS[c.type] || "#9e9e9e",
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      {/* Status pie chart */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon className="h-4 w-4 text-[var(--accent)]" />
          <h3 className="text-[14px] font-semibold text-[var(--foreground)] font-sans">状态分布</h3>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {statusData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                fontSize: "13px",
                fontFamily: "var(--font-sans)",
              }}
              formatter={(_value: any, name: any) => [`${_value} 条`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-2">
          {statusData.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)] font-sans">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.name} ({s.value})
            </div>
          ))}
        </div>
      </div>

      {/* Content type bar chart */}
      {typeData.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-[var(--accent)]" />
            <h3 className="text-[14px] font-semibold text-[var(--foreground)] font-sans">内容类型</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={typeData} layout="vertical" margin={{ left: 40 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
                {typeData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tag word cloud */}
      {data.topTags.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Tags className="h-4 w-4 text-[var(--accent)]" />
            <h3 className="text-[14px] font-semibold text-[var(--foreground)] font-sans">热门标签</h3>
          </div>
          <WordCloud tags={data.topTags} maxFontSize={30} />
        </div>
      )}
    </div>
  );
}
