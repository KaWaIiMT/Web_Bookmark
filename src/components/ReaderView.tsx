"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, FileArchive, Download, Loader2, AlertTriangle, MessageSquare, List, Highlighter } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BookmarkData } from "@/lib/types";

interface ReadableData {
  title: string;
  content: string;
  textContent: string;
  excerpt: string;
  byline: string | null;
  siteName: string | null;
  length: number;
  source?: string;
}

export interface AnnotationAnchor {
  xpath: string;
  startOffset: number;
  endOffset: number;
  textPrefix: string;
  textSuffix: string;
  selectedText: string;
}

interface Annotation {
  id: string;
  bookmarkId: string;
  type: string;
  color: string | null;
  text: string;
  note: string | null;
  anchor: string;
  createdAt: string;
}

const COLOR_CONFIG: Record<string, { bg: string; border: string; label: string }> = {
  yellow: { bg: "bg-yellow-200/60 dark:bg-yellow-500/30", border: "border-yellow-400 dark:border-yellow-500/50", label: "重点" },
  green: { bg: "bg-emerald-200/60 dark:bg-emerald-500/30", border: "border-emerald-400 dark:border-emerald-500/50", label: "好观点" },
  blue: { bg: "bg-blue-200/60 dark:bg-blue-500/30", border: "border-blue-400 dark:border-blue-500/50", label: "疑问" },
  red: { bg: "bg-red-200/60 dark:bg-red-500/30", border: "border-red-400 dark:border-red-500/50", label: "需验证" },
};

const COLOR_OPTIONS = [
  { key: "yellow", label: "🟡 重点" },
  { key: "green", label: "🟢 好观点" },
  { key: "blue", label: "🔵 疑问" },
  { key: "red", label: "🔴 需验证" },
];

interface ReaderViewProps {
  bookmark: BookmarkData;
  open: boolean;
  onClose: () => void;
}

