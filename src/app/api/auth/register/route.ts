import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { sendVerificationEmail } from "@/lib/email";
import { registerLimiter } from "@/lib/rate-limit";
import {
  validateEmail,
  validatePassword,
  validateName,
} from "@/lib/auth-validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body as {
      email: string;
      password: string;
      name?: string;
    };

    // Validate inputs
    const emailError = validateEmail(email);
    if (emailError) {
      return NextResponse.json({ error: emailError }, { status: 400 });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const nameError = validateName(name ?? "");
    if (nameError) {
      return NextResponse.json({ error: nameError }, { status: 400 });
    }

    // Rate limit by IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rateCheck = registerLimiter.check(ip);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "注册过于频繁，请一小时后再试" },
        { status: 429 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      if (existingUser.password) {
        // Already registered with email+password
        return NextResponse.json(
          { error: "该邮箱已注册" },
          { status: 409 }
        );
      }

      // User exists via GitHub OAuth — link password
      const hashedPassword = await hashPassword(password);
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { password: hashedPassword },
      });

      // Send verification email if email not yet verified
      let emailResult: { method: string; verificationUrl: string } | null = null;
      if (!existingUser.emailVerified) {
        const token = crypto.randomUUID();
        await prisma.verificationToken.create({
          data: {
            identifier: normalizedEmail,
            token,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
        emailResult = await sendVerificationEmail(normalizedEmail, token);
      }

      return NextResponse.json({
        message: "密码设置成功，现在可以使用邮箱登录",
        emailSent: emailResult ? emailResult.method !== "none" : true,
        verificationUrl: emailResult?.verificationUrl || "",
      });
    }

    // Create new user
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: name?.trim() || null,
      },
    });

    // Generate verification token and send email
    const token = crypto.randomUUID();
    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const emailResult = await sendVerificationEmail(normalizedEmail, token);

    return NextResponse.json(
      {
        message: "注册成功，请查收验证邮件",
        emailSent: emailResult.method !== "none",
        verificationUrl:
          emailResult.method === "none" ? emailResult.verificationUrl : "",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[register] Error:", error);
    return NextResponse.json(
      { error: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}
