"use client";

import { useState, useEffect } from "react";
import { TrendingUp, RefreshCw, ChartLine, ExternalLink } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { TrackingSparkline } from "@/components/TrackingSparkline";
import { toast } from "sonner";

interface TrackerData {
  id: string;
  bookmarkId: string;
  sourceType: string;
  enabled: boolean;
  lastCheckedAt: string | null;
  bookmark: {
    id: string;
    title: string;
    url: string;
    favicon: string | null;
    coverImage: string | null;
  };
  snapshots: {
    id: string;
    timestamp: string;
    stars: number | null;
    forks: number | null;
    openIssues: number | null;
    views: number | null;
    likes: number | null;
  }[];
  _count: { snapshots: number };
}

export function ActivityView() {
  const [trackers, setTrackers] = useState<TrackerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  const fetchTrackers = () => {
    fetch("/api/tracking/configs")
      .then((r) => r.json())
      .then((d) => setTrackers(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTrackers(); }, []);

  const handleRefresh = async (bookmarkId: string) => {
    setRefreshing(bookmarkId);
    try {
      const res = await fetch(`/api/tracking/${bookmarkId}/snapshots`, { method: "POST" });
      const data = await res.json();
      if (data.changed) {
        toast.success("热度数据已更新");
        fetchTrackers();
      } else {
        toast.success("暂无变化");
      }
    } catch {
      toast.error("刷新失败");
    } finally {
      setRefreshing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-2 px-4 py-1.5 rounded-full bg-[var(--accent)]/10">
          <TrendingUp className="h-4 w-4 text-[var(--accent)]" />
          <span className="text-[13px] font-medium text-[var(--accent)] font-sans">热度追踪</span>
        </div>
        <h2 className="text-[20px] font-semibold text-[var(--foreground)] font-display">
          让书签「活」起来
        </h2>
        <p className="text-[13px] text-[var(--muted-foreground)] mt-1 font-sans">
          追踪 GitHub 仓库的 star 增长、B 站视频的播放变化
        </p>
      </div>

      {trackers.length === 0 ? (
        <div className="text-center py-20">
          <ChartLine className="h-12 w-12 text-[var(--foreground)]/10 mx-auto mb-4" />
          <p className="text-[15px] font-semibold text-[var(--foreground)] font-display">暂无追踪</p>
          <p className="text-[13px] text-[var(--muted-foreground)] mt-1 font-sans">
            在 GitHub 书签详情页点击「追踪热度」开始追踪
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {trackers.map((tracker, i) => {
            const stars = tracker.snapshots.filter((s) => s.stars != null).map((s) => s.stars!);
            const latest = tracker.snapshots[tracker.snapshots.length - 1];
            const oldest = tracker.snapshots[0];
            const delta = latest && oldest
              ? (latest.stars ?? (latest.views ?? 0)) - (oldest.stars ?? (oldest.views ?? 0))
              : 0;

            return (
              <motion.div
                key={tracker.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-sm p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {tracker.bookmark.favicon && (
                      <img src={tracker.bookmark.favicon} alt="" className="h-5 w-5 rounded-sm mt-0.5" />
                    )}
                    <div>
                      <a
                        href={tracker.bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[14px] font-medium text-[var(--foreground)]/85 hover:text-[var(--accent)] transition-colors line-clamp-1 font-sans inline-flex items-center gap-1"
                      >
                        {tracker.bookmark.title}
                        <ExternalLink className="h-3 w-3 opacity-30 shrink-0" />
                      </a>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-[var(--muted-foreground)] font-sans">
                        <span>{tracker._count.snapshots} 个数据点</span>
                        {tracker.lastCheckedAt && (
                          <span>上次检查: {new Date(tracker.lastCheckedAt).toLocaleString("zh-CN")}</span>
                        )}
                        <span className="px-1.5 py-0.5 rounded bg-[var(--muted)] text-[var(--accent)]">
                          {tracker.sourceType === "github" ? "GitHub" : "网页"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRefresh(tracker.bookmarkId)}
                    disabled={refreshing === tracker.bookmarkId}
                    className="rounded-xl text-[11px] border-[var(--border)] font-sans shrink-0"
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${refreshing === tracker.bookmarkId ? "animate-spin" : ""}`} />
                    刷新
                  </Button>
                </div>

                {/* Sparkline + stats */}
                <div className="flex items-end gap-4">
                  <TrackingSparkline data={stars} width={160} height={36} />
                  <div className="flex items-center gap-4 text-[11px] font-sans shrink-0">
                    <div>
                      <p className="text-[var(--muted-foreground)]">⭐</p>
                      <p className="font-semibold text-[var(--foreground)]">{latest?.stars ?? "—"}</p>
                    </div>
                    {delta !== 0 && (
                      <div>
                        <p className="text-[var(--muted-foreground)]">{delta > 0 ? "↑" : "↓"}</p>
                        <p className={`font-semibold ${delta > 0 ? "text-emerald-500" : "text-red-400"}`}>
                          {delta > 0 ? "+" : ""}{delta}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-[var(--muted-foreground)]">🍴</p>
                      <p className="font-semibold text-[var(--foreground)]">{latest?.forks ?? "—"}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