export function ReaderView({ bookmark, open, onClose }: ReaderViewProps) {
  const [readable, setReadable] = useState<ReadableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Fetch readable content
  useEffect(() => {
    if (!open || !bookmark) return;
    setLoading(true);
    setError(null);
    fetch(`/api/bookmarks/${bookmark.id}/readable`)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || `服务器错误 (${r.status})`);
        }
        return r.json();
      })
      .then((data) => setReadable(data))
      .catch((err) => setError(err.message || "加载失败"))
      .finally(() => setLoading(false));
  }, [bookmark?.id, open]);

  // Fetch annotations
  const fetchAnnotations = useCallback(async () => {
    if (!bookmark) return;
    try {
      const res = await fetch(`/api/bookmarks/${bookmark.id}/annotations`);
      if (res.ok) {
        const data = await res.json();
        setAnnotations(data);
      }
    } catch {}
  }, [bookmark]);

  useEffect(() => {
    if (open) fetchAnnotations();
  }, [open, fetchAnnotations]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "a" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowPanel((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Estimated reading time
  const readingTimeMinutes = readable?.textContent
    ? Math.max(1, Math.round(readable.textContent.length / 400))
    : null;

  // Track reading progress
  const handleScroll = useCallback(() => {
    if (!contentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const progress = scrollHeight > clientHeight
      ? Math.round((scrollTop / (scrollHeight - clientHeight)) * 100)
      : 100;
    setReadingProgress(progress);
  }, []);

  // Export annotations
  const handleExport = () => {
    window.open(`/api/bookmarks/${bookmark.id}/annotations/export`, "_blank");
  };

  // Create annotation from selection
  const createAnnotation = useCallback(
    async (color: string, note?: string, preselectedText?: string, preselectedAnchor?: AnnotationAnchor) => {
      // Use pre-captured selection data if available (from SelectionToolbar),
      // otherwise read from live selection (direct color click without note)
      let selectedText: string;
      let anchor: AnnotationAnchor;

      if (preselectedText && preselectedAnchor) {
        selectedText = preselectedText;
        anchor = preselectedAnchor;
      } else {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || !selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        selectedText = range.toString().trim();
        if (!selectedText) return;

        anchor = {
          xpath: getXPath(range.startContainer),
          startOffset: range.startOffset,
          endOffset: range.endOffset,
          textPrefix: (range.startContainer.textContent || "").slice(Math.max(0, range.startOffset - 20), range.startOffset),
          textSuffix: (range.endContainer.textContent || "").slice(range.endOffset, range.endOffset + 20),
          selectedText,
        };
      }

      try {
        const res = await fetch(`/api/bookmarks/${bookmark.id}/annotations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "highlight",
            color,
            text: selectedText,
            note: note || null,
            anchor,
          }),
        });
        if (res.ok) {
          await fetchAnnotations();
          const sel = window.getSelection();
          if (sel) sel.removeAllRanges();
        } else {
          const err = await res.json().catch(() => ({}));
          console.error("Failed to save annotation:", err.error || res.statusText);
        }
      } catch (err) {
        console.error("Annotation save error:", err);
      }
    },
    [bookmark, fetchAnnotations]
  );

  // Delete annotation
  const deleteAnnotation = async (annotationId: string) => {
    try {
      const res = await fetch(`/api/bookmarks/${bookmark.id}/annotations/${annotationId}`, { method: "DELETE" });
      if (res.ok) await fetchAnnotations();
    } catch {}
  };

  // Apply highlights to rendered content using anchor data for precise positioning
  useEffect(() => {
    if (!contentRef.current || annotations.length === 0) return;

    // Remove old highlight spans first
    contentRef.current.querySelectorAll(".annotation-highlight").forEach((el) => {
      const parent = el.parentNode;
      if (parent) {
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
      }
    });
    contentRef.current.normalize();

    // Search root: prefer [data-reader-body] to skip header/excerpt area
    const searchRoot =
      contentRef.current.querySelector("[data-reader-body]") ||
      contentRef.current;

    // Apply each annotation as a highlight
    for (const ann of annotations) {
      if (ann.type !== "highlight" || !ann.color) continue;
      const color = ann.color;
      const text = ann.text;
      if (!text || text.length < 2) continue;

      let anchor: AnnotationAnchor | null = null;
      try {
        anchor = ann.anchor ? JSON.parse(ann.anchor) : null;
      } catch {
        anchor = null;
      }

      // Build a fingerprint: prefix + text (for precise location)
      const prefix = anchor?.textPrefix || "";
      const suffix = anchor?.textSuffix || "";
      const fingerprint = prefix + text;

      // Search text nodes within the body content only for the exact location
      const walker = document.createTreeWalker(
        searchRoot,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node) {
            if ((node.parentElement as Element)?.closest?.(".annotation-highlight")) return NodeFilter.FILTER_REJECT;
            if ((node.parentElement as Element)?.closest?.("script, style")) return NodeFilter.FILTER_REJECT;
            return (node.textContent || "").length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
          },
        }
      );

      let bestNode: Text | null = null;
      let bestIdx = -1;
      let bestScore = Infinity;

      // Find the best match: prefer fingerprint match, fall back to text-only
      let textNode: Text | null;
      while ((textNode = walker.nextNode() as Text)) {
        const nodeText = textNode.textContent || "";

        // Try fingerprint match first (most precise)
        const fpIdx = prefix ? nodeText.indexOf(fingerprint) : -1;
        if (fpIdx !== -1) {
          const idx = fpIdx + prefix.length;
          // Perfect match found — use immediately
          bestNode = textNode;
          bestIdx = idx;
          break;
        }

        // Fallback: text match, score by how close to prefix
        const txtIdx = nodeText.indexOf(text);
        if (txtIdx !== -1) {
          // Prefer matches closer to the beginning (the first visible text)
          // But if we have prefix info, prefer matches near where prefix would be
          const score = prefix
            ? Math.abs(nodeText.indexOf(prefix) - txtIdx)
            : txtIdx;
          if (score < bestScore) {
            bestScore = score;
            bestNode = textNode;
            bestIdx = txtIdx;
          }
        }
      }

      // If no match found, try searching again without prefix (still within body)
      if (!bestNode) {
        const walker2 = document.createTreeWalker(
          searchRoot,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode(node) {
              if ((node.parentElement as Element)?.closest?.(".annotation-highlight")) return NodeFilter.FILTER_REJECT;
              if ((node.parentElement as Element)?.closest?.("script, style")) return NodeFilter.FILTER_REJECT;
              return (node.textContent || "").length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            },
          }
        );
        let n: Text | null;
        while ((n = walker2.nextNode() as Text)) {
          const nodeText = n.textContent || "";
          const idx = nodeText.indexOf(text);
          if (idx !== -1) {
            bestNode = n;
            bestIdx = idx;
            break;
          }
        }
      }

      if (!bestNode || bestIdx === -1) continue;

      // Verify suffix matches (extra validation)
      if (suffix && bestNode.textContent) {
        const afterText = bestNode.textContent.slice(bestIdx + text.length, bestIdx + text.length + suffix.length);
        if (afterText !== suffix) {
          // Suffix doesn't match — might be wrong location, but proceed anyway
          // (suffix mismatch can happen if the DOM changed slightly)
        }
      }

      // Create and apply the highlight
      const range = document.createRange();
      range.setStart(bestNode, bestIdx);
      range.setEnd(bestNode, bestIdx + text.length);

      const span = document.createElement("span");
      span.className = `annotation-highlight annotation-${ann.id}`;
      const config = COLOR_CONFIG[color];
      span.style.backgroundColor = color === "yellow" ? "rgba(234,179,8,0.3)" :
        color === "green" ? "rgba(16,185,129,0.3)" :
        color === "blue" ? "rgba(59,130,246,0.3)" :
        "rgba(239,68,68,0.3)";
      span.style.borderBottom = `2px solid ${color === "yellow" ? "#eab308" : color === "green" ? "#10b981" : color === "blue" ? "#3b82f6" : "#ef4444"}`;
      span.style.cursor = "pointer";
      span.style.borderRadius = "2px";
      span.style.padding = "0 1px";
      span.title = ann.note ? `💡 ${ann.note}` : config?.label || "";
      span.dataset.annotationId = ann.id;
      span.dataset.color = color;

      try {
        range.surroundContents(span);
      } catch {
        range.detach();
      }
    }
  }, [annotations, readable]);

  // Render highlight spans in content
  const renderContent = () => {
    if (!readable?.content) return null;
    return (
      <div
        className="reader-content prose prose-base dark:prose-invert max-w-none font-sans text-[15px] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: readable.content }}
      />
    );
  };

  if (!bookmark) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-[var(--background)] flex flex-col"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
        >
          {/* Toolbar */}
          <header className="flex items-center gap-3 px-5 py-3 shrink-0 bg-[var(--sidebar)] backdrop-blur-xl border-b border-[var(--sidebar-border)]">
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-[var(--sidebar-item-hover)] text-[var(--muted-foreground)] transition-colors shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-[14px] font-semibold text-[var(--foreground)] truncate font-display">
                {readable?.title || bookmark.title}
              </h2>
              {readable?.byline && (
                <p className="text-[11px] text-[var(--muted-foreground)] font-sans">{readable.byline}</p>
              )}
            </div>

            {/* Color filters */}
            <div className="flex items-center gap-1">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setActiveColor(activeColor === c.key ? null : c.key)}
                  className={cn(
                    "px-2 py-1 rounded-lg text-[11px] font-sans transition-colors",
                    activeColor === c.key
                      ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--sidebar-item-hover)]"
                  )}
                >
                  {c.label.split(" ")[0]}
                </button>
              ))}
            </div>

            {/* Tool buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPanel(!showPanel)}
                className={cn("rounded-xl text-[12px] font-sans", showPanel && "bg-[var(--accent)]/10 text-[var(--accent)]")}
              >
                <List className="h-4 w-4 mr-1" />
                批注
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExport}
                disabled={annotations.length === 0}
                className="rounded-xl text-[12px] font-sans"
              >
                <Download className="h-4 w-4 mr-1" />
                导出
              </Button>
            </div>

            {/* Reading progress + time estimate */}
            {loading ? null : (
              <div className="hidden sm:flex items-center gap-3 ml-2 shrink-0">
                {readingTimeMinutes && (
                  <span className="text-[10px] text-[var(--muted-foreground)] font-sans whitespace-nowrap">
                    约 {readingTimeMinutes} 分钟
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <div className="h-1 w-20 rounded-full bg-[var(--muted)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                      style={{ width: `${readingProgress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[var(--muted-foreground)] font-sans w-7 text-right">
                    {readingProgress}%
                  </span>
                </div>
              </div>
            )}
          </header>

          {/* Body */}
          <div className="flex-1 flex min-h-0">
            {/* Content area */}
            <div className="flex-1 overflow-y-auto" ref={contentRef} onScroll={handleScroll}>
              {loading ? (
                <div className="flex items-center justify-center py-32">
                  <Loader2 className="h-8 w-8 animate-spin text-[var(--foreground)]/20" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-32 gap-3 px-6">
                  <AlertTriangle className="h-8 w-8 text-red-400" />
                  <p className="text-[14px] text-[var(--foreground)]/40 font-sans">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(bookmark.url, "_blank")}
                    className="rounded-xl text-[12px] border-[var(--border)] font-sans"
                  >
                    打开原始链接
                  </Button>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto px-6 py-10">
                  {/* Bookmark source info */}
                  <div className="mb-8 pb-6 border-b border-[var(--border)]">
                    <p className="text-[11px] text-[var(--muted-foreground)] font-sans mb-2">
                      原文：{bookmark.siteName || bookmark.url}
                      {readable?.source === "archive" && " · 来自存档"}
                    </p>
                    {readable?.excerpt && (
                      <p className="text-[13px] text-[var(--foreground)]/40 font-sans italic">
                        {readable.excerpt}
                      </p>
                    )}
                  </div>
                  <div data-reader-body>{renderContent()}</div>
                </div>
              )}
            </div>

            {/* Annotation panel (sidebar) */}
            {showPanel && (
              <motion.div
                className="w-80 shrink-0 border-l border-[var(--border)] bg-[var(--sidebar)]/50 backdrop-blur-xl overflow-y-auto"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-4">
                  <h3 className="text-[12px] font-medium text-[var(--foreground)] font-sans mb-3 flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 opacity-50" />
                    批注列表
                    <span className="text-[var(--muted-foreground)] font-normal">
                      ({annotations.length})
                    </span>
                  </h3>

                  {annotations.length === 0 ? (
                    <p className="text-[12px] text-[var(--muted-foreground)] font-sans">
                      选中文字后高亮划线，批注将显示在这里
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {annotations
                        .filter((a) => !activeColor || a.color === activeColor)
                        .map((a) => {
                          const config = a.color ? COLOR_CONFIG[a.color] : null;
                          return (
                            <div
                              key={a.id}
                              className={cn(
                                "p-3 rounded-xl border text-[12px] font-sans group",
                                config?.bg || "bg-[var(--muted)]/50",
                                config?.border || "border-[var(--border)]"
                              )}
                            >
                              <p className="text-[var(--foreground)]/70 leading-relaxed">
                                {a.text.slice(0, 200)}
                              </p>
                              {a.note && (
                                <p className="text-[var(--foreground)]/40 mt-1.5 pl-2 border-l-2 border-[var(--accent)]/30 italic">
                                  {a.note}
                                </p>
                              )}
                              <div className="flex items-center justify-between mt-1.5">
                                <span className="text-[10px] text-[var(--muted-foreground)]">
                                  {config?.label || "笔记"}
                                </span>
                                <button
                                  onClick={() => deleteAnnotation(a.id)}
                                  className="text-[10px] text-red-400/0 group-hover:text-red-400/60 hover:text-red-500 transition-colors cursor-pointer"
                                >
                                  删除
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Selection toolbar (Phase 4 will make this more interactive) */}
          <SelectionToolbar onCreateAnnotation={createAnnotation} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Selection toolbar with note input
function SelectionToolbar({
  onCreateAnnotation,
}: {
  onCreateAnnotation: (color: string, note?: string, preselectedText?: string, preselectedAnchor?: AnnotationAnchor) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [pendingColor, setPendingColor] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  // Keep the selection alive across note input clicks
  const savedSelectionRef = useRef<{ text: string; anchor: AnnotationAnchor } | null>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      // Don't react to selection changes while note input is open
      if (showNoteInput) return;

      const selection = window.getSelection();
      if (selection && !selection.isCollapsed && selection.toString().trim()) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 44,
        });
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [showNoteInput]);

  useEffect(() => {
    if (showNoteInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showNoteInput]);

  const handleColorClick = (color: string) => {
    // Snapshot the selection NOW before it gets lost when user clicks note input
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim();
    if (!selectedText) return;

    const anchor: AnnotationAnchor = {
      xpath: getXPath(range.startContainer),
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      textPrefix: (range.startContainer.textContent || "").slice(Math.max(0, range.startOffset - 20), range.startOffset),
      textSuffix: (range.endContainer.textContent || "").slice(range.endOffset, range.endOffset + 20),
      selectedText,
    };
    savedSelectionRef.current = { text: selectedText, anchor };

    setPendingColor(color);
    setShowNoteInput(true);
    setNoteText("");
  };

  const handleSaveNote = () => {
    if (pendingColor && savedSelectionRef.current) {
      // Pass the saved selection data directly — don't rely on window.getSelection()
      onCreateAnnotation(pendingColor, noteText.trim() || undefined, savedSelectionRef.current.text, savedSelectionRef.current.anchor);
    }
    setShowNoteInput(false);
    setPendingColor(null);
    setNoteText("");
    setVisible(false);
    savedSelectionRef.current = null;
  };

  const handleSkipNote = () => {
    if (pendingColor && savedSelectionRef.current) {
      onCreateAnnotation(pendingColor, undefined, savedSelectionRef.current.text, savedSelectionRef.current.anchor);
    }
    setShowNoteInput(false);
    setPendingColor(null);
    setNoteText("");
    setVisible(false);
    savedSelectionRef.current = null;
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed z-[60] flex flex-col gap-1.5 px-2 py-1.5 rounded-xl bg-[var(--popover)] border border-[var(--border)] shadow-lg min-w-[200px]"
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          style={{ left: position.x, top: position.y, transform: "translate(-50%, 0)" }}
        >
          {!showNoteInput ? (
            <div className="flex items-center gap-1">
              <Highlighter className="h-3.5 w-3.5 text-[var(--muted-foreground)] mr-1" />
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.key}
                  onMouseDown={(e) => {
                    // Prevent mousedown from clearing the selection
                    e.preventDefault();
                  }}
                  onClick={() => handleColorClick(c.key)}
                  className="h-6 w-6 rounded-full cursor-pointer border-2 border-transparent hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.key === "yellow" ? "#eab308" : c.key === "green" ? "#10b981" : c.key === "blue" ? "#3b82f6" : "#ef4444" }}
                  title={c.label}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 min-w-[180px]">
              <div className="flex items-center gap-1">
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: pendingColor === "yellow" ? "#eab308" : pendingColor === "green" ? "#10b981" : pendingColor === "blue" ? "#3b82f6" : "#ef4444" }}
                />
                <span className="text-[11px] text-[var(--muted-foreground)] font-sans">添加备注（可选）</span>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveNote();
                  if (e.key === "Escape") handleSkipNote();
                }}
                placeholder="写点什么..."
                className="h-8 px-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[12px] font-sans text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--accent)]/10"
              />
              <div className="flex gap-1 justify-end">
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleSkipNote}
                  className="px-2 py-0.5 text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-sans cursor-pointer rounded"
                >
                  跳过
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleSaveNote}
                  className="px-2 py-0.5 text-[10px] text-[var(--accent)] hover:underline font-sans cursor-pointer rounded"
                >
                  保存
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Utility: get XPath for a DOM node
function getXPath(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return getXPath(node.parentNode!) + `/text()[1]`;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const element = node as Element;
  const parts: string[] = [];
  let current: Node | null = element;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    const el = current as Element;
    let index = 0;
    let sibling = el.previousSibling;
    while (sibling) {
      if (sibling.nodeType === Node.ELEMENT_NODE && (sibling as Element).tagName === el.tagName) {
        index++;
      }
      sibling = sibling.previousSibling;
    }
    const tagName = el.tagName.toLowerCase();
    parts.unshift(index > 0 ? `${tagName}[${index + 1}]` : tagName);
    current = el.parentNode;
  }

  return "/" + parts.join("/");
}
