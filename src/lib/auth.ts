import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { NextAuthConfig } from "next-auth";

const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;

// Only apply proxy agent when running locally (not on Vercel)
if (proxyUrl && !process.env.VERCEL) {
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
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      authorization: {
        params: { prompt: "consent" },
      },
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) { session.user.id = user.id; }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
