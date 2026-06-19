"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { Search, Inbox, Brain, Menu, LogOut, Settings, LogIn, Shield, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sidebar } from "@/components/Sidebar";
import { AddBookmarkDialog } from "@/components/AddBookmarkDialog";
import { SortableBookmarkGrid } from "@/components/SortableBookmarkGrid";
import { BookmarkDetailSheet } from "@/components/BookmarkDetailSheet";
import { ViewTabs } from "@/components/ViewTabs";
import { MasonryGallery } from "@/components/MasonryGallery";
import { TimelineView } from "@/components/TimelineView";
import { DashboardView } from "@/components/DashboardView";
import { WeeklyReport } from "@/components/WeeklyReport";
import { DiscoverView } from "@/components/DiscoverView";
import { LearningPathListView } from "@/components/LearningPathListView";
import { LearningPathDetailView } from "@/components/LearningPathDetailView";
import { CompareView } from "@/components/CompareView";
import { ActivityView } from "@/components/ActivityView";
import { KnowledgeGraphView } from "@/components/KnowledgeGraphView";
import { ReaderView } from "@/components/ReaderView";
import { VoiceSearch } from "@/components/VoiceSearch";
import { BatchActionBar } from "@/components/BatchActionBar";
import { useRouter } from "next/navigation";
import type { BookmarkData, PaginatedResponse, ViewType, CollectionData } from "@/lib/types";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoading = status === "loading";
  // Wait for session to resolve before fetching
  const isReady = status !== "loading";

  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  // Track if we're transitioning filters — skip skeleton, keep old cards
  const [isSwitching, setIsSwitching] = useState(false);
  // Refs so fetchBookmarks can read latest values without re-creating the callback
  const isSwitchingRef = useRef(isSwitching);
  const isFirstLoadRef = useRef(isFirstLoad);
  // Keep refs in sync without triggering fetchBookmarks recreation
  useEffect(() => { isSwitchingRef.current = isSwitching; }, [isSwitching]);
  useEffect(() => { isFirstLoadRef.current = isFirstLoad; }, [isFirstLoad]);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  // Debounced search — fetch after 150ms idle; Enter key bypasses debounce
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editBookmark, setEditBookmark] = useState<BookmarkData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BookmarkData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<BookmarkData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [cardRect, setCardRect] = useState<DOMRect | null>(null);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewType>("grid");
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [readerBookmark, setReaderBookmark] = useState<BookmarkData | null>(null);
  const [readerOpen, setReaderOpen] = useState(false);

  const [quickAskOpen, setQuickAskOpen] = useState(false);
  const [showSmartCreator, setShowSmartCreator] = useState(false);

  // Helper: guard unauthenticated writes (returns true = blocked)
  const guardAuth = useCallback((): boolean => {
    if (status !== "loading" && !session) {
      toast.error("请先登录账号");
      return true;
    }
    return false;
  }, [status, session]);

  const handleShowSidebarAdd = useCallback(() => {
    if (guardAuth()) return;
    setEditBookmark(null);
    setAddDialogOpen(true);
    setSidebarOpen(false);
  }, [guardAuth]);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Collections state (lifted from Sidebar for sharing)
  const [collections, setCollections] = useState<Pick<CollectionData, "id" | "name" | "slug" | "isPublic" | "_count">[]>([]);

  // Fetch collections for multi-use
  const fetchCollections = useCallback(() => {
    fetch("/api/collections", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setCollections(d.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchCollections();
    const handler = () => fetchCollections();
    window.addEventListener("bookmark-created", handler);
    window.addEventListener("bookmark-deleted", handler);
    window.addEventListener("collection-bookmark-added", handler);
    window.addEventListener("collection-bookmark-removed", handler);
    window.addEventListener("collection-updated", handler);
    return () => {
      window.removeEventListener("bookmark-created", handler);
      window.removeEventListener("bookmark-deleted", handler);
      window.removeEventListener("collection-bookmark-added", handler);
      window.removeEventListener("collection-bookmark-removed", handler);
      window.removeEventListener("collection-updated", handler);
    };
  }, [fetchCollections]);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleClearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // Batch operations
  const handleBatchAddToCollection = useCallback(async (collectionId: string) => {
    if (guardAuth()) return;
    const ids = [...selectedIds];
    let success = 0;
    for (const bookmarkId of ids) {
      try {
        const res = await fetch(`/api/collections/${collectionId}/bookmarks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookmarkId }),
        });
        if (res.ok) success++;
      } catch {}
    }
    toast.success(`已将 ${success}/${ids.length} 篇加入收藏夹`);
    setSelectedIds(new Set());
    fetchCollections();
    window.dispatchEvent(new CustomEvent("collection-bookmark-added"));
  }, [guardAuth, selectedIds, fetchCollections]);

  const handleBatchStatusChange = useCallback(async (status: string) => {
    if (guardAuth()) return;
    const ids = [...selectedIds];
    let success = 0;
    for (const id of ids) {
      try {
        const res = await fetch(`/api/bookmarks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (res.ok) success++;
      } catch {}
    }
    toast.success(`已将 ${success}/${ids.length} 篇改为「${status === "unread" ? "待读" : status === "reading" ? "在读" : status === "read" ? "已读" : "归档"}」`);
    setSelectedIds(new Set());
    refreshBookmarks();
  }, [guardAuth, selectedIds]);

  const handleBatchDelete = useCallback(async () => {
    if (guardAuth()) return;
    const ids = [...selectedIds];
    let success = 0;
    for (const id of ids) {
      try {
        const res = await fetch(`/api/bookmarks/${id}`, { method: "DELETE" });
        if (res.ok) success++;
      } catch {}
    }
    toast.success(`已删除 ${success}/${ids.length} 篇书签`);
    setSelectedIds(new Set());
    refreshBookmarks();
    window.dispatchEvent(new CustomEvent("bookmark-deleted"));
  }, [guardAuth, selectedIds]);

  // Add/remove single bookmark to/from collection
  const handleAddToCollection = useCallback(async (bookmarkId: string, collectionId: string) => {
    if (guardAuth()) return;
    try {
      const res = await fetch(`/api/collections/${collectionId}/bookmarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookmarkId }),
      });
      if (!res.ok) throw new Error();
      toast.success("已添加到收藏夹");
      fetchCollections();
      window.dispatchEvent(new CustomEvent("collection-bookmark-added"));
    } catch {
      toast.error("添加失败");
    }
  }, [guardAuth, fetchCollections]);

  const handleRemoveFromCollection = useCallback(async (bookmarkId: string, collectionId: string) => {
    if (guardAuth()) return;
    try {
      const res = await fetch(`/api/collections/${collectionId}/bookmarks`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookmarkId }),
      });
      if (!res.ok) throw new Error();
      toast.success("已从收藏夹移除");
      fetchCollections();
      if (activeCollection === collectionId) refreshBookmarks();
      window.dispatchEvent(new CustomEvent("collection-bookmark-removed"));
    } catch {
      toast.error("移除失败");
    }
  }, [guardAuth, activeCollection, fetchCollections]);

  // Wrap filter changes so isSwitching flips in the SAME render frame as the filter.
  // This prevents an empty-state flash when optimistic client-side filter yields 0 results.
  const handleStatusFilter = useCallback((status: string | null) => {
    if (!isFirstLoadRef.current) setIsSwitching(true);
    setActiveStatus(status);
  }, []);
  const handleCategoryFilter = useCallback((categoryId: string | null) => {
    if (!isFirstLoadRef.current) setIsSwitching(true);
    setActiveCategory(categoryId);
  }, []);
  const handleCollectionFilter = useCallback((collectionId: string | null) => {
    if (!isFirstLoadRef.current) setIsSwitching(true);
    setActiveCollection(collectionId);
  }, []);

  const fetchBookmarks = useCallback(async (signal: AbortSignal, showLoading: boolean) => {
    if (showLoading) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeStatus) params.set("status", activeStatus);
      if (activeCategory) params.set("categoryId", activeCategory);
      if (activeCollection) params.set("collectionId", activeCollection);
      if (debouncedQuery) params.set("q", debouncedQuery);
      params.set("limit", "100");

      const res = await fetch(`/api/bookmarks?${params.toString()}`, { signal });
      if (signal.aborted) return;
      const data = (await res.json()) as PaginatedResponse<BookmarkData>;
      if (!signal.aborted) {
        setBookmarks(data.data || []);
        if (isSwitchingRef.current) setIsSwitching(false);
      }
    } catch (err) {
      if (signal.aborted) return;
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (isSwitchingRef.current) setIsSwitching(false);
    } finally {
      if (!signal.aborted) {
        setLoading(false);
        if (isFirstLoadRef.current) setIsFirstLoad(false);
      }
    }
  }, [activeStatus, activeCategory, activeCollection, debouncedQuery]);

  // Debounced search — fetch after 500ms idle; Enter key bypasses debounce
  const triggerSearch = useCallback((query: string) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (!isFirstLoadRef.current) setIsSwitching(true);
    setSearchQuery(query);
    setDebouncedQuery(query); // Immediately trigger search, bypass debounce
  }, []);
  useEffect(() => {
    debounceTimerRef.current = setTimeout(() => {
      if (!isFirstLoadRef.current) setIsSwitching(true);
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
  }, [searchQuery]);

  useEffect(() => {
    if (!isReady) return;
    if (activeView !== "grid" && activeView !== "gallery") {
      setLoading(false);
      return;
    }
    // Only show loading skeleton on first load; on filter switches keep old cards
    if (!isFirstLoad) setIsSwitching(true);
    const controller = new AbortController();
    fetchBookmarks(controller.signal, isFirstLoad);
    return () => {
      if (!controller.signal.aborted) controller.abort();
    };
  }, [fetchBookmarks, isReady, activeView, debouncedQuery]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const refreshBookmarks = useCallback(() => {
    fetchBookmarks(new AbortController().signal, false);
  }, [fetchBookmarks]);

  // Optimistic client-side filter: apply activeStatus/activeCategory immediately
  // on the current bookmarks array so the UI responds instantly to filter clicks.
  // Search uses searchQuery (instant feedback while typing); API uses debouncedQuery.
  const displayedBookmarks = useMemo(() => {
    let result = bookmarks;
    if (activeStatus) result = result.filter((b) => b.status === activeStatus);
    if (activeCategory) result = result.filter((b) => b.categoryId === activeCategory);
    // Instant client-side search for typing feedback (server fetch runs separately)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((b) =>
        b.title.toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q) ||
        b.aiSummary?.toLowerCase().includes(q) ||
        b.siteName?.toLowerCase().includes(q) ||
        b.url?.toLowerCase().includes(q) ||
        b.tags?.some((t: any) => t.tag?.name?.toLowerCase().includes(q))
      );
    }
    // Note: activeCollection can't be filtered client-side (need collection membership data)
    return result;
  }, [bookmarks, activeStatus, activeCategory, searchQuery]);

  const handleStatusChange = async (id: string, status: string) => {
    if (guardAuth()) return;
    try {
      const res = await fetch(`/api/bookmarks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(`已改为「${status === "unread" ? "待读" : status === "reading" ? "在读" : status === "read" ? "已读" : "归档"}」`);
      setSelectedBookmark((prev) => prev?.id === id ? { ...prev, status: status as BookmarkData["status"] } : prev);
      refreshBookmarks();
    } catch {
      toast.error("操作失败，请重试");
    }
  };

  const handleDelete = async (id: string) => {
    if (guardAuth()) return;
    try {
      const res = await fetch(`/api/bookmarks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      toast.success("书签已删除");
      setDeleteTarget(null);
      refreshBookmarks();
      window.dispatchEvent(new CustomEvent("bookmark-deleted"));
    } catch {
      toast.error("删除失败，请重试");
    }
  };

  const handleEdit = (bookmark: BookmarkData) => {
    if (guardAuth()) return;
    setEditBookmark(bookmark);
    setAddDialogOpen(true);
  };

  const handleShare = async (id: string) => {
    if (guardAuth()) return;
    try {
      const res = await fetch(`/api/bookmarks/${id}/share`, { method: "POST" });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }
      const data = await res.json();
      const shareUrl = `${window.location.origin}/share/bookmark/${data.shareToken}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("分享链接已复制到剪贴板");
    } catch {
      toast.error("生成分享链接失败，请重试");
    }
  };

  const handleReorder = async (orderedIds: string[]) => {
    if (guardAuth()) {
      // Rollback optimistic UI if blocked
      setBookmarks((prev) => prev);
      return;
    }
    // Optimistic UI update
    const reordered = orderedIds
      .map((id) => bookmarks.find((b) => b.id === id))
      .filter(Boolean) as BookmarkData[];
    setBookmarks(reordered);

    try {
      const res = await fetch("/api/bookmarks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch {
      toast.error("排序失败");
      refreshBookmarks(); // rollback
    }
  };

  const handleCardClick = (bookmark: BookmarkData, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    setCardRect(rect);
    setSelectedBookmark(bookmark);
    setDetailOpen(true);
  };

  const handleDetailClose = () => {
    setDetailOpen(false);
    setSelectedBookmark(null);
    setCardRect(null);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          activeStatus={activeStatus}
          activeCategory={activeCategory}
          activeCollection={activeCollection}
          onStatusChange={handleStatusFilter}
          onCategoryChange={handleCategoryFilter}
          onCollectionClick={handleCollectionFilter}
          onAddClick={handleShowSidebarAdd}
          collections={collections}
          onAddSmartClick={() => {
            if (guardAuth()) return;
            setShowSmartCreator(true);
          }}
        />
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-[var(--foreground)]/10 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0">
            <Sidebar
              activeStatus={activeStatus}
              activeCategory={activeCategory}
              activeCollection={activeCollection}
              onStatusChange={(s) => { handleStatusFilter(s); setSidebarOpen(false); }}
              onCategoryChange={(c) => { handleCategoryFilter(c); setSidebarOpen(false); }}
              onCollectionClick={(c) => { handleCollectionFilter(c); setSidebarOpen(false); }}
              onAddClick={handleShowSidebarAdd}
              collections={collections}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-2.5 sm:py-3 shrink-0 bg-[var(--sidebar)] backdrop-blur-xl border-b border-[var(--sidebar-border)] min-w-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1.5 rounded-xl hover:bg-[var(--sidebar-item-hover)] text-[var(--muted-foreground)] shrink-0"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl bg-[var(--accent)] flex items-center justify-center shrink-0">
              <Brain className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-white" />
            </div>
            {/* Hide brand name on small screens */}
            <h1 className="hidden sm:block font-display font-bold text-[17px] text-[var(--foreground)] tracking-tight">MarkBox</h1>
          </div>

          {/* Search — collapsible on mobile */}
          <div className="flex-1 sm:max-w-md relative min-w-0 hidden sm:block">
            <button
              onClick={() => triggerSearch(searchQuery)}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-[var(--foreground)]/20 hover:text-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all"
              title="搜索"
            >
              <Search className="h-4 w-4" />
            </button>
            <Input
              placeholder={searchQuery ? undefined : "搜索书签..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") triggerSearch(searchQuery); }}
              className="pl-10 pr-10 h-9 rounded-xl bg-[var(--input)] border-0 focus:bg-[var(--card)] focus:ring-2 focus:ring-[var(--accent)]/10 text-[13px] font-sans placeholder:text-[var(--foreground)]/20"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <VoiceSearch
                onResult={(text) => setSearchQuery(text)}
                className="p-1 rounded-lg text-[var(--foreground)]/25 hover:text-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all"
              />
            </div>
          </div>

          {/* View tabs — icons only on mobile, labels on sm+ */}
          <ViewTabs activeView={activeView} onViewChange={setActiveView} />

          {/* Auth area */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Admin — only visible to admins */}
            {session?.user?.isAdmin && (
              <button
                onClick={() => router.push("/admin")}
                className="p-1.5 rounded-xl hover:bg-[var(--accent)]/10 text-[var(--accent)]/60 hover:text-[var(--accent)] transition-colors"
                title="管理面板"
              >
                <Shield className="h-4 w-4" />
              </button>
            )}
            {/* Settings */}
            <button
              onClick={() => router.push("/settings")}
              className="p-1.5 rounded-xl hover:bg-[var(--sidebar-item-hover)] text-[var(--foreground)]/25 hover:text-[var(--foreground)]/50 transition-colors"
              title="设置"
            >
              <Settings className="h-4 w-4" />
            </button>

            {isLoading ? (
              <div className="h-8 w-8 rounded-full bg-[var(--muted)] animate-pulse" />
            ) : session?.user ? (
              <div className="flex items-center gap-1 sm:gap-2">
                {session.user.image ? (
                  <img src={session.user.image} alt="" className="h-7 w-7 rounded-full ring-2 ring-white/60" />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-[var(--muted)] flex items-center justify-center">
                    <LogIn className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                  </div>
                )}
                <span className="text-[12px] text-[var(--foreground)]/40 font-sans hidden sm:inline">
                  {session.user.name || session.user.email?.split("@")[0]}
                </span>
                <button
                  onClick={() => signOut()}
                  className="p-1.5 rounded-xl hover:bg-[var(--sidebar-item-hover)] text-[var(--foreground)]/25 hover:text-[var(--foreground)]/50 transition-colors"
                  title="退出登录"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  onClick={() => router.push("/login")}
                  className="rounded-xl bg-[var(--foreground)] hover:bg-[var(--foreground)]/85 text-[var(--background)] h-8 px-3 sm:px-3.5 text-[11px] sm:text-[12px] font-medium shadow-none transition-all font-sans"
                >
                  <svg className="h-3.5 w-3.5 sm:mr-1.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span className="hidden sm:inline">登录</span>
                </Button>
                <Button
                  onClick={() => window.close()}
                  className="rounded-xl bg-red-400/10 hover:bg-red-400/20 text-red-400 h-8 px-3 sm:px-3.5 text-[11px] sm:text-[12px] font-medium shadow-none transition-all font-sans"
                  title="退出应用"
                >
                  <LogOut className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">退出</span>
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* View content */}
        <div className="flex-1 overflow-y-auto p-5 relative">
          {/* Loading overlay — spinner centered over content during transitions */}
          {isSwitching && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--background)]/60 backdrop-blur-sm transition-opacity duration-200">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 text-[var(--accent)] animate-spin" />
                <span className="text-[13px] text-[var(--muted-foreground)] font-sans">加载中...</span>
              </div>
            </div>
          )}

          {/* Grid & Gallery: use bookmarks data */}
          {(activeView === "grid" || activeView === "gallery") && (
            <>
              {loading && !isSwitching ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="space-y-3 p-1">
                      <Skeleton className="aspect-[2.2/1] rounded-2xl bg-[var(--skeleton)]" />
                      <Skeleton className="h-4 w-3/4 rounded-lg bg-[var(--skeleton)]" />
                      <Skeleton className="h-3 w-full rounded-lg bg-[var(--skeleton)]" />
                      <Skeleton className="h-3 w-1/2 rounded-lg bg-[var(--skeleton)]" />
                    </div>
                  ))}
                </div>
              ) : displayedBookmarks.length === 0 && !isSwitching ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <div className="h-20 w-20 rounded-3xl bg-[var(--card)] flex items-center justify-center mb-5">
                    <Inbox className="h-10 w-10 text-[var(--foreground)]/10" />
                  </div>
                  <p className="text-[17px] font-semibold text-[var(--foreground)] font-display">还没有书签</p>
                  <p className="text-[13px] text-[var(--muted-foreground)] mt-1.5 font-sans">
                    点击「添加书签」开始收藏你喜欢的网页
                  </p>
                  <Button
                    variant="ghost"
                    className="mt-4 rounded-xl text-[13px] text-[var(--accent)] hover:bg-[var(--accent)]/5 font-sans"
                    onClick={handleShowSidebarAdd}
                  >
                    <PlusIcon className="mr-1.5" />
                    添加第一个书签
                  </Button>
                </div>
              ) : displayedBookmarks.length === 0 && isSwitching ? (
                /* Optimistic filter returned 0 — show old bookmarks underneath spinner overlay */
                <div>
                  {activeView === "gallery" ? (
                    <MasonryGallery
                      bookmarks={bookmarks}
                      onCardClick={handleCardClick}
                    />
                  ) : (
                    <SortableBookmarkGrid
                      bookmarks={bookmarks}
                      onStatusChange={handleStatusChange}
                      onDelete={(id) => {
                        const target = bookmarks.find((b) => b.id === id);
                        if (target) setDeleteTarget(target);
                      }}
                      onEdit={handleEdit}
                      onReorder={handleReorder}
                      onCardClick={handleCardClick}
                      onShare={handleShare}
                    />
                  )}
                </div>
              ) : activeView === "gallery" ? (
                <MasonryGallery
                  bookmarks={displayedBookmarks as BookmarkData[]}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onCardClick={handleCardClick}
                />
              ) : (
                <SortableBookmarkGrid
                  bookmarks={displayedBookmarks as BookmarkData[]}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onStatusChange={handleStatusChange}
                  onDelete={(id) => {
                    const target = bookmarks.find((b) => b.id === id);
                    if (target) setDeleteTarget(target);
                  }}
                  onEdit={handleEdit}
                  onReorder={handleReorder}
                  onCardClick={handleCardClick}
                  onShare={handleShare}
                  collections={collections}
                  onAddToCollection={handleAddToCollection}
                  onRemoveFromCollection={handleRemoveFromCollection}
                />
              )}
            </>
          )}

          {/* Timeline: self-contained data fetching */}
          {activeView === "timeline" && (
            <TimelineView onCardClick={handleCardClick} />
          )}

          {/* Discover: self-contained data fetching */}
          {activeView === "discover" && (
            <DiscoverView onCardClick={handleCardClick} />
          )}

          {/* Dashboard: self-contained data fetching */}
          {activeView === "dashboard" && (
            <DashboardView />
          )}

          {/* Learning path: list or detail view */}
          {activeView === "learning-path" && (
            selectedPathId ? (
              <LearningPathDetailView
                pathId={selectedPathId}
                onBack={() => setSelectedPathId(null)}
              />
            ) : (
              <LearningPathListView
                onSelectPath={setSelectedPathId}
                onCreateNew={() => {}}
              />
            )
          )}

          {/* Compare: self-contained data fetching */}
          {activeView === "compare" && (
            <CompareView onBack={() => setActiveView("grid")} />
          )}

          {/* Activity: hotness tracking */}
          {activeView === "activity" && (
            <ActivityView />
          )}

          {/* Weekly report: self-contained data fetching */}
          {activeView === "weekly" && (
            <WeeklyReport />
          )}

          {/* Knowledge graph: self-contained data fetching */}
          {activeView === "graph" && (
            <KnowledgeGraphView />
          )}
        </div>
      </main>

      {/* Add Dialog */}
      <AddBookmarkDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onCreated={refreshBookmarks}
        editBookmark={editBookmark}
        collections={collections.map(c => ({ id: c.id, name: c.name }))}
      />

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm rounded-2xl border border-[var(--border)] shadow-[0_20px_60px_rgba(0,0,0,0.06)] bg-[var(--popover)] backdrop-blur-xl p-0 gap-0 overflow-hidden">
          <div className="p-5">
            <DialogHeader>
              <DialogTitle className="text-[17px] font-semibold text-[var(--foreground)] font-display">删除书签</DialogTitle>
              <DialogDescription className="text-[13px] text-[var(--muted-foreground)] mt-1 font-sans">
                确定要删除「{deleteTarget?.title}」吗？此操作无法撤销。
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="px-5 pb-5 flex gap-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} className="rounded-xl text-[13px] flex-1 font-sans">取消</Button>
            <Button
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
              className="rounded-xl bg-red-400 hover:bg-red-500 text-white text-[13px] flex-1 shadow-none font-sans"
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet — card dissolve animation */}
      <BookmarkDetailSheet
        bookmark={selectedBookmark}
        cardRect={cardRect}
        open={detailOpen}
        onClose={handleDetailClose}
        onStatusChange={handleStatusChange}
        onDelete={(id) => {
          handleDetailClose();
          setDeleteTarget(bookmarks.find((b) => b.id === id) || null);
        }}
        onShare={handleShare}
        onSelectBookmark={(id) => {
          // "Infinite exploration" — switch detail to the recommended bookmark
          const bm = bookmarks.find((b) => b.id === id);
          if (bm) {
            setSelectedBookmark(bm);
            // Card rect is stale; use a small center-of-screen rect for a subtle animation
            setCardRect(null);
          }
        }}
        onRead={(bookmark) => {
          setReaderBookmark(bookmark);
          setReaderOpen(true);
        }}
        collections={collections.map(c => ({ id: c.id, name: c.name }))}
        onAddToCollection={handleAddToCollection}
        onRemoveFromCollection={handleRemoveFromCollection}
      />

      {/* Reader View — full-screen reading mode */}
      <ReaderView
        bookmark={readerBookmark!}
        open={readerOpen}
        onClose={() => setReaderOpen(false)}
      />

      {/* Batch action bar — appears when cards are selected */}
      {selectedIds.size > 0 && (
        <BatchActionBar
          selectedCount={selectedIds.size}
          collections={collections.map((c) => ({ id: c.id, name: c.name }))}
          onAddToCollection={handleBatchAddToCollection}
          onChangeStatus={handleBatchStatusChange}
          onDelete={handleBatchDelete}
          onClearSelection={handleClearSelection}
        />
      )}
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
