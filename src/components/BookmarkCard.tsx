"use client";

import { ExternalLink, Eye, Star, User, Trash2, Pencil, Clock, BookOpen, CheckCircle2, Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import type { BookmarkData } from "@/lib/types";

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) return `${Math.floor(days / 30)} 个月前`;
  if (days > 0) return `${days} 天前`;
  if (hours > 0) return `${hours} 小时前`;
  if (minutes > 0) return `${minutes} 分钟前`;
  return "刚刚";
}

function parseMetadata(metadata: string | null): Record<string, React.ReactNode> {
  if (!metadata) return {};
  try {
    return JSON.parse(metadata) as Record<string, React.ReactNode>;
  } catch {
    return {};
  }
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; className: string; dotColor: string }> = {
  unread: { label: "待读", icon: Clock, className: "bg-amber-100/60 text-amber-700 border-amber-200/40 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20", dotColor: "bg-amber-400" },
  reading: { label: "在读", icon: BookOpen, className: "bg-[#b76e4b]/10 text-[#b76e4b] border-[#b76e4b]/20", dotColor: "bg-[#b76e4b]" },
  read: { label: "已读", icon: CheckCircle2, className: "bg-emerald-100/60 text-emerald-700 border-emerald-200/40 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20", dotColor: "bg-emerald-400" },
  archived: { label: "归档", icon: Archive, className: "bg-zinc-100/60 text-zinc-400 border-zinc-200/40 dark:bg-zinc-500/10 dark:text-zinc-500 dark:border-zinc-500/20", dotColor: "bg-zinc-300" },
};

const NEXT_STATUS: Record<string, string> = {
  unread: "reading",
  reading: "read",
  read: "archived",
  archived: "unread",
};

interface BookmarkCardProps {
  bookmark: BookmarkData;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onEdit: (bookmark: BookmarkData) => void;
}

export function BookmarkCard({ bookmark, onStatusChange, onDelete, onEdit }: BookmarkCardProps) {
  const meta = parseMetadata(bookmark.metadata);
  const statusConf = STATUS_CONFIG[bookmark.status] || STATUS_CONFIG.unread;

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.06)] rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-sm group/card hover:-translate-y-0.5">
          {/* Cover Image */}
          {bookmark.coverImage && (
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block relative aspect-[2.2/1] bg-[var(--muted)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={bookmark.coverImage.startsWith("//") ? `https:${bookmark.coverImage}` : bookmark.coverImage}
                alt={bookmark.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-[1.04]"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              {bookmark.contentType === "video" && (
                <div className="absolute bottom-2.5 left-2.5 bg-[var(--foreground)]/70 backdrop-blur-md text-white/90 text-[10px] px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5">
                  <Eye className="h-2.5 w-2.5" />
                  视频{meta.duration ? ` · ${meta.duration}` : ""}
                </div>
              )}
            </a>
          )}

          <div className="p-4">
            {/* Header row */}
            <div className="flex items-start gap-2 mb-2.5">
              {/* Favicon + site */}
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {bookmark.favicon && (
                  <img src={bookmark.favicon} alt="" className="h-4 w-4 rounded-sm shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                <span className="text-[11px] text-[var(--foreground)]/30 truncate font-sans">
                  {bookmark.siteName || "未知"}
                </span>
              </div>

              {/* Status dot + label */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(bookmark.id, NEXT_STATUS[bookmark.status]);
                }}
                className="shrink-0 flex items-center gap-1 text-[10px] text-[var(--foreground)]/35 hover:text-[var(--foreground)]/60 transition-colors cursor-pointer group/status"
                data-no-drag
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", statusConf.dotColor)} />
                <span className="opacity-0 group-hover/status:opacity-100 transition-opacity">
                  {statusConf.label}
                </span>
              </button>
            </div>

            {/* Title */}
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[14px] leading-snug line-clamp-2 text-[var(--foreground)]/85 hover:text-[var(--accent)] transition-colors inline-flex items-start gap-1 font-sans"
              onClick={(e) => e.stopPropagation()}
            >
              {bookmark.title}
              <ExternalLink className="h-3 w-3 shrink-0 mt-0.5 text-[var(--foreground)]/10 opacity-0 group-hover/card:opacity-100 transition-opacity" />
            </a>

            {/* AI summary */}
            {!!bookmark.aiSummary && (
              <p className="text-[12px] text-[var(--foreground)]/35 mt-1.5 line-clamp-2 leading-relaxed font-sans">
                {String(bookmark.aiSummary!)}
              </p>
            )}

            {/* Repository specifics */}
            {bookmark.contentType === "repository" && (
              <div className="flex items-center gap-3 mt-2 text-[11px] text-[var(--foreground)]/35 font-sans">
                {meta.language && (
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                    {meta.language as string}
                  </span>
                )}
                {typeof meta.stars === "number" && meta.stars > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {meta.stars as number}
                  </span>
                )}
              </div>
            )}

            {/* Article specifics */}
            {bookmark.contentType === "article" && meta.author && (
              <div className="flex items-center gap-1 mt-2 text-[11px] text-[var(--foreground)]/25 font-sans">
                <User className="h-3 w-3" />
                {meta.author as string}
                {meta.publishDate && <span>· {new Date(meta.publishDate as string).toLocaleDateString("zh-CN")}</span>}
              </div>
            )}

            {/* Tags */}
            {bookmark.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {bookmark.tags.map(({ tag }) => (
                  <Badge key={tag.id} variant="secondary" className="text-[10px] px-2 py-0.5 rounded-lg bg-[var(--muted)] text-[var(--foreground)]/40 border-0 font-normal font-sans">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Timestamp */}
            <p className="text-[10px] text-[var(--foreground)]/20 mt-2.5 font-sans">
              {formatDate(bookmark.createdAt)}
            </p>
          </div>
        </Card>
      </ContextMenuTrigger>

      {/* Right-click context menu */}
      <ContextMenuContent className="w-52 rounded-2xl border border-[var(--border)] shadow-[0_12px_40px_rgba(0,0,0,0.08)] bg-[var(--popover)] backdrop-blur-xl p-1.5">
        <ContextMenuSub>
          <ContextMenuSubTrigger className="text-[13px] rounded-xl font-sans">
            更改状态
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-44 rounded-2xl border border-[var(--border)] bg-[var(--popover)] backdrop-blur-xl p-1.5">
            {Object.entries(STATUS_CONFIG).map(([key, conf]) => {
              const Icon = conf.icon;
              return (
                <ContextMenuItem
                  key={key}
                  onClick={() => onStatusChange(bookmark.id, key)}
                  className={cn("text-[13px] rounded-xl font-sans", bookmark.status === key && "font-medium bg-[var(--muted)]")}
                >
                  <Icon className="h-3.5 w-3.5 mr-2.5 opacity-50" />
                  {conf.label}
                  {bookmark.status === key && (
                    <CheckCircle2 className="h-3.5 w-3.5 ml-auto text-[var(--accent)]" />
                  )}
                </ContextMenuItem>
              );
            })}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuItem onClick={() => onEdit(bookmark)} className="text-[13px] rounded-xl cursor-pointer font-sans">
          <Pencil className="h-3.5 w-3.5 mr-2.5 opacity-50" />
          编辑
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-[var(--border)]" />
        <ContextMenuItem
          onClick={() => onDelete(bookmark.id)}
          className="text-[13px] rounded-xl text-red-400 hover:text-red-500 focus:text-red-500 cursor-pointer font-sans"
        >
          <Trash2 className="h-3.5 w-3.5 mr-2.5" />
          删除
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
