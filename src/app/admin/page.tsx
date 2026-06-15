"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Brain, Users, Bookmark, Shield, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: string;
  bookmarkCount: number;
  githubAccount: { provider: string; providerAccountId: string } | null;
}

interface UserBookmark {
  id: string;
  url: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  favicon: string | null;
  siteName: string | null;
  contentType: string;
  status: string;
  createdAt: string;
  tags: { tag: { id: string; name: string; color: string | null } }[];
  category: { id: string; name: string } | null;
}

const statusLabels: Record<string, string> = {
  unread: "待读",
  reading: "在读",
  read: "已读",
  archived: "归档",
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userBookmarks, setUserBookmarks] = useState<UserBookmark[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [bookmarkDialogOpen, setBookmarkDialogOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/login");
      return;
    }
    if (!session.user.isAdmin) {
      router.push("/");
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/admin/users")
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 403 ? "Forbidden" : "Failed");
        return r.json();
      })
      .then((d) => setUsers(d.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [session]);

  const handleViewBookmarks = async (user: AdminUser) => {
    setSelectedUser(user);
    setBookmarkDialogOpen(true);
    setBookmarksLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/bookmarks`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setUserBookmarks(data.bookmarks || []);
    } catch {
      setUserBookmarks([]);
    } finally {
      setBookmarksLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <header className="flex items-center gap-4 px-5 py-3 shrink-0 bg-[var(--sidebar)] backdrop-blur-xl border-b border-[var(--sidebar-border)]">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-[var(--accent)]/10" />
            <div className="h-5 w-20 rounded-lg bg-[var(--muted)] animate-pulse" />
          </div>
        </header>
        <div className="flex items-center justify-center py-40">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <p className="text-[15px] text-[var(--muted-foreground)] font-sans">{error}</p>
      </div>
    );
  }

  const totalBookmarks = users.reduce((sum, u) => sum + u.bookmarkCount, 0);
  const adminCount = process.env.NEXT_PUBLIC_ADMIN_GITHUB_IDS
    ? process.env.NEXT_PUBLIC_ADMIN_GITHUB_IDS.split(",").filter(Boolean).length
    : 1;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="flex items-center gap-4 px-5 py-3 shrink-0 bg-[var(--sidebar)] backdrop-blur-xl border-b border-[var(--sidebar-border)]">
        <button
          onClick={() => router.push("/")}
          className="p-1.5 rounded-xl hover:bg-[var(--sidebar-item-hover)] text-[var(--muted-foreground)] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-[var(--accent)] flex items-center justify-center">
            <Brain className="h-4.5 w-4.5 text-white" />
          </div>
          <h1 className="font-display font-bold text-[17px] text-[var(--foreground)] tracking-tight">MarkBox</h1>
        </div>
        <span className="text-[11px] font-medium text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded-full font-sans">
          Admin
        </span>
        <div className="flex-1" />
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="rounded-xl text-[13px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-sans"
        >
          返回主页
        </Button>
      </header>

      <div className="max-w-5xl mx-auto px-5 py-8 space-y-8">
        {/* Stats Overview */}
        <section>
          <h2 className="text-[12px] font-medium text-[var(--muted-foreground)] uppercase tracking-widest mb-4 font-sans">
            概览
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-xl p-4 text-center space-y-1.5 bg-[var(--muted)]">
              <Users className="h-4 w-4 mx-auto opacity-50 text-[var(--foreground)]" />
              <div className="text-[22px] font-semibold font-display text-[var(--foreground)]">{users.length}</div>
              <div className="text-[11px] text-[var(--muted-foreground)] font-sans">用户数</div>
            </div>
            <div className="rounded-xl p-4 text-center space-y-1.5 bg-[var(--muted)]">
              <Bookmark className="h-4 w-4 mx-auto opacity-50 text-[var(--foreground)]" />
              <div className="text-[22px] font-semibold font-display text-[var(--foreground)]">{totalBookmarks}</div>
              <div className="text-[11px] text-[var(--muted-foreground)] font-sans">总书签数</div>
            </div>
            <div className="rounded-xl p-4 text-center space-y-1.5 bg-[var(--accent)]/5">
              <Shield className="h-4 w-4 mx-auto text-[var(--accent)]" />
              <div className="text-[22px] font-semibold font-display text-[var(--accent)]">{adminCount}</div>
              <div className="text-[11px] text-[var(--muted-foreground)] font-sans">管理员</div>
            </div>
          </div>
        </section>

        {/* Users Table */}
        <section>
          <h2 className="text-[12px] font-medium text-[var(--muted-foreground)] uppercase tracking-widest mb-4 font-sans">
            用户列表
          </h2>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left px-5 py-3 text-[11px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-sans">用户</th>
                    <th className="text-left px-5 py-3 text-[11px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-sans hidden sm:table-cell">邮箱</th>
                    <th className="text-center px-5 py-3 text-[11px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-sans">书签</th>
                    <th className="text-right px-5 py-3 text-[11px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-sans hidden md:table-cell">注册时间</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--muted)]/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <img src={user.image} alt="" className="h-8 w-8 rounded-full ring-1 ring-[var(--border)]" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-[var(--muted)] flex items-center justify-center">
                              <Users className="h-4 w-4 text-[var(--muted-foreground)]" />
                            </div>
                          )}
                          <span className="text-[13px] font-medium text-[var(--foreground)] font-sans">
                            {user.name || "匿名用户"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[13px] text-[var(--muted-foreground)] font-sans hidden sm:table-cell">
                        {user.email || "—"}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-[1.8rem] px-2 py-0.5 rounded-full text-[12px] font-medium bg-[var(--muted)] text-[var(--foreground)] font-sans">
                          {user.bookmarkCount}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[12px] text-[var(--muted-foreground)] text-right font-sans hidden md:table-cell">
                        {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewBookmarks(user)}
                          className="rounded-lg text-[12px] text-[var(--accent)] hover:bg-[var(--accent)]/5 font-sans h-8"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          查看
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {users.length === 0 && (
              <div className="p-10 text-center text-[13px] text-[var(--muted-foreground)] font-sans">
                暂无用户。
              </div>
            )}
          </div>
        </section>

        {/* Bookmarks Dialog */}
        <Dialog open={bookmarkDialogOpen} onOpenChange={setBookmarkDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl border border-[var(--border)] shadow-[0_20px_60px_rgba(0,0,0,0.06)] bg-[var(--popover)] backdrop-blur-xl p-0 gap-0">
            <div className="px-6 pt-5 pb-3">
              <DialogHeader>
                <DialogTitle className="text-[17px] font-semibold text-[var(--foreground)] font-display flex items-center gap-2">
                  {selectedUser?.image && (
                    <img src={selectedUser.image} alt="" className="h-6 w-6 rounded-full" />
                  )}
                  {selectedUser?.name || "用户"}
                  <span className="text-[12px] font-normal text-[var(--muted-foreground)] font-sans">
                    的书签
                  </span>
                </DialogTitle>
              </DialogHeader>
            </div>
            {bookmarksLoading ? (
              <div className="space-y-3 px-5 pb-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl bg-[var(--skeleton)]" />
                ))}
              </div>
            ) : userBookmarks.length === 0 ? (
              <p className="text-[13px] text-[var(--muted-foreground)] text-center py-8 font-sans px-5">
                暂无书签。
              </p>
            ) : (
              <div className="space-y-1 px-3 pb-4">
                {userBookmarks.map((b) => (
                  <a
                    key={b.id}
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--muted)]/30 transition-colors group"
                  >
                    {b.favicon ? (
                      <img src={b.favicon} alt="" className="h-5 w-5 rounded mt-0.5 shrink-0" />
                    ) : (
                      <div className="h-5 w-5 rounded bg-[var(--muted)] shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[var(--foreground)] font-sans truncate group-hover:text-[var(--accent)] transition-colors">
                        {b.title}
                      </p>
                      <p className="text-[11px] text-[var(--muted-foreground)] font-sans truncate mt-0.5">
                        {b.url}
                      </p>
                      {b.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {b.tags.map(({ tag }) => (
                            <span key={tag.id} className="text-[9px] px-1.5 py-0 rounded-md bg-[var(--muted)] text-[var(--muted-foreground)] font-sans">
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-sans shrink-0",
                      b.status === "unread" ? "bg-amber-100/60 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" :
                      b.status === "reading" ? "bg-[#b76e4b]/10 text-[#b76e4b]" :
                      b.status === "read" ? "bg-emerald-100/60 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
                      "bg-zinc-100/60 text-zinc-400"
                    )}>
                      {statusLabels[b.status] || b.status}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
