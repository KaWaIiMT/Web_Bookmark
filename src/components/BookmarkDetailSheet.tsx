"use client";

import { useState, useEffect, useCallback } from "react";
import { ExternalLink, Trash2, Share2, TrendingUp, Clock, BookOpen, CheckCircle2, Archive, MapPin, Calendar, X, FileArchive, Eye, Network, Loader2, AlertTriangle, RefreshCw, BookOpenText } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RelatedBookmarks } from "@/components/RelatedBookmarks";
import { toast } from "sonner";
import { cn, resolveImageUrl } from "@/lib/utils";
import type { BookmarkData, ArchiveData } from "@/lib/types";

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; className: string; dotColor: string }> = {
  unread: { label: "待读", icon: Clock, className: "bg-amber-100/60 text-amber-700 border-amber-200/40 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20", dotColor: "bg-amber-400" },
  reading: { label: "在读", icon: BookOpen, className: "bg-[#b76e4b]/10 text-[#b76e4b] border-[#b76e4b]/20", dotColor: "bg-[#b76e4b]" },
  read: { label: "已读", icon: CheckCircle2, className: "bg-emerald-100/60 text-emerald-700 border-emerald-200/40 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20", dotColor: "bg-emerald-400" },
  archived: { label: "归档", icon: Archive, className: "bg-zinc-100/60 text-zinc-400 border-zinc-200/40 dark:bg-zinc-500/10 dark:text-zinc-500 dark:border-zinc-500/20", dotColor: "bg-zinc-300" },
};

function safeURL(url: string): string {
  try { return new URL(url).hostname; } catch { return url; }
}

const contentTypeLabels: Record<string, string> = {
  video: "视频", article: "文章", repository: "仓库", image: "图片", social: "社交", webpage: "网页",
};

type DetailTab = "preview" | "archive" | "related";

interface BookmarkDetailSheetProps {
  bookmark: BookmarkData | null;
  cardRect: DOMRect | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onShare?: (id: string) => void;
  onSelectBookmark?: (id: string) => void;
  onStartTracking?: (id: string) => void;
  onRead?: (bookmark: BookmarkData) => void;
  collections?: { id: string; name: string }[];
  onAddToCollection?: (bookmarkId: string, collectionId: string) => void;
  onRemoveFromCollection?: (bookmarkId: string, collectionId: string) => void;
}

