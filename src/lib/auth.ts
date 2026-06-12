import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyPassword, verifyPasswordSafe } from "@/lib/password";
import { loginLimiter } from "@/lib/rate-limit";
import type { NextAuthConfig } from "next-auth";

const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;

// Patch global fetch through proxy before NextAuth initializes
if (proxyUrl) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const undici = require("undici") as typeof import("undici");
    undici.setGlobalDispatcher(new undici.ProxyAgent(proxyUrl));
    console.log("[auth] undici ProxyAgent set to", proxyUrl);
  } catch {
    console.warn("[auth] Failed to set undici ProxyAgent, OAuth may fail behind GFW");
  }
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      authorization: {
        params: { prompt: "consent" },
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials.email as string)?.trim().toLowerCase();
        const password = credentials.password as string;

        if (!email || !password) {
          return null;
        }

        // Rate limit: 5 attempts per 15 minutes per email
        const rateCheck = loginLimiter.check(email);
        if (!rateCheck.success) {
          console.warn(`[auth] Login rate limit exceeded for ${email}`);
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            // Timing-attack mitigation: compare against a dummy hash
            await verifyPasswordSafe(password, null);
            return null;
          }

          if (!user.password) {
            // User exists (GitHub OAuth) but has no password set
            return null;
          }

          const isValid = await verifyPassword(password, user.password);
          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch (error) {
          console.error("[auth] Credentials authorize error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
