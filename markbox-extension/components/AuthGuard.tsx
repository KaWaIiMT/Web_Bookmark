import { useState, useEffect, type ReactNode } from "react";
import { LogIn, Key, Loader2, AlertCircle } from "lucide-react";
import { setApiKey, getApiKey } from "@/lib/storage";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [state, setState] = useState<"checking" | "authenticated" | "not_logged_in">("checking");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [apiKeyError, setApiKeyError] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      // 1. Try session cookie first
      const sessionRes = await fetch("https://ccjproject.top/api/auth/session", {
        credentials: "include",
      });
      if (sessionRes.ok) {
        const session = await sessionRes.json();
        if (session?.user) {
          setState("authenticated");
          return;
        }
      }

      // 2. Try stored API key
      const storedKey = await getApiKey();
      if (storedKey) {
        const valid = await verifyApiKey(storedKey);
        if (valid) {
          setState("authenticated");
          return;
        }
        // Key is invalid — clear it so user isn't stuck
        const { clearApiKey } = await import("@/lib/storage");
        await clearApiKey();
      }
    } catch {
      // fall through
    }
    setState("not_logged_in");
  }

  async function verifyApiKey(key: string): Promise<boolean> {
    try {
      const res = await fetch("https://ccjproject.top/api/settings/api-keys", {
        headers: { Authorization: `Bearer ${key}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async function handleUseApiKey() {
    const key = apiKeyInput.trim();
    if (!key) return;

    setApiKeyLoading(true);
    setApiKeyError("");

    try {
      const valid = await verifyApiKey(key);
      if (valid) {
        await setApiKey(key);
        setState("authenticated");
      } else {
        setApiKeyError("API Key 无效，请检查后重试");
      }
    } catch {
      setApiKeyError("验证失败，请检查网络连接");
    } finally {
      setApiKeyLoading(false);
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

        {/* API Key divider */}
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-[11px] text-[var(--foreground)]/25 font-sans">或</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        {/* API Key input */}
        <div className="w-full space-y-2">
          <label className="text-[11px] text-[var(--muted-foreground)] font-sans flex items-center gap-1">
            <Key className="h-3 w-3" />
            使用 API Key
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => {
                setApiKeyInput(e.target.value);
                setApiKeyError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleUseApiKey()}
              placeholder="mb_xxxxxxxx..."
              className="flex-1 h-10 px-3 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[13px] font-mono text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--accent)]/10 placeholder:text-[11px]"
            />
            <button
              onClick={handleUseApiKey}
              disabled={apiKeyLoading || !apiKeyInput.trim()}
              className="px-4 h-10 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] text-[13px] font-medium font-sans transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer disabled:opacity-40 flex items-center gap-1.5 shrink-0"
            >
              {apiKeyLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Key className="h-3.5 w-3.5" />
              )}
              验证
            </button>
          </div>
          {apiKeyError && (
            <p className="text-[11px] text-red-400 font-sans flex items-center gap-1">
              <AlertCircle className="h-3 w-3 shrink-0" />
              {apiKeyError}
            </p>
          )}
        </div>

        <p className="text-[11px] text-[var(--foreground)]/25 text-center leading-relaxed font-sans">
          在主站设置页生成 API Key 后粘贴到此处
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
