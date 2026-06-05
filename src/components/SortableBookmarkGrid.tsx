"use client";

import { useState, useRef } from "react";
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
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "motion/react";
import type { BookmarkData } from "@/lib/types";
import { BookmarkCard } from "./BookmarkCard";
import { playPickup, playDrop } from "@/lib/sounds";

interface SortableBookmarkGridProps {
  bookmarks: BookmarkData[];
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onEdit: (bookmark: BookmarkData) => void;
  onReorder: (orderedIds: string[]) => void;
  onCardClick: (bookmark: BookmarkData, element: HTMLElement) => void;
  onShare?: (id: string) => void;
}

function SortableCard({
  bookmark,
  onStatusChange,
  onDelete,
  onEdit,
  isDragging,
  onCardClick,
  onShare,
}: {
  bookmark: BookmarkData;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onEdit: (bookmark: BookmarkData) => void;
  isDragging: boolean;
  onCardClick: (bookmark: BookmarkData, element: HTMLElement) => void;
  onShare?: (id: string) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: bookmark.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition:
      transition ??
      // Slower idle transition so cards "drift" smoothly between spots
      "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
    zIndex: isDragging ? 100 : 0,
  };

  return (
    // Outer: dnd-kit drag layer — handles position tracking
    <div
      ref={(node) => {
        setNodeRef(node);
        (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      style={style}
      {...attributes}
      {...listeners}
      className="relative touch-none"
      onClick={(e) => {
        // dnd-kit passes through clicks that don't trigger drag
        if (cardRef.current) {
          onCardClick(bookmark, cardRef.current);
        }
      }}
    >
      {/* Inner: motion visual layer — scale / shadow / rotate only */}
      <motion.div
        className="rounded-2xl origin-center"
        animate={{
          scale: isDragging ? 1.06 : 1,
          boxShadow: isDragging
            ? "0 24px 60px rgba(44,44,44,0.20), 0 8px 24px rgba(183,110,75,0.10)"
            : "0 0 0 rgba(0,0,0,0)",
          rotate: isDragging ? -0.6 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 420,
          damping: 28,
          mass: 0.6,
        }}
        whileHover={{
          scale: 1.02,
          boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
          transition: { type: "spring", stiffness: 400, damping: 25 },
        }}
        whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
        onClick={(e) => {
          if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <div
          onPointerDownCapture={(e) => {
            const target = e.target as HTMLElement;
            if (
              target.closest("button") ||
              target.closest("a") ||
              target.closest("[data-no-drag]")
            ) {
              e.stopPropagation();
            }
          }}
        >
          <BookmarkCard
            bookmark={bookmark}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            onEdit={onEdit}
            onShare={onShare}
          />
        </div>
      </motion.div>
    </div>
  );
}

export function SortableBookmarkGrid({
  bookmarks,
  onStatusChange,
  onDelete,
  onEdit,
  onReorder,
  onCardClick,
  onShare,
}: SortableBookmarkGridProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 2 },
    })
  );

  const handleDragStart = (e: DragStartEvent) => {
    setDraggingId(e.active.id as string);
    playPickup();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingId(null);

    if (over && active.id !== over.id) {
      const oldIndex = bookmarks.findIndex((b) => b.id === active.id);
      const newIndex = bookmarks.findIndex((b) => b.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = [...bookmarks];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      playDrop();
      onReorder(reordered.map((b) => b.id));
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setDraggingId(null);
      }}
    >
      <SortableContext
        items={bookmarks.map((b) => b.id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {bookmarks.map((bookmark) => (
            <SortableCard
              key={bookmark.id}
              bookmark={bookmark}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
              onEdit={onEdit}
              isDragging={draggingId === bookmark.id}
              onCardClick={onCardClick}
              onShare={onShare}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
