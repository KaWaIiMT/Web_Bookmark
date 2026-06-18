"use client";

import { useState } from "react";
import { X, FolderPlus, Check, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CollectionData } from "@/lib/types";

interface BatchActionBarProps {
  selectedCount: number;
  collections: { id: string; name: string }[];
  onAddToCollection: (collectionId: string) => void;
  onChangeStatus: (status: string) => void;
  onDelete: () => void;
  onClearSelection: () => void;
}

const STATUS_OPTIONS = [
  { value: "unread", label: "待读" },
  { value: "reading", label: "在读" },
  { value: "read", label: "已读" },
  { value: "archived", label: "归档" },
];

export function BatchActionBar({
  selectedCount,
  collections,
  onAddToCollection,
  onChangeStatus,
  onDelete,
  onClearSelection,
}: BatchActionBarProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--popover)] backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
      >
        <span className="text-[13px] font-medium text-[var(--foreground)] font-sans">
          已选 {selectedCount} 篇
        </span>

        <div className="w-px h-5 bg-[var(--border)] mx-0.5" />

        {/* Add to collection */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button size="sm" variant="ghost" className="h-8 rounded-xl text-[12px] text-[var(--accent)] hover:bg-[var(--accent)]/5 font-sans">
              <FolderPlus className="h-3.5 w-3.5 mr-1.5" />
              加入收藏夹
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-44 rounded-2xl border border-[var(--border)] bg-[var(--popover)] backdrop-blur-xl p-1.5">
            {collections.length === 0 ? (
              <DropdownMenuItem disabled className="text-[12px] font-sans">
                暂无收藏夹
              </DropdownMenuItem>
            ) : (
              collections.map((col) => (
                <DropdownMenuItem
                  key={col.id}
                  onClick={() => onAddToCollection(col.id)}
                  className="text-[13px] rounded-xl cursor-pointer font-sans"
                >
                  {col.name}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Change status */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button size="sm" variant="ghost" className="h-8 rounded-xl text-[12px] text-[var(--foreground)]/50 hover:text-[var(--foreground)]/70 font-sans">
              <Check className="h-3.5 w-3.5 mr-1.5" />
              更改状态
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-36 rounded-2xl border border-[var(--border)] bg-[var(--popover)] backdrop-blur-xl p-1.5">
            {STATUS_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => onChangeStatus(opt.value)}
                className="text-[13px] rounded-xl cursor-pointer font-sans"
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Delete */}
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <span className="text-[12px] text-red-400 font-sans">确认删除？</span>
            <Button
              size="sm"
              onClick={() => { onDelete(); setConfirmDelete(false); }}
              className="h-7 px-2.5 rounded-lg bg-red-400 hover:bg-red-500 text-white text-[11px] shadow-none font-sans"
            >
              确定
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmDelete(false)}
              className="h-7 px-2 rounded-lg text-[11px] font-sans"
            >
              取消
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConfirmDelete(true)}
            className="h-8 rounded-xl text-[12px] text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/5 font-sans"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            删除
          </Button>
        )}

        <div className="w-px h-5 bg-[var(--border)] mx-0.5" />

        {/* Clear selection */}
        <Button
          size="sm"
          variant="ghost"
          onClick={onClearSelection}
          className="h-8 rounded-xl text-[12px] text-[var(--foreground)]/30 hover:text-[var(--foreground)]/50 font-sans"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          取消
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}
