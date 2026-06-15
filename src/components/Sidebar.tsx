"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "motion/react";
import { Bookmark, Hash, Clock, BookOpen, CheckCircle2, Archive, Plus, Folder, GripVertical, Pin, PinOff, Pencil, Trash2 } from "lucide-react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SmartCollectionBlock } from "@/components/SmartCollectionBlock";
import { playPickup, playDrop } from "@/lib/sounds";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { CategoryData } from "@/lib/types";

interface CollectionData {
  id: string;
  name: string;
  slug: string;
  isPublic: boolean;
  isSmart: boolean;
  rules: string | null;
  sortBy: string | null;
  sortOrder: string | null;
  maxItems: number | null;
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
  onAddSmartClick?: () => void;
}

const STATUS_OPTIONS = [
  { value: "unread", label: "待读", icon: Clock, color: "#d4a853" },
  { value: "reading", label: "在读", icon: BookOpen, color: "#b76e4b" },
  { value: "read", label: "已读", icon: CheckCircle2, color: "#7a9e7e" },
  { value: "archived", label: "归档", icon: Archive, color: "#9e9e9e" },
];

function SortableCategoryItem({
  cat,
  isActive,
  isPinned,
  isDragging,
  onClick,
  onTogglePin,
  onRename,
  onDelete,
}: {
  cat: CategoryData;
  isActive: boolean;
  isPinned: boolean;
  isDragging: boolean;
  onClick: () => void;
  onTogglePin: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: cat.id, disabled: isPinned });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition:
      transition ??
      "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
    zIndex: isDragging ? 50 : 0,
    position: "relative" as const,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="relative">
      <motion.div
        className="rounded-xl origin-center"
        animate={{
          scale: isDragging ? 1.06 : 1,
          boxShadow: isDragging
            ? "0 8px 30px rgba(44,44,44,0.18), 0 2px 8px rgba(183,110,75,0.10)"
            : "0 0 0 rgba(0,0,0,0)",
          rotate: isDragging ? -1.2 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 420,
          damping: 28,
          mass: 0.6,
        }}
        whileHover={{
          scale: 1.02,
          transition: { type: "spring", stiffness: 400, damping: 25 },
        }}
        whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
      >
        <ContextMenu>
          <ContextMenuTrigger className="block w-full">
            <div className="flex items-center gap-1 group/item relative">
              {/* Drag handle — hidden for pinned items */}
              {!isPinned && (
                <button
                  {...listeners}
                  className="shrink-0 p-0.5 rounded-md text-[var(--foreground)]/0 group-hover/item:text-[var(--foreground)]/15 hover:text-[var(--foreground)]/30 transition-all cursor-grab active:cursor-grabbing"
                  onClick={(e) => e.stopPropagation()}
                  title="拖拽排序"
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Main button */}
              <button
                onClick={onClick}
                className={cn(
                  "flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all duration-200 justify-between",
                  isActive
                    ? "bg-[var(--sidebar-item)] text-[var(--foreground)] font-medium shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
                    : "text-[var(--foreground)]/45 hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--foreground)]/65"
                )}
              >
                <span className="flex items-center gap-2.5">
                  <Hash className="h-3.5 w-3.5 opacity-50" />
                  {cat.name}
                </span>
              </button>

              {/* Pin toggle */}
              <button
                onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
                className={cn(
                  "shrink-0 p-0.5 rounded-md transition-all",
                  isPinned
                    ? "text-[var(--accent)] opacity-100"
                    : "text-[var(--foreground)]/0 group-hover/item:text-[var(--foreground)]/15 hover:text-[var(--accent)]/60 opacity-0 group-hover/item:opacity-100"
                )}
                title={isPinned ? "取消置顶" : "置顶"}
              >
                {isPinned ? <Pin className="h-3 w-3" /> : <PinOff className="h-3 w-3" />}
              </button>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-44 rounded-2xl border border-[var(--border)] shadow-[0_12px_40px_rgba(0,0,0,0.08)] bg-[var(--popover)] backdrop-blur-xl p-1.5">
            <ContextMenuItem
              onClick={() => {
                const name = prompt("编辑分类名称", cat.name);
                if (name && name.trim() && name.trim() !== cat.name) {
                  onRename(cat.id, name.trim());
                }
              }}
              className="text-[13px] rounded-xl cursor-pointer font-sans"
            >
              <Pencil className="h-3.5 w-3.5 mr-2.5 opacity-50" />
              重命名
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                if (confirm(`确定删除「${cat.name}」分类？书签不会被删除，只是取消关联。`)) {
                  onDelete(cat.id);
                }
              }}
              className="text-[13px] rounded-xl text-red-400 hover:text-red-500 cursor-pointer font-sans"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2.5" />
              删除分类
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </motion.div>
    </div>
  );
}

