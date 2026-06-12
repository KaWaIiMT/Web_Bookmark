import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/login?error=invalid-token", request.url)
      );
    }

    // Look up by token (has @unique constraint)
    const tokenRecord = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!tokenRecord) {
      return NextResponse.redirect(
        new URL("/login?error=token-not-found", request.url)
      );
    }

    if (new Date() > tokenRecord.expires) {
      // Clean up expired token
      await prisma.verificationToken
        .delete({
          where: {
            identifier_token: {
              identifier: tokenRecord.identifier,
              token: tokenRecord.token,
            },
          },
        })
        .catch(() => {});
      return NextResponse.redirect(
        new URL("/login?error=token-expired", request.url)
      );
    }

    // Verify the user's email
    await prisma.user.update({
      where: { email: tokenRecord.identifier },
      data: { emailVerified: new Date() },
    });

    // Delete the used token
    await prisma.verificationToken
      .delete({
        where: {
          identifier_token: {
            identifier: tokenRecord.identifier,
            token: tokenRecord.token,
          },
        },
      })
      .catch(() => {});

    return NextResponse.redirect(
      new URL("/login?verified=true", request.url)
    );
  } catch (error) {
    console.error("[verify-email] Error:", error);
    return NextResponse.redirect(
      new URL("/login?error=server-error", request.url)
    );
  }
}
