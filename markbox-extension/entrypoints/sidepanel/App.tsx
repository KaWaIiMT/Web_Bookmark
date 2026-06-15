import { useState, useEffect, useCallback, useRef } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { BookmarkListItem } from "@/components/BookmarkListItem";
import { StatusBadge } from "@/components/StatusBadge";
import { Toast } from "@/components/Toast";
import { api } from "@/lib/api";
import type { BookmarkData } from "@/lib/types";
import { Search, ExternalLink, Globe } from "lucide-react";

export default function App() {
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BookmarkData[] | null>(null);
  const [currentTab, setCurrentTab] = useState<{
    url: string;
    title: string;
    favicon: string;
  } | null>(null);
  const [pageBookmark, setPageBookmark] = useState<BookmarkData | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Init
  useEffect(() => {
    init();
  }, []);

  const init = useCallback(async () => {
    try {
      // Get current tab info
      browser.runtime.sendMessage({ type: "GET_CURRENT_TAB" }, (response) => {
        if (response?.success) {
          setCurrentTab(response.data);
          // Check if current page is bookmarked
          checkPageBookmark(response.data.url);
        }
      });

      // Fetch recent bookmarks
      fetchBookmarks();
    } catch {
      setLoading(false);
    }
  }, []);

  const fetchBookmarks = useCallback(async () => {
    try {
      const data = await api.listBookmarks(20);
      setBookmarks(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const checkPageBookmark = useCallback(async (url: string) => {
    try {
      const bm = await api.checkDuplicate(url);
      setPageBookmark(bm);
    } catch {
      // ignore
    }
  }, []);

  // Search with debounce
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (searchTimer.current) clearTimeout(searchTimer.current);

      if (!query.trim()) {
        setSearchResults(null);
        return;
      }

      searchTimer.current = setTimeout(async () => {
        try {
          const data = await api.searchBookmarks(query);
          setSearchResults(data);
        } catch {
          setSearchResults([]);
        }
      }, 300);
    },
    [],
  );

  // Status change
  const handleStatusChange = useCallback(
    async (id: string, status: string) => {
      try {
        await api.updateBookmark(id, { status });
        // Optimistic update
        const updater = (prev: BookmarkData[]) =>
          prev.map((b) =>
            b.id === id ? { ...b, status: status as BookmarkData["status"] } : b,
          );
        setBookmarks(updater);
        if (searchResults) setSearchResults(updater);
        if (pageBookmark?.id === id) {
          setPageBookmark((prev) =>
            prev ? { ...prev, status: status as BookmarkData["status"] } : null,
          );
        }
        setToast({ message: "状态已更新", type: "success" });
      } catch {
        setToast({ message: "更新失败", type: "error" });
      }
    },
    [searchResults, pageBookmark],
  );

  const displayed = searchResults ?? bookmarks;

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] shrink-0">
          <h1 className="text-base font-display font-bold text-[var(--foreground)]">
            MarkBox
          </h1>
          <span className="text-[10px] text-[var(--muted-foreground)] font-sans">
            侧边栏
          </span>
        </header>

        {/* Search */}
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--input)]">
            <Search className="h-3.5 w-3.5 text-[var(--foreground)]/25 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="搜索书签..."
              className="flex-1 bg-transparent text-[13px] font-sans text-[var(--foreground)] outline-none placeholder:text-[var(--foreground)]/20"
            />
          </div>
        </div>

        {/* Current page status */}
        {currentTab && (
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-[var(--muted-foreground)] shrink-0" />
              <span className="text-[12px] text-[var(--muted-foreground)] font-sans truncate flex-1">
                {currentTab.title || currentTab.url}
              </span>
              {pageBookmark ? (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-sans flex items-center gap-1 shrink-0">
                  ✅ 已收藏
                </span>
              ) : (
                <span className="text-[11px] text-[var(--foreground)]/25 font-sans shrink-0">
                  未收藏
                </span>
              )}
            </div>
          </div>
        )}

        {/* Bookmark list */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)] animate-spin" />
            </div>
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <p className="text-[13px] text-[var(--muted-foreground)] font-sans">
                {searchQuery ? "未找到匹配的书签" : "还没有书签"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {displayed.map((bm) => (
                <BookmarkListItem
                  key={bm.id}
                  bookmark={bm}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-4 py-3 border-t border-[var(--border)] shrink-0">
          <a
            href="https://ccjproject.top"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] text-[var(--muted-foreground)] font-sans hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-all no-underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            打开 MarkBox 主站
          </a>
        </footer>

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onDone={() => setToast(null)}
          />
        )}
      </div>
    </AuthGuard>
  );
}
