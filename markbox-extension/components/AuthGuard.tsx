import { useState, useEffect, type ReactNode } from "react";
import { getApiKey, setApiKey } from "@/lib/storage";
import { api } from "@/lib/api";
import { Key, AlertCircle } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [state, setState] = useState<"checking" | "authenticated" | "no_key">("checking");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    // 1. Try session cookie (zero-config for logged-in users)
    const cookieOk = await api.tryCookieAuth();
    if (cookieOk) {
      setState("authenticated");
      return;
    }

    // 2. Fallback to API key
    const key = await getApiKey();
    if (!key) {
      setState("no_key");
      return;
    }

    const valid = await api.validateKey();
    if (valid) {
      setState("authenticated");
    } else {
      setState("no_key");
      setError("API Key 无效，请重新输入");
    }
  }

  async function handleSaveKey() {
    setError("");
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setError("请输入 API Key");
      return;
    }
    if (!trimmed.startsWith("mb_")) {
      setError("API Key 格式错误，应以 mb_ 开头");
      return;
    }

    setSaving(true);
    await setApiKey(trimmed);

    const valid = await api.validateKey();
    setSaving(false);

    if (valid) {
      setState("authenticated");
    } else {
      setError("无法连接到 MarkBox，请检查 Key 是否正确");
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

  if (state === "no_key") {
    return (
      <div className="p-5 flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="flex items-center gap-2">
          <Key className="h-6 w-6 text-[var(--accent)]" />
          <span className="text-lg font-display font-bold text-[var(--foreground)]">
            MarkBox
          </span>
        </div>

        <p className="text-[13px] text-[var(--muted-foreground)] text-center leading-relaxed font-sans">
          请输入 API Key 以连接到你的 MarkBox 书签库
        </p>

        {error && (
          <div className="flex items-start gap-2 w-full p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[12px] font-sans">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="w-full">
          <label className="text-[11px] font-medium text-[var(--muted-foreground)] font-sans">
            API Key
          </label>
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="mb_..."
            className="w-full mt-1 px-3 py-2 text-[13px] rounded-xl border border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] font-sans outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all"
            onKeyDown={(e) => e.key === "Enter" && handleSaveKey()}
          />
        </div>

        <button
          onClick={handleSaveKey}
          disabled={saving}
          className="w-full py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] text-[13px] font-medium font-sans transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          {saving ? "验证中..." : "连接 MarkBox"}
        </button>

        <p className="text-[11px] text-[var(--foreground)]/25 text-center leading-relaxed font-sans">
          在 MarkBox 网页设置 → API Keys 中生成密钥
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
