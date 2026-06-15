import { useState, useEffect, type ReactNode } from "react";
import { LogIn, ExternalLink } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [state, setState] = useState<"checking" | "authenticated" | "not_logged_in">("checking");

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch("https://ccjproject.top/api/auth/session", {
        credentials: "include",
      });
      if (!res.ok) {
        setState("not_logged_in");
        return;
      }
      const session = await res.json();
      if (session?.user) {
        setState("authenticated");
      } else {
        setState("not_logged_in");
      }
    } catch {
      setState("not_logged_in");
    }
  }

  if (state === "checking") {
    return (
      <div className="flex items-center justify-center h-[560px]">
        <div className="flex flex-col items-center gap-3 text-[var(--muted-foreground)]">
          <div className="h-8 w-8 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
          <span className="text-xs font-sans">验证身份中...</span>
        </div>
      </div>
    );
  }

  if (state === "not_logged_in") {
    return (
      <div className="p-5 flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🔖</span>
          <span className="text-lg font-display font-bold text-[var(--foreground)]">
            MarkBox
          </span>
        </div>

        <p className="text-[13px] text-[var(--muted-foreground)] text-center leading-relaxed font-sans">
          登录 GitHub 账号以一键收藏网页，<br />AI 自动提取摘要、分类和标签
        </p>

        <button
          onClick={() => {
            browser.tabs.create({ url: "https://ccjproject.top/login" });
          }}
          className="w-full py-2.5 rounded-xl bg-[var(--foreground)] text-[var(--background)] text-[13px] font-medium font-sans transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
        >
          <LogIn className="h-4 w-4" />
          用 GitHub 登录
        </button>

        <p className="text-[11px] text-[var(--foreground)]/25 text-center leading-relaxed font-sans">
          登录后返回此页面即可开始使用
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
