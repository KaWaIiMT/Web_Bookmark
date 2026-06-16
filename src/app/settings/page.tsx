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
  Key,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  FileArchive,
  RefreshCw,
  Database,
  AlertTriangle,
  Loader2,
  Wifi,
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
  const [apiKeys, setApiKeys] = useState<{
    id: string;
    name: string;
    keyPreview?: string;
    lastUsedAt: string | null;
    createdAt: string;
  }[]>([]);
  const [newKey, setNewKey] = useState<{
    id: string;
    name: string;
    key: string;
  } | null>(null);
  const [keyNameInput, setKeyNameInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [fullKeys, setFullKeys] = useState<Record<string, string>>({});
  const [revealingKey, setRevealingKey] = useState<string | null>(null);
  const [archiveStats, setArchiveStats] = useState<{
    totalBookmarks: number;
    archived: number;
    pending: number;
    failed: number;
    unarchived: number;
    storageFormatted: string;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch API keys
  useEffect(() => {
    if (!session) return;
    fetch("/api/settings/api-keys")
      .then((r) => r.json())
      .then((d) => setApiKeys(d.data || []))
      .catch(() => {});
  }, [session]);

  const handleGenerateKey = async () => {
    const name = keyNameInput.trim() || `Key ${apiKeys.length + 1}`;
    setGenerating(true);
    try {
      const res = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewKey(data);
        setApiKeys((prev) => [
          { id: data.id, name: data.name, lastUsedAt: null, createdAt: data.createdAt },
          ...prev,
        ]);
        setKeyNameInput("");
        toast.success("API Key 已生成");
      } else {
        toast.error(data.error || "生成失败");
      }
    } catch {
      toast.error("生成失败，请重试");
    } finally {
      setGenerating(false);
    }
  };

  const handleRevealKey = async (id: string) => {
    setRevealingKey(id);
    try {
      const res = await fetch(`/api/settings/api-keys/${id}`);
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "查看失败");
        return;
      }
      const data = await res.json();
      setFullKeys((prev) => ({ ...prev, [id]: data.key }));
      setShowKey((prev) => ({ ...prev, [id]: true }));
    } catch {
      toast.error("查看失败");
    } finally {
      setRevealingKey(null);
    }
  };

  const handleRevokeKey = async (id: string) => {
    setRevoking(id);
    try {
      const res = await fetch(`/api/settings/api-keys/${id}`, { method: "DELETE" });
      if (res.ok) {
        setApiKeys((prev) => prev.filter((k) => k.id !== id));
        toast.success("API Key 已吊销");
      } else {
        toast.error("吊销失败");
      }
    } catch {
      toast.error("吊销失败，请重试");
    } finally {
      setRevoking(null);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key).then(() => toast.success("已复制到剪贴板"));
  };

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
    // Fetch archive stats
    fetch("/api/bookmarks/archive")
      .then((r) => r.json())
      .then((d) => setArchiveStats(d))
      .catch(() => {});
  }, [session, status, router]);

  const handleRefreshArchives = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/bookmarks/archive", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ days: 30 }) });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || `已开始刷新 ${data.refreshed} 篇书签存档`);
        // Refresh stats
        fetch("/api/bookmarks/archive")
          .then((r) => r.json())
          .then((d) => setArchiveStats(d))
          .catch(() => {});
      } else {
        toast.error(data.error || "刷新失败");
      }
    } catch {
      toast.error("刷新失败，请重试");
    } finally {
      setRefreshing(false);
    }
  };

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
                <User className="h-3 w-3" />
                邮箱登录
              </div>
            </div>
            {/* Account action buttons */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => signIn("github", { callbackUrl: "/settings" })}
                className="rounded-xl text-[12px] border-[var(--border)] font-sans flex-1"
              >
                <svg className="h-3.5 w-3.5 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                关联 GitHub
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

        {/* Archive Management */}
        <section>
          <h2 className="text-[12px] font-medium text-[var(--muted-foreground)] uppercase tracking-widest mb-4 font-sans">
            存档管理
          </h2>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-sm overflow-hidden">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[14px] font-medium text-[var(--foreground)] font-sans">
                    页面存档
                  </h3>
                  <p className="text-[12px] text-[var(--muted-foreground)] mt-0.5 font-sans">
                    防止链接失效导致内容丢失
                  </p>
                </div>
                <Button
                  onClick={handleRefreshArchives}
                  disabled={refreshing}
                  variant="outline"
                  className="rounded-xl text-[13px] border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--foreground)] font-sans h-10"
                >
                  {refreshing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2 opacity-50" />
                  )}
                  刷新最近30天
                </Button>
              </div>

              {archiveStats ? (
                <div className="grid grid-cols-5 gap-3 mb-4">
                  <StatCard icon={FileArchive} label="已存档" value={archiveStats.archived} className="text-emerald-500 bg-emerald-100/50 dark:bg-emerald-500/10" />
                  <StatCard icon={Loader2} label="存档中" value={archiveStats.pending} className="text-amber-500 bg-amber-100/50 dark:bg-amber-500/10" />
                  <StatCard icon={AlertTriangle} label="失败" value={archiveStats.failed} className="text-red-500 bg-red-100/50 dark:bg-red-500/10" />
                  <StatCard icon={Archive} label="未存档" value={archiveStats.unarchived} className="text-zinc-400 bg-zinc-100/50 dark:bg-zinc-500/10" />
                  <StatCard icon={Database} label="存储用量" value={0} className="text-[#b76e4b] bg-[#b76e4b]/10">
                    <span className="text-[10px] font-sans">{archiveStats.storageFormatted}</span>
                  </StatCard>
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-3 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="rounded-xl bg-[var(--muted)] h-20 animate-pulse" />
                  ))}
                </div>
              )}

              <p className="text-[11px] text-[var(--muted-foreground)] font-sans">
                收藏书签时自动存档 · 简化 HTML 格式 · iframe sandbox 安全渲染
              </p>
            </div>
          </div>
        </section>

        {/* Link Health Check */}
        <section>
          <h2 className="text-[12px] font-medium text-[var(--muted-foreground)] uppercase tracking-widest mb-4 font-sans">
            链接健康
          </h2>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-sm overflow-hidden">
            <div className="p-5 flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-medium text-[var(--foreground)] font-sans">
                  链接检测
                </h3>
                <p className="text-[12px] text-[var(--muted-foreground)] mt-0.5 font-sans">
                  检测活跃书签的链接状态，自动标记失效页面
                </p>
              </div>
              <Button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/health/check", { method: "POST" });
                    const data = await res.json();
                    if (res.ok) toast.success(data.message || `已检查 ${data.checked} 条`);
                    else toast.error(data.error || "检查失败");
                  } catch { toast.error("检查请求失败"); }
                }}
                variant="outline"
                className="rounded-xl text-[13px] border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--foreground)] font-sans h-10"
              >
                <Wifi className="h-4 w-4 mr-2 opacity-50" />
                检查链接
              </Button>
            </div>
          </div>
        </section>

        {/* API Keys */}
        <section>
          <h2 className="text-[12px] font-medium text-[var(--muted-foreground)] uppercase tracking-widest mb-4 font-sans">
            API Keys
          </h2>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-sm overflow-hidden">
            {/* Generate new key */}
            <div className="p-5">
              <h3 className="text-[14px] font-medium text-[var(--foreground)] mb-3 font-sans">
                生成新 Key
              </h3>
              <p className="text-[12px] text-[var(--muted-foreground)] mb-3 font-sans">
                用于浏览器扩展、第三方工具等场景的 API 认证。生成的 Key 可随时查看和复制。
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={keyNameInput}
                  onChange={(e) => setKeyNameInput(e.target.value)}
                  placeholder="Key 名称（如：Chrome 扩展）"
                  className="flex-1 h-10 px-3 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[13px] font-sans text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--accent)]/10"
                  onKeyDown={(e) => e.key === "Enter" && handleGenerateKey()}
                />
                <Button
                  onClick={handleGenerateKey}
                  disabled={generating}
                  className="rounded-xl text-[13px] font-sans h-10 bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90 shadow-none"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  {generating ? "生成中…" : "生成"}
                </Button>
              </div>

              {/* New key display */}
              {newKey && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Key className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[13px] font-medium text-emerald-700 dark:text-emerald-400 font-sans">
                      {newKey.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-[12px] font-mono bg-white/50 dark:bg-black/20 px-2 py-1 rounded break-all">
                      {showKey[newKey.id] ? newKey.key : "••••••••••••••••••••••••••••••"}
                    </code>
                    <button
                      onClick={() =>
                        setShowKey((prev) => ({
                          ...prev,
                          [newKey.id]: !prev[newKey.id],
                        }))
                      }
                      className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 text-[var(--muted-foreground)] cursor-pointer shrink-0"
                    >
                      {showKey[newKey.id] ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleCopyKey(newKey.key)}
                      className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 text-[var(--muted-foreground)] cursor-pointer shrink-0"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-600/60 dark:text-emerald-400/60 font-sans mt-1.5">
                    Key 已生成 — 可随时在下方「已有 Keys」中查看和复制
                  </p>
                </div>
              )}
            </div>

            {/* Existing keys list */}
            {apiKeys.length > 0 && (
              <>
                <div className="h-px bg-[var(--border)] mx-5" />
                <div className="p-5">
                  <h3 className="text-[14px] font-medium text-[var(--foreground)] mb-3 font-sans">
                    已有 Keys
                  </h3>
                  <div className="space-y-2">
                    {apiKeys.map((k) => {
                      const fullKey = fullKeys[k.id];
                      const isVisible = showKey[k.id];
                      return (
                      <div
                        key={k.id}
                        className="flex flex-col gap-2 px-3 py-2 rounded-xl bg-[var(--muted)]/50"
                      >
                        <div className="flex items-center gap-3">
                          <Key className="h-3.5 w-3.5 text-[var(--muted-foreground)] shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-[var(--foreground)] font-sans">
                              {k.name}
                            </p>
                            <p className="text-[11px] text-[var(--muted-foreground)] font-sans">
                              创建于{" "}
                              {new Date(k.createdAt).toLocaleDateString("zh-CN")}
                              {k.lastUsedAt
                                ? ` · 上次使用 ${new Date(k.lastUsedAt).toLocaleDateString("zh-CN")}`
                                : " · 从未使用"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {fullKey && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(fullKey).then(() => toast.success("已复制到剪贴板"));
                                }}
                                className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 text-[var(--muted-foreground)] cursor-pointer"
                                title="复制"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (isVisible) {
                                  setShowKey((prev) => ({ ...prev, [k.id]: false }));
                                } else if (fullKey) {
                                  setShowKey((prev) => ({ ...prev, [k.id]: true }));
                                } else {
                                  handleRevealKey(k.id);
                                }
                              }}
                              disabled={revealingKey === k.id}
                              className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 text-[var(--muted-foreground)] cursor-pointer shrink-0"
                              title={isVisible ? "隐藏" : "查看完整 Key"}
                            >
                              {revealingKey === k.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : isVisible ? (
                                <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <Button
                              onClick={() => handleRevokeKey(k.id)}
                              disabled={revoking === k.id}
                              variant="ghost"
                              className="rounded-lg text-[12px] text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 font-sans h-8 px-3"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        {/* Key display row */}
                        {isVisible && fullKey && (
                          <div className="flex items-center gap-2 pl-7">
                            <code className="flex-1 text-[11px] font-mono bg-white/50 dark:bg-black/20 px-2 py-1 rounded break-all select-all">
                              {fullKey}
                            </code>
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
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
  children,
}: {
  icon: typeof Bookmark;
  label: string;
  value: number;
  className?: string;
  children?: React.ReactNode;
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
      <div className="text-[15px] font-semibold font-display">{children ?? value}</div>
      <div className="text-[10px] font-sans">{label}</div>
    </div>
  );
}
