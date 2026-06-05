import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { TagBadge } from "./TagBadge";
import { CategorySelector } from "./CategorySelector";
import type { ExtractedMetadata, AICategorizeOutput } from "@/lib/types";

interface BookmarkPreviewCardProps {
  url: string;
  metadata: ExtractedMetadata;
  aiResult: AICategorizeOutput | null;
  onTitleChange: (title: string) => void;
  onTagRemove: (tag: string) => void;
  onTagAdd: (tag: string) => void;
  onCategoryChange: (categoryId: string | null) => void;
  onConfirm: () => void;
  tags: string[];
  title: string;
  categoryId: string | null;
  saving?: boolean;
}

export function BookmarkPreviewCard({
  url,
  metadata,
  aiResult,
  onTitleChange,
  onTagRemove,
  onTagAdd,
  onCategoryChange,
  onConfirm,
  tags,
  title,
  categoryId,
  saving,
}: BookmarkPreviewCardProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState("");

  function handleAddTag() {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onTagAdd(trimmed);
      setNewTag("");
      setShowTagInput(false);
    }
  }

  return (
    <div className="flex flex-col">
      {/* Cover Image */}
      {metadata.coverImage && (
        <div className="relative aspect-[2.2/1] bg-[var(--muted)] overflow-hidden">
          <img
            src={metadata.coverImage.startsWith("//") ? `https:${metadata.coverImage}` : metadata.coverImage}
            alt=""
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Favicon + Site name */}
        <div className="flex items-center gap-1.5">
          {metadata.favicon && (
            <img
              src={metadata.favicon}
              alt=""
              className="h-4 w-4 rounded-sm shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <span className="text-[11px] text-[var(--foreground)]/30 truncate font-sans">
            {metadata.siteName || new URL(url).hostname}
          </span>
        </div>

        {/* Title */}
        {editingTitle ? (
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
            autoFocus
            className="w-full text-[14px] font-semibold px-2 py-1 rounded-lg border border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] font-sans outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        ) : (
          <button
            onClick={() => setEditingTitle(true)}
            className="text-left w-full group cursor-text"
          >
            <span className="font-semibold text-[14px] leading-snug text-[var(--foreground)]/85 font-sans">
              {title || metadata.title}
            </span>
            <Pencil className="inline-block h-3 w-3 ml-1.5 text-[var(--foreground)]/15 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}

        {/* AI Summary */}
        {aiResult?.summary && (
          <p className="text-[12px] text-[var(--foreground)]/35 leading-relaxed line-clamp-3 font-sans">
            {aiResult.summary}
          </p>
        )}

        {/* Category selector */}
        <CategorySelector
          selectedCategoryId={categoryId}
          onSelect={onCategoryChange}
        />

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((tag) => (
            <TagBadge key={tag} name={tag} onRemove={() => onTagRemove(tag)} />
          ))}
          {showTagInput ? (
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onBlur={() => {
                handleAddTag();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddTag();
                if (e.key === "Escape") setShowTagInput(false);
              }}
              autoFocus
              placeholder="新标签"
              className="w-20 text-[10px] px-2 py-0.5 rounded-full border border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] font-sans outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          ) : (
            <button
              onClick={() => setShowTagInput(true)}
              className="inline-flex items-center justify-center h-5 w-5 rounded-full border border-dashed border-[var(--border)] text-[var(--foreground)]/20 hover:text-[var(--foreground)]/40 hover:border-[var(--foreground)]/20 transition-colors cursor-pointer"
            >
              <Plus className="h-2.5 w-2.5" />
            </button>
          )}
        </div>

        {/* Confirm button */}
        <button
          onClick={onConfirm}
          disabled={saving}
          className="w-full mt-3 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] text-[13px] font-medium font-sans transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          {saving ? "收藏中..." : "确认收藏"}
        </button>
      </div>
    </div>
  );
}
