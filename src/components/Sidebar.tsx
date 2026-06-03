"use client";

import { useState, useEffect } from "react";
import { Bookmark, Hash, Clock, BookOpen, CheckCircle2, Archive, Plus, Folder, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { CategoryData } from "@/lib/types";

interface CollectionData {
  id: string;
  name: string;
  slug: string;
  isPublic: boolean;
  _count: { bookmarks: number };
}

interface SidebarProps {
  activeStatus: string | null;
  activeCategory: string | null;
  onStatusChange: (status: string | null) => void;
  onCategoryChange: (categoryId: string | null) => void;
  onAddClick: () => void;
  onCollectionClick?: (collectionId: string) => void;
  activeCollection?: string | null;
}

const STATUS_OPTIONS = [
  { value: "unread", label: "待读", icon: Clock, color: "#d4a853" },
  { value: "reading", label: "在读", icon: BookOpen, color: "#b76e4b" },
  { value: "read", label: "已读", icon: CheckCircle2, color: "#7a9e7e" },
  { value: "archived", label: "归档", icon: Archive, color: "#9e9e9e" },
];

export function Sidebar({
  activeStatus,
  activeCategory,
  onStatusChange,
  onCategoryChange,
  onAddClick,
  onCollectionClick,
  activeCollection,
}: SidebarProps) {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [newColName, setNewColName] = useState("");
  const [addingCol, setAddingCol] = useState(false);

  const fetchCategories = () => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.data || []))
      .catch(() => {});
  };

  const fetchCollections = () => {
    fetch("/api/collections")
      .then((r) => r.json())
      .then((d) => setCollections(d.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchCategories();
    fetchCollections();
    const handler = () => {
      fetchCategories();
      fetchCollections();
    };
    window.addEventListener("bookmark-created", handler);
    return () => window.removeEventListener("bookmark-created", handler);
  }, []);

  const handleCreateCollection = async () => {
    if (!newColName.trim()) return;
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newColName.trim() }),
      });
      if (!res.ok) throw new Error();
      setNewColName("");
      setAddingCol(false);
      fetchCollections();
      toast.success("收藏夹已创建");
    } catch {
      toast.error("创建失败");
    }
  };

  return (
    <aside className="w-60 shrink-0 flex flex-col h-full bg-[#f5f3f0]/80 backdrop-blur-xl border-r border-[#2c2c2c]/[0.04]">
      {/* Logo area */}
      <div className="px-5 pt-5 pb-2">
        <h2 className="font-display text-lg font-bold text-[#2c2c2c] tracking-tight leading-none">
          MarkBox
        </h2>
        <p className="text-[11px] text-[#2c2c2c]/35 mt-1 font-sans">
          AI 智能书签管理
        </p>
      </div>

      {/* Add Bookmark Button */}
      <div className="px-4 pt-3 pb-4">
        <Button
          className="w-full gap-2 font-medium rounded-xl bg-[#b76e4b] hover:bg-[#a05d3d] text-white shadow-none text-[13px] h-9 transition-all duration-200 hover:shadow-[0_4px_20px_rgba(183,110,75,0.25)]"
          onClick={onAddClick}
        >
          <Plus className="h-4 w-4" />
          添加书签
        </Button>
      </div>

      {/* Thin separator */}
      <div className="mx-4 h-px bg-[#2c2c2c]/[0.04]" />

      <ScrollArea className="flex-1">
        {/* Collections */}
        <div className="px-3 pt-4 pb-1">
          <div className="flex items-center justify-between px-3 mb-1.5">
            <p className="text-[10px] font-medium text-[#2c2c2c]/25 uppercase tracking-widest font-sans">
              收藏夹
            </p>
            <button
              onClick={() => setAddingCol(!addingCol)}
              className="text-[#2c2c2c]/20 hover:text-[#2c2c2c]/40 transition-colors"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          {addingCol && (
            <div className="px-3 pb-2 flex gap-1">
              <Input
                placeholder="收藏夹名称..."
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateCollection()}
                className="h-7 text-[12px] rounded-lg bg-white/60 border-0 font-sans"
                autoFocus
              />
              <Button
                onClick={handleCreateCollection}
                disabled={!newColName.trim()}
                className="h-7 rounded-lg bg-[#b76e4b] hover:bg-[#a05d3d] text-white text-[11px] px-2 font-sans"
              >
                创建
              </Button>
            </div>
          )}
          {collections.map((col) => (
            <button
              key={col.id}
              onClick={() => onCollectionClick?.(col.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all duration-200",
                activeCollection === col.id
                  ? "bg-white/60 text-[#2c2c2c] font-medium shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
                  : "text-[#2c2c2c]/45 hover:bg-white/30 hover:text-[#2c2c2c]/65"
              )}
            >
              <Folder className="h-3.5 w-3.5 opacity-50 shrink-0" />
              <span className="truncate flex-1 text-left">{col.name}</span>
              <span className="text-[10px] text-[#2c2c2c]/20 shrink-0">{col._count.bookmarks}</span>
            </button>
          ))}
        </div>

        <div className="mx-4 h-px bg-[#2c2c2c]/[0.04] mt-2" />

        {/* Status Filter */}
        <div className="px-3 pt-3 pb-1">
          <p className="px-3 mb-1.5 text-[10px] font-medium text-[#2c2c2c]/25 uppercase tracking-widest font-sans">
            状态
          </p>
          <button
            onClick={() => { onStatusChange(null); if (onCollectionClick) onCollectionClick("" as any); }}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all duration-200",
              !activeStatus && !activeCollection
                ? "bg-white/60 text-[#2c2c2c] font-medium shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
                : "text-[#2c2c2c]/45 hover:bg-white/30 hover:text-[#2c2c2c]/65"
            )}
          >
            <Bookmark className="h-3.5 w-3.5 opacity-50" />
            全部
          </button>
          {STATUS_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = activeStatus === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => { onStatusChange(opt.value); if (onCollectionClick) onCollectionClick("" as any); }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all duration-200",
                  isActive
                    ? "bg-white/60 text-[#2c2c2c] font-medium shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
                    : "text-[#2c2c2c]/45 hover:bg-white/30 hover:text-[#2c2c2c]/65"
                )}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: isActive ? opt.color : undefined, opacity: isActive ? 1 : 0.4 }} />
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Categories */}
        <div className="px-3 pt-3 pb-4">
          <p className="px-3 mb-1.5 text-[10px] font-medium text-[#2c2c2c]/25 uppercase tracking-widest font-sans">
            分类
          </p>
          <button
            onClick={() => onCategoryChange(null)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all duration-200",
              !activeCategory
                ? "bg-white/60 text-[#2c2c2c] font-medium shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
                : "text-[#2c2c2c]/45 hover:bg-white/30 hover:text-[#2c2c2c]/65"
            )}
          >
            <Hash className="h-3.5 w-3.5 opacity-50" />
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all duration-200 justify-between",
                activeCategory === cat.id
                  ? "bg-white/60 text-[#2c2c2c] font-medium shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
                  : "text-[#2c2c2c]/45 hover:bg-white/30 hover:text-[#2c2c2c]/65"
              )}
            >
              <span className="flex items-center gap-2.5">
                <Hash className="h-3.5 w-3.5 opacity-50" />
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#2c2c2c]/[0.04]">
        <p className="text-[10px] text-[#2c2c2c]/20 text-center tracking-wider font-sans">
          MarkBox
        </p>
      </div>
    </aside>
  );
}