export function BookmarkDetailSheet({
  bookmark,
  cardRect,
  open,
  onClose,
  onStatusChange,
  onDelete,
  onShare,
  onSelectBookmark,
  onStartTracking,
  onRead,
  collections,
  onAddToCollection,
  onRemoveFromCollection,
}: BookmarkDetailSheetProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("preview");
  const [archive, setArchive] = useState<ArchiveData | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [urlDead, setUrlDead] = useState(false);
  const [urlChecking, setUrlChecking] = useState(false);

  // Reset state when bookmark changes
  useEffect(() => {
    setActiveTab("preview");
    setArchive(null);
    setArchiveLoading(false);
    setUrlDead(false);
    setUrlChecking(false);
  }, [bookmark?.id]);

  // Check link health when bookmark has archive
  useEffect(() => {
    if (!bookmark || !open) return;
    const hasArchive = bookmark.archiveStatus === "success";
    if (!hasArchive) return;

    setUrlChecking(true);
    fetch(`/api/check-url?url=${encodeURIComponent(bookmark.url)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) {
          setUrlDead(true);
          // Auto-switch to archive tab when original link is dead
          setActiveTab("archive");
        }
      })
      .catch(() => {})
      .finally(() => setUrlChecking(false));
  }, [bookmark?.id, bookmark?.archiveStatus, open]);

  // Fetch archive data when switching to archive tab
  const fetchArchive = useCallback(async () => {
    if (!bookmark) return;
    // Use bookmark-level status for quick display (avoids API call for known states)
    if (bookmark.archiveStatus && bookmark.archiveStatus.startsWith("failed")) {
      setArchive({
        html: null,
        text: null,
        archivedAt: null,
        status: bookmark.archiveStatus,
      });
      return;
    }
    // Always fetch from API to get the full HTML/text content
    setArchiveLoading(true);
    try {
      const res = await fetch(`/api/bookmarks/${bookmark.id}/archive`);
      if (res.ok) {
        const data: ArchiveData = await res.json();
        setArchive(data);
      }
    } catch {
      setArchive(null);
    } finally {
      setArchiveLoading(false);
    }
  }, [bookmark]);

  useEffect(() => {
    if (activeTab === "archive") {
      fetchArchive();
    }
  }, [activeTab, fetchArchive]);

  const triggerArchive = async () => {
    if (!bookmark) return;
    setArchiveLoading(true);
    try {
      // Fetch the URL from the browser (more reliable, no Vercel timeout)
      let html = "";
      try {
        const fetchRes = await fetch(bookmark.url, {
          headers: {
            "User-Agent": navigator.userAgent,
            Accept: "text/html,application/xhtml+xml",
          },
        });
        if (fetchRes.ok) {
          html = await fetchRes.text();
        }
      } catch {
        // Browser fetch failed — server will fall back to server-side fetch
      }

      const res = await fetch(`/api/bookmarks/${bookmark.id}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: html || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("存档完成");
        fetchArchive();
      } else {
        toast.error(data.error || "存档失败");
        setArchive({ html: null, text: null, archivedAt: null, status: `failed: ${data.error || "unknown"}` });
      }
    } catch {
      toast.error("存档请求失败");
      setArchive({ html: null, text: null, archivedAt: null, status: "failed: network error" });
    } finally {
      setArchiveLoading(false);
    }
  };

  // Determine archive status display
  const archiveStatusDisplay = (() => {
    const status = archive?.status || bookmark?.archiveStatus;
    if (!status) return null;
    if (status === "success") return { label: "已存档", color: "text-emerald-500", bg: "bg-emerald-500/10", icon: FileArchive };
    if (status === "pending") return { label: "存档中…", color: "text-amber-500", bg: "bg-amber-500/10", icon: Loader2 };
    if (status.startsWith("failed")) return { label: "存档失败", color: "text-red-500", bg: "bg-red-500/10", icon: AlertTriangle };
    return null;
  })();

  if (!bookmark) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-[var(--foreground)]/5 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Expanding card -> detail panel */}
          <motion.div
            className="fixed z-50 bg-[var(--background)]/95 backdrop-blur-xl border-l border-[var(--border)] shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col"
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
              <div className="aspect-video bg-[var(--muted)] shrink-0">
                <img
                  src={resolveImageUrl(bookmark.coverImage, bookmark.url) ?? undefined}
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
              className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4 text-[var(--foreground)]/50" />
            </button>

            {/* Tabs */}
            <div className="flex border-b border-[var(--border)] shrink-0">
              {([
                { key: "preview" as const, label: "预览", icon: Eye },
                { key: "archive" as const, label: "存档快照", icon: FileArchive },
                { key: "related" as const, label: "相关推荐", icon: Network },
              ]).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-medium font-sans transition-colors border-b-2 -mb-px",
                      activeTab === tab.key
                        ? "border-[var(--accent)] text-[var(--accent)]"
                        : "border-transparent text-[var(--foreground)]/30 hover:text-[var(--foreground)]/50"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* === Preview Tab === */}
              {activeTab === "preview" && (
                <div className="p-6 space-y-5">
                  {/* Dead link warning */}
                  {urlDead && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[12px] font-medium text-amber-700 dark:text-amber-400 font-sans">
                          原始页面可能已失效
                        </p>
                        <button
                          onClick={() => setActiveTab("archive")}
                          className="text-[11px] text-amber-600/80 dark:text-amber-400/80 hover:text-amber-600 font-sans underline cursor-pointer mt-0.5"
                        >
                          查看存档快照 →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Header */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {bookmark.favicon && (
                        <img src={bookmark.favicon} alt="" className="h-4 w-4 rounded-sm" />
                      )}
                      <span className="text-[12px] text-[var(--foreground)]/35 font-sans">
                        {bookmark.siteName || safeURL(bookmark.url)}
                      </span>
                      <span className="flex-1" />
                      <Badge variant="outline" className="text-[10px] rounded-full border-[var(--border)] text-[var(--foreground)]/30 font-normal">
                        {contentTypeLabels[bookmark.contentType] || "网页"}
                      </Badge>
                    </div>

                    <h2 className="text-[20px] font-semibold leading-snug text-[var(--foreground)] font-display">
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
                              : "border-transparent text-[var(--foreground)]/30 hover:bg-[var(--card)] hover:text-[var(--foreground)]/50"
                          )}
                        >
                          <Icon className="h-3 w-3" />
                          {conf.label}
                        </button>
                      );
                    })}
                  </div>

                  <Separator className="bg-[var(--border)]" />

                  {/* AI Summary */}
                  {bookmark.aiSummary && (
                    <div>
                      <p className="text-[10px] font-medium text-[var(--accent)] uppercase tracking-widest mb-2 font-sans">AI 摘要</p>
                      <p className="text-[14px] text-[var(--foreground)]/50 leading-relaxed font-sans">
                        {bookmark.aiSummary}
                      </p>
                    </div>
                  )}

                  {/* Description */}
                  {bookmark.description && (
                    <div>
                      <p className="text-[10px] font-medium text-[var(--foreground)]/25 uppercase tracking-widest mb-2 font-sans">描述</p>
                      <p className="text-[13px] text-[var(--foreground)]/45 leading-relaxed font-sans">
                        {bookmark.description}
                      </p>
                    </div>
                  )}

                  {/* Tags */}
                  {bookmark.tags.length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium text-[var(--foreground)]/25 uppercase tracking-widest mb-2 font-sans">标签</p>
                      <div className="flex flex-wrap gap-1.5">
                        {bookmark.tags.map(({ tag }) => (
                          <Badge key={tag.id} variant="secondary" className="text-[11px] px-2.5 py-1 rounded-lg bg-[var(--card)] border-0 text-[var(--foreground)]/45 font-normal font-sans">
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Collections */}
                  {collections && collections.length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium text-[var(--foreground)]/25 uppercase tracking-widest mb-2 font-sans">收藏夹</p>
                      <div className="flex flex-wrap gap-1.5">
                        {collections.map((col) => (
                          <Badge key={col.id} variant="secondary" className="text-[11px] px-2.5 py-1 rounded-lg bg-[var(--accent)]/5 border border-[var(--accent)]/20 text-[var(--foreground)]/55 font-normal font-sans flex items-center gap-1">
                            {col.name}
                            <button
                              onClick={(e) => { e.stopPropagation(); onRemoveFromCollection?.(bookmark!.id, col.id); }}
                              className="ml-0.5 hover:text-red-400 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator className="bg-[var(--border)]" />

                  {/* Meta */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-[var(--foreground)]/25 font-sans">
                      <Calendar className="h-3 w-3" />
                      收藏于 {new Date(bookmark.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[var(--foreground)]/25 font-sans">
                      <MapPin className="h-3 w-3" />
                      <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] transition-colors text-[var(--foreground)]/30">
                        {safeURL(bookmark.url)}
                      </a>
                    </div>
                    {/* Archive status mini indicator */}
                    {archiveStatusDisplay && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <FileArchive className="h-3 w-3 text-[var(--foreground)]/25" />
                        <span className={cn("font-sans", archiveStatusDisplay.color)}>
                          {archiveStatusDisplay.label}
                        </span>
                        {archive?.archivedAt && (
                          <span className="text-[var(--foreground)]/20 font-sans">
                            · {new Date(archive.archivedAt).toLocaleDateString("zh-CN")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* === Archive Tab === */}
              {activeTab === "archive" && (
                <div className="flex flex-col h-full">
                  {/* Dead link banner */}
                  {urlDead && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20 shrink-0">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 font-sans">
                        原始页面已失效，以下为最近存档
                      </p>
                    </div>
                  )}
                  {archiveLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="h-6 w-6 animate-spin text-[var(--foreground)]/20" />
                    </div>
                  ) : archive?.status === "success" && archive.html ? (
                    <>
                      {/* Archive info bar */}
                      <div className="px-4 py-2 border-b border-[var(--border)] flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full bg-emerald-400" />
                          <span className="text-[11px] font-sans text-emerald-600 dark:text-emerald-400">
                            已存档
                          </span>
                        </div>
                        <span className="text-[11px] text-[var(--foreground)]/20 font-sans">
                          {archive.archivedAt
                            ? new Date(archive.archivedAt).toLocaleString("zh-CN")
                            : ""}
                        </span>
                        <span className="flex-1" />
                        <button
                          onClick={triggerArchive}
                          className="flex items-center gap-1 text-[11px] text-[var(--foreground)]/30 hover:text-[var(--accent)] transition-colors font-sans"
                          title="刷新存档"
                        >
                          <RefreshCw className="h-3 w-3" />
                          刷新
                        </button>
                      </div>
                      {/* iframe sandbox */}
                      <div className="flex-1 min-h-0">
                        <iframe
                          srcDoc={archive.html}
                          sandbox="allow-same-origin"
                          className="w-full h-full border-0"
                          title="存档快照"
                          style={{ minHeight: 300 }}
                        />
                      </div>
                    </>
                  ) : archive?.status === "pending" ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
                      <p className="text-[13px] text-[var(--foreground)]/30 font-sans">存档抓取中…</p>
                    </div>
                  ) : archive?.status && archive.status.startsWith("failed") ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 px-6">
                      <AlertTriangle className="h-8 w-8 text-red-400" />
                      <p className="text-[13px] text-[var(--foreground)]/40 font-sans text-center">
                        存档失败
                      </p>
                      <p className="text-[11px] text-red-400/60 font-sans text-center max-w-xs break-all">
                        {archive.status.replace(/^failed:\s*/, "")}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={triggerArchive}
                        className="rounded-xl text-[12px] border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--foreground)] font-sans"
                      >
                        <RefreshCw className="h-3 w-3 mr-1.5" />
                        重试
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 px-6">
                      <FileArchive className="h-10 w-10 text-[var(--foreground)]/10" />
                      <p className="text-[14px] text-[var(--foreground)]/30 font-sans">尚未存档</p>
                      <p className="text-[11px] text-[var(--foreground)]/15 font-sans text-center max-w-xs">
                        保存此页面的简化 HTML 快照，防止原始页面被删除或修改导致内容丢失
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={triggerArchive}
                        disabled={archiveLoading}
                        className="rounded-xl text-[13px] border-[var(--accent)]/30 bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--accent)] font-sans mt-2"
                      >
                        {archiveLoading ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <FileArchive className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        创建存档
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* === Related Tab === */}
              {activeTab === "related" && (
                <div className="p-6">
                  <RelatedBookmarks
                    bookmarkId={bookmark.id}
                    onSelect={(id) => onSelectBookmark?.(id)}
                  />
                </div>
              )}
            </div>

            {/* Bottom actions */}
            <div className="p-4 border-t border-[var(--border)] flex gap-2 shrink-0 bg-[var(--background)]/80 backdrop-blur-xl">
              <Button
                variant="outline"
                onClick={() => window.open(bookmark.url, "_blank")}
                className="flex-1 rounded-xl text-[13px] border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--foreground)] font-sans h-10"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5 opacity-50" />
                打开链接
              </Button>
              <Button
                variant="outline"
                onClick={() => { onRead?.(bookmark); }}
                className="rounded-xl text-[13px] border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--foreground)] font-sans h-10 px-3"
                title="阅读模式"
              >
                <BookOpenText className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                onClick={() => { onShare?.(bookmark.id); }}
                className="rounded-xl text-[13px] border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--foreground)] font-sans h-10 px-3"
              >
                <Share2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  fetch(`/api/tracking/configs`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ bookmarkId: bookmark.id }),
                  })
                    .then((r) => {
                      if (!r.ok) throw new Error();
                      toast.success("已开始追踪热度");
                      onStartTracking?.(bookmark.id);
                    })
                    .catch(() => toast.error("追踪失败"));
                }}
                className="rounded-xl text-[13px] border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--foreground)] font-sans h-10 px-3"
                title="追踪热度"
              >
                <TrendingUp className="h-3.5 w-3.5" />
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
