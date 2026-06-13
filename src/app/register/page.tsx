"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Brain, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [emailSent, setEmailSent] = useState(true);
  const [verificationUrl, setVerificationUrl] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [showFallbackLink, setShowFallbackLink] = useState(false);

  // Redirect if already logged in
  if (status === "authenticated" && session) {
    router.replace("/");
    return null;
  }

  function validate(): boolean {
    const next: Record<string, string> = {};

    if (!email.trim()) {
      next.email = "请输入邮箱地址";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "邮箱地址格式不正确";
    }

    if (!password) {
      next.password = "请输入密码";
    } else if (password.length < 8) {
      next.password = "密码至少需要 8 个字符";
    } else if (!/[a-zA-Z]/.test(password)) {
      next.password = "密码需要包含至少一个字母";
    } else if (!/\d/.test(password)) {
      next.password = "密码需要包含至少一个数字";
    }

    if (confirmPassword !== password) {
      next.confirmPassword = "两次输入的密码不一致";
    }

    if (name.trim().length > 50) {
      next.name = "昵称不能超过 50 个字符";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ form: data.error || "注册失败，请稍后重试" });
        return;
      }

      setRegistered(true);
      setEmailSent(data.emailSent !== false);
      setVerificationUrl(data.verificationUrl || "");
      toast.success(data.message || "注册成功");
    } catch {
      setErrors({ form: "网络错误，请检查连接后重试" });
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    setResending(true);
    setResendMessage("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResendMessage(data.error || "发送失败，请稍后重试");
        return;
      }
      if (data.emailSent) {
        setResendMessage("验证邮件已重新发送，请查收");
        setVerificationUrl("");
        setShowFallbackLink(false);
      } else {
        setResendMessage("邮件发送失败，请使用下方链接手动验证");
        setVerificationUrl(data.verificationUrl || verificationUrl);
        if (data.verificationUrl) setShowFallbackLink(true);
      }
    } catch {
      setResendMessage("网络错误，请重试");
    } finally {
      setResending(false);
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(verificationUrl);
      toast.success("验证链接已复制");
    } catch {
      toast.error("复制失败，请手动复制");
    }
  }

  if (registered) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center space-y-8">
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

          <div className="bg-[var(--card)] backdrop-blur-sm rounded-2xl border border-[var(--border)] p-8 w-[380px] shadow-[0_12px_40px_rgba(0,0,0,0.04)] space-y-5">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-[16px] font-semibold text-[var(--foreground)] font-sans">
              注册成功！
            </h2>
            <p className="text-[13px] text-[var(--muted-foreground)] leading-relaxed font-sans">
              {emailSent
                ? <>请查收发送至 <strong>{email}</strong> 的验证邮件，点击邮件中的链接完成邮箱验证。</>
                : <>邮件服务暂未配置，请使用下方链接完成验证。</>
              }
            </p>

            {/* Warning: email not sent — show direct link */}
            {!emailSent && verificationUrl && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-left space-y-3">
                <p className="text-[12px] text-amber-700 dark:text-amber-400 font-medium font-sans">
                  手动验证链接（24小时内有效）
                </p>
                <p className="text-[11px] text-amber-600 dark:text-amber-500 break-all font-mono leading-relaxed select-all">
                  {verificationUrl}
                </p>
                <button
                  onClick={handleCopyLink}
                  className="text-[12px] text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 underline font-sans transition-colors cursor-pointer"
                >
                  复制链接
                </button>
              </div>
            )}

            {/* Resend button */}
            <button
              onClick={handleResendVerification}
              disabled={resending}
              className="w-full py-2.5 rounded-xl border border-[var(--border)] text-[13px] text-[var(--muted-foreground)] font-sans hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-all disabled:opacity-50 cursor-pointer"
            >
              {resending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  发送中...
                </span>
              ) : (
                "重新发送验证邮件"
              )}
            </button>

            {/* Resend feedback */}
            {resendMessage && (
              <p className={`text-[12px] font-sans ${
                resendMessage.includes("失败") || resendMessage.includes("错误")
                  ? "text-red-500"
                  : "text-green-500"
              }`}>
                {resendMessage}
              </p>
            )}

            {/* Toggle: show fallback link */}
            {emailSent && (
              <div className="text-center">
                <button
                  onClick={() => setShowFallbackLink(!showFallbackLink)}
                  className="text-[11px] text-[var(--muted-foreground)]/50 hover:text-[var(--muted-foreground)] font-sans transition-colors cursor-pointer"
                >
                  {showFallbackLink ? "收起" : "仍然收不到邮件？"}
                </button>
                {showFallbackLink && verificationUrl && (
                  <div className="mt-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-left space-y-3">
                    <p className="text-[12px] text-amber-700 dark:text-amber-400 font-medium font-sans">
                      手动验证链接（24小时内有效）
                    </p>
                    <p className="text-[11px] text-amber-600 dark:text-amber-500 break-all font-mono leading-relaxed select-all">
                      {verificationUrl}
                    </p>
                    <button
                      onClick={handleCopyLink}
                      className="text-[12px] text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 underline font-sans transition-colors cursor-pointer"
                    >
                      复制链接
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Info */}
            <p className="text-[12px] text-[var(--muted-foreground)]/60 font-sans">
              未收到邮件？请检查垃圾箱，或点击上方按钮重新发送。
            </p>

            <Button
              onClick={() => router.push("/login")}
              className="w-full rounded-xl bg-[var(--foreground)] hover:bg-[var(--foreground)]/80 text-[var(--background)] h-11 text-[14px] font-medium shadow-none font-sans"
            >
              前往登录
            </Button>
          </div>
        </div>
      </div>
    );
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

        {/* Register card */}
        <div className="bg-[var(--card)] backdrop-blur-sm rounded-2xl border border-[var(--border)] p-8 w-[360px] shadow-[0_12px_40px_rgba(0,0,0,0.04)]">
          <h2 className="text-[16px] font-semibold text-[var(--foreground)] mb-6 font-sans">
            创建账号
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="text-left">
              <Input
                type="text"
                placeholder="昵称（选填）"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl h-11 text-[14px] font-sans"
              />
              {errors.name && (
                <p className="text-[12px] text-red-500 mt-1 font-sans">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="text-left">
              <Input
                type="email"
                placeholder="邮箱地址"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl h-11 text-[14px] font-sans"
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-[12px] text-red-500 mt-1 font-sans">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="text-left relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="密码（至少8位，包含字母和数字）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl h-11 text-[14px] pr-10 font-sans"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/50 hover:text-[var(--muted-foreground)] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              {errors.password && (
                <p className="text-[12px] text-red-500 mt-1 font-sans">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="text-left">
              <Input
                type="password"
                placeholder="确认密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-xl h-11 text-[14px] font-sans"
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="text-[12px] text-red-500 mt-1 font-sans">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Form error */}
            {errors.form && (
              <p className="text-[13px] text-red-500 font-sans">{errors.form}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[var(--foreground)] hover:bg-[var(--foreground)]/80 text-[var(--background)] h-11 text-[14px] font-medium shadow-none transition-all font-sans"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "注册"
              )}
            </Button>
          </form>
        </div>

        {/* Footer links */}
        <div className="text-center space-y-2">
          <p className="text-[13px] text-[var(--muted-foreground)] font-sans">
            已有账号？{" "}
            <button
              onClick={() => router.push("/login")}
              className="text-[var(--foreground)] hover:underline font-medium"
            >
              立即登录
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
