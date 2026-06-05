"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Bookmark, BookOpen, CheckCircle2, CalendarDays } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { WordCloud } from "@/components/WordCloud";
import type { WeeklyReportData } from "@/lib/types";

export function WeeklyReport() {
  const [data, setData] = useState<WeeklyReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats/weekly")
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

  if (!data || data.thisWeek.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <CalendarDays className="h-12 w-12 text-[var(--foreground)]/10 mb-4" />
        <p className="text-[15px] font-semibold text-[var(--foreground)] font-display">
          本周尚无书签
        </p>
        <p className="text-[13px] text-[var(--muted-foreground)] mt-1.5 font-sans">
          添加书签后，下周将生成周报
        </p>
      </div>
    );
  }

  const { thisWeek, lastWeek, comparison, weekLabel } = data;
  const isUp = comparison.delta > 0;
  const isSame = comparison.delta === 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-2">
      <motion.div
        className="rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-sm p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-[20px] font-semibold text-[var(--foreground)] font-display">
            本周书签报告
          </h2>
          <p className="text-[12px] text-[var(--muted-foreground)] mt-1 font-sans">
            {weekLabel}
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard
            icon={Bookmark}
            label="本周新增"
            value={thisWeek.total}
            color="var(--accent)"
          />
          <StatCard
            icon={BookOpen}
            label="在读"
            value={thisWeek.byStatus.reading}
            color="#b76e4b"
          />
          <StatCard
            icon={CheckCircle2}
            label="已读"
            value={thisWeek.byStatus.read}
            color="#7a9e7e"
          />
        </div>

        {/* Week-over-week comparison */}
        <div className="rounded-xl bg-[var(--muted)] p-4 flex items-center justify-between mb-6">
          <div>
            <p className="text-[11px] text-[var(--muted-foreground)] uppercase tracking-widest font-sans">
              较上周
            </p>
            <div className="flex items-center gap-2 mt-1">
              {isSame ? (
                <span className="text-[15px] font-semibold text-[var(--muted-foreground)] font-display">
                  持平
                </span>
              ) : (
                <>
                  <span className={`text-[20px] font-bold font-display ${isUp ? "text-emerald-500" : "text-red-400"}`}>
                    {isUp ? "+" : ""}{comparison.delta}
                  </span>
                  <span className={`text-[13px] font-medium font-sans ${isUp ? "text-emerald-500" : "text-red-400"}`}>
                    ({isUp ? "+" : ""}{comparison.percentage}%)
                  </span>
                </>
              )}
              {isUp ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : !isSame ? (
                <TrendingDown className="h-4 w-4 text-red-400" />
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[var(--muted-foreground)] font-sans">上周新增</p>
            <p className="text-[17px] font-semibold text-[var(--foreground)] font-display">{lastWeek.total}</p>
          </div>
        </div>

        {/* Top tags */}
        {thisWeek.topTags.length > 0 && (
          <div className="mb-6">
            <p className="text-[11px] font-medium text-[var(--muted-foreground)] uppercase tracking-widest mb-3 font-sans">
              本周热门标签
            </p>
            <WordCloud tags={thisWeek.topTags} maxFontSize={26} />
          </div>
        )}
      </motion.div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Bookmark;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-[var(--muted)] p-3.5 text-center">
      <Icon className="h-4 w-4 mx-auto mb-1.5" style={{ color }} />
      <div className="text-[20px] font-bold font-display" style={{ color }}>
        {value}
      </div>
      <div className="text-[10px] text-[var(--muted-foreground)] font-sans">{label}</div>
    </div>
  );
}
