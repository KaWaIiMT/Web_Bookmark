"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { Play, Pause } from "lucide-react";
import { GraphToolbar } from "@/components/GraphToolbar";
import { BookmarkDetailSheet } from "@/components/BookmarkDetailSheet";
import { computeGraphData, computeBookmarkNodes, nodeRadius } from "@/lib/graph-data";
import type { BookmarkData, GraphNode, GraphLink } from "@/lib/types";
import type { PaginatedResponse } from "@/lib/types";

// ForceGraph2D is ESM-only and accesses DOM — import dynamically to avoid SSR
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="h-8 w-8 rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)] animate-spin" />
    </div>
  ),
});

/** Map semantic color names to actual hex values based on theme */
function resolveColor(color: string, isDark: boolean): string {
  if (color === "accent") return isDark ? "#c9866b" : "#b76e4b";
  return color;
}

/** Convert hex color like "#b76e4b" to "183, 110, 75" */
function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length === 3) {
    return `${parseInt(h[0]+h[0], 16)}, ${parseInt(h[1]+h[1], 16)}, ${parseInt(h[2]+h[2], 16)}`;
  }
  return `${parseInt(h.slice(0,2), 16)}, ${parseInt(h.slice(2,4), 16)}, ${parseInt(h.slice(4,6), 16)}`;
}

