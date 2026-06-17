"use client";

import { useState, useEffect } from "react";
import { Loader2, Link, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ExtractedMetadata, AICategorizeOutput, BookmarkData } from "@/lib/types";
import { resolveImageUrl } from "@/lib/utils";
import { toast } from "sonner";

interface AddBookmarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  editBookmark?: BookmarkData | null;
}

type Step = "input" | "extracting" | "categorizing" | "preview" | "saving" | "done";

export function AddBookmarkDialog({
  open,
  onOpenChange,
  onCreated,
  editBookmark,
}: AddBookmarkDialogProps) {
  const [url, setUrl] = useState(editBookmark?.url || "");
  const [step, setStep] = useState<Step>("input");
  const [metadata, setMetadata] = useState<ExtractedMetadata | null>(null);
  const [aiResult, setAiResult] = useState<AICategorizeOutput | null>(null);
  const [error, setError] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");

  // Sync editBookmark prop into local state when dialog opens
  useEffect(() => {
    if (!open) return;
    if (editBookmark) {
      setUrl(editBookmark.url);
      setStep("preview");
      setMetadata({
        title: editBookmark.title,
        description: editBookmark.description || "",
        coverImage: editBookmark.coverImage || "",
        favicon: editBookmark.favicon || "",
        siteName: editBookmark.siteName || "",
        contentType: editBookmark.contentType,
        specifics: {},
      });
      setCustomTitle(editBookmark.title);
      setCustomDescription(editBookmark.description || "");
      setAiResult(null);
      setError("");
    } else {
      reset();
    }
  }, [open, editBookmark]);

  const isValidHttpUrl = (urlString: string): boolean => {
    try {
      const u = new URL(urlString.trim());
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!url.trim()) return;
    setError("");

    // Validate URL format before proceeding
    if (!isValidHttpUrl(url.trim())) {
      setError("请输入有效的 HTTP/HTTPS 链接");
      return;
    }

    // Step 0: Quick duplicate check before proceeding
    try {
      const dupRes = await fetch(`/api/bookmarks?url=${encodeURIComponent(url.trim())}&limit=1`);
      if (dupRes.ok) {
        const dupData = await dupRes.json();
        if (dupData.data?.length > 0) {
          setError("你已经收藏过这个网页了");
          toast.error("你已经收藏过这个网页了");
          return;
        }
      }
    } catch { /* proceed anyway if check fails */ }

    setStep("extracting");

    try {
      const metaRes = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!metaRes.ok) {
        const err = await metaRes.json();
        throw new Error(err.error || "元数据提取失败");
      }

      const meta = (await metaRes.json()) as ExtractedMetadata;
      setMetadata(meta);
      setCustomTitle(meta.title);
      setCustomDescription(meta.description || "");
      setStep("categorizing");

      try {
        const aiRes = await fetch("/api/ai/categorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: meta.title,
            description: meta.description,
            siteName: meta.siteName,
            contentType: meta.contentType,
          }),
        });

        if (aiRes.ok) {
          const ai = (await aiRes.json()) as AICategorizeOutput;
          setAiResult(ai);
        }
      } catch {
        // AI is optional
      }

      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "出了点问题");
      setStep("input");
    }
  };

  const handleSave = async () => {
    setStep("saving");
    try {
      if (editBookmark) {
        const res = await fetch(`/api/bookmarks/${editBookmark.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: customTitle || undefined,
            description: customDescription || undefined,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "更新失败");
        }
      } else {
        const res = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: url.trim(),
            title: customTitle || undefined,
            description: customDescription || undefined,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "保存失败");
        }

        window.dispatchEvent(new CustomEvent("bookmark-created"));
      }

      onCreated();
      reset();
      onOpenChange(false);
      toast.success(editBookmark ? "书签已更新" : "书签已收藏，AI 正在后台整理");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
      setStep("preview");
    }
  };

  // Direct background save: skip preview, close dialog immediately
  const handleQuickSave = async () => {
    if (!url.trim()) return;
    setError("");

    // Validate URL format
    if (!isValidHttpUrl(url.trim())) {
      setError("请输入有效的 HTTP/HTTPS 链接");
      return;
    }

    // Quick duplicate check
    try {
      const dupRes = await fetch(`/api/bookmarks?url=${encodeURIComponent(url.trim())}&limit=1`);
      if (dupRes.ok) {
        const dupData = await dupRes.json();
        if (dupData.data?.length > 0) {
          setError("你已经收藏过这个网页了");
          toast.error("你已经收藏过这个网页了");
          return;
        }
      }
    } catch { /* proceed */ }

    // Close dialog immediately
    reset();
    onOpenChange(false);

    toast.promise(
      fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      }).then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "收藏失败");
        }
        window.dispatchEvent(new CustomEvent("bookmark-created"));
        onCreated();
        return res;
      }),
      {
        loading: "正在收藏...",
        success: "书签已收藏，AI 正在后台整理",
        error: (err) => err instanceof Error ? err.message : "收藏失败，请重试",
      }
    );
  };

  const reset = () => {
    setUrl("");
    setStep("input");
    setMetadata(null);
    setAiResult(null);
    setError("");
    setCustomTitle("");
    setCustomDescription("");
  };

  const contentTypeLabels: Record<string, string> = {
    video: "视频",
    article: "文章",
    repository: "仓库",
    image: "图片",
    social: "社交",
    webpage: "网页",
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) reset();
        onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[85vh] rounded-2xl border border-[var(--border)] shadow-[0_20px_60px_rgba(0,0,0,0.06)] bg-[var(--popover)] backdrop-blur-xl p-0 gap-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex flex-col px-6 pt-5 pb-0 shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[17px] font-semibold text-[var(--foreground)] font-display">
              <div className="h-7 w-7 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-[var(--accent)]" />
              </div>
              {editBookmark ? "编辑书签" : "添加书签"}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[var(--muted-foreground)] mt-1 ml-9 font-sans">
              {editBookmark ? "修改书签的标题和描述" : "粘贴链接，AI 自动提取摘要并整理分类"}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-5 pt-4 overflow-y-auto flex-1">
          {/* Step: Input URL */}
          {step === "input" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Link className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground)]/15" />
                  <Input
                    placeholder="粘贴 URL..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.ctrlKey) handleSubmit(); // Ctrl+Enter = preview
                      else if (e.key === "Enter") handleQuickSave();      // Enter = quick save
                    }}
                    className="pl-10 h-11 rounded-xl bg-[var(--muted)] border-0 focus:bg-[var(--card)] focus:ring-2 focus:ring-[var(--accent)]/15 text-[14px] font-sans"
                    autoFocus
                  />
                </div>
                <Button
                  onClick={handleQuickSave}
                  disabled={!url.trim()}
                  className="rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)]/85 text-white h-11 px-5 text-[13px] font-medium shadow-none transition-all duration-200 hover:shadow-[0_4px_16px_rgba(183,110,75,0.2)] font-sans"
                >
                  收藏
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!url.trim()}
                  variant="ghost"
                  className="rounded-xl text-[13px] text-[var(--foreground)]/30 hover:text-[var(--foreground)]/50 hover:bg-[var(--muted)] font-sans h-11 px-4"
                  title="预览并编辑后再保存"
                >
                  预览
                </Button>
              </div>
              <p className="text-[10px] text-[var(--foreground)]/15 font-sans text-center">
                直接点"收藏"后台保存 · 点"预览"编辑后再保存 · Ctrl+Enter 也可预览
              </p>
              {error && (
                <p className="text-[13px] text-red-400 bg-red-50 dark:bg-red-500/5 rounded-xl px-3 py-2 font-sans">{error}</p>
              )}
            </div>
          )}

          {/* Step: Extracting / Categorizing */}
          {(step === "extracting" || step === "categorizing") && (
            <div className="flex flex-col items-center py-10 gap-4">
              <div className="h-12 w-12 rounded-2xl bg-[var(--muted)] flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
              </div>
              <div className="text-center">
                <p className="font-medium text-[14px] text-[var(--foreground)] font-sans">
                  {step === "extracting" ? "正在获取网页信息..." : "AI 正在分析内容..."}
                </p>
                <p className="text-[12px] text-[var(--muted-foreground)] mt-1 font-sans">
                  {step === "extracting" ? "提取标题、封面、站点信息" : "生成标签、分类和摘要"}
                </p>
              </div>
            </div>
          )}

          {/* Step: Preview */}
          {(step === "preview" || step === "saving") && metadata && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                {/* Cover image */}
                {metadata.coverImage && (
                  <div className="aspect-video rounded-xl overflow-hidden bg-[var(--muted)]">
                    <img
                      src={resolveImageUrl(metadata.coverImage, url) ?? undefined}
                      alt="封面"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                )}

                {/* Editable metadata */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {metadata.favicon && (
                      <img src={metadata.favicon} alt="" className="h-4 w-4 rounded-sm" />
                    )}
                    <span className="text-[12px] text-[var(--foreground)]/30 font-sans">{metadata.siteName}</span>
                    <Badge variant="outline" className="text-[10px] rounded-full border-[var(--border)] text-[var(--foreground)]/30 font-normal font-sans">
                      {contentTypeLabels[metadata.contentType] || "网页"}
                    </Badge>
                  </div>

                  <Input
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="text-[15px] font-semibold text-[var(--foreground)] border-0 bg-[var(--muted)] rounded-xl h-11 font-sans"
                    placeholder="标题"
                  />

                  <Textarea
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    className="text-[13px] text-[var(--foreground)]/50 resize-none border-0 bg-[var(--muted)] rounded-xl min-h-[60px] font-sans"
                    placeholder="描述"
                  />
                </div>

                {/* AI result */}
                {aiResult && (
                  <div className="bg-[var(--muted)] rounded-xl p-4 space-y-2.5">
                    <p className="text-[11px] font-medium text-[var(--accent)] flex items-center gap-1.5 font-sans">
                      <Sparkles className="h-3 w-3" /> AI 整理结果
                    </p>
                    {aiResult.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {aiResult.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[11px] px-2.5 py-1 rounded-lg bg-[var(--card)] border-0 text-[var(--foreground)]/45 font-normal font-sans">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {aiResult.category && (
                      <p className="text-[12px] text-[var(--foreground)]/45 font-sans">
                        📁 建议分类：{aiResult.category}
                      </p>
                    )}
                    {aiResult.summary && (
                      <p className="text-[12px] text-[var(--foreground)]/45 leading-relaxed font-sans">
                        {aiResult.summary}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={handleSave}
                    className="flex-1 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)]/85 text-white h-11 text-[13px] font-medium shadow-none transition-all duration-200 hover:shadow-[0_4px_16px_rgba(183,110,75,0.2)] font-sans"
                    disabled={step === "saving"}
                  >
                    {step === "saving" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        保存中...
                      </>
                    ) : (
                      "确认收藏"
                    )}
                  </Button>
                  <Button variant="ghost" onClick={reset} className="rounded-xl text-[13px] text-[var(--foreground)]/30 hover:text-[var(--foreground)]/50 hover:bg-[var(--muted)] font-sans">
                    取消
                  </Button>
                </div>
                {error && (
                  <p className="text-[13px] text-red-400 bg-red-50 dark:bg-red-500/5 rounded-xl px-3 py-2 font-sans">{error}</p>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
