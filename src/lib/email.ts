export const runtime = 'nodejs';
import { Resend } from "resend";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

// ─── Resend client ───────────────────────────────────────────────

let cachedResend: Resend | null | undefined;

function getResendClient(): Resend | null {
  if (cachedResend !== undefined) return cachedResend;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[email] Resend not configured (missing RESEND_API_KEY)");
    cachedResend = null;
    return null;
  }

  cachedResend = new Resend(apiKey);
  return cachedResend;
}

// ─── SMTP (nodemailer) fallback ──────────────────────────────────

let cachedTransporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (cachedTransporter !== undefined) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    console.warn(
      "[email] SMTP not configured — emails will be logged to console only"
    );
    cachedTransporter = null;
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });

  return cachedTransporter;
}

// ─── Types ───────────────────────────────────────────────────────

export type EmailMethod = "resend" | "smtp" | "none";

export interface SendResult {
  method: EmailMethod;
  verificationUrl: string;
}

// ─── Helpers ─────────────────────────────────────────────────────

function buildVerificationEmailHtml(verifyUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; padding: 40px 20px;">
  <div style="max-width: 420px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 40px 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
    <h2 style="margin: 0 0 8px; font-size: 22px; color: #1a1a1a;">MarkBox</h2>
    <p style="margin: 0 0 24px; font-size: 14px; color: #666;">AI 智能书签管理</p>
    <h3 style="margin: 0 0 12px; font-size: 18px; color: #1a1a1a;">验证你的邮箱地址</h3>
    <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #444;">
      感谢注册 MarkBox！请点击下方按钮验证你的邮箱地址，链接在 <strong>24 小时内</strong> 有效。
    </p>
    <a href="${verifyUrl}" style="display: block; width: 100%; padding: 12px 0; background: #1a1a1a; color: #fff; text-align: center; border-radius: 10px; font-size: 15px; font-weight: 500; text-decoration: none; box-sizing: border-box;">
      验证邮箱
    </a>
    <p style="margin: 24px 0 0; font-size: 12px; color: #999; line-height: 1.6;">
      如果按钮无法点击，请复制以下链接到浏览器打开：<br>
      <a href="${verifyUrl}" style="color: #666; word-break: break-all;">${verifyUrl}</a>
    </p>
  </div>
</body>
</html>`;
}

function getFromAddress(): string {
  return (
    process.env.RESEND_FROM ||
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    "MarkBox <noreply@markbox.app>"
  );
}

// ─── Main send function ──────────────────────────────────────────

export async function sendVerificationEmail(
  to: string,
  token: string
): Promise<SendResult> {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${appUrl}/api/auth/verify-email?token=${token}`;
  const from = getFromAddress();
  const subject = "验证你的 MarkBox 邮箱地址";
  const html = buildVerificationEmailHtml(verifyUrl);

  // 1) Try Resend
  const resend = getResendClient();
  if (resend) {
    try {
      await resend.emails.send({ from, to, subject, html });
      console.log(`[email] Verification email sent via Resend to ${to}`);
      return { method: "resend", verificationUrl: verifyUrl };
    } catch (error) {
      console.error(`[email] Resend failed, falling back:`, error);
    }
  }

  // 2) Try SMTP (nodemailer)
  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({ from, to, subject, html });
      console.log(`[email] Verification email sent via SMTP to ${to}`);
      return { method: "smtp", verificationUrl: verifyUrl };
    } catch (error) {
      console.error(`[email] SMTP failed, falling back:`, error);
    }
  }

  // 3) Neither available — log to console
  console.log(
    `[email] No email provider configured — verification link for ${to}: ${verifyUrl}`
  );
  return { method: "none", verificationUrl: verifyUrl };
}