/** Canvas: render a graph node */
function renderNode(
  node: GraphNode,
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  isDark: boolean,
  isHighlighted: boolean,
) {
  // Guard: skip nodes without valid positions (simulation not yet started)
  if (node.x == null || node.y == null || !isFinite(node.x) || !isFinite(node.y)) return;

  // Bookmark nodes: small colored circle + short label
  if (node.type === "bookmark") {
    const r = 4;
    const color = resolveColor(node.color, isDark);

    // Small circle
    ctx.beginPath();
    ctx.arc(node.x!, node.y!, r, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Label at small scale
    if (globalScale > 0.5) {
      const fontSize = Math.max(6, 10 / globalScale);
      ctx.font = `${fontSize}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = isDark ? "rgba(232,228,223,0.5)" : "rgba(44,44,44,0.4)";
      ctx.fillText(node.label, node.x!, node.y! + r + 3);
    }
    return;
  }

  // Tag & Category nodes
  const r = nodeRadius(node.bookmarkCount);
  const color = resolveColor(node.color, isDark);
  const label = node.label;
  const fontSize = Math.max(6, Math.min(14, 12 / globalScale));

  // Glow effect for highlighted nodes via radial gradient
  if (isHighlighted) {
    const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 300);
    const glowR = r * 2.5;
    const grad = ctx.createRadialGradient(node.x!, node.y!, r * 0.2, node.x!, node.y!, glowR);
    grad.addColorStop(0, `rgba(183, 110, 75, ${0.35 * pulse})`);
    grad.addColorStop(1, "rgba(183, 110, 75, 0)");
    ctx.beginPath();
    ctx.arc(node.x!, node.y!, glowR, 0, 2 * Math.PI);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Nebula glow: radial gradient halo for category/tag nodes
  const glowMultiplier = node.type === "category" ? 2.5 : 2;
  const glowR = r * glowMultiplier;
  const grad = ctx.createRadialGradient(node.x!, node.y!, r * 0.3, node.x!, node.y!, glowR);
  const baseAlpha = node.type === "category" ? 0.25 : 0.15;
  grad.addColorStop(0, isDark
    ? `rgba(${hexToRgb(color)}, ${baseAlpha})`
    : color + "40"
  );
  grad.addColorStop(0.5, isDark
    ? `rgba(${hexToRgb(color)}, ${baseAlpha * 0.4})`
    : `rgba(0,0,0,0.03)`
  );
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.beginPath();
  ctx.arc(node.x!, node.y!, glowR, 0, 2 * Math.PI);
  ctx.fillStyle = grad;
  ctx.fill();

  // Main node circle
  ctx.beginPath();
  ctx.arc(node.x!, node.y!, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();

  // Stroke
  ctx.strokeStyle = isDark ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Label
  if (globalScale > 0.4) {
    ctx.font = `${fontSize}px "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = isDark ? "rgba(232,228,223,0.7)" : "rgba(44,44,44,0.6)";
    ctx.fillText(label, node.x!, node.y! + r + 4);
  }

  // Bookmark count badge for categories
  if (node.type === "category" && globalScale > 0.3) {
    const badge = `${node.bookmarkCount}`;
    ctx.font = `${Math.max(5, fontSize - 2)}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = isDark ? "rgba(232,228,223,0.35)" : "rgba(44,44,44,0.35)";
    ctx.fillText(badge, node.x!, node.y!);
  }
}

/** Canvas: render a link between nodes */
function renderLink(
  link: GraphLink & { source: GraphNode; target: GraphNode },
  ctx: CanvasRenderingContext2D,
  isDark: boolean,
) {
  const src = link.source;
  const tgt = link.target;

  // Guard: skip links whose endpoints lack valid positions (simulation not yet started)
  if (src.x == null || src.y == null || !isFinite(src.x) || !isFinite(src.y)) return;
  if (tgt.x == null || tgt.y == null || !isFinite(tgt.x) || !isFinite(tgt.y)) return;

  const alpha = Math.min(0.2, 0.05 + link.strength * 0.02);
  const color = isDark
    ? `rgba(201,134,107,${alpha})`
    : `rgba(183,110,75,${alpha})`;

  ctx.beginPath();
  ctx.moveTo(src.x, src.y);
  ctx.lineTo(tgt.x, tgt.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(0.5, Math.min(3, link.strength * 0.6));
  ctx.stroke();
}

export function KnowledgeGraphView() {
  const [bookmarks, setBookmarks] = useState<BookmarkData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredNode, setHoveredNode] = useState<{
    node: GraphNode;
    x: number;
    y: number;
  } | null>(null);
  const [filterNode, setFilterNode] = useState("");
  // Layer 2: expanded tag/category node (null = Layer 1)
  const [expandedNode, setExpandedNode] = useState<{ id: string; type: "tag" | "category" } | null>(null);
  // Layer 3: detail drawer
  const [selectedBookmark, setSelectedBookmark] = useState<BookmarkData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  // Timeline
  const [sliderValue, setSliderValue] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Starfield background for dark mode (deterministic random dots)
  const starfieldBg = useMemo(() => {
    // Simple deterministic pseudo-random using prime multipliers
    let seed = 42;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const dots: string[] = [];
    for (let i = 0; i < 60; i++) {
      const x = rand() * 100;
      const y = rand() * 100;
      const size = rand() * 1.5 + 0.5;
      const alpha = rand() * 0.1 + 0.02;
      dots.push(`radial-gradient(${size}px ${size}px at ${x}% ${y}%, rgba(255,255,255,${alpha.toFixed(3)}), transparent)`);
    }
    return dots.join(", ");
  }, []);

  // Fetch bookmarks on mount
  const fetchBookmarks = useCallback(() => {
    setLoading(true);
    fetch("/api/bookmarks?limit=1000")
      .then((r) => r.json())
      .then((d: PaginatedResponse<BookmarkData>) => setBookmarks(d.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchBookmarks(); }, [fetchBookmarks]);

  /**
   * Full graph data: tags + categories + ALL bookmark nodes (limited to 200).
   * Computed once when bookmarks load. Bookmark nodes are pre-created but
   * hidden via nodeVisibility until a tag/category is expanded.
   * This avoids simulation restarts when toggling Layer 2.
   */
  const fullGraphData = useMemo(() => {
    if (!bookmarks || bookmarks.length === 0) return null;
    const base = computeGraphData(bookmarks);
    // Pre-create bookmark nodes for ALL tags (limit total to keep performance)
    const tagIds = base.nodes.filter((n) => n.type === "tag").map((n) => n.id);
    const allBmNodes: GraphNode[] = [];
    const allBmLinks: GraphLink[] = [];
    const seenBms = new Set<string>();
    for (const tagId of tagIds) {
      const extra = computeBookmarkNodes(bookmarks, tagId, "tag", 10);
      for (const n of extra.nodes) {
        if (!seenBms.has(n.id) && allBmNodes.length < 200) {
          seenBms.add(n.id);
          allBmNodes.push(n);
        }
      }
      for (const l of extra.links) {
        // Only include links whose source node was actually added to the graph
        if (seenBms.has(l.source)) {
          allBmLinks.push(l);
        }
      }
    }
    return {
      nodes: [...base.nodes, ...allBmNodes],
      links: [...base.links, ...allBmLinks],
    };
  }, [bookmarks]);

  // Filter visible bookmark nodes based on expandedNode
  const expandedNodeIds = useMemo(() => {
    if (!expandedNode || !fullGraphData) return null;
    const ids = new Set<string>();
    // Show bookmark nodes linked to the expanded tag/category
    for (const link of fullGraphData.links) {
      if (link.type !== "bookmark-tag") continue;
      if (link.source === expandedNode.id || link.target === expandedNode.id) {
        ids.add(link.source);
        ids.add(link.target);
      }
    }
    return ids;
  }, [expandedNode, fullGraphData]);

  // For backward compatibility in other memos
  const baseGraphData = fullGraphData;

  // Timeline: extract min/max dates from bookmark nodes
  const { minDate, maxDate } = useMemo(() => {
    if (!fullGraphData) return { minDate: 0, maxDate: 0 };
    const dates = fullGraphData.nodes
      .filter((n) => n.type === "bookmark" && n.createdAt)
      .map((n) => new Date(n.createdAt!).getTime());
    if (dates.length === 0) return { minDate: 0, maxDate: 0 };
    return { minDate: Math.min(...dates), maxDate: Math.max(...dates) };
  }, [fullGraphData]);

  // Init slider to max (show all) when range changes
  useEffect(() => {
    if (maxDate > 0) setSliderValue(maxDate);
  }, [maxDate]);

  // Playback effect
  useEffect(() => {
    if (!playing || maxDate <= 0) return;
    const tick = 50;
    const totalMs = 30000; // 30s playback at 1x
    const stepPerTick = ((maxDate - minDate) / totalMs) * tick * speed;
    const id = setInterval(() => {
      setSliderValue((prev) => {
        const next = prev + stepPerTick;
        if (next >= maxDate) {
          setPlaying(false);
          return maxDate;
        }
        return next;
      });
    }, tick);
    return () => clearInterval(id);
  }, [playing, speed, minDate, maxDate]);

  // Track highlighted nodes from search
  const highlightedIds = useMemo(() => {
    if (!searchQuery.trim() || !baseGraphData) return new Set<string>();
    const q = searchQuery.toLowerCase();
    return new Set(
      baseGraphData.nodes.filter((n) => n.label.toLowerCase().includes(q)).map((n) => n.id),
    );
  }, [searchQuery, baseGraphData]);

  // Node labels for filter dropdown (sorted)
  const nodeLabels = useMemo(() => {
    if (!baseGraphData) return [];
    return baseGraphData.nodes
      .map((n) => n.label)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();
  }, [baseGraphData]);

  // Visibility filters from dropdown
  const { visibleNodeIds, visibleLinkIds } = useMemo(() => {
    if (!baseGraphData || !filterNode) {
      return {
        visibleNodeIds: null as Set<string> | null,
        visibleLinkIds: null as Set<string> | null,
      };
    }
    const target = baseGraphData.nodes.find((n) => n.label === filterNode);
    if (!target) return { visibleNodeIds: null, visibleLinkIds: null };

    const neighborIds = new Set<string>([target.id]);
    const linkIds = new Set<string>();
    for (const link of baseGraphData.links) {
      const src = typeof link.source === "string" ? link.source : (link.source as GraphNode).id;
      const tgt = typeof link.target === "string" ? link.target : (link.target as GraphNode).id;
      if (src === target.id || tgt === target.id) {
        neighborIds.add(src);
        neighborIds.add(tgt);
        linkIds.add(`${src}::${tgt}`);
      }
      if (neighborIds.has(src) && neighborIds.has(tgt)) {
        linkIds.add(`${src}::${tgt}`);
      }
    }
    return { visibleNodeIds: neighborIds, visibleLinkIds: linkIds };
  }, [baseGraphData, filterNode]);

  // Reset: zoom to fit, clear search/filter/expand
  const handleReset = useCallback(() => {
    setSearchQuery("");
    setFilterNode("");
    setExpandedNode(null);
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 50);
    }
  }, []);

  // Screenshot: capture the canvas as PNG and download
  const handleScreenshot = useCallback(() => {
    const canvas = canvasContainerRef.current?.querySelector("canvas");
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `markbox-graph-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, []);

  // Hover handler — convert simulation coords to screen coords
  const handleNodeHover = useCallback(
    (node: GraphNode | null, _prevNode: GraphNode | null) => {
      if (node && node.x != null && node.y != null) {
        // Convert simulation coordinates to CSS-relative screen coordinates
        const screenPos = graphRef.current?.graph2ScreenCoords
          ? graphRef.current.graph2ScreenCoords(node.x, node.y)
          : { x: node.x, y: node.y };
        setHoveredNode({
          node,
          x: screenPos.x,
          y: screenPos.y,
        });
      } else {
        setHoveredNode(null);
      }
    },
    [],
  );

  // Node click: tag/category → expand/collapse; bookmark → open detail
  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      if (node.type === "tag" || node.type === "category") {
        // Toggle expand: same node → collapse; different → switch
        if (expandedNode?.id === node.id) {
          setExpandedNode(null);
        } else {
          setExpandedNode({ id: node.id, type: node.type });
        }
      } else if (node.type === "bookmark" && node.bookmarkId) {
        // Find the full bookmark data
        const bm = bookmarks?.find((b) => b.id === node.bookmarkId);
        if (bm) {
          setSelectedBookmark(bm);
          setDetailOpen(true);
        }
      }
    },
    [expandedNode, bookmarks],
  );

  // Optimistic status change (reuse main app API)
  const handleStatusChange = useCallback(
    async (id: string, status: string) => {
      try {
        await fetch(`/api/bookmarks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        // Update selected bookmark optimistically
        setSelectedBookmark((prev) =>
          prev?.id === id ? { ...prev, status: status as BookmarkData["status"] } : prev,
        );
        fetchBookmarks(); // refresh graph data
      } catch {
        // ignore
      }
    },
    [fetchBookmarks],
  );

  // Delete bookmark
  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/bookmarks/${id}`, { method: "DELETE" });
        setDetailOpen(false);
        setSelectedBookmark(null);
        fetchBookmarks(); // refresh graph data
      } catch {
        // ignore
      }
    },
    [fetchBookmarks],
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)] animate-spin" />
      </div>
    );
  }

  // Empty state
  if (!baseGraphData || baseGraphData.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <p className="text-[15px] font-semibold text-[var(--foreground)] font-display">
          还没有数据
        </p>
        <p className="text-[13px] text-[var(--muted-foreground)] mt-1.5 font-sans">
          添加书签后，这里将展示你的知识图谱
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 7.5rem)" }}>
      {/* Toolbar */}
      <GraphToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onReset={handleReset}
        nodeCount={baseGraphData.nodes.length}
        linkCount={baseGraphData.links.length}
        nodeLabels={nodeLabels}
        filterNode={filterNode}
        onFilterChange={setFilterNode}
        onScreenshot={handleScreenshot}
      />

      {/* Graph canvas */}
      <div
        ref={canvasContainerRef}
        className="flex-1 relative rounded-2xl border border-[var(--border)] backdrop-blur-sm overflow-hidden min-h-0"
        style={{
          background: isDark
            ? `${starfieldBg}, rgba(18,18,16,0.95)`
            : "var(--card)",
        }}
      >
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <ForceGraph2D
          ref={graphRef}
          graphData={fullGraphData as any}
          backgroundColor={
            isDark ? "rgba(18,18,16,0.01)" : "rgba(245,243,240,0.01)"
          }
          // Node rendering
          nodeCanvasObjectMode={() => "replace"}
          nodeCanvasObject={(node, ctx, globalScale) =>
            renderNode(
              node as unknown as GraphNode,
              ctx,
              globalScale,
              isDark,
              highlightedIds.has((node as unknown as GraphNode).id),
            )
          }
          nodePointerAreaPaint={(node, color, ctx) => {
            const r = nodeRadius((node as unknown as GraphNode).bookmarkCount);
            ctx.beginPath();
            ctx.arc(node.x!, node.y!, r + 4, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
          }}
          // Link rendering
          linkCanvasObjectMode={() => "replace"}
          linkCanvasObject={(link, ctx) =>
            renderLink(
              link as unknown as GraphLink & { source: GraphNode; target: GraphNode },
              ctx,
              isDark,
            )
          }
          linkDirectionalArrowLength={0}
          // Visibility: combine filter dropdown + Layer 2 expand + timeline
          nodeVisibility={(node) => {
            const n = node as unknown as GraphNode;
            // Filter dropdown check
            if (visibleNodeIds && !visibleNodeIds.has(n.id)) return false;
            // Layer 2: bookmark nodes only visible when their tag/category is expanded
            if (n.type === "bookmark" && expandedNodeIds && !expandedNodeIds.has(n.id)) return false;
            // Timeline: bookmark nodes only visible if created before slider value
            if (n.type === "bookmark" && n.createdAt && sliderValue > 0) {
              if (new Date(n.createdAt).getTime() > sliderValue) return false;
            }
            return true;
          }}
          linkVisibility={
            visibleLinkIds || expandedNodeIds
              ? (link) => {
                  const l = link as unknown as {
                    source: string | { id: string };
                    target: string | { id: string };
                    type: string;
                  };
                  const srcId = typeof l.source === "string" ? l.source : l.source.id;
                  const tgtId = typeof l.target === "string" ? l.target : l.target.id;
                  // Filter dropdown check
                  if (visibleLinkIds && !visibleLinkIds.has(`${srcId}::${tgtId}`)) return false;
                  // Layer 2: only show bookmark-tag links when that bookmark is visible
                  if (l.type === "bookmark-tag" && expandedNodeIds && !expandedNodeIds.has(srcId) && !expandedNodeIds.has(tgtId)) return false;
                  return true;
                }
              : undefined
          }
          // Interaction
          onNodeHover={handleNodeHover as any}
          onNodeClick={handleNodeClick as any}
          onBackgroundClick={handleReset}
          enableNodeDrag
          enableZoomInteraction
          enablePanInteraction
          minZoom={0.3}
          maxZoom={5}
          cooldownTicks={100}
        />

        {/* HTML tooltip overlay */}
        {hoveredNode && (
          <div
            className="absolute pointer-events-none z-10 px-3 py-2 rounded-xl bg-[var(--popover)] border border-[var(--border)] shadow-lg translate-x-3 -translate-y-3"
            style={{
              left: hoveredNode.x,
              top: hoveredNode.y,
            }}
          >
            <p className="text-[13px] font-medium text-[var(--foreground)] font-sans whitespace-nowrap">
              {hoveredNode.node.label}
            </p>
            <p className="text-[11px] text-[var(--muted-foreground)] font-sans mt-0.5">
              {hoveredNode.node.type === "bookmark"
                ? hoveredNode.node.contentType === "video"
                  ? "视频"
                  : hoveredNode.node.contentType === "article"
                    ? "文章"
                    : hoveredNode.node.contentType === "repository"
                      ? "仓库"
                      : "网页"
                : hoveredNode.node.type === "category"
                  ? "分类"
                  : "标签"}
              {" · "}
              {hoveredNode.node.type === "bookmark"
                ? hoveredNode.node.status === "unread"
                  ? "待读"
                  : hoveredNode.node.status === "reading"
                    ? "在读"
                    : hoveredNode.node.status === "read"
                      ? "已读"
                      : "归档"
                : `${hoveredNode.node.bookmarkCount} 个书签`}
            </p>
          </div>
        )}
      </div>

      {/* Timeline bar */}
      {minDate > 0 && maxDate > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-sm shrink-0">
          {/* Play/Pause */}
          <button
            onClick={() => {
              if (sliderValue >= maxDate) setSliderValue(minDate);
              setPlaying(!playing);
            }}
            className="flex items-center justify-center h-7 w-7 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-all active:scale-[0.95] cursor-pointer shrink-0"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>

          {/* Slider */}
          <input
            type="range"
            min={minDate}
            max={maxDate}
            value={sliderValue}
            onChange={(e) => {
              setSliderValue(+e.target.value);
              setPlaying(false);
            }}
            className="flex-1 h-1.5 rounded-full appearance-none bg-[var(--muted)] cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent)]
              [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm"
          />

          {/* Speed selector */}
          <div className="flex gap-0.5 shrink-0">
            {[1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium font-sans transition-all cursor-pointer ${
                  speed === s
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {s}×
              </button>
            ))}
          </div>

          {/* Visible bookmark count */}
          <span className="text-[11px] text-[var(--muted-foreground)] font-sans shrink-0 tabular-nums">
            {fullGraphData.nodes.filter((n) => {
              if (n.type !== "bookmark") return false;
              if (expandedNodeIds && !expandedNodeIds.has(n.id)) return false;
              if (n.createdAt && sliderValue > 0 && new Date(n.createdAt).getTime() > sliderValue) return false;
              return true;
            }).length}
            {" 个可见"}
          </span>

          {/* Date label */}
          <span className="text-[11px] text-[var(--muted-foreground)] font-sans shrink-0 tabular-nums w-20 text-right">
            {new Date(sliderValue).toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "short",
            })}
          </span>
        </div>
      )}

      {/* Layer 3: Detail drawer */}
      <BookmarkDetailSheet
        bookmark={selectedBookmark}
        cardRect={null}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedBookmark(null);
        }}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
    </div>
  );
}
