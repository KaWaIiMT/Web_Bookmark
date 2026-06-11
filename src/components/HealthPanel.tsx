"use client";

import { useState, useEffect } from "react";
import { Wifi, WifiOff, AlertTriangle, RefreshCw, Loader2, FileArchive, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthOverview {
  total: number;
  healthy: number;
  redirect: number;
  broken: number;
  unknown: number;
  lastCheckAt: string | null;
  brokenLinks: Array<{
    id: string;
    title: string;
    url: string;
    linkStatusCode: number | null;
    linkCheckedAt: string | null;
    hasArchive: boolean;
  }>;
  redirectLinks: Array<{
    id: string;
    title: string;
    url: string;
    linkStatusCode: number | null;
    linkCheckedAt: string | null;
    linkRedirectUrl: string | null;
  }>;
}

interface HealthPanelProps {
  onSelectBookmark?: (id: string) => void;
}

export function HealthPanel({ onSelectBookmark }: HealthPanelProps) {
  const [data, setData] = useState<HealthOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/health/overview");
      if (res.ok) setData(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCheck = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/health/check", { method: "POST" });
      if (res.ok) {
        await fetchData();
      }
    } catch {} finally {
      setChecking(false);
    }
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return "从未";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} 分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} 小时前`;
    return `${Math.floor(hours / 24)} 天前`;
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="h-4 w-32 bg-[var(--muted)] rounded animate-pulse mb-4" />
        <div className="grid grid-cols-4 gap-3 mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-[var(--muted)] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-medium text-[var(--foreground)] font-sans flex items-center gap-2">
            <Wifi className="h-4 w-4 opacity-50" />
            链接健康
          </h3>
          <button
            onClick={handleCheck}
            disabled={checking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-sans border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors cursor-pointer disabled:opacity-50"
          >
            {checking ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {checking ? "检查中…" : "立即检查"}
          </button>
        </div>

        {data && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <StatCard icon={Wifi} label="正常" value={data.healthy} className="text-emerald-500 bg-emerald-100/50 dark:bg-emerald-500/10" />
              <StatCard icon={AlertTriangle} label="注意" value={data.redirect} className="text-amber-500 bg-amber-100/50 dark:bg-amber-500/10" />
              <StatCard icon={WifiOff} label="失效" value={data.broken} className="text-red-500 bg-red-100/50 dark:bg-red-500/10" />
              <StatCard icon={RefreshCw} label="未检" value={data.unknown} className="text-zinc-400 bg-zinc-100/50 dark:bg-zinc-500/10" />
            </div>

            {/* Broken links */}
            {data.brokenLinks.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-widest mb-2 font-sans">
                  失效链接
                </p>
                <div className="space-y-1.5">
                  {data.brokenLinks.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-500/5 text-[12px] font-sans cursor-pointer hover:bg-red-100 dark:hover:bg-red-500/10 transition-colors"
                      onClick={() => onSelectBookmark?.(b.id)}
                    >
                      <WifiOff className="h-3.5 w-3.5 text-red-400 shrink-0" />
                      <span className="flex-1 text-[var(--foreground)]/70 truncate">
                        {b.title}
                      </span>
                      <span className="text-[11px] text-red-400 font-mono shrink-0">
                        {b.linkStatusCode || "—"}
                      </span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded font-sans shrink-0",
                        b.hasArchive
                          ? "text-emerald-600 bg-emerald-100/50 dark:text-emerald-400 dark:bg-emerald-500/10"
                          : "text-red-500 bg-red-100/50 dark:text-red-400 dark:bg-red-500/10"
                      )}>
                        {b.hasArchive ? "有存档" : "无存档"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Redirect links */}
            {data.redirectLinks.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-widest mb-2 font-sans">
                  重定向
                </p>
                <div className="space-y-1.5">
                  {data.redirectLinks.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/5 text-[12px] font-sans cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-500/10 transition-colors"
                      onClick={() => onSelectBookmark?.(r.id)}
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span className="flex-1 text-[var(--foreground)]/70 truncate">
                        {r.title}
                      </span>
                      <span className="text-[11px] text-amber-500 font-mono shrink-0">
                        {r.linkStatusCode || "—"}
                      </span>
                      {r.linkRedirectUrl && (
                        <ExternalLink className="h-3 w-3 text-amber-400/50 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last check info */}
            <p className="text-[11px] text-[var(--muted-foreground)] font-sans">
              上次检查：{formatTimeAgo(data.lastCheckAt)}
              {data.total > 0 && ` · 共 ${data.total} 条书签`}
            </p>
          </>
        )}
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
  icon: typeof Wifi;
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl p-3 text-center space-y-1",
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
