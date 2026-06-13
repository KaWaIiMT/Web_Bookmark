"use client";

import { useState, useEffect } from "react";
import { Sparkles, ExternalLink } from "lucide-react";
import { motion } from "motion/react";
import { cn, resolveImageUrl } from "@/lib/utils";

interface RelatedItem {
  id: string;
  url: string;
  title: string;
  coverImage: string | null;
  favicon: string | null;
  siteName: string | null;
  similarity: number;
  sharedTags: string[];
}

interface RelatedBookmarksProps {
  bookmarkId: string;
  onSelect: (bookmarkId: string) => void;
}

export function RelatedBookmarks({ bookmarkId, onSelect }: RelatedBookmarksProps) {
  const [items, setItems] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookmarkId) return;
    setLoading(true);
    fetch(`/api/bookmarks/${bookmarkId}/related`)
      .then((r) => r.json())
      .then((d) => setItems(d.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [bookmarkId]);

  if (loading) {
    return (
      <div>
        <p className="text-[10px] font-medium text-[var(--foreground)]/25 uppercase tracking-widest mb-2 font-sans">
          相关推荐
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="shrink-0 w-[160px] rounded-xl bg-[var(--muted)] animate-pulse h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div>
      <p className="text-[10px] font-medium text-[var(--accent)] uppercase tracking-widest mb-2 font-sans flex items-center gap-1.5">
        <Sparkles className="h-3 w-3" />
        相关推荐
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {items.map((item, i) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            onClick={() => onSelect(item.id)}
            className="shrink-0 w-[180px] text-left rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] p-2.5 transition-all duration-200 group cursor-pointer"
          >
            {/* Cover */}
            {item.coverImage && (
              <div className="aspect-[2.2/1] rounded-lg overflow-hidden bg-[var(--muted)] mb-2">
                <img
                  src={resolveImageUrl(item.coverImage, item.url) ?? undefined}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}

            {/* Title */}
            <h4 className="text-[12px] font-medium text-[var(--foreground)]/80 line-clamp-2 leading-snug font-sans group-hover:text-[var(--accent)] transition-colors">
              {item.title}
            </h4>

            {/* Meta */}
            <div className="flex items-center justify-between mt-1.5">
              <div className="flex items-center gap-1">
                {item.favicon && (
                  <img src={item.favicon} alt="" className="h-3 w-3 rounded-sm"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                <span className="text-[10px] text-[var(--foreground)]/25 truncate max-w-[60px] font-sans">
                  {item.siteName || ""}
                </span>
              </div>
              {item.similarity > 0 && (
                <span className={cn(
                  "text-[10px] font-medium font-sans shrink-0",
                  item.similarity >= 70 ? "text-emerald-500" : item.similarity >= 40 ? "text-amber-500" : "text-[var(--muted-foreground)]"
                )}>
                  {item.similarity}%
                </span>
              )}
            </div>

            {/* Shared tags */}
            {item.sharedTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {item.sharedTags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-md bg-[var(--accent)]/10 text-[var(--accent)] font-medium font-sans">
                    {tag}
                  </span>
                ))}
                {item.sharedTags.length > 2 && (
                  <span className="text-[9px] text-[var(--foreground)]/20 font-sans">
                    +{item.sharedTags.length - 2}
                  </span>
                )}
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
