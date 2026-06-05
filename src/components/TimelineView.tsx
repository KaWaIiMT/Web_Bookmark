"use client";

import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import type { TimelineResponse, BookmarkData } from "@/lib/types";

interface TimelineViewProps {
  onCardClick?: (bookmark: BookmarkData, element: HTMLElement) => void;
}

export function TimelineView({ onCardClick }: TimelineViewProps) {
  const [groups, setGroups] = useState<TimelineResponse["groups"]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats/timeline")
      .then((r) => r.json())
      .then((d) => setGroups(d.groups || []))
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

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <p className="text-[15px] font-semibold text-[var(--foreground)] font-display">
          还没有书签
        </p>
        <p className="text-[13px] text-[var(--muted-foreground)] mt-1.5 font-sans">
          添加书签后，这里将按时间轴展示你的收藏历史
        </p>
      </div>
    );
  }

  return (
    <div className="relative pl-8 max-w-3xl mx-auto">
      {/* Timeline vertical line */}
      <div className="absolute left-[15px] top-0 bottom-0 w-px bg-[var(--border)]" />

      <div className="space-y-10">
        {groups.map((group, gi) => (
          <motion.div
            key={`${group.year}-${group.month}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.05, duration: 0.4, ease: "easeOut" }}
            className="relative"
          >
            {/* Month badge */}
            <div className="flex items-center gap-3 mb-4 -ml-8">
              <div className="h-3 w-3 rounded-full bg-[var(--accent)] shrink-0 ring-4 ring-[var(--background)]" />
              <h2 className="text-[14px] font-semibold text-[var(--foreground)] font-display">
                {group.label}
              </h2>
              <span className="text-[11px] text-[var(--muted-foreground)] font-sans">
                {group.bookmarks.length} 条
              </span>
            </div>

            {/* Bookmarks in this month */}
            <div className="space-y-2">
              {group.bookmarks.map((bookmark, bi) => (
                <motion.a
                  key={bookmark.id}
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-[var(--card)] backdrop-blur-sm rounded-xl border border-[var(--border)] p-3.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: gi * 0.05 + bi * 0.02, duration: 0.3 }}
                  onClick={(e) => {
                    if (onCardClick) {
                      e.preventDefault();
                      onCardClick(bookmark, e.currentTarget as HTMLElement);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Favicon */}
                    {bookmark.favicon && (
                      <img src={bookmark.favicon} alt="" className="h-4 w-4 rounded-sm shrink-0 mt-0.5"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-[14px] font-medium text-[var(--foreground)]/85 line-clamp-1 font-sans group-hover:text-[var(--accent)] transition-colors">
                          {bookmark.title}
                        </h3>
                        <ExternalLink className="h-3 w-3 text-[var(--foreground)]/10 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {bookmark.description && (
                        <p className="text-[12px] text-[var(--muted-foreground)] mt-0.5 line-clamp-1 font-sans">
                          {bookmark.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-[var(--foreground)]/20 font-sans">
                          {bookmark.siteName || new URL(bookmark.url).hostname}
                        </span>
                        <span className="text-[var(--foreground)]/10">·</span>
                        <span className="text-[10px] text-[var(--foreground)]/20 font-sans">
                          {new Date(bookmark.createdAt).toLocaleDateString("zh-CN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {bookmark.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 ml-7">
                      {bookmark.tags.map(({ tag }) => (
                        <Badge key={tag.id} variant="secondary" className="text-[9px] px-2 py-0 rounded-md bg-[var(--muted)] text-[var(--foreground)]/30 border-0 font-normal font-sans">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </motion.a>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
