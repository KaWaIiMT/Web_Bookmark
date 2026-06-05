"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Download,
  FolderOpen,
  Bookmark,
  Calendar,
  Hash,
  Brain,
  CheckCircle2,
  Clock,
  BookOpen,
  Archive,
  Folder,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoading = status === "loading";
  const [stats, setStats] = useState<{
    total: number;
    unread: number;
    reading: number;
    read: number;
    archived: number;
  } | null>(null);
  const [collectionCount, setCollectionCount] = useState(0);
  const [tagCount, setTagCount] = useState(0);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!session && status !== "loading") {
      router.push("/login");
      return;
    }
    // Fetch stats
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});
    fetch("/api/collections")
      .then((r) => r.json())
      .then((d) => setCollectionCount(d.data?.length || 0))
      .catch(() => {});
    fetch("/api/tags")
      .then((r) => r.json())
      .then((d) => setTagCount(d.data?.length || 0))
      .catch(() => {});
  }, [session, status, router]);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Fetch all bookmarks with full data
      const res = await fetch("/api/bookmarks?limit=1000");
      const data = await res.json();
      const bookmarks = data.data || [];

      const exportData = {
        exportedAt: new Date().toISOString(),
        version: "1.0",
        bookmarks: bookmarks.map((b: Record<string, unknown>) => ({
          url: b.url,
          title: b.title,
          description: b.description,
          tags: (b.tags as Array<{ tag: { name: string } }>)?.map((t) => t.tag.name) || [],
          status: b.status,
          category: (b.category as { name?: string } | null)?.name || null,
          aiSummary: b.aiSummary,
          createdAt: b.createdAt,
        })),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `markbox-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`已导出 ${exportData.bookmarks.length} 条书签`);
    } catch {
      toast.error("导出失败，请重试");
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)] animate-spin" />
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="flex items-center gap-4 px-5 py-3 shrink-0 bg-[var(--sidebar)] backdrop-blur-xl border-b border-[var(--sidebar-border)]">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-xl hover:bg-[var(--sidebar-item-hover)] text-[var(--muted-foreground)] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-[var(--accent)] flex items-center justify-center">
            <Brain className="h-4.5 w-4.5 text-white" />
          </div>
          <h1 className="font-display font-bold text-[17px] text-[var(--foreground)] tracking-tight">
            MarkBox
          </h1>
        </div>
        <span className="text-[13px] text-[var(--muted-foreground)] font-sans ml-1">· 设置</span>
        <div className="flex-1" />
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="rounded-xl text-[13px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-sans"
        >
          返回主页
        </Button>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-10">
        {/* Profile Section */}
        <section>
          <h2 className="text-[12px] font-medium text-[var(--muted-foreground)] uppercase tracking-widest mb-4 font-sans">
            账户
          </h2>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-sm overflow-hidden">
            <div className="p-5 flex items-center gap-4">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt=""
                  className="h-14 w-14 rounded-full ring-2 ring-[var(--border)]"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-[var(--muted)] flex items-center justify-center">
                  <User className="h-6 w-6 text-[var(--muted-foreground)]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-[17px] font-semibold text-[var(--foreground)] font-display">
                  {session.user.name || "未命名用户"}
                </h3>
                <p className="text-[13px] text-[var(--muted-foreground)] font-sans mt-0.5">
                  {session.user.email || "无邮箱"}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)] font-sans bg-[var(--muted)] px-2.5 py-1 rounded-full">
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </div>
            </div>
            {/* Account action buttons */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => signIn("github", { callbackUrl: "/" })}
                className="rounded-xl text-[12px] border-[var(--border)] font-sans flex-1"
              >
                <svg className="h-3.5 w-3.5 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                切换账号
              </Button>
              <Button
                variant="outline"
                onClick={() => signOut()}
                className="rounded-xl text-[12px] border-red-200 text-red-400 hover:bg-red-50 font-sans flex-1"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                退出登录
              </Button>
            </div>
          </div>
        </section>

        {/* Theme Section */}
        <section>
          <h2 className="text-[12px] font-medium text-[var(--muted-foreground)] uppercase tracking-widest mb-4 font-sans">
            外观
          </h2>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-medium text-[var(--foreground)] font-sans">主题</h3>
                <p className="text-[12px] text-[var(--muted-foreground)] mt-0.5 font-sans">
                  选择浅色、深色或跟随系统自动切换
                </p>
              </div>
              <div className="shrink-0">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </section>

        {/* Data Section */}
        <section>
          <h2 className="text-[12px] font-medium text-[var(--muted-foreground)] uppercase tracking-widest mb-4 font-sans">
            数据
          </h2>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-sm overflow-hidden">
            {/* Stats Cards */}
            <div className="p-5">
              <h3 className="text-[14px] font-medium text-[var(--foreground)] mb-3 font-sans">书签统计</h3>
              {stats ? (
                <div className="grid grid-cols-5 gap-3">
                  <StatCard icon={Bookmark} label="总计" value={stats.total} />
                  <StatCard icon={Clock} label="待读" value={stats.unread} className="text-amber-500 bg-amber-100/50 dark:bg-amber-500/10" />
                  <StatCard icon={BookOpen} label="在读" value={stats.reading} className="text-[#b76e4b] bg-[#b76e4b]/10" />
                  <StatCard icon={CheckCircle2} label="已读" value={stats.read} className="text-emerald-500 bg-emerald-100/50 dark:bg-emerald-500/10" />
                  <StatCard icon={Archive} label="归档" value={stats.archived} className="text-zinc-400 bg-zinc-100/50 dark:bg-zinc-500/10" />
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="rounded-xl bg-[var(--muted)] h-20 animate-pulse" />
                  ))}
                </div>
              )}
            </div>
            <div className="h-px bg-[var(--border)] mx-5" />

            {/* Collection & Tag counts */}
            <div className="p-5 flex items-center gap-6">
              <div className="flex items-center gap-2 text-[13px] text-[var(--muted-foreground)] font-sans">
                <Folder className="h-4 w-4 opacity-50" />
                收藏夹 · <span className="font-medium text-[var(--foreground)]">{collectionCount}</span>
              </div>
              <div className="flex items-center gap-2 text-[13px] text-[var(--muted-foreground)] font-sans">
                <Hash className="h-4 w-4 opacity-50" />
                标签 · <span className="font-medium text-[var(--foreground)]">{tagCount}</span>
              </div>
            </div>
            <div className="h-px bg-[var(--border)] mx-5" />

            {/* Export */}
            <div className="p-5 flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-medium text-[var(--foreground)] font-sans">导出书签</h3>
                <p className="text-[12px] text-[var(--muted-foreground)] mt-0.5 font-sans">
                  将所有书签导出为 JSON 文件
                </p>
              </div>
              <Button
                onClick={handleExport}
                disabled={exporting}
                variant="outline"
                className="rounded-xl text-[13px] border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--foreground)] font-sans h-10"
              >
                <Download className="h-4 w-4 mr-2 opacity-50" />
                {exporting ? "导出中…" : "导出 JSON"}
              </Button>
            </div>
          </div>
        </section>

        {/* About */}
        <section>
          <h2 className="text-[12px] font-medium text-[var(--muted-foreground)] uppercase tracking-widest mb-4 font-sans">
            关于
          </h2>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-sm p-5 space-y-3">
            <div className="flex items-center justify-between text-[13px] font-sans">
              <span className="text-[var(--muted-foreground)]">版本</span>
              <span className="text-[var(--foreground)] font-medium">v0.2</span>
            </div>
            <div className="flex items-center justify-between text-[13px] font-sans">
              <span className="text-[var(--muted-foreground)]">技术栈</span>
              <span className="text-[var(--foreground)] font-medium">Next.js 16 · Prisma 7 · shadcn/ui</span>
            </div>
            <div className="flex items-center justify-between text-[13px] font-sans">
              <span className="text-[var(--muted-foreground)]">AI 引擎</span>
              <span className="text-[var(--foreground)] font-medium">DeepSeek V4 Flash</span>
            </div>
            <div className="flex items-center justify-between text-[13px] font-sans">
              <span className="text-[var(--muted-foreground)]">作者</span>
              <span className="text-[var(--foreground)] font-medium">MarkBox Team</span>
            </div>
          </div>
        </section>

        <div className="pb-8" />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof Bookmark;
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl p-3 text-center space-y-1.5",
        "bg-[var(--muted)] text-[var(--muted-foreground)]",
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 mx-auto opacity-60" />
      <div className="text-[15px] font-semibold font-display">{value}</div>
      <div className="text-[10px] font-sans">{label}</div>
    </div>
  );
}
