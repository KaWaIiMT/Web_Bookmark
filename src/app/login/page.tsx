"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Brain, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);

  // Handle URL query params
  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setVerified(true);
      toast.success("邮箱验证成功，请登录");
    }
    const err = searchParams.get("error");
    if (err === "token-expired") {
      setError("验证链接已过期，请重新注册");
    } else if (err === "token-not-found" || err === "invalid-token") {
      setError("验证链接无效");
    } else if (err === "server-error") {
      setError("服务器错误，请稍后重试");
    } else if (err === "OAuthAccountNotLinked") {
      setError("此邮箱已注册过账号，请先用密码登录，然后在设置中关联 GitHub");
    } else if (err === "OAuthCallback") {
      setError("GitHub 授权失败，请重试");
    } else if (err === "OAuthSignin") {
      setError("GitHub 登录流程异常，请重试");
    } else if (err === "Callback") {
      setError("登录回调异常，请重试");
    } else if (err) {
      setError("登录失败，请重试");
    }
  }, [searchParams]);

  // Redirect if already logged in
  if (status === "authenticated" && session) {
    router.replace("/");
    return null;
  }

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("请输入邮箱地址");
      return;
    }
    if (!password) {
      setError("请输入密码");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("邮箱或密码错误");
      } else if (result?.ok) {
        router.push("/");
      }
    } catch {
      setError("登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="text-center space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-[var(--accent)] flex items-center justify-center">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="font-display text-[28px] font-bold text-[var(--foreground)] tracking-tight">
              MarkBox
            </h1>
            <p className="text-[14px] text-[var(--muted-foreground)] mt-1 font-sans">
              AI 智能书签管理
            </p>
          </div>
        </div>

        {/* Login card */}
        <div className="bg-[var(--card)] backdrop-blur-sm rounded-2xl border border-[var(--border)] p-8 w-[360px] shadow-[0_12px_40px_rgba(0,0,0,0.04)]">
          {/* Verified banner */}
          {verified && (
            <div className="flex items-center gap-2 mb-6 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 text-[13px] font-sans">
              <CheckCircle className="h-4 w-4 shrink-0" />
              邮箱验证成功，请登录
            </div>
          )}

          {/* Email + Password form */}
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <Input
              type="email"
              placeholder="邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl h-11 text-[14px] font-sans"
              autoComplete="email"
            />

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl h-11 text-[14px] pr-10 font-sans"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/50 hover:text-[var(--muted-foreground)] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <p className="text-[13px] text-red-500 font-sans">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[var(--foreground)] hover:bg-[var(--foreground)]/80 text-[var(--background)] h-11 text-[14px] font-medium shadow-none transition-all font-sans"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "登录"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-[12px] text-[var(--muted-foreground)]/60 font-sans">或</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          {/* GitHub login */}
          <Button
            onClick={() => signIn("github", { callbackUrl: "/" })}
            className="w-full rounded-xl bg-[var(--foreground)] hover:bg-[var(--foreground)]/80 text-[var(--background)] h-11 text-[14px] font-medium shadow-none transition-all font-sans"
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            使用 GitHub 登录
          </Button>
        </div>

        {/* Footer links */}
        <div className="text-center space-y-2">
          <p className="text-[13px] text-[var(--muted-foreground)] font-sans">
            还没有账号？{" "}
            <button
              onClick={() => router.push("/register")}
              className="text-[var(--foreground)] hover:underline font-medium"
            >
              立即注册
            </button>
          </p>
          <p>
            <button
              onClick={() => router.push("/register")}
              className="text-[12px] text-[var(--muted-foreground)]/60 hover:text-[var(--muted-foreground)] font-sans transition-colors"
            >
              重新发送验证邮件
            </button>
          </p>
          <p>
            <button
              onClick={() => toast.info("该功能即将上线")}
              className="text-[12px] text-[var(--muted-foreground)]/60 hover:text-[var(--muted-foreground)] font-sans transition-colors"
            >
              忘记密码？
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
