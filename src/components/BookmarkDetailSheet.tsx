"use client";

import { ExternalLink, Trash2, Clock, BookOpen, CheckCircle2, Archive, MapPin, Calendar, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { BookmarkData } from "@/lib/types";

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; className: string; dotColor: string }> = {
  unread: { label: "待读", icon: Clock, className: "bg-amber-100/60 text-amber-700 border-amber-200/40", dotColor: "bg-amber-400" },
  reading: { label: "在读", icon: BookOpen, className: "bg-[#b76e4b]/10 text-[#b76e4b] border-[#b76e4b]/20", dotColor: "bg-[#b76e4b]" },
  read: { label: "已读", icon: CheckCircle2, className: "bg-emerald-100/60 text-emerald-700 border-emerald-200/40", dotColor: "bg-emerald-400" },
  archived: { label: "归档", icon: Archive, className: "bg-zinc-100/60 text-zinc-400 border-zinc-200/40", dotColor: "bg-zinc-300" },
};

function safeURL(url: string): string {
  try { return new URL(url).hostname; } catch { return url; }
}

const contentTypeLabels: Record<string, string> = {
  video: "视频", article: "文章", repository: "仓库", image: "图片", social: "社交", webpage: "网页",
};

interface BookmarkDetailSheetProps {
  bookmark: BookmarkData | null;
  cardRect: DOMRect | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

export function BookmarkDetailSheet({
  bookmark,
  cardRect,
  open,
  onClose,
  onStatusChange,
  onDelete,
}: BookmarkDetailSheetProps) {
  return (
    <AnimatePresence>
      {open && bookmark && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-[#2c2c2c]/5 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Expanding card -> detail panel */}
          <motion.div
            className="fixed z-50 bg-[#f5f3f0]/95 backdrop-blur-xl border-l border-[#2c2c2c]/[0.04] shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col"
            initial={
              cardRect
                ? {
                    top: cardRect.top,
                    left: cardRect.left,
                    width: cardRect.width,
                    height: cardRect.height,
                    borderRadius: 16,
                    opacity: 0.9,
                  }
                : {
                    top: 0,
                    right: -420,
                    width: 420,
                    height: "100%",
                    borderRadius: 0,
                    opacity: 0,
                  }
            }
            animate={{
              top: 0,
              right: 0,
              left: "auto",
              width: 420,
              height: "100%",
              borderRadius: 0,
              opacity: 1,
            }}
            exit={
              cardRect
                ? {
                    top: cardRect.top,
                    left: cardRect.left,
                    width: cardRect.width,
                    height: cardRect.height,
                    borderRadius: 16,
                    opacity: 0,
                  }
                : {
                    right: -420,
                    opacity: 0,
                  }
            }
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 32,
              mass: 0.8,
            }}
          >
            {/* Cover Image */}
            {bookmark.coverImage && (
              <div className="aspect-video bg-[#e8e4df] shrink-0">
                <img
                  src={bookmark.coverImage.startsWith("//") ? `https:${bookmark.coverImage}` : bookmark.coverImage}
                  alt={bookmark.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-[#2c2c2c]/5 hover:bg-[#2c2c2c]/10 flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4 text-[#2c2c2c]/50" />
            </button>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-5">
                {/* Header */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {bookmark.favicon && (
                      <img src={bookmark.favicon} alt="" className="h-4 w-4 rounded-sm" />
                    )}
                    <span className="text-[12px] text-[#2c2c2c]/35 font-sans">
                      {bookmark.siteName || safeURL(bookmark.url)}
                    </span>
                    <span className="flex-1" />
                    <Badge variant="outline" className="text-[10px] rounded-full border-[#2c2c2c]/[0.04] text-[#2c2c2c]/30 font-normal">
                      {contentTypeLabels[bookmark.contentType] || "网页"}
                    </Badge>
                  </div>

                  <h2 className="text-[20px] font-semibold leading-snug text-[#2c2c2c] font-display">
                    {bookmark.title}
                  </h2>
                </div>

                {/* Status */}
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(STATUS_CONFIG).map(([key, conf]) => {
                    const Icon = conf.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => onStatusChange(bookmark.id, key)}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border font-sans transition-all cursor-pointer",
                          bookmark.status === key
                            ? conf.className
                            : "border-transparent text-[#2c2c2c]/30 hover:bg-white/50 hover:text-[#2c2c2c]/50"
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {conf.label}
                      </button>
                    );
                  })}
                </div>

                <Separator className="bg-[#2c2c2c]/[0.03]" />

                {/* AI Summary */}
                {bookmark.aiSummary && (
                  <div>
                    <p className="text-[10px] font-medium text-[#b76e4b] uppercase tracking-widest mb-2 font-sans">AI 摘要</p>
                    <p className="text-[14px] text-[#2c2c2c]/50 leading-relaxed font-sans">
                      {bookmark.aiSummary}
                    </p>
                  </div>
                )}

                {/* Description */}
                {bookmark.description && (
                  <div>
                    <p className="text-[10px] font-medium text-[#2c2c2c]/25 uppercase tracking-widest mb-2 font-sans">描述</p>
                    <p className="text-[13px] text-[#2c2c2c]/45 leading-relaxed font-sans">
                      {bookmark.description}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {bookmark.tags.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium text-[#2c2c2c]/25 uppercase tracking-widest mb-2 font-sans">标签</p>
                    <div className="flex flex-wrap gap-1.5">
                      {bookmark.tags.map(({ tag }) => (
                        <Badge key={tag.id} variant="secondary" className="text-[11px] px-2.5 py-1 rounded-lg bg-white/60 border-0 text-[#2c2c2c]/45 font-normal font-sans">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator className="bg-[#2c2c2c]/[0.03]" />

                {/* Meta */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px] text-[#2c2c2c]/25 font-sans">
                    <Calendar className="h-3 w-3" />
                    收藏于 {new Date(bookmark.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#2c2c2c]/25 font-sans">
                    <MapPin className="h-3 w-3" />
                    <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="hover:text-[#b76e4b] transition-colors text-[#2c2c2c]/30">
                      {safeURL(bookmark.url)}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom actions */}
            <div className="p-4 border-t border-[#2c2c2c]/[0.04] flex gap-2 shrink-0 bg-[#f5f3f0]/80 backdrop-blur-xl">
              <Button
                variant="outline"
                onClick={() => window.open(bookmark.url, "_blank")}
                className="flex-1 rounded-xl text-[13px] border-[#2c2c2c]/[0.06] bg-white/60 hover:bg-white text-[#2c2c2c] font-sans h-10"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5 opacity-50" />
                打开链接
              </Button>
              <Button
                variant="ghost"
                onClick={() => { onDelete(bookmark.id); onClose(); }}
                className="rounded-xl text-[13px] text-red-400 hover:text-red-500 hover:bg-red-50 font-sans h-10 px-3"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
