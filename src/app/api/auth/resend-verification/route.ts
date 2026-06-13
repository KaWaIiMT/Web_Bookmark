import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { resendVerificationLimiter } from "@/lib/rate-limit";
import { validateEmail } from "@/lib/auth-validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body as { email: string };

    // Validate email format
    const emailError = validateEmail(email);
    if (emailError) {
      return NextResponse.json({ error: emailError }, { status: 400 });
    }

    // Rate limit by IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rateCheck = resendVerificationLimiter.check(ip);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "发送过于频繁，请2分钟后再试" },
        { status: 429 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Look up user — prevent email enumeration by returning the same message
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json({
        message: "如果该邮箱已注册，验证邮件已重新发送",
        emailSent: false,
        verificationUrl: "",
      });
    }

    // Already verified
    if (user.emailVerified) {
      return NextResponse.json({
        message: "邮箱已验证，无需重新发送",
        emailSent: false,
        verificationUrl: "",
      });
    }

    // Delete all existing verification tokens for this email
    await prisma.verificationToken
      .deleteMany({
        where: { identifier: normalizedEmail },
      })
      .catch(() => {});

    // Create new token
    const token = crypto.randomUUID();
    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Send verification email
    const result = await sendVerificationEmail(normalizedEmail, token);

    return NextResponse.json({
      message: result.method !== "none"
        ? "验证邮件已重新发送，请查收"
        : "邮件发送失败，请使用下方链接手动验证",
      emailSent: result.method !== "none",
      verificationUrl: result.method === "none" ? result.verificationUrl : "",
    });
  } catch (error) {
    console.error("[resend-verification] Error:", error);
    return NextResponse.json(
      { error: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}
