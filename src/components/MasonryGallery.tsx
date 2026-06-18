"use client";

import { ExternalLink } from "lucide-react";
import { motion } from "motion/react";
import type { BookmarkData } from "@/lib/types";
import { resolveImageUrl } from "@/lib/utils";

interface MasonryGalleryProps {
  bookmarks: BookmarkData[];
  onCardClick: (bookmark: BookmarkData, element: HTMLElement) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

export function MasonryGallery({ bookmarks, onCardClick }: MasonryGalleryProps) {
  const imageBookmarks = bookmarks.filter(
    (b) => b.contentType === "image" || b.coverImage
  );

  if (imageBookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <p className="text-[15px] font-semibold text-[var(--foreground)] font-display">
          没有图片类书签
        </p>
        <p className="text-[13px] text-[var(--muted-foreground)] mt-1.5 font-sans">
          添加一些带图片的书签来填充画廊
        </p>
      </div>
    );
  }

  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
      {imageBookmarks.map((bookmark, i) => (
        <motion.div
          key={bookmark.id}
          className="break-inside-avoid rounded-2xl overflow-hidden bg-[var(--card)] backdrop-blur-sm border border-[var(--border)] group cursor-pointer mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03, duration: 0.35, ease: "easeOut" }}
          onClick={(e) => onCardClick(bookmark, e.currentTarget as HTMLElement)}
        >
          {bookmark.coverImage && (
            <div className="relative">
              <img
                src={resolveImageUrl(bookmark.coverImage, bookmark.url) ?? undefined}
                alt={bookmark.title}
                className="w-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-[var(--foreground)]/0 group-hover:bg-[var(--foreground)]/10 transition-colors duration-300" />
              {bookmark.contentType === "video" && (
                <div className="absolute top-2 right-2 bg-[var(--foreground)]/70 backdrop-blur-md text-white/90 text-[10px] px-2 py-0.5 rounded-full font-medium">
                  视频
                </div>
              )}
            </div>
          )}
          <div className="p-3">
            {bookmark.favicon && (
              <img src={bookmark.favicon} alt="" className="h-3.5 w-3.5 rounded-sm mb-1.5 inline-block"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
            <h3 className="text-[13px] font-medium leading-snug text-[var(--foreground)]/85 line-clamp-2 font-sans group-hover:text-[var(--accent)] transition-colors">
              {bookmark.title}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] text-[var(--foreground)]/25 font-sans truncate">
                {bookmark.siteName || "未知"}
              </span>
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--foreground)]/15 hover:text-[var(--accent)] transition-colors ml-auto shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
