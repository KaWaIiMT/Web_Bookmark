"use client";

import { useState, useEffect } from "react";
import { Compass, TrendingUp, Target, Sparkles, ExternalLink } from "lucide-react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { resolveImageUrl } from "@/lib/utils";
import type { BookmarkData } from "@/lib/types";

interface DiscoverViewProps {
  onCardClick?: (bookmark: BookmarkData, element: HTMLElement) => void;
}

type DiscoverMode = "serendipity" | "trending" | "daily";

const MODES: { value: DiscoverMode; label: string; icon: typeof Compass }[] = [
  { value: "serendipity", label: "跨领域发现", icon: Target },
  { value: "trending", label: "最新收录", icon: TrendingUp },
  { value: "daily", label: "每日精选", icon: Sparkles },
];

export function DiscoverView({ onCardClick }: DiscoverViewProps) {
  const [mode, setMode] = useState<DiscoverMode>("serendipity");
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/recommendations/discover?mode=${mode}`)
      .then((r) => r.json())
      .then((d) => setBookmarks(d.data || []))
      .catch(() => setBookmarks([]))
      .finally(() => setLoading(false));
  }, [mode]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-2 px-4 py-1.5 rounded-full bg-[var(--accent)]/10">
          <Compass className="h-4 w-4 text-[var(--accent)]" />
          <span className="text-[13px] font-medium text-[var(--accent)] font-sans">发现</span>
        </div>
        <h2 className="text-[20px] font-semibold text-[var(--foreground)] font-display">
          探索你的知识边界
        </h2>
        <p className="text-[13px] text-[var(--muted-foreground)] mt-1 font-sans">
          基于你的收藏习惯，发现新的精彩内容
        </p>
      </div>

      {/* Mode selector */}
      <div className="flex justify-center gap-2">
        {MODES.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setMode(value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all font-sans ${
              mode === value
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-[var(--border)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Bookmark cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)] animate-spin" />
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[15px] font-semibold text-[var(--foreground)] font-display">暂无推荐</p>
          <p className="text-[13px] text-[var(--muted-foreground)] mt-1 font-sans">收藏更多书签后，这里将展示个性化推荐</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookmarks.map((bm, i) => (
            <motion.div
              key={bm.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-sm overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group"
              onClick={(e) => onCardClick?.(bm, e.currentTarget as HTMLElement)}
            >
              {bm.coverImage && (
                <div className="aspect-[2.2/1] bg-[var(--muted)] overflow-hidden">
                  <img
                    src={resolveImageUrl(bm.coverImage, bm.url) ?? undefined}
                    alt={bm.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  {bm.favicon && <img src={bm.favicon} alt="" className="h-3.5 w-3.5 rounded-sm"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />}
                  <span className="text-[10px] text-[var(--foreground)]/25 font-sans truncate">{bm.siteName || "未知"}</span>
                </div>
                <h3 className="text-[14px] font-medium text-[var(--foreground)]/85 line-clamp-2 leading-snug font-sans group-hover:text-[var(--accent)] transition-colors">
                  {bm.title}
                </h3>
                {bm.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {bm.tags.slice(0, 3).map(({ tag }) => (
                      <Badge key={tag.id} variant="secondary" className="text-[9px] px-2 py-0.5 rounded-md bg-[var(--muted)] text-[var(--foreground)]/35 border-0 font-normal font-sans">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
