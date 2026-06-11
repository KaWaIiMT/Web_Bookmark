"use client";

import { useState, useEffect } from "react";
import { Zap, Plus } from "lucide-react";

interface SmartCollectionData {
  id: string;
  name: string;
  slug: string;
  isSmart: boolean;
  rules: string | null;
  sortBy: string | null;
  sortOrder: string | null;
  maxItems: number | null;
  _count: { bookmarks: number };
}

interface SmartCollectionBlockProps {
  collections: SmartCollectionData[];
  activeCollection: string | null;
  onCollectionClick: (id: string) => void;
  onAddClick: () => void;
}

export function SmartCollectionBlock({
  collections,
  activeCollection,
  onCollectionClick,
  onAddClick,
}: SmartCollectionBlockProps) {
  if (collections.length === 0) {
    return (
      <div className="px-3 py-2">
        <button
          onClick={onAddClick}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl border border-dashed border-[var(--border)] text-[12px] text-[var(--muted-foreground)] font-sans hover:text-[var(--foreground)] hover:border-[var(--foreground)]/20 transition-colors cursor-pointer"
        >
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          创建智能收藏夹
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between px-3 py-1">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3 w-3 text-amber-400" />
          <span className="text-[11px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-sans">
            智能收藏夹
          </span>
        </div>
        <button
          onClick={onAddClick}
          className="p-0.5 rounded hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors cursor-pointer"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      {collections.map((col) => (
        <button
          key={col.id}
          onClick={() => onCollectionClick(col.id)}
          className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-[13px] font-sans transition-all cursor-pointer ${
            activeCollection === col.id
              ? "bg-[var(--accent)]/10 text-[var(--accent)] font-medium"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50"
          }`}
        >
          <Zap className={`h-3.5 w-3.5 shrink-0 ${activeCollection === col.id ? "text-amber-400" : "text-amber-400/60"}`} />
          <span className="truncate flex-1 text-left">{col.name}</span>
          <span className="text-[10px] tabular-nums opacity-50 shrink-0">
            {col._count?.bookmarks ?? 0}
          </span>
        </button>
      ))}
    </div>
  );
}