export function Sidebar({
  activeStatus,
  activeCategory,
  onStatusChange,
  onCategoryChange,
  onAddClick,
  onCollectionClick,
  activeCollection,
  onAddSmartClick,
}: SidebarProps) {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [newColName, setNewColName] = useState("");
  const [addingCol, setAddingCol] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());

  // Load pinned state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar-pinned-categories");
      if (saved) setPinnedIds(new Set(JSON.parse(saved)));
    } catch {}
  }, []);

  const togglePin = (id: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem("sidebar-pinned-categories", JSON.stringify([...next]));
      return next;
    });
  };

  // Sort categories: pinned first (by order), then unpinned (by order)
  const sortedCategories = [...categories].sort((a, b) => {
    const aPinned = pinnedIds.has(a.id);
    const bPinned = pinnedIds.has(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return a.order - b.order;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    })
  );

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

  const handleDragStart = (e: DragStartEvent) => {
    setDraggingId(e.active.id as string);
    playPickup();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = sortedCategories.findIndex((c) => c.id === active.id);
    const newIndex = sortedCategories.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...sortedCategories];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    // Optimistic update
    setCategories(reordered);
    playDrop();

    // Persist order
    try {
      await fetch("/api/categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: reordered.map((c) => c.id) }),
      });
    } catch {
      toast.error("排序失败");
      fetchCategories(); // rollback
    }
  };

  const handleRenameCategory = async (id: string, name: string) => {
    try {
      const res = await fetch("/api/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name }),
      });
      if (!res.ok) throw new Error();
      toast.success("分类已重命名");
      fetchCategories();
    } catch {
      toast.error("重命名失败");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("分类已删除");
      if (activeCategory === id) onCategoryChange(null);
      fetchCategories();
    } catch {
      toast.error("删除失败");
    }
  };

  return (
    <aside className="w-60 shrink-0 flex flex-col h-full bg-[var(--sidebar)] backdrop-blur-xl border-r border-[var(--sidebar-border)]">
      {/* Logo area */}
      <div className="px-5 pt-5 pb-2 shrink-0">
        <h2 className="font-display text-lg font-bold text-[var(--foreground)] tracking-tight leading-none">
          MarkBox
        </h2>
        <p className="text-[11px] text-[var(--foreground)]/35 mt-1 font-sans">
          AI 智能书签管理
        </p>
      </div>

      {/* Add Bookmark Button */}
      <div className="px-4 pt-3 pb-4 shrink-0">
        <Button
          className="w-full gap-2 font-medium rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)]/85 text-white shadow-none text-[13px] h-9 transition-all duration-200 hover:shadow-[0_4px_20px_rgba(183,110,75,0.25)]"
          onClick={onAddClick}
        >
          <Plus className="h-4 w-4" />
          添加书签
        </Button>
      </div>

      {/* Thin separator */}
      <div className="mx-4 h-px bg-[var(--border)] shrink-0" />

      {/* Scrollable content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="pb-4">
          {/* Collections */}
          <div className="px-3 pt-4 pb-1">
            <div className="flex items-center justify-between px-3 mb-1.5">
              <p className="text-[10px] font-medium text-[var(--foreground)]/25 uppercase tracking-widest font-sans">
                收藏夹
              </p>
              <button
                onClick={() => setAddingCol(!addingCol)}
                className="text-[var(--foreground)]/20 hover:text-[var(--foreground)]/40 transition-colors"
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
                  className="h-7 text-[12px] rounded-lg bg-[var(--card)] border-0 font-sans"
                  autoFocus
                />
                <Button
                  onClick={handleCreateCollection}
                  disabled={!newColName.trim()}
                  className="h-7 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent)]/85 text-white text-[11px] px-2 font-sans"
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
                    ? "bg-[var(--sidebar-item)] text-[var(--foreground)] font-medium shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
                    : "text-[var(--foreground)]/45 hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--foreground)]/65"
                )}
              >
                <Folder className="h-3.5 w-3.5 opacity-50 shrink-0" />
                <span className="truncate flex-1 text-left">{col.name}</span>
                <span className="text-[10px] text-[var(--foreground)]/20 shrink-0">{col._count.bookmarks}</span>
              </button>
            ))}
          </div>

          <div className="mx-4 h-px bg-[var(--border)] mt-2" />

          {/* Status Filter */}
          <div className="px-3 pt-3 pb-1">
            <p className="px-3 mb-1.5 text-[10px] font-medium text-[var(--foreground)]/25 uppercase tracking-widest font-sans">
              状态
            </p>
            <button
              onClick={() => { onStatusChange(null); if (onCollectionClick) onCollectionClick("" as any); }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all duration-200",
                !activeStatus && !activeCollection
                  ? "bg-[var(--sidebar-item)] text-[var(--foreground)] font-medium shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
                  : "text-[var(--foreground)]/45 hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--foreground)]/65"
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
                      ? "bg-[var(--sidebar-item)] text-[var(--foreground)] font-medium shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
                      : "text-[var(--foreground)]/45 hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--foreground)]/65"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: isActive ? opt.color : undefined, opacity: isActive ? 1 : 0.4 }} />
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Categories — draggable */}
          <div className="px-3 pt-3">
            <p className="px-3 mb-1.5 text-[10px] font-medium text-[var(--foreground)]/25 uppercase tracking-widest font-sans">
              分类
            </p>
            <button
              onClick={() => onCategoryChange(null)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all duration-200",
                !activeCategory
                  ? "bg-[var(--sidebar-item)] text-[var(--foreground)] font-medium shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
                  : "text-[var(--foreground)]/45 hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--foreground)]/65"
              )}
            >
              <Hash className="h-3.5 w-3.5 opacity-50" />
              全部
            </button>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={() => setDraggingId(null)}
            >
              <SortableContext
                items={sortedCategories.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-0.5">
                  {sortedCategories.map((cat) => (
                    <SortableCategoryItem
                      key={cat.id}
                      cat={cat}
                      isActive={activeCategory === cat.id}
                      isPinned={pinnedIds.has(cat.id)}
                      isDragging={draggingId === cat.id}
                      onClick={() => onCategoryChange(cat.id)}
                      onTogglePin={() => togglePin(cat.id)}
                      onRename={handleRenameCategory}
                      onDelete={handleDeleteCategory}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {categories.length === 0 && (
              <p className="text-[11px] text-[var(--foreground)]/15 text-center font-sans py-4">
                添加书签后自动生成分类
              </p>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[var(--border)] shrink-0 bg-[var(--sidebar)]">
        <p className="text-[10px] text-[var(--foreground)]/20 text-center tracking-wider font-sans">
          MarkBox
        </p>
      </div>
    </aside>
  );
}
